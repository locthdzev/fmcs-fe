import React, { useReducer, useEffect, useCallback, useMemo } from "react";
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

dayjs.extend(isBetween);

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

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

interface EnhancedStudentCheckup {
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

interface EnhancedStaffCheckup {
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
        modal: "student" | "staff" | "detail" | "updateStudent" | "updateStaff";
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
  | { type: "SET_CURRENT_PAGE"; payload: number };

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
      };
    case "SET_SELECTED_CHECKUP":
      return { ...state, selectedCheckup: action.payload };
    case "SET_SELECTED_STUDENT_CHECKUP":
      return { ...state, selectedStudentCheckup: action.payload };
    case "SET_ACTIVE_TAB":
      return { ...state, activeTab: action.payload, currentPage: 1 };
    case "SET_CURRENT_PAGE":
      return { ...state, currentPage: action.payload };
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

export function PeriodicHealthCheckupManagement() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const router = useRouter();
  const confirm = useConfirm();

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
      if (result.isSuccess && result.data) {
        const data = result.data;
        return {
          id: data.id,
          periodicHealthCheckUpId: data.id,
          fullName:
            data.user?.fullName || data.staff?.fullName || "Unknown Name",
          gender: data.user?.gender || data.staff?.gender || "N/A",
          status: data.status,
          conclusion: data.classification || "",
          createdAt: data.createdAt || dayjs().toISOString(),
          createdBy: data.createdBy || "Unknown",
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
        dispatch({
          type: "SET_SELECTED_STUDENT_CHECKUP",
          payload: checkup as EnhancedStudentCheckup,
        });
        dispatch({
          type: "TOGGLE_MODAL",
          payload: { modal: "updateStudent", visible: true },
        });
      } else {
        dispatch({
          type: "SET_SELECTED_CHECKUP",
          payload: checkup as EnhancedStaffCheckup,
        });
        dispatch({
          type: "TOGGLE_MODAL",
          payload: { modal: "updateStaff", visible: true },
        });
      }
    },
    []
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

  const filteredCheckups = useMemo(() => {
    const checkups =
      state.activeTab === "all"
        ? [...state.studentCheckups, ...state.staffCheckups]
        : state.activeTab.includes("student")
        ? state.studentCheckups
        : state.staffCheckups;
    const filtered = checkups.filter((checkup) => {
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
      const matchesDate =
        state.dateRange && checkup.createdAt
          ? dayjs(checkup.createdAt).isBetween(
              state.dateRange[0],
              state.dateRange[1],
              "day",
              "[]"
            )
          : true;
      return matchesSearch && matchesDate;
    });
    return filtered.sort((a, b) =>
      dayjs(b.createdAt).diff(dayjs(a.createdAt))
    );
  }, [
    state.studentCheckups,
    state.staffCheckups,
    state.activeTab,
    state.searchText,
    state.dateRange,
  ]);

  const paginatedCheckups = useMemo(() => {
    if (state.activeTab !== "all") return filteredCheckups;
    const startIndex = (state.currentPage - 1) * state.pageSize;
    const endIndex = startIndex + state.pageSize;
    return filteredCheckups.slice(startIndex, endIndex);
  }, [filteredCheckups, state.activeTab, state.currentPage, state.pageSize]);

  const resetFilters = () => {
    dispatch({ type: "SET_SEARCH_TEXT", payload: "" });
    dispatch({ type: "SET_DATE_RANGE", payload: null });
    dispatch({ type: "SET_CURRENT_PAGE", payload: 1 });
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

  const tabItems = useMemo(
    () => [
      {
        key: "all",
        label: (
          <span className="status-tab all">
            <DatabaseOutlined />
            All Checkups
            <Badge
              count={state.studentCheckups.length + state.staffCheckups.length}
              className="status-badge"
              style={{ backgroundColor: "#595959" }}
            />
          </span>
        ),
        children: (
          <CheckupList
            checkups={paginatedCheckups as (EnhancedStudentCheckup | EnhancedStaffCheckup)[]}
            type="all"
            actionLoading={state.actionLoading}
            onViewDetails={(checkup) => {
              dispatch({ type: "SET_SELECTED_CHECKUP", payload: checkup });
              dispatch({
                type: "TOGGLE_MODAL",
                payload: { modal: "detail", visible: true },
              });
            }}
            handleDeleteClick={handleDeleteClick}
            handleUpdateClick={handleUpdateClick}
            isPaginated
            pagination={
              <div className="pagination-container">
                <Pagination
                  current={state.currentPage}
                  pageSize={state.pageSize}
                  total={filteredCheckups.length}
                  onChange={handlePageChange}
                  showSizeChanger={false}
                  showQuickJumper
                />
              </div>
            }
          />
        ),
      },
      {
        key: "student",
        label: (
          <span className="status-tab student">
            <UserOutlined />
            Student Checkups
            <Badge
              count={
                state.studentCheckups.filter((c) => c.status === "Active").length
              }
              className="status-badge"
              style={{ backgroundColor: "#1890ff" }}
            />
          </span>
        ),
        children: (
          <CheckupList
            checkups={
              filteredCheckups.filter((c) => c.status === "Active") as EnhancedStudentCheckup[]
            }
            type="student"
            actionLoading={state.actionLoading}
            onViewDetails={(checkup) => {
              dispatch({ type: "SET_SELECTED_CHECKUP", payload: checkup });
              dispatch({
                type: "TOGGLE_MODAL",
                payload: { modal: "detail", visible: true },
              });
            }}
            handleDeleteClick={handleDeleteClick}
            handleUpdateClick={handleUpdateClick}
          />
        ),
      },
      {
        key: "staff",
        label: (
          <span className="status-tab staff">
            <TeamOutlined />
            Staff Checkups
            <Badge
              count={
                state.staffCheckups.filter((c) => c.status === "Active").length
              }
              className="status-badge"
              style={{ backgroundColor: "#722ed1" }}
            />
          </span>
        ),
        children: (
          <CheckupList
            checkups={
              filteredCheckups.filter((c) => c.status === "Active") as EnhancedStaffCheckup[]
            }
            type="staff"
            actionLoading={state.actionLoading}
            onViewDetails={(checkup) => {
              dispatch({ type: "SET_SELECTED_CHECKUP", payload: checkup });
              dispatch({
                type: "TOGGLE_MODAL",
                payload: { modal: "detail", visible: true },
              });
            }}
            handleDeleteClick={handleDeleteClick}
            handleUpdateClick={handleUpdateClick}
          />
        ),
      },
      {
        key: "student-inactive",
        label: (
          <span className="status-tab student-inactive">
            <StopOutlined />
            Inactive Student Checkups
            <Badge
              count={
                state.studentCheckups.filter((c) => c.status === "Inactive")
                  .length
              }
              className="status-badge"
              style={{ backgroundColor: "#ff4d4f" }}
            />
          </span>
        ),
        children: (
          <CheckupList
            checkups={
              filteredCheckups.filter((c) => c.status === "Inactive") as EnhancedStudentCheckup[]
            }
            type="student"
            actionLoading={state.actionLoading}
            onViewDetails={(checkup) => {
              dispatch({ type: "SET_SELECTED_CHECKUP", payload: checkup });
              dispatch({
                type: "TOGGLE_MODAL",
                payload: { modal: "detail", visible: true },
              });
            }}
            handleDeleteClick={handleDeleteClick}
            handleUpdateClick={handleUpdateClick}
          />
        ),
      },
      {
        key: "staff-inactive",
        label: (
          <span className="status-tab staff-inactive">
            <StopOutlined />
            Inactive Staff Checkups
            <Badge
              count={
                state.staffCheckups.filter((c) => c.status === "Inactive")
                  .length
              }
              className="status-badge"
              style={{ backgroundColor: "#fa541c" }}
            />
          </span>
        ),
        children: (
          <CheckupList
            checkups={
              filteredCheckups.filter((c) => c.status === "Inactive") as EnhancedStaffCheckup[]
            }
            type="staff"
            actionLoading={state.actionLoading}
            onViewDetails={(checkup) => {
              dispatch({ type: "SET_SELECTED_CHECKUP", payload: checkup });
              dispatch({
                type: "TOGGLE_MODAL",
                payload: { modal: "detail", visible: true },
              });
            }}
            handleDeleteClick={handleDeleteClick}
            handleUpdateClick={handleUpdateClick}
          />
        ),
      },
    ],
    [
      filteredCheckups,
      paginatedCheckups,
      state.actionLoading,
      state.studentCheckups,
      state.staffCheckups,
      state.currentPage,
      state.pageSize,
      handleDeleteClick,
      handleUpdateClick,
    ]
  );

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

  const isEnhancedStaffCheckup = (
    checkup: EnhancedStudentCheckup | EnhancedStaffCheckup | null
  ): checkup is EnhancedStaffCheckup => {
    return (
      checkup !== null &&
      "hospitalName" in checkup &&
      "reportIssuanceDate" in checkup
    );
  };

  if (state.loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <Spin size="large" tip="Loading health checkups..." />
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <style>{styles}</style>
      <Card className="header-card">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24}>
            <Title level={3} style={{ margin: 0, color: "#1d39c4" }}>
              Health Checkup Dashboard
            </Title>
          </Col>
          <Col xs={24}>
            <div className="toolbar">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() =>
                  dispatch({
                    type: "TOGGLE_MODAL",
                    payload: { modal: "student", visible: true },
                  })
                }
                className="action-button"
              >
                Add Student Checkup
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() =>
                  dispatch({
                    type: "TOGGLE_MODAL",
                    payload: { modal: "staff", visible: true },
                  })
                }
                className="action-button"
              >
                Add Staff Checkup
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={() =>
                  state.activeTab.includes("student")
                    ? exportStudentHealthCheckupsToExcel()
                    : exportStaffHealthCheckupsToExcel()
                }
                className="action-button"
              >
                Export
              </Button>
              <Button
                onClick={handleRefresh}
                icon={<ReloadOutlined />}
                className="action-button"
              >
                Refresh
              </Button>
            </div>
          </Col>
        </Row>
        <div className="stats-grid">
          <Card className="stats-card">
            <Statistic
              title="Total Checkups"
              value={summaryStats.total}
              prefix={<UserOutlined />}
            />
          </Card>
          <Card className="stats-card">
            <Statistic
              title="Active"
              value={summaryStats.active}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
          <Card className="stats-card">
            <Statistic
              title="Inactive Students"
              value={summaryStats.inactiveStudents}
              valueStyle={{ color: "#ff4d4f" }}
            />
          </Card>
          <Card className="stats-card">
            <Statistic
              title="Inactive Staff"
              value={summaryStats.inactiveStaff}
              valueStyle={{ color: "#ff4d4f" }}
            />
          </Card>
        </div>
        <Card className="filter-card">
          <Input.Search
            placeholder="Search by ID, MSSV, Name, or Conclusion"
            value={state.searchText}
            onChange={(e) => debouncedSetSearchText(e.target.value)}
            allowClear
            prefix={<SearchOutlined />}
            className="search-input"
          />
          <RangePicker
            value={state.dateRange}
            onChange={handleDateRangeChange}
            format="DD/MM/YYYY"
            presets={rangePresets}
            style={{ width: "100%", maxWidth: 300 }}
          />
          <Button
            onClick={resetFilters}
            type="default"
            className="action-button"
          >
            Clear Filters
          </Button>
        </Card>
      </Card>

      <Card className="tab-container">
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
          items={tabItems}
          tabBarStyle={{ marginBottom: 16, fontWeight: 500, textAlign: "center" }}
        />
      </Card>

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
    </div>
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
  }) => {
    const renderItem = (checkup: EnhancedStudentCheckup | EnhancedStaffCheckup, index: number) => (
      <div style={{ padding: "8px 0" }} key={checkup.id}>
        <Card
          className="checkup-card"
          onClick={() => onViewDetails(checkup)}
          extra={
            <Space>
              <Button
                type="text"
                icon={<FormOutlined style={{ color: "#1890ff" }} />}
                onClick={(e) => handleUpdateClick(checkup, e)}
                className="action-button"
              />
              {checkup.status === "Active" && (
                <Button
                  type="text"
                  icon={<DeleteOutlined style={{ color: "#ff4d4f" }} />}
                  loading={actionLoading === checkup.id}
                  disabled={!!actionLoading}
                  className="action-button"
                  onClick={(e) => handleDeleteClick(checkup, e)}
                />
              )}
            </Space>
          }
        >
          <Row gutter={[8, 8]}>
            <Col xs={24}>
              <Space
                direction={window.innerWidth < 576 ? "vertical" : "horizontal"}
                size="small"
              >
                <UserOutlined style={{ fontSize: 20, color: "#1890ff" }} />
                {"mssv" in checkup && checkup.mssv && (
                  <Text strong type="secondary">
                    {checkup.mssv}
                  </Text>
                )}
                <Text strong>{checkup.fullName}</Text>
                <Text type="secondary">{checkup.gender}</Text>
              </Space>
            </Col>
            <Col xs={24} className="status-section">
              <Space>
                <Text strong>Status:</Text>
                <Tooltip title={getStatusTooltip(checkup.status)}>
                  <Tag
                    color={getStatusColor(checkup.status)}
                    icon={getStatusIcon(checkup.status)}
                    className="status-tag"
                    aria-label={`Status: ${checkup.status}`}
                  >
                    {checkup.status}
                  </Tag>
                </Tooltip>
              </Space>
            </Col>
            <Col xs={24}>
              <Tooltip title={checkup.conclusion}>
                <Text ellipsis style={{ maxWidth: "100%" }}>
                  {checkup.conclusion || "No conclusion"}
                </Text>
              </Tooltip>
            </Col>
          </Row>
        </Card>
      </div>
    );

    return (
      <div className="tab-content">
        {checkups.length === 0 ? (
          <Empty description={`No ${type === "all" ? "health" : type} checkups found.`} />
        ) : isPaginated ? (
          <div className="paginated-list">
            {checkups.map((checkup, index) => renderItem(checkup, index))}
            {pagination}
          </div>
        ) : (
          <div className="virtual-list">
            <AutoSizer>
              {({ height, width }) => (
                <FixedSizeList
                  height={height}
                  width={width}
                  itemCount={checkups.length}
                  itemSize={window.innerWidth < 576 ? 180 : 170}
                  overscanCount={5}
                >
                  {({ index, style }) => {
                    const checkup = checkups[index];
                    return (
                      <div style={{ ...style, padding: "8px 0" }} key={checkup.id}>
                        {renderItem(checkup, index)}
                      </div>
                    );
                  }}
                </FixedSizeList>
              )}
            </AutoSizer>
          </div>
        )}
      </div>
    );
  }
);

CheckupList.displayName = "CheckupList";

export default PeriodicHealthCheckupManagement;