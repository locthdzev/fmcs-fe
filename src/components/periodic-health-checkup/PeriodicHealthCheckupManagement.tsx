import React, { useReducer, useEffect, useCallback, useMemo, useState } from "react";
import {
  Button,
  Input,
  Space,
  Row,
  Col,
  Card,
  Typography,
  Tag,
  Spin,
  Tabs,
  Badge,
  Empty,
  DatePicker,
  Tooltip,
  Statistic,
  Modal,
  Pagination,
  Dropdown,
  Checkbox,
  Select,
  message,
  List,
  Avatar,
  Skeleton,
} from "antd";
import { toast } from "react-toastify";
import dayjs, { Dayjs } from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import Cookies from "js-cookie";
import { useRouter } from "next/router";
import {
  getAllHealthCheckups as getAllStudentHealthCheckups,
  deleteHealthCheckup as deleteStudentHealthCheckup,
  exportHealthCheckupsToExcel as exportStudentHealthCheckupsToExcel,
} from "@/api/periodic-health-checkup-student-api";
import {
  getAllStaffHealthCheckups,
  deleteStaffHealthCheckup,
  exportStaffHealthCheckupsToExcel,
  updateStaffHealthCheckup,
  PeriodicHealthCheckupsDetailsStaffResponseDTO,
} from "@/api/periodic-health-checkup-staff-api";
import {
  getHealthCheckupByCheckupId,
  deleteHealthCheckup as deleteParentHealthCheckup,
} from "@/api/periodic-health-checkup-api";
import { getUserById } from "@/api/user";
import {
  SearchOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  DownloadOutlined,
  ReloadOutlined,
  PlusOutlined,
  UserOutlined,
  FormOutlined,
  ExclamationCircleOutlined,
  TeamOutlined,
  StopOutlined,
  DatabaseOutlined,
  SettingOutlined,
  FilterOutlined,
  FileExcelOutlined,
  MedicineBoxOutlined,
  EyeOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import debounce from "lodash/debounce";
import { FixedSizeList } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import AddStaffHealthCheckupModal from "./AddStaffHealthCheckupModal";
import AddStudentHealthCheckupModal from "./AddStudentHealthCheckupModal";
import UpdateStudentHealthCheckup from "./UpdateStudentHealthCheckup";
import UpdateStaffHealthCheckupModal from "./UpdateStaffHealthCheckupModal";
import CheckupDetailStudentModal from "./CheckupDetailStudentModal";
import CheckupDetailStaffModal from "./CheckupDetailStaffModal";
import PageContainer from "../shared/PageContainer";
import ToolbarCard from "../shared/ToolbarCard";
import TableControls from "../shared/TableControls";
import PaginationFooter from "../shared/PaginationFooter";
import PeriodicHealthCheckupFilterModal from "./PeriodicHealthCheckupFilterModal";
import { exportPeriodicHealthCheckupToExcel } from "./PeriodicHealthCheckupExcel";
import PeriodicHealthCheckupExcelModal, { ExportConfig } from "./PeriodicHealthCheckupExcelModal";

dayjs.extend(isBetween);

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

const styles = `
  .dashboard-container {
    padding: 24px;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    min-height: 100vh;
    display: grid;
    gap: 16px;
  }
  .header-card {
    background: #fff;
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
  .toolbar {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 16px;
  }
  .filter-card {
    background: rgba(255, 255, 255, 0.9);
    border-radius: 8px;
    padding: 12px;
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
    margin-bottom: 16px;
  }
  .stats-card {
    background: #fff;
    border-radius: 8px;
    padding: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    transition: all 0.3s;
  }
  .stats-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  }
  .checkup-card {
    background: linear-gradient(145deg, #ffffff 0%, #f9f9f9 100%);
    border-radius: 12px;
    padding: 12px;
    margin-bottom: 12px;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.06);
    transition: all 0.3s;
    cursor: pointer;
  }
  .checkup-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
  }
  .action-button {
    border-radius: 8px;
    transition: all 0.3s;
  }
  .action-button:hover {
    transform: scale(1.05);
  }
  .search-input {
    border-radius: 8px !important;
    border: 1px solid #d9d9d9;
    box-shadow: none;
    width: 100%;
    max-width: 300px;
  }
  .tab-container {
    background: #fff;
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
  .tab-content {
    padding: 16px;
  }
  .virtual-list {
    padding: 0 8px;
    height: calc(100vh - 300px);
    min-height: 400px;
  }
  .paginated-list {
    padding: 0 8px;
    height: calc(100vh - 350px);
    min-height: 350px;
    overflow-y: auto;
  }
  .pagination-container {
    display: flex;
    justify-content: center;
    margin-top: 16px;
  }
  .status-section {
    padding-top: 8px;
    border-top: 1px solid #f0f0f0;
    margin-top: 8px;
  }
  @media (max-width: 768px) {
    .virtual-list, .paginated-list {
      height: calc(100vh - 350px);
      min-height: 350px;
    }
  }
  @media (max-width: 576px) {
    .virtual-list, .paginated-list {
      height: calc(100vh - 400px);
      min-height: 300px;
    }
  }
  .status-tag {
    min-width: 100px;
    text-align: center;
    padding: 4px 8px;
    font-size: 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(0, 0, 0, 0.1);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }
  .status-tab {
    font-weight: 500;
    font-size: 14px;
    padding: 8px 16px;
    border-radius: 8px;
    transition: all 0.3s ease;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: #ffffff;
    border: 1px solid #d9d9d9;
    color: #595959;
  }
  .status-tab.student {
    border-color: #1890ff;
    color: #1890ff;
  }
  .status-tab.staff {
    border-color: #722ed1;
    color: #722ed1;
  }
  .status-tab.student-inactive {
    border-color: #ff4d4f;
    color: #ff4d4f;
  }
  .status-tab.staff-inactive {
    border-color: #fa541c;
    color: #fa541c;
  }
  .status-tab.all {
    border-color: #595959;
    color: #595959;
  }
  .status-tab:hover {
    background: #f5f5f5;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  .ant-tabs-tab-active .status-tab {
    background: #e6f7ff;
    font-weight: 600;
    border-color: #1890ff;
  }
  .ant-tabs-tab-active .status-tab.student {
    border-color: #1890ff;
  }
  .ant-tabs-tab-active .status-tab.staff {
    background: #f9f0ff;
    border-color: #722ed1;
  }
  .ant-tabs-tab-active .status-tab.student-inactive {
    background: #fff1f0;
    border-color: #ff4d4f;
  }
  .ant-tabs-tab-active .status-tab.staff-inactive {
    background: #fff2e8;
    border-color: #fa541c;
  }
  .ant-tabs-tab-active .status-tab.all {
    background: #f5f5f5;
    border-color: #595959;
  }
  .status-badge {
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 12px;
    line-height: 1.5;
  }
  .ant-modal-confirm-body {
    .ant-modal-confirm-title {
      font-size: 18px;
      font-weight: 600;
      color: #1d39c4;
    }
    .ant-modal-confirm-content {
      margin-top: 12px;
      line-height: 1.5;
    }
  }
  @media (max-width: 768px) {
    .dashboard-container {
      padding: 16px;
      gap: 12px;
    }
    .header-card {
      padding: 12px;
    }
    .toolbar {
      justify-content: center;
    }
    .filter-card {
      flex-direction: column;
      align-items: stretch;
      gap: 8px;
    }
    .stats-grid {
      grid-template-columns: 1fr;
    }
    .checkup-card {
      padding: 8px;
    }
    .action-button {
      font-size: 12px;
      padding: 4px 8px;
    }
    .status-tag {
      min-width: 80px;
      font-size: 10px;
      padding: 2px 6px;
    }
    .status-tab {
      font-size: 12px;
      padding: 6px 12px;
    }
    .status-badge {
      font-size: 10px;
      padding: 1px 6px;
    }
    .tab-container {
      padding: 12px;
    }
    .tab-content {
      padding: 12px;
    }
  }
  @media (max-width: 576px) {
    .dashboard-container {
      padding: 8px;
    }
    .toolbar {
      flex-direction: column;
      align-items: stretch;
    }
    .action-button {
      width: 100%;
    }
    .search-input {
      max-width: 100%;
    }
  }
`;

export interface EnhancedStudentCheckup {
  id: string;
  periodicHealthCheckUpId: string;
  mssv: string;
  fullName?: string;
  gender?: string;
  status: string;
  conclusion?: string;
  createdAt: string;
  createdBy: string;
  heightCm?: number;
  weightKg?: number;
  bmi?: number;
  bloodPressure?: string;
  nextCheckupDate?: string;
  recommendations?: string;
  pulseRate?: number;
  internalMedicineStatus?: string;
  surgeryStatus?: string;
  dermatologyStatus?: string;
  entStatus?: string;
  eyeRightScore?: number;
  eyeLeftScore?: number;
  eyePathology?: string;
  dentalOralStatus?: string;
}

export interface EnhancedStaffCheckup {
  id: string;
  periodicHealthCheckUpId: string;
  fullName?: string;
  gender?: string;
  status: string;
  conclusion?: string;
  createdAt: string;
  createdBy: string;
  hospitalName: string;
  reportIssuanceDate: string;
  bloodGlucose?: number;
  cholesterol?: number;
  recommendations?: string;
  completeBloodCount?: string;
  completeUrinalysis?: string;
  hbA1c?: number;
  uricAcid?: number;
  triglycerides?: number;
  hdl?: number;
  ldl?: number;
  sgot?: number;
  sgpt?: number;
  ggt?: number;
  urea?: number;
  creatinine?: number;
  hbsAg?: boolean;
  hbsAb?: boolean;
  hcvab?: boolean;
  antiHavigM?: boolean;
  hiv?: boolean;
  serumIron?: number;
  thyroidT3?: number;
  thyroidFt4?: number;
  thyroidTsh?: number;
  bloodType?: string;
  rhType?: string;
  totalCalcium?: number;
  liverAfp?: number;
  prostatePsa?: number;
  colonCea?: number;
  stomachCa724?: number;
  pancreasCa199?: number;
  breastCa153?: number;
  ovariesCa125?: number;
  lungCyfra211?: number;
  ferritin?: number;
  toxocaraCanis?: boolean;
  rf?: number;
  electrolytesNa?: number;
  electrolytesK?: number;
  electrolytesCl?: number;
  generalExam?: string;
  eyeExam?: string;
  dentalExam?: string;
  entExam?: string;
  gynecologicalExam?: string;
  vaginalWetMount?: string;
  cervicalCancerPap?: string;
  abdominalUltrasound?: string;
  thyroidUltrasound?: string;
  breastUltrasound?: string;
  ecg?: string;
  chestXRay?: string;
  lumbarSpineXRay?: string;
  cervicalSpineXRay?: string;
  refractiveError?: string;
  dopplerHeart?: string;
  carotidDoppler?: string;
  transvaginalUltrasound?: string;
  boneDensityTScore?: number;
  echinococcus?: boolean;
  dermatologyExam?: string;
  hospitalReportUrl?: string;
  updatedAt?: string;
  updatedBy?: string;
}

interface State {
  studentCheckups: EnhancedStudentCheckup[];
  staffCheckups: EnhancedStaffCheckup[];
  loading: boolean;
  actionLoading: string | null;
  searchText: string;
  dateRange: [Dayjs, Dayjs] | null;
  studentModalVisible: boolean;
  staffModalVisible: boolean;
  detailModalVisible: boolean;
  updateStudentModalVisible: boolean;
  updateStaffModalVisible: boolean;
  selectedCheckup: EnhancedStudentCheckup | EnhancedStaffCheckup | null;
  selectedStudentCheckup: EnhancedStudentCheckup | null;
  activeTab: "all" | "student" | "staff" | "student-inactive" | "staff-inactive";
  currentPage: number;
  pageSize: number;
  excelModalVisible: boolean;
  exportLoading: boolean;
}

type Action =
  | {
      type: "SET_DATA";
      payload: {
        studentCheckups: EnhancedStudentCheckup[];
        staffCheckups: EnhancedStaffCheckup[];
      };
    }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ACTION_LOADING"; payload: string | null }
  | { type: "SET_SEARCH_TEXT"; payload: string }
  | { type: "SET_DATE_RANGE"; payload: [Dayjs, Dayjs] | null }
  | {
      type: "TOGGLE_MODAL";
      payload: {
        modal: "student" | "staff" | "detail" | "updateStudent" | "updateStaff" | "excel";
        visible: boolean;
      };
    }
  | {
      type: "SET_SELECTED_CHECKUP";
      payload: EnhancedStudentCheckup | EnhancedStaffCheckup | null;
    }
  | {
      type: "SET_SELECTED_STUDENT_CHECKUP";
      payload: EnhancedStudentCheckup | null;
    }
  | {
      type: "SET_ACTIVE_TAB";
      payload: "all" | "student" | "staff" | "student-inactive" | "staff-inactive";
    }
  | { type: "SET_CURRENT_PAGE"; payload: number }
  | { type: "SET_PAGE_SIZE"; payload: number }
  | { type: "SET_EXPORT_LOADING"; payload: boolean };

const initialState: State = {
  studentCheckups: [],
  staffCheckups: [],
  loading: true,
  actionLoading: null,
  searchText: "",
  dateRange: null,
  studentModalVisible: false,
  staffModalVisible: false,
  detailModalVisible: false,
  updateStudentModalVisible: false,
  updateStaffModalVisible: false,
  selectedCheckup: null,
  selectedStudentCheckup: null,
  activeTab: "all",
  currentPage: 1,
  pageSize: 10,
  excelModalVisible: false,
  exportLoading: false,
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "SET_DATA":
      return {
        ...state,
        studentCheckups:
          action.payload.studentCheckups ?? state.studentCheckups,
        staffCheckups: action.payload.staffCheckups ?? state.staffCheckups,
      };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ACTION_LOADING":
      return { ...state, actionLoading: action.payload };
    case "SET_SEARCH_TEXT":
      return { ...state, searchText: action.payload, currentPage: 1 };
    case "SET_DATE_RANGE":
      return { ...state, dateRange: action.payload, currentPage: 1 };
    case "TOGGLE_MODAL":
      return {
        ...state,
        ...(action.payload.modal === "student" && {
          studentModalVisible: action.payload.visible,
        }),
        ...(action.payload.modal === "staff" && {
          staffModalVisible: action.payload.visible,
        }),
        ...(action.payload.modal === "detail" && {
          detailModalVisible: action.payload.visible,
        }),
        ...(action.payload.modal === "updateStudent" && {
          updateStudentModalVisible: action.payload.visible,
        }),
        ...(action.payload.modal === "updateStaff" && {
          updateStaffModalVisible: action.payload.visible,
        }),
        ...(action.payload.modal === "excel" && {
          excelModalVisible: action.payload.visible,
        }),
      };
    case "SET_SELECTED_CHECKUP":
      return { ...state, selectedCheckup: action.payload };
    case "SET_SELECTED_STUDENT_CHECKUP":
      return { ...state, selectedStudentCheckup: action.payload };
    case "SET_ACTIVE_TAB":
      return { ...state, activeTab: action.payload, currentPage: 1 };
    case "SET_CURRENT_PAGE":
      return { ...state, currentPage: action.payload };
    case "SET_PAGE_SIZE":
      return { ...state, pageSize: action.payload };
    case "SET_EXPORT_LOADING":
      return { ...state, exportLoading: action.payload };
    default:
      return state;
  }
};

// Custom confirmation hook
const useConfirm = () => {
  const confirm = (
    title: string,
    content: string | React.ReactNode,
    onOk: () => void,
    onCancel?: () => void
  ) => {
    Modal.confirm({
      title,
      icon: <ExclamationCircleOutlined />,
      content,
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "No, Cancel",
      onOk,
      onCancel,
      centered: true,
      maskClosable: true,
      transitionName: "ant-fade",
      bodyStyle: { padding: "20px" },
    });
  };
  return confirm;
};

const getStatusColor = (status: string | undefined) => {
  switch (status) {
    case "Active":
      return "green";
    case "Inactive":
      return "red";
    default:
      return "default";
  }
};

const getStatusIcon = (status: string | undefined) => {
  switch (status) {
    case "Active":
      return <CheckCircleOutlined />;
    case "Inactive":
      return <DeleteOutlined />;
    default:
      return null;
  }
};

const getStatusTooltip = (status: string | undefined) => {
  switch (status) {
    case "Active":
      return "Active health checkup.";
    case "Inactive":
      return "Inactive health checkup.";
    default:
      return "";
  }
};

// Hàm định dạng mặc định nếu không có getFormattedCreatedBy trong props
const defaultFormatCreatedBy = (createdBy: string | undefined): string => {
  if (!createdBy) return "Unknown";
  
  // Nếu createdBy chứa @ (email), lấy phần trước @
  if (createdBy.includes('@')) {
    return createdBy.split('@')[0];
  }
  
  // Nếu createdBy chứa | (format ID|name), lấy phần sau |
  if (createdBy.includes('|')) {
    const parts = createdBy.split('|');
    return parts[parts.length - 1];
  }
  
  // Nếu là UUID, hiển thị rút gọn
  if (createdBy.length > 20) {
    return `User ${createdBy.substring(0, 6)}...`;
  }
  
  // Nếu không thì trả về chính createdBy
  return createdBy;
};

export function PeriodicHealthCheckupManagement() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const router = useRouter();
  const confirm = useConfirm();
  const [messageApi, contextHolder] = message.useMessage();
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [usernames, setUsernames] = useState<Record<string, string>>({});
  const [filterModalVisible, setFilterModalVisible] = useState<boolean>(false);
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);
  const [filterParams, setFilterParams] = useState<{
    studentSearch: string;
    staffSearch: string;
    dateRange: [Dayjs | null, Dayjs | null] | null;
    ascending: boolean;
  }>({
    studentSearch: "",
    staffSearch: "",
    dateRange: null,
    ascending: false, // Default to newest first
  });

  // Kiểm tra tham số tab từ URL để đặt active tab khi trang được tải
  useEffect(() => {
    const { tab } = router.query;
    if (tab && typeof tab === 'string') {
      const validTabs = ["all", "student", "staff", "student-inactive", "staff-inactive"];
      if (validTabs.includes(tab)) {
        dispatch({
          type: "SET_ACTIVE_TAB",
          payload: tab as "all" | "student" | "staff" | "student-inactive" | "staff-inactive",
        });
      }
    }
  }, [router.query]);

  const rangePresets: { label: string; value: [Dayjs, Dayjs] }[] = [
    { label: "Today", value: [dayjs(), dayjs()] },
    {
      label: "This Week",
      value: [dayjs().startOf("week"), dayjs().endOf("week")],
    },
    {
      label: "This Month",
      value: [dayjs().startOf("month"), dayjs().endOf("month")],
    },
  ];

  const fetchDetailedCheckup = useCallback(
    async (
      checkupId: string,
      token: string
    ): Promise<{
      id: string;
      periodicHealthCheckUpId: string;
      fullName?: string;
      gender?: string;
      status: string;
      conclusion?: string;
      createdAt: string;
      createdBy: string;
    }> => {
      const result = await getHealthCheckupByCheckupId(checkupId, token);
      console.log('API Response for checkup details:', result); // Log toàn bộ response
      
      if (result.isSuccess && result.data) {
        const data = result.data;
        console.log('Raw createdBy from API:', data.createdBy); // Log giá trị createdBy từ API
        console.log('User info:', data.user); // Log thông tin user nếu có
        
        // Thử lấy thông tin người tạo từ user nếu có thể
        let createdByInfo = data.createdBy || "Unknown";
        // Nếu người tạo là chính người dùng hiện tại, thì sử dụng tên của họ
        if (data.user && data.user.id === data.createdBy) {
          createdByInfo = data.user.fullName || data.user.userName || createdByInfo;
        }
        // Nếu người tạo là nhân viên, thì sử dụng tên của họ
        else if (data.staff && data.staff.id === data.createdBy) {
          createdByInfo = data.staff.fullName || createdByInfo;
        }
        
        return {
          id: data.id,
          periodicHealthCheckUpId: data.id,
          fullName:
            data.user?.fullName || data.staff?.fullName || "Unknown Name",
          gender: data.user?.gender || data.staff?.gender || "N/A",
          status: data.status,
          conclusion: data.classification || "",
          createdAt: data.createdAt || dayjs().toISOString(),
          createdBy: createdByInfo,
        };
      }
      return {
        id: checkupId,
        periodicHealthCheckUpId: checkupId,
        fullName: "Unknown Name",
        gender: "N/A",
        status: "Unknown",
        conclusion: "",
        createdAt: dayjs().toISOString(),
        createdBy: "Unknown",
      };
    },
    []
  );

  const fetchData = useCallback(
    async (retryCount = 0) => {
      dispatch({ type: "SET_LOADING", payload: true });
      try {
        const token = Cookies.get("token");
        if (!token) throw new Error("No token found");

        const studentPromise = getAllStudentHealthCheckups(
          undefined,
          undefined,
          undefined,
          "CreatedAt",
          false,
          token
        ).catch((error) => ({
          isSuccess: false,
          message: error.message || "Student fetch failed",
          data: [],
        }));

        const staffPromise = getAllStaffHealthCheckups(
          undefined,
          undefined,
          undefined,
          "CreatedAt",
          false,
          token
        ).catch((error) => ({
          isSuccess: false,
          message: error.message || "Staff fetch failed",
          data: [],
        }));

        const [studentResult, staffResult] = await Promise.all([
          studentPromise,
          staffPromise,
        ]);

        let enhancedStudentCheckups: EnhancedStudentCheckup[] = [];
        if (studentResult.isSuccess && studentResult.data) {
          enhancedStudentCheckups = await Promise.all(
            studentResult.data.map(async (checkup) => {
              const detailed = await fetchDetailedCheckup(
                checkup.periodicHealthCheckUpId,
                token
              );
              return {
                ...detailed,
                ...checkup,
                mssv: checkup.mssv || "Unknown MSSV",
              };
            })
          );
        } else if (
          !studentResult.isSuccess &&
          studentResult.message !==
            "No active student health checkup details found"
        ) {
          console.warn("Student data fetch warning:", studentResult.message);
        }

        let enhancedStaffCheckups: EnhancedStaffCheckup[] = [];
        if (staffResult.isSuccess && staffResult.data) {
          enhancedStaffCheckups = await Promise.all(
            staffResult.data.map(async (checkup) => {
              const detailed = await fetchDetailedCheckup(
                checkup.periodicHealthCheckUpId,
                token
              );
              return {
                ...detailed,
                ...checkup,
                createdBy: checkup.createdBy || detailed.createdBy || "Unknown",
                hospitalName: checkup.hospitalName || "Unknown Hospital",
                reportIssuanceDate:
                  checkup.reportIssuanceDate || dayjs().toISOString(),
                updatedBy: checkup.updatedBy,
              };
            })
          );
        } else if (
          !staffResult.isSuccess &&
          staffResult.message !== "No active staff health checkup details found"
        ) {
          console.warn("Staff data fetch warning:", staffResult.message);
        }

        dispatch({
          type: "SET_DATA",
          payload: {
            studentCheckups: enhancedStudentCheckups,
            staffCheckups: enhancedStaffCheckups,
          },
        });

        if (
          !studentResult.isSuccess &&
          studentResult.message !==
            "No active student health checkup details found" &&
          !staffResult.isSuccess &&
          staffResult.message !== "No active staff health checkup details found"
        ) {
          throw new Error(
            `${studentResult.message || "Student fetch failed"} | ${
              staffResult.message || "Staff fetch failed"
            }`
          );
        }
      } catch (error: any) {
        if (retryCount < 2) {
          toast.warn(`Retrying... (${retryCount + 1}/3)`);
          setTimeout(() => fetchData(retryCount + 1), 1000);
        } else {
          toast.error(`Failed to load data: ${error.message}`);
          if (error.message === "No token found") router.push("/");
        }
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    [fetchDetailedCheckup, router]
  );

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) {
      router.push("/");
      return;
    }
    fetchData();
  }, [fetchData, router]);

  const handleRefresh = () => fetchData();

  const handleDelete = useCallback(
    async (
      checkup: EnhancedStudentCheckup | EnhancedStaffCheckup,
      type: "student" | "staff"
    ) => {
      dispatch({ type: "SET_ACTION_LOADING", payload: checkup.id });
      try {
        const token = Cookies.get("token");
        if (!token) throw new Error("No authentication token found");

        const parentResponse = await deleteParentHealthCheckup(
          checkup.periodicHealthCheckUpId,
          token
        );
        if (!parentResponse.isSuccess) {
          throw new Error(
            parentResponse.message || "Failed to delete parent health checkup"
          );
        }

        const subtableDelete =
          type === "student"
            ? deleteStudentHealthCheckup
            : deleteStaffHealthCheckup;
        const subtableResponse = await subtableDelete(checkup.id, token);
        if (!subtableResponse.isSuccess) {
          throw new Error(
            subtableResponse.message ||
              `Failed to delete ${type} health checkup`
          );
        }

        toast.success("Deleted successfully!");
        await fetchData();
      } catch (error: any) {
        toast.error(`Error: ${error.message}`);
        if (error.message === "No authentication token found") router.push("/");
      } finally {
        dispatch({ type: "SET_ACTION_LOADING", payload: null });
      }
    },
    [fetchData, router]
  );

  const handleDeleteClick = useCallback(
    (
      checkup: EnhancedStudentCheckup | EnhancedStaffCheckup,
      e: React.MouseEvent
    ) => {
      e.stopPropagation();
      confirm(
        "Confirm Deletion",
        <div>
          <p>Are you sure you want to delete the health checkup for:</p>
          <p>
            <strong>{checkup.fullName || checkup.id}</strong>?
          </p>
          <p style={{ color: "#ff4d4f", marginTop: "8px" }}>
            This action cannot be undone.
          </p>
        </div>,
        () =>
          handleDelete(checkup, "mssv" in checkup ? "student" : "staff"),
        () => console.log("Deletion cancelled")
      );
    },
    [handleDelete, confirm]
  );

  const handleUpdateClick = useCallback(
    (
      checkup: EnhancedStudentCheckup | EnhancedStaffCheckup,
      e: React.MouseEvent
    ) => {
      e.stopPropagation();
      if ("mssv" in checkup) {
        // For student checkups, redirect to detail page with edit mode
        router.push(`/periodic-health-checkup/${checkup.id}?edit=true`);
      } else {
        // For staff checkups, also redirect to detail page with edit mode
        router.push(`/periodic-health-checkup/staff/${checkup.id}?edit=true`);
      }
    },
    [router]
  );

  const debouncedSetSearchText = useMemo(
    () =>
      debounce(
        (value: string) =>
          dispatch({ type: "SET_SEARCH_TEXT", payload: value }),
        300
      ),
    []
  );

  const resetFilters = () => {
    dispatch({ type: "SET_SEARCH_TEXT", payload: "" });
    dispatch({ type: "SET_DATE_RANGE", payload: null });
    dispatch({ type: "SET_CURRENT_PAGE", payload: 1 });
    setSelectedStatus(undefined);
    setFilterParams({
      studentSearch: "",
      staffSearch: "",
      dateRange: null,
      ascending: false,
    });
  };

  const handleDateRangeChange = (
    dates: [Dayjs | null, Dayjs | null] | null
  ) => {
    dispatch({
      type: "SET_DATE_RANGE",
      payload: dates && dates[0] && dates[1] ? [dates[0], dates[1]] : null,
    });
  };

  const handlePageChange = (page: number) => {
    dispatch({ type: "SET_CURRENT_PAGE", payload: page });
  };

  const handleUpdateSuccess = async (
    updatedCheckup?: PeriodicHealthCheckupsDetailsStaffResponseDTO
  ) => {
    if (updatedCheckup) {
      const token = Cookies.get("token");
      if (!token) {
        router.push("/");
        return;
      }
      const detailed = await fetchDetailedCheckup(
        updatedCheckup.periodicHealthCheckUpId,
        token
      );
      const enhancedCheckup: EnhancedStaffCheckup = {
        ...detailed,
        ...updatedCheckup,
        createdBy: updatedCheckup.createdBy || detailed.createdBy || "Unknown",
        hospitalName: updatedCheckup.hospitalName || "Unknown Hospital",
        reportIssuanceDate:
          updatedCheckup.reportIssuanceDate || dayjs().toISOString(),
      };

      dispatch({
        type: "SET_DATA",
        payload: {
          staffCheckups: state.staffCheckups.map((checkup) =>
            checkup.id === enhancedCheckup.id ? enhancedCheckup : checkup
          ),
          studentCheckups: state.studentCheckups,
        },
      });
      dispatch({ type: "SET_SELECTED_CHECKUP", payload: enhancedCheckup });
    }
    fetchData();
  };

  useEffect(() => {
    console.log("Staff checkups updated:", state.staffCheckups);
  }, [state.staffCheckups]);

  const summaryStats = useMemo(() => {
    return {
      total: state.studentCheckups.length + state.staffCheckups.length,
      active:
        state.studentCheckups.filter((c) => c.status === "Active").length +
        state.staffCheckups.filter((c) => c.status === "Active").length,
      inactiveStudents: state.studentCheckups.filter(
        (c) => c.status === "Inactive"
      ).length,
      inactiveStaff: state.staffCheckups.filter((c) => c.status === "Inactive")
        .length,
    };
  }, [state.studentCheckups, state.staffCheckups]);

  const handleDropdownVisibleChange = (open: boolean) => {
    setDropdownOpen(open);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const isEnhancedStaffCheckup = (
    checkup: EnhancedStudentCheckup | EnhancedStaffCheckup | null
  ): checkup is EnhancedStaffCheckup => {
    return (
      checkup !== null &&
      "hospitalName" in checkup &&
      "reportIssuanceDate" in checkup
    );
  };

  const handleBack = () => {
    router.back();
  };

  const handleBulkDelete = async () => {
    confirm(
      "Confirm Bulk Deletion",
      <div>
        <p>Are you sure you want to delete {selectedRowKeys.length} selected checkups?</p>
        <p style={{ color: "#ff4d4f", marginTop: "8px" }}>
          This action cannot be undone.
        </p>
      </div>,
      async () => {
        try {
          for (const key of selectedRowKeys) {
            const checkupId = key.toString();
            const checkup = [...state.studentCheckups, ...state.staffCheckups].find(c => c.id === checkupId);
            if (checkup) {
              await handleDelete(
                checkup, 
                "mssv" in checkup ? "student" : "staff"
              );
            }
          }
          setSelectedRowKeys([]);
          toast.success("Selected checkups deleted successfully!");
        } catch (error) {
          toast.error("Failed to delete some checkups");
        }
      }
    );
  };

  // Hook để lấy và lưu trữ usernames
  const fetchAndCacheUsernames = useCallback(async (userIds: string[]) => {
    const newUsernames: Record<string, string> = { ...usernames };
    let hasNewUsernames = false;

    for (const userId of userIds) {
      // Bỏ qua ID đã có trong cache
      if (usernames[userId]) continue;

      try {
        const user = await getUserById(userId);
        if (user && (user.userName || user.fullName)) {
          newUsernames[userId] = user.userName || user.fullName;
          hasNewUsernames = true;
          console.log(`Cached username for ${userId}: ${newUsernames[userId]}`);
        }
      } catch (error) {
        console.error(`Error fetching user ${userId}:`, error);
      }
    }

    // Cập nhật state nếu có usernames mới
    if (hasNewUsernames) {
      setUsernames(newUsernames);
    }
  }, [usernames]);

  // Hàm định dạng createdBy với usernames đã cache
  const getFormattedCreatedBy = useCallback((createdBy: string | undefined): string => {
    if (!createdBy) return "Unknown";
    
    // Nếu đã có trong cache usernames
    if (usernames[createdBy]) {
      return usernames[createdBy];
    }
    
    // Sử dụng hàm định dạng mặc định
    return defaultFormatCreatedBy(createdBy);
  }, [usernames]);

  // Lấy tất cả các ID người tạo khi dữ liệu thay đổi
  useEffect(() => {
    const creatorIds = [
      ...state.studentCheckups.map(c => c.createdBy).filter(Boolean) as string[],
      ...state.staffCheckups.map(c => c.createdBy).filter(Boolean) as string[]
    ];
    
    // Lọc các ID có dạng UUID (dài hơn 20 ký tự)
    const uuidCreatorIds = creatorIds.filter(id => id.length > 20);
    
    if (uuidCreatorIds.length > 0) {
      fetchAndCacheUsernames(uuidCreatorIds);
    }
  }, [state.studentCheckups, state.staffCheckups, fetchAndCacheUsernames]);

  // Generate student and staff options for filter
  const studentOptions = useMemo(() => {
    const uniqueStudents = new Map();
    state.studentCheckups.forEach(checkup => {
      if (checkup.fullName) {
        uniqueStudents.set(checkup.id, {
          id: checkup.id,
          name: checkup.fullName
        });
      }
    });
    return Array.from(uniqueStudents.values());
  }, [state.studentCheckups]);

  const staffOptions = useMemo(() => {
    const uniqueStaff = new Map();
    state.staffCheckups.forEach(checkup => {
      if (checkup.fullName) {
        uniqueStaff.set(checkup.id, {
          id: checkup.id,
          name: checkup.fullName
        });
      }
    });
    return Array.from(uniqueStaff.values());
  }, [state.staffCheckups]);

  // Apply filters to checkups
  const filteredCheckups = useMemo(() => {
    const checkups =
      state.activeTab === "all"
        ? [...state.studentCheckups, ...state.staffCheckups]
        : state.activeTab.includes("student")
        ? state.studentCheckups
        : state.staffCheckups;

    return checkups.filter((checkup) => {
      // Apply search text filter
      const matchesSearch = state.searchText
        ? checkup.id.toLowerCase().includes(state.searchText.toLowerCase()) ||
          ("mssv" in checkup &&
            checkup.mssv &&
            checkup.mssv
              .toLowerCase()
              .includes(state.searchText.toLowerCase())) ||
          (checkup.fullName &&
            checkup.fullName
              .toLowerCase()
              .includes(state.searchText.toLowerCase())) ||
          (checkup.conclusion &&
            checkup.conclusion
              .toLowerCase()
              .includes(state.searchText.toLowerCase()))
        : true;

      // Apply status filter
      const matchesStatus = selectedStatus
        ? checkup.status === selectedStatus
        : true;

      // Apply date range filter from state.dateRange
      const matchesStateDate =
        state.dateRange && checkup.createdAt
          ? dayjs(checkup.createdAt).isBetween(
              state.dateRange[0],
              state.dateRange[1],
              "day",
              "[]"
            )
          : true;

      // Apply date range filter from filterParams
      const matchesFilterDate =
        filterParams.dateRange && filterParams.dateRange[0] && filterParams.dateRange[1] && checkup.createdAt
          ? dayjs(checkup.createdAt).isBetween(
              filterParams.dateRange[0],
              filterParams.dateRange[1],
              "day",
              "[]"
            )
          : true;

      // Apply student name filter
      const matchesStudentName = 
        filterParams.studentSearch && "mssv" in checkup
          ? checkup.fullName?.toLowerCase().includes(filterParams.studentSearch.toLowerCase())
          : !filterParams.studentSearch || !("mssv" in checkup);

      // Apply staff name filter
      const matchesStaffName = 
        filterParams.staffSearch && !("mssv" in checkup)
          ? checkup.fullName?.toLowerCase().includes(filterParams.staffSearch.toLowerCase())
          : !filterParams.staffSearch || ("mssv" in checkup);

      return matchesSearch && matchesStatus && matchesStateDate && matchesFilterDate && matchesStudentName && matchesStaffName;
    }).sort((a, b) => {
      const dateA = dayjs(a.createdAt);
      const dateB = dayjs(b.createdAt);
      return filterParams.ascending 
        ? dateA.diff(dateB) // Oldest first
        : dateB.diff(dateA); // Newest first
    });
  }, [
    state.studentCheckups,
    state.staffCheckups,
    state.activeTab,
    state.searchText,
    state.dateRange,
    selectedStatus,
    filterParams,
  ]);

  // Apply pagination for "all" tab
  const paginatedCheckups = useMemo(() => {
    if (state.activeTab !== "all") return filteredCheckups;
    const startIndex = (state.currentPage - 1) * state.pageSize;
    const endIndex = startIndex + state.pageSize;
    return filteredCheckups.slice(startIndex, endIndex);
  }, [filteredCheckups, state.activeTab, state.currentPage, state.pageSize]);

  // Handle filter modal actions
  const handleFilterApply = (filters: any) => {
    setFilterParams(filters);
    setFilterModalVisible(false);
    dispatch({ type: "SET_CURRENT_PAGE", payload: 1 });
  };

  const handleFilterReset = () => {
    setFilterParams({
      studentSearch: "",
      staffSearch: "",
      dateRange: null,
      ascending: false,
    });
  };

  // Handle export to excel
  const handleExportToExcel = async (
    config: ExportConfig,
    dateRange?: [dayjs.Dayjs | null, dayjs.Dayjs | null]
  ) => {
    try {
      dispatch({ type: "SET_EXPORT_LOADING", payload: true });
      
      // Filter checkups by date range if provided
      let filteredStudentCheckups = [...state.studentCheckups];
      let filteredStaffCheckups = [...state.staffCheckups];
      
      if (dateRange && dateRange[0] && dateRange[1]) {
        const startDate = dateRange[0].startOf('day');
        const endDate = dateRange[1].endOf('day');
        
        filteredStudentCheckups = filteredStudentCheckups.filter(checkup => {
          const createdDate = dayjs(checkup.createdAt);
          return createdDate.isAfter(startDate) && createdDate.isBefore(endDate);
        });
        
        filteredStaffCheckups = filteredStaffCheckups.filter(checkup => {
          const createdDate = dayjs(checkup.createdAt);
          return createdDate.isAfter(startDate) && createdDate.isBefore(endDate);
        });
      }
      
      // Filter by currently active tab
      if (state.activeTab === "student") {
        filteredStaffCheckups = [];
        filteredStudentCheckups = filteredStudentCheckups.filter(c => c.status === "Active");
      } else if (state.activeTab === "staff") {
        filteredStudentCheckups = [];
        filteredStaffCheckups = filteredStaffCheckups.filter(c => c.status === "Active");
      } else if (state.activeTab === "student-inactive") {
        filteredStaffCheckups = [];
        filteredStudentCheckups = filteredStudentCheckups.filter(c => c.status === "Inactive");
      } else if (state.activeTab === "staff-inactive") {
        filteredStudentCheckups = [];
        filteredStaffCheckups = filteredStaffCheckups.filter(c => c.status === "Inactive");
      }
      
      // If "Export current page only" is selected
      if (!config.exportAllPages) {
        const startIndex = (state.currentPage - 1) * state.pageSize;
        const endIndex = state.currentPage * state.pageSize;
        
        filteredStudentCheckups = filteredStudentCheckups.slice(startIndex, endIndex);
        filteredStaffCheckups = filteredStaffCheckups.slice(startIndex, endIndex);
      }
      
      await exportPeriodicHealthCheckupToExcel(
        filteredStudentCheckups,
        filteredStaffCheckups,
        config,
        dateRange
      );
      
      dispatch({ type: "TOGGLE_MODAL", payload: { modal: "excel", visible: false } });
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      message.error("Failed to export data to Excel");
    } finally {
      dispatch({ type: "SET_EXPORT_LOADING", payload: false });
    }
  };

  if (state.loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <Spin size="large" tip="Loading health checkups..." />
      </div>
    );
  }

  return (
    <PageContainer
      title="Periodic Health Checkup Management"
      icon={<MedicineBoxOutlined style={{ fontSize: "24px" }} />}
      onBack={handleBack}
    >
      {contextHolder}

      {/* Tabs for different checkup statuses */}
      <Tabs
        activeKey={state.activeTab}
        onChange={(key) =>
          dispatch({
            type: "SET_ACTIVE_TAB",
            payload: key as
              | "all"
              | "student"
              | "staff"
              | "student-inactive"
              | "staff-inactive",
          })
        }
        className="bg-white rounded shadow-sm"
        type="card"
      >
        <TabPane
          tab={
            <span>
              <DatabaseOutlined
                className="mr-2"
                style={{ color: "#595959" }}
              />
            All Checkups
            <Badge
                className="ml-2"
              style={{ backgroundColor: "#595959" }}
            />
          </span>
          }
          key="all"
        />
        <TabPane
          tab={
            <span>
              <UserOutlined
                className="mr-2"
                style={{ color: "#1890ff" }}
              />
              Student Checkups
              <Badge
                className="ml-2"
                style={{ backgroundColor: "#1890ff" }}
              />
            </span>
          }
          key="student"
        />
        <TabPane
          tab={
            <span>
              <TeamOutlined
                className="mr-2"
                style={{ color: "#722ed1" }}
              />
              Staff Checkups
              <Badge
                className="ml-2"
                style={{ backgroundColor: "#722ed1" }}
              />
            </span>
          }
          key="staff"
        />
        <TabPane
          tab={
            <span>
              <StopOutlined
                className="mr-2"
                style={{ color: "#ff4d4f" }}
              />
              Inactive Student Checkups
              <Badge
                className="ml-2"
                style={{ backgroundColor: "#ff4d4f" }}
              />
            </span>
          }
          key="student-inactive"
        />
        <TabPane
          tab={
            <span>
              <StopOutlined
                className="mr-2"
                style={{ color: "#fa541c" }}
              />
              Inactive Staff Checkups
              <Badge
                className="ml-2"
                style={{ backgroundColor: "#fa541c" }}
              />
            </span>
          }
          key="staff-inactive"
        />
      </Tabs>

      {/* Toolbar */}
      <ToolbarCard
        leftContent={
          <>
            {/* Search Input */}
            <Input
              placeholder="Search by name"
              value={state.searchText}
              onChange={(e) => debouncedSetSearchText(e.target.value)}
              prefix={<SearchOutlined />}
              style={{ width: 250 }}
              allowClear
            />

            {/* Status Filter */}
            <Select
              placeholder="Status"
              value={selectedStatus}
              onChange={(value) => setSelectedStatus(value)}
              style={{ width: 110 }}
              allowClear
              options={[
                { value: "Active", label: "Active" },
                { value: "Inactive", label: "Inactive" }
              ]}
            />
            
            {/* Advanced Filter Button */}
            <Button icon={<FilterOutlined />} onClick={() => setFilterModalVisible(true)}>
              Filters
            </Button>
            
            {/* Reset Button */}
            <Button icon={<UndoOutlined />} onClick={resetFilters}>
            </Button>

            {/* Create Buttons */}
            <Dropdown
              menu={{
                items: [
                  {
                    key: "student",
                    label: "Add Student Checkup",
                    onClick: () => dispatch({
                      type: "TOGGLE_MODAL",
                      payload: { modal: "student", visible: true },
                    }),
                  },
                  {
                    key: "staff",
                    label: "Add Staff Checkup",
                    onClick: () => dispatch({
                      type: "TOGGLE_MODAL",
                      payload: { modal: "staff", visible: true },
                    }),
                  },
                ],
              }}
              placement="bottomLeft"
            >
              <Button type="primary" icon={<PlusOutlined />}>
                Create
              </Button>
            </Dropdown>
          </>
        }
        rightContent={
          <>
            {/* Export Button */}
            <Button
              type="primary"
              icon={<FileExcelOutlined />}
              onClick={() => dispatch({ 
                type: "TOGGLE_MODAL", 
                payload: { modal: "excel", visible: true } 
              })}
            >
              Export to Excel
            </Button>
          </>
        }
      />

      {/* Table Controls */}
      <TableControls
        selectedRowKeys={selectedRowKeys}
        pageSize={state.pageSize}
        onPageSizeChange={(size) => dispatch({ type: "SET_PAGE_SIZE", payload: size })}
        bulkActions={[
          {
            key: "delete",
            title: "Delete selected checkups",
            description: `Are you sure you want to delete ${selectedRowKeys.length} selected checkup(s)?`,
            icon: <DeleteOutlined />,
            buttonText: "Delete",
            buttonType: "primary",
            isDanger: true,
            tooltip: "Delete selected checkups",
            isVisible: selectedRowKeys.length > 0,
            isLoading: !!state.actionLoading,
            onConfirm: handleBulkDelete,
          },
        ]}
      />

      {/* Content area - based on active tab */}
      <div className="bg-white rounded shadow-sm p-4 mb-4">
        {state.loading ? (
          <div className="p-12 flex justify-center">
            <Spin size="large" />
          </div>
        ) : (
          <>
            {state.activeTab === "all" && (
          <CheckupList
            checkups={paginatedCheckups as (EnhancedStudentCheckup | EnhancedStaffCheckup)[]}
            type="all"
            actionLoading={state.actionLoading}
            onViewDetails={(checkup) => {
              if ("mssv" in checkup) {
                // For student checkups, navigate to the detail page
                router.push(`/periodic-health-checkup/${checkup.id}`);
              } else {
                // For staff checkups, navigate to staff detail page
                router.push(`/periodic-health-checkup/staff/${checkup.id}`);
              }
            }}
            handleDeleteClick={handleDeleteClick}
            handleUpdateClick={handleUpdateClick}
                isPaginated={false}
                pagination={null}
                selectedRowKeys={selectedRowKeys}
                setSelectedRowKeys={setSelectedRowKeys}
                usernames={usernames}
                getFormattedCreatedBy={getFormattedCreatedBy}
              />
            )}

            {state.activeTab === "student" && (
          <CheckupList
            checkups={
              filteredCheckups.filter((c) => c.status === "Active") as EnhancedStudentCheckup[]
            }
            type="student"
            actionLoading={state.actionLoading}
            onViewDetails={(checkup) => {
              // For student checkups, navigate to the detail page
              router.push(`/periodic-health-checkup/${checkup.id}`);
            }}
            handleDeleteClick={handleDeleteClick}
            handleUpdateClick={handleUpdateClick}
                selectedRowKeys={selectedRowKeys}
                setSelectedRowKeys={setSelectedRowKeys}
                usernames={usernames}
                getFormattedCreatedBy={getFormattedCreatedBy}
              />
            )}

            {state.activeTab === "staff" && (
          <CheckupList
            checkups={
              filteredCheckups.filter((c) => c.status === "Active") as EnhancedStaffCheckup[]
            }
            type="staff"
            actionLoading={state.actionLoading}
            onViewDetails={(checkup) => {
              // For staff checkups, navigate to staff detail page
              router.push(`/periodic-health-checkup/staff/${checkup.id}`);
            }}
            handleDeleteClick={handleDeleteClick}
            handleUpdateClick={handleUpdateClick}
                selectedRowKeys={selectedRowKeys}
                setSelectedRowKeys={setSelectedRowKeys}
                usernames={usernames}
                getFormattedCreatedBy={getFormattedCreatedBy}
              />
            )}

            {state.activeTab === "student-inactive" && (
          <CheckupList
            checkups={
              filteredCheckups.filter((c) => c.status === "Inactive") as EnhancedStudentCheckup[]
            }
            type="student"
            actionLoading={state.actionLoading}
            onViewDetails={(checkup) => {
              // For student checkups, navigate to the detail page
              router.push(`/periodic-health-checkup/${checkup.id}`);
            }}
            handleDeleteClick={handleDeleteClick}
            handleUpdateClick={handleUpdateClick}
                selectedRowKeys={selectedRowKeys}
                setSelectedRowKeys={setSelectedRowKeys}
                usernames={usernames}
                getFormattedCreatedBy={getFormattedCreatedBy}
              />
            )}

            {state.activeTab === "staff-inactive" && (
          <CheckupList
            checkups={
              filteredCheckups.filter((c) => c.status === "Inactive") as EnhancedStaffCheckup[]
            }
            type="staff"
            actionLoading={state.actionLoading}
            onViewDetails={(checkup) => {
              // For staff checkups, navigate to staff detail page
              router.push(`/periodic-health-checkup/staff/${checkup.id}`);
            }}
            handleDeleteClick={handleDeleteClick}
            handleUpdateClick={handleUpdateClick}
                selectedRowKeys={selectedRowKeys}
                setSelectedRowKeys={setSelectedRowKeys}
                usernames={usernames}
                getFormattedCreatedBy={getFormattedCreatedBy}
              />
            )}
          </>
        )}
      </div>

      {/* Pagination Footer */}
      <PaginationFooter
        current={state.currentPage}
        pageSize={state.pageSize}
        total={
          state.activeTab === "all"
            ? filteredCheckups.length
            : state.activeTab === "student"
            ? filteredCheckups.filter(c => c.status === "Active").length
            : state.activeTab === "staff"
            ? filteredCheckups.filter(c => c.status === "Active").length
            : state.activeTab === "student-inactive"
            ? filteredCheckups.filter(c => c.status === "Inactive").length
            : filteredCheckups.filter(c => c.status === "Inactive").length
        }
        onChange={handlePageChange}
        useItemsLabel={false}
      />

      {/* Modals */}
      <AddStudentHealthCheckupModal
        visible={state.studentModalVisible}
        onClose={() =>
          dispatch({
            type: "TOGGLE_MODAL",
            payload: { modal: "student", visible: false },
          })
        }
        onSuccess={handleRefresh}
      />

      <AddStaffHealthCheckupModal
        visible={state.staffModalVisible}
        onClose={() =>
          dispatch({
            type: "TOGGLE_MODAL",
            payload: { modal: "staff", visible: false },
          })
        }
        onSuccess={handleRefresh}
      />

      {("mssv" in (state.selectedCheckup || {}) || state.activeTab.includes("student")) ? (
        <CheckupDetailStudentModal
          visible={state.detailModalVisible}
          checkup={state.selectedCheckup as EnhancedStudentCheckup}
          onClose={() =>
            dispatch({
              type: "TOGGLE_MODAL",
              payload: { modal: "detail", visible: false },
            })
          }
        />
      ) : (
        <CheckupDetailStaffModal
          visible={state.detailModalVisible}
          checkup={state.selectedCheckup as EnhancedStaffCheckup}
          onClose={() =>
            dispatch({
              type: "TOGGLE_MODAL",
              payload: { modal: "detail", visible: false },
            })
          }
        />
      )}

      <UpdateStudentHealthCheckup
        visible={state.updateStudentModalVisible}
        checkup={state.selectedStudentCheckup}
        onClose={() =>
          dispatch({
            type: "TOGGLE_MODAL",
            payload: { modal: "updateStudent", visible: false },
          })
        }
        onSuccess={handleUpdateSuccess}
      />

      <UpdateStaffHealthCheckupModal
        visible={state.updateStaffModalVisible}
        checkup={
          isEnhancedStaffCheckup(state.selectedCheckup)
            ? state.selectedCheckup
            : null
        }
        onClose={() =>
          dispatch({
            type: "TOGGLE_MODAL",
            payload: { modal: "updateStaff", visible: false },
          })
        }
        onSuccess={handleUpdateSuccess}
      />

      {/* Filter Modal */}
      <PeriodicHealthCheckupFilterModal
        visible={filterModalVisible}
        onCancel={() => setFilterModalVisible(false)}
        onApply={handleFilterApply}
        onReset={handleFilterReset}
        filters={filterParams}
        studentOptions={studentOptions}
        staffOptions={staffOptions}
      />

      {/* Excel Export Modal */}
      <PeriodicHealthCheckupExcelModal
        visible={state.excelModalVisible}
        onCancel={() => dispatch({ 
          type: "TOGGLE_MODAL", 
          payload: { modal: "excel", visible: false } 
        })}
        onExport={handleExportToExcel}
        loading={state.exportLoading}
      />
    </PageContainer>
  );
}

interface CheckupListProps {
  checkups: (EnhancedStudentCheckup | EnhancedStaffCheckup)[];
  type: "student" | "staff" | "all";
  actionLoading: string | null;
  onViewDetails: (
    checkup: EnhancedStudentCheckup | EnhancedStaffCheckup
  ) => void;
  handleDeleteClick: (
    checkup: EnhancedStudentCheckup | EnhancedStaffCheckup,
    e: React.MouseEvent
  ) => void;
  handleUpdateClick: (
    checkup: EnhancedStudentCheckup | EnhancedStaffCheckup,
    e: React.MouseEvent
  ) => void;
  isPaginated?: boolean;
  pagination?: React.ReactNode;
  selectedRowKeys: React.Key[];
  setSelectedRowKeys: (keys: React.Key[]) => void;
  usernames?: Record<string, string>;
  getFormattedCreatedBy?: (createdBy: string | undefined) => string;
}

const CheckupList: React.FC<CheckupListProps> = React.memo(
  ({
    checkups,
    type,
    actionLoading,
    onViewDetails,
    handleDeleteClick,
    handleUpdateClick,
    isPaginated = false,
    pagination,
    selectedRowKeys,
    setSelectedRowKeys,
    usernames = {},
    getFormattedCreatedBy,
  }) => {
    // Sử dụng hàm định dạng từ props hoặc dùng hàm định dạng mặc định
    const formatCreatedByName = getFormattedCreatedBy || defaultFormatCreatedBy;

    return (
      <div className="bg-white">
        {checkups.length === 0 ? (
          <Empty description={`No ${type === "all" ? "health" : type} checkups found.`} />
        ) : (
          <List
            grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4, xl: 4, xxl: 4 }}
            dataSource={checkups}
            renderItem={(checkup) => {
              const isSelected = selectedRowKeys.includes(checkup.id);
              
              return (
                <List.Item>
                  <Card
                    hoverable
                    className="verification-card"
                    onClick={() => onViewDetails(checkup)}
                    style={{ height: '280px', display: 'flex', flexDirection: 'column' }}
                    bodyStyle={{ flex: 1, overflow: 'hidden', padding: '16px' }}
                    actions={[
                      <Button
                        key="view"
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewDetails(checkup);
                        }}
                      >
                        View
                      </Button>,
                      <Button
                        key="edit"
                        type="text"
                        icon={<FormOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateClick(checkup, e);
                        }}
                      >
                        Edit
                      </Button>,
                      checkup.status === "Active" && (
                        <Button
                          key="delete"
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(checkup, e);
                          }}
                          loading={actionLoading === checkup.id}
                          disabled={!!actionLoading}
                        >
                          Delete
                        </Button>
                      )
                    ].filter(Boolean)}
                  >
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      {/* Header with name and status */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar size="small" icon={<UserOutlined />} />
                          <div style={{ marginLeft: '6px', width: 'calc(100% - 32px)', overflow: 'hidden' }}>
                            <Tooltip title={checkup.fullName || ("mssv" in checkup ? checkup.mssv : 'Unknown')}>
                              <div style={{ fontSize: '15px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {checkup.fullName || ("mssv" in checkup ? checkup.mssv : 'Unknown')}
                              </div>
                            </Tooltip>
                            <div style={{ fontSize: '13px', color: '#888', marginTop: '1px' }}>
                              {"mssv" in checkup ? `Student ID: ${checkup.mssv}` : "Staff"}
                            </div>
                          </div>
                        </div>
                        <Tag color={getStatusColor(checkup.status)} icon={getStatusIcon(checkup.status)} style={{ padding: '2px 6px', height: '22px', lineHeight: '18px', fontSize: '13px' }}>
                          {checkup.status}
                        </Tag>
                      </div>
                      
                      {/* Content */}
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '3px' }}>
                          Health Information:
                        </div>
                        
                        {checkup.conclusion && (
                          <Tooltip title={`Conclusion: ${checkup.conclusion}`}>
                            <div style={{ fontSize: '13px', marginBottom: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              <span>Conclusion: </span>
                              <span style={{ fontWeight: 'bold' }}>{checkup.conclusion}</span>
                            </div>
                          </Tooltip>
                        )}
                        
                        <div style={{ fontSize: '13px', marginBottom: '3px' }}>
                          <span>Created At: </span>
                          <span style={{ fontWeight: 'bold' }}>{dayjs(checkup.createdAt).format("DD/MM/YYYY")}</span>
                        </div>
                        
                        <Tooltip title={`Created By: ${formatCreatedByName(checkup.createdBy)}`}>
                          <div style={{ fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            <span>Created By: </span>
                            <span style={{ fontWeight: 'bold' }}>{formatCreatedByName(checkup.createdBy)}</span>
                          </div>
                        </Tooltip>
                      </div>
                    </div>
                  </Card>
                </List.Item>
              );
            }}
          />
        )}
      </div>
    );
  }
);

CheckupList.displayName = "CheckupList";

export default PeriodicHealthCheckupManagement;