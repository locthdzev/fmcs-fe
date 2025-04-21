import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  Select,
  Pagination,
  Space,
  Row,
  Typography,
  Tag,
  Tooltip,
  Timeline,
  Empty,
  Spin,
  Form,
  Collapse,
  Card,
  InputNumber,
  message,
  Col,
  Divider,
  DatePicker,
  Modal,
  Input,
} from "antd";
import dayjs from "dayjs";
import {
  HistoryDTO,
  getGroupedInsuranceHistories,
  GroupedInsuranceHistoriesDTO,
  getAllHealthInsuranceHistories,
} from "@/api/healthinsurance";
import { useRouter } from "next/router";
import {
  SearchOutlined,
  FilterOutlined,
  FileExcelOutlined,
  ArrowLeftOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FormOutlined,
  PlusOutlined,
  CaretRightOutlined,
  LinkOutlined,
  UndoOutlined,
  DeleteOutlined,
  AppstoreOutlined,
  MedicineBoxOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { RangePickerProps } from "antd/es/date-picker";
import InsuranceHistoryFilterModal from "./InsuranceHistoryFilterModal";
import { getStatusTag, getVerificationTag } from "@/utils/statusTagUtils";

const { Option } = Select;
const { Title, Text } = Typography;
const { Panel } = Collapse;
const { RangePicker } = DatePicker;

// Interfaces
interface InsuranceGroup {
  code: string;
  insuranceId: string;
  ownerName: string;
  ownerEmail: string;
  histories: HistoryDTO[];
  loading: boolean;
}

// Utility functions
const formatDateTime = (datetime: string | undefined) => {
  if (!datetime) return "";
  return dayjs(datetime).format("DD/MM/YYYY HH:mm:ss");
};

const getActionColor = (action: string | undefined): string => {
  if (!action) return "";

  if (action.toLowerCase().includes("verified")) return "green";
  if (action.toLowerCase().includes("rejected")) return "red";
  if (action.toLowerCase().includes("status")) {
    if (action.toLowerCase().includes("expired")) return "orange";
    if (action.toLowerCase().includes("active")) return "green";
    if (action.toLowerCase().includes("abouttoexpire")) return "orange";
    if (action.toLowerCase().includes("softdeleted")) return "gray";
    return "blue";
  }
    
  return "blue";
};

const getActionIcon = () => {
  return <HistoryOutlined />;
};

const parseChangesFromJSON = (changeDetails: string | undefined): React.ReactNode => {
  if (!changeDetails) return null;
  
  try {
    // Try to parse as JSON
    if (changeDetails.startsWith('{') && changeDetails.endsWith('}')) {
      const changes = JSON.parse(changeDetails);
      
      // Filter real changes (when oldValue is different from newValue)
      const changesArray = Object.entries(changes)
        .filter(([field, value]: [string, any]) => {
          let oldValue = value.Item1 !== undefined ? value.Item1 : 'N/A';
          let newValue = value.Item2 !== undefined ? value.Item2 : 'N/A';
          return oldValue !== newValue;
        });
      
      if (changesArray.length === 0) {
        return <Text>No changes detected</Text>;
      }
      
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
          {changesArray.map(([field, value]: [string, any]) => {
            // Handle different types of value formats
            let oldValue = 'N/A';
            let newValue = 'N/A';
            
            if (value.Item1 !== undefined && value.Item2 !== undefined) {
              oldValue = value.Item1;
              newValue = value.Item2;
            } else if (typeof value === 'string') {
              newValue = value;
            }
            
            // Format the field name for better display
            const formattedField = field.replace(/([A-Z])/g, ' $1').trim();
            
            return (
              <div key={field} style={{ display: 'flex' }}>
                <div style={{ width: '180px', color: '#8c8c8c' }}>
                  {formattedField}:
                </div>
                <div style={{ flex: 1 }}>
                  {field === 'ImageUrl' ? (
                    <Tag color="default">Changed</Tag>
                  ) : (
                    <>
                      <Text delete type="secondary">
                        {oldValue}
                      </Text>
                      <Text type="secondary"> → </Text>
                      <Text>{newValue}</Text>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
    }
  } catch (error) {
    // If not valid JSON, return as plain text
    console.error("Error parsing change details:", error);
  }
  
  // Return as plain text if not JSON or parsing failed
  return <Text>{changeDetails}</Text>;
};

// Helper function to properly format status for display
const formatStatusForDisplay = (status: string | undefined): string => {
  if (!status) return "";
  
  // Convert to title case (first letter uppercase, rest lowercase)
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};

// Helper function to determine timeline dot color based on status
const getTimelineColor = (): string => {
  return "blue"; // Luôn sử dụng màu xanh dương cho icon timeline
};

export function InsuranceHistory() {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();

  // Data states
  const [resultGroups, setResultGroups] = useState<InsuranceGroup[]>([]);
  const [total, setTotal] = useState(0);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter states
  const [performedBySearch, setPerformedBySearch] = useState<string>("");
  const [healthInsuranceNumber, setHealthInsuranceNumber] = useState<string>("");
  const [ownerSearch, setOwnerSearch] = useState<string>("");
  const [updateDateRange, setUpdateDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null]
  >([null, null]);
  const [ascending, setAscending] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState("UpdatedAt");
  const [searchText, setSearchText] = useState("");

  // UI states
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Dropdown options
  const [uniqueInsuranceNumbers, setUniqueInsuranceNumbers] = useState<
    string[]
  >([]);
  const [uniquePerformers, setUniquePerformers] = useState<
    { id: string; fullName: string; email: string }[]
  >([]);
  const [uniqueOwners, setUniqueOwners] = useState<
    { id: string; fullName: string; email: string }[]
  >([]);

  // Filter state for the modal
  const [filterState, setFilterState] = useState({
    healthInsuranceNumber: "",
    ownerSearch: "",
    performedBySearch: "",
    updateDateRange: [null, null] as [dayjs.Dayjs | null, dayjs.Dayjs | null],
    ascending: false,
    sortBy: "UpdatedAt",
    searchText: "",
  });

  // API calls
  const fetchGroupedInsuranceHistories = useCallback(async () => {
    // Ghi lại currentPage để đảm bảo sử dụng giá trị mới nhất
    const currentPageSnapshot = currentPage;
    const pageSizeSnapshot = pageSize;
    
    console.log("Fetching grouped insurance histories with params:", {
      page: currentPageSnapshot,
      pageSize: pageSizeSnapshot,
      healthInsuranceNumber,
      ownerSearch,
      updateDateRange,
      performedBySearch,
      ascending,
      sortBy,
      searchText,
    });

    setLoading(true);
    try {
      const updateStartDate =
        updateDateRange && updateDateRange[0]
          ? updateDateRange[0].format("YYYY-MM-DD")
          : undefined;

      const updateEndDate =
        updateDateRange && updateDateRange[1]
          ? updateDateRange[1].format("YYYY-MM-DD")
          : undefined;

      // Get grouped data in one API call - dùng snapshot value
      const response = await getGroupedInsuranceHistories(
        currentPageSnapshot,
        pageSizeSnapshot,
        updateStartDate,
        updateEndDate,
        performedBySearch,
        undefined, // previousStatus
        undefined, // newStatus
        sortBy,
        ascending,
        healthInsuranceNumber,
        searchText // Add search text parameter
      );

      console.log("API response:", {
        success: response.success,
        totalInsurances: response.data?.totalInsurances,
        itemsCount: response.data?.items?.length,
        currentPage: currentPageSnapshot
      });

      if (response.success) {
        const groupedData = response.data as GroupedInsuranceHistoriesDTO;

        // Transform data to match component structure and group by owner
        let groups: InsuranceGroup[] = groupedData.items.map((group) => ({
          code: group.insurance.healthInsuranceNumber || "No Number",
          insuranceId: group.insurance.id,
          ownerName: group.insurance.user?.fullName || group.insurance.fullName || "No Owner Name",
          ownerEmail: group.insurance.user?.email || "",
          histories: group.histories,
          loading: false,
        }));

        // Filter by owner if specified
        if (ownerSearch) {
          groups = groups.filter(group => 
            (group.ownerEmail && group.ownerEmail.toLowerCase().includes(ownerSearch.toLowerCase())) || 
            (group.ownerName && group.ownerName.toLowerCase().includes(ownerSearch.toLowerCase()))
          );
        }

        // Additional sort to ensure groups with most recent action are at top
        groups = groups.sort((a, b) => {
          // Find the most recent action date in each group
          const aLatestDate =
            a.histories.length > 0
              ? Math.max(
                  ...a.histories.map((h) => new Date(h.updatedAt).getTime())
                )
              : 0;
          const bLatestDate =
            b.histories.length > 0
              ? Math.max(
                  ...b.histories.map((h) => new Date(h.updatedAt).getTime())
                )
              : 0;

          // Sort by the ascending parameter
          return ascending
            ? aLatestDate - bLatestDate
            : bLatestDate - aLatestDate;
        });

        setResultGroups(groups);
        setTotal(groupedData.totalInsurances);
      } else {
        messageApi.error({
          content:
            response.message || "Could not load insurance histories",
          duration: 5,
        });
      }
    } catch (error) {
      console.error("Error fetching grouped histories:", error);
      messageApi.error({
        content: "Failed to load insurance histories",
        duration: 5,
      });
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    pageSize,
    ascending,
    healthInsuranceNumber,
    ownerSearch,
    performedBySearch,
    updateDateRange,
    sortBy,
    searchText,
    messageApi,
  ]);

  // Fetch dropdown values for filters
  const fetchUniqueValues = useCallback(async () => {
    try {
      const response = await getAllHealthInsuranceHistories(
        1, // page
        1000, // pageSize - get a large batch to find unique values
        undefined, // search
        "UpdatedAt", // sortBy
        false // ascending
      );

      if (response.success) {
        const histories = response.data?.items || [];

        // Extract unique values for filters
        const insuranceNumbersSet = new Set<string>();
        const performersMap = new Map<
          string,
          { id: string; fullName: string; email: string }
        >();
        const ownersMap = new Map<
          string,
          { id: string; fullName: string; email: string }
        >();

        histories.forEach((history: HistoryDTO) => {
          if (history.healthInsuranceNumber) {
            insuranceNumbersSet.add(history.healthInsuranceNumber);
          }

          if (history.updatedBy) {
            performersMap.set(history.updatedBy.id, {
              id: history.updatedBy.id,
              fullName: history.updatedBy.userName,
              email: history.updatedBy.email,
            });
          }
        });

        // For owners, we need to extract from grouped data
        const groupedResponse = await getGroupedInsuranceHistories(
          1,
          1000,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          "UpdatedAt",
          false,
          undefined
        );

        if (groupedResponse.success) {
          const groupedData = groupedResponse.data as GroupedInsuranceHistoriesDTO;
          groupedData.items.forEach(group => {
            if (group.insurance.user) {
              ownersMap.set(group.insurance.user.id, {
                id: group.insurance.user.id,
                fullName: group.insurance.user.fullName || "",
                email: group.insurance.user.email || "",
              });
            }
          });
        }

        // Update state with unique values
        setUniqueInsuranceNumbers(Array.from(insuranceNumbersSet));
        setUniquePerformers(Array.from(performersMap.values()));
        setUniqueOwners(Array.from(ownersMap.values()));
      }
    } catch (error) {
      console.error("Error fetching unique values:", error);
      messageApi.error({
        content: "Failed to load filter options",
        duration: 5,
      });
    }
  }, [messageApi]);

  // Event handlers
  const handleBack = () => {
    router.back();
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchGroupedInsuranceHistories();
  };

  const handleReset = () => {
    setPerformedBySearch("");
    setHealthInsuranceNumber("");
    setOwnerSearch("");
    setUpdateDateRange([null, null]);
    setCurrentPage(1);
    setAscending(false);

    setFilterState({
      healthInsuranceNumber: "",
      ownerSearch: "",
      performedBySearch: "",
      updateDateRange: [null, null],
      ascending: false,
      sortBy: "UpdatedAt",
      searchText: "",
    });

    setLoading(true);
    fetchGroupedInsuranceHistories();
  };

  const handlePageChange = (page: number, newPageSize?: number) => {
    console.log("handlePageChange called with:", { page, newPageSize });
    // Chỉ cần cập nhật state, useEffect sẽ tự động gọi API
    setCurrentPage(page);
    if (newPageSize) setPageSize(newPageSize);
  };

  const toggleExpandGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      if (prev.includes(groupId)) {
        return prev.filter((id) => id !== groupId);
      } else {
        return [...prev, groupId];
      }
    });
  };

  // Filter modal handlers
  const openFilterModal = () => {
    setFilterState({
      healthInsuranceNumber: healthInsuranceNumber || "",
      ownerSearch: ownerSearch || "",
      performedBySearch: performedBySearch || "",
      updateDateRange: updateDateRange || [null, null],
      ascending: ascending,
      sortBy: sortBy,
      searchText: searchText,
    });
    setShowFilterModal(true);
  };

  const closeFilterModal = () => {
    setShowFilterModal(false);
  };

  const applyFilters = () => {
    setHealthInsuranceNumber(filterState.healthInsuranceNumber);
    setOwnerSearch(filterState.ownerSearch);
    setPerformedBySearch(filterState.performedBySearch);
    setUpdateDateRange(filterState.updateDateRange);
    setAscending(filterState.ascending);
    setSortBy(filterState.sortBy);
    setSearchText(filterState.searchText);
    setCurrentPage(1);

    closeFilterModal();
    fetchGroupedInsuranceHistories();
  };

  const resetFilters = () => {
    setFilterState({
      healthInsuranceNumber: "",
      ownerSearch: "",
      performedBySearch: "",
      updateDateRange: [null, null],
      ascending: false,
      sortBy: "UpdatedAt",
      searchText: "",
    });

    setHealthInsuranceNumber("");
    setOwnerSearch("");
    setPerformedBySearch("");
    setUpdateDateRange([null, null]);
    setAscending(false);
    setSortBy("UpdatedAt");
    setSearchText("");
    setCurrentPage(1);

    closeFilterModal();
    fetchGroupedInsuranceHistories();
  };

  const disabledDate: RangePickerProps['disabledDate'] = (current) => {
    // Can't select days after today
    return current && current > dayjs().endOf('day');
  };

  useEffect(() => {
    fetchUniqueValues();
  }, [fetchUniqueValues]);

  // Theo dõi sự thay đổi của currentPage và pageSize
  useEffect(() => {
    console.log("Page or size changed, fetching new data:", { currentPage, pageSize });
    // Luôn hiển thị loading và thực hiện fetch với delay nhỏ để đảm bảo UI có thời gian cập nhật
    setLoading(true);
    const timer = setTimeout(() => {
      fetchGroupedInsuranceHistories();
    }, 50);
    
    return () => clearTimeout(timer);
  }, [currentPage, pageSize]);

  // Ban đầu load data một lần
  useEffect(() => {
    fetchGroupedInsuranceHistories();
  }, []);

  useEffect(() => {
    // When data loads, expand all groups by default
    if (resultGroups.length > 0 && !loading) {
      setExpandedGroups(resultGroups.map(group => group.insuranceId));
    }
  }, [resultGroups, loading]);

  return (
    <div className="history-container" style={{ padding: "20px" }}>
      {contextHolder}
      
      {/* Filter Modal Component */}
      <InsuranceHistoryFilterModal
        visible={showFilterModal}
        filterState={filterState}
        setFilterState={setFilterState}
        uniqueInsuranceNumbers={uniqueInsuranceNumbers}
        uniqueOwners={uniqueOwners}
        uniquePerformers={uniquePerformers}
        onClose={closeFilterModal}
        onApply={applyFilters}
        onReset={resetFilters}
      />

      {/* Header with Back Button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={handleBack}
            style={{ marginRight: "8px" }}
          >
            Back
          </Button>
          <HistoryOutlined style={{ fontSize: "24px" }} />
          <h3 className="text-xl font-bold">Insurance History</h3>
        </div>
      </div>

      {/* Toolbar Card */}
      <Card
        className="shadow mb-4"
        bodyStyle={{ padding: "16px" }}
        style={{ borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
      >
        <Row align="middle" gutter={[16, 16]}>
          <Col span={24}>
            <Title level={4} style={{ margin: 0 }}>
              <AppstoreOutlined
                style={{ marginRight: "8px", fontSize: "20px" }}
              />
              Toolbar
            </Title>
          </Col>
        </Row>

        <Divider style={{ margin: "16px 0" }} />

        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Input.Search
              placeholder="Search by owner, insurance number..."
              onSearch={(value) => {
                setSearchText(value);
                setCurrentPage(1);
                fetchGroupedInsuranceHistories();
              }}
              style={{ width: "320px" }}
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />

            <Tooltip title="Advanced Filters">
              <Button
                icon={
                  <FilterOutlined
                    style={{
                      color:
                        healthInsuranceNumber ||
                        performedBySearch ||
                        ownerSearch ||
                        (updateDateRange &&
                          (updateDateRange[0] || updateDateRange[1]))
                          ? "#1890ff"
                          : undefined,
                    }}
                  />
                }
                onClick={openFilterModal}
              >
                Filters
              </Button>
            </Tooltip>

            <Tooltip title="Reset All Filters">
              <Button
                icon={<UndoOutlined />}
                onClick={handleReset}
                disabled={
                  !(
                    healthInsuranceNumber ||
                    performedBySearch ||
                    ownerSearch ||
                    searchText ||
                    updateDateRange[0] ||
                    updateDateRange[1]
                  )
                }
              />
            </Tooltip>
          </div>
        </div>
        
        {/* Search Criteria Tags */}
        {(performedBySearch || healthInsuranceNumber || ownerSearch || updateDateRange[0] || searchText) && (
          <div className="mt-3">
            <Text type="secondary" className="mr-2">Search criteria:</Text>
            <Space wrap>
              {searchText && (
                <Tag closable onClose={() => {
                  setSearchText("");
                  fetchGroupedInsuranceHistories();
                }}>
                  Text: {searchText}
                </Tag>
              )}
              {ownerSearch && (
                <Tag closable onClose={() => {
                  setOwnerSearch("");
                  fetchGroupedInsuranceHistories();
                }}>
                  Owner: {ownerSearch}
                </Tag>
              )}
              {healthInsuranceNumber && (
                <Tag closable onClose={() => {
                  setHealthInsuranceNumber("");
                  fetchGroupedInsuranceHistories();
                }}>
                  Insurance #: {healthInsuranceNumber}
                </Tag>
              )}
              {performedBySearch && (
                <Tag closable onClose={() => {
                  setPerformedBySearch("");
                  fetchGroupedInsuranceHistories();
                }}>
                  Performed by: {performedBySearch}
                </Tag>
              )}
              {updateDateRange[0] && updateDateRange[1] && (
                <Tag closable onClose={() => {
                  setUpdateDateRange([null, null]);
                  fetchGroupedInsuranceHistories();
                }}>
                  Date: {updateDateRange[0].format('DD/MM/YYYY')} - {updateDateRange[1].format('DD/MM/YYYY')}
                </Tag>
              )}
              {(searchText || ownerSearch || healthInsuranceNumber || performedBySearch || (updateDateRange[0] && updateDateRange[1])) && (
                <Button type="link" onClick={handleReset} size="small">
                  Clear All
                </Button>
              )}
            </Space>
          </div>
        )}
      </Card>

      {/* Groups per page selector */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "16px",
          gap: "8px",
          alignItems: "center",
        }}
      >
        <Text type="secondary">Groups per page:</Text>
        <Select
          value={pageSize}
          onChange={(value) => {
            console.log("Changing pageSize to:", value);
            // Chỉ cần cập nhật state, useEffect sẽ tự động gọi API
            setPageSize(value);
            setCurrentPage(1);
          }}
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

      {/* Results Section */}
      {loading ? (
        <Card className="shadow mb-4">
          <Spin tip="Loading..." />
        </Card>
      ) : resultGroups.length === 0 ? (
        <Card className="shadow mb-4">
          <Empty description="No insurance history records found" />
        </Card>
      ) : (
        <div key={`page-${currentPage}-size-${pageSize}`}>
          {resultGroups.map((group) => (
            <Card key={group.insuranceId} className="shadow mb-4">
              <div className="border-b pb-3 mb-4">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Space size="large">
                    <span>
                      <Text type="secondary">Owner:</Text>{" "}
                      <Text strong>
                        {group.ownerName}
                        {group.ownerEmail && ` (${group.ownerEmail})`}
                      </Text>
                    </span>

                    {group.code !== "No Number" && (
                      <>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            color: "#8c8c8c",
                          }}
                        >
                          <LinkOutlined style={{ fontSize: "14px" }} />
                        </div>
                        <span>
                          <Text type="secondary">Insurance Number:</Text>{" "}
                          <Text strong>{group.code}</Text>
                        </span>
                      </>
                    )}
                  </Space>
                </div>
              </div>

              {group.loading ? (
                <Spin />
              ) : (
                <Collapse
                  defaultActiveKey={["1"]}
                  expandIcon={({ isActive }) => (
                    <CaretRightOutlined rotate={isActive ? 90 : 0} />
                  )}
                >
                  <Panel header="Action History" key="1">
                    <Timeline
                      mode="left"
                      items={group.histories
                        .sort((a, b) => {
                          const comparison =
                            dayjs(a.updatedAt).unix() -
                            dayjs(b.updatedAt).unix();
                          return ascending ? comparison : -comparison;
                        })
                        .map((history) => ({
                          color: getTimelineColor(),
                          dot: getActionIcon(),
                          children: (
                            <Card
                              size="small"
                              className="mb-2 hover:shadow-md transition-shadow"
                            >
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "8px",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                  }}
                                >
                                  <div style={{ fontWeight: 500 }}>
                                    History Update
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "14px",
                                      color: "#8c8c8c",
                                    }}
                                  >
                                    {formatDateTime(history.updatedAt)}
                                  </div>
                                </div>

                                <div
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr",
                                    gap: "4px",
                                  }}
                                >
                                  <div style={{ display: "flex" }}>
                                    <div
                                      style={{
                                        width: "180px",
                                        color: "#8c8c8c",
                                      }}
                                    >
                                      Performed by:
                                    </div>
                                    <div>
                                      {history.updatedBy 
                                        ? `${history.updatedBy.userName} (${history.updatedBy.email})`
                                        : "System"}
                                    </div>
                                  </div>

                                  {history.previousStatus !== history.newStatus && (
                                    <div style={{ display: "flex" }}>
                                      <div
                                        style={{
                                          width: "180px",
                                          color: "#8c8c8c",
                                        }}
                                      >
                                        Status:
                                      </div>
                                      <div style={{ flex: 1 }}>
                                        {history.previousStatus ? getStatusTag(formatStatusForDisplay(history.previousStatus)) : <Tag>None</Tag>}
                                        <Text type="secondary"> → </Text>
                                        {history.newStatus ? getStatusTag(formatStatusForDisplay(history.newStatus)) : <Tag>None</Tag>}
                                      </div>
                                    </div>
                                  )}

                                  {history.previousVerificationStatus !== history.newVerificationStatus && (
                                    <div style={{ display: "flex" }}>
                                      <div
                                        style={{
                                          width: "180px",
                                          color: "#8c8c8c",
                                        }}
                                      >
                                        Verification:
                                      </div>
                                      <div style={{ flex: 1 }}>
                                        {history.previousVerificationStatus ? 
                                          getVerificationTag(formatStatusForDisplay(history.previousVerificationStatus)) : 
                                          <Tag>None</Tag>}
                                        <Text type="secondary"> → </Text>
                                        {history.newVerificationStatus ? 
                                          getVerificationTag(formatStatusForDisplay(history.newVerificationStatus)) : 
                                          <Tag>None</Tag>}
                                      </div>
                                    </div>
                                  )}

                                  {history.changeDetails && (
                                    <div style={{ display: "flex" }}>
                                      <div
                                        style={{
                                          width: "180px",
                                          color: "#8c8c8c",
                                        }}
                                      >
                                        Details:
                                      </div>
                                      <div
                                        style={{
                                          flex: 1,
                                          whiteSpace: "pre-wrap",
                                        }}
                                      >
                                        {parseChangesFromJSON(history.changeDetails)}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </Card>
                          ),
                        }))}
                    />
                  </Panel>
                </Collapse>
              )}
            </Card>
          ))}

          {/* Pagination Card */}
          <Card className="mt-4 shadow-sm">
            <Row justify="center" align="middle">
              <Space size="large" align="center">
                <Text type="secondary">Total {total} items</Text>
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={total}
                  onChange={handlePageChange}
                  showSizeChanger={false}
                  showTotal={() => ""}
                />
                <Space align="center">
                  <Text type="secondary">Go to page:</Text>
                  <InputNumber
                    min={1}
                    max={Math.ceil(total / pageSize)}
                    value={currentPage}
                    onChange={(value) => {
                      if (
                        value &&
                        Number(value) > 0 &&
                        Number(value) <= Math.ceil(total / pageSize)
                      ) {
                        console.log("Changing page via InputNumber to:", value);
                        // Chỉ cần cập nhật state, useEffect sẽ tự động gọi API
                        setCurrentPage(Number(value));
                      }
                    }}
                    style={{ width: "60px" }}
                  />
                </Space>
              </Space>
            </Row>
          </Card>
        </div>
      )}
    </div>
  );
}

export default InsuranceHistory;
