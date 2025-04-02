import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  Table,
  Input,
  Select,
  DatePicker,
  Pagination,
  Space,
  Row,
  Col,
  Typography,
  Tag,
  Tooltip,
  Timeline,
  Badge,
  Divider,
  Empty,
  Spin,
  Modal,
  Form,
  Checkbox,
  Collapse,
  Card,
} from "antd";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import {
  getAllTreatmentPlanHistories,
  TreatmentPlanHistoryResponseDTO,
  exportTreatmentPlanHistoriesToExcelWithConfig,
  TreatmentPlanHistoryExportConfigDTO,
  PerformedByInfo,
  getTreatmentPlanHistoriesByTreatmentPlanId,
} from "@/api/treatment-plan";
import { useRouter } from "next/router";
import { 
  SearchOutlined, 
  ExportOutlined,
  EyeOutlined,
  FilterOutlined,
  FileExcelOutlined,
  ArrowLeftOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  PlusOutlined,
  CaretRightOutlined,
  LinkOutlined,
  SyncOutlined,
  UndoOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title, Text } = Typography;
const { Panel } = Collapse;

interface TreatmentPlanGroup {
  code: string;
  treatmentPlanId: string;
  histories: TreatmentPlanHistoryResponseDTO[];
  loading: boolean;
}

const DEFAULT_EXPORT_CONFIG = {
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
};

export function TreatmentPlanHistoryList() {
  const router = useRouter();
  const [resultGroups, setResultGroups] = useState<TreatmentPlanGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [action, setAction] = useState<string | undefined>(undefined);
  const [performedBySearch, setPerformedBySearch] = useState("");
  const [previousStatus, setPreviousStatus] = useState<string | undefined>(
    undefined
  );
  const [newStatus, setNewStatus] = useState<string | undefined>(undefined);
  const [sortBy] = useState("ActionDate");
  const [ascending, setAscending] = useState(false);
  const [treatmentPlanCode, setTreatmentPlanCode] = useState("");
  const [healthCheckResultCode, setHealthCheckResultCode] = useState("");
  const [actionDateRange, setActionDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null]
  >([null, null]);
  const [showExportConfigModal, setShowExportConfigModal] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportConfig, setExportConfig] =
    useState<TreatmentPlanHistoryExportConfigDTO>({
    exportAllPages: false,
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
  
  // Add state for dropdown options
  const [uniqueTreatmentPlanCodes, setUniqueTreatmentPlanCodes] = useState<string[]>([]);
  const [uniqueHealthCheckCodes, setUniqueHealthCheckCodes] = useState<string[]>([]);
  const [uniquePerformers, setUniquePerformers] = useState<{id: string; fullName: string; email: string}[]>([]);
  
  const [form] = Form.useForm();

  // New function to get distinct treatment plan codes with pagination
  const getDistinctTreatmentPlanCodes = async (
    page: number,
    pageSize: number,
    filters: {
      treatmentPlanCode?: string;
      healthCheckResultCode?: string;
      action?: string;
      actionStartDate?: string;
      actionEndDate?: string;
      performedBySearch?: string;
      previousStatus?: string;
      newStatus?: string;
      sortBy?: string;
      ascending?: boolean;
    }
  ) => {
    try {
      // First, get all histories with the provided filters
      const response = await getAllTreatmentPlanHistories(
        1, // Start with page 1
        1000, // Get a large number of records to extract unique codes
        filters.action,
        filters.actionStartDate,
        filters.actionEndDate,
        filters.performedBySearch,
        filters.previousStatus,
        filters.newStatus,
        filters.sortBy,
        filters.ascending,
        filters.treatmentPlanCode,
        filters.healthCheckResultCode
      );

      if (response.success) {
        // Extract unique treatment plan codes
        const histories = response.data.items || response.data || [];
        const uniqueCodesMap = new Map<string, { code: string; id: string }>();

        histories.forEach((history: TreatmentPlanHistoryResponseDTO) => {
          if (
            history.treatmentPlan &&
            !uniqueCodesMap.has(history.treatmentPlan.treatmentPlanCode)
          ) {
            uniqueCodesMap.set(history.treatmentPlan.treatmentPlanCode, {
              code: history.treatmentPlan.treatmentPlanCode,
              id: history.treatmentPlan.id,
            });
          }
        });

        const uniqueCodes = Array.from(uniqueCodesMap.values());

        // Sort the unique codes based on the most recent action
        uniqueCodes.sort((a, b) => {
          const aHistories = histories.filter(
            (h: TreatmentPlanHistoryResponseDTO) =>
              h.treatmentPlan && h.treatmentPlan.treatmentPlanCode === a.code
          );
          const bHistories = histories.filter(
            (h: TreatmentPlanHistoryResponseDTO) =>
              h.treatmentPlan && h.treatmentPlan.treatmentPlanCode === b.code
          );

          const aLatest = aHistories.reduce(
            (
              latest: TreatmentPlanHistoryResponseDTO | null,
              current: TreatmentPlanHistoryResponseDTO
            ) => {
              const latestDate = latest ? dayjs(latest.actionDate) : dayjs(0);
              const currentDate = dayjs(current.actionDate);
              return currentDate.isAfter(latestDate) ? current : latest;
            },
            null as TreatmentPlanHistoryResponseDTO | null
          );

          const bLatest = bHistories.reduce(
            (
              latest: TreatmentPlanHistoryResponseDTO | null,
              current: TreatmentPlanHistoryResponseDTO
            ) => {
              const latestDate = latest ? dayjs(latest.actionDate) : dayjs(0);
              const currentDate = dayjs(current.actionDate);
              return currentDate.isAfter(latestDate) ? current : latest;
            },
            null as TreatmentPlanHistoryResponseDTO | null
          );

          if (aLatest && bLatest) {
            return (
              dayjs(bLatest.actionDate).unix() -
              dayjs(aLatest.actionDate).unix()
            );
          }
          return 0;
        });

        // Calculate total and paginated results
        const total = uniqueCodes.length;
        const startIndex = (page - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, total);
        const paginatedCodes = uniqueCodes.slice(startIndex, endIndex);

        return {
          codes: paginatedCodes,
          total: total,
          success: true,
        };
      }
      return { codes: [], total: 0, success: false };
    } catch (error) {
      console.error("Error fetching distinct codes:", error);
      return { codes: [], total: 0, success: false };
    }
  };

  // Fetch distinct treatment plan codes and their histories
  const fetchDistinctTreatmentPlans = useCallback(async () => {
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

      // Get distinct codes first
      const distinctCodesResult = await getDistinctTreatmentPlanCodes(
        currentPage,
        pageSize,
        {
          treatmentPlanCode,
          healthCheckResultCode,
          action,
          actionStartDate,
          actionEndDate,
          performedBySearch,
          previousStatus,
          newStatus,
          sortBy,
          ascending,
        }
      );

      if (distinctCodesResult.success) {
        // Create result groups from distinct codes
        const groups: TreatmentPlanGroup[] = distinctCodesResult.codes.map(
          (item) => ({
            code: item.code,
            treatmentPlanId: item.id,
            histories: [],
            loading: true,
          })
        );

        setResultGroups(groups);
        setTotal(distinctCodesResult.total);

        // Fetch detailed histories for each group
        for (const group of groups) {
          fetchHistoriesForTreatmentPlan(group.treatmentPlanId);
        }
      } else {
        toast.error("Could not load treatment plan codes");
        setLoading(false);
      }
    } catch (error) {
      toast.error("Could not load treatment plan codes");
      setLoading(false);
    }
  }, [
    currentPage,
    pageSize,
    ascending,
    treatmentPlanCode,
    healthCheckResultCode,
    action,
    performedBySearch,
    previousStatus,
    newStatus,
    actionDateRange,
  ]);

  // Fetch all histories for a specific treatment plan
  const fetchHistoriesForTreatmentPlan = async (treatmentPlanId: string) => {
    try {
      const response = await getTreatmentPlanHistoriesByTreatmentPlanId(
        treatmentPlanId
      );

      if (response.success) {
        setResultGroups((prevGroups) =>
          prevGroups.map((group) =>
            group.treatmentPlanId === treatmentPlanId
              ? { ...group, histories: response.data, loading: false }
              : group
          )
        );
      } else {
        toast.error(
          response.message || `Could not load histories for treatment plan`
        );
      }
    } catch (error) {
      toast.error(`Could not load histories for treatment plan`);
    } finally {
      // Check if all groups are loaded
      setLoading(resultGroups.some((group) => group.loading));
    }
  };

  useEffect(() => {
    fetchDistinctTreatmentPlans();
  }, [
    currentPage,
    pageSize,
    ascending,
    treatmentPlanCode,
    healthCheckResultCode,
    action,
    performedBySearch,
    previousStatus,
    newStatus,
    actionDateRange,
  ]);

  // Fetch distinct codes and performers for dropdown options
  const fetchUniqueValues = useCallback(async () => {
    try {
      const response = await getAllTreatmentPlanHistories(
        1,
        1000,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        "ActionDate",
        false,
        undefined,
        undefined
      );

      if (response.success) {
        const histories = response.data.items || response.data || [];
        
        // Extract unique treatment plan codes
        const treatmentPlanCodesSet = new Set<string>();
        const healthCheckCodesSet = new Set<string>();
        const performersMap = new Map<string, {id: string; fullName: string; email: string}>();
        
        histories.forEach((history: TreatmentPlanHistoryResponseDTO) => {
          if (history.treatmentPlan) {
            treatmentPlanCodesSet.add(history.treatmentPlan.treatmentPlanCode);
            
            if (history.treatmentPlan.healthCheckResult) {
              healthCheckCodesSet.add(history.treatmentPlan.healthCheckResult.healthCheckResultCode);
            }
          }
          
          if (history.performedBy) {
            performersMap.set(history.performedBy.id, {
              id: history.performedBy.id,
              fullName: history.performedBy.fullName,
              email: history.performedBy.email
            });
          }
        });
        
        setUniqueTreatmentPlanCodes(Array.from(treatmentPlanCodesSet));
        setUniqueHealthCheckCodes(Array.from(healthCheckCodesSet));
        setUniquePerformers(Array.from(performersMap.values()));
      }
    } catch (error) {
      console.error("Error fetching unique values:", error);
      toast.error("Failed to load filter options");
    }
  }, []);

  useEffect(() => {
    fetchUniqueValues();
  }, []);

  // Event handlers
  const handleSearch = () => {
    setCurrentPage(1);
    fetchDistinctTreatmentPlans();
  };

  const handleReset = () => {
    setAction(undefined);
    setPerformedBySearch("");
    setPreviousStatus(undefined);
    setNewStatus(undefined);
    setAscending(false);
    setTreatmentPlanCode("");
    setHealthCheckResultCode("");
    setActionDateRange([null, null]);
    setCurrentPage(1);
    fetchDistinctTreatmentPlans();
  };

  const handlePageChange = (page: number, pageSize?: number) => {
    setCurrentPage(page);
    if (pageSize) setPageSize(pageSize);
  };

  const handleOpenExportConfig = () => {
    setShowExportConfigModal(true);
  };

  const closeExportConfigModal = () => {
    setShowExportConfigModal(false);
  };

  const handleExportConfigChange = (changedValues: any) => {
    setExportConfig({ ...exportConfig, ...changedValues });
  };

  const handleExportWithConfig = async () => {
    try {
      const values = await form.validateFields();
      setExportLoading(true);

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

      const startActionDate = actionDateRange[0]?.format("YYYY-MM-DD");
      const endActionDate = actionDateRange[1]?.format("YYYY-MM-DD");

      const response = await exportTreatmentPlanHistoriesToExcelWithConfig(
        exportConfigData,
        currentPage,
        pageSize,
        action,
        startActionDate,
        endActionDate,
        performedBySearch,
        previousStatus,
        newStatus,
        sortBy,
        ascending,
        treatmentPlanCode,
        healthCheckResultCode
      );

      if (response.success && response.data) {
        window.open(response.data, "_blank");
        toast.success(
          "Treatment plan histories exported to Excel successfully"
        );
      } else {
        toast.error(response.message || "Failed to export Excel file");
      }
      
      setExportConfig(exportConfigData);
      closeExportConfigModal();
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export Excel file");
    } finally {
      setExportLoading(false);
    }
  };

  // Helper functions
  const formatDate = (date: string | undefined) => {
    if (!date) return "";
    return dayjs(date).format("DD/MM/YYYY");
  };

  const formatDateTime = (datetime: string | undefined) => {
    if (!datetime) return "";
    return dayjs(datetime).format("DD/MM/YYYY HH:mm:ss");
  };

  const getStatusColor = (status: string | undefined) => {
    if (!status) return "";

    switch (status.toLowerCase()) {
      case "pending":
        return "orange";
      case "approved":
        return "green";
      case "rejected":
        return "red";
      case "completed":
        return "blue";
      case "cancelled":
        return "volcano";
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
      case "deleted":
        return "red";
      case "approved":
        return "green";
      case "rejected":
        return "volcano";
      case "completed":
        return "cyan";
      case "cancelled":
        return "orange";
      case "statuschange":
        return "purple";
      case "restore":
        return "lime";
      case "softdelete":
        return "gray";
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
        return <EditOutlined />;
      case "deleted":
        return <CloseCircleOutlined />;
      case "approved":
        return <CheckCircleOutlined />;
      case "rejected":
        return <CloseCircleOutlined />;
      case "completed":
        return <CheckCircleOutlined />;
      case "cancelled":
        return <CloseCircleOutlined />;
      case "statuschange":
        return <SyncOutlined />;
      case "restore":
        return <UndoOutlined />;
      case "softdelete":
        return <DeleteOutlined />;
      default:
        return <HistoryOutlined />;
    }
  };

  const renderExportConfigModal = () => (
    <Modal
      title="Export Configuration"
      open={showExportConfigModal}
      onOk={handleExportWithConfig}
      onCancel={closeExportConfigModal}
      confirmLoading={exportLoading}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={exportConfig}
        onValuesChange={handleExportConfigChange}
      >
        <Form.Item name="exportAllPages" valuePropName="checked">
          <Checkbox>Export all pages (not just current page)</Checkbox>
        </Form.Item>

        <Divider orientation="left">Fields to include</Divider>

        <Row gutter={24}>
          <Col span={12}>
            <Form.Item name="includeTreatmentPlanCode" valuePropName="checked">
          <Checkbox>Treatment Plan Code</Checkbox>
        </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item name="includeHealthCheckCode" valuePropName="checked">
          <Checkbox>Health Check Code</Checkbox>
        </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item name="includePatient" valuePropName="checked">
              <Checkbox>Patient Information</Checkbox>
        </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item name="includeAction" valuePropName="checked">
          <Checkbox>Action</Checkbox>
        </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item name="includeActionDate" valuePropName="checked">
          <Checkbox>Action Date</Checkbox>
        </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item name="includePerformedBy" valuePropName="checked">
          <Checkbox>Performed By</Checkbox>
        </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item name="includePreviousStatus" valuePropName="checked">
          <Checkbox>Previous Status</Checkbox>
        </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item name="includeNewStatus" valuePropName="checked">
          <Checkbox>New Status</Checkbox>
        </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item name="includeChangeDetails" valuePropName="checked">
          <Checkbox>Change Details</Checkbox>
        </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );

  return (
    <div className="history-container" style={{ padding: "20px" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.back()}
          >
            Back
          </Button>
          <HistoryOutlined style={{ fontSize: "24px" }} />
          <h3 className="text-2xl font-bold">Treatment Plan History</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            type="primary"
            icon={<FileExcelOutlined />}
            onClick={handleOpenExportConfig}
          >
            Export to Excel
          </Button>
        </div>
      </div>
      
      <Card style={{ marginBottom: 20 }} className="shadow-sm">
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Select
                  showSearch
                  placeholder="Treatment Plan Code"
                  value={treatmentPlanCode || undefined}
                  onChange={(value) => setTreatmentPlanCode(value || "")}
                  style={{ width: "100%" }}
                  allowClear
                  filterOption={(input, option) =>
                    (option?.label?.toString().toLowerCase() || '').includes(input.toLowerCase())
                  }
                  options={uniqueTreatmentPlanCodes.map(code => ({
                    value: code,
                    label: code
                  }))}
                  prefix={<SearchOutlined />}
                />
              </Col>
              <Col span={8}>
                <Select
                  showSearch
                  placeholder="Health Check Result Code"
                  value={healthCheckResultCode || undefined}
                  onChange={(value) => setHealthCheckResultCode(value || "")}
                  style={{ width: "100%" }}
                  allowClear
                  filterOption={(input, option) =>
                    (option?.label?.toString().toLowerCase() || '').includes(input.toLowerCase())
                  }
                  options={uniqueHealthCheckCodes.map(code => ({
                    value: code,
                    label: code
                  }))}
                  prefix={<SearchOutlined />}
                />
              </Col>
              <Col span={8}>
                <Select
                  placeholder="Action"
                  style={{ width: "100%" }}
                  value={action}
                  onChange={(value) => setAction(value)}
                  allowClear
                >
                  <Option value="Created">Created</Option>
                  <Option value="Updated">Updated</Option>
                  <Option value="Deleted">Deleted</Option>
                  <Option value="Approved">Approved</Option>
                  <Option value="Rejected">Rejected</Option>
                  <Option value="Completed">Completed</Option>
                  <Option value="Cancelled">Cancelled</Option>
                  <Option value="StatusChange">Status Change</Option>
                  <Option value="SoftDelete">Soft Delete</Option>
                  <Option value="Restore">Restore</Option>
                </Select>
              </Col>
              <Col span={8}>
                <RangePicker
                  style={{ width: "100%" }}
                  placeholder={["From date", "To date"]}
                  value={[
                    actionDateRange[0] ? actionDateRange[0] : null,
                    actionDateRange[1] ? actionDateRange[1] : null,
                  ]}
                  onChange={(dates) =>
                    setActionDateRange(
                      dates as [dayjs.Dayjs | null, dayjs.Dayjs | null]
                    )
                  }
                />
              </Col>
              <Col span={8}>
                <Select
                  showSearch
                  placeholder="Performed By"
                  value={performedBySearch || undefined}
                  onChange={(value) => setPerformedBySearch(value || "")}
                  style={{ width: "100%" }}
                  allowClear
                  filterOption={(input, option) =>
                    (option?.label?.toString().toLowerCase() || '').includes(input.toLowerCase())
                  }
                  optionLabelProp="label"
                  options={uniquePerformers.map(performer => ({
                    value: performer.fullName,
                    label: `${performer.fullName} (${performer.email})`,
                    email: performer.email
                  }))}
                  prefix={<SearchOutlined />}
                />
              </Col>
              <Col span={8}>
                <Select
                  placeholder="Previous Status"
                  style={{ width: "100%" }}
                  value={previousStatus}
                  onChange={(value) => setPreviousStatus(value)}
                  allowClear
                >
                  <Option value="Pending">Pending</Option>
                  <Option value="Approved">Approved</Option>
                  <Option value="Rejected">Rejected</Option>
                  <Option value="Completed">Completed</Option>
                  <Option value="Cancelled">Cancelled</Option>
                  <Option value="Deleted">Deleted</Option>
                  <Option value="IN_PROGRESS">In Progress</Option>
                  <Option value="SOFT_DELETED">Soft Deleted</Option>
                </Select>
              </Col>
              <Col span={8}>
                <Select
                  placeholder="New Status"
                  style={{ width: "100%" }}
                  value={newStatus}
                  onChange={(value) => setNewStatus(value)}
                  allowClear
                >
                  <Option value="Pending">Pending</Option>
                  <Option value="Approved">Approved</Option>
                  <Option value="Rejected">Rejected</Option>
                  <Option value="Completed">Completed</Option>
                  <Option value="Cancelled">Cancelled</Option>
                  <Option value="Deleted">Deleted</Option>
                  <Option value="IN_PROGRESS">In Progress</Option>
                  <Option value="SOFT_DELETED">Soft Deleted</Option>
                </Select>
              </Col>
              <Col span={24}>
                <Space>
                  <Button
                    type="primary"
                    onClick={handleSearch}
                    icon={<SearchOutlined />}
                  >
                    Search
                  </Button>
                  <Button onClick={handleReset}>Reset</Button>
                </Space>
              </Col>
            </Row>
          </Col>

          <Col span={24}>
            <Space size="middle" wrap>
              <Select
                placeholder="Sort by"
                value="ActionDate"
                disabled={true}
                style={{ width: 150 }}
              >
                <Option value="ActionDate">Action Date</Option>
              </Select>
              <Select
                placeholder="Order"
                value={ascending ? "asc" : "desc"}
                onChange={(value) => setAscending(value === "asc")}
                style={{ width: 120 }}
              >
                <Option value="asc">Ascending</Option>
                <Option value="desc">Descending</Option>
              </Select>
            </Space>
          </Col>
        </Row>
      </Card>

      {loading && resultGroups.length === 0 ? (
        <Card className="shadow-sm">
          <Spin tip="Loading..." />
        </Card>
      ) : resultGroups.length > 0 ? (
        <div>
          {resultGroups.map((group, index) => (
            <Card key={group.treatmentPlanId} className="shadow-sm mb-4">
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
                        onClick={() => router.push(`/treatment-plan/${group.treatmentPlanId}`)}
                        style={{ padding: 0 }}
                      >
                        {group.code}
                      </Button>
                    </span>
                    
                    {group.histories.length > 0 && 
                     group.histories[0].treatmentPlan?.healthCheckResult && (
                      <>
                        <div style={{ display: "flex", alignItems: "center", color: "#8c8c8c" }}>
                          <LinkOutlined style={{ fontSize: "14px" }} />
                        </div>
                        <span>
                          <Text type="secondary">Health Check:</Text>{" "}
                          <Button 
                            type="link" 
                            onClick={() => router.push(`/health-check-result/${group.histories[0].treatmentPlan?.healthCheckResult?.id}`)}
                            style={{ padding: 0 }}
                          >
                            {group.histories[0].treatmentPlan.healthCheckResult.healthCheckResultCode}
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
                        .sort(
                          (a, b) =>
                            dayjs(b.actionDate).unix() -
                            dayjs(a.actionDate).unix()
                        )
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
                                      {history.performedBy?.fullName} (
                                      {history.performedBy?.email})
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
            <Row justify="space-between" align="middle">
              <Col>
                <Text type="secondary">
                  Total {total} treatment plan groups
                </Text>
              </Col>
              <Col>
                <Space align="center">
                  <Text type="secondary">Groups per page:</Text>
                  <Select
                    value={pageSize}
                    onChange={(value) => {
                      setPageSize(value);
                      setCurrentPage(1);
                    }}
                    style={{ minWidth: "80px" }}
                  >
                    <Option value={5}>5</Option>
                    <Option value={10}>10</Option>
                    <Option value={15}>15</Option>
                    <Option value={20}>20</Option>
                  </Select>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={total}
            onChange={handlePageChange}
                    showSizeChanger={false}
            showTotal={(total) => `Total ${total} items`}
          />
                </Space>
              </Col>
            </Row>
          </Card>
        </div>
      ) : (
        <Card className="shadow-sm">
          <Empty description="No treatment plan history found" />
        </Card>
      )}

      {renderExportConfigModal()}
    </div>
  );
} 
