import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Button,
  Typography,
  Select,
  message,
  Tooltip,
  Card,
  Input,
  Space,
  Spin,
} from "antd";
import {
  DatabaseOutlined,
  FileExcelOutlined,
  FilterOutlined,
  UndoOutlined,
  TagOutlined,
  ArrowLeftOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";

import InventoryRecordTable from "./InventoryRecordTable";
import EditInventoryRecordModal from "./EditInventoryRecordModal";
import InventoryRecordFilterModal from "./InventoryRecordFilterModal";
import PageContainer from "../shared/PageContainer";
import ToolbarCard from "../shared/ToolbarCard";
import TableControls from "../shared/TableControls";

import {
  getAllInventoryRecords,
  InventoryRecordResponseDTO,
  setupInventoryRecordRealTime,
} from "@/api/inventoryrecord";
import { exportToExcel } from "@/api/export";
import dayjs from "dayjs";
import * as DrugApi from "@/api/drug";

const { Option } = Select;
const { Text, Title } = Typography;

export function InventoryRecordManagement() {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();

  // Data state
  const [records, setRecords] = useState<InventoryRecordResponseDTO[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<
    InventoryRecordResponseDTO[]
  >([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentRecord, setCurrentRecord] =
    useState<InventoryRecordResponseDTO | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalFromAPI, setTotalFromAPI] = useState<number>(0); // Tổng số bản ghi từ API
  const [filteredTotal, setFilteredTotal] = useState<number>(0); // Số bản ghi sau khi lọc
  const [isFiltering, setIsFiltering] = useState<boolean>(false); // Đánh dấu có đang lọc hay không

  // Selection state
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  // Modal visibility states
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState<string>(""); // Thay thế drugSearch và batchCodeSearch
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [lastUpdatedRange, setLastUpdatedRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null]
  >([null, null]);
  const [ascending, setAscending] = useState<boolean>(false);

  // Search options
  const [searchOptions, setSearchOptions] = useState<any[]>([]);
  // Drug options for filter in modal
  const [drugOptions, setDrugOptions] = useState<any[]>([]);
  // Batch codes for search options
  const [batchCodes, setBatchCodes] = useState<string[]>([]);

  // Filter state for the modal
  const [filterState, setFilterState] = useState({
    drugSearch: "",
    batchCodeSearch: "",
    statusFilter: "",
    lastUpdatedRange: [null, null] as [dayjs.Dayjs | null, dayjs.Dayjs | null],
    ascending: false,
  });

  // Để quản lý debounce
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch data when base parameters change
  useEffect(() => {
    fetchRecords();
  }, [currentPage, pageSize]);

  // Apply client-side filtering when filter states change
  useEffect(() => {
    if (records.length > 0) {
      applyClientSideFilters();
    }
  }, [searchTerm, statusFilter, lastUpdatedRange, ascending, records]);

  // Check if any client-side filter is active
  useEffect(() => {
    const hasActiveFilter =
      statusFilter !== "" ||
      (lastUpdatedRange[0] !== null && lastUpdatedRange[1] !== null);

    setIsFiltering(hasActiveFilter);
  }, [statusFilter, lastUpdatedRange]);

  // Fetch options when component mounts
  useEffect(() => {
    fetchOptionsForSearch();
  }, []);

  // Cập nhật searchOptions khi có drug options hoặc batch codes mới
  useEffect(() => {
    updateSearchOptions();
  }, [drugOptions, batchCodes]);

  // Setup real-time updates
  useEffect(() => {
    const connection = setupInventoryRecordRealTime(
      (updatedRecord: InventoryRecordResponseDTO) => {
        setRecords((prev) =>
          prev.map((r) => (r.id === updatedRecord.id ? updatedRecord : r))
        );
      }
    );

    return () => {
      connection.stop();
    };
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);

      // Sử dụng searchTerm làm tham số search duy nhất
      // Backend tìm kiếm theo cả batch code và drug name
      const result = await getAllInventoryRecords(
        currentPage,
        pageSize,
        searchTerm // Search term sẽ được dùng để tìm kiếm cả batch code và drug name
      );

      setRecords(result.data);

      // Cập nhật danh sách batch codes từ kết quả
      const newBatchCodes = result.data.map(
        (record: InventoryRecordResponseDTO) => record.batchCode
      );
      if (newBatchCodes.length > 0) {
        setBatchCodes((prev) => [...new Set([...prev, ...newBatchCodes])]);
      }

      // Lưu trữ tổng số bản ghi thực tế từ API
      setTotalFromAPI(result.totalRecords);

      // Ban đầu, gán tổng số bản ghi lọc bằng tổng từ API
      setFilteredTotal(result.totalRecords);

      // Gọi hàm lọc phía client để áp dụng các bộ lọc khác
      applyClientSideFilters(result.data);
    } catch (error) {
      console.error("Error fetching inventory records:", error);
      messageApi.error({
        content: "Unable to load inventory records list.",
        duration: 5,
      });
    } finally {
      setLoading(false);
    }
  };

  const applyClientSideFilters = (recordsToFilter = records) => {
    // Clone lại mảng để không ảnh hưởng đến dữ liệu gốc
    let filtered = [...recordsToFilter];

    // Lọc theo Status
    if (statusFilter) {
      filtered = filtered.filter((record) => record.status === statusFilter);
    }

    // Lọc theo LastUpdated Range
    if (lastUpdatedRange[0] && lastUpdatedRange[1]) {
      const startDate = lastUpdatedRange[0].startOf("day");
      const endDate = lastUpdatedRange[1].endOf("day");

      filtered = filtered.filter((record) => {
        const lastUpdatedDate = record.lastUpdated
          ? dayjs(record.lastUpdated)
          : dayjs(record.createdAt);

        return (
          lastUpdatedDate.isAfter(startDate) &&
          lastUpdatedDate.isBefore(endDate)
        );
      });
    }

    // Sắp xếp theo thời gian (lastUpdated hoặc createdAt)
    filtered.sort((a, b) => {
      const dateA = a.lastUpdated
        ? new Date(a.lastUpdated)
        : new Date(a.createdAt);
      const dateB = b.lastUpdated
        ? new Date(b.lastUpdated)
        : new Date(b.createdAt);

      return ascending
        ? dateA.getTime() - dateB.getTime() // Cũ nhất trước
        : dateB.getTime() - dateA.getTime(); // Mới nhất trước
    });

    // Cập nhật filtered records
    setFilteredRecords(filtered);

    // Cập nhật tổng số bản ghi sau khi lọc
    setFilteredTotal(filtered.length);
  };

  const fetchOptionsForSearch = async () => {
    try {
      // Fetch drug options
      const drugResponse = await DrugApi.getDrugs();
      if (drugResponse && Array.isArray(drugResponse.data)) {
        setDrugOptions(drugResponse.data);
      }

      // Fetch more records for search options
      try {
        // Sử dụng API hiện có với pageSize lớn để lấy nhiều records hơn cho options
        const allRecordsResponse = await getAllInventoryRecords(1, 100, "");

        if (allRecordsResponse && allRecordsResponse.data) {
          // Trích xuất batch codes từ tất cả records
          const allBatchCodes = allRecordsResponse.data.map(
            (record: InventoryRecordResponseDTO) => record.batchCode
          );

          // Cập nhật batch codes
          if (allBatchCodes.length > 0) {
            setBatchCodes((prev) => [...new Set([...prev, ...allBatchCodes])]);
          }
        }
      } catch (optionsError) {
        console.error(
          "Error fetching additional records for search options:",
          optionsError
        );
        // Nếu có lỗi, chúng ta vẫn sẽ có options từ records hiện tại
      }
    } catch (error) {
      console.error("Error fetching search options:", error);
    }
  };

  const updateSearchOptions = () => {
    const options = [];

    // Kết hợp batch codes và drug names thành một danh sách
    // Format: BatchCode (DrugName)
    if (records.length > 0) {
      // Lấy thông tin duy nhất từ records hiện tại
      const currentRecordOptions = records.map((record) => ({
        id: record.id,
        batchCode: record.batchCode,
        drugName: record.drug?.name || "Unknown",
        drugCode: record.drug?.drugCode || "N/A",
      }));

      // Tạo options cho Select từ records hiện tại
      const recordOptions = currentRecordOptions.map((item) => ({
        value: item.batchCode, // Giá trị tìm kiếm sẽ là batch code
        label: `${item.batchCode} (${item.drugName})`, // Hiển thị BatchCode (DrugName)
        type: "combined",
      }));

      // Thêm options từ records hiện tại
      options.push(...recordOptions);
    }

    // Thêm các batch codes từ list tất cả các batch codes
    if (batchCodes.length > 0) {
      const existingBatchCodes = new Set(options.map((opt) => opt.value));
      const additionalBatchCodes = batchCodes
        .filter((code) => !existingBatchCodes.has(code))
        .map((code) => ({
          value: code,
          label: code,
          type: "batch",
        }));

      if (additionalBatchCodes.length > 0) {
        options.push(...additionalBatchCodes);
      }
    }

    // Thêm các drug options từ drugOptions
    if (drugOptions.length > 0) {
      const drugNames = new Set(
        options
          .map((opt) => {
            const match = opt.label.match(/\((.*?)\)/);
            return match ? match[1].trim() : null;
          })
          .filter(Boolean)
      );

      const additionalDrugs = drugOptions
        .filter((drug) => !drugNames.has(drug.name))
        .map((drug) => ({
          value: drug.name,
          label: `${drug.drugCode} (${drug.name})`,
          type: "drug",
        }));

      if (additionalDrugs.length > 0) {
        options.push(...additionalDrugs);
      }
    }

    // Sắp xếp options theo alphabetical order để dễ tìm kiếm
    options.sort((a, b) => a.label.localeCompare(b.label));

    setSearchOptions(options);
  };

  const handleShowEditModal = (record: InventoryRecordResponseDTO) => {
    setCurrentRecord(record);
    setIsEditModalVisible(true);
  };

  const handleExportExcel = () => {
    exportToExcel(
      "/inventoryrecord-management/inventoryrecords/export",
      "inventory_records.xlsx"
    );
    messageApi.success({
      content: "Downloading Excel file...",
      duration: 5,
    });
  };

  const handlePageChange = (page: number, newPageSize?: number) => {
    // Nếu đang lọc ở client, không cần gọi lại API
    if (isFiltering) {
      setCurrentPage(page);
      return;
    }

    // Nếu pageSize thay đổi, cần fetch lại từ API
    if (newPageSize && newPageSize !== pageSize) {
      setPageSize(newPageSize);
      setCurrentPage(1); // Reset về trang 1 khi thay đổi pageSize
    } else {
      setCurrentPage(page);
    }
  };

  const handleReset = () => {
    setSearchTerm("");
    setStatusFilter("");
    setLastUpdatedRange([null, null]);
    setAscending(false);
    setCurrentPage(1);
    setIsFiltering(false);

    // Update filter state for modal
    setFilterState({
      drugSearch: "",
      batchCodeSearch: "",
      statusFilter: "",
      lastUpdatedRange: [null, null],
      ascending: false,
    });

    // Fetch lại dữ liệu từ API sau khi reset
    fetchRecords();
  };

  const handleOpenFilterModal = () => {
    // Update filter state for modal
    setFilterState({
      drugSearch: "", // Không dùng nữa vì đã có searchTerm
      batchCodeSearch: "", // Không dùng nữa vì đã có searchTerm
      statusFilter,
      lastUpdatedRange,
      ascending,
    });
    setFilterModalVisible(true);
  };

  const handleApplyFilters = (filters: any) => {
    // Chỉ áp dụng statusFilter, lastUpdatedRange và ascending từ modal
    setStatusFilter(filters.statusFilter || "");
    setLastUpdatedRange(filters.lastUpdatedRange || [null, null]);
    setAscending(filters.ascending);
    setCurrentPage(1);
    setFilterModalVisible(false);

    // Đánh dấu đang lọc nếu có bộ lọc nào đó
    const isClientFiltering =
      filters.statusFilter !== "" ||
      (filters.lastUpdatedRange && filters.lastUpdatedRange[0] !== null);

    setIsFiltering(isClientFiltering);
  };

  const handleResetFilters = () => {
    handleReset();
    setFilterModalVisible(false);
  };

  const handleBack = () => {
    router.back();
  };

  const handleSearchChange = (value: string) => {
    console.log("Search term changed to:", value);

    // Luôn cập nhật giá trị hiển thị ngay lập tức
    setSearchTerm(value || "");
    setCurrentPage(1);

    // Xóa timeout cũ nếu có
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Đánh dấu loading ngay lập tức
    setLoading(true);

    // Tạo timeout mới (debounce)
    searchTimeoutRef.current = setTimeout(() => {
      // Fetch dữ liệu với giá trị mới
      getAllInventoryRecords(currentPage, pageSize, value || "")
        .then((result) => {
          console.log("Search results:", result);
          setRecords(result.data);
          setTotalFromAPI(result.totalRecords);
          setFilteredTotal(result.totalRecords);
          applyClientSideFilters(result.data);

          // Cập nhật danh sách batch codes từ kết quả
          const newBatchCodes = result.data.map(
            (record: InventoryRecordResponseDTO) => record.batchCode
          );
          if (newBatchCodes.length > 0) {
            setBatchCodes((prev) => [...new Set([...prev, ...newBatchCodes])]);
          }
        })
        .catch((error) => {
          console.error("Error fetching inventory records:", error);
          messageApi.error({
            content: "Unable to load inventory records list.",
            duration: 5,
          });
        })
        .finally(() => {
          setLoading(false);
          searchTimeoutRef.current = null;
        });
    }, 300); // Độ trễ 300ms để tránh quá nhiều lệnh gọi API liên tiếp
  };

  // Xử lý khi chọn một giá trị từ dropdown
  const handleSearchSelect = (value: string) => {
    console.log("Selected value:", value);

    // Hủy timeout cũ nếu có
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }

    // Cập nhật giá trị ngay lập tức
    setSearchTerm(value);
    setCurrentPage(1);
    setLoading(true);

    // Gửi yêu cầu API ngay lập tức khi chọn từ dropdown
    getAllInventoryRecords(currentPage, pageSize, value)
      .then((result) => {
        console.log("Select results:", result);
        setRecords(result.data);
        setTotalFromAPI(result.totalRecords);
        setFilteredTotal(result.totalRecords);
        applyClientSideFilters(result.data);
      })
      .catch((error) => {
        console.error("Error fetching inventory records:", error);
        messageApi.error({
          content: "Unable to load inventory records list.",
          duration: 5,
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <PageContainer
      title="Inventory Record Management"
      icon={<DatabaseOutlined style={{ fontSize: "24px" }} />}
      onBack={handleBack}
    >
      {contextHolder}

      {/* Style cho biểu tượng tìm kiếm */}
      <style jsx global>{`
        .search-select-wrapper {
          position: relative;
        }
        .search-icon-prefix {
          position: absolute;
          z-index: 1;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #1890ff;
          pointer-events: none;
        }
        .search-select-with-icon .ant-select-selector {
          padding-left: 36px !important;
        }
      `}</style>

      {/* Search and Filters Toolbar */}
      <ToolbarCard
        leftContent={
          <>
            {/* Combined Search for Batch Code & Drug Name */}
            <div className="search-select-wrapper">
              <SearchOutlined className="search-icon-prefix" />
              <Select
                showSearch
                placeholder="Search Batch Code or Drug Name"
                value={searchTerm || undefined}
                onChange={handleSearchChange}
                onSelect={handleSearchSelect}
                style={{ width: "400px" }}
                className="search-select-with-icon"
                allowClear
                filterOption={(input, option) => {
                  const optionValue =
                    option?.label?.toString().toLowerCase() || "";
                  return optionValue.includes(input.toLowerCase());
                }}
                options={searchOptions}
                optionFilterProp="label"
                dropdownStyle={{ minWidth: "400px" }}
                notFoundContent={<div>No matching records found</div>}
                showArrow={false}
                loading={loading}
              />
            </div>

            {/* Advanced Filters */}
            <Tooltip title="Advanced Filters">
              <Button
                icon={
                  <FilterOutlined
                    style={{
                      color:
                        statusFilter ||
                        lastUpdatedRange[0] ||
                        lastUpdatedRange[1]
                          ? "#1890ff"
                          : undefined,
                    }}
                  />
                }
                onClick={handleOpenFilterModal}
              >
                Filters
              </Button>
            </Tooltip>

            {/* Status */}
            <div>
              <Select
                placeholder={
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <TagOutlined style={{ marginRight: 8 }} />
                    <span>Status</span>
                  </div>
                }
                allowClear
                style={{ width: "120px" }}
                value={statusFilter || undefined}
                onChange={(value) => {
                  setStatusFilter(value || "");
                  setCurrentPage(1);
                }}
                disabled={loading}
              >
                <Option value="Priority">Priority</Option>
                <Option value="Active">Active</Option>
                <Option value="NearExpiry">Near Expiry</Option>
                <Option value="Inactive">Inactive</Option>
                <Option value="Expired">Expired</Option>
              </Select>
            </div>

            {/* Reset Button */}
            <Tooltip title="Reset All Filters">
              <Button
                icon={<UndoOutlined />}
                onClick={handleReset}
                disabled={
                  !(
                    searchTerm ||
                    statusFilter ||
                    lastUpdatedRange[0] ||
                    lastUpdatedRange[1]
                  )
                }
              />
            </Tooltip>
          </>
        }
        rightContent={
          <Button
            type="primary"
            icon={<FileExcelOutlined />}
            onClick={handleExportExcel}
            disabled={loading}
          >
            Export to Excel
          </Button>
        }
      />

      {/* TableControls - Di chuyển ra ngoài Card */}
      <TableControls
        selectedRowKeys={selectedRowKeys}
        pageSize={pageSize}
        onPageSizeChange={(newSize) => handlePageChange(1, newSize)}
        bulkActions={[]}
        maxRowsPerPage={100}
        pageSizeOptions={[5, 10, 15, 20, 50, 100]}
      />

      {/* Inventory Records Table */}
      <Card className="shadow-sm" bodyStyle={{ padding: "16px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <Spin size="large" tip="Loading..." />
          </div>
        ) : (
          <InventoryRecordTable
            loading={loading}
            records={filteredRecords}
            totalItems={isFiltering ? filteredTotal : totalFromAPI}
            currentPage={currentPage}
            pageSize={pageSize}
            handlePageChange={handlePageChange}
            selectedRowKeys={selectedRowKeys}
            setSelectedRowKeys={setSelectedRowKeys}
            onEdit={handleShowEditModal}
            bordered={true}
          />
        )}
      </Card>

      {/* Modals */}
      {currentRecord && (
        <EditInventoryRecordModal
          visible={isEditModalVisible}
          record={currentRecord}
          onClose={() => setIsEditModalVisible(false)}
          onSuccess={fetchRecords}
        />
      )}

      <InventoryRecordFilterModal
        visible={filterModalVisible}
        onCancel={() => setFilterModalVisible(false)}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        filters={filterState}
        drugOptions={drugOptions}
      />
    </PageContainer>
  );
}

export default InventoryRecordManagement;
