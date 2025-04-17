import ExcelJS from "exceljs";
import { message } from "antd";
import { UserImportErrorDTO } from "./ErrorTable";

export interface UserImportResultDTO {
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: UserImportErrorDTO[];
  successfulUsers?: {
    row: number;
    fullName: string;
    email: string;
    userName: string;
  }[];
}

/**
 * Xuất danh sách lỗi import người dùng ra file Excel
 */
export const exportErrorList = (
  importResult: UserImportResultDTO | null,
  messageApi: any
) => {
  if (!importResult || !importResult.errors || importResult.errors.length === 0) {
    messageApi.error("No errors to export");
    return;
  }

  try {
    messageApi.loading({
      content: "Đang tạo báo cáo lỗi...",
      key: "exportErrors",
    });

    const workbook = new ExcelJS.Workbook();

    // Thêm worksheet tổng kết
    const summarySheet = workbook.addWorksheet("Tổng kết");

    // Thiết lập cột cho worksheet tổng kết
    summarySheet.columns = [
      { header: "Thông số", key: "metric", width: 25 },
      { header: "Giá trị", key: "value", width: 15 },
    ];

    // Định dạng header cho worksheet tổng kết
    summarySheet.getRow(1).font = { bold: true };
    summarySheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4F81BD" }, // Màu xanh đậm
    };
    summarySheet.getRow(1).font = { color: { argb: "FFFFFFFF" }, bold: true };

    // Thêm dữ liệu tổng kết
    const duplicateCount = importResult.errors.filter((e) =>
      e.errorMessage.includes("already exists")
    ).length;
    const validationErrorCount = importResult.errors.filter(
      (e) => !e.errorMessage.includes("already exists")
    ).length;

    summarySheet.addRow({
      metric: "Tổng số bản ghi đã xử lý",
      value: importResult.totalRows,
    });
    summarySheet.addRow({
      metric: "Đã nhập thành công",
      value: importResult.successCount,
    });
    summarySheet.addRow({ metric: "Tổng số lỗi", value: importResult.errorCount });
    summarySheet.addRow({
      metric: "Trùng lặp (Đã bỏ qua)",
      value: duplicateCount,
    });
    summarySheet.addRow({ metric: "Lỗi dữ liệu", value: validationErrorCount });
    summarySheet.addRow({
      metric: "Ngày xuất báo cáo",
      value: new Date().toLocaleString(),
    });

    // Thêm worksheet chi tiết lỗi
    const errorSheet = workbook.addWorksheet("Chi tiết lỗi");

    // Thiết lập cột cho worksheet chi tiết lỗi
    errorSheet.columns = [
      { header: "STT", key: "no", width: 5 },
      { header: "Dòng", key: "row", width: 5 },
      { header: "Loại lỗi", key: "errorType", width: 15 },
      { header: "Thông báo lỗi", key: "errorMessage", width: 40 },
      { header: "Họ tên", key: "fullName", width: 20 },
      { header: "Tên đăng nhập", key: "username", width: 15 },
      { header: "Email", key: "email", width: 25 },
      { header: "Thông tin khác", key: "additionalData", width: 30 },
    ];

    // Định dạng header cho worksheet chi tiết lỗi
    errorSheet.getRow(1).font = { bold: true };
    errorSheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFED7D31" }, // Màu cam
    };
    errorSheet.getRow(1).font = { color: { argb: "FFFFFFFF" }, bold: true };

    // Thêm dữ liệu chi tiết lỗi
    importResult.errors.forEach((error, index) => {
      const dataItems = error.data.split(", ");
      const isDuplicate = error.errorMessage.includes("already exists");

      const row = errorSheet.addRow({
        no: index + 1,
        row: error.rowNumber,
        errorType: isDuplicate ? "Trùng lặp" : "Lỗi dữ liệu",
        errorMessage: error.errorMessage,
        fullName: dataItems[0] || "",
        username: dataItems[1] || "",
        email: dataItems[2] || "",
        additionalData: dataItems.slice(3).join(", ") || "",
      });

      // Định dạng màu cho các dòng lỗi khác nhau
      if (isDuplicate) {
        row.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFF2CC" }, // Màu vàng nhạt cho trùng lặp
        };
      } else {
        row.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFCE4E4" }, // Màu đỏ nhạt cho lỗi
        };
      }
    });

    // Thêm một worksheet hướng dẫn
    const guideSheet = workbook.addWorksheet("Hướng dẫn");

    guideSheet.columns = [
      { header: "Hướng dẫn khắc phục lỗi", key: "guide", width: 100 },
    ];

    guideSheet.getRow(1).font = { bold: true };
    guideSheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF70AD47" }, // Màu xanh lá
    };
    guideSheet.getRow(1).font = { color: { argb: "FFFFFFFF" }, bold: true };

    // Thêm nội dung hướng dẫn
    guideSheet.addRow({ guide: "HƯỚNG DẪN KHẮC PHỤC LỖI IMPORT" });
    guideSheet.getRow(2).font = { bold: true, size: 14 };

    guideSheet.addRow({ guide: "Lỗi trùng lặp:" });
    guideSheet.getRow(3).font = { bold: true };

    guideSheet.addRow({
      guide:
        "- Lỗi này xảy ra khi dữ liệu đã tồn tại trong hệ thống (email, username hoặc số điện thoại đã được sử dụng)",
    });
    guideSheet.addRow({
      guide:
        "- Để khắc phục: Thay đổi thông tin trùng lặp thành thông tin độc nhất hoặc bỏ qua những bản ghi này",
    });

    guideSheet.addRow({ guide: "Lỗi dữ liệu:" });
    guideSheet.getRow(6).font = { bold: true };

    guideSheet.addRow({
      guide:
        "- Lỗi này xảy ra khi dữ liệu không đúng định dạng hoặc thiếu thông tin bắt buộc",
    });
    guideSheet.addRow({
      guide:
        "- Để khắc phục: Kiểm tra và sửa lại dữ liệu theo yêu cầu nêu trong thông báo lỗi",
    });
    guideSheet.addRow({
      guide:
        "- Các trường bắt buộc: Họ tên, Email, Giới tính, Ngày sinh, Địa chỉ, Số điện thoại",
    });
    guideSheet.addRow({
      guide: "- Định dạng ngày tháng phải là DD/MM/YYYY (ngày/tháng/năm)",
    });

    guideSheet.addRow({ guide: "Lưu ý khi sử dụng template:" });
    guideSheet.getRow(11).font = { bold: true };

    guideSheet.addRow({
      guide:
        "- Dữ liệu phải bắt đầu từ dòng 6 (ngay dưới dòng tiêu đề màu cam)",
    });
    guideSheet.addRow({
      guide: "- KHÔNG chỉnh sửa dòng tiêu đề (dòng 5 có nền màu cam)",
    });
    guideSheet.addRow({ guide: "- Đảm bảo điền đầy đủ các trường bắt buộc" });
    guideSheet.addRow({
      guide: "- KHÔNG nhập dữ liệu vào phần hướng dẫn ở cuối trang tính",
    });

    // Lưu file
    const fileName = `Bao_Cao_Loi_Import_${new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/:/g, "-")}.xlsx`;

    // Lưu file với ExcelJS (sử dụng cho web browser)
    workbook.xlsx
      .writeBuffer()
      .then((buffer) => {
        const blob = new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);

        messageApi.success({
          content: "Export error report successfully",
          key: "exportErrors",
        });
      })
      .catch((error) => {
        console.error("Lỗi khi tạo file Excel:", error);
        messageApi.error({
          content: "Cannot export error report",
          key: "exportErrors",
        });
      });
  } catch (error) {
    console.error("Error exporting Excel:", error);
    messageApi.error({
      content: "Cannot export error report",
      key: "exportErrors",
    });
  }
}; 