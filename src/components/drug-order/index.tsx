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
  TagProps,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  DownOutlined,
  UndoOutlined,
  FilterOutlined,
  SettingOutlined,
  AppstoreOutlined,
  TagOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
  EyeOutlined,
  ArrowLeftOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";
import type { CheckboxChangeEvent } from "antd/es/checkbox";
import dayjs from "dayjs";
import {
  getDrugOrders,
  DrugOrderResponse,
  approveDrugOrders,
  rejectDrugOrders,
  completeDrugOrders,
  DrugOrderQueryParams,
  exportDrugOrdersToExcel,
  DrugOrderExportConfigDTO,
} from "@/api/drugorder";
import api from "@/api/customize-axios";
import { CreateDrugOrderForm } from "./CreateForm";
import { EditDrugOrderForm } from "./EditForm";
import { useRouter } from "next/router";
import {
  DrugSupplierResponse,
  getDrugSupplierById,
  getDrugSuppliers,
} from "@/api/drugsupplier";
import DrugSupplierDetailsModal from "../drug-supplier/DrugSupplierDetailsModal";
import type { FilterValue, SorterResult } from "antd/es/table/interface";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import { DrugOrderIcon } from "./Icons";
import ExportConfigModal from "./ExportConfigModal";
import DrugOrderFilterModal, {
  DrugOrderAdvancedFilters,
} from "./DrugOrderFilterModal";

// Extend dayjs with the plugins
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

const { Option } = Select;
const { confirm } = Modal;
const { Text, Title } = Typography;

export function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
}

const staticColumns = [
  {
    title: (
      <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
        Order Code
      </span>
    ),
    dataIndex: "drugOrderCode",
    key: "drugOrderCode",
    sorter: (a: DrugOrderResponse, b: DrugOrderResponse) =>
      a.drugOrderCode.localeCompare(b.drugOrderCode),
    sortDirections: ["ascend", "descend"] as ("ascend" | "descend")[],
  },
  {
    title: (
      <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
        Supplier
      </span>
    ),
    dataIndex: "supplier",
    key: "supplier",
    sorter: (a: DrugOrderResponse, b: DrugOrderResponse) =>
      a.supplier.supplierName.localeCompare(b.supplier.supplierName),
    sortDirections: ["ascend", "descend"] as ("ascend" | "descend")[],
  },
  {
    title: (
      <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
        Order Date
      </span>
    ),
    dataIndex: "orderDate",
    key: "orderDate",
    sorter: (a: DrugOrderResponse, b: DrugOrderResponse) =>
      dayjs(a.orderDate).unix() - dayjs(b.orderDate).unix(),
    render: (date: string) => (date ? dayjs(date).format("DD/MM/YYYY") : "-"),
    sortDirections: ["descend", "ascend"] as ("ascend" | "descend")[],
    defaultSortOrder: "descend" as "descend",
  },
  {
    title: (
      <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
        Total Quantity
      </span>
    ),
    dataIndex: "totalQuantity",
    key: "totalQuantity",
    sorter: (a: DrugOrderResponse, b: DrugOrderResponse) =>
      a.totalQuantity - b.totalQuantity,
    sortDirections: ["ascend", "descend"] as ("ascend" | "descend")[],
  },
  {
    title: (
      <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
        Total Price
      </span>
    ),
    dataIndex: "totalPrice",
    key: "totalPrice",
    sorter: (a: DrugOrderResponse, b: DrugOrderResponse) =>
      a.totalPrice - b.totalPrice,
    render: (price: number) => formatPrice(price),
    sortDirections: ["ascend", "descend"] as ("ascend" | "descend")[],
  },
  {
    title: (
      <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
        Created By
      </span>
    ),
    dataIndex: "createdBy",
    key: "createdBy",
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
  { label: "Pending", value: "Pending" },
  { label: "Approved", value: "Approved" },
  { label: "Rejected", value: "Rejected" },
  { label: "Completed", value: "Completed" },
];

const statusColorMap = {
  Pending: "warning",
  Approved: "processing",
  Rejected: "error",
  Completed: "success",
};

const roleColorMap: Record<string, TagProps["color"]> = {
  Admin: "danger",
  Manager: "warning",
  Staff: "primary",
  User: "success",
  Unknown: "default",
};

const INITIAL_COLUMN_VISIBILITY: Record<string, boolean> = {
  drugOrderCode: true,
  supplier: true,
  orderDate: true,
  totalQuantity: true,
  totalPrice: true,
  createdBy: true,
  status: true,
  actions: true,
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

// Define type for drug order code options
export interface DrugOrderCodeOption {
  value: string;
  label: string;
  orderDate: string;
}

export function DrugOrders() {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(
    "Loading drug orders..."
  );

  const [drugOrders, setDrugOrders] = useState<DrugOrderResponse[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filterValue, setFilterValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [sorter, setSorter] = useState<
    SorterResult<DrugOrderResponse> | SorterResult<DrugOrderResponse>[]
  >({
    field: "orderDate",
    order: "descend",
  } as SorterResult<DrugOrderResponse>);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [showApproveButton, setShowApproveButton] = useState(false);
  const [showRejectButton, setShowRejectButton] = useState(false);
  const [showCompleteButton, setShowCompleteButton] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    "approve" | "reject" | "complete" | null
  >(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string>("");

  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(INITIAL_COLUMN_VISIBILITY);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // State for supplier details modal
  const [selectedSupplier, setSelectedSupplier] =
    useState<DrugSupplierResponse | null>(null);
  const [isSupplierDetailsModalOpen, setIsSupplierDetailsModalOpen] =
    useState(false);

  // Selection helper variables
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isLoadingAllItems, setIsLoadingAllItems] = useState<boolean>(false);

  // Export to Excel state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportConfig, setExportConfig] = useState<DrugOrderExportConfigDTO>({
    exportAllPages: false,
    includeDrugOrderCode: true,
    includeSupplier: true,
    includeOrderDate: true,
    includeTotalQuantity: true,
    includeTotalPrice: true,
    includeCreatedBy: true,
    includeCreatedAt: true,
    includeUpdatedAt: true,
    includeStatus: true,
  });

  // State for filter data in export modal
  const [drugOrderCodes, setDrugOrderCodes] = useState<DrugOrderCodeOption[]>(
    []
  );
  const [supplierOptions, setSupplierOptions] = useState<
    { id: string; supplierName: string }[]
  >([]);

  // Add the advanced filter state
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] =
    useState<DrugOrderAdvancedFilters>({
      orderDateRange: [null, null],
      createdDateRange: [null, null],
      updatedDateRange: [null, null],
      sortBy: "orderDate",
      ascending: false,
    });

  const initialAdvancedFilters: DrugOrderAdvancedFilters = {
    orderDateRange: [null, null],
    createdDateRange: [null, null],
    updatedDateRange: [null, null],
    sortBy: "orderDate",
    ascending: false,
  };

  const fetchDrugOrders = useCallback(async () => {
    if (initialLoading) {
      setLoadingMessage("Loading drug orders...");
    }
    setLoading(true);
    try {
      // Create query parameters object based on filters and sorting
      const queryParams = {
        page: currentPage,
        pageSize: pageSize,
        drugOrderCodeSearch: filterValue || undefined,
        status: statusFilter.length > 0 ? statusFilter[0] : undefined,
        sortBy:
          advancedFilters.sortBy ||
          (Array.isArray(sorter)
            ? "orderDate"
            : (sorter?.field as string) || "orderDate"),
        ascending:
          advancedFilters.ascending !== undefined
            ? advancedFilters.ascending
            : Array.isArray(sorter)
            ? false
            : sorter?.order === "ascend",
        supplierId: advancedFilters.supplierId,
        minTotalPrice: advancedFilters.minTotalPrice,
        maxTotalPrice: advancedFilters.maxTotalPrice,
        orderStartDate: advancedFilters.orderDateRange[0]
          ? advancedFilters.orderDateRange[0].format("YYYY-MM-DD")
          : undefined,
        orderEndDate: advancedFilters.orderDateRange[1]
          ? advancedFilters.orderDateRange[1].format("YYYY-MM-DD")
          : undefined,
        createdStartDate: advancedFilters.createdDateRange[0]
          ? advancedFilters.createdDateRange[0].format("YYYY-MM-DD")
          : undefined,
        createdEndDate: advancedFilters.createdDateRange[1]
          ? advancedFilters.createdDateRange[1].format("YYYY-MM-DD")
          : undefined,
        updatedStartDate: advancedFilters.updatedDateRange[0]
          ? advancedFilters.updatedDateRange[0].format("YYYY-MM-DD")
          : undefined,
        updatedEndDate: advancedFilters.updatedDateRange[1]
          ? advancedFilters.updatedDateRange[1].format("YYYY-MM-DD")
          : undefined,
      };

      // Ghi log để kiểm tra xem các tham số đã đúng chưa
      console.log("API request params:", {
        sortBy: queryParams.sortBy,
        ascending: queryParams.ascending,
      });

      const response = await getDrugOrders(queryParams);
      if (response.isSuccess) {
        setDrugOrders(response.data);
        setTotalItems(response.totalRecords);
      } else {
        messageApi.error(response.message || "Failed to fetch drug orders", 5);
      }
    } catch (error) {
      messageApi.error("Failed to fetch drug orders", 5);
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [
    messageApi,
    initialLoading,
    currentPage,
    pageSize,
    filterValue,
    statusFilter,
    sorter,
    advancedFilters,
  ]);

  useEffect(() => {
    fetchDrugOrders();
  }, [fetchDrugOrders]);

  // Thêm useEffect mới để đảm bảo thứ tự sắp xếp mặc định khi tải trang
  useEffect(() => {
    // Chỉ thực hiện khi lần đầu tiên tải trang
    if (initialLoading) {
      // Thiết lập sắp xếp mặc định là orderDate giảm dần
      setSorter({
        field: "orderDate",
        order: "descend",
      } as SorterResult<DrugOrderResponse>);
    }
  }, [initialLoading]);

  useEffect(() => {
    if (selectedRowKeys.length > 0) {
      const selectedOrdersData = drugOrders.filter((order) =>
        selectedRowKeys.includes(order.id)
      );
      const hasPending = selectedOrdersData.some(
        (order) => order.status === "Pending"
      );
      const hasApproved = selectedOrdersData.some(
        (order) => order.status === "Approved"
      );

      setShowApproveButton(hasPending);
      setShowRejectButton(hasPending || hasApproved);
      setShowCompleteButton(hasApproved);
    } else {
      setShowApproveButton(false);
      setShowRejectButton(false);
      setShowCompleteButton(false);
    }
  }, [selectedRowKeys, drugOrders]);

  const hasSearchFilter = Boolean(filterValue);

  const areAllColumnsVisible = () => {
    return staticColumns.every(
      (col) => !col.key || col.key === "actions" || columnVisibility[col.key]
    );
  };

  const headerColumns = React.useMemo(() => {
    if (areAllColumnsVisible()) return staticColumns;

    return staticColumns.filter(
      (column) => columnVisibility[column.key as string]
    );
  }, [columnVisibility]);

  const filteredAndSortedOrders = useMemo(() => {
    // Backend is now handling filtering and sorting
    return drugOrders;
  }, [drugOrders]);

  const paginatedOrders = useMemo(() => {
    // Backend is now handling pagination
    return filteredAndSortedOrders;
  }, [filteredAndSortedOrders]);

  const handleTableChange: TableProps<DrugOrderResponse>["onChange"] = (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    newSorter:
      | SorterResult<DrugOrderResponse>
      | SorterResult<DrugOrderResponse>[]
  ) => {
    const statusFilters = (filters.status as FilterValue) || [];
    setStatusFilter(statusFilters.map(String));

    // Log the sorter info for debugging
    console.log("Table sort changed:", newSorter);

    // Xử lý trường hợp người dùng bỏ chọn sắp xếp (trở về mặc định)
    if (Array.isArray(newSorter) || !newSorter.order) {
      // Nếu không có sắp xếp, thiết lập về mặc định là orderDate giảm dần
      setSorter({
        field: "orderDate",
        order: "descend",
      } as SorterResult<DrugOrderResponse>);
    } else {
      // Nếu có sắp xếp, cập nhật sorter state
      setSorter(newSorter);
    }

    // Reset page to 1 when filters or sorter change
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setFilterValue(value);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilterValue("");
    setStatusFilter([]);
    setSorter({
      field: "orderDate",
      order: "descend",
    } as SorterResult<DrugOrderResponse>);
    setAdvancedFilters(initialAdvancedFilters);
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
    updatePageInUrl(page);
  };

  const handleOpenEditModal = (id: string) => {
    setEditingOrderId(id);
    setIsEditModalOpen(true);
  };

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    fetchDrugOrders();
    messageApi.success("Drug order added successfully", 5);
  };

  const handleUpdateSuccess = () => {
    setIsEditModalOpen(false);
    setEditingOrderId("");
    fetchDrugOrders();
    messageApi.success("Drug order updated successfully", 5);
  };

  const handleOpenDetails = async (id: string) => {
    try {
      const supplier = await getDrugSupplierById(id);
      setSelectedSupplier(supplier);
      setIsSupplierDetailsModalOpen(true);
    } catch (error) {
      messageApi.error("Failed to load supplier details", 5);
    }
  };

  const showConfirm = (
    action: "approve" | "reject" | "complete",
    onOk: () => void
  ) => {
    const selectedOrdersData = drugOrders.filter((o) =>
      selectedRowKeys.includes(o.id)
    );

    let targetStatus = "";
    let count = 0;

    if (action === "approve") {
      targetStatus = "Pending";
      count = selectedOrdersData.filter(
        (o) => o.status === targetStatus
      ).length;
    } else if (action === "reject") {
      count = selectedOrdersData.filter(
        (o) => o.status === "Pending" || o.status === "Approved"
      ).length;
    } else if (action === "complete") {
      targetStatus = "Approved";
      count = selectedOrdersData.filter(
        (o) => o.status === targetStatus
      ).length;
    }

    if (count === 0) {
      messageApi.warning(`No orders with valid status selected.`, 5);
      return;
    }

    setConfirmAction(action);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmAction = () => {
    if (confirmAction === "approve") {
      handleApprove();
    } else if (confirmAction === "reject") {
      handleReject();
    } else if (confirmAction === "complete") {
      handleComplete();
    }

    setIsConfirmModalOpen(false);
    setConfirmAction(null);
  };

  const handleApprove = async () => {
    const idsToApprove = drugOrders
      .filter((o) => selectedRowKeys.includes(o.id) && o.status === "Pending")
      .map((o) => o.id);

    if (idsToApprove.length === 0) return;

    setLoadingMessage("Approving orders...");
    setLoading(true);
    try {
      await approveDrugOrders(idsToApprove);
      messageApi.success("Drug orders approved successfully", 5);

      // Update local state instead of refetching
      setDrugOrders((prevOrders) =>
        prevOrders.map((order) =>
          idsToApprove.includes(order.id)
            ? {
                ...order,
                status: "Approved",
                updatedAt: new Date().toISOString(),
              }
            : order
        )
      );

      setSelectedRowKeys([]); // Clear selection
    } catch (error) {
      messageApi.error("Failed to approve drug orders", 5);
      console.error("Error approving drug orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    const idsToReject = drugOrders
      .filter(
        (o) =>
          selectedRowKeys.includes(o.id) &&
          (o.status === "Pending" || o.status === "Approved")
      )
      .map((o) => o.id);

    if (idsToReject.length === 0) return;

    setLoadingMessage("Rejecting orders...");
    setLoading(true);
    try {
      await rejectDrugOrders(idsToReject);
      messageApi.success("Drug orders rejected successfully", 5);

      // Update local state instead of refetching
      setDrugOrders((prevOrders) =>
        prevOrders.map((order) =>
          idsToReject.includes(order.id)
            ? {
                ...order,
                status: "Rejected",
                updatedAt: new Date().toISOString(),
              }
            : order
        )
      );

      setSelectedRowKeys([]); // Clear selection
    } catch (error) {
      messageApi.error("Failed to reject drug orders", 5);
      console.error("Error rejecting drug orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    const idsToComplete = drugOrders
      .filter((o) => selectedRowKeys.includes(o.id) && o.status === "Approved")
      .map((o) => o.id);

    if (idsToComplete.length === 0) return;

    setLoadingMessage("Completing orders...");
    setLoading(true);
    try {
      await completeDrugOrders(idsToComplete);
      messageApi.success("Drug orders completed successfully", 5);

      // Update local state instead of refetching
      setDrugOrders((prevOrders) =>
        prevOrders.map((order) =>
          idsToComplete.includes(order.id)
            ? {
                ...order,
                status: "Completed",
                updatedAt: new Date().toISOString(),
              }
            : order
        )
      );

      setSelectedRowKeys([]); // Clear selection
    } catch (error) {
      messageApi.error("Failed to complete drug orders", 5);
      console.error("Error completing drug orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const queryPage = Number(router.query.page) || 1;
    if (queryPage !== currentPage) {
      setCurrentPage(queryPage);
    }
  }, [router.query.page, currentPage]);

  const updatePageInUrl = (newPage: number) => {
    const query = { ...router.query };

    if (newPage === 1) {
      // Remove page parameter if it's the default page
      delete query.page;
    } else {
      query.page = newPage.toString();
    }

    router.push(
      {
        pathname: router.pathname,
        query: query,
      },
      undefined,
      { shallow: true }
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString("vi-VN")} ${date.getHours()}:${String(
      date.getMinutes()
    ).padStart(2, "0")}`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      currencyDisplay: "code",
    }).format(price);
  };

  const columns: TableProps<DrugOrderResponse>["columns"] = useMemo(() => {
    const actionColumn = {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          ACTIONS
        </span>
      ),
      key: "actions",
      align: "center" as const,
      render: (_: any, record: DrugOrderResponse) => (
        <Space
          size="small"
          style={{ display: "flex", justifyContent: "center" }}
        >
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleOpenEditModal(record.id);
              }}
              disabled={record.status !== "Pending"}
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
        if (col.key === "drugOrderCode") {
          return {
            ...col,
            render: (text: string, record: DrugOrderResponse) => (
              <span
                className="text-primary cursor-pointer hover:underline"
                onClick={() =>
                  router.push(`/drug-order/details?id=${record.id}`)
                }
              >
                {text}
              </span>
            ),
          };
        }
        if (col.key === "supplier") {
          return {
            ...col,
            render: (supplier: any, record: DrugOrderResponse) => (
              <span
                className="text-primary cursor-pointer hover:underline"
                onClick={() => handleOpenDetails(supplier.id)}
              >
                {supplier.supplierName}
              </span>
            ),
          };
        }
        if (col.key === "status") {
          return {
            ...col,
            render: (status: string) => (
              <Tag
                color={statusColorMap[status as keyof typeof statusColorMap]}
              >
                {status ? status.toUpperCase() : ""}
              </Tag>
            ),
          };
        }
        if (col.key === "createdBy") {
          return {
            ...col,
            render: (createdBy: any) => (
              <div>
                <div>{createdBy.userName}</div>
                <Tag color="blue">{createdBy.role}</Tag>
              </div>
            ),
          };
        }
        if (col.key === "totalPrice") {
          return {
            ...col,
            render: (price: number) => formatPrice(price),
          };
        }
        if (
          col.key === "orderDate" ||
          col.key === "createdAt" ||
          col.key === "updatedAt"
        ) {
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

  const renderSelectAll = () => {
    // Count orders by status
    const pendingCount = paginatedOrders.filter(
      (order) => order.status === "Pending"
    ).length;
    const approvedCount = paginatedOrders.filter(
      (order) => order.status === "Approved"
    ).length;

    // Count selectable orders
    const selectableOrders = paginatedOrders;

    const isSelectAll =
      selectableOrders.length > 0 &&
      selectableOrders.every((order) => selectedRowKeys.includes(order.id));

    const isIndeterminate =
      selectedRowKeys.length > 0 &&
      !isSelectAll &&
      selectableOrders.some((order) => selectedRowKeys.includes(order.id));

    // Create dropdown menu items
    const items = [];

    // Add Pending options
    if (pendingCount > 0) {
      items.push({
        key: "page-pending",
        label: (
          <div
            className={
              selectedOption === "page-pending"
                ? "ant-dropdown-menu-item-active"
                : ""
            }
          >
            Select all Pending on this page ({pendingCount})
          </div>
        ),
      });

      items.push({
        key: "all-pending",
        label: (
          <div
            className={
              selectedOption === "all-pending"
                ? "ant-dropdown-menu-item-active"
                : ""
            }
          >
            {isLoadingAllItems && selectedOption === "all-pending" ? (
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Spin size="small" />
                <span>Loading all Pending...</span>
              </div>
            ) : (
              <span>Select all Pending (all pages)</span>
            )}
          </div>
        ),
      });
    }

    // Add Approved options
    if (approvedCount > 0) {
      items.push({
        key: "page-approved",
        label: (
          <div
            className={
              selectedOption === "page-approved"
                ? "ant-dropdown-menu-item-active"
                : ""
            }
          >
            Select all Approved on this page ({approvedCount})
          </div>
        ),
      });

      items.push({
        key: "all-approved",
        label: (
          <div
            className={
              selectedOption === "all-approved"
                ? "ant-dropdown-menu-item-active"
                : ""
            }
          >
            {isLoadingAllItems && selectedOption === "all-approved" ? (
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Spin size="small" />
                <span>Loading all Approved...</span>
              </div>
            ) : (
              <span>Select all Approved (all pages)</span>
            )}
          </div>
        ),
      });
    }

    // Handle select all toggle
    const handleSelectAllToggle = (e: CheckboxChangeEvent) => {
      // Disabled function
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

  const renderSelectedInfo = () => {
    if (selectedRowKeys.length === 0) return null;

    return (
      <Space>
        <Text>{selectedRowKeys.length} items selected</Text>
        <Button icon={<UndoOutlined />} onClick={() => setSelectedRowKeys([])}>
          Restore
        </Button>

        {showApproveButton && (
          <Button
            className="bg-success-100 text-primary border-primary"
            onClick={() => showConfirm("approve", handleApprove)}
            disabled={loading}
          >
            Approve Selected
          </Button>
        )}

        {showRejectButton && (
          <Button
            className="bg-danger-100 text-danger border-danger"
            onClick={() => showConfirm("reject", handleReject)}
            disabled={loading}
          >
            Reject Selected
          </Button>
        )}

        {showCompleteButton && (
          <Button
            className="bg-success-100 text-success border-success"
            onClick={() => showConfirm("complete", handleComplete)}
            disabled={loading}
          >
            Complete Selected
          </Button>
        )}
      </Space>
    );
  };

  // Function to render rows per page
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

  const handleDropdownVisibleChange = (visible: boolean) => {
    setDropdownOpen(visible);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Get IDs by status for selection
  const getItemIdsByStatus = async (
    statuses: string[],
    currentPageOnly: boolean
  ): Promise<React.Key[]> => {
    try {
      if (currentPageOnly) {
        // Only get IDs on the current page by status
        return paginatedOrders
          .filter((order) => order.status && statuses.includes(order.status))
          .map((order) => order.id);
      } else {
        // For getting all items, we need to make a separate API call to fetch all items matching status
        setIsLoadingAllItems(true);
        try {
          const allStatusParams = {
            page: 1,
            pageSize: 1000, // A large value to get all items, backend should handle this properly
            status: statuses.length > 0 ? statuses[0] : undefined,
          };
          const response = await getDrugOrders(allStatusParams);
          setIsLoadingAllItems(false);
          return response.data.map((order) => order.id);
        } catch (error) {
          console.error("Error fetching all items by status:", error);
          setIsLoadingAllItems(false);
          return [];
        }
      }
    } catch (error) {
      console.error("Error getting IDs by status:", error);
      return [];
    }
  };

  // Handle selection by status
  const handleSelectByStatus = async (key: string) => {
    // Check if this option is already selected
    if (selectedOption === key) {
      // If already selected, unselect and clear selections
      setSelectedOption(null);
      setSelectedRowKeys([]);
    } else {
      // If not, select it and apply selection
      setSelectedOption(key);

      switch (key) {
        case "page-pending":
          const pagePendingIds = await getItemIdsByStatus(["Pending"], true);
          setSelectedRowKeys(pagePendingIds);
          break;
        case "all-pending":
          const allPendingIds = await getItemIdsByStatus(["Pending"], false);
          setSelectedRowKeys(allPendingIds);
          break;
        case "page-approved":
          const pageApprovedIds = await getItemIdsByStatus(["Approved"], true);
          setSelectedRowKeys(pageApprovedIds);
          break;
        case "all-approved":
          const allApprovedIds = await getItemIdsByStatus(["Approved"], false);
          setSelectedRowKeys(allApprovedIds);
          break;
        default:
          break;
      }
    }
  };

  // Load drug order codes and suppliers for export modal
  useEffect(() => {
    const loadExportOptions = async () => {
      try {
        // Get all drug orders to extract codes
        const response = await getDrugOrders({
          page: 1,
          pageSize: 1000,
        });

        if (response.isSuccess) {
          // Create code options with the consistent format
          const codeOptions = response.data.map((order) => ({
            value: order.drugOrderCode,
            label: order.drugOrderCode,
            orderDate: order.orderDate,
          }));

          // Sort by order date, newest first
          codeOptions.sort(
            (a, b) =>
              new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
          );

          setDrugOrderCodes(codeOptions);
        }

        // Get suppliers
        const suppliersData = await getDrugSuppliers();
        setSupplierOptions(
          suppliersData.map((supplier: DrugSupplierResponse) => ({
            id: supplier.id,
            supplierName: supplier.supplierName,
          }))
        );
      } catch (error) {
        console.error("Error loading export options:", error);
      }
    };

    loadExportOptions();
  }, []);

  // Handle export to Excel
  const handleExportToExcel = async () => {
    try {
      setExportLoading(true);

      // Create query parameters similar to fetchDrugOrders
      const queryParams = {
        page: exportConfig.exportAllPages ? 1 : currentPage,
        pageSize: exportConfig.exportAllPages ? 1000 : pageSize, // Large number to get all if exportAllPages is true
        drugOrderCodeSearch: filterValue || undefined,
        status: statusFilter.length > 0 ? statusFilter[0] : undefined,
        sortBy: Array.isArray(sorter)
          ? "createdAt"
          : (sorter?.field as string) || "createdAt",
        ascending: Array.isArray(sorter) ? false : sorter?.order === "ascend",
        orderStartDate: undefined,
        orderEndDate: undefined,
        createdStartDate: undefined,
        createdEndDate: undefined,
        updatedStartDate: undefined,
        updatedEndDate: undefined,
      };

      // Request the export URL from the API
      const response = await exportDrugOrdersToExcel(exportConfig, queryParams);

      console.log("Export response in component:", response);

      if (response.success || response.isSuccess) {
        messageApi.success("Drug orders exported to Excel successfully");
        setIsExportModalOpen(false);

        // If we have a URL in the data property, open it
        if (response.data && typeof response.data === "string") {
          console.log("Opening URL:", response.data);
          window.open(response.data, "_blank");
        } else {
          messageApi.error("No download URL provided by the server");
        }
      } else {
        messageApi.error(response.message || "Failed to export Excel file");
      }
    } catch (error) {
      console.error("Export error:", error);
      messageApi.error("Failed to export data");
    } finally {
      setExportLoading(false);
    }
  };

  // Handle opening the filter modal
  const handleOpenFilterModal = () => {
    setIsFilterModalOpen(true);
  };

  // Handle applying advanced filters
  const handleApplyAdvancedFilters = (filters: DrugOrderAdvancedFilters) => {
    setAdvancedFilters(filters);
    setIsFilterModalOpen(false);
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Handle resetting advanced filters
  const handleResetAdvancedFilters = () => {
    setAdvancedFilters(initialAdvancedFilters);
    setIsFilterModalOpen(false);
    setCurrentPage(1);
  };

  // Check if any advanced filters are applied
  const hasAdvancedFilters = () => {
    return (
      advancedFilters.status !== undefined ||
      advancedFilters.supplierId !== undefined ||
      advancedFilters.minTotalPrice !== undefined ||
      advancedFilters.maxTotalPrice !== undefined ||
      advancedFilters.orderDateRange[0] !== null ||
      advancedFilters.orderDateRange[1] !== null ||
      advancedFilters.createdDateRange[0] !== null ||
      advancedFilters.createdDateRange[1] !== null ||
      advancedFilters.updatedDateRange[0] !== null ||
      advancedFilters.updatedDateRange[1] !== null ||
      advancedFilters.sortBy !== initialAdvancedFilters.sortBy ||
      advancedFilters.ascending !== initialAdvancedFilters.ascending
    );
  };

  // Add an additional useEffect that runs only once when the component mounts
  useEffect(() => {
    // Apply default sorting when the component mounts
    const orderDateColumn = staticColumns.find(
      (col) => col.key === "orderDate"
    );
    if (orderDateColumn) {
      setSorter({
        field: "orderDate",
        order: "descend",
      } as SorterResult<DrugOrderResponse>);
    }
  }, []); // Empty dependency array ensures this runs only once

  return (
    <div style={{ padding: "20px" }}>
      {contextHolder}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.back()}
            style={{ marginRight: "8px" }}
          >
            Back
          </Button>
          <span style={{ fontSize: "24px" }}>
            <DrugOrderIcon />
          </span>
          <h3 className="text-xl font-bold">Drug Order Management</h3>
        </div>
      </div>

      {initialLoading ? (
        <div style={{ textAlign: "center", padding: "50px" }}>
          <Spin size="large" tip="Loading orders..." />
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
                          <span>Search by order code...</span>
                        </div>
                      }
                      style={{ width: "300px" }}
                      value={filterValue || undefined}
                      onChange={handleSearchChange}
                      options={drugOrderCodes}
                      filterOption={(input, option) =>
                        (option?.label?.toString() || "")
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                    />

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

                    <Tooltip title="Advanced Filters">
                      <Button
                        icon={
                          <FilterOutlined
                            style={{
                              color: hasAdvancedFilters()
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

                    <Tooltip title="Reset All Filters">
                      <Button
                        icon={<UndoOutlined />}
                        onClick={handleResetFilters}
                        disabled={
                          !filterValue &&
                          statusFilter.length === 0 &&
                          !sorter &&
                          !hasAdvancedFilters()
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
                      onClick={() => setIsCreateModalOpen(true)}
                      disabled={loading}
                    >
                      Create
                    </Button>
                  </div>

                  <div className="flex items-center">
                    <Tooltip title="Export to Excel">
                      <Button
                        icon={<FileExcelOutlined />}
                        onClick={() => setIsExportModalOpen(true)}
                        type="primary"
                      >
                        Export To Excel
                      </Button>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </Card>

            {/* Container for selected info and rows per page */}
            <div className="mb-4 py-2 flex justify-between items-center">
              <div>{renderSelectedInfo()}</div>
              <div>{renderRowsPerPage()}</div>
            </div>

            <Card
              className="mt-4 shadow-sm"
              bodyStyle={{ padding: "8px 16px" }}
            >
              <div style={{ overflowX: "auto" }}>
                <Table<DrugOrderResponse>
                  rowKey="id"
                  columns={columns}
                  dataSource={paginatedOrders}
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
                    <Text type="secondary">Total {totalItems} items</Text>
                    <Space align="center" size="large">
                      <Pagination
                        current={currentPage}
                        pageSize={pageSize}
                        total={totalItems}
                        onChange={(page) => onPageChange(page, pageSize)}
                        showSizeChanger={false}
                        showTotal={() => ""}
                      />
                      <Space align="center">
                        <Text type="secondary">Go to page:</Text>
                        <InputNumber
                          min={1}
                          max={Math.max(1, Math.ceil(totalItems / pageSize))}
                          value={currentPage}
                          onPressEnter={(
                            e: React.KeyboardEvent<HTMLInputElement>
                          ) => {
                            const value = Number(
                              (e.target as HTMLInputElement).value
                            );
                            if (
                              value > 0 &&
                              value <= Math.ceil(totalItems / pageSize)
                            ) {
                              onPageChange(value, pageSize);
                            }
                          }}
                          onChange={(value) => {
                            if (
                              value &&
                              Number(value) > 0 &&
                              Number(value) <= Math.ceil(totalItems / pageSize)
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

      <CreateDrugOrderForm
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateSuccess}
      />

      <EditDrugOrderForm
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onEdit={handleUpdateSuccess}
        orderId={editingOrderId}
      />

      <DrugSupplierDetailsModal
        supplier={selectedSupplier}
        isOpen={isSupplierDetailsModalOpen}
        onClose={() => setIsSupplierDetailsModalOpen(false)}
      />

      <Modal
        title={`Confirm ${
          confirmAction === "approve"
            ? "Approval"
            : confirmAction === "reject"
            ? "Rejection"
            : "Completion"
        }`}
        open={isConfirmModalOpen}
        onCancel={() => setIsConfirmModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsConfirmModalOpen(false)}>
            Cancel
          </Button>,
          <Button
            key="confirm"
            type={confirmAction === "approve" ? "primary" : "primary"}
            danger={confirmAction === "reject"}
            onClick={handleConfirmAction}
          >
            Confirm
          </Button>,
        ]}
      >
        {confirmAction === "approve" ? (
          <p>
            Are you sure you want to approve the selected drug orders? Once
            approved, you can no longer edit the order, but you can reject or
            complete it.
          </p>
        ) : confirmAction === "reject" ? (
          <p>
            Are you sure you want to reject the selected drug orders? Once
            rejected, the order and its details will be marked inactive and no
            further actions can be performed.
          </p>
        ) : (
          <p>
            Are you sure you want to complete the selected drug orders? Once
            completed, the order will be finalized, and stock will be updated in
            the inventory.
          </p>
        )}
      </Modal>

      {/* Export to Excel Modal */}
      <ExportConfigModal
        visible={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        loading={exportLoading}
        config={exportConfig}
        onChange={(newConfig) =>
          setExportConfig({ ...exportConfig, ...newConfig })
        }
        onExport={handleExportToExcel}
        filters={{
          currentPage,
          pageSize,
          drugOrderCodeSearch: filterValue,
          status: statusFilter.length > 0 ? statusFilter[0] : undefined,
          sortBy: Array.isArray(sorter)
            ? "createdAt"
            : (sorter?.field as string) || "createdAt",
          ascending: Array.isArray(sorter) ? false : sorter?.order === "ascend",
          orderDateRange: [null, null],
          createdDateRange: [null, null],
          updatedDateRange: [null, null],
        }}
        drugOrderCodes={drugOrderCodes}
        supplierOptions={supplierOptions}
      />

      {/* Drug Order Filter Modal */}
      <DrugOrderFilterModal
        visible={isFilterModalOpen}
        onCancel={() => setIsFilterModalOpen(false)}
        onApply={handleApplyAdvancedFilters}
        onReset={handleResetAdvancedFilters}
        initialFilters={advancedFilters}
        supplierOptions={supplierOptions}
      />
    </div>
  );
}
