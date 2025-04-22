import * as ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { message } from 'antd';

interface MonthlyDistribution {
  year: number;
  month: number;
  count: number;
}

interface HealthCheckStatisticsData {
  totalResults: number;
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
  monthlyDistribution: MonthlyDistribution[];
}

interface HealthCheckStatisticsResponse {
  isSuccess: boolean;
  code: number;
  data: HealthCheckStatisticsData;
  responseFailed: any;
  message: string;
}

/**
 * Exports health check results statistics to an Excel file with formatting
 * @param data The health check statistics data from the API
 * @param customTitle Optional custom title for the Excel file
 * @param startDate Optional start date for filtering (displayed in the report)
 * @param endDate Optional end date for filtering (displayed in the report)
 */
export const exportHealthCheckStatisticsToExcel = async (
  data: HealthCheckStatisticsResponse,
  customTitle?: string,
  startDate?: Date,
  endDate?: Date
): Promise<void> => {
  if (!data.isSuccess || !data.data) {
    message.error('No data available to export');
    return;
  }

  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'FMCS System';
    workbook.lastModifiedBy = 'FMCS System';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Add main statistics worksheet
    const overviewSheet = workbook.addWorksheet('Health Check Statistics Overview');
    
    // Format the header with title and date info
    formatHeader(overviewSheet, customTitle || 'Health Check Results Statistics Report', startDate, endDate);
    
    // Add summary section
    addSummarySection(overviewSheet, data.data);
    
    // Add status distribution section
    addStatusDistributionSection(overviewSheet, data.data);
    
    // Add follow-up statistics section
    addFollowUpSection(overviewSheet, data.data);
    
    // Add monthly distribution section
    addMonthlyDistributionSection(overviewSheet, data.data);
    
    // Apply overall formatting
    applyWorksheetFormatting(overviewSheet);
    
    // Create a second sheet for monthly breakdown
    const monthlySheet = workbook.addWorksheet('Monthly Distribution');
    formatHeader(monthlySheet, 'Monthly Health Check Distribution', startDate, endDate);
    addDetailedMonthlySection(monthlySheet, data.data);
    applyWorksheetFormatting(monthlySheet);

    // Generate Excel file
    const buffer = await workbook.xlsx.writeBuffer();
    
    // Create a Blob and trigger download
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `health_check_statistics_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`;
    link.click();
    
    // Clean up
    window.URL.revokeObjectURL(url);
    message.success('Health check statistics exported successfully');
  } catch (error) {
    console.error('Error exporting health check statistics to Excel:', error);
    message.error('Failed to export health check statistics');
  }
};

/**
 * Formats the header section of a worksheet with title and date information
 */
const formatHeader = (
  sheet: ExcelJS.Worksheet, 
  title: string,
  startDate?: Date,
  endDate?: Date
): void => {
  // Title row with merged cells
  sheet.mergeCells('A1:H1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = title;
  titleCell.font = { bold: true, size: 16, color: { argb: '000000' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'E1EFFF' }
  };
  sheet.getRow(1).height = 30;
  
  // Export info row
  sheet.mergeCells('A2:H2');
  const exportInfoCell = sheet.getCell('A2');
  exportInfoCell.value = `Exported on ${format(new Date(), 'dd/MM/yyyy')} at ${format(new Date(), 'HH:mm:ss')}`;
  exportInfoCell.font = { italic: true, size: 10 };
  exportInfoCell.alignment = { horizontal: 'center' };
  
  // Date range info if provided
  if (startDate && endDate) {
    sheet.mergeCells('A3:H3');
    const dateRangeCell = sheet.getCell('A3');
    dateRangeCell.value = `Date Range: ${format(startDate, 'dd/MM/yyyy')} to ${format(endDate, 'dd/MM/yyyy')}`;
    dateRangeCell.font = { italic: true, size: 10 };
    dateRangeCell.alignment = { horizontal: 'center' };
  }
  
  // Add some space before content starts
  sheet.addRow([]);
};

/**
 * Adds the summary statistics section to the worksheet
 */
const addSummarySection = (sheet: ExcelJS.Worksheet, data: HealthCheckStatisticsData): void => {
  // Section header
  const sectionHeaderRow = sheet.addRow(['Health Check Results Summary Statistics']);
  sectionHeaderRow.font = { bold: true, size: 14 };
  sectionHeaderRow.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'F0F0F0' }
  };
  sheet.mergeCells(`A${sectionHeaderRow.number}:H${sectionHeaderRow.number}`);
  
  // Column headers
  const headerRow = sheet.addRow(['Metric', 'Value', 'Percentage']);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'D9D9D9' }
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
  
  // Data rows
  const addSummaryRow = (metric: string, value: number, total: number = data.totalResults) => {
    const percentage = total > 0 ? (value / total * 100).toFixed(2) + '%' : 'N/A';
    const row = sheet.addRow([metric, value, percentage]);
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    return row;
  };
  
  addSummaryRow('Total Health Check Results', data.totalResults);
  addSummaryRow('Results Requiring Follow-up', data.statusDistribution.followUpRequired);
  addSummaryRow('Completed Results', data.statusDistribution.completed);
  addSummaryRow('Results with No Follow-up Required', data.statusDistribution.noFollowUpRequired);
  
  // Set column widths
  sheet.getColumn(1).width = 30;
  sheet.getColumn(2).width = 15;
  sheet.getColumn(3).width = 15;
  
  sheet.addRow([]);
};

/**
 * Adds the status distribution section to the worksheet
 */
const addStatusDistributionSection = (sheet: ExcelJS.Worksheet, data: HealthCheckStatisticsData): void => {
  // Section header
  const sectionHeaderRow = sheet.addRow(['Health Check Results by Status']);
  sectionHeaderRow.font = { bold: true, size: 14 };
  sectionHeaderRow.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'F0F0F0' }
  };
  sheet.mergeCells(`A${sectionHeaderRow.number}:H${sectionHeaderRow.number}`);
  
  // Column headers
  const headerRow = sheet.addRow(['Status', 'Number of Results', 'Percentage']);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'D9D9D9' }
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
  
  // Status mapping for display names
  const statusDisplayNames: Record<string, string> = {
    'waitingForApproval': 'Waiting for Approval',
    'followUpRequired': 'Follow-up Required',
    'noFollowUpRequired': 'No Follow-up Required',
    'completed': 'Completed',
    'cancelledCompletely': 'Cancelled Completely',
    'cancelledForAdjustment': 'Cancelled for Adjustment',
    'softDeleted': 'Soft Deleted'
  };
  
  // Data rows
  Object.entries(data.statusDistribution).forEach(([status, count]) => {
    const displayName = statusDisplayNames[status] || status;
    const percentage = (count / data.totalResults * 100).toFixed(2) + '%';
    const row = sheet.addRow([displayName, count, percentage]);
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });
  
  sheet.addRow([]);
};

/**
 * Adds the follow-up statistics section to the worksheet
 */
const addFollowUpSection = (sheet: ExcelJS.Worksheet, data: HealthCheckStatisticsData): void => {
  // Section header
  const sectionHeaderRow = sheet.addRow(['Follow-up Statistics']);
  sectionHeaderRow.font = { bold: true, size: 14 };
  sectionHeaderRow.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'F0F0F0' }
  };
  sheet.mergeCells(`A${sectionHeaderRow.number}:H${sectionHeaderRow.number}`);
  
  // Column headers
  const headerRow = sheet.addRow(['Metric', 'Number of Results', 'Percentage of Total Follow-ups']);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'D9D9D9' }
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
  
  // Follow-up display names
  const followUpDisplayNames: Record<string, string> = {
    'totalFollowUps': 'Total Follow-ups',
    'upcomingFollowUps': 'Upcoming Follow-ups',
    'overdueFollowUps': 'Overdue Follow-ups',
    'followUpsToday': 'Follow-ups Today'
  };
  
  // Data rows - calculate percentage based on totalFollowUps
  const totalFollowUps = data.followUpStatistics.totalFollowUps || 1; // Avoid division by zero
  
  Object.entries(data.followUpStatistics).forEach(([metric, count]) => {
    const displayName = followUpDisplayNames[metric] || metric;
    // For totalFollowUps, show percentage of all results; for others, show percentage of total follow-ups
    const percentage = metric === 'totalFollowUps' 
      ? (count / data.totalResults * 100).toFixed(2) + '%'
      : (count / totalFollowUps * 100).toFixed(2) + '%';
    
    const row = sheet.addRow([displayName, count, percentage]);
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });
  
  sheet.addRow([]);
};

/**
 * Adds the monthly distribution section to the worksheet
 */
const addMonthlyDistributionSection = (sheet: ExcelJS.Worksheet, data: HealthCheckStatisticsData): void => {
  // Section header
  const sectionHeaderRow = sheet.addRow(['Monthly Health Check Results Distribution']);
  sectionHeaderRow.font = { bold: true, size: 14 };
  sectionHeaderRow.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'F0F0F0' }
  };
  sheet.mergeCells(`A${sectionHeaderRow.number}:H${sectionHeaderRow.number}`);
  
  // Column headers
  const headerRow = sheet.addRow(['Month/Year', 'Number of Results', 'Percentage of Total Results']);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'D9D9D9' }
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
  
  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  // Data rows
  data.monthlyDistribution.forEach(item => {
    const monthYear = `${monthNames[item.month - 1]} ${item.year}`;
    const percentage = (item.count / data.totalResults * 100).toFixed(2) + '%';
    const row = sheet.addRow([monthYear, item.count, percentage]);
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });
};

/**
 * Adds a detailed monthly distribution to a separate sheet
 */
const addDetailedMonthlySection = (sheet: ExcelJS.Worksheet, data: HealthCheckStatisticsData): void => {
  // Add header
  const headerRow = sheet.addRow(['Month/Year', 'Number of Results', 'Percentage of Total']);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'D9D9D9' }
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
  
  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  // Sort monthly data chronologically
  const sortedMonthlyData = [...data.monthlyDistribution].sort((a, b) => {
    // Sort by year first, then by month
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });
  
  // Add data rows
  sortedMonthlyData.forEach(item => {
    const monthYear = `${monthNames[item.month - 1]} ${item.year}`;
    const percentage = (item.count / data.totalResults * 100).toFixed(2) + '%';
    const row = sheet.addRow([monthYear, item.count, percentage]);
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });
  
  // Add total row
  const totalRow = sheet.addRow(['Total', data.totalResults, '100.00%']);
  totalRow.eachCell((cell, colNumber) => {
    cell.font = { bold: true };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'double' },
      right: { style: 'thin' }
    };
  });
  
  // Set column widths
  sheet.getColumn(1).width = 25;
  sheet.getColumn(2).width = 18;
  sheet.getColumn(3).width = 18;
  
  // Add a simple chart note
  sheet.addRow([]);
  const chartHeaderRow = sheet.addRow(['Monthly Distribution Chart']);
  chartHeaderRow.font = { bold: true, size: 14 };
  sheet.mergeCells(`A${chartHeaderRow.number}:C${chartHeaderRow.number}`);
  sheet.addRow(['Note: For visual representation, please refer to the Excel chart feature']);
};

/**
 * Applies general formatting to a worksheet
 */
const applyWorksheetFormatting = (sheet: ExcelJS.Worksheet): void => {
  // Set default column widths
  sheet.columns.forEach(column => {
    if (!column.width) {
      column.width = 15;
    }
  });
  
  // Add footer
  sheet.addRow([]);
  const footerRow = sheet.addRow(['FMCS System - Health Check Results Statistics Report']);
  footerRow.getCell(1).font = { italic: true, size: 10 };
  sheet.mergeCells(`A${footerRow.number}:H${footerRow.number}`);
  footerRow.getCell(1).alignment = { horizontal: 'center' };
}; 