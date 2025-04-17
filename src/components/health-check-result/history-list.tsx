import React, { useState, useEffect, useCallback, Fragment } from "react";
import {
  Table,
  Card,
  Button,
  Space,
  Typography,
  Pagination,
  Select,
  Row,
  Col,
  Tag,
  Timeline,
  Tooltip,
  Badge,
  Empty,
  Skeleton,
  Input,
  DatePicker,
  Collapse,
  Modal,
  Checkbox,
  Form,
  InputNumber,
  Spin,
  Dropdown,
  Menu,
  Divider,
} from "antd";
import { toast } from "react-toastify";
import {
  getAllHealthCheckResultHistories,
  exportAllHealthCheckResultHistoriesToExcelWithConfig,
  getHealthCheckResultHistoriesByResultId,
  HealthCheckResultHistoryResponseDTO,
  HealthCheckResultHistoryExportConfigDTO,
} from "@/api/healthcheckresult";
import {
  ArrowLeftOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FormOutlined,
  PlusOutlined,
  SearchOutlined,
  FileExcelOutlined,
  CaretRightOutlined,
  FilterOutlined,
  SettingOutlined,
  ExportOutlined,
  UndoOutlined,
  DownOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";
import moment from "moment";
import axios from "axios";
import { message } from "antd";
import { HealthInsuranceIcon } from "@/dashboard/sidebar/icons/HealthInsuranceIcon";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Panel } = Collapse;

interface HealthCheckResultGroup {
  code: string;
  healthCheckResultId: string;
  histories: HealthCheckResultHistoryResponseDTO[];
  loading: boolean;
}

const HistoryFilterModal: React.FC<{
  visible: boolean;
  onCancel: () => void;
  onApply: (filters: any) => void;
  onReset: () => void;
  filters: {
    healthCheckResultCode: string | undefined;
    action: string | undefined;
    actionDateRange: [moment.Moment | null, moment.Moment | null] | null;
    performedBySearch: string | undefined;
    previousStatus: string | undefined;
    newStatus: string | undefined;
    sortBy: string;
    ascending: boolean;
  };
  uniqueHealthCheckCodes: string[];
  uniquePerformers: { id: string; fullName: string; email: string }[];
}> = ({
  visible,
  onCancel,
  onApply,
  onReset,
  filters,
  uniqueHealthCheckCodes,
  uniquePerformers,
}) => {
  const [localFilters, setLocalFilters] = useState(filters);

  // Reset localFilters when modal is opened with new filters
  useEffect(() => {
    if (visible) {
      setLocalFilters(filters);
    }
  }, [visible, filters]);

  // Process and apply filters
  const handleApply = () => {
    onApply(localFilters);
  };

  // Common styles for filter items
  const filterItemStyle = { marginBottom: "16px" };
  const filterLabelStyle = { marginBottom: "8px", color: "#666666" };

  // Function to update filter state
  const updateFilter = (field: string, value: any) => {
    setLocalFilters((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Modal
      title={
        <Title level={4} style={{ margin: 0 }}>
          Advanced Filters
        </Title>
      }
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={[
        <Button key="reset" onClick={onReset} icon={<UndoOutlined />}>
          Reset
        </Button>,
        <Button
          key="apply"
          type="primary"
          onClick={handleApply}
          icon={<CheckCircleOutlined />}
        >
          Apply
        </Button>,
      ]}
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        <Row gutter={16}>
          {/* Health Check Result Code Filter */}
          <Col span={12}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Filter by health check result code
              </div>
              <Select
                placeholder="Filter by health check result code"
                allowClear
                showSearch
                style={{ width: "100%" }}
                value={localFilters.healthCheckResultCode}
                onChange={(value) =>
                  updateFilter("healthCheckResultCode", value)
                }
                filterOption={(input, option) =>
                  (option?.children as unknown as string)
                    ?.toLowerCase()
                    .indexOf(input.toLowerCase()) >= 0
                }
              >
                {uniqueHealthCheckCodes.map((code) => (
                  <Option key={code} value={code}>
                    {code}
                  </Option>
                ))}
              </Select>
            </div>
          </Col>

          {/* Action Filter */}
          <Col span={12}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Filter by action type
              </div>
              <Select
                placeholder="Filter by action type"
                allowClear
                style={{ width: "100%" }}
                value={localFilters.action}
                onChange={(value) => updateFilter("action", value)}
              >
                <Option value="Created">Created</Option>
                <Option value="Updated">Updated</Option>
                <Option value="Approved">Approved</Option>
                <Option value="Cancelled">Cancelled</Option>
              </Select>
            </div>
          </Col>
        </Row>

        <Row gutter={16}>
          {/* Action Date Range */}
          <Col span={12}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Action Time Range
              </div>
              <RangePicker
                style={{ width: "100%" }}
                placeholder={["From date", "To date"]}
                format="DD/MM/YYYY"
                allowClear
                value={localFilters.actionDateRange as any}
                onChange={(dates) => updateFilter("actionDateRange", dates)}
              />
            </div>
          </Col>

          {/* Performed By Filter */}
          <Col span={12}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Filter by performer
              </div>
              <Select
                placeholder="Filter by performer"
                allowClear
                showSearch
                style={{ width: "100%" }}
                value={localFilters.performedBySearch}
                onChange={(value) => updateFilter("performedBySearch", value)}
                filterOption={(input, option) =>
                  (option?.title as string)
                    ?.toLowerCase()
                    .indexOf(input.toLowerCase()) >= 0
                }
                optionLabelProp="title"
              >
                {uniquePerformers.map((performer) => (
                  <Option
                    key={performer.id}
                    value={performer.id}
                    title={`${performer.fullName} (${performer.email})`}
                  >
                    <div>
                      <div>{performer.fullName}</div>
                      <div style={{ fontSize: "12px", color: "#888" }}>
                        {performer.email}
                      </div>
                    </div>
                  </Option>
                ))}
              </Select>
            </div>
          </Col>
        </Row>

        <Row gutter={16}>
          {/* Previous Status Filter */}
          <Col span={12}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Filter by previous status
              </div>
              <Select
                placeholder="Filter by previous status"
                style={{ width: "100%" }}
                allowClear
                value={localFilters.previousStatus}
                onChange={(value) => updateFilter("previousStatus", value)}
              >
                <Option value="WaitingForApproval">Waiting For Approval</Option>
                <Option value="Approved">Approved</Option>
                <Option value="Completed">Completed</Option>
                <Option value="CancelledCompletely">
                  Cancelled Completely
                </Option>
                <Option value="CancelledForAdjustment">
                  Cancelled For Adjustment
                </Option>
              </Select>
            </div>
          </Col>

          {/* New Status Filter */}
          <Col span={12}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Filter by new status
              </div>
              <Select
                placeholder="Filter by new status"
                style={{ width: "100%" }}
                allowClear
                value={localFilters.newStatus}
                onChange={(value) => updateFilter("newStatus", value)}
              >
                <Option value="WaitingForApproval">Waiting For Approval</Option>
                <Option value="Approved">Approved</Option>
                <Option value="Completed">Completed</Option>
                <Option value="CancelledCompletely">
                  Cancelled Completely
                </Option>
                <Option value="CancelledForAdjustment">
                  Cancelled For Adjustment
                </Option>
              </Select>
            </div>
          </Col>
        </Row>

        <Row gutter={16}>
          {/* Sort By */}
          <Col span={12}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Sort by
              </div>
              <Select
                placeholder="Sort by"
                value={localFilters.sortBy}
                onChange={(value) => updateFilter("sortBy", value)}
                style={{ width: "100%" }}
              >
                <Option value="ActionDate">Action Time</Option>
                <Option value="healthCheckResultCode">
                  Health Check Result Code
                </Option>
              </Select>
            </div>
          </Col>

          {/* Order */}
          <Col span={12}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Order
              </div>
              <Select
                placeholder="Order"
                value={localFilters.ascending ? "asc" : "desc"}
                onChange={(value) => updateFilter("ascending", value === "asc")}
                style={{ width: "100%" }}
              >
                <Option value="asc">Ascending</Option>
                <Option value="desc">Descending</Option>
              </Select>
            </div>
          </Col>
        </Row>
      </Space>
    </Modal>
  );
};

export const HealthCheckResultHistory: React.FC = () => {
  const router = useRouter();
  const [resultGroups, setResultGroups] = useState<HealthCheckResultGroup[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState("ActionDate");
  const [ascending, setAscending] = useState(false);

  // Search filters
  const [healthCheckResultCode, setHealthCheckResultCode] = useState<
    string | undefined
  >();
  const [action, setAction] = useState<string | undefined>();
  const [actionDateRange, setActionDateRange] = useState<
    [moment.Moment | null, moment.Moment | null] | null
  >(null);
  const [performedBySearch, setPerformedBySearch] = useState<
    string | undefined
  >();
  const [previousStatus, setPreviousStatus] = useState<string | undefined>();
  const [newStatus, setNewStatus] = useState<string | undefined>();
  const [rejectionReason, setRejectionReason] = useState<string | undefined>();
  const [exportLoading, setExportLoading] = useState(false);
  const [showExportConfigModal, setShowExportConfigModal] = useState(false);
  const [uniqueHealthCheckCodes, setUniqueHealthCheckCodes] = useState<
    string[]
  >([]);
  const [uniquePerformers, setUniquePerformers] = useState<
    { id: string; fullName: string; email: string }[]
  >([]);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  // Add column visibility state similar to the health check results component
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >({
    historyCode: true,
    action: true,
    actionDate: true,
    performedBy: true,
    statusChange: true,
    details: true,
  });

  // New API Function to get distinct HealthCheckResult codes with pagination
  const getDistinctHealthCheckResultCodes = async (
    page: number,
    pageSize: number,
    filters: {
      healthCheckResultCode?: string;
      action?: string;
      actionStartDate?: string;
      actionEndDate?: string;
      performedBySearch?: string;
      previousStatus?: string;
      newStatus?: string;
      rejectionReason?: string;
      sortBy?: string;
      ascending?: boolean;
    }
  ) => {
    try {
      // First, get all histories with the provided filters
      const response = await getAllHealthCheckResultHistories(
        1, // Start with page 1
        1000, // Get a large number of records to extract unique codes
        filters.healthCheckResultCode,
        filters.action,
        filters.actionStartDate,
        filters.actionEndDate,
        filters.performedBySearch,
        filters.previousStatus,
        filters.newStatus,
        filters.rejectionReason,
        filters.sortBy,
        filters.ascending
      );

      if (response.isSuccess) {
        // Extract unique health check result codes
        const histories =
          response.data as HealthCheckResultHistoryResponseDTO[];
        const uniqueCodesMap = new Map<string, { code: string; id: string }>();

        histories.forEach((history) => {
          if (!uniqueCodesMap.has(history.healthCheckResultCode)) {
            uniqueCodesMap.set(history.healthCheckResultCode, {
              code: history.healthCheckResultCode,
              id: history.healthCheckResultId,
            });
          }
        });

        const uniqueCodes = Array.from(uniqueCodesMap.values());

        // Sort the unique codes if needed
        if (filters.sortBy?.toLowerCase() === "healthcheckresultcode") {
          uniqueCodes.sort((a, b) => {
            if (filters.ascending) {
              return a.code.localeCompare(b.code);
            } else {
              return b.code.localeCompare(a.code);
            }
          });
        }

        // Calculate total and paginated results
        const total = uniqueCodes.length;
        const startIndex = (page - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, total);
        const paginatedCodes = uniqueCodes.slice(startIndex, endIndex);

        return {
          codes: paginatedCodes,
          total: total,
          isSuccess: true,
        };
      }
      return { codes: [], total: 0, isSuccess: false };
    } catch (error) {
      console.error("Error fetching distinct codes:", error);
      return { codes: [], total: 0, isSuccess: false };
    }
  };

  // Lấy danh sách các mã kết quả khám duy nhất với phân trang
  const fetchDistinctHealthCheckResults = useCallback(async () => {
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
      const distinctCodesResult = await getDistinctHealthCheckResultCodes(
        currentPage,
        pageSize,
        {
          healthCheckResultCode,
          action,
          actionStartDate,
          actionEndDate,
          performedBySearch,
          previousStatus,
          newStatus,
          rejectionReason,
          sortBy,
          ascending,
        }
      );

      if (distinctCodesResult.isSuccess) {
        // Create result groups from distinct codes
        const groups: HealthCheckResultGroup[] = distinctCodesResult.codes.map(
          (item) => ({
            code: item.code,
            healthCheckResultId: item.id,
            histories: [],
            loading: true,
          })
        );

        setResultGroups(groups);
        setTotal(distinctCodesResult.total);

        // Lấy lịch sử chi tiết cho mỗi nhóm
        for (const group of groups) {
          fetchHistoriesForResult(group.healthCheckResultId);
        }
      } else {
        toast.error("Không thể tải danh sách mã kết quả khám");
        setLoading(false);
      }
    } catch (error) {
      toast.error("Không thể tải danh sách mã kết quả khám");
      setLoading(false);
    }
  }, [
    currentPage,
    pageSize,
    sortBy,
    ascending,
    healthCheckResultCode,
    action,
    actionDateRange,
    performedBySearch,
    previousStatus,
    newStatus,
    rejectionReason,
  ]);

  // Lấy tất cả lịch sử cho một mã kết quả khám cụ thể
  const fetchHistoriesForResult = async (healthCheckResultId: string) => {
    try {
      const response = await getHealthCheckResultHistoriesByResultId(
        healthCheckResultId
      );

      if (response.isSuccess) {
        setResultGroups((prevGroups) =>
          prevGroups.map((group) =>
            group.healthCheckResultId === healthCheckResultId
              ? { ...group, histories: response.data, loading: false }
              : group
          )
        );
      } else {
        toast.error(
          response.message || `Không thể tải lịch sử cho mã kết quả khám`
        );
      }
    } catch (error) {
      toast.error(`Không thể tải lịch sử cho mã kết quả khám`);
    } finally {
      // Kiểm tra xem tất cả các nhóm đã tải xong chưa
      setResultGroups((prevGroups) => {
        const allLoaded = prevGroups.every((group) => !group.loading);
        if (allLoaded) {
          setLoading(false);
        }
        return prevGroups;
      });
    }
  };

  // Fetch unique codes and performers for select inputs
  const fetchUniqueCodesAndPerformers = useCallback(async () => {
    try {
      const result = await getAllHealthCheckResultHistories(
        1,
        9999, // Large enough to get all records
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        "ActionDate",
        false
      );

      if (result.isSuccess && result.data) {
        // Extract unique health check result codes
        const uniqueCodes = Array.from(
          new Set(
            result.data.map(
              (history: HealthCheckResultHistoryResponseDTO) =>
                history.healthCheckResultCode
            )
          )
        );
        setUniqueHealthCheckCodes(uniqueCodes.filter(Boolean) as string[]);

        // Extract unique performers
        const performersMap = new Map();
        result.data.forEach((history: HealthCheckResultHistoryResponseDTO) => {
          if (
            history.performedBy &&
            !performersMap.has(history.performedBy.id)
          ) {
            performersMap.set(history.performedBy.id, history.performedBy);
          }
        });

        const uniquePerformersList = Array.from(performersMap.values());
        setUniquePerformers(uniquePerformersList);
      }
    } catch (error) {
      console.error("Error fetching unique values:", error);
    }
  }, []);

  useEffect(() => {
    fetchDistinctHealthCheckResults();
    fetchUniqueCodesAndPerformers();
  }, [fetchDistinctHealthCheckResults, fetchUniqueCodesAndPerformers]);

  const [exportConfig, setExportConfig] = useState<
    HealthCheckResultHistoryExportConfigDTO & {
      filterHealthCheckResultCode?: string;
      filterPerformedBy?: string;
      filterAction?: string;
      filterActionDateRange?:
        | [moment.Moment | null, moment.Moment | null]
        | null;
      filterPreviousStatus?: string;
      filterNewStatus?: string;
      sortOption?: string;
      sortDirection?: string;
    }
  >({
    exportAllPages: true,
    includeAction: true,
    includeActionDate: true,
    includePerformedBy: true,
    includePreviousStatus: true,
    includeNewStatus: true,
    includeRejectionReason: true,
    includeChangeDetails: true,
    groupByHealthCheckResultCode: true,
    filterHealthCheckResultCode: healthCheckResultCode,
    filterPerformedBy: performedBySearch,
    filterAction: action,
    filterActionDateRange: actionDateRange,
    filterPreviousStatus: previousStatus,
    filterNewStatus: newStatus,
    sortOption: sortBy,
    sortDirection: ascending ? "asc" : "desc",
  });
  const [form] = Form.useForm();

  // Thêm hàm mới để cập nhật giá trị ban đầu của form
  const setFormInitialValues = () => {
    form.setFieldsValue({
      exportAllPages: true,
      includeAction: exportConfig.includeAction,
      includeActionDate: exportConfig.includeActionDate,
      includePerformedBy: exportConfig.includePerformedBy,
      includePreviousStatus: exportConfig.includePreviousStatus,
      includeNewStatus: exportConfig.includeNewStatus,
      includeRejectionReason: exportConfig.includeRejectionReason,
      includeChangeDetails: exportConfig.includeChangeDetails,
      filterHealthCheckResultCode: healthCheckResultCode,
      filterPerformedBy: performedBySearch,
      filterAction: action,
      filterActionDateRange: actionDateRange,
      filterPreviousStatus: previousStatus,
      filterNewStatus: newStatus,
      sortOption: sortBy,
      sortDirection: ascending ? "asc" : "desc",
    });
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const actionStartDate =
        actionDateRange && actionDateRange[0]
          ? actionDateRange[0].format("YYYY-MM-DD")
          : undefined;
      const actionEndDate =
        actionDateRange && actionDateRange[1]
          ? actionDateRange[1].format("YYYY-MM-DD")
          : undefined;

      // Đảm bảo đã tải danh sách mã kết quả khám và người thực hiện duy nhất
      if (
        uniqueHealthCheckCodes.length === 0 ||
        uniquePerformers.length === 0
      ) {
        await fetchUniqueCodesAndPerformers();
      }

      // Cập nhật giá trị ban đầu cho form
      setFormInitialValues();

      setShowExportConfigModal(true);
      setExportLoading(false);
    } catch (error) {
      toast.error("Không thể xuất file Excel");
      setExportLoading(false);
    }
  };

  const handleExportWithConfig = async () => {
    setExportLoading(true);
    try {
      const values = form.getFieldsValue();

      // Build export configuration
      const config = {
        exportAllPages: values.exportAllPages || false,
        includeAction: values.includeAction !== false, // Default to true
        includeActionDate: values.includeActionDate !== false, // Default to true
        includePerformedBy: values.includePerformedBy !== false, // Default to true
        includePreviousStatus: values.includePreviousStatus !== false, // Default to true
        includeNewStatus: values.includeNewStatus !== false, // Default to true
        includeRejectionReason: values.includeRejectionReason !== false, // Default to true
        includeChangeDetails: values.includeChangeDetails !== false, // Default to true
        groupByHealthCheckResultCode: true,
      };

      // Xử lý dữ liệu ngày tháng
      const actionDateRange = values.filterActionDateRange;
      const actionStartDate =
        actionDateRange && actionDateRange[0]
          ? actionDateRange[0].format("YYYY-MM-DD")
          : undefined;
      const actionEndDate =
        actionDateRange && actionDateRange[1]
          ? actionDateRange[1].format("YYYY-MM-DD")
          : undefined;

      // Xác định thứ tự sắp xếp
      const sortDirection = values.sortDirection === "asc";

      // Gọi API với các thông số mới
      await exportAllHealthCheckResultHistoriesToExcelWithConfig(
        config,
        currentPage,
        pageSize,
        values.exportAllPages ? undefined : values.filterHealthCheckResultCode,
        values.exportAllPages ? undefined : values.filterAction,
        values.exportAllPages ? undefined : actionStartDate,
        values.exportAllPages ? undefined : actionEndDate,
        values.exportAllPages ? undefined : values.filterPerformedBy,
        values.exportAllPages ? undefined : values.filterPreviousStatus,
        values.exportAllPages ? undefined : values.filterNewStatus,
        values.exportAllPages ? undefined : rejectionReason,
        values.sortOption || "ActionDate",
        sortDirection
      );

      closeConfigModal();
    } catch (error: any) {
      console.error("Export error:", error);
      toast.error(error.response?.data?.message || "Không thể xuất file Excel");
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportConfigChange = (changedValues: any) => {
    setExportConfig((prev) => ({ ...prev, ...changedValues }));
  };

  const closeConfigModal = () => {
    setShowExportConfigModal(false);
    setExportLoading(false);
  };

  const isExportAllPages = () => {
    return form.getFieldValue("exportAllPages");
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return "";
    return moment(date).format("DD/MM/YYYY");
  };

  const formatDateTime = (datetime: string | undefined) => {
    if (!datetime) return "";
    return moment(datetime).format("DD/MM/YYYY HH:mm:ss");
  };

  const getActionColor = (action: string | undefined) => {
    if (!action) return "default";
    if (action.includes("Created")) return "green";
    if (action.includes("Updated") || action.includes("Approved"))
      return "blue";
    if (action.includes("Cancelled") || action.includes("Rejected"))
      return "red";
    return "default";
  };

  const getActionIcon = (action: string | undefined) => {
    if (!action) return <HistoryOutlined />;
    if (action.includes("Created")) return <PlusOutlined />;
    if (action.includes("Updated")) return <FormOutlined />;
    if (action.includes("Approved")) return <CheckCircleOutlined />;
    if (action.includes("Cancelled") || action.includes("Rejected"))
      return <CloseCircleOutlined />;
    return <HistoryOutlined />;
  };

  // Column visibility functions
  const handleColumnVisibilityChange = (key: string) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Toggle all columns visibility
  const toggleAllColumns = (checked: boolean) => {
    const newVisibility = { ...columnVisibility };
    Object.keys(newVisibility).forEach((key) => {
      newVisibility[key] = checked;
    });
    setColumnVisibility(newVisibility);
  };

  // Check if all columns are visible
  const areAllColumnsVisible = () => {
    return Object.values(columnVisibility).every((value) => value === true);
  };

  // Handle dropdown visibility
  const handleDropdownVisibleChange = (visible: boolean) => {
    setDropdownOpen(visible);
  };

  // Prevent dropdown from closing when clicking checkboxes
  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Add handler to open filter modal
  const handleOpenFilterModal = () => {
    setFilterModalVisible(true);
  };

  // Add handler for reset filters
  const handleReset = () => {
    setHealthCheckResultCode(undefined);
    setAction(undefined);
    setActionDateRange(null);
    setPerformedBySearch(undefined);
    setPreviousStatus(undefined);
    setNewStatus(undefined);
    setRejectionReason(undefined);
    setSortBy("ActionDate");
    setAscending(false);
    setCurrentPage(1);
  };

  // Handle back navigation
  const handleBack = () => {
    router.push("/health-check-result/management");
  };

  // Add filter modal handlers
  const handleApplyFilters = (filters: any) => {
    setHealthCheckResultCode(filters.healthCheckResultCode);
    setAction(filters.action);
    setActionDateRange(filters.actionDateRange);
    setPerformedBySearch(filters.performedBySearch);
    setPreviousStatus(filters.previousStatus);
    setNewStatus(filters.newStatus);
    setSortBy(filters.sortBy);
    setAscending(filters.ascending);
    setFilterModalVisible(false);
    setCurrentPage(1);
    fetchDistinctHealthCheckResults();
  };

  const handleResetFilters = () => {
    setHealthCheckResultCode(undefined);
    setAction(undefined);
    setActionDateRange(null);
    setPerformedBySearch(undefined);
    setPreviousStatus(undefined);
    setNewStatus(undefined);
    setRejectionReason(undefined);
    setSortBy("ActionDate");
    setAscending(false);
    setFilterModalVisible(false);
    setCurrentPage(1);
    fetchDistinctHealthCheckResults();
  };

  return (
    <Fragment>
      {contextHolder}
      <div className="p-6">
        {/* Header with back button and title */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={handleBack}
              style={{ marginRight: "8px" }}
            >
              Back
            </Button>
            <HistoryOutlined />
            <h3 className="text-xl font-bold">Health Check Result History</h3>
          </div>
        </div>

        {/* Toolbar Card */}
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
            <div className="flex flex-wrap items-center gap-4">
              {/* Result Code Filter */}
              <Input
                placeholder="Search by result code"
                value={healthCheckResultCode}
                onChange={(e) => setHealthCheckResultCode(e.target.value)}
                prefix={<SearchOutlined />}
                style={{ width: 200 }}
                allowClear
              />

              {/* Performed By Filter */}
              <Input
                placeholder="Search by performer"
                value={performedBySearch}
                onChange={(e) => setPerformedBySearch(e.target.value)}
                prefix={<SearchOutlined />}
                style={{ width: 200 }}
                allowClear
              />

              {/* Advanced Filters Button */}
              <Tooltip title="Advanced Filters">
                <Button
                  icon={
                    <FilterOutlined
                      style={{
                        color:
                          action ||
                          actionDateRange ||
                          previousStatus ||
                          newStatus ||
                          rejectionReason ||
                          sortBy !== "ActionDate" ||
                          ascending !== false
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

              {/* Reset Button */}
              <Tooltip title="Reset filters">
                <Button
                  icon={<UndoOutlined />}
                  onClick={handleReset}
                  disabled={
                    !(
                      healthCheckResultCode ||
                      performedBySearch ||
                      action ||
                      (actionDateRange && actionDateRange.length > 0) ||
                      previousStatus ||
                      newStatus ||
                      rejectionReason ||
                      sortBy !== "ActionDate" ||
                      ascending !== false
                    )
                  }
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
                            <strong>Show all columns</strong>
                          </Checkbox>
                        </div>
                      ),
                    },
                    {
                      key: "divider",
                      type: "divider",
                    },
                    {
                      key: "historyCode",
                      label: (
                        <div onClick={handleMenuClick}>
                          <Checkbox
                            checked={columnVisibility.historyCode}
                            onChange={() =>
                              handleColumnVisibilityChange("historyCode")
                            }
                          >
                            Result Code
                          </Checkbox>
                        </div>
                      ),
                    },
                    {
                      key: "action",
                      label: (
                        <div onClick={handleMenuClick}>
                          <Checkbox
                            checked={columnVisibility.action}
                            onChange={() =>
                              handleColumnVisibilityChange("action")
                            }
                          >
                            Action
                          </Checkbox>
                        </div>
                      ),
                    },
                    {
                      key: "actionDate",
                      label: (
                        <div onClick={handleMenuClick}>
                          <Checkbox
                            checked={columnVisibility.actionDate}
                            onChange={() =>
                              handleColumnVisibilityChange("actionDate")
                            }
                          >
                            Action Time
                          </Checkbox>
                        </div>
                      ),
                    },
                    {
                      key: "performedBy",
                      label: (
                        <div onClick={handleMenuClick}>
                          <Checkbox
                            checked={columnVisibility.performedBy}
                            onChange={() =>
                              handleColumnVisibilityChange("performedBy")
                            }
                          >
                            Performer
                          </Checkbox>
                        </div>
                      ),
                    },
                    {
                      key: "statusChange",
                      label: (
                        <div onClick={handleMenuClick}>
                          <Checkbox
                            checked={columnVisibility.statusChange}
                            onChange={() =>
                              handleColumnVisibilityChange("statusChange")
                            }
                          >
                            Status Change
                          </Checkbox>
                        </div>
                      ),
                    },
                    {
                      key: "details",
                      label: (
                        <div onClick={handleMenuClick}>
                          <Checkbox
                            checked={columnVisibility.details}
                            onChange={() =>
                              handleColumnVisibilityChange("details")
                            }
                          >
                            Details
                          </Checkbox>
                        </div>
                      ),
                    },
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
                <Tooltip title="Column settings">
                  <Button icon={<SettingOutlined />}>Columns</Button>
                </Tooltip>
              </Dropdown>

              {/* Search Button */}
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={() => {
                  setCurrentPage(1);
                  fetchDistinctHealthCheckResults();
                }}
              >
                Search
              </Button>
            </div>

            <div>
              {/* Export Button */}
              <Button
                type="primary"
                icon={<FileExcelOutlined />}
                onClick={handleExport}
                loading={exportLoading}
              >
                Export to Excel
              </Button>
            </div>
          </div>
        </Card>

        {/* Pagination Size Selection - Outside of cards */}
        <div className="flex justify-end items-center mb-4">
          <Typography.Text type="secondary">
            Groups per page:
            <Select
              value={pageSize}
              onChange={(value) => {
                setPageSize(value);
                setCurrentPage(1);
              }}
              style={{ marginLeft: 8, width: 70 }}
            >
              <Option value={5}>5</Option>
              <Option value={10}>10</Option>
              <Option value={15}>15</Option>
              <Option value={20}>20</Option>
            </Select>
          </Typography.Text>
        </div>

        {/* Results Display */}
        {loading ? (
          <Card className="shadow-sm">
            <Skeleton active paragraph={{ rows: 10 }} />
          </Card>
        ) : resultGroups.length > 0 ? (
          resultGroups.map((group) => (
            <Card key={group.code} className="shadow-sm mb-4">
              <div className="border-b pb-3 mb-4">
                <div className="flex justify-between items-center">
                  <Title level={5} className="m-0">
                    Health Check Result Code: {group.code}
                  </Title>
                  <Button
                    type="primary"
                    onClick={() =>
                      router.push(
                        `/health-check-result/${group.healthCheckResultId}`
                      )
                    }
                  >
                    View Health Check Result
                  </Button>
                </div>
              </div>

              {group.loading ? (
                <Skeleton active paragraph={{ rows: 5 }} />
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
                      items={group.histories.map((history) => ({
                        color: getActionColor(history.action),
                        dot: getActionIcon(history.action),
                        children: (
                          <Card
                            size="small"
                            className="mb-2 hover:shadow-md transition-shadow"
                          >
                            <div className="flex flex-col gap-2">
                              <div className="flex justify-between items-center">
                                <div className="font-medium">
                                  {history.action}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {formatDateTime(history.actionDate)}
                                </div>
                              </div>

                              <div className="grid grid-cols-1 gap-1">
                                <div className="flex">
                                  <div className="w-[180px] text-gray-500">
                                    Performer:
                                  </div>
                                  <div>
                                    {history.performedBy?.fullName} (
                                    {history.performedBy?.email})
                                  </div>
                                </div>

                                {history.previousStatus &&
                                  history.newStatus && (
                                    <div className="flex">
                                      <div className="w-[180px] text-gray-500">
                                        Status:
                                      </div>
                                      <div className="flex-1">
                                        <Tag
                                          color={getActionColor(
                                            history.previousStatus
                                          )}
                                        >
                                          {history.previousStatus}
                                        </Tag>
                                        <Text type="secondary"> → </Text>
                                        <Tag
                                          color={getActionColor(
                                            history.newStatus
                                          )}
                                        >
                                          {history.newStatus}
                                        </Tag>
                                      </div>
                                    </div>
                                  )}

                                {history.rejectionReason && (
                                  <div className="flex">
                                    <div className="w-[180px] text-gray-500">
                                      Reason:
                                    </div>
                                    <div className="flex-1">
                                      {history.rejectionReason}
                                    </div>
                                  </div>
                                )}

                                {history.changeDetails && (
                                  <div className="flex">
                                    <div className="w-[180px] text-gray-500">
                                      Details:
                                    </div>
                                    <div className="flex-1">
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
          ))
        ) : (
          <Card className="shadow-sm">
            <Empty description="No health check result history" />
          </Card>
        )}

        {/* Pagination Footer */}
        <Card className="mt-4 shadow-sm">
          <Row justify="space-between" align="middle">
            <Col>
              <Typography.Text type="secondary">
                Total {total} health check result groups
              </Typography.Text>
            </Col>
            <Col>
              <Space align="center" size="large">
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={total}
                  onChange={(page) => {
                    setCurrentPage(page);
                  }}
                  showSizeChanger={false}
                  showTotal={() => ""}
                />
                <Space align="center">
                  <Typography.Text type="secondary">
                    Go to page:
                  </Typography.Text>
                  <InputNumber
                    min={1}
                    max={Math.ceil(total / pageSize)}
                    value={currentPage}
                    onChange={(value: number | null) => {
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
            </Col>
          </Row>
        </Card>

        {/* Export Config Modal - Keep existing implementation */}
        <Modal
          title="Export Configuration"
          open={showExportConfigModal}
          onCancel={closeConfigModal}
          width={800}
          footer={[
            <Button key="cancel" onClick={closeConfigModal}>
              Cancel
            </Button>,
            <Button
              key="submit"
              type="primary"
              loading={exportLoading}
              onClick={handleExportWithConfig}
            >
              Export
            </Button>,
          ]}
        >
          {/* Keep existing Form implementation */}
          <Form
            form={form}
            layout="vertical"
            initialValues={exportConfig}
            onValuesChange={handleExportConfigChange}
          >
            {/* Keep existing form content */}
            <Row gutter={[16, 8]}>
              {/* Keep export configuration options */}
              {/* ... existing form fields ... */}
            </Row>
          </Form>
        </Modal>

        {/* Add Filter Modal */}
        <HistoryFilterModal
          visible={filterModalVisible}
          onCancel={() => setFilterModalVisible(false)}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
          filters={{
            healthCheckResultCode,
            action,
            actionDateRange,
            performedBySearch,
            previousStatus,
            newStatus,
            sortBy,
            ascending,
          }}
          uniqueHealthCheckCodes={uniqueHealthCheckCodes}
          uniquePerformers={uniquePerformers}
        />
      </div>
    </Fragment>
  );
};
