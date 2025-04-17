import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  message,
  Table,
  Input,
  Button,
  Dropdown,
  Menu,
  Tag,
  Pagination,
  Modal,
  Card,
  Select,
  Checkbox,
  Tooltip,
  Space,
  Typography,
  TableProps,
  TablePaginationConfig,
  Row,
  InputNumber,
  Col,
  Spin,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  DownOutlined,
  ShopOutlined,
  UndoOutlined,
  FilterOutlined,
  SettingOutlined,
  AppstoreOutlined,
  TagOutlined,
  ExclamationCircleOutlined,
  FormOutlined,
  EyeOutlined,
  ArrowLeftOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";
import type { CheckboxChangeEvent } from "antd/es/checkbox";
import dayjs from "dayjs";
import {
  getDrugSuppliers,
  DrugSupplierResponse,
  activateDrugSuppliers,
  deactivateDrugSuppliers,
  getDrugSupplierById,
} from "@/api/drugsupplier";
import { CreateDrugSupplierForm } from "./DrugSupplierCreateForm";
import { EditDrugSupplierForm } from "./DrugSupplierEditForm";
import DrugSupplierFilterModal, {
  DrugSupplierAdvancedFilters,
} from "./DrugSupplierFilterModal";
import ExportConfigModal, {
  DrugSupplierExportConfigDTO,
} from "./ExportConfigModal";
import { useRouter } from "next/router";
import type { FilterValue, SorterResult } from "antd/es/table/interface";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import { DrugSupplierIcon } from "./DrugSupplierIcons";

// Extend dayjs with the plugins
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

const { Option } = Select;
const { confirm } = Modal;
const { Text, Title } = Typography;

const staticColumns = [
  {
    title: (
      <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
        Supplier Name
      </span>
    ),
    dataIndex: "supplierName",
    key: "supplierName",
    sorter: (a: DrugSupplierResponse, b: DrugSupplierResponse) =>
      a.supplierName.localeCompare(b.supplierName),
    sortDirections: ["ascend", "descend"] as ("ascend" | "descend")[],
  },
  {
    title: (
      <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
        Contact Number
      </span>
    ),
    dataIndex: "contactNumber",
    key: "contactNumber",
  },
  {
    title: (
      <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
        Email
      </span>
    ),
    dataIndex: "email",
    key: "email",
  },
  {
    title: (
      <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
        Address
      </span>
    ),
    dataIndex: "address",
    key: "address",
  },
  {
    title: (
      <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
        Created At
      </span>
    ),
    dataIndex: "createdAt",
    key: "createdAt",
    sorter: (a: DrugSupplierResponse, b: DrugSupplierResponse) =>
      dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
    render: (date: string) => (date ? dayjs(date).format("DD/MM/YYYY") : "-"),
    sortDirections: ["ascend", "descend"] as ("ascend" | "descend")[],
  },
  {
    title: (
      <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
        Status
      </span>
    ),
    dataIndex: "status",
    key: "status",
  },
  {
    title: (
      <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
        Actions
      </span>
    ),
    key: "actions",
    align: "center" as const,
  },
];

const statusOptions = [
  { label: "Active", value: "Active" },
  { label: "Inactive", value: "Inactive" },
];

const INITIAL_COLUMN_VISIBILITY: Record<string, boolean> = {
  supplierName: true,
  contactNumber: true,
  email: true,
  address: true,
  createdAt: true,
  status: true,
  actions: true,
};

// Initial state for advanced filters
const initialAdvancedFilters: DrugSupplierAdvancedFilters = {
  createdDateRange: [null, null],
  updatedDateRange: [null, null],
  ascending: false, // Default sort: Newest first (descending)
};

export function DrugSuppliers() {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(
    "Loading drug suppliers..."
  );

  const [suppliers, setSuppliers] = useState<DrugSupplierResponse[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filterValue, setFilterValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [sorter, setSorter] = useState<
    SorterResult<DrugSupplierResponse> | SorterResult<DrugSupplierResponse>[]
  >();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [showActivateButton, setShowActivateButton] = useState(false);
  const [showDeactivateButton, setShowDeactivateButton] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    "activate" | "deactivate" | null
  >(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSupplierId, setEditingSupplierId] = useState<string>("");

  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(INITIAL_COLUMN_VISIBILITY);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // State for filter modal
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [advancedFilters, setAdvancedFilters] =
    useState<DrugSupplierAdvancedFilters>(initialAdvancedFilters);

  // Add these state variables
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportConfig, setExportConfig] = useState<DrugSupplierExportConfigDTO>(
    {
      exportAllPages: true,
      includeSupplierName: true,
      includeContactNumber: true,
      includeEmail: true,
      includeAddress: true,
      includeCreatedAt: true,
      includeUpdatedAt: true,
      includeStatus: true,
    }
  );

  // Thêm state để theo dõi tùy chọn dropdown đã chọn
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isLoadingAllItems, setIsLoadingAllItems] = useState<boolean>(false);

  const fetchDrugSuppliers = useCallback(async () => {
    if (initialLoading) {
      setLoadingMessage("Loading drug suppliers...");
    }
    setLoading(true);
    try {
      const data = await getDrugSuppliers();
      setSuppliers(data);
      setTotalItems(data.length);
    } catch (error) {
      messageApi.error("Failed to fetch drug suppliers", 5);
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [messageApi, initialLoading]);

  useEffect(() => {
    fetchDrugSuppliers();
  }, [fetchDrugSuppliers]);

  useEffect(() => {
    if (selectedRowKeys.length > 0) {
      const selectedSuppliersData = suppliers.filter((s) =>
        selectedRowKeys.includes(s.id)
      );
      const hasInactive = selectedSuppliersData.some(
        (s) => s.status === "Inactive"
      );
      const hasActive = selectedSuppliersData.some(
        (s) => s.status === "Active"
      );

      setShowActivateButton(hasInactive);
      setShowDeactivateButton(hasActive);
    } else {
      setShowActivateButton(false);
      setShowDeactivateButton(false);
    }
  }, [selectedRowKeys, suppliers]);

  const filteredAndSortedSuppliers = useMemo(() => {
    let processedSuppliers = [...suppliers];

    // Apply search filter (filterValue)
    if (filterValue) {
      processedSuppliers = processedSuppliers.filter((supplier) =>
        supplier.supplierName?.toLowerCase().includes(filterValue.toLowerCase())
      );
    }

    // Apply status filter (statusFilter from Select)
    if (statusFilter.length > 0) {
      processedSuppliers = processedSuppliers.filter(
        (supplier) => supplier.status && statusFilter.includes(supplier.status)
      );
    }

    // Apply createdDateRange filter
    const [createdStart, createdEnd] = advancedFilters.createdDateRange;
    if (createdStart) {
      processedSuppliers = processedSuppliers.filter((s) =>
        dayjs(s.createdAt).isSameOrAfter(createdStart, "day")
      );
    }
    if (createdEnd) {
      processedSuppliers = processedSuppliers.filter((s) =>
        dayjs(s.createdAt).isSameOrBefore(createdEnd, "day")
      );
    }

    // Apply updatedDateRange filter
    const [updatedStart, updatedEnd] = advancedFilters.updatedDateRange;
    if (updatedStart) {
      processedSuppliers = processedSuppliers.filter(
        (s) =>
          s.updatedAt && dayjs(s.updatedAt).isSameOrAfter(updatedStart, "day")
      );
    }
    if (updatedEnd) {
      processedSuppliers = processedSuppliers.filter(
        (s) =>
          s.updatedAt && dayjs(s.updatedAt).isSameOrBefore(updatedEnd, "day")
      );
    }

    // Apply sorting (combining table header sorter and advanced filter sort direction)
    const currentSorter = Array.isArray(sorter) ? sorter[0] : sorter;
    const sortField =
      (currentSorter?.field as keyof DrugSupplierResponse) || "createdAt"; // Default to createdAt
    // Use advancedFilters.ascending for CreatedAt sort direction, otherwise use table sorter direction (if any)
    const sortOrder =
      sortField === "createdAt"
        ? advancedFilters.ascending
          ? "ascend"
          : "descend"
        : currentSorter?.order;

    if (sortField && sortOrder) {
      processedSuppliers.sort((a, b) => {
        const valA = a[sortField] ?? null;
        const valB = b[sortField] ?? null;

        if (valA === null && valB === null) return 0;
        if (valA === null) return sortOrder === "ascend" ? 1 : -1;
        if (valB === null) return sortOrder === "ascend" ? -1 : 1;

        let comparison = 0;
        if (typeof valA === "string" && typeof valB === "string") {
          if (sortField === "createdAt" || sortField === "updatedAt") {
            const dateA = dayjs(valA);
            const dateB = dayjs(valB);
            if (dateA.isValid() && dateB.isValid()) {
              comparison = dateA.unix() - dateB.unix();
            } else {
              comparison = valA.localeCompare(valB);
            }
          } else {
            comparison = valA.localeCompare(valB);
          }
        } else if (typeof valA === "number" && typeof valB === "number") {
          comparison = valA - valB;
        } else {
          comparison = String(valA).localeCompare(String(valB));
        }
        return sortOrder === "descend" ? comparison * -1 : comparison;
      });
    } else if (!sortField || !sortOrder) {
      // Default sort by CreatedAt using advanced filter direction if no table sort applied
      processedSuppliers.sort((a, b) => {
        const comparison =
          dayjs(b.createdAt).unix() - dayjs(a.createdAt).unix(); // Descending
        return advancedFilters.ascending ? comparison * -1 : comparison; // Apply direction
      });
    }

    return processedSuppliers;
  }, [suppliers, filterValue, statusFilter, sorter, advancedFilters]);

  const paginatedSuppliers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredAndSortedSuppliers.slice(start, end);
  }, [filteredAndSortedSuppliers, currentPage, pageSize]);

  const handleTableChange: TableProps<DrugSupplierResponse>["onChange"] = (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    newSorter:
      | SorterResult<DrugSupplierResponse>
      | SorterResult<DrugSupplierResponse>[]
  ) => {
    const statusFilters = (filters.status as FilterValue) || [];
    setStatusFilter(statusFilters.map(String));

    // Update sorter state from table changes
    setSorter(newSorter);

    // Reset page to 1 when filters or sorter change
    setCurrentPage(1);
  };

  const handleSearchSelectChange = (selectedValue: string | undefined) => {
    setFilterValue(selectedValue || "");
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilterValue("");
    setStatusFilter([]);
    setSorter(undefined);
    setAdvancedFilters(initialAdvancedFilters); // Reset advanced filters as well
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value: string[]) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const onPageChange = (page: number, newPageSize?: number) => {
    setCurrentPage(page);
    if (newPageSize && newPageSize !== pageSize) {
      setPageSize(newPageSize);
    }
  };

  const handleOpenEditModal = (id: string) => {
    setEditingSupplierId(id);
    setIsEditModalOpen(true);
  };

  const handleCreateSuccess = () => {
    setIsModalOpen(false);
    fetchDrugSuppliers();
    messageApi.success("Drug supplier added successfully", 5);
  };

  const handleUpdateSuccess = () => {
    setIsEditModalOpen(false);
    setEditingSupplierId("");
    fetchDrugSuppliers();
    messageApi.success("Drug supplier updated successfully", 5);
  };

  const showConfirm = (action: "activate" | "deactivate", onOk: () => void) => {
    const selectedSuppliersData = suppliers.filter((s) =>
      selectedRowKeys.includes(s.id)
    );
    const targetStatus = action === "activate" ? "Inactive" : "Active";
    const count = selectedSuppliersData.filter(
      (s) => s.status === targetStatus
    ).length;

    if (count === 0) {
      messageApi.warning(
        `No suppliers with status '${targetStatus}' selected.`,
        5
      );
      return;
    }

    setConfirmAction(action);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmAction = () => {
    if (confirmAction === "activate") {
      handleActivate();
    } else if (confirmAction === "deactivate") {
      handleDeactivate();
    }

    setIsConfirmModalOpen(false);
    setConfirmAction(null);
  };

  const handleActivate = async () => {
    const idsToActivate = suppliers
      .filter((s) => selectedRowKeys.includes(s.id) && s.status === "Inactive")
      .map((s) => s.id);

    if (idsToActivate.length === 0) return;

    setLoadingMessage("Activating suppliers...");
    setLoading(true);
    try {
      await activateDrugSuppliers(idsToActivate);
      messageApi.success("Drug suppliers activated successfully", 5);

      // Update local state instead of refetching
      setSuppliers((prevSuppliers) =>
        prevSuppliers.map((supplier) =>
          idsToActivate.includes(supplier.id)
            ? {
                ...supplier,
                status: "Active",
                updatedAt: new Date().toISOString(),
              }
            : supplier
        )
      );

      setSelectedRowKeys([]); // Clear selection
    } catch (error) {
      messageApi.error("Failed to activate drug suppliers", 5);
      console.error("Error activating drug suppliers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    const idsToDeactivate = suppliers
      .filter((s) => selectedRowKeys.includes(s.id) && s.status === "Active")
      .map((s) => s.id);

    if (idsToDeactivate.length === 0) return;

    setLoadingMessage("Deactivating suppliers...");
    setLoading(true);
    try {
      await deactivateDrugSuppliers(idsToDeactivate);
      messageApi.success("Drug suppliers deactivated successfully", 5);

      // Update local state instead of refetching
      setSuppliers((prevSuppliers) =>
        prevSuppliers.map((supplier) =>
          idsToDeactivate.includes(supplier.id)
            ? {
                ...supplier,
                status: "Inactive",
                updatedAt: new Date().toISOString(),
              }
            : supplier
        )
      );

      setSelectedRowKeys([]); // Clear selection
    } catch (error) {
      messageApi.error("Failed to deactivate drug suppliers", 5);
      console.error("Error deactivating drug suppliers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleColumnVisibilityChange = (key: string) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleAllColumns = (checked: boolean) => {
    const newVisibility = { ...columnVisibility };
    staticColumns.forEach((col) => {
      if (col.key && col.key !== "actions") {
        newVisibility[col.key] = checked;
      }
    });
    newVisibility["actions"] = checked;
    setColumnVisibility(newVisibility);
  };

  const areAllColumnsVisible = () => {
    return staticColumns.every(
      (col) => !col.key || col.key === "actions" || columnVisibility[col.key]
    );
  };

  const handleDropdownVisibleChange = (visible: boolean) => {
    setDropdownOpen(visible);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const columns: TableProps<DrugSupplierResponse>["columns"] = useMemo(() => {
    const actionColumn = {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          ACTIONS
        </span>
      ),
      key: "actions",
      align: "center" as const,
      render: (_: any, record: DrugSupplierResponse) => (
        <Space
          size="small"
          style={{ display: "flex", justifyContent: "center" }}
        >
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<FormOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleOpenEditModal(record.id);
              }}
            />
          </Tooltip>
        </Space>
      ),
    };

    const visibleCols = staticColumns
      .filter(
        (col) => col.key && col.key !== "actions" && columnVisibility[col.key]
      )
      .map((col) => {
        if (col.key === "supplierName") {
          return {
            ...col,
            render: (text: string, record: DrugSupplierResponse) => (
              <span
                className="text-primary cursor-pointer hover:underline"
                onClick={() => router.push(`/drug-supplier/${record.id}`)}
              >
                {text}
              </span>
            ),
          };
        }
        if (col.key === "status") {
          return {
            ...col,
            render: (status: string) => (
              <Tag color={status === "Active" ? "success" : "error"}>
                {status ? status.toUpperCase() : ""}
              </Tag>
            ),
          };
        }
        if (col.key === "createdAt" || col.key === "updatedAt") {
          return {
            ...col,
            render: (date: string) =>
              date ? dayjs(date).format("DD/MM/YYYY") : "-",
          };
        }
        return col;
      });

    if (columnVisibility.actions) {
      return [...visibleCols, actionColumn];
    }
    return visibleCols;
  }, [columnVisibility, handleOpenEditModal, router]);

  const handleBack = () => {
    router.back();
  };

  // Handlers for the advanced filter modal
  const handleOpenFilterModal = () => {
    setFilterModalVisible(true);
  };

  const handleApplyAdvancedFilters = (
    appliedFilters: DrugSupplierAdvancedFilters
  ) => {
    setAdvancedFilters(appliedFilters);
    // Reset sorter state from table if sorting by CreatedAt is changed via modal
    const currentSorter = Array.isArray(sorter) ? sorter[0] : sorter;
    if (currentSorter?.field === "createdAt") {
      setSorter(undefined); // Let the advanced filter control CreatedAt sort
    }
    setCurrentPage(1); // Reset page when filters change
    setFilterModalVisible(false);
  };

  const handleResetAdvancedFilters = () => {
    setAdvancedFilters(initialAdvancedFilters);
    // Optionally reset table sorter if needed
    // setSorter(undefined);
    setCurrentPage(1);
    setFilterModalVisible(false);
  };

  // Add these functions
  const handleOpenExportConfig = () => {
    setExportModalVisible(true);
  };

  const handleExportConfigChange = (
    newConfig: Partial<DrugSupplierExportConfigDTO>
  ) => {
    setExportConfig((prev) => ({ ...prev, ...newConfig }));
  };

  // Hàm để lấy tất cả ID theo trạng thái
  const getItemIdsByStatus = async (
    statuses: string[],
    currentPageOnly: boolean
  ): Promise<React.Key[]> => {
    try {
      if (currentPageOnly) {
        // Chỉ lấy ID trên trang hiện tại theo trạng thái
        return paginatedSuppliers
          .filter(
            (supplier) => supplier.status && statuses.includes(supplier.status)
          )
          .map((supplier) => supplier.id);
      } else {
        // Lấy ID từ tất cả các trang
        setIsLoadingAllItems(true);
        const result = filteredAndSortedSuppliers
          .filter(
            (supplier) => supplier.status && statuses.includes(supplier.status)
          )
          .map((supplier) => supplier.id);

        setIsLoadingAllItems(false);
        return result;
      }
    } catch (error) {
      console.error("Error getting item IDs by status:", error);
      setIsLoadingAllItems(false);
      return [];
    }
  };

  // Hàm xử lý chọn theo trạng thái
  const handleSelectByStatus = async (key: string) => {
    // Kiểm tra xem tùy chọn này đã được chọn hay chưa
    if (selectedOption === key) {
      // Nếu đã được chọn, bỏ chọn và xóa các lựa chọn
      setSelectedOption(null);
      setSelectedRowKeys([]);
    } else {
      // Nếu chưa, chọn nó và áp dụng lựa chọn
      setSelectedOption(key);

      switch (key) {
        case "page-active":
          // Chọn nhà cung cấp Active trên trang hiện tại
          const pageActiveIds = await getItemIdsByStatus(["Active"], true);
          setSelectedRowKeys(pageActiveIds);
          break;
        case "all-active":
          // Chọn tất cả nhà cung cấp Active trên tất cả các trang
          const allActiveIds = await getItemIdsByStatus(["Active"], false);
          setSelectedRowKeys(allActiveIds);
          break;
        case "page-inactive":
          // Chọn nhà cung cấp Inactive trên trang hiện tại
          const pageInactiveIds = await getItemIdsByStatus(["Inactive"], true);
          setSelectedRowKeys(pageInactiveIds);
          break;
        case "all-inactive":
          // Chọn tất cả nhà cung cấp Inactive trên tất cả các trang
          const allInactiveIds = await getItemIdsByStatus(["Inactive"], false);
          setSelectedRowKeys(allInactiveIds);
          break;
        default:
          break;
      }
    }
  };

  // Hàm hiển thị trình đơn thả xuống tùy chỉnh
  const renderSelectAll = () => {
    // Đếm nhà cung cấp theo trạng thái
    const activeCount = paginatedSuppliers.filter(
      (supplier) => supplier.status === "Active"
    ).length;
    const inactiveCount = paginatedSuppliers.filter(
      (supplier) => supplier.status === "Inactive"
    ).length;

    // Đếm nhà cung cấp có thể chọn
    const selectableSuppliers = paginatedSuppliers;

    const isSelectAll =
      selectableSuppliers.length > 0 &&
      selectableSuppliers.every((supplier) =>
        selectedRowKeys.includes(supplier.id)
      );

    const isIndeterminate =
      selectedRowKeys.length > 0 &&
      !isSelectAll &&
      selectableSuppliers.some((supplier) =>
        selectedRowKeys.includes(supplier.id)
      );

    // Tạo mục menu dropdown
    const items = [];

    // Thêm tùy chọn Active
    if (activeCount > 0) {
      items.push({
        key: "page-active",
        label: (
          <div
            className={
              selectedOption === "page-active"
                ? "ant-dropdown-menu-item-active"
                : ""
            }
          >
            Select all Active on this page ({activeCount})
          </div>
        ),
      });

      items.push({
        key: "all-active",
        label: (
          <div
            className={
              selectedOption === "all-active"
                ? "ant-dropdown-menu-item-active"
                : ""
            }
          >
            {isLoadingAllItems && selectedOption === "all-active" ? (
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Spin size="small" />
                <span>Loading all Active...</span>
              </div>
            ) : (
              <span>Select all Active (all pages)</span>
            )}
          </div>
        ),
      });
    }

    // Thêm tùy chọn Inactive
    if (inactiveCount > 0) {
      items.push({
        key: "page-inactive",
        label: (
          <div
            className={
              selectedOption === "page-inactive"
                ? "ant-dropdown-menu-item-active"
                : ""
            }
          >
            Select all Inactive on this page ({inactiveCount})
          </div>
        ),
      });

      items.push({
        key: "all-inactive",
        label: (
          <div
            className={
              selectedOption === "all-inactive"
                ? "ant-dropdown-menu-item-active"
                : ""
            }
          >
            {isLoadingAllItems && selectedOption === "all-inactive" ? (
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Spin size="small" />
                <span>Loading all Inactive...</span>
              </div>
            ) : (
              <span>Select all Inactive (all pages)</span>
            )}
          </div>
        ),
      });
    }

    // Hàm xử lý khi chọn tất cả trên trang hiện tại
    const handleSelectAllToggle = (e: CheckboxChangeEvent) => {
      // Đã vô hiệu hóa chức năng
      return;
    };

    return (
      <>
        <Checkbox
          checked={false}
          indeterminate={false}
          onChange={handleSelectAllToggle}
          disabled={true}
        />

        {items.length > 0 && (
          <Dropdown
            menu={{
              items,
              onClick: ({ key }) => handleSelectByStatus(key),
              selectable: true,
              selectedKeys: selectedOption ? [selectedOption] : [],
            }}
            placement="bottomLeft"
            trigger={["click"]}
          >
            <Button
              type="text"
              size="small"
              className="select-all-dropdown"
              style={{
                marginLeft: 0,
                padding: "0 4px",
                position: "absolute",
                top: "50%",
                transform: "translateY(-50%)",
                left: "30px",
                right: "auto",
                zIndex: 10,
              }}
            >
              <DownOutlined />
            </Button>
          </Dropdown>
        )}
      </>
    );
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => {
      setSelectedRowKeys(keys);
    },
    columnTitle: renderSelectAll,
  };

  const hasSelected = selectedRowKeys.length > 0;
  const selectedSuppliersData = suppliers.filter((s) =>
    selectedRowKeys.includes(s.id)
  );

  const renderSelectedInfo = () => {
    if (selectedRowKeys.length === 0) return null;

    return (
      <Space>
        <Text>{selectedRowKeys.length} Items selected</Text>
        <Button icon={<UndoOutlined />} onClick={() => setSelectedRowKeys([])}>
          Restore
        </Button>

        {showActivateButton && (
          <Button
            className="bg-success-100 text-success border-success"
            onClick={() => showConfirm("activate", handleActivate)}
            disabled={loading}
          >
            Activate Selected
          </Button>
        )}

        {showDeactivateButton && (
          <Button
            className="bg-danger-100 text-danger border-danger"
            onClick={() => showConfirm("deactivate", handleDeactivate)}
            disabled={loading}
          >
            Deactivate Selected
          </Button>
        )}
      </Space>
    );
  };

  // Hàm render phần Rows per page (luôn hiển thị)
  const renderRowsPerPage = () => {
    return (
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <Text type="secondary">Rows per page:</Text>
        <Select
          value={pageSize}
          onChange={(value) => onPageChange(1, value)}
          style={{ width: "80px" }}
        >
          <Option value={5}>5</Option>
          <Option value={10}>10</Option>
          <Option value={15}>15</Option>
          <Option value={20}>20</Option>
        </Select>
      </div>
    );
  };

  return (
    <div style={{ padding: "20px" }}>
      {contextHolder}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={handleBack}
            style={{ marginRight: "8px" }}
          >
            Back
          </Button>
          <DrugSupplierIcon style={{ fontSize: "24px" }} />
          <h3 className="text-xl font-bold">Drug Supplier Management</h3>
        </div>
      </div>

      {initialLoading ? (
        <div style={{ textAlign: "center", padding: "50px" }}>
          <Spin size="large" tip="Loading suppliers..." />
        </div>
      ) : (
        <div>
          <Spin spinning={loading} tip={loadingMessage}>
            <Card
              className="shadow mb-4"
              bodyStyle={{ padding: "16px" }}
              title={
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "16px 0 0 0",
                  }}
                >
                  <AppstoreOutlined />
                  <span>Toolbar</span>
                </div>
              }
            >
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Select
                      showSearch
                      allowClear
                      placeholder={
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <SearchOutlined style={{ marginRight: 8 }} />
                          <span>Search by supplier name...</span>
                        </div>
                      }
                      value={filterValue || undefined}
                      onChange={handleSearchSelectChange}
                      style={{ width: "300px" }}
                      filterOption={(input, option) =>
                        (
                          option?.label?.toString().toLowerCase() ?? ""
                        ).includes(input.toLowerCase())
                      }
                      options={suppliers.map((supplier) => ({
                        value: supplier.supplierName,
                        label: supplier.supplierName,
                      }))}
                    />

                    <Tooltip title="Advanced Filters">
                      <Button
                        icon={
                          <FilterOutlined
                            style={{
                              color:
                                advancedFilters !== initialAdvancedFilters
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

                    <Select
                      mode="multiple"
                      allowClear
                      style={{ width: "120px" }}
                      placeholder={
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <TagOutlined style={{ marginRight: 8 }} />
                          <span>Status</span>
                        </div>
                      }
                      value={statusFilter}
                      onChange={handleStatusFilterChange}
                      options={statusOptions}
                      maxTagCount="responsive"
                    />

                    <Tooltip title="Reset All Filters">
                      <Button
                        icon={<UndoOutlined />}
                        onClick={handleResetFilters}
                        disabled={
                          !filterValue &&
                          statusFilter.length === 0 &&
                          !sorter &&
                          advancedFilters === initialAdvancedFilters
                        }
                      >
                        Reset
                      </Button>
                    </Tooltip>

                    <Dropdown
                      overlay={
                        <Menu>
                          <Menu.Item key="selectAll">
                            <Checkbox
                              checked={areAllColumnsVisible()}
                              onChange={(e) =>
                                toggleAllColumns(e.target.checked)
                              }
                            >
                              Toggle All
                            </Checkbox>
                          </Menu.Item>
                          <Menu.Divider />
                          {staticColumns
                            .filter((col) => col.key !== "actions")
                            .map((column) => (
                              <Menu.Item key={column.key}>
                                <Checkbox
                                  checked={
                                    !!columnVisibility[column.key as string]
                                  }
                                  onChange={() =>
                                    handleColumnVisibilityChange(
                                      column.key as string
                                    )
                                  }
                                >
                                  <span
                                    style={{
                                      color: "dimgray",
                                      fontWeight: "normal",
                                    }}
                                  >
                                    {React.isValidElement(column.title)
                                      ? (
                                          column.title as React.ReactElement<{
                                            children: React.ReactNode;
                                          }>
                                        ).props.children
                                      : column.title}
                                  </span>
                                </Checkbox>
                              </Menu.Item>
                            ))}
                          <Menu.Item key="actions">
                            <Checkbox
                              checked={!!columnVisibility.actions}
                              onChange={() =>
                                handleColumnVisibilityChange("actions")
                              }
                            >
                              <span
                                style={{
                                  color: "dimgray",
                                  fontWeight: "normal",
                                }}
                              >
                                Actions
                              </span>
                            </Checkbox>
                          </Menu.Item>
                        </Menu>
                      }
                      trigger={["click"]}
                      open={dropdownOpen}
                      onOpenChange={handleDropdownVisibleChange}
                    >
                      <Tooltip title="Column Settings">
                        <Button icon={<SettingOutlined />}>Columns</Button>
                      </Tooltip>
                    </Dropdown>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => setIsModalOpen(true)}
                      disabled={loading}
                    >
                      Create
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="primary"
                      icon={<FileExcelOutlined />}
                      onClick={handleOpenExportConfig}
                      disabled={loading}
                    >
                      Export to Excel
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Container cho cả selected info và rows per page */}
            <div className="mb-4 py-2 flex justify-between items-center">
              <div>{renderSelectedInfo()}</div>
              <div>{renderRowsPerPage()}</div>
            </div>

            <Card
              className="mt-4 shadow-sm"
              bodyStyle={{ padding: "8px 16px" }}
            >
              <div style={{ overflowX: "auto" }}>
                <Table<DrugSupplierResponse>
                  rowKey="id"
                  columns={columns}
                  dataSource={paginatedSuppliers}
                  loading={loading}
                  rowSelection={rowSelection}
                  pagination={false}
                  onChange={handleTableChange}
                  scroll={{ x: "max-content" }}
                  bordered
                />
              </div>
              <Card className="mt-4 shadow-sm">
                <Row justify="center" align="middle">
                  <Space size="large" align="center">
                    <Text type="secondary">
                      Total {filteredAndSortedSuppliers.length} items
                    </Text>
                    <Space align="center" size="large">
                      <Pagination
                        current={currentPage}
                        pageSize={pageSize}
                        total={filteredAndSortedSuppliers.length}
                        onChange={(page) => onPageChange(page, pageSize)}
                        showSizeChanger={false}
                        showTotal={() => ""}
                      />
                      <Space align="center">
                        <Text type="secondary">Go to page:</Text>
                        <InputNumber
                          min={1}
                          max={Math.max(
                            1,
                            Math.ceil(
                              filteredAndSortedSuppliers.length / pageSize
                            )
                          )}
                          value={currentPage}
                          onPressEnter={(
                            e: React.KeyboardEvent<HTMLInputElement>
                          ) => {
                            const value = Number(
                              (e.target as HTMLInputElement).value
                            );
                            if (
                              value > 0 &&
                              value <=
                                Math.ceil(
                                  filteredAndSortedSuppliers.length / pageSize
                                )
                            ) {
                              onPageChange(value, pageSize);
                            }
                          }}
                          onChange={(value) => {
                            if (
                              value &&
                              Number(value) > 0 &&
                              Number(value) <=
                                Math.ceil(
                                  filteredAndSortedSuppliers.length / pageSize
                                )
                            ) {
                              onPageChange(Number(value), pageSize);
                            }
                          }}
                          style={{ width: "60px" }}
                        />
                      </Space>
                    </Space>
                  </Space>
                </Row>
              </Card>
            </Card>
          </Spin>
        </div>
      )}

      <Modal
        title="Add New Drug Supplier"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
        width={500}
      >
        <CreateDrugSupplierForm
          onClose={() => setIsModalOpen(false)}
          onCreate={handleCreateSuccess}
        />
      </Modal>

      <Modal
        title="Edit Drug Supplier"
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        footer={null}
        destroyOnClose
        width={500}
      >
        {editingSupplierId && (
          <EditDrugSupplierForm
            drugSupplierId={editingSupplierId}
            onClose={() => setIsEditModalOpen(false)}
            onUpdate={handleUpdateSuccess}
          />
        )}
      </Modal>

      <DrugSupplierFilterModal
        visible={filterModalVisible}
        onCancel={() => setFilterModalVisible(false)}
        onApply={handleApplyAdvancedFilters}
        onReset={handleResetAdvancedFilters}
        initialFilters={advancedFilters}
      />

      <Modal
        title={`Confirm ${
          confirmAction === "activate" ? "Activation" : "Deactivation"
        }`}
        open={isConfirmModalOpen}
        onCancel={() => setIsConfirmModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsConfirmModalOpen(false)}>
            Cancel
          </Button>,
          <Button
            key="confirm"
            type={confirmAction === "activate" ? "primary" : "primary"}
            danger={confirmAction === "deactivate"}
            onClick={handleConfirmAction}
          >
            Confirm
          </Button>,
        ]}
      >
        <p>
          Are you sure you want to{" "}
          {confirmAction === "activate" ? "activate" : "deactivate"} the
          selected suppliers?
        </p>
      </Modal>

      <ExportConfigModal
        visible={exportModalVisible}
        onClose={() => setExportModalVisible(false)}
        config={exportConfig}
        onChange={handleExportConfigChange}
        filters={{
          filterValue,
          statusFilter,
          advancedFilters,
          currentPage,
          pageSize,
        }}
        suppliers={suppliers}
        statusOptions={statusOptions}
      />
    </div>
  );
}
