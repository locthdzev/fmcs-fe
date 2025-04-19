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
  UndoOutlined,
  FilterOutlined,
  SettingOutlined,
  AppstoreOutlined,
  TagOutlined,
  ExclamationCircleOutlined,
  FormOutlined,
  ArrowLeftOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";
import type { CheckboxChangeEvent } from "antd/es/checkbox";
import dayjs from "dayjs";
import {
  getDrugGroups,
  DrugGroupResponse,
  activateDrugGroups,
  deactivateDrugGroups,
} from "@/api/druggroup";
import { CreateDrugGroupForm } from "./CreateForm";
import { useRouter } from "next/router";
import type { FilterValue, SorterResult } from "antd/es/table/interface";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import { DrugGroupIcon } from "./Icons";
import DrugGroupFilterModal, {
  DrugGroupAdvancedFilters,
} from "./DrugGroupFilterModal";
import ExportConfigModal, {
  DrugGroupExportConfigWithUI,
} from "./ExportConfigModal";

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
        Group Name
      </span>
    ),
    dataIndex: "groupName",
    key: "groupName",
  },
  {
    title: (
      <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
        Description
      </span>
    ),
    dataIndex: "description",
    key: "description",
  },
  {
    title: (
      <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
        Created At
      </span>
    ),
    dataIndex: "createdAt",
    key: "createdAt",
    render: (date: string) => (date ? dayjs(date).format("DD/MM/YYYY") : "-"),
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
  groupName: true,
  description: true,
  createdAt: true,
  status: true,
  actions: true,
};

// Initial state for advanced filters
const initialAdvancedFilters = {
  createdDateRange: [null, null],
  updatedDateRange: [null, null],
  ascending: false, // Default sort: Newest first (descending)
};

export function DrugGroups() {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(
    "Loading drug groups..."
  );

  const [drugGroups, setDrugGroups] = useState<DrugGroupResponse[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalAvailableItems, setTotalAvailableItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [filterValue, setFilterValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [sorter, setSorter] = useState<
    SorterResult<DrugGroupResponse> | SorterResult<DrugGroupResponse>[]
  >();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [showActivateButton, setShowActivateButton] = useState(false);
  const [showDeactivateButton, setShowDeactivateButton] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    "activate" | "deactivate" | null
  >(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(INITIAL_COLUMN_VISIBILITY);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // State for filter modal
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [advancedFilters, setAdvancedFilters] =
    useState<DrugGroupAdvancedFilters>({
      createdDateRange: [null, null],
      updatedDateRange: [null, null],
      ascending: false, // Luôn mặc định sắp xếp giảm dần (mới nhất lên đầu)
    });

  // State for export modal
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportConfig, setExportConfig] = useState<DrugGroupExportConfigWithUI>(
    {
      exportAllPages: true,
      includeGroupName: true,
      includeDescription: true,
      includeCreatedAt: true,
      includeUpdatedAt: true,
      includeStatus: true,
    }
  );

  // Add a state for tracking selected option
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isLoadingAllItems, setIsLoadingAllItems] = useState(false);

  // Thêm state mới để lưu tất cả các tên nhóm thuốc
  const [allGroupNames, setAllGroupNames] = useState<
    { value: string; label: string }[]
  >([]);

  // Hàm chung để lấy dữ liệu theo trang và bộ lọc
  const fetchPageWithFilters = useCallback(
    async (
      page: number,
      currentPageSize: number,
      searchValue: string,
      statusValue: string[],
      advFilters: DrugGroupAdvancedFilters
    ) => {
      setLoading(true);
      setLoadingMessage(`Loading page ${page}...`);

      try {
        // Xây dựng filter với các giá trị hiện tại
        const filters = {
          page: page,
          pageSize: currentPageSize,
          groupNameSearch: searchValue || undefined,
          status: statusValue.length > 0 ? statusValue.join(",") : undefined,
          sortBy: "CreatedAt",
          ascending: false,
          createdStartDate:
            advFilters.createdDateRange[0]?.toDate() || undefined,
          createdEndDate: advFilters.createdDateRange[1]?.toDate() || undefined,
          updatedStartDate:
            advFilters.updatedDateRange[0]?.toDate() || undefined,
          updatedEndDate: advFilters.updatedDateRange[1]?.toDate() || undefined,
          count: true,
        };

        console.log("Fetching data with filters:", filters);

        // Đặt timeout để tự tắt loading nếu quá lâu
        const timeoutId = setTimeout(() => {
          setLoading(false);
          console.warn("Request timeout - resetting loading state");
        }, 10000);

        // Gọi API để lấy dữ liệu
        const response = await getDrugGroups(filters);

        // Hủy timeout vì đã nhận được response
        clearTimeout(timeoutId);

        // Xử lý dữ liệu trả về
        if (response && response.data) {
          console.log("Response with filtered data:", response);
          setDrugGroups(Array.isArray(response.data) ? response.data : []);
          setTotalItems(response.totalItems || response.data.length);
          if (response.totalItems) {
            setTotalAvailableItems(response.totalItems);
          }
        } else {
          console.warn("Unexpected API response:", response);
          setDrugGroups([]);
          setTotalItems(0);
        }
      } catch (error) {
        console.error("Error fetching data with filters:", error);
        messageApi.error("Failed to load data with applied filters");
        setDrugGroups([]);
        setTotalItems(0);
      } finally {
        // Luôn đảm bảo tắt loading
        setLoading(false);
        setInitialLoading(false);
      }
    },
    [messageApi]
  );

  const handleSearchSelectChange = (selectedValue: string | undefined) => {
    const newFilterValue = selectedValue || "";
    setFilterValue(newFilterValue);
    setCurrentPage(1); // Reset về trang 1

    // Gọi API trực tiếp với giá trị tìm kiếm mới
    fetchPageWithFilters(
      1,
      pageSize,
      newFilterValue,
      statusFilter,
      advancedFilters
    );
  };

  const handleStatusFilterChange = (value: string[]) => {
    setStatusFilter(value);
    setCurrentPage(1); // Reset về trang 1

    // Gọi API trực tiếp với trạng thái mới
    fetchPageWithFilters(1, pageSize, filterValue, value, advancedFilters);
  };

  const handleResetFilters = () => {
    // Đặt lại tất cả các bộ lọc về giá trị mặc định
    setFilterValue("");
    setStatusFilter([]);
    setSorter(undefined);
    setAdvancedFilters({
      createdDateRange: [null, null],
      updatedDateRange: [null, null],
      ascending: false,
    });
    setCurrentPage(1);

    // Gọi API với bộ lọc mặc định
    fetchPageWithFilters(1, pageSize, "", [], {
      createdDateRange: [null, null],
      updatedDateRange: [null, null],
      ascending: false,
    });

    // Cập nhật tổng số
    fetchTotalItems();
  };

  const handleApplyAdvancedFilters = (filters: DrugGroupAdvancedFilters) => {
    setAdvancedFilters(filters);
    setFilterModalVisible(false);
    setCurrentPage(1); // Reset page when filters change

    // Gọi API trực tiếp với bộ lọc nâng cao mới
    fetchPageWithFilters(1, pageSize, filterValue, statusFilter, filters);

    // Cập nhật tổng số
    fetchTotalItems();
  };

  const fetchDrugGroups = useCallback(async () => {
    if (initialLoading) {
      setLoadingMessage("Loading drug groups...");
    }
    setLoading(true);
    try {
      // Lưu trạng thái hiện tại của trang để đảm bảo không bị race condition
      const pageToFetch = currentPage;
      const pageSizeToUse = pageSize;

      console.log(`Fetching page ${pageToFetch} with size ${pageSizeToUse}`);

      // Xây dựng filter để gửi đến API cho dữ liệu hiển thị với phân trang
      const filters = {
        page: pageToFetch,
        pageSize: pageSizeToUse,
        groupNameSearch: filterValue || undefined,
        status: statusFilter.length > 0 ? statusFilter.join(",") : undefined,
        sortBy: "CreatedAt", // Luôn sort theo thời gian tạo
        ascending: false, // Luôn sắp xếp giảm dần (mới nhất lên đầu)
        createdStartDate:
          advancedFilters.createdDateRange[0]?.toDate() || undefined,
        createdEndDate:
          advancedFilters.createdDateRange[1]?.toDate() || undefined,
        updatedStartDate:
          advancedFilters.updatedDateRange[0]?.toDate() || undefined,
        updatedEndDate:
          advancedFilters.updatedDateRange[1]?.toDate() || undefined,
        count: true,
      };

      console.log("Fetching drug groups with filters:", filters);

      // Đặt timeout để hủy request nếu mất quá nhiều thời gian
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      let pagedResponse;
      try {
        // Gọi API để lấy dữ liệu theo trang
        pagedResponse = await getDrugGroups(filters);
        console.log("API Response for paged data:", pagedResponse);

        clearTimeout(timeoutId);

        // Kiểm tra cấu trúc dữ liệu trả về
        if (pagedResponse && pagedResponse.data) {
          // Kiểm tra xem có phải đây là dữ liệu của trang đang hiển thị không
          if (pageToFetch === currentPage) {
            setDrugGroups(
              Array.isArray(pagedResponse.data) ? pagedResponse.data : []
            );
            // Lưu tổng số lượng items
            setTotalItems(
              pagedResponse.totalItems ||
                (Array.isArray(pagedResponse.data)
                  ? pagedResponse.data.length
                  : 0)
            );
            // Cập nhật tổng số item có sẵn từ response
            if (pagedResponse.totalItems) {
              setTotalAvailableItems(pagedResponse.totalItems);
            }
          } else {
            console.log(
              `Ignoring response for page ${pageToFetch} as current page is now ${currentPage}`
            );
          }
        } else {
          console.warn("Unexpected API response structure:", pagedResponse);
          if (pageToFetch === currentPage) {
            setDrugGroups([]);
            setTotalItems(0);
          }
        }
      } catch (err) {
        const error = err as Error;
        console.error("Error fetching paged data:", error);
        if (error.name !== "AbortError" && pageToFetch === currentPage) {
          setDrugGroups([]);
          setTotalItems(0);
          messageApi.error("Failed to load drug groups for current page");
        }
      }

      // Chỉ lấy tất cả dữ liệu cho dropdown khi lần đầu tải trang hoặc khi filter thay đổi
      if (initialLoading || allGroupNames.length === 0) {
        // Tạo một filter mới để lấy tất cả dữ liệu (không phân trang)
        const allItemsFilter = {
          // Không có các tham số phân trang
          pageSize: 1000, // Size lớn để lấy tất cả
          page: 1,
          count: true,
          sortBy: "CreatedAt",
          ascending: false,
        };

        console.log("Fetching all drug groups for dropdown:", allItemsFilter);

        try {
          // Gọi API để lấy tổng số nhóm thuốc trong database
          const allItemsResponse = await getDrugGroups(allItemsFilter);
          console.log("API Response for all data:", allItemsResponse);

          if (allItemsResponse && allItemsResponse.data) {
            // Lấy tất cả tên nhóm thuốc và sắp xếp theo thời gian tạo mới nhất
            if (Array.isArray(allItemsResponse.data)) {
              const sortedGroups = [...allItemsResponse.data].sort(
                (a, b) => dayjs(b.createdAt).unix() - dayjs(a.createdAt).unix()
              );

              setAllGroupNames(
                sortedGroups.map((group) => ({
                  value: group.groupName,
                  label: group.groupName,
                }))
              );

              // Cập nhật tổng số item nếu chưa có từ paged response
              if (!pagedResponse || !pagedResponse.totalItems) {
                setTotalAvailableItems(
                  allItemsResponse.totalItems || allItemsResponse.data.length
                );
              }
            }
          }
        } catch (err) {
          const error = err as Error;
          console.error("Error fetching all items for dropdown:", error);
          // Không hiển thị lỗi cho người dùng vì đây chỉ là dữ liệu bổ sung
        }
      }
    } catch (err) {
      const error = err as Error;
      console.error("API Error:", error);
      messageApi.error("Failed to fetch drug groups", 5);
      setDrugGroups([]);
      setTotalItems(0);
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
    advancedFilters,
    allGroupNames.length,
  ]);

  // Hàm riêng để lấy tổng số items trong database
  const fetchTotalItems = useCallback(async () => {
    try {
      // Tạo filter để lấy tổng số items mà không cần phân trang
      const countFilter = {
        pageSize: 1000, // Lấy tất cả items có thể
        page: 1,
        count: true, // Quan trọng: yêu cầu API trả về tổng số
        sortBy: "CreatedAt",
        ascending: false,
      };

      console.log("Fetching total count of drug groups");

      // Đặt timeout để tự động hủy nếu quá thời gian
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await getDrugGroups(countFilter);

      clearTimeout(timeoutId);

      if (response) {
        // Ưu tiên lấy totalItems từ response nếu có
        if (typeof response.totalItems === "number") {
          console.log(
            "Total items in database (from response.totalItems):",
            response.totalItems
          );
          setTotalAvailableItems(response.totalItems);
        }
        // Nếu không có totalItems, sử dụng độ dài của data array
        else if (response.data && Array.isArray(response.data)) {
          console.log(
            "Total items in database (from data array):",
            response.data.length
          );
          setTotalAvailableItems(response.data.length);
        }
      }
    } catch (err) {
      const error = err as Error;
      console.error("Error fetching total count:", error);
      // Không hiện thông báo lỗi để tránh làm phiền người dùng
    }
  }, []);

  // Gọi fetchTotalItems khi component mount
  useEffect(() => {
    fetchTotalItems();
  }, [fetchTotalItems]);

  useEffect(() => {
    // Đảm bảo luôn set loading khi component mount
    setLoading(true);
    setInitialLoading(true);
    setLoadingMessage("Loading initial data...");

    // Biến để theo dõi xem component có còn mounted không
    let isMounted = true;

    // Lấy dữ liệu trang đầu tiên khi component được mount
    const initializeData = async () => {
      try {
        // Lấy dữ liệu trang đầu tiên
        await fetchPageWithFilters(
          currentPage,
          pageSize,
          filterValue,
          statusFilter,
          advancedFilters
        );

        // Lấy tất cả tên nhóm thuốc cho dropdown
        try {
          const allItemsFilter = {
            pageSize: 1000,
            page: 1,
            sortBy: "CreatedAt",
            ascending: false,
          };

          const response = await getDrugGroups(allItemsFilter);

          if (
            isMounted &&
            response &&
            response.data &&
            Array.isArray(response.data)
          ) {
            const sortedGroups = [...response.data].sort(
              (a, b) => dayjs(b.createdAt).unix() - dayjs(a.createdAt).unix()
            );

            setAllGroupNames(
              sortedGroups.map((group) => ({
                value: group.groupName,
                label: group.groupName,
              }))
            );
          }
        } catch (error) {
          console.error("Error fetching all group names:", error);
        }

        // Lấy tổng số items
        await fetchTotalItems();
      } catch (error) {
        console.error("Error initializing data:", error);
        if (isMounted) {
          messageApi.error(
            "Failed to load data. Please try refreshing the page."
          );
          setDrugGroups([]);
          setTotalItems(0);
        }
      } finally {
        // Luôn đảm bảo tắt loading nếu component vẫn mounted
        if (isMounted) {
          setLoading(false);
          setInitialLoading(false);
        }
      }
    };

    initializeData();

    // Cleanup function để tránh memory leak và updates sau khi unmount
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Chỉ chạy 1 lần khi component mount

  useEffect(() => {
    if (selectedRowKeys.length > 0) {
      const selectedGroupsData = drugGroups.filter((g) =>
        selectedRowKeys.includes(g.id)
      );
      const hasInactive = selectedGroupsData.some(
        (g) => g.status === "Inactive"
      );
      const hasActive = selectedGroupsData.some((g) => g.status === "Active");

      setShowActivateButton(hasInactive);
      setShowDeactivateButton(hasActive);
    } else {
      setShowActivateButton(false);
      setShowDeactivateButton(false);
    }
  }, [selectedRowKeys, drugGroups]);

  const paginatedGroups = useMemo(() => {
    // Dữ liệu đã được phân trang từ API, chỉ cần trả về
    return drugGroups;
  }, [drugGroups]);

  // Không cần phải filter và sort lại ở frontend vì đã xử lý ở backend
  const filteredAndSortedGroups = useMemo(() => {
    // Dữ liệu đã được lọc và sắp xếp từ backend
    return drugGroups;
  }, [drugGroups]);

  useEffect(() => {
    setCurrentPage(1); // Reset trang về 1 khi filter thay đổi
  }, [statusFilter, filterValue]);

  const hasSearchFilter = Boolean(filterValue);

  const headerColumns = React.useMemo(() => {
    return staticColumns.filter(
      (column) =>
        !column.key || column.key === "actions" || columnVisibility[column.key]
    );
  }, [columnVisibility]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const handleTableChange: TableProps<DrugGroupResponse>["onChange"] = (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    newSorter:
      | SorterResult<DrugGroupResponse>
      | SorterResult<DrugGroupResponse>[]
  ) => {
    // Lấy status filter từ bảng
    const statusFilters = (filters.status as FilterValue) || [];
    const newStatusFilter = statusFilters.map(String);

    // Lưu lại sorter
    setSorter(newSorter);
    setStatusFilter(newStatusFilter);

    // Reset về trang 1 khi filters thay đổi
    setCurrentPage(1);

    // Gọi API trực tiếp với filters mới
    fetchPageWithFilters(
      1,
      pageSize,
      filterValue,
      newStatusFilter,
      advancedFilters
    );
  };

  const onPageChange = (page: number, newPageSize?: number) => {
    // Ngăn chặn việc gọi lại khi đang ở trang hiện tại và cùng kích thước trang
    if (page === currentPage && (!newPageSize || newPageSize === pageSize)) {
      return;
    }

    console.log(
      `Changing to page ${page}, pageSize: ${newPageSize || pageSize}`
    );

    // Đặt loading trong khi chờ dữ liệu
    setLoading(true);
    setLoadingMessage(`Loading page ${page}...`);

    // Cập nhật state kích thước trang trước nếu cần
    if (newPageSize && newPageSize !== pageSize) {
      setPageSize(newPageSize);
    }

    // Đặt trang mới
    setCurrentPage(page);

    // Gọi trực tiếp API với trang mới - dùng fetchPageWithFilters để tránh lặp code
    fetchPageWithFilters(
      page,
      newPageSize || pageSize,
      filterValue,
      statusFilter,
      advancedFilters
    );
  };

  const handleOpenEditModal = (id: string) => {
    router.push(`/drug-group/${id}?edit=true`);
  };

  const handleCreateSuccess = () => {
    setIsModalOpen(false);
    fetchDrugGroups();
    fetchTotalItems();
    messageApi.success("Drug group added successfully", 5);
  };

  const showConfirm = (action: "activate" | "deactivate", onOk: () => void) => {
    const selectedGroupsData = drugGroups.filter((g) =>
      selectedRowKeys.includes(g.id)
    );
    const targetStatus = action === "activate" ? "Inactive" : "Active";
    const count = selectedGroupsData.filter(
      (g) => g.status === targetStatus
    ).length;

    if (count === 0) {
      messageApi.warning(
        `No groups with status '${targetStatus}' selected.`,
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
    const idsToActivate = drugGroups
      .filter((g) => selectedRowKeys.includes(g.id) && g.status === "Inactive")
      .map((g) => g.id);

    if (idsToActivate.length === 0) return;

    setLoadingMessage("Activating groups...");
    setLoading(true);
    try {
      await activateDrugGroups(idsToActivate);
      messageApi.success("Drug groups activated successfully", 5);

      // Update local state instead of refetching
      setDrugGroups((prevGroups) =>
        prevGroups.map((group) =>
          idsToActivate.includes(group.id)
            ? {
                ...group,
                status: "Active",
                updatedAt: new Date().toISOString(),
              }
            : group
        )
      );

      setSelectedRowKeys([]); // Clear selection
      fetchTotalItems(); // Cập nhật lại tổng số items
    } catch (error) {
      messageApi.error("Failed to activate drug groups", 5);
      console.error("Error activating drug groups:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    const idsToDeactivate = drugGroups
      .filter((g) => selectedRowKeys.includes(g.id) && g.status === "Active")
      .map((g) => g.id);

    if (idsToDeactivate.length === 0) return;

    setLoadingMessage("Deactivating groups...");
    setLoading(true);
    try {
      await deactivateDrugGroups(idsToDeactivate);
      messageApi.success("Drug groups deactivated successfully", 5);

      // Update local state instead of refetching
      setDrugGroups((prevGroups) =>
        prevGroups.map((group) =>
          idsToDeactivate.includes(group.id)
            ? {
                ...group,
                status: "Inactive",
                updatedAt: new Date().toISOString(),
              }
            : group
        )
      );

      setSelectedRowKeys([]); // Clear selection
      fetchTotalItems(); // Cập nhật lại tổng số items
    } catch (error) {
      messageApi.error("Failed to deactivate drug groups", 5);
      console.error("Error deactivating drug groups:", error);
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

  const columns: TableProps<DrugGroupResponse>["columns"] = useMemo(() => {
    const actionColumn = {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          ACTIONS
        </span>
      ),
      key: "actions",
      align: "center" as const,
      render: (_: any, record: DrugGroupResponse) => (
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
        if (col.key === "groupName") {
          return {
            ...col,
            render: (text: string, record: DrugGroupResponse) => (
              <span
                className="text-primary cursor-pointer hover:underline"
                onClick={() => router.push(`/drug-group/${record.id}`)}
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

  const handleResetAdvancedFilters = () => {
    const defaultFilters: DrugGroupAdvancedFilters = {
      createdDateRange: [null, null],
      updatedDateRange: [null, null],
      ascending: false,
    };

    setAdvancedFilters(defaultFilters);
    setFilterModalVisible(false);
    setCurrentPage(1);

    // Gọi API trực tiếp với bộ lọc nâng cao mặc định
    fetchPageWithFilters(
      1,
      pageSize,
      filterValue,
      statusFilter,
      defaultFilters
    );
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => {
      setSelectedRowKeys(keys);
    },
    getCheckboxProps: (record: DrugGroupResponse) => {
      // If we have active Items selected, disable inactive items and vice versa
      if (selectedRowKeys.length > 0) {
        const firstSelectedItem = drugGroups.find(
          (group) => group.id === selectedRowKeys[0]
        );
        if (firstSelectedItem && record.status !== firstSelectedItem.status) {
          return { disabled: true };
        }
      }
      return {};
    },
    columnTitle: () => {
      // Count drug groups by status
      const activeCount = paginatedGroups.filter(
        (group) => group.status === "Active"
      ).length;
      const inactiveCount = paginatedGroups.filter(
        (group) => group.status === "Inactive"
      ).length;

      const isSelectAll = false; // Disabled
      const isIndeterminate = false; // Disabled

      // Create dropdown items
      const dropdownItems = [
        {
          key: "page-active",
          label: `Select all Active on this page (${activeCount})`,
        },
        {
          key: "all-active",
          label:
            loading && selectedOption === "all-active" ? (
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
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
            loading && selectedOption === "all-inactive" ? (
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
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
          <Checkbox checked={false} indeterminate={false} disabled={true} />

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
    },
  };

  // Handler for selecting by status
  const handleSelectByStatus = async (key: string) => {
    setSelectedOption(key);
    // Clear any previous selections first
    setSelectedRowKeys([]);

    if (key === "page-active") {
      // Select all active on current page
      const activeIds = paginatedGroups
        .filter((group) => group.status === "Active")
        .map((group) => group.id);
      setSelectedRowKeys(activeIds);
    } else if (key === "page-inactive") {
      // Select all inactive on current page
      const inactiveIds = paginatedGroups
        .filter((group) => group.status === "Inactive")
        .map((group) => group.id);
      setSelectedRowKeys(inactiveIds);
    } else if (key === "all-active" || key === "all-inactive") {
      // Select all active/inactive across all pages
      setIsLoadingAllItems(true);

      try {
        // Call API to get all items without pagination
        const targetStatus = key === "all-active" ? "Active" : "Inactive";
        const filters = {
          pageSize: 1000, // Large enough to get all items
          page: 1,
          status: targetStatus,
        };

        const response = await getDrugGroups(filters);

        if (response && response.data) {
          const typedData = Array.isArray(response.data)
            ? (response.data as DrugGroupResponse[])
            : [];
          const allIds = typedData.map((group) => group.id);
          setSelectedRowKeys(allIds);
        }
      } catch (error) {
        console.error("Error fetching all items:", error);
        messageApi.error("Failed to select all items");
      } finally {
        setIsLoadingAllItems(false);
      }
    }
  };

  const hasSelected = selectedRowKeys.length > 0;
  const selectedGroupsData = drugGroups.filter((g) =>
    selectedRowKeys.includes(g.id)
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
            style={{ 
              backgroundColor: "#f6ffed", 
              color: "#52c41a", 
              borderColor: "#b7eb8f" 
            }}
            onClick={() => showConfirm("activate", handleActivate)}
            disabled={loading}
          >
            Activate Selected
          </Button>
        )}

        {showDeactivateButton && (
          <Button
            style={{ 
              backgroundColor: "#fff2f0", 
              color: "#ff4d4f", 
              borderColor: "#ffccc7" 
            }}
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
          <Option value={50}>50</Option>
          <Option value={100}>100</Option>

        </Select>
      </div>
    );
  };

  // Handler for export config changes
  const handleExportConfigChange = (
    newConfig: Partial<DrugGroupExportConfigWithUI>
  ) => {
    setExportConfig((prev) => ({
      ...prev,
      ...newConfig,
    }));
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
          <DrugGroupIcon />
          <h3 className="text-xl font-bold">Drug Group Management</h3>
        </div>
      </div>

      {initialLoading ? (
        <div style={{ textAlign: "center", padding: "50px" }}>
          <Spin size="large" tip="Loading groups..." />
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
                          <span>Search by group name...</span>
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
                      options={allGroupNames}
                    />

                    <Tooltip title="Advanced Filters">
                      <Button
                        icon={
                          <FilterOutlined
                            style={{
                              color:
                                advancedFilters.createdDateRange[0] ||
                                advancedFilters.createdDateRange[1] ||
                                advancedFilters.updatedDateRange[0] ||
                                advancedFilters.updatedDateRange[1] ||
                                advancedFilters.ascending !== false
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
                              <strong>Toggle All</strong>
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

                  <Tooltip title="Export to Excel">
                    <Button
                      type="primary"
                      icon={<FileExcelOutlined />}
                      onClick={() => setExportModalVisible(true)}
                      size="middle"
                    >
                      Export To Excel
                    </Button>
                  </Tooltip>
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
                <Table<DrugGroupResponse>
                  rowKey="id"
                  columns={columns}
                  dataSource={paginatedGroups}
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
                      Total {totalAvailableItems} items
                    </Text>
                    <Space align="center" size="large">
                      <Pagination
                        current={currentPage}
                        pageSize={pageSize}
                        total={totalAvailableItems}
                        onChange={onPageChange}
                        showSizeChanger={false}
                        showTotal={() => ""}
                      />
                      <Space align="center">
                        <Text type="secondary">Go to page:</Text>
                        <InputNumber
                          min={1}
                          max={Math.max(
                            1,
                            Math.ceil(totalAvailableItems / pageSize)
                          )}
                          value={currentPage}
                          onChange={(value: number | null) => {
                            if (
                              value &&
                              value > 0 &&
                              value <= Math.ceil(totalAvailableItems / pageSize)
                            ) {
                              onPageChange(value, pageSize);
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
        title="Add New Drug Group"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
        width={500}
      >
        <CreateDrugGroupForm
          onClose={() => setIsModalOpen(false)}
          onCreate={handleCreateSuccess}
        />
      </Modal>

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
          selected groups?
        </p>
      </Modal>

      <DrugGroupFilterModal
        visible={filterModalVisible}
        onCancel={() => setFilterModalVisible(false)}
        onApply={handleApplyAdvancedFilters}
        onReset={handleResetAdvancedFilters}
        initialFilters={advancedFilters}
      />

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
        drugGroups={drugGroups}
        statusOptions={statusOptions}
      />
    </div>
  );
}
