import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Button,
  DatePicker,
  Select,
  Space,
  Table,
  Spin,
  message,
  Divider,
  Tabs,
  Typography,
  Empty,
  Tag,
  Badge,
  Radio,
  Tooltip as AntTooltip,
  Progress,
  Alert,
  theme,
  Modal
} from 'antd';
import {
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
  PieChart,
  Pie,
  Cell,
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
  ComposedChart
} from 'recharts';
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
  FileExcelOutlined,
  QuestionCircleOutlined,
  ArrowLeftOutlined,
  FilterOutlined
} from '@ant-design/icons';
import {
  getFilteredAppointmentStatistics,
  exportAppointmentStatistics,
  getAllHealthcareStaff
} from '../../api/appointment-api';
import type {
  DetailedAppointmentStatisticsDTO,
  AppointmentStatisticsRequestDTO,
  AvailableOfficersResponseDTO
} from '../../api/appointment-api';
import type { RangePickerProps } from 'antd/es/date-picker';
import Cookies from 'js-cookie';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { useRouter } from 'next/router';

const { TabPane } = Tabs;
const { RangePicker } = DatePicker;
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { useToken } = theme;

// Define status colors for consistent display
const statusColors: Record<string, string> = {
  Scheduled: '#1890ff',
  Completed: '#52c41a',
  Cancelled: '#ff4d4f',
  Missed: '#faad14'
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

// Chart type options
const chartTypes: Record<string, { icon: React.ReactNode; label: string }> = {
  bar: { icon: <BarChartOutlined />, label: "Bar Chart" },
  line: { icon: <LineChartOutlined />, label: "Line Chart" },
  area: { icon: <AreaChartOutlined />, label: "Area Chart" },
  pie: { icon: <PieChartOutlined />, label: "Pie Chart" },
  radar: { icon: <RadarChartOutlined />, label: "Radar Chart" },
  scatter: { icon: <DotChartOutlined />, label: "Scatter Chart" },
};

// Chart data interface
interface ChartDataItem {
  name: string;
  value: number;
  count?: number;
  fill?: string;
}

const AppointmentStatistic: React.FC = () => {
  const { token } = useToken();
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [statistics, setStatistics] = useState<DetailedAppointmentStatisticsDTO | null>(null);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);
  const [activeDateFilter, setActiveDateFilter] = useState<string>("all");
  const [staffOptions, setStaffOptions] = useState<AvailableOfficersResponseDTO[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [exportLoading, setExportLoading] = useState<boolean>(false);
  const [messageApi, contextHolder] = message.useMessage();

  // Chart type states
  const [statusChartType, setStatusChartType] = useState<string>("pie");
  const [dailyChartType, setDailyChartType] = useState<string>("line");
  const [reasonChartType, setReasonChartType] = useState<string>("bar");
  const [staffChartType, setStaffChartType] = useState<string>("bar");
  const [activeTab, setActiveTab] = useState<string>("1");
  
  // Export modal state
  const [exportModalVisible, setExportModalVisible] = useState<boolean>(false);
  const [exportDateRange, setExportDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);

  // Fetch initial data on component mount
  useEffect(() => {
    fetchStatistics();
    fetchStaffOptions();
  }, []);

  const fetchStaffOptions = async () => {
    try {
      const response = await getAllHealthcareStaff();
      if (response.isSuccess && response.data) {
        setStaffOptions(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch healthcare staff:', error);
      messageApi.error('Failed to load healthcare staff');
    }
  };

  const fetchStatistics = async (startDate?: dayjs.Dayjs | null, endDate?: dayjs.Dayjs | null) => {
    setLoading(true);
    try {
      const token = Cookies.get('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const params: AppointmentStatisticsRequestDTO = {
        startDate: startDate?.format('YYYY-MM-DD'),
        endDate: endDate?.format('YYYY-MM-DD'),
        staffId: selectedStaffId,
        statusFilter: statusFilter.length > 0 ? statusFilter : undefined,
        includeDailyStats: true,
        includeStaffPerformance: true,
        includeReasonCategories: true
      };

      const response = await getFilteredAppointmentStatistics(params, token);
      if (response.isSuccess && response.data) {
        setStatistics(response.data);
      } else {
        messageApi.error(response.message || 'Failed to load statistics');
      }
    } catch (error: any) {
      console.error('Error fetching statistics:', error);
      messageApi.error(error.message || 'An error occurred while loading statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (dates: RangePickerProps["value"]) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange([dates[0], dates[1]]);
    } else {
      setDateRange([null, null]);
    }
  };

  const applyDateFilter = () => {
    fetchStatistics(dateRange[0], dateRange[1]);
    setActiveDateFilter("custom");
  };

  const resetDateFilter = () => {
    setDateRange([null, null]);
    setSelectedStaffId(undefined);
    setStatusFilter([]);
    fetchStatistics();
    setActiveDateFilter("all");
  };

  const applyQuickFilter = (period: string) => {
    const today = dayjs();
    let startDate: dayjs.Dayjs | null = null;
    let endDate: dayjs.Dayjs = today;

    switch (period) {
      case "last7days":
        startDate = today.subtract(7, 'day');
        setActiveDateFilter("last7days");
        break;
      case "last30days":
        startDate = today.subtract(30, 'day');
        setActiveDateFilter("last30days");
        break;
      case "last3months":
        startDate = today.subtract(3, 'month');
        setActiveDateFilter("last3months");
        break;
      case "last6months":
        startDate = today.subtract(6, 'month');
        setActiveDateFilter("last6months");
        break;
      case "thisyear":
        startDate = dayjs().startOf('year');
        setActiveDateFilter("thisyear");
        break;
      case "lastyear":
        startDate = dayjs().subtract(1, 'year').startOf('year');
        endDate = dayjs().subtract(1, 'year').endOf('year');
        setActiveDateFilter("lastyear");
        break;
      default:
        startDate = null;
        setActiveDateFilter("all");
    }

    setDateRange([startDate, endDate]);
    fetchStatistics(startDate, endDate);
  };

  const showExportModal = () => {
    setExportDateRange([null, null]);
    setExportModalVisible(true);
  };

  // Export date range change handler
  const handleExportDateRangeChange = (dates: any) => {
    setExportDateRange(dates);
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      if (exportDateRange[0] && exportDateRange[1]) {
        await exportToExcel(exportDateRange[0], exportDateRange[1]);
      } else {
        await exportToExcel();
      }
      messageApi.success('Statistics exported successfully');
      setExportModalVisible(false);
    } catch (error: any) {
      console.error('Export error:', error);
      messageApi.error(error.message || 'Failed to export statistics');
    } finally {
      setExportLoading(false);
    }
  };

  const exportToExcel = async (startDate?: dayjs.Dayjs | null, endDate?: dayjs.Dayjs | null) => {
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
          const token = Cookies.get('token');
          if (!token) {
            throw new Error('No authentication token found');
          }

          const params: AppointmentStatisticsRequestDTO = {
            startDate: startDate.format('YYYY-MM-DD'),
            endDate: endDate.format('YYYY-MM-DD'),
            staffId: selectedStaffId,
            statusFilter: statusFilter.length > 0 ? statusFilter : undefined,
            includeDailyStats: true,
            includeStaffPerformance: true,
            includeReasonCategories: true
          };

          const response = await getFilteredAppointmentStatistics(params, token);
          if (response.isSuccess && response.data) {
            dataToExport = response.data;
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
          // Apply blue background to headers
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1677FF' } // Blue
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
            `${formatDate(startDate)} to ${formatDate(endDate)}` : 'All Time' },
        { info: 'Total Appointments', value: dataToExport.totalAppointments || 0 },
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
        { metric: 'Total Appointments', value: dataToExport.totalAppointments || 0 },
        { metric: 'Completed Appointments', value: dataToExport.completedAppointments || 0 },
        { metric: 'Missed Appointments', value: dataToExport.missedAppointments || 0 },
        { metric: 'Healthcare Officers', value: dataToExport.totalHealthcareOfficers || 0 },
        { metric: 'Students Receiving Care', value: dataToExport.studentsCurrentlyReceivingCare || 0 },
        { metric: 'Completion Rate (%)', value: ((dataToExport.completionRate || 0) * 100).toFixed(2) },
        { metric: 'Average Appointments Per Day', value: (dataToExport.averageAppointmentsPerDay || 0).toFixed(2) },
        { metric: 'Peak Appointment Time', value: dataToExport.peakAppointmentTime || 'N/A' },
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
      const totalAppointments = dataToExport.totalAppointments || 1; // Prevent division by zero
      
      // Add status data
      Object.entries(dataToExport.appointmentsByStatus || {}).forEach(([status, count]) => {
        const percentage = (dataToExport.statusPercentages[status] * 100).toFixed(2) + '%';
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
      
      // Create daily statistics sheet
      const dailySheet = workbook.addWorksheet('Daily Statistics');
      dailySheet.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Total', key: 'total', width: 10 },
        { header: 'Completed', key: 'completed', width: 12 },
        { header: 'Cancelled', key: 'cancelled', width: 12 },
        { header: 'Missed', key: 'missed', width: 10 },
        { header: 'Scheduled', key: 'scheduled', width: 12 }
      ];
      
      // Format header
      formatSheetHeader(dailySheet);
      
      // Add daily stats data
      (dataToExport.dailyStatistics || []).forEach((day) => {
        const row = dailySheet.addRow({
          date: day.date,
          total: day.totalAppointments,
          completed: day.completed,
          cancelled: day.cancelled,
          missed: day.missed,
          scheduled: day.scheduled
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
      
      // Create staff performance sheet
      const staffSheet = workbook.addWorksheet('Staff Performance');
      staffSheet.columns = [
        { header: 'Staff Name', key: 'staffName', width: 25 },
        { header: 'Total', key: 'total', width: 10 },
        { header: 'Completed', key: 'completed', width: 12 },
        { header: 'Missed', key: 'missed', width: 10 },
        { header: 'Cancelled', key: 'cancelled', width: 12 },
        { header: 'Completion Rate', key: 'completionRate', width: 15 }
      ];
      
      // Format header
      formatSheetHeader(staffSheet);
      
      // Add staff performance data
      (dataToExport.staffPerformance || []).forEach((staff) => {
        const row = staffSheet.addRow({
          staffName: staff.staffName,
          total: staff.totalAppointments,
          completed: staff.completedAppointments,
          missed: staff.missedAppointments,
          cancelled: staff.cancelledAppointments,
          completionRate: (staff.completionRate * 100).toFixed(2) + '%'
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
      
      // Create reason categories sheet
      const reasonSheet = workbook.addWorksheet('Reason Categories');
      reasonSheet.columns = [
        { header: 'Reason', key: 'reason', width: 30 },
        { header: 'Count', key: 'count', width: 10 },
        { header: 'Percentage', key: 'percentage', width: 15 }
      ];
      
      // Format header
      formatSheetHeader(reasonSheet);
      
      // Add reason categories data
      Object.entries(dataToExport.reasonCategories || {}).forEach(([reason, count]) => {
        const percentage = ((count as number) / totalAppointments * 100).toFixed(2) + '%';
        const row = reasonSheet.addRow({ reason, count, percentage });
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
        sheet.insertRow(1, [`Appointment Statistics Report - Exported on ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}`]);
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
        ? `_${formatDate(startDate)}_to_${formatDate(endDate)}`.replace(/\//g, '-')
        : '_all_time';
      const fileName = `appointment_statistics${dateStr}.xlsx`;
      
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

  // Data processing and formatting functions
  const formatDate = (date: dayjs.Dayjs | null): string => {
    return date ? date.format("DD/MM/YYYY") : "";
  };

  const dateRangeDisplay =
    dateRange[0] && dateRange[1]
      ? `${formatDate(dateRange[0])} to ${formatDate(dateRange[1])}`
      : "All Time";

  // Prepare chart data functions
  const prepareStatusChartData = (): ChartDataItem[] => {
    if (!statistics?.appointmentsByStatus) return [];
    return Object.entries(statistics.appointmentsByStatus).map(([status, count], index) => ({
      name: status,
      value: count as number,
      fill: statusColors[status] || COLORS[index % COLORS.length],
    }));
  };

  const prepareDailyChartData = (): any[] => {
    if (!statistics?.dailyStatistics) return [];
    return statistics.dailyStatistics.map(day => ({
      date: dayjs(day.date).format('MMM DD'),
      Total: day.totalAppointments,
      Completed: day.completed,
      Cancelled: day.cancelled,
      Missed: day.missed,
      Scheduled: day.scheduled
    }));
  };

  const prepareReasonChartData = (): ChartDataItem[] => {
    if (!statistics?.reasonCategories) return [];
    return Object.entries(statistics.reasonCategories).map(([reason, count], index) => ({
      name: reason,
      value: count as number,
      fill: COLORS[index % COLORS.length],
    }));
  };

  const prepareStaffChartData = (): any[] => {
    if (!statistics?.staffPerformance) return [];
    return statistics.staffPerformance.map(staff => ({
      name: staff.staffName,
      Completed: staff.completedAppointments,
      Missed: staff.missedAppointments,
      Cancelled: staff.cancelledAppointments,
      'Completion Rate': (staff.completionRate * 100).toFixed(1)
    }));
  };

  // Navigation
  const handleBack = () => {
    router.back();
  };

  // Custom chart renderer based on type
  const renderChart = (
    type: string,
    data: ChartDataItem[] | any[],
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
                  {data.map((entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.fill || COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value) => [`${value} appointments`]} />
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
                <RechartsTooltip formatter={(value) => [`${value} appointments`]} />
                <Legend />
                <Bar dataKey="value" name="Number of Appointments">
                  {data.map((entry: any, index: number) => (
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
                  dataKey="date" 
                  angle={-45}
                  textAnchor="end"
                  height={70}
                />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Line type="monotone" dataKey="Total" stroke="#8884d8" />
                <Line type="monotone" dataKey="Completed" stroke="#52c41a" />
                <Line type="monotone" dataKey="Cancelled" stroke="#ff4d4f" />
                <Line type="monotone" dataKey="Missed" stroke="#faad14" />
                <Line type="monotone" dataKey="Scheduled" stroke="#1890ff" />
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
                  dataKey="date"
                  angle={-45}
                  textAnchor="end"
                  height={70}
                />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Area type="monotone" dataKey="Total" stackId="1" stroke="#8884d8" fill="#8884d8" />
                <Area type="monotone" dataKey="Completed" stackId="2" stroke="#52c41a" fill="#52c41a" />
                <Area type="monotone" dataKey="Cancelled" stackId="3" stroke="#ff4d4f" fill="#ff4d4f" />
                <Area type="monotone" dataKey="Missed" stackId="4" stroke="#faad14" fill="#faad14" />
                <Area type="monotone" dataKey="Scheduled" stackId="5" stroke="#1890ff" fill="#1890ff" />
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
                  name="Number of Appointments"
                  dataKey="value"
                  stroke={token.colorPrimary}
                  fill={token.colorPrimaryBg}
                  fillOpacity={0.6}
                />
                <Legend />
                <RechartsTooltip formatter={(value) => [`${value} appointments`]} />
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
                  formatter={(value) => [`${value} appointments`]}
                />
                <Legend />
                <Scatter
                  name="Number of Appointments"
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
                <RechartsTooltip formatter={(value) => [`${value} appointments`]} />
                <Legend />
                <Bar dataKey="value" name="Number of Appointments">
                  {data.map((entry: any, index: number) => (
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

  // Export modal renderer
  const renderExportModal = () => {
    return (
      <Modal
        title={
          <Space>
            <FileExcelOutlined style={{ color: '#52c41a' }} />
            <span>Export Appointment Statistics Report</span>
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
            onClick={handleExport}
            loading={exportLoading}
          >
            Export All Data
          </Button>,
          <Button
            key="exportRange"
            type="primary"
            icon={<FileExcelOutlined />}
            disabled={!exportDateRange[0] || !exportDateRange[1]}
            onClick={handleExport}
            loading={exportLoading}
          >
            Export Selected Range
          </Button>,
        ]}
      >
        <div style={{ marginBottom: "20px" }}>
          <Title level={5}>Select Date Range</Title>
          <RangePicker
            style={{ width: "100%", marginTop: "8px" }}
            value={exportDateRange}
            onChange={handleExportDateRangeChange}
          />
        </div>
        
        <Divider orientation="left">Report Format Information</Divider>
        
        <div style={{ marginBottom: "16px" }}>
          <Space direction="vertical" style={{ width: '100%' }}>            
            <Alert
              message="Report Contents"
              description={
                <div>
                  The export includes detailed statistics about appointments
                  across multiple sheets including summary data, status distribution, 
                  daily trends, staff performance metrics, and appointment reasons.
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
            <Tag color="blue">Summary Statistics</Tag>
            <Tag color="green">Status Distribution</Tag>
            <Tag color="orange">Daily Statistics</Tag>
            <Tag color="purple">Staff Performance</Tag>
            <Tag color="cyan">Reason Categories</Tag>
          </div>
        </div>
      </Modal>
    );
  };

  // Filter section renderer
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
            Appointment Statistics Dashboard
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
                onClick={() => fetchStatistics(dateRange[0], dateRange[1])}
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
          <Col xs={24} sm={24} md={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text>Custom Range:</Text>
              <RangePicker
                style={{ width: '100%' }}
                value={dateRange}
                onChange={handleDateRangeChange}
              />
            </Space>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Space>
              <Button type="primary" icon={<FilterOutlined />} onClick={() => fetchStatistics(dateRange[0], dateRange[1])}>
                Apply Filters
              </Button>
              <Button onClick={resetDateFilter}>
                Reset
              </Button>
            </Space>
          </Col>
          <Col span={12} style={{ textAlign: "right" }}>
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

  // Statistics cards renderer
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
                    Total Appointments
                  </Title>
                  <AntTooltip title="Total number of appointments in the selected time period">
                    <QuestionCircleOutlined
                      style={{
                        fontSize: "14px",
                        color: token.colorTextSecondary,
                      }}
                    />
                  </AntTooltip>
                </Space>
              }
              value={statistics?.totalAppointments || 0}
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
                    Completed Appointments
                  </Title>
                  <AntTooltip title="Number of appointments that have been successfully completed">
                    <QuestionCircleOutlined
                      style={{
                        fontSize: "14px",
                        color: token.colorTextSecondary,
                      }}
                    />
                  </AntTooltip>
                </Space>
              }
              value={statistics?.completedAppointments || 0}
              prefix={<Badge status="success" />}
              valueStyle={{ color: "#52c41a" }}
            />
            <div style={{ marginTop: "10px" }}>
              <Progress
                percent={
                  ((statistics?.completedAppointments || 0) /
                    (statistics?.totalAppointments || 1)) *
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
                    Missed Appointments
                  </Title>
                  <AntTooltip title="Number of appointments that were missed by patients">
                    <QuestionCircleOutlined
                      style={{
                        fontSize: "14px",
                        color: token.colorTextSecondary,
                      }}
                    />
                  </AntTooltip>
                </Space>
              }
              value={statistics?.missedAppointments || 0}
              prefix={<Badge status="warning" />}
              valueStyle={{ color: "#faad14" }}
            />
            <div style={{ marginTop: "10px" }}>
              <Progress
                percent={
                  ((statistics?.missedAppointments || 0) /
                    (statistics?.totalAppointments || 1)) *
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
                    Healthcare Officers
                  </Title>
                  <AntTooltip title="Total number of healthcare officers">
                    <QuestionCircleOutlined
                      style={{
                        fontSize: "14px",
                        color: token.colorTextSecondary,
                      }}
                    />
                  </AntTooltip>
                </Space>
              }
              value={statistics?.totalHealthcareOfficers || 0}
              prefix={<Badge status="processing" />}
              valueStyle={{ color: "#1677ff" }}
            />
            <div style={{ marginTop: "10px" }}>
              <Progress
                percent={100}
                showInfo={false}
                strokeColor="#1677ff"
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
                    Students Receiving Care
                  </Title>
                  <AntTooltip title="Number of students currently receiving healthcare services">
                    <QuestionCircleOutlined
                      style={{
                        fontSize: "14px",
                        color: token.colorTextSecondary,
                      }}
                    />
                  </AntTooltip>
                </Space>
              }
              value={statistics?.studentsCurrentlyReceivingCare || 0}
              valueStyle={{ color: "#722ed1" }}
            />
            <div style={{ marginTop: "10px" }}>
              <Progress
                percent={100}
                showInfo={false}
                strokeColor="#722ed1"
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
                  <AntTooltip title="Percentage of appointments that were successfully completed">
                    <QuestionCircleOutlined
                      style={{
                        fontSize: "14px",
                        color: token.colorTextSecondary,
                      }}
                    />
                  </AntTooltip>
                </Space>
              }
              value={(statistics?.completionRate || 0) * 100}
              precision={2}
              valueStyle={{ color: "#1677ff" }}
              suffix="%"
            />
            <div style={{ marginTop: "10px" }}>
              <Progress
                percent={(statistics?.completionRate || 0) * 100}
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
                    Avg. Appointments Per Day
                  </Title>
                  <AntTooltip title="Average number of appointments scheduled per day">
                    <QuestionCircleOutlined
                      style={{
                        fontSize: "14px",
                        color: token.colorTextSecondary,
                      }}
                    />
                  </AntTooltip>
                </Space>
              }
              value={statistics?.averageAppointmentsPerDay || 0}
              precision={2}
              valueStyle={{ color: "#13c2c2" }}
            />
            <div style={{ marginTop: "10px" }}>
              <Progress
                percent={Math.min(
                  ((statistics?.averageAppointmentsPerDay || 0) / 20) * 100,
                  100
                )}
                showInfo={false}
                strokeColor="#13c2c2"
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
                    Peak Appointment Time
                  </Title>
                  <AntTooltip title="Most popular time of day for appointments">
                    <QuestionCircleOutlined
                      style={{
                        fontSize: "14px",
                        color: token.colorTextSecondary,
                      }}
                    />
                  </AntTooltip>
                </Space>
              }
              value={statistics?.peakAppointmentTime || "N/A"}
              valueStyle={{ color: "#eb2f96" }}
            />
            <div style={{ marginTop: "10px" }}>
              <Progress
                percent={100}
                showInfo={false}
                strokeColor="#eb2f96"
              />
            </div>
          </Card>
        </Col>
      </Row>
    </>
  );

  // Chart tabs renderer
  const renderChartTabs = () => {
    // Tab items definition
    const tabItems = [
      {
        key: "1",
        label: (
          <Space align="center">
            Status Distribution
            <AntTooltip title="Shows distribution of appointments by their status (e.g., Scheduled, Completed, Cancelled, Missed)">
              <QuestionCircleOutlined />
            </AntTooltip>
          </Space>
        ),
        content: renderChart(
          "status",
          prepareStatusChartData(),
          statusChartType,
          setStatusChartType
        ),
      },
      {
        key: "2",
        label: (
          <Space align="center">
            Daily Statistics
            <AntTooltip title="Shows number of appointments by day with status breakdown">
              <QuestionCircleOutlined />
            </AntTooltip>
          </Space>
        ),
        content: renderChart(
          "daily",
          prepareDailyChartData(),
          dailyChartType,
          setDailyChartType
        ),
      },
      {
        key: "3",
        label: (
          <Space align="center">
            Appointment Reasons
            <AntTooltip title="Shows the most common reasons for appointments">
              <QuestionCircleOutlined />
            </AntTooltip>
          </Space>
        ),
        content: renderChart(
          "reasons",
          prepareReasonChartData(),
          reasonChartType,
          setReasonChartType
        ),
      },
      {
        key: "4",
        label: (
          <Space align="center">
            Staff Performance
            <AntTooltip title="Shows healthcare staff performance metrics">
              <QuestionCircleOutlined />
            </AntTooltip>
          </Space>
        ),
        content: (
          <div>
            {statistics?.staffPerformance && statistics.staffPerformance.length > 0 ? (
              <>
                {renderChart(
                  "staff",
                  prepareStaffChartData(),
                  staffChartType,
                  setStaffChartType
                )}
                <Divider />
                <Table
                  dataSource={statistics.staffPerformance.map((staff, index) => ({
                    key: index,
                    ...staff,
                    completionRate: `${(staff.completionRate * 100).toFixed(2)}%`
                  }))}
                  columns={[
                    { title: 'Staff Name', dataIndex: 'staffName', key: 'staffName' },
                    { title: 'Total Appointments', dataIndex: 'totalAppointments', key: 'totalAppointments', sorter: (a, b) => a.totalAppointments - b.totalAppointments },
                    { title: 'Completed', dataIndex: 'completedAppointments', key: 'completedAppointments' },
                    { title: 'Missed', dataIndex: 'missedAppointments', key: 'missedAppointments' },
                    { title: 'Cancelled', dataIndex: 'cancelledAppointments', key: 'cancelledAppointments' },
                    { 
                      title: 'Completion Rate', 
                      dataIndex: 'completionRate', 
                      key: 'completionRate',
                      sorter: (a, b) => parseFloat(a.completionRate) - parseFloat(b.completionRate),
                      render: (text) => {
                        const rate = parseFloat(text);
                        let color = 'green';
                        if (rate < 50) color = 'red';
                        else if (rate < 75) color = 'orange';
                        return <Tag color={color}>{text}</Tag>;
                      }
                    }
                  ]}
                  pagination={false}
                />
              </>
            ) : (
              <Empty description="No staff performance data available" />
            )}
          </div>
        ),
      },
      {
        key: "5",
        label: (
          <Space align="center">
            Detailed Statistics
            <AntTooltip title="Shows detailed statistics about appointments">
              <QuestionCircleOutlined />
            </AntTooltip>
          </Space>
        ),
        content: (
          <>
            <Card title="Status Breakdown" style={{ marginBottom: 20 }}>
              <Table
                dataSource={statistics?.appointmentsByStatus ? 
                  Object.keys(statistics.appointmentsByStatus).map((status, index) => ({
                    key: index,
                    status,
                    count: statistics.appointmentsByStatus[status],
                    percentage: `${(statistics.statusPercentages[status] * 100).toFixed(2)}%`
                  })) : []
                }
                columns={[
                  { 
                    title: 'Status', 
                    dataIndex: 'status', 
                    key: 'status',
                    render: (text) => (
                      <Tag color={statusColors[text] || 'default'}>{text}</Tag>
                    )
                  },
                  { title: 'Count', dataIndex: 'count', key: 'count' },
                  { title: 'Percentage', dataIndex: 'percentage', key: 'percentage' }
                ]}
                pagination={false}
              />
            </Card>

            <Card title="Daily Statistics">
              <Table
                dataSource={statistics?.dailyStatistics ? 
                  statistics.dailyStatistics.map((day, index) => ({
                    key: index,
                    ...day,
                    date: dayjs(day.date).format('YYYY-MM-DD')
                  })) : []
                }
                columns={[
                  { title: 'Date', dataIndex: 'date', key: 'date' },
                  { title: 'Total', dataIndex: 'totalAppointments', key: 'totalAppointments' },
                  { title: 'Completed', dataIndex: 'completed', key: 'completed' },
                  { title: 'Cancelled', dataIndex: 'cancelled', key: 'cancelled' },
                  { title: 'Missed', dataIndex: 'missed', key: 'missed' },
                  { title: 'Scheduled', dataIndex: 'scheduled', key: 'scheduled' }
                ]}
                pagination={{ pageSize: 7 }}
              />
            </Card>
          </>
        ),
      },
    ];

    return (
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
  };

  // Main component return
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="appointment-statistics-container" style={{ padding: "20px" }}>
      {contextHolder}
      {renderFilterSection()}
      {statistics ? (
        <>
          {renderStatisticsCards()}
          {renderChartTabs()}
        </>
      ) : (
        <Empty 
          description="No appointment statistics data available. Apply filters and click 'Apply Filters' to view statistics." 
          style={{ marginTop: 50 }}
        />
      )}
      {renderExportModal()}
    </div>
  );
};

export default AppointmentStatistic;
