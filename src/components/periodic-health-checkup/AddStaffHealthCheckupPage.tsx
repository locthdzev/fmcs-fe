import React, { useState, useRef } from "react";
import { Button, Form, Upload, Typography, Space, message, UploadFile, Progress, Dropdown, Menu } from "antd";
import { UploadOutlined, DownloadOutlined, InboxOutlined, FileExcelOutlined, CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";
import Cookies from "js-cookie";
import jwtDecode from "jwt-decode";
import { 
  createStaffHealthCheckup, 
  PeriodicHealthCheckupsDetailsStaffRequestDTO,
  getStaffHealthCheckupByEmail 
} from "@/api/periodic-health-checkup-staff-api";
import { 
  PeriodicHealthCheckupRequestDTO, 
  createPeriodicHealthCheckup 
} from "@/api/periodic-health-checkup-api";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import { RcFile } from "antd/es/upload/interface";
import ExcelJS from "exceljs";

const { Title } = Typography;
const { Dragger } = Upload;

interface AddStaffHealthCheckupPageProps {
  onSuccess: () => void;
  onClose: () => void;
}

type ExcelRow = (string | number | boolean | undefined | null)[];

interface UploadProgress {
  isLoading: boolean;
  current: number;
  total: number;
}

interface ExcelHeaderConfig {
  key: keyof PeriodicHealthCheckupsDetailsStaffRequestDTO | 'email' | 'fullName' | 'gender';
  aliases: string[];
  required?: boolean;
  transform?: (value: any) => any;
  validate?: (value: any, rowIndex: number) => string | null;
}

interface StaffHealthCheckupWithEmail extends PeriodicHealthCheckupsDetailsStaffRequestDTO {
  email: string;
  fullName?: string;
  gender?: string;
}

// Utility function to convert camelCase to PascalCase
const toPascalCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(toPascalCase);
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const pascalKey = key.charAt(0).toUpperCase() + key.slice(1);
      acc[pascalKey] = toPascalCase(obj[key]);
      return acc;
    }, {} as any);
  }
  return obj;
};

const HEALTH_CHECKUP_HEADERS: ExcelHeaderConfig[] = [
  { key: 'fullName', aliases: ['họ và tên', 'full name'], required: true },
  { key: 'gender', aliases: ['giới tính', 'gender'], required: true,
    validate: (val, idx) => ['nam', 'nữ', 'male', 'female'].includes(String(val).toLowerCase())
      ? null : `Row ${idx}: Gender must be "Nam", "Nữ", "Male", or "Female"`
  },
  { key: 'email', aliases: ['email'], required: true,
    validate: (val, idx) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val)
      ? null : `Row ${idx}: Invalid email format`
  },
  { key: 'hospitalName', aliases: ['tên bệnh viện', 'hospital name'], required: true },
  { key: 'reportIssuanceDate', aliases: ['ngày báo cáo', 'report date'], required: true,
    transform: (val) => dayjs(val, ['DD/MM/YYYY', 'MM/DD/YYYY'], true).toISOString(),
    validate: (val, idx) => dayjs(val, ['DD/MM/YYYY', 'MM/DD/YYYY'], true).isValid()
      ? null : `Row ${idx}: Invalid date format (use DD/MM/YYYY)`
  },
  { key: 'hospitalReportUrl', aliases: ['report url'] },
  { key: 'completeBloodCount', aliases: ['tổng phân tích máu', 'complete blood count'] },
  { key: 'completeUrinalysis', aliases: ['tổng phân tích nước tiểu', 'complete urinalysis'] },
  { key: 'bloodGlucose', aliases: ['đường máu', 'blood glucose'],
    transform: (val) => parseFloat(val),
    validate: (val, idx) => {
      const num = parseFloat(val);
      return isNaN(num) || num < 0 || num > 50 ? `Row ${idx}: Glucose must be 0-50` : null;
    }
  },
  { key: 'hbA1c', aliases: ['hba1c'],
    transform: (val) => parseFloat(val),
    validate: (val, idx) => {
      const num = parseFloat(val);
      return isNaN(num) || num < 0 || num > 20 ? `Row ${idx}: HbA1c must be 0-20` : null;
    }
  },
  { key: 'uricAcid', aliases: ['acid uric', 'uric acid'],
    transform: (val) => parseFloat(val),
    validate: (val, idx) => {
      const num = parseFloat(val);
      return isNaN(num) || num < 0 || num > 20 ? `Row ${idx}: Uric Acid must be 0-20` : null;
    }
  },
  { key: 'triglycerides', aliases: ['mỡ máu', 'blood lipids'], transform: (val) => parseFloat(val?.split('/')[0]) },
  { key: 'cholesterol', aliases: ['mỡ máu', 'blood lipids'], transform: (val) => parseFloat(val?.split('/')[1]) },
  { key: 'hdl', aliases: ['mỡ máu', 'blood lipids'], transform: (val) => parseFloat(val?.split('/')[2]) },
  { key: 'ldl', aliases: ['mỡ máu', 'blood lipids'], transform: (val) => parseFloat(val?.split('/')[3]) },
  { key: 'sgot', aliases: ['chức năng gan', 'liver function'], transform: (val) => parseFloat(val?.split('/')[0]) },
  { key: 'sgpt', aliases: ['chức năng gan', 'liver function'], transform: (val) => parseFloat(val?.split('/')[1]) },
  { key: 'ggt', aliases: ['chức năng gan', 'liver function'], transform: (val) => parseFloat(val?.split('/')[2]) },
  { key: 'urea', aliases: ['chức năng thận', 'kidney function'], transform: (val) => parseFloat(val?.split('/')[0]) },
  { key: 'creatinine', aliases: ['chức năng thận', 'kidney function'], transform: (val) => parseFloat(val?.split('/')[1]) },
  { key: 'serumIron', aliases: ['sắt huyết thanh', 'serum iron'], transform: (val) => parseFloat(val) },
  { key: 'totalCalcium', aliases: ['tổng canxi', 'total calcium'], transform: (val) => parseFloat(val) },
  { key: 'hbsAg', aliases: ['hbsag'], transform: (val) => String(val).toUpperCase() === 'TRUE' },
  { key: 'hbsAb', aliases: ['hbsab'], transform: (val) => String(val).toUpperCase() === 'TRUE' },
  { key: 'hcvab', aliases: ['hcvab'], transform: (val) => String(val).toUpperCase() === 'TRUE' },
  { key: 'antiHavigM', aliases: ['anti-hav igm'], transform: (val) => String(val).toUpperCase() === 'TRUE' },
  { key: 'hiv', aliases: ['hiv'], transform: (val) => String(val).toUpperCase() === 'TRUE' },
  { key: 'liverAfp', aliases: ['afp gan', 'afp'], transform: (val) => parseFloat(val) },
  { key: 'prostatePsa', aliases: ['psa tiền liệt tuyến', 'psa'], transform: (val) => parseFloat(val) },
  { key: 'colonCea', aliases: ['cea đại tràng', 'cea'], transform: (val) => parseFloat(val) },
  { key: 'stomachCa724', aliases: ['ca 72-4 dạ dày', 'ca 72-4'], transform: (val) => parseFloat(val) },
  { key: 'pancreasCa199', aliases: ['ca 19-9 tụy', 'ca 19-9'], transform: (val) => parseFloat(val) },
  { key: 'breastCa153', aliases: ['ca 15-3 vú', 'ca 15-3'], transform: (val) => parseFloat(val) },
  { key: 'ovariesCa125', aliases: ['ca-125 buồng trứng', 'ca-125'], transform: (val) => parseFloat(val) },
  { key: 'lungCyfra211', aliases: ['cyfra 21-1 phổi', 'cyfra 21-1'], transform: (val) => parseFloat(val) },
  { key: 'ferritin', aliases: ['ferritin'], transform: (val) => parseFloat(val) },
  { key: 'toxocaraCanis', aliases: ['toxocara canis'], transform: (val) => String(val).toUpperCase() === 'TRUE' },
  { key: 'rf', aliases: ['rf'], transform: (val) => parseFloat(val) },
  { key: 'electrolytesNa', aliases: ['điện giải', 'electrolytes'], transform: (val) => parseFloat(val?.split('/')[0]) },
  { key: 'electrolytesK', aliases: ['điện giải', 'electrolytes'], transform: (val) => parseFloat(val?.split('/')[1]) },
  { key: 'electrolytesCl', aliases: ['điện giải', 'electrolytes'], transform: (val) => parseFloat(val?.split('/')[2]) },
  {
    key: 'thyroidT3',
    aliases: ['tuyến giáp (t3/ft4/tsh)', 'thyroid function (t3/ft4/tsh)'],
    transform: (val) => {
      if (!val || typeof val !== 'string') return null;
      const parts = val.split('/');
      const num = parseFloat(parts[0]?.trim());
      return isNaN(num) ? null : num;
    },
    validate: (val, idx) => {
      if (val === null || val === undefined || val === '') return null;
      if (typeof val !== 'string') return `Row ${idx}: Thyroid T3 must be in format "T3/FT4/TSH"`;
      const parts = val.split('/');
      if (parts[0] === undefined || parts[0].trim() === '') return null;
      const num = parseFloat(parts[0]?.trim());
      if (isNaN(num)) {
        console.log(`Row ${idx}: Invalid Thyroid T3 payload:`, {
          rawValue: val,
          t3Part: parts[0],
          parsedNumber: num
        });
        return `Row ${idx}: Thyroid T3 must be a valid number if provided`;
      }
      return null;
    }
  },
  {
    key: 'thyroidFt4',
    aliases: ['tuyến giáp (t3/ft4/tsh)', 'thyroid function (t3/ft4/tsh)'],
    transform: (val) => {
      if (!val || typeof val !== 'string') {
        console.log('thyroidFt4: Invalid input:', val);
        return null;
      }
      const parts = val.split('/');
      console.log('thyroidFt4: Split parts:', parts); // Debug the split result
      const num = parseFloat(parts[1]?.trim());
      console.log('thyroidFt4: Parsed FT4:', { part: parts[1], trimmed: parts[1]?.trim(), num });
      return isNaN(num) ? null : num;
    },
    validate: (val, idx) => {
      if (val === null || val === undefined || val === '') return null;
      if (typeof val !== 'string') return `Row ${idx}: Thyroid FT4 must be in format "T3/FT4/TSH"`;
      const parts = val.split('/');
      if (parts[1] === undefined || parts[1].trim() === '') return null;
      const num = parseFloat(parts[1]?.trim());
      if (isNaN(num)) {
        console.log(`Row ${idx}: Invalid Thyroid FT4 payload:`, {
          rawValue: val,
          ft4Part: parts[1],
          parsedNumberA: num
        });
        return `Row ${idx}: Thyroid FT4 must be a valid number if provided`;
      }
      return null;
    }
  },
  {
    key: 'thyroidTsh',
    aliases: ['tuyến giáp (t3/ft4/tsh)', 'thyroid function (t3/ft4/tsh)'],
    transform: (val) => {
      if (!val || typeof val !== 'string') return null;
      const parts = val.split('/');
      const num = parseFloat(parts[2]?.trim()); // Third part for TSH
      return isNaN(num) ? null : num;
    },
    validate: (val, idx) => {
      if (val === null || val === undefined || val === '') return null;
      if (typeof val !== 'string') return `Row ${idx}: Thyroid TSH must be in format "T3/FT4/TSH"`;
      const parts = val.split('/');
      if (parts[2] === undefined || parts[2].trim() === '') return null; // Allow missing TSH
      const num = parseFloat(parts[2]?.trim());
      if (isNaN(num)) {
        console.log(`Row ${idx}: Invalid Thyroid TSH payload:`, {
          rawValue: val,
          tshPart: parts[2],
          parsedNumber: num
        });
        return `Row ${idx}: Thyroid TSH must be a valid number if provided`;
      }
      return null;
    }
  },
  { key: 'bloodType', aliases: ['nhóm máu abo', 'abo blood type'] },
  { key: 'rhType', aliases: ['nhóm máu rh', 'rh blood type'] },
  { key: 'generalExam', aliases: ['khám tổng quát', 'general examination'] },
  { key: 'eyeExam', aliases: ['khám mắt', 'eye examination'] },
  { key: 'dentalExam', aliases: ['khám răng', 'dental examination'] },
  { key: 'entexam', aliases: ['khám tai mũi họng', 'ent examination'] },
  { key: 'dermatologyExam', aliases: ['khám da liễu', 'dermatology examination'] },
  { key: 'gynecologicalExam', aliases: ['khám phụ khoa', 'gynecological examination'] },
  { key: 'vaginalWetMount', aliases: ['soi tươi dịch âm đạo', 'vaginal wet mount'] },
  { key: 'cervicalCancerPap', aliases: ['pap smear'] },
  { key: 'abdominalUltrasound', aliases: ['siêu âm bụng', 'abdominal ultrasound'] },
  { key: 'thyroidUltrasound', aliases: ['siêu âm tuyến giáp', 'thyroid ultrasound'] },
  { key: 'breastUltrasound', aliases: ['siêu âm tuyến vú', 'breast ultrasound'] },
  { key: 'ecg', aliases: ['điện tim', 'ecg'] },
  { key: 'chestXray', aliases: ['x-quang phổi', 'chest x-ray'] },
  { key: 'lumbarSpineXray', aliases: ['x-quang cột sống thắt lưng', 'lumbar spine x-ray'] },
  { key: 'cervicalSpineXray', aliases: ['x-quang cột sống cổ', 'cervical spine x-ray'] },
  { key: 'refractiveError', aliases: ['đo khúc xạ', 'refractive error'] },
  { key: 'dopplerHeart', aliases: ['siêu âm doppler tim', 'doppler heart ultrasound'] },
  { key: 'carotidDoppler', aliases: ['siêu âm doppler động mạch cảnh', 'carotid doppler ultrasound'] },
  { key: 'transvaginalUltrasound', aliases: ['siêu âm tử cung buồng trứng qua đường âm đạo', 'transvaginal ultrasound'] },
  { key: 'boneDensityTscore', aliases: ['đo mật độ xương', 'bone density'],
    transform: (val) => {
      if (typeof val === 'string' && val.includes('T-score:')) {
        const match = val.match(/T-score:\s*(-?\d*\.?\d+)/);
        return match ? parseFloat(match[1]) : undefined;
      }
      return parseFloat(val);
    },
    validate: (val, idx) => {
      const num = typeof val === 'string' && val.includes('T-score:') 
        ? parseFloat(val.match(/T-score:\s*(-?\d*\.?\d+)/)?.[1] || 'NaN')
        : parseFloat(val);
      return isNaN(num) ? `Row ${idx}: Bone Density T-score must be a valid number` : null;
    }
  },
  { key: 'echinococcus', aliases: ['echinococcus'], transform: (val) => String(val).toUpperCase() === 'TRUE' },
  {
    key: 'conclusion',
    aliases: ['kết luận', 'conclusion', 'ket luan', 'summary'],
    transform: (val) => (val !== undefined && val !== null ? String(val) : undefined)
  },
];

const AddStaffHealthCheckupPage: React.FC<AddStaffHealthCheckupPageProps> = ({ onSuccess, onClose }) => {
  const [form] = Form.useForm();
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({ isLoading: false, current: 0, total: 0 });
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const abortController = useRef(new AbortController());
  const token = Cookies.get("token");

  const downloadTemplate = async (language: "vi" | "en" = "vi") => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(language === "vi" ? "Mẫu Kiểm Tra Sức Khỏe" : "Health Checkup Template", {
      properties: { defaultRowHeight: 20, defaultColWidth: 18 },
    });
  
    const vietnameseHeaders = [
      ["Mẫu Kiểm Tra Sức Khỏe Nhân Viên"],
      ["Hướng dẫn: Điền dữ liệu từ Hàng 8 trở đi. Các trường bắt buộc có dấu (*). Dùng DD/MM/YYYY cho ngày, TRUE/FALSE cho có/không, phân cách giá trị bằng '/' (ví dụ: 40/45)."],
      [""],
      ["STT", "Thông Tin Cá Nhân", "", "", "Thông Tin Kiểm Tra", "", "", "Xét Nghiệm Hóa Sinh Cơ Bản", "", "", "", "", "", "Chức Năng Gan & Thận", "", "", "", "Bệnh Truyền Nhiễm", "", "", "", "", "Tầm Soát Ung Thư", "", "", "", "", "", "", "", "", "", "Nội Tiết & Nhóm Máu", "", "", "Xét Nghiệm Bổ Sung", "", "", "", "Khám Lâm Sàng", "", "", "", "", "Sức Khỏe Phụ Nữ", "", "", "Chẩn Đoán Hình Ảnh", "", "", "", "", "", "", "", "", "", "", "Kết Luận"],
      [""],
      ["", "Họ và Tên (*)", "Giới tính (*)\n(Nam/Nữ)", "Email (*)", "Tên Bệnh Viện (*)", "Ngày Báo Cáo (*)\n(DD/MM/YYYY)", "Report URL", "Tổng Phân Tích Máu\n(18 chỉ số)", "Tổng Phân Tích Nước Tiểu", "Đường Máu\n(mmol/L)", "HbA1c\n(%)", "Acid Uric\n(mg/dL)", "Mỡ Máu\n(TG/Chol/HDL/LDL)", "Chức Năng Gan\n(SGOT/SGPT/GGT)", "Chức Năng Thận\n(Urea/Creatinine)", "Sắt Huyết Thanh\n(µg/dL)", "Tổng Canxi\n(mmol/L)", "HBsAg\n(TRUE/FALSE)", "HBsAb\n(TRUE/FALSE)", "HCVAb\n(TRUE/FALSE)", "Anti-HAV IgM\n(TRUE/FALSE)", "HIV\n(TRUE/FALSE)", "AFP (Gan)\n(ng/mL)", "PSA (Tiền Liệt Tuyến)\n(ng/mL)", "CEA (Đại Tràng)\n(ng/mL)", "CA 72-4 (Dạ Dày)\n(U/mL)", "CA 19-9 (Tụy)\n(U/mL)", "CA 15-3 (Vú)\n(U/mL)", "CA-125 (Buồng Trứng)\n(U/mL)", "CYFRA 21-1 (Phổi)\n(ng/mL)", "Ferritin\n(ng/mL)", "Toxocara Canis\n(TRUE/FALSE)", "RF\n(IU/mL)", "Điện Giải\n(Na/K/Cl)", "Tuyến Giáp\n(T3/FT4/TSH)", "Nhóm Máu ABO", "Nhóm Máu Rh", "Khám Tổng Quát", "Khám Mắt", "Khám Răng", "Khám Tai Mũi Họng", "Khám Da Liễu", "Khám Phụ Khoa", "Soi Tươi Dịch Âm Đạo", "Pap Smear", "Siêu Âm Bụng", "Siêu Âm Tuyến Giáp", "Siêu Âm Tuyến Vú", "Điện Tim", "X-quang Phổi", "X-quang Cột Sống Thắt Lưng", "X-quang Cột Sống Cổ", "Đo Khúc Xạ", "Siêu Âm Doppler Tim", "Siêu Âm Doppler Động Mạch Cảnh", "Siêu Âm Tử Cung Buồng Trứng Qua Đường Âm Đạo", "Đo Mật Độ Xương", "Echinococcus\n(TRUE/FALSE)"],
      [""],
    ];
  
    const englishHeaders = [
      ["Staff Health Checkup "],
      ["Instructions: Fill data from Row 8 onwards. Required fields are marked (*). Use DD/MM/YYYY for dates, TRUE/FALSE for yes/no, separate values with '/' (e.g., 40/45)."],
      [""],
      ["NO.", "Personal Information", "", "", "Checkup Information", "", "", "Basic Biochemical Tests", "", "", "", "", "", "Liver & Kidney Function", "", "", "", "Infectious Diseases", "", "", "", "", "Cancer Early Detection", "", "", "", "", "", "", "", "", "", "Endocrine & Blood Type", "", "", "Additional Biomarkers", "", "", "", "Clinical Examinations", "", "", "", "", "Women's Health", "", "", "Imaging Diagnosis", "", "", "", "", "", "", "", "", "", "", "Conclusion"],
      [""],
      ["", "Full Name (*)", "Gender (*)\n(Male/Female)", "Email (*)", "Hospital Name (*)", "Report Date (*)\n(DD/MM/YYYY)", "Report URL", "Complete Blood Count\n(18 indicators)", "Complete Urinalysis", "Blood Glucose\n(mmol/L)", "HbA1c\n(%)", "Uric Acid\n(mg/dL)", "Blood Lipids\n(TG/Chol/HDL/LDL)", "Liver Function\n(SGOT/SGPT/GGT)", "Kidney Function\n(Urea/Creatinine)", "Serum Iron\n(µg/dL)", "Total Calcium\n(mmol/L)", "HBsAg\n(TRUE/FALSE)", "HBsAb\n(TRUE/FALSE)", "HCVAb\n(TRUE/FALSE)", "Anti-HAV IgM\n(TRUE/FALSE)", "HIV\n(TRUE/FALSE)", "AFP (Liver)\n(ng/mL)", "PSA (Prostate)\n(ng/mL)", "CEA (Colon)\n(ng/mL)", "CA 72-4 (Stomach)\n(U/mL)", "CA 19-9 (Pancreas)\n(U/mL)", "CA 15-3 (Breast)\n(U/mL)", "CA-125 (Ovaries)\n(U/mL)", "CYFRA 21-1 (Lung)\n(ng/mL)", "Ferritin\n(ng/mL)", "Toxocara Canis\n(TRUE/FALSE)", "RF\n(IU/mL)", "Electrolytes\n(Na/K/Cl)", "Thyroid Function\n(T3/FT4/TSH)", "ABO Blood Type", "Rh Blood Type", "General Examination", "Eye Examination", "Dental Examination", "ENT Examination", "Dermatology Examination", "Gynecological Examination", "Vaginal Wet Mount", "Pap Smear", "Abdominal Ultrasound", "Thyroid Ultrasound", "Breast Ultrasound", "ECG", "Chest X-ray", "Lumbar Spine X-ray", "Cervical Spine X-ray", "Refractive Error", "Doppler Heart Ultrasound", "Carotid Doppler Ultrasound", "Transvaginal Ultrasound", "Bone Density", "Echinococcus\n(TRUE/FALSE)"],
      [""],
    ];
  
    const headers = language === "vi" ? vietnameseHeaders : englishHeaders;
    headers.forEach(row => worksheet.addRow(row));
  
    worksheet.getCell('BG6').value = 'Kết Luận';
    worksheet.mergeCells("A1:BG1");
    worksheet.mergeCells("A2:BG2");
    worksheet.mergeCells("A4:A7");
    worksheet.mergeCells("B4:D5");
    worksheet.mergeCells("E4:G5");
    worksheet.mergeCells("H4:M5");
    worksheet.mergeCells("N4:Q5");
    worksheet.mergeCells("R4:V5");
    worksheet.mergeCells("W4:AF5");
    worksheet.mergeCells("AG4:AI5");
    worksheet.mergeCells("AJ4:AM5");
    worksheet.mergeCells("AN4:AR5");
    worksheet.mergeCells("AS4:AU5");
    worksheet.mergeCells("AV4:BF5");
    worksheet.mergeCells("BG4:BG7");
  
    for (let col = 2; col <= 58; col++) {
      const colLetter = worksheet.getColumn(col).letter;
      worksheet.mergeCells(`${colLetter}6:${colLetter}7`);
    }
  
    const sampleData = language === "vi"
      ? ["1", "Nguyễn Thị B", "Nữ", "bnt@fe.edu.vn", "Bệnh Viện Thành Phố", "02/04/2025", "http://baocao.com/mau.pdf", "Bình thường", "Bình thường", 5.5, 5.8, 6.0, "150/200/50/130", "40/45/30", "20/1.0", 100, 2.5, "FALSE", "TRUE", "FALSE", "FALSE", "FALSE", 5.0, 2.0, 3.0, 4.0, 10, 15, 20, 2.5, 300, "FALSE", 40, "140/4.0/100", "1.5/1.2/2.5", "A", "Dương", "Khỏe mạnh", "20/20", "Không sâu răng", "Bình thường", "Không vấn đề", "Bình thường", "Không nhiễm trùng", "Âm tính", "Bình thường", "Bình thường", "Bình thường", "Bình thường", "Không bất thường", "Bình thường", "Bình thường", "20/20", "Bình thường", "Bình thường", "Bình thường", "T-score: -1.0", "FALSE", "Khỏe mạnh"]
      : ["1", "Jane Doe", "Female", "janed@fe.edu.vn", "City Hospital", "02/04/2025", "http://report.com/sample.pdf", "Normal", "Normal", 5.5, 5.8, 6.0, "150/200/50/130", "40/45/30", "20/1.0", 100, 2.5, "FALSE", "TRUE", "FALSE", "FALSE", "FALSE", 5.0, 2.0, 3.0, 4.0, 10, 15, 20, 2.5, 300, "FALSE", 40, "140/4.0/100", "1.5/1.2/2.5", "A", "Positive", "Healthy", "20/20", "No cavities", "Normal", "No issues", "Normal", "No infection", "Negative", "Normal", "Normal", "Normal", "Normal", "No abnormalities", "Normal", "Normal", "20/20", "Normal", "Normal", "Normal", "T-score: -1.0", "FALSE", "Healthy"];
    worksheet.addRow(sampleData);
  
    worksheet.columns = Array(59).fill(0).map((_, i) => ({
      key: String.fromCharCode(65 + Math.floor(i / 26)) + (i % 26 < 0 ? "" : String.fromCharCode(65 + (i % 26))),
      width: 18,
    }));
  
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.font = { name: "Calibri", size: 11 };
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        cell.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
  
        if (rowNumber === 1) {
          cell.font = { size: 14, bold: true, color: { argb: "FFFFFFFF" } };
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2E8B57" } };
        } else if (rowNumber === 2) {
          cell.font = { size: 10, italic: true, color: { argb: "FF333333" } };
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F5F5" } };
        } else if (rowNumber === 4 || rowNumber === 5) {
          if (cell.value && cell.address.startsWith("A")) {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF82CA9C" } };
            cell.font = { size: 11, bold: true };
          } else if (cell.value) {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF82CA9C" } };
            cell.font = { size: 11, bold: true };
          }
        } else if (rowNumber === 6 || rowNumber === 7) { // Include row 7 for consistency with merging
          if (cell.value && cell.address !== "A6") { 
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "CCE7D4" } };
            cell.font = { size: 10, bold: true }; // Size 10, bold for other subheaders
          }
          else if (cell.address === "A6") {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF82CA9C" } };
            cell.font = { size: 10, bold: true }; // Size 10, bold for "NO."
          } 
        } else if (rowNumber === 8) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF0F5" } };
        }
      });
    });

    // Reapply A6 styling at the end to ensure it sticks
const noCell = worksheet.getCell("A6");
noCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF82CA9C" } };
noCell.font = { name: "Calibri", size: 10, bold: true };
  
    const conclusionCell = worksheet.getCell("BG4");
    conclusionCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF82CA9C" } };
    conclusionCell.font = { size: 11, bold: true };
    conclusionCell.value = language === "vi" ? "Kết Luận" : "Conclusion";
  
    const requiredColumns = [2, 3, 4, 5, 6];
    requiredColumns.forEach((col, index) => {
      worksheet.addConditionalFormatting({
        ref: `${worksheet.getColumn(col).letter}8:${worksheet.getColumn(col).letter}8`,
        rules: [
          {
            type: "cellIs",
            operator: "equal",
            formulae: ['""'],
            style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: "FFFFDAB9" } } },
            priority: index + 1,
          },
        ],
      });
    });
  
    worksheet.views = [{ state: "frozen", ySplit: 7 }];
  
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = language === "vi" ? "Mau_Kiem_Tra_Suc_Khoe_Nhan_Vien.xlsx" : "Staff_Health_Checkup_Template.xlsx";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const templateMenu = (
    <Menu>
      <Menu.Item key="vi" onClick={() => downloadTemplate("vi")}>Download Template (Vietnamese)</Menu.Item>
      <Menu.Item key="en" onClick={() => downloadTemplate("en")}>Download Template (English)</Menu.Item>
    </Menu>
  );

  const parseExcel = async (file: File): Promise<StaffHealthCheckupWithEmail[]> => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error("No sheets found in Excel file");
  
    const sheet = workbook.Sheets[sheetName];
    const jsonData: ExcelRow[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
    let headerRowIndex = -1;
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (row.some(cell => cell && String(cell).toLowerCase().includes("email"))) {
        headerRowIndex = i;
        break;
      }
    }
    if (headerRowIndex === -1 || headerRowIndex + 1 >= jsonData.length) {
      throw new Error("No valid header row or data rows found in Excel file");
    }
  
    const rawHeaders = jsonData[headerRowIndex] as string[];
    const headers = Array(58).fill('');
    rawHeaders.slice(1).forEach((header, index) => {
      headers[index] = header ? header.replace(/\n/g, " ").replace(/\s+/g, " ").trim().toLowerCase() : "";
    });
  
    console.log("Detected Excel headers (adjusted):", headers);
    console.log("Header length:", headers.length);
  
    const rows = jsonData
      .slice(headerRowIndex + 1)
      .filter(row => row && row.some(cell => cell != null && String(cell).trim() !== ""));
  
    if (!rows.length) throw new Error("No valid data rows found");
  
    const headerMap = new Map<string, ExcelHeaderConfig[]>();
    headers.forEach((header, index) => {
      const configs = HEALTH_CHECKUP_HEADERS.filter(h => 
        h.aliases.some(alias => header.includes(alias.toLowerCase()))
      );
      if (configs.length) headerMap.set(String(index), configs);
    });
  
    console.log("Header map:", Array.from(headerMap.entries()));
    console.log("Conclusion mapping:", headerMap.get(String(headers.indexOf(headers.find(h => h.includes('kết luận')) || '-1'))));
  
    const records: StaffHealthCheckupWithEmail[] = [];
    const errors: string[] = [];
  
    rows.forEach((row, rowIndex) => {
      const record: Partial<StaffHealthCheckupWithEmail> = {
        periodicHealthCheckUpId: "",
        status: "Active",
        createdBy: "",
        conclusion: 'N/A',
      };
      const rowValues = new Map<string, any>();
  
      console.log(`Row ${rowIndex + headerRowIndex + 2} raw data:`, row);
  
      row.slice(1).forEach((cell, colIndex) => {
        const configs = headerMap.get(String(colIndex));
        if (!configs || cell === undefined || cell === null) return;
  
        configs.forEach(config => {
          const value = config.transform ? config.transform(cell) : cell;
          rowValues.set(config.key, value);
          if (config.key === 'conclusion') {
            console.log(`Row ${rowIndex + headerRowIndex + 2} - Conclusion raw value: ${cell}, transformed value: ${value}`);
          }
          if (config.validate) {
            const error = config.validate(cell, rowIndex + headerRowIndex + 2);
            if (error) errors.push(error);
          }
        });
      });
  
      // Fallback: If no conclusion mapping and last column has data, assume it's conclusion
      if (!headerMap.has('57') && row.length === 59) {
        const lastValue = row[58]; // Index 58 after slice(1) is index 57
        const conclusionConfig = HEALTH_CHECKUP_HEADERS.find(h => h.key === 'conclusion');
        if (lastValue !== undefined && lastValue !== null && conclusionConfig) {
          const transformedValue = conclusionConfig.transform 
            ? conclusionConfig.transform(lastValue) 
            : String(lastValue);
          rowValues.set('conclusion', transformedValue);
          console.log(`Row ${rowIndex + headerRowIndex + 2} - Assumed conclusion: ${transformedValue}`);
        }
      }
  
      console.log(`Row ${rowIndex + headerRowIndex + 2} parsed values:`, Object.fromEntries(rowValues));
  
      HEALTH_CHECKUP_HEADERS.forEach(config => {
        if (config.required && !rowValues.has(config.key)) {
          errors.push(`Row ${rowIndex + headerRowIndex + 2}: ${config.key} is required`);
        }
        if (rowValues.has(config.key)) {
          (record[config.key as keyof StaffHealthCheckupWithEmail] as any) = rowValues.get(config.key);
        }
      });
  
      console.log(`Row ${rowIndex + headerRowIndex + 2} final record:`, record);
  
      if (Object.keys(record).length > 3) {
        records.push(record as StaffHealthCheckupWithEmail);
      }
    });
  
    if (errors.length > 0) throw new Error(`Data validation failed:\n${errors.join("\n")}`);
    if (!records.length) throw new Error("No valid data rows found after processing");
    return records;
  };

  const deduplicateRecords = (records: StaffHealthCheckupWithEmail[]): StaffHealthCheckupWithEmail[] => {
    const seen = new Set<string>();
    return records.filter(record => {
      const key = `${record.email}-${record.reportIssuanceDate}`;
      if (seen.has(key)) {
        toast.warn(`Duplicate record found for Email ${record.email}`);
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

  const validateEmailsAndGetUserIds = async (emailList: string[], token: string) => {
    const staffUserIds: { [email: string]: string } = {};
    const validationErrors: string[] = [];

    await Promise.all(
      emailList.map(async (email) => {
        const response = await getStaffHealthCheckupByEmail(email, token);
        if (!response.isSuccess || !response.data?.id) {
          validationErrors.push(`Email ${email}: ${response.message || "Staff not found"}`);
        } else {
          staffUserIds[email] = response.data.id;
        }
      })
    );

    return { staffUserIds, validationErrors };
  };

  const onFinish = async () => {
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
  
      const groupedByEmail = checkupDetailsArray.reduce((acc, detail) => {
        acc[detail.email] = acc[detail.email] || [];
        acc[detail.email].push(detail);
        return acc;
      }, {} as { [key: string]: StaffHealthCheckupWithEmail[] });
  
      const emailList = Object.keys(groupedByEmail);
      const { staffUserIds, validationErrors } = await validateEmailsAndGetUserIds(emailList, token);
      if (validationErrors.length > 0) handleApiErrors(validationErrors, "Staff validation");
  
      const parentRequests: PeriodicHealthCheckupRequestDTO[] = [];
      const detailRequests: StaffHealthCheckupWithEmail[] = [];
  
      for (const email of emailList) {
        const details = groupedByEmail[email];
        const firstDetail = details[0];
  
        const parentRequest: PeriodicHealthCheckupRequestDTO = {
          userID: staffUserIds[email],
          staffID: healthcareStaffId,
          checkupDate: firstDetail.reportIssuanceDate,
          year: dayjs(firstDetail.reportIssuanceDate).year(),
          classification: "N/A",
          status: "Active",
          createdBy: healthcareStaffId,
        };
  
        parentRequests.push(parentRequest);
        detailRequests.push(...details.map(detail => ({
          ...detail,
          periodicHealthCheckUpId: "",
          createdBy: healthcareStaffId,
        })));
      }
  
      message.loading({ content: "Creating health checkup records...", key: "uploadProgress" });
      const parentResponses = await Promise.all(
        parentRequests.map(req => createPeriodicHealthCheckup(req, token, abortController.current.signal))
      );
      const parentErrors = parentResponses
        .map((res, idx) => (!res.isSuccess ? `Email ${emailList[idx]}: ${res.message}` : null))
        .filter(Boolean) as string[];
      if (parentErrors.length > 0) handleApiErrors(parentErrors, "Parent record");
  
      parentResponses.forEach((response, index) => {
        const periodicHealthCheckUpId = response.data!.id;
        const email = emailList[index];
        detailRequests
          .filter(req => req.email === email)
          .forEach(req => {
            req.periodicHealthCheckUpId = periodicHealthCheckUpId;
          });
      });
  
      const detailResponses = await Promise.all(
        detailRequests.map((request, index) => {
          const transformedDto = toPascalCase({
            ...request,
            email: undefined,
            fullName: undefined,
            gender: undefined
          }) as PeriodicHealthCheckupsDetailsStaffRequestDTO;
          return createStaffHealthCheckup(
            transformedDto, // Pass transformed DTO directly
            token,
            abortController.current.signal
          ).then(response => {
            setUploadProgress(prev => ({ ...prev, current: index + 1 }));
            return response;
          });
        })
      );
      const detailErrors = detailResponses
        .map((res, idx) => (!res.isSuccess ? `Email ${detailRequests[idx].email}: ${res.message}` : null))
        .filter(Boolean) as string[];
      if (detailErrors.length > 0) handleApiErrors(detailErrors, "Detail record");
  
      message.success({ content: "Upload completed successfully!", key: "uploadProgress" });
      toast.success(`Successfully created ${detailRequests.length} staff health checkup(s)!`);
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

      setFileList([{ uid: file.name, name: file.name, status: "done", originFileObj: file as RcFile }]);
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
          <Title level={4} style={{ margin: 0 }}>Add Staff Health Checkup via Excel</Title>
        </div>
        <p className="text-gray-500 mt-2">Upload an Excel file with staff health checkup data to add multiple records at once.</p>
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
              <Dropdown overlay={templateMenu} trigger={["click"]}>
                <Button 
                  icon={<DownloadOutlined />}
                  style={{ borderRadius: "8px" }}
                >
                  Download Template
                </Button>
              </Dropdown>
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

AddStaffHealthCheckupPage.displayName = "AddStaffHealthCheckupPage";

export default AddStaffHealthCheckupPage;