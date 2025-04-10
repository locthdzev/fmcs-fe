import React, { useReducer, useEffect, useCallback, useMemo, useState, lazy, Suspense } from "react";
import {
  Button,
  Spin,
  Typography,
  Tag,
  Space,
  Input,
  Tooltip,
  Statistic,
  Row,
  Col,
  Empty,
  DatePicker,
  Dropdown,
  Menu,
  Pagination,
  message,
  Card,
} from "antd";
import { useRouter } from "next/router";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import jwtDecode from "jwt-decode";
import '@ant-design/v5-patch-for-react-19';
import { getHealthCheckupByCheckupId } from "@/api/periodic-health-checkup-api";
import { getAllHealthCheckups } from "@/api/periodic-health-checkup-student-api";
import { getAllStaffHealthCheckups } from "@/api/periodic-health-checkup-staff-api";
import {
  EyeOutlined,
  SearchOutlined,
  ReloadOutlined,
  DownOutlined,
  ExportOutlined,
  SortAscendingOutlined,
  UserOutlined,
} from "@ant-design/icons";
import debounce from "lodash/debounce";
import dayjs, { Dayjs } from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import relativeTime from "dayjs/plugin/relativeTime";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

const CheckupDetailStaffModal = lazy(() => import("./CheckupDetailStaffModal"));
const CheckupDetailStudentModal = lazy(() => import("./CheckupDetailStudentModal"));

dayjs.extend(isBetween);
dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Ho_Chi_Minh");

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface DecodedToken {
  userid: string;
  username: string;
  email: string;
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role": string[];
  exp: number;
  iss: string;
  aud: string;
}

interface EnhancedStudentCheckup {
  id: string;
  periodicHealthCheckUpId: string;
  fullName?: string;
  gender?: string;
  status: string;
  conclusion?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  mssv?: string;
  [key: string]: any;
}

interface EnhancedStaffCheckup {
  id: string;
  periodicHealthCheckUpId: string;
  fullName?: string;
  gender?: string;
  status: string;
  conclusion?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  hospitalName?: string;
  reportIssuanceDate?: string;
  [key: string]: any;
}

type CheckupData = EnhancedStudentCheckup | EnhancedStaffCheckup;

interface State {
  loading: boolean;
  checkups: CheckupData[];
  searchText: string;
  dateRange: [Dayjs, Dayjs] | null;
  detailModalVisible: boolean;
  selectedCheckup: CheckupData | null;
  error: string | null;
  sortField: keyof CheckupData | null;
  sortOrder: "ascend" | "descend" | null;
  page: number;
  pageSize: number;
  total: number;
  retryCount: number;
}

type Action =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_CHECKUPS"; payload: CheckupData[] }
  | { type: "SET_SEARCH_TEXT"; payload: string }
  | { type: "SET_DATE_RANGE"; payload: [Dayjs, Dayjs] | null }
  | { type: "TOGGLE_MODAL"; payload: boolean }
  | { type: "SET_SELECTED_CHECKUP"; payload: CheckupData | null }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_SORT"; payload: { field: keyof CheckupData; order: "ascend" | "descend" } }
  | { type: "SET_PAGE"; payload: number }
  | { type: "SET_PAGE_SIZE"; payload: number }
  | { type: "SET_TOTAL"; payload: number }
  | { type: "INCREMENT_RETRY" };

const initialState: State = {
  loading: false,
  checkups: [],
  searchText: "",
  dateRange: null,
  detailModalVisible: false,
  selectedCheckup: null,
  error: null,
  sortField: "createdAt",
  sortOrder: "descend",
  page: 1,
  pageSize: 10,
  total: 0,
  retryCount: 0,
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "SET_LOADING": return { ...state, loading: action.payload };
    case "SET_CHECKUPS": return { ...state, checkups: action.payload, retryCount: 0 };
    case "SET_SEARCH_TEXT": return { ...state, searchText: action.payload };
    case "SET_DATE_RANGE": return { ...state, dateRange: action.payload };
    case "TOGGLE_MODAL": return { ...state, detailModalVisible: action.payload };
    case "SET_SELECTED_CHECKUP": return { ...state, selectedCheckup: action.payload };
    case "SET_ERROR": return { ...state, error: action.payload };
    case "SET_SORT": return { ...state, sortField: action.payload.field, sortOrder: action.payload.order };
    case "SET_PAGE": return { ...state, page: action.payload };
    case "SET_PAGE_SIZE": return { ...state, pageSize: action.payload };
    case "SET_TOTAL": return { ...state, total: action.payload };
    case "INCREMENT_RETRY": return { ...state, retryCount: state.retryCount + 1 };
    default: return state;
  }
};

const styles = `
  .my-checkups-container { 
    padding: 16px; 
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); 
    min-height: 100vh; 
    overflow-y: auto; 
    box-sizing: border-box;
  }
  .header-card { 
    background: #fff; 
    border-radius: 12px; 
    padding: 16px; 
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); 
    margin-bottom: 16px; 
  }
  .filter-row { 
    display: flex; 
    align-items: center; 
    gap: 12px; 
    flex-wrap: wrap; 
    background: rgba(255, 255, 255, 0.9); 
    padding: 12px; 
    border-radius: 8px; 
    box-shadow: 0 1px 6px rgba(0,0,0,0.05);
  }
  .checkup-card { 
    background: linear-gradient(145deg, #ffffff 0%, #f9f9f9 100%); 
    border-radius: 12px; 
    padding: 8px; 
    margin-bottom: 4px; /* Reduced from 12px */
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
  .summary-row { 
    margin-bottom: 16px; 
  }
  .virtual-list { 
    padding: 0 4px; 
  }
  @media (max-width: 576px) {
    .my-checkups-container { padding: 8px; }
    .header-card { padding: 12px; }
    .filter-row { gap: 8px; padding: 8px; }
    .checkup-card { padding: 8px; margin-bottom: 6px; } /* Adjusted for mobile */
    .action-button { font-size: 12px; padding: 4px 8px; }
  }
`;

const getStatusColor = (status: string) => {
  switch (status) {
    case "Active": return "green";
    default: return "default";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "Active": return <EyeOutlined />;
    default: return null;
  }
};

const MyHealthCheckups: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const getUserIdFromToken = useCallback((token: string): string => {
    try {
      const decoded: DecodedToken = jwtDecode(token);
      return decoded.userid || "";
    } catch (error) {
      console.error("Token decode error:", error);
      return "";
    }
  }, []);

  const fetchDetailedCheckup = useCallback(async (checkupId: string, token: string): Promise<CheckupData> => {
    const result = await getHealthCheckupByCheckupId(checkupId, token);
    if (!result.isSuccess || !result.data) {
      return {
        id: checkupId,
        periodicHealthCheckUpId: checkupId,
        fullName: "Unknown",
        gender: "Not specified",
        status: "Unknown",
        conclusion: "Pending",
        createdAt: new Date().toISOString(),
        createdBy: "System",
      };
    }
    return {
      id: result.data.id,
      periodicHealthCheckUpId: result.data.id,
      fullName: result.data.user?.fullName || "Unknown",
      gender: result.data.user?.gender || "Not specified",
      status: result.data.status || "Unknown",
      conclusion: result.data.classification || "Pending",
      createdAt: result.data.createdAt,
      updatedAt: result.data.updatedAt,
      createdBy: result.data.createdBy || "System",
    };
  }, []);

  const fetchMyCheckups = useCallback(async () => {
    if (state.retryCount >= 3) {
      dispatch({ type: "SET_ERROR", payload: "Max retries reached. Please try again later." });
      return;
    }

    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });

    try {
      const token = Cookies.get("token");
      if (!token) throw new Error("Authentication required. Please log in.");

      const userId = getUserIdFromToken(token);
      if (!userId) throw new Error("Invalid session. Please log in again.");

      const [studentResult, staffResult] = await Promise.all([
        getAllHealthCheckups(state.page, state.pageSize, userId, "CreatedAt", false, token),
        getAllStaffHealthCheckups(state.page, state.pageSize, userId, "CreatedAt", false, token),
      ]);

      const studentCheckups: EnhancedStudentCheckup[] = studentResult.isSuccess && studentResult.data
        ? await Promise.all(studentResult.data.map(async (checkup: any) => ({
            ...(await fetchDetailedCheckup(checkup.periodicHealthCheckUpId, token)),
            ...checkup,
          })))
        : [];

      const staffCheckups: EnhancedStaffCheckup[] = staffResult.isSuccess && staffResult.data
        ? await Promise.all(staffResult.data.map(async (checkup: any) => ({
            ...(await fetchDetailedCheckup(checkup.periodicHealthCheckUpId, token)),
            ...checkup,
            hospitalName: checkup.hospitalName || "Unknown Hospital",
            reportIssuanceDate: checkup.reportIssuanceDate || new Date().toISOString(),
          })))
        : [];

      const combinedCheckups = [...studentCheckups, ...staffCheckups];
      dispatch({ type: "SET_CHECKUPS", payload: combinedCheckups });
      dispatch({ type: "SET_TOTAL", payload: Math.max(combinedCheckups.length, (studentResult.totalRecords || 0) + (staffResult.totalRecords || 0)) });
    } catch (error: any) {
      const errorMessage = error.message || "Failed to load checkups. Please try again.";
      dispatch({ type: "SET_ERROR", payload: errorMessage });
      dispatch({ type: "INCREMENT_RETRY" });
      if (errorMessage.includes("log in")) {
        toast.info("Redirecting to login...");
        setTimeout(() => router.push("/login"), 1500);
      } else {
        message.error(errorMessage);
      }
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [state.page, state.pageSize, state.retryCount, router]);

  useEffect(() => {
    fetchMyCheckups();
  }, [fetchMyCheckups]);

  const debouncedSearch = useMemo(
    () => debounce((value: string) => dispatch({ type: "SET_SEARCH_TEXT", payload: value }), 300),
    []
  );

  const filteredCheckups = useMemo(() => {
    return state.checkups.filter((checkup: CheckupData) => {
      const matchesSearch = state.searchText
        ? [checkup.fullName, checkup.conclusion, "mssv" in checkup ? checkup.mssv : "", checkup.createdAt]
            .some((field) => field?.toLowerCase().includes(state.searchText.toLowerCase()))
        : true;
      const matchesDate = state.dateRange && checkup.createdAt
        ? dayjs(checkup.createdAt).tz("Asia/Ho_Chi_Minh").isBetween(state.dateRange[0], state.dateRange[1], "day", "[]")
        : true;
      const isActive = checkup.status === "Active";
      return matchesSearch && matchesDate && isActive;
    });
  }, [state.checkups, state.searchText, state.dateRange]);

  const sortedCheckups = useMemo(() => {
    if (!state.sortField || !state.sortOrder) return filteredCheckups;
    return [...filteredCheckups].sort((a: CheckupData, b: CheckupData) => {
      const valueA = a[state.sortField!];
      const valueB = b[state.sortField!];
      if (typeof valueA === "string" && typeof valueB === "string") {
        return state.sortOrder === "ascend"
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }
      return 0;
    });
  }, [filteredCheckups, state.sortField, state.sortOrder]);

  const handleViewDetails = useCallback((record: CheckupData) => {
    dispatch({ type: "SET_SELECTED_CHECKUP", payload: record });
    dispatch({ type: "TOGGLE_MODAL", payload: true });
  }, []);

  const isEnhancedStudentCheckup = (checkup: CheckupData | null): checkup is EnhancedStudentCheckup =>
    checkup !== null && "mssv" in checkup && !!checkup.mssv;

  const isEnhancedStaffCheckup = (checkup: CheckupData | null): checkup is EnhancedStaffCheckup =>
    checkup !== null && "hospitalName" in checkup && !!checkup.hospitalName;

  const summaryStats = useMemo(() => ({
    total: state.checkups.length,
    active: state.checkups.filter((c: CheckupData) => c.status === "Active").length,
  }), [state.checkups]);

  const exportToCSV = useCallback(() => {
    if (!isClient) return;

    const headers = ["Date", "Full Name", "Status", "Conclusion", "Created By"];
    const csvContent = [
      headers.join(","),
      ...sortedCheckups.map((checkup: CheckupData) =>
        [
          `"${dayjs(checkup.createdAt).tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY HH:mm")}"`,
          `"${checkup.fullName || ""}"`,
          `"${checkup.status}"`,
          `"${checkup.conclusion || ""}"`,
          `"${checkup.createdBy || ""}"`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `health_checkups_${dayjs().tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD_HH-mm")}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    message.success("Checkups exported successfully!");
  }, [sortedCheckups, isClient]);

  const sortMenu = (
    <Menu
      onClick={({ key }) => {
        const [field, order] = key.split("-");
        dispatch({ type: "SET_SORT", payload: { field: field as keyof CheckupData, order: order as "ascend" | "descend" } });
      }}
    >
      <Menu.Item key="createdAt-ascend">Date (Oldest First)</Menu.Item>
      <Menu.Item key="createdAt-descend">Date (Newest First)</Menu.Item>
      <Menu.Item key="fullName-ascend">Name (A-Z)</Menu.Item>
      <Menu.Item key="fullName-descend">Name (Z-A)</Menu.Item>
    </Menu>
  );

  const rangePresets: { label: string; value: [Dayjs, Dayjs] }[] = [
    { label: "Today", value: [dayjs().tz("Asia/Ho_Chi_Minh").startOf("day"), dayjs().tz("Asia/Ho_Chi_Minh").endOf("day")] },
    { label: "This Week", value: [dayjs().tz("Asia/Ho_Chi_Minh").startOf("week"), dayjs().tz("Asia/Ho_Chi_Minh").endOf("week")] },
    { label: "This Month", value: [dayjs().tz("Asia/Ho_Chi_Minh").startOf("month"), dayjs().tz("Asia/Ho_Chi_Minh").endOf("month")] },
  ];

  if (state.loading && !state.checkups.length) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <Spin size="large" tip="Loading health checkups..." />
      </div>
    );
  }

  return (
    <div className="my-checkups-container">
      <style>{styles}</style>

      <Card className="header-card">
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Title level={3} style={{ margin: 0, color: "#1d39c4" }}>
              My Active Health Checkups
            </Title>
            <Text type="secondary">View and manage your health records</Text>
          </Col>
          <Col xs={24} md={12} style={{ textAlign: "right" }}>
            <Space direction={window.innerWidth < 576 ? "vertical" : "horizontal"} size="small">
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchMyCheckups}
                className="action-button"
                loading={state.loading}
              >
                Refresh
              </Button>
              <Button
                icon={<ExportOutlined />}
                onClick={exportToCSV}
                className="action-button"
                disabled={!sortedCheckups.length || state.loading || !isClient}
              >
                Export
              </Button>
              <Dropdown overlay={sortMenu} disabled={state.loading}>
                <Button className="action-button">
                  <SortAscendingOutlined /> Sort <DownOutlined />
                </Button>
              </Dropdown>
            </Space>
          </Col>
        </Row>
        <Row gutter={[16, 16]} className="summary-row">
          <Col xs={24} sm={12}>
            <Statistic title="Total Checkups" value={summaryStats.total} prefix={<UserOutlined />} />
          </Col>
          <Col xs={24} sm={12}>
            <Statistic title="Active Checkups" value={summaryStats.active} valueStyle={{ color: "#52c41a" }} />
          </Col>
        </Row>
        <div className="filter-row">
          <Input.Search
            placeholder="Search by name, conclusion, or date..."
            value={state.searchText}
            onChange={(e) => debouncedSearch(e.target.value)}
            allowClear
            prefix={<SearchOutlined />}
            className="search-input"
            disabled={state.loading}
          />
          <RangePicker
            value={state.dateRange}
            onChange={(dates) => dispatch({ type: "SET_DATE_RANGE", payload: dates as [Dayjs, Dayjs] | null })}
            format="DD/MM/YYYY"
            presets={rangePresets}
            disabled={state.loading}
            style={{ width: "100%", maxWidth: 300 }}
          />
          <Button
            onClick={() => {
              dispatch({ type: "SET_SEARCH_TEXT", payload: "" });
              dispatch({ type: "SET_DATE_RANGE", payload: null });
              dispatch({ type: "SET_SORT", payload: { field: "createdAt", order: "descend" } });
            }}
            type="default"
            className="action-button"
            disabled={state.loading}
          >
            Clear Filters
          </Button>
        </div>
      </Card>

      <CheckupList
        checkups={sortedCheckups}
        handleViewDetails={handleViewDetails}
        loading={state.loading}
      />

      {state.total > state.pageSize && (
        <Row justify="center" style={{ marginTop: 20, marginBottom: 20 }}>
          <Col>
            <Pagination
              current={state.page}
              pageSize={state.pageSize}
              total={state.total}
              onChange={(page) => dispatch({ type: "SET_PAGE", payload: page })}
              showSizeChanger
              onShowSizeChange={(_, size) => {
                dispatch({ type: "SET_PAGE", payload: 1 });
                dispatch({ type: "SET_PAGE_SIZE", payload: size });
              }}
              pageSizeOptions={["10", "20", "50"]}
              disabled={state.loading}
              showQuickJumper
            />
          </Col>
        </Row>
      )}

      {isClient && (
        <Suspense fallback={<Spin tip="Loading details..." />}>
          {state.selectedCheckup && state.detailModalVisible && (
            isEnhancedStudentCheckup(state.selectedCheckup) ? (
              <CheckupDetailStudentModal
                visible={state.detailModalVisible}
                checkup={state.selectedCheckup}
                onClose={() => dispatch({ type: "TOGGLE_MODAL", payload: false })}
              />
            ) : isEnhancedStaffCheckup(state.selectedCheckup) ? (
              <CheckupDetailStaffModal
                visible={state.detailModalVisible}
                checkup={state.selectedCheckup}
                onClose={() => dispatch({ type: "TOGGLE_MODAL", payload: false })}
              />
            ) : null
          )}
        </Suspense>
      )}
    </div>
  );
};

interface CheckupListProps {
  checkups: CheckupData[];
  handleViewDetails: (record: CheckupData) => void;
  loading: boolean;
}

const CheckupList: React.FC<CheckupListProps> = React.memo(({ checkups, handleViewDetails, loading }) => {
  if (loading && !checkups.length) {
    return <Spin tip="Loading checkups..." style={{ width: "100%", padding: "20px" }} />;
  }

  if (!checkups.length) {
    return (
      <Empty description="No active checkups found" image={Empty.PRESENTED_IMAGE_SIMPLE}>
        <Button onClick={() => window.location.reload()}>Refresh</Button>
      </Empty>
    );
  }

  return (
    <div className="virtual-list">
      {checkups.map((checkup) => (
        <div key={checkup.id} style={{ padding: "2px 0" }}> {/* Reduced from 4px 0 */}
          <Card
            className="checkup-card"
            onClick={() => handleViewDetails(checkup)}
            extra={
              <Button
                type="text"
                icon={<EyeOutlined style={{ color: "#1890ff" }} />}
                onClick={() => handleViewDetails(checkup)}
                className="action-button"
              />
            }
          >
            <Row justify="space-between" align="middle" gutter={[8, 8]}>
              <Col xs={24}>
                <Space direction={window.innerWidth < 576 ? "vertical" : "horizontal"} size="small">
                  <UserOutlined style={{ fontSize: 20, color: "#1890ff" }} />
                  {"mssv" in checkup && checkup.mssv && (
                    <Text strong type="secondary">{checkup.mssv}</Text>
                  )}
                  <Text strong>{checkup.fullName || "Unknown"}</Text>
                  <Text type="secondary">{checkup.gender || "N/A"}</Text>
                  <Tooltip title={checkup.status}>
                    <Tag color={getStatusColor(checkup.status)} icon={getStatusIcon(checkup.status)}>
                      {checkup.status}
                    </Tag>
                  </Tooltip>
                </Space>
              </Col>
              <Col xs={24}>
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  Created: {dayjs(checkup.createdAt).tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY HH:mm")}
                </Text>
              </Col>
              <Col xs={24}>
                <Tooltip title={checkup.conclusion}>
                  <Text ellipsis style={{ maxWidth: "100%" }}>{checkup.conclusion || "No conclusion"}</Text>
                </Tooltip>
              </Col>
            </Row>
          </Card>
        </div>
      ))}
    </div>
  );
});

CheckupList.displayName = "CheckupList";

export default MyHealthCheckups;