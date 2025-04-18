import * as ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import dayjs from "dayjs";
import { NotificationResponseDTO } from "@/api/notification";

interface ExportConfig {
  exportAllPages: boolean;
  includeTitle: boolean;
  includeRecipientType: boolean;
  includeStatus: boolean;
  includeSendEmail: boolean;
  includeCreatedAt: boolean;
  includeCreatedBy: boolean;
}

export const exportNotificationsToExcel = async (
  notifications: NotificationResponseDTO[],
  exportConfig: ExportConfig,
  currentPage: number,
  pageSize: number,
  customFileName?: string
) => {
  const dataToExport = exportConfig.exportAllPages
    ? notifications
    : notifications.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "FMCS";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Notifications");

  const columns: Partial<ExcelJS.Column>[] = [];
  const headers: string[] = [];

  if (exportConfig.includeTitle) {
    columns.push({ header: "Title", key: "title", width: 30 });
    headers.push("title");
  }

  if (exportConfig.includeRecipientType) {
    columns.push({ header: "Recipient Type", key: "recipientType", width: 15 });
    headers.push("recipientType");
  }

  if (exportConfig.includeStatus) {
    columns.push({ header: "Status", key: "status", width: 12 });
    headers.push("status");
  }

  if (exportConfig.includeSendEmail) {
    columns.push({ header: "Send Email", key: "sendEmail", width: 12 });
    headers.push("sendEmail");
  }

  if (exportConfig.includeCreatedAt) {
    columns.push({ header: "Created At", key: "createdAt", width: 20 });
    headers.push("createdAt");
  }

  if (exportConfig.includeCreatedBy) {
    columns.push({ header: "Created By", key: "createdBy", width: 20 });
    headers.push("createdBy");
  }

  worksheet.columns = columns;

  dataToExport.forEach((notification) => {
    const row: any = {};

    if (exportConfig.includeTitle) row.title = notification.title;
    if (exportConfig.includeRecipientType)
      row.recipientType = notification.recipientType;
    if (exportConfig.includeStatus) row.status = notification.status;
    if (exportConfig.includeSendEmail)
      row.sendEmail = notification.sendEmail ? "Yes" : "No";
    if (exportConfig.includeCreatedAt)
      row.createdAt = formatDate(notification.createdAt);
    if (exportConfig.includeCreatedBy)
      row.createdBy = notification.createdBy?.userName || "";

    worksheet.addRow(row);
  });

  const buffer = await workbook.xlsx.writeBuffer();

  const dataBlob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const fileName =
    customFileName ||
    `notifications-${dayjs().format("YYYY-MM-DD-HH-mm-ss")}.xlsx`;
  saveAs(dataBlob, fileName);
};

const formatDate = (dateString: string): string => {
  return dayjs(dateString).format("DD/MM/YYYY HH:mm:ss");
};
