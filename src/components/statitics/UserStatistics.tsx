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
} from "@ant-design/icons";
import { useRouter } from "next/router";

const { useToken } = theme;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

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
type ChartType = "pie" | "bar" | "line" | "area" | "radar";

// Colors for the charts
const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
  "#FFC658",
  "#FF6B6B",
  "#6A6AFF",
  "#FF96FF",
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

  // Chart type states
  const [roleChartType, setRoleChartType] = useState<ChartType>("pie");
  const [genderChartType, setGenderChartType] = useState<ChartType>("pie");
  const [monthlyChartType, setMonthlyChartType] = useState<ChartType>("bar");
  
  // Common chart data
  const { roleChartData, genderChartData, monthlyChartData } =
    statistics ? prepareChartData() : { roleChartData: [], genderChartData: [], monthlyChartData: [] };

  // Fetch data on component mount and when date range changes
  useEffect(() => {
    fetchStatistics(dateRange[0], dateRange[1]);
  }, [dateRange]);

  const fetchStatistics = async (startDate?: Date | null, endDate?: Date | null) => {
    setLoading(true);
    try {
      const response = await getUserStatistics(startDate || undefined, endDate || undefined);
      if (response && response.isSuccess && response.data) {
        setStatistics(response.data);
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
    const monthlyChartData: ChartDataItem[] = Object.entries(
      statistics?.usersByMonthCreated || {}
    ).map(([month, count]) => ({
      name: month,
      count: count as number,
      value: count as number,
    }));

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

  const dateRangeDisplay =
    dateRange[0] && dateRange[1]
      ? `${formatDate(dateRange[0])} - ${formatDate(dateRange[1])}`
      : "All Time";

  // Chart renderer
  const renderChart = (
    chartId: string,
    data: ChartDataItem[],
    chartType: ChartType,
    setChartType: React.Dispatch<React.SetStateAction<ChartType>>
  ) => {
    // Chart type options
    const chartTypes = [
      { key: "pie", icon: <PieChartOutlined />, text: "Pie" },
      { key: "bar", icon: <BarChartOutlined />, text: "Bar" },
      { key: "line", icon: <LineChartOutlined />, text: "Line" },
      { key: "area", icon: <AreaChartOutlined />, text: "Area" },
      { key: "radar", icon: <RadarChartOutlined />, text: "Radar" },
    ];

    // Chart config menu
    const chartConfigMenu = (
      <div className="flex justify-end mb-2">
        <Radio.Group
          value={chartType}
          onChange={(e) => setChartType(e.target.value)}
          buttonStyle="solid"
          size="small"
        >
          {chartTypes.map((type) => (
            <Radio.Button key={`${chartId}-${type.key}`} value={type.key}>
              {type.icon} {type.text}
            </Radio.Button>
          ))}
        </Radio.Group>
      </div>
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

  // Tab items definition
  const tabItems = [
    {
      key: "1",
      label: (
        <Space align="center">
          Role Distribution
          <AntTooltip title="Shows distribution of users by their roles">
            <QuestionCircleOutlined />
          </AntTooltip>
        </Space>
      ),
      content: renderChart(
        "role",
        roleChartData,
        roleChartType,
        setRoleChartType
      ),
    },
    {
      key: "2",
      label: (
        <Space align="center">
          Gender Distribution
          <AntTooltip title="Shows distribution of users by gender">
            <QuestionCircleOutlined />
          </AntTooltip>
        </Space>
      ),
      content: renderChart(
        "gender",
        genderChartData,
        genderChartType,
        setGenderChartType
      ),
    },
    {
      key: "3",
      label: (
        <Space align="center">
          Monthly Registration
          <AntTooltip title="Shows number of users registered in each month">
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
          <TeamOutlined style={{ fontSize: "24px" }} />
          <h3 className="text-xl font-bold">
            User Statistics Dashboard
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <RangePicker
            value={
              dateRange[0] && dateRange[1]
                ? [dayjs(dateRange[0]), dayjs(dateRange[1])]
                : null
            }
            onChange={handleDateRangeChange}
            allowClear
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            title="Refresh data"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Date range display */}
      <Alert
        message={
          <Space align="center">
            <span>Showing statistics for: </span>
            <Text strong>{dateRangeDisplay}</Text>
          </Space>
        }
        type="info"
        showIcon
        style={{ marginBottom: "16px" }}
      />
    </>
  );

  const renderStatisticsCards = () => (
    <>
      <Divider orientation="left">User Summary</Divider>
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
              valueStyle={{ color: token.colorPrimary }}
              prefix={<TeamOutlined />}
            />
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
              valueStyle={{ color: token.colorSuccess }}
              prefix={<CheckCircleOutlined />}
            />
            <div style={{ marginTop: "10px" }}>
              <Progress
                percent={Math.round(
                  ((statistics?.activeUsers || 0) / (statistics?.totalUsers || 1)) * 100
                )}
                status="success"
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
              valueStyle={{ color: token.colorError }}
              prefix={<StopOutlined />}
            />
            <div style={{ marginTop: "10px" }}>
              <Progress
                percent={Math.round(
                  ((statistics?.inactiveUsers || 0) / (statistics?.totalUsers || 1)) * 100
                )}
                status="exception"
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
                    Multi-Role Users
                  </Title>
                  <AntTooltip title="Number of users with multiple roles">
                    <QuestionCircleOutlined
                      style={{
                        fontSize: "14px",
                        color: token.colorTextSecondary,
                      }}
                    />
                  </AntTooltip>
                </Space>
              }
              value={statistics?.usersWithMultipleRoles || 0}
              valueStyle={{ color: token.colorInfo }}
              prefix={<IdcardOutlined />}
            />
            <div style={{ marginTop: "10px" }}>
              <Progress
                percent={Math.round(
                  ((statistics?.usersWithMultipleRoles || 0) / (statistics?.totalUsers || 1)) * 100
                )}
                status="active"
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* New User Growth Statistics */}
      <Divider orientation="left">User Growth</Divider>
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
              prefix={<UserAddOutlined />}
            />
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
              prefix={<UserAddOutlined />}
            />
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
              prefix={<UserAddOutlined />}
            />
          </Card>
        </Col>
      </Row>
    </>
  );

  // Main render
  return (
    <div className="p-6">
      {renderFilterSection()}
      {renderStatisticsCards()}
      
      <Divider orientation="left">Detailed Analysis</Divider>
      <Card>
        <Tabs
          defaultActiveKey="1"
          type="card"
          size="large"
          items={tabItems.map((item) => ({
            label: item.label,
            key: item.key,
            children: item.content,
          }))}
        />
      </Card>
    </div>
  );
}

export default UserStatistics; 