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
} from "antd";
import dayjs from "dayjs";
import {
  TreatmentPlanHistoryResponseDTO,
  exportTreatmentPlanHistoriesToExcelWithConfig,
  TreatmentPlanHistoryExportConfigDTO,
  getGroupedTreatmentPlanHistories,
  GroupedTreatmentPlanHistoriesDTO,
  getAllTreatmentPlanHistories,
} from "@/api/treatment-plan";
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
} from "@ant-design/icons";
import TreatmentPlanHistoryFilterModal from "./TreatmentPlanHistoryFilterModal";
import TreatmentPlanHistoryExportModal from "./TreatmentPlanHistoryExportModal";

const { Option } = Select;
const { Title, Text } = Typography;
const { Panel } = Collapse;

// Interfaces
interface TreatmentPlanGroup {
  code: string;
  treatmentPlanId: string;
  histories: TreatmentPlanHistoryResponseDTO[];
  loading: boolean;
}

// Utility functions
const formatDateTime = (datetime: string | undefined) => {
  if (!datetime) return "";
  return dayjs(datetime).format("DD/MM/YYYY HH:mm:ss");
};

const getStatusColor = (status: string | undefined) => {
  if (!status) return "";

  switch (status.toLowerCase()) {
    case "inprogress":
      return "blue";
    case "completed":
      return "green";
    case "cancelled":
      return "volcano";
    case "softdeleted":
      return "gray";
    default:
      return "default";
  }
};

const getActionColor = (action: string | undefined): string => {
  if (!action) return "";

  switch (action.toLowerCase()) {
    case "created":
      return "green";
    case "updated":
      return "blue";
    case "cancelled":
      return "orange";
    case "softdeleted":
      return "gray";
    case "restored":
      return "lime";
    case "auto-completed":
      return "cyan";
    default:
      return "default";
  }
};

const getActionIcon = (action: string | undefined) => {
  if (!action) return null;

  switch (action.toLowerCase()) {
    case "created":
      return <PlusOutlined />;
    case "updated":
      return <FormOutlined />;
    case "cancelled":
      return <CloseCircleOutlined />;
    case "softdeleted":
      return <DeleteOutlined />;
    case "restored":
      return <UndoOutlined />;
    case "auto-completed":
      return <CheckCircleOutlined />;
    default:
      return <HistoryOutlined />;
  }
};

export function TreatmentPlanHistoryListNew() {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();

  // Data states
  const [resultGroups, setResultGroups] = useState<TreatmentPlanGroup[]>([]);
  const [total, setTotal] = useState(0);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter states
  const [performedBySearch, setPerformedBySearch] = useState<string>("");
  const [treatmentPlanCode, setTreatmentPlanCode] = useState<string>("");
  const [healthCheckResultCode, setHealthCheckResultCode] =
    useState<string>("");
  const [actionDateRange, setActionDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null]
  >([null, null]);
  const [ascending, setAscending] = useState<boolean>(false);
  const [sortBy] = useState("ActionDate");

  // UI states
  const [loading, setLoading] = useState(true);
  const [showExportConfigModal, setShowExportConfigModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // Dropdown options
  const [uniqueTreatmentPlanCodes, setUniqueTreatmentPlanCodes] = useState<
    string[]
  >([]);
  const [uniqueHealthCheckCodes, setUniqueHealthCheckCodes] = useState<
    string[]
  >([]);
  const [uniquePerformers, setUniquePerformers] = useState<
    { id: string; fullName: string; email: string }[]
  >([]);

  // Export config state
  const [exportConfig, setExportConfig] =
    useState<TreatmentPlanHistoryExportConfigDTO>({
      exportAllPages: true,
      includeTreatmentPlanCode: true,
      includeHealthCheckCode: true,
      includePatient: true,
      includeAction: true,
      includeActionDate: true,
      includePerformedBy: true,
      includePreviousStatus: true,
      includeNewStatus: true,
      includeChangeDetails: true,
    });

  // Filter state for the modal
  const [filterState, setFilterState] = useState({
    healthCheckResultCode: "",
    performedBySearch: "",
    actionDateRange: [null, null] as [dayjs.Dayjs | null, dayjs.Dayjs | null],
    ascending: false,
  });

  // API calls
  const fetchGroupedTreatmentPlanHistories = useCallback(async () => {
    console.log("Fetching grouped treatment plan histories with params:", {
      treatmentPlanCode,
      healthCheckResultCode,
      actionDateRange,
      performedBySearch,
      ascending,
    });

    setLoading(true);
    try {
      const actionStartDate =
        actionDateRange && actionDateRange[0]
          ? actionDateRange[0].format("YYYY-MM-DD")
          : undefined;

      const actionEndDate =
        actionDateRange && actionDateRange[1]
          ? actionDateRange[1].format("YYYY-MM-DD")
          : undefined;

      // Get grouped data in one API call
      const response = await getGroupedTreatmentPlanHistories(
        currentPage,
        pageSize,
        undefined, // action
        actionStartDate,
        actionEndDate,
        performedBySearch,
        undefined, // previousStatus
        undefined, // newStatus
        sortBy,
        ascending,
        treatmentPlanCode,
        healthCheckResultCode
      );

      if (response.success) {
        const groupedData = response.data as GroupedTreatmentPlanHistoriesDTO;

        // Transform data to match component structure
        let groups: TreatmentPlanGroup[] = groupedData.items.map((group) => ({
          code: group.treatmentPlan.treatmentPlanCode,
          treatmentPlanId: group.treatmentPlan.id,
          histories: group.histories,
          loading: false,
        }));

        // Additional sort to ensure groups with most recent action are at top
        groups = groups.sort((a, b) => {
          // Find the most recent action date in each group
          const aLatestDate =
            a.histories.length > 0
              ? Math.max(
                  ...a.histories.map((h) => new Date(h.actionDate).getTime())
                )
              : 0;
          const bLatestDate =
            b.histories.length > 0
              ? Math.max(
                  ...b.histories.map((h) => new Date(h.actionDate).getTime())
                )
              : 0;

          // Sort by the ascending parameter
          return ascending
            ? aLatestDate - bLatestDate
            : bLatestDate - aLatestDate;
        });

        setResultGroups(groups);
        setTotal(groupedData.totalTreatmentPlans);
      } else {
        messageApi.error({
          content:
            response.message || "Could not load treatment plan histories",
          duration: 5,
        });
      }
    } catch (error) {
      console.error("Error fetching grouped histories:", error);
      messageApi.error({
        content: "Failed to load treatment plan histories",
        duration: 5,
      });
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    pageSize,
    ascending,
    treatmentPlanCode,
    healthCheckResultCode,
    performedBySearch,
    actionDateRange,
    sortBy,
    messageApi,
  ]);

  // Fetch dropdown values for filters
  const fetchUniqueValues = useCallback(async () => {
    try {
      const response = await getAllTreatmentPlanHistories(
        1, // page
        1000, // pageSize - get a large batch to find unique values
        undefined, // action
        undefined, // startActionDate
        undefined, // endActionDate
        undefined, // performedBySearch
        undefined, // previousStatus
        undefined, // newStatus
        "ActionDate", // sortBy
        false, // ascending
        undefined, // treatmentPlanCode
        undefined // healthCheckResultCode
      );

      if (response.success) {
        const histories = response.data.items || response.data || [];

        // Extract unique values for filters
        const treatmentPlanCodesSet = new Set<string>();
        const healthCheckCodesSet = new Set<string>();
        const performersMap = new Map<
          string,
          { id: string; fullName: string; email: string }
        >();

        histories.forEach((history: TreatmentPlanHistoryResponseDTO) => {
          if (history.treatmentPlan) {
            treatmentPlanCodesSet.add(history.treatmentPlan.treatmentPlanCode);

            if (history.treatmentPlan.healthCheckResult) {
              healthCheckCodesSet.add(
                history.treatmentPlan.healthCheckResult.healthCheckResultCode
              );
            }
          }

          if (history.performedBy) {
            performersMap.set(history.performedBy.id, {
              id: history.performedBy.id,
              fullName: history.performedBy.fullName,
              email: history.performedBy.email,
            });
          }
        });

        // Update state with unique values
        setUniqueTreatmentPlanCodes(Array.from(treatmentPlanCodesSet));
        setUniqueHealthCheckCodes(Array.from(healthCheckCodesSet));
        setUniquePerformers(Array.from(performersMap.values()));
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
  const handleSearch = () => {
    setCurrentPage(1);
    setLoading(true);
  };

  const handleReset = () => {
    setPerformedBySearch("");
    setTreatmentPlanCode("");
    setHealthCheckResultCode("");
    setActionDateRange([null, null]);
    setCurrentPage(1);
    setAscending(false);

    setFilterState({
      healthCheckResultCode: "",
      performedBySearch: "",
      actionDateRange: [null, null],
      ascending: false,
    });

    setLoading(true);
  };

  const handlePageChange = (page: number, newPageSize?: number) => {
    setCurrentPage(page);
    if (newPageSize) setPageSize(newPageSize);
    setLoading(true);
  };

  // Filter modal handlers
  const openFilterModal = () => {
    setFilterState({
      healthCheckResultCode: healthCheckResultCode || "",
      performedBySearch: performedBySearch || "",
      actionDateRange: actionDateRange || [null, null],
      ascending: ascending,
    });
    setShowFilterModal(true);
  };

  const closeFilterModal = () => {
    setShowFilterModal(false);
  };

  const applyFilters = () => {
    setHealthCheckResultCode(filterState.healthCheckResultCode);
    setPerformedBySearch(filterState.performedBySearch);
    setActionDateRange(filterState.actionDateRange);
    setAscending(filterState.ascending);
    setCurrentPage(1);

    closeFilterModal();

    setLoading(true);
  };

  const resetFilters = () => {
    setFilterState({
      healthCheckResultCode: "",
      performedBySearch: "",
      actionDateRange: [null, null],
      ascending: false,
    });

    setHealthCheckResultCode("");
    setPerformedBySearch("");
    setActionDateRange([null, null]);
    setAscending(false);
    setCurrentPage(1);

    closeFilterModal();

    setLoading(true);
  };

  // Export modal handlers
  const handleOpenExportConfig = () => {
    setShowExportConfigModal(true);
  };

  const closeExportConfigModal = () => {
    setShowExportConfigModal(false);
    form.resetFields();
  };

  const handleExportConfigChange = (changedValues: any) => {
    setExportConfig({ ...exportConfig, ...changedValues });

    if ("exportAllPages" in changedValues) {
      setExportConfig((prev) => ({
        ...prev,
        exportAllPages: changedValues.exportAllPages,
      }));
    }
  };

  const handleExportWithConfig = async () => {
    setExportLoading(true);
    try {
      const values = await form.validateFields();

      if (!values.exportAllPages) {
        const hasAnyFilter =
          values.filterTreatmentPlanCode ||
          values.filterHealthCheckResultCode ||
          values.filterPerformedBy ||
          (values.filterActionDateRange &&
            (values.filterActionDateRange[0] ||
              values.filterActionDateRange[1])) ||
          treatmentPlanCode ||
          healthCheckResultCode ||
          performedBySearch ||
          (actionDateRange && (actionDateRange[0] || actionDateRange[1]));

        if (!hasAnyFilter) {
          messageApi.error({
            content:
              "Please select 'Export all data' or apply at least one filter",
            duration: 5,
          });
          setExportLoading(false);
          return;
        }
      }

      const exportConfigData: TreatmentPlanHistoryExportConfigDTO = {
        exportAllPages: values.exportAllPages,
        includeTreatmentPlanCode: values.includeTreatmentPlanCode,
        includeHealthCheckCode: values.includeHealthCheckCode,
        includePatient: values.includePatient,
        includeAction: values.includeAction,
        includeActionDate: values.includeActionDate,
        includePerformedBy: values.includePerformedBy,
        includePreviousStatus: values.includePreviousStatus,
        includeNewStatus: values.includeNewStatus,
        includeChangeDetails: values.includeChangeDetails,
      };

      const exportTreatmentPlanCode = values.exportAllPages
        ? undefined
        : values.filterTreatmentPlanCode || treatmentPlanCode;
      const exportHealthCheckCode = values.exportAllPages
        ? undefined
        : values.filterHealthCheckResultCode || healthCheckResultCode;
      const exportPerformedBy = values.exportAllPages
        ? undefined
        : values.filterPerformedBy || performedBySearch;
      const exportAscending = values.filterSortDirection === "asc";
      const exportDateRange = values.exportAllPages
        ? null
        : values.filterActionDateRange || actionDateRange;

      const startActionDate =
        exportDateRange && exportDateRange[0]
          ? exportDateRange[0].format("YYYY-MM-DD")
          : undefined;

      const endActionDate =
        exportDateRange && exportDateRange[1]
          ? exportDateRange[1].format("YYYY-MM-DD")
          : undefined;

      const response = await exportTreatmentPlanHistoriesToExcelWithConfig(
        exportConfigData,
        values.exportAllPages ? 1 : currentPage,
        values.exportAllPages ? 1000 : pageSize,
        undefined,
        startActionDate,
        endActionDate,
        exportPerformedBy,
        undefined,
        undefined,
        sortBy,
        exportAscending,
        exportTreatmentPlanCode,
        exportHealthCheckCode
      );

      if (
        response &&
        response.data &&
        (response.success === true || response.isSuccess === true) &&
        typeof response.data === "string"
      ) {
        window.open(response.data, "_blank");
        messageApi.success({
          content: "Excel file generated successfully and opened in a new tab",
          duration: 10,
        });

        setExportConfig(exportConfigData);
        closeExportConfigModal();
      } else {
        messageApi.error({
          content: response?.message || "Failed to export Excel file",
          duration: 5,
        });
      }
    } catch (error) {
      console.error("Export error:", error);
      messageApi.error({
        content: "Failed to export Excel file",
        duration: 5,
      });
    } finally {
      setExportLoading(false);
    }
  };

  // useEffect hooks
  useEffect(() => {
    if (uniqueTreatmentPlanCodes.length === 0) {
      fetchUniqueValues();
    }

    const timer = setTimeout(() => {
      fetchGroupedTreatmentPlanHistories();
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [
    currentPage,
    pageSize,
    treatmentPlanCode,
    healthCheckResultCode,
    performedBySearch,
    actionDateRange,
    ascending,
    fetchGroupedTreatmentPlanHistories,
    fetchUniqueValues,
    uniqueTreatmentPlanCodes.length,
  ]);

  return (
    <div className="history-container" style={{ padding: "20px" }}>
      {contextHolder}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.back()}
            style={{ marginRight: "8px" }}
          >
            Back
          </Button>
          <HistoryOutlined style={{ fontSize: "24px" }} />
          <h3 className="text-xl font-bold">Treatment Plan History</h3>
        </div>
      </div>

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
              placeholder="Search Treatment Plan Code"
              value={treatmentPlanCode || undefined}
              onChange={(value) => {
                setTreatmentPlanCode(value || "");
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
              options={uniqueTreatmentPlanCodes.map((code) => ({
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
                        healthCheckResultCode ||
                        performedBySearch ||
                        (actionDateRange &&
                          (actionDateRange[0] || actionDateRange[1]))
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
                    treatmentPlanCode ||
                    healthCheckResultCode ||
                    performedBySearch ||
                    actionDateRange[0] ||
                    actionDateRange[1]
                  )
                }
              />
            </Tooltip>
          </div>

          <div>
            <Button
              type="primary"
              icon={<FileExcelOutlined />}
              onClick={handleOpenExportConfig}
            >
              Export to Excel
            </Button>
          </div>
        </div>
      </Card>
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
      </div>

      {loading && resultGroups.length === 0 ? (
        <Card className="shadow mb-4">
          <Spin tip="Loading..." />
        </Card>
      ) : resultGroups.length > 0 ? (
        <div>
          {resultGroups.map((group) => (
            <Card key={group.treatmentPlanId} className="shadow mb-4">
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
                      <Text type="secondary">Treatment Plan:</Text>{" "}
                      <Button
                        type="link"
                        onClick={() =>
                          router.push(
                            `/treatment-plan/${group.treatmentPlanId}`
                          )
                        }
                        style={{ padding: 0 }}
                      >
                        {group.code}
                      </Button>
                    </span>

                    {group.histories.length > 0 &&
                      group.histories[0].treatmentPlan?.healthCheckResult && (
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
                            <Text type="secondary">Health Check:</Text>{" "}
                            <Button
                              type="link"
                              onClick={() =>
                                router.push(
                                  `/health-check-result/${group.histories[0].treatmentPlan?.healthCheckResult?.id}`
                                )
                              }
                              style={{ padding: 0 }}
                            >
                              {
                                group.histories[0].treatmentPlan
                                  .healthCheckResult.healthCheckResultCode
                              }
                            </Button>
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
                            dayjs(a.actionDate).unix() -
                            dayjs(b.actionDate).unix();
                          return ascending ? comparison : -comparison;
                        })
                        .map((history) => ({
                          color: getActionColor(history.action),
                          dot: getActionIcon(history.action),
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
                                    {history.action}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "14px",
                                      color: "#8c8c8c",
                                    }}
                                  >
                                    {formatDateTime(history.actionDate)}
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
                                      {history.action?.toLowerCase() ===
                                      "auto-completed"
                                        ? "System"
                                        : `${history.performedBy?.fullName} (${history.performedBy?.email})`}
                                    </div>
                                  </div>

                                  {history.previousStatus &&
                                    history.newStatus && (
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
                                          <Tag
                                            color={getStatusColor(
                                              history.previousStatus
                                            )}
                                          >
                                            {history.previousStatus}
                                          </Tag>
                                          <Text type="secondary"> → </Text>
                                          <Tag
                                            color={getStatusColor(
                                              history.newStatus
                                            )}
                                          >
                                            {history.newStatus}
                                          </Tag>
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
                                        {history.changeDetails}
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
      ) : (
        <Card className="shadow mb-4">
          <Empty description="No treatment plan histories found" />
        </Card>
      )}

      {/* Export Modal Component */}
      <TreatmentPlanHistoryExportModal
        visible={showExportConfigModal}
        exportLoading={exportLoading}
        exportConfig={exportConfig}
        form={form}
        uniqueTreatmentPlanCodes={uniqueTreatmentPlanCodes}
        uniqueHealthCheckCodes={uniqueHealthCheckCodes}
        uniquePerformers={uniquePerformers}
        treatmentPlanCode={treatmentPlanCode}
        healthCheckResultCode={healthCheckResultCode}
        performedBySearch={performedBySearch}
        actionDateRange={actionDateRange}
        ascending={ascending}
        onClose={closeExportConfigModal}
        onExport={handleExportWithConfig}
        handleExportConfigChange={handleExportConfigChange}
      />

      {/* Filter Modal Component */}
      <TreatmentPlanHistoryFilterModal
        visible={showFilterModal}
        filterState={filterState}
        setFilterState={setFilterState}
        uniqueHealthCheckCodes={uniqueHealthCheckCodes}
        uniquePerformers={uniquePerformers}
        onClose={closeFilterModal}
        onApply={applyFilters}
        onReset={resetFilters}
      />
    </div>
  );
}
