import React, { useState, useEffect } from "react";
import Head from "next/head";
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
  message,
  Modal,
  Table,
  Avatar,
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
} from "recharts";
import { 
  getAllDrugsStatistics, 
  StatisticsOfAllDrugsDTO,
  StatisticsRequestDTO,
  DrugResponseDTO,
  DrugGroupExtendedDTO
} from "@/api/medicine-statistics";
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
  MedicineBoxOutlined,
  CheckCircleOutlined,
  StopOutlined,
  DollarOutlined,
  ShoppingOutlined,
  TeamOutlined,
  WarningOutlined,
  FileExcelOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { StatisticsofalldrugsIcon } from "@/dashboard/sidebar/icons/Statisticsofalldrugs";
import PaginationFooter from "../shared/PaginationFooter";

const { TabPane } = Tabs;
const { RangePicker } = DatePicker;
const { Title, Text } = Typography;
const { useToken } = theme;

// Type definitions
interface ChartDataItem {
  name: string;
  value: number;
  count?: number;
  fill?: string;
  original?: ChartDataItem[];
}

interface ChartTypeOption {
  icon: React.ReactNode;
  label: string;
}

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
};

export function DrugStatistics() {
  const { token } = useToken();
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();
  const [statistics, setStatistics] = useState<StatisticsOfAllDrugsDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);

  // Add pagination state for top drug groups
  const [topDrugGroupsCurrentPage, setTopDrugGroupsCurrentPage] = useState<number>(1);
  const [topDrugGroupsPageSize, setTopDrugGroupsPageSize] = useState<number>(5);

  // Add pagination state for top priced drugs
  const [topPricedDrugsCurrentPage, setTopPricedDrugsCurrentPage] = useState<number>(1);
  const [topPricedDrugsPageSize, setTopPricedDrugsPageSize] = useState<number>(5);

  // Chart type states
  const [statusChartType, setStatusChartType] = useState<string>("pie");
  const [drugGroupChartType, setDrugGroupChartType] = useState<string>("bar");
  const [manufacturerChartType, setManufacturerChartType] = useState<string>("bar");
  const [monthlyChartType, setMonthlyChartType] = useState<string>("line");
  const [priceChartType, setPriceChartType] = useState<string>("bar");
  const [supplierChartType, setSupplierChartType] = useState<string>("pie");
  const [batchStatusChartType, setBatchStatusChartType] = useState<string>("pie");
  
  // Modal state for detail view
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [detailsData, setDetailsData] = useState<ChartDataItem[]>([]);
  const [detailsTitle, setDetailsTitle] = useState("");

  // Thêm state cho modal xuất Excel
  const [exportModalVisible, setExportModalVisible] = useState<boolean>(false);
  const [exportDateRange, setExportDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async (startDate?: Date, endDate?: Date) => {
    setLoading(true);
    try {
      const params: StatisticsRequestDTO = {};
      if (startDate) params.startDate = startDate.toISOString();
      if (endDate) params.endDate = endDate.toISOString();
      
      const response = await getAllDrugsStatistics(params);
      if (response && response.isSuccess && response.data) {
        setStatistics(response.data);
        messageApi.success("Statistics loaded successfully");
      }
    } catch (error) {
      console.error("Error fetching drug statistics:", error);
      messageApi.error("Failed to load drug statistics");
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (dates: RangePickerProps["value"]) => {
    try {
      if (dates && dates[0] && dates[1]) {
        const startDate = dates[0].toDate();
        const endDate = dates[1].toDate();
        setDateRange([startDate, endDate]);
        fetchStatistics(startDate, endDate);
      } else {
        setDateRange([null, null]);
        fetchStatistics();
      }
    } catch (error) {
      console.error("Error handling date range change:", error);
      messageApi.error("Error processing date range");
    }
  };

  const handleRefresh = () => {
    fetchStatistics(dateRange[0] || undefined, dateRange[1] || undefined);
  };

  // Navigation
  const handleBack = () => {
    router.back();
  };

  // Cập nhật hàm exportToExcel
  const exportToExcel = async (startDate?: Date, endDate?: Date) => {
    try {
      if (!statistics) {
        messageApi.error("Không có dữ liệu để xuất");
        return;
      }
      
      setLoading(true);
      
      // Nếu có ngày bắt đầu và kết thúc, lấy dữ liệu mới
      let dataToExport = statistics;
      if (startDate && endDate) {
        try {
          const params: StatisticsRequestDTO = {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          };
          const response = await getAllDrugsStatistics(params);
          if (response && response.isSuccess && response.data) {
            dataToExport = response.data;
          }
        } catch (error) {
          console.error("Error fetching export data:", error);
          messageApi.error("Lỗi khi lấy dữ liệu xuất");
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
        { info: 'Total Drug Count', value: dataToExport.totalDrugs || 0 },
        { info: 'Generated By', value: 'FMCS System' }
      ];
      
      exportInfo.forEach(item => {
        const row = infoSheet.addRow(item);
        // Style info rows
        row.height = 22;
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          cell.alignment = { vertical: 'middle' };
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
        { metric: 'Total Drugs', value: dataToExport.totalDrugs || 0 },
        { metric: 'Active Drugs', value: dataToExport.drugsStatusDistribution?.Active || 0 },
        { metric: 'Drug Groups', value: dataToExport.totalDrugGroups || 0 },
        { metric: 'Total Suppliers', value: dataToExport.totalSuppliers || 0 },
        { metric: 'Total Orders', value: dataToExport.totalDrugOrders || 0 },
        { metric: 'Total Order Value', value: dataToExport.totalOrderValue || 0 },
        { metric: 'Total Batches', value: dataToExport.totalBatchNumbers || 0 },
        { metric: 'Expired Batches', value: dataToExport.totalExpiredBatches || 0 },
        { metric: 'Near Expiry Batches', value: dataToExport.totalNearExpiryBatches || 0 },
        { metric: 'Total Inventory Value', value: dataToExport.totalInventoryValue || 0 },
      ];
      
      // Add fixed row height for all sheets
      const ROW_HEIGHT = 22;
      
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
          cell.alignment = { vertical: 'middle' };
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
      const totalDrugs = dataToExport.totalDrugs || 1; // Prevent division by zero
      
      // Add status data
      Object.entries(dataToExport.drugsStatusDistribution || {}).forEach(([status, count]) => {
        const percentage = ((count as number) / totalDrugs * 100).toFixed(2) + '%';
        const row = statusSheet.addRow({ status, count, percentage });
        row.height = ROW_HEIGHT;
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          cell.alignment = { vertical: 'middle' };
        });
      });
      
      // Helper function to create and format a sheet
      const createDataSheet = (
        name: string, 
        columns: Partial<ExcelJS.Column>[], 
        dataCallback: (sheet: ExcelJS.Worksheet) => void
      ) => {
        const sheet = workbook.addWorksheet(name);
        sheet.columns = columns;
        formatSheetHeader(sheet);
        dataCallback(sheet);
        return sheet;
      };
      
      // Create drug group distribution sheet
      createDataSheet(
        'Drug Group Distribution', 
        [
          { header: 'Drug Group', key: 'drugGroup', width: 30 },
          { header: 'Count', key: 'count', width: 15 },
          { header: 'Percentage', key: 'percentage', width: 15 }
        ],
        (sheet) => {
          Object.entries(dataToExport.drugsByDrugGroup || {}).forEach(([group, count]) => {
            const percentage = ((count as number) / totalDrugs * 100).toFixed(2) + '%';
            const row = sheet.addRow({ drugGroup: group, count, percentage });
            row.height = ROW_HEIGHT;
            row.eachCell({ includeEmpty: true }, (cell) => {
              cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
              };
              cell.alignment = { vertical: 'middle' };
            });
          });
        }
      );
      
      // Create manufacturer distribution sheet
      createDataSheet(
        'Manufacturer Distribution',
        [
          { header: 'Manufacturer', key: 'manufacturer', width: 30 },
          { header: 'Count', key: 'count', width: 15 },
          { header: 'Percentage', key: 'percentage', width: 15 }
        ],
        (sheet) => {
          Object.entries(dataToExport.drugsByManufacturer || {}).forEach(([manufacturer, count]) => {
            const percentage = ((count as number) / totalDrugs * 100).toFixed(2) + '%';
            const row = sheet.addRow({ manufacturer, count, percentage });
            row.height = ROW_HEIGHT;
            row.eachCell({ includeEmpty: true }, (cell) => {
              cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
              };
              cell.alignment = { vertical: 'middle' };
            });
          });
        }
      );
      
      // Create monthly creation sheet
      createDataSheet(
        'Monthly Creation',
        [
          { header: 'Month', key: 'month', width: 20 },
          { header: 'Count', key: 'count', width: 15 },
          { header: 'Percentage', key: 'percentage', width: 15 }
        ],
        (sheet) => {
          Object.entries(dataToExport.drugsMonthlyCreation || {}).forEach(([month, count]) => {
            const percentage = ((count as number) / totalDrugs * 100).toFixed(2) + '%';
            const row = sheet.addRow({ month, count, percentage });
            row.height = ROW_HEIGHT;
            row.eachCell({ includeEmpty: true }, (cell) => {
              cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
              };
              cell.alignment = { vertical: 'middle' };
            });
          });
        }
      );
      
      // Create price distribution sheet
      createDataSheet(
        'Price Distribution',
        [
          { header: 'Price Range', key: 'priceRange', width: 20 },
          { header: 'Count', key: 'count', width: 15 },
          { header: 'Percentage', key: 'percentage', width: 15 }
        ],
        (sheet) => {
          Object.entries(dataToExport.priceDistribution || {}).forEach(([range, count]) => {
            const percentage = ((count as number) / totalDrugs * 100).toFixed(2) + '%';
            const row = sheet.addRow({ priceRange: range, count, percentage });
            row.height = ROW_HEIGHT;
            row.eachCell({ includeEmpty: true }, (cell) => {
              cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
              };
              cell.alignment = { vertical: 'middle' };
            });
          });
        }
      );
      
      // Create supplier distribution sheet
      createDataSheet(
        'Supplier Distribution',
        [
          { header: 'Supplier', key: 'supplier', width: 30 },
          { header: 'Count', key: 'count', width: 15 },
          { header: 'Percentage', key: 'percentage', width: 15 }
        ],
        (sheet) => {
          const totalOrders = Object.values(dataToExport.ordersBySupplier || {}).reduce((sum, count) => sum + (count as number), 0) || 1;
          Object.entries(dataToExport.ordersBySupplier || {}).forEach(([supplier, count]) => {
            const percentage = ((count as number) / totalOrders * 100).toFixed(2) + '%';
            const row = sheet.addRow({ supplier, count, percentage });
            row.height = ROW_HEIGHT;
            row.eachCell({ includeEmpty: true }, (cell) => {
              cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
              };
              cell.alignment = { vertical: 'middle' };
            });
          });
        }
      );
      
      // Create batch status sheet
      createDataSheet(
        'Batch Status',
        [
          { header: 'Batch Status', key: 'batchStatus', width: 20 },
          { header: 'Count', key: 'count', width: 15 },
          { header: 'Percentage', key: 'percentage', width: 15 }
        ],
        (sheet) => {
          const totalBatches = Object.values(dataToExport.batchStatusDistribution || {}).reduce((sum, count) => sum + (count as number), 0) || 1;
          Object.entries(dataToExport.batchStatusDistribution || {}).forEach(([status, count]) => {
            const percentage = ((count as number) / totalBatches * 100).toFixed(2) + '%';
            const row = sheet.addRow({ batchStatus: status, count, percentage });
            row.height = ROW_HEIGHT;
            row.eachCell({ includeEmpty: true }, (cell) => {
              cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
              };
              cell.alignment = { vertical: 'middle' };
            });
          });
        }
      );

      // Create top priced drugs sheet
      const topDrugsSheet = workbook.addWorksheet('Top Priced Drugs');
      topDrugsSheet.columns = [
        { header: 'Drug Name', key: 'drugName', width: 30 },
        { header: 'Drug Code', key: 'drugCode', width: 15 },
        { header: 'Drug Group', key: 'drugGroup', width: 20 },
        { header: 'Price', key: 'price', width: 15 },
        { header: 'Manufacturer', key: 'manufacturer', width: 25 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Created At', key: 'createdAt', width: 15 }
      ];
      
      // Format header
      formatSheetHeader(topDrugsSheet);
      
      // Add top drugs data
      dataToExport.topPricedDrugs?.forEach(drug => {
        const row = topDrugsSheet.addRow({
          drugName: drug.name,
          drugCode: drug.drugCode,
          drugGroup: drug.drugGroup?.groupName || '',
          price: drug.price,
          manufacturer: drug.manufacturer || '',
          status: drug.status || '',
          createdAt: dayjs(drug.createdAt).format('DD/MM/YYYY')
        });
        
        row.height = ROW_HEIGHT;
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          cell.alignment = { vertical: 'middle' };
          
          // Apply common formatting to all cells
          cell.alignment = { vertical: 'middle' };
        });
      });

      // Create top drug groups sheet
      const topGroupsSheet = workbook.addWorksheet('Top Drug Groups');
      topGroupsSheet.columns = [
        { header: 'Group Name', key: 'groupName', width: 30 },
        { header: 'Drug Count', key: 'drugCount', width: 15 },
        { header: 'Description', key: 'description', width: 40 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Created At', key: 'createdAt', width: 15 }
      ];
      
      // Format header
      formatSheetHeader(topGroupsSheet);
      
      // Add top groups data
      dataToExport.topDrugGroups?.forEach(group => {
        const row = topGroupsSheet.addRow({
          groupName: group.groupName,
          drugCount: group.drugCount,
          description: group.description || '',
          status: group.status || '',
          createdAt: dayjs(group.createdAt).format('DD/MM/YYYY')
        });
        
        row.height = ROW_HEIGHT;
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          cell.alignment = { vertical: 'middle' };
        });
      });
      
      // Add export title with timestamp to each sheet
      const addExportHeader = (sheet: ExcelJS.Worksheet) => {
        sheet.insertRow(1, []);
        sheet.insertRow(1, [`Medicine Statistics Report - Exported on ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}`]);
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
      const fileName = `medicine_statistics${dateStr}.xlsx`;
      
      // Export to file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, fileName);
      
      messageApi.success("Tệp Excel đã được tải xuống thành công");
      setExportModalVisible(false);
    } catch (error) {
      console.error("Lỗi khi xuất Excel:", error);
      messageApi.error("Không thể xuất tệp Excel");
    } finally {
      setLoading(false);
    }
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
    // Drug status distribution data
    const statusChartData: ChartDataItem[] = Object.entries(
      statistics?.drugsStatusDistribution || {}
    ).map(([status, count]) => ({
      name: status,
      value: count as number,
    }));

    // Drug group distribution data
    const drugGroupChartData: ChartDataItem[] = Object.entries(
      statistics?.drugsByDrugGroup || {}
    ).map(([group, count]) => ({
      name: group,
      value: count as number,
    }));

    // Manufacturer distribution data
    const manufacturerChartData: ChartDataItem[] = Object.entries(
      statistics?.drugsByManufacturer || {}
    ).slice(0, 10).map(([manufacturer, count]) => ({
      name: manufacturer,
      value: count as number,
    }));

    // Monthly creation data
    const monthlyChartData: ChartDataItem[] = Object.entries(
      statistics?.drugsMonthlyCreation || {}
    ).map(([month, count]) => ({
      name: month,
      value: count as number,
    }));

    // Price distribution data
    const priceChartData: ChartDataItem[] = Object.entries(
      statistics?.priceDistribution || {}
    ).map(([range, count]) => ({
      name: range,
      value: count as number,
    }));

    // Supplier distribution data
    const supplierChartData: ChartDataItem[] = Object.entries(
      statistics?.ordersBySupplier || {}
    ).map(([supplier, count]) => ({
      name: supplier,
      value: count as number,
    }));

    // Batch status distribution data
    const batchStatusChartData: ChartDataItem[] = Object.entries(
      statistics?.batchStatusDistribution || {}
    ).map(([status, count]) => ({
      name: status,
      value: count as number,
    }));

    // Thêm dữ liệu cho Drug Group Status Distribution
    const drugGroupStatusChartData: ChartDataItem[] = Object.entries(
      statistics?.drugGroupStatusDistribution || {}
    ).map(([status, count]) => ({
      name: status,
      value: count as number,
    }));

    // Thêm dữ liệu cho Batches By Month
    const batchesByMonthChartData: ChartDataItem[] = Object.entries(
      statistics?.batchesByMonth || {}
    ).map(([month, count]) => ({
      name: month,
      value: count as number,
    }));

    // Thêm dữ liệu cho Batches By Supplier
    const batchesBySupplierChartData: ChartDataItem[] = Object.entries(
      statistics?.batchesBySupplier || {}
    ).map(([supplier, count]) => ({
      name: supplier,
      value: count as number,
    }));

    // Thêm dữ liệu cho Batches By Drug
    const batchesByDrugChartData: ChartDataItem[] = Object.entries(
      statistics?.batchesByDrug || {}
    ).map(([drug, count]) => ({
      name: drug,
      value: count as number,
    }));

    return {
      statusChartData,
      drugGroupChartData,
      manufacturerChartData,
      monthlyChartData,
      priceChartData,
      supplierChartData,
      batchStatusChartData,
      drugGroupStatusChartData,
      batchesByMonthChartData,
      batchesBySupplierChartData,
      batchesByDrugChartData,
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

  const {
    statusChartData,
    drugGroupChartData,
    manufacturerChartData,
    monthlyChartData,
    priceChartData,
    supplierChartData,
    batchStatusChartData,
    drugGroupStatusChartData,
    batchesByMonthChartData,
    batchesBySupplierChartData,
    batchesByDrugChartData,
  } = prepareChartData();

  // Handle pie sector click
  const handlePieSectorClick = (data: any, index: number) => {
    // Check if this is the "Others" category
    if (data.name === "Others" && data.original) {
      setDetailsData(data.original);
      setDetailsTitle("Details for 'Others' Category");
      setDetailsVisible(true);
    }
  };

  const renderChart = (
    type: string,
    data: ChartDataItem[],
    chartType: string,
    setChartType: (type: string) => void
  ) => {
    // Create chart configuration menu
    const chartConfigMenu = (
      <div className="mb-4 flex justify-end">
        <Select
          value={chartType}
          onChange={setChartType}
          style={{ width: 150 }}
          dropdownStyle={{ padding: '8px' }}
          optionLabelProp="label"
        >
          {Object.entries(chartTypes).map(([key, { icon, label }]) => (
            <Select.Option key={key} value={key} label={
              <Space>
                {icon}
                {label}
              </Space>
            }>
              <Space style={{ display: 'flex', alignItems: 'center' }}>
                {icon}
                {label}
              </Space>
            </Select.Option>
          ))}
        </Select>
      </div>
    );

    // Group small percentages for pie chart
    const THRESHOLD_PERCENT = type === "supplier" ? 9 : 2; // 9% threshold for suppliers, 2% for others
    console.log('Chart type:', type, 'Threshold:', THRESHOLD_PERCENT);

    const processedData = chartType === "pie" ? (() => {
      // Calculate total value
      const totalValue = data.reduce((sum, item) => sum + item.value, 0);
      console.log('Total value:', totalValue);
      
      if (totalValue === 0) return data;
      
      // Separate items into main items and small items
      const mainItems: ChartDataItem[] = [];
      const smallItems: ChartDataItem[] = [];
      
      data.forEach(item => {
        const percentage = (item.value / totalValue) * 100;
        console.log('Item:', item.name, 'Value:', item.value, 'Percentage:', percentage.toFixed(2) + '%');
        if (percentage >= THRESHOLD_PERCENT) {
          mainItems.push(item);
        } else {
          smallItems.push(item);
        }
      });
      
      console.log('Main items:', mainItems.length, 'Small items:', smallItems.length);
      
      // If we have small items, add an "Others" category
      if (smallItems.length > 0) {
        const othersValue = smallItems.reduce((sum, item) => sum + item.value, 0);
        console.log('Others value:', othersValue, 'Percentage:', ((othersValue / totalValue) * 100).toFixed(2) + '%');
        
        // Make sure Others shows up with a non-zero percentage if there are items
        if (othersValue > 0) {
          const othersItem: ChartDataItem = {
            name: "Others",
            value: othersValue,
            // Store original items for detailed view
            original: smallItems
          };
          const result = [...mainItems, othersItem];
          console.log('Final processed data length:', result.length);
          return result;
        }
      }
      
      return data;
    })() : data;

    // Chart component renderer
    const renderChartComponent = () => {
      switch (chartType) {
        case "pie":
          return (
            <div 
              className="pie-chart-container"
              style={{ 
                width: "100%", 
                height: 400, 
                border: "none", 
                padding: 0,
                boxShadow: "none", 
                outline: "none" 
              }}
            >
              <ResponsiveContainer 
                width="100%" 
                height="100%" 
                style={{ border: "none", outline: "none" }}
              >
                <PieChart 
                  style={{ border: "none", outline: "none" }} 
                  margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                >
                  <Pie
                    data={processedData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(1)}%`
                    }
                    onClick={handlePieSectorClick}
                    style={{ outline: "none", border: "none" }}
                  >
                    {processedData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        style={{ cursor: entry.name === "Others" ? "pointer" : "default" }}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value, name, props) => {
                    if (name === "Others") {
                      return [`${value} (Click for details)`, name];
                    }
                    return [value, name];
                  }} />
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
            <div style={{ width: "100%", height: 400, border: "none", padding: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
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
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="value" name="Count">
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
            <div style={{ width: "100%", height: 400, border: "none", padding: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
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
                  <RechartsTooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={token.colorPrimary}
                    name="Count"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          );
        case "area":
          return (
            <div style={{ width: "100%", height: 400, border: "none", padding: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
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
                  <RechartsTooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={token.colorPrimary}
                    fill={token.colorPrimaryBg}
                    name="Count"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          );
        case "radar":
          return (
            <div style={{ width: "100%", height: 400, border: "none", padding: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="name" />
                  <PolarRadiusAxis />
                  <Radar
                    name="Count"
                    dataKey="value"
                    stroke={token.colorPrimary}
                    fill={token.colorPrimaryBg}
                    fillOpacity={0.6}
                  />
                  <Legend />
                  <RechartsTooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
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
          <StatisticsofalldrugsIcon/>
          <h3 className="text-xl font-bold">
          Medicine Statistics Dashboard
          </h3>
        </div>
      </div>

      <Card
        className="mb-6 statistics-filter-card"
        style={{ 
          borderRadius: "8px", 
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          border: "1px solid #f0f0f0" 
        }}
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
                title="Refresh data"
              >
                Refresh
              </Button>
              <Button
                icon={<FileExcelOutlined />}
                onClick={() => setExportModalVisible(true)}
                type="primary"
                title="Export to Excel"
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
                type="primary"
                onClick={() => {
                  setDateRange([null, null]);
                  fetchStatistics();
                }}
              >
                All Time
              </Button>
              <Button
                onClick={() => {
                  const today = new Date();
                  const lastWeek = new Date();
                  lastWeek.setDate(today.getDate() - 7);
                  setDateRange([lastWeek, today]);
                  fetchStatistics(lastWeek, today);
                }}
              >
                Last 7 Days
              </Button>
              <Button
                onClick={() => {
                  const today = new Date();
                  const lastMonth = new Date();
                  lastMonth.setDate(today.getDate() - 30);
                  setDateRange([lastMonth, today]);
                  fetchStatistics(lastMonth, today);
                }}
              >
                Last 30 Days
              </Button>
              <Button
                onClick={() => {
                  const today = new Date();
                  const last3Months = new Date();
                  last3Months.setMonth(today.getMonth() - 3);
                  setDateRange([last3Months, today]);
                  fetchStatistics(last3Months, today);
                }}
              >
                Last 3 Months
              </Button>
              <Button
                onClick={() => {
                  const today = new Date();
                  const last6Months = new Date();
                  last6Months.setMonth(today.getMonth() - 6);
                  setDateRange([last6Months, today]);
                  fetchStatistics(last6Months, today);
                }}
              >
                Last 6 Months
              </Button>
              <Button
                onClick={() => {
                  const today = new Date();
                  const thisYear = new Date(today.getFullYear(), 0, 1);
                  setDateRange([thisYear, today]);
                  fetchStatistics(thisYear, today);
                }}
              >
                This Year
              </Button>
              <Button
                onClick={() => {
                  const today = new Date();
                  const lastYearStart = new Date(today.getFullYear() - 1, 0, 1);
                  const lastYearEnd = new Date(today.getFullYear() - 1, 11, 31);
                  setDateRange([lastYearStart, lastYearEnd]);
                  fetchStatistics(lastYearStart, lastYearEnd);
                }}
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
                allowClear
              />
              <Button
                type="primary"
                onClick={() => fetchStatistics(dateRange[0] || undefined, dateRange[1] || undefined)}
              >
                Apply
              </Button>
              <Button
                onClick={() => {
                  setDateRange([null, null]);
                  fetchStatistics();
                }}
              >
                Reset
              </Button>
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
      <Divider orientation="left">Drug Summary</Divider>
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card hoverable className="statistic-card" style={{ 
            borderRadius: "8px", 
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            border: "1px solid #f0f0f0"
          }}>
            <Statistic
              title={
                <Space align="center">
                  <Title level={5} style={{ margin: 0 }}>
                    Total Drugs
                  </Title>
                  <AntTooltip title="Total number of drugs in the system">
                    <QuestionCircleOutlined style={{ fontSize: "14px", color: token.colorTextSecondary }} />
                  </AntTooltip>
                </Space>
              }
              value={statistics?.totalDrugs || 0}
              valueStyle={{ color: token.colorPrimary }}
              prefix={<MedicineBoxOutlined />}
            />
            <div style={{ marginTop: "10px" }}>
              <Progress percent={100} showInfo={false} strokeColor={token.colorPrimary} />
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8} lg={6}>
          <Card hoverable className="statistic-card" style={{ 
            borderRadius: "8px", 
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            border: "1px solid #f0f0f0"
          }}>
            <Statistic
              title={
                <Space align="center">
                  <Title level={5} style={{ margin: 0 }}>
                    Active Drugs
                  </Title>
                  <AntTooltip title="Number of active drugs">
                    <QuestionCircleOutlined style={{ fontSize: "14px", color: token.colorTextSecondary }} />
                  </AntTooltip>
                </Space>
              }
              value={statistics?.drugsStatusDistribution?.Active || 0}
              valueStyle={{ color: token.colorSuccess }}
              prefix={<Badge status="success" />}
            />
            <div style={{ marginTop: "10px" }}>
              <Progress
                percent={Math.round(
                  ((statistics?.drugsStatusDistribution?.Active || 0) /
                    (statistics?.totalDrugs || 1)) *
                    100
                )}
                showInfo={false}
                strokeColor={token.colorSuccess}
              />
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8} lg={6}>
          <Card hoverable className="statistic-card" style={{ 
            borderRadius: "8px", 
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            border: "1px solid #f0f0f0"
          }}>
            <Statistic
              title={
                <Space align="center">
                  <Title level={5} style={{ margin: 0 }}>
                    Drug Groups
                  </Title>
                  <AntTooltip title="Total number of drug groups">
                    <QuestionCircleOutlined style={{ fontSize: "14px", color: token.colorTextSecondary }} />
                  </AntTooltip>
                </Space>
              }
              value={statistics?.totalDrugGroups || 0}
              valueStyle={{ color: token.colorInfo }}
              prefix={<ShoppingOutlined />}
            />
            <div style={{ marginTop: "10px" }}>
              <Progress percent={100} showInfo={false} strokeColor={token.colorInfo} />
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8} lg={6}>
          <Card hoverable className="statistic-card" style={{ 
            borderRadius: "8px", 
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            border: "1px solid #f0f0f0"
          }}>
            <Statistic
              title={
                <Space align="center">
                  <Title level={5} style={{ margin: 0 }}>
                    Total Suppliers
                  </Title>
                  <AntTooltip title="Total number of drug suppliers">
                    <QuestionCircleOutlined style={{ fontSize: "14px", color: token.colorTextSecondary }} />
                  </AntTooltip>
                </Space>
              }
              value={statistics?.totalSuppliers || 0}
              valueStyle={{ color: "#722ed1" }}
              prefix={<TeamOutlined />}
            />
            <div style={{ marginTop: "10px" }}>
              <Progress percent={100} showInfo={false} strokeColor="#722ed1" />
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8} lg={6}>
          <Card hoverable className="statistic-card" style={{ 
            borderRadius: "8px", 
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            border: "1px solid #f0f0f0"
          }}>
            <Statistic
              title={
                <Space align="center">
                  <Title level={5} style={{ margin: 0 }}>
                    Total Orders
                  </Title>
                  <AntTooltip title="Total number of drug orders">
                    <QuestionCircleOutlined style={{ fontSize: "14px", color: token.colorTextSecondary }} />
                  </AntTooltip>
                </Space>
              }
              value={statistics?.totalDrugOrders || 0}
              valueStyle={{ color: "#fa8c16" }}
              prefix={<ShoppingOutlined />}
            />
            <div style={{ marginTop: "10px" }}>
              <Progress percent={100} showInfo={false} strokeColor="#fa8c16" />
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8} lg={6}>
          <Card hoverable className="statistic-card" style={{ 
            borderRadius: "8px", 
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            border: "1px solid #f0f0f0"
          }}>
            <Statistic
              title={
                <Space align="center">
                  <Title level={5} style={{ margin: 0 }}>
                    Order Value
                  </Title>
                  <AntTooltip title="Total value of all drug orders">
                    <QuestionCircleOutlined style={{ fontSize: "14px", color: token.colorTextSecondary }} />
                  </AntTooltip>
                </Space>
              }
              value={statistics?.totalOrderValue || 0}
              valueStyle={{ color: "#52c41a" }}
              prefix={<DollarOutlined />}
              precision={2}
            />
            <div style={{ marginTop: "10px" }}>
              <Progress percent={100} showInfo={false} strokeColor="#52c41a" />
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8} lg={6}>
          <Card hoverable className="statistic-card" style={{ 
            borderRadius: "8px", 
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            border: "1px solid #f0f0f0"
          }}>
            <Statistic
              title={
                <Space align="center">
                  <Title level={5} style={{ margin: 0 }}>
                    Total Batches
                  </Title>
                  <AntTooltip title="Total number of batch numbers">
                    <QuestionCircleOutlined style={{ fontSize: "14px", color: token.colorTextSecondary }} />
                  </AntTooltip>
                </Space>
              }
              value={statistics?.totalBatchNumbers || 0}
              valueStyle={{ color: "#1890ff" }}
              prefix={<ShoppingOutlined />}
            />
            <div style={{ marginTop: "10px" }}>
              <Progress percent={100} showInfo={false} strokeColor="#1890ff" />
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8} lg={6}>
          <Card hoverable className="statistic-card" style={{ 
            borderRadius: "8px", 
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            border: "1px solid #f0f0f0"
          }}>
            <Statistic
              title={
                <Space align="center">
                  <Title level={5} style={{ margin: 0 }}>
                    Expired Batches
                  </Title>
                  <AntTooltip title="Number of expired batches">
                    <QuestionCircleOutlined style={{ fontSize: "14px", color: token.colorTextSecondary }} />
                  </AntTooltip>
                </Space>
              }
              value={statistics?.totalExpiredBatches || 0}
              valueStyle={{ color: "#f5222d" }}
              prefix={<Badge status="error" />}
            />
            <div style={{ marginTop: "10px" }}>
              <Progress 
                percent={statistics?.totalBatchNumbers ? (statistics?.totalExpiredBatches / statistics?.totalBatchNumbers) * 100 : 0} 
                showInfo={false} 
                strokeColor="#f5222d" 
              />
            </div>
          </Card>
        </Col>

        {/* Thêm card cho Near Expiry Batches */}
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card hoverable className="statistic-card" style={{ 
            borderRadius: "8px", 
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            border: "1px solid #f0f0f0"
          }}>
            <Statistic
              title={
                <Space align="center">
                  <Title level={5} style={{ margin: 0 }}>
                    Near Expiry Batches
                  </Title>
                  <AntTooltip title="Number of batches nearing expiration">
                    <QuestionCircleOutlined style={{ fontSize: "14px", color: token.colorTextSecondary }} />
                  </AntTooltip>
                </Space>
              }
              value={statistics?.totalNearExpiryBatches || 0}
              valueStyle={{ color: "#faad14" }}
              prefix={<Badge status="warning" />}
            />
            <div style={{ marginTop: "10px" }}>
              <Progress 
                percent={statistics?.totalBatchNumbers ? (statistics?.totalNearExpiryBatches / statistics?.totalBatchNumbers) * 100 : 0} 
                showInfo={false} 
                strokeColor="#faad14" 
              />
            </div>
          </Card>
        </Col>

        {/* Thêm card cho Inventory Value */}
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card hoverable className="statistic-card" style={{ 
            borderRadius: "8px", 
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            border: "1px solid #f0f0f0"
          }}>
            <Statistic
              title={
                <Space align="center">
                  <Title level={5} style={{ margin: 0 }}>
                    Inventory Value
                  </Title>
                  <AntTooltip title="Total value of current inventory">
                    <QuestionCircleOutlined style={{ fontSize: "14px", color: token.colorTextSecondary }} />
                  </AntTooltip>
                </Space>
              }
              value={statistics?.totalInventoryValue || 0}
              valueStyle={{ color: "#13c2c2" }}
              prefix={<DollarOutlined />}
              precision={2}
            />
            <div style={{ marginTop: "10px" }}>
              <Progress percent={100} showInfo={false} strokeColor="#13c2c2" />
            </div>
          </Card>
        </Col>

        {/* Thêm card cho Active Drug Groups */}
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card hoverable className="statistic-card" style={{ 
            borderRadius: "8px", 
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            border: "1px solid #f0f0f0"
          }}>
            <Statistic
              title={
                <Space align="center">
                  <Title level={5} style={{ margin: 0 }}>
                    Active Drug Groups
                  </Title>
                  <AntTooltip title="Number of active drug groups">
                    <QuestionCircleOutlined style={{ fontSize: "14px", color: token.colorTextSecondary }} />
                  </AntTooltip>
                </Space>
              }
              value={statistics?.drugGroupStatusDistribution?.Active || 0}
              valueStyle={{ color: "#85a5ff" }}
              prefix={<Badge status="processing" />}
            />
            <div style={{ marginTop: "10px" }}>
              <Progress
                percent={Math.round(
                  ((statistics?.drugGroupStatusDistribution?.Active || 0) /
                    (statistics?.totalDrugGroups || 1)) *
                    100
                )}
                showInfo={false}
                strokeColor="#85a5ff"
              />
            </div>
          </Card>
        </Col>
      </Row>
    </>
  );

  // Tab items definition
  const tabItems = [
    {
      key: "1",
      label: (
        <Space align="center">
          Drug Status Distribution
          <AntTooltip title="Shows distribution of drugs by status">
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
          Drug Group Distribution
          <AntTooltip title="Shows distribution of drugs by drug group">
            <QuestionCircleOutlined />
          </AntTooltip>
        </Space>
      ),
      children: renderChart(
        "drugGroup",
        drugGroupChartData,
        drugGroupChartType,
        setDrugGroupChartType
      ),
    },
    {
      key: "3",
      label: (
        <Space align="center">
          Manufacturer Distribution
          <AntTooltip title="Shows distribution of drugs by manufacturer">
            <QuestionCircleOutlined />
          </AntTooltip>
        </Space>
      ),
      children: renderChart(
        "manufacturer",
        manufacturerChartData,
        manufacturerChartType,
        setManufacturerChartType
      ),
    },
    {
      key: "4",
      label: (
        <Space align="center">
          Monthly Creation
          <AntTooltip title="Shows number of drugs created each month">
            <QuestionCircleOutlined />
          </AntTooltip>
        </Space>
      ),
      children: renderChart(
        "monthly",
        monthlyChartData,
        monthlyChartType,
        setMonthlyChartType
      ),
    },
    {
      key: "5",
      label: (
        <Space align="center">
          Price Distribution
          <AntTooltip title="Shows distribution of drugs by price range">
            <QuestionCircleOutlined />
          </AntTooltip>
        </Space>
      ),
      children: renderChart(
        "price",
        priceChartData,
        priceChartType,
        setPriceChartType
      ),
    },
    {
      key: "6",
      label: (
        <Space align="center">
          Supplier Distribution
          <AntTooltip title="Shows distribution of orders by supplier">
            <QuestionCircleOutlined />
          </AntTooltip>
        </Space>
      ),
      children: (() => {
        // Special handling for supplier pie chart
        if (supplierChartType === "pie") {
          // Nhận tất cả dữ liệu supplier từ API
          const allSupplierData = Object.entries(
            statistics?.ordersBySupplier || {}
          ).map(([supplier, count]) => ({
            name: supplier,
            value: count as number,
          }));
          
          console.log("All supplier data:", allSupplierData);
          
          // Group suppliers with less than 9% into "Others"
          const totalValue = allSupplierData.reduce((sum, item) => sum + item.value, 0);
          const mainSuppliers: ChartDataItem[] = [];
          const smallSuppliers: ChartDataItem[] = [];
          
          allSupplierData.forEach(item => {
            const percentage = (item.value / totalValue) * 100;
            console.log(`Supplier: ${item.name}, Value: ${item.value}, Percentage: ${percentage.toFixed(2)}%`);
            if (percentage >= 9) {
              mainSuppliers.push(item);
            } else {
              smallSuppliers.push(item);
            }
          });
          
          console.log("Main suppliers:", mainSuppliers);
          console.log("Small suppliers:", smallSuppliers);
          
          // Tạo processed data mới với các supplier chính và Others
          let processedSupplierData: ChartDataItem[] = [];
          
          if (smallSuppliers.length > 0) {
            const othersValue = smallSuppliers.reduce((sum, item) => sum + item.value, 0);
            const othersPercentage = (othersValue / totalValue) * 100;
            console.log(`Others value: ${othersValue}, Percentage: ${othersPercentage.toFixed(2)}%`);
            
            const othersItem: ChartDataItem = {
              name: "Others",
              value: othersValue,
              original: smallSuppliers
            };
            processedSupplierData = [...mainSuppliers, othersItem];
          } else {
            // Nếu không có supplier nhỏ, vẫn tạo Others với giá trị 0
            processedSupplierData = [
              ...mainSuppliers,
              {
                name: "Others",
                value: 0,
                original: []
              }
            ];
          }
          
          console.log("Final processed supplier data:", processedSupplierData);
          
          return renderChart(
            "supplier",
            processedSupplierData,
            supplierChartType,
            setSupplierChartType
          );
        }
        
        // For other chart types, use the original data
        return renderChart(
          "supplier",
          supplierChartData,
          supplierChartType,
          setSupplierChartType
        );
      })(),
    },
    {
      key: "7",
      label: (
        <Space align="center">
          Batch Status
          <AntTooltip title="Shows distribution of batches by status">
            <QuestionCircleOutlined />
          </AntTooltip>
        </Space>
      ),
      children: renderChart(
        "batchStatus",
        batchStatusChartData,
        batchStatusChartType,
        setBatchStatusChartType
      ),
    },
    {
      key: "8",
      label: (
        <Space align="center">
          Drug Group Status
          <AntTooltip title="Shows distribution of drug groups by status">
            <QuestionCircleOutlined />
          </AntTooltip>
        </Space>
      ),
      children: renderChart(
        "drugGroupStatus",
        drugGroupStatusChartData,
        "pie", // Mặc định sử dụng biểu đồ tròn
        () => {} // Không cần thiết setChartType vì chỉ sử dụng pie chart
      ),
    },
    {
      key: "9",
      label: (
        <Space align="center">
          Batches By Month
          <AntTooltip title="Shows distribution of batches by creation month">
            <QuestionCircleOutlined />
          </AntTooltip>
        </Space>
      ),
      children: renderChart(
        "batchesByMonth",
        batchesByMonthChartData,
        "bar", // Mặc định sử dụng biểu đồ cột
        () => {} // Không cần thiết setChartType vì chỉ sử dụng bar chart
      ),
    },
    {
      key: "10",
      label: (
        <Space align="center">
          Batches By Supplier
          <AntTooltip title="Shows distribution of batches by supplier">
            <QuestionCircleOutlined />
          </AntTooltip>
        </Space>
      ),
      children: renderChart(
        "batchesBySupplier",
        batchesBySupplierChartData,
        "pie", // Mặc định sử dụng biểu đồ tròn
        () => {} // Không cần thiết setChartType vì chỉ sử dụng pie chart
      ),
    },
    {
      key: "11",
      label: (
        <Space align="center">
          Batches By Drug
          <AntTooltip title="Shows distribution of batches by drug">
            <QuestionCircleOutlined />
          </AntTooltip>
        </Space>
      ),
      children: renderChart(
        "batchesByDrug",
        batchesByDrugChartData,
        "bar", // Mặc định sử dụng biểu đồ cột
        () => {} // Không cần thiết setChartType vì chỉ sử dụng bar chart
      ),
    },
  ];

  const renderChartTabs = () => (
    <Card
      className="mb-6 chart-card"
      style={{ 
        borderRadius: "8px", 
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        border: "1px solid #f0f0f0" 
      }}
    >
      <Tabs 
        defaultActiveKey="1" 
        items={tabItems} 
        className="no-border-tabs"
        tabBarStyle={{ marginBottom: "24px" }}
        tabBarGutter={20}
        type="card"
      />
    </Card>
  );

  // Thêm một hàm để hiển thị Top Priced Drugs
  const renderTopPricedDrugs = () => {
    if (!statistics?.topPricedDrugs?.length) {
      return null;
    }

    // Calculate paginated data
    const startIndex = (topPricedDrugsCurrentPage - 1) * topPricedDrugsPageSize;
    const endIndex = startIndex + topPricedDrugsPageSize;
    const paginatedPricedDrugs = statistics.topPricedDrugs.slice(startIndex, endIndex);

    return (
      <Card 
        title={
          <Space align="center">
            <DollarOutlined />
            <span>Top Priced Drugs</span>
            <AntTooltip title="Shows the most expensive drugs in the system">
              <QuestionCircleOutlined style={{ fontSize: "14px", color: token.colorTextSecondary }} />
            </AntTooltip>
          </Space>
        }
        className="mb-6"
        style={{ 
          borderRadius: "8px", 
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          border: "1px solid #f0f0f0" 
        }}
      >
        <Table
          dataSource={paginatedPricedDrugs}
          rowKey="id"
          pagination={false}
          columns={[
            {
              title: "Name",
              dataIndex: "name",
              key: "name",
              render: (text, record) => (
                <Space>
                  {record.imageUrl && (
                    <Avatar 
                      shape="square" 
                      size={40} 
                      src={record.imageUrl} 
                      alt={text}
                      style={{ marginRight: 8 }}
                    />
                  )}
                  <div>
                    <div style={{ fontWeight: "bold" }}>{text}</div>
                    <div style={{ fontSize: "12px", color: token.colorTextSecondary }}>{record.drugCode}</div>
                  </div>
                </Space>
              ),
            },
            {
              title: "Group",
              dataIndex: ["drugGroup", "groupName"],
              key: "groupName",
              render: (text) => <Tag color="blue">{text}</Tag>,
            },
            {
              title: "Price",
              dataIndex: "price",
              key: "price",
              sorter: (a, b) => a.price - b.price,
              defaultSortOrder: "descend",
              render: (price) => (
                <span style={{ color: "#f50", fontWeight: "bold" }}>
                  {price.toLocaleString()} VND
                </span>
              ),
            },
            {
              title: "Manufacturer",
              dataIndex: "manufacturer",
              key: "manufacturer",
            },
            {
              title: "Status",
              dataIndex: "status",
              key: "status",
              render: (status) => (
                <Tag color={status === "Active" ? "green" : "red"}>{status}</Tag>
              ),
            },
          ]}
        />
        
        {/* Add PaginationFooter */}
        <PaginationFooter
          current={topPricedDrugsCurrentPage}
          pageSize={topPricedDrugsPageSize}
          total={statistics.topPricedDrugs.length}
          onChange={(page, pageSize) => {
            setTopPricedDrugsCurrentPage(page);
            if (pageSize) setTopPricedDrugsPageSize(pageSize);
          }}
          showGoToPage={true}
          showTotal={true}
        />
      </Card>
    );
  };

  // Thêm một hàm để hiển thị Top Drug Groups
  const renderTopDrugGroups = () => {
    if (!statistics?.topDrugGroups?.length) {
      return null;
    }

    // Calculate paginated data
    const startIndex = (topDrugGroupsCurrentPage - 1) * topDrugGroupsPageSize;
    const endIndex = startIndex + topDrugGroupsPageSize;
    const paginatedDrugGroups = statistics.topDrugGroups.slice(startIndex, endIndex);

    return (
      <Card 
        title={
          <Space align="center">
            <AppstoreOutlined />
            <span>Top Drug Groups</span>
            <AntTooltip title="Shows the top drug groups by drug count">
              <QuestionCircleOutlined style={{ fontSize: "14px", color: token.colorTextSecondary }} />
            </AntTooltip>
          </Space>
        }
        className="mb-6"
        style={{ 
          borderRadius: "8px", 
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          border: "1px solid #f0f0f0" 
        }}
      >
        <Table
          dataSource={paginatedDrugGroups}
          rowKey="id"
          pagination={false}
          columns={[
            {
              title: "Group Name",
              dataIndex: "groupName",
              key: "groupName",
              render: (text) => <span style={{ fontWeight: "bold" }}>{text}</span>,
            },
            {
              title: "Drug Count",
              dataIndex: "drugCount",
              key: "drugCount",
              sorter: (a, b) => a.drugCount - b.drugCount,
              defaultSortOrder: "descend",
              render: (count) => (
                <Badge count={count} showZero style={{ backgroundColor: "#1890ff" }} />
              ),
            },
            {
              title: "Description",
              dataIndex: "description",
              key: "description",
              ellipsis: true,
            },
            {
              title: "Status",
              dataIndex: "status",
              key: "status",
              render: (status) => (
                <Tag color={status === "Active" ? "green" : "red"}>{status}</Tag>
              ),
            },
            {
              title: "Created",
              dataIndex: "createdAt",
              key: "createdAt",
              render: (date) => dayjs(date).format("DD/MM/YYYY"),
            },
          ]}
        />
        
        {/* Add PaginationFooter */}
        <PaginationFooter
          current={topDrugGroupsCurrentPage}
          pageSize={topDrugGroupsPageSize}
          total={statistics.topDrugGroups.length}
          onChange={(page, pageSize) => {
            setTopDrugGroupsCurrentPage(page);
            if (pageSize) setTopDrugGroupsPageSize(pageSize);
          }}
          showGoToPage={true}
          showTotal={true}
        />
      </Card>
    );
  };

  // Add date selection modal for Excel export
  const renderExportModal = () => {
    return (
      <Modal
        title={
          <Space>
            <FileExcelOutlined style={{ color: '#52c41a' }} />
            <span>Export Medicine Statistics Report</span>
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
              message="New Excel Export Format Features"
              description={
                <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                  <li>Orange headers with white bold text for better visibility</li>
                  <li>Consistent row heights across all tables</li>
                  <li>Export timestamp information in each sheet header</li>
                  <li>Added percentage calculations for statistical data</li>
                  <li>Improved table formatting with borders for better readability</li>
                  <li>Information sheet with export details</li>
                </ul>
              }
              type="success"
              showIcon
            />
            
            <Alert
              message="Report Contents"
              description={
                <div>
                  The export includes detailed statistics about drugs, orders, and inventory 
                  across multiple sheets including summary data, status distribution, 
                  top drug groups, and top priced drugs.
                </div>
              }
              type="info"
              showIcon
              style={{ marginTop: '12px' }}
            />
          </Space>
        </div>
      </Modal>
    );
  };

  return (
    <div className="statistics-container p-6">
      <Head>
        <style dangerouslySetInnerHTML={{ __html: `
          .no-border-tabs .ant-tabs-content-holder {
            border: none !important;
            box-shadow: none !important;
          }
          .no-border-tabs .ant-tabs-tabpane {
            border: none !important;
            box-shadow: none !important;
            outline: none !important;
          }
          .recharts-wrapper {
            border: none !important;
            outline: none !important;
            box-shadow: none !important;
          }
          .recharts-surface {
            border: none !important;
            outline: none !important;
            box-shadow: none !important;
          }
          svg {
            border: none !important;
            outline: none !important;
            box-shadow: none !important;
          }
          .pie-chart-container {
            border: none !important;
            outline: none !important;
            box-shadow: none !important;
          }
          .recharts-pie {
            outline: none !important;
            border: none !important;
            box-shadow: none !important;
          }
          .recharts-default-tooltip {
            box-shadow: none !important;
          }
          .recharts-pie-sector {
            outline: none !important;
            stroke: none !important;
          }
          .recharts-layer {
            outline: none !important;
          }
          * {
            outline: none !important;
          }
          .ant-tabs {
            border: none !important;
          }
          .ant-tabs-content {
            border: none !important;
          }
          .ant-tabs-tabpane-active {
            border: none !important;
          }
        ` }} />
      </Head>
      {contextHolder}
      {renderFilterSection()}
      {renderStatisticsCards()}

      <Divider orientation="left">Detailed Analysis</Divider>
      {renderChartTabs()}
      
      {/* Thêm các thành phần mới */}
      <Divider orientation="left">Top Drug Groups</Divider>
      {renderTopDrugGroups()}

      <Divider orientation="left">Top Priced Drugs</Divider>
      {renderTopPricedDrugs()}
      
      <Modal
        title={detailsTitle}
        open={detailsVisible}
        onCancel={() => setDetailsVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailsVisible(false)}>
            Close
          </Button>
        ]}
        width={700}
        style={{ backgroundColor: 'white' }}
        bodyStyle={{ backgroundColor: 'white', padding: '20px' }}
      >
        <div style={{ height: "400px", backgroundColor: 'white' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={detailsData} style={{ backgroundColor: 'white' }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <RechartsTooltip />
              <Bar dataKey="value" name="Count">
                {detailsData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[(index + COLORS.length / 2) % COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Modal>

      {/* Thêm modal xuất Excel */}
      {renderExportModal()}
    </div>
  );
} 