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
  Card,
  Typography,
  Tag,
  Tooltip,
  Divider,
  Empty,
  Spin,
  Modal,
  Form,
  Checkbox,
  Menu,
  Dropdown,
  Timeline,
  Collapse,
  InputNumber,
  message,
} from "antd";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import {
  getAllPrescriptionHistories,
  PrescriptionHistoryResponseDTO,
  exportPrescriptionHistoriesToExcelWithConfig,
  PrescriptionHistoryExportConfigDTO,
  PerformedByInfo,
  getGroupedPrescriptionHistories,
  GroupedPrescriptionHistoryResponseDTO,
} from "@/api/prescription";
import { useRouter } from "next/router";
import {
  SearchOutlined,
  ExportOutlined,
  EyeOutlined,
  FilterOutlined,
  FileExcelOutlined,
  UndoOutlined,
  TagOutlined,
  SettingOutlined,
  HistoryOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FormOutlined,
  PlusOutlined,
  CaretRightOutlined,
  LinkOutlined,
  DeleteOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import PageContainer from "../shared/PageContainer";
import PaginationFooter from "../shared/PaginationFooter";
import TableControls from "../shared/TableControls";
import ToolbarCard from "../shared/ToolbarCard";
import PrescriptionHistoryListFilterModal from "./PrescriptionHistoryListFilterModal";
import HistoryExportModal from "./HistoryExportModal";

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title, Text } = Typography;
const { Panel } = Collapse;

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
  if (!status) return "default";
  switch (status.toLowerCase()) {
    case "dispensed":
      return "processing";
    case "updated":
      return "warning";
    case "used":
    case "updatedandused":
      return "success";
    case "inactive":
      return "default";
    case "cancelled":
      return "error";
    case "softdeleted":
      return "default";
    default:
      return "default";
  }
};

const getActionColor = (action: string | undefined) => {
  if (!action) return "default";
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
    default:
      return <HistoryOutlined />;
  }
};

const DEFAULT_EXPORT_CONFIG = {
  exportAllPages: true,
  includePrescriptionCode: true,
  includeHealthCheckCode: true,
  includeAction: true,
  includeActionDate: true,
  includePerformedBy: true,
  includePreviousStatus: true,
  includeNewStatus: true,
  includeChangeDetails: true,
};

// Interfaces
interface PrescriptionGroup {
  code: string;
  prescriptionId: string;
  histories: PrescriptionHistoryResponseDTO[];
  loading: boolean;
}

export function PrescriptionHistoryList() {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();

  // Data states
  const [resultGroups, setResultGroups] = useState<PrescriptionGroup[]>([]);
  const [total, setTotal] = useState(0);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter states
  const [performedBySearch, setPerformedBySearch] = useState<string>("");
  const [prescriptionCode, setPrescriptionCode] = useState<string>("");
  const [healthCheckResultCode, setHealthCheckResultCode] = useState<string>("");
  const [actionDateRange, setActionDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);
  const [ascending, setAscending] = useState<boolean>(false);
  const [sortBy] = useState("ActionDate");

  // UI states
  const [loading, setLoading] = useState(true);
  const [showExportConfigModal, setShowExportConfigModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [filtersApplied, setFiltersApplied] = useState(false);

  // Dropdown options
  const [uniquePrescriptionCodes, setUniquePrescriptionCodes] = useState<string[]>([]);
  const [uniqueHealthCheckCodes, setUniqueHealthCheckCodes] = useState<string[]>([]);
  const [uniquePerformers, setUniquePerformers] = useState<{ id: string; fullName: string; email: string }[]>([]);

  // Export config state
  const [exportConfig, setExportConfig] = useState<PrescriptionHistoryExportConfigDTO>({
    exportAllPages: true,
    includePrescriptionCode: true,
    includeHealthCheckCode: true,
    includeAction: true,
    includeActionDate: true,
    includePerformedBy: true,
    includePreviousStatus: true,
    includeNewStatus: true,
    includeChangeDetails: true,
  });

  // Filter state
  const [filterState, setFilterState] = useState({
    healthCheckResultCode: "",
    performedBySearch: "",
    actionDateRange: [null, null] as [dayjs.Dayjs | null, dayjs.Dayjs | null],
    actionType: "",
    statusChange: "",
    ascending: false,
  });

  // Fetch histories
  const fetchGroupedPrescriptionHistories = useCallback(async () => {
    // Log the current filterState for debugging
    console.log("Current filterState:", filterState);
    
    console.log("Fetching grouped prescription histories with params:", {
      currentPage,
      pageSize,
      prescriptionCode,
      healthCheckResultCode,
      actionDateRange,
      performedBySearch,
      ascending,
      actionType: filterState.actionType,
      statusChange: filterState.statusChange,
    });

    setLoading(true);
    try {
      const actionStartDate = actionDateRange && actionDateRange[0] 
        ? actionDateRange[0].format("YYYY-MM-DD") 
        : undefined;

      const actionEndDate = actionDateRange && actionDateRange[1]
        ? actionDateRange[1].format("YYYY-MM-DD")
        : undefined;

      // Create direct variables for status parameters
      const actionTypeParam = filterState.actionType || undefined;
      
      // Xử lý đặc biệt cho từng loại status
      let previousStatusParam: string | undefined = undefined;
      let newStatusParam: string | undefined = undefined;
      
      if (filterState.statusChange === "Used") {
        console.log("Đang tìm kiếm theo status Used...");
        // Chỉ lọc theo newStatus, vì phần lớn các bản ghi quan trọng sẽ có newStatus là "Used"
        previousStatusParam = undefined;
        newStatusParam = "Used";
      } else if (filterState.statusChange === "Dispensed") {
        console.log("Đang tìm kiếm theo status Dispensed...");
        // Tìm kiếm Dispensed - thường là newStatus trong các bản ghi Created
        previousStatusParam = undefined;
        newStatusParam = "Dispensed";
      } else if (filterState.statusChange === "null") {
        // Khi người dùng chọn "No Previous Status", tìm các bản ghi có previousStatus là null
        // Vì API không chấp nhận null, chúng ta sẽ xử lý đặc biệt
        // Sử dụng chuỗi đặc biệt mà API có thể hiểu là tìm kiếm null values
        previousStatusParam = "NULL_VALUE"; // Giả sử API hiểu đây là tìm kiếm null
        newStatusParam = undefined; // Không lọc theo newStatus
      } else if (filterState.statusChange) {
        // Trường hợp thông thường - có thể lọc theo cả previousStatus hoặc newStatus
        previousStatusParam = filterState.statusChange;
        newStatusParam = filterState.statusChange;
      }
      
      // Xử lý trường hợp null/undefined nhưng không gán giá trị null trực tiếp
      // vì API yêu cầu kiểu string | undefined
      
      // Log the exact parameters being sent to the API
      console.log("API call parameters:", {
        currentPage,
        pageSize,
        action: actionTypeParam,
        startActionDate: actionStartDate,
        endActionDate: actionEndDate,
        performedBySearch,
        previousStatus: previousStatusParam,
        newStatus: newStatusParam,
        sortBy,
        ascending,
        prescriptionCode,
        healthCheckResultCode
      });

      const response = await getGroupedPrescriptionHistories(
        currentPage,
        pageSize,
        actionTypeParam,
        actionStartDate,
        actionEndDate,
        performedBySearch,
        previousStatusParam,
        newStatusParam,
        sortBy,
        ascending,
        prescriptionCode,
        healthCheckResultCode
      );

      console.log("API Response:", response);

      if (response.success || response.isSuccess) {
        const groupedData = response.data;
        console.log("Grouped Data:", groupedData);
        console.log("Có tổng cộng", groupedData?.length || 0, "nhóm dữ liệu trả về");
        
        // Kiểm tra cấu trúc dữ liệu trả về
        if (!groupedData) {
          console.error("API trả về dữ liệu undefined hoặc null");
          messageApi.error({
            content: "Dữ liệu trả về không hợp lệ",
            duration: 5,
          });
          setResultGroups([]);
          setTotal(0);
          setLoading(false);
          return;
        }
        
        // Phân tích và debug dữ liệu nhận được
        let totalHistories = 0;
        let historiesWithPreviousStatus = 0;
        let historiesWithNewStatus = 0;
        let uniquePreviousStatuses = new Set();
        let uniqueNewStatuses = new Set();
        
        if (Array.isArray(groupedData)) {
          groupedData.forEach(group => {
            if (group.historyDetails && Array.isArray(group.historyDetails)) {
              totalHistories += group.historyDetails.length;
              group.historyDetails.forEach((history: PrescriptionHistoryResponseDTO) => {
                if (history.previousStatus) {
                  historiesWithPreviousStatus++;
                  uniquePreviousStatuses.add(history.previousStatus);
                }
                if (history.newStatus) {
                  historiesWithNewStatus++;
                  uniqueNewStatuses.add(history.newStatus);
                }
              });
            }
          });
        }
        
        console.log("Thống kê dữ liệu nhận được:");
        console.log(`- Tổng số bản ghi: ${totalHistories}`);
        console.log(`- Bản ghi có previousStatus: ${historiesWithPreviousStatus}`);
        console.log(`- Bản ghi có newStatus: ${historiesWithNewStatus}`);
        console.log(`- Các giá trị previousStatus: ${Array.from(uniquePreviousStatuses).join(', ')}`);
        console.log(`- Các giá trị newStatus: ${Array.from(uniqueNewStatuses).join(', ')}`);
        
        if (filterState.statusChange) {
          console.log(`Chi tiết kết quả tìm với filter ${filterState.statusChange}:`);
          if (Array.isArray(groupedData)) {
            groupedData.forEach((group, idx) => {
              console.log(`Nhóm ${idx + 1} có ${group.historyDetails?.length || 0} bản ghi`);
              if (group.historyDetails && group.historyDetails.length > 0) {
                group.historyDetails.forEach((history: PrescriptionHistoryResponseDTO, i: number) => {
                  console.log(`  Record ${i+1}: action=${history.action}, previousStatus=${history.previousStatus}, newStatus=${history.newStatus}`); 
                });
              }
            });
          }
        }

        if (!Array.isArray(groupedData)) {
          console.log("No items found in grouped data");
          setResultGroups([]);
          setTotal(0);
          return;
        }

        // Create a map to group histories by prescription ID
        const prescriptionGroupsMap = new Map<string, PrescriptionGroup>();
        
        // Process all histories and group them by prescription ID
        groupedData.forEach(group => {
          group.historyDetails.forEach((history: PrescriptionHistoryResponseDTO) => {
            if (!history.prescription) return;
            
            const prescriptionId = history.prescription.id;
            
            if (!prescriptionGroupsMap.has(prescriptionId)) {
              prescriptionGroupsMap.set(prescriptionId, {
                code: history.prescription.prescriptionCode,
                prescriptionId: prescriptionId,
                histories: [],
                loading: false,
              });
            }
            
            // Add this history to its prescription group
            const prescriptionGroup = prescriptionGroupsMap.get(prescriptionId);
            if (prescriptionGroup) {
              prescriptionGroup.histories.push(history);
            }
          });
        });
        
        // Convert map to array and sort by latest action date
        let groups = Array.from(prescriptionGroupsMap.values());
        
        // Sort groups by most recent action
        groups = groups.sort((a, b) => {
          const aLatestDate = a.histories.length > 0
            ? Math.max(...a.histories.map(h => new Date(h.actionDate).getTime()))
            : 0;
          const bLatestDate = b.histories.length > 0
            ? Math.max(...b.histories.map(h => new Date(h.actionDate).getTime()))
            : 0;

          return ascending ? aLatestDate - bLatestDate : bLatestDate - aLatestDate;
        });

        setResultGroups(groups);
        setTotal(response.data.totalRecords || groups.length);
      } else {
        messageApi.error({
          content: response.message || "Could not load prescription histories",
          duration: 5,
        });
      }
    } catch (error) {
      console.error("Error fetching grouped histories:", error);
      messageApi.error({
        content: "Failed to load prescription histories",
        duration: 5,
      });
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    pageSize,
    ascending,
    prescriptionCode,
    healthCheckResultCode,
    performedBySearch,
    actionDateRange,
    sortBy,
    messageApi,
    filterState.actionType,
    filterState.statusChange,
  ]);

  // Fetch dropdown values for filters
  const fetchUniqueValues = useCallback(async () => {
    try {
      const response = await getAllPrescriptionHistories(
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

        const prescriptionCodesSet = new Set<string>();
        const healthCheckCodesSet = new Set<string>();
        const performersMap = new Map<string, { id: string; fullName: string; email: string }>();

        histories.forEach((history: PrescriptionHistoryResponseDTO) => {
          if (history.prescription) {
            prescriptionCodesSet.add(history.prescription.prescriptionCode);
            if (history.prescription.healthCheckResult) {
              // Only add codes that start with HCR- or CHK- to the health check codes set
              const healthCheckCode = history.prescription.healthCheckResult.healthCheckResultCode;
              if (healthCheckCode && (healthCheckCode.startsWith('HCR-') || healthCheckCode.startsWith('CHK-'))) {
                healthCheckCodesSet.add(healthCheckCode);
              }
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

        setUniquePrescriptionCodes(Array.from(prescriptionCodesSet));
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
    // Reset individual filter states
    setPerformedBySearch("");
    setPrescriptionCode("");
    setHealthCheckResultCode("");
    setActionDateRange([null, null]);
    setCurrentPage(1);
    setAscending(false);

    // Reset the filter state object that contains actionType and statusChange
    setFilterState({
      healthCheckResultCode: "",
      performedBySearch: "",
      actionDateRange: [null, null],
      actionType: "",
      statusChange: "",
      ascending: false,
    });

    // Update UI states
    setLoading(true);
    setFiltersApplied(true);
    
    // Use setTimeout to ensure all state updates are processed before fetching data
    setTimeout(() => {
      fetchGroupedPrescriptionHistories();
    }, 0);
  };

  const handlePageChange = (page: number, newPageSize?: number) => {
    setCurrentPage(page);
    if (newPageSize) setPageSize(newPageSize);
    setLoading(true);
  };

  // Filter modal handlers
  const openFilterModal = () => {
    console.log("Opening filter modal with current filterState:", filterState);
    console.log("Current filters - statusChange:", filterState.statusChange, "actionType:", filterState.actionType);
    
    // Lưu trữ các giá trị hiện tại từ các state riêng lẻ
    const updatedFilterState = {
      healthCheckResultCode: healthCheckResultCode || "",
      performedBySearch: performedBySearch || "",
      actionDateRange: actionDateRange || [null, null],
      actionType: filterState.actionType || "", 
      statusChange: filterState.statusChange || "",
      ascending: ascending,
    };
    
    console.log("Setting filter state to:", updatedFilterState);
    setFilterState(updatedFilterState);
    setShowFilterModal(true);
  };

  const closeFilterModal = () => {
    setShowFilterModal(false);
  };

  const applyFilters = () => {
    console.log("Applying filters with filterState:", filterState);
    console.log("Status Change value:", filterState.statusChange, 
      "type:", typeof filterState.statusChange,
      "isEmpty:", filterState.statusChange === "",
      "isUndefined:", filterState.statusChange === undefined);
    
    setHealthCheckResultCode(filterState.healthCheckResultCode);
    setPerformedBySearch(filterState.performedBySearch);
    setActionDateRange(filterState.actionDateRange);
    setAscending(filterState.ascending);
    setCurrentPage(1);
    
    closeFilterModal();
    setLoading(true);
    setFiltersApplied(true);
    
    // Đặt stateChanged flag để đảm bảo useEffect trigger
    console.log("Filters applied, now calling fetchGroupedPrescriptionHistories directly");
    
    // Gọi trực tiếp fetchGroupedPrescriptionHistories
    setTimeout(() => {
      fetchGroupedPrescriptionHistories();
    }, 0);
  };

  const resetFilters = () => {
    setFilterState({
      healthCheckResultCode: "",
      performedBySearch: "",
      actionDateRange: [null, null],
      actionType: "",
      statusChange: "",
      ascending: false,
    });

    setHealthCheckResultCode("");
    setPerformedBySearch("");
    setActionDateRange([null, null]);
    setAscending(false);
    setCurrentPage(1);
    closeFilterModal();
    setLoading(true);
    setFiltersApplied(true);
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
  };

  const handleExportWithConfig = async () => {
    setExportLoading(true);
    try {
      const values = await form.validateFields();

      const exportConfigData: PrescriptionHistoryExportConfigDTO = {
        exportAllPages: values.exportAllPages,
        includePrescriptionCode: values.includePrescriptionCode,
        includeHealthCheckCode: values.includeHealthCheckCode,
        includeAction: values.includeAction,
        includeActionDate: values.includeActionDate,
        includePerformedBy: values.includePerformedBy,
        includePreviousStatus: values.includePreviousStatus,
        includeNewStatus: values.includeNewStatus,
        includeChangeDetails: values.includeChangeDetails,
      };

      const actionStartDate = actionDateRange && actionDateRange[0]
        ? actionDateRange[0].format("YYYY-MM-DD")
        : undefined;

      const actionEndDate = actionDateRange && actionDateRange[1]
        ? actionDateRange[1].format("YYYY-MM-DD")
        : undefined;

      const response = await exportPrescriptionHistoriesToExcelWithConfig(
        exportConfigData,
        currentPage,
        pageSize,
        undefined,
        actionStartDate,
        actionEndDate,
        performedBySearch,
        undefined,
        undefined,
        sortBy,
        ascending,
        prescriptionCode,
        healthCheckResultCode
      );

      if (response.success) {
        messageApi.success("Export successful");
      closeExportConfigModal();
      } else {
        messageApi.error(response.message || "Export failed");
      }
    } catch (error) {
      console.error("Export error:", error);
      messageApi.error("Export failed");
    } finally {
      setExportLoading(false);
    }
  };

  // useEffect hooks
  useEffect(() => {
    if (uniquePrescriptionCodes.length === 0) {
      fetchUniqueValues();
    }

    // Only fetch if it's not due to filterState changes
    // or if filters were explicitly applied
    const timer = setTimeout(() => {
      if (filtersApplied) {
        // Reset the flag
        setFiltersApplied(false);
      }
      fetchGroupedPrescriptionHistories();
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [
    currentPage,
    pageSize,
    prescriptionCode,
    healthCheckResultCode,
    performedBySearch,
    actionDateRange,
    ascending,
    fetchGroupedPrescriptionHistories,
    fetchUniqueValues,
    uniquePrescriptionCodes.length,
    filtersApplied,  // Add filtersApplied instead of filterState properties
  ]);

  // Main render
  return (
    <PageContainer
      title="Prescription History"
      onBack={() => router.back()}
      icon={<HistoryOutlined style={{ fontSize: "24px", marginRight: "8px" }} />}
    >
      {contextHolder}
      <Card
        className="shadow mb-4"
        bodyStyle={{ padding: "16px" }}
        style={{ borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
            >
        <Row align="middle" gutter={[16, 16]}>
          <Col span={24}>
            <Title level={4} style={{ margin: 0 }}>
              <AppstoreOutlined style={{ marginRight: "8px", fontSize: "20px" }} />
              Toolbar
            </Title>
          </Col>
        </Row>

        <Divider style={{ margin: "16px 0" }} />

        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Select
              showSearch
              placeholder="Search Prescription Code"
              value={prescriptionCode || undefined}
              onChange={(value) => {
                setPrescriptionCode(value || "");
                setCurrentPage(1);
                setLoading(true);
              }}
              style={{ width: "320px" }}
              prefix={<SearchOutlined style={{color: "blue"}}/>}
              allowClear
              filterOption={(input, option) =>
                (option?.value?.toString().toLowerCase() || "").includes(
                  input.toLowerCase()
                )
              }
              options={uniquePrescriptionCodes.map((code) => ({
                value: code,
                label: code,
              }))}
              dropdownStyle={{ minWidth: "320px" }}
            />

            <Tooltip title="Advanced Filters">
              <Button
                icon={<FilterOutlined style={{
                  color: healthCheckResultCode ||
                    performedBySearch ||
                    (actionDateRange && (actionDateRange[0] || actionDateRange[1]))
                    ? "#1890ff"
                    : undefined,
                }} />}
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
                    prescriptionCode ||
                    healthCheckResultCode ||
                    performedBySearch ||
                    filterState.actionType ||
                    filterState.statusChange ||
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
            <Card key={group.prescriptionId} className="shadow mb-4">
              <div className="border-b pb-3 mb-4">
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}>
                  <Space size="large">
                    <span>
                      <Text type="secondary">Prescription:</Text>{" "}
                      <Button
                        type="link"
                        onClick={() => router.push(`/prescription/${group.prescriptionId}`)}
                        style={{ padding: 0 }}
                      >
                        {group.code}
                      </Button>
                    </span>

                    {/* Find the most recent history entry that has health check info */}
                    {(() => {
                      const historyWithHealthCheck = group.histories.find(
                        h => h.prescription?.healthCheckResult?.healthCheckResultCode
                      );
                      
                      return historyWithHealthCheck && historyWithHealthCheck.prescription && historyWithHealthCheck.prescription.healthCheckResult ? (
                        <>
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            color: "#8c8c8c",
                          }}>
                            <LinkOutlined style={{ fontSize: "14px" }} />
                          </div>
                          <span>
                            <Text type="secondary">Health Check:</Text>{" "}
                            <Button
                              type="link"
                              onClick={() => {
                                if (historyWithHealthCheck?.prescription?.healthCheckResult?.id) {
                                  router.push(`/health-check-result/${historyWithHealthCheck.prescription.healthCheckResult.id}`);
                                }
                              }}
                              style={{ padding: 0 }}
                            >
                              {historyWithHealthCheck?.prescription?.healthCheckResult?.healthCheckResultCode}
                            </Button>
                          </span>
                        </>
                      ) : null;
                    })()}
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
                          const comparison = dayjs(a.actionDate).unix() - dayjs(b.actionDate).unix();
                          return ascending ? comparison : -comparison;
                        })
                        .map((history) => {
                          console.log("Processing history item:", {
                            id: history.id,
                            action: history.action,
                            previousStatus: history.previousStatus,
                            newStatus: history.newStatus,
                            hasNewStatus: !!history.newStatus,
                            hasPreviousStatus: !!history.previousStatus
                          });
                          
                          return {
                            color: getActionColor(history.action),
                            dot: getActionIcon(history.action),
                            children: (
                              <Card
                                size="small"
                                className="mb-2 hover:shadow-md transition-shadow"
                              >
                                <div style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "8px",
                                }}>
                                  <div style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                  }}>
                                    <div style={{ fontWeight: 500 }}>
                                      {history.action}
                                    </div>
                                    <div style={{
                                      fontSize: "14px",
                                      color: "#8c8c8c",
                                    }}>
                                      {formatDateTime(history.actionDate)}
                                    </div>
                                  </div>

                                  <div style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr",
                                    gap: "4px",
                                  }}>
                                    <div style={{ display: "flex" }}>
                                      <div style={{
                                        width: "180px",
                                        color: "#8c8c8c",
                                      }}>
                                        Performed by:
                                      </div>
                                      <div>
                                        {"System"}
                                      </div>
                                    </div>

                                    {/* Hiển thị status change khi có cả previousStatus và newStatus */}
                                    {history.previousStatus && history.newStatus && (
                                      <div style={{ display: "flex" }}>
                                        <div style={{
                                          width: "180px",
                                          color: "#8c8c8c",
                                        }}>
                                          Status change:
                                        </div>
                                        <div style={{ flex: 1 }}>
                                          <Tag color={getStatusColor(history.previousStatus)}>
                                            {history.previousStatus}
                                          </Tag>
                                          <Text type="secondary"> → </Text>
                                          <Tag color={getStatusColor(history.newStatus)}>
                                            {history.newStatus}
                                          </Tag>
                                        </div>
                                      </div>
                                    )}

                                    {/* Hiển thị status khi chỉ có newStatus */}
                                    {(!history.previousStatus || history.previousStatus === "null") && history.newStatus && (
                                      <div style={{ display: "flex" }}>
                                        <div style={{
                                          width: "180px",
                                          color: "#8c8c8c",
                                        }}>
                                          Status:
                                        </div>
                                        <div style={{ flex: 1 }}>
                                          <Tag color={getStatusColor(history.newStatus)}>
                                            {history.newStatus}
                                          </Tag>
                                        </div>
                                      </div>
                                    )}

                                    {history.changeDetails && (
                                      <div style={{ display: "flex" }}>
                                        <div style={{
                                          width: "180px",
                                          color: "#8c8c8c",
                                        }}>
                                          Details:
                                        </div>
                                        <div style={{
                                          flex: 1,
                                          whiteSpace: "pre-wrap",
                                        }}>
                                          {history.changeDetails}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </Card>
                            ),
                          };
                        })}
                    />
                  </Panel>
                </Collapse>
              )}
            </Card>
          ))}

          <PaginationFooter
            current={currentPage}
            pageSize={pageSize}
            total={total}
            onChange={handlePageChange}
            showGoToPage={true}
            showTotal={true}
            useItemsLabel={true}
          />
        </div>
      ) : (
        <Card className="shadow mb-4">
          <Empty description="No prescription histories found" />
        </Card>
      )}

      {/* Filter Modal */}
      <PrescriptionHistoryListFilterModal
        visible={showFilterModal}
        filterState={filterState}
        setFilterState={setFilterState}
        uniqueHealthCheckCodes={uniqueHealthCheckCodes}
        uniquePerformers={uniquePerformers}
        onClose={closeFilterModal}
        onApply={applyFilters}
        onReset={resetFilters}
      />

      {/* Export Modal */}
      <HistoryExportModal
        visible={showExportConfigModal}
        onClose={closeExportConfigModal}
        config={exportConfig}
        onChange={handleExportConfigChange}
        filters={{
          currentPage,
          pageSize,
          action: filterState.actionType,
          performedBySearch,
          previousStatus: filterState.statusChange,
          newStatus: filterState.statusChange,
          sortBy,
          ascending,
          actionDateRange,
          prescriptionCode,
          healthCheckResultCode,
        }}
        prescriptionCodes={uniquePrescriptionCodes}
        healthCheckCodes={uniqueHealthCheckCodes}
        performedByOptions={uniquePerformers}
        statusOptions={["Dispensed", "Updated", "Used", "Updated and Used", "Cancelled", "Soft Deleted"]}
        actionOptions={["Created", "Updated", "Cancelled", "Soft Deleted", "Restored"]}
      />
    </PageContainer>
  );
}
