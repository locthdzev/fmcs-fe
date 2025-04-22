import React, { useState, useRef } from "react";
import { Button, Form, Upload, Typography, Space, message, UploadFile, Progress } from "antd";
import { UploadOutlined, DownloadOutlined, InboxOutlined, FileExcelOutlined, CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";
import Cookies from "js-cookie";
import jwtDecode from "jwt-decode";
import {
  createStudentHealthCheckup,
  PeriodicHealthCheckupsDetailsStudentRequestDTO,
  getStudentHealthCheckupsByMssv,
} from "@/api/periodic-health-checkup-student-api";
import {
  PeriodicHealthCheckupRequestDTO,
  createPeriodicHealthCheckup,
} from "@/api/periodic-health-checkup-api";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import { RcFile } from "antd/es/upload/interface";
import ExcelJS from "exceljs";

const { Title } = Typography;
const { Dragger } = Upload;

interface AddStudentHealthCheckupPageProps {
  onSuccess: () => void;
  onClose: () => void;
}

interface RowData {
  STT?: string | number;
  MSSV?: string | number;
  "Họ và tên"?: string;
  "Năm sinh"?: string | number;
  "Giới tính"?: string;
  "CC\n(cm)"?: string | number;
  "CN\n(Kg)"?: string | number;
  BMI?: string | number;
  "Mạch\n(L/p)"?: string | number;
  "HA\n(mmHg)"?: string;
  "Nội khoa"?: string;
  "Ngoại khoa"?: string;
  "Da liễu"?: string;
  P?: string | number;
  T?: string | number;
  "Bệnh lý"?: string;
  TMH?: string;
  RMH?: string;
  "Phân loại"?: string | number;
  "Kết luận"?: string;
  "Đề nghị"?: string;
  [key: string]: string | number | undefined;
}

interface ApiResponse<T> {
  isSuccess: boolean;
  code: number;
  data: T | null;
  message?: string;
  responseFailed?: string;
}

interface UploadProgress {
  isLoading: boolean;
  current: number;
  total: number;
}

const AddStudentHealthCheckupPage: React.FC<AddStudentHealthCheckupPageProps> = ({ onSuccess, onClose }) => {
  const [form] = Form.useForm();
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({ isLoading: false, current: 0, total: 0 });
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const abortController = useRef(new AbortController());

  const downloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("StudentHealthCheckup");
    
    const headers = [
      ["STT", "MSSV", "Họ và tên", "Năm sinh", "Giới tính", "Thể lực", "", "", "", "", "Nội khoa", "Ngoại khoa", "Chuyên khoa sâu", "", "", "", "", "", "Phân loại", "Kết luận", "Đề nghị"],
      ["", "", "", "", "", "CC\n(cm)", "CN\n(Kg)", "BMI", "Mạch\n(L/p)", "HA\n(mmHg)", "", "", "Da liễu", "Mắt", "", "", "TMH", "RMH", "", "", ""],
      ["", "", "", "", "", "", "", "", "", "", "", "", "", "P", "T", "Bệnh lý", "", "", "", "", ""],
    ];
  
    headers.forEach((row) => worksheet.addRow(row));
    worksheet.addRow([
      "0001", "CS123456", "Nguyễn Văn A", "2006", "Nam", 171, 89, 30.4, 109, "140/80",
      "Bình thường", "Bình thường", "Bình thường", 10, 9, "Cận thị (-2.50D)",
      "Viêm mũi họng cấp", "SN 95%", 3, "Béo phì\nMạch nhanh\nTăng huyết áp\nTật khúc xạ\nViêm mũi họng cấp", ""
    ]);
    for (let i = 0; i < 2; i++) worksheet.addRow(Array(21).fill(""));
  
    worksheet.mergeCells("A1:A3"); worksheet.mergeCells("B1:B3"); worksheet.mergeCells("C1:C3");
    worksheet.mergeCells("D1:D3"); worksheet.mergeCells("E1:E3"); worksheet.mergeCells("F1:J1");
    worksheet.mergeCells("F2:F3"); worksheet.mergeCells("G2:G3"); worksheet.mergeCells("H2:H3");
    worksheet.mergeCells("I2:I3"); worksheet.mergeCells("J2:J3"); worksheet.mergeCells("K1:K3");
    worksheet.mergeCells("L1:L3"); worksheet.mergeCells("M1:R1"); worksheet.mergeCells("M2:M3");
    worksheet.mergeCells("N2:P2"); worksheet.mergeCells("N3:N3"); worksheet.mergeCells("O3:O3");
    worksheet.mergeCells("P3:P3"); worksheet.mergeCells("Q2:Q3"); worksheet.mergeCells("R2:R3");
    worksheet.mergeCells("S1:S3"); worksheet.mergeCells("T1:T3"); worksheet.mergeCells("U1:U3");
  
    worksheet.columns = [
      { width: 6 }, { width: 10 }, { width: 15 }, { width: 11 }, { width: 11 },
      { width: 8 }, { width: 8 }, { width: 8 }, { width: 10 }, { width: 10 },
      { width: 12 }, { width: 12 }, { width: 9 }, { width: 8 }, { width: 8 },
      { width: 15 }, { width: 9 }, { width: 9 }, { width: 10 }, { width: 15 },
      { width: 13 },
    ];
  
    // Apply default formatting to all cells
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.font = { 
          name: "Times New Roman", 
          size: 11, // Default size 11
          bold: row.number <= 3 // Bold only for header rows by default
        };
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        cell.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
      });
    });
  
    // Explicitly override formatting for specific cells
    const cellsToFormat = [
      { address: "F2", value: "CC\n(cm)" },  // Column 6
      { address: "G2", value: "CN\n(Kg)" },  // Column 7
      { address: "I2", value: "Mạch\n(L/p)" }, // Column 9
      { address: "J2", value: "HA\n(mmHg)" },  // Column 10
      { address: "H2", value: "BMI" }  // Column 8
    ];
  
    cellsToFormat.forEach(({ address }) => {
      const cell = worksheet.getCell(address);
      cell.font = {
        name: "Times New Roman",
        size: 10, // Set to size 10
        bold: false // Explicitly not bold
      };
    });
  
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "StudentHealthCheckupTemplate.xlsx";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const validateRowData = (rowData: RowData, index: number): string[] => {
    const errors: string[] = [];
    
    if (!rowData["MSSV"]) errors.push(`Row ${index + 1}: MSSV is required`);
    else if (!/^[A-Za-z0-9]{8,}$/.test(rowData["MSSV"].toString().trim())) {
      errors.push(`Row ${index + 1}: MSSV must be at least 8 alphanumeric characters`);
    }

    const requiredFields = ["CC\n(cm)", "CN\n(Kg)", "HA\n(mmHg)"];
    requiredFields.forEach((field) => {
      if (!rowData[field]) errors.push(`Row ${index + 1}: ${field} is required`);
    });

    if (rowData["CC\n(cm)"]) {
      const height = parseFloat(rowData["CC\n(cm)"].toString());
      if (isNaN(height) || height < 50 || height > 250) {
        errors.push(`Row ${index + 1}: Height must be between 50-250 cm`);
      }
    }

    if (rowData["CN\n(Kg)"]) {
      const weight = parseFloat(rowData["CN\n(Kg)"].toString());
      if (isNaN(weight) || weight < 10 || weight > 300) {
        errors.push(`Row ${index + 1}: Weight must be between 10-300 kg`);
      }
    }

    if (rowData["Mạch\n(L/p)"] !== undefined) {
      const pulse = parseInt(rowData["Mạch\n(L/p)"].toString(), 10);
      if (isNaN(pulse) || pulse < 30 || pulse > 200) {
        errors.push(`Row ${index + 1}: Pulse rate must be between 30-200`);
      }
    }

    return errors;
  };

  const parseExcel = async (file: File): Promise<(PeriodicHealthCheckupsDetailsStudentRequestDTO & { mssv: string })[]> => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error("No sheets found in Excel file");

    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    if (jsonData.length <= 3) throw new Error("No data rows found in Excel file");

    const rows = jsonData.slice(3) as any[];
    const mappedData: (PeriodicHealthCheckupsDetailsStudentRequestDTO & { mssv: string })[] = [];
    const errors: string[] = [];

    rows.forEach((row, index) => {
      if (!row || row.every((cell: any) => !cell)) return;

      const rowData: RowData = {
        STT: row[0], MSSV: row[1], "Họ và tên": row[2], "Năm sinh": row[3], "Giới tính": row[4],
        "CC\n(cm)": row[5], "CN\n(Kg)": row[6], BMI: row[7], "Mạch\n(L/p)": row[8], "HA\n(mmHg)": row[9],
        "Nội khoa": row[10], "Ngoại khoa": row[11], "Da liễu": row[12], P: row[13], T: row[14],
        "Bệnh lý": row[15], TMH: row[16], RMH: row[17], "Phân loại": row[18], "Kết luận": row[19],
        "Đề nghị": row[20],
      };

      const validationErrors = validateRowData(rowData, index);
      if (validationErrors.length > 0) {
        errors.push(...validationErrors);
        return;
      }

      mappedData.push({
        mssv: rowData["MSSV"]!.toString(),
        heightCm: parseFloat(rowData["CC\n(cm)"]!.toString()),
        weightKg: parseFloat(rowData["CN\n(Kg)"]!.toString()),
        bmi: parseFloat(rowData["BMI"]?.toString() || "0") || 0,
        pulseRate: parseInt(rowData["Mạch\n(L/p)"]?.toString() || "0", 10) || 0,
        bloodPressure: rowData["HA\n(mmHg)"]!.toString(),
        internalMedicineStatus: rowData["Nội khoa"]?.toString() || "",
        surgeryStatus: rowData["Ngoại khoa"]?.toString() || "",
        dermatologyStatus: rowData["Da liễu"]?.toString() || "",
        eyeRightScore: parseInt(rowData["P"]?.toString() || "0", 10) || 0,
        eyeLeftScore: parseInt(rowData["T"]?.toString() || "0", 10) || 0,
        eyePathology: rowData["Bệnh lý"]?.toString() || "",
        entstatus: rowData["TMH"]?.toString() || "",
        dentalOralStatus: rowData["RMH"]?.toString() || "",
        classification: parseInt(rowData["Phân loại"]?.toString() || "0", 10) || 0,
        conclusion: rowData["Kết luận"]?.toString() || "",
        recommendations: rowData["Đề nghị"]?.toString() || "",
        periodicHealthCheckUpId: "",
        status: "Active",
        createdBy: "",
        nextCheckupDate: dayjs().add(1, "year").toISOString(),
      });
    });

    if (errors.length > 0) throw new Error(`Data validation failed:\n${errors.join("\n")}`);
    if (mappedData.length === 0) throw new Error("No valid data rows found after processing");
    return mappedData;
  };

  const deduplicateRecords = (records: (PeriodicHealthCheckupsDetailsStudentRequestDTO & { mssv: string })[]) => {
    const seen = new Set<string>();
    return records.filter(record => {
      const key = `${record.mssv}-${record.nextCheckupDate}`;
      if (seen.has(key)) {
        toast.warn(`Duplicate record found for MSSV ${record.mssv}`);
        return false;
      }
      seen.add(key);
      return true;
    });
  };

  const handleApiErrors = (errors: string[], type: string) => {
    const errorMessage = `${type} errors:\n${errors.join("\n")}`;
    message.error({ content: errorMessage, key: "uploadProgress", duration: 5 });
    toast.error(`Failed to process ${type.toLowerCase()} records`);
    throw new Error(errorMessage);
  };

  const validateMssvs = async (mssvList: string[], token: string) => {
    const studentUserIds: { [mssv: string]: string } = {};
    const validationErrors: string[] = [];

    await Promise.all(
      mssvList.map(async (mssv) => {
        const response = await getStudentHealthCheckupsByMssv(mssv, token);
        if (!response.isSuccess || !response.data?.userId) {
          validationErrors.push(`MSSV ${mssv}: ${response.message || "Student not found"}`);
        } else {
          studentUserIds[mssv] = response.data.userId;
        }
      })
    );

    return { studentUserIds, validationErrors };
  };

  const prepareRequests = (
    groupedByMssv: { [key: string]: (PeriodicHealthCheckupsDetailsStudentRequestDTO & { mssv: string })[] },
    studentUserIds: { [mssv: string]: string },
    healthcareStaffId: string
  ) => {
    const parentRequests: PeriodicHealthCheckupRequestDTO[] = [];
    const detailRequests: PeriodicHealthCheckupsDetailsStudentRequestDTO[] = [];
    const mssvList = Object.keys(groupedByMssv);

    for (const mssv of mssvList) {
      const details = groupedByMssv[mssv];
      const firstDetail = details[0];

      parentRequests.push({
        userID: studentUserIds[mssv],
        staffID: healthcareStaffId,
        checkupDate: dayjs().toISOString(),
        year: dayjs().year(),
        classification: firstDetail.classification?.toString() ?? "0",
        status: "Active",
        createdBy: healthcareStaffId,
      });

      detailRequests.push(...details.map(detail => ({
        ...detail,
        periodicHealthCheckUpId: "",
        createdBy: healthcareStaffId,
      })));
    }

    return { parentRequests, detailRequests };
  };

  const onFinish = async () => {
    const token = Cookies.get("token");
    if (!token) {
      toast.error("Authentication token missing.");
      return;
    }

    if (fileList.length === 0) {
      toast.error("Please upload an Excel file.");
      return;
    }

    try {
      setUploadProgress({ isLoading: true, current: 0, total: 0 });
      const file = fileList[0].originFileObj as File;
      message.loading({ content: "Validating file...", key: "uploadProgress" });

      const healthcareStaffId = jwtDecode<any>(token).userid;
      const checkupDetailsArray = deduplicateRecords(await parseExcel(file));
      setUploadProgress(prev => ({ ...prev, total: checkupDetailsArray.length }));

      const groupedByMssv = checkupDetailsArray.reduce((acc, detail) => {
        acc[detail.mssv] = acc[detail.mssv] || [];
        acc[detail.mssv].push(detail);
        return acc;
      }, {} as { [key: string]: (PeriodicHealthCheckupsDetailsStudentRequestDTO & { mssv: string })[] });

      const mssvList = Object.keys(groupedByMssv);
      const { studentUserIds, validationErrors } = await validateMssvs(mssvList, token);
      if (validationErrors.length > 0) handleApiErrors(validationErrors, "Student validation");

      const { parentRequests, detailRequests } = prepareRequests(groupedByMssv, studentUserIds, healthcareStaffId);
      
      message.loading({ content: "Creating health checkup records...", key: "uploadProgress" });
      const parentResponses = await Promise.all(
        parentRequests.map(req => 
          createPeriodicHealthCheckup(req, token, abortController.current.signal)
        )
      );
      const parentErrors = parentResponses
        .map((res, idx) => (!res.isSuccess ? `MSSV ${mssvList[idx]}: ${res.message}` : null))
        .filter(Boolean) as string[];
      if (parentErrors.length > 0) handleApiErrors(parentErrors, "Parent record");

      parentResponses.forEach((response, index) => {
        const periodicHealthCheckUpId = response.data!.id;
        const startIdx = detailRequests.findIndex((req, i) => i >= index && req.mssv === mssvList[index]);
        const endIdx = detailRequests.findIndex((req, i) => i > index && req.mssv !== mssvList[index]);
        const sliceEnd = endIdx === -1 ? detailRequests.length : endIdx;
        detailRequests.slice(startIdx, sliceEnd).forEach(req => {
          req.periodicHealthCheckUpId = periodicHealthCheckUpId;
        });
      });

      const detailResponses = await Promise.all(
        detailRequests.map((request, index) =>
          createStudentHealthCheckup(request, token, abortController.current.signal).then(response => {
            setUploadProgress(prev => ({ ...prev, current: index + 1 }));
            return response;
          })
        )
      );
      const detailErrors = detailResponses
        .map((res, idx) => (!res.isSuccess ? `MSSV ${detailRequests[idx].mssv}: ${res.message}` : null))
        .filter(Boolean) as string[];
      if (detailErrors.length > 0) handleApiErrors(detailErrors, "Detail record");

      message.success({ content: "Upload completed successfully!", key: "uploadProgress" });
      toast.success(`Successfully created ${detailRequests.length} student health checkup(s)!`);
      onSuccess();
      onClose();
      form.resetFields();
      setFileList([]);
    } catch (error: any) {
      if (abortController.current.signal.aborted) {
        message.info({ content: "Upload cancelled", key: "uploadProgress" });
        toast.info("Upload process was cancelled");
      } else {
        message.error({ content: error.message, key: "uploadProgress", duration: 5 });
        toast.error(`Error processing file: ${error.message}`);
      }
    } finally {
      setUploadProgress({ isLoading: false, current: 0, total: 0 });
    }
  };

  const uploadProps = {
    beforeUpload: (file: File) => {
      const isExcel = 
        file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.type === "application/vnd.ms-excel";
      const isLt5M = file.size / 1024 / 1024 < 5;

      if (!isExcel) {
        message.error("You can only upload Excel files (.xlsx, .xls)!");
        return false;
      }
      if (!isLt5M) {
        message.error("File must be smaller than 5MB!");
        return false;
      }

      setFileList([{
        uid: file.name,
        name: file.name,
        status: "done",
        originFileObj: file as RcFile,
      }]);
      return false;
    },
    onRemove: () => setFileList([]),
    fileList,
    maxCount: 1,
  };

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ marginBottom: "20px" }}>
        <div className="flex items-center gap-2">
          <FileExcelOutlined style={{ color: "#1890ff", fontSize: 24 }} />
          <Title level={4} style={{ margin: 0 }}>Add Student Health Checkup via Excel</Title>
        </div>
        <p className="text-gray-500 mt-2">Upload an Excel file with student health checkup data to add multiple records at once.</p>
      </div>

      {uploadProgress.isLoading && (
        <div className="mb-6">
          <Title level={5} style={{ marginBottom: "8px" }}>
            Processing: {uploadProgress.current} of {uploadProgress.total}
          </Title>
          <Progress 
            percent={Math.round((uploadProgress.current / uploadProgress.total) * 100)}
            status="active"
            strokeColor={{
              '0%': '#52c41a',
              '100%': '#1890ff',
            }}
          />
        </div>
      )}

      <Form form={form} layout="vertical" onFinish={onFinish}>
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <Form.Item
              name="file"
              label={<span className="font-medium">Upload Excel File</span>}
              rules={[{ required: true, message: "Please upload an Excel file" }]}
              validateStatus={fileList.length === 0 && form.isFieldTouched("file") ? "error" : "success"}
              help={fileList.length === 0 && form.isFieldTouched("file") ? "Excel file is required" : ""}
            >
              <Dragger {...uploadProps} style={{ padding: '20px 0', background: '#f9fafb' }}>
                <p className="ant-upload-drag-icon">
                  <FileExcelOutlined style={{ color: "#1890ff", fontSize: 48 }} />
                </p>
                <p className="ant-upload-text font-medium text-lg">Click or drag Excel file to upload</p>
                <p className="ant-upload-hint text-gray-500">
                  Support for a single Excel file (XLSX/XLS) up to 5MB
                </p>
                {fileList.length > 0 && (
                  <div className="mt-4 bg-green-50 p-2 rounded text-green-700 text-sm inline-block">
                    <CheckCircleOutlined /> {fileList[0].name} selected
                  </div>
                )}
              </Dragger>
            </Form.Item>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-2">
            <div>
              <Button
                icon={<DownloadOutlined />}
                onClick={downloadTemplate}
                style={{ borderRadius: "8px" }}
              >
                Download Template
              </Button>
            </div>

            <div className="flex gap-3">
              {uploadProgress.isLoading && (
                <Button 
                  danger
                  onClick={() => abortController.current.abort()}
                  style={{ borderRadius: "8px" }}
                  icon={<CloseCircleOutlined />}
                >
                  Cancel
                </Button>
              )}
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={uploadProgress.isLoading}
                style={{ borderRadius: "8px", minWidth: "150px" }}
                disabled={fileList.length === 0}
                icon={<UploadOutlined />}
              >
                Import Checkups
              </Button>
            </div>
          </div>
        </div>
      </Form>
    </div>
  );
};

AddStudentHealthCheckupPage.displayName = "AddStudentHealthCheckupPage";

export default AddStudentHealthCheckupPage;