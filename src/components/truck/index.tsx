import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  Key,
  ReactNode,
} from "react";
import {
  PlusIcon,
  VerticalDotsIcon,
  SearchIcon,
  ChevronDownIcon,
  TrucksIcon,
  FilterIcon,
  UndoIcon,
  AppsIcon,
  TagIcon,
  GearIcon,
  ChevronDownIcon as DownIcon,
} from "./Icons";
import {
  AppstoreOutlined,
  FilterOutlined,
  UndoOutlined,
  TagOutlined,
  SettingOutlined,
  DownOutlined,
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  FormOutlined,
  ArrowLeftOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";
import {
  Card as AntCard,
  Select,
  Space,
  Tag,
  Tooltip as AntTooltip,
  Table as AntTable,
  Pagination as AntPagination,
  Input as AntInput,
  Button as AntButton,
  Typography,
  InputNumber,
  Row,
  Menu,
  Checkbox as AntCheckbox,
  Dropdown as AntDropdown,
  Modal as AntModal,
  message,
  Spin,
} from "antd";
import {
  getTrucks,
  createTruck,
  updateTruck,
  deleteTruck,
  TruckResponse,
  getTruckById,
  activateTrucks,
  deactivateTrucks,
} from "@/api/truck";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  DropdownItem,
  Chip,
  Pagination,
  Selection,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  SortDescriptor,
  ChipProps,
  Checkbox,
  Tooltip,
} from "@heroui/react";
import { CreateTruckForm } from "./CreateTruckForm";
import ConfirmDeleteTruckModal from "./ConfirmDelete";
import { useRouter } from "next/router";
import TruckFilterModal, { TruckAdvancedFilters } from "./TruckFilterModal";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import ExportConfigModal, {
  TruckExportConfigWithUI,
} from "./ExportConfigModal";

// Extend dayjs with the plugins
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

export function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
}

const columns = [
  { name: "LICENSE PLATE", uid: "licensePlate", sortable: true },
  { name: "DRIVER NAME", uid: "driverName", sortable: true },
  { name: "DRIVER CONTACT", uid: "driverContact", sortable: true },
  { name: "TRUCK IMAGE", uid: "truckImage", sortable: false },
  { name: "STATUS", uid: "status", sortable: true },
  { name: "CREATED AT", uid: "createdAt", sortable: true },
  { name: "ACTIONS", uid: "actions" },
];

const allColumnKeys = columns.map((col) => col.uid);

const statusOptions = [
  { name: "Active", uid: "Active" },
  { name: "Inactive", uid: "Inactive" },
];

const statusColorMap: Record<string, ChipProps["color"]> = {
  Active: "success",
  Inactive: "danger",
};

const INITIAL_VISIBLE_COLUMNS = [
  "licensePlate",
  "driverName",
  "driverContact",
  "truckImage",
  "status",
  "createdAt",
  "actions",
];

export function Trucks() {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading trucks...");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isConfirmBulkActionModalOpen, setIsConfirmBulkActionModalOpen] =
    useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const [trucks, setTrucks] = useState<TruckResponse[]>([]);
  const [deletingTruck, setDeletingTruck] = useState<TruckResponse | null>(
    null
  );
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
  const [selectedItemTypes, setSelectedItemTypes] = useState<{
    hasActive: boolean;
    hasInactive: boolean;
  }>({ hasActive: false, hasInactive: false });
  const [confirmBulkActionType, setConfirmBulkActionType] = useState<
    "activate" | "deactivate" | null
  >(null);
  const [isLoadingAllItems, setIsLoadingAllItems] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const [filterValue, setFilterValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<Selection>("all");
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "createdAt",
    direction: "descending",
  });

  // Advanced filters state
  const initialAdvancedFilters: TruckAdvancedFilters = {
    createdDateRange: [null, null],
    updatedDateRange: [null, null],
    ascending: false, // Default sort: Newest first (descending)
  };
  const [advancedFilters, setAdvancedFilters] = useState<TruckAdvancedFilters>(
    initialAdvancedFilters
  );

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const [visibleColumns, setVisibleColumns] = useState<Selection>(
    new Set(INITIAL_VISIBLE_COLUMNS)
  );
  const [isReady, setIsReady] = useState(false);

  const [exportConfig, setExportConfig] = useState<TruckExportConfigWithUI>({
    exportAllPages: true,
    includeLicensePlate: true,
    includeDriverName: true,
    includeDriverContact: true,
    includeDescription: true,
    includeTruckImage: true,
    includeCreatedAt: true,
    includeUpdatedAt: true,
    includeStatus: true,
  });

  // Extract unique license plates for dropdown
  const uniqueLicensePlates = useMemo(() => {
    return Array.from(new Set(trucks.map((truck) => truck.licensePlate))).map(
      (plate) => ({ value: plate, label: plate })
    );
  }, [trucks]);

  // Filter function for license plate search
  const filterOption = (
    input: string,
    option?: { label: string; value: string }
  ) => {
    return (option?.label ?? "").toLowerCase().includes(input.toLowerCase());
  };

  const fetchTrucks = useCallback(async () => {
    setLoading(true);
    setLoadingMessage("Loading trucks...");
    try {
      const data = await getTrucks();
      setTrucks(data);
      setTotalItems(data.length);
      setIsReady(true);
      setInitialLoading(false);
    } catch (error) {
      messageApi.error("Failed to fetch trucks.", 5);
      console.error("Error fetching trucks:", error);
      setTrucks([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  }, [messageApi]);

  useEffect(() => {
    fetchTrucks();
  }, [fetchTrucks]);

  useEffect(() => {
    const queryPage = Number(router.query.page) || 1;
    if (queryPage !== page) {
      setPage(queryPage);
    }
  }, [router.query.page]);

  const updatePageInUrl = (newPage: number) => {
    const query = { ...router.query };

    // Nếu là trang 1, xóa tham số page khỏi URL
    if (newPage === 1) {
      delete query.page;
    } else {
      query.page = String(newPage);
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

  const onPageChange = (newPage: number) => {
    setPage(newPage);
    updatePageInUrl(newPage);
  };

  const onRowsPerPageChange = useCallback((value: number) => {
    setRowsPerPage(value);
    setPage(1);
    updatePageInUrl(1);
  }, []);

  const filteredItems = useMemo(() => {
    let filteredTrucks = [...trucks];

    // Apply search filter
    if (filterValue) {
      filteredTrucks = filteredTrucks.filter(
        (truck) =>
          truck.licensePlate.toLowerCase() === filterValue.toLowerCase()
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      const statusSet = new Set(Array.from(statusFilter));
      if (statusSet.size > 0 && statusSet.size !== statusOptions.length) {
        filteredTrucks = filteredTrucks.filter(
          (truck) => truck.status && statusSet.has(truck.status)
        );
      }
    }

    // Apply createdDateRange filter
    const [createdStart, createdEnd] = advancedFilters.createdDateRange;
    if (createdStart) {
      filteredTrucks = filteredTrucks.filter((t) =>
        dayjs(t.createdAt).isSameOrAfter(createdStart, "day")
      );
    }
    if (createdEnd) {
      filteredTrucks = filteredTrucks.filter((t) =>
        dayjs(t.createdAt).isSameOrBefore(createdEnd, "day")
      );
    }

    // Apply updatedDateRange filter
    const [updatedStart, updatedEnd] = advancedFilters.updatedDateRange;
    if (updatedStart) {
      filteredTrucks = filteredTrucks.filter(
        (t) =>
          t.updatedAt && dayjs(t.updatedAt).isSameOrAfter(updatedStart, "day")
      );
    }
    if (updatedEnd) {
      filteredTrucks = filteredTrucks.filter(
        (t) =>
          t.updatedAt && dayjs(t.updatedAt).isSameOrBefore(updatedEnd, "day")
      );
    }

    return filteredTrucks;
  }, [trucks, filterValue, statusFilter, advancedFilters]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage);

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    // Đảm bảo rằng page không vượt quá số trang thực tế
    if (page > 1 && start >= filteredItems.length) {
      // Nếu page hiện tại vượt quá số trang thực tế, quay về trang 1
      setTimeout(() => setPage(1), 0);
      return filteredItems.slice(0, rowsPerPage);
    }

    return filteredItems.slice(start, end);
  }, [page, rowsPerPage, filteredItems]);

  const sortedItems = useMemo(() => {
    let sorted = [...items];

    // Luôn áp dụng sắp xếp theo createdAt (mặc định giảm dần - ngày mới nhất)
    if (sortDescriptor.column === "createdAt") {
      // Override direction from sortDescriptor with the one from advancedFilters
      const direction = advancedFilters.ascending ? 1 : -1;

      sorted.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return (dateA - dateB) * direction;
      });
    } else {
      // For other columns, use the standard sorting logic
      sorted.sort((a: TruckResponse, b: TruckResponse) => {
        const first = a[sortDescriptor.column as keyof TruckResponse] as any;
        const second = b[sortDescriptor.column as keyof TruckResponse] as any;
        const dir = sortDescriptor.direction === "descending" ? -1 : 1;

        if (first < second) return -1 * dir;
        if (first > second) return 1 * dir;
        return 0;
      });
    }

    return sorted;
  }, [sortDescriptor, items, advancedFilters.ascending]);

  useEffect(() => {
    if (!Array.isArray(trucks) || trucks.length === 0) {
      setSelectedItemTypes({ hasActive: false, hasInactive: false });
      return;
    }

    let selected: TruckResponse[] = [];
    const currentKeys = selectedKeys as Set<string>;

    if (selectedKeys === "all") {
      selected = trucks.filter((truck) => canSelectTruck(truck));
    } else if (currentKeys instanceof Set) {
      selected = trucks.filter((truck) => currentKeys.has(truck.id));
    }

    const hasActive = selected.some((truck) => truck.status === "Active");
    const hasInactive = selected.some((truck) => truck.status === "Inactive");

    setSelectedItemTypes({ hasActive, hasInactive });
  }, [selectedKeys, trucks]);

  const canSelectTruck = (truck: TruckResponse) => {
    return truck.status === "Active" || truck.status === "Inactive";
  };

  const getItemIdsByStatus = async (
    statuses: string[],
    currentPageOnly: boolean = false
  ): Promise<string[]> => {
    setIsLoadingAllItems(true);
    try {
      if (currentPageOnly) {
        const filteredTrucks = items.filter((truck) =>
          statuses.includes(truck.status || "")
        );
        return filteredTrucks.map((truck) => truck.id);
      } else {
        console.warn(
          "API call getTruckIdsByStatus not implemented. Falling back to all loaded trucks."
        );
        const allFilteredTrucks = trucks.filter((truck) =>
          statuses.includes(truck.status || "")
        );
        await new Promise((resolve) => setTimeout(resolve, 500));
        return allFilteredTrucks.map((t) => t.id);
      }
    } catch (error) {
      console.error("Error getting item IDs by status:", error);
      messageApi.error("Failed to get item IDs by status.", 5);
      return [];
    } finally {
      setIsLoadingAllItems(false);
    }
  };

  const handleSelectionChange = (newSelection: Selection) => {
    if (newSelection === "all" || (newSelection as Set<string>).size === 0) {
      setSelectedKeys(newSelection);
      return;
    }

    const selectedTruckIds = Array.from(newSelection as Set<string>);
    const selectedTrucks = trucks.filter((truck) =>
      selectedTruckIds.includes(truck.id)
    );

    const hasActive = selectedTrucks.some((truck) => truck.status === "Active");
    const hasInactive = selectedTrucks.some(
      (truck) => truck.status === "Inactive"
    );

    if (hasActive && hasInactive) {
      messageApi.warning(
        "Cannot select both Active and Inactive trucks at the same time.",
        3
      );
      return;
    }

    setSelectedKeys(newSelection);
  };

  const handleSelectByStatusAction = useCallback(
    (key: Key) => {
      const keyStr = key.toString();
      const performSelection = async () => {
        if (selectedOption === keyStr) {
          setSelectedOption(null);
          handleSelectionChange(new Set([]));
        } else {
          setSelectedOption(keyStr);
          let ids: string[] = [];
          switch (keyStr) {
            case "all-active":
              ids = await getItemIdsByStatus(["Active"], false);
              break;
            case "all-inactive":
              ids = await getItemIdsByStatus(["Inactive"], false);
              break;
            case "page-active":
              ids = await getItemIdsByStatus(["Active"], true);
              break;
            case "page-inactive":
              ids = await getItemIdsByStatus(["Inactive"], true);
              break;
            default:
              ids = [];
          }
          handleSelectionChange(new Set(ids));
        }
      };
      performSelection();
    },
    [selectedOption, getItemIdsByStatus, items, trucks]
  );

  const renderSelectAll = useCallback(() => {
    const activeCount = items.filter((t) => t.status === "Active").length;
    const inactiveCount = items.filter((t) => t.status === "Inactive").length;
    const selectableItems = items.filter(canSelectTruck);
    const isSelectAllOnPage =
      selectableItems.length > 0 &&
      selectableItems.every((item) =>
        (selectedKeys as Set<string>).has(item.id)
      );
    const isIndeterminate =
      !isSelectAllOnPage &&
      selectedKeys !== "all" &&
      (selectedKeys as Set<string>).size > 0 &&
      selectableItems.some((item) =>
        (selectedKeys as Set<string>).has(item.id)
      );

    const dropdownItems = [];
    if (activeCount > 0) {
      dropdownItems.push({
        key: "page-active",
        label: `Select all Active on this page (${activeCount})`,
      });
      dropdownItems.push({
        key: "all-active",
        label: "Select all Active (all pages)",
      });
    }
    if (inactiveCount > 0) {
      dropdownItems.push({
        key: "page-inactive",
        label: `Select all Inactive on this page (${inactiveCount})`,
      });
      dropdownItems.push({
        key: "all-inactive",
        label: "Select all Inactive (all pages)",
      });
    }

    const handleSelectAllToggle = () => {
      if ((selectedKeys as Set<string>).size > 0 || selectedKeys === "all") {
        handleSelectionChange(new Set([]));
        setSelectedOption(null);
      }
    };

    return (
      <>
        <Checkbox
          isSelected={isSelectAllOnPage}
          isIndeterminate={isIndeterminate}
          onChange={handleSelectAllToggle}
          isDisabled={false}
        />
        {dropdownItems.length > 0 && (
          <Dropdown>
            <DropdownTrigger>
              <AntButton
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
              </AntButton>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Select All Options"
              items={dropdownItems}
              onAction={handleSelectByStatusAction}
              selectionMode="none"
              selectedKeys={selectedOption ? [selectedOption] : []}
              disabledKeys={
                isLoadingAllItems ? ["all-active", "all-inactive"] : []
              }
            >
              {(item: any) => (
                <DropdownItem key={item.key} textValue={item.label}>
                  {isLoadingAllItems &&
                  (item.key === "all-active" || item.key === "all-inactive") &&
                  selectedOption === item.key ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <Spin size="small" />
                      <span>Loading...</span>
                    </div>
                  ) : (
                    item.label
                  )}
                </DropdownItem>
              )}
            </DropdownMenu>
          </Dropdown>
        )}
      </>
    );
  }, [
    items,
    selectedKeys,
    selectedOption,
    isLoadingAllItems,
    handleSelectByStatusAction,
    canSelectTruck,
    messageApi,
  ]);

  const handleOpenDetails = async (id: string) => {
    router.push(`/truck/${id}`);
  };

  const handleUpdateSuccess = () => {
    messageApi.success("Truck updated successfully", 5);
    fetchTrucks();
  };

  const handleOpenDeleteModal = async (id: string) => {
    setLoading(true);
    setLoadingMessage("Loading truck details...");
    try {
      const truck = await getTruckById(id);
      setDeletingTruck(truck);
      setIsDeleteModalOpen(true);
    } catch (error) {
      messageApi.error("Failed to load truck details for deletion", 5);
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingTruck) return;
    setLoading(true);
    setLoadingMessage("Deleting truck...");
    try {
      const response = await deleteTruck(deletingTruck.id);
      if (!response.isSuccess) {
        messageApi.error(response.message || "Failed to delete truck.", 5);
        return;
      }
      messageApi.success("Truck deleted successfully", 5);
      fetchTrucks();
      setSelectedKeys(new Set([]));
      setIsDeleteModalOpen(false);
      setDeletingTruck(null);
    } catch (error: any) {
      messageApi.error("An error occurred while deleting the truck.", 5);
      console.error("Delete error:", error);
    } finally {
      setLoading(false);
      setLoadingMessage("");
      setIsDeleteModalOpen(false);
      setDeletingTruck(null);
    }
  };

  const getSelectedTruckIdsByStatus = (
    status: "Active" | "Inactive"
  ): string[] => {
    let selectedTrucks: TruckResponse[] = [];
    if (selectedKeys === "all") {
      selectedTrucks = trucks.filter((truck) => truck.status === status);
    } else if (selectedKeys instanceof Set) {
      selectedTrucks = trucks.filter(
        (truck) => selectedKeys.has(truck.id) && truck.status === status
      );
    }
    return selectedTrucks.map((t) => t.id);
  };

  const handleBulkActivate = async () => {
    const idsToActivate = getSelectedTruckIdsByStatus("Inactive");
    if (idsToActivate.length === 0) {
      messageApi.warning("No inactive trucks selected for activation.", 5);
      return;
    }
    setLoading(true);
    setLoadingMessage("Activating trucks...");
    try {
      await activateTrucks(idsToActivate);
      messageApi.success(
        `${idsToActivate.length} truck(s) activated successfully`,
        5
      );
      fetchTrucks();
      setSelectedKeys(new Set());
    } catch (error) {
      messageApi.error("Failed to activate trucks", 5);
      console.error("Activate error:", error);
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  const handleBulkDeactivate = async () => {
    const idsToDeactivate = getSelectedTruckIdsByStatus("Active");
    if (idsToDeactivate.length === 0) {
      messageApi.warning("No active trucks selected for deactivation.", 5);
      return;
    }
    setLoading(true);
    setLoadingMessage("Deactivating trucks...");
    try {
      await deactivateTrucks(idsToDeactivate);
      messageApi.success(
        `${idsToDeactivate.length} truck(s) deactivated successfully`,
        5
      );
      fetchTrucks();
      setSelectedKeys(new Set());
    } catch (error) {
      messageApi.error("Failed to deactivate trucks", 5);
      console.error("Deactivate error:", error);
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  const handleOpenConfirmBulkAction = (action: "activate" | "deactivate") => {
    setConfirmBulkActionType(action);
    setIsConfirmBulkActionModalOpen(true);
  };

  const handleConfirmBulkAction = async () => {
    if (confirmBulkActionType === "activate") {
      await handleBulkActivate();
    } else if (confirmBulkActionType === "deactivate") {
      await handleBulkDeactivate();
    }
    setIsConfirmBulkActionModalOpen(false);
    setConfirmBulkActionType(null);
  };

  const handleResetFilters = useCallback(() => {
    setFilterValue("");
    setStatusFilter("all");
    setSortDescriptor({ column: "createdAt", direction: "descending" });
    setAdvancedFilters(initialAdvancedFilters);
    setPage(1);
    updatePageInUrl(1);
    setIsFilterModalOpen(false);
  }, [initialAdvancedFilters]);

  const handleApplyAdvancedFilters = (filters: TruckAdvancedFilters) => {
    setAdvancedFilters(filters);

    // If sorting by createdAt, update the sortDescriptor direction based on advanced filter
    if (sortDescriptor.column === "createdAt") {
      setSortDescriptor({
        ...sortDescriptor,
        direction: filters.ascending ? "ascending" : "descending",
      });
    }

    setPage(1);
    updatePageInUrl(1);
    setIsFilterModalOpen(false);
  };

  const isFiltersApplied = useMemo(() => {
    const hasBasicFilters = filterValue !== "" || statusFilter !== "all";

    // Check if advanced filters are applied
    const hasAdvancedFilters =
      advancedFilters.createdDateRange[0] !== null ||
      advancedFilters.createdDateRange[1] !== null ||
      advancedFilters.updatedDateRange[0] !== null ||
      advancedFilters.updatedDateRange[1] !== null ||
      advancedFilters.ascending !== initialAdvancedFilters.ascending;

    return hasBasicFilters || hasAdvancedFilters;
  }, [filterValue, statusFilter, advancedFilters, initialAdvancedFilters]);

  const handleColumnVisibilityChange = useCallback(
    (key: string) => {
      const newVisibility = new Set(visibleColumns as Set<string>);
      if (newVisibility.has(key)) {
        newVisibility.delete(key);
      } else {
        newVisibility.add(key);
      }
      if (newVisibility.size === 0) {
        messageApi.warning("Cannot hide all columns.", 5);
        return;
      }
      setVisibleColumns(newVisibility);
    },
    [visibleColumns]
  );

  const toggleAllColumns = useCallback(
    (checked: boolean) => {
      if (checked) {
        // Toggle All
        setVisibleColumns(new Set(allColumnKeys));
      } else {
        // Hide all columns except essential ones required for table to function
        messageApi.success("All columns have been hidden", 3);
        setVisibleColumns(new Set([]));
      }
    },
    [messageApi]
  );

  const areAllColumnsVisible = useMemo(() => {
    const currentVisible = visibleColumns as Set<string>;
    return currentVisible.size === allColumnKeys.length;
  }, [visibleColumns]);

  const headerColumns = useMemo(() => {
    const visibleSet = visibleColumns as Set<string>;
    return columns.filter((column) => visibleSet.has(column.uid));
  }, [visibleColumns]);

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch (e) {
      return "Invalid Date";
    }
  };

  const renderCell = useCallback(
    (truck: TruckResponse, columnKey: React.Key) => {
      const cellValue = truck[columnKey as keyof TruckResponse];

      switch (columnKey) {
        case "licensePlate":
          return (
            <div className="flex items-center gap-2">
              {truck.truckImage && (
                <img
                  src={truck.truckImage}
                  alt={truck.licensePlate}
                  className="w-8 h-8 object-cover rounded"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}
              <span
                className="text-primary cursor-pointer hover:underline"
                onClick={() => handleOpenDetails(truck.id)}
              >
                {cellValue as string}
              </span>
            </div>
          );
        case "driverName":
          return <span className="capitalize">{truck.driverName || "-"}</span>;
        case "driverContact":
          return <span>{truck.driverContact || "-"}</span>;
        case "status":
          const status = truck.status as keyof typeof statusColorMap;
          return (
            <Tag color={truck.status === "Active" ? "success" : "error"}>
              {truck.status ? truck.status.toUpperCase() : ""}
            </Tag>
          );
        case "createdAt":
          return <span>{formatDate(cellValue as string)}</span>;
        case "actions":
          return (
            <Space
              size="small"
              style={{ display: "flex", justifyContent: "center" }}
            >
              <AntTooltip title="Edit">
                <AntButton
                  type="text"
                  icon={<FormOutlined />}
                  onClick={() => router.push(`/truck/edit/${truck.id}`)}
                />
              </AntTooltip>
            </Space>
          );
        default:
          if (columnKey === "truckImage") return null;
          return cellValue?.toString() || "-";
      }
    },
    [handleOpenDetails, router]
  );

  // Define Ant Design table columns
  const antColumns = useMemo(() => {
    // If no columns are visible, return empty array
    const hasVisibleColumns =
      visibleColumns instanceof Set && (visibleColumns as Set<string>).size > 0;

    const columns = [
      {
        title: (
          <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
            LICENSE PLATE
          </span>
        ),
        dataIndex: "licensePlate",
        key: "licensePlate",
        sorter: (a: TruckResponse, b: TruckResponse) =>
          a.licensePlate.localeCompare(b.licensePlate),
        render: (text: string, record: TruckResponse) =>
          renderCell(record, "licensePlate"),
      },
      {
        title: (
          <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
            DRIVER NAME
          </span>
        ),
        dataIndex: "driverName",
        key: "driverName",
        sorter: (a: TruckResponse, b: TruckResponse) =>
          (a.driverName || "").localeCompare(b.driverName || ""),
        render: (text: string, record: TruckResponse) =>
          renderCell(record, "driverName"),
      },
      {
        title: (
          <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
            DRIVER CONTACT
          </span>
        ),
        dataIndex: "driverContact",
        key: "driverContact",
        render: (text: string, record: TruckResponse) =>
          renderCell(record, "driverContact"),
      },
      {
        title: (
          <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
            STATUS
          </span>
        ),
        dataIndex: "status",
        key: "status",
        sorter: (a: TruckResponse, b: TruckResponse) =>
          (a.status || "").localeCompare(b.status || ""),
        render: (text: string, record: TruckResponse) =>
          renderCell(record, "status"),
      },
      {
        title: (
          <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
            CREATED AT
          </span>
        ),
        dataIndex: "createdAt",
        key: "createdAt",
        sorter: (a: TruckResponse, b: TruckResponse) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        render: (text: string, record: TruckResponse) =>
          renderCell(record, "createdAt"),
      },
      {
        title: (
          <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
            ACTIONS
          </span>
        ),
        key: "actions",
        align: "center" as const,
        render: (_: any, record: TruckResponse) =>
          renderCell(record, "actions"),
      },
    ];

    if (!hasVisibleColumns) {
      // Return empty array when no columns are selected
      return [];
    }

    return columns.filter((col) => {
      const key = col.key as string;
      return visibleColumns instanceof Set && visibleColumns.has(key);
    });
  }, [visibleColumns, renderCell]);

  const handleOpenExportConfig = () => {
    setIsExportModalOpen(true);
  };

  const handleExportConfigChange = (
    newConfig: Partial<TruckExportConfigWithUI>
  ) => {
    setExportConfig((prev) => ({
      ...prev,
      ...newConfig,
    }));
  };

  // Fix the renderSelectedInfo function with proper closing tags
  const renderSelectedInfo = () => {
    if ((selectedKeys as Set<string>).size === 0) return null;

    const selectedCount = (selectedKeys as Set<string>).size;

    return (
      <Space>
        <Typography.Text>{selectedCount} Items selected</Typography.Text>
        <AntButton
          icon={<UndoOutlined />}
          onClick={() => setSelectedKeys(new Set([]))}
        >
          Restore
        </AntButton>

        {selectedItemTypes.hasInactive && (
          <AntButton
            className="bg-success-100 text-success border-success"
            onClick={() => handleOpenConfirmBulkAction("activate")}
            disabled={loading}
          >
            Activate Selected
          </AntButton>
        )}

        {selectedItemTypes.hasActive && (
          <AntButton
            className="bg-danger-100 text-danger border-danger"
            onClick={() => handleOpenConfirmBulkAction("deactivate")}
            disabled={loading}
          >
            Deactivate Selected
          </AntButton>
        )}
      </Space>
    );
  };

  // Hàm render phần Rows per page (luôn hiển thị)
  const renderRowsPerPage = () => {
    return (
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <Typography.Text type="secondary">Rows per page:</Typography.Text>
        <Select
          value={rowsPerPage}
          onChange={(value) => onRowsPerPageChange(value)}
          style={{ width: "80px" }}
          dropdownMatchSelectWidth={false}
        >
          <Select.Option value={5}>5</Select.Option>
          <Select.Option value={10}>10</Select.Option>
          <Select.Option value={15}>15</Select.Option>
          <Select.Option value={20}>20</Select.Option>
        </Select>
      </div>
    );
  };

  return (
    <div style={{ padding: "20px" }}>
      {contextHolder}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="mr-2">
            <AntButton
              icon={<ArrowLeftOutlined />}
              onClick={() => router.push("/")}
            >
              Back
            </AntButton>
          </span>
          <TrucksIcon />
          <h3 className="text-xl font-bold">Delivery Truck Management</h3>
        </div>
      </div>

      {initialLoading ? (
        <div style={{ textAlign: "center", padding: "50px" }}>
          <Spin size="large" tip="Loading trucks..." />
        </div>
      ) : (
        <div>
          <Spin spinning={loading} tip={loadingMessage}>
            <AntCard
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
              <div className="p-4">
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Select
                        showSearch
                        allowClear
                        style={{ width: "300px" }}
                        placeholder={
                          <div
                            style={{ display: "flex", alignItems: "center" }}
                          >
                            <SearchOutlined style={{ marginRight: 8 }} />
                            <span>Search License Plate...</span>
                          </div>
                        }
                        filterOption={filterOption}
                        options={uniqueLicensePlates}
                        value={filterValue || undefined}
                        onChange={(value) => setFilterValue(value || "")}
                      />

                      <AntTooltip title="Advanced Filters">
                        <AntButton
                          icon={
                            <FilterOutlined
                              style={{
                                color: isFiltersApplied ? "#1890ff" : undefined,
                              }}
                            />
                          }
                          onClick={() => setIsFilterModalOpen(true)}
                          style={{ height: "32px" }}
                        >
                          Filters
                        </AntButton>
                      </AntTooltip>

                      <Select
                        mode="multiple"
                        allowClear
                        style={{ width: "120px", height: "32px" }}
                        placeholder={
                          <div
                            style={{ display: "flex", alignItems: "center" }}
                          >
                            <TagOutlined style={{ marginRight: 8 }} />
                            <span>Status</span>
                          </div>
                        }
                        value={
                          statusFilter === "all"
                            ? []
                            : Array.from(statusFilter as Set<string>)
                        }
                        onChange={(values) => {
                          if (values.length === 0) {
                            setStatusFilter("all");
                          } else {
                            setStatusFilter(new Set(values));
                          }
                        }}
                        options={statusOptions.map((option) => ({
                          value: option.uid,
                          label: option.name,
                        }))}
                        maxTagCount="responsive"
                      />

                      <AntTooltip title="Reset All Filters">
                        <AntButton
                          icon={<UndoOutlined />}
                          onClick={handleResetFilters}
                          disabled={!isFiltersApplied && !filterValue}
                          style={{ height: "32px" }}
                        >
                          Reset
                        </AntButton>
                      </AntTooltip>

                      <AntDropdown
                        menu={{
                          items: [
                            {
                              key: "selectAll",
                              label: (
                                <AntCheckbox
                                  checked={areAllColumnsVisible}
                                  onChange={(e) =>
                                    toggleAllColumns(e.target.checked)
                                  }
                                >
                                  <strong>Toggle All</strong>
                                </AntCheckbox>
                              ),
                            },
                            {
                              type: "divider",
                            },
                            ...columns
                              .filter((col) => col.uid !== "actions")
                              .map((column) => ({
                                key: column.uid,
                                label: (
                                  <AntCheckbox
                                    checked={(
                                      visibleColumns as Set<string>
                                    ).has(column.uid)}
                                    onChange={() =>
                                      handleColumnVisibilityChange(column.uid)
                                    }
                                  >
                                    <span
                                      style={{
                                        color: "dimgray",
                                        fontWeight: "normal",
                                      }}
                                    >
                                      {capitalize(column.name)}
                                    </span>
                                  </AntCheckbox>
                                ),
                              })),
                            {
                              key: "actions",
                              label: (
                                <AntCheckbox
                                  checked={(visibleColumns as Set<string>).has(
                                    "actions"
                                  )}
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
                                </AntCheckbox>
                              ),
                            },
                          ],
                          onClick: (e) => e.domEvent.stopPropagation(),
                        }}
                      >
                        <AntTooltip title="Column Settings">
                          <AntButton icon={<SettingOutlined />}>
                            Columns
                          </AntButton>
                        </AntTooltip>
                      </AntDropdown>

                      <AntButton
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setIsCreateModalOpen(true)}
                        disabled={loading}
                        style={{ height: "32px" }}
                      >
                        Create
                      </AntButton>
                    </div>

                    <div className="flex items-center gap-2">
                      <AntButton
                        type="primary"
                        icon={<FileExcelOutlined />}
                        onClick={handleOpenExportConfig}
                        disabled={loading}
                      >
                        Export to Excel
                      </AntButton>
                    </div>
                  </div>
                </div>
              </div>
            </AntCard>

            {/* Container cho cả selected info và rows per page */}
            <div className="mb-4 py-2 flex justify-between items-center">
              <div>{renderSelectedInfo()}</div>
              <div>{renderRowsPerPage()}</div>
            </div>

            <AntCard
              className="mt-4 shadow-sm"
              bodyStyle={{ padding: "8px 16px" }}
            >
              <div style={{ overflowX: "auto" }}>
                <style>
                  {`
                    .ant-table-thead > tr > th {
                      padding-top: 16px !important;
                      vertical-align: top !important;
                    }
                    .ant-table-selection-column {
                      padding-top: 16px !important;
                      vertical-align: top !important;
                    }
                  `}
                </style>
                <AntTable
                  rowKey="id"
                  columns={antColumns}
                  dataSource={sortedItems}
                  pagination={false}
                  loading={false}
                  rowSelection={{
                    selectedRowKeys: Array.from(
                      selectedKeys instanceof Set ? selectedKeys : []
                    ),
                    onChange: (keys) => handleSelectionChange(new Set(keys)),
                    columnTitle: renderSelectAll,
                  }}
                  scroll={{ x: "max-content" }}
                  bordered
                />
              </div>
              <AntCard className="mt-4 shadow-sm">
                <Row justify="center" align="middle">
                  <Space size="large" align="center">
                    <Typography.Text type="secondary">
                      Total {filteredItems.length} items
                    </Typography.Text>
                    <Space align="center" size="large">
                      <AntPagination
                        current={page}
                        pageSize={rowsPerPage}
                        total={filteredItems.length}
                        onChange={onPageChange}
                        showSizeChanger={false}
                        showTotal={() => ""}
                        style={{ paddingLeft: "25px" }}
                      />
                      <Space align="center">
                        <Typography.Text type="secondary">
                          Go to page:
                        </Typography.Text>
                        <InputNumber
                          min={1}
                          max={Math.max(1, pages)}
                          value={page}
                          onChange={(value: number | null) => {
                            if (value && value >= 1 && value <= pages) {
                              onPageChange(value);
                            }
                          }}
                          style={{ width: "60px" }}
                        />
                      </Space>
                    </Space>
                  </Space>
                </Row>
              </AntCard>
            </AntCard>
          </Spin>
        </div>
      )}

      {isCreateModalOpen && (
        <AntModal
          title="Add New Truck"
          open={isCreateModalOpen}
          onCancel={() => setIsCreateModalOpen(false)}
          footer={null}
          destroyOnClose
          width={500}
        >
          <CreateTruckForm
            onClose={() => setIsCreateModalOpen(false)}
            onCreate={() => {
              fetchTrucks();
              setIsCreateModalOpen(false);
            }}
          />
        </AntModal>
      )}

      <AntModal
        title={`Confirm ${
          confirmBulkActionType === "activate" ? "Activation" : "Deactivation"
        }`}
        open={isConfirmBulkActionModalOpen}
        onCancel={() => setIsConfirmBulkActionModalOpen(false)}
        footer={[
          <AntButton
            key="cancel"
            onClick={() => setIsConfirmBulkActionModalOpen(false)}
          >
            Cancel
          </AntButton>,
          <AntButton
            key="confirm"
            type={confirmBulkActionType === "activate" ? "primary" : "primary"}
            danger={confirmBulkActionType === "deactivate"}
            onClick={handleConfirmBulkAction}
            loading={loading && !!confirmBulkActionType}
          >
            Confirm {capitalize(confirmBulkActionType || "")}
          </AntButton>,
        ]}
      >
        <p>
          Are you sure you want to{" "}
          {confirmBulkActionType === "activate" ? "activate" : "deactivate"} the
          selected truck(s)? (
          {
            getSelectedTruckIdsByStatus(
              confirmBulkActionType === "activate" ? "Inactive" : "Active"
            ).length
          }{" "}
          item(s))
        </p>
      </AntModal>

      <ConfirmDeleteTruckModal
        truck={deletingTruck}
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirmDelete={handleConfirmDelete}
      />

      <TruckFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApply={handleApplyAdvancedFilters}
        onReset={handleResetFilters}
        initialFilters={advancedFilters}
      />

      <ExportConfigModal
        visible={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        config={exportConfig}
        onChange={handleExportConfigChange}
        filters={{
          filterValue,
          statusFilter: Array.isArray(statusFilter)
            ? statusFilter
            : statusFilter === "all"
            ? []
            : Array.from(statusFilter as Set<string>),
          advancedFilters,
          currentPage: page,
          pageSize: rowsPerPage,
        }}
        trucks={trucks}
        statusOptions={statusOptions.map((option) => ({
          label: option.name,
          value: option.uid,
        }))}
      />
    </div>
  );
}
