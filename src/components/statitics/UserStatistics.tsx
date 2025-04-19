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
import { getUserStatistics } from "@/api/user";
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

const { useToken } = theme;
const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

// Type definitions
interface StatisticsData {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  usersByRole: Record<string, number>;
  usersWithMultipleRoles: number;
  usersByGender: Record<string, number>;
  usersByMonthCreated?: Record<string, number>;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  newUsersThisYear: number;
  usersInDateRange: number;
  startDate: string | null;
  endDate: string | null;
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

export function UserStatistics() {
  const { token } = useToken();
  const router = useRouter();
  
  // State variables
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    null,
    null,
  ]);
  const [activeDateFilter, setActiveDateFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("1");
  
  // Thêm state để theo dõi khi nào dữ liệu được cập nhật
  const [dataVersion, setDataVersion] = useState(0);

  // Chart type states
  const [roleChartType, setRoleChartType] = useState<string>("pie");
  const [genderChartType, setGenderChartType] = useState<string>("pie");
  const [monthlyChartType, setMonthlyChartType] = useState<string>("line");
  
  // Fetch data on component mount
  useEffect(() => {
    fetchStatistics();
  }, []);

  // Memoize chart data để cập nhật khi statistics hoặc dataVersion thay đổi
  const chartData = React.useMemo(() => {
    return prepareChartData();
  }, [statistics, dataVersion]);

  const fetchStatistics = async (startDate?: Date | null, endDate?: Date | null) => {
    setLoading(true);
    try {
      console.log("Đang tải dữ liệu với filter:", { startDate, endDate });
      
      // Gọi API với tham số date nếu có
      const response = await getUserStatistics(
        startDate || undefined, 
        endDate || undefined
      );
      
      if (response && response.isSuccess && response.data) {
        console.log("Dữ liệu đã lọc:", response.data);
        console.log("Date range:", startDate, endDate);
        
        // Kiểm tra xem usersByMonthCreated có dữ liệu không
        if (response.data.usersByMonthCreated) {
          console.log("Monthly data:", response.data.usersByMonthCreated);
        } else {
          console.warn("Không có dữ liệu theo tháng!");
        }
        
        // Cập nhật state với dữ liệu mới
        setStatistics(response.data);
        // Tăng data version để trigger re-render
        setDataVersion(prev => prev + 1);
      } else {
        console.error("API trả về lỗi hoặc không có dữ liệu", response);
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
    // Không fetch dữ liệu ở đây, chờ người dùng nhấn Apply
  };

  const applyDateFilter = () => {
    console.log("Applying date filter:", dateRange);
    if (dateRange[0] && dateRange[1]) {
      fetchStatistics(dateRange[0], dateRange[1]);
      setActiveDateFilter("custom");
    } else {
      alert("Vui lòng chọn khoảng thời gian!");
    }
  };

  const resetDateFilter = () => {
    setDateRange([null, null]);
    fetchStatistics(); // Fetch lại dữ liệu không có filter
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

  const handleRefresh = () => {
    fetchStatistics(dateRange[0], dateRange[1]);
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
  function prepareChartData() {
    // Role distribution data
    const roleChartData: ChartDataItem[] = Object.entries(
      statistics?.usersByRole || {}
    ).map(([role, count]) => ({
      name: role,
      value: count as number,
    }));

    // Gender distribution data
    const genderChartData: ChartDataItem[] = Object.entries(
      statistics?.usersByGender || {}
    ).map(([gender, count]) => ({
      name: gender,
      value: count as number,
    }));

    // Monthly distribution data
    let monthlyChartData: ChartDataItem[] = [];
    
    if (statistics?.usersByMonthCreated && Object.keys(statistics.usersByMonthCreated).length > 0) {
      // Sử dụng dữ liệu từ API
      monthlyChartData = Object.entries(statistics.usersByMonthCreated)
        .map(([month, count]) => ({
          name: month,
          count: count as number,
          value: count as number,
        }))
        .sort((a, b) => {
          // Sắp xếp tháng theo thứ tự thời gian
          const dateA = new Date(a.name);
          const dateB = new Date(b.name);
          return dateA.getTime() - dateB.getTime();
        });
    } else {
      // Nếu không có dữ liệu, để mảng rỗng
      monthlyChartData = [];
    }

    console.log('Đã chuẩn bị dữ liệu biểu đồ:', {
      roleChartData,
      genderChartData,
      monthlyChartData
    });

    return {
      roleChartData,
      genderChartData,
      monthlyChartData,
    };
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

  // Lưu giá trị chuỗi
  const dateRangeDisplay = getDateRangeDisplay();

  const renderDateRangeInfo = () => {
    if (!statistics) return null;
    
    const totalUsers = statistics.totalUsers || 0;
    const usersInRange = statistics.usersInDateRange || totalUsers;
    const isFiltered = dateRange[0] && dateRange[1] && usersInRange !== totalUsers;
    
    return (
      <Badge
        status={isFiltered ? "warning" : "processing"}
        text={
          <Space direction="vertical" size="small">
            <Text strong style={{ fontSize: "14px" }}>
              Current Filter: {dateRangeDisplay}
            </Text>
            {dateRange[0] && dateRange[1] && (
              <Text style={{ fontSize: "12px" }}>
                {usersInRange} users in date range 
                {totalUsers > 0 && ` (${Math.round((usersInRange / totalUsers) * 100)}% of total)`}
              </Text>
            )}
          </Space>
        }
      />
    );
  };

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
                <RechartsTooltip formatter={(value) => [`${value} users`]} />
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
                <RechartsTooltip formatter={(value) => [`${value} users`]} />
                <Legend />
                <Bar dataKey="value" name="Number of Users">
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
                <RechartsTooltip formatter={(value) => [`${value} users`]} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={token.colorPrimary}
                  name="Number of Users"
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
                <RechartsTooltip formatter={(value) => [`${value} users`]} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={token.colorPrimary}
                  fill={token.colorPrimaryBg}
                  name="Number of Users"
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
                  name="Number of Users"
                  dataKey="value"
                  stroke={token.colorPrimary}
                  fill={token.colorPrimaryBg}
                  fillOpacity={0.6}
                />
                <Legend />
                <RechartsTooltip formatter={(value) => [`${value} users`]} />
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
                <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} formatter={(value) => [`${value} users`]} />
                <Legend />
                <Scatter
                  name="Number of Users"
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

    // Return chart with controls
    return (
      <div style={{ width: "100%" }}>
        {chartConfigMenu}
        {renderChartComponent()}
      </div>
    );
  };

  // Common chart data
  const { roleChartData, genderChartData, monthlyChartData } = chartData;

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
            User Statistics Dashboard
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
                onClick={handleRefresh}
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
                type={activeDateFilter === "last3months" ? "primary" : "default"}
                onClick={() => applyQuickFilter("last3months")}
              >
                Last 3 Months
              </Button>
              <Button
                type={activeDateFilter === "last6months" ? "primary" : "default"}
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
            {renderDateRangeInfo()}
          </Col>
        </Row>
        
        {/* Thêm thông báo khi biểu đồ đang dùng dữ liệu đã lọc */}
        {dateRange[0] && dateRange[1] && (
          <Alert
            message="Filtered Data"
            description="Biểu đồ đang hiển thị dữ liệu trong khoảng thời gian đã chọn."
            type="info"
            showIcon
            style={{ marginTop: "12px" }}
          />
        )}
      </Card>
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
            User Summary
          </Title>
        }
      >
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} md={8}>
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
                      Total Users
                    </Title>
                    <AntTooltip title="Total number of users in the system">
                      <QuestionCircleOutlined
                        style={{
                          fontSize: "14px",
                          color: token.colorTextSecondary,
                        }}
                      />
                    </AntTooltip>
                  </Space>
                }
                value={statistics?.totalUsers || 0}
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

          <Col xs={24} sm={12} md={8}>
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
                      Active Users
                    </Title>
                    <AntTooltip title="Number of active users in the system">
                      <QuestionCircleOutlined
                        style={{
                          fontSize: "14px",
                          color: token.colorTextSecondary,
                        }}
                      />
                    </AntTooltip>
                  </Space>
                }
                value={statistics?.activeUsers || 0}
                valueStyle={{ color: "#1677ff" }}
                prefix={<Badge status="processing" />}
              />
              <div style={{ marginTop: "10px" }}>
                <Progress
                  percent={Math.round(
                    ((statistics?.activeUsers || 0) / (statistics?.totalUsers || 1)) * 100
                  )}
                  showInfo={false}
                  strokeColor="#1677ff"
                />
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={8}>
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
                      Inactive Users
                    </Title>
                    <AntTooltip title="Number of inactive users in the system">
                      <QuestionCircleOutlined
                        style={{
                          fontSize: "14px",
                          color: token.colorTextSecondary,
                        }}
                      />
                    </AntTooltip>
                  </Space>
                }
                value={statistics?.inactiveUsers || 0}
                valueStyle={{ color: "#52c41a" }}
                prefix={<Badge status="success" />}
              />
              <div style={{ marginTop: "10px" }}>
                <Progress
                  percent={Math.round(
                    ((statistics?.inactiveUsers || 0) / (statistics?.totalUsers || 1)) * 100
                  )}
                  showInfo={false}
                  strokeColor="#52c41a"
                />
              </div>
            </Card>
          </Col>
        </Row>

        <Divider style={{ margin: "16px 0" }} />

        {/* New User Growth Statistics */}
        <Title level={4} style={{ margin: "16px 0" }}>
          <UserAddOutlined style={{ marginRight: "8px" }} />
          User Growth
        </Title>
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={8}>
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
                      New Users This Week
                    </Title>
                    <AntTooltip title="Users registered in the last 7 days">
                      <QuestionCircleOutlined
                        style={{
                          fontSize: "14px",
                          color: token.colorTextSecondary,
                        }}
                      />
                    </AntTooltip>
                  </Space>
                }
                value={statistics?.newUsersThisWeek || 0}
                valueStyle={{ color: '#52c41a' }}
                prefix={<Badge status="success" />}
              />
              <div style={{ marginTop: "10px" }}>
                <Progress
                  percent={Math.round(
                    ((statistics?.newUsersThisWeek || 0) / (statistics?.totalUsers || 1)) * 100
                  )}
                  showInfo={false}
                  strokeColor="#52c41a"
                />
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={8}>
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
                      New Users This Month
                    </Title>
                    <AntTooltip title="Users registered in the last 30 days">
                      <QuestionCircleOutlined
                        style={{
                          fontSize: "14px",
                          color: token.colorTextSecondary,
                        }}
                      />
                    </AntTooltip>
                  </Space>
                }
                value={statistics?.newUsersThisMonth || 0}
                valueStyle={{ color: '#1890ff' }}
                prefix={<Badge status="processing" />}
              />
              <div style={{ marginTop: "10px" }}>
                <Progress
                  percent={Math.round(
                    ((statistics?.newUsersThisMonth || 0) / (statistics?.totalUsers || 1)) * 100
                  )}
                  showInfo={false}
                  strokeColor="#1890ff"
                />
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={8}>
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
                      New Users This Year
                    </Title>
                    <AntTooltip title="Users registered in the current year">
                      <QuestionCircleOutlined
                        style={{
                          fontSize: "14px",
                          color: token.colorTextSecondary,
                        }}
                      />
                    </AntTooltip>
                  </Space>
                }
                value={statistics?.newUsersThisYear || 0}
                valueStyle={{ color: '#722ed1' }}
                prefix={<Badge status="warning" />}
              />
              <div style={{ marginTop: "10px" }}>
                <Progress
                  percent={Math.round(
                    ((statistics?.newUsersThisYear || 0) / (statistics?.totalUsers || 1)) * 100
                  )}
                  showInfo={false}
                  strokeColor="#722ed1"
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
                Role Distribution
                <AntTooltip title="Shows distribution of users by their roles">
                  <QuestionCircleOutlined />
                </AntTooltip>
              </Space>
            ),
            children: renderChart("role", roleChartData, roleChartType, setRoleChartType),
          },
          {
            key: "2",
            label: (
              <Space align="center">
                <IdcardOutlined />
                Gender Distribution
                <AntTooltip title="Shows distribution of users by gender">
                  <QuestionCircleOutlined />
                </AntTooltip>
              </Space>
            ),
            children: renderChart("gender", genderChartData, genderChartType, setGenderChartType),
          },
          {
            key: "3",
            label: (
              <Space align="center">
                <LineChartOutlined />
                Monthly Registration
                <AntTooltip title="Shows number of users registered in each month">
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

export default UserStatistics; 