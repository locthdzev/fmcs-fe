import React, { useEffect, useState, useMemo, useCallback } from "react";
import { toast } from "react-toastify";
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
  FormOutlined,
  EyeOutlined,
  ArrowLeftOutlined,
  FileExcelOutlined,
  DeleteOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import type { CheckboxChangeEvent } from "antd/es/checkbox";
import dayjs from "dayjs";
import {
  getCanteenOrders,
  deleteCanteenOrder,
  CanteenOrderResponse,
  getCanteenOrderById,
  approveCanteenOrders,
  rejectCanteenOrders,
  completeCanteenOrders,
  exportCanteenOrdersToExcel,
  CanteenOrderExportConfig,
} from "@/api/canteenorder";
import api from "@/api/customize-axios";
import { CreateCanteenOrderForm } from "./CreateCanteenOrderForm";
import { EditCanteenOrderForm } from "./EditCanteenOrderForm";
import ConfirmDeleteCanteenOrderModal from "./ConfirmDelete";
import CanteenOrderFilterModal from "./CanteenOrderFilterModal";
import ExportConfigModal from "./ExportConfigModal";
import { useRouter } from "next/router";
import type { FilterValue, SorterResult } from "antd/es/table/interface";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import { CanteenOrderIcon } from "./Icons";

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
        License Plate
      </span>
    ),
    dataIndex: "licensePlate",
    key: "licensePlate",
    sorter: (a: CanteenOrderResponse, b: CanteenOrderResponse) =>
      a.truck.licensePlate.localeCompare(b.truck.licensePlate),
    sortDirections: ["ascend", "descend"] as ("ascend" | "descend")[],
  },
  {
    title: (
      <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
        Driver
      </span>
    ),
    dataIndex: "driverName",
    key: "driverName",
    sorter: (a: CanteenOrderResponse, b: CanteenOrderResponse) =>
      a.truck.driverName.localeCompare(b.truck.driverName),
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
    sorter: (a: CanteenOrderResponse, b: CanteenOrderResponse) =>
      dayjs(a.orderDate).unix() - dayjs(b.orderDate).unix(),
    render: (date: string) => (date ? dayjs(date).format("DD/MM/YYYY") : "-"),
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

const roleColorMap: Record<string, string> = {
  Admin: "red",
  Manager: "orange",
  Staff: "blue",
  User: "green",
  Unknown: "default",
};

const INITIAL_COLUMN_VISIBILITY: Record<string, boolean> = {
  licensePlate: true,
  driverName: true,
  orderDate: true,
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

export function CanteenOrders() {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(
    "Loading canteen orders..."
  );

  const [canteenOrders, setCanteenOrders] = useState<CanteenOrderResponse[]>(
    []
  );
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filterValue, setFilterValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [sorter, setSorter] = useState<
    SorterResult<CanteenOrderResponse> | SorterResult<CanteenOrderResponse>[]
  >();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [showApproveButton, setShowApproveButton] = useState(false);
  const [showRejectButton, setShowRejectButton] = useState(false);
  const [showCompleteButton, setShowCompleteButton] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    "approve" | "reject" | "complete" | "delete" | null
  >(null);

  // Filter modal states
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    licensePlate: "",
    driverName: "",
    status: [] as string[],
    orderDateRange: [null, null] as [dayjs.Dayjs | null, dayjs.Dayjs | null],
    createdDateRange: [null, null] as [dayjs.Dayjs | null, dayjs.Dayjs | null],
    updatedDateRange: [null, null] as [dayjs.Dayjs | null, dayjs.Dayjs | null],
    sortBy: "OrderDate",
    ascending: false,
  });
  const [licensePlateOptions, setLicensePlateOptions] = useState<string[]>([]);
  const [driverNameOptions, setDriverNameOptions] = useState<string[]>([]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string>("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingOrderId, setDeletingOrderId] = useState<string>("");

  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(INITIAL_COLUMN_VISIBILITY);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // State for order details modal
  const [selectedOrder, setSelectedOrder] =
    useState<CanteenOrderResponse | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Selection helper variables
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isLoadingAllItems, setIsLoadingAllItems] = useState<boolean>(false);

  // Export to Excel states
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportConfig, setExportConfig] = useState<CanteenOrderExportConfig>({
    includeId: true,
    includeTruckInfo: true,
    includeOrderDate: true,
    includeCreatedInfo: true,
    includeUpdatedInfo: true,
    includeStatus: true,
    includeOrderDetails: true,
  });

  const fetchCanteenOrders = useCallback(async () => {
   
    try {
     
      // Pero el API actual solo devuelve todos los elementos
      const data = await getCanteenOrders();
      if (Array.isArray(data)) {
        setCanteenOrders(data);
        setTotalItems(data.length);
      }
    } catch (error) {
      messageApi.error("Failed to fetch canteen orders", 5);
      console.error("Fetch error:", error);
    } finally {
      // Chỉ cập nhật initialLoading, không cập nhật loading
      setInitialLoading(false);
    }
  }, [messageApi]);

  useEffect(() => {
    fetchCanteenOrders();
  }, [fetchCanteenOrders]);

  useEffect(() => {
    if (selectedRowKeys.length > 0) {
      const selectedOrdersData = canteenOrders.filter((order) =>
        selectedRowKeys.includes(order.id)
      );

      // Check if any selected order has a status we can act on
      const hasPending = selectedOrdersData.some(
        (order) => order.status === "Pending"
      );
      const hasApproved = selectedOrdersData.some(
        (order) => order.status === "Approved"
      );

      // Show buttons based on if there's at least one item with the required status
      setShowApproveButton(hasPending);
      setShowRejectButton(hasPending || hasApproved);
      setShowCompleteButton(hasApproved);
    } else {
      setShowApproveButton(false);
      setShowRejectButton(false);
      setShowCompleteButton(false);
    }
  }, [selectedRowKeys, canteenOrders]);

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
    let filtered = [...canteenOrders];

    // Basic search filter
    if (filterValue) {
      filtered = filtered.filter((order) =>
        order.truck.licensePlate
          .toLowerCase()
          .includes(filterValue.toLowerCase())
      );
    }

    // Basic status filter
    if (statusFilter.length > 0) {
      filtered = filtered.filter(
        (order) => order.status && statusFilter.includes(order.status)
      );
    }

    // Apply advanced filters
    if (advancedFilters.licensePlate) {
      filtered = filtered.filter(
        (order) => order.truck.licensePlate === advancedFilters.licensePlate
      );
    }

    if (advancedFilters.driverName) {
      filtered = filtered.filter(
        (order) => order.truck.driverName === advancedFilters.driverName
      );
    }

    if (advancedFilters.status && advancedFilters.status.length > 0) {
      filtered = filtered.filter(
        (order) => order.status && advancedFilters.status.includes(order.status)
      );
    }

    // Date range filters
    const [orderStartDate, orderEndDate] = advancedFilters.orderDateRange;
    if (orderStartDate && orderEndDate) {
      filtered = filtered.filter((order) => {
        const orderDate = dayjs(order.orderDate);
        return (
          orderDate.isAfter(orderStartDate, "day") ||
          (orderDate.isSame(orderStartDate, "day") &&
            (orderDate.isBefore(orderEndDate, "day") ||
              orderDate.isSame(orderEndDate, "day")))
        );
      });
    }

    const [createdStartDate, createdEndDate] = advancedFilters.createdDateRange;
    if (createdStartDate && createdEndDate) {
      filtered = filtered.filter((order) => {
        const createdDate = dayjs(order.createdAt);
        return (
          createdDate.isAfter(createdStartDate, "day") ||
          (createdDate.isSame(createdStartDate, "day") &&
            (createdDate.isBefore(createdEndDate, "day") ||
              createdDate.isSame(createdEndDate, "day")))
        );
      });
    }

    const [updatedStartDate, updatedEndDate] = advancedFilters.updatedDateRange;
    if (updatedStartDate && updatedEndDate) {
      filtered = filtered.filter((order) => {
        if (!order.updatedAt) return false;
        const updatedDate = dayjs(order.updatedAt);
        return (
          updatedDate.isAfter(updatedStartDate, "day") ||
          (updatedDate.isSame(updatedStartDate, "day") &&
            (updatedDate.isBefore(updatedEndDate, "day") ||
              updatedDate.isSame(updatedEndDate, "day")))
        );
      });
    }

    // Advanced sorting
    if (advancedFilters.sortBy) {
      filtered.sort((a, b) => {
        let comparison = 0;

        if (advancedFilters.sortBy === "OrderDate") {
          comparison = dayjs(a.orderDate).unix() - dayjs(b.orderDate).unix();
        } else if (advancedFilters.sortBy === "LicensePlate") {
          comparison = a.truck.licensePlate.localeCompare(b.truck.licensePlate);
        } else if (advancedFilters.sortBy === "DriverName") {
          comparison = a.truck.driverName.localeCompare(b.truck.driverName);
        } else if (advancedFilters.sortBy === "Status") {
          comparison = (a.status || "").localeCompare(b.status || "");
        } else if (advancedFilters.sortBy === "CreatedAt") {
          comparison = dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix();
        } else if (advancedFilters.sortBy === "UpdatedAt") {
          const aTime = a.updatedAt ? dayjs(a.updatedAt).unix() : 0;
          const bTime = b.updatedAt ? dayjs(b.updatedAt).unix() : 0;
          comparison = aTime - bTime;
        }

        return advancedFilters.ascending ? comparison : -comparison;
      });

      return filtered;
    }

    // Basic sorting if advanced sorting is not applied
    if (sorter && !Array.isArray(sorter) && sorter.field) {
      const { field, order } = sorter;
      filtered.sort((a, b) => {
        let comparison = 0;

        if (field === "licensePlate") {
          comparison = a.truck.licensePlate.localeCompare(b.truck.licensePlate);
        } else if (field === "driverName") {
          comparison = a.truck.driverName.localeCompare(b.truck.driverName);
        } else if (field === "orderDate") {
          comparison = dayjs(a.orderDate).unix() - dayjs(b.orderDate).unix();
        } else if (field === "updatedAt") {
          const aTime = a.updatedAt ? dayjs(a.updatedAt).unix() : 0;
          const bTime = b.updatedAt ? dayjs(b.updatedAt).unix() : 0;
          comparison = aTime - bTime;
        }

        return order === "ascend" ? comparison : -comparison;
      });
    }

    return filtered;
  }, [canteenOrders, filterValue, statusFilter, sorter, advancedFilters]);

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAndSortedOrders.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedOrders, currentPage, pageSize]);

  const handleTableChange: TableProps<CanteenOrderResponse>["onChange"] = (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    newSorter:
      | SorterResult<CanteenOrderResponse>
      | SorterResult<CanteenOrderResponse>[]
  ) => {
    const statusFilters = (filters.status as FilterValue) || [];
    setStatusFilter(statusFilters.map(String));

    // Update sorter state from table changes
    setSorter(newSorter);

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
    setSorter(undefined);
    setAdvancedFilters({
      licensePlate: "",
      driverName: "",
      status: [],
      orderDateRange: [null, null],
      createdDateRange: [null, null],
      updatedDateRange: [null, null],
      sortBy: "OrderDate",
      ascending: false,
    });
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value: string[]) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  // Advanced filter modal functions
  const handleOpenFilterModal = () => {
    // Extract unique license plates and driver names for filter options
    const uniqueLicensePlates = Array.from(
      new Set(canteenOrders.map((order) => order.truck.licensePlate))
    );
    setLicensePlateOptions(uniqueLicensePlates);

    const uniqueDriverNames = Array.from(
      new Set(canteenOrders.map((order) => order.truck.driverName))
    );
    setDriverNameOptions(uniqueDriverNames);

    setIsFilterModalVisible(true);
  };

  const handleApplyFilters = (filters: any) => {
    console.log("Applying filters:", filters);
    setAdvancedFilters(filters);
    setCurrentPage(1);
    setIsFilterModalVisible(false);
  };

  const handleResetAdvancedFilters = () => {
    setAdvancedFilters({
      licensePlate: "",
      driverName: "",
      status: [],
      orderDateRange: [null, null],
      createdDateRange: [null, null],
      updatedDateRange: [null, null],
      sortBy: "OrderDate",
      ascending: false,
    });
    setCurrentPage(1);
    setIsFilterModalVisible(false);
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

  const handleOpenDeleteModal = (id: string) => {
    setDeletingOrderId(id);
    setIsDeleteModalOpen(true);
  };

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    fetchCanteenOrders();
    messageApi.success("Canteen order added successfully", 5);
  };

  const handleUpdateSuccess = () => {
    setIsEditModalOpen(false);
    setEditingOrderId("");
    fetchCanteenOrders();
    messageApi.success("Canteen order updated successfully", 5);
  };

  const handleOpenDetails = async (id: string) => {
    try {
      const order = await getCanteenOrderById(id);
      setSelectedOrder(order);
      setIsDetailsModalOpen(true);
    } catch (error) {
      messageApi.error("Failed to load order details", 5);
    }
  };

  const showConfirm = (
    action: "approve" | "reject" | "complete" | "delete",
    onOk: () => void
  ) => {
    const selectedOrdersData = canteenOrders.filter((o) =>
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
    } else if (action === "delete") {
      // Đối với xóa, đếm tất cả các item được chọn
      count = selectedOrdersData.length;
    }

    if (count === 0) {
      messageApi.warning(
        `No orders with valid status selected for this action.`,
        5
      );
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
    } else if (confirmAction === "delete") {
      handleDelete();
    }

    setIsConfirmModalOpen(false);
    setConfirmAction(null);
  };

  const handleApprove = async () => {
    const idsToApprove = canteenOrders
      .filter((o) => selectedRowKeys.includes(o.id) && o.status === "Pending")
      .map((o) => o.id);

    if (idsToApprove.length === 0) return;

    setLoadingMessage("Approving orders...");
    setLoading(true);
    try {
      await approveCanteenOrders(idsToApprove);
      messageApi.success("Canteen orders approved successfully", 5);

      // Update local state instead of refetching
      setCanteenOrders((prevOrders) =>
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
      messageApi.error("Failed to approve canteen orders", 5);
      console.error("Error approving canteen orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    const idsToReject = canteenOrders
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
      await rejectCanteenOrders(idsToReject);
      messageApi.success("Canteen orders rejected successfully", 5);

      // Update local state instead of refetching
      setCanteenOrders((prevOrders) =>
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
      messageApi.error("Failed to reject canteen orders", 5);
      console.error("Error rejecting canteen orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    const idsToComplete = canteenOrders
      .filter((o) => selectedRowKeys.includes(o.id) && o.status === "Approved")
      .map((o) => o.id);

    if (idsToComplete.length === 0) return;

    setLoadingMessage("Completing orders...");
    setLoading(true);
    try {
      await completeCanteenOrders(idsToComplete);
      messageApi.success("Canteen orders completed successfully", 5);

      // Update local state instead of refetching
      setCanteenOrders((prevOrders) =>
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
      messageApi.error("Failed to complete canteen orders", 5);
      console.error("Error completing canteen orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingOrderId && selectedRowKeys.length === 0) return;

    setLoadingMessage("Deleting orders...");
    setLoading(true);

    try {
      // Si tenemos un ID de orden específico para eliminar
      if (deletingOrderId) {
        await deleteCanteenOrder(deletingOrderId);
        messageApi.success("Canteen order deleted successfully", 5);
        setCanteenOrders((prevOrders) =>
          prevOrders.filter((order) => order.id !== deletingOrderId)
        );
        setDeletingOrderId("");
      }
      // Si tenemos múltiples órdenes seleccionadas
      else if (selectedRowKeys.length > 0) {
        // Nota: Asumimos que el API soporta eliminación por lotes
        // Si no, deberíamos usar Promise.all con múltiples llamadas
        for (const id of selectedRowKeys) {
          await deleteCanteenOrder(id as string);
        }
        messageApi.success("Selected canteen orders deleted successfully", 5);
        setCanteenOrders((prevOrders) =>
          prevOrders.filter((order) => !selectedRowKeys.includes(order.id))
        );
        setSelectedRowKeys([]);
      }

      setIsDeleteModalOpen(false);
    } catch (error) {
      messageApi.error("Failed to delete canteen order(s)", 5);
      console.error("Error deleting canteen orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canteenOrders.length > 0) {
      // Extract unique license plates for filter options
      const uniqueLicensePlates = Array.from(
        new Set(canteenOrders.map((order) => order.truck.licensePlate))
      );
      setLicensePlateOptions(uniqueLicensePlates);

      // Extract unique driver names for filter options
      const uniqueDriverNames = Array.from(
        new Set(canteenOrders.map((order) => order.truck.driverName))
      );
      setDriverNameOptions(uniqueDriverNames);
    }
  }, [canteenOrders]);

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

  const columns: TableProps<CanteenOrderResponse>["columns"] = useMemo(() => {
    const actionColumn = {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          ACTIONS
        </span>
      ),
      key: "actions",
      align: "center" as const,
      render: (_: any, record: CanteenOrderResponse) => (
        <div style={{ textAlign: "center" }}>
          <Dropdown
            overlay={
              <Menu>
                <Menu.Item
                  key="view"
                  icon={<EyeOutlined />}
                  onClick={() => handleOpenDetails(record.id)}
                >
                  View Details
                </Menu.Item>
                
                {record.status === "Pending" && (
                  <Menu.Item
                    key="edit"
                    icon={<FormOutlined />}
                    onClick={() => handleOpenEditModal(record.id)}
                  >
                    Edit
                  </Menu.Item>
                )}
                
                {record.status !== "Completed" && (
                  <Menu.Item 
                    key="delete" 
                    icon={<DeleteOutlined />} 
                    danger
                    onClick={() => handleOpenDeleteModal(record.id)}
                  >
                    Delete
                  </Menu.Item>
                )}
              </Menu>
            }
            placement="bottomCenter"
          >
            <Button icon={<MoreOutlined />} size="small" />
          </Dropdown>
        </div>
      ),
    };

    const visibleCols = staticColumns
      .filter(
        (col) => col.key && col.key !== "actions" && columnVisibility[col.key]
      )
      .map((col) => {
        if (col.key === "licensePlate") {
          return {
            ...col,
            render: (_: string, record: CanteenOrderResponse) => (
              <span
                className="text-primary cursor-pointer hover:underline"
                onClick={() =>
                  router.push(`/canteen-order/details?id=${record.id}`)
                }
              >
                {record.truck.licensePlate}
              </span>
            ),
          };
        }
        if (col.key === "driverName") {
          return {
            ...col,
            render: (_: string, record: CanteenOrderResponse) => (
              <span>{record.truck.driverName}</span>
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
                <Tag color={roleColorMap[createdBy.role] || "default"}>
                  {createdBy.role}
                </Tag>
              </div>
            ),
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
  }, [columnVisibility, handleOpenEditModal, handleOpenDeleteModal, router]);

  const renderSelectAll = () => {
    // Count orders by status
    const pendingCount = paginatedOrders.filter(
      (order) => order.status === "Pending"
    ).length;
    const approvedCount = paginatedOrders.filter(
      (order) => order.status === "Approved"
    ).length;
    const rejectedCount = paginatedOrders.filter(
      (order) => order.status === "Rejected"
    ).length;
    const completedCount = paginatedOrders.filter(
      (order) => order.status === "Completed"
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

    // Handle select all checkbox
    const handleSelectAllChange = (e: CheckboxChangeEvent) => {
      if (e.target.checked) {
        // Select all items on the current page without status validation
        const currentPageIds = selectableOrders.map((order) => order.id);
        setSelectedRowKeys(currentPageIds);
      } else {
        // Deselect all
        setSelectedRowKeys([]);
        setSelectedOption(null);
      }
    };

    // Create dropdown items for status selection
    const dropdownItems = [
      {
        key: "page-pending",
        label: `Select all Pending on this page (${pendingCount})`,
      },
      {
        key: "all-pending",
        label:
          isLoadingAllItems && selectedOption === "all-pending" ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Spin size="small" />
              <span>Loading all Pending...</span>
            </div>
          ) : (
            "Select all Pending (all pages)"
          ),
      },
      {
        key: "page-approved",
        label: `Select all Approved on this page (${approvedCount})`,
      },
      {
        key: "all-approved",
        label:
          isLoadingAllItems && selectedOption === "all-approved" ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Spin size="small" />
              <span>Loading all Approved...</span>
            </div>
          ) : (
            "Select all Approved (all pages)"
          ),
      },
      {
        key: "page-rejected",
        label: `Select all Rejected on this page (${rejectedCount})`,
      },
      {
        key: "all-rejected",
        label:
          isLoadingAllItems && selectedOption === "all-rejected" ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Spin size="small" />
              <span>Loading all Rejected...</span>
            </div>
          ) : (
            "Select all Rejected (all pages)"
          ),
      },
      {
        key: "page-completed",
        label: `Select all Completed on this page (${completedCount})`,
      },
      {
        key: "all-completed",
        label:
          isLoadingAllItems && selectedOption === "all-completed" ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Spin size="small" />
              <span>Loading all Completed...</span>
            </div>
          ) : (
            "Select all Completed (all pages)"
          ),
      },
    ];

    return (
      <>
        <Checkbox
          checked={isSelectAll}
          indeterminate={isIndeterminate}
          disabled={selectableOrders.length === 0}
          onChange={handleSelectAllChange}
        />

        {dropdownItems.length > 0 && (
          <Dropdown
            menu={{
              items: dropdownItems,
              onClick: ({ key }) => handleSelectByStatus(key),
              selectedKeys: selectedOption ? [selectedOption] : [],
            }}
            placement="bottomLeft"
            trigger={["click"]}
          >
            <Button
              type="text"
              size="small"
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
    onChange: (keys: React.Key[], selectedRows: CanteenOrderResponse[]) => {
      // Simply update the selection without any validation
      setSelectedRowKeys(keys);

      // Clear selected option if manually deselecting
      if (keys.length < selectedRowKeys.length) {
        setSelectedOption(null);
      }
    },
    columnTitle: renderSelectAll,
    getCheckboxProps: (record: CanteenOrderResponse) => ({
      disabled: false, // Allow individual checkbox selection
    }),
  };

  const renderSelectedInfo = () => {
    if (selectedRowKeys.length === 0) return null;

    return (
      <Space>
        <Text>{selectedRowKeys.length} Items selected</Text>
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

        <Button
          danger
          icon={<DeleteOutlined />}
          onClick={() => showConfirm("delete", handleDelete)}
          disabled={loading}
        >
          Delete
        </Button>
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

  // Function to handle selection by status
  const handleSelectByStatus = async (key: string) => {
    // Check if this option is already selected
    if (selectedOption === key) {
      // If already selected, deselect it and clear all selections
      setSelectedOption(null);
      setSelectedRowKeys([]);
    } else {
      setSelectedOption(key);

      let statusToSelect = "";
      let selectCurrentPage = key.startsWith("page-");

      if (key.includes("pending")) {
        statusToSelect = "Pending";
      } else if (key.includes("approved")) {
        statusToSelect = "Approved";
      } else if (key.includes("rejected")) {
        statusToSelect = "Rejected";
      } else if (key.includes("completed")) {
        statusToSelect = "Completed";
      }

      // Get order IDs with the specified status
      if (statusToSelect) {
        const selectedOrderIds = await getOrderIdsByStatus(
          statusToSelect,
          selectCurrentPage
        );
        setSelectedRowKeys(selectedOrderIds);
      }
    }
  };

  // Function to get order IDs by status
  const getOrderIdsByStatus = async (
    status: string,
    currentPageOnly: boolean
  ): Promise<React.Key[]> => {
    try {
      if (currentPageOnly) {
        // Only get IDs from the current page
        return paginatedOrders
          .filter((order) => order.status === status)
          .map((order) => order.id);
      } else {
        // Get IDs from all pages with a specified status
        setIsLoadingAllItems(true);
        const result = filteredAndSortedOrders
          .filter((order) => order.status === status)
          .map((order) => order.id);

        setIsLoadingAllItems(false);
        return result;
      }
    } catch (error) {
      console.error("Error getting order IDs by status:", error);
      messageApi.error("Failed to get orders by status", 5);
      setIsLoadingAllItems(false);
      return [];
    }
  };

  // Export to Excel handlers
  const handleOpenExportModal = () => {
    // Reset loading state khi mở modal
    setLoading(false);
    setLoadingMessage("Loading canteen orders...");
    setExportModalVisible(true);
  };

  const handleExportConfigChange = (
    newConfig: Partial<CanteenOrderExportConfig>
  ) => {
    setExportConfig((prev) => ({ ...prev, ...newConfig }));
  };

  const handleExportToExcel = async (config: CanteenOrderExportConfig) => {
    try {
      setLoading(true);
      setLoadingMessage("Exporting to Excel...");
      console.log("Attempting to export with config:", config);

      // Đóng modal ngay khi bắt đầu export
      setExportModalVisible(false);

      const result = await exportCanteenOrdersToExcel(config);
      if (result === true) {
        messageApi.success(
          "Exported to Excel successfully - check your downloads",
          5
        );
      }
    } catch (error: any) {
      console.error("Error exporting to Excel:", error);

      // Hiển thị thông báo lỗi chi tiết hơn
      const errorMessage = error?.message || "Failed to export to Excel";

      // Hiển thị modal lỗi với thông tin chi tiết
      Modal.error({
        title: "Export Failed",
        content: (
          <div>
            <p>{errorMessage}</p>
            <p>Please try again or contact support if the issue persists.</p>
            <p style={{ fontSize: "12px", marginTop: "10px" }}>
              Error details: {error?.toString()}
            </p>
          </div>
        ),
      });

      messageApi.error(errorMessage, 5);
    } finally {
      // Đảm bảo loading state được reset
      setLoading(false);
    }
  };

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
            <CanteenOrderIcon />
          </span>
          <h3 className="text-xl font-bold">Canteen Order Management</h3>
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
                      placeholder="Search by license plate..."
                      value={filterValue || undefined}
                      onChange={handleSearchChange}
                      style={{ width: "300px" }}
                      options={licensePlateOptions.map((plate) => ({
                        label: plate,
                        value: plate,
                      }))}
                      filterOption={(input, option) =>
                        (option?.label ?? "")
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                      notFoundContent="No license plates found"
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
                        icon={<FilterOutlined />}
                        onClick={handleOpenFilterModal}
                      >
                        Filter
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
                          !advancedFilters.licensePlate &&
                          !advancedFilters.driverName &&
                          advancedFilters.status.length === 0 &&
                          !advancedFilters.orderDateRange[0] &&
                          !advancedFilters.createdDateRange[0] &&
                          !advancedFilters.updatedDateRange[0]
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

                  <div>
                    <Button
                      type="primary"
                      icon={<FileExcelOutlined />}
                      onClick={handleOpenExportModal}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      Export to Excel
                    </Button>
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
                <Table<CanteenOrderResponse>
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
                    <Text type="secondary">
                      Total {filteredAndSortedOrders.length} items
                    </Text>
                    <Space align="center" size="large">
                      <Pagination
                        current={currentPage}
                        pageSize={pageSize}
                        total={filteredAndSortedOrders.length}
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
                            Math.ceil(filteredAndSortedOrders.length / pageSize)
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
                                  filteredAndSortedOrders.length / pageSize
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
                                  filteredAndSortedOrders.length / pageSize
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

      <CreateCanteenOrderForm
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateSuccess}
      />

      <EditCanteenOrderForm
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdate={handleUpdateSuccess}
        orderId={editingOrderId}
      />

      <ConfirmDeleteCanteenOrderModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirmDelete={handleDelete}
        order={
          canteenOrders.find((order) => order.id === deletingOrderId) || null
        }
      />

      <Modal
        title={`Confirm ${
          confirmAction === "approve"
            ? "Approval"
            : confirmAction === "reject"
            ? "Rejection"
            : confirmAction === "complete"
            ? "Completion"
            : "Deletion"
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
            danger={confirmAction === "reject" || confirmAction === "delete"}
            onClick={handleConfirmAction}
          >
            Confirm
          </Button>,
        ]}
      >
        {confirmAction === "approve" ? (
          <p>
            Are you sure you want to approve the selected canteen orders?{" "}
            <strong>Only orders with "Pending" status will be approved.</strong>{" "}
            Once approved, you can no longer edit the order, but you can reject
            or complete it.
          </p>
        ) : confirmAction === "reject" ? (
          <p>
            Are you sure you want to reject the selected canteen orders?{" "}
            <strong>
              Only orders with "Pending" or "Approved" status will be rejected.
            </strong>{" "}
            Once rejected, the order and its details will be marked inactive and
            no further actions can be performed.
          </p>
        ) : confirmAction === "complete" ? (
          <p>
            Are you sure you want to complete the selected canteen orders?{" "}
            <strong>
              Only orders with "Approved" status will be completed.
            </strong>{" "}
            Once completed, the order will be finalized.
          </p>
        ) : (
          <p>
            Are you sure you want to delete the selected canteen orders? This
            action cannot be undone.
          </p>
        )}
      </Modal>

      {/* Advanced Filter Modal */}
      <CanteenOrderFilterModal
        visible={isFilterModalVisible}
        onCancel={() => setIsFilterModalVisible(false)}
        onApply={handleApplyFilters}
        onReset={handleResetAdvancedFilters}
        filters={advancedFilters}
        licensePlates={licensePlateOptions}
        driverNames={driverNameOptions}
        statuses={statusOptions}
      />

      <ExportConfigModal
        visible={exportModalVisible}
        onClose={() => setExportModalVisible(false)}
        onExport={handleExportToExcel}
        exportConfig={exportConfig}
        onChange={handleExportConfigChange}
      />
    </div>
  );
}
