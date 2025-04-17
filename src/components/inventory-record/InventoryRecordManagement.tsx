import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  Typography,
  Select,
  message,
  Tooltip,
  Card,
  Input,
} from "antd";
import {
  DatabaseOutlined,
  FileExcelOutlined,
  FilterOutlined,
  UndoOutlined,
  TagOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";

import InventoryRecordTable from "./InventoryRecordTable";
import EditInventoryRecordModal from "./EditInventoryRecordModal";
import InventoryRecordFilterModal from "./InventoryRecordFilterModal";
import PageContainer from "../shared/PageContainer";
import ToolbarCard from "../shared/ToolbarCard";

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
  const [filteredRecords, setFilteredRecords] = useState<InventoryRecordResponseDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentRecord, setCurrentRecord] = useState<InventoryRecordResponseDTO | null>(null);
  
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
  const [drugSearch, setDrugSearch] = useState<string>("");
  const [batchCodeSearch, setBatchCodeSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [lastUpdatedRange, setLastUpdatedRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);
  const [ascending, setAscending] = useState<boolean>(false);
  
  // Drug options for filter
  const [drugOptions, setDrugOptions] = useState<any[]>([]);

  // Filter state for the modal
  const [filterState, setFilterState] = useState({
    drugSearch: "",
    batchCodeSearch: "",
    statusFilter: "",
    lastUpdatedRange: [null, null] as [dayjs.Dayjs | null, dayjs.Dayjs | null],
    ascending: false,
  });

  // Fetch data when base parameters change
  useEffect(() => {
    fetchRecords();
  }, [currentPage, pageSize]);

  // Apply client-side filtering when filter states change
  useEffect(() => {
    if (records.length > 0) {
      applyClientSideFilters();
    }
  }, [drugSearch, batchCodeSearch, statusFilter, lastUpdatedRange, ascending, records]);

  // Check if any client-side filter is active
  useEffect(() => {
    const hasActiveFilter = 
      drugSearch !== "" || 
      statusFilter !== "" || 
      (lastUpdatedRange[0] !== null && lastUpdatedRange[1] !== null);
    
    setIsFiltering(hasActiveFilter);
  }, [drugSearch, statusFilter, lastUpdatedRange]);

  // Fetch drug options when component mounts
  useEffect(() => {
    fetchDrugOptions();
  }, []);

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
      
      // Sử dụng chuỗi batchCodeSearch làm tham số search duy nhất
      // Backend chỉ hỗ trợ page, pageSize và search
      const result = await getAllInventoryRecords(
        currentPage, 
        pageSize, 
        batchCodeSearch // Chỉ tìm kiếm theo batch code ở backend
      );
      
      setRecords(result.data);
      
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
    
    // Lọc theo Drug Name
    if (drugSearch) {
      filtered = filtered.filter(record => 
        record.drug?.name?.toLowerCase().includes(drugSearch.toLowerCase())
      );
    }
    
    // Lọc theo Status
    if (statusFilter) {
      filtered = filtered.filter(record => 
        record.status === statusFilter
      );
    }
    
    // Lọc theo LastUpdated Range
    if (lastUpdatedRange[0] && lastUpdatedRange[1]) {
      const startDate = lastUpdatedRange[0].startOf('day');
      const endDate = lastUpdatedRange[1].endOf('day');
      
      filtered = filtered.filter(record => {
        const lastUpdatedDate = record.lastUpdated 
          ? dayjs(record.lastUpdated) 
          : dayjs(record.createdAt);
        
        return lastUpdatedDate.isAfter(startDate) && lastUpdatedDate.isBefore(endDate);
      });
    }
    
    // Sắp xếp theo thời gian (lastUpdated hoặc createdAt)
    filtered.sort((a, b) => {
      const dateA = a.lastUpdated ? new Date(a.lastUpdated) : new Date(a.createdAt);
      const dateB = b.lastUpdated ? new Date(b.lastUpdated) : new Date(b.createdAt);
      
      return ascending 
        ? dateA.getTime() - dateB.getTime() // Cũ nhất trước
        : dateB.getTime() - dateA.getTime(); // Mới nhất trước
    });
    
    // Cập nhật filtered records
    setFilteredRecords(filtered);
    
    // Cập nhật tổng số bản ghi sau khi lọc
    setFilteredTotal(filtered.length);
  };

  const fetchDrugOptions = async () => {
    try {
      const response = await DrugApi.getDrugs();
      if (response && Array.isArray(response.data)) {
        setDrugOptions(response.data);
      }
    } catch (error) {
      console.error("Error fetching drug options:", error);
    }
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
    setDrugSearch("");
    setBatchCodeSearch("");
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
      drugSearch,
      batchCodeSearch,
      statusFilter,
      lastUpdatedRange,
      ascending,
    });
    setFilterModalVisible(true);
  };

  const handleApplyFilters = (filters: any) => {
    setDrugSearch(filters.drugSearch || "");
    setBatchCodeSearch(filters.batchCodeSearch || "");
    setStatusFilter(filters.statusFilter || "");
    setLastUpdatedRange(filters.lastUpdatedRange || [null, null]);
    setAscending(filters.ascending);
    setCurrentPage(1);
    setFilterModalVisible(false);
    
    // Đánh dấu đang lọc nếu có lọc nào đó ngoài batchCodeSearch
    const isClientFiltering = 
      (filters.drugSearch !== "") || 
      (filters.statusFilter !== "") || 
      (filters.lastUpdatedRange && filters.lastUpdatedRange[0] !== null);
    
    setIsFiltering(isClientFiltering);
    
    // Fetch lại dữ liệu từ API khi batch code search thay đổi
    fetchRecords();
  };

  const handleResetFilters = () => {
    handleReset();
    setFilterModalVisible(false);
  };

  return (
    <PageContainer
      title="Inventory Record Management"
      icon={<DatabaseOutlined style={{ fontSize: "24px" }} />}
    >
      {contextHolder}

      {/* Search and Filters Toolbar */}
      <ToolbarCard
        leftContent={
          <>
            {/* Batch Code Search */}
            <Input
              placeholder="Search Batch Code"
              value={batchCodeSearch}
              onChange={(e) => {
                setBatchCodeSearch(e.target.value);
                setCurrentPage(1);
              }}
              style={{ width: "200px" }}
              allowClear
              onPressEnter={() => fetchRecords()} // Tìm kiếm khi nhấn Enter
            />

            {/* Drug Select */}
            <Select
              showSearch
              placeholder="Search Drug"
              style={{ width: "250px" }}
              value={drugSearch || undefined}
              onChange={(value) => {
                setDrugSearch(value || "");
                setCurrentPage(1);
              }}
              allowClear
              filterOption={(input, option) =>
                ((option?.label as string) || "")
                  .toLowerCase()
                  .indexOf(input.toLowerCase()) >= 0
              }
              options={drugOptions.map((drug) => ({
                value: drug.name,
                label: `${drug.name} (${drug.drugCode})`,
              }))}
            />

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
                style={{ width: "150px" }}
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
                    drugSearch ||
                    batchCodeSearch ||
                    statusFilter ||
                    lastUpdatedRange[0] ||
                    lastUpdatedRange[1]
                  )
                }
              />
            </Tooltip>

            {/* Advanced Filters */}
            <Tooltip title="Advanced Filters">
              <Button
                icon={
                  <FilterOutlined
                    style={{
                      color:
                        drugSearch ||
                        batchCodeSearch ||
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

      {/* Inventory Records Table */}
      <Card className="shadow-sm" bodyStyle={{ padding: "16px" }}>
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
        />
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