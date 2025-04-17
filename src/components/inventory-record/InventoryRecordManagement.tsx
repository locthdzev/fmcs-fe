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

// Define interface for filter state
interface InventoryFilterState {
  quantityInStockRange: [number | null, number | null];
  reorderLevelRange: [number | null, number | null];
  lastUpdatedRange: [dayjs.Dayjs | null, dayjs.Dayjs | null];
  createdAtRange: [dayjs.Dayjs | null, dayjs.Dayjs | null];
  sortField: string;
  ascending: boolean;
}

function InventoryRecordManagement() {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();

  // Data state
  const [records, setRecords] = useState<InventoryRecordResponseDTO[]>([]);
  const [allRecords, setAllRecords] = useState<InventoryRecordResponseDTO[]>([]); // Store all records for client-side filtering
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
  const [searchTerm, setSearchTerm] = useState<string>(""); // Chỉ dùng cho tìm kiếm API
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [quantityInStockRange, setQuantityInStockRange] = useState<[number | null, number | null]>([null, null]);
  const [reorderLevelRange, setReorderLevelRange] = useState<[number | null, number | null]>([null, null]);
  const [lastUpdatedRange, setLastUpdatedRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);
  const [createdAtRange, setCreatedAtRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);
  const [sortField, setSortField] = useState<string>("createdAt"); // Default sort by createdAt
  const [ascending, setAscending] = useState<boolean>(false); // Default newest first

  // Search options
  const [searchOptions, setSearchOptions] = useState<any[]>([]);
  // Drug options for filter in modal
  const [drugOptions, setDrugOptions] = useState<any[]>([]);
  // Batch codes for search options
  const [batchCodes, setBatchCodes] = useState<string[]>([]);

  // Filter state for the modal
  const [filterState, setFilterState] = useState<InventoryFilterState>({
    quantityInStockRange: [null, null],
    reorderLevelRange: [null, null],
    lastUpdatedRange: [null, null],
    createdAtRange: [null, null],
    sortField: "createdAt",
    ascending: false,
  });

  // Track if advanced modal filters are active
  const [isAdvancedFilterActive, setIsAdvancedFilterActive] = useState<boolean>(false);

  // Để quản lý debounce
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch data when base parameters change
  useEffect(() => {
    // Only fetch from API when not filtering
    if (!isFiltering) {
      fetchRecords();
    }
  }, [currentPage, pageSize, isFiltering]);

  // Apply client-side filtering when filter states change
  useEffect(() => {
    if (allRecords.length > 0 && (isFiltering || searchTerm)) {
      applyClientSideFilters();
    }
  }, [
    searchTerm, 
    statusFilter, 
    quantityInStockRange, 
    reorderLevelRange,
    lastUpdatedRange, 
    createdAtRange,
    sortField,
    ascending, 
    allRecords,
    currentPage,
    pageSize,
    isFiltering
  ]);

  // Check if any client-side filter is active
  useEffect(() => {
    const hasActiveFilter =
      statusFilter !== "" ||
      (quantityInStockRange[0] !== null || quantityInStockRange[1] !== null) ||
      (reorderLevelRange[0] !== null || reorderLevelRange[1] !== null) ||
      (lastUpdatedRange[0] !== null && lastUpdatedRange[1] !== null) ||
      (createdAtRange[0] !== null && createdAtRange[1] !== null);

    // Update isFiltering state
    setIsFiltering(hasActiveFilter);
    
    // Fetch all records when filters change
    if (hasActiveFilter && allRecords.length === 0) {
      fetchAllRecordsForFiltering();
    }

    // Check if advanced modal filters are active (excluding the toolbar statusFilter)
    const hasAdvancedFilters = 
      (quantityInStockRange[0] !== null || quantityInStockRange[1] !== null) ||
      (reorderLevelRange[0] !== null || reorderLevelRange[1] !== null) ||
      (lastUpdatedRange[0] !== null && lastUpdatedRange[1] !== null) ||
      (createdAtRange[0] !== null && createdAtRange[1] !== null);
    
    setIsAdvancedFilterActive(hasAdvancedFilters);
  }, [
    statusFilter, 
    quantityInStockRange, 
    reorderLevelRange,
    lastUpdatedRange,
    createdAtRange
  ]);

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
        // Update both records and allRecords arrays
        setRecords((prev) =>
          prev.map((r) => (r.id === updatedRecord.id ? updatedRecord : r))
        );
        
        setAllRecords((prev) =>
          prev.map((r) => (r.id === updatedRecord.id ? updatedRecord : r))
        );
      }
    );

    return () => {
      connection.stop();
    };
  }, []);

  // Fetch all records for client-side filtering
  const fetchAllRecordsForFiltering = async () => {
    try {
      setLoading(true);
      messageApi.loading({
        content: "Loading all records for filtering...",
        key: "filterLoading",
        duration: 0
      });

      // Use a large page size to get all records
      const result = await getAllInventoryRecords(
        1,
        1000, // Large page size to get as many records as possible
        searchTerm
      );

      setAllRecords(result.data);
      setTotalFromAPI(result.totalRecords);
      
      // Apply filters to the complete dataset
      applyClientSideFilters(result.data);
      
      // Update batch codes
      const newBatchCodes = result.data.map(
        (record: InventoryRecordResponseDTO) => record.batchCode
      );
      if (newBatchCodes.length > 0) {
        setBatchCodes((prev) => [...new Set([...prev, ...newBatchCodes])]);
      }

      messageApi.success({
        content: "All records loaded for filtering",
        key: "filterLoading",
        duration: 2
      });
    } catch (error) {
      console.error("Error fetching all inventory records:", error);
      messageApi.error({
        content: "Unable to load all inventory records for filtering.",
        key: "filterLoading",
        duration: 5,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRecords = async () => {
    try {
      setLoading(true);

      // If filtering is active, use all records
      if (isFiltering && allRecords.length > 0) {
        applyClientSideFilters(allRecords);
        return;
      }

      // Otherwise, fetch page from API
      const result = await getAllInventoryRecords(
        currentPage,
        pageSize,
        searchTerm
      );

      setRecords(result.data);

      // Update batch codes
      const newBatchCodes = result.data.map(
        (record: InventoryRecordResponseDTO) => record.batchCode
      );
      if (newBatchCodes.length > 0) {
        setBatchCodes((prev) => [...new Set([...prev, ...newBatchCodes])]);
      }

      // Store total count from API
      setTotalFromAPI(result.totalRecords);
      setFilteredTotal(result.totalRecords);

      // Apply any client-side filters
      setFilteredRecords(result.data);
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

  const applyClientSideFilters = (recordsToFilter = allRecords.length > 0 ? allRecords : records) => {
    // Clone array to avoid affecting original data
    let filtered = [...recordsToFilter];

    // Filter by Status
    if (statusFilter) {
      filtered = filtered.filter((record) => record.status === statusFilter);
    }

    // Filter by Quantity In Stock Range
    if (quantityInStockRange[0] !== null || quantityInStockRange[1] !== null) {
      filtered = filtered.filter((record) => {
        const quantity = record.quantityInStock;
        const min = quantityInStockRange[0];
        const max = quantityInStockRange[1];

        if (min !== null && max !== null) {
          return quantity >= min && quantity <= max;
        } else if (min !== null) {
          return quantity >= min;
        } else if (max !== null) {
          return quantity <= max;
        }
        return true;
      });
    }

    // Filter by Reorder Level Range
    if (reorderLevelRange[0] !== null || reorderLevelRange[1] !== null) {
      filtered = filtered.filter((record) => {
        const level = record.reorderLevel;
        const min = reorderLevelRange[0];
        const max = reorderLevelRange[1];

        if (min !== null && max !== null) {
          return level >= min && level <= max;
        } else if (min !== null) {
          return level >= min;
        } else if (max !== null) {
          return level <= max;
        }
        return true;
      });
    }

    // Filter by LastUpdated Range
    if (lastUpdatedRange[0] && lastUpdatedRange[1]) {
      const startDate = lastUpdatedRange[0].startOf("day");
      const endDate = lastUpdatedRange[1].endOf("day");

      filtered = filtered.filter((record) => {
        const lastUpdatedDate = record.lastUpdated
          ? dayjs(record.lastUpdated)
          : dayjs(record.createdAt);

        return (
          lastUpdatedDate.isAfter(startDate) ||
          lastUpdatedDate.isSame(startDate, 'day') 
        ) && (
          lastUpdatedDate.isBefore(endDate) ||
          lastUpdatedDate.isSame(endDate, 'day')
        );
      });
    }

    // Filter by CreatedAt Range
    if (createdAtRange[0] && createdAtRange[1]) {
      const startDate = createdAtRange[0].startOf("day");
      const endDate = createdAtRange[1].endOf("day");

      filtered = filtered.filter((record) => {
        const createdDate = dayjs(record.createdAt);
        return (
          createdDate.isAfter(startDate) || 
          createdDate.isSame(startDate, 'day')
        ) && (
          createdDate.isBefore(endDate) ||
          createdDate.isSame(endDate, 'day')
        );
      });
    }

    // Sort by selected field
    filtered.sort((a, b) => {
      let valueA, valueB;

      switch (sortField) {
        case "quantityInStock":
          valueA = a.quantityInStock;
          valueB = b.quantityInStock;
          break;
        case "reorderLevel":
          valueA = a.reorderLevel;
          valueB = b.reorderLevel;
          break;
        case "lastUpdated":
          valueA = a.lastUpdated
            ? new Date(a.lastUpdated).getTime()
            : new Date(a.createdAt).getTime();
          valueB = b.lastUpdated
            ? new Date(b.lastUpdated).getTime()
            : new Date(b.createdAt).getTime();
          break;
        case "createdAt":
        default:
          valueA = new Date(a.createdAt).getTime();
          valueB = new Date(b.createdAt).getTime();
          break;
      }

      return ascending
        ? valueA - valueB // Ascending
        : valueB - valueA; // Descending
    });

    // Store total filtered count
    setFilteredTotal(filtered.length);

    // Apply pagination to the filtered results
    if (isFiltering) {
      const startIndex = (currentPage - 1) * pageSize;
      const paginatedData = filtered.slice(startIndex, startIndex + pageSize);
      setFilteredRecords(paginatedData);
    } else {
      setFilteredRecords(filtered);
    }
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
    if (newPageSize && newPageSize !== pageSize) {
      setPageSize(newPageSize);
      setCurrentPage(1);
    } else {
      setCurrentPage(page);
    }
    
    // For client-side filtering, just update page state
    if (isFiltering) {
      // The useEffect will trigger applyClientSideFilters to get the right page of data
      return;
    }
  };

  const handleReset = () => {
    setSearchTerm("");
    setStatusFilter("");
    setQuantityInStockRange([null, null]);
    setReorderLevelRange([null, null]);
    setLastUpdatedRange([null, null]);
    setCreatedAtRange([null, null]);
    setSortField("createdAt");
    setAscending(false);
    setCurrentPage(1);
    setIsFiltering(false);
    setIsAdvancedFilterActive(false);

    // Update filter state for modal
    setFilterState({
      quantityInStockRange: [null, null],
      reorderLevelRange: [null, null],
      lastUpdatedRange: [null, null],
      createdAtRange: [null, null],
      sortField: "createdAt",
      ascending: false,
    });

    // Fetch data from API after reset
    fetchRecords();
  };

  const handleOpenFilterModal = () => {
    // Update filter state for modal
    setFilterState({
      quantityInStockRange,
      reorderLevelRange,
      lastUpdatedRange,
      createdAtRange,
      sortField,
      ascending,
    });
    setFilterModalVisible(true);
  };

  const handleApplyFilters = (filters: any) => {
    // Update filters
    console.log("Received filters:", filters);
    
    setQuantityInStockRange(filters.quantityInStockRange || [null, null]);
    setReorderLevelRange(filters.reorderLevelRange || [null, null]);
    
    // Process lastUpdatedRange properly
    let lastUpdatedRangeValue: [dayjs.Dayjs | null, dayjs.Dayjs | null] = [null, null];
    if (filters.lastUpdatedRange && filters.lastUpdatedRange[0] && filters.lastUpdatedRange[1]) {
      lastUpdatedRangeValue = [dayjs(filters.lastUpdatedRange[0]), dayjs(filters.lastUpdatedRange[1])];
    }
    setLastUpdatedRange(lastUpdatedRangeValue);
    
    // Process createdAtRange properly
    let createdAtRangeValue: [dayjs.Dayjs | null, dayjs.Dayjs | null] = [null, null];
    if (filters.createdAtRange && filters.createdAtRange[0] && filters.createdAtRange[1]) {
      createdAtRangeValue = [dayjs(filters.createdAtRange[0]), dayjs(filters.createdAtRange[1])];
    }
    setCreatedAtRange(createdAtRangeValue);
    
    setSortField(filters.sortField || "createdAt");
    setAscending(filters.ascending);
    setCurrentPage(1);
    setFilterModalVisible(false);

    // Check if any filter is active
    const isClientFiltering =
      (filters.quantityInStockRange && 
        (filters.quantityInStockRange[0] !== null || filters.quantityInStockRange[1] !== null)) ||
      (filters.reorderLevelRange && 
        (filters.reorderLevelRange[0] !== null || filters.reorderLevelRange[1] !== null)) ||
      statusFilter !== "" ||
      lastUpdatedRangeValue[0] !== null ||
      createdAtRangeValue[0] !== null;

    // Check if advanced modal filters (excluding statusFilter) are active
    const hasAdvancedFilters = 
      (filters.quantityInStockRange && 
        (filters.quantityInStockRange[0] !== null || filters.quantityInStockRange[1] !== null)) ||
      (filters.reorderLevelRange && 
        (filters.reorderLevelRange[0] !== null || filters.reorderLevelRange[1] !== null)) ||
      lastUpdatedRangeValue[0] !== null ||
      createdAtRangeValue[0] !== null;
    
    setIsAdvancedFilterActive(hasAdvancedFilters);
    setIsFiltering(isClientFiltering);
    
    // If we're applying filters and don't have all records yet, fetch them
    if (isClientFiltering && allRecords.length === 0) {
      fetchAllRecordsForFiltering();
    } else {
      // Apply filters to existing data
      applyClientSideFilters();
    }
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

      {/* Style for search icon */}
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
                      color: isAdvancedFilterActive ? "#1890ff" : undefined,
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
                  
                  // If this is the first filter, fetch all records
                  if (value && !isFiltering && allRecords.length === 0) {
                    fetchAllRecordsForFiltering();
                  }
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
                disabled={!isFiltering && !searchTerm}
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

      {/* TableControls */}
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
      />
    </PageContainer>
  );
}

export default InventoryRecordManagement;
