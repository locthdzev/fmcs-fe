import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
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
  Divider,
  Empty,
  Spin,
  Modal,
  Form,
  Checkbox,
  Collapse,
  Card,
  Radio,
  InputNumber,
} from "antd";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import {
  getAllTreatmentPlanHistories,
  TreatmentPlanHistoryResponseDTO,
  exportTreatmentPlanHistoriesToExcelWithConfig,
  TreatmentPlanHistoryExportConfigDTO,
  getTreatmentPlanHistoriesByTreatmentPlanId,
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
  EditOutlined,
  PlusOutlined,
  CaretRightOutlined,
  LinkOutlined,
  UndoOutlined,
  DeleteOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
} from "@ant-design/icons";
import { App } from "antd";

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
  const { message } = App.useApp();
  const [resultGroups, setResultGroups] = useState<TreatmentPlanGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [performedBySearch, setPerformedBySearch] = useState<string>("");
  const [treatmentPlanCode, setTreatmentPlanCode] = useState<string>("");
  const [healthCheckResultCode, setHealthCheckResultCode] =
    useState<string>("");
  const [actionDateRange, setActionDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null]
  >([null, null]);
  const [ascending, setAscending] = useState<boolean>(false);
  const [sortBy] = useState("ActionDate");
  const [showExportConfigModal, setShowExportConfigModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
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

  // Filter state to store temporary values
  const [filterState, setFilterState] = useState({
    healthCheckResultCode: "",
    performedBySearch: "",
    actionDateRange: [null, null] as [dayjs.Dayjs | null, dayjs.Dayjs | null],
    ascending: false,
  });

  // Add state for dropdown options
  const [uniqueTreatmentPlanCodes, setUniqueTreatmentPlanCodes] = useState<
    string[]
  >([]);
  const [uniqueHealthCheckCodes, setUniqueHealthCheckCodes] = useState<
    string[]
  >([]);
  const [uniquePerformers, setUniquePerformers] = useState<
    { id: string; fullName: string; email: string }[]
  >([]);

  const [form] = Form.useForm();

  // New function to get distinct treatment plan codes with pagination
  const getDistinctTreatmentPlanCodes = async (
    page: number,
    pageSize: number,
    filters: {
      treatmentPlanCode?: string;
      healthCheckResultCode?: string;
      actionStartDate?: string;
      actionEndDate?: string;
      performedBySearch?: string;
      sortBy?: string;
      ascending?: boolean;
    }
  ) => {
    try {
      // First, get all histories with the provided filters
      const response = await getAllTreatmentPlanHistories(
        1, // Start with page 1
        1000, // Get a large number of records to extract unique codes
        undefined, // action
        filters.actionStartDate,
        filters.actionEndDate,
        filters.performedBySearch,
        undefined,
        undefined,
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
            // Sử dụng tham số ascending để quyết định thứ tự sắp xếp
            const comparison =
              dayjs(aLatest.actionDate).unix() -
              dayjs(bLatest.actionDate).unix();
            return filters.ascending ? comparison : -comparison;
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
    console.log("Fetching with params:", {
      treatmentPlanCode,
      healthCheckResultCode,
      actionDateRange: actionDateRange
        ? [
            actionDateRange[0]?.format("YYYY-MM-DD"),
            actionDateRange[1]?.format("YYYY-MM-DD"),
          ]
        : [null, null],
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

      // Get distinct codes first
      const distinctCodesResult = await getDistinctTreatmentPlanCodes(
        currentPage,
        pageSize,
        {
          treatmentPlanCode,
          healthCheckResultCode,
          actionStartDate,
          actionEndDate,
          performedBySearch,
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

        // If no groups found, just stop loading
        if (groups.length === 0) {
          setLoading(false);
          return;
        }

        // Fetch detailed histories for each group
        for (const group of groups) {
          fetchHistoriesForTreatmentPlan(group.treatmentPlanId);
        }
      } else {
        message.error("Could not load treatment plan codes");
        setLoading(false);
      }
    } catch (error) {
      message.error("Could not load treatment plan codes");
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
        message.error(
          response.message || `Could not load histories for treatment plan`
        );
      }
    } catch (error) {
      message.error(`Could not load histories for treatment plan`);
    } finally {
      // Check if all groups are loaded
      setLoading((prevLoading) => {
        if (!prevLoading) return false;
        return resultGroups.some((group) => group.loading);
      });
    }
  };

  useEffect(() => {
    console.log("Pagination changed, fetching...");
    fetchDistinctTreatmentPlans();
  }, [currentPage, pageSize]);

  // Initial data fetch when component mounts
  useEffect(() => {
    console.log("Component mounted, initializing...");
    fetchUniqueValues();
    fetchDistinctTreatmentPlans();
  }, []);

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

        setUniqueTreatmentPlanCodes(Array.from(treatmentPlanCodesSet));
        setUniqueHealthCheckCodes(Array.from(healthCheckCodesSet));
        setUniquePerformers(Array.from(performersMap.values()));
      }
    } catch (error) {
      console.error("Error fetching unique values:", error);
      message.error("Failed to load filter options");
    }
  }, []);

  // Event handlers
  const handleSearch = () => {
    console.log("Searching with:", {
      treatmentPlanCode,
      healthCheckResultCode,
      performedBySearch,
      actionDateRange,
      ascending,
    });
    setCurrentPage(1);
    fetchDistinctTreatmentPlans();
  };

  const handleReset = () => {
    console.log("Resetting all filters and fetching new data");
    // Reset all actual filter values
    setPerformedBySearch("");
    setTreatmentPlanCode("");
    setHealthCheckResultCode("");
    setActionDateRange([null, null]);
    setCurrentPage(1);
    setAscending(false);

    // Reset filter state
    setFilterState({
      healthCheckResultCode: "",
      performedBySearch: "",
      actionDateRange: [null, null],
      ascending: false,
    });

    // Fetch data with reset filters - use setTimeout to ensure state updates first
    setTimeout(() => {
      fetchDistinctTreatmentPlans();
    }, 0);
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
    // Reset the form to default values when closing the modal
    form.resetFields();
  };

  const handleExportConfigChange = (changedValues: any) => {
    setExportConfig({ ...exportConfig, ...changedValues });
  };

  const openFilterModal = () => {
    // Initialize filter state with current values - ensure we always sync when opening modal
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
    // Apply filter state to actual state
    console.log("Applying filters from modal:", filterState);

    // Cập nhật các state thực với giá trị từ filterState
    setHealthCheckResultCode(filterState.healthCheckResultCode);
    setPerformedBySearch(filterState.performedBySearch);
    setActionDateRange(filterState.actionDateRange);
    setAscending(filterState.ascending);
    setCurrentPage(1);

    closeFilterModal();

    // Gọi API tìm kiếm với các bộ lọc mới
    // Cần đảm bảo sử dụng giá trị mới nhất từ filterState
    const actionStartDate =
      filterState.actionDateRange && filterState.actionDateRange[0]
        ? filterState.actionDateRange[0].format("YYYY-MM-DD")
        : undefined;

    const actionEndDate =
      filterState.actionDateRange && filterState.actionDateRange[1]
        ? filterState.actionDateRange[1].format("YYYY-MM-DD")
        : undefined;

    // Gọi API với giá trị từ filterState thay vì đợi state cập nhật
    getDistinctTreatmentPlanCodes(
      1, // Reset page to 1 when applying filters
      pageSize,
      {
        treatmentPlanCode,
        healthCheckResultCode: filterState.healthCheckResultCode,
        actionStartDate,
        actionEndDate,
        performedBySearch: filterState.performedBySearch,
        sortBy,
        ascending: filterState.ascending,
      }
    )
      .then((distinctCodesResult) => {
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

          // If no groups found, just stop loading
          if (groups.length === 0) {
            setLoading(false);
            return;
          }

          // Fetch detailed histories for each group
          for (const group of groups) {
            fetchHistoriesForTreatmentPlan(group.treatmentPlanId);
          }
        } else {
          message.error("Could not load treatment plan codes");
          setLoading(false);
        }
      })
      .catch((error) => {
        message.error("Could not load treatment plan codes");
        setLoading(false);
      });
  };

  const resetFilters = () => {
    console.log("Resetting filter state in modal and applying immediately");

    // Reset filter state trong modal
    setFilterState({
      healthCheckResultCode: "",
      performedBySearch: "",
      actionDateRange: [null, null],
      ascending: false,
    });

    // Cập nhật state thực (trừ treatmentPlanCode)
    setHealthCheckResultCode("");
    setPerformedBySearch("");
    setActionDateRange([null, null]);
    setAscending(false);
    setCurrentPage(1);

    closeFilterModal();

    // Gọi API với các bộ lọc đã reset nhưng giữ lại treatmentPlanCode
    // Cần đảm bảo sử dụng giá trị mới
    getDistinctTreatmentPlanCodes(
      1, // Reset page to 1
      pageSize,
      {
        treatmentPlanCode, // Giữ lại giá trị này
        healthCheckResultCode: "",
        actionStartDate: undefined,
        actionEndDate: undefined,
        performedBySearch: "",
        sortBy,
        ascending: false,
      }
    )
      .then((distinctCodesResult) => {
        // Xử lý kết quả như trong applyFilters
        if (distinctCodesResult.success) {
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

          if (groups.length === 0) {
            setLoading(false);
            return;
          }

          for (const group of groups) {
            fetchHistoriesForTreatmentPlan(group.treatmentPlanId);
          }
        } else {
          message.error("Could not load treatment plan codes");
          setLoading(false);
        }
      })
      .catch((error) => {
        message.error("Could not load treatment plan codes");
        setLoading(false);
      });
  };

  const handleExportWithConfig = async () => {
    setExportLoading(true);
    try {
      const values = await form.validateFields();

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

      // Extract filter values from form
      const exportTreatmentPlanCode = values.exportAllPages ? undefined : values.filterTreatmentPlanCode;
      const exportHealthCheckCode = values.exportAllPages ? undefined : values.filterHealthCheckResultCode;
      const exportPerformedBy = values.exportAllPages ? undefined : values.filterPerformedBy;
      // Always use the sort direction selected in modal, regardless of exportAllPages
      const exportAscending = values.filterSortDirection === "asc";
      const exportDateRange = values.exportAllPages ? actionDateRange : values.filterActionDateRange;

      const startActionDate =
        exportDateRange && exportDateRange[0]
          ? exportDateRange[0].format("YYYY-MM-DD")
          : undefined;

      const endActionDate =
        exportDateRange && exportDateRange[1]
          ? exportDateRange[1].format("YYYY-MM-DD")
          : undefined;

      console.log("Export sort direction:", values.filterSortDirection, "Ascending:", exportAscending);

      const response = await exportTreatmentPlanHistoriesToExcelWithConfig(
        exportConfigData,
        currentPage,
        pageSize,
        undefined,
        startActionDate,
        endActionDate,
        exportPerformedBy || performedBySearch,
        undefined,
        undefined,
        sortBy,
        exportAscending,
        exportTreatmentPlanCode || treatmentPlanCode,
        exportHealthCheckCode || healthCheckResultCode
      );

      if (response.success && response.data) {
        window.open(response.data, "_blank");
        message.success(
          "Treatment plan histories exported to Excel successfully"
        );
      } else {
        message.error(response.message || "Failed to export Excel file");
      }

      setExportConfig(exportConfigData);
      closeExportConfigModal();
    } catch (error) {
      console.error("Export error:", error);
      message.error("Failed to export Excel file");
    } finally {
      setExportLoading(false);
      closeExportConfigModal();
    }
  };

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
        return <EditOutlined />;
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

  const renderExportConfigModal = () => (
    <Modal
      title="Export Configuration"
      open={showExportConfigModal}
      onCancel={closeExportConfigModal}
      width={800}
      footer={[
        <Button key="cancel" onClick={closeExportConfigModal}>
          Cancel
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          loading={exportLoading}
          onClick={handleExportWithConfig}
        >
          Export
        </Button>
      ]}
      destroyOnClose={true}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          ...exportConfig,
          filterTreatmentPlanCode: treatmentPlanCode || null,
          filterHealthCheckResultCode: healthCheckResultCode || null,
          filterPerformedBy: performedBySearch || null,
          filterSortDirection: ascending ? "asc" : "desc",
          filterActionDateRange: actionDateRange,
          exportAllPages: true,
        }}
        onValuesChange={(changedValues, allValues) => {
          handleExportConfigChange(changedValues);
          // Update the display of filter section based on exportAllPages value
          if ('exportAllPages' in changedValues) {
            setExportConfig(prev => ({...prev, exportAllPages: changedValues.exportAllPages}));
          }
        }}
        preserve={false}
      >
        <Row gutter={[16, 8]}>
          <Col span={24}>
            <Typography.Title level={5}>Basic Options</Typography.Title>
          </Col>
          
          <Col span={24}>
            <Form.Item 
              name="exportAllPages" 
              valuePropName="checked"
              style={{ marginBottom: "12px" }}
            >
              <Checkbox>Export all data (ignore pagination)</Checkbox>
            </Form.Item>
          </Col>
          
          <Col span={24}>
            <div style={{ marginBottom: "16px" }}>
              <div
                className="filter-label"
                style={{ marginBottom: "8px", color: '#666666', display: "flex", alignItems: "center", gap: "6px" }}
              >
                <SortAscendingOutlined />
                <span>Sort direction</span>
              </div>
              <Form.Item 
                name="filterSortDirection"
                noStyle
              >
                <Radio.Group
                  optionType="button"
                  buttonStyle="solid"
                  style={{ width: "100%" }}
                >
                  <Radio.Button
                    value="asc"
                    style={{ width: "50%", textAlign: "center" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "4px",
                      }}
                    >
                      <SortAscendingOutlined />
                      <span>Oldest First</span>
                    </div>
                  </Radio.Button>
                  <Radio.Button
                    value="desc"
                    style={{ width: "50%", textAlign: "center" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "4px",
                      }}
                    >
                      <SortDescendingOutlined />
                      <span>Newest First</span>
                    </div>
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>
            </div>
          </Col>
          
          {/* Use Form.Item dependencies to properly update visibility */}
          <Form.Item dependencies={['exportAllPages']} noStyle>
            {({ getFieldValue }) => {
              const exportAll = getFieldValue('exportAllPages');
              return !exportAll ? (
                <>
                  <Col span={24}>
                    <Typography.Title level={5}>Data Filters</Typography.Title>
                  </Col>
                  
                  <Col span={12}>
                    <Form.Item 
                      label="Treatment Plan Code"
                      name="filterTreatmentPlanCode"
                    >
                      <Select
                        placeholder="Select Treatment Plan Code"
                        style={{ width: '100%' }}
                        allowClear
                        showSearch
                        filterOption={(input, option) =>
                          (option?.children as unknown as string)?.toLowerCase().indexOf(input.toLowerCase()) >= 0
                        }
                      >
                        {uniqueTreatmentPlanCodes.map(code => (
                          <Option key={code} value={code}>{code}</Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  
                  <Col span={12}>
                    <Form.Item 
                      label="Health Check Code"
                      name="filterHealthCheckResultCode"
                    >
                      <Select
                        placeholder="Select Health Check Code"
                        style={{ width: '100%' }}
                        allowClear
                        showSearch
                        filterOption={(input, option) =>
                          (option?.children as unknown as string)?.toLowerCase().indexOf(input.toLowerCase()) >= 0
                        }
                      >
                        {uniqueHealthCheckCodes.map(code => (
                          <Option key={code} value={code}>{code}</Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  
                  <Col span={12}>
                    <Form.Item 
                      label="Performed By"
                      name="filterPerformedBy"
                    >
                      <Select
                        placeholder="Select staff member"
                        style={{ width: '100%' }}
                        allowClear
                        showSearch
                        filterOption={(input, option) => {
                          try {
                            if (!option || !option.children) return false;
                            // For performers, we need to check the name in the nested structure
                            const performer = uniquePerformers.find(p => p.fullName === option.value);
                            if (performer) {
                              return performer.fullName.toLowerCase().includes(input.toLowerCase()) || 
                                     performer.email.toLowerCase().includes(input.toLowerCase());
                            }
                            return false;
                          } catch (error) {
                            return false;
                          }
                        }}
                      >
                        {uniquePerformers.map(performer => (
                          <Option 
                            key={performer.id} 
                            value={performer.fullName}
                          >
                            <div>
                              <div>{performer.fullName}</div>
                              <div style={{ fontSize: '12px', color: '#888' }}>{performer.email}</div>
                            </div>
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  
                  <Col span={12}>
                    <Form.Item 
                      label="Action Date Range"
                      name="filterActionDateRange"
                    >
                      <RangePicker
                        style={{ width: "100%" }}
                        placeholder={["From date", "To date"]}
                        format="DD/MM/YYYY"
                        allowClear
                        ranges={{
                          "Last 7 Days": [dayjs().subtract(6, "days"), dayjs()],
                          "Last 30 Days": [dayjs().subtract(29, "days"), dayjs()],
                          "This Month": [dayjs().startOf("month"), dayjs().endOf("month")],
                        }}
                      />
                    </Form.Item>
                  </Col>
                </>
              ) : null;
            }}
          </Form.Item>

          <Col span={24}>
            <Typography.Title level={5}>Include Fields</Typography.Title>
          </Col>

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

  const renderFilterModal = () => (
    <Modal
      title="Advanced Filters"
      open={showFilterModal}
      onOk={applyFilters}
      onCancel={closeFilterModal}
      width={600}
      footer={[
        <Button key="reset" onClick={resetFilters} icon={<UndoOutlined />}>
          Reset
        </Button>,
        <Button key="apply" type="primary" onClick={applyFilters} icon={<CheckCircleOutlined />}>
          Apply
        </Button>,
      ]}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <Title level={5}>Search Criteria</Title>
          <div style={{ marginBottom: '16px' }}>
            <div className="filter-item" style={{ marginBottom: "16px" }}>
              <div
                className="filter-label"
                style={{ marginBottom: "8px", color: '#666666' }}
              >
                Health check code
              </div>
              <Select
                showSearch
                placeholder="Select or search Health Check Code"
                value={filterState.healthCheckResultCode || undefined}
                onChange={(value) =>
                  setFilterState((prev) => ({
                    ...prev,
                    healthCheckResultCode: value || "",
                  }))
                }
                style={{ width: "100%" }}
                allowClear
                filterOption={(input, option) =>
                  (option?.label?.toString().toLowerCase() || "").includes(
                    input.toLowerCase()
                  )
                }
                options={uniqueHealthCheckCodes.map((code) => ({
                  value: code,
                  label: code,
                }))}
              />
            </div>

            <div className="filter-item">
              <div
                className="filter-label"
                style={{ marginBottom: "8px", color: '#666666' }}
              >
                Performed by
              </div>
              <Select
                showSearch
                placeholder="Select or search staff member"
                value={filterState.performedBySearch || undefined}
                onChange={(value) =>
                  setFilterState((prev) => ({
                    ...prev,
                    performedBySearch: value || "",
                  }))
                }
                style={{ width: "100%" }}
                allowClear
                filterOption={(input, option) =>
                  (option?.label?.toString().toLowerCase() || "").includes(
                    input.toLowerCase()
                  )
                }
                optionLabelProp="label"
                options={uniquePerformers.map((performer) => ({
                  value: performer.fullName,
                  label: `${performer.fullName} (${performer.email})`,
                  email: performer.email,
                }))}
              />
            </div>
          </div>
        </div>

        <div>
          <Title level={5}>Date & Sorting</Title>
          <div>
            <div className="filter-item" style={{ marginBottom: "16px" }}>
              <div
                className="filter-label"
                style={{ marginBottom: "8px", color: '#666666' }}
              >
                Action date range
              </div>
              <RangePicker
                style={{ width: "100%" }}
                placeholder={["From date", "To date"]}
                value={filterState.actionDateRange}
                onChange={(dates) =>
                  setFilterState((prev) => ({
                    ...prev,
                    actionDateRange: dates as [
                      dayjs.Dayjs | null,
                      dayjs.Dayjs | null
                    ],
                  }))
                }
                format="DD/MM/YYYY"
                allowClear
                ranges={{
                  "Last 7 Days": [dayjs().subtract(6, "days"), dayjs()],
                  "Last 30 Days": [dayjs().subtract(29, "days"), dayjs()],
                  "This Month": [
                    dayjs().startOf("month"),
                    dayjs().endOf("month"),
                  ],
                }}
              />
            </div>

            <div className="filter-item">
              <div
                className="filter-label"
                style={{ marginBottom: "8px", color: '#666666', display: "flex", alignItems: "center", gap: "6px" }}
              >
                <SortAscendingOutlined />
                <span>Sort direction</span>
              </div>
              <Radio.Group
                value={filterState.ascending ? "asc" : "desc"}
                onChange={(e) =>
                  setFilterState((prev) => ({
                    ...prev,
                    ascending: e.target.value === "asc",
                  }))
                }
                optionType="button"
                buttonStyle="solid"
                style={{ width: "100%" }}
              >
                <Radio.Button
                  value="asc"
                  style={{ width: "50%", textAlign: "center" }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                    }}
                  >
                    <SortAscendingOutlined />
                    <span>Oldest First</span>
                  </div>
                </Radio.Button>
                <Radio.Button
                  value="desc"
                  style={{ width: "50%", textAlign: "center" }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                    }}
                  >
                    <SortDescendingOutlined />
                    <span>Newest First</span>
                  </div>
                </Radio.Button>
              </Radio.Group>
            </div>
          </div>
        </div>
      </Space>
    </Modal>
  );

  return (
    <div className="history-container" style={{ padding: "20px" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>
            Back
          </Button>
          <HistoryOutlined style={{ fontSize: "24px" }} />
          <h3 className="text-2xl font-bold">Treatment Plan History</h3>
        </div>
      </div>

      <Card style={{ marginBottom: 20 }} className="shadow-sm">
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "4px",
            }}
          >
            <Title level={5} style={{ margin: 0 }}>
              Search & Filters
            </Title>
          </div>
          <div
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Select
                showSearch
                placeholder="Search Treatment Plan Code"
                value={treatmentPlanCode || undefined}
                onChange={(value) => {
                  // Lưu giá trị trước đó để so sánh
                  const prevValue = treatmentPlanCode;
                  console.log(
                    "Treatment Plan Code changing from",
                    prevValue,
                    "to:",
                    value
                  );
                  setTreatmentPlanCode(value || "");

                  // Gọi API trực tiếp tại đây, không sử dụng các state để đảm bảo giá trị mới nhất
                  const actionStartDate =
                    actionDateRange && actionDateRange[0]
                      ? actionDateRange[0].format("YYYY-MM-DD")
                      : undefined;

                  const actionEndDate =
                    actionDateRange && actionDateRange[1]
                      ? actionDateRange[1].format("YYYY-MM-DD")
                      : undefined;

                  // Reset về trang 1 khi tìm kiếm
                  setCurrentPage(1);
                  setLoading(true);

                  getDistinctTreatmentPlanCodes(1, pageSize, {
                    treatmentPlanCode: value || "",
                    healthCheckResultCode,
                    actionStartDate,
                    actionEndDate,
                    performedBySearch,
                    sortBy,
                    ascending,
                  })
                    .then((distinctCodesResult) => {
                      if (distinctCodesResult.success) {
                        const groups: TreatmentPlanGroup[] =
                          distinctCodesResult.codes.map((item) => ({
                            code: item.code,
                            treatmentPlanId: item.id,
                            histories: [],
                            loading: true,
                          }));

                        setResultGroups(groups);
                        setTotal(distinctCodesResult.total);

                        if (groups.length === 0) {
                          setLoading(false);
                          return;
                        }

                        for (const group of groups) {
                          fetchHistoriesForTreatmentPlan(group.treatmentPlanId);
                        }
                      } else {
                        message.error("Could not load treatment plan codes");
                        setLoading(false);
                      }
                    })
                    .catch((error) => {
                      message.error("Could not load treatment plan codes");
                      setLoading(false);
                    });
                }}
                style={{ width: "400px" }}
                allowClear
                filterOption={(input, option) =>
                  (option?.label?.toString().toLowerCase() || "").includes(
                    input.toLowerCase()
                  )
                }
                options={uniqueTreatmentPlanCodes.map((code) => ({
                  value: code,
                  label: code,
                }))}
                prefix={<SearchOutlined />}
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
            </div>

            <div style={{ marginLeft: "auto" }}>
              <Button
                type="primary"
                icon={<FileExcelOutlined />}
                onClick={handleOpenExportConfig}
              >
                Export to Excel
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px', gap: '8px', alignItems: 'center' }}>
        <Text type="secondary">Groups per page:</Text>
        <Select
          value={pageSize}
          onChange={(value) => {
            setPageSize(value);
            setCurrentPage(1);
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
            <Row justify="center" align="middle">
              <Space size="large" align="center">
                <Text type="secondary">
                  Total {total} items
                </Text>
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
                    max={Math.ceil(total/pageSize)} 
                    value={currentPage}
                    onChange={(value) => {
                      if (value && Number(value) > 0 && Number(value) <= Math.ceil(total/pageSize)) {
                        setCurrentPage(Number(value));
                      }
                    }}
                    style={{ width: '60px' }}
                  />
                </Space>
              </Space>
            </Row>
          </Card>
        </div>
      ) : (
        <Card className="shadow-sm">
          <Empty description="No treatment plan histories found with the specified criteria." />
        </Card>
      )}

      {renderExportConfigModal()}
      {renderFilterModal()}
    </div>
  );
}
