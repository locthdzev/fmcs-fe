import * as ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { message } from 'antd';

interface UserStatisticsData {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  usersByRole: Record<string, number>;
  usersByGender: Record<string, number>;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  newUsersThisYear: number;
  usersWithMultipleRoles: number;
  usersInDateRange: number;
  startDate: string | null;
  endDate: string | null;
  usersByMonthCreated: Record<string, number>;
}

interface UserStatisticsResponse {
  isSuccess: boolean;
  code: number;
  data: UserStatisticsData;
  responseFailed: any;
  message: string;
}

/**
 * Exports user statistics to an Excel file with formatting
 * @param data The user statistics data from the API
 * @param customTitle Optional custom title for the Excel file
 * @param startDate Optional start date for filtering (displayed in the report)
 * @param endDate Optional end date for filtering (displayed in the report)
 */
export const exportUserStatisticsToExcel = async (
  data: UserStatisticsResponse,
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
    const overviewSheet = workbook.addWorksheet('User Statistics Overview');
    
    // Format the header with title and date info
    formatHeader(overviewSheet, customTitle || 'User Statistics Report', startDate, endDate);
    
    // Add summary section
    addSummarySection(overviewSheet, data.data);
    
    // Add user distribution by role section
    addRoleDistributionSection(overviewSheet, data.data);
    
    // Add user distribution by gender section
    addGenderDistributionSection(overviewSheet, data.data);
    
    // Add new users statistics section
    addNewUsersSection(overviewSheet, data.data);
    
    // Add monthly distribution section
    addMonthlyDistributionSection(overviewSheet, data.data);
    
    // Apply overall formatting
    applyWorksheetFormatting(overviewSheet);
    
    // Create a second sheet for monthly breakdown
    const monthlySheet = workbook.addWorksheet('Monthly Distribution');
    formatHeader(monthlySheet, 'Monthly User Distribution', startDate, endDate);
    addDetailedMonthlySection(monthlySheet, data.data);
    applyWorksheetFormatting(monthlySheet);

    // Generate Excel file
    const buffer = await workbook.xlsx.writeBuffer();
    
    // Create a Blob and trigger download
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `user_statistics_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`;
    link.click();
    
    // Clean up
    window.URL.revokeObjectURL(url);
    message.success('User statistics exported successfully');
  } catch (error) {
    console.error('Error exporting user statistics to Excel:', error);
    message.error('Failed to export user statistics');
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
const addSummarySection = (sheet: ExcelJS.Worksheet, data: UserStatisticsData): void => {
  // Section header
  const sectionHeaderRow = sheet.addRow(['User Summary Statistics']);
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
  const addSummaryRow = (metric: string, value: number, total: number = data.totalUsers) => {
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
  
  addSummaryRow('Total Users', data.totalUsers);
  addSummaryRow('Active Users', data.activeUsers);
  addSummaryRow('Inactive Users', data.inactiveUsers);
  
  // Set column widths
  sheet.getColumn(1).width = 30;
  sheet.getColumn(2).width = 15;
  sheet.getColumn(3).width = 15;
  
  sheet.addRow([]);
};

/**
 * Adds the role distribution section to the worksheet
 */
const addRoleDistributionSection = (sheet: ExcelJS.Worksheet, data: UserStatisticsData): void => {
  // Section header
  const sectionHeaderRow = sheet.addRow(['User Distribution by Role']);
  sectionHeaderRow.font = { bold: true, size: 14 };
  sectionHeaderRow.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'F0F0F0' }
  };
  sheet.mergeCells(`A${sectionHeaderRow.number}:H${sectionHeaderRow.number}`);
  
  // Column headers
  const headerRow = sheet.addRow(['Role', 'Number of Users', 'Percentage']);
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
  Object.entries(data.usersByRole).forEach(([role, count]) => {
    const percentage = (count / data.totalUsers * 100).toFixed(2) + '%';
    const row = sheet.addRow([role, count, percentage]);
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
 * Adds the gender distribution section to the worksheet
 */
const addGenderDistributionSection = (sheet: ExcelJS.Worksheet, data: UserStatisticsData): void => {
  // Section header
  const sectionHeaderRow = sheet.addRow(['User Distribution by Gender']);
  sectionHeaderRow.font = { bold: true, size: 14 };
  sectionHeaderRow.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'F0F0F0' }
  };
  sheet.mergeCells(`A${sectionHeaderRow.number}:H${sectionHeaderRow.number}`);
  
  // Column headers
  const headerRow = sheet.addRow(['Gender', 'Number of Users', 'Percentage']);
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
  Object.entries(data.usersByGender).forEach(([gender, count]) => {
    const percentage = (count / data.totalUsers * 100).toFixed(2) + '%';
    const row = sheet.addRow([gender, count, percentage]);
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
 * Adds the new users statistics section to the worksheet
 */
const addNewUsersSection = (sheet: ExcelJS.Worksheet, data: UserStatisticsData): void => {
  // Section header
  const sectionHeaderRow = sheet.addRow(['New Users Statistics']);
  sectionHeaderRow.font = { bold: true, size: 14 };
  sectionHeaderRow.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'F0F0F0' }
  };
  sheet.mergeCells(`A${sectionHeaderRow.number}:H${sectionHeaderRow.number}`);
  
  // Column headers
  const headerRow = sheet.addRow(['Time Period', 'Number of New Users', 'Percentage of Total Users']);
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
  const addPeriodRow = (period: string, value: number) => {
    const percentage = (value / data.totalUsers * 100).toFixed(2) + '%';
    const row = sheet.addRow([period, value, percentage]);
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  };
  
  addPeriodRow('This Week', data.newUsersThisWeek);
  addPeriodRow('This Month', data.newUsersThisMonth);
  addPeriodRow('This Year', data.newUsersThisYear);
  
  if (data.startDate && data.endDate) {
    addPeriodRow('Selected Date Range', data.usersInDateRange);
  }
  
  sheet.addRow([]);
};

/**
 * Adds the monthly distribution section to the worksheet
 */
const addMonthlyDistributionSection = (sheet: ExcelJS.Worksheet, data: UserStatisticsData): void => {
  // Section header
  const sectionHeaderRow = sheet.addRow(['Monthly User Distribution']);
  sectionHeaderRow.font = { bold: true, size: 14 };
  sectionHeaderRow.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'F0F0F0' }
  };
  sheet.mergeCells(`A${sectionHeaderRow.number}:H${sectionHeaderRow.number}`);
  
  // Column headers
  const headerRow = sheet.addRow(['Month/Year', 'Number of Users', 'Percentage of Total Users']);
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
  Object.entries(data.usersByMonthCreated).forEach(([monthYear, count]) => {
    const percentage = (count / data.totalUsers * 100).toFixed(2) + '%';
    const row = sheet.addRow([monthYear, count, percentage]);
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
const addDetailedMonthlySection = (sheet: ExcelJS.Worksheet, data: UserStatisticsData): void => {
  // Add header
  const headerRow = sheet.addRow(['Month/Year', 'Number of Users', 'Percentage of Total']);
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
  
  // Sort months chronologically (assuming format: "Month YYYY")
  const monthOrder: Record<string, number> = {
    'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
    'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12
  };
  
  const sortedMonthData = Object.entries(data.usersByMonthCreated)
    .sort(([monthYearA], [monthYearB]) => {
      const [monthA, yearA] = monthYearA.split(' ');
      const [monthB, yearB] = monthYearB.split(' ');
      
      const yearDiff = parseInt(yearA) - parseInt(yearB);
      if (yearDiff !== 0) return yearDiff;
      
      return monthOrder[monthA] - monthOrder[monthB];
    });
  
  // Add data rows
  sortedMonthData.forEach(([monthYear, count]) => {
    const percentage = (count / data.totalUsers * 100).toFixed(2) + '%';
    const row = sheet.addRow([monthYear, count, percentage]);
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
  const totalRow = sheet.addRow(['Total', data.totalUsers, '100.00%']);
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
  
  // Add a simple chart
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
  const footerRow = sheet.addRow(['FMCS System - User Statistics Report']);
  footerRow.getCell(1).font = { italic: true, size: 10 };
  sheet.mergeCells(`A${footerRow.number}:H${footerRow.number}`);
  footerRow.getCell(1).alignment = { horizontal: 'center' };
};
