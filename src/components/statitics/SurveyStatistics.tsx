import React, { useState } from 'react';
import { Card, Statistic, Typography, Progress, Tooltip, Row, Col, Space, Badge, theme, Tabs, Select, Button, Divider, Modal, DatePicker, Form, message, Checkbox, Radio, Alert, Tag } from 'antd';
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
  CloudDownloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  UserOutlined
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
import dayjs, { Dayjs } from 'dayjs';

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
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);
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
    setDateRange([null, null]);
    setIsExportModalVisible(true);
  };

  const handleDateRangeChange = (dates: any) => {
    setDateRange(dates as [Dayjs, Dayjs]);
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
      setDateRange([startDate, endDate]);
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
      const formatDateForInfo = (date: Date | undefined): string => {
        if (!date) return "All Time";
        return dayjs(date).format("DD/MM/YYYY");
      };
      
      const exportInfo = [
        { info: 'Export Date', value: now.toLocaleDateString() },
        { info: 'Export Time', value: now.toLocaleTimeString() },
        { info: 'Date Range', value: startDate && endDate ? 
            `${formatDateForInfo(startDate)} to ${formatDateForInfo(endDate)}` : 'All Time' },
        { info: 'Total Surveys', value: filteredSurveys.length },
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
      
      // Create Summary Sheet
      const summarySheet = workbook.addWorksheet('Summary');
      summarySheet.columns = [
        { header: 'Category', key: 'category', width: 25 },
        { header: 'Count', key: 'count', width: 15 }
      ];
      
      // Format header
      formatSheetHeader(summarySheet);
      
      // Add summary data
      const summaryData = [
        { category: 'Total Surveys', count: filteredSurveys.length },
        { category: 'Pending Surveys', count: filteredSurveys.filter(s => s.status === SURVEY_STATUS.PENDING).length },
        { category: 'Submitted Surveys', count: filteredSurveys.filter(s => s.status === SURVEY_STATUS.SUBMITTED).length },
        { category: 'Updated Surveys', count: filteredSurveys.filter(s => s.status === SURVEY_STATUS.UPDATED).length },
        { category: 'High Ratings (≥ 4)', count: filteredSurveys.filter(s => s.rating && s.rating >= 4).length },
        { category: 'Low Ratings (≤ 2)', count: filteredSurveys.filter(s => s.rating && s.rating <= 2).length }
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
      
      // Create Rating Distribution Sheet
      const ratingSheet = workbook.addWorksheet('Rating Distribution');
      ratingSheet.columns = [
        { header: 'Rating', key: 'rating', width: 20 },
        { header: 'Count', key: 'count', width: 15 },
        { header: 'Percentage', key: 'percentage', width: 15 }
      ];
      
      // Format header
      formatSheetHeader(ratingSheet);
      
      // Calculate total for percentages
      const totalSurveys = filteredSurveys.length || 1; // Prevent division by zero
      
      // Add rating data
      const ratingData = [
        { rating: '1 Star', count: filteredSurveys.filter(s => s.rating === 1).length },
        { rating: '2 Stars', count: filteredSurveys.filter(s => s.rating === 2).length },
        { rating: '3 Stars', count: filteredSurveys.filter(s => s.rating === 3).length },
        { rating: '4 Stars', count: filteredSurveys.filter(s => s.rating === 4).length },
        { rating: '5 Stars', count: filteredSurveys.filter(s => s.rating === 5).length }
      ];
      
      ratingData.forEach(item => {
        const percentage = ((item.count / totalSurveys) * 100).toFixed(2) + '%';
        const row = ratingSheet.addRow({ ...item, percentage });
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
      
      // Create Status Distribution Sheet
      const statusSheet = workbook.addWorksheet('Status Distribution');
      statusSheet.columns = [
        { header: 'Status', key: 'status', width: 20 },
        { header: 'Count', key: 'count', width: 15 },
        { header: 'Percentage', key: 'percentage', width: 15 }
      ];
      
      // Format header
      formatSheetHeader(statusSheet);
      
      // Add status data
      const statusData = [
        { status: 'Pending', count: filteredSurveys.filter(s => s.status === SURVEY_STATUS.PENDING).length },
        { status: 'Submitted', count: filteredSurveys.filter(s => s.status === SURVEY_STATUS.SUBMITTED).length },
        { status: 'Updated', count: filteredSurveys.filter(s => s.status === SURVEY_STATUS.UPDATED).length }
      ];
      
      statusData.forEach(item => {
        const percentage = ((item.count / totalSurveys) * 100).toFixed(2) + '%';
        const row = statusSheet.addRow({ ...item, percentage });
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
      
      // Format header
      formatSheetHeader(detailedSheet);
      
      // Add detailed data
      filteredSurveys.forEach((survey, index) => {
        const row = detailedSheet.addRow({
          no: index + 1,
          id: survey.id || 'N/A',
          patient: survey.user?.fullName || 'N/A',
          status: survey.status || 'N/A',
          rating: survey.rating || 'N/A',
          feedback: survey.feedback || 'N/A',
          createdAt: survey.createdAt ? dayjs(survey.createdAt).format('YYYY-MM-DD HH:mm') : 'N/A',
          updatedAt: survey.updatedAt ? dayjs(survey.updatedAt).format('YYYY-MM-DD HH:mm') : 'N/A'
        });
        
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
        sheet.insertRow(1, [`Survey Statistics Report - Exported on ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}`]);
        sheet.getRow(1).font = { bold: true, size: 14 };
        sheet.getRow(1).height = 30;
        sheet.mergeCells(`A1:${String.fromCharCode(64 + sheet.columns.length)}1`);
        sheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
      };
      
      // Add export headers to all sheets
      workbook.eachSheet((sheet) => {
        addExportHeader(sheet);
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
          setIsExportModalVisible(false);
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
        <span>
          <FileExcelOutlined style={{ marginRight: 8 }} />
          Export Surveys to Excel
        </span>
      }
      open={isExportModalVisible}
      onCancel={() => setIsExportModalVisible(false)}
      footer={[
        <Button key="cancel" onClick={() => setIsExportModalVisible(false)}>
          Cancel
        </Button>,
        <Button
          key="export"
          type="primary"
          onClick={() => {
            exportToExcel(dateRange[0]?.toDate(), dateRange[1]?.toDate());
          }}
          icon={<FileExcelOutlined />}
        >
          Export Excel
        </Button>,
      ]}
      width={600}
    >
      <Alert
        message="Report Contents"
        description="The report will include summary statistics, rating distribution, status distribution, and detailed information for all surveys in the selected date range."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />
      
      <div style={{ marginBottom: 16 }}>
        <Typography.Title level={5}>Date Range Selection</Typography.Title>
        <p>Please select a date range for the export (optional):</p>
        <RangePicker
          value={dateRange}
          onChange={(values) => setDateRange(values as [dayjs.Dayjs, dayjs.Dayjs])}
          style={{ width: '100%' }}
        />
      </div>
      
      <Divider style={{ margin: '12px 0' }} />
      
      <Typography.Title level={5}>Export Preview</Typography.Title>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <Tag color="orange">Summary Statistics</Tag>
        <Tag color="green">Rating Distribution</Tag>
        <Tag color="blue">Status Distribution</Tag>
        <Tag color="purple">Detailed Survey Data</Tag>
        <Tag color="cyan">Export Information</Tag>
      </div>
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
