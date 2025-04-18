import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  PlusIcon,
  VerticalDotsIcon,
  SearchIcon,
  ChevronDownIcon,
  DrugIcon,
} from "./Icons";
import {
  UndoOutlined,
  AppstoreOutlined,
  FilterOutlined,
  SettingOutlined,
  PlusOutlined,
  TagOutlined,
  SearchOutlined,
  FileExcelOutlined,
  EyeOutlined,
  FormOutlined,
  ExclamationCircleOutlined,
  ArrowLeftOutlined,
  DownOutlined,
  MedicineBoxOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  StopOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import {
  Card,
  Button as AntButton,
  Select,
  Tooltip,
  Dropdown as AntDropdown,
  Menu,
  Checkbox,
  Tag,
  Typography,
  InputNumber,
  Row,
  Space,
  Table as AntTable,
  Pagination,
  Spin,
  message,
  Modal,
  Popconfirm,
  Button,
  Form,
  Image,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  getDrugs,
  deleteDrug,
  DrugResponse,
  getDrugById,
  activateDrugs,
  deactivateDrugs,
  DrugFilterParams,
} from "@/api/drug";
import {
  Button as HeroButton,
  DropdownTrigger,
  Dropdown as HeroDropdown,
  DropdownMenu,
  DropdownItem,
  Chip,
  Selection,
  ChipProps,
  SortDescriptor,
} from "@heroui/react";
import { CreateDrugForm } from "./CreateDrugForm";
import { useRouter } from "next/router";
import dayjs from "dayjs";
import DrugFilterModal from "./DrugFilterModal";
import ExportConfigModal, { DrugExportConfigWithUI } from "./ExportConfigModal";

// Import các component shared mới
import PageContainer from "../shared/PageContainer";
import ToolbarCard from "../shared/ToolbarCard";
import TableControls, {
  createDeleteBulkAction,
  createActivateBulkAction,
  createDeactivateBulkAction,
} from "../shared/TableControls";
import PaginationFooter from "../shared/PaginationFooter";

const { Option } = Select;
const { Text } = Typography;

export function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
}

const columns = [
  { name: "DRUG CODE", uid: "drugCode", sortable: true },
  { name: "NAME", uid: "name", sortable: true },
  { name: "DRUG GROUP", uid: "drugGroup", sortable: true },
  { name: "UNIT", uid: "unit" },
  { name: "DESCRIPTION", uid: "description" },
  { name: "PRICE", uid: "price", sortable: true },
  { name: "MANUFACTURER", uid: "manufacturer", sortable: true },
  { name: "CREATED AT", uid: "createdAt", sortable: true },
  { name: "STATUS", uid: "status" },
  { name: "ACTIONS", uid: "actions" },
];

const statusOptions = [
  { name: "Active", uid: "Active" },
  { name: "Inactive", uid: "Inactive" },
];

const statusColorMap: Record<string, ChipProps["color"]> = {
  Active: "success",
  Inactive: "danger",
};

const INITIAL_VISIBLE_COLUMNS = [
  "drugCode",
  "name",
  "drugGroup",
  "unit",
  "price",
  "manufacturer",
  "createdAt",
  "status",
  "actions",
];

export function Drugs() {
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingDrug, setDeletingDrug] = useState<DrugResponse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterValue, setFilterValue] = useState("");
  const [selectedDrugs, setSelectedDrugs] = useState<DrugResponse[]>([]);
  const [showActivate, setShowActivate] = useState(false);
  const [showDeactivate, setShowDeactivate] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    "activate" | "deactivate" | null
  >(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isLoadingAllItems, setIsLoadingAllItems] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading drugs...");
  const [messageApi, contextHolder] = message.useMessage();
  const [totalItemsCount, setTotalItemsCount] = useState(0);

  // Chỉnh sửa State để đồng bộ với TableControls
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<Selection>(
    new Set(INITIAL_VISIBLE_COLUMNS)
  );
  // Định nghĩa columnVisibility với dạng Record<string, boolean> cho phù hợp với TableControls
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(
    INITIAL_VISIBLE_COLUMNS.reduce((acc, col) => ({ ...acc, [col]: true }), {})
  );
  const [statusFilter, setStatusFilter] = useState<Selection>("all");
  const [pageSize, setPageSize] = useState(10);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "createdAt",
    direction: "descending",
  });

  const [page, setPage] = useState(1);
  const [drugs, setDrugs] = useState<DrugResponse[]>([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [drugCodes, setDrugCodes] = useState<string[]>([]);
  const [drugNames, setDrugNames] = useState<string[]>([]);
  const [drugGroups, setDrugGroups] = useState<any[]>([]);
  const [manufacturers, setManufacturers] = useState<string[]>([]);

  // Thêm state cho việc quản lý bulk actions
  const [deletingItems, setDeletingItems] = useState<boolean>(false);
  const [activatingItems, setActivatingItems] = useState<boolean>(false);
  const [deactivatingItems, setDeactivatingItems] = useState<boolean>(false);

  // Filter states
  const [advancedFilters, setAdvancedFilters] = useState({
    drugCode: "",
    drugName: "",
    drugGroupId: "",
    manufacturer: "",
    priceRange: [null, null] as [number | null, number | null],
    dateRange: [null, null] as [dayjs.Dayjs | null, dayjs.Dayjs | null],
    createdDateRange: [null, null] as [dayjs.Dayjs | null, dayjs.Dayjs | null],
    updatedDateRange: [null, null] as [dayjs.Dayjs | null, dayjs.Dayjs | null],
    sortBy: "CreatedAt",
    ascending: false,
  });

  // Export to Excel states
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportConfig, setExportConfig] = useState<DrugExportConfigWithUI>({
    exportAllPages: true,
    includeDrugCode: true,
    includeName: true,
    includeUnit: true,
    includePrice: true,
    includeDescription: true,
    includeManufacturer: true,
    includeDrugGroup: true,
    includeCreatedAt: true,
    includeUpdatedAt: true,
    includeStatus: true,
  });

  const extractFilterOptions = useCallback((data: DrugResponse[]) => {
    // Extract drug codes
    const codes = [...new Set(data.map((drug) => drug.drugCode))];
    setDrugCodes(codes);

    // Extract drug names
    const names = [...new Set(data.map((drug) => drug.name))];
    setDrugNames(names);

    // Extract drug groups
    const groups = data.reduce((acc: any[], drug) => {
      if (drug.drugGroup && !acc.some((g) => g.id === drug.drugGroup.id)) {
        acc.push(drug.drugGroup);
      }
      return acc;
    }, []);
    setDrugGroups(groups);

    // Extract manufacturers
    const mfrs = [
      ...new Set(
        data
          .filter((drug) => drug.manufacturer)
          .map((drug) => drug.manufacturer as string)
      ),
    ];
    setManufacturers(mfrs);
  }, []);

  const fetchDrugs = useCallback(async () => {
    setLoading(true);
    setLoadingMessage("Loading drugs...");
    try {
      // Thử gọi API không có bất kỳ filter nào để lấy toàn bộ dữ liệu
      const emptyFilter: DrugFilterParams = {
        page: 1,
        pageSize: 1000, // Số lượng lớn để lấy tất cả dữ liệu
      };

      const result = await getDrugs(emptyFilter);
      if (Array.isArray(result)) {
        setDrugs(result);
        setTotalItemsCount(result.length); // Lưu tổng số items
        extractFilterOptions(result);
      } else if (
        result &&
        typeof result === "object" &&
        Array.isArray(result.data)
      ) {
        setDrugs(result.data);
        setTotalItemsCount(result.data.length); // Lưu tổng số items từ response.data
        extractFilterOptions(result.data);
      } else if (result && Array.isArray(result)) {
        setDrugs(result);
        setTotalItemsCount(result.length); // Lưu tổng số items
        extractFilterOptions(result);
      }

      setIsReady(true);
    } catch (error) {
      console.error("Error fetching drugs:", error);
      messageApi.error("Failed to fetch drugs", 5);
      setDrugs([]);
      setTotalItemsCount(0);
    } finally {
      setLoading(false);
    }
  }, [messageApi]);

  useEffect(() => {
    setPage(1); // Reset trang về 1 khi filter thay đổi
  }, [statusFilter, filterValue]);

  useEffect(() => {
    fetchDrugs();
  }, [fetchDrugs]);

  useEffect(() => {
    let selected: DrugResponse[] = [];

    if (selectedKeys === "all") {
      selected = drugs; // Nếu chọn "all", lấy toàn bộ danh sách thuốc
    } else {
      selected = drugs.filter((drug) =>
        (selectedKeys as Set<string>).has(drug.id)
      );
    }

    setSelectedDrugs(selected);

    const hasActive = selected.some((drug) => drug.status === "Active");
    const hasInactive = selected.some((drug) => drug.status === "Inactive");

    setShowActivate(hasInactive);
    setShowDeactivate(hasActive);
  }, [selectedKeys, drugs]);

  const hasSearchFilter = Boolean(filterValue);

  const headerColumns = React.useMemo(() => {
    if (visibleColumns === "all") return columns;

    return columns.filter((column) =>
      Array.from(visibleColumns).includes(column.uid)
    );
  }, [visibleColumns]);

  /**
   * Search filter
   */
  const filteredItems = React.useMemo(() => {
    let filteredDrugs = [...drugs];

    if (hasSearchFilter) {
      const lowerFilter = filterValue.toLowerCase();

      filteredDrugs = filteredDrugs.filter(
        (drug) =>
          drug.name.toLowerCase().includes(lowerFilter) ||
          drug.drugCode.toLowerCase().includes(lowerFilter) ||
          (drug.drugGroup?.groupName?.toLowerCase() || "").includes(
            lowerFilter
          ) ||
          (drug.manufacturer?.toLowerCase() || "").includes(lowerFilter)
      );
    }

    if (
      statusFilter !== "all" &&
      Array.from(statusFilter).length !== statusOptions.length
    ) {
      filteredDrugs = filteredDrugs.filter(
        (drug) =>
          drug.status !== undefined &&
          Array.from(statusFilter).includes(drug.status)
      );
    }

    return filteredDrugs;
  }, [drugs, filterValue, statusFilter]);

  // Add a function to handle sort direction change
  const handleSortDirectionChange = (ascending: boolean) => {
    setSortDescriptor((prev) => ({
      ...prev,
      direction: ascending ? "ascending" : "descending",
    }));
  };

  // Update the filteredAndSortedItems to use sortDescriptor
  const filteredAndSortedItems = React.useMemo(() => {
    let processedDrugs = [...drugs];

    // Apply search filter (filterValue)
    if (filterValue) {
      processedDrugs = processedDrugs.filter(
        (drug) =>
          drug.name.toLowerCase().includes(filterValue.toLowerCase()) ||
          drug.drugCode.toLowerCase().includes(filterValue.toLowerCase()) ||
          (drug.drugGroup?.groupName?.toLowerCase() || "").includes(
            filterValue.toLowerCase()
          ) ||
          (drug.manufacturer?.toLowerCase() || "").includes(
            filterValue.toLowerCase()
          )
      );
    }

    // Apply status filter
    if (
      statusFilter !== "all" &&
      Array.from(statusFilter).length !== statusOptions.length
    ) {
      processedDrugs = processedDrugs.filter(
        (drug) =>
          drug.status !== undefined &&
          Array.from(statusFilter).includes(drug.status)
      );
    }

    // Apply createdDateRange filter
    const [createdStart, createdEnd] = advancedFilters.createdDateRange;
    if (createdStart) {
      processedDrugs = processedDrugs.filter((d) =>
        dayjs(d.createdAt).isSameOrAfter(createdStart, "day")
      );
    }
    if (createdEnd) {
      processedDrugs = processedDrugs.filter((d) =>
        dayjs(d.createdAt).isSameOrBefore(createdEnd, "day")
      );
    }

    // Apply updatedDateRange filter
    const [updatedStart, updatedEnd] = advancedFilters.updatedDateRange;
    if (updatedStart) {
      processedDrugs = processedDrugs.filter(
        (d) =>
          d.updatedAt && dayjs(d.updatedAt).isSameOrAfter(updatedStart, "day")
      );
    }
    if (updatedEnd) {
      processedDrugs = processedDrugs.filter(
        (d) =>
          d.updatedAt && dayjs(d.updatedAt).isSameOrBefore(updatedEnd, "day")
      );
    }

    // Apply price range filter
    if (advancedFilters.priceRange[0] !== null) {
      processedDrugs = processedDrugs.filter(
        (d) =>
          parseFloat(d.price as unknown as string) >=
          (advancedFilters.priceRange[0] || 0)
      );
    }
    if (advancedFilters.priceRange[1] !== null) {
      processedDrugs = processedDrugs.filter(
        (d) =>
          parseFloat(d.price as unknown as string) <=
          (advancedFilters.priceRange[1] || 0)
      );
    }

    // Apply drug group filter
    if (advancedFilters.drugGroupId) {
      processedDrugs = processedDrugs.filter(
        (d) => d.drugGroup?.id === advancedFilters.drugGroupId
      );
    }

    // Apply manufacturer filter
    if (advancedFilters.manufacturer) {
      processedDrugs = processedDrugs.filter((d) =>
        d.manufacturer
          ?.toLowerCase()
          .includes(advancedFilters.manufacturer.toLowerCase())
      );
    }

    // Apply sorting
    const sortField = sortDescriptor.column as keyof DrugResponse;
    const sortDirection = sortDescriptor.direction;

    if (sortField) {
      processedDrugs.sort((a, b) => {
        // Handle special cases first
        if (sortField === "drugGroup") {
          const groupNameA = a.drugGroup?.groupName || "";
          const groupNameB = b.drugGroup?.groupName || "";
          return sortDirection === "descending"
            ? groupNameB.localeCompare(groupNameA)
            : groupNameA.localeCompare(groupNameB);
        }

        if (sortField === "price") {
          const priceA = parseFloat(a.price as unknown as string) || 0;
          const priceB = parseFloat(b.price as unknown as string) || 0;
          return sortDirection === "descending"
            ? priceB - priceA
            : priceA - priceB;
        }

        if (sortField === "createdAt" || sortField === "updatedAt") {
          // Handle date fields
          const dateA = a[sortField] ? dayjs(a[sortField] as string).unix() : 0;
          const dateB = b[sortField] ? dayjs(b[sortField] as string).unix() : 0;
          return sortDirection === "descending" ? dateB - dateA : dateA - dateB;
        }

        // Default string comparison for other fields
        const strA = String(a[sortField] || "");
        const strB = String(b[sortField] || "");
        return sortDirection === "descending"
          ? strB.localeCompare(strA)
          : strA.localeCompare(strB);
      });
    }

    return processedDrugs;
  }, [drugs, filterValue, statusFilter, sortDescriptor, advancedFilters]);

  // Calculate the total number of pages based on filtered and sorted items
  const pages = Math.ceil(filteredAndSortedItems.length / pageSize);

  // Then apply pagination to get the current page items
  const paginatedItems = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return filteredAndSortedItems.slice(start, end);
  }, [filteredAndSortedItems, page, pageSize]);

  const handleOpenDetails = async (id: string) => {
    router.push(`/drug/${id}`);
  };

  const handleOpenDeleteModal = async (id: string) => {
    try {
      const drug = await getDrugById(id);
      setDeletingDrug(drug);
      setIsDeleteModalOpen(true);
    } catch (error) {
      messageApi.error("Failed to load drug details for deletion", 5);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingDrug) return;
    try {
      await deleteDrug(deletingDrug.id);
      messageApi.success("Drug deleted successfully", 5);
      await fetchDrugs();
      setSelectedKeys(new Set());
      setIsDeleteModalOpen(false);
      setDeletingDrug(null);
    } catch (error) {
      messageApi.error("Failed to delete drug", 5);
    }
  };

  const handleActivate = async () => {
    const ids = selectedDrugs
      .filter((d) => d.status === "Inactive")
      .map((d) => d.id);
    if (ids.length === 0) return;

    setLoading(true);
    setLoadingMessage("Activating drugs...");
    try {
      await activateDrugs(ids);
      messageApi.success("Drugs activated successfully", 5);
      fetchDrugs();
      setSelectedKeys(new Set());
    } catch (error) {
      messageApi.error("Failed to activate drugs", 5);
      console.error("Error activating drugs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    const ids = selectedDrugs
      .filter((d) => d.status === "Active")
      .map((d) => d.id);
    if (ids.length === 0) return;

    setLoading(true);
    setLoadingMessage("Deactivating drugs...");
    try {
      await deactivateDrugs(ids);
      messageApi.success("Drugs deactivated successfully", 5);
      fetchDrugs();
      setSelectedKeys(new Set());
    } catch (error) {
      messageApi.error("Failed to deactivate drugs", 5);
      console.error("Error deactivating drugs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmActivate = () => {
    setConfirmAction("activate");
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDeactivate = () => {
    setConfirmAction("deactivate");
    setIsConfirmModalOpen(true);
  };

  const handleConfirmAction = async () => {
    if (confirmAction === "activate") {
      await handleActivate();
    } else if (confirmAction === "deactivate") {
      await handleDeactivate();
    }
    setIsConfirmModalOpen(false);
    setConfirmAction(null);
  };

  const formatDate = (dateString: string | number | undefined) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return `${date.toLocaleDateString("vi-VN")} ${date.getHours()}:${String(
      date.getMinutes()
    ).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`;
  };

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      currencyDisplay: "code",
    }).format(numPrice);
  };

  const handleOpenEditModal = (id: string) => {
    router.push(`/drug/${id}?edit=true`);
  };

  const handleBack = () => {
    router.back();
  };

  const renderCell = React.useCallback(
    (drug: DrugResponse, columnKey: React.Key) => {
      const cellValue = drug[columnKey as keyof DrugResponse];

      switch (columnKey) {
        case "name":
          return (
            <div className="flex flex-col items-start">
              <div className="flex items-center">
                <img
                  src={drug.imageUrl}
                  alt={drug.name}
                  className="w-8 h-8 mr-2 rounded cursor-pointer"
                  onClick={() => handleOpenDetails(drug.id)}
                />
                <p
                  className="text-bold text-small capitalize text-primary cursor-pointer hover:underline"
                  onClick={() => handleOpenDetails(drug.id)}
                >
                  {cellValue as string}
                </p>
              </div>
            </div>
          );
        case "price":
          return formatPrice(cellValue as string | number);
        case "status":
          return (
            <Chip
              className="capitalize"
              color={statusColorMap[drug.status as keyof typeof statusColorMap]}
              size="sm"
              variant="flat"
            >
              {cellValue as string}
            </Chip>
          );
        case "description":
          return cellValue ? (
            <span
              title={cellValue as string}
              style={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "150px",
                display: "inline-block",
              }}
            >
              {cellValue as string}
            </span>
          ) : (
            "-"
          );
        case "createdAt":
          return cellValue ? formatDate(cellValue as string) : "-";
        case "drugGroup":
          return cellValue && typeof cellValue === "object" ? (
            <div
              className="text-bold text-small capitalize text-primary cursor-pointer hover:underline"
              onClick={() =>
                router.push(
                  `/drug-group/details?id=${(cellValue as { id: string }).id}`
                )
              }
            >
              {(cellValue as { groupName: string }).groupName}
            </div>
          ) : (
            "-"
          );
        case "actions":
          return (
            <div className="relative flex justify-center">
              <HeroDropdown>
                <DropdownTrigger>
                  <HeroButton isIconOnly size="sm" variant="light">
                    <VerticalDotsIcon className="text-default-300" />
                  </HeroButton>
                </DropdownTrigger>
                <DropdownMenu>
                  <DropdownItem
                    key="edit"
                    onClick={() => handleOpenEditModal(drug.id)}
                  >
                    Edit
                  </DropdownItem>
                  <DropdownItem
                    key="delete"
                    className="text-danger"
                    onClick={() => handleOpenDeleteModal(drug.id)}
                  >
                    Delete
                  </DropdownItem>
                </DropdownMenu>
              </HeroDropdown>
            </div>
          );
        default:
          return typeof cellValue === "object"
            ? JSON.stringify(cellValue)
            : cellValue;
      }
    },
    []
  );

  const onNextPage = React.useCallback(() => {
    if (page < pages) {
      setPage(page + 1);
    }
  }, [page, pages]);

  const onPreviousPage = React.useCallback(() => {
    if (page > 1) {
      setPage(page - 1);
    }
  }, [page]);

  const onRowsPerPageChange = React.useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setPageSize(Number(e.target.value));
      setPage(1);
    },
    []
  );

  const onSearchChange = (value: string) => {
    setFilterValue(value || "");
    setPage(1); // Reset về trang đầu tiên khi tìm kiếm
  };

  const onClear = () => {
    setFilterValue("");
    setStatusFilter("all");
    setAdvancedFilters({
      drugCode: "",
      drugName: "",
      drugGroupId: "",
      manufacturer: "",
      priceRange: [null, null],
      dateRange: [null, null],
      createdDateRange: [null, null],
      updatedDateRange: [null, null],
      sortBy: "CreatedAt",
      ascending: false,
    });
    setPage(1);
  };

  const handleOpenFilterModal = React.useCallback(() => {
    setIsFilterModalOpen(true);
  }, []);

  const isFiltersApplied = React.useCallback(() => {
    return (
      filterValue !== "" ||
      statusFilter !== "all" ||
      advancedFilters.drugGroupId !== "" ||
      advancedFilters.manufacturer !== "" ||
      advancedFilters.priceRange[0] !== null ||
      advancedFilters.priceRange[1] !== null ||
      advancedFilters.dateRange[0] !== null ||
      advancedFilters.dateRange[1] !== null ||
      advancedFilters.createdDateRange[0] !== null ||
      advancedFilters.createdDateRange[1] !== null ||
      advancedFilters.updatedDateRange[0] !== null ||
      advancedFilters.updatedDateRange[1] !== null ||
      advancedFilters.sortBy !== "CreatedAt" ||
      advancedFilters.ascending !== false
    );
  }, [filterValue, statusFilter, advancedFilters]);

  // Insert handleRefresh function before topContent is defined
  const handleRefresh = async () => {
    setLoading(true);
    setLoadingMessage("Refreshing data...");
    try {
      await fetchDrugs();
      messageApi.success("Data refreshed successfully", 5);
    } catch (error) {
      messageApi.error("Failed to refresh data", 5);
      console.error("Error refreshing data:", error);
    } finally {
      setLoading(false);
    }
  };

  const topContent = React.useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <Select
              showSearch
              allowClear
              placeholder={
                <div style={{ display: "flex", alignItems: "center" }}>
                  <SearchOutlined style={{ marginRight: 8 }} />
                  <span>Search by drug code, name, or group...</span>
                </div>
              }
              value={filterValue || undefined}
              onChange={(value) => onSearchChange(value)}
              style={{ width: "300px" }}
              filterOption={(input, option) =>
                (option?.label?.toString().toLowerCase() ?? "").includes(
                  input.toLowerCase()
                )
              }
              options={[...drugs]
                .sort((a, b) => {
                  const dateA = dayjs(a.createdAt).unix();
                  const dateB = dayjs(b.createdAt).unix();
                  return dateB - dateA; // Sắp xếp giảm dần (mới nhất lên đầu)
                })
                .map((drug) => ({
                  value: drug.drugCode,
                  label: `${drug.drugCode} - ${drug.name}`,
                }))}
            />

            <Tooltip title="Advanced Filters">
              <AntButton
                icon={
                  <FilterOutlined
                    style={{
                      color: isFiltersApplied() ? "#1890ff" : undefined,
                    }}
                  />
                }
                onClick={handleOpenFilterModal}
              >
                Filters
              </AntButton>
            </Tooltip>

            <Select
              allowClear
              style={{ width: "120px" }}
              placeholder={
                <div style={{ display: "flex", alignItems: "center" }}>
                  <TagOutlined style={{ marginRight: 8 }} />
                  <span>Status</span>
                </div>
              }
              value={
                statusFilter !== "all"
                  ? Array.from(statusFilter as Set<string>)[0]
                  : undefined
              }
              onChange={(value) => {
                setStatusFilter(value ? new Set([value]) : "all");
              }}
              options={statusOptions.map((status) => ({
                value: status.uid,
                label: status.name,
              }))}
            />

            <Tooltip title="Reset All Filters">
              <AntButton
                icon={<UndoOutlined />}
                onClick={onClear}
                disabled={!isFiltersApplied()}
              >
                Reset
              </AntButton>
            </Tooltip>

            <AntDropdown
              menu={{
                items: [
                  {
                    key: "selectAll",
                    label: (
                      <Checkbox
                        checked={
                          (visibleColumns as Set<string>).size ===
                          columns.length
                        }
                        onChange={(e) => {
                          const newVisibility = { ...columnVisibility };
                          columns.forEach((col) => {
                            newVisibility[col.uid] = e.target.checked;
                          });
                          setColumnVisibility(newVisibility);

                          if (e.target.checked) {
                            setVisibleColumns(
                              new Set(columns.map((col) => col.uid))
                            );
                          } else {
                            // Khi bỏ tích, chỉ giữ lại cột đầu tiên
                            const firstColumn = columns[0].uid;
                            setVisibleColumns(new Set([firstColumn]));
                            messageApi.warning(
                              "At least one column must be visible.",
                              5
                            );
                          }
                        }}
                      >
                        Toggle All
                      </Checkbox>
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
                        <Checkbox
                          checked={(visibleColumns as Set<string>).has(
                            column.uid
                          )}
                          onChange={() => {
                            const newVisibility = { ...columnVisibility };
                            newVisibility[column.uid] =
                              !newVisibility[column.uid];
                            setColumnVisibility(newVisibility);

                            const newVisibilitySet = new Set(
                              visibleColumns as Set<string>
                            );
                            if (newVisibilitySet.has(column.uid)) {
                              // Kiểm tra nếu đây là cột cuối cùng
                              if (newVisibilitySet.size === 1) {
                                messageApi.warning(
                                  "Cannot hide the last visible column.",
                                  5
                                );
                                return;
                              }
                              newVisibilitySet.delete(column.uid);
                            } else {
                              newVisibilitySet.add(column.uid);
                            }
                            setVisibleColumns(newVisibilitySet);
                          }}
                        >
                          <span
                            style={{ color: "dimgray", fontWeight: "normal" }}
                          >
                            {capitalize(column.name)}
                          </span>
                        </Checkbox>
                      ),
                    })),
                  {
                    key: "actions",
                    label: (
                      <Checkbox
                        checked={(visibleColumns as Set<string>).has("actions")}
                        onChange={() => {
                          const newVisibility = { ...columnVisibility };
                          newVisibility.actions = !newVisibility.actions;
                          setColumnVisibility(newVisibility);

                          const newVisibilitySet = new Set(
                            visibleColumns as Set<string>
                          );
                          if (newVisibilitySet.has("actions")) {
                            // Kiểm tra nếu đây là cột cuối cùng
                            if (newVisibilitySet.size === 1) {
                              messageApi.warning(
                                "Cannot hide the last visible column.",
                                5
                              );
                              return;
                            }
                            newVisibilitySet.delete("actions");
                          } else {
                            newVisibilitySet.add("actions");
                          }
                          setVisibleColumns(newVisibilitySet);
                        }}
                      >
                        <span
                          style={{ color: "dimgray", fontWeight: "normal" }}
                        >
                          Actions
                        </span>
                      </Checkbox>
                    ),
                  },
                ],
                onClick: (e) => e.domEvent.stopPropagation(),
              }}
            >
              <Tooltip title="Column Settings">
                <AntButton icon={<SettingOutlined />}>Columns</AntButton>
              </Tooltip>
            </AntDropdown>

            <AntButton
              type="primary"
              onClick={() => setIsModalOpen(true)}
              style={{ display: "flex", alignItems: "center", gap: "4px" }}
              className="bg-blue-500"
            >
              <PlusOutlined />
              <span>Create</span>
            </AntButton>
          </div>

          <div>
            <AntButton
              type="primary"
              icon={<FileExcelOutlined />}
              onClick={() => setExportModalVisible(true)}
              style={{ display: "flex", alignItems: "center", gap: "4px" }}
            >
              Export to Excel
            </AntButton>
          </div>
        </div>
      </div>
    );
  }, [
    filterValue,
    statusFilter,
    visibleColumns,
    selectedKeys,
    onSearchChange,
    drugs,
    isFiltersApplied,
    onClear,
    handleOpenFilterModal,
  ]);

  const renderActiveFilters = () => {
    if (!isFiltersApplied()) return null;

    return (
      <div className="active-filters-summary mt-2 p-2">
        <div className="text-sm text-gray-600 mb-1">Active Filters:</div>
        <div className="flex flex-wrap gap-2">
          {filterValue && (
            <Tag closable onClose={() => setFilterValue("")}>
              Search: {filterValue}
            </Tag>
          )}

          {statusFilter !== "all" &&
            Array.from(statusFilter as Set<string>).map((status) => (
              <Tag
                key={status}
                closable
                color={statusColorMap[status as keyof typeof statusColorMap]}
                onClose={() => {
                  const newStatuses = new Set(
                    Array.from(statusFilter as Set<string>).filter(
                      (s) => s !== status
                    )
                  );
                  setStatusFilter(newStatuses.size > 0 ? newStatuses : "all");
                }}
              >
                Status: {status}
              </Tag>
            ))}

          {advancedFilters.drugGroupId && (
            <Tag
              closable
              onClose={() =>
                setAdvancedFilters((prev) => ({ ...prev, drugGroupId: "" }))
              }
            >
              Group:{" "}
              {drugGroups.find((g) => g.id === advancedFilters.drugGroupId)
                ?.groupName || advancedFilters.drugGroupId}
            </Tag>
          )}

          {advancedFilters.manufacturer && (
            <Tag
              closable
              onClose={() =>
                setAdvancedFilters((prev) => ({ ...prev, manufacturer: "" }))
              }
            >
              Manufacturer: {advancedFilters.manufacturer}
            </Tag>
          )}

          {advancedFilters.priceRange[0] !== null && (
            <Tag
              closable
              onClose={() =>
                setAdvancedFilters((prev) => ({
                  ...prev,
                  priceRange: [null, prev.priceRange[1]],
                }))
              }
            >
              Min Price: {formatPrice(advancedFilters.priceRange[0])}
            </Tag>
          )}

          {advancedFilters.priceRange[1] !== null && (
            <Tag
              closable
              onClose={() =>
                setAdvancedFilters((prev) => ({
                  ...prev,
                  priceRange: [prev.priceRange[0], null],
                }))
              }
            >
              Max Price: {formatPrice(advancedFilters.priceRange[1])}
            </Tag>
          )}

          {advancedFilters.createdDateRange[0] && (
            <Tag
              closable
              onClose={() =>
                setAdvancedFilters((prev) => ({
                  ...prev,
                  createdDateRange: [null, prev.createdDateRange[1]],
                }))
              }
            >
              Created From:{" "}
              {advancedFilters.createdDateRange[0].format("YYYY-MM-DD")}
            </Tag>
          )}

          {advancedFilters.createdDateRange[1] && (
            <Tag
              closable
              onClose={() =>
                setAdvancedFilters((prev) => ({
                  ...prev,
                  createdDateRange: [prev.createdDateRange[0], null],
                }))
              }
            >
              Created To:{" "}
              {advancedFilters.createdDateRange[1].format("YYYY-MM-DD")}
            </Tag>
          )}

          {advancedFilters.updatedDateRange[0] && (
            <Tag
              closable
              onClose={() =>
                setAdvancedFilters((prev) => ({
                  ...prev,
                  updatedDateRange: [null, prev.updatedDateRange[1]],
                }))
              }
            >
              Updated From:{" "}
              {advancedFilters.updatedDateRange[0].format("YYYY-MM-DD")}
            </Tag>
          )}

          {advancedFilters.updatedDateRange[1] && (
            <Tag
              closable
              onClose={() =>
                setAdvancedFilters((prev) => ({
                  ...prev,
                  updatedDateRange: [prev.updatedDateRange[0], null],
                }))
              }
            >
              Updated To:{" "}
              {advancedFilters.updatedDateRange[1].format("YYYY-MM-DD")}
            </Tag>
          )}

          {advancedFilters.sortBy !== "CreatedAt" && (
            <Tag
              closable
              onClose={() =>
                setAdvancedFilters((prev) => ({ ...prev, sortBy: "CreatedAt" }))
              }
            >
              Sort By: {advancedFilters.sortBy}
            </Tag>
          )}

          {advancedFilters.ascending !== false && (
            <Tag
              closable
              onClose={() =>
                setAdvancedFilters((prev) => ({ ...prev, ascending: false }))
              }
            >
              Sort: Ascending
            </Tag>
          )}

          <Tag icon={<UndoOutlined />} color="default" onClick={onClear}>
            Reset All
          </Tag>
        </div>
      </div>
    );
  };

  const onPageChange = (newPage: number, newPageSize?: number) => {
    setPage(newPage);
    if (newPageSize) {
      setPageSize(newPageSize);
    }

    // Cuộn lên đầu trang sau khi đổi trang
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const bottomContent = React.useMemo(() => {
    return (
      <div className="py-2 px-2">
        <div className="flex flex-col">
          {renderActiveFilters()}

          <div className="flex justify-between items-center mt-2">
            <span className="text-small text-default-400">
              Total {filteredAndSortedItems.length} items
            </span>
            <div className="flex items-center gap-4">
              {isReady && (
                <Pagination
                  current={page}
                  total={filteredAndSortedItems.length}
                  pageSize={pageSize}
                  onChange={(page) => onPageChange(page, pageSize)}
                  showSizeChanger={false}
                  showTotal={() => ""}
                  style={{ paddingLeft: "25px" }}
                />
              )}
              <div className="flex items-center gap-2">
                <span className="text-small text-default-400">Go to page:</span>
                <InputNumber
                  min={1}
                  max={Math.max(
                    1,
                    Math.ceil(filteredAndSortedItems.length / pageSize)
                  )}
                  value={page}
                  onPressEnter={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    const value = Number((e.target as HTMLInputElement).value);
                    if (
                      value > 0 &&
                      value <=
                        Math.ceil(filteredAndSortedItems.length / pageSize)
                    ) {
                      onPageChange(value, pageSize);
                    }
                  }}
                  onChange={(value) => {
                    if (
                      value &&
                      Number(value) > 0 &&
                      Number(value) <=
                        Math.ceil(filteredAndSortedItems.length / pageSize)
                    ) {
                      onPageChange(Number(value), pageSize);
                    }
                  }}
                  style={{ width: "60px" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }, [page, pageSize, filteredAndSortedItems.length, isReady, totalItemsCount]);

  // Update the handleApplyFilters function to handle sort direction
  const handleApplyFilters = (filters: any) => {
    console.log("Received filters in handleApplyFilters:", filters);

    // Cập nhật state advancedFilters
    setAdvancedFilters(filters);

    // Cập nhật sort direction
    handleSortDirectionChange(filters.ascending);

    // Đặt lại trang về 1 khi thay đổi bộ lọc
    setPage(1);

    // Đóng modal filter
    setIsFilterModalOpen(false);

    // Gọi fetchDrugs để áp dụng các bộ lọc sau khi đã cập nhật state
    // Sử dụng setTimeout để đảm bảo state đã được cập nhật
    setTimeout(() => {
      fetchDrugs();
    }, 100);
  };

  // Update the handleResetFilters function to reset sort direction
  const handleResetFilters = () => {
    console.log("Resetting filters from modal and reloading data...");

    // Đặt lại tất cả các state filter
    setAdvancedFilters({
      drugCode: "",
      drugName: "",
      drugGroupId: "",
      manufacturer: "",
      priceRange: [null, null],
      dateRange: [null, null],
      createdDateRange: [null, null],
      updatedDateRange: [null, null],
      sortBy: "CreatedAt",
      ascending: false,
    });

    // Reset sort direction
    setSortDescriptor({
      column: "createdAt",
      direction: "descending",
    });

    setFilterValue("");
    setStatusFilter("all");

    setPage(1);
    setIsFilterModalOpen(false);

    // Gọi API để lấy dữ liệu không có filter
    setTimeout(() => {
      // Gọi trực tiếp API với filter rỗng để đảm bảo lấy tất cả dữ liệu
      const emptyFilter: DrugFilterParams = {
        page: 1,
        pageSize: pageSize,
      };

      console.log(
        "Calling API with empty filters from modal reset:",
        emptyFilter
      );

      getDrugs(emptyFilter)
        .then((result) => {
          console.log("Data reloaded after modal reset:", result);

          if (Array.isArray(result)) {
            setDrugs(result);
            extractFilterOptions(result);
          } else if (
            result &&
            typeof result === "object" &&
            Array.isArray(result.data)
          ) {
            setDrugs(result.data);
            extractFilterOptions(result.data);
          } else if (result && Array.isArray(result)) {
            setDrugs(result);
            extractFilterOptions(result);
          }

          setIsReady(true);
        })
        .catch((error) => {
          console.error("Error reloading data after modal reset:", error);
          messageApi.error("Failed to reload data", 5);
          setIsReady(true);
          setDrugs([]);
        });
    }, 100);
  };

  // Handle Export Config modal
  const handleOpenExportConfig = () => {
    setExportModalVisible(true);
  };

  const handleExportConfigChange = (
    newConfig: Partial<DrugExportConfigWithUI>
  ) => {
    setExportConfig((prev) => ({ ...prev, ...newConfig }));
  };

  // Hàm xử lý chọn theo trạng thái
  const handleSelectByStatus = async (key: string) => {
    // Kiểm tra xem tùy chọn này đã được chọn hay chưa
    if (selectedOption === key) {
      // Nếu đã được chọn, bỏ chọn và xóa các lựa chọn
      setSelectedOption(null);
      setSelectedKeys(new Set([]));
    } else {
      // Nếu chưa, chọn nó và áp dụng lựa chọn
      setSelectedOption(key);

      let selectedDrugIds: string[] = [];

      switch (key) {
        case "page-active":
          // Chọn thuốc Active trên trang hiện tại
          selectedDrugIds = await getItemIdsByStatus(["Active"], true);
          break;
        case "all-active":
          // Chọn tất cả thuốc Active trên tất cả các trang
          selectedDrugIds = await getItemIdsByStatus(["Active"], false);
          break;
        case "page-inactive":
          // Chọn thuốc Inactive trên trang hiện tại
          selectedDrugIds = await getItemIdsByStatus(["Inactive"], true);
          break;
        case "all-inactive":
          // Chọn tất cả thuốc Inactive trên tất cả các trang
          selectedDrugIds = await getItemIdsByStatus(["Inactive"], false);
          break;
        default:
          break;
      }

      // Kiểm tra các thuốc đã chọn trước đó
      const previousSelectedDrugs = drugs.filter(
        (drug) =>
          selectedKeys instanceof Set &&
          (selectedKeys as Set<string>).has(drug.id)
      );

      // Kiểm tra xem có đang chọn cả Active và Inactive không
      if (previousSelectedDrugs.length > 0) {
        // Xác định trạng thái của các thuốc đã chọn
        const hasActiveSelected = previousSelectedDrugs.some(
          (drug) => drug.status === "Active"
        );
        const hasInactiveSelected = previousSelectedDrugs.some(
          (drug) => drug.status === "Inactive"
        );

        // Xác định trạng thái của các thuốc sẽ chọn
        const isSelectingActive = key.includes("active");
        const isSelectingInactive = key.includes("inactive");

        // Nếu đang cố gắng chọn cả Active và Inactive cùng lúc
        if (
          (hasActiveSelected && isSelectingInactive) ||
          (hasInactiveSelected && isSelectingActive)
        ) {
          messageApi.warning(
            "Cannot select both Active and Inactive drugs at the same time.",
            5
          );
          setSelectedOption(null);
          return;
        }
      }

      setSelectedKeys(new Set(selectedDrugIds));
    }
  };

  // Hàm để lấy tất cả ID theo trạng thái
  const getItemIdsByStatus = async (
    statuses: string[],
    currentPageOnly: boolean
  ): Promise<string[]> => {
    try {
      if (currentPageOnly) {
        // Chỉ lấy ID trên trang hiện tại theo trạng thái
        return paginatedItems
          .filter((drug) => drug.status && statuses.includes(drug.status))
          .map((drug) => drug.id);
      } else {
        // Lấy ID từ tất cả các trang
        setIsLoadingAllItems(true);
        const result = filteredAndSortedItems
          .filter((drug) => drug.status && statuses.includes(drug.status))
          .map((drug) => drug.id);

        setIsLoadingAllItems(false);
        return result;
      }
    } catch (error) {
      console.error("Error getting item IDs by status:", error);
      setIsLoadingAllItems(false);
      return [];
    }
  };

  // Hàm tạo danh sách cột cho bảng
  const renderColumns = () => {
    const visibleColumnsArray = Array.from(visibleColumns as Set<string>);

    const tableColumns: ColumnsType<DrugResponse> = [
      {
        title: (
          <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
            DRUG CODE
          </span>
        ),
        dataIndex: "drugCode",
        key: "drugCode",
        sorter: (a, b) => a.drugCode.localeCompare(b.drugCode),
        render: (text: string, record: DrugResponse) => (
          <Button
            type="link"
            onClick={() => handleOpenDetails(record.id)}
            style={{ padding: 0 }}
          >
            {text}
          </Button>
        ),
        fixed:
          visibleColumnsArray.indexOf("drugCode") === 0 ? "left" : undefined,
      },
      {
        title: (
          <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
            NAME
          </span>
        ),
        dataIndex: "name",
        key: "name",
        sorter: (a, b) => a.name.localeCompare(b.name),
        ellipsis: true,
        render: (text: string, record: DrugResponse) => (
          <Space>
            {record.imageUrl ? (
              <div style={{ cursor: "pointer" }}>
                <Image
                  src={record.imageUrl}
                  alt={text}
                  width={40}
                  height={40}
                  style={{ objectFit: "cover", borderRadius: "4px" }}
                  preview={{
                    mask: null,
                    maskClassName: "ant-image-mask-custom",
                  }}
                />
              </div>
            ) : (
              <div
                style={{
                  width: 40,
                  height: 40,
                  backgroundColor: "#f0f0f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "4px",
                }}
              >
                <MedicineBoxOutlined
                  style={{ fontSize: "20px", color: "#bfbfbf" }}
                />
              </div>
            )}
            <span>{text}</span>
          </Space>
        ),
      },
      {
        title: (
          <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
            DRUG GROUP
          </span>
        ),
        dataIndex: "drugGroup",
        key: "drugGroup",
        render: (drugGroup: any) => drugGroup?.groupName || "-",
        sorter: (a, b) => {
          const groupA = a.drugGroup?.groupName || "";
          const groupB = b.drugGroup?.groupName || "";
          return groupA.localeCompare(groupB);
        },
      },
      {
        title: (
          <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
            UNIT
          </span>
        ),
        dataIndex: "unit",
        key: "unit",
      },
      {
        title: (
          <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
            DESCRIPTION
          </span>
        ),
        dataIndex: "description",
        key: "description",
        ellipsis: true,
        render: (text: string) => text || "-",
      },
      {
        title: (
          <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
            PRICE
          </span>
        ),
        dataIndex: "price",
        key: "price",
        render: (price: number) => formatPrice(price),
        sorter: (a, b) => a.price - b.price,
      },
      {
        title: (
          <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
            MANUFACTURER
          </span>
        ),
        dataIndex: "manufacturer",
        key: "manufacturer",
        sorter: (a, b) => {
          const mfrA = a.manufacturer || "";
          const mfrB = b.manufacturer || "";
          return mfrA.localeCompare(mfrB);
        },
      },
      {
        title: (
          <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
            CREATED AT
          </span>
        ),
        dataIndex: "createdAt",
        key: "createdAt",
        render: (date: string) => formatDate(date),
        sorter: (a, b) => {
          const dateA = dayjs(a.createdAt).unix();
          const dateB = dayjs(b.createdAt).unix();
          return dateA - dateB;
        },
      },
      {
        title: (
          <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
            STATUS
          </span>
        ),
        dataIndex: "status",
        key: "status",
        render: (status: string) => (
          <Tag color={status === "Active" ? "success" : "error"}>{status}</Tag>
        ),
        align: "center",
      },
      {
        title: (
          <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
            ACTIONS
          </span>
        ),
        key: "actions",
        fixed:
          visibleColumnsArray.indexOf("actions") ===
          visibleColumnsArray.length - 1
            ? "right"
            : undefined,
        width: 120,
        render: (_, record: DrugResponse) => (
          <div style={{ textAlign: "center" }}>
            <AntDropdown
              overlay={
                <Menu>
                  <Menu.Item
                    key="edit"
                    icon={<FormOutlined />}
                    onClick={() => handleOpenEditModal(record.id)}
                  >
                    Edit
                  </Menu.Item>
                  {record.status === "Active" ? (
                    <Menu.Item
                      key="deactivate"
                      style={{ color: "red" }}
                      icon={<StopOutlined />}
                      onClick={() => {
                        setSelectedDrugs([record]);
                        setConfirmAction("deactivate");
                        setIsConfirmModalOpen(true);
                      }}
                      danger
                    >
                      Deactivate
                    </Menu.Item>
                  ) : (
                    <Menu.Item
                      key="activate"
                      icon={<CheckCircleOutlined />}
                      style={{ color: "green" }}
                      onClick={() => {
                        setSelectedDrugs([record]);
                        setConfirmAction("activate");
                        setIsConfirmModalOpen(true);
                      }}
                    >
                      Activate
                    </Menu.Item>
                  )}
                  <Menu.Item
                    key="delete"
                    icon={<DeleteOutlined />}
                    danger
                    onClick={() => handleOpenDeleteModal(record.id)}
                  >
                    Delete
                  </Menu.Item>
                </Menu>
              }
              placement="bottomRight"
              trigger={["click"]}
            >
              <Button icon={<MoreOutlined />} size="small" />
            </AntDropdown>
          </div>
        ),
      },
    ];

    // Lọc các cột cần hiển thị dựa trên visibleColumns
    return tableColumns.filter((col) => {
      const key = col.key as string;
      return visibleColumnsArray.includes(key);
    });
  };

  return (
    <PageContainer
      title="Drug Management"
      icon={<MedicineBoxOutlined style={{ fontSize: "24px" }} />}
      onBack={() => router.back()}
    >
      {contextHolder}

      {/* Search and Filters Toolbar */}
      <ToolbarCard
        leftContent={
          <>
            {/* Drug Code/Name Search */}
            <Select
              showSearch
              allowClear
              placeholder={
                <div style={{ display: "flex", alignItems: "center" }}>
                  <SearchOutlined style={{ marginRight: 8 }} />
                  <span>Search by drug code, name, or group...</span>
                </div>
              }
              value={filterValue || undefined}
              onChange={(value) => onSearchChange(value)}
              style={{ width: "300px" }}
              filterOption={(input, option) =>
                (option?.label?.toString().toLowerCase() ?? "").includes(
                  input.toLowerCase()
                )
              }
              options={[...drugs]
                .sort((a, b) => {
                  const dateA = dayjs(a.createdAt).unix();
                  const dateB = dayjs(b.createdAt).unix();
                  return dateB - dateA; // Sắp xếp giảm dần (mới nhất lên đầu)
                })
                .map((drug) => ({
                  value: drug.drugCode,
                  label: `${drug.drugCode} - ${drug.name}`,
                }))}
            />

            {/* Advanced Filters */}
            <Tooltip title="Advanced Filters">
              <Button
                icon={
                  <FilterOutlined
                    style={{
                      color: isFiltersApplied() ? "#1890ff" : undefined,
                    }}
                  />
                }
                onClick={handleOpenFilterModal}
              >
                Filters
              </Button>
            </Tooltip>

            {/* Status Filter */}
            <Select
              allowClear
              style={{ width: "120px" }}
              placeholder={
                <div style={{ display: "flex", alignItems: "center" }}>
                  <TagOutlined style={{ marginRight: 8 }} />
                  <span>Status</span>
                </div>
              }
              value={
                statusFilter !== "all"
                  ? Array.from(statusFilter as Set<string>)[0]
                  : undefined
              }
              onChange={(value) => {
                setStatusFilter(value ? new Set([value]) : "all");
              }}
              options={statusOptions.map((status) => ({
                value: status.uid,
                label: status.name,
              }))}
            />

            {/* Reset Button */}
            <Tooltip title="Reset All Filters">
              <Button
                icon={<UndoOutlined />}
                onClick={onClear}
                disabled={!isFiltersApplied()}
              />
            </Tooltip>

            {/* Column Settings Dropdown */}
            <AntDropdown
              menu={{
                items: [
                  {
                    key: "selectAll",
                    label: (
                      <Checkbox
                        checked={
                          (visibleColumns as Set<string>).size ===
                          columns.length
                        }
                        onChange={(e) => {
                          const newVisibility = { ...columnVisibility };
                          columns.forEach((col) => {
                            newVisibility[col.uid] = e.target.checked;
                          });
                          setColumnVisibility(newVisibility);

                          if (e.target.checked) {
                            setVisibleColumns(
                              new Set(columns.map((col) => col.uid))
                            );
                          } else {
                            // Khi bỏ tích, chỉ giữ lại cột đầu tiên
                            const firstColumn = columns[0].uid;
                            setVisibleColumns(new Set([firstColumn]));
                            messageApi.warning(
                              "At least one column must be visible.",
                              5
                            );
                          }
                        }}
                      >
                        Toggle All
                      </Checkbox>
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
                        <Checkbox
                          checked={(visibleColumns as Set<string>).has(
                            column.uid
                          )}
                          onChange={() => {
                            const newVisibility = { ...columnVisibility };
                            newVisibility[column.uid] =
                              !newVisibility[column.uid];
                            setColumnVisibility(newVisibility);

                            const newVisibilitySet = new Set(
                              visibleColumns as Set<string>
                            );
                            if (newVisibilitySet.has(column.uid)) {
                              // Kiểm tra nếu đây là cột cuối cùng
                              if (newVisibilitySet.size === 1) {
                                messageApi.warning(
                                  "Cannot hide the last visible column.",
                                  5
                                );
                                return;
                              }
                              newVisibilitySet.delete(column.uid);
                            } else {
                              newVisibilitySet.add(column.uid);
                            }
                            setVisibleColumns(newVisibilitySet);
                          }}
                        >
                          <span
                            style={{ color: "dimgray", fontWeight: "normal" }}
                          >
                            {capitalize(column.name)}
                          </span>
                        </Checkbox>
                      ),
                    })),
                  {
                    key: "actions",
                    label: (
                      <Checkbox
                        checked={(visibleColumns as Set<string>).has("actions")}
                        onChange={() => {
                          const newVisibility = { ...columnVisibility };
                          newVisibility.actions = !newVisibility.actions;
                          setColumnVisibility(newVisibility);

                          const newVisibilitySet = new Set(
                            visibleColumns as Set<string>
                          );
                          if (newVisibilitySet.has("actions")) {
                            // Kiểm tra nếu đây là cột cuối cùng
                            if (newVisibilitySet.size === 1) {
                              messageApi.warning(
                                "Cannot hide the last visible column.",
                                5
                              );
                              return;
                            }
                            newVisibilitySet.delete("actions");
                          } else {
                            newVisibilitySet.add("actions");
                          }
                          setVisibleColumns(newVisibilitySet);
                        }}
                      >
                        <span
                          style={{ color: "dimgray", fontWeight: "normal" }}
                        >
                          Actions
                        </span>
                      </Checkbox>
                    ),
                  },
                ],
                onClick: (e) => e.domEvent.stopPropagation(),
              }}
            >
              <Tooltip title="Column Settings">
                <Button icon={<SettingOutlined />}>Columns</Button>
              </Tooltip>
            </AntDropdown>

            {/* Create Button */}
            <Button
              type="primary"
              onClick={() => setIsModalOpen(true)}
              icon={<PlusOutlined />}
            >
              Create
            </Button>
          </>
        }
        rightContent={
          <Button
            type="primary"
            icon={<FileExcelOutlined />}
            onClick={() => setExportModalVisible(true)}
          >
            Export to Excel
          </Button>
        }
      />

      {isModalOpen && (
        <Modal
          className="max-w-3xl"
          open={isModalOpen}
          onCancel={() => setIsModalOpen(false)}
          footer={null}
          width={800}
          title="Add New Drug"
        >
          <CreateDrugForm
            onClose={() => {
              setIsModalOpen(false);
            }}
            onCreate={fetchDrugs}
          />
        </Modal>
      )}

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
          selected drugs?
        </p>
      </Modal>

      <DrugFilterModal
        visible={isFilterModalOpen}
        onCancel={() => setIsFilterModalOpen(false)}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        filters={advancedFilters}
        drugGroups={drugGroups}
        drugCodes={drugCodes}
        drugNames={drugNames}
        manufacturers={manufacturers}
      />

      <ExportConfigModal
        visible={exportModalVisible}
        onClose={() => setExportModalVisible(false)}
        config={exportConfig}
        onChange={handleExportConfigChange}
        filters={{
          filterValue,
          statusFilter: Array.from(statusFilter as Set<string>),
          advancedFilters,
          currentPage: page,
          pageSize: pageSize,
        }}
        drugs={drugs}
        statusOptions={statusOptions.map((option) => ({
          label: option.name,
          value: option.uid,
        }))}
      />

      {/* Table Controls with Bulk Actions */}
      <TableControls
        selectedRowKeys={selectedRowKeys}
        pageSize={pageSize}
        onPageSizeChange={(newSize) => onPageChange(page, newSize)}
        bulkActions={[
          // Delete action
          createDeleteBulkAction(
            selectedRowKeys.length,
            deletingItems,
            async () => {
              setDeletingItems(true);
              try {
                // Gọi API xóa nhiều items
                const ids = selectedRowKeys as string[];
                await Promise.all(ids.map((id) => deleteDrug(id)));
                messageApi.success(
                  `${ids.length} drugs deleted successfully`,
                  5
                );
                setSelectedRowKeys([]);
                fetchDrugs();
              } catch (error) {
                messageApi.error("Failed to delete drugs", 5);
                console.error("Error deleting drugs:", error);
              } finally {
                setDeletingItems(false);
              }
            },
            true
          ),
          // Activate action
          createActivateBulkAction(
            selectedRowKeys.length,
            activatingItems,
            async () => {
              setActivatingItems(true);
              try {
                await activateDrugs(selectedRowKeys as string[]);
                messageApi.success(
                  `Successfully activated ${selectedRowKeys.length} drugs`,
                  5
                );
                setSelectedRowKeys([]);
                fetchDrugs();
              } catch (error) {
                messageApi.error("Failed to activate drugs", 5);
                console.error("Error activating drugs:", error);
              } finally {
                setActivatingItems(false);
              }
            },
            showActivate
          ),
          // Deactivate action
          createDeactivateBulkAction(
            selectedRowKeys.length,
            deactivatingItems,
            async () => {
              setDeactivatingItems(true);
              try {
                await deactivateDrugs(selectedRowKeys as string[]);
                messageApi.success(
                  `Successfully deactivated ${selectedRowKeys.length} drugs`,
                  5
                );
                setSelectedRowKeys([]);
                fetchDrugs();
              } catch (error) {
                messageApi.error("Failed to deactivate drugs", 5);
                console.error("Error deactivating drugs:", error);
              } finally {
                setDeactivatingItems(false);
              }
            },
            showDeactivate
          ),
        ]}
        maxRowsPerPage={100}
        pageSizeOptions={[5, 10, 15, 20, 50, 100]}
      />
      {/* Main Data Table */}
      <Card className="shadow-sm" bodyStyle={{ padding: "16px" }}>
        <div style={{ overflowX: "auto" }}>
          {loading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "40px",
              }}
            >
              <Spin tip={loadingMessage} />
            </div>
          ) : (
            <AntTable
              rowKey="id"
              dataSource={paginatedItems}
              columns={renderColumns()}
              pagination={false}
              rowSelection={{
                selectedRowKeys,
                onChange: (selectedKeys) => {
                  setSelectedRowKeys(selectedKeys as string[]);

                  // Kiểm tra các Items selected để hiển thị đúng bulk actions
                  const selectedItems = drugs.filter((drug) =>
                    selectedKeys.includes(drug.id)
                  );

                  const hasActive = selectedItems.some(
                    (item) => item.status === "Active"
                  );
                  const hasInactive = selectedItems.some(
                    (item) => item.status === "Inactive"
                  );

                  setShowActivate(hasInactive);
                  setShowDeactivate(hasActive);
                },
              }}
              scroll={{ x: "max-content" }}
              bordered
            />
          )}
        </div>

        {/* Pagination Footer */}
        <PaginationFooter
          current={page}
          pageSize={pageSize}
          total={filteredAndSortedItems.length}
          onChange={onPageChange}
          showGoToPage={true}
          showTotal={true}
        />
      </Card>
    </PageContainer>
  );
}
