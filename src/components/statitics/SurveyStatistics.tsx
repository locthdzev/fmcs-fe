import React, { useState } from 'react';
import { Card, Statistic, Typography, Progress, Tooltip, Row, Col, Space, Badge, theme, Tabs, Select, Button, Divider, Modal, DatePicker, Form, message, Checkbox, Radio } from 'antd';
import { 
  StarOutlined, 
  CalendarOutlined, 
  ExclamationCircleOutlined, 
  CheckCircleFilled, 
  FrownOutlined, 
  MehOutlined, 
  SmileOutlined, 
  PieChartOutlined, 
  BarChartOutlined,
  QuestionCircleOutlined,
  LineChartOutlined, 
  AreaChartOutlined, 
  RadarChartOutlined, 
  DotChartOutlined,
  ArrowLeftOutlined,
  FileExcelOutlined,
  ReloadOutlined,
  DownloadOutlined,
  InfoCircleOutlined,
  AppstoreOutlined,
  CloudDownloadOutlined
} from '@ant-design/icons';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ScatterChart,
  Scatter
} from 'recharts';
import { SurveyResponse } from '@/api/survey';
import { useRouter } from 'next/router';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { useToken } = theme;
const { RangePicker } = DatePicker;

// Chart type options
interface ChartTypeOption {
  icon: React.ReactNode;
  label: string;
}

const chartTypes: Record<string, ChartTypeOption> = {
  bar: { icon: <BarChartOutlined />, label: "Bar Chart" },
  line: { icon: <LineChartOutlined />, label: "Line Chart" },
  area: { icon: <AreaChartOutlined />, label: "Area Chart" },
  pie: { icon: <PieChartOutlined />, label: "Pie Chart" },
  radar: { icon: <RadarChartOutlined />, label: "Radar Chart" },
  scatter: { icon: <DotChartOutlined />, label: "Scatter Chart" },
};

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

interface SurveyStatisticsProps {
  surveys: SurveyResponse[];
  stats: {
    total: number;
    pending: number;
    submitted: number;
    updated: number;
    highRating: number;
    lowRating: number;
  };
  SURVEY_STATUS: {
    PENDING: string;
    SUBMITTED: string;
    UPDATED: string;
  };
}

export const SurveyStatistics: React.FC<SurveyStatisticsProps> = ({ surveys, stats, SURVEY_STATUS }) => {
  const { token } = useToken();
  const router = useRouter();
  const [ratingChartType, setRatingChartType] = useState<string>("pie");
  const [statusChartType, setStatusChartType] = useState<string>("bar");
  const [activeTab, setActiveTab] = useState<string>("1");
  const [isExportModalVisible, setIsExportModalVisible] = useState<boolean>(false);
  const [exportDateRange, setExportDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);
  const [form] = Form.useForm();
  const [exportAllData, setExportAllData] = useState<boolean>(false);
  const [exportTimeRange, setExportTimeRange] = useState<string>("all");
  
  // Prepare chart data
  const prepareRatingData = () => {
    return [
      { name: '1 Star', value: surveys.filter((s: SurveyResponse) => s.rating === 1).length },
      { name: '2 Stars', value: surveys.filter((s: SurveyResponse) => s.rating === 2).length },
      { name: '3 Stars', value: surveys.filter((s: SurveyResponse) => s.rating === 3).length },
      { name: '4 Stars', value: surveys.filter((s: SurveyResponse) => s.rating === 4).length },
      { name: '5 Stars', value: surveys.filter((s: SurveyResponse) => s.rating === 5).length },
    ].filter(item => item.value > 0);
  };
  
  const prepareStatusData = () => {
    return [
      { name: 'Pending', value: stats.pending },
      { name: 'Submitted', value: stats.submitted },
      { name: 'Updated', value: stats.updated },
    ].filter(item => item.value > 0);
  };
  
  const ratingData = prepareRatingData();
  const statusData = prepareStatusData();
  
  // Custom chart renderer based on type
  const renderChart = (
    type: string,
    data: any[],
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
      // Filter out zero values for pie chart
      const filteredData = chartType === "pie" ? data.filter(item => item.value > 0) : data;
      
      switch (chartType) {
        case "pie":
          return (
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={filteredData}
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
                  {filteredData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value) => [`${value} surveys`]} />
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
                <RechartsTooltip formatter={(value) => [`${value} surveys`]} />
                <Legend />
                <Bar dataKey="value" name="Number of Surveys">
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
                <RechartsTooltip formatter={(value) => [`${value} surveys`]} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={token.colorPrimary}
                  name="Number of Surveys"
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
                <RechartsTooltip formatter={(value) => [`${value} surveys`]} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={token.colorPrimary}
                  fill={token.colorPrimaryBg}
                  name="Number of Surveys"
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
                  name="Number of Surveys"
                  dataKey="value"
                  stroke={token.colorPrimary}
                  fill={token.colorPrimaryBg}
                  fillOpacity={0.6}
                />
                <Legend />
                <RechartsTooltip formatter={(value) => [`${value} surveys`]} />
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
                  formatter={(value) => [`${value} surveys`]}
                />
                <Legend />
                <Scatter
                  name="Number of Surveys"
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
                <RechartsTooltip formatter={(value) => [`${value} surveys`]} />
                <Legend />
                <Bar dataKey="value" name="Number of Surveys">
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
          Rating Distribution
          <Tooltip title="Shows the distribution of survey ratings from 1 to 5 stars">
            <QuestionCircleOutlined />
          </Tooltip>
        </Space>
      ),
      children: renderChart(
        "rating",
        ratingData,
        ratingChartType,
        setRatingChartType
      ),
    },
    {
      key: "2",
      label: (
        <Space align="center">
          Status Distribution
          <Tooltip title="Shows the distribution of survey status (Pending, Submitted, Updated)">
            <QuestionCircleOutlined />
          </Tooltip>
        </Space>
      ),
      children: renderChart(
        "status",
        statusData,
        statusChartType,
        setStatusChartType
      ),
    },
  ];

  // Navigation
  const handleBack = () => {
    router.back();
  };

  // Excel Export Functions
  const showExportModal = () => {
    form.resetFields();
    setExportAllData(false);
    setExportTimeRange("all");
    setExportDateRange([null, null]);
    setIsExportModalVisible(true);
  };

  const handleExportModalCancel = () => {
    setIsExportModalVisible(false);
    form.resetFields();
  };

  const handleExportModalOk = () => {
    form.validateFields()
      .then(values => {
        let startDate: Date | undefined;
        let endDate: Date | undefined;
        
        if (exportTimeRange === "all") {
          // Export all data
          startDate = undefined;
          endDate = undefined;
        } else if (exportDateRange[0] && exportDateRange[1]) {
          // Export based on the selected date range
          startDate = exportDateRange[0].toDate();
          endDate = exportDateRange[1].toDate();
        }
        
        exportToExcel(startDate, endDate);
        setIsExportModalVisible(false);
      })
      .catch(errorInfo => {
        console.log('Validate Failed:', errorInfo);
      });
  };

  const handleDateRangeChange = (dates: any) => {
    setExportDateRange(dates);
    if (dates && dates[0] && dates[1]) {
      setExportTimeRange("custom");
    }
  };

  const handleExportTimeRangeChange = (value: string) => {
    setExportTimeRange(value);
    
    // Set export date range based on selected time range
    const today = dayjs();
    let startDate: dayjs.Dayjs | null = null;
    let endDate: dayjs.Dayjs = today;

    switch (value) {
      case "last7days":
        startDate = today.subtract(7, 'day');
        break;
      case "last30days":
        startDate = today.subtract(30, 'day');
        break;
      case "last3months":
        startDate = today.subtract(3, 'month');
        break;
      case "last6months":
        startDate = today.subtract(6, 'month');
        break;
      case "thisyear":
        startDate = dayjs().startOf('year');
        break;
      case "lastyear":
        startDate = dayjs().subtract(1, 'year').startOf('year');
        endDate = dayjs().subtract(1, 'year').endOf('year');
        break;
      case "all":
        startDate = null;
        endDate = today;
        break;
      case "custom":
        // Keep the current custom date range
        return;
    }

    if (value !== "custom") {
      setExportDateRange([startDate, endDate]);
      form.setFieldsValue({ dateRange: startDate && endDate ? [startDate, endDate] : null });
    }
  };

  const exportToExcel = (startDate?: Date, endDate?: Date) => {
    try {
      // Filter surveys by date range if provided
      const filteredSurveys = surveys.filter(survey => {
        if (!startDate || !endDate) return true;
        const surveyDate = new Date(survey.createdAt);
        return surveyDate >= startDate && surveyDate <= endDate;
      });

      // Create a new workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'FMCS';
      workbook.created = new Date();
      
      // Create Summary Sheet
      const summarySheet = workbook.addWorksheet('Summary');
      summarySheet.columns = [
        { header: 'Category', key: 'category', width: 25 },
        { header: 'Count', key: 'count', width: 15 }
      ];
      
      // Format header row
      summarySheet.getRow(1).font = { bold: true };
      summarySheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F81BD' }
      };
      summarySheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };
      
      // Add summary data
      summarySheet.addRow({ category: 'Total Surveys', count: filteredSurveys.length });
      summarySheet.addRow({ category: 'Pending Surveys', count: filteredSurveys.filter(s => s.status === SURVEY_STATUS.PENDING).length });
      summarySheet.addRow({ category: 'Submitted Surveys', count: filteredSurveys.filter(s => s.status === SURVEY_STATUS.SUBMITTED).length });
      summarySheet.addRow({ category: 'Updated Surveys', count: filteredSurveys.filter(s => s.status === SURVEY_STATUS.UPDATED).length });
      summarySheet.addRow({ category: 'High Ratings (≥ 4)', count: filteredSurveys.filter(s => s.rating && s.rating >= 4).length });
      summarySheet.addRow({ category: 'Low Ratings (≤ 2)', count: filteredSurveys.filter(s => s.rating && s.rating <= 2).length });

      // Create Rating Distribution Sheet
      const ratingSheet = workbook.addWorksheet('Rating Distribution');
      ratingSheet.columns = [
        { header: 'Rating', key: 'rating', width: 20 },
        { header: 'Count', key: 'count', width: 15 }
      ];
      
      // Format header row
      ratingSheet.getRow(1).font = { bold: true };
      ratingSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F81BD' }
      };
      ratingSheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };
      
      // Add rating data
      ratingSheet.addRow({ rating: '1 Star', count: filteredSurveys.filter(s => s.rating === 1).length });
      ratingSheet.addRow({ rating: '2 Stars', count: filteredSurveys.filter(s => s.rating === 2).length });
      ratingSheet.addRow({ rating: '3 Stars', count: filteredSurveys.filter(s => s.rating === 3).length });
      ratingSheet.addRow({ rating: '4 Stars', count: filteredSurveys.filter(s => s.rating === 4).length });
      ratingSheet.addRow({ rating: '5 Stars', count: filteredSurveys.filter(s => s.rating === 5).length });

      // Create Status Distribution Sheet
      const statusSheet = workbook.addWorksheet('Status Distribution');
      statusSheet.columns = [
        { header: 'Status', key: 'status', width: 20 },
        { header: 'Count', key: 'count', width: 15 }
      ];
      
      // Format header row
      statusSheet.getRow(1).font = { bold: true };
      statusSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F81BD' }
      };
      statusSheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };
      
      // Add status data
      statusSheet.addRow({ status: 'Pending', count: filteredSurveys.filter(s => s.status === SURVEY_STATUS.PENDING).length });
      statusSheet.addRow({ status: 'Submitted', count: filteredSurveys.filter(s => s.status === SURVEY_STATUS.SUBMITTED).length });
      statusSheet.addRow({ status: 'Updated', count: filteredSurveys.filter(s => s.status === SURVEY_STATUS.UPDATED).length });

      // Create Detailed Surveys Sheet
      const detailedSheet = workbook.addWorksheet('Detailed Surveys');
      detailedSheet.columns = [
        { header: 'No.', key: 'no', width: 5 },
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Patient', key: 'patient', width: 25 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Rating', key: 'rating', width: 10 },
        { header: 'Feedback', key: 'feedback', width: 40 },
        { header: 'Created At', key: 'createdAt', width: 20 },
        { header: 'Updated At', key: 'updatedAt', width: 20 }
      ];
      
      // Format header row
      detailedSheet.getRow(1).font = { bold: true };
      detailedSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F81BD' }
      };
      detailedSheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };
      
      // Add detailed data
      filteredSurveys.forEach((survey, index) => {
        detailedSheet.addRow({
          no: index + 1,
          id: survey.id || 'N/A',
          patient: survey.user?.fullName || 'N/A',
          status: survey.status || 'N/A',
          rating: survey.rating || 'N/A',
          feedback: survey.feedback || 'N/A',
          createdAt: survey.createdAt ? dayjs(survey.createdAt).format('YYYY-MM-DD HH:mm') : 'N/A',
          updatedAt: survey.updatedAt ? dayjs(survey.updatedAt).format('YYYY-MM-DD HH:mm') : 'N/A'
        });
      });

      // Generate Excel file name with date range if provided
      let fileName = 'Survey_Statistics';
      if (startDate && endDate) {
        fileName += `_${dayjs(startDate).format('YYYYMMDD')}_to_${dayjs(endDate).format('YYYYMMDD')}`;
      }
      fileName += '.xlsx';

      // Export the file
      workbook.xlsx.writeBuffer()
        .then(buffer => {
          const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          saveAs(blob, fileName);
          message.success('Excel file exported successfully!');
        });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      message.error('Failed to export Excel file.');
    }
  };

  // Render export modal
  const renderExportModal = () => (
    <Modal
      title={
        <div className="flex items-center">
          <FileExcelOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
          Export Survey Statistics to Excel
        </div>
      }
      open={isExportModalVisible}
      onOk={handleExportModalOk}
      onCancel={handleExportModalCancel}
      okText="Export"
      cancelText="Cancel"
      width={600}
      okButtonProps={{ icon: <CloudDownloadOutlined /> }}
    >
      <Card
        className="mb-6 statistics-export-card"
        style={{ borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
      >
        <Row align="middle" gutter={[16, 16]}>
          <Col span={24}>
            <Title level={4} style={{ margin: 0 }}>
              <AppstoreOutlined style={{ marginRight: "8px" }} />
              Export Options
            </Title>
          </Col>
        </Row>

        <Divider style={{ margin: "16px 0" }} />
        
        <Form form={form} layout="vertical">
          <Title level={5}>Time Range Selection</Title>
          <Row gutter={16} className="mb-3">
            <Col span={24}>
              <Radio.Group
                value={exportTimeRange}
                onChange={(e) => handleExportTimeRangeChange(e.target.value)}
                style={{ marginBottom: "16px" }}
              >
                <Space wrap>
                  <Radio.Button value="all">All Time</Radio.Button>
                  <Radio.Button value="last7days">Last 7 Days</Radio.Button>
                  <Radio.Button value="last30days">Last 30 Days</Radio.Button>
                  <Radio.Button value="last3months">Last 3 Months</Radio.Button>
                  <Radio.Button value="last6months">Last 6 Months</Radio.Button>
                  <Radio.Button value="thisyear">This Year</Radio.Button>
                  <Radio.Button value="lastyear">Last Year</Radio.Button>
                  <Radio.Button value="custom">Custom Range</Radio.Button>
                </Space>
              </Radio.Group>
            </Col>
          </Row>
          
          <Divider style={{ margin: "12px 0" }} />
          
          <Row gutter={16} className="mb-3">
            <Col span={24}>
              <Form.Item 
                name="dateRange" 
                label="Custom Date Range:"
                help="Select specific start and end dates for your export"
                style={{ marginBottom: exportTimeRange === "custom" ? "16px" : "0" }}
                hidden={exportTimeRange !== "custom"}
              >
                <RangePicker 
                  style={{ width: '100%' }} 
                  onChange={handleDateRangeChange} 
                  value={exportDateRange[0] && exportDateRange[1] ? exportDateRange : null}
                  allowClear
                  disabled={exportTimeRange !== "custom"}
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Divider style={{ margin: "16px 0" }} />
          
          <div className="bg-blue-50 p-4 rounded border border-blue-200 mb-4">
            <div className="flex items-start">
              <InfoCircleOutlined style={{ color: '#1677ff', fontSize: '20px', marginRight: '12px', marginTop: '2px' }} />
              <div>
                <p className="text-blue-800 font-medium mb-2">Export Information</p>
                <p className="text-blue-600 mb-2">
                  {exportTimeRange === "all" 
                    ? "You will export data for all surveys." 
                    : exportTimeRange === "custom" && exportDateRange[0] && exportDateRange[1]
                    ? `You will export data from ${exportDateRange[0].format('DD/MM/YYYY')} to ${exportDateRange[1].format('DD/MM/YYYY')}.`
                    : `You will export data for the selected time period (${exportTimeRange.replace(/([A-Z])/g, ' $1').toLowerCase()}).`}
                </p>
                <p className="text-gray-600 text-sm mb-0">The Excel file will include multiple sheets with summarized and detailed survey data.</p>
              </div>
            </div>
          </div>
          
          <Row gutter={16}>
            <Col span={24}>
              <div className="bg-gray-50 p-3 rounded border border-gray-200">
                <p className="mb-1 font-medium text-gray-700">Excel file will include:</p>
                <ul className="text-gray-600 ml-5 mb-0">
                  <li>Summary statistics overview</li>
                  <li>Rating distribution analysis</li>
                  <li>Status distribution analysis</li>
                  <li>Detailed survey records</li>
                </ul>
              </div>
            </Col>
          </Row>
        </Form>
      </Card>
    </Modal>
  );

  // Render header with title and back button
  const renderHeader = () => (
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
          <StarOutlined style={{ fontSize: "24px", color: "#4F46E5" }} />
          <h3 className="text-xl font-bold">
            Survey Statistics Dashboard
          </h3>
        </div>
        <div>
          <Space>
            <Button icon={<ReloadOutlined />}>
              Refresh
            </Button>
            <Button 
              icon={<FileExcelOutlined />} 
              type="primary"
              onClick={showExportModal}
            >
              Export to Excel
            </Button>
          </Space>
        </div>
      </div>
    </>
  );

  return (
    <div className="survey-statistics-container" style={{ padding: "20px" }}>
      {renderHeader()}
      {renderExportModal()}
      
      {/* Statistics cards */}
      <Row gutter={16} className="mb-6">
        <Col xs={24} sm={12} md={6}>
          <Card 
            hoverable
            className="shadow-sm hover:shadow-md transition-all"
            style={{ borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
          >
          <Statistic 
              title={
                <Space align="center">
                  <div className="text-gray-600 font-medium">Total Surveys</div>
                  <Tooltip title="Total number of surveys in the system">
                    <QuestionCircleOutlined style={{ color: token.colorTextSecondary }}/>
                  </Tooltip>
                </Space>
              } 
            value={stats.total} 
            prefix={<span className="text-indigo-600"><CalendarOutlined /></span>}
            valueStyle={{ color: '#4F46E5', fontWeight: 600 }}
          />
            <div style={{ marginTop: "10px" }}>
              <Progress
                percent={100}
                showInfo={false}
                strokeColor="#4F46E5"
              />
            </div>
        </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card 
            hoverable
            className="shadow-sm hover:shadow-md transition-all"
            style={{ borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
          >
          <Statistic 
              title={
                <Space align="center">
                  <div className="text-amber-700 font-medium">Pending</div>
                  <Tooltip title="Surveys waiting for user response">
                    <QuestionCircleOutlined style={{ color: token.colorTextSecondary }}/>
                  </Tooltip>
                </Space>
              }
            value={stats.pending} 
              prefix={<Badge status="warning" />}
            valueStyle={{ color: '#F59E0B', fontWeight: 600 }}
          />
            <div style={{ marginTop: "10px" }}>
              <Progress
                percent={(stats.pending / stats.total) * 100}
                showInfo={false}
                strokeColor="#F59E0B"
              />
            </div>
        </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card 
            hoverable
            className="shadow-sm hover:shadow-md transition-all"
            style={{ borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
          >
          <Statistic 
              title={
                <Space align="center">
                  <div className="text-green-700 font-medium">Submitted</div>
                  <Tooltip title="Surveys that have been completed by users">
                    <QuestionCircleOutlined style={{ color: token.colorTextSecondary }}/>
                  </Tooltip>
                </Space>
              }
            value={stats.submitted} 
              prefix={<Badge status="success" />}
            valueStyle={{ color: '#10B981', fontWeight: 600 }}
          />
            <div style={{ marginTop: "10px" }}>
              <Progress
                percent={(stats.submitted / stats.total) * 100}
                showInfo={false}
                strokeColor="#10B981"
              />
            </div>
        </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card 
            hoverable
            className="shadow-sm hover:shadow-md transition-all"
            style={{ borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
          >
          <Statistic 
              title={
                <Space align="center">
                  <div className="text-blue-700 font-medium">Updated</div>
                  <Tooltip title="Surveys that have been updated after submission">
                    <QuestionCircleOutlined style={{ color: token.colorTextSecondary }}/>
                  </Tooltip>
                </Space>
              }
            value={stats.updated} 
              prefix={<Badge status="processing" />}
            valueStyle={{ color: '#3B82F6', fontWeight: 600 }}
          />
            <div style={{ marginTop: "10px" }}>
              <Progress
                percent={(stats.updated / stats.total) * 100}
                showInfo={false}
                strokeColor="#3B82F6"
              />
            </div>
        </Card>
        </Col>
      </Row>
      
      <Row gutter={16} className="mb-6">
        <Col xs={24} sm={12} md={6}>
          <Card 
            hoverable
            className="shadow-sm hover:shadow-md transition-all"
            style={{ borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
          >
          <Statistic 
              title={
                <Space align="center">
                  <div className="text-blue-700 font-medium">High Ratings</div>
                  <Tooltip title="Surveys with ratings of 4 or 5 stars">
                    <QuestionCircleOutlined style={{ color: token.colorTextSecondary }}/>
                  </Tooltip>
                </Space>
              }
            value={stats.highRating} 
            prefix={<span className="text-blue-500"><SmileOutlined /></span>}
            suffix={<span className="text-sm text-gray-500">≥ 4</span>}
            valueStyle={{ color: '#3B82F6', fontWeight: 600 }}
          />
            <div style={{ marginTop: "10px" }}>
              <Progress
                percent={(stats.highRating / stats.total) * 100}
                showInfo={false}
                strokeColor="#3B82F6"
              />
            </div>
        </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card 
            hoverable
            className="shadow-sm hover:shadow-md transition-all"
            style={{ borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
          >
          <Statistic 
              title={
                <Space align="center">
                  <div className="text-red-700 font-medium">Low Ratings</div>
                  <Tooltip title="Surveys with ratings of 1 or 2 stars">
                    <QuestionCircleOutlined style={{ color: token.colorTextSecondary }}/>
                  </Tooltip>
                </Space>
              }
            value={stats.lowRating} 
            prefix={<span className="text-red-500"><FrownOutlined /></span>}
            suffix={<span className="text-sm text-gray-500">≤ 2</span>}
            valueStyle={{ color: '#EF4444', fontWeight: 600 }}
          />
            <div style={{ marginTop: "10px" }}>
              <Progress
                percent={(stats.lowRating / stats.total) * 100}
                showInfo={false}
                strokeColor="#EF4444"
              />
            </div>
        </Card>
        </Col>
      </Row>
      
      {/* Charts for visualization */}
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
      
      {/* Add global styles for custom progress */}
      <style jsx global>{`
        /* Custom Progress Bar Styles */
        .custom-progress .ant-progress-bg {
          transition: all 1s ease-in-out;
          border-radius: 6px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .custom-progress:hover .ant-progress-bg {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          filter: brightness(1.05);
        }
      `}</style>
    </div>
  );
};

export default SurveyStatistics;
