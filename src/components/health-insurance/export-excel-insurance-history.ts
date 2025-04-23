import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import dayjs from 'dayjs';
import { HistoryDTO, getAllHealthInsuranceHistories, getGroupedInsuranceHistories, InsuranceHistoryGroup } from '@/api/healthinsurance';

export interface ExportConfig {
  exportAllData: boolean;
  insuranceNumber?: string;
  ownerEmail?: string;
  sortBy: string;
  ascending: boolean;
  currentGroups?: { insuranceId: string; code: string; ownerName: string; ownerEmail: string; histories: any[] }[];
}

// Hàm để lấy và xử lý dữ liệu lịch sử bảo hiểm
export const fetchHistoryDataForExport = async (config: ExportConfig) => {
  try {
    let histories: HistoryDTO[] = [];

    console.log("Export config:", config);
    
    // Luôn lấy dữ liệu từ API thay vì sử dụng currentGroups
    if (config.exportAllData) {
      console.log("Fetching all insurance histories via API");
      try {
        // Lấy tất cả lịch sử bảo hiểm - không phân trang để lấy tất cả dữ liệu
        const response = await getAllHealthInsuranceHistories(
          1, // page
          100000, // pageSize - lấy số lượng lớn dữ liệu để không bị giới hạn
          "", // search - để rỗng thay vì undefined
          config.sortBy || "UpdatedAt",
          !!config.ascending
        );

        console.log("All histories response:", response);

        if (response && response.success && response.data && Array.isArray(response.data.items)) {
          histories = response.data.items;
          console.log(`Found ${histories.length} history records`);
        } else {
          console.warn("Invalid response structure:", response);
          
          // Cố gắng extrapolate dữ liệu từ các cấu trúc response khác nhau
          if (response && response.data && typeof response.data === 'object') {
            if (Array.isArray(response.data)) {
              histories = response.data;
              console.log("Extracted history from response.data array");
            } else if (response.data.items && Array.isArray(response.data.items)) {
              histories = response.data.items;
              console.log("Extracted history from response.data.items");
            } else if (response.data.data && Array.isArray(response.data.data)) {
              histories = response.data.data;
              console.log("Extracted history from response.data.data");
            }
          }
          
          if (histories.length === 0) {
            console.warn("Could not extract any history records from response");
            return []; // Trả về mảng rỗng
          }
        }
      } catch (error) {
        console.error("Error fetching all histories:", error);
        return []; // Trả về mảng rỗng thay vì ném lỗi
      }
    } else {
      try {
        // Lấy lịch sử theo số bảo hiểm cụ thể - không phân trang
        const response = await getGroupedInsuranceHistories(
          1, // page
          100000, // pageSize - lấy tất cả dữ liệu
          undefined, // startUpdateDate
          undefined, // endUpdateDate
          undefined, // performedBySearch
          undefined, // previousStatus
          undefined, // newStatus
          config.sortBy,
          config.ascending,
          config.insuranceNumber, // healthInsuranceNumber
          config.ownerEmail // searchText cho email
        );

        if (response.success && response.data?.items && response.data.items.length > 0) {
          // Tìm nhóm phù hợp với tiêu chí
          const group = response.data.items.find(
            (g: InsuranceHistoryGroup) => 
              (config.insuranceNumber && g.insurance.healthInsuranceNumber === config.insuranceNumber) ||
              (config.ownerEmail && g.insurance.user?.email && 
               g.insurance.user.email.toLowerCase().includes((config.ownerEmail || '').toLowerCase()))
          );

          if (group) {
            histories = group.histories || [];
            
            // Sắp xếp lịch sử theo ngày
            histories.sort((a, b) => {
              const dateA = new Date(a.updatedAt).getTime();
              const dateB = new Date(b.updatedAt).getTime();
              return config.ascending ? dateA - dateB : dateB - dateA;
            });
          } else {
            console.warn("Không tìm thấy nhóm bảo hiểm phù hợp với tiêu chí");
            return []; // Trả về mảng rỗng nếu không tìm thấy
          }
        } else {
          console.warn("Response không chứa dữ liệu lịch sử hoặc không có items:", response);
          return []; // Trả về mảng rỗng thay vì ném lỗi
        }
      } catch (error) {
        console.error("Lỗi khi lấy lịch sử bảo hiểm theo tiêu chí:", error);
        return []; // Trả về mảng rỗng thay vì ném lỗi
      }
    }

    console.log(`Returning ${histories.length} history records for export`);
    return histories;
  } catch (error) {
    console.error("Error in fetchHistoryDataForExport:", error);
    return []; // Trả về mảng rỗng thay vì ném lỗi
  }
};

// Hàm xuất dữ liệu ra file Excel
export const exportHistoryToExcel = async (config: ExportConfig) => {
  try {
    const histories = await fetchHistoryDataForExport(config);

    if (!histories || histories.length === 0) {
      return { success: false, message: 'No data available to export. Please try different criteria.' };
    }

    // Tạo workbook và worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Insurance History');

    // Thiết lập style cho header
    const headerStyle = {
      font: { bold: true, color: { argb: 'FFFFFF' } },
      fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: '4472C4' } },
      border: {
        top: { style: 'thin' as const },
        left: { style: 'thin' as const },
        bottom: { style: 'thin' as const },
        right: { style: 'thin' as const }
      },
      alignment: { horizontal: 'center' as const, vertical: 'middle' as const }
    };

    // Thiết lập style cho các dòng
    const rowStyle = {
      border: {
        top: { style: 'thin' as const },
        left: { style: 'thin' as const },
        bottom: { style: 'thin' as const },
        right: { style: 'thin' as const }
      },
      alignment: { vertical: 'top' as const, wrapText: true }
    };

    // Thiết lập style cho dòng chẵn
    const evenRowStyle = {
      ...rowStyle,
      fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'F2F2F2' } }
    };

    // Định nghĩa columns
    worksheet.columns = [
      { header: 'No.', key: 'no', width: 5 },
      { header: 'Insurance Number', key: 'insuranceNumber', width: 20 },
      { header: 'Updated At', key: 'updatedAt', width: 20 },
      { header: 'Performed By', key: 'performedBy', width: 30 },
      { header: 'Previous Status', key: 'previousStatus', width: 15 },
      { header: 'New Status', key: 'newStatus', width: 15 },
      { header: 'Previous Verification', key: 'previousVerification', width: 20 },
      { header: 'New Verification', key: 'newVerification', width: 20 },
      { header: 'Change Details', key: 'changeDetails', width: 80 }
    ];

    // Áp dụng style cho header
    worksheet.getRow(1).eachCell((cell) => {
      cell.style = headerStyle;
    });

    // Thêm dữ liệu
    histories.forEach((history, index) => {
      const changeDetails = parseChanges(history.changeDetails);
      
      const row = worksheet.addRow({
        no: index + 1,
        insuranceNumber: history.healthInsuranceNumber || 'N/A',
        updatedAt: dayjs(history.updatedAt).format('DD/MM/YYYY HH:mm:ss'),
        performedBy: history.updatedBy ? `${history.updatedBy.userName} (${history.updatedBy.email})` : 'System',
        previousStatus: formatStatus(history.previousStatus),
        newStatus: formatStatus(history.newStatus),
        previousVerification: formatStatus(history.previousVerificationStatus),
        newVerification: formatStatus(history.newVerificationStatus),
        changeDetails: changeDetails
      });

      // Áp dụng style cho dòng
      row.eachCell((cell) => {
        cell.style = index % 2 === 0 ? rowStyle : evenRowStyle;
      });
      
      // Tính chiều cao cho dòng dựa trên nội dung Change Details
      // Đếm số dòng trong Change Details và điều chỉnh chiều cao
      if (changeDetails) {
        const numberOfLines = (changeDetails.match(/\n/g) || []).length + 1;
        // Thiết lập chiều cao tối thiểu là 15, và thêm 15 cho mỗi dòng
        const height = Math.max(24, numberOfLines * 20);
        row.height = height;
      }
    });

    // Bật tính năng AutoFilter để dễ dàng lọc dữ liệu
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: 9 }
    };
    
    // Đóng băng dòng đầu tiên (header)
    worksheet.views = [
      { state: 'frozen', xSplit: 0, ySplit: 1, activeCell: 'A2' }
    ];

    // Tạo tên file có timestamp
    const timestamp = dayjs().format('YYYYMMDD_HHmmss');
    const fileName = `Insurance_History_${timestamp}.xlsx`;

    // Xuất file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, fileName);

    return { success: true, fileName };
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    return { success: false, message: 'Failed to export data to Excel. Please try again later.' };
  }
};

// Hàm để parse change details
const parseChanges = (changeDetails: string | undefined): string => {
  if (!changeDetails) return '';

  try {
    if (changeDetails.startsWith('{') && changeDetails.endsWith('}')) {
      const changes = JSON.parse(changeDetails);
      const changesArray = Object.entries(changes)
        .filter(([field, value]: [string, any]) => {
          let oldValue = value.Item1 !== undefined ? value.Item1 : 'N/A';
          let newValue = value.Item2 !== undefined ? value.Item2 : 'N/A';
          return oldValue !== newValue;
        });

      if (changesArray.length === 0) {
        return 'No changes detected';
      }

      // Format thành bảng với định dạng:
      // Field | Old Value | New Value
      // --------------------------------
      // Field1 | OldValue1 | NewValue1
      // Field2 | OldValue2 | NewValue2
      
      // Header của bảng
      let formattedTable = 'Field | Old Value | New Value\n';
      formattedTable += '--------------------------------\n';
      
      // Thêm từng hàng cho các thay đổi
      changesArray.forEach(([field, value]: [string, any]) => {
        let oldValue = value.Item1 !== undefined ? value.Item1 : 'N/A';
        let newValue = value.Item2 !== undefined ? value.Item2 : 'N/A';
        
        // Format tên trường để dễ đọc
        const formattedField = field.replace(/([A-Z])/g, ' $1').trim();
        
        // Xử lý đặc biệt cho ImageUrl
        if (field === 'ImageUrl') {
          oldValue = 'Image';
          newValue = 'New Image';
        }
        
        // Cắt ngắn các giá trị quá dài
        if (typeof oldValue === 'string' && oldValue.length > 50) {
          oldValue = oldValue.substring(0, 47) + '...';
        }
        
        if (typeof newValue === 'string' && newValue.length > 50) {
          newValue = newValue.substring(0, 47) + '...';
        }
        
        formattedTable += `${formattedField} | ${oldValue} | ${newValue}\n`;
      });
      
      return formattedTable;
    }
  } catch (error) {
    console.error('Error parsing change details:', error);
  }

  return changeDetails;
};

// Helper function để format status
export const formatStatus = (status: string | undefined): string => {
  if (!status) return 'N/A';
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};
