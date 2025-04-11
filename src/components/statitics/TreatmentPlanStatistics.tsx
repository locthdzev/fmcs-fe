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
  Radio,
  Dropdown,
  Menu,
  Select,
  Tooltip as AntTooltip,
  Progress,
  Alert,
  theme,
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
  Treemap,
  ScatterChart,
  Scatter,
  ComposedChart,
} from "recharts";
import { getTreatmentPlanStatistics } from "@/api/treatment-plan";
import type { DatePickerProps, RangePickerProps } from "antd/es/date-picker";
import dayjs from "dayjs";
import {
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined,
  AreaChartOutlined,
  RadarChartOutlined,
  DotChartOutlined,
  AppstoreOutlined,
  ReloadOutlined,
  DownloadOutlined,
  TableOutlined,
  FileExcelOutlined,
  QuestionCircleOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";

// Type definitions
interface StatisticsData {
  totalTreatmentPlans: number;
  totalActiveTreatmentPlans: number;
  totalCompletedTreatmentPlans: number;
  totalCancelledTreatmentPlans: number;
  treatmentPlansByStatus: Record<string, number>;
  treatmentPlansByMonth: Record<string, number>;
  treatmentPlansByDrug: Record<string, number>;
  treatmentPlansByUser: Record<string, number>;
  averageDuration: number;
  completionRate: number;
  cancellationRate: number;
  averageTreatmentPlansPerPatient: number;
  patientDistribution: Record<string, number>;
  dateRange: any;
}

interface ChartDataItem {
  name: string;
  value: number;
  count?: number;
  fill?: string;
}

interface ChartTypeOption {
  icon: React.ReactNode;
  label: string;
}

const { TabPane } = Tabs;
const { RangePicker } = DatePicker;
const { Title, Text, Paragraph } = Typography;
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
const chartTypes: Record<string, ChartTypeOption> = {
  bar: { icon: <BarChartOutlined />, label: "Bar Chart" },
  line: { icon: <LineChartOutlined />, label: "Line Chart" },
  area: { icon: <AreaChartOutlined />, label: "Area Chart" },
  pie: { icon: <PieChartOutlined />, label: "Pie Chart" },
  radar: { icon: <RadarChartOutlined />, label: "Radar Chart" },
  scatter: { icon: <DotChartOutlined />, label: "Scatter Chart" },
};

export function TreatmentPlanStatistics() {
  const { token } = useToken();
  const router = useRouter();
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    null,
    null,
  ]);
  const [activeDateFilter, setActiveDateFilter] = useState<string>("all");

  // Chart type states
  const [statusChartType, setStatusChartType] = useState<string>("pie");
  const [monthlyChartType, setMonthlyChartType] = useState<string>("line");
  const [drugChartType, setDrugChartType] = useState<string>("bar");
  const [staffChartType, setStaffChartType] = useState<string>("bar");
  const [patientDistChartType, setPatientDistChartType] =
    useState<string>("pie");
  const [activeTab, setActiveTab] = useState<string>("1");

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async (startDate?: Date, endDate?: Date) => {
    setLoading(true);
    try {
      const response = await getTreatmentPlanStatistics(startDate, endDate);
      if (response && response.isSuccess && response.data) {
        // Map the response to match the expected format
        const formattedData: StatisticsData = {
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
          averageDuration: response.data.averageDuration || 0,
          completionRate: response.data.completionRate || 0,
          cancellationRate: response.data.cancellationRate || 0,
          averageTreatmentPlansPerPatient:
            response.data.averageTreatmentPlansPerPatient || 0,
          patientDistribution: response.data.patientDistribution || {},
          dateRange: response.data.dateRange || {},
        };
        setStatistics(formattedData);
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (dates: RangePickerProps["value"]) => {
    if (dates && dates[0] && dates[1]) {
      const startDate = dates[0].toDate();
      const endDate = dates[1].toDate();
      setDateRange([startDate, endDate]);
    } else {
      setDateRange([null, null]);
    }
  };

  const applyDateFilter = () => {
    fetchStatistics(dateRange[0] || undefined, dateRange[1] || undefined);
    setActiveDateFilter("custom");
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

    setDateRange([startDate, endDate]);
    fetchStatistics(startDate || undefined, endDate);
  };

  // Function to export chart as image
  const exportChart = (chartId: string) => {
    // Implementation would require a library like html2canvas or using recharts exportChart functionality
    console.log(`Export chart with id: ${chartId}`);
    alert(
      "Export functionality would be implemented here with a proper export library"
    );
  };

  // Navigation
  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!statistics) return null;

  // Data processing functions
  const prepareChartData = () => {
    // Status distribution data
    const statusChartData: ChartDataItem[] = Object.entries(
      statistics.treatmentPlansByStatus || {}
    ).map(([status, count]) => ({
      name: status,
      value: count as number,
    }));

    // Monthly distribution data
    const monthlyChartData: ChartDataItem[] = Object.entries(
      statistics.treatmentPlansByMonth || {}
    ).map(([month, count]) => ({
      name: month,
      count: count as number,
      value: count as number,
    }));

    // Top drugs data
    const drugChartData: ChartDataItem[] = Object.entries(
      statistics.treatmentPlansByDrug || {}
    ).map(([drug, count], index) => ({
      name: drug,
      count: count as number,
      value: count as number,
      fill: COLORS[index % COLORS.length],
    }));

    // Top staff data
    const userChartData: ChartDataItem[] = Object.entries(
      statistics.treatmentPlansByUser || {}
    ).map(([user, count], index) => ({
      name: user,
      count: count as number,
      value: count as number,
      fill: COLORS[index % COLORS.length],
    }));

    // Patient distribution data
    const patientDistributionData: ChartDataItem[] = Object.entries(
      statistics.patientDistribution || {}
    ).map(([planCount, patientCount]) => ({
      name: `${planCount} plan(s)`,
      value: patientCount as number,
    }));

    return {
      statusChartData,
      monthlyChartData,
      drugChartData,
      userChartData,
      patientDistributionData,
    };
  };

  // Format date range display
  const formatDate = (date: Date | null): string => {
    return date ? dayjs(date).format("DD/MM/YYYY") : "";
  };

  const dateRangeDisplay =
    dateRange[0] && dateRange[1]
      ? `${formatDate(dateRange[0])} to ${formatDate(dateRange[1])}`
      : "All Time";

  // Extract chart data
  const {
    statusChartData,
    monthlyChartData,
    drugChartData,
    userChartData,
    patientDistributionData,
  } = prepareChartData();

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
                <RechartsTooltip formatter={(value) => [`${value} plans`]} />
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
                <RechartsTooltip formatter={(value) => [`${value} plans`]} />
                <Legend />
                <Bar dataKey="value" name="Number of Plans">
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
                <RechartsTooltip formatter={(value) => [`${value} plans`]} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={token.colorPrimary}
                  name="Number of Plans"
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
                <RechartsTooltip formatter={(value) => [`${value} plans`]} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={token.colorPrimary}
                  fill={token.colorPrimaryBg}
                  name="Number of Plans"
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
                  name="Number of Plans"
                  dataKey="value"
                  stroke={token.colorPrimary}
                  fill={token.colorPrimaryBg}
                  fillOpacity={0.6}
                />
                <Legend />
                <RechartsTooltip formatter={(value) => [`${value} plans`]} />
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
                  formatter={(value) => [`${value} plans`]}
                />
                <Legend />
                <Scatter
                  name="Number of Plans"
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
                <RechartsTooltip formatter={(value) => [`${value} plans`]} />
                <Legend />
                <Bar dataKey="value" name="Number of Plans">
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

  // Tab items definition
  const tabItems = [
    {
      key: "1",
      label: (
        <Space align="center">
          Status Distribution
          <AntTooltip title="Shows distribution of treatment plans by their status (e.g., Active, Completed, Cancelled)">
            <QuestionCircleOutlined />
          </AntTooltip>
        </Space>
      ),
      content: renderChart(
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
          <AntTooltip title="Shows number of treatment plans created in each month">
            <QuestionCircleOutlined />
          </AntTooltip>
        </Space>
      ),
      content: renderChart(
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
          Top Drugs
          <AntTooltip title="Shows the most frequently used drugs in treatment plans">
            <QuestionCircleOutlined />
          </AntTooltip>
        </Space>
      ),
      content: renderChart(
        "drugs",
        drugChartData,
        drugChartType,
        setDrugChartType
      ),
    },
    {
      key: "4",
      label: (
        <Space align="center">
          Top Staff
          <AntTooltip title="Shows staff members who created the most treatment plans">
            <QuestionCircleOutlined />
          </AntTooltip>
        </Space>
      ),
      content: renderChart(
        "staff",
        userChartData,
        staffChartType,
        setStaffChartType
      ),
    },
    {
      key: "5",
      label: (
        <Space align="center">
          Patient Distribution
          <AntTooltip title="Shows distribution of patients by the number of treatment plans they have">
            <QuestionCircleOutlined />
          </AntTooltip>
        </Space>
      ),
      content: renderChart(
        "patient",
        patientDistributionData,
        patientDistChartType,
        setPatientDistChartType
      ),
    },
  ];

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
            Treatment Plan Statistics Dashboard
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
                onClick={() =>
                  fetchStatistics(
                    dateRange[0] || undefined,
                    dateRange[1] || undefined
                  )
                }
              >
                Refresh
              </Button>
              <Button icon={<FileExcelOutlined />} type="primary">
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
                value={
                  dateRange[0] && dateRange[1]
                    ? [dayjs(dateRange[0]), dayjs(dateRange[1])]
                    : null
                }
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
                    Total Treatment Plans
                  </Title>
                  <AntTooltip title="Total number of treatment plans in the selected time period">
                    <QuestionCircleOutlined
                      style={{
                        fontSize: "14px",
                        color: token.colorTextSecondary,
                      }}
                    />
                  </AntTooltip>
                </Space>
              }
              value={statistics.totalTreatmentPlans}
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
                    Active Treatment Plans
                  </Title>
                  <AntTooltip title="Number of treatment plans currently in progress or active status">
                    <QuestionCircleOutlined
                      style={{
                        fontSize: "14px",
                        color: token.colorTextSecondary,
                      }}
                    />
                  </AntTooltip>
                </Space>
              }
              value={statistics.totalActiveTreatmentPlans}
              prefix={<Badge status="processing" />}
              valueStyle={{ color: "#1677ff" }}
            />
            <div style={{ marginTop: "10px" }}>
              <Progress
                percent={
                  (statistics.totalActiveTreatmentPlans /
                    statistics.totalTreatmentPlans) *
                  100
                }
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
                    Completed Treatment Plans
                  </Title>
                  <AntTooltip title="Number of treatment plans that have been successfully completed">
                    <QuestionCircleOutlined
                      style={{
                        fontSize: "14px",
                        color: token.colorTextSecondary,
                      }}
                    />
                  </AntTooltip>
                </Space>
              }
              value={statistics.totalCompletedTreatmentPlans}
              prefix={<Badge status="success" />}
              valueStyle={{ color: "#52c41a" }}
            />
            <div style={{ marginTop: "10px" }}>
              <Progress
                percent={
                  (statistics.totalCompletedTreatmentPlans /
                    statistics.totalTreatmentPlans) *
                  100
                }
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
                    Cancelled Treatment Plans
                  </Title>
                  <AntTooltip title="Number of treatment plans that were cancelled before completion">
                    <QuestionCircleOutlined
                      style={{
                        fontSize: "14px",
                        color: token.colorTextSecondary,
                      }}
                    />
                  </AntTooltip>
                </Space>
              }
              value={statistics.totalCancelledTreatmentPlans}
              prefix={<Badge status="error" />}
              valueStyle={{ color: "#cf1322" }}
            />
            <div style={{ marginTop: "10px" }}>
              <Progress
                percent={
                  (statistics.totalCancelledTreatmentPlans /
                    statistics.totalTreatmentPlans) *
                  100
                }
                showInfo={false}
                strokeColor="#cf1322"
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
                    Average Duration (days)
                  </Title>
                  <AntTooltip title="Average number of days between the start and end dates of treatment plans">
                    <QuestionCircleOutlined
                      style={{
                        fontSize: "14px",
                        color: token.colorTextSecondary,
                      }}
                    />
                  </AntTooltip>
                </Space>
              }
              value={statistics.averageDuration?.toFixed(2) || 0}
              precision={2}
              valueStyle={{ color: token.colorInfo }}
            />
            <div style={{ marginTop: "10px" }}>
              <Progress
                percent={Math.min((statistics.averageDuration / 30) * 100, 100)}
                showInfo={false}
                strokeColor={token.colorInfo}
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
                    Completion Rate (%)
                  </Title>
                  <AntTooltip title="Percentage of treatment plans that were successfully completed out of the total plans">
                    <QuestionCircleOutlined
                      style={{
                        fontSize: "14px",
                        color: token.colorTextSecondary,
                      }}
                    />
                  </AntTooltip>
                </Space>
              }
              value={statistics.completionRate?.toFixed(2) || 0}
              precision={2}
              valueStyle={{ color: "#1677ff" }}
              suffix="%"
            />
            <div style={{ marginTop: "10px" }}>
              <Progress
                percent={statistics.completionRate}
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
                    Cancellation Rate (%)
                  </Title>
                  <AntTooltip title="Percentage of treatment plans that were cancelled out of the total plans">
                    <QuestionCircleOutlined
                      style={{
                        fontSize: "14px",
                        color: token.colorTextSecondary,
                      }}
                    />
                  </AntTooltip>
                </Space>
              }
              value={statistics.cancellationRate?.toFixed(2) || 0}
              precision={2}
              valueStyle={{ color: "#cf1322" }}
              suffix="%"
            />
            <div style={{ marginTop: "10px" }}>
              <Progress
                percent={statistics.cancellationRate}
                showInfo={false}
                strokeColor="#cf1322"
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
                    Avg Plans Per Patient
                  </Title>
                  <AntTooltip title="Average number of treatment plans per patient, indicating how many treatments patients typically receive">
                    <QuestionCircleOutlined
                      style={{
                        fontSize: "14px",
                        color: token.colorTextSecondary,
                      }}
                    />
                  </AntTooltip>
                </Space>
              }
              value={
                statistics.averageTreatmentPlansPerPatient?.toFixed(2) || 0
              }
              precision={2}
              valueStyle={{ color: token.colorSuccess }}
            />
            <div style={{ marginTop: "10px" }}>
              <Progress
                percent={Math.min(
                  (statistics.averageTreatmentPlansPerPatient / 3) * 100,
                  100
                )}
                showInfo={false}
                strokeColor={token.colorSuccess}
              />
            </div>
          </Card>
        </Col>
      </Row>
    </>
  );

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
        items={tabItems.map((item) => ({
          key: item.key,
          label: item.label,
          children: item.content,
        }))}
      />
    </Card>
  );

  // Main component return
  return (
    <div className="history-container" style={{ padding: "20px" }}>
      {renderFilterSection()}
      {renderStatisticsCards()}
      {renderChartTabs()}
    </div>
  );
}
