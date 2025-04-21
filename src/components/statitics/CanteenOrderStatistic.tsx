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
import { getCanteenOrderStatistics, CanteenOrderStatisticsDTO } from "@/api/canteenorder";
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
  FileExcelOutlined,
  QuestionCircleOutlined,
  ArrowLeftOutlined,
  CarOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";
import * as ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// Type definitions
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

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;
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

export function CanteenOrderStatistic() {
  const { token } = useToken();
  const router = useRouter();
  const [statistics, setStatistics] = useState<CanteenOrderStatisticsDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    null,
    null,
  ]);
  const [activeDateFilter, setActiveDateFilter] = useState<string>("all");
  const [messageApi, contextHolder] = message.useMessage();

  // Add export modal state
  const [exportModalVisible, setExportModalVisible] = useState<boolean>(false);
  const [exportDateRange, setExportDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);

  // Chart type states
  const [statusChartType, setStatusChartType] = useState<string>("pie");
  const [dateChartType, setDateChartType] = useState<string>("line");
  const [truckChartType, setTruckChartType] = useState<string>("bar");
  const [activeTab, setActiveTab] = useState<string>("1");

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async (startDate?: Date, endDate?: Date) => {
    setLoading(true);
    try {
      const response = await getCanteenOrderStatistics(startDate, endDate);
      if (response && response.success && response.data) {
        setStatistics(response.data);
      } else {
        messageApi.error(response.message || "Failed to fetch statistics");
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
      messageApi.error("An error occurred while fetching statistics");
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (dates: any) => {
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

  // Format date for export filename
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString().split('/').join('-');
  };

  // Add Excel export function
  const exportToExcel = async (startDate?: Date, endDate?: Date) => {
    try {
      if (!statistics) {
        messageApi.error("No data available for export");
        return;
      }
      
      setLoading(true);
      
      // If startDate and endDate are provided, fetch data for that period
      let dataToExport = statistics;
      if (startDate && endDate) {
        try {
          const response = await getCanteenOrderStatistics(startDate, endDate);
          if (response && response.success && response.data) {
            dataToExport = response.data;
          } else {
            throw new Error("Failed to fetch statistics for export");
          }
        } catch (error) {
          console.error("Error fetching export data:", error);
          messageApi.error("Error fetching data for export");
          setLoading(false);
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
        { info: 'Total Orders', value: dataToExport.totalOrders || 0 },
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
        { metric: 'Total Orders', value: dataToExport.totalOrders || 0 },
        { metric: 'Pending Orders', value: dataToExport.pendingOrders || 0 },
        { metric: 'Approved Orders', value: dataToExport.approvedOrders || 0 },
        { metric: 'Rejected Orders', value: dataToExport.rejectedOrders || 0 },
        { metric: 'Completed Orders', value: dataToExport.completedOrders || 0 },
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
      const totalOrders = dataToExport.totalOrders || 1; // Prevent division by zero
      
      // Add status data
      const statusData = [
        { status: 'Pending', count: dataToExport.pendingOrders || 0 },
        { status: 'Approved', count: dataToExport.approvedOrders || 0 },
        { status: 'Rejected', count: dataToExport.rejectedOrders || 0 },
        { status: 'Completed', count: dataToExport.completedOrders || 0 },
      ];
      
      statusData.forEach(item => {
        const percentage = (item.count / totalOrders * 100).toFixed(2) + '%';
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
      
      // Create truck distribution sheet
      const truckSheet = workbook.addWorksheet('Truck Distribution');
      truckSheet.columns = [
        { header: 'Truck', key: 'truck', width: 20 },
        { header: 'Count', key: 'count', width: 15 },
        { header: 'Percentage', key: 'percentage', width: 15 }
      ];
      
      // Format header
      formatSheetHeader(truckSheet);
      
      // Add truck data
      Object.entries(dataToExport.ordersByTruck || {}).forEach(([truck, count]) => {
        const percentage = ((count as number) / totalOrders * 100).toFixed(2) + '%';
        const row = truckSheet.addRow({ truck, count, percentage });
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
      
      // Create date distribution sheet
      const dateSheet = workbook.addWorksheet('Date Distribution');
      dateSheet.columns = [
        { header: 'Date', key: 'date', width: 20 },
        { header: 'Count', key: 'count', width: 15 },
        { header: 'Percentage', key: 'percentage', width: 15 }
      ];
      
      // Format header
      formatSheetHeader(dateSheet);
      
      // Add date data
      Object.entries(dataToExport.ordersByDate || {}).forEach(([date, count]) => {
        const formattedDate = new Date(date).toLocaleDateString();
        const percentage = ((count as number) / totalOrders * 100).toFixed(2) + '%';
        const row = dateSheet.addRow({ date: formattedDate, count, percentage });
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
        sheet.insertRow(1, [`Canteen Order Statistics Report - Exported on ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}`]);
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
      const fileName = `canteen_order_statistics${dateStr}.xlsx`;
      
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
      setLoading(false);
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
            <span>Export Canteen Order Statistics Report</span>
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
            loading={loading}
            onClick={() => exportToExcel()}
          >
            Export All Data
          </Button>,
          <Button
            key="exportRange"
            type="primary"
            icon={<FileExcelOutlined />}
            loading={loading}
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
                  The export includes detailed statistics about canteen orders
                  across multiple sheets including summary data, status distribution, 
                  truck distribution, and date distribution.
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
            <Tag color="blue">Truck Distribution</Tag>
            <Tag color="purple">Date Distribution</Tag>
          </div>
        </div>
      </Modal>
    );
  };

  // Navigation
  const handleBack = () => {
    router.back();
  };

  if (loading) {
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

  // Data processing functions
  const prepareChartData = () => {
    // Status distribution data
    const statusChartData: ChartDataItem[] = [
      { name: 'Pending', value: statistics.pendingOrders || 0 },
      { name: 'Approved', value: statistics.approvedOrders || 0 },
      { name: 'Rejected', value: statistics.rejectedOrders || 0 },
      { name: 'Completed', value: statistics.completedOrders || 0 },
    ];

    // Truck distribution data
    const truckChartData: ChartDataItem[] = Object.entries(
      statistics.ordersByTruck || {}
    ).map(([truck, count], index) => ({
      name: truck,
      value: count as number,
      fill: COLORS[index % COLORS.length],
    }));

    // Date distribution data
    const dateChartData: ChartDataItem[] = Object.entries(
      statistics.ordersByDate || {}
    )
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .map(([date, count]) => ({
      name: new Date(date).toLocaleDateString(),
      value: count as number,
    }));

    return {
      statusChartData,
      truckChartData,
      dateChartData,
    };
  };

  // Format date range display
  const formatDateDisplay = (date: Date | null): string => {
    return date ? dayjs(date).format("DD/MM/YYYY") : "";
  };

  const dateRangeDisplay =
    dateRange[0] && dateRange[1]
      ? `${formatDateDisplay(dateRange[0])} to ${formatDateDisplay(dateRange[1])}`
      : "All Time";

  // Extract chart data
  const { statusChartData, truckChartData, dateChartData } = prepareChartData();

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
            <div style={{ width: "100%", height: 400, overflow: "hidden" }}>
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
                  <RechartsTooltip formatter={(value) => [`${value} orders`]} />
                  <Legend
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          );
        case "bar":
          return (
            <div style={{ width: "100%", height: 400, overflow: "hidden" }}>
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
                  <RechartsTooltip formatter={(value) => [`${value} orders`]} />
                  <Legend />
                  <Bar dataKey="value" name="Number of Orders">
                    {data.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          );
        case "line":
          return (
            <div style={{ width: "100%", height: 400, overflow: "hidden" }}>
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
                  <RechartsTooltip formatter={(value) => [`${value} orders`]} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={token.colorPrimary}
                    name="Number of Orders"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          );
        case "area":
          return (
            <div style={{ width: "100%", height: 400, overflow: "hidden" }}>
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
                  <RechartsTooltip formatter={(value) => [`${value} orders`]} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={token.colorPrimary}
                    fill={token.colorPrimaryBg}
                    name="Number of Orders"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          );
        case "radar":
          return (
            <div style={{ width: "100%", height: 400, overflow: "hidden" }}>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="name" />
                  <PolarRadiusAxis />
                  <Radar
                    name="Number of Orders"
                    dataKey="value"
                    stroke={token.colorPrimary}
                    fill={token.colorPrimaryBg}
                    fillOpacity={0.6}
                  />
                  <Legend />
                  <RechartsTooltip formatter={(value) => [`${value} orders`]} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          );
        case "scatter":
          return (
            <div style={{ width: "100%", height: 400, overflow: "hidden" }}>
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
                    formatter={(value) => [`${value} orders`]}
                  />
                  <Legend />
                  <Scatter
                    name="Number of Orders"
                    data={data}
                    fill={token.colorPrimary}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          );
        default:
          return (
            <div style={{ width: "100%", height: 400, overflow: "hidden" }}>
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
                  <RechartsTooltip formatter={(value) => [`${value} orders`]} />
                  <Legend />
                  <Bar dataKey="value" name="Number of Orders">
                    {data.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          );
      }
    };

    // Return chart with controls
    return (
      <div style={{ width: "100%", maxWidth: "100%", overflow: "hidden" }}>
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
          <AntTooltip title="Shows distribution of canteen orders by their status (e.g., Pending, Approved, Rejected, Completed)">
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
          Date Distribution
          <AntTooltip title="Shows number of canteen orders created on each date">
            <QuestionCircleOutlined />
          </AntTooltip>
        </Space>
      ),
      children: renderChart(
        "date",
        dateChartData,
        dateChartType,
        setDateChartType
      ),
    },
    {
      key: "3",
      label: (
        <Space align="center">
          Truck Distribution
          <AntTooltip title="Shows the distribution of orders by truck license plate">
            <QuestionCircleOutlined />
          </AntTooltip>
        </Space>
      ),
      children: renderChart(
        "truck",
        truckChartData,
        truckChartType,
        setTruckChartType
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
            Canteen Order Statistics Dashboard
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
              <Button 
                icon={<FileExcelOutlined />} 
                type="primary"
                onClick={showExportModal}
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
                    Total Orders
                  </Title>
                  <AntTooltip title="Total number of canteen orders in the selected time period">
                    <QuestionCircleOutlined
                      style={{
                        fontSize: "14px",
                        color: token.colorTextSecondary,
                      }}
                    />
                  </AntTooltip>
                </Space>
              }
              value={statistics.totalOrders}
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
                    Pending Orders
                  </Title>
                  <AntTooltip title="Number of orders currently in pending status">
                    <QuestionCircleOutlined
                      style={{
                        fontSize: "14px",
                        color: token.colorTextSecondary,
                      }}
                    />
                  </AntTooltip>
                </Space>
              }
              value={statistics.pendingOrders}
              prefix={<Badge status="warning" />}
              valueStyle={{ color: "#faad14" }}
            />
            <div style={{ marginTop: "10px" }}>
              <Progress
                percent={
                  (statistics.pendingOrders /
                    statistics.totalOrders) *
                  100
                }
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
                    Approved Orders
                  </Title>
                  <AntTooltip title="Number of orders that have been approved">
                    <QuestionCircleOutlined
                      style={{
                        fontSize: "14px",
                        color: token.colorTextSecondary,
                      }}
                    />
                  </AntTooltip>
                </Space>
              }
              value={statistics.approvedOrders}
              prefix={<Badge status="processing" />}
              valueStyle={{ color: "#1677ff" }}
            />
            <div style={{ marginTop: "10px" }}>
              <Progress
                percent={
                  (statistics.approvedOrders /
                    statistics.totalOrders) *
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
                    Completed Orders
                  </Title>
                  <AntTooltip title="Number of orders that have been successfully completed">
                    <QuestionCircleOutlined
                      style={{
                        fontSize: "14px",
                        color: token.colorTextSecondary,
                      }}
                    />
                  </AntTooltip>
                </Space>
              }
              value={statistics.completedOrders}
              prefix={<Badge status="success" />}
              valueStyle={{ color: "#52c41a" }}
            />
            <div style={{ marginTop: "10px" }}>
              <Progress
                percent={
                  (statistics.completedOrders /
                    statistics.totalOrders) *
                  100
                }
                showInfo={false}
                strokeColor="#52c41a"
              />
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} className="mb-6">
        <Col xs={24} sm={12} md={24}>
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
                    Rejected Orders
                  </Title>
                  <AntTooltip title="Number of orders that were rejected">
                    <QuestionCircleOutlined
                      style={{
                        fontSize: "14px",
                        color: token.colorTextSecondary,
                      }}
                    />
                  </AntTooltip>
                </Space>
              }
              value={statistics.rejectedOrders}
              prefix={<Badge status="error" />}
              valueStyle={{ color: "#cf1322" }}
            />
            <div style={{ marginTop: "10px" }}>
              <Progress
                percent={
                  (statistics.rejectedOrders /
                    statistics.totalOrders) *
                  100
                }
                showInfo={false}
                strokeColor="#cf1322"
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
      style={{ 
        borderRadius: "8px", 
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        width: "100%",
        maxWidth: "100%",
        overflow: "hidden"
      }}
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
    <div className="history-container" style={{ padding: "20px", width: "100%", maxWidth: "100%", overflowX: "hidden" }}>
      {contextHolder}
      {renderFilterSection()}
      {renderStatisticsCards()}
      {renderChartTabs()}
      {renderExportModal()}
    </div>
  );
}

