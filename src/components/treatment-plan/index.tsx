import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Space,
  Tag,
  Input,
  DatePicker,
  Select,
  Card,
  Row,
  Col,
  Statistic,
  Modal,
  Form,
  message,
  Tooltip,
  Popconfirm,
  Switch,
  Typography,
  Tabs,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  HistoryOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  ReloadOutlined,
  SearchOutlined,
  UndoOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";
import moment from "moment";
import { toast } from "react-toastify";
import CreateModal from "./CreateModal";
import ExportConfigModal from "./ExportConfigModal";
import {
  getAllTreatmentPlans,
  getTreatmentPlanById,
  updateTreatmentPlan,
  cancelTreatmentPlan,
  softDeleteTreatmentPlans,
  restoreSoftDeletedTreatmentPlans,
  getTreatmentPlanStatistics,
  exportTreatmentPlanToPDF,
  exportTreatmentPlansToExcelWithConfig,
  TreatmentPlanResponseDTO,
  TreatmentPlanStatisticsDTO,
  TreatmentPlanExportConfigDTO,
  UserInfo,
} from "@/api/treatment-plan";
import { DrugResponse, getDrugs } from "@/api/drug";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";
import { getUsers, UserProfile } from "@/api/user";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title } = Typography;
const { TabPane } = Tabs;
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

export function TreatmentPlanManagement() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [treatmentPlans, setTreatmentPlans] = useState<
    TreatmentPlanResponseDTO[]
  >([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [exportConfigModalVisible, setExportConfigModalVisible] =
    useState(false);
  const [selectedTreatmentPlans, setSelectedTreatmentPlans] = useState<
    string[]
  >([]);
  const [statistics, setStatistics] =
    useState<TreatmentPlanStatisticsDTO | null>(null);
  const [searchForm] = Form.useForm();
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >({
    treatmentPlanCode: true,
    healthCheckResult: true,
    drug: true,
    treatmentDescription: true,
    instructions: true,
    startDate: true,
    endDate: true,
    status: true,
    createdAt: true,
    updatedAt: true,
    createdBy: true,
    updatedBy: true,
  });

  // Search filters
  const [treatmentPlanCodeSearch, setTreatmentPlanCodeSearch] = useState<string>("");
  const [healthCheckResultCodeSearch, setHealthCheckResultCodeSearch] = useState<string>("");
  const [userSearch, setUserSearch] = useState<string>("");
  const [drugSearch, setDrugSearch] = useState<string>("");
  const [updatedBySearch, setUpdatedBySearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dateRange, setDateRange] = useState<[moment.Moment, moment.Moment] | null>(null);
  const [createdDateRange, setCreatedDateRange] = useState<[moment.Moment, moment.Moment] | null>(null);
  const [updatedDateRange, setUpdatedDateRange] = useState<[moment.Moment, moment.Moment] | null>(null);
  const [sortBy, setSortBy] = useState<string>("StartDate");
  const [ascending, setAscending] = useState<boolean>(false);

  // Drug and user options
  const [userOptions, setUserOptions] = useState<UserInfo[]>([]);
  const [drugOptions, setDrugOptions] = useState<DrugResponse[]>([]);
  const [treatmentPlanCodes, setTreatmentPlanCodes] = useState<string[]>([]);
  const [healthCheckCodes, setHealthCheckCodes] = useState<string[]>([]);
  const [updatedByOptions, setUpdatedByOptions] = useState<UserInfo[]>([]);

  // Export config
  const [exportConfig, setExportConfig] =
    useState<TreatmentPlanExportConfigDTO>({
      exportAllPages: false,
      includePatient: true,
      includeHealthCheckCode: true,
      includeDrug: true,
      includeTreatmentDescription: true,
      includeInstructions: true,
      includeStartDate: true,
      includeEndDate: true,
      includeCreatedAt: true,
      includeCreatedBy: true,
      includeUpdatedAt: true,
      includeUpdatedBy: true,
      includeStatus: true,
    });

  useEffect(() => {
    fetchTreatmentPlans();
    fetchStatistics();
  }, [
    currentPage,
    pageSize,
    treatmentPlanCodeSearch,
    healthCheckResultCodeSearch,
    userSearch,
    drugSearch,
    updatedBySearch,
    statusFilter,
    dateRange,
    createdDateRange,
    updatedDateRange,
    sortBy,
    ascending,
  ]);

  // Update the form values when any of the search parameters change
  useEffect(() => {
    searchForm.setFieldsValue({
      treatmentPlanCode: treatmentPlanCodeSearch,
      healthCheckResultCode: healthCheckResultCodeSearch,
      userSearch: userSearch,
      drugSearch: drugSearch,
      updatedBySearch: updatedBySearch,
      status: statusFilter,
      dateRange: dateRange,
      createdDateRange: createdDateRange,
      updatedDateRange: updatedDateRange,
      sortBy: sortBy,
      ascending: ascending,
    });
  }, [
    treatmentPlanCodeSearch,
    healthCheckResultCodeSearch,
    userSearch,
    drugSearch,
    updatedBySearch,
    statusFilter,
    dateRange,
    createdDateRange,
    updatedDateRange,
    sortBy,
    ascending,
  ]);

  const fetchTreatmentPlans = async () => {
    setLoading(true);
    try {
      const startDate = dateRange?.[0]?.format("YYYY-MM-DD");
      const endDate = dateRange?.[1]?.format("YYYY-MM-DD");
      const createdStartDate = createdDateRange?.[0]?.format("YYYY-MM-DD");
      const createdEndDate = createdDateRange?.[1]?.format("YYYY-MM-DD");
      const updatedStartDate = updatedDateRange?.[0]?.format("YYYY-MM-DD");
      const updatedEndDate = updatedDateRange?.[1]?.format("YYYY-MM-DD");

      const response = await getAllTreatmentPlans(
        currentPage,
        pageSize,
        treatmentPlanCodeSearch,
        healthCheckResultCodeSearch,
        userSearch,
        drugSearch,
        updatedBySearch,
        sortBy,
        ascending,
        statusFilter,
        startDate,
        endDate,
        createdStartDate,
        createdEndDate,
        updatedStartDate,
        updatedEndDate
      );

      if (response.success || response.isSuccess) {
        let treatmentPlanData: TreatmentPlanResponseDTO[] = [];
        
        if (Array.isArray(response.data)) {
          treatmentPlanData = response.data;
          setTreatmentPlans(response.data);
          setTotalItems(response.totalRecords || 0);
        } else if (response.data && Array.isArray(response.data.items)) {
          treatmentPlanData = response.data.items;
          setTreatmentPlans(response.data.items);
          setTotalItems(
            response.data.totalItems || response.data.totalCount || 0
          );
        } else {
          console.error("Unexpected data structure:", response.data);
          setTreatmentPlans([]);
          setTotalItems(0);
          toast.error("Unexpected data structure received");
        }
        
        // Extract unique data from treatment plans
        extractDataFromTreatmentPlans(treatmentPlanData);
      } else {
        toast.error(response.message || "Failed to fetch treatment plans");
      }
    } catch (error) {
      console.error("Error fetching treatment plans:", error);
      toast.error("Failed to fetch treatment plans");
    } finally {
      setLoading(false);
    }
  };

  // Extract unique data from treatment plans
  const extractDataFromTreatmentPlans = (treatmentPlans: TreatmentPlanResponseDTO[]) => {
    if (!treatmentPlans.length) return;
    
    // Extract unique values
    const uniquePatients = new Map();
    const uniqueDrugs = new Map();
    const uniqueTreatmentPlanCodes = new Set<string>();
    const uniqueHealthCheckCodes = new Set<string>();
    const uniqueUpdatedBy = new Map();
    
    treatmentPlans.forEach(plan => {
      // Extract treatment plan code
      if (plan.treatmentPlanCode) {
        uniqueTreatmentPlanCodes.add(plan.treatmentPlanCode);
      }
      
      // Extract health check code
      if (plan.healthCheckResult?.healthCheckResultCode) {
        uniqueHealthCheckCodes.add(plan.healthCheckResult.healthCheckResultCode);
      }
      
      // Extract patient info
      if (plan.healthCheckResult?.user) {
        const user = plan.healthCheckResult.user;
        if (!uniquePatients.has(user.id)) {
          uniquePatients.set(user.id, {
            id: user.id,
            fullName: user.fullName,
            userName: user.userName,
            email: user.email,
            gender: user.gender,
            dob: user.dob,
            address: user.address,
            phone: user.phone
          });
        }
      }
      
      // Extract drug info
      if (plan.drug) {
        const drug = plan.drug;
        if (!uniqueDrugs.has(drug.id)) {
          uniqueDrugs.set(drug.id, {
            id: drug.id,
            name: drug.name,
            drugCode: drug.drugCode
          });
        }
      }
      
      // Extract updated by info
      if (plan.updatedBy) {
        const updatedBy = plan.updatedBy;
        if (!uniqueUpdatedBy.has(updatedBy.id)) {
          uniqueUpdatedBy.set(updatedBy.id, {
            id: updatedBy.id,
            fullName: updatedBy.fullName,
            userName: updatedBy.userName,
            email: updatedBy.email
          });
        }
      }
    });
    
    // Update the state with unique data
    setUserOptions(Array.from(uniquePatients.values()));
    setDrugOptions(Array.from(uniqueDrugs.values()));
    setTreatmentPlanCodes(Array.from(uniqueTreatmentPlanCodes));
    setHealthCheckCodes(Array.from(uniqueHealthCheckCodes));
    setUpdatedByOptions(Array.from(uniqueUpdatedBy.values()));
  };

  const fetchStatistics = async () => {
    try {
      const response = await getTreatmentPlanStatistics();
      if (response.success || response.isSuccess) {
        setStatistics({
          totalTreatmentPlans: response.data.totalCount || 0,
          totalActiveTreatmentPlans:
            response.data.statusDistribution?.InProgress || 0,
          totalCompletedTreatmentPlans:
            response.data.statusDistribution?.Completed || 0,
          totalCancelledTreatmentPlans:
            response.data.statusDistribution?.Cancelled || 0,
          treatmentPlansByStatus: response.data.statusDistribution || {},
          treatmentPlansByMonth: response.data.monthlyDistribution || {},
          treatmentPlansByDrug: response.data.top5Drugs || {},
          treatmentPlansByUser: response.data.top5Staff || {},
        });
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  // Handle form field changes
  const handleFormFieldChange = (field: string, value: any) => {
    switch (field) {
      case 'treatmentPlanCode':
        setTreatmentPlanCodeSearch(value);
        break;
      case 'healthCheckResultCode':
        setHealthCheckResultCodeSearch(value);
        break;
      case 'userSearch':
        setUserSearch(value);
        break;
      case 'drugSearch':
        setDrugSearch(value);
        break;
      case 'updatedBySearch':
        setUpdatedBySearch(value);
        break;
      case 'status':
        setStatusFilter(value);
        break;
      case 'dateRange':
        setDateRange(value);
        break;
      case 'createdDateRange':
        setCreatedDateRange(value);
        break;
      case 'updatedDateRange':
        setUpdatedDateRange(value);
        break;
      case 'sortBy':
        setSortBy(value);
        break;
      case 'ascending':
        setAscending(value);
        break;
      default:
        break;
    }
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleReset = () => {
    searchForm.resetFields();
    setTreatmentPlanCodeSearch("");
    setHealthCheckResultCodeSearch("");
    setUserSearch("");
    setDrugSearch("");
    setUpdatedBySearch("");
    setStatusFilter("");
    setDateRange(null);
    setCreatedDateRange(null);
    setUpdatedDateRange(null);
    setSortBy("StartDate");
    setAscending(false);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number, pageSize?: number) => {
    setCurrentPage(page);
    if (pageSize) setPageSize(pageSize);
  };

  const handleCreateSuccess = () => {
    setCreateModalVisible(false);
    fetchTreatmentPlans();
    fetchStatistics();
  };

  const handleColumnVisibilityChange = (key: string) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSoftDelete = async (id: string) => {
    try {
      const response = await softDeleteTreatmentPlans([id]);
      if (response.success) {
        toast.success("Treatment plan soft deleted successfully");
        fetchTreatmentPlans();
        fetchStatistics();
      } else {
        toast.error(response.message || "Failed to soft delete treatment plan");
      }
    } catch (error) {
      console.error("Error soft deleting treatment plan:", error);
      toast.error("Failed to soft delete treatment plan");
    }
  };

  const handleRestore = async (id: string) => {
    try {
      const response = await restoreSoftDeletedTreatmentPlans([id]);
      if (response.success) {
        toast.success("Treatment plan restored successfully");
        fetchTreatmentPlans();
        fetchStatistics();
      } else {
        toast.error(response.message || "Failed to restore treatment plan");
      }
    } catch (error) {
      console.error("Error restoring treatment plan:", error);
      toast.error("Failed to restore treatment plan");
    }
  };

  const handleCancel = async (id: string, reason: string) => {
    try {
      const response = await cancelTreatmentPlan(id, reason);
      if (response.success) {
        toast.success("Treatment plan cancelled successfully");
        fetchTreatmentPlans();
        fetchStatistics();
      } else {
        toast.error(response.message || "Failed to cancel treatment plan");
      }
    } catch (error) {
      console.error("Error cancelling treatment plan:", error);
      toast.error("Failed to cancel treatment plan");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTreatmentPlans.length === 0) {
      toast.warning("Please select treatment plans to delete");
      return;
    }

    try {
      const response = await softDeleteTreatmentPlans(selectedTreatmentPlans);
      if (response.success) {
        toast.success("Selected treatment plans soft deleted successfully");
        setSelectedTreatmentPlans([]);
        fetchTreatmentPlans();
        fetchStatistics();
      } else {
        toast.error(
          response.message || "Failed to soft delete treatment plans"
        );
      }
    } catch (error) {
      console.error("Error soft deleting treatment plans:", error);
      toast.error("Failed to soft delete treatment plans");
    }
  };

  const handleBulkRestore = async () => {
    if (selectedTreatmentPlans.length === 0) {
      toast.warning("Please select treatment plans to restore");
      return;
    }

    try {
      const response = await restoreSoftDeletedTreatmentPlans(
        selectedTreatmentPlans
      );
      if (response.success) {
        toast.success("Selected treatment plans restored successfully");
        setSelectedTreatmentPlans([]);
        fetchTreatmentPlans();
        fetchStatistics();
      } else {
        toast.error(response.message || "Failed to restore treatment plans");
      }
    } catch (error) {
      console.error("Error restoring treatment plans:", error);
      toast.error("Failed to restore treatment plans");
    }
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

  const canEditTreatmentPlan = (status: string | undefined) => {
    return status === "InProgress";
  };

  const canCancelTreatmentPlan = (status: string | undefined) => {
    return status === "InProgress";
  };

  const canSoftDeleteTreatmentPlan = (status: string | undefined) => {
    return status === "InProgress" || status === "Completed";
  };

  const canRestoreTreatmentPlan = (status: string | undefined) => {
    return status === "SoftDeleted";
  };

  const renderStatusTag = (status: string | undefined) => {
    const statusColors = {
      InProgress: "processing",
      Completed: "success",
      Cancelled: "error",
      SoftDeleted: "warning",
    };

    return (
      <Tag
        color={statusColors[status as keyof typeof statusColors] || "default"}
      >
        {status}
      </Tag>
    );
  };

  // Helper functions để hiển thị thông tin người dùng
  const renderUserInfo = (user: any) => {
    if (!user) return "";
    return `${user.fullName} (${user.email})`;
  };

  const renderPatientInfo = (healthCheckResult: any) => {
    if (!healthCheckResult?.user) return "";
    return `${healthCheckResult.user.fullName} (${healthCheckResult.user.email})`;
  };

  const renderDrugInfo = (drug: any) => {
    if (!drug) return "";
    return `${drug.name} (${drug.drugCode})`;
  };

  const renderActionButtons = (record: TreatmentPlanResponseDTO) => {
    return (
      <Space>
        <Tooltip title="View Details">
          <Button
            type="text"
            icon={<HistoryOutlined />}
            onClick={() => router.push(`/treatment-plan/${record.id}`)}
          />
        </Tooltip>

        {canEditTreatmentPlan(record.status) && (
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => router.push(`/treatment-plan/${record.id}`)}
            />
          </Tooltip>
        )}

        {canCancelTreatmentPlan(record.status) && (
          <Tooltip title="Cancel">
            <Popconfirm
              title="Cancel Treatment Plan"
              description="Are you sure you want to cancel this treatment plan?"
              onConfirm={() => {
                Modal.confirm({
                  title: "Enter Cancellation Reason",
                  content: (
                    <Form>
                      <Form.Item
                        name="reason"
                        rules={[
                          { required: true, message: "Please enter a reason" },
                        ]}
                      >
                        <Input.TextArea rows={4} />
                      </Form.Item>
                    </Form>
                  ),
                  onOk: async (close) => {
                    const reason = (
                      document.querySelector(
                        ".ant-modal-content textarea"
                      ) as HTMLTextAreaElement
                    ).value;
                    await handleCancel(record.id, reason);
                    close();
                  },
                });
              }}
            >
              <Button type="text" danger icon={<CloseCircleOutlined />} />
            </Popconfirm>
          </Tooltip>
        )}

        {canSoftDeleteTreatmentPlan(record.status) && (
          <Tooltip title="Soft Delete">
            <Popconfirm
              title="Soft Delete Treatment Plan"
              description="Are you sure you want to soft delete this treatment plan?"
              onConfirm={() => handleSoftDelete(record.id)}
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        )}

        {canRestoreTreatmentPlan(record.status) && (
          <Tooltip title="Restore">
            <Popconfirm
              title="Restore Treatment Plan"
              description="Are you sure you want to restore this treatment plan?"
              onConfirm={() => handleRestore(record.id)}
            >
              <Button type="text" icon={<UndoOutlined />} />
            </Popconfirm>
          </Tooltip>
        )}
      </Space>
    );
  };

  const renderStatistics = () => {
    if (!statistics) return null;

    // Xử lý dữ liệu cho biểu đồ trạng thái
    const statusChartData = Object.entries(
      statistics.treatmentPlansByStatus || {}
    ).map(([status, count]) => ({
      name: status,
      value: count,
    }));

    // Xử lý dữ liệu cho biểu đồ hàng tháng
    const monthlyChartData = Object.entries(
      statistics.treatmentPlansByMonth || {}
    ).map(([month, count]) => ({
      name: month,
      count: count,
    }));

    // Xử lý dữ liệu cho biểu đồ thuốc hàng đầu
    const drugChartData = Object.entries(
      statistics.treatmentPlansByDrug || {}
    ).map(([drug, count]) => ({
      name: drug,
      count: count,
    }));

    // Xử lý dữ liệu cho biểu đồ người dùng hàng đầu
    const userChartData = Object.entries(
      statistics.treatmentPlansByUser || {}
    ).map(([user, count]) => ({
      name: user,
      count: count,
    }));

    return (
      <>
        <Row gutter={16} className="mb-6">
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Treatment Plans"
                value={statistics.totalTreatmentPlans}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Active Treatment Plans"
                value={statistics.totalActiveTreatmentPlans}
                valueStyle={{ color: "#3f8600" }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Completed Treatment Plans"
                value={statistics.totalCompletedTreatmentPlans}
                valueStyle={{ color: "#1677ff" }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Cancelled Treatment Plans"
                value={statistics.totalCancelledTreatmentPlans}
                valueStyle={{ color: "#cf1322" }}
              />
            </Card>
          </Col>
        </Row>

        <Card className="mb-6">
          <Tabs defaultActiveKey="1">
            <TabPane tab="Status Distribution" key="1">
              <Row>
                <Col span={12}>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {statusChartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(value, name) => [
                          `${value} plans`,
                          `Status: ${name}`,
                        ]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Col>
                <Col span={12}>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={statusChartData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip
                        formatter={(value) => [`${value} plans`]}
                      />
                      <Legend />
                      <Bar
                        dataKey="value"
                        fill="#8884d8"
                        name="Number of Plans"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Col>
              </Row>
            </TabPane>
            <TabPane tab="Monthly Distribution" key="2">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={monthlyChartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip formatter={(value) => [`${value} plans`]} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#8884d8"
                    name="Number of Plans"
                  />
                </LineChart>
              </ResponsiveContainer>
            </TabPane>
            <TabPane tab="Top Drugs" key="3">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={drugChartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip formatter={(value) => [`${value} plans`]} />
                  <Legend />
                  <Bar dataKey="count" fill="#82ca9d" name="Number of Plans" />
                </BarChart>
              </ResponsiveContainer>
            </TabPane>
            <TabPane tab="Top Staff" key="4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={userChartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip formatter={(value) => [`${value} plans`]} />
                  <Legend />
                  <Bar dataKey="count" fill="#ffc658" name="Number of Plans" />
                </BarChart>
              </ResponsiveContainer>
            </TabPane>
          </Tabs>
        </Card>
      </>
    );
  };

  const columns = [
    {
      title: "Treatment Plan Code",
      dataIndex: "treatmentPlanCode",
      key: "treatmentPlanCode",
      visible: columnVisibility.treatmentPlanCode,
      render: (text: string, record: TreatmentPlanResponseDTO) => (
        <a onClick={() => router.push(`/treatment-plan/${record.id}`)}>
          {text}
        </a>
      ),
    },
    {
      title: "Health Check Result",
      dataIndex: "healthCheckResult",
      key: "healthCheckResult",
      visible: columnVisibility.healthCheckResult,
      render: (healthCheckResult: any) => (
        <Tooltip title={renderPatientInfo(healthCheckResult)}>
          <a
            onClick={() =>
              healthCheckResult?.id &&
              router.push(`/health-check-result/${healthCheckResult.id}`)
            }
          >
            {healthCheckResult?.healthCheckResultCode}
          </a>
        </Tooltip>
      ),
    },
    {
      title: "Drug",
      dataIndex: "drug",
      key: "drug",
      visible: columnVisibility.drug,
      render: (drug: any) => renderDrugInfo(drug),
    },
    {
      title: "Treatment Description",
      dataIndex: "treatmentDescription",
      key: "treatmentDescription",
      visible: columnVisibility.treatmentDescription,
      ellipsis: true,
    },
    {
      title: "Instructions",
      dataIndex: "instructions",
      key: "instructions",
      visible: columnVisibility.instructions,
      ellipsis: true,
    },
    {
      title: "Start Date",
      dataIndex: "startDate",
      key: "startDate",
      visible: columnVisibility.startDate,
      render: (date: string) => moment(date).format("DD/MM/YYYY"),
    },
    {
      title: "End Date",
      dataIndex: "endDate",
      key: "endDate",
      visible: columnVisibility.endDate,
      render: (date: string) => moment(date).format("DD/MM/YYYY"),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      visible: columnVisibility.status,
      render: (status: string) => renderStatusTag(status),
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      visible: columnVisibility.createdAt,
      render: (date: string) => moment(date).format("DD/MM/YYYY HH:mm:ss"),
    },
    {
      title: "Updated At",
      dataIndex: "updatedAt",
      key: "updatedAt",
      visible: columnVisibility.updatedAt,
      render: (date: string) => moment(date).format("DD/MM/YYYY HH:mm:ss"),
    },
    {
      title: "Created By",
      dataIndex: "createdBy",
      key: "createdBy",
      visible: columnVisibility.createdBy,
      render: (createdBy: any) => (
        <Tooltip title={renderUserInfo(createdBy)}>
          {createdBy?.fullName || ""}
        </Tooltip>
      ),
    },
    {
      title: "Updated By",
      dataIndex: "updatedBy",
      key: "updatedBy",
      visible: columnVisibility.updatedBy,
      render: (updatedBy: any) => (
        <Tooltip title={renderUserInfo(updatedBy)}>
          {updatedBy?.fullName || ""}
        </Tooltip>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (record: TreatmentPlanResponseDTO) => renderActionButtons(record),
    },
  ].filter((column) => column.visible);

  return (
    <div className="p-6">
      <Title level={2}>Treatment Plan Management</Title>

      {renderStatistics()}

      <Card className="mb-6">
        <Form form={searchForm} layout="vertical">
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="treatmentPlanCode" label="Treatment Plan Code">
                <Select
                  showSearch
                  allowClear
                  placeholder="Search by code"
                  optionFilterProp="children"
                  onChange={(value) => handleFormFieldChange("treatmentPlanCode", value)}
                  filterOption={(input, option) =>
                    (option?.value as string)
                      .toLowerCase()
                      .indexOf(input.toLowerCase()) >= 0
                  }
                  options={treatmentPlanCodes.map(code => ({
                    value: code,
                    label: code
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="healthCheckResultCode"
                label="Health Check Result Code"
              >
                <Select
                  showSearch
                  allowClear
                  placeholder="Search by code"
                  optionFilterProp="children"
                  onChange={(value) => handleFormFieldChange("healthCheckResultCode", value)}
                  filterOption={(input, option) =>
                    (option?.value as string)
                      .toLowerCase()
                      .indexOf(input.toLowerCase()) >= 0
                  }
                  options={healthCheckCodes.map(code => ({
                    value: code,
                    label: code
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="userSearch" label="Patient">
                <Select
                  showSearch
                  allowClear
                  placeholder="Search patient"
                  optionFilterProp="children"
                  onChange={(value) => handleFormFieldChange("userSearch", value)}
                  filterOption={(input, option) =>
                    (option?.label as string)
                      .toLowerCase()
                      .indexOf(input.toLowerCase()) >= 0
                  }
                  options={userOptions.map((user) => ({
                    value: user.id,
                    label: `${user.fullName} (${user.email})`,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="drugSearch" label="Drug">
                <Select
                  showSearch
                  allowClear
                  placeholder="Search drug"
                  optionFilterProp="children"
                  onChange={(value) => handleFormFieldChange("drugSearch", value)}
                  filterOption={(input, option) =>
                    (option?.label as string)
                      .toLowerCase()
                      .indexOf(input.toLowerCase()) >= 0
                  }
                  options={drugOptions.map((drug) => ({
                    value: drug.id,
                    label: `${drug.name} (${drug.drugCode})`,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="updatedBySearch" label="Updated By">
                <Select
                  showSearch
                  allowClear
                  placeholder="Search updated by"
                  optionFilterProp="children"
                  onChange={(value) => handleFormFieldChange("updatedBySearch", value)}
                  filterOption={(input, option) =>
                    (option?.label as string)
                      .toLowerCase()
                      .indexOf(input.toLowerCase()) >= 0
                  }
                  options={updatedByOptions.map((user) => ({
                    value: user.id,
                    label: `${user.fullName} (${user.email})`,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="status" label="Status">
                <Select 
                  placeholder="Select status" 
                  allowClear
                  onChange={(value) => handleFormFieldChange("status", value)}
                >
                  <Option value="InProgress">In Progress</Option>
                  <Option value="Completed">Completed</Option>
                  <Option value="Cancelled">Cancelled</Option>
                  <Option value="SoftDeleted">Soft Deleted</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="dateRange" label="Date Range">
                <RangePicker 
                  style={{ width: "100%" }} 
                  onChange={(dates) => handleFormFieldChange("dateRange", dates)}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="createdDateRange" label="Created Date Range">
                <RangePicker 
                  style={{ width: "100%" }} 
                  onChange={(dates) => handleFormFieldChange("createdDateRange", dates)}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="updatedDateRange" label="Updated Date Range">
                <RangePicker 
                  style={{ width: "100%" }} 
                  onChange={(dates) => handleFormFieldChange("updatedDateRange", dates)}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="sortBy" label="Sort By">
                <Select 
                  defaultValue="StartDate"
                  onChange={(value) => handleFormFieldChange("sortBy", value)}
                >
                  <Option value="TreatmentPlanCode">Treatment Plan Code</Option>
                  <Option value="StartDate">Start Date</Option>
                  <Option value="EndDate">End Date</Option>
                  <Option value="CreatedAt">Created At</Option>
                  <Option value="UpdatedAt">Updated At</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="ascending"
                label="Sort Order"
                valuePropName="checked"
              >
                <Switch onChange={(checked) => handleFormFieldChange("ascending", checked)} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item>
                <Button icon={<ReloadOutlined />} onClick={handleReset}>
                  Reset Filters
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card>
        <div className="mb-4 flex justify-between">
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalVisible(true)}
            >
              Create Treatment Plan
            </Button>
            {selectedTreatmentPlans.length > 0 && (
              <>
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleBulkDelete}
                >
                  Bulk Delete
                </Button>
                <Button icon={<UndoOutlined />} onClick={handleBulkRestore}>
                  Bulk Restore
                </Button>
              </>
            )}
          </Space>
          <Space>
            <Button
              icon={<FileExcelOutlined />}
              onClick={handleOpenExportConfig}
            >
              Export Excel
            </Button>
          </Space>
        </div>

        <Table
          rowSelection={{
            type: "checkbox",
            onChange: (_, selectedRows) => {
              setSelectedTreatmentPlans(selectedRows.map((row) => row.id));
            },
          }}
          columns={columns}
          dataSource={treatmentPlans}
          rowKey="id"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalItems,
            onChange: handlePageChange,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} items`,
          }}
        />
      </Card>

      <CreateModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSuccess={handleCreateSuccess}
        userOptions={userOptions}
        drugOptions={drugOptions}
      />

      <ExportConfigModal
        visible={exportConfigModalVisible}
        onClose={closeExportConfigModal}
        config={exportConfig}
        onChange={handleExportConfigChange}
        filters={{
          currentPage,
          pageSize,
          treatmentPlanCodeSearch,
          healthCheckResultCodeSearch,
          userSearch,
          drugSearch,
          updatedBySearch,
          sortBy,
          ascending,
          statusFilter,
          dateRange,
          createdDateRange,
          updatedDateRange,
        }}
      />
    </div>
  );
}
