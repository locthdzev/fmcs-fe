import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Tabs,
  Spin,
  DatePicker,
  Button,
  Space,
  Divider,
  Typography,
  Badge,
  Select,
  Tooltip as AntTooltip,
  Progress,
  Alert,
  theme,
  Modal,
  message,
  Tag,
  Empty,
  Switch,
  Checkbox,
  Radio,
  Table,
} from "antd";
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
  AreaChart,
  Area,
} from "recharts";
import {
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined,
  AreaChartOutlined,
  AppstoreOutlined,
  ReloadOutlined,
  FileExcelOutlined,
  QuestionCircleOutlined,
  ArrowLeftOutlined,
  MedicineBoxOutlined,
  ExceptionOutlined,
  WarningOutlined,
  InsuranceOutlined,
  FileProtectOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";
import * as ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import dayjs from "dayjs";
import {
  getHealthInsuranceStatistics,
  exportHealthInsuranceStatistics,
  HealthInsuranceStatisticsParams,
} from "@/api/healthinsurance";

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;
const { useToken } = theme;

// Color palette
const COLORS = [
  "#1677ff",
  "#52c41a",
  "#faad14",
  "#f5222d",
  "#722ed1",
  "#13c2c2",
  "#fa8c16",
  "#eb2f96",
  "#a0d911",
  "#1890ff",
];

// Chart type options
const chartTypes = {
  bar: { icon: <BarChartOutlined />, label: "Bar Chart" },
  line: { icon: <LineChartOutlined />, label: "Line Chart" },
  area: { icon: <AreaChartOutlined />, label: "Area Chart" },
  pie: { icon: <PieChartOutlined />, label: "Pie Chart" },
};

// Define types
interface ChartDataItem {
  name: string;
  value: number;
  count?: number;
  fill?: string;
}

interface StatisticsState {
  statusDistribution: Record<string, number>;
  verificationStatusDistribution: Record<string, number>;
  expiringInsurances: number;
  totalSubmissions: number;
  pendingVerifications: number;
  pendingUpdates: number;
  completedRecords: number;
  userComplianceRate: number;
  timeSeriesData?: any[];
  updateRequestsData?: any;
  [key: string]: any;
}

export function HealthInsuranceStatistic() {
  const { token } = useToken();
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [statistics, setStatistics] = useState<StatisticsState | null>(null);
  
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);
  const [activeDateFilter, setActiveDateFilter] = useState<string>("all");
  const [statusChartType, setStatusChartType] = useState<string>("pie");
  const [verificationChartType, setVerificationChartType] = useState<string>("pie");
  const [complianceChartType, setComplianceChartType] = useState<string>("bar");
  const [activeTab, setActiveTab] = useState<string>("1");
  const [exportModalVisible, setExportModalVisible] = useState<boolean>(false);
  const [exportDateRange, setExportDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);
  const [includeOptions, setIncludeOptions] = useState({
    chartData: true,
    userStatistics: true,
    updateRequestStatistics: true,
    complianceReport: true,
  });
  const [expiringThreshold, setExpiringThreshold] = useState<number>(30);
  const [messageApi, contextHolder] = message.useMessage();

  // Fetch statistics on page load
  useEffect(() => {
    fetchStatistics();
  }, []);

  // Function to map API response to component state
  const mapApiResponseToState = (apiData: any): StatisticsState => {
    // Ensure we have valid data
    if (!apiData) return {} as StatisticsState;

    // Extract important statistics
    const completedCount = apiData.statusCounts?.Completed || 0;
    const pendingCount = apiData.statusCounts?.Pending || 0;
    const totalInsurances = apiData.totalInsurances || 0;

    // Prepare time series data for charts
    let timeSeriesData = [];
    if (apiData.deadlineComplianceRate && apiData.deadlineComplianceRate.length > 0) {
      timeSeriesData = apiData.deadlineComplianceRate.map((item: any) => {
        // Format date string for display
        const dateObj = new Date(item.date);
        const formattedDate = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;
        
        // Calculate compliance and submission rates
        const completed = item.values?.Completed || 0;
        const expired = item.values?.Expired || 0;
        const total = completed + expired;
        const complianceRate = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        return {
          date: formattedDate,
          complianceRate: complianceRate,
          submissionRate: total > 0 ? 100 : 0 // Placeholder if needed
        };
      });
    }

    // Process verification status data
    const verificationStatusDistribution: Record<string, number> = {
      "Verified": apiData.userStatistics?.usersWithVerifiedInsurance || 0,
      "Unverified": (apiData.userStatistics?.usersWithInsurance || 0) - (apiData.userStatistics?.usersWithVerifiedInsurance || 0)
    };

    // Map API response to our component state structure
    return {
      statusDistribution: apiData.statusCounts || {},
      verificationStatusDistribution: verificationStatusDistribution,
      expiringInsurances: apiData.complianceReport?.expiringInsurances || 0,
      totalSubmissions: totalInsurances,
      pendingVerifications: pendingCount,
      pendingUpdates: apiData.updateRequestStatistics?.requestsByStatus?.Pending || 0,
      completedRecords: completedCount,
      userComplianceRate: apiData.userStatistics?.percentageWithInsurance || 0,
      timeSeriesData: timeSeriesData,
      updateRequestsData: apiData.updateRequestStatistics,
      totalUsers: apiData.userStatistics?.totalUsers || 0,
      usersWithInsurance: apiData.userStatistics?.usersWithInsurance || 0,
      expiringInsurancesList: apiData.complianceReport?.expiringInsurancesList || []
    };
  };

  // Function to fetch statistics
  const fetchStatistics = async (params: HealthInsuranceStatisticsParams = {}) => {
    setLoading(true);
    try {
      console.log("Fetching statistics with params:", params);
      const response = await getHealthInsuranceStatistics({
        ...params,
        includeChartData: true,
        includeUserStatistics: true,
        includeUpdateRequestStatistics: true,
        includeComplianceReport: true,
        expiringThresholdDays: expiringThreshold,
      });
      console.log("API Response:", response);

      if (response.isSuccess && response.data) {
        console.log("Setting statistics data:", response.data);
        
        // Transform API data to component state format
        const transformedData = mapApiResponseToState(response.data);
        console.log("Transformed statistics data:", transformedData);
        
        setStatistics(transformedData);
      } else {
        console.error("API returned success=false or no data:", response.message);
        messageApi.error(response.message || "Failed to fetch statistics");
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
      messageApi.error("An error occurred while fetching statistics");
    } finally {
      setLoading(false);
    }
  };

  // Date range handler
  const handleDateRangeChange = (dates: any) => {
    setDateRange(dates);
  };

  // Apply date filter
  const applyDateFilter = () => {
    const params: HealthInsuranceStatisticsParams = {};
    
    if (dateRange[0] && dateRange[1]) {
      params.createdAtStart = dateRange[0].toISOString();
      params.createdAtEnd = dateRange[1].toISOString();
    }
    
    fetchStatistics(params);
    setActiveDateFilter("custom");
  };

  // Reset date filter
  const resetDateFilter = () => {
    setDateRange([null, null]);
    fetchStatistics();
    setActiveDateFilter("all");
  };

  // Apply quick filter
  const applyQuickFilter = (period: string) => {
    const today = dayjs();
    let startDate: dayjs.Dayjs | null = null;
    let endDate: dayjs.Dayjs = today;
    let timeRangeInDays: number | undefined = undefined;

    switch (period) {
      case "last7days":
        startDate = today.subtract(7, 'day');
        timeRangeInDays = 7;
        setActiveDateFilter("last7days");
        break;
      case "last30days":
        startDate = today.subtract(30, 'day');
        timeRangeInDays = 30;
        setActiveDateFilter("last30days");
        break;
      case "last3months":
        startDate = today.subtract(3, 'month');
        timeRangeInDays = 90;
        setActiveDateFilter("last3months");
        break;
      case "last6months":
        startDate = today.subtract(6, 'month');
        timeRangeInDays = 180;
        setActiveDateFilter("last6months");
        break;
      case "thisyear":
        startDate = dayjs(new Date(today.year(), 0, 1));
        setActiveDateFilter("thisyear");
        break;
      case "lastyear":
        startDate = dayjs(new Date(today.year() - 1, 0, 1));
        endDate = dayjs(new Date(today.year() - 1, 11, 31));
        setActiveDateFilter("lastyear");
        break;
      default:
        startDate = null;
        setActiveDateFilter("all");
    }

    setDateRange([startDate, endDate]);
    
    const params: HealthInsuranceStatisticsParams = {};
    if (startDate && endDate) {
      params.createdAtStart = startDate.toISOString();
      params.createdAtEnd = endDate.toISOString();
    }
    if (timeRangeInDays) {
      params.timeRangeInDays = timeRangeInDays;
    }
    
    fetchStatistics(params);
  };

  // Format date for display
  const formatDate = (date: dayjs.Dayjs | null): string => {
    return date ? date.format("DD/MM/YYYY") : "";
  };

  // Navigation
  const handleBack = () => {
    router.back();
  };

  // Export settings
  const handleExportOptionsChange = (option: string, value: boolean) => {
    setIncludeOptions({
      ...includeOptions,
      [option]: value,
    });
  };

  // Export function
  const handleExport = async () => {
    setLoading(true);
    try {
      const params: HealthInsuranceStatisticsParams = {
        includeChartData: includeOptions.chartData,
        includeUserStatistics: includeOptions.userStatistics,
        includeUpdateRequestStatistics: includeOptions.updateRequestStatistics,
        includeComplianceReport: includeOptions.complianceReport,
        expiringThresholdDays: expiringThreshold,
      };

      if (exportDateRange[0] && exportDateRange[1]) {
        params.createdAtStart = exportDateRange[0].toISOString();
        params.createdAtEnd = exportDateRange[1].toISOString();
      }

      const response = await exportHealthInsuranceStatistics(params);
      
      if (response.isSuccess) {
        messageApi.success("Statistics exported successfully");
        setExportModalVisible(false);
      } else {
        messageApi.error(response.message || "Failed to export statistics");
      }
    } catch (error) {
      console.error("Error exporting statistics:", error);
      messageApi.error("An error occurred while exporting statistics");
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading && !statistics) {
    return (
      <div className="flex items-center justify-center h-screen">
        {contextHolder}
        <Spin size="large" />
      </div>
    );
  }

  // No data state
  if (!statistics) {
    return (
      <div className="flex items-center justify-center h-screen">
        {contextHolder}
        <Empty description="No statistics available" />
      </div>
    );
  }

  // Data preparation for charts
  const prepareChartData = () => {
    // Status distribution
    const statusChartData: ChartDataItem[] = Object.entries(
      statistics.statusDistribution || {}
    ).map(([status, count]) => ({
      name: status,
      value: count as number,
    }));

    // Verification status distribution
    const verificationChartData: ChartDataItem[] = Object.entries(
      statistics.verificationStatusDistribution || {}
    ).map(([status, count]) => ({
      name: status,
      value: count as number,
    }));

    // Compliance data
    const complianceData = statistics.timeSeriesData || [];

    return {
      statusChartData,
      verificationChartData,
      complianceData
    };
  };

  // Format date range for display
  const dateRangeDisplay =
    dateRange[0] && dateRange[1]
      ? `${formatDate(dateRange[0])} to ${formatDate(dateRange[1])}`
      : "All Time";

  // Extract chart data
  const { statusChartData, verificationChartData, complianceData } = prepareChartData();

  // Custom chart renderer based on type
  const renderChart = (
    type: string,
    data: ChartDataItem[],
    chartType: string,
    setChartType: (type: string) => void
  ) => {
    // Chart type selector
    const chartConfigMenu = (
      <Space
        className="mb-3 chart-controls"
        style={{ display: "flex", justifyContent: "flex-end" }}
      >
        <Select
          value={chartType}
          onChange={setChartType}
          style={{ width: 150 }}
          options={Object.entries(chartTypes).map(([key, { icon, label }]) => ({
            value: key,
            label: (
              <Space>
                {icon}
                {label}
              </Space>
            ),
          }))}
        />
      </Space>
    );

    // Chart component renderer
    const renderChartComponent = () => {
      switch (chartType) {
        case "pie":
          return (
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(1)}%`
                  }
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value) => [`${value} records`]} />
                <Legend
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                />
              </PieChart>
            </ResponsiveContainer>
          );
        case "bar":
          return (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={70}
                />
                <YAxis />
                <RechartsTooltip formatter={(value) => [`${value} records`]} />
                <Legend />
                <Bar dataKey="value" name="Records">
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.fill || COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          );
        case "line":
          return (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={70}
                />
                <YAxis />
                <RechartsTooltip formatter={(value) => [`${value} records`]} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={token.colorPrimary}
                  name="Records"
                />
              </LineChart>
            </ResponsiveContainer>
          );
        case "area":
          return (
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={70}
                />
                <YAxis />
                <RechartsTooltip formatter={(value) => [`${value} records`]} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={token.colorPrimary}
                  fill={token.colorPrimaryBg}
                  name="Records"
                />
              </AreaChart>
            </ResponsiveContainer>
          );
        default:
          return (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={70}
                />
                <YAxis />
                <RechartsTooltip formatter={(value) => [`${value} records`]} />
                <Legend />
                <Bar dataKey="value" name="Records">
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.fill || COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          );
      }
    };

    // Return chart with controls
    return (
      <div style={{ width: "100%" }}>
        {chartConfigMenu}
        {renderChartComponent()}
      </div>
    );
  };

  // Render time series data (compliance trends)
  const renderComplianceChart = () => {
    if (!complianceData || complianceData.length === 0) {
      return <Empty description="No compliance data available" />;
    }

    return (
      <div style={{ width: "100%" }}>
        <Space
          className="mb-3 chart-controls"
          style={{ display: "flex", justifyContent: "flex-end" }}
        >
          <Select
            value={complianceChartType}
            onChange={setComplianceChartType}
            style={{ width: 150 }}
            options={Object.entries(chartTypes).map(([key, { icon, label }]) => ({
              value: key,
              label: (
                <Space>
                  {icon}
                  {label}
                </Space>
              ),
            }))}
          />
        </Space>

        {complianceChartType === "line" ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={complianceData}
              margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <RechartsTooltip formatter={(value) => [`${value}%`]} />
              <Legend />
              <Line
                type="monotone"
                dataKey="complianceRate"
                name="Compliance Rate"
                stroke="#52c41a"
              />
              <Line
                type="monotone"
                dataKey="submissionRate"
                name="Submission Rate"
                stroke="#1677ff"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : complianceChartType === "area" ? (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart
              data={complianceData}
              margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <RechartsTooltip formatter={(value) => [`${value}%`]} />
              <Legend />
              <Area
                type="monotone"
                dataKey="complianceRate"
                name="Compliance Rate"
                stroke="#52c41a"
                fill="#52c41a33"
              />
              <Area
                type="monotone"
                dataKey="submissionRate"
                name="Submission Rate"
                stroke="#1677ff"
                fill="#1677ff33"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={complianceData}
              margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" angle={-45} textAnchor="end" height={70} />
              <YAxis />
              <RechartsTooltip formatter={(value) => [`${value}%`]} />
              <Legend />
              <Bar dataKey="complianceRate" name="Compliance Rate" fill="#52c41a" />
              <Bar dataKey="submissionRate" name="Submission Rate" fill="#1677ff" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    );
  };

  // Render expiring insurances table
  const renderExpiringInsurancesTable = () => {
    if (!statistics.expiringInsurancesList || statistics.expiringInsurancesList.length === 0) {
      return <Empty description="No expiring insurances found within the threshold" />;
    }

    const columns = [
      {
        title: "User",
        dataIndex: "userName",
        key: "userName",
      },
      {
        title: "Insurance Number",
        dataIndex: "healthInsuranceNumber",
        key: "healthInsuranceNumber",
      },
      {
        title: "Valid To",
        dataIndex: "validTo",
        key: "validTo",
        render: (text: string) => dayjs(text).format("DD/MM/YYYY"),
      },
      {
        title: "Days Remaining",
        dataIndex: "daysRemaining",
        key: "daysRemaining",
        render: (days: number) => (
          <Tag color={days < 15 ? "red" : days < 30 ? "orange" : "green"}>
            {days} days
          </Tag>
        ),
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (status: string) => (
          <Tag 
            color={
              status === "Completed" ? "green" :
              status === "Pending" ? "blue" :
              status === "Expired" ? "red" : "default"
            }
          >
            {status}
          </Tag>
        ),
      },
    ];

    return (
      <div style={{ width: "100%" }}>
        <Alert
          message={`${statistics.expiringInsurances} insurances expiring within ${expiringThreshold} days`}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Table
          dataSource={statistics.expiringInsurancesList}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </div>
    );
  };

  // Export modal renderer
  const renderExportModal = () => {
    return (
      <Modal
        title={
          <Space>
            <FileExcelOutlined style={{ color: "#52c41a" }} />
            <span>Export Health Insurance Statistics</span>
          </Space>
        }
        open={exportModalVisible}
        onCancel={() => setExportModalVisible(false)}
        width={600}
        footer={[
          <Button key="cancel" onClick={() => setExportModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="export"
            type="primary"
            icon={<FileExcelOutlined />}
            loading={loading}
            onClick={handleExport}
          >
            Export
          </Button>
        ]}
      >
        <div style={{ marginBottom: "20px" }}>
          <Title level={5}>Select Date Range</Title>
          <RangePicker
            style={{ width: "100%", marginTop: "8px" }}
            value={exportDateRange}
            onChange={(dates) => setExportDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null])}
          />
        </div>
        
        <Divider orientation="left">Export Options</Divider>
        
        <div style={{ marginBottom: "16px" }}>
          <Space direction="vertical" style={{ width: "100%" }}>
            <Checkbox
              checked={includeOptions.chartData}
              onChange={(e) => handleExportOptionsChange("chartData", e.target.checked)}
            >
              Include Chart Data
            </Checkbox>
            <Checkbox
              checked={includeOptions.userStatistics}
              onChange={(e) => handleExportOptionsChange("userStatistics", e.target.checked)}
            >
              Include User Statistics
            </Checkbox>
            <Checkbox
              checked={includeOptions.updateRequestStatistics}
              onChange={(e) => handleExportOptionsChange("updateRequestStatistics", e.target.checked)}
            >
              Include Update Request Statistics
            </Checkbox>
            <Checkbox
              checked={includeOptions.complianceReport}
              onChange={(e) => handleExportOptionsChange("complianceReport", e.target.checked)}
            >
              Include Compliance Report
            </Checkbox>
          </Space>
        </div>
        
        <div style={{ marginBottom: "16px" }}>
          <Title level={5}>Expiring Threshold (days)</Title>
          <Radio.Group
            value={expiringThreshold}
            onChange={(e) => setExpiringThreshold(e.target.value)}
            buttonStyle="solid"
          >
            <Radio.Button value={15}>15</Radio.Button>
            <Radio.Button value={30}>30</Radio.Button>
            <Radio.Button value={60}>60</Radio.Button>
            <Radio.Button value={90}>90</Radio.Button>
          </Radio.Group>
        </div>
        
        <Alert
          message="Export Format Information"
          description="The export will include detailed statistics about health insurance records in Excel format, based on the options selected above."
          type="info"
          showIcon
          style={{ marginTop: "12px" }}
        />
      </Modal>
    );
  };

  // Component rendering functions
  const renderFilterSection = () => (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={handleBack}
            style={{ marginRight: "8px" }}
          >
            Back
          </Button>
          <FileProtectOutlined style={{ fontSize: "24px" }} />
          <h3 className="text-xl font-bold">
            Health Insurance Statistics Dashboard
          </h3>
        </div>
      </div>

      <Card
        className="mb-6 statistics-filter-card"
        style={{ borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
      >
        <Row align="middle" gutter={[16, 16]}>
          <Col span={16}>
            <Title level={4} style={{ margin: 0 }}>
              <AppstoreOutlined style={{ marginRight: "8px" }} />
              Filter Options
            </Title>
          </Col>
          <Col span={8} style={{ textAlign: "right" }}>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => fetchStatistics()}
              >
                Refresh
              </Button>
              <Button 
                icon={<FileExcelOutlined />} 
                type="primary"
                onClick={() => setExportModalVisible(true)}
              >
                Export
              </Button>
            </Space>
          </Col>
        </Row>

        <Divider style={{ margin: "16px 0" }} />

        <Title level={5}>Date Range Filter</Title>
        <Row gutter={16} className="mb-3">
          <Col span={24}>
            <Space wrap>
              <Button
                type={activeDateFilter === "all" ? "primary" : "default"}
                onClick={() => applyQuickFilter("all")}
              >
                All Time
              </Button>
              <Button
                type={activeDateFilter === "last7days" ? "primary" : "default"}
                onClick={() => applyQuickFilter("last7days")}
              >
                Last 7 Days
              </Button>
              <Button
                type={activeDateFilter === "last30days" ? "primary" : "default"}
                onClick={() => applyQuickFilter("last30days")}
              >
                Last 30 Days
              </Button>
              <Button
                type={
                  activeDateFilter === "last3months" ? "primary" : "default"
                }
                onClick={() => applyQuickFilter("last3months")}
              >
                Last 3 Months
              </Button>
              <Button
                type={
                  activeDateFilter === "last6months" ? "primary" : "default"
                }
                onClick={() => applyQuickFilter("last6months")}
              >
                Last 6 Months
              </Button>
              <Button
                type={activeDateFilter === "thisyear" ? "primary" : "default"}
                onClick={() => applyQuickFilter("thisyear")}
              >
                This Year
              </Button>
              <Button
                type={activeDateFilter === "lastyear" ? "primary" : "default"}
                onClick={() => applyQuickFilter("lastyear")}
              >
                Last Year
              </Button>
            </Space>
          </Col>
        </Row>
        <Divider style={{ margin: "12px 0" }} />
        <Row gutter={16} className="mb-3">
          <Col span={16}>
            <Space>
              <Text>Custom Range:</Text>
              <RangePicker
                value={dateRange}
                onChange={handleDateRangeChange}
              />
              <Button type="primary" onClick={applyDateFilter}>
                Apply
              </Button>
              <Button onClick={resetDateFilter}>Reset</Button>
            </Space>
          </Col>
          <Col span={8} style={{ textAlign: "right" }}>
            <Badge
              status="processing"
              text={
                <Text strong style={{ fontSize: "14px" }}>
                  Current Filter: {dateRangeDisplay}
                </Text>
              }
            />
          </Col>
        </Row>
        
        <Divider style={{ margin: "12px 0" }} />
        
        <Row gutter={16}>
          <Col span={16}>
            <Title level={5}>Expiring Insurance Threshold</Title>
            <Radio.Group
              value={expiringThreshold}
              onChange={(e) => setExpiringThreshold(e.target.value)}
              buttonStyle="solid"
            >
              <Radio.Button value={15}>15 days</Radio.Button>
              <Radio.Button value={30}>30 days</Radio.Button>
              <Radio.Button value={60}>60 days</Radio.Button>
              <Radio.Button value={90}>90 days</Radio.Button>
            </Radio.Group>
          </Col>
          <Col span={8} style={{ textAlign: "right" }}>
            <Button 
              type="primary" 
              onClick={() => {
                fetchStatistics({
                  expiringThresholdDays: expiringThreshold
                });
              }}
            >
              Apply Threshold
            </Button>
          </Col>
        </Row>
      </Card>
    </>
  );

  const renderStatisticsCards = () => (
    <>
      <Row gutter={16} className="mb-6">
        <Col xs={24} sm={12} md={6}>
          <Card
            hoverable
            className="statistic-card"
            style={{
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <Statistic
              title={
                <Space align="center">
                  <Title level={5} style={{ margin: 0 }}>
                    Total Submissions
                  </Title>
                  <AntTooltip title="Total number of health insurance records submitted">
                    <QuestionCircleOutlined
                      style={{
                        fontSize: "14px",
                        color: token.colorTextSecondary,
                      }}
                    />
                  </AntTooltip>
                </Space>
              }
              value={statistics.totalSubmissions}
              prefix={<FileProtectOutlined />}
              valueStyle={{ color: token.colorTextHeading }}
            />
            <div style={{ marginTop: "10px" }}>
              <Progress
                percent={100}
                showInfo={false}
                strokeColor={token.colorTextHeading}
              />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            hoverable
            className="statistic-card"
            style={{
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <Statistic
              title={
                <Space align="center">
                  <Title level={5} style={{ margin: 0 }}>
                    Completed Records
                  </Title>
                  <AntTooltip title="Number of verified and completed health insurance records">
                    <QuestionCircleOutlined
                      style={{
                        fontSize: "14px",
                        color: token.colorTextSecondary,
                      }}
                    />
                  </AntTooltip>
                </Space>
              }
              value={statistics.completedRecords}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
            <div style={{ marginTop: "10px" }}>
              <Progress
                percent={(statistics.completedRecords / statistics.totalSubmissions) * 100}
                showInfo={false}
                strokeColor="#52c41a"
              />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            hoverable
            className="statistic-card"
            style={{
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <Statistic
              title={
                <Space align="center">
                  <Title level={5} style={{ margin: 0 }}>
                    Pending Verifications
                  </Title>
                  <AntTooltip title="Number of insurance records pending verification">
                    <QuestionCircleOutlined
                      style={{
                        fontSize: "14px",
                        color: token.colorTextSecondary,
                      }}
                    />
                  </AntTooltip>
                </Space>
              }
              value={statistics.pendingVerifications}
              prefix={<ClockCircleOutlined style={{ color: "#1677ff" }} />}
              valueStyle={{ color: "#1677ff" }}
            />
            <div style={{ marginTop: "10px" }}>
              <Progress
                percent={(statistics.pendingVerifications / statistics.totalSubmissions) * 100}
                showInfo={false}
                strokeColor="#1677ff"
              />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            hoverable
            className="statistic-card"
            style={{
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <Statistic
              title={
                <Space align="center">
                  <Title level={5} style={{ margin: 0 }}>
                    Expiring Soon
                  </Title>
                  <AntTooltip title={`Number of insurances expiring within ${expiringThreshold} days`}>
                    <QuestionCircleOutlined
                      style={{
                        fontSize: "14px",
                        color: token.colorTextSecondary,
                      }}
                    />
                  </AntTooltip>
                </Space>
              }
              value={statistics.expiringInsurances}
              prefix={<WarningOutlined style={{ color: "#faad14" }} />}
              valueStyle={{ color: "#faad14" }}
            />
            <div style={{ marginTop: "10px" }}>
              <Progress
                percent={(statistics.expiringInsurances / statistics.totalSubmissions) * 100}
                showInfo={false}
                strokeColor="#faad14"
              />
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} className="mb-6">
        <Col xs={24} sm={12} md={6}>
          <Card
            hoverable
            className="statistic-card"
            style={{
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <Statistic
              title={
                <Space align="center">
                  <Title level={5} style={{ margin: 0 }}>
                    User Compliance Rate
                  </Title>
                  <AntTooltip title="Percentage of users with valid health insurance">
                    <QuestionCircleOutlined
                      style={{
                        fontSize: "14px",
                        color: token.colorTextSecondary,
                      }}
                    />
                  </AntTooltip>
                </Space>
              }
              value={statistics.userComplianceRate || 0}
              suffix="%"
              precision={1}
              valueStyle={{ color: "#52c41a" }}
            />
            <div style={{ marginTop: "10px" }}>
              <Progress
                percent={statistics.userComplianceRate || 0}
                showInfo={false}
                strokeColor="#52c41a"
              />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            hoverable
            className="statistic-card"
            style={{
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <Statistic
              title={
                <Space align="center">
                  <Title level={5} style={{ margin: 0 }}>
                    Pending Update Requests
                  </Title>
                  <AntTooltip title="Number of pending update requests">
                    <QuestionCircleOutlined
                      style={{
                        fontSize: "14px",
                        color: token.colorTextSecondary,
                      }}
                    />
                  </AntTooltip>
                </Space>
              }
              value={statistics.pendingUpdates}
              prefix={<ClockCircleOutlined style={{ color: "#1677ff" }} />}
              valueStyle={{ color: "#1677ff" }}
            />
            <div style={{ marginTop: "10px" }}>
              <Progress
                percent={(statistics.pendingUpdates / statistics.totalSubmissions) * 100}
                showInfo={false}
                strokeColor="#1677ff"
              />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={12}>
          <Card
            hoverable
            className="statistic-card"
            style={{
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title={
                    <Space align="center">
                      <Title level={5} style={{ margin: 0 }}>
                        Total Users
                      </Title>
                    </Space>
                  }
                  value={statistics.totalUsers}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: token.colorTextHeading }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={
                    <Space align="center">
                      <Title level={5} style={{ margin: 0 }}>
                        Users With Insurance
                      </Title>
                    </Space>
                  }
                  value={statistics.usersWithInsurance}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: "#52c41a" }}
                />
                <Progress
                  percent={(statistics.usersWithInsurance / statistics.totalUsers) * 100}
                  showInfo={false}
                  strokeColor="#52c41a"
                  style={{ marginTop: "10px" }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </>
  );

  // Tab items definition
  const tabItems = [
    {
      key: "1",
      label: (
        <Space align="center">
          Status Distribution
          <AntTooltip title="Shows distribution of health insurance records by their status">
            <QuestionCircleOutlined />
          </AntTooltip>
        </Space>
      ),
      children: renderChart(
        "status",
        statusChartData,
        statusChartType,
        setStatusChartType
      ),
    },
    {
      key: "2",
      label: (
        <Space align="center">
          Verification Status
          <AntTooltip title="Shows distribution of health insurance records by verification status">
            <QuestionCircleOutlined />
          </AntTooltip>
        </Space>
      ),
      children: renderChart(
        "verification",
        verificationChartData,
        verificationChartType,
        setVerificationChartType
      ),
    },
    {
      key: "3",
      label: (
        <Space align="center">
          Compliance Trends
          <AntTooltip title="Shows compliance and submission trends over time">
            <QuestionCircleOutlined />
          </AntTooltip>
        </Space>
      ),
      children: renderComplianceChart(),
    },
    {
      key: "4",
      label: (
        <Space align="center">
          Expiring Insurances
          <AntTooltip title={`Shows insurances expiring within ${expiringThreshold} days`}>
            <QuestionCircleOutlined />
          </AntTooltip>
        </Space>
      ),
      children: renderExpiringInsurancesTable(),
    },
  ];

  const renderChartTabs = () => (
    <Card
      className="mb-6 chart-card"
      style={{ borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
    >
      <Tabs
        defaultActiveKey="1"
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key)}
        tabBarStyle={{ marginBottom: "24px" }}
        tabBarGutter={20}
        type="card"
        items={tabItems}
      />
    </Card>
  );

  // Main component return
  return (
    <div className="statistics-container" style={{ padding: "20px" }}>
      {contextHolder}
      {renderFilterSection()}
      {renderStatisticsCards()}
      {renderChartTabs()}
      {renderExportModal()}
    </div>
  );
}
