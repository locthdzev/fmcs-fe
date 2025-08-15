import React, { useState, useEffect, useCallback, useRef } from "react";
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
  Input,
} from "antd";
import dayjs from "dayjs";
import {
  GroupedInventoryHistoriesDTO,
  InventoryHistoryResponseDTO,
  getGroupedInventoryHistories,
} from "@/api/inventoryhistory";
import { exportToExcel } from "@/api/export";
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
  UndoOutlined,
  DatabaseOutlined,
  ReloadOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import InventoryHistoryFilterModal from "../inventory-history/InventoryHistoryFilterModal";
import ToolbarCard from "../shared/ToolbarCard";
import PageContainer from "../shared/PageContainer";
import PaginationFooter from "../shared/PaginationFooter";

const { Option } = Select;
const { Title, Text } = Typography;
const { Panel } = Collapse;
const { RangePicker } = DatePicker;

// Interfaces
interface InventoryRecordGroup {
  batchCode: string;
  inventoryRecordId: string;
  histories: InventoryHistoryResponseDTO[];
  loading: boolean;
  drug: {
    id: string;
    name: string;
    drugCode: string;
  };
  quantityInStock: number;
  reorderLevel: number;
  status?: string;
}

export function InventoryHistoryList() {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();

  // Data states
  const [resultGroups, setResultGroups] = useState<InventoryRecordGroup[]>([]);
  const [total, setTotal] = useState(0);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter states
  const [userSearch, setUserSearch] = useState<string>("");
  const [batchCodeSearch, setBatchCodeSearch] = useState<string>("");
  const [drugNameSearch, setDrugNameSearch] = useState<string>("");
  const [changeDateRange, setChangeDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null]
  >([null, null]);
  const [ascending, setAscending] = useState<boolean>(false);
  const [sortBy] = useState("ChangeDate");

  // UI states
  const [loading, setLoading] = useState(true);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Dropdown options
  const [uniqueBatchCodes, setUniqueBatchCodes] = useState<string[]>([]);
  const [uniqueDrugNames, setUniqueDrugNames] = useState<string[]>([]);
  const [uniqueUsers, setUniqueUsers] = useState<
    { id: string; name: string; email: string }[]
  >([]);

  // Filter state for the modal
  const [filterState, setFilterState] = useState({
    userSearch: "",
    batchCodeSearch: "",
    drugNameSearch: "",
    changeDateRange: [null, null] as [dayjs.Dayjs | null, dayjs.Dayjs | null],
    ascending: false,
  });

  // API calls
  const fetchGroupedInventoryHistories = useCallback(async () => {
    console.log("Fetching grouped inventory histories with params:", {
      batchCodeSearch,
      drugNameSearch,
      changeDateRange,
      userSearch,
      ascending,
    });

    setLoading(true);
    try {
      const changeStartDate =
        changeDateRange && changeDateRange[0]
          ? changeDateRange[0].format("YYYY-MM-DD")
          : undefined;

      const changeEndDate =
        changeDateRange && changeDateRange[1]
          ? changeDateRange[1].format("YYYY-MM-DD")
          : undefined;

      // Get grouped data in one API call
      const response = await getGroupedInventoryHistories(
        currentPage,
        pageSize,
        undefined, // changeType
        changeStartDate,
        changeEndDate,
        userSearch,
        sortBy,
        false, // Always set ascending to false to get newest first
        batchCodeSearch,
        drugNameSearch
      );

      if (response.success) {
        const groupedData = response.data as GroupedInventoryHistoriesDTO;

        // Transform data to match component structure
        let groups: InventoryRecordGroup[] = groupedData.items.map((group) => ({
          batchCode: group.inventoryRecord.batchCode,
          inventoryRecordId: group.inventoryRecord.id,
          histories: group.histories,
          loading: false,
          drug: group.inventoryRecord.drug,
          quantityInStock: group.inventoryRecord.quantityInStock,
          reorderLevel: group.inventoryRecord.reorderLevel,
          status: group.inventoryRecord.status,
        }));

        // Always sort to ensure groups with most recent action are at top
        groups = groups.sort((a, b) => {
          // Find the most recent action date in each group
          const aLatestDate =
            a.histories.length > 0
              ? new Date(Math.max(
                  ...a.histories.map((h) => new Date(h.changeDate).getTime())
                )).getTime()
              : 0;
          const bLatestDate =
            b.histories.length > 0
              ? new Date(Math.max(
                  ...b.histories.map((h) => new Date(h.changeDate).getTime())
                )).getTime()
              : 0;

          // Sort by most recent date (newest first)
          return bLatestDate - aLatestDate;
        });

        setResultGroups(groups);
        setTotal(groupedData.totalInventoryRecords);
      } else {
        messageApi.error({
          content: response.message || "Could not load inventory histories",
          duration: 5,
        });
      }
    } catch (error) {
      console.error("Error fetching grouped histories:", error);
      messageApi.error({
        content: "Failed to load inventory histories",
        duration: 5,
      });
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    pageSize,
    ascending,
    batchCodeSearch,
    drugNameSearch,
    userSearch,
    changeDateRange,
    sortBy,
    messageApi,
  ]);

  const handlePageChange = (page: number, newPageSize?: number) => {
    setCurrentPage(page);
    if (newPageSize && newPageSize !== pageSize) {
      setPageSize(newPageSize);
    }
  };

  const handleSortOrderChange = (newOrder: boolean) => {
    setAscending(newOrder);
  };

  const handleFilterModalOpen = () => {
    setFilterState({
      userSearch,
      batchCodeSearch,
      drugNameSearch,
      changeDateRange,
      ascending,
    });
    setShowFilterModal(true);
  };

  const handleFilterModalCancel = () => {
    setShowFilterModal(false);
  };

  const handleFilterModalApply = (values: any) => {
    if (values.userSearch !== undefined) {
      setUserSearch(values.userSearch);
    }
    if (values.batchCodeSearch !== undefined) {
      setBatchCodeSearch(values.batchCodeSearch);
    }
    if (values.drugNameSearch !== undefined) {
      setDrugNameSearch(values.drugNameSearch);
    }
    if (values.changeDateRange !== undefined) {
      setChangeDateRange(values.changeDateRange);
    }
    if (values.ascending !== undefined) {
      setAscending(values.ascending);
    }
    setShowFilterModal(false);
  };

  const handleSearch = (value: string) => {
    setDrugNameSearch(value);
  };

  const handleBatchCodeSearch = (value: string) => {
    setBatchCodeSearch(value);
  };

  const handleUserSearch = (value: string) => {
    setUserSearch(value);
  };

  const handleClearFilters = () => {
    setUserSearch("");
    setBatchCodeSearch("");
    setDrugNameSearch("");
    setChangeDateRange([null, null]);
    setAscending(false);

    // Reset state filter modal nếu modal đang mở
    setFilterState({
      userSearch: "",
      batchCodeSearch: "",
      drugNameSearch: "",
      changeDateRange: [null, null],
      ascending: false,
    });
  };

  const handleExportExcel = () => {
    exportToExcel(
      "/inventoryhistory-management/inventoryhistories/export",
      "inventory_history.xlsx"
    );
    messageApi.success("Downloading Excel file...");
  };

  const formatDateTime = (dateTime: string) => {
    return dayjs(dateTime).format("DD/MM/YYYY HH:mm:ss");
  };

  // Get color for timeline based on change type
  const getChangeTypeColor = (changeType: string) => {
    const colors: Record<string, string> = {
      Received: "green",
      Added: "blue",
      Adjusted: "orange",
      Returned: "cyan",
      Removed: "red",
    };
    return colors[changeType] || "gray";
  };

  // Get icon for timeline based on change type
  const getChangeTypeIcon = (changeType: string) => {
    const icons: Record<string, React.ReactNode> = {
      Received: <PlusOutlined />,
      Added: <PlusOutlined />,
      Adjusted: <FormOutlined />,
      Returned: <CheckCircleOutlined />,
      Removed: <CloseCircleOutlined />,
    };
    return icons[changeType] || <HistoryOutlined />;
  };

  // Fetch unique values for filter dropdowns
  const fetchUniqueValues = useCallback(async () => {
    try {
      // Get all inventory histories to extract unique values
      const response = await getGroupedInventoryHistories(
        1, // page
        1000, // pageSize - get a large batch to extract unique values
        undefined, // changeType
        undefined, // startChangeDate
        undefined, // endChangeDate
        undefined, // userSearch
        "ChangeDate", // sortBy
        false, // always use false for ascending to get newest first
        undefined, // batchCodeSearch
        undefined // drugNameSearch
      );

      if (response.success) {
        const groupedData = response.data as GroupedInventoryHistoriesDTO;

        // Extract unique batch codes
        const batchCodesSet = new Set<string>();
        // Extract unique drug names
        const drugNamesSet = new Set<string>();
        // Extract unique users with Map to avoid duplicates
        const usersMap = new Map<
          string,
          { id: string; name: string; email: string }
        >();

        groupedData.items.forEach((group) => {
          // Add batch code
          batchCodesSet.add(group.inventoryRecord.batchCode);

          // Add drug name
          if (group.inventoryRecord.drug) {
            drugNamesSet.add(group.inventoryRecord.drug.name);
          }

          // Process all histories to extract users
          group.histories.forEach((history) => {
            // Check if history has user information
            if (history.user) {
              // Use user.id as the key to avoid duplicates
              usersMap.set(history.user.id, {
                id: history.user.id,
                name: history.user.fullName || history.userName,
                email: history.user.email || "",
              });
            } else if (history.userId && history.userName) {
              // Fallback to using basic user info if full user object isn't available
              usersMap.set(history.userId, {
                id: history.userId,
                name: history.userName,
                email: "",
              });
            }
          });
        });

        // Update state with extracted unique values
        setUniqueBatchCodes(Array.from(batchCodesSet));
        setUniqueDrugNames(Array.from(drugNamesSet));
        setUniqueUsers(Array.from(usersMap.values()));
      } else {
        console.error("Failed to fetch data for unique values");
        // Fallback to sample data if API fails
        setUniqueBatchCodes(["BATCH001", "BATCH002", "BATCH003"]);
        setUniqueDrugNames(["Paracetamol", "Ibuprofen", "Aspirin"]);
        setUniqueUsers([
          { id: "1", name: "Admin User", email: "admin@example.com" },
          { id: "2", name: "Staff User", email: "staff@example.com" },
        ]);
      }
    } catch (error) {
      console.error("Error fetching unique values:", error);
      // Fallback to sample data if API fails
      setUniqueBatchCodes(["BATCH001", "BATCH002", "BATCH003"]);
      setUniqueDrugNames(["Paracetamol", "Ibuprofen", "Aspirin"]);
      setUniqueUsers([
        { id: "1", name: "Admin User", email: "admin@example.com" },
        { id: "2", name: "Staff User", email: "staff@example.com" },
      ]);
    }
  }, []);

  useEffect(() => {
    if (uniqueBatchCodes.length === 0) {
      fetchUniqueValues();
    }

    const timer = setTimeout(() => {
      fetchGroupedInventoryHistories();
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [
    currentPage,
    pageSize,
    batchCodeSearch,
    drugNameSearch,
    userSearch,
    changeDateRange,
    ascending,
    fetchGroupedInventoryHistories,
    fetchUniqueValues,
    uniqueBatchCodes.length,
  ]);

  return (
    <PageContainer
      title="Inventory History"
      icon={<HistoryOutlined style={{ fontSize: "24px" }} />}
      onBack={() => router.back()}
    >
      {contextHolder}

      {/* Filter Controls */}
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
            <Select
              showSearch
              placeholder="Search Batch Code"
              value={batchCodeSearch || undefined}
              onChange={(value) => {
                setBatchCodeSearch(value || "");
                setCurrentPage(1);
                setLoading(true);
              }}
              style={{ width: "320px" }}
              allowClear
              filterOption={(input, option) =>
                (option?.value?.toString().toLowerCase() || "").includes(
                  input.toLowerCase()
                )
              }
              options={uniqueBatchCodes.map((code) => ({
                value: code,
                label: code,
              }))}
              dropdownStyle={{ minWidth: "320px" }}
            />

            <Tooltip title="Advanced Filters">
              <Button
                icon={
                  <FilterOutlined
                    style={{
                      color:
                        drugNameSearch ||
                        userSearch ||
                        (changeDateRange &&
                          (changeDateRange[0] || changeDateRange[1]))
                          ? "#1890ff"
                          : undefined,
                    }}
                  />
                }
                onClick={handleFilterModalOpen}
              >
                Filters
              </Button>
            </Tooltip>

            <Tooltip title="Reset All Filters">
              <Button
                icon={<UndoOutlined />}
                onClick={handleClearFilters}
                disabled={
                  !(
                    batchCodeSearch ||
                    drugNameSearch ||
                    userSearch ||
                    changeDateRange[0] ||
                    changeDateRange[1]
                  )
                }
              />
            </Tooltip>
          </div>

          <div>
            <Button
              type="primary"
              icon={<FileExcelOutlined />}
              onClick={handleExportExcel}
            >
              Export to Excel
            </Button>
          </div>
        </div>
      </Card>

      {/* Loading State */}
      {loading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "40px",
          }}
        >
          <Spin size="large" tip="Loading history data..." />
        </div>
      ) : resultGroups.length === 0 ? (
        <Card>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No inventory history found"
          />
        </Card>
      ) : (
        // Inventory Record Groups
        <>
          {/* Items per page selector */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: "16px",
              gap: "16px",
              alignItems: "center",
            }}
          >
            <Space>
              <Text type="secondary">Records per page:</Text>
              <Select
                value={pageSize}
                onChange={(value) => {
                  setPageSize(value);
                  setCurrentPage(1);
                  setLoading(true);
                }}
                style={{ width: "80px" }}
              >
                <Option value={5}>5</Option>
                <Option value={10}>10</Option>
                <Option value={15}>15</Option>
                <Option value={20}>20</Option>
              </Select>
            </Space>
          </div>

          {resultGroups.map((group) => (
            <Card key={group.inventoryRecordId} className="shadow mb-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <DatabaseOutlined style={{ fontSize: "20px" }} />
                    <Text
                      strong
                      style={{ fontSize: "16px" }}
                      onClick={() =>
                        router.push(
                          `/inventory-record/${group.inventoryRecordId}`
                        )
                      }
                      className="cursor-pointer hover:text-blue-500"
                    >
                      {group.batchCode}
                    </Text>
                    {group.status && (
                      <Tag
                        color={
                          group.status === "Active"
                            ? "green"
                            : group.status === "NearExpiry"
                            ? "orange"
                            : group.status === "Expired"
                            ? "red"
                            : "default"
                        }
                      >
                        {group.status}
                      </Tag>
                    )}
                  </div>
                  <div className="text-gray-500 text-sm">
                    {group.drug.drugCode} - {group.drug.name}
                  </div>
                </div>
                <div className="flex gap-4 mt-2 md:mt-0">
                  <div>
                    <Text type="secondary">In Stock:</Text>{" "}
                    <Text strong>{group.quantityInStock}</Text>
                  </div>
                  <div>
                    <Text type="secondary">Reorder Level:</Text>{" "}
                    <Text strong>{group.reorderLevel}</Text>
                  </div>
                  <Tooltip title="View Inventory Record">
                    <Button
                      type="primary"
                      size="small"
                      icon={<DatabaseOutlined />}
                      onClick={() =>
                        router.push(
                          `/inventory-record/${group.inventoryRecordId}`
                        )
                      }
                    >
                      View Details
                    </Button>
                  </Tooltip>
                </div>
              </div>

              <Divider style={{ margin: "12px 0" }} />

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
                          // Always sort most recent action at top (descending)
                          return dayjs(b.changeDate).unix() - dayjs(a.changeDate).unix();
                        })
                        .map((history) => ({
                          color: getChangeTypeColor(history.changeType),
                          dot: getChangeTypeIcon(history.changeType),
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
                                    {history.changeType}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "14px",
                                      color: "#8c8c8c",
                                    }}
                                  >
                                    {formatDateTime(history.changeDate)}
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
                                      {history.user ? (
                                        <div>
                                          <span>
                                            {history.user.fullName ||
                                              history.userName}
                                          </span>
                                          {history.user.email && (
                                            <div
                                              style={{
                                                fontSize: "12px",
                                                color: "#888",
                                              }}
                                            >
                                              {history.user.email}
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        history.userName
                                      )}
                                    </div>
                                  </div>

                                  {history.previousQuantity !==
                                    history.newQuantity && (
                                    <div style={{ display: "flex" }}>
                                      <div
                                        style={{
                                          width: "180px",
                                          color: "#8c8c8c",
                                        }}
                                      >
                                        Quantity:
                                      </div>
                                      <div>
                                        <Tag color="default">
                                          {history.previousQuantity}
                                        </Tag>
                                        <Text type="secondary"> → </Text>
                                        <Tag color="blue">
                                          {history.newQuantity}
                                        </Tag>
                                      </div>
                                    </div>
                                  )}

                                  {history.remarks && (
                                    <div style={{ display: "flex" }}>
                                      <div
                                        style={{
                                          width: "180px",
                                          color: "#8c8c8c",
                                        }}
                                      >
                                        Remarks:
                                      </div>
                                      <div>{history.remarks}</div>
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

          {/* Pagination */}
          <PaginationFooter
            current={currentPage}
            pageSize={pageSize}
            total={total}
            onChange={handlePageChange}
            showGoToPage={true}
            showTotal={true}
          />

          {/* Filter Modal */}
          <InventoryHistoryFilterModal
            visible={showFilterModal}
            initialValues={filterState}
            onCancel={handleFilterModalCancel}
            onApply={handleFilterModalApply}
            uniqueBatchCodes={uniqueBatchCodes}
            uniqueDrugNames={uniqueDrugNames}
            uniqueUsers={uniqueUsers}
          />
        </>
      )}
    </PageContainer>
  );
}
