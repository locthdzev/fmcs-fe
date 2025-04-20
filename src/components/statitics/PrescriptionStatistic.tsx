import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import {
  Spin,
  Empty,
  Row,
  Col,
  Card,
  Typography,
  Statistic,
  Divider,
  Tabs,
  Space,
  Select,
  Tooltip as AntTooltip,
  DatePicker,
  Button,
  theme,
  Badge,
  Progress,
  message,
  Tag,
  Modal,
  Alert,
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
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ScatterChart,
  Scatter,
} from "recharts";
import {
  getPrescriptionStatistics,
  PrescriptionStatisticsDTO,
} from "@/api/prescription";
import { toast } from "react-toastify";
import {
  MedicineBoxOutlined,
  FieldTimeOutlined,
  CalendarOutlined,
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined,
  AreaChartOutlined,
  ReloadOutlined,
  QuestionCircleOutlined,
  ArrowLeftOutlined,
  RadarChartOutlined,
  DotChartOutlined,
  AppstoreOutlined,
  FileExcelOutlined,
  LoadingOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";
import dayjs from 'dayjs';
import * as ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { useToken } = theme;

// Enhanced color palette
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
  radar: { icon: <RadarChartOutlined />, label: "Radar Chart" },
  scatter: { icon: <DotChartOutlined />, label: "Scatter Chart" },
};

interface ChartDataItem {
  name: string;
  value: number;
  count?: number;
  fill?: string;
}

export interface PrescriptionStatisticRef {
  refreshStatistics: () => void;
}

// Format date for export filename
const formatDate = (date: Date): string => {
  return date.toLocaleDateString().split('/').join('-');
};

const PrescriptionStatistic = forwardRef<PrescriptionStatisticRef, {}>((props, ref) => {
  const { token } = useToken();
  const router = useRouter();
  const [statistics, setStatistics] = useState<PrescriptionStatisticsDTO | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("1");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);
  const [activeDateFilter, setActiveDateFilter] = useState<string>("all");
  const [messageApi, contextHolder] = message.useMessage();
  
  // Export related states
  const [exportLoading, setExportLoading] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportDateRange, setExportDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);
  
  // Chart type states
  const [statusChartType, setStatusChartType] = useState("pie");
  const [monthlyChartType, setMonthlyChartType] = useState("line");
  const [staffChartType, setStaffChartType] = useState("bar");
  const [healthCheckChartType, setHealthCheckChartType] = useState("bar");

  const fetchStatistics = useCallback(async (startDate?: Date, endDate?: Date) => {
    setStatsLoading(true);
    try {
      const response = await getPrescriptionStatistics(startDate, endDate);
      if (response.success || response.isSuccess) {
        setStatistics(response.data);
      } else {
        toast.error("Failed to fetch statistics");
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
      toast.error("Failed to fetch statistics");
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  // Expose the refreshStatistics method via ref
  useImperativeHandle(ref, () => ({
    refreshStatistics: () => fetchStatistics()
  }));

  const handleDateRangeChange = (dates: any) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange([dates[0], dates[1]]);
    } else {
      setDateRange([null, null]);
    }
  };

  const applyDateFilter = () => {
    if (dateRange[0] && dateRange[1]) {
      const startDate = dateRange[0].toDate();
      const endDate = dateRange[1].toDate();
      fetchStatistics(startDate, endDate);
      setActiveDateFilter("custom");
    } else {
      messageApi.warning("Please select both start and end dates");
    }
  };

  const resetDateFilter = () => {
    setDateRange([null, null]);
    fetchStatistics();
    setActiveDateFilter("all");
  };

  const applyQuickFilter = (period: string) => {
    const today = new Date();
    let startDate: Date | null = null;
    let endDate: Date = today;

    switch (period) {
      case "last7days":
        startDate = new Date();
        startDate.setDate(today.getDate() - 7);
        setActiveDateFilter("last7days");
        break;
      case "last30days":
        startDate = new Date();
        startDate.setDate(today.getDate() - 30);
        setActiveDateFilter("last30days");
        break;
      case "last3months":
        startDate = new Date();
        startDate.setMonth(today.getMonth() - 3);
        setActiveDateFilter("last3months");
        break;
      case "last6months":
        startDate = new Date();
        startDate.setMonth(today.getMonth() - 6);
        setActiveDateFilter("last6months");
        break;
      case "thisyear":
        startDate = new Date(today.getFullYear(), 0, 1);
        setActiveDateFilter("thisyear");
        break;
      case "lastyear":
        startDate = new Date(today.getFullYear() - 1, 0, 1);
        endDate = new Date(today.getFullYear() - 1, 11, 31);
        setActiveDateFilter("lastyear");
        break;
      default:
        startDate = null;
        setActiveDateFilter("all");
    }

    // Update date range picker value
    if (startDate && endDate) {
      setDateRange([dayjs(startDate), dayjs(endDate)]);
    } else {
      setDateRange([null, null]);
    }
    
    fetchStatistics(startDate || undefined, endDate);
  };

  // Navigation
  const handleBack = () => {
    router.back();
  };

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        {contextHolder}
        <Spin size="large" />
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="flex items-center justify-center h-screen">
        {contextHolder}
        <Empty description="No statistics available" />
      </div>
    );
  }

  // Format date range display
  const formatDate = (date: dayjs.Dayjs | null): string => {
    return date ? date.format('DD/MM/YYYY') : "";
  };

  const dateRangeDisplay =
    dateRange[0] && dateRange[1]
      ? `${formatDate(dateRange[0])} to ${formatDate(dateRange[1])}`
      : "All Time";

  // Data processing functions
  const prepareChartData = () => {
    // Status distribution data
    const statusChartData: ChartDataItem[] = Object.entries(
      statistics.prescriptionsByStatus || {}
    ).map(([status, count]) => ({
      name: status,
      value: count as number,
    }));

    // Monthly distribution data
    const monthlyChartData: ChartDataItem[] = Object.entries(
      statistics.prescriptionsByMonth || {}
    ).map(([month, count]) => ({
      name: month,
      count: count as number,
      value: count as number,
    }));

    // Staff data
    const userChartData: ChartDataItem[] = Object.entries(
      statistics.prescriptionsByStaff || {}
    ).map(([user, count], index) => ({
      name: user,
      count: count as number,
      value: count as number,
      fill: COLORS[index % COLORS.length],
    }));

    // Health check result status data
    const healthCheckChartData: ChartDataItem[] = Object.entries(
      statistics.prescriptionsByHealthCheckResultStatus || {}
    ).map(([status, count], index) => ({
      name: status,
      count: count as number,
      value: count as number,
      fill: COLORS[index % COLORS.length],
    }));

    return {
      statusChartData,
      monthlyChartData,
      userChartData,
      healthCheckChartData,
    };
  };

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
                <RechartsTooltip formatter={(value) => [`${value} prescriptions`]} />
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
                <RechartsTooltip formatter={(value) => [`${value} prescriptions`]} />
                <Legend />
                <Bar dataKey="value" name="Number of Prescriptions">
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
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
                <RechartsTooltip formatter={(value) => [`${value} prescriptions`]} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={token.colorPrimary}
                  name="Number of Prescriptions"
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
                <RechartsTooltip formatter={(value) => [`${value} prescriptions`]} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={token.colorPrimary}
                  fill={token.colorPrimaryBg}
                  name="Number of Prescriptions"
                />
              </AreaChart>
            </ResponsiveContainer>
          );
        case "radar":
          return (
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                <PolarGrid />
                <PolarAngleAxis dataKey="name" />
                <PolarRadiusAxis />
                <Radar
                  name="Number of Prescriptions"
                  dataKey="value"
                  stroke={token.colorPrimary}
                  fill={token.colorPrimaryBg}
                  fillOpacity={0.6}
                />
                <Legend />
                <RechartsTooltip formatter={(value) => [`${value} prescriptions`]} />
              </RadarChart>
            </ResponsiveContainer>
          );
        case "scatter":
          return (
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart
                margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="category"
                  dataKey="name"
                  name="Name"
                  angle={-45}
                  textAnchor="end"
                  height={70}
                />
                <YAxis type="number" dataKey="value" name="Value" />
                <RechartsTooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  formatter={(value) => [`${value} prescriptions`]}
                />
                <Legend />
                <Scatter
                  name="Number of Prescriptions"
                  data={data}
                  fill={token.colorPrimary}
                />
              </ScatterChart>
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
                <RechartsTooltip formatter={(value) => [`${value} prescriptions`]} />
                <Legend />
                <Bar dataKey="value" name="Number of Prescriptions">
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
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

  const { statusChartData, monthlyChartData, userChartData, healthCheckChartData } = prepareChartData();

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
          <BarChartOutlined style={{ fontSize: "24px" }} />
          <h3 className="text-xl font-bold">
            Prescription Statistics Dashboard
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
                onClick={() => fetchStatistics(
                  dateRange[0]?.toDate() || undefined,
                  dateRange[1]?.toDate() || undefined
                )}
              >
                Refresh
              </Button>
              <Button 
                icon={<FileExcelOutlined />} 
                type="primary"
                onClick={showExportModal}
                loading={exportLoading}
              >
                Export to Excel
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
                    Total Prescriptions
                  </Title>
                  <AntTooltip title="Total number of prescriptions in the system">
                    <QuestionCircleOutlined
                      style={{
                        fontSize: "14px",
                        color: token.colorTextSecondary,
                      }}
                    />
                  </AntTooltip>
                </Space>
              }
              value={statistics.totalPrescriptions}
              prefix={<Badge status="default" />}
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
                    Total Drugs Prescribed
                  </Title>
                  <AntTooltip title="Total number of drugs prescribed across all prescriptions">
                    <QuestionCircleOutlined
                      style={{
                        fontSize: "14px",
                        color: token.colorTextSecondary,
                      }}
                    />
                  </AntTooltip>
                </Space>
              }
              value={statistics.totalDrugsPrescribed}
              prefix={<Badge status="processing" />}
              valueStyle={{ color: "#1677ff" }}
            />
            <div style={{ marginTop: "10px" }}>
              <Progress
                percent={75}
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
                    Avg. Drugs Per Prescription
                  </Title>
                  <AntTooltip title="Average number of drugs in each prescription">
                    <QuestionCircleOutlined
                      style={{
                        fontSize: "14px",
                        color: token.colorTextSecondary,
                      }}
                    />
                  </AntTooltip>
                </Space>
              }
              value={statistics.averageDrugsPerPrescription}
              precision={2}
              prefix={<Badge status="success" />}
              valueStyle={{ color: "#52c41a" }}
            />
            <div style={{ marginTop: "10px" }}>
              <Progress
                percent={Math.min((statistics.averageDrugsPerPrescription / 5) * 100, 100)}
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
                    Follow-up Required
                  </Title>
                  <AntTooltip title="Number of prescriptions requiring follow-up">
                    <QuestionCircleOutlined
                      style={{
                        fontSize: "14px",
                        color: token.colorTextSecondary,
                      }}
                    />
                  </AntTooltip>
                </Space>
              }
              value={statistics.totalPrescriptionsRequiringFollowUp}
              prefix={<Badge status="warning" />}
              valueStyle={{ color: "#faad14" }}
            />
            <div style={{ marginTop: "10px" }}>
              <Progress
                percent={(statistics.totalPrescriptionsRequiringFollowUp / statistics.totalPrescriptions) * 100}
                showInfo={false}
                strokeColor="#faad14"
              />
            </div>
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
          <AntTooltip title="Shows distribution of prescriptions by their status">
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
          Monthly Distribution
          <AntTooltip title="Shows number of prescriptions created in each month">
            <QuestionCircleOutlined />
          </AntTooltip>
        </Space>
      ),
      children: renderChart(
        "monthly",
        monthlyChartData,
        monthlyChartType,
        setMonthlyChartType
      ),
    },
    {
      key: "3",
      label: (
        <Space align="center">
          Staff Distribution
          <AntTooltip title="Shows staff members who created the most prescriptions">
            <QuestionCircleOutlined />
          </AntTooltip>
        </Space>
      ),
      children: renderChart(
        "staff",
        userChartData,
        staffChartType,
        setStaffChartType
      ),
    },
    {
      key: "4",
      label: (
        <Space align="center">
          Health Check Status
          <AntTooltip title="Shows distribution of prescriptions by health check status">
            <QuestionCircleOutlined />
          </AntTooltip>
        </Space>
      ),
      children: renderChart(
        "healthCheck",
        healthCheckChartData,
        healthCheckChartType,
        setHealthCheckChartType
      ),
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

  // Add Excel export function
  const exportToExcel = async (startDate?: any, endDate?: any) => {
    try {
      if (!statistics) {
        messageApi.error("No data available for export");
        return;
      }
      
      setExportLoading(true);
      
      // If startDate and endDate are provided, fetch data for that period
      let dataToExport = statistics;
      if (startDate && endDate) {
        try {
          const response = await getPrescriptionStatistics(startDate, endDate);
          if (response.success || response.isSuccess) {
            dataToExport = response.data;
          } else {
            throw new Error("Failed to fetch statistics for export");
          }
        } catch (error) {
          console.error("Error fetching export data:", error);
          messageApi.error("Error fetching data for export");
          setExportLoading(false);
          return;
        }
      }
      
      // Create workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "FMCS";
      workbook.created = new Date();
      
      // Add timestamp info
      const infoSheet = workbook.addWorksheet('Export Information');
      infoSheet.columns = [
        { header: 'Information', key: 'info', width: 30 },
        { header: 'Value', key: 'value', width: 50 }
      ];
      
      // Format header for info sheet
      const formatSheetHeader = (sheet: ExcelJS.Worksheet) => {
        const headerRow = sheet.getRow(1);
        headerRow.height = 25; // Set header height
        
        // Format individual header cells instead of entire row
        headerRow.eachCell((cell, colNumber) => {
          // Apply orange background only to cells with actual headers
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFF8C00' } // Dark Orange
          };
          
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });
        
        // Auto-fit columns
        sheet.columns.forEach(column => {
          column.width = column.width || 15;
        });
      };
      
      // Apply header formatting
      formatSheetHeader(infoSheet);
      
      // Add export info
      const now = new Date();
      const exportInfo = [
        { info: 'Export Date', value: now.toLocaleDateString() },
        { info: 'Export Time', value: now.toLocaleTimeString() },
        { info: 'Date Range', value: startDate && endDate ? 
            `${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}` : 'All Time' },
        { info: 'Total Prescriptions', value: dataToExport.totalPrescriptions || 0 },
        { info: 'Generated By', value: 'FMCS System' }
      ];
      
      // Add fixed row height for all sheets
      const ROW_HEIGHT = 22;
      
      exportInfo.forEach(item => {
        const row = infoSheet.addRow(item);
        // Style info rows
        row.height = ROW_HEIGHT;
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        });
      });
      
      // Create summary sheet
      const summarySheet = workbook.addWorksheet('Summary');
      summarySheet.columns = [
        { header: 'Metric', key: 'metric', width: 25 },
        { header: 'Value', key: 'value', width: 15 }
      ];
      
      // Format header
      formatSheetHeader(summarySheet);
      
      // Add summary data
      const summaryData = [
        { metric: 'Total Prescriptions', value: dataToExport.totalPrescriptions || 0 },
        { metric: 'Total Drugs Prescribed', value: dataToExport.totalDrugsPrescribed || 0 },
        { metric: 'Average Drugs Per Prescription', value: (dataToExport.averageDrugsPerPrescription || 0).toFixed(2) },
        { metric: 'Total Quantity Prescribed', value: dataToExport.totalQuantityPrescribed || 0 },
        { metric: 'Average Quantity Per Prescription', value: (dataToExport.averageQuantityPerPrescription || 0).toFixed(2) },
        { metric: 'Prescriptions Requiring Follow-Up', value: dataToExport.totalPrescriptionsRequiringFollowUp || 0 },
      ];
      
      summaryData.forEach(item => {
        const row = summarySheet.addRow(item);
        row.height = ROW_HEIGHT;
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        });
      });
      
      // Create status distribution sheet
      const statusSheet = workbook.addWorksheet('Status Distribution');
      statusSheet.columns = [
        { header: 'Status', key: 'status', width: 20 },
        { header: 'Count', key: 'count', width: 15 },
        { header: 'Percentage', key: 'percentage', width: 15 }
      ];
      
      // Format header
      formatSheetHeader(statusSheet);
      
      // Calculate total for percentages
      const totalPrescriptions = dataToExport.totalPrescriptions || 1;
      
      // Add status data
      Object.entries(dataToExport.prescriptionsByStatus || {}).forEach(([status, count]) => {
        const percentage = ((count as number) / totalPrescriptions * 100).toFixed(2) + '%';
        const row = statusSheet.addRow({ status, count, percentage });
        row.height = ROW_HEIGHT;
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        });
      });
      
      // Create monthly distribution sheet
      const monthlySheet = workbook.addWorksheet('Monthly Distribution');
      monthlySheet.columns = [
        { header: 'Month', key: 'month', width: 20 },
        { header: 'Count', key: 'count', width: 15 },
        { header: 'Percentage', key: 'percentage', width: 15 }
      ];
      
      // Format header
      formatSheetHeader(monthlySheet);
      
      // Add monthly data
      Object.entries(dataToExport.prescriptionsByMonth || {}).forEach(([month, count]) => {
        const percentage = ((count as number) / totalPrescriptions * 100).toFixed(2) + '%';
        const row = monthlySheet.addRow({ month, count, percentage });
        row.height = ROW_HEIGHT;
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        });
      });
      
      // Create staff distribution sheet
      const staffSheet = workbook.addWorksheet('Staff Distribution');
      staffSheet.columns = [
        { header: 'Staff', key: 'staff', width: 30 },
        { header: 'Count', key: 'count', width: 15 },
        { header: 'Percentage', key: 'percentage', width: 15 }
      ];
      
      // Format header
      formatSheetHeader(staffSheet);
      
      // Add staff data
      Object.entries(dataToExport.prescriptionsByStaff || {}).forEach(([staff, count]) => {
        const percentage = ((count as number) / totalPrescriptions * 100).toFixed(2) + '%';
        const row = staffSheet.addRow({ staff, count, percentage });
        row.height = ROW_HEIGHT;
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        });
      });
      
      // Create health check status sheet
      const healthCheckStatusSheet = workbook.addWorksheet('Health Check Status');
      healthCheckStatusSheet.columns = [
        { header: 'Status', key: 'status', width: 30 },
        { header: 'Count', key: 'count', width: 15 },
        { header: 'Percentage', key: 'percentage', width: 15 }
      ];
      
      // Format header
      formatSheetHeader(healthCheckStatusSheet);
      
      // Add health check status data
      Object.entries(dataToExport.prescriptionsByHealthCheckResultStatus || {}).forEach(([status, count]) => {
        const percentage = ((count as number) / totalPrescriptions * 100).toFixed(2) + '%';
        const row = healthCheckStatusSheet.addRow({ status, count, percentage });
        row.height = ROW_HEIGHT;
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        });
      });
      
      // Add export title with timestamp to each sheet
      const addExportHeader = (sheet: ExcelJS.Worksheet) => {
        sheet.insertRow(1, []);
        sheet.insertRow(1, [`Prescription Statistics Report - Exported on ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}`]);
        sheet.getRow(1).font = { bold: true, size: 14 };
        sheet.getRow(1).height = 30;
        sheet.mergeCells(`A1:${String.fromCharCode(64 + sheet.columns.length)}1`);
        sheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
      };
      
      // Add export headers to all sheets
      workbook.eachSheet((sheet) => {
        addExportHeader(sheet);
      });
      
      // Generate filename with date
      const dateStr = startDate && endDate 
        ? `_${startDate.toLocaleDateString().split('/').join('-')}_to_${endDate.toLocaleDateString().split('/').join('-')}`
        : '_all_time';
      const fileName = `prescription_statistics${dateStr}.xlsx`;
      
      // Export to file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, fileName);
      
      messageApi.success("Excel file has been downloaded successfully");
      setExportModalVisible(false);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      messageApi.error("Failed to export Excel file");
    } finally {
      setExportLoading(false);
    }
  };

  // Export modal handler
  const showExportModal = () => {
    setExportDateRange([null, null]);
    setExportModalVisible(true);
  };

  // Export date range change handler
  const handleExportDateRangeChange = (dates: any) => {
    setExportDateRange(dates);
  };
  
  // Add export modal renderer
  const renderExportModal = () => {
    return (
      <Modal
        title={
          <Space>
            <FileExcelOutlined style={{ color: '#52c41a' }} />
            <span>Export Prescription Statistics Report</span>
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
            key="exportAll"
            type="primary"
            icon={<FileExcelOutlined />}
            loading={exportLoading}
            onClick={() => exportToExcel()}
          >
            Export All Data
          </Button>,
          <Button
            key="exportRange"
            type="primary"
            icon={<FileExcelOutlined />}
            loading={exportLoading}
            disabled={!exportDateRange[0] || !exportDateRange[1]}
            onClick={() => {
              if (exportDateRange[0] && exportDateRange[1]) {
                exportToExcel(
                  exportDateRange[0].toDate(),
                  exportDateRange[1].toDate()
                );
              }
            }}
          >
            Export Data by Date
          </Button>,
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
        
        <Divider orientation="left">Report Format Information</Divider>
        
        <div style={{ marginBottom: "16px" }}>
          <Space direction="vertical" style={{ width: '100%' }}>            
            <Alert
              message="Report Contents"
              description={
                <div>
                  The export includes detailed statistics about prescriptions
                  across multiple sheets including summary data, status distribution, 
                  monthly trends, staff performance metrics, and health check status data.
                </div>
              }
              type="info"
              showIcon
              style={{ marginTop: '12px' }}
            />
          </Space>
        </div>
        
        <div style={{ marginTop: "16px" }}>
          <Title level={5}>Export Preview</Title>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: "8px" }}>
            <Tag color="orange">Summary Statistics</Tag>
            <Tag color="green">Status Distribution</Tag>
            <Tag color="blue">Monthly Distribution</Tag>
            <Tag color="purple">Staff Distribution</Tag>
            <Tag color="cyan">Health Check Status</Tag>
          </div>
        </div>
      </Modal>
    );
  };

  return (
    <div style={{ padding: "20px" }}>
      {contextHolder}
      {renderFilterSection()}
      {renderStatisticsCards()}
      {renderChartTabs()}
      {renderExportModal()}
    </div>
  );
});

PrescriptionStatistic.displayName = 'PrescriptionStatistic';

export default PrescriptionStatistic;
