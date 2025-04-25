import React, { useEffect, useState, useCallback, useMemo } from "react";
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
  EyeOutlined,
  ArrowLeftOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";
import type { CheckboxChangeEvent } from "antd/es/checkbox";
import {
  getAllCanteenItems,
  CanteenItemResponse,
  activateCanteenItems,
  deactivateCanteenItems,
} from "@/api/canteenitems";
import { CreateCanteenItemForm } from "./CreateCanteenItemForm";
import { CanteenItemIcon } from "./Icons";
import { useRouter } from "next/router";
import dayjs from "dayjs";
import type { FilterValue, SorterResult } from "antd/es/table/interface";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import { ChipProps } from "@heroui/react";
import CanteenItemFilterModal from "./CanteenItemFilterModal";
import ExportConfigModal, {
  CanteenItemExportConfigWithUI,
} from "./ExportConfigModal";
import type { MenuProps } from "antd";
import type {
  ItemType,
  MenuItemType,
  MenuDividerType,
  MenuItemGroupType,
} from "antd/es/menu/interface";

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
        Item Name
      </span>
    ),
    dataIndex: "itemName",
    key: "itemName",
    sorter: (a: CanteenItemResponse, b: CanteenItemResponse) =>
      a.itemName.localeCompare(b.itemName),
    sortDirections: ["ascend", "descend"] as ("ascend" | "descend")[],
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
        Price
      </span>
    ),
    dataIndex: "unitPrice",
    key: "unitPrice",
    sorter: (a: CanteenItemResponse, b: CanteenItemResponse) =>
      parseFloat(String(a.unitPrice)) - parseFloat(String(b.unitPrice)),
    sortDirections: ["ascend", "descend"] as ("ascend" | "descend")[],
  },
  {
    title: (
      <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
        Availability
      </span>
    ),
    dataIndex: "available",
    key: "available",
  },
  {
    title: (
      <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
        Created At
      </span>
    ),
    dataIndex: "createdAt",
    key: "createdAt",
    sorter: (a: CanteenItemResponse, b: CanteenItemResponse) =>
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
  itemName: true,
  description: true,
  unitPrice: true,
  available: true,
  createdAt: true,
  status: true,
  actions: true,
};

const statusColorMap: Record<string, ChipProps["color"]> = {
  Active: "success",
  Inactive: "danger",
};

const INITIAL_VISIBLE_COLUMNS = [
  "itemName",
  "description",
  "unitPrice",
  "available",
  "createdAt",
  "status",
  "actions",
];

export function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
}

export function CanteenItems() {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(
    "Loading canteen items..."
  );

  // Data states
  const [canteenItems, setCanteenItems] = useState<CanteenItemResponse[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filterValue, setFilterValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [sorter, setSorter] = useState<
    SorterResult<CanteenItemResponse> | SorterResult<CanteenItemResponse>[]
  >();

  // Selection states
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [showActivateButton, setShowActivateButton] = useState(false);
  const [showDeactivateButton, setShowDeactivateButton] = useState(false);

  // Modal states
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    "activate" | "deactivate" | null
  >(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Export to Excel states
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportConfig, setExportConfig] =
    useState<CanteenItemExportConfigWithUI>({
      exportAllPages: true,
      includeId: true,
      includeItemName: true,
      includeDescription: true,
      includeUnitPrice: true,
      includeAvailable: true,
      includeImageUrl: true,
      includeCreatedAt: true,
      includeUpdatedAt: true,
      includeStatus: true,
      fileName: "CanteenItems_Export",
    });

  // Column visibility state
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(INITIAL_COLUMN_VISIBILITY);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Selected Option for bulk selection
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isLoadingAllItems, setIsLoadingAllItems] = useState<boolean>(false);

  // Filter modal states
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    itemName: "",
    priceRange: [null, null] as [number | null, number | null],
    availability: null as string | null,
    status: null as string | null,
    createdDateRange: [null, null] as [dayjs.Dayjs | null, dayjs.Dayjs | null],
    updatedDateRange: [null, null] as [dayjs.Dayjs | null, dayjs.Dayjs | null],
    sortBy: "CreatedAt",
    ascending: false,
  });

  // Fetch canteen items
  const fetchCanteenItems = useCallback(async () => {
    if (initialLoading) {
      setLoadingMessage("Loading canteen items...");
    }
    setLoading(true);
    try {
      const response = await getAllCanteenItems();
      setCanteenItems(response || []);
      setTotalItems(response?.length || 0);
    } catch (error) {
      messageApi.error("Failed to fetch canteen items");
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [messageApi, initialLoading]);

  useEffect(() => {
    fetchCanteenItems();
  }, [fetchCanteenItems]);

  // Monitor selected items to update action buttons
  useEffect(() => {
    if (selectedRowKeys.length > 0) {
      const selectedItemsData = canteenItems.filter((item) =>
        selectedRowKeys.includes(item.id)
      );

      // Count status types among selected items
      const inactiveCount = selectedItemsData.filter(
        (item) => item.status === "Inactive"
      ).length;
      const activeCount = selectedItemsData.filter(
        (item) => item.status === "Active"
      ).length;

      // Only show activate button if ALL selected items are inactive
      setShowActivateButton(inactiveCount > 0 && activeCount === 0);

      // Only show deactivate button if ALL selected items are active
      setShowDeactivateButton(activeCount > 0 && inactiveCount === 0);
    } else {
      setShowActivateButton(false);
      setShowDeactivateButton(false);
    }
  }, [selectedRowKeys, canteenItems]);

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    let processedItems = [...canteenItems];

    // Apply basic search filter
    if (filterValue) {
      processedItems = processedItems.filter((item) =>
        item.itemName?.toLowerCase().includes(filterValue.toLowerCase())
      );
    }

    // Apply status filter from toolbar
    if (statusFilter.length > 0) {
      processedItems = processedItems.filter(
        (item) => item.status && statusFilter.includes(item.status)
      );
    }

    // Apply advanced filters
    if (filters) {
      // Apply item name filter from advanced filters
      if (filters.itemName) {
        processedItems = processedItems.filter((item) =>
          item.itemName?.toLowerCase().includes(filters.itemName.toLowerCase())
        );
      }

      // Apply price range filter
      if (
        filters.priceRange &&
        (filters.priceRange[0] !== null || filters.priceRange[1] !== null)
      ) {
        const [minPrice, maxPrice] = filters.priceRange;
        processedItems = processedItems.filter((item) => {
          const price = parseFloat(item.unitPrice.toString());
          if (minPrice !== null && maxPrice !== null) {
            return price >= minPrice && price <= maxPrice;
          } else if (minPrice !== null) {
            return price >= minPrice;
          } else if (maxPrice !== null) {
            return price <= maxPrice;
          }
          return true;
        });
      }

      // Apply availability filter
      if (filters.availability !== null) {
        const isAvailable = filters.availability === "true";
        processedItems = processedItems.filter(
          (item) => item.available === isAvailable
        );
      }

      // Apply status filter from advanced filters
      if (filters.status !== null) {
        processedItems = processedItems.filter(
          (item) => item.status === filters.status
        );
      }

      // Apply created date range filter
      if (
        filters.createdDateRange &&
        (filters.createdDateRange[0] !== null ||
          filters.createdDateRange[1] !== null)
      ) {
        processedItems = processedItems.filter((item) => {
          const itemDate = dayjs(item.createdAt);
          const startDate = filters.createdDateRange[0];
          const endDate = filters.createdDateRange[1];

          if (startDate && endDate) {
            return (
              itemDate.isAfter(startDate.startOf("day")) &&
              itemDate.isBefore(endDate.endOf("day"))
            );
          } else if (startDate) {
            return itemDate.isAfter(startDate.startOf("day"));
          } else if (endDate) {
            return itemDate.isBefore(endDate.endOf("day"));
          }
          return true;
        });
      }

      // Apply updated date range filter
      if (
        filters.updatedDateRange &&
        (filters.updatedDateRange[0] !== null ||
          filters.updatedDateRange[1] !== null)
      ) {
        processedItems = processedItems.filter((item) => {
          if (!item.updatedAt) return false;

          const itemDate = dayjs(item.updatedAt);
          const startDate = filters.updatedDateRange[0];
          const endDate = filters.updatedDateRange[1];

          if (startDate && endDate) {
            return (
              itemDate.isAfter(startDate.startOf("day")) &&
              itemDate.isBefore(endDate.endOf("day"))
            );
          } else if (startDate) {
            return itemDate.isAfter(startDate.startOf("day"));
          } else if (endDate) {
            return itemDate.isBefore(endDate.endOf("day"));
          }
          return true;
        });
      }
    }

    // Use advanced filter sorting if specified, otherwise use table sorter
    let sortField: keyof CanteenItemResponse = "createdAt";
    let sortOrder: "ascend" | "descend" = "descend";

    // First check if we have filters.sortBy set
    if (filters && filters.sortBy) {
      // Map the filter sortBy values to actual field names
      const fieldMapping: Record<string, keyof CanteenItemResponse> = {
        ItemName: "itemName",
        UnitPrice: "unitPrice",
        CreatedAt: "createdAt",
        UpdatedAt: "updatedAt",
      };

      sortField = fieldMapping[filters.sortBy] || "createdAt";
      sortOrder = filters.ascending ? "ascend" : "descend";
    } else {
      // Fall back to table sorter if no filter sorting specified
      const currentSorter = Array.isArray(sorter) ? sorter[0] : sorter;
      if (currentSorter?.field) {
        sortField = currentSorter.field as keyof CanteenItemResponse;
        sortOrder = currentSorter.order || "descend";
      }
    }

    // Apply sorting
    if (sortField) {
      processedItems.sort((a, b) => {
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
        } else if (sortField === "unitPrice") {
          const priceA = parseFloat(valA as string) || 0;
          const priceB = parseFloat(valB as string) || 0;
          comparison = priceA - priceB;
        } else if (typeof valA === "boolean" && typeof valB === "boolean") {
          comparison = valA === valB ? 0 : valA ? 1 : -1;
        } else {
          comparison = String(valA).localeCompare(String(valB));
        }
        return sortOrder === "descend" ? comparison * -1 : comparison;
      });
    } else {
      // Default sort by CreatedAt
      processedItems.sort((a, b) => {
        return dayjs(b.createdAt).unix() - dayjs(a.createdAt).unix();
      });
    }

    return processedItems;
  }, [canteenItems, filterValue, statusFilter, sorter, filters]);

  // Paginate items
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredAndSortedItems.slice(start, end);
  }, [filteredAndSortedItems, currentPage, pageSize]);

  // Calculate total pages
  const pages = useMemo(() => {
    return Math.ceil(filteredAndSortedItems.length / pageSize);
  }, [filteredAndSortedItems.length, pageSize]);

  // Table change handler
  const handleTableChange: TableProps<CanteenItemResponse>["onChange"] = (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    newSorter:
      | SorterResult<CanteenItemResponse>
      | SorterResult<CanteenItemResponse>[]
  ) => {
    const statusFilters = (filters.status as FilterValue) || [];
    setStatusFilter(statusFilters.map(String));

    // Update sorter state from table changes
    setSorter(newSorter);

    // Reset page to 1 when filters or sorter change
    setCurrentPage(1);
  };

  // Confirmation dialog
  const showConfirm = (action: "activate" | "deactivate", onOk: () => void) => {
    const selectedItemsData = canteenItems.filter((item) =>
      selectedRowKeys.includes(item.id)
    );
    const targetStatus = action === "activate" ? "Inactive" : "Active";
    const count = selectedItemsData.filter(
      (item) => item.status === targetStatus
    ).length;

    if (count === 0) {
      messageApi.warning(`No items with status '${targetStatus}' selected.`, 5);
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

  // Bulk actions
  const handleActivate = async () => {
    const idsToActivate = canteenItems
      .filter(
        (item) =>
          selectedRowKeys.includes(item.id) && item.status === "Inactive"
      )
      .map((item) => item.id);

    if (idsToActivate.length === 0) return;

    setLoadingMessage("Activating items...");
    setLoading(true);
    try {
      await activateCanteenItems(idsToActivate);
      messageApi.success("Items activated successfully", 5);

      // Update local state instead of refetching
      setCanteenItems((prevItems) =>
        prevItems.map((item) =>
          idsToActivate.includes(item.id)
            ? {
                ...item,
                status: "Active",
                updatedAt: new Date().toISOString(),
              }
            : item
        )
      );

      setSelectedRowKeys([]); // Clear selection
    } catch (error) {
      messageApi.error("Failed to activate items", 5);
      console.error("Error activating items:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    const idsToDeactivate = canteenItems
      .filter(
        (item) => selectedRowKeys.includes(item.id) && item.status === "Active"
      )
      .map((item) => item.id);

    if (idsToDeactivate.length === 0) return;

    setLoadingMessage("Deactivating items...");
    setLoading(true);
    try {
      await deactivateCanteenItems(idsToDeactivate);
      messageApi.success("Items deactivated successfully", 5);

      // Update local state instead of refetching
      setCanteenItems((prevItems) =>
        prevItems.map((item) =>
          idsToDeactivate.includes(item.id)
            ? {
                ...item,
                status: "Inactive",
                updatedAt: new Date().toISOString(),
              }
            : item
        )
      );

      setSelectedRowKeys([]); // Clear selection
    } catch (error) {
      messageApi.error("Failed to deactivate items", 5);
      console.error("Error deactivating items:", error);
    } finally {
      setLoading(false);
    }
  };

  const onNextPage = useCallback(() => {
    if (currentPage < pages) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, pages]);

  const onPreviousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);

  const onSearchChange = useCallback((value?: string) => {
    setFilterValue(value || "");
    setCurrentPage(1);
  }, []);

  const onPageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  }, []);

  const onClear = useCallback(() => {
    setFilterValue("");
    setStatusFilter([]);
    setCurrentPage(1);
  }, []);

  // Format functions
  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return `${date.toLocaleDateString("vi-VN")} ${date.getHours()}:${String(
      date.getMinutes()
    ).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`;
  };

  const formatPrice = (price: string | number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(price));
  };

  // Cell rendering
  const renderCell = useCallback(
    (item: CanteenItemResponse, columnKey: React.Key) => {
      const cellValue = item[columnKey as keyof CanteenItemResponse];

      switch (columnKey) {
        case "itemName":
          return (
            <div className="flex flex-col items-start">
              <div className="flex items-center">
                <img
                  src={item.imageUrl || "/images/placeholder.jpg"}
                  alt={item.itemName}
                  className="w-8 h-8 mr-2 rounded cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/canteen-item/${item.id}`);
                  }}
                />
                <p
                  className="text-bold text-small capitalize text-primary cursor-pointer hover:underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/canteen-item/${item.id}`);
                  }}
                >
                  {cellValue as string}
                </p>
              </div>
            </div>
          );
        case "unitPrice":
          return formatPrice(cellValue as string | number);
        case "available":
          return (
            <Tag color={item.available ? "success" : "error"}>
              {item.available ? "Available" : "Out of Stock"}
            </Tag>
          );
        case "status":
          return (
            <Tag color={item.status === "Active" ? "success" : "error"}>
              {cellValue as string}
            </Tag>
          );
        case "createdAt":
          return cellValue ? formatDate(cellValue as string) : "-";
        case "actions":
          return (
            <div className="relative flex justify-end gap-2">
              <Dropdown
                menu={{
                  items: [
                    {
                      key: "edit",
                      label: "Edit",
                      onClick: () => {
                        router.push(`/canteen-item/edit/${item.id}`);
                      },
                    },
                    {
                      key: item.status === "Active" ? "deactivate" : "activate",
                      label:
                        item.status === "Active" ? "Deactivate" : "Activate",
                      className:
                        item.status === "Active"
                          ? "text-danger"
                          : "text-success",
                      onClick: () => {
                        setIsConfirmModalOpen(true);
                      },
                    },
                  ],
                }}
                trigger={["click"]}
              >
                <Button type="text" icon={<SettingOutlined />} />
              </Dropdown>
            </div>
          );
        default:
          return typeof cellValue === "object"
            ? JSON.stringify(cellValue)
            : cellValue;
      }
    },
    [router]
  );

  // Function to handle item details view
  const handleItemDetails = (id: string) => {
    router.push(`/canteen-item/${id}`);
  };

  // Navigation
  const handleBack = () => {
    router.back();
  };

  // Render the custom select all dropdown
  const renderSelectAll = () => {
    // Count items by status
    const activeCount = paginatedItems.filter(
      (item) => item.status === "Active"
    ).length;
    const inactiveCount = paginatedItems.filter(
      (item) => item.status === "Inactive"
    ).length;

    // Count items by availability
    const availableCount = paginatedItems.filter(
      (item) => item.available === true
    ).length;
    const outOfStockCount = paginatedItems.filter(
      (item) => item.available === false
    ).length;

    // Count selectable items
    const selectableItems = paginatedItems;

    const isSelectAll =
      selectableItems.length > 0 &&
      selectableItems.every((item) => selectedRowKeys.includes(item.id));

    const isIndeterminate =
      selectedRowKeys.length > 0 &&
      !isSelectAll &&
      selectableItems.some((item) => selectedRowKeys.includes(item.id));

    // Create dropdown menu items
    const items: ItemType[] = [];

    // Add group label for Status as MenuItemGroupType
    const statusGroup: MenuItemGroupType = {
      type: "group",
      key: "status-group",
      label: <strong>Filter by Status</strong>,
      children: [],
    };
    items.push(statusGroup);

    // Add Active options
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
        disabled: selectedOption?.includes("inactive"),
      } as MenuItemType);

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
        disabled: selectedOption?.includes("inactive"),
      } as MenuItemType);
    }

    // Add Inactive options
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
        disabled: selectedOption?.includes("active"),
      } as MenuItemType);

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
        disabled: selectedOption?.includes("active"),
      } as MenuItemType);
    }

    // Add a divider
    items.push({
      type: "divider",
    } as MenuDividerType);

    // Add group label for Availability as MenuItemGroupType
    const availabilityGroup: MenuItemGroupType = {
      type: "group",
      key: "availability-group",
      label: <strong>Filter by Availability</strong>,
      children: [],
    };
    items.push(availabilityGroup);

    // Add Available options
    if (availableCount > 0) {
      items.push({
        key: "page-available",
        label: (
          <div
            className={
              selectedOption === "page-available"
                ? "ant-dropdown-menu-item-active"
                : ""
            }
          >
            Select all Available on this page ({availableCount})
          </div>
        ),
        disabled: selectedOption?.includes("outofstock"),
      } as MenuItemType);

      items.push({
        key: "all-available",
        label: (
          <div
            className={
              selectedOption === "all-available"
                ? "ant-dropdown-menu-item-active"
                : ""
            }
          >
            {isLoadingAllItems && selectedOption === "all-available" ? (
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Spin size="small" />
                <span>Loading all Available...</span>
              </div>
            ) : (
              <span>Select all Available (all pages)</span>
            )}
          </div>
        ),
        disabled: selectedOption?.includes("outofstock"),
      } as MenuItemType);
    }

    // Add Out of Stock options
    if (outOfStockCount > 0) {
      items.push({
        key: "page-outofstock",
        label: (
          <div
            className={
              selectedOption === "page-outofstock"
                ? "ant-dropdown-menu-item-active"
                : ""
            }
          >
            Select all Out of Stock on this page ({outOfStockCount})
          </div>
        ),
        disabled: selectedOption?.includes("available"),
      } as MenuItemType);

      items.push({
        key: "all-outofstock",
        label: (
          <div
            className={
              selectedOption === "all-outofstock"
                ? "ant-dropdown-menu-item-active"
                : ""
            }
          >
            {isLoadingAllItems && selectedOption === "all-outofstock" ? (
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Spin size="small" />
                <span>Loading all Out of Stock...</span>
              </div>
            ) : (
              <span>Select all Out of Stock (all pages)</span>
            )}
          </div>
        ),
        disabled: selectedOption?.includes("available"),
      } as MenuItemType);
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

  // Configure the row selection
  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => {
      setSelectedRowKeys(keys);
    },
    columnTitle: renderSelectAll,
  };

  // Render selected items info
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

  // Render rows per page selector
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

  // Handle Export Config modal
  const handleOpenExportConfig = () => {
    setExportModalVisible(true);
  };

  const handleExportConfigChange = (
    newConfig: Partial<CanteenItemExportConfigWithUI>
  ) => {
    setExportConfig((prev) => ({ ...prev, ...newConfig }));
  };

  // Hàm kiểm tra xem có áp dụng bộ lọc nâng cao nào không
  const hasAdvancedFilters = useMemo(() => {
    if (!filters) return false;

    // Kiểm tra từng loại bộ lọc
    return (
      !!filters.itemName ||
      (filters.priceRange &&
        (filters.priceRange[0] !== null || filters.priceRange[1] !== null)) ||
      filters.availability !== null ||
      filters.status !== null ||
      (filters.createdDateRange &&
        (filters.createdDateRange[0] !== null ||
          filters.createdDateRange[1] !== null)) ||
      (filters.updatedDateRange &&
        (filters.updatedDateRange[0] !== null ||
          filters.updatedDateRange[1] !== null))
    );
  }, [filters]);

  // Đếm số bộ lọc đang áp dụng
  const activeFilterCount = useMemo(() => {
    if (!filters) return 0;

    let count = 0;
    if (filters.itemName) count++;
    if (
      filters.priceRange &&
      (filters.priceRange[0] !== null || filters.priceRange[1] !== null)
    )
      count++;
    if (filters.availability !== null) count++;
    if (filters.status !== null) count++;
    if (
      filters.createdDateRange &&
      (filters.createdDateRange[0] !== null ||
        filters.createdDateRange[1] !== null)
    )
      count++;
    if (
      filters.updatedDateRange &&
      (filters.updatedDateRange[0] !== null ||
        filters.updatedDateRange[1] !== null)
    )
      count++;

    return count;
  }, [filters]);

  // Cập nhật nội dung top toolbar để hiển thị số lượng bộ lọc đang áp dụng
  const topContent = () => (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            placeholder="Search by name..."
            prefix={<SearchOutlined style={{ color: "blue" }} />}
            value={filterValue}
            onChange={(e) => handleSearchSelectChange(e.target.value)}
            style={{ width: "300px" }}
            allowClear
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
                    color: hasAdvancedFilters ? "#1890ff" : undefined,
                  }}
                />
              }
              onClick={handleFilterModalOpen}
            >
              Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </Button>
          </Tooltip>

          <Tooltip title="Reset All Filters">
            <Button
              icon={<UndoOutlined />}
              onClick={handleResetFilters}
              disabled={
                !filterValue && statusFilter.length === 0 && !hasAdvancedFilters
              }
            >
            </Button>
          </Tooltip>

          <Dropdown
            menu={{
              items: [
                {
                  key: "selectAll",
                  label: (
                    <Checkbox
                      checked={areAllColumnsVisible()}
                      onChange={(e) => toggleAllColumns(e.target.checked)}
                    >
                      Toggle All
                    </Checkbox>
                  ),
                },
                {
                  type: "divider",
                },
                ...staticColumns
                  .filter((col) => col.key && col.key !== "actions")
                  .map((column) => ({
                    key: column.key as string,
                    label: (
                      <Checkbox
                        checked={!!columnVisibility[column.key as string]}
                        onChange={() =>
                          handleColumnVisibilityChange(column.key as string)
                        }
                      >
                        <span
                          style={{ color: "dimgray", fontWeight: "normal" }}
                        >
                          {capitalize((column.key as string).toString())}
                        </span>
                      </Checkbox>
                    ),
                  })),
                {
                  key: "actions",
                  label: (
                    <Checkbox
                      checked={!!columnVisibility["actions"]}
                      onChange={() => handleColumnVisibilityChange("actions")}
                    >
                      <span style={{ color: "dimgray", fontWeight: "normal" }}>
                        Actions
                      </span>
                    </Checkbox>
                  ),
                },
              ],
              onClick: (e) => e.domEvent.stopPropagation(),
            }}
            trigger={["click"]}
          >
            <Button icon={<SettingOutlined />}>Columns</Button>
          </Dropdown>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Create
          </Button>
        </div>

        <div>
          <Button
            type="primary"
            icon={<FileExcelOutlined />}
            onClick={handleOpenExportConfig}
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
  );

  // Input handlers
  const handleSearchSelectChange = (selectedValue: string | undefined) => {
    setFilterValue(selectedValue || "");
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilterValue("");
    setStatusFilter([]);
    setSorter(undefined);
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

  // Build bottom content for the table
  const bottomContent = useMemo(() => {
    const renderContent = () => (
      <div className="py-2 px-2 flex justify-between items-center">
        <span className="text-small text-default-400">
          Total {totalItems} items
        </span>
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={filteredAndSortedItems.length}
          onChange={(page) => onPageChange(page, pageSize)}
          showSizeChanger={false}
        />
      </div>
    );

    return renderContent;
  }, [
    currentPage,
    pageSize,
    totalItems,
    filteredAndSortedItems.length,
    onPageChange,
  ]);

  const headerColumns = useMemo(() => {
    return staticColumns.filter(
      (column) => columnVisibility[column.key] || column.key === "actions"
    );
  }, [columnVisibility]);

  // CRUD operations
  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    fetchCanteenItems();
    messageApi.success("Canteen item added successfully", 5);
  };

  // Column visibility handlers
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

  // Bulk selection handlers
  const getItemIdsByStatus = async (
    statuses: string[],
    currentPageOnly: boolean
  ): Promise<React.Key[]> => {
    try {
      if (currentPageOnly) {
        // Only get IDs from the current page by status
        return paginatedItems
          .filter((item) => item.status && statuses.includes(item.status))
          .map((item) => item.id);
      } else {
        // Get IDs from all pages
        setIsLoadingAllItems(true);
        const result = filteredAndSortedItems
          .filter((item) => item.status && statuses.includes(item.status))
          .map((item) => item.id);

        setIsLoadingAllItems(false);
        return result;
      }
    } catch (error) {
      console.error("Error getting item IDs by status:", error);
      setIsLoadingAllItems(false);
      return [];
    }
  };

  // Get item IDs by availability
  const getItemIdsByAvailability = async (
    available: boolean,
    currentPageOnly: boolean
  ): Promise<React.Key[]> => {
    try {
      if (currentPageOnly) {
        // Only get IDs from the current page by availability
        return paginatedItems
          .filter((item) => item.available === available)
          .map((item) => item.id);
      } else {
        // Get IDs from all pages
        setIsLoadingAllItems(true);
        const result = filteredAndSortedItems
          .filter((item) => item.available === available)
          .map((item) => item.id);

        setIsLoadingAllItems(false);
        return result;
      }
    } catch (error) {
      console.error("Error getting item IDs by availability:", error);
      setIsLoadingAllItems(false);
      return [];
    }
  };

  // Handle status-based selection
  const handleSelectByStatus = async (key: string) => {
    // Check if this option is already selected
    if (selectedOption === key) {
      // If already selected, deselect and clear selections
      setSelectedOption(null);
      setSelectedRowKeys([]);
    } else {
      // If not, select it and apply the selection
      setSelectedOption(key);

      // Clear previous selections
      setSelectedRowKeys([]);

      switch (key) {
        case "page-active":
          // Select Active items on current page
          const pageActiveIds = await getItemIdsByStatus(["Active"], true);
          setSelectedRowKeys(pageActiveIds);
          break;
        case "all-active":
          // Select all Active items across all pages
          const allActiveIds = await getItemIdsByStatus(["Active"], false);
          setSelectedRowKeys(allActiveIds);
          break;
        case "page-inactive":
          // Select Inactive items on current page
          const pageInactiveIds = await getItemIdsByStatus(["Inactive"], true);
          setSelectedRowKeys(pageInactiveIds);
          break;
        case "all-inactive":
          // Select all Inactive items across all pages
          const allInactiveIds = await getItemIdsByStatus(["Inactive"], false);
          setSelectedRowKeys(allInactiveIds);
          break;
        case "page-available":
          // Select Available items on current page
          const pageAvailableIds = await getItemIdsByAvailability(true, true);
          setSelectedRowKeys(pageAvailableIds);
          break;
        case "all-available":
          // Select all Available items across all pages
          const allAvailableIds = await getItemIdsByAvailability(true, false);
          setSelectedRowKeys(allAvailableIds);
          break;
        case "page-outofstock":
          // Select Out of Stock items on current page
          const pageOutOfStockIds = await getItemIdsByAvailability(false, true);
          setSelectedRowKeys(pageOutOfStockIds);
          break;
        case "all-outofstock":
          // Select all Out of Stock items across all pages
          const allOutOfStockIds = await getItemIdsByAvailability(false, false);
          setSelectedRowKeys(allOutOfStockIds);
          break;
        default:
          break;
      }
    }
  };

  // Build columns for the table
  const columns: TableProps<CanteenItemResponse>["columns"] = useMemo(() => {
    const actionColumn = {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          ACTIONS
        </span>
      ),
      key: "actions",
      align: "center" as const,
      render: (_: any, record: CanteenItemResponse) => (
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
                router.push(`/canteen-item/edit/${record.id}`);
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
        if (col.key === "itemName") {
          return {
            ...col,
            render: (text: string, record: CanteenItemResponse) => (
              <div className="flex items-center">
                <img
                  src={record.imageUrl || "/images/placeholder.jpg"}
                  alt={record.itemName}
                  className="w-8 h-8 mr-2 rounded cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/canteen-item/${record.id}`);
                  }}
                />
                <span
                  className="text-primary cursor-pointer hover:underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/canteen-item/${record.id}`);
                  }}
                >
                  {text}
                </span>
              </div>
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
        if (col.key === "unitPrice") {
          return {
            ...col,
            render: (price: string) => (
              <span>
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                  minimumFractionDigits: 0,
                }).format(Number(price))}
              </span>
            ),
          };
        }
        if (col.key === "available") {
          return {
            ...col,
            render: (available: boolean) => (
              <Tag color={available ? "success" : "error"}>
                {available ? "Available" : "Out of Stock"}
              </Tag>
            ),
          };
        }
        return col;
      });

    if (columnVisibility.actions) {
      return [...visibleCols, actionColumn];
    }
    return visibleCols;
  }, [columnVisibility, router]);

  // Handle filter modal
  const handleFilterModalOpen = () => {
    setIsFilterModalVisible(true);
  };

  const handleFilterModalCancel = () => {
    setIsFilterModalVisible(false);
  };

  const handleFilterModalApply = (appliedFilters: any) => {
    console.log("Applied filters:", appliedFilters);

    // Cập nhật state filters với giá trị mới từ modal
    setFilters(appliedFilters);

    // Đóng modal
    setIsFilterModalVisible(false);

    // Hiển thị thông báo để người dùng biết bộ lọc đã được áp dụng
    messageApi.success("Filters applied successfully");

    // Đặt lại trang hiện tại về 1 khi thay đổi bộ lọc
    setCurrentPage(1);
  };

  const handleFilterModalReset = () => {
    // Reset filters về giá trị mặc định
    const defaultFilters = {
      itemName: "",
      priceRange: [null, null] as [number | null, number | null],
      availability: null as string | null,
      status: null as string | null,
      createdDateRange: [null, null] as [
        dayjs.Dayjs | null,
        dayjs.Dayjs | null
      ],
      updatedDateRange: [null, null] as [
        dayjs.Dayjs | null,
        dayjs.Dayjs | null
      ],
      sortBy: "CreatedAt",
      ascending: false,
    };

    // Cập nhật state
    setFilters(defaultFilters);

    // Đóng modal
    setIsFilterModalVisible(false);

    // Hiển thị thông báo
    messageApi.success("All filters have been reset");

    // Đặt lại trang hiện tại về 1
    setCurrentPage(1);
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
          <CanteenItemIcon />
          <h3 className="text-xl font-bold">Canteen Items Management</h3>
        </div>
      </div>

      {initialLoading ? (
        <div style={{ textAlign: "center", padding: "50px" }}>
          <Spin size="large" tip="Loading canteen items..." />
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
              {topContent()}
            </Card>

            {/* Container for selected info and rows per page */}
            <div className="mb-4 py-2 flex justify-between items-center">
              <div>
                {selectedRowKeys.length > 0 ? renderSelectedInfo() : null}
              </div>
              <div>{renderRowsPerPage()}</div>
            </div>

            <Card
              className="mt-4 shadow-sm"
              bodyStyle={{ padding: "8px 16px" }}
            >
              <div style={{ overflowX: "auto" }}>
                <Table<CanteenItemResponse>
                  rowKey="id"
                  columns={columns}
                  dataSource={paginatedItems}
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
                      Total {filteredAndSortedItems.length} items
                    </Text>
                    <Space align="center" size="large">
                      <Pagination
                        current={currentPage}
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
          </Spin>
        </div>
      )}

      <Modal
        title="Add New Canteen Item"
        open={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        footer={null}
        destroyOnClose
        width={500}
      >
        <CreateCanteenItemForm
          onClose={() => setIsCreateModalOpen(false)}
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
          selected items?
        </p>
      </Modal>

      <CanteenItemFilterModal
        visible={isFilterModalVisible}
        onCancel={handleFilterModalCancel}
        onApply={handleFilterModalApply}
        onReset={handleFilterModalReset}
        filters={filters}
        itemNames={canteenItems
          .map((item) => item.itemName)
          .filter((name, index, self) => self.indexOf(name) === index)}
      />

      <ExportConfigModal
        visible={exportModalVisible}
        onClose={() => setExportModalVisible(false)}
        config={exportConfig}
        onChange={handleExportConfigChange}
      />
    </div>
  );
}
