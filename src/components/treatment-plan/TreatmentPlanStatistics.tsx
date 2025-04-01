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
  theme
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
import type { DatePickerProps, RangePickerProps } from 'antd/es/date-picker';
import dayjs from 'dayjs';
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
  FileExcelOutlined
} from '@ant-design/icons';

const { TabPane } = Tabs;
const { RangePicker } = DatePicker;
const { Title, Text, Paragraph } = Typography;
const { useToken } = theme;

// Enhanced color palette
const COLORS = [
  '#1677ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', 
  '#13c2c2', '#fa8c16', '#eb2f96', '#a0d911', '#1890ff'
];

// Chart type options
const chartTypes = {
  bar: { icon: <BarChartOutlined />, label: 'Bar Chart' },
  line: { icon: <LineChartOutlined />, label: 'Line Chart' },
  area: { icon: <AreaChartOutlined />, label: 'Area Chart' },
  pie: { icon: <PieChartOutlined />, label: 'Pie Chart' },
  radar: { icon: <RadarChartOutlined />, label: 'Radar Chart' },
  scatter: { icon: <DotChartOutlined />, label: 'Scatter Chart' }
};

export function TreatmentPlanStatistics() {
  const { token } = useToken();
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [activeDateFilter, setActiveDateFilter] = useState<string>('all');
  
  // New state for chart types
  const [statusChartType, setStatusChartType] = useState<string>('pie');
  const [monthlyChartType, setMonthlyChartType] = useState<string>('line');
  const [drugChartType, setDrugChartType] = useState<string>('bar');
  const [staffChartType, setStaffChartType] = useState<string>('bar');
  const [activeTab, setActiveTab] = useState<string>('1');

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async (startDate?: Date, endDate?: Date) => {
    setLoading(true);
    try {
      const response = await getTreatmentPlanStatistics(startDate, endDate);
      if (response && response.isSuccess && response.data) {
        // Map the response to match the expected format
        const formattedData = {
          totalTreatmentPlans: response.data.totalCount || 0,
          totalActiveTreatmentPlans: response.data.statusDistribution?.InProgress || 0,
          totalCompletedTreatmentPlans: response.data.statusDistribution?.Completed || 0,
          totalCancelledTreatmentPlans: response.data.statusDistribution?.Cancelled || 0,
          treatmentPlansByStatus: response.data.statusDistribution || {},
          treatmentPlansByMonth: response.data.monthlyDistribution || {},
          treatmentPlansByDrug: response.data.top5Drugs || {},
          treatmentPlansByUser: response.data.top5Staff || {},
          averageDuration: response.data.averageDuration,
          completionRate: response.data.completionRate,
          cancellationRate: response.data.cancellationRate,
          averageTreatmentPlansPerPatient: response.data.averageTreatmentPlansPerPatient,
          patientDistribution: response.data.patientDistribution || {},
          dateRange: response.data.dateRange || {}
        };
        setStatistics(formattedData);
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (dates: RangePickerProps['value']) => {
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
    setActiveDateFilter('custom');
  };

  const resetDateFilter = () => {
    setDateRange([null, null]);
    fetchStatistics();
    setActiveDateFilter('all');
  };

  const applyQuickFilter = (period: string) => {
    const today = new Date();
    let startDate: Date | null = null;
    let endDate: Date = today;

    switch (period) {
      case 'last7days':
        startDate = new Date();
        startDate.setDate(today.getDate() - 7);
        setActiveDateFilter('last7days');
        break;
      case 'last30days':
        startDate = new Date();
        startDate.setDate(today.getDate() - 30);
        setActiveDateFilter('last30days');
        break;
      case 'last3months':
        startDate = new Date();
        startDate.setMonth(today.getMonth() - 3);
        setActiveDateFilter('last3months');
        break;
      case 'last6months':
        startDate = new Date();
        startDate.setMonth(today.getMonth() - 6);
        setActiveDateFilter('last6months');
        break;
      case 'thisyear':
        startDate = new Date(today.getFullYear(), 0, 1);
        setActiveDateFilter('thisyear');
        break;
      case 'lastyear':
        startDate = new Date(today.getFullYear() - 1, 0, 1);
        endDate = new Date(today.getFullYear() - 1, 11, 31);
        setActiveDateFilter('lastyear');
        break;
      default:
        startDate = null;
        setActiveDateFilter('all');
    }

    setDateRange([startDate, endDate]);
    fetchStatistics(startDate || undefined, endDate);
  };

  // Function to export chart as image
  const exportChart = (chartId: string) => {
    // Implementation would require a library like html2canvas or using recharts exportChart functionality
    console.log(`Export chart with id: ${chartId}`);
    alert("Export functionality would be implemented here with a proper export library");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!statistics) return null;

  // Xử lý dữ liệu cho biểu đồ trạng thái
  const statusChartData = Object.entries(
    statistics.treatmentPlansByStatus || {}
  ).map(([status, count]) => ({
    name: status,
    value: count as number,
  }));

  // Xử lý dữ liệu cho biểu đồ hàng tháng
  const monthlyChartData = Object.entries(
    statistics.treatmentPlansByMonth || {}
  ).map(([month, count]) => ({
    name: month,
    count: count as number,
    value: count as number
  }));

  // Xử lý dữ liệu cho biểu đồ thuốc hàng đầu
  const drugChartData = Object.entries(
    statistics.treatmentPlansByDrug || {}
  ).map(([drug, count], index) => ({
    name: drug,
    count: count as number,
    value: count as number,
    fill: COLORS[index % COLORS.length]
  }));

  // Xử lý dữ liệu cho biểu đồ người dùng hàng đầu
  const userChartData = Object.entries(
    statistics.treatmentPlansByUser || {}
  ).map(([user, count], index) => ({
    name: user,
    count: count as number,
    value: count as number,
    fill: COLORS[index % COLORS.length]
  }));
  
  // Xử lý dữ liệu cho phân phối bệnh nhân
  const patientDistributionData = Object.entries(
    statistics.patientDistribution || {}
  ).map(([planCount, patientCount]) => ({
    name: `${planCount} plan(s)`,
    value: patientCount as number,
  }));

  // Format date range display
  const formatDate = (date: Date | null) => {
    return date ? dayjs(date).format('YYYY-MM-DD') : '';
  };
  
  const dateRangeDisplay = dateRange[0] && dateRange[1] 
    ? `${formatDate(dateRange[0])} to ${formatDate(dateRange[1])}` 
    : 'All Time';
  
  // Custom chart renderer based on type
  const renderChart = (type: string, data: any[], chartType: string, setChartType: (type: string) => void) => {
    // Create config menu for chart type selection
    const chartConfigMenu = (
      <Space className="mb-3 chart-controls" style={{ display: 'flex', justifyContent: 'flex-end' }}>
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
            )
          }))}
        />
        <AntTooltip title="Export Chart">
          <Button icon={<DownloadOutlined />} onClick={() => exportChart(type)} />
        </AntTooltip>
      </Space>
    );

    const renderChartComponent = () => {
      switch (chartType) {
        case 'pie':
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
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value) => [`${value} plans`]} />
                <Legend layout="vertical" verticalAlign="middle" align="right" />
              </PieChart>
            </ResponsiveContainer>
          );
        case 'bar':
          return (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                <YAxis />
                <RechartsTooltip formatter={(value) => [`${value} plans`]} />
                <Legend />
                <Bar dataKey="value" name="Number of Plans">
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          );
        case 'line':
          return (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                <YAxis />
                <RechartsTooltip formatter={(value) => [`${value} plans`]} />
                <Legend />
                <Line type="monotone" dataKey="value" stroke={token.colorPrimary} name="Number of Plans" />
              </LineChart>
            </ResponsiveContainer>
          );
        case 'area':
          return (
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                <YAxis />
                <RechartsTooltip formatter={(value) => [`${value} plans`]} />
                <Legend />
                <Area type="monotone" dataKey="value" stroke={token.colorPrimary} fill={token.colorPrimaryBg} name="Number of Plans" />
              </AreaChart>
            </ResponsiveContainer>
          );
        case 'radar':
          return (
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                <PolarGrid />
                <PolarAngleAxis dataKey="name" />
                <PolarRadiusAxis />
                <Radar name="Number of Plans" dataKey="value" stroke={token.colorPrimary} fill={token.colorPrimaryBg} fillOpacity={0.6} />
                <Legend />
                <RechartsTooltip formatter={(value) => [`${value} plans`]} />
              </RadarChart>
            </ResponsiveContainer>
          );
        case 'scatter':
          return (
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="category" dataKey="name" name="Name" angle={-45} textAnchor="end" height={70} />
                <YAxis type="number" dataKey="value" name="Value" />
                <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} formatter={(value) => [`${value} plans`]} />
                <Legend />
                <Scatter name="Number of Plans" data={data} fill={token.colorPrimary} />
              </ScatterChart>
            </ResponsiveContainer>
          );
        default:
          return (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                <YAxis />
                <RechartsTooltip formatter={(value) => [`${value} plans`]} />
                <Legend />
                <Bar dataKey="value" name="Number of Plans">
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          );
      }
    };
    
    // Return chart with controls
    return (
      <div style={{ width: '100%' }}>
        {chartConfigMenu}
        {renderChartComponent()}
      </div>
    );
  };

  const tabItems = [
    {
      key: '1',
      label: 'Status Distribution',
      content: renderChart('status', statusChartData, statusChartType, setStatusChartType)
    },
    {
      key: '2',
      label: 'Monthly Distribution',
      content: renderChart('monthly', monthlyChartData, monthlyChartType, setMonthlyChartType)
    },
    {
      key: '3',
      label: 'Top Drugs',
      content: renderChart('drugs', drugChartData, drugChartType, setDrugChartType)
    },
    {
      key: '4',
      label: 'Top Staff',
      content: renderChart('staff', userChartData, staffChartType, setStaffChartType)
    },
    {
      key: '5',
      label: 'Patient Distribution',
      content: renderChart('patient', patientDistributionData, 'pie', () => {})
    }
  ];

  return (
    <>
      <Card className="mb-6 statistics-filter-card" style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <Row align="middle" gutter={[16, 16]}>
          <Col span={16}>
            <Title level={4} style={{ margin: 0 }}>
              <AppstoreOutlined style={{ marginRight: '8px' }} />
              Treatment Plan Statistics Dashboard
            </Title>
          </Col>
          <Col span={8} style={{ textAlign: 'right' }}>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={() => fetchStatistics(dateRange[0] || undefined, dateRange[1] || undefined)}>
                Refresh
              </Button>
              <Button icon={<FileExcelOutlined />} type="primary">
                Export to Excel
              </Button>
            </Space>
          </Col>
        </Row>
        
        <Divider style={{ margin: '16px 0' }} />
        
        <Title level={5}>Date Range Filter</Title>
        <Row gutter={16} className="mb-3">
          <Col span={24}>
            <Space wrap>
              <Button 
                type={activeDateFilter === 'all' ? 'primary' : 'default'} 
                onClick={() => applyQuickFilter('all')}
              >
                All Time
              </Button>
              <Button 
                type={activeDateFilter === 'last7days' ? 'primary' : 'default'} 
                onClick={() => applyQuickFilter('last7days')}
              >
                Last 7 Days
              </Button>
              <Button 
                type={activeDateFilter === 'last30days' ? 'primary' : 'default'} 
                onClick={() => applyQuickFilter('last30days')}
              >
                Last 30 Days
              </Button>
              <Button 
                type={activeDateFilter === 'last3months' ? 'primary' : 'default'} 
                onClick={() => applyQuickFilter('last3months')}
              >
                Last 3 Months
              </Button>
              <Button 
                type={activeDateFilter === 'last6months' ? 'primary' : 'default'} 
                onClick={() => applyQuickFilter('last6months')}
              >
                Last 6 Months
              </Button>
              <Button 
                type={activeDateFilter === 'thisyear' ? 'primary' : 'default'} 
                onClick={() => applyQuickFilter('thisyear')}
              >
                This Year
              </Button>
              <Button 
                type={activeDateFilter === 'lastyear' ? 'primary' : 'default'} 
                onClick={() => applyQuickFilter('lastyear')}
              >
                Last Year
              </Button>
            </Space>
          </Col>
        </Row>
        <Divider style={{ margin: '12px 0' }} />
        <Row gutter={16} className="mb-3">
          <Col span={16}>
            <Space>
              <Text>Custom Range:</Text>
              <RangePicker 
                value={dateRange[0] && dateRange[1] ? [dayjs(dateRange[0]), dayjs(dateRange[1])] : null}
                onChange={handleDateRangeChange} 
              />
              <Button type="primary" onClick={applyDateFilter}>Apply</Button>
              <Button onClick={resetDateFilter}>Reset</Button>
            </Space>
          </Col>
          <Col span={8} style={{ textAlign: 'right' }}>
            <Badge 
              status="processing" 
              text={<Text strong style={{ fontSize: '14px' }}>Current Filter: {dateRangeDisplay}</Text>} 
            />
          </Col>
        </Row>
      </Card>

      <Row gutter={16} className="mb-6">
        <Col xs={24} sm={12} md={6}>
          <Card hoverable className="statistic-card" style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <Statistic
              title={<Title level={5}>Total Treatment Plans</Title>}
              value={statistics.totalTreatmentPlans}
              prefix={<Badge status="default" />}
              valueStyle={{ color: token.colorTextHeading }}
            />
            <div style={{ marginTop: '10px' }}>
              <Progress 
                percent={100} 
                showInfo={false} 
                strokeColor={token.colorTextHeading} 
              />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable className="statistic-card" style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <Statistic
              title={<Title level={5}>Active Treatment Plans</Title>}
              value={statistics.totalActiveTreatmentPlans}
              prefix={<Badge status="processing" />}
              valueStyle={{ color: "#3f8600" }}
            />
            <div style={{ marginTop: '10px' }}>
              <Progress 
                percent={(statistics.totalActiveTreatmentPlans / statistics.totalTreatmentPlans) * 100} 
                showInfo={false} 
                strokeColor="#3f8600" 
              />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable className="statistic-card" style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <Statistic
              title={<Title level={5}>Completed Treatment Plans</Title>}
              value={statistics.totalCompletedTreatmentPlans}
              prefix={<Badge status="success" />}
              valueStyle={{ color: "#1677ff" }}
            />
            <div style={{ marginTop: '10px' }}>
              <Progress 
                percent={(statistics.totalCompletedTreatmentPlans / statistics.totalTreatmentPlans) * 100} 
                showInfo={false} 
                strokeColor="#1677ff" 
              />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable className="statistic-card" style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <Statistic
              title={<Title level={5}>Cancelled Treatment Plans</Title>}
              value={statistics.totalCancelledTreatmentPlans}
              prefix={<Badge status="error" />}
              valueStyle={{ color: "#cf1322" }}
            />
            <div style={{ marginTop: '10px' }}>
              <Progress 
                percent={(statistics.totalCancelledTreatmentPlans / statistics.totalTreatmentPlans) * 100} 
                showInfo={false} 
                strokeColor="#cf1322" 
              />
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} className="mb-6">
        <Col xs={24} sm={12} md={6}>
          <Card hoverable className="statistic-card" style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <Statistic
              title={<Title level={5}>Average Duration (days)</Title>}
              value={statistics.averageDuration?.toFixed(2) || 0}
              precision={2}
              valueStyle={{ color: token.colorInfo }}
            />
            <div style={{ marginTop: '10px' }}>
              <Progress 
                percent={Math.min((statistics.averageDuration / 30) * 100, 100)} 
                showInfo={false} 
                strokeColor={token.colorInfo} 
              />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable className="statistic-card" style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <Statistic
              title={<Title level={5}>Completion Rate (%)</Title>}
              value={statistics.completionRate?.toFixed(2) || 0}
              precision={2}
              valueStyle={{ color: "#1677ff" }}
              suffix="%"
            />
            <div style={{ marginTop: '10px' }}>
              <Progress 
                percent={statistics.completionRate} 
                showInfo={false} 
                strokeColor="#1677ff" 
              />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable className="statistic-card" style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <Statistic
              title={<Title level={5}>Cancellation Rate (%)</Title>}
              value={statistics.cancellationRate?.toFixed(2) || 0}
              precision={2}
              valueStyle={{ color: "#cf1322" }}
              suffix="%"
            />
            <div style={{ marginTop: '10px' }}>
              <Progress 
                percent={statistics.cancellationRate} 
                showInfo={false} 
                strokeColor="#cf1322" 
              />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable className="statistic-card" style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <Statistic
              title={<Title level={5}>Avg Plans Per Patient</Title>}
              value={statistics.averageTreatmentPlansPerPatient?.toFixed(2) || 0}
              precision={2}
              valueStyle={{ color: token.colorSuccess }}
            />
            <div style={{ marginTop: '10px' }}>
              <Progress 
                percent={Math.min((statistics.averageTreatmentPlansPerPatient / 3) * 100, 100)} 
                showInfo={false} 
                strokeColor={token.colorSuccess} 
              />
            </div>
          </Card>
        </Col>
      </Row>

      <Card 
        className="mb-6 chart-card" 
        style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
      >
        <Tabs 
          defaultActiveKey="1" 
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key)}
          tabBarStyle={{ marginBottom: '24px' }}
          tabBarGutter={20}
          type="card"
        >
          {tabItems.map(item => (
            <TabPane 
              tab={
                <span style={{ fontSize: '16px' }}>
                  {item.label}
                </span>
              } 
              key={item.key}
            >
              {item.content}
            </TabPane>
          ))}
        </Tabs>
      </Card>
    </>
  );
} 