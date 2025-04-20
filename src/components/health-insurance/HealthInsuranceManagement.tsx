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
} from "@ant-design/icons";
import { useRouter } from "next/router";

import PageContainer from "../shared/PageContainer";
import ToolbarCard from "../shared/ToolbarCard";
import TableControls from "../shared/TableControls";
import PaginationFooter from "../shared/PaginationFooter";

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
import InsuranceFilterModal from "./InsuranceFilterModal";
import ExportConfigurationModal from "./ExportConfigurationModal";

import {
  getAllHealthInsurances,
  getVerifiedInsurances,
  getInitialInsurances,
  getExpiredUpdateInsurances,
  getExpiredInsurances,
  getUninsuredRecords,
  getSoftDeletedInsurances,
  getVerificationRequests,
  getUpdateRequests,
  sendHealthInsuranceUpdateRequest,
  createInitialHealthInsurances,
  getHealthInsuranceConfig,
  exportHealthInsurances,
  HealthInsuranceResponseDTO,
  UpdateRequestDTO,
} from "@/api/healthinsurance";

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
  const [selectedOwner, setSelectedOwner] = useState<string | undefined>(undefined);
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
  
  // Data for tables
  const [verifiedInsurances, setVerifiedInsurances] = useState<HealthInsuranceResponseDTO[]>([]);
  const [initialInsurances, setInitialInsurances] = useState<HealthInsuranceResponseDTO[]>([]);
  const [pendingVerifications, setPendingVerifications] = useState<HealthInsuranceResponseDTO[]>([]);
  const [updateRequests, setUpdateRequests] = useState<UpdateRequestDTO[]>([]);
  const [expiredUpdates, setExpiredUpdates] = useState<HealthInsuranceResponseDTO[]>([]);
  const [expiredInsurances, setExpiredInsurances] = useState<HealthInsuranceResponseDTO[]>([]);
  const [noInsurances, setNoInsurances] = useState<HealthInsuranceResponseDTO[]>([]);
  const [softDeletedInsurances, setSoftDeletedInsurances] = useState<HealthInsuranceResponseDTO[]>([]);
  
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
  
  const [expiredUpdateColumnVisibility, setExpiredUpdateColumnVisibility] = useState({
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
  
  const [noInsuranceColumnVisibility, setNoInsuranceColumnVisibility] = useState({
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

  // Fetch data based on active tab
  useEffect(() => {
    fetchData();
    
    // Debug logs
    console.log("Active tab:", activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, currentPage, pageSize, searchText, selectedOwner, filterParams]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let result;
      
      console.log(`Fetching data for tab: ${activeTab} with page: ${currentPage}, pageSize: ${pageSize}, search: ${searchText}`);
      
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
            messageApi.error(result.message || "Failed to fetch verified insurances");
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
            messageApi.error(result.message || "Failed to fetch initial insurances");
          }
          break;
        case "verification":
          result = await getVerificationRequests(
            currentPage,
            pageSize,
            searchText,
            "CreatedAt",
            false
          );
          
          console.log("Verification tab API response:", result);
          
          if (result.isSuccess) {
            const verificationRequests = result.data.map((insurance: HealthInsuranceResponseDTO) => ({
              id: insurance.id,
              healthInsuranceId: insurance.id,
              requestedBy: insurance.user,
              requestedAt: insurance.createdAt,
              status: "Pending",
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
              imageUrl: insurance.imageUrl
            }));
            
            console.log("Transformed verification requests:", verificationRequests);
            setPendingVerifications(verificationRequests);
            setTotal(result.totalItems);
          } else {
            messageApi.error(result.message || "Failed to fetch verification requests");
          }
          break;
        case "updateRequest":
          try {
            result = await getUpdateRequests(
              {
                page: currentPage,
                pageSize,
                search: searchText,
                sortBy: "CreatedAt",
                ascending: false,
                status: "Pending"
              }
            );
            
            console.log("Update Request tab API response:", result);
            
            if (result.isSuccess) {
              setUpdateRequests(result.data);
              setTotal(result.totalItems);
            } else {
              messageApi.error(result.message || "Failed to fetch update requests");
            }
          } catch (error) {
            console.error("Error in update request tab:", error);
            messageApi.error("Failed to fetch update requests: " + (error instanceof Error ? error.message : "Unknown error"));
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
            messageApi.error(result.message || "Failed to fetch expired updates");
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
            messageApi.error(result.message || "Failed to fetch expired insurances");
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
            messageApi.error(result.message || "Failed to fetch uninsured records");
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
            messageApi.error(result.message || "Failed to fetch soft-deleted insurances");
          }
          break;
        default:
          break;
      }
      
      console.log(`Fetched data for ${activeTab} tab:`, result);
    } catch (error) {
      console.error("Error fetching data:", error);
      messageApi.error("Failed to fetch data: " + (error instanceof Error ? error.message : "Unknown error"));
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
  };

  const handleResetFilters = () => {
    setSearchText("");
    setSelectedOwner(undefined);
    setFilterParams({});
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
      const result = await sendHealthInsuranceUpdateRequest();
      if (result.isSuccess) {
        messageApi.success("Update requests sent successfully");
        fetchData();
      } else {
        messageApi.error(result.message || "Failed to send update requests");
      }
    } catch (error) {
      console.error("Error sending update requests:", error);
      messageApi.error("Failed to send update requests");
    }
  };

  const handleCreateInitial = async () => {
    try {
      setLoading(true);
      const result = await createInitialHealthInsurances();
      if (result.isSuccess) {
        messageApi.success("Initial health insurances created successfully");
        fetchData();
      } else {
        messageApi.error(result.message || "Failed to create initial health insurances");
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
    }
  };

  return (
    <PageContainer
      title="Health Insurance Management"
      icon={<MedicineBoxOutlined style={{ fontSize: "24px" }} />}
      onBack={handleBack}
    >
      {contextHolder}

      {/* Tabs for different insurance statuses */}
      <Tabs activeKey={activeTab} onChange={handleTabChange}>
        <TabPane tab="Verified" key="verified" />
        <TabPane tab="Initial" key="initial" />
        <TabPane tab="Verification" key="verification" />
        <TabPane tab="Update Request" key="updateRequest" />
        <TabPane tab="Expired Update" key="expiredUpdate" />
        <TabPane tab="Expired" key="expired" />
        <TabPane tab="Uninsured" key="uninsured" />
        <TabPane tab="Soft Delete" key="softDelete" />
      </Tabs>

      {/* Toolbar */}
      <ToolbarCard
        leftContent={
          <>
            {/* Search Input */}
            <Input
              placeholder="Search..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={() => handleSearch(searchText)}
              prefix={<SearchOutlined />}
              style={{ width: 250 }}
            />

            {/* Owner Select - only for table views */}
            {["verification", "updateRequest"].indexOf(activeTab) === -1 && (
              <Select
                showSearch
                placeholder="Select Owner"
                value={selectedOwner || undefined}
                onChange={handleOwnerChange}
                style={{ width: "220px" }}
                allowClear
              />
            )}

            {/* Reset Button */}
            <Button icon={<FilterOutlined />} onClick={handleResetFilters}>
              Reset
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
                    ...Object.entries(getActiveColumnVisibility()).map(([key, value]) => ({
                      key,
                      label: (
                        <div onClick={handleMenuClick}>
                          <Checkbox
                            checked={!!value}
                            onChange={() => handleColumnVisibilityChange(key)}
                          >
                            {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                          </Checkbox>
                        </div>
                      ),
                    })),
                  ]
                }}
                trigger={["click"]}
                open={dropdownOpen}
                onOpenChange={handleDropdownVisibleChange}
              >
                <Button icon={<SettingOutlined />}>
                  Columns
                </Button>
              </Dropdown>
            )}

            {/* Config Button */}
            <Button 
              icon={<SettingOutlined />} 
              onClick={showConfigModal}
            >
              Config
            </Button>

            {/* Create Button with Dropdown */}
            <Dropdown menu={{
              items: [
                {
                  key: 'manual',
                  label: 'Create Manual',
                  onClick: () => showCreateModal(true),
                },
                {
                  key: 'initial',
                  label: 'Create Initial',
                  onClick: handleCreateInitial,
                }
              ]
            }} placement="bottomLeft">
              <Button type="primary" icon={<PlusOutlined />}>
                Create
              </Button>
            </Dropdown>

            {/* Tab-specific actions */}
            {activeTab === "initial" && (
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSendUpdateRequest}
              >
                Send Update Request
              </Button>
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
        bulkActions={[]}
      />

      {/* Tab Content */}
      {activeTab === "verified" && (
        <VerifiedTable
          loading={loading}
          insurances={verifiedInsurances}
          selectedRowKeys={selectedRowKeys}
          setSelectedRowKeys={setSelectedRowKeys}
          columnVisibility={verifiedColumnVisibility}
          refreshData={fetchData}
        />
      )}
      
      {activeTab === "initial" && (
        <InitialTable
          loading={loading}
          insurances={initialInsurances}
          selectedRowKeys={selectedRowKeys}
          setSelectedRowKeys={setSelectedRowKeys}
          columnVisibility={initialColumnVisibility}
          refreshData={fetchData}
        />
      )}
      
      {activeTab === "verification" && (
        <VerificationList
          loading={loading}
          updateRequests={updateRequests}
          refreshData={fetchData}
        />
      )}
      
      {activeTab === "updateRequest" && (
        <InsuranceUpdateRequestList
          loading={loading}
          updateRequests={updateRequests}
          refreshData={fetchData}
        />
      )}
      
      {activeTab === "expiredUpdate" && (
        <ExpiredUpdateTable
          loading={loading}
          insurances={expiredUpdates}
          selectedRowKeys={selectedRowKeys}
          setSelectedRowKeys={setSelectedRowKeys}
          columnVisibility={expiredUpdateColumnVisibility}
          refreshData={fetchData}
        />
      )}
      
      {activeTab === "expired" && (
        <ExpiredTable
          loading={loading}
          insurances={expiredInsurances}
          selectedRowKeys={selectedRowKeys}
          setSelectedRowKeys={setSelectedRowKeys}
          columnVisibility={expiredColumnVisibility}
          refreshData={fetchData}
        />
      )}
      
      {activeTab === "uninsured" && (
        <NoInsuranceTable
          loading={loading}
          insurances={noInsurances}
          selectedRowKeys={selectedRowKeys}
          setSelectedRowKeys={setSelectedRowKeys}
          columnVisibility={noInsuranceColumnVisibility}
          refreshData={fetchData}
        />
      )}
      
      {activeTab === "softDelete" && (
        <SoftDeleteTable
          loading={loading}
          insurances={softDeletedInsurances}
          selectedRowKeys={selectedRowKeys}
          setSelectedRowKeys={setSelectedRowKeys}
          columnVisibility={softDeleteColumnVisibility}
          refreshData={fetchData}
        />
      )}

      {/* Pagination Footer */}
      <PaginationFooter
        current={currentPage}
        pageSize={pageSize}
        total={total}
        onChange={handlePageChange}
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
    </PageContainer>
  );
};

export default HealthInsuranceManagement; 