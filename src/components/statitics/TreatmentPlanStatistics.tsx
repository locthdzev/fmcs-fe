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
  Modal,
  message,
  Tag,
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
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

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
  const [messageApi, contextHolder] = message.useMessage();

  // Add export modal state
  const [exportModalVisible, setExportModalVisible] = useState<boolean>(false);
  const [exportDateRange, setExportDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);

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
          const response = await getTreatmentPlanStatistics(startDate, endDate);
          if (response && response.isSuccess && response.data) {
            // Map the response to match the expected format
            dataToExport = {
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
            `${formatDate(startDate)} to ${formatDate(endDate)}` : 'All Time' },
        { info: 'Total Treatment Plans', value: dataToExport.totalTreatmentPlans || 0 },
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
        { metric: 'Total Treatment Plans', value: dataToExport.totalTreatmentPlans || 0 },
        { metric: 'Active Treatment Plans', value: dataToExport.totalActiveTreatmentPlans || 0 },
        { metric: 'Completed Treatment Plans', value: dataToExport.totalCompletedTreatmentPlans || 0 },
        { metric: 'Cancelled Treatment Plans', value: dataToExport.totalCancelledTreatmentPlans || 0 },
        { metric: 'Average Duration (days)', value: dataToExport.averageDuration?.toFixed(2) || 0 },
        { metric: 'Completion Rate (%)', value: dataToExport.completionRate?.toFixed(2) || 0 },
        { metric: 'Cancellation Rate (%)', value: dataToExport.cancellationRate?.toFixed(2) || 0 },
        { metric: 'Avg Plans Per Patient', value: dataToExport.averageTreatmentPlansPerPatient?.toFixed(2) || 0 },
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
      const totalPlans = dataToExport.totalTreatmentPlans || 1; // Prevent division by zero
      
      // Add status data
      Object.entries(dataToExport.treatmentPlansByStatus || {}).forEach(([status, count]) => {
        const percentage = ((count as number) / totalPlans * 100).toFixed(2) + '%';
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
      Object.entries(dataToExport.treatmentPlansByMonth || {}).forEach(([month, count]) => {
        const percentage = ((count as number) / totalPlans * 100).toFixed(2) + '%';
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
      
      // Create drugs distribution sheet
      const drugsSheet = workbook.addWorksheet('Top Drugs');
      drugsSheet.columns = [
        { header: 'Drug', key: 'drug', width: 30 },
        { header: 'Count', key: 'count', width: 15 },
        { header: 'Percentage', key: 'percentage', width: 15 }
      ];
      
      // Format header
      formatSheetHeader(drugsSheet);
      
      // Add drugs data
      Object.entries(dataToExport.treatmentPlansByDrug || {}).forEach(([drug, count]) => {
        const percentage = ((count as number) / totalPlans * 100).toFixed(2) + '%';
        const row = drugsSheet.addRow({ drug, count, percentage });
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
      const staffSheet = workbook.addWorksheet('Top Staff');
      staffSheet.columns = [
        { header: 'Staff', key: 'staff', width: 30 },
        { header: 'Count', key: 'count', width: 15 },
        { header: 'Percentage', key: 'percentage', width: 15 }
      ];
      
      // Format header
      formatSheetHeader(staffSheet);
      
      // Add staff data
      Object.entries(dataToExport.treatmentPlansByUser || {}).forEach(([staff, count]) => {
        const percentage = ((count as number) / totalPlans * 100).toFixed(2) + '%';
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
      
      // Create patient distribution sheet
      const patientSheet = workbook.addWorksheet('Patient Distribution');
      patientSheet.columns = [
        { header: 'Treatment Plans', key: 'planCount', width: 20 },
        { header: 'Patient Count', key: 'patientCount', width: 15 },
        { header: 'Percentage', key: 'percentage', width: 15 }
      ];
      
      // Format header
      formatSheetHeader(patientSheet);
      
      // Calculate total patients
      const totalPatients = Object.values(dataToExport.patientDistribution || {}).reduce((sum, count) => sum + (count as number), 0) || 1;
      
      // Add patient distribution data
      Object.entries(dataToExport.patientDistribution || {}).forEach(([planCount, patientCount]) => {
        const percentage = ((patientCount as number) / totalPatients * 100).toFixed(2) + '%';
        const row = patientSheet.addRow({ 
          planCount: `${planCount} plan(s)`,
          patientCount,
          percentage
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
        sheet.insertRow(1, [`Treatment Plan Statistics Report - Exported on ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}`]);
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
      const fileName = `treatment_plan_statistics${dateStr}.xlsx`;
      
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
            <span>Export Treatment Plan Statistics Report</span>
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
            onClick={() => exportToExcel()}
          >
            Export All Data
          </Button>,
          <Button
            key="exportRange"
            type="primary"
            icon={<FileExcelOutlined />}
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
                  The export includes detailed statistics about treatment plans
                  across multiple sheets including summary data, status distribution, 
                  monthly trends, top drugs, and staff performance metrics.
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
            <Tag color="purple">Top Drugs</Tag>
            <Tag color="cyan">Top Staff</Tag>
            <Tag color="magenta">Patient Distribution</Tag>
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
      {contextHolder}
      {renderFilterSection()}
      {renderStatisticsCards()}
      {renderChartTabs()}
      {renderExportModal()}
    </div>
  );
}
