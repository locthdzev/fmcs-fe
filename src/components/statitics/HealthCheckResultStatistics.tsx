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
  Select,
  Tooltip as AntTooltip,
  Progress,
  Alert,
  theme,
  Menu,
  message,
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
import { getHealthCheckResultsStatistics } from "@/api/healthcheckresult";
import type { RangePickerProps } from "antd/es/date-picker";
import dayjs from "dayjs";
import {
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined,
  AreaChartOutlined,
  RadarChartOutlined,
  ReloadOutlined,
  QuestionCircleOutlined,
  ArrowLeftOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  StopOutlined,
  IdcardOutlined,
  UserAddOutlined,
  DownloadOutlined,
  DotChartOutlined,
  AppstoreOutlined,
  TableOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";
import * as ExcelJS from "exceljs";
import { format } from "date-fns";

const { useToken } = theme;
const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

// Type definitions
interface StatisticsData {
  totalResults: number;
  resultsNeedingFollowUp: number;
  completedResults: number;
  overdueFollowUpResults: number;
  statusDistribution: {
    waitingForApproval: number;
    followUpRequired: number;
    noFollowUpRequired: number;
    completed: number;
    cancelledCompletely: number;
    cancelledForAdjustment: number;
    softDeleted: number;
  };
  followUpStatistics: {
    totalFollowUps: number;
    upcomingFollowUps: number;
    overdueFollowUps: number;
    followUpsToday: number;
  };
  monthlyDistribution: Array<{
    year: number;
    month: number;
    count: number;
  }>;
}

interface ChartDataItem {
  name: string;
  value: number;
  count?: number;
  fill?: string;
}

// Chart type options
const chartTypes: Record<string, { icon: React.ReactNode; label: string }> = {
  bar: { icon: <BarChartOutlined />, label: "Bar Chart" },
  line: { icon: <LineChartOutlined />, label: "Line Chart" },
  area: { icon: <AreaChartOutlined />, label: "Area Chart" },
  pie: { icon: <PieChartOutlined />, label: "Pie Chart" },
  radar: { icon: <RadarChartOutlined />, label: "Radar Chart" },
  scatter: { icon: <DotChartOutlined />, label: "Scatter Chart" },
};

// Colors for the charts
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

export function HealthCheckResultStatistics() {
  const { token } = useToken();
  const router = useRouter();
  
  // State variables
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [dateRange, setDateRange] = useState<[Date | undefined, Date | undefined]>([
    undefined,
    undefined,
  ]);
  const [activeDateFilter, setActiveDateFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("1");
  const [dataVersion, setDataVersion] = useState(0);

  // Chart type states
  const [statusChartType, setStatusChartType] = useState<string>("pie");
  const [followUpChartType, setFollowUpChartType] = useState<string>("bar");
  const [monthlyChartType, setMonthlyChartType] = useState<string>("line");
  
  // Fetch data on component mount
  useEffect(() => {
    fetchStatistics();
  }, []);

  // Data processing functions
  const prepareChartData = () => {
    if (!statistics) {
      return {
        statusChartData: [],
        followUpChartData: [],
        monthlyChartData: [],
      };
    }

    // Status distribution data
    const statusChartData: ChartDataItem[] = Object.entries(
      statistics.statusDistribution
    )
    .filter(([_, count]) => count > 0)
    .map(([status, count]) => {
      let displayName = status;
      switch (status) {
        case "waitingForApproval":
          displayName = "Waiting for Approval";
          break;
        case "followUpRequired":
          displayName = "Follow-up Required";
          break;
        case "noFollowUpRequired":
          displayName = "No Follow-up Required";
          break;
        case "completed":
          displayName = "Completed";
          break;
        case "cancelledCompletely":
          displayName = "Cancelled";
          break;
        case "cancelledForAdjustment":
          displayName = "Cancelled for Adjustment";
          break;
        case "softDeleted":
          displayName = "Soft Deleted";
          break;
      }
      return {
        name: displayName,
        value: count as number,
      };
    });

    // Follow-up statistics data
    const followUpChartData: ChartDataItem[] = Object.entries(
      statistics.followUpStatistics
    )
    .filter(([_, count]) => count > 0)
    .map(([type, count]) => {
      let displayName = type;
      switch (type) {
        case "totalFollowUps":
          displayName = "Total Follow-ups";
          break;
        case "upcomingFollowUps":
          displayName = "Upcoming Follow-ups";
          break;
        case "overdueFollowUps":
          displayName = "Overdue Follow-ups";
          break;
        case "followUpsToday":
          displayName = "Follow-ups Today";
          break;
      }
      return {
        name: displayName,
        value: count as number,
      };
    });

    // Monthly distribution data
    const monthlyChartData: ChartDataItem[] = statistics.monthlyDistribution
      .filter(item => item.count > 0)
      .map((item) => ({
        name: `${new Date(item.year, item.month - 1).toLocaleString('default', { month: 'short' })} ${item.year}`,
        value: item.count,
      }));

    return {
      statusChartData,
      followUpChartData,
      monthlyChartData,
    };
  };

  // Memoize chart data
  const chartData = React.useMemo(() => {
    return prepareChartData();
  }, [statistics, dataVersion]);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const response = await getHealthCheckResultsStatistics();
      if (response.isSuccess) {
        setStatistics(response.data);
      } else {
        message.error(response.message || "Không thể tải thống kê");
        setStatistics(null);
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
      message.error("Không thể tải thống kê");
      setStatistics(null);
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
      setDateRange([undefined, undefined]);
    }
  };

  const applyDateFilter = () => {
    if (dateRange[0] && dateRange[1]) {
      fetchStatistics();
      setActiveDateFilter("custom");
    } else {
      message.error("Vui lòng chọn khoảng thời gian!");
    }
  };

  const resetDateFilter = () => {
    setDateRange([undefined, undefined]);
    fetchStatistics();
    setActiveDateFilter("all");
  };

  const applyQuickFilter = (period: string) => {
    const today = new Date();
    let startDate: Date | undefined = undefined;
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
        startDate = undefined;
        setActiveDateFilter("all");
    }

    setDateRange([startDate, endDate]);
    fetchStatistics();
  };

  const handleRefresh = () => {
    fetchStatistics();
  };

  // Navigation
  const handleBack = () => {
    router.back();
  };

  const exportToExcel = async () => {
    if (!statistics) {
      message.error("Không có dữ liệu để xuất");
      return;
    }
    
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "FMCS System";
      workbook.lastModifiedBy = "FMCS System";
      workbook.created = new Date();
      workbook.modified = new Date();

      const sheet = workbook.addWorksheet("Health Check Results Statistics");
      
      // Title
      sheet.mergeCells('A1:B1');
      sheet.getCell('A1').value = `Health Check Results Statistics Report - Exported on ${format(new Date(), "dd/M/yyyy")} at ${format(new Date(), "HH:mm:ss")}`;
      sheet.getCell('A1').font = { bold: true };
      
      // Headers
      sheet.getCell('A3').value = "Information";
      sheet.getCell('B3').value = "Value";
      sheet.getRow(3).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFf8a102' }  // Orange color
      };
      sheet.getRow(3).font = { bold: true, color: { argb: 'FFFFFFFF' } };  // White text

      // Data rows
      const rows = [
        ["Export Date", format(new Date(), "dd/M/yyyy")],
        ["Export Time", format(new Date(), "HH:mm:ss")],
        ["Date Range", dateRangeDisplay],
        ["Total Results", statistics.totalResults],
        ["Generated By", "FMCS System"]
      ];

      rows.forEach((row, index) => {
        sheet.addRow(row);
      });

      // Styling
      sheet.getColumn('A').width = 20;
      sheet.getColumn('B').width = 30;

      // Save the workbook
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `health_check_results_statistics_${format(new Date(), "yyyy-MM-dd")}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      message.error("Không thể xuất file Excel");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spin size="large" tip="Loading statistics..." />
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Alert
          message="Error"
          description="Failed to load statistics. Please try again later."
          type="error"
          showIcon
        />
      </div>
    );
  }

  // Format date range display
  const formatDate = (date: Date | null): string => {
    return date ? dayjs(date).format("DD/MM/YYYY") : "";
  };

  const getDateRangeDisplay = () => {
    if (dateRange[0] && dateRange[1]) {
      return `${formatDate(dateRange[0])} - ${formatDate(dateRange[1])}`;
    }
    return "All Time";
  };

  const dateRangeDisplay = getDateRangeDisplay();

  // Chart renderer
  const renderChart = (
    type: string,
    data: ChartDataItem[],
    chartType: string,
    setChartType: React.Dispatch<React.SetStateAction<string>>
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
                <RechartsTooltip formatter={(value) => [`${value} results`]} />
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
                <RechartsTooltip formatter={(value) => [`${value} results`]} />
                <Legend />
                <Bar dataKey="value" name="Number of Results">
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
                <RechartsTooltip formatter={(value) => [`${value} results`]} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={token.colorPrimary}
                  name="Number of Results"
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
                <RechartsTooltip formatter={(value) => [`${value} results`]} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={token.colorPrimary}
                  fill={token.colorPrimaryBg}
                  name="Number of Results"
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
                  name="Number of Results"
                  dataKey="value"
                  stroke={token.colorPrimary}
                  fill={token.colorPrimaryBg}
                  fillOpacity={0.6}
                />
                <Legend />
                <RechartsTooltip formatter={(value) => [`${value} results`]} />
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
                  name="Category" 
                  angle={-45}
                  textAnchor="end"
                  height={70}
                />
                <YAxis type="number" dataKey="value" name="Value" />
                <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} formatter={(value) => [`${value} results`]} />
                <Legend />
                <Scatter
                  name="Number of Results"
                  data={data}
                  fill={token.colorPrimary}
                />
              </ScatterChart>
            </ResponsiveContainer>
          );
        default:
          return <div>Please select a chart type</div>;
      }
    };

    return (
      <div style={{ width: "100%" }}>
        {chartConfigMenu}
        {renderChartComponent()}
      </div>
    );
  };

  // Common chart data
  const { statusChartData, followUpChartData, monthlyChartData } = chartData;

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
          <TeamOutlined style={{ fontSize: "24px" }} />
          <h3 className="text-xl font-bold">
            Health Check Result Statistics Dashboard
          </h3>
        </div>
        <div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
              Refresh
            </Button>
            <Button icon={<FileExcelOutlined />} type="primary" onClick={exportToExcel}>
              Export to Excel
            </Button>
          </Space>
        </div>
      </div>
    </>
  );

  const renderStatisticsCards = () => (
    <>
      <Card 
        className="mb-6 statistics-summary-card"
        style={{ borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
        title={
          <Title level={4} style={{ margin: 0 }}>
            <TeamOutlined style={{ marginRight: "8px" }} />
            Health Check Results Overview
          </Title>
        }
      >
        <Row gutter={[16, 16]} className="mb-6">
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
                      Total Results
                    </Title>
                    <AntTooltip title="Total number of health check results in the system">
                      <QuestionCircleOutlined
                        style={{
                          fontSize: "14px",
                          color: token.colorTextSecondary,
                        }}
                      />
                    </AntTooltip>
                  </Space>
                }
                value={statistics.totalResults}
                valueStyle={{ color: token.colorTextHeading }}
                prefix={<Badge status="default" />}
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
                      Need Follow-up
                    </Title>
                    <AntTooltip title="Number of results requiring follow-up">
                      <QuestionCircleOutlined
                        style={{
                          fontSize: "14px",
                          color: token.colorTextSecondary,
                        }}
                      />
                    </AntTooltip>
                  </Space>
                }
                value={statistics.statusDistribution.followUpRequired}
                valueStyle={{ color: "#faad14" }}
                prefix={<Badge status="warning" />}
              />
              <div style={{ marginTop: "10px" }}>
                <Progress
                  percent={Math.round(
                    (statistics.statusDistribution.followUpRequired / statistics.totalResults) * 100
                  )}
                  showInfo={false}
                  strokeColor="#faad14"
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
                      Completed
                    </Title>
                    <AntTooltip title="Number of completed results">
                      <QuestionCircleOutlined
                        style={{
                          fontSize: "14px",
                          color: token.colorTextSecondary,
                        }}
                      />
                    </AntTooltip>
                  </Space>
                }
                value={statistics.statusDistribution.completed}
                valueStyle={{ color: "#52c41a" }}
                prefix={<Badge status="success" />}
              />
              <div style={{ marginTop: "10px" }}>
                <Progress
                  percent={Math.round(
                    (statistics.statusDistribution.completed / statistics.totalResults) * 100
                  )}
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
                      Overdue Follow-ups
                    </Title>
                    <AntTooltip title="Number of overdue follow-up results">
                      <QuestionCircleOutlined
                        style={{
                          fontSize: "14px",
                          color: token.colorTextSecondary,
                        }}
                      />
                    </AntTooltip>
                  </Space>
                }
                value={statistics.followUpStatistics.overdueFollowUps}
                valueStyle={{ color: "#f5222d" }}
                prefix={<Badge status="error" />}
              />
              <div style={{ marginTop: "10px" }}>
                <Progress
                  percent={Math.round(
                    (statistics.followUpStatistics.overdueFollowUps / statistics.followUpStatistics.totalFollowUps) * 100
                  )}
                  showInfo={false}
                  strokeColor="#f5222d"
                />
              </div>
            </Card>
          </Col>
        </Row>
      </Card>
    </>
  );

  const renderChartTabs = () => (
    <Card
      className="mb-6 chart-card"
      style={{ borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
      title={
        <Title level={4} style={{ margin: 0 }}>
          <BarChartOutlined style={{ marginRight: "8px" }} />
          Detailed Analysis
        </Title>
      }
    >
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key)}
        tabBarStyle={{ marginBottom: "24px" }}
        tabBarGutter={20}
        type="card"
        items={[
          {
            key: "1",
            label: (
              <Space align="center">
                <TeamOutlined />
                Status Distribution
                <AntTooltip title="Shows distribution of results by status">
                  <QuestionCircleOutlined />
                </AntTooltip>
              </Space>
            ),
            children: renderChart("status", statusChartData, statusChartType, setStatusChartType),
          },
          {
            key: "2",
            label: (
              <Space align="center">
                <IdcardOutlined />
                Follow-up Statistics
                <AntTooltip title="Shows follow-up statistics">
                  <QuestionCircleOutlined />
                </AntTooltip>
              </Space>
            ),
            children: renderChart("follow-up", followUpChartData, followUpChartType, setFollowUpChartType),
          },
          {
            key: "3",
            label: (
              <Space align="center">
                <LineChartOutlined />
                Monthly Distribution
                <AntTooltip title="Shows number of results by month">
                  <QuestionCircleOutlined />
                </AntTooltip>
              </Space>
            ),
            children: renderChart("monthly", monthlyChartData, monthlyChartType, setMonthlyChartType),
          },
        ]}
      />
    </Card>
  );

  // Main render
  return (
    <div className="history-container" style={{ padding: "20px" }}>
      {renderFilterSection()}
      {renderStatisticsCards()}
      {renderChartTabs()}
    </div>
  );
}

export default HealthCheckResultStatistics; 