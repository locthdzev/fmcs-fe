import React, { useState, useEffect } from "react";
import {
  Button,
  Typography,
  Tabs,
  Select,
  message,
  Dropdown,
  Menu,
  Checkbox,
  Modal,
  Space,
  Input,
  Popconfirm,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  FileExcelOutlined,
  MedicineBoxOutlined,
  FilterOutlined,
  SearchOutlined,
  SettingOutlined,
  ReloadOutlined,
  SendOutlined,
  MoreOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  FileSearchOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  ClockCircleOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";

import PageContainer from "../shared/PageContainer";
import ToolbarCard from "../shared/ToolbarCard";
import TableControls from "../shared/TableControls";
import PaginationFooter from "../shared/PaginationFooter";
import InsuranceFilterModal from "./InsuranceFilterModal";
import ExportConfigurationModal from "./ExportConfigurationModal";
import VerifiedTable from "./VerifiedTable";
import InitialTable from "./InitialTable";
import VerificationList from "./VerificationList";
import InsuranceUpdateRequestList from "./InsuranceUpdateRequestList";
import ExpiredUpdateTable from "./ExpiredUpdateTable";
import ExpiredTable from "./ExpiredTable";
import NoInsuranceTable from "./NoInsuranceTable";
import SoftDeleteTable from "./SoftDeleteTable";
import InsuranceConfigModal from "./InsuranceConfigModal";
import InsuranceCreateModal from "./InsuranceCreateModal";
import AdvancedFilterModal from "./AdvancedFilterModal";
import { filterDataByTab } from "./clientSideFilter";

import {
  HealthInsuranceResponseDTO,
  UpdateRequestDTO,
  getAllHealthInsurances,
  getExpiredInsurances,
  getExpiredUpdateInsurances,
  getHealthInsuranceConfig,
  getInitialInsurances,
  getSoftDeletedInsurances,
  getUninsuredRecords,
  getUpdateRequests,
  getVerificationRequests,
  getVerifiedInsurances,
  sendHealthInsuranceUpdateRequest,
  createInitialHealthInsurances,
  exportHealthInsurances,
  softDeleteHealthInsurances,
  setupHealthInsuranceRealTime,
  setHealthInsuranceConfig,
  getRejectedInsurances,
} from "@/api/healthinsurance";
import api from "@/api/customize-axios";

const { TabPane } = Tabs;
const { Text } = Typography;

const HealthInsuranceManagement: React.FC = () => {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();

  // State variables
  const [activeTab, setActiveTab] = useState<string>("verified");
  const [loading, setLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);
  const [searchText, setSearchText] = useState<string>("");
  const [selectedOwner, setSelectedOwner] = useState<string | undefined>(
    undefined
  );
  const [owners, setOwners] = useState<
    { id: string; fullName: string; email: string }[]
  >([]);
  const [ownersLoading, setOwnersLoading] = useState<boolean>(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [filterModalVisible, setFilterModalVisible] = useState<boolean>(false);
  const [configModalVisible, setConfigModalVisible] = useState<boolean>(false);
  const [createModalVisible, setCreateModalVisible] = useState<boolean>(false);
  const [createManual, setCreateManual] = useState<boolean>(true);
  const [exportModalVisible, setExportModalVisible] = useState<boolean>(false);
  const [filterParams, setFilterParams] = useState<any>({});
  const [sortBy, setSortBy] = useState<string>("CreatedAt");
  const [ascending, setAscending] = useState<boolean>(false);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState<boolean>(false);

  // Advanced filter state
  const [advancedFilterModalVisible, setAdvancedFilterModalVisible] =
    useState<boolean>(false);
  const [advancedFilterParams, setAdvancedFilterParams] = useState<any>({});
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [isFiltered, setIsFiltered] = useState<boolean>(false);

  // Data for tables
  const [verifiedInsurances, setVerifiedInsurances] = useState<
    HealthInsuranceResponseDTO[]
  >([]);
  const [initialInsurances, setInitialInsurances] = useState<
    HealthInsuranceResponseDTO[]
  >([]);
  const [pendingVerifications, setPendingVerifications] = useState<
    HealthInsuranceResponseDTO[]
  >([]);
  const [rejectedInsurances, setRejectedInsurances] = useState<
    HealthInsuranceResponseDTO[]
  >([]);
  const [updateRequests, setUpdateRequests] = useState<UpdateRequestDTO[]>([]);
  const [expiredUpdates, setExpiredUpdates] = useState<
    HealthInsuranceResponseDTO[]
  >([]);
  const [expiredInsurances, setExpiredInsurances] = useState<
    HealthInsuranceResponseDTO[]
  >([]);
  const [noInsurances, setNoInsurances] = useState<
    HealthInsuranceResponseDTO[]
  >([]);
  const [softDeletedInsurances, setSoftDeletedInsurances] = useState<
    HealthInsuranceResponseDTO[]
  >([]);

  // Column visibility state for tables
  const [verifiedColumnVisibility, setVerifiedColumnVisibility] = useState({
    owner: true,
    insuranceNumber: true,
    fullName: false,
    dob: false,
    gender: false,
    address: false,
    healthcareProvider: true,
    validPeriod: true,
    issueDate: false,
    image: true,
    createdAt: false,
    createdBy: false,
    updatedAt: false,
    updatedBy: false,
    status: true,
    verification: true,
    actions: true,
  });

  const [initialColumnVisibility, setInitialColumnVisibility] = useState({
    owner: true,
    createdAt: true,
    createdBy: true,
    status: true,
    deadline: true,
  });

  const [expiredUpdateColumnVisibility, setExpiredUpdateColumnVisibility] =
    useState({
      owner: true,
      createdAt: true,
      createdBy: true,
      status: true,
      deadline: true,
    });

  const [expiredColumnVisibility, setExpiredColumnVisibility] = useState({
    owner: true,
    insuranceNumber: true,
    fullName: true,
    dob: false,
    gender: false,
    address: false,
    healthcareProvider: true,
    validPeriod: true,
    issueDate: false,
    image: false,
    createdAt: false,
    createdBy: false,
    updatedAt: false,
    updatedBy: false,
    status: true,
    verification: true,
  });

  const [noInsuranceColumnVisibility, setNoInsuranceColumnVisibility] =
    useState({
      owner: true,
      createdAt: true,
      createdBy: true,
      status: true,
      updatedAt: false,
      updatedBy: false,
    });

  const [softDeleteColumnVisibility, setSoftDeleteColumnVisibility] = useState({
    owner: true,
    insuranceNumber: true,
    createdAt: true,
    createdBy: true,
    status: true,
    updatedAt: true,
    updatedBy: true,
  });

  const [rejectedColumnVisibility, setRejectedColumnVisibility] = useState({
    owner: true,
    insuranceNumber: true,
    fullName: true,
    dob: false,
    gender: false,
    address: false,
    healthcareProvider: true,
    validPeriod: true,
    issueDate: false,
    image: true,
    createdAt: false,
    createdBy: false,
    updatedAt: true,
    updatedBy: true,
    status: true,
    verification: true,
    actions: true,
  });

  // Fetch data based on active tab
  useEffect(() => {
    fetchData();

    // Debug logs
    console.log("Active tab:", activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeTab,
    currentPage,
    pageSize,
    searchText,
    selectedOwner,
    filterParams,
  ]);

  // Add a new useEffect to fetch owners when active tab changes
  useEffect(() => {
    fetchOwners();
    // Reset selected owner when tab changes
    setSelectedOwner(undefined);
    // Reset advanced filter when tab changes
    setAdvancedFilterParams({});
    setFilteredData([]);
    setIsFiltered(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let result;

      console.log(
        `Fetching data for tab: ${activeTab} with page: ${currentPage}, pageSize: ${pageSize}, search: ${searchText}`
      );

      switch (activeTab) {
        case "verified":
          result = await getVerifiedInsurances(
            currentPage,
            pageSize,
            searchText,
            "CreatedAt",
            false,
            selectedOwner
          );
          if (result.isSuccess) {
            setVerifiedInsurances(result.data);
            setTotal(result.totalItems);
          } else {
            messageApi.error(
              result.message || "Failed to fetch verified insurances"
            );
          }
          break;
        case "initial":
          result = await getInitialInsurances(
            currentPage,
            pageSize,
            searchText,
            "CreatedAt",
            false,
            selectedOwner
          );
          if (result.isSuccess) {
            setInitialInsurances(result.data);
            setTotal(result.totalItems);
          } else {
            messageApi.error(
              result.message || "Failed to fetch initial insurances"
            );
          }
          break;
        case "verification":
          result = await getVerificationRequests(
            currentPage,
            pageSize,
            searchText,
            "UpdatedAt",
            false
          );

          console.log("Verification tab API response:", result);

          if (result.isSuccess) {
            // Transform HealthInsuranceResponseDTO to UpdateRequestDTO format
            // for compatibility with the VerificationList component
            let verificationRequests = result.data.map(
              (insurance: HealthInsuranceResponseDTO) => ({
                id: insurance.id,
                healthInsuranceId: insurance.id,
                requestedBy: insurance.user,
                requestedAt: insurance.updatedAt,
                status: insurance.status || "Submitted",
                reviewedBy: insurance.updatedBy,
                reviewedAt: insurance.updatedAt,
                rejectionReason: undefined,
                hasInsurance: true,
                healthInsuranceNumber: insurance.healthInsuranceNumber,
                fullName: insurance.fullName,
                dateOfBirth: insurance.dateOfBirth,
                gender: insurance.gender,
                address: insurance.address,
                healthcareProviderName: insurance.healthcareProviderName,
                healthcareProviderCode: insurance.healthcareProviderCode,
                validFrom: insurance.validFrom,
                validTo: insurance.validTo,
                issueDate: insurance.issueDate,
                imageUrl: insurance.imageUrl,
              })
            );

            // Filter by owner if selected
            if (selectedOwner) {
              verificationRequests = verificationRequests.filter(
                (req: UpdateRequestDTO) =>
                  req.requestedBy && req.requestedBy.id === selectedOwner
              );
            }

            console.log(
              "Transformed verification requests:",
              verificationRequests
            );

            setUpdateRequests(verificationRequests);
            setTotal(result.totalItems);
          } else {
            messageApi.error(
              result.message || "Failed to fetch verification requests"
            );
          }
          break;
        case "updateRequest":
          try {
            result = await getUpdateRequests({
              page: currentPage,
              pageSize,
              search: searchText,
              sortBy: "CreatedAt",
              ascending: false,
              status: "Pending",
            });

            console.log("Update Request tab API response:", result);

            if (result.isSuccess) {
              let updRequests = result.data;

              // Filter by owner if selected
              if (selectedOwner) {
                updRequests = updRequests.filter(
                  (req: UpdateRequestDTO) =>
                    req.requestedBy && req.requestedBy.id === selectedOwner
                );
              }

              setUpdateRequests(updRequests);
              setTotal(result.totalItems);
            } else {
              messageApi.error(
                result.message || "Failed to fetch update requests"
              );
            }
          } catch (error) {
            console.error("Error in update request tab:", error);
            messageApi.error(
              "Failed to fetch update requests: " +
                (error instanceof Error ? error.message : "Unknown error")
            );
          }
          break;
        case "expiredUpdate":
          result = await getExpiredUpdateInsurances(
            currentPage,
            pageSize,
            searchText,
            "CreatedAt",
            false,
            selectedOwner
          );
          if (result.isSuccess) {
            setExpiredUpdates(result.data);
            setTotal(result.totalItems);
          } else {
            messageApi.error(
              result.message || "Failed to fetch expired updates"
            );
          }
          break;
        case "expired":
          result = await getExpiredInsurances(
            currentPage,
            pageSize,
            searchText,
            "CreatedAt",
            false,
            selectedOwner
          );
          if (result.isSuccess) {
            setExpiredInsurances(result.data);
            setTotal(result.totalItems);
          } else {
            messageApi.error(
              result.message || "Failed to fetch expired insurances"
            );
          }
          break;
        case "uninsured":
          result = await getUninsuredRecords(
            currentPage,
            pageSize,
            searchText,
            "CreatedAt",
            false,
            selectedOwner
          );
          if (result.isSuccess) {
            setNoInsurances(result.data);
            setTotal(result.totalItems);
          } else {
            messageApi.error(
              result.message || "Failed to fetch uninsured records"
            );
          }
          break;
        case "softDelete":
          result = await getSoftDeletedInsurances(
            currentPage,
            pageSize,
            searchText,
            "CreatedAt",
            false,
            selectedOwner
          );
          if (result.isSuccess) {
            setSoftDeletedInsurances(result.data);
            setTotal(result.totalItems);
          } else {
            messageApi.error(
              result.message || "Failed to fetch soft-deleted insurances"
            );
          }
          break;
        case "rejected":
          result = await getRejectedInsurances(
            currentPage,
            pageSize,
            searchText,
            "CreatedAt",
            false,
            selectedOwner
          );
          if (result.isSuccess) {
            setRejectedInsurances(result.data);
            setTotal(result.totalItems);
          } else {
            messageApi.error(
              result.message || "Failed to fetch rejected insurances"
            );
          }
          break;
        default:
          break;
      }

      console.log(`Fetched data for ${activeTab} tab:`, result);
    } catch (error) {
      console.error("Error fetching data:", error);
      messageApi.error(
        "Failed to fetch data: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setCurrentPage(1);
    setSelectedRowKeys([]);
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    setCurrentPage(1);
  };

  const handleOwnerChange = (value: string) => {
    setSelectedOwner(value);
    setCurrentPage(1);

    // For verification and update request tabs, we need to refetch data with the selected owner
    if (["verification", "updateRequest"].includes(activeTab)) {
      fetchData();
    }
  };

  const handleResetFilters = () => {
    setSearchText("");
    setSelectedOwner(undefined);
    setFilterParams({});
    // Reset advanced filter
    setAdvancedFilterParams({});
    setFilteredData([]);
    setIsFiltered(false);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number, pageSize?: number) => {
    setCurrentPage(page);
    if (pageSize) setPageSize(pageSize);
  };

  const handleColumnVisibilityChange = (key: string) => {
    const currentVisibility = getActiveColumnVisibility();
    setActiveColumnVisibility({
      ...currentVisibility,
      [key]: !currentVisibility[key],
    });
  };

  const toggleAllColumns = (checked: boolean) => {
    const newVisibility: Record<string, boolean> = {};
    const currentVisibility = getActiveColumnVisibility();

    Object.keys(currentVisibility).forEach((key) => {
      newVisibility[key] = checked;
    });

    setActiveColumnVisibility(newVisibility);
  };

  const areAllColumnsVisible = () => {
    const currentVisibility = getActiveColumnVisibility();
    return Object.values(currentVisibility).every((visible) => visible);
  };

  const handleDropdownVisibleChange = (open: boolean) => {
    setDropdownOpen(open);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const showCreateModal = (isManual: boolean) => {
    setCreateManual(isManual);
    setCreateModalVisible(true);
  };

  const showConfigModal = () => {
    setConfigModalVisible(true);
  };

  const showExportModal = () => {
    setExportModalVisible(true);
  };

  const handleSendUpdateRequest = async () => {
    try {
      setLoading(true);
      messageApi.loading({
        content: "Sending update requests...",
        key: "updateRequest",
        duration: 0,
      });

      const result = await sendHealthInsuranceUpdateRequest();

      if (result.isSuccess) {
        messageApi.success({
          content: `Update requests for ${
            result.data?.userCount || 0
          } users have been queued to be sent.`,
          key: "updateRequest",
          duration: 3,
        });
        fetchData();
      } else {
        // Xử lý lỗi cụ thể từ server
        if (result.message === "Failed to send emails.") {
          messageApi.error({
            content:
              "Unable to send emails. The email service might be unavailable. Please contact IT support.",
            key: "updateRequest",
            duration: 5,
          });
        } else {
          messageApi.error({
            content: result.message || "Failed to send update requests",
            key: "updateRequest",
            duration: 3,
          });
        }

        // Log lỗi để debug
        console.error("Send update request API error:", result);
      }
    } catch (error) {
      console.error("Error sending update requests:", error);
      messageApi.error({
        content:
          "Failed to send update requests. Please try again later or contact IT support.",
        key: "updateRequest",
        duration: 3,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInitial = async () => {
    try {
      setLoading(true);
      const result = await createInitialHealthInsurances();
      if (result.isSuccess) {
        const count = result.data || 0;
        if (count > 0) {
          messageApi.success(
            `${count} initial health insurance records created successfully`
          );
        } else {
          messageApi.info(
            "No new initial health insurance records needed to be created"
          );
        }
        fetchData();
      } else {
        messageApi.info(
          result.message || "Failed to create initial health insurances"
        );
      }
    } catch (error) {
      messageApi.error("Failed to create initial health insurances");
      console.error("Error creating initial health insurances:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      await exportHealthInsurances();
      messageApi.success("Export started, file will be downloaded shortly");
    } catch (error) {
      console.error("Error exporting data:", error);
      messageApi.error("Failed to export data");
    }
  };

  const handleFilterApply = (filters: any) => {
    setFilterParams(filters);
    setFilterModalVisible(false);
    setCurrentPage(1);
  };

  const getActiveColumnVisibility = (): Record<string, boolean> => {
    switch (activeTab) {
      case "verified":
        return verifiedColumnVisibility;
      case "initial":
        return initialColumnVisibility;
      case "expiredUpdate":
        return expiredUpdateColumnVisibility;
      case "expired":
        return expiredColumnVisibility;
      case "uninsured":
        return noInsuranceColumnVisibility;
      case "softDelete":
        return softDeleteColumnVisibility;
      case "rejected":
        return rejectedColumnVisibility;
      default:
        return {};
    }
  };

  const setActiveColumnVisibility = (visibility: any) => {
    switch (activeTab) {
      case "verified":
        setVerifiedColumnVisibility(visibility);
        break;
      case "initial":
        setInitialColumnVisibility(visibility);
        break;
      case "expiredUpdate":
        setExpiredUpdateColumnVisibility(visibility);
        break;
      case "expired":
        setExpiredColumnVisibility(visibility);
        break;
      case "uninsured":
        setNoInsuranceColumnVisibility(visibility);
        break;
      case "softDelete":
        setSoftDeleteColumnVisibility(visibility);
        break;
      case "rejected":
        setRejectedColumnVisibility(visibility);
        break;
    }
  };

  const handleBulkSoftDelete = async () => {
    try {
      setBulkDeleteLoading(true);
      const selectedIds = selectedRowKeys.map((key) => key.toString());
      const result = await softDeleteHealthInsurances(selectedIds);

      if (result.isSuccess) {
        messageApi.success(
          `Successfully deleted ${selectedIds.length} records`
        );
        setSelectedRowKeys([]);
        fetchData();
      } else {
        messageApi.error(result.message || "Failed to delete selected records");
      }
    } catch (error) {
      console.error("Error in bulk delete:", error);
      messageApi.error("Failed to delete selected records");
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  // Function to fetch unique owners based on active tab
  const fetchOwners = async () => {
    setOwnersLoading(true);
    try {
      let result;

      switch (activeTab) {
        case "verified":
          result = await getVerifiedInsurances(1, 1000, "", "CreatedAt", false);
          break;
        case "initial":
          result = await getInitialInsurances(1, 1000, "", "CreatedAt", false);
          break;
        case "verification":
          result = await getVerificationRequests(
            1,
            1000,
            "",
            "CreatedAt",
            false
          );
          if (result.isSuccess) {
            // Extract unique owners from verification requests
            const uniqueOwners = Array.from(
              new Map(
                result.data
                  .filter(
                    (insurance: HealthInsuranceResponseDTO) => insurance.user
                  )
                  .map((insurance: HealthInsuranceResponseDTO) => [
                    insurance.user.id,
                    {
                      id: insurance.user.id,
                      fullName: insurance.user.fullName,
                      email: insurance.user.email,
                    },
                  ])
              ).values()
            ) as { id: string; fullName: string; email: string }[];
            setOwners(uniqueOwners);
            setOwnersLoading(false);
            return;
          }
          break;
        case "updateRequest":
          const updateResult = await getUpdateRequests({
            page: 1,
            pageSize: 1000,
            search: "",
            sortBy: "CreatedAt",
            ascending: false,
          });
          if (updateResult.isSuccess) {
            // Extract unique owners from update requests
            const uniqueOwners = Array.from(
              new Map(
                updateResult.data
                  .filter((req: UpdateRequestDTO) => req.requestedBy)
                  .map((req: UpdateRequestDTO) => [
                    req.requestedBy.id,
                    {
                      id: req.requestedBy.id,
                      fullName: req.requestedBy.userName,
                      email: req.requestedBy.email,
                    },
                  ])
              ).values()
            ) as { id: string; fullName: string; email: string }[];
            setOwners(uniqueOwners);
            setOwnersLoading(false);
            return;
          }
          break;
        case "expiredUpdate":
          result = await getExpiredUpdateInsurances(
            1,
            1000,
            "",
            "CreatedAt",
            false
          );
          break;
        case "expired":
          result = await getExpiredInsurances(1, 1000, "", "CreatedAt", false);
          break;
        case "uninsured":
          result = await getUninsuredRecords(1, 1000, "", "CreatedAt", false);
          break;
        case "softDelete":
          result = await getSoftDeletedInsurances(
            1,
            1000,
            "",
            "CreatedAt",
            false
          );
          break;
        case "rejected":
          result = await getRejectedInsurances(1, 1000, "", "CreatedAt", false);
          break;
        default:
          result = { isSuccess: true, data: [] };
      }

      if (result.isSuccess) {
        // Extract unique owners from the data
        const ownersMap = new Map<
          string,
          { id: string; fullName: string; email: string }
        >();

        result.data.forEach((item: any) => {
          if (item.user && item.user.id) {
            ownersMap.set(item.user.id, {
              id: item.user.id,
              fullName: item.user.fullName || item.user.userName || "Unknown",
              email: item.user.email || "",
            });
          }
        });

        setOwners(Array.from(ownersMap.values()));
      }
    } catch (error) {
      console.error("Error fetching owners:", error);
    } finally {
      setOwnersLoading(false);
    }
  };

  // Handle advanced filter
  const handleAdvancedFilterApply = (filters: any) => {
    setAdvancedFilterParams(filters);
    let dataToFilter: any[] = [];

    // Select data based on active tab
    switch (activeTab) {
      case "verified":
        dataToFilter = verifiedInsurances;
        break;
      case "initial":
        dataToFilter = initialInsurances;
        break;
      case "verification":
        dataToFilter = updateRequests;
        break;
      case "updateRequest":
        dataToFilter = updateRequests;
        break;
      case "expiredUpdate":
        dataToFilter = expiredUpdates;
        break;
      case "expired":
        dataToFilter = expiredInsurances;
        break;
      case "uninsured":
        dataToFilter = noInsurances;
        break;
      case "softDelete":
        dataToFilter = softDeletedInsurances;
        break;
      case "rejected":
        dataToFilter = rejectedInsurances;
        break;
      default:
        dataToFilter = [];
    }

    // Apply filters
    const filtered = filterDataByTab(activeTab, dataToFilter, filters);
    setFilteredData(filtered);
    setIsFiltered(true);
    setAdvancedFilterModalVisible(false);
  };

  const handleAdvancedFilterReset = () => {
    setAdvancedFilterParams({});
    setFilteredData([]);
    setIsFiltered(false);
    setAdvancedFilterModalVisible(false);
  };

  const showAdvancedFilterModal = () => {
    setAdvancedFilterModalVisible(true);
  };

  const getDataForActiveTab = () => {
    if (!isFiltered) {
      switch (activeTab) {
        case "verified":
          return verifiedInsurances;
        case "initial":
          return initialInsurances;
        case "verification":
          return updateRequests;
        case "updateRequest":
          return updateRequests;
        case "expiredUpdate":
          return expiredUpdates;
        case "expired":
          return expiredInsurances;
        case "uninsured":
          return noInsurances;
        case "softDelete":
          return softDeletedInsurances;
        case "rejected":
          return rejectedInsurances;
        default:
          return [];
      }
    }
    return filteredData;
  };

  return (
    <PageContainer
      title="Health Insurance Management"
      icon={<MedicineBoxOutlined style={{ fontSize: "24px" }} />}
      onBack={handleBack}
    >
      {contextHolder}

      {/* Tabs for different insurance statuses */}
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        className="bg-white rounded shadow-sm"
        type="card"
      >
        <TabPane
          tab={
            <span>
              <CheckCircleOutlined
                className="mr-2"
                style={{ color: "#52c41a" }}
              />
              Verified
            </span>
          }
          key="verified"
        />
        <TabPane
          tab={
            <span>
              <InfoCircleOutlined
                className="mr-2"
                style={{ color: "#1677ff" }}
              />
              Initial
            </span>
          }
          key="initial"
        />
        <TabPane
          tab={
            <span>
              <FileSearchOutlined
                className="mr-2"
                style={{ color: "#1677ff" }}
              />
              Verification
            </span>
          }
          key="verification"
        />
        <TabPane
          tab={
            <span>
              <CloseCircleOutlined
                className="mr-2"
                style={{ color: "#ff4d4f" }}
              />
              Rejected
            </span>
          }
          key="rejected"
        />
        <TabPane
          tab={
            <span>
              <SyncOutlined className="mr-2" style={{ color: "#1677ff" }} />
              Update Request
            </span>
          }
          key="updateRequest"
        />
        <TabPane
          tab={
            <span>
              <ClockCircleOutlined
                className="mr-2"
                style={{ color: "#faad14" }}
              />
              Expired Update
            </span>
          }
          key="expiredUpdate"
        />
        <TabPane
          tab={
            <span>
              <ExclamationCircleOutlined
                className="mr-2"
                style={{ color: "#faad14" }}
              />
              Expired
            </span>
          }
          key="expired"
        />
        <TabPane
          tab={
            <span>
              <StopOutlined className="mr-2" style={{ color: "#ff4d4f" }} />
              Uninsured
            </span>
          }
          key="uninsured"
        />
        <TabPane
          tab={
            <span>
              <DeleteOutlined className="mr-2" style={{ color: "#ff4d4f" }} />
              Soft Delete
            </span>
          }
          key="softDelete"
        />
      </Tabs>

      {/* Toolbar */}
      <ToolbarCard
        leftContent={
          <>
            {/* Owner Filter Dropdown */}
            <Select
              showSearch
              placeholder="Search by Owner"
              value={selectedOwner}
              onChange={handleOwnerChange}
              style={{ width: 320 }}
              prefix={<SearchOutlined style={{ color: "blue" }} />}
              loading={ownersLoading}
              allowClear
              filterOption={(input, option) =>
                (option?.label?.toString().toLowerCase() || "").includes(
                  input.toLowerCase()
                )
              }
              options={owners.map((owner) => ({
                value: owner.id,
                label: `${owner.fullName} (${owner.email})`,
              }))}
            />

            {/* Reset Button */}
            <Tooltip title="Reset all filters">
              <Button
                icon={<ReloadOutlined />}
                onClick={handleResetFilters}
                disabled={
                  !searchText &&
                  !selectedOwner &&
                  Object.keys(filterParams).length === 0 &&
                  !isFiltered
                }
              />
            </Tooltip>

            {/* Advanced Filter Button */}
            <Button
              icon={<FilterOutlined />}
              type={isFiltered ? "primary" : "default"}
              onClick={showAdvancedFilterModal}
            >
              Filter {isFiltered ? `(${filteredData.length})` : ""}
            </Button>

            {/* Visible Columns - only for table views */}
            {["verification", "updateRequest"].indexOf(activeTab) === -1 && (
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
                    ...Object.entries(getActiveColumnVisibility()).map(
                      ([key, value]) => ({
                        key,
                        label: (
                          <div onClick={handleMenuClick}>
                            <Checkbox
                              checked={!!value}
                              onChange={() => handleColumnVisibilityChange(key)}
                            >
                              {key.charAt(0).toUpperCase() +
                                key.slice(1).replace(/([A-Z])/g, " $1")}
                            </Checkbox>
                          </div>
                        ),
                      })
                    ),
                  ],
                }}
                trigger={["click"]}
                open={dropdownOpen}
                onOpenChange={handleDropdownVisibleChange}
              >
                <Button icon={<SettingOutlined />}>Columns</Button>
              </Dropdown>
            )}

            {/* Config Button */}
            <Button icon={<SettingOutlined />} onClick={showConfigModal}>
              Configuration
            </Button>

            {/* Create Button with Dropdown */}
            <Dropdown
              menu={{
                items: [
                  {
                    key: "manual",
                    label: "Create Manual",
                    onClick: () => showCreateModal(true),
                  },
                  {
                    key: "initial",
                    label: "Create Initial",
                    onClick: handleCreateInitial,
                  },
                ],
              }}
              placement="bottomLeft"
            >
              <Button type="primary" icon={<PlusOutlined />}>
                Create
              </Button>
            </Dropdown>

            {/* Tab-specific actions */}
            {activeTab === "initial" && (
              <Popconfirm
                title="Send Update Request"
                description="Are you sure you want to send update requests to all users with pending initial insurance information?"
                onConfirm={handleSendUpdateRequest}
                okText="Yes"
                cancelText="No"
                icon={
                  <ExclamationCircleOutlined style={{ color: "#1677ff" }} />
                }
              >
                <Button type="primary" icon={<SendOutlined />}>
                  Send Update Request
                </Button>
              </Popconfirm>
            )}
          </>
        }
        rightContent={
          <>
            {/* Export Button */}
            <Button
              icon={<FileExcelOutlined />}
              onClick={showExportModal}
              style={{ marginRight: "8px" }}
            >
              Export
            </Button>
          </>
        }
      />

      {/* Table Controls */}
      <TableControls
        selectedRowKeys={selectedRowKeys}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        useItemsLabel={
          activeTab === "verification" || activeTab === "updateRequest"
        }
        bulkActions={
          ["verification", "updateRequest", "softDelete"].indexOf(activeTab) ===
          -1
            ? [
                {
                  key: "delete",
                  title: "Delete selected items",
                  description: `Are you sure you want to delete ${selectedRowKeys.length} selected item(s)?`,
                  icon: <DeleteOutlined />,
                  buttonText: "Delete",
                  buttonType: "primary",
                  isDanger: true,
                  tooltip: "Delete selected items",
                  isVisible: selectedRowKeys.length > 0,
                  isLoading: bulkDeleteLoading,
                  onConfirm: handleBulkSoftDelete,
                },
              ]
            : []
        }
      />

      {/* Tab Content */}
      {activeTab === "verified" && (
        <VerifiedTable
          loading={loading}
          insurances={isFiltered ? filteredData : verifiedInsurances}
          selectedRowKeys={selectedRowKeys}
          setSelectedRowKeys={setSelectedRowKeys}
          columnVisibility={verifiedColumnVisibility}
          refreshData={fetchData}
        />
      )}

      {activeTab === "initial" && (
        <InitialTable
          loading={loading}
          insurances={isFiltered ? filteredData : initialInsurances}
          selectedRowKeys={selectedRowKeys}
          setSelectedRowKeys={setSelectedRowKeys}
          columnVisibility={initialColumnVisibility}
          refreshData={fetchData}
        />
      )}

      {activeTab === "verification" && (
        <VerificationList
          loading={loading}
          updateRequests={isFiltered ? filteredData : updateRequests}
          refreshData={fetchData}
        />
      )}

      {activeTab === "updateRequest" && (
        <InsuranceUpdateRequestList
          loading={loading}
          updateRequests={isFiltered ? filteredData : updateRequests}
          refreshData={fetchData}
        />
      )}

      {activeTab === "expiredUpdate" && (
        <ExpiredUpdateTable
          loading={loading}
          insurances={isFiltered ? filteredData : expiredUpdates}
          selectedRowKeys={selectedRowKeys}
          setSelectedRowKeys={setSelectedRowKeys}
          columnVisibility={expiredUpdateColumnVisibility}
          refreshData={fetchData}
        />
      )}

      {activeTab === "expired" && (
        <ExpiredTable
          loading={loading}
          insurances={isFiltered ? filteredData : expiredInsurances}
          selectedRowKeys={selectedRowKeys}
          setSelectedRowKeys={setSelectedRowKeys}
          columnVisibility={expiredColumnVisibility}
          refreshData={fetchData}
        />
      )}

      {activeTab === "uninsured" && (
        <NoInsuranceTable
          loading={loading}
          insurances={isFiltered ? filteredData : noInsurances}
          selectedRowKeys={selectedRowKeys}
          setSelectedRowKeys={setSelectedRowKeys}
          columnVisibility={noInsuranceColumnVisibility}
          refreshData={fetchData}
        />
      )}

      {activeTab === "softDelete" && (
        <SoftDeleteTable
          loading={loading}
          insurances={isFiltered ? filteredData : softDeletedInsurances}
          selectedRowKeys={[]}
          setSelectedRowKeys={() => {}}
          columnVisibility={softDeleteColumnVisibility}
          refreshData={fetchData}
        />
      )}

      {activeTab === "rejected" && (
        <VerifiedTable
          loading={loading}
          insurances={isFiltered ? filteredData : rejectedInsurances}
          selectedRowKeys={selectedRowKeys}
          setSelectedRowKeys={setSelectedRowKeys}
          columnVisibility={rejectedColumnVisibility}
          refreshData={fetchData}
        />
      )}

      {/* Pagination Footer */}
      <PaginationFooter
        current={currentPage}
        pageSize={pageSize}
        total={isFiltered ? filteredData.length : total}
        onChange={handlePageChange}
        useItemsLabel={
          activeTab === "verification" || activeTab === "updateRequest"
        }
      />

      {/* Modals */}
      <InsuranceConfigModal
        visible={configModalVisible}
        onClose={() => setConfigModalVisible(false)}
        onSuccess={() => {
          setConfigModalVisible(false);
          fetchData();
        }}
      />

      <InsuranceCreateModal
        visible={createModalVisible}
        isManual={createManual}
        onClose={() => setCreateModalVisible(false)}
        onSuccess={() => {
          setCreateModalVisible(false);
          fetchData();
        }}
      />

      <InsuranceFilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={handleFilterApply}
        initialFilters={filterParams}
        tabKey={activeTab}
      />

      <ExportConfigurationModal
        visible={exportModalVisible}
        onClose={() => setExportModalVisible(false)}
        filters={filterParams}
        tabKey={activeTab}
      />

      <AdvancedFilterModal
        visible={advancedFilterModalVisible}
        onClose={() => setAdvancedFilterModalVisible(false)}
        onApply={handleAdvancedFilterApply}
        onReset={handleAdvancedFilterReset}
        initialFilters={advancedFilterParams}
        tabKey={activeTab}
        data={getDataForActiveTab()}
      />
    </PageContainer>
  );
};

export default HealthInsuranceManagement;
