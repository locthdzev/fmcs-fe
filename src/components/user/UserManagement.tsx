import React, { useState, useEffect, useCallback } from "react";
import {
  Form,
  Button,
  Typography,
  Select,
  message,
  Card,
  Tooltip,
  Dropdown,
  Checkbox,
  Modal as AntdModal,
  Table,
  Space,
  Tag,
  Popconfirm,
} from "antd";
import {
  PlusOutlined,
  UndoOutlined,
  FileExcelOutlined,
  ArrowLeftOutlined,
  FilterOutlined,
  SearchOutlined,
  SettingOutlined,
  DownloadOutlined,
  UploadOutlined,
  UserOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  TagOutlined,
  TeamOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";
import dayjs from "dayjs";

import UserTable from "./UserTable";
import CreateModal from "./CreateModal";
import ExportConfigModal from "./ExportConfigModal";
import UserFilterModal from "./UserFilterModal";

import {
  getAllUsers,
  activateUsers,
  deactivateUsers,
  UserResponseDTO,
  UserExportConfigDTO,
  exportUserTemplate,
  importUsers,
  exportUsersToExcelWithConfig,
  UserApiResponse,
} from "@/api/user";

const { Option } = Select;
const { Text, Title } = Typography;

export function UserManagement() {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserResponseDTO[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [exportConfigModalVisible, setExportConfigModalVisible] =
    useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchForm] = Form.useForm();
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedUserDetail, setSelectedUserDetail] =
    useState<UserResponseDTO | null>(null);

  // Column visibility state
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >({
    fullName: true,
    userName: true,
    email: true,
    phone: true,
    gender: true,
    dob: true,
    address: false,
    roles: true,
    status: true,
    createdAt: true,
    updatedAt: false,
    actions: true,
  });

  // Dropdown open state
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Search filters
  const [fullNameSearch, setFullNameSearch] = useState<string>("");
  const [userNameSearch, setUserNameSearch] = useState<string>("");
  const [emailSearch, setEmailSearch] = useState<string>("");
  const [phoneSearch, setPhoneSearch] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [genderFilter, setGenderFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dobDateRange, setDobDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null]
  >([null, null]);
  const [createdDateRange, setCreatedDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null]
  >([null, null]);
  const [updatedDateRange, setUpdatedDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null]
  >([null, null]);
  const [sortBy, setSortBy] = useState<string>("CreatedAt");
  const [ascending, setAscending] = useState<boolean>(false);

  // Options for dropdowns
  const [userOptions, setUserOptions] = useState<string[]>([]);
  const [roleOptions, setRoleOptions] = useState<string[]>([]);
  const [fullNameOptions, setFullNameOptions] = useState<string[]>([]);

  // Export config
  const [exportConfig, setExportConfig] = useState<UserExportConfigDTO>({
    exportAllPages: false,
    includeFullName: true,
    includeUserName: true,
    includeEmail: true,
    includePhone: true,
    includeGender: true,
    includeDob: true,
    includeAddress: true,
    includeRole: true,
    includeStatus: true,
    includeCreatedAt: true,
    includeUpdatedAt: true,
  });

  // Filter state for the modal
  const [filterState, setFilterState] = useState({
    fullNameSearch: "",
    userNameSearch: "",
    emailSearch: "",
    phoneSearch: "",
    roleFilter: "",
    genderFilter: "",
    statusFilter: "",
    dobDateRange: [null, null] as [dayjs.Dayjs | null, dayjs.Dayjs | null],
    createdDateRange: [null, null] as [dayjs.Dayjs | null, dayjs.Dayjs | null],
    updatedDateRange: [null, null] as [dayjs.Dayjs | null, dayjs.Dayjs | null],
    sortBy: "CreatedAt",
    ascending: false,
  });

  // State cho tất cả users (không phân trang) - cho dropdown trong modal filter
  const [allUsers, setAllUsers] = useState<UserResponseDTO[]>([]);

  // Tách thành các useEffect riêng biệt với thứ tự rõ ràng
  // 1. Đầu tiên lấy tất cả người dùng cho dropdown search và modal filters
  useEffect(() => {
    fetchAllUsersForDropdown();
    fetchAllUsers();
  }, []);

  // 2. Sau đó lấy các tùy chọn lọc khác
  useEffect(() => {
    fetchFilterOptions();
  }, []);

  // 3. Cuối cùng fetch danh sách users dựa trên filter
  useEffect(() => {
    fetchUsers();
  }, [
    currentPage,
    pageSize,
    fullNameSearch,
    userNameSearch,
    emailSearch,
    phoneSearch,
    roleFilter,
    genderFilter,
    statusFilter,
    dobDateRange,
    createdDateRange,
    updatedDateRange,
    sortBy,
    ascending,
  ]);

  // Cập nhật xử lý khi select tên từ dropdown
  useEffect(() => {
    // Khi user chọn tên từ dropdown, cần trích xuất tên thực tế từ định dạng "FullName (email)"
    if (fullNameSearch) {
      // Kiểm tra xem fullNameSearch có chứa dấu ngoặc không
      const match = fullNameSearch.match(/(.*?)\s*\(.*\)/);
      const actualName = match ? match[1].trim() : fullNameSearch.trim();

      // Gọi API tìm kiếm với tên thực tế đã trích xuất
      console.log(`Searching with extracted name: "${actualName}"`);

      // Nếu tên đã được định dạng với email, sử dụng tên thực tế để tìm kiếm
      if (match && actualName !== fullNameSearch) {
        // Gọi API search với tên thực tế - cập nhật nếu cần thiết thông qua API
      }
    }
  }, [fullNameSearch]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Trích xuất thông tin tìm kiếm từ chuỗi kết hợp "fullName | email"
      let actualFullNameSearch = "";
      let actualEmailSearch = "";

      if (fullNameSearch) {
        const parts = fullNameSearch.split(" | ");
        if (parts.length === 2) {
          // Nếu có đủ 2 phần thì phần đầu là tên, phần sau là email
          actualFullNameSearch = parts[0].trim();
          actualEmailSearch = parts[1].trim();
        } else {
          // Nếu người dùng nhập trực tiếp, không chọn từ dropdown
          actualFullNameSearch = fullNameSearch.trim();
        }
      }

      const response = await getAllUsers(
        currentPage,
        pageSize,
        actualFullNameSearch, // Dùng tên thực tế đã trích xuất
        userNameSearch,
        actualEmailSearch || emailSearch, // Dùng email trích xuất hoặc email nhập trực tiếp
        phoneSearch,
        roleFilter,
        genderFilter,
        dobDateRange[0]?.toDate(),
        dobDateRange[1]?.toDate(),
        createdDateRange[0]?.toDate(),
        createdDateRange[1]?.toDate(),
        updatedDateRange[0]?.toDate(),
        updatedDateRange[1]?.toDate(),
        statusFilter,
        sortBy,
        ascending
      );

      if (response.isSuccess) {
        setUsers(response.data);
        setTotalItems(response.totalRecords);
        console.log(`Fetched ${response.data.length} users`);
      } else {
        messageApi.error(response.message || "Failed to fetch users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      messageApi.error("An error occurred while fetching users");
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      // Here you would fetch options for filters
      // For example, fetch all role names, genders, etc.
      // This is a placeholder - implement based on your API

      // Example:
      // const rolesResponse = await getAllRoles();
      // if (rolesResponse.isSuccess) {
      //   setRoleOptions(rolesResponse.data.map((role) => role.roleName));
      // }

      setRoleOptions([
        "Admin",
        "Manager",
        "Healthcare Staff",
        "Canteen Staff",
        "User",
      ]);
      setUserOptions(["Male", "Female"]);

      // Không cập nhật fullNameOptions ở đây nữa, vì đã có fetchAllUsersForDropdown
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  };

  const extractFullNamesFromUsers = (userData: UserResponseDTO[]): string[] => {
    // Thêm debug log
    console.log(`Total users received: ${userData.length}`);

    // Tạo mảng danh sách tên người dùng và sắp xếp theo ngày tạo mới nhất trước
    const sortedUsers = [...userData].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Lấy danh sách hiển thị theo định dạng mới, kết hợp cả fullName và email
    const combinedOptions = sortedUsers.map(
      (user) => user.fullName + " | " + user.email
    );

    // Debug log
    console.log(`Extracted ${combinedOptions.length} combined name options`);

    // Cập nhật state và trả về mảng
    setFullNameOptions(combinedOptions);
    return combinedOptions;
  };

  const fetchAllUsersForDropdown = async () => {
    try {
      console.log("Fetching all users for dropdown...");
      // Gọi API với pageSize lớn để lấy tất cả người dùng
      const response = await getAllUsers(
        1,
        1000, // Số lượng lớn để lấy tất cả người dùng
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        "CreatedAt", // Sắp xếp theo ngày tạo
        false // Giảm dần (mới nhất trước)
      );

      if (response.isSuccess) {
        console.log(
          `API returned ${response.data.length} users out of ${response.totalRecords} total records`
        );
        // Trích xuất tên đầy đủ từ tất cả người dùng và lưu vào state
        extractFullNamesFromUsers(response.data);
      } else {
        console.error("API call failed:", response.message);
      }
    } catch (error) {
      console.error("Error fetching all users for dropdown:", error);
      messageApi.error("Failed to load user dropdown data");
    }
  };

  // Hàm lấy tất cả users cho dropdown trong modal Advanced Filters
  const fetchAllUsers = async () => {
    try {
      console.log("Fetching all users for filter dropdowns...");
      // Gọi API với pageSize lớn để lấy tất cả người dùng
      const response = await getAllUsers(
        1,
        1000, // Số lượng lớn để lấy tất cả người dùng
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        "CreatedAt", // Sắp xếp theo ngày tạo
        false // Giảm dần (mới nhất trước)
      );

      if (response.isSuccess) {
        console.log(
          `API returned ${response.data.length} users for filter modal dropdowns`
        );
        setAllUsers(response.data);
      } else {
        console.error(
          "API call failed for filter dropdowns:",
          response.message
        );
      }
    } catch (error) {
      console.error("Error fetching all users for filter dropdowns:", error);
      messageApi.error("Failed to load user dropdown data for filters");
    }
  };

  const handleFormFieldChange = (field: string, value: any) => {
    switch (field) {
      case "fullNameSearch":
        setFullNameSearch(value);
        break;
      case "userNameSearch":
        setUserNameSearch(value);
        break;
      case "emailSearch":
        setEmailSearch(value);
        break;
      case "phoneSearch":
        setPhoneSearch(value);
        break;
      case "roleFilter":
        setRoleFilter(value);
        break;
      case "genderFilter":
        setGenderFilter(value);
        break;
      case "statusFilter":
        setStatusFilter(value);
        break;
      case "dobDateRange":
        setDobDateRange(value);
        break;
      case "createdDateRange":
        setCreatedDateRange(value);
        break;
      case "updatedDateRange":
        setUpdatedDateRange(value);
        break;
      case "sortBy":
        setSortBy(value);
        break;
      case "ascending":
        setAscending(value);
        break;
      default:
        break;
    }

    // Reset to page 1 when changing filters
    if (field !== "page" && field !== "pageSize") {
      setCurrentPage(1);
    }
  };

  const handleReset = () => {
    // Reset ALL filters - both main toolbar and advanced filters
    setFullNameSearch("");
    setUserNameSearch("");
    setEmailSearch("");
    setPhoneSearch("");
    setRoleFilter("");
    setGenderFilter("");
    setStatusFilter("");
    setDobDateRange([null, null]);
    setCreatedDateRange([null, null]);
    setUpdatedDateRange([null, null]);
    setSortBy("CreatedAt");
    setAscending(false);
    setCurrentPage(1);

    // Reset all form values
    searchForm.setFieldsValue({
      fullNameSearch: "",
      userNameSearch: "",
      emailSearch: "",
      phoneSearch: "",
      roleFilter: "",
      genderFilter: "",
      statusFilter: "",
      dobDateRange: null,
      createdDateRange: null,
      updatedDateRange: null,
      sortBy: "CreatedAt",
      ascending: false,
    });
  };

  const handlePageChange = (page: number, newPageSize?: number) => {
    setCurrentPage(page);
    if (newPageSize) setPageSize(newPageSize);
  };

  const handleCreateSuccess = () => {
    setCreateModalVisible(false);
    fetchUsers();
    messageApi.success("User created successfully");
  };

  const handleColumnVisibilityChange = (key: string) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleAllColumns = (checked: boolean) => {
    const newVisibility: Record<string, boolean> = {};
    Object.keys(columnVisibility).forEach((key) => {
      newVisibility[key] = checked;
    });
    setColumnVisibility(newVisibility);
  };

  const areAllColumnsVisible = () => {
    return Object.values(columnVisibility).every((visible) => visible);
  };

  const handleActivate = async (id: string) => {
    try {
      const response = await activateUsers([id]);
      if (response.isSuccess) {
        messageApi.success("User activated successfully");
        fetchUsers();
      } else {
        messageApi.error(response.message || "Failed to activate user");
      }
    } catch (error) {
      console.error("Error activating user:", error);
      messageApi.error("An error occurred while activating user");
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      const response = await deactivateUsers([id]);
      if (response.isSuccess) {
        messageApi.success("User deactivated successfully");
        fetchUsers();
      } else {
        messageApi.error(response.message || "Failed to deactivate user");
      }
    } catch (error) {
      console.error("Error deactivating user:", error);
      messageApi.error("An error occurred while deactivating user");
    }
  };

  const handleBulkActivate = async (ids: string[]) => {
    try {
      const response = await activateUsers(ids);
      if (response.isSuccess) {
        messageApi.success(`${ids.length} users activated successfully`);
        fetchUsers();
        setSelectedUsers([]);
      } else {
        messageApi.error(response.message || "Failed to activate users");
      }
    } catch (error) {
      console.error("Error activating users:", error);
      messageApi.error("An error occurred while activating users");
    }
  };

  const handleBulkDeactivate = async (ids: string[]) => {
    try {
      const response = await deactivateUsers(ids);
      if (response.isSuccess) {
        messageApi.success(`${ids.length} users deactivated successfully`);
        fetchUsers();
        setSelectedUsers([]);
      } else {
        messageApi.error(response.message || "Failed to deactivate users");
      }
    } catch (error) {
      console.error("Error deactivating users:", error);
      messageApi.error("An error occurred while deactivating users");
    }
  };

  const handleOpenFilterModal = () => {
    setFilterState({
      fullNameSearch,
      userNameSearch,
      emailSearch,
      phoneSearch,
      roleFilter,
      genderFilter,
      statusFilter,
      dobDateRange,
      createdDateRange,
      updatedDateRange,
      sortBy,
      ascending,
    });
    setFilterModalVisible(true);
  };

  const handleApplyFilters = (filters: any) => {
    setFullNameSearch(filters.fullNameSearch || "");
    setUserNameSearch(filters.userNameSearch || "");
    setEmailSearch(filters.emailSearch || "");
    setPhoneSearch(filters.phoneSearch || "");
    setRoleFilter(filters.roleFilter || "");
    setGenderFilter(filters.genderFilter || "");
    setStatusFilter(filters.statusFilter || "");
    setDobDateRange(filters.dobDateRange || [null, null]);
    setCreatedDateRange(filters.createdDateRange || [null, null]);
    setUpdatedDateRange(filters.updatedDateRange || [null, null]);
    setSortBy("CreatedAt");
    setAscending(filters.ascending || false);
    setCurrentPage(1);
    setFilterModalVisible(false);
  };

  const handleResetFilters = () => {
    // Only reset the filters in the Advanced Filters modal
    setUserNameSearch("");
    setEmailSearch("");
    setPhoneSearch("");
    setGenderFilter("");
    setDobDateRange([null, null]);
    setCreatedDateRange([null, null]);
    setUpdatedDateRange([null, null]);
    setSortBy("CreatedAt");
    setAscending(false);
    setCurrentPage(1);

    // Update the filter state for the modal
    setFilterState((prev) => ({
      ...prev,
      userNameSearch: "",
      emailSearch: "",
      phoneSearch: "",
      genderFilter: "",
      dobDateRange: [null, null],
      createdDateRange: [null, null],
      updatedDateRange: [null, null],
      sortBy: "CreatedAt",
      ascending: false,
    }));

    setFilterModalVisible(false);
  };

  const handleOpenExportConfig = () => {
    setExportConfigModalVisible(true);
  };

  const closeExportConfigModal = () => {
    setExportConfigModalVisible(false);
  };

  const handleExportConfigChange = (changedValues: any) => {
    setExportConfig((prev) => ({
      ...prev,
      ...changedValues,
    }));
  };

  const handleExportToExcel = async () => {
    try {
      setLoading(true);

      // Convert date ranges to Date objects
      const formattedDobStart = dobDateRange[0]
        ? dobDateRange[0].toDate()
        : undefined;
      const formattedDobEnd = dobDateRange[1]
        ? dobDateRange[1].toDate()
        : undefined;
      const formattedCreatedStart = createdDateRange[0]
        ? createdDateRange[0].toDate()
        : undefined;
      const formattedCreatedEnd = createdDateRange[1]
        ? createdDateRange[1].toDate()
        : undefined;
      const formattedUpdatedStart = updatedDateRange[0]
        ? updatedDateRange[0].toDate()
        : undefined;
      const formattedUpdatedEnd = updatedDateRange[1]
        ? updatedDateRange[1].toDate()
        : undefined;

      const response = await exportUsersToExcelWithConfig(
        exportConfig,
        currentPage,
        pageSize,
        fullNameSearch || undefined,
        userNameSearch || undefined,
        emailSearch || undefined,
        phoneSearch || undefined,
        roleFilter || undefined,
        genderFilter || undefined,
        formattedDobStart,
        formattedDobEnd,
        formattedCreatedStart,
        formattedCreatedEnd,
        formattedUpdatedStart,
        formattedUpdatedEnd,
        statusFilter || undefined,
        sortBy,
        ascending
      );

      if (response.isSuccess) {
        messageApi.success("Export successful");
        // Handle the download - typically the API returns a URL to the file
        window.open(response.data, "_blank");
      } else {
        messageApi.error(response.message || "Export failed");
      }
    } catch (error) {
      console.error("Error exporting users:", error);
      messageApi.error("An error occurred during export");
    } finally {
      setLoading(false);
      setExportConfigModalVisible(false);
    }
  };

  const handleExportTemplate = async () => {
    try {
      setLoading(true);
      const response = await exportUserTemplate();

      if (response.isSuccess) {
        messageApi.success("Template downloaded successfully");
        window.open(response.data, "_blank");
      } else {
        messageApi.error(response.message || "Failed to download template");
      }
    } catch (error) {
      console.error("Error downloading template:", error);
      messageApi.error("An error occurred while downloading the template");
    } finally {
      setLoading(false);
    }
  };

  const handleImportUsers = async (file: File) => {
    try {
      setLoading(true);
      const response = await importUsers(file);

      if (response.isSuccess) {
        messageApi.success("Users imported successfully");
        fetchUsers();
      } else {
        messageApi.error(response.message || "Failed to import users");
      }
    } catch (error) {
      console.error("Error importing users:", error);
      messageApi.error("An error occurred while importing users");
    } finally {
      setLoading(false);
    }
  };

  const handleDropdownVisibleChange = (visible: boolean) => {
    setDropdownOpen(visible);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    setDropdownOpen(false);
  };

  const isFiltersApplied = () => {
    // Only check filters from the Advanced Filters modal, not the main toolbar filters
    return (
      !!userNameSearch ||
      !!emailSearch ||
      !!phoneSearch ||
      !!genderFilter ||
      (dobDateRange && (dobDateRange[0] || dobDateRange[1])) ||
      (createdDateRange && (createdDateRange[0] || createdDateRange[1])) ||
      (updatedDateRange && (updatedDateRange[0] || updatedDateRange[1])) ||
      ascending !== false
    );
  };

  // Check if any main toolbar filters are applied
  const isMainFiltersApplied = () => {
    return !!fullNameSearch || !!statusFilter || !!roleFilter;
  };

  const handleEdit = (user: UserResponseDTO) => {
    router.push(`/user/${user.id}`);
  };

  const handleViewDetails = (user: UserResponseDTO) => {
    console.log("Navigating to user detail page for user:", user);
    router.push(`/user/${user.id}`);
  };

  const handleUserSelect = (selectedRowKeys: React.Key[]) => {
    setSelectedUsers(selectedRowKeys.map((key) => key.toString()));
  };

  // 3. Cập nhật form values khi filters thay đổi
  useEffect(() => {
    searchForm.setFieldsValue({
      fullNameSearch,
      userNameSearch,
      emailSearch,
      phoneSearch,
      roleFilter,
      genderFilter,
      statusFilter,
      dobDateRange,
      createdDateRange,
      updatedDateRange,
      sortBy,
      ascending,
    });
  }, [
    fullNameSearch,
    userNameSearch,
    emailSearch,
    phoneSearch,
    roleFilter,
    genderFilter,
    statusFilter,
    dobDateRange,
    createdDateRange,
    updatedDateRange,
    sortBy,
    ascending,
  ]);

  // Cập nhật hàm xử lý tìm kiếm để trích xuất đúng thông tin tìm kiếm
  const handleFullNameSearch = (value: string) => {
    // Lưu giá trị hiển thị đầy đủ để hiển thị trong dropdown
    setFullNameSearch(value || "");

    // Reset trang về 1 khi thay đổi tìm kiếm
    setCurrentPage(1);
  };

  return (
    <div className="history-container" style={{ padding: "20px" }}>
      {contextHolder}
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.back()}
            style={{ marginRight: "8px" }}
          >
            Back
          </Button>
          <UserOutlined style={{ fontSize: "24px" }} />
          <h3 className="text-xl font-bold">User Management</h3>
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <Card
        className="shadow mb-4"
        bodyStyle={{ padding: "16px" }}
        title={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "16px",
            }}
          >
            <AppstoreOutlined />
            <span>Toolbar</span>
          </div>
        }
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Full Name or Email Search */}
            <Select
              showSearch
              placeholder="Search by Full Name or Email"
              value={fullNameSearch || undefined}
              onChange={handleFullNameSearch}
              style={{ width: "320px" }}
              allowClear
              filterOption={(input, option) =>
                (option?.value?.toString().toLowerCase() || "").includes(
                  input.toLowerCase()
                )
              }
              options={fullNameOptions.map((combined) => ({
                value: combined,
              }))}
              optionRender={(option) => {
                const optionParts = (option.value?.toString() || "").split(
                  " | "
                );
                const fullName = optionParts[0];
                const email = optionParts[1];

                return (
                  <div className="custom-select-option">
                    <div className="name">{fullName}</div>
                    <div className="email">{email}</div>
                  </div>
                );
              }}
              dropdownStyle={{ minWidth: "320px" }}
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

            {/* Status */}
            <div>
              <Select
                placeholder={
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <TagOutlined style={{ marginRight: 8 }} />
                    <span>Status</span>
                  </div>
                }
                value={statusFilter || undefined}
                onChange={(value) => {
                  setStatusFilter(value || "");
                  setCurrentPage(1);
                }}
                style={{ width: "120px" }}
                allowClear
                disabled={loading}
              >
                <Option value="Active">Active</Option>
                <Option value="Inactive">Inactive</Option>
              </Select>
            </div>

            {/* Role Filter */}
            <div>
              <Select
                placeholder={
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <TeamOutlined style={{ marginRight: 8 }} />
                    <span>Select Role</span>
                  </div>
                }
                value={roleFilter || undefined}
                onChange={(value) => {
                  setRoleFilter(value || "");
                  setCurrentPage(1);
                }}
                style={{ width: "140px" }}
                allowClear
                disabled={loading}
              >
                {roleOptions.map((role) => (
                  <Option key={role} value={role}>
                    {role}
                  </Option>
                ))}
              </Select>
            </div>

            {/* Reset Button */}
            <Tooltip title="Reset All Filters">
              <Button
                icon={<UndoOutlined />}
                onClick={handleReset}
                disabled={!(isMainFiltersApplied() || isFiltersApplied())}
              >
                Reset
              </Button>
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
                          <strong>Show All Columns</strong>
                        </Checkbox>
                      </div>
                    ),
                  },
                  {
                    key: "divider",
                    type: "divider",
                  },
                  ...Object.keys(columnVisibility).map((key) => ({
                    key,
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={columnVisibility[key]}
                          onChange={() => handleColumnVisibilityChange(key)}
                        >
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </Checkbox>
                      </div>
                    ),
                  })),
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

            {/* Create Button */}
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalVisible(true)}
              disabled={loading}
            >
              Create
            </Button>
          </div>

          <div>
            {/* Export Button */}
            <Dropdown
              menu={{
                items: [
                  {
                    key: "1",
                    label: "Export Users",
                    icon: <FileExcelOutlined />,
                    onClick: handleOpenExportConfig,
                  },
                  {
                    key: "2",
                    label: "Download Template",
                    icon: <DownloadOutlined />,
                    onClick: handleExportTemplate,
                  },
                ],
              }}
              trigger={["click"]}
            >
              <Button
                type="primary"
                icon={<FileExcelOutlined />}
                disabled={loading}
              >
                Export
              </Button>
            </Dropdown>

            {/* Import Button */}
            <Button
              icon={<UploadOutlined />}
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = ".xlsx, .xls";
                input.onchange = (e) => {
                  const target = e.target as HTMLInputElement;
                  if (target.files && target.files.length > 0) {
                    handleImportUsers(target.files[0]);
                  }
                };
                input.click();
              }}
              style={{ marginLeft: "8px" }}
              disabled={loading}
            >
              Import
            </Button>
          </div>
        </div>
      </Card>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="mb-3 flex items-center gap-2 p-2 bg-gray-50 rounded">
          <Text>{selectedUsers.length} users selected</Text>
          <Button
            onClick={() => handleBulkActivate(selectedUsers)}
            type="primary"
            size="small"
          >
            Activate
          </Button>
          <Button
            onClick={() => handleBulkDeactivate(selectedUsers)}
            danger
            size="small"
          >
            Deactivate
          </Button>
          <Button onClick={() => setSelectedUsers([])} size="small">
            Cancel
          </Button>
        </div>
      )}

      {/* User Table */}
      <UserTable
        users={users}
        loading={loading}
        totalItems={totalItems}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onUserSelect={handleUserSelect}
        selectedUsers={selectedUsers}
        columnVisibility={columnVisibility}
        onActivate={handleActivate}
        onDeactivate={handleDeactivate}
        onViewDetails={handleViewDetails}
        onEdit={handleEdit}
      />

      {/* Create User Modal */}
      <CreateModal
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Export Config Modal */}
      <ExportConfigModal
        visible={exportConfigModalVisible}
        onCancel={closeExportConfigModal}
        config={exportConfig}
        onChange={handleExportConfigChange}
        onExport={handleExportToExcel}
      />

      {/* Filter Modal */}
      <UserFilterModal
        visible={filterModalVisible}
        onCancel={() => setFilterModalVisible(false)}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        filters={filterState}
        roleOptions={roleOptions}
        users={allUsers}
      />
    </div>
  );
}

export default UserManagement;
