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
  EditOutlined,
  ExclamationCircleOutlined,
  ArrowLeftOutlined,
  DownOutlined,
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
import { ConfirmDeleteDrugModal } from "./ConfirmDelete";
import { useRouter } from "next/router";
import dayjs from "dayjs";
import DrugFilterModal from "./DrugFilterModal";
import ExportConfigModal, { DrugExportConfigWithUI } from "./ExportConfigModal";

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

  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
  const [visibleColumns, setVisibleColumns] = useState<Selection>(
    new Set(INITIAL_VISIBLE_COLUMNS)
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

    // Apply drug code filter
    if (advancedFilters.drugCode) {
      processedDrugs = processedDrugs.filter((d) =>
        d.drugCode
          .toLowerCase()
          .includes(advancedFilters.drugCode.toLowerCase())
      );
    }

    // Apply drug name filter
    if (advancedFilters.drugName) {
      processedDrugs = processedDrugs.filter((d) =>
        d.name.toLowerCase().includes(advancedFilters.drugName.toLowerCase())
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
    router.push(`/drug/edit/${id}`);
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

  const onSearchChange = React.useCallback((value?: string) => {
    setFilterValue(value || "");
  }, []);

  const onClear = React.useCallback(() => {
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
    setSortDescriptor({
      column: "createdAt",
      direction: "descending",
    });
    setPage(1);
  }, []);

  const handleOpenFilterModal = React.useCallback(() => {
    setIsFilterModalOpen(true);
  }, []);

  const isFiltersApplied = React.useCallback(() => {
    return (
      filterValue !== "" ||
      statusFilter !== "all" ||
      advancedFilters.drugCode !== "" ||
      advancedFilters.drugName !== "" ||
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
                            const newVisibility = new Set(
                              visibleColumns as Set<string>
                            );
                            if (newVisibility.has(column.uid)) {
                              // Kiểm tra nếu đây là cột cuối cùng
                              if (newVisibility.size === 1) {
                                messageApi.warning(
                                  "Cannot hide the last visible column.",
                                  5
                                );
                                return;
                              }
                              newVisibility.delete(column.uid);
                            } else {
                              newVisibility.add(column.uid);
                            }
                            setVisibleColumns(newVisibility);
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
                          const newVisibility = new Set(
                            visibleColumns as Set<string>
                          );
                          if (newVisibility.has("actions")) {
                            // Kiểm tra nếu đây là cột cuối cùng
                            if (newVisibility.size === 1) {
                              messageApi.warning(
                                "Cannot hide the last visible column.",
                                5
                              );
                              return;
                            }
                            newVisibility.delete("actions");
                          } else {
                            newVisibility.add("actions");
                          }
                          setVisibleColumns(newVisibility);
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

          {advancedFilters.drugCode && (
            <Tag
              closable
              onClose={() =>
                setAdvancedFilters((prev) => ({ ...prev, drugCode: "" }))
              }
            >
              Code: {advancedFilters.drugCode}
            </Tag>
          )}

          {advancedFilters.drugName && (
            <Tag
              closable
              onClose={() =>
                setAdvancedFilters((prev) => ({ ...prev, drugName: "" }))
              }
            >
              Name: {advancedFilters.drugName}
            </Tag>
          )}

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
    if (newPageSize && newPageSize !== pageSize) {
      setPageSize(newPageSize);
    }
  };

  const bottomContent = React.useMemo(() => {
    return (
      <div className="py-2 px-2">
        <div className="flex flex-col">
          {renderActiveFilters()}

          <div className="flex justify-between items-center mt-2">
            <span className="text-small text-default-400">
              Total {totalItemsCount} items
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

  // Hàm render phần thông tin selected items và các nút action
  const renderSelectedInfo = () => {
    if ((selectedKeys as Set<string>).size === 0) return null;

    return (
      <div className="flex items-center gap-4">
        <span className="text-small">
          {(selectedKeys as Set<string>).size} items selected
        </span>
        <HeroButton
          size="sm"
          variant="flat"
          startContent={<UndoOutlined className="text-small" />}
          onClick={() => setSelectedKeys(new Set([]))}
        >
          Restore
        </HeroButton>

        {showActivate && (
          <HeroButton
            size="sm"
            className="bg-success-100 text-success-600"
            variant="flat"
            onClick={handleConfirmActivate}
          >
            Activate Selected
          </HeroButton>
        )}

        {showDeactivate && (
          <HeroButton
            size="sm"
            className="bg-danger-100 text-danger-600"
            variant="flat"
            onClick={handleConfirmDeactivate}
          >
            Deactivate Selected
          </HeroButton>
        )}
      </div>
    );
  };

  // Add the renderRowsPerPage function back
  const renderRowsPerPage = () => {
    return (
      <div className="flex items-center gap-2">
        <span className="text-default-400 text-small">Rows per page:</span>
        <Select
          value={pageSize}
          onChange={(value) => {
            setPageSize(Number(value));
            setPage(1);
          }}
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

  // Update the handleApplyFilters function to handle sort direction
  const handleApplyFilters = (filters: any) => {
    console.log("Received filters in handleApplyFilters:", filters);

    // Cập nhật state advancedFilters
    setAdvancedFilters(filters);

    // Cập nhật sort direction
    handleSortDirectionChange(filters.ascending);

    // Cập nhật các bộ lọc khác nếu cần
    if (filters.drugName) {
      setFilterValue(filters.drugName);
    }

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

  return (
    <div className="history-container" style={{ padding: "20px" }}>
      {contextHolder}

      {!isReady ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "80vh",
          }}
        >
          <Spin size="large" tip="Loading Drug Management..." />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AntButton
                icon={<ArrowLeftOutlined />}
                onClick={handleBack}
                style={{ marginRight: "8px" }}
              >
                Back
              </AntButton>
              <DrugIcon />
              <h3 className="text-xl font-bold">Drug Management</h3>
            </div>
          </div>

          <Card
            className="shadow mb-4 mx-4"
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
            <Spin spinning={loading} tip={loadingMessage}>
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
                        (
                          option?.label?.toString().toLowerCase() ?? ""
                        ).includes(input.toLowerCase())
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
                                <strong>Toggle All</strong>
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
                                    const newVisibility = new Set(
                                      visibleColumns as Set<string>
                                    );
                                    if (newVisibility.has(column.uid)) {
                                      // Kiểm tra nếu đây là cột cuối cùng
                                      if (newVisibility.size === 1) {
                                        messageApi.warning(
                                          "Cannot hide the last visible column.",
                                          5
                                        );
                                        return;
                                      }
                                      newVisibility.delete(column.uid);
                                    } else {
                                      newVisibility.add(column.uid);
                                    }
                                    setVisibleColumns(newVisibility);
                                  }}
                                >
                                  <span
                                    style={{
                                      color: "dimgray",
                                      fontWeight: "normal",
                                    }}
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
                                checked={(visibleColumns as Set<string>).has(
                                  "actions"
                                )}
                                onChange={() => {
                                  const newVisibility = new Set(
                                    visibleColumns as Set<string>
                                  );
                                  if (newVisibility.has("actions")) {
                                    // Kiểm tra nếu đây là cột cuối cùng
                                    if (newVisibility.size === 1) {
                                      messageApi.warning(
                                        "Cannot hide the last visible column.",
                                        5
                                      );
                                      return;
                                    }
                                    newVisibility.delete("actions");
                                  } else {
                                    newVisibility.add("actions");
                                  }
                                  setVisibleColumns(newVisibility);
                                }}
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
                            ),
                          },
                        ],
                        onClick: (e) => e.domEvent.stopPropagation(),
                      }}
                    >
                      <Tooltip title="Column Settings">
                        <AntButton icon={<SettingOutlined />}>
                          Columns
                        </AntButton>
                      </Tooltip>
                    </AntDropdown>

                    <AntButton
                      type="primary"
                      onClick={() => setIsModalOpen(true)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
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
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      Export to Excel
                    </AntButton>
                  </div>
                </div>
              </div>
            </Spin>
          </Card>

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

          <ConfirmDeleteDrugModal
            drug={deletingDrug}
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirmDelete={handleConfirmDelete}
          />

          <Modal
            title={`Confirm ${
              confirmAction === "activate" ? "Activation" : "Deactivation"
            }`}
            open={isConfirmModalOpen}
            onCancel={() => setIsConfirmModalOpen(false)}
            footer={[
              <AntButton
                key="cancel"
                onClick={() => setIsConfirmModalOpen(false)}
              >
                Cancel
              </AntButton>,
              <AntButton
                key="confirm"
                type={confirmAction === "activate" ? "primary" : "primary"}
                danger={confirmAction === "deactivate"}
                onClick={handleConfirmAction}
              >
                Confirm
              </AntButton>,
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

          {/* Container for selected info and rows per page */}
          <div className="flex justify-between items-center mx-4 mb-4">
            <div>{renderSelectedInfo()}</div>
            <div>{renderRowsPerPage()}</div>
          </div>

          <Card className="shadow-sm mb-4 mx-4" bodyStyle={{ padding: 0 }}>
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
              dataSource={paginatedItems}
              pagination={false}
              bordered
              loading={loading}
              rowSelection={{
                selectedRowKeys: Array.from(
                  selectedKeys instanceof Set ? selectedKeys : []
                ),
                onChange: (keys) => {
                  // Kiểm tra xem người dùng có đang cố gắng chọn cả Active và Inactive không
                  if (keys.length > 0) {
                    const selectedDrugList = paginatedItems.filter((drug) =>
                      keys.includes(drug.id)
                    );
                    const hasActive = selectedDrugList.some(
                      (drug) => drug.status === "Active"
                    );
                    const hasInactive = selectedDrugList.some(
                      (drug) => drug.status === "Inactive"
                    );

                    if (hasActive && hasInactive) {
                      messageApi.warning(
                        "Cannot select both Active and Inactive drugs at the same time.",
                        5
                      );
                      return;
                    }
                  }

                  setSelectedKeys(new Set(keys));
                  setSelectedOption(null); // Reset selected option when manually selecting
                },
                columnTitle: () => {
                  // Đếm thuốc theo trạng thái
                  const activeCount = paginatedItems.filter(
                    (drug) => drug.status === "Active"
                  ).length;
                  const inactiveCount = paginatedItems.filter(
                    (drug) => drug.status === "Inactive"
                  ).length;

                  const isSelectAll = false; // Disabled
                  const isIndeterminate = false; // Disabled

                  // Tạo các mục cho dropdown
                  const dropdownItems = [
                    {
                      key: "page-active",
                      label: `Select all Active on this page (${activeCount})`,
                    },
                    {
                      key: "all-active",
                      label:
                        isLoadingAllItems && selectedOption === "all-active" ? (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <Spin size="small" />
                            <span>Loading all Active...</span>
                          </div>
                        ) : (
                          "Select all Active (all pages)"
                        ),
                    },
                    {
                      key: "page-inactive",
                      label: `Select all Inactive on this page (${inactiveCount})`,
                    },
                    {
                      key: "all-inactive",
                      label:
                        isLoadingAllItems &&
                        selectedOption === "all-inactive" ? (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <Spin size="small" />
                            <span>Loading all Inactive...</span>
                          </div>
                        ) : (
                          "Select all Inactive (all pages)"
                        ),
                    },
                  ];

                  return (
                    <>
                      <Checkbox
                        checked={false}
                        indeterminate={false}
                        disabled={true}
                      />

                      {dropdownItems.length > 0 && (
                        <AntDropdown
                          menu={{
                            items: dropdownItems,
                            onClick: ({ key }) => handleSelectByStatus(key),
                            selectedKeys: selectedOption
                              ? [selectedOption]
                              : [],
                          }}
                          placement="bottomLeft"
                          trigger={["click"]}
                        >
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
                        </AntDropdown>
                      )}
                    </>
                  );
                },
              }}
              scroll={{ x: "max-content" }}
              sticky
              columns={[
                {
                  title: (
                    <span
                      style={{ textTransform: "uppercase", fontWeight: "bold" }}
                    >
                      DRUG CODE
                    </span>
                  ),
                  dataIndex: "drugCode",
                  key: "drugCode",
                  width: 180,
                  sorter: (a: DrugResponse, b: DrugResponse) =>
                    a.drugCode.localeCompare(b.drugCode),
                  render: (text: string, record: DrugResponse) => (
                    <div className="flex items-center gap-2">
                      {record.imageUrl && (
                        <img
                          src={record.imageUrl}
                          alt={record.name}
                          className="w-8 h-8 object-cover rounded"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      )}
                      <span
                        className="text-primary cursor-pointer hover:underline"
                        onClick={() => handleOpenDetails(record.id)}
                      >
                        {text}
                      </span>
                    </div>
                  ),
                },
                {
                  title: (
                    <span
                      style={{ textTransform: "uppercase", fontWeight: "bold" }}
                    >
                      NAME
                    </span>
                  ),
                  dataIndex: "name",
                  key: "name",
                  sorter: (a: DrugResponse, b: DrugResponse) =>
                    a.name.localeCompare(b.name),
                  render: (text: string) => (
                    <span className="capitalize">{text}</span>
                  ),
                },
                {
                  title: (
                    <span
                      style={{ textTransform: "uppercase", fontWeight: "bold" }}
                    >
                      DRUG GROUP
                    </span>
                  ),
                  dataIndex: "drugGroup",
                  key: "drugGroup",
                  sorter: (a: DrugResponse, b: DrugResponse) =>
                    (a.drugGroup?.groupName || "").localeCompare(
                      b.drugGroup?.groupName || ""
                    ),
                  render: (drugGroup: any) =>
                    drugGroup ? drugGroup.groupName : "-",
                },
                {
                  title: (
                    <span
                      style={{ textTransform: "uppercase", fontWeight: "bold" }}
                    >
                      UNIT
                    </span>
                  ),
                  dataIndex: "unit",
                  key: "unit",
                },
                {
                  title: (
                    <span
                      style={{ textTransform: "uppercase", fontWeight: "bold" }}
                    >
                      PRICE
                    </span>
                  ),
                  dataIndex: "price",
                  key: "price",
                  sorter: (a: DrugResponse, b: DrugResponse) => {
                    const priceA =
                      parseFloat(a.price as unknown as string) || 0;
                    const priceB =
                      parseFloat(b.price as unknown as string) || 0;
                    return priceA - priceB;
                  },
                  render: (price: string | number) => formatPrice(price),
                },
                {
                  title: (
                    <span
                      style={{ textTransform: "uppercase", fontWeight: "bold" }}
                    >
                      MANUFACTURER
                    </span>
                  ),
                  dataIndex: "manufacturer",
                  key: "manufacturer",
                },
                {
                  title: (
                    <span
                      style={{ textTransform: "uppercase", fontWeight: "bold" }}
                    >
                      STATUS
                    </span>
                  ),
                  dataIndex: "status",
                  key: "status",
                  align: "center" as const,
                  sorter: (a: DrugResponse, b: DrugResponse) =>
                    (a.status || "").localeCompare(b.status || ""),
                  render: (status: string) => (
                    <Tag color={status === "Active" ? "success" : "error"}>
                      {status ? status.toUpperCase() : ""}
                    </Tag>
                  ),
                },
                {
                  title: (
                    <span
                      style={{ textTransform: "uppercase", fontWeight: "bold" }}
                    >
                      CREATED AT
                    </span>
                  ),
                  dataIndex: "createdAt",
                  key: "createdAt",
                  sorter: (a: DrugResponse, b: DrugResponse) =>
                    new Date(a.createdAt).getTime() -
                    new Date(b.createdAt).getTime(),
                  render: (date: string) => formatDate(date),
                },
                {
                  title: (
                    <span
                      style={{ textTransform: "uppercase", fontWeight: "bold" }}
                    >
                      ACTIONS
                    </span>
                  ),
                  key: "actions",
                  width: 100,
                  align: "center" as const,
                  render: (_: any, record: DrugResponse) => (
                    <Space
                      size="small"
                      style={{ display: "flex", justifyContent: "center" }}
                    >
                      <Tooltip title="Edit">
                        <AntButton
                          type="text"
                          icon={<EditOutlined />}
                          onClick={() => handleOpenEditModal(record.id)}
                        />
                      </Tooltip>
                    </Space>
                  ),
                },
              ].filter((col) => {
                const key = col.key as string;
                return visibleColumns instanceof Set && visibleColumns.has(key);
              })}
            />
            <Card className="mt-4 shadow-sm">
              <Row justify="center" align="middle">
                <Space size="large" align="center">
                  <Text type="secondary">Total {totalItemsCount} items</Text>
                  <Space align="center" size="large">
                    <Pagination
                      current={page}
                      pageSize={pageSize}
                      total={filteredAndSortedItems.length}
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
                          Math.ceil(filteredAndSortedItems.length / pageSize)
                        )}
                        value={page}
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
                                filteredAndSortedItems.length / pageSize
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
                                filteredAndSortedItems.length / pageSize
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
        </>
      )}
    </div>
  );
}
