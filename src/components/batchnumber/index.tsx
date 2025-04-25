import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  Table,
  Switch,
  Select,
  Input,
  DatePicker,
  Space,
  message,
  Tooltip,
  Card,
  AutoComplete,
  Dropdown,
  Checkbox,
} from "antd";
import { Chip } from "@heroui/react";
import {
  PencilSquareIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import {
  ExportOutlined,
  FilterOutlined,
  UndoOutlined,
  SettingOutlined,
  TagOutlined,
} from "@ant-design/icons";
import {
  getAllBatchNumbers,
  updateBatchNumberStatus,
  BatchNumberResponseDTO,
  setupBatchNumberRealTime,
  getMergeableBatchGroups,
  getAllBatchNumbersWithoutPagination,
} from "@/api/batchnumber";
import { getInventoryRecordsByBatchId } from "@/api/inventoryrecord";
import { exportToExcel } from "@/api/export";
import EditBatchNumberModal from "./EditBatchNumberModal";
import MergeBatchNumbersModal from "./MergeBatchNumbersModal";
import { BatchNumberIcon } from "./Icons";
import BatchNumberFilterModal from "./BatchNumberFilterModal";
import debounce from "lodash/debounce";
import TableControls from "../shared/TableControls";
import PaginationFooter from "../shared/PaginationFooter";
import ToolbarCard from "../shared/ToolbarCard";
import PageContainer from "../shared/PageContainer";
import { useRouter } from "next/router";
import dayjs from "dayjs";

const { Column } = Table;
const { Option } = Select;
const { RangePicker } = DatePicker;

export function BatchNumberManagement() {
  const [messageApi, contextHolder] = message.useMessage();
  const [batchNumbers, setBatchNumbers] = useState<BatchNumberResponseDTO[]>(
    []
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingActions, setLoadingActions] = useState<{ [key: string]: boolean }>({});
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isMergeModalVisible, setIsMergeModalVisible] = useState(false);
  const [currentBatchNumber, setCurrentBatchNumber] =
    useState<BatchNumberResponseDTO | null>(null);
  const [mergeableGroups, setMergeableGroups] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);
  const [searchText, setSearchText] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("CreatedAt");
  const [ascending, setAscending] = useState<boolean>(false);

  const [drugNameFilter, setDrugNameFilter] = useState<string>("");
  const [supplierFilter, setSupplierFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [manufacturingDateRange, setManufacturingDateRange] = useState<
    [string, string] | null
  >(null);
  const [expiryDateRange, setExpiryDateRange] = useState<
    [string, string] | null
  >(null);

  // Selected row keys for batch actions
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [drugOptions, setDrugOptions] = useState<any[]>([]);
  const [supplierOptions, setSupplierOptions] = useState<any[]>([]);

  const [batchCodes, setBatchCodes] = useState<string[]>([]);

  const router = useRouter();

  // Column visibility state
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
    batchCode: true,
    drugName: true,
    supplier: true,
    manufacturingDate: true,
    expiryDate: true,
    quantityReceived: true,
    status: true,
    createdAt: false,
    createdBy: false,
    updatedAt: false,
    updatedBy: false,
    toggle: true,
    actions: true,
  });
  
  // Dropdown open state
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // State to store inventory information for each batch number
  const [batchInventoryMap, setBatchInventoryMap] = useState<{ [key: string]: number }>({});

  const fetchBatchNumbers = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getAllBatchNumbers(
        currentPage,
        pageSize,
        searchText,
        sortBy,
        ascending,
        drugNameFilter,
        supplierFilter,
        statusFilter,
        manufacturingDateRange?.[0],
        manufacturingDateRange?.[1],
        expiryDateRange?.[0],
        expiryDateRange?.[1]
      );
      setBatchNumbers(result.data);
      setTotal(result.totalRecords);
    } catch (error) {
      messageApi.error({
        content: "Unable to load batch number list.",
        duration: 5,
      });
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    pageSize,
    searchText,
    sortBy,
    ascending,
    drugNameFilter,
    supplierFilter,
    statusFilter,
    manufacturingDateRange,
    expiryDateRange,
    messageApi,
  ]);

  const fetchMergeableGroups = useCallback(async () => {
    try {
      const groups = await getMergeableBatchGroups();
      setMergeableGroups(groups);
    } catch (error) {
      messageApi.error({
        content: "Unable to load mergeable batch groups.",
        duration: 5,
      });
    }
  }, [messageApi]);

  // Function to fetch all drugs and suppliers for filter options
  const fetchAllFilterOptions = useCallback(async () => {
    try {
      const result = await getAllBatchNumbersWithoutPagination();
      if (result && result.data && result.data.length > 0) {
        // Extract unique drugs
        const drugsMap = new Map();
        result.data.forEach((batch: BatchNumberResponseDTO) => {
          if (batch.drug && !drugsMap.has(batch.drug.id)) {
            drugsMap.set(batch.drug.id, {
              id: batch.drug.id,
              name: batch.drug.name,
              drugCode: batch.drug.drugCode
            });
          }
        });
        
        // Extract unique suppliers
        const suppliersMap = new Map();
        result.data.forEach((batch: BatchNumberResponseDTO) => {
          if (batch.supplier && !suppliersMap.has(batch.supplier.id)) {
            suppliersMap.set(batch.supplier.id, {
              id: batch.supplier.id,
              supplierName: batch.supplier.supplierName
            });
          }
        });
        
        setDrugOptions(Array.from(drugsMap.values()));
        setSupplierOptions(Array.from(suppliersMap.values()));
      }
    } catch (error) {
      messageApi.error({
        content: "Unable to load filter options.",
        duration: 5,
      });
    }
  }, [messageApi]);

  // Function to fetch all batch codes for autocomplete
  const fetchAllBatchCodes = useCallback(async () => {
    try {
      const result = await getAllBatchNumbersWithoutPagination();
      if (result && result.data && result.data.length > 0) {
        // Extract unique batch codes
        const uniqueBatchCodes = Array.from(
          new Set(result.data.map((batch: BatchNumberResponseDTO) => batch.batchCode))
        ) as string[];
        setBatchCodes(uniqueBatchCodes);
      }
    } catch (error) {
      messageApi.error({
        content: "Unable to load batch codes for autocomplete.",
        duration: 5,
      });
    }
  }, [messageApi]);

  // New function to fetch inventory records for each batch number
  const fetchInventoryRecords = useCallback(async (batchNumbers: BatchNumberResponseDTO[]) => {
    try {
      const inventoryMap: { [key: string]: number } = {};
      
      // Use Promise.all to fetch inventory records for all batch numbers in parallel
      await Promise.all(
        batchNumbers.map(async (batch) => {
          try {
            const inventoryRecord = await getInventoryRecordsByBatchId(batch.id);
            // If inventory record exists, store the quantityInStock
            if (inventoryRecord && inventoryRecord.length > 0) {
              inventoryMap[batch.id] = inventoryRecord[0].quantityInStock;
            } else {
              inventoryMap[batch.id] = 0; // Default to 0 if no inventory record found
            }
          } catch (error) {
            console.error(`Error fetching inventory for batch ${batch.id}:`, error);
            inventoryMap[batch.id] = 0; // Default to 0 on error
          }
        })
      );
      
      setBatchInventoryMap(inventoryMap);
    } catch (error) {
      console.error("Error fetching inventory records:", error);
      messageApi.error({
        content: "Unable to load inventory information.",
        duration: 5,
      });
    }
  }, [messageApi]);

  // Replace the existing extractUniqueOptions with fetchAllFilterOptions
  useEffect(() => {
    // Fetch batch numbers for current page
    fetchBatchNumbers();
    // Fetch mergeable groups
    fetchMergeableGroups();
    // Fetch all batch numbers for filter options
    fetchAllFilterOptions();
    // Fetch all batch codes for autocomplete
    fetchAllBatchCodes();

    const connection = setupBatchNumberRealTime(
      (updatedBatch: BatchNumberResponseDTO) => {
        fetchBatchNumbers();
        fetchMergeableGroups();
        fetchAllFilterOptions(); 
        fetchAllBatchCodes(); // Refresh batch codes when data changes
      }
    );

    return () => {
      connection.stop();
    };
  }, [fetchBatchNumbers, fetchMergeableGroups, fetchAllFilterOptions, fetchAllBatchCodes]);

  // Modified useEffect to fetch inventory records when batch numbers change
  useEffect(() => {
    if (batchNumbers.length > 0) {
      fetchInventoryRecords(batchNumbers);
    }
  }, [batchNumbers, fetchInventoryRecords]);

  const handleToggleStatus = async (id: string, isActive: boolean) => {
    const batch = batchNumbers.find((b) => b.id === id);
    if (!batch?.manufacturingDate || !batch?.expiryDate) {
      messageApi.error({
        content: "Please update Manufacturing Date and Expiry Date first.",
        duration: 5,
      });
      return;
    }

    try {
      setLoadingActions((prev) => ({ ...prev, [id]: true }));
      const response = await updateBatchNumberStatus(
        id,
        isActive ? "Active" : "Inactive"
      );
      if (response.isSuccess) {
        messageApi.success({
          content: response.message || "Status updated successfully!",
          duration: 5,
        });
        fetchBatchNumbers();
        fetchMergeableGroups();
      } else {
        messageApi.error({
          content: response.message || "Unable to update status",
          duration: 5,
        });
      }
    } catch (error) {
      messageApi.error({
        content: "Unable to update status",
        duration: 5,
      });
    } finally {
      setLoadingActions((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleShowEditModal = (batch: BatchNumberResponseDTO) => {
    setCurrentBatchNumber(batch);
    setIsEditModalVisible(true);
  };

  const handleShowMergeModal = () => {
    setIsMergeModalVisible(true);
  };

  const handlePageChange = (page: number, newPageSize?: number) => {
    setCurrentPage(page);
    if (newPageSize) setPageSize(newPageSize);
  };

  const handleSearchChange = debounce((value: string) => {
    setSearchText(value);
    setCurrentPage(1);
  }, 300);

  const handleSortChange = (value: string) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    const { field, order } = sorter;
    if (field && order) {
      setSortBy(
        field === "drug.name"
          ? "DrugName"
          : field === "supplier.supplierName"
          ? "SupplierName"
          : field
      );
      setAscending(order === "ascend");
    } else {
      setSortBy("CreatedAt");
      setAscending(false);
    }
    setCurrentPage(pagination.current);
    fetchBatchNumbers();
  };

  const handleReset = () => {
    setSearchText("");
    setDrugNameFilter("");
    setSupplierFilter("");
    setStatusFilter("");
    setManufacturingDateRange(null);
    setExpiryDateRange(null);
    setSortBy("CreatedAt");
    setAscending(false);
    setCurrentPage(1);
  };

  const handleExportExcel = () => {
    exportToExcel(
      "/batchnumber-management/batchnumbers/export",
      "batch_numbers.xlsx"
    );
    messageApi.success({
      content: "Downloading Excel file...",
      duration: 5,
    });
  };

  const handleFilterOpen = () => {
    setIsFilterModalVisible(true);
  };

  const handleFilterClose = () => {
    setIsFilterModalVisible(false);
  };

  const handleFilterApply = (filters: any) => {
    setDrugNameFilter(filters.drugNameFilter || "");
    setSupplierFilter(filters.supplierFilter || "");
    setStatusFilter(filters.statusFilter || "");
    setManufacturingDateRange(
      filters.manufacturingDateRange && filters.manufacturingDateRange[0] && filters.manufacturingDateRange[1]
        ? [
            filters.manufacturingDateRange[0].format("YYYY-MM-DD"),
            filters.manufacturingDateRange[1].format("YYYY-MM-DD"),
          ]
        : null
    );
    setExpiryDateRange(
      filters.expiryDateRange && filters.expiryDateRange[0] && filters.expiryDateRange[1]
        ? [
            filters.expiryDateRange[0].format("YYYY-MM-DD"),
            filters.expiryDateRange[1].format("YYYY-MM-DD"),
          ]
        : null
    );
    setAscending(filters.ascending);
    setCurrentPage(1);
    setIsFilterModalVisible(false);
  };

  // Handle column visibility
  const handleColumnVisibilityChange = (key: string) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Toggle all columns visibility
  const toggleAllColumns = (checked: boolean) => {
    const newVisibility = { ...columnVisibility };
    Object.keys(newVisibility).forEach((key) => {
      newVisibility[key] = checked;
    });
    setColumnVisibility(newVisibility);
  };

  // Check if all columns are visible
  const areAllColumnsVisible = () => {
    return Object.values(columnVisibility).every((value) => value === true);
  };

  // Handle dropdown visibility
  const handleDropdownVisibleChange = (visible: boolean) => {
    setDropdownOpen(visible);
  };

  // Prevent dropdown from closing when clicking checkboxes
  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const navigateToBatchDetail = (id: string) => {
    console.log("Navigating to batch detail with ID:", id);
    router.push(`/batch-number/${id}`);
  };

  return (
    <>
      {contextHolder}
      <PageContainer
        title="Batch Number Management"
        icon={<BatchNumberIcon />}
        onBack={() => router.back()}
      >
        {/* Search and Filters Toolbar */}
        <ToolbarCard
          leftContent={
            <>
              {/* Batch Code Search */}
              <AutoComplete
                placeholder="Search by Batch Code"
                onChange={handleSearchChange}
                style={{ width: 240 }}
                options={batchCodes.map(code => ({ value: code }))}
                filterOption={(inputValue, option) =>
                  option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                }
                allowClear
                notFoundContent="No batch codes found"
                dropdownMatchSelectWidth={false}
                dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                dropdownRender={(menu) => (
                  <>
                    {menu}
                  </>
                )}
              />

              
              {/* Advanced Filters */}
              <Tooltip title="Filters">
                <Button
                  icon={<FilterOutlined />}
                  onClick={handleFilterOpen}
                  disabled={loading}
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
                  style={{ width: "150px" }}
                  value={statusFilter || undefined}
                  onChange={(value) => setStatusFilter(value || "")}
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
                      searchText ||
                      drugNameFilter ||
                      supplierFilter ||
                      statusFilter ||
                      manufacturingDateRange ||
                      expiryDateRange
                    )
                  }
                />
              </Tooltip>

              {/* Column Settings */}
              <Dropdown
                menu={{
                  items: [
                    {
                      key: "selectAll",
                      label: (
                        <div onClick={handleMenuClick}>
                          <Checkbox
                            checked={areAllColumnsVisible()}
                            onChange={(e) => toggleAllColumns(e.target.checked)}
                          >
                            Toggle All
                          </Checkbox>
                        </div>
                      ),
                    },
                    {
                      key: "divider",
                      type: "divider",
                    },
                    {
                      key: "batchCode",
                      label: (
                        <div onClick={handleMenuClick}>
                          <Checkbox
                            checked={columnVisibility.batchCode}
                            onChange={() => handleColumnVisibilityChange("batchCode")}
                          >
                            Batch Code
                          </Checkbox>
                        </div>
                      ),
                    },
                    {
                      key: "drugName",
                      label: (
                        <div onClick={handleMenuClick}>
                          <Checkbox
                            checked={columnVisibility.drugName}
                            onChange={() => handleColumnVisibilityChange("drugName")}
                          >
                            Drug Name
                          </Checkbox>
                        </div>
                      ),
                    },
                    {
                      key: "supplier",
                      label: (
                        <div onClick={handleMenuClick}>
                          <Checkbox
                            checked={columnVisibility.supplier}
                            onChange={() => handleColumnVisibilityChange("supplier")}
                          >
                            Supplier
                          </Checkbox>
                        </div>
                      ),
                    },
                    {
                      key: "manufacturingDate",
                      label: (
                        <div onClick={handleMenuClick}>
                          <Checkbox
                            checked={columnVisibility.manufacturingDate}
                            onChange={() => handleColumnVisibilityChange("manufacturingDate")}
                          >
                            Manufacturing Date
                          </Checkbox>
                        </div>
                      ),
                    },
                    {
                      key: "expiryDate",
                      label: (
                        <div onClick={handleMenuClick}>
                          <Checkbox
                            checked={columnVisibility.expiryDate}
                            onChange={() => handleColumnVisibilityChange("expiryDate")}
                          >
                            Expiry Date
                          </Checkbox>
                        </div>
                      ),
                    },
                    {
                      key: "quantityReceived",
                      label: (
                        <div onClick={handleMenuClick}>
                          <Checkbox
                            checked={columnVisibility.quantityReceived}
                            onChange={() => handleColumnVisibilityChange("quantityReceived")}
                          >
                            Quantity Received
                          </Checkbox>
                        </div>
                      ),
                    },
                    {
                      key: "status",
                      label: (
                        <div onClick={handleMenuClick}>
                          <Checkbox
                            checked={columnVisibility.status}
                            onChange={() => handleColumnVisibilityChange("status")}
                          >
                            Status
                          </Checkbox>
                        </div>
                      ),
                    },
                    {
                      key: "createdAt",
                      label: (
                        <div onClick={handleMenuClick}>
                          <Checkbox
                            checked={columnVisibility.createdAt}
                            onChange={() => handleColumnVisibilityChange("createdAt")}
                          >
                            Created At
                          </Checkbox>
                        </div>
                      ),
                    },
                    {
                      key: "createdBy",
                      label: (
                        <div onClick={handleMenuClick}>
                          <Checkbox
                            checked={columnVisibility.createdBy}
                            onChange={() => handleColumnVisibilityChange("createdBy")}
                          >
                            Created By
                          </Checkbox>
                        </div>
                      ),
                    },
                    {
                      key: "updatedAt",
                      label: (
                        <div onClick={handleMenuClick}>
                          <Checkbox
                            checked={columnVisibility.updatedAt}
                            onChange={() => handleColumnVisibilityChange("updatedAt")}
                          >
                            Updated At
                          </Checkbox>
                        </div>
                      ),
                    },
                    {
                      key: "updatedBy",
                      label: (
                        <div onClick={handleMenuClick}>
                          <Checkbox
                            checked={columnVisibility.updatedBy}
                            onChange={() => handleColumnVisibilityChange("updatedBy")}
                          >
                            Updated By
                          </Checkbox>
                        </div>
                      ),
                    },
                    {
                      key: "toggle",
                      label: (
                        <div onClick={handleMenuClick}>
                          <Checkbox
                            checked={columnVisibility.toggle}
                            onChange={() => handleColumnVisibilityChange("toggle")}
                          >
                            Toggle
                          </Checkbox>
                        </div>
                      ),
                    },
                    {
                      key: "actions",
                      label: (
                        <div onClick={handleMenuClick}>
                          <Checkbox
                            checked={columnVisibility.actions}
                            onChange={() => handleColumnVisibilityChange("actions")}
                          >
                            Actions
                          </Checkbox>
                        </div>
                      ),
                    },
                  ],
                  onClick: (e) => {
                    // Prevent dropdown from closing
                    e.domEvent.stopPropagation();
                  },
                }}
                trigger={["hover", "click"]}
                placement="bottomRight"
                arrow
                open={dropdownOpen}
                onOpenChange={handleDropdownVisibleChange}
                mouseEnterDelay={0.1}
                mouseLeaveDelay={0.3}
              >
                <Tooltip title="Column Settings">
                  <Button icon={<SettingOutlined />}>Columns</Button>
                </Tooltip>
              </Dropdown>

              {/* Merge Button */}
              <Button
                type="primary"
                onClick={handleShowMergeModal}
                disabled={mergeableGroups.length === 0 || loading}
                icon={<PlusIcon className="w-5 h-5" />}
              >
                Merge Batch Numbers
              </Button>
            </>
          }
          rightContent={
            <Button
              type="primary"
              icon={<ExportOutlined />}
              onClick={handleExportExcel}
              disabled={loading}
            >
              Export Excel
            </Button>
          }
        />

        {/* Table Controls for rows per page */}
        <TableControls
          selectedRowKeys={selectedRowKeys}
          pageSize={pageSize}
          onPageSizeChange={(newSize) => handlePageChange(1, newSize)}
          bulkActions={[]}
          maxRowsPerPage={100}
          pageSizeOptions={[5, 10, 15, 20, 50, 100]}
        />

        {/* Data Table */}
        <Card className="shadow-sm" bodyStyle={{ padding: "16px" }}>
          <Table
            dataSource={batchNumbers}
            rowKey="id"
            pagination={false}
            onChange={handleTableChange}
            loading={loading}
          >
            <Column
              title="BATCH CODE"
              dataIndex="batchCode"
              key="batchCode"
              sorter={(a, b) => a.batchCode.localeCompare(b.batchCode)}
              hidden={!columnVisibility.batchCode}
              render={(batchCode, record) => (
                <Button 
                  type="link" 
                  onClick={() => navigateToBatchDetail(record.id)}
                  style={{ padding: 0, margin: 0, height: 'auto' }}
                >
                  {batchCode}
                </Button>
              )}
            />
            <Column
              title="DRUG NAME"
              dataIndex={["drug", "name"]}
              key="drug.name"
              sorter={(a, b) => a.drug.name.localeCompare(b.drug.name)}
              hidden={!columnVisibility.drugName}
              render={(name, record) => (
                <Button 
                  type="link" 
                  onClick={() => router.push(`/drug/${record.drug.id}`)}
                  style={{ padding: 0, margin: 0, height: 'auto' }}
                >
                  {name}
                </Button>
              )}
            />
            <Column
              title="SUPPLIER"
              dataIndex={["supplier", "supplierName"]}
              key="supplier.supplierName"
              sorter={(a, b) =>
                a.supplier.supplierName.localeCompare(b.supplier.supplierName)
              }
              hidden={!columnVisibility.supplier}
              render={(supplierName, record) => (
                <Button 
                  type="link" 
                  onClick={() => router.push(`/drug-supplier/${record.supplier.id}`)}
                  style={{ padding: 0, margin: 0, height: 'auto' }}
                >
                  {supplierName}
                </Button>
              )}
            />
            <Column
              title="MANUFACTURING DATE"
              dataIndex="manufacturingDate"
              key="manufacturingDate"
              render={(date) =>
                date ? new Date(date).toLocaleDateString() : "-"
              }
              sorter={(a, b) =>
                (a.manufacturingDate || "").localeCompare(
                  b.manufacturingDate || ""
                )
              }
              hidden={!columnVisibility.manufacturingDate}
            />
            <Column
              title="EXPIRY DATE"
              dataIndex="expiryDate"
              key="expiryDate"
              render={(date) =>
                date ? new Date(date).toLocaleDateString() : "-"
              }
              sorter={(a, b) =>
                (a.expiryDate || "").localeCompare(b.expiryDate || "")
              }
              hidden={!columnVisibility.expiryDate}
            />
            <Column
              title="QUANTITY RECEIVED"
              dataIndex="quantityReceived"
              key="quantityReceived"
              sorter={(a, b) => a.quantityReceived - b.quantityReceived}
              hidden={!columnVisibility.quantityReceived}
            />
            <Column
              title="STATUS"
              dataIndex="status"
              key="status"
              render={(status) => (
                <Chip
                  className="capitalize"
                  color={
                    status === "Priority"
                      ? "primary"
                      : status === "Active"
                      ? "success"
                      : status === "NearExpiry"
                      ? "warning"
                      : status === "Inactive"
                      ? "danger"
                      : "secondary"
                  }
                  size="sm"
                  variant="flat"
                >
                  {status === "NearExpiry" ? "Near Expiry" : status}
                </Chip>
              )}
              sorter={(a, b) => a.status.localeCompare(b.status)}
              hidden={!columnVisibility.status}
            />
            <Column
              title="CREATED AT"
              dataIndex="createdAt"
              key="createdAt"
              render={(date) => (date ? new Date(date).toLocaleString() : "-")}
              sorter={(a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
              }
              hidden={!columnVisibility.createdAt}
            />
            <Column
              title="CREATED BY"
              dataIndex={["createdBy", "userName"]}
              key="createdBy"
              render={(userName) => userName || "-"}
              sorter={(a, b) =>
                (a.createdBy?.userName || "").localeCompare(
                  b.createdBy?.userName || ""
                )
              }
              hidden={!columnVisibility.createdBy}
            />
            <Column
              title="UPDATED AT"
              dataIndex="updatedAt"
              key="updatedAt"
              render={(date) => (date ? new Date(date).toLocaleString() : "-")}
              sorter={(a, b) =>
                (a.updatedAt || "").localeCompare(b.updatedAt || "")
              }
              hidden={!columnVisibility.updatedAt}
            />
            <Column
              title="UPDATED BY"
              dataIndex={["updatedBy", "userName"]}
              key="updatedBy"
              render={(userName) => userName || "-"}
              sorter={(a, b) =>
                (a.updatedBy?.userName || "").localeCompare(
                  b.updatedBy?.userName || ""
                )
              }
              hidden={!columnVisibility.updatedBy}
            />
            <Column
              title="TOGGLE"
              key="toggle"
              align="center"
              render={(_, record: BatchNumberResponseDTO) => {
                // Get the inventory quantity for this batch
                const inventoryQuantity = batchInventoryMap[record.id] || 0;
                
                return (
                  <Switch
                    checked={
                      record.status === "Priority" ||
                      record.status === "Active" ||
                      record.status === "NearExpiry"
                    }
                    disabled={
                      !record.manufacturingDate ||
                      !record.expiryDate ||
                      record.status === "Expired"
                    }
                    loading={loadingActions[record.id]}
                    onChange={(checked) => handleToggleStatus(record.id, checked)}
                  />
                );
              }}
              hidden={!columnVisibility.toggle}
            />
            <Column
              title="ACTIONS"
              key="actions"
              align="center"
              render={(_, record: BatchNumberResponseDTO) => (
                <Button
                  type="text"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShowEditModal(record);
                  }}
                  disabled={record.status === "Expired"}
                  icon={
                    <PencilSquareIcon
                      className="w-5 h-5"
                      style={{
                        color:
                          record.status === "Expired" ? "#d9d9d9" : "#1890ff",
                      }}
                    />
                  }
                />
              )}
              hidden={!columnVisibility.actions}
            />
          </Table>

          <PaginationFooter
            current={currentPage}
            pageSize={pageSize}
            total={total}
            onChange={handlePageChange}
            showGoToPage={true}
            showTotal={true}
          />
        </Card>
      </PageContainer>

      {/* Modals */}
      {currentBatchNumber && (
        <EditBatchNumberModal
          visible={isEditModalVisible}
          batchNumber={currentBatchNumber}
          onClose={() => setIsEditModalVisible(false)}
          onSuccess={fetchBatchNumbers}
        />
      )}

      <MergeBatchNumbersModal
        visible={isMergeModalVisible}
        onClose={() => setIsMergeModalVisible(false)}
        onSuccess={() => {
          fetchBatchNumbers();
          fetchMergeableGroups();
        }}
      />

      <BatchNumberFilterModal
        visible={isFilterModalVisible}
        onCancel={handleFilterClose}
        onApply={handleFilterApply}
        onReset={handleReset}
        filters={{
          drugNameFilter,
          supplierFilter,
          statusFilter,
          manufacturingDateRange: manufacturingDateRange 
            ? [
                manufacturingDateRange[0] ? dayjs(manufacturingDateRange[0]) : null,
                manufacturingDateRange[1] ? dayjs(manufacturingDateRange[1]) : null
              ] as [dayjs.Dayjs | null, dayjs.Dayjs | null]
            : [null, null],
          expiryDateRange: expiryDateRange
            ? [
                expiryDateRange[0] ? dayjs(expiryDateRange[0]) : null,
                expiryDateRange[1] ? dayjs(expiryDateRange[1]) : null
              ] as [dayjs.Dayjs | null, dayjs.Dayjs | null]
            : [null, null],
          ascending
        }}
        drugOptions={drugOptions}
        supplierOptions={supplierOptions}
      />
    </>
  );
}
