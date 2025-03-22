import React, { useState, useEffect, useCallback, Fragment } from "react";
import {
  Button,
  Table,
  Input,
  Select,
  DatePicker,
  Pagination,
  Popconfirm,
  Dropdown,
  Menu,
  Checkbox,
  Space,
  Row,
  Col,
  Card,
  Typography,
  Badge,
  Tag,
  Tooltip,
  Statistic,
  Divider,
  Empty,
  Spin,
  Modal,
  Form,
  Alert,
} from "antd";
import { toast } from "react-toastify";
import moment from "moment";
import { Pie, Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
} from 'chart.js';
import {
  getAllHealthCheckResults,
  getHealthCheckResultsStatistics,
  HealthCheckResultsResponseDTO,
  HealthCheckResultsStatisticsDTO,
  softDeleteHealthCheckResults,
  restoreSoftDeletedHealthCheckResults,
  exportHealthCheckResultsToExcelWithConfig,
  HealthCheckResultExportConfigDTO,
  approveHealthCheckResult,
  completeHealthCheckResult,
  cancelCompletelyHealthCheckResult,
  cancelForAdjustmentHealthCheckResult,
} from "@/api/healthcheckresult";
import CreateModal from "./CreateModal";
import { 
  DownOutlined, 
  SearchOutlined, 
  SettingOutlined,
  PlusOutlined,
  ExportOutlined,
  EyeOutlined,
  EditOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  FilterOutlined,
  LineChartOutlined,
  CalendarOutlined,
  FieldTimeOutlined,
  CheckSquareOutlined,
  CloseSquareOutlined,
  PieChartOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import { getUsers, UserProfile } from "@/api/user";
import { useRouter } from 'next/router';

const { Option } = Select;
const { RangePicker } = DatePicker;

// Define status constants to use in the component
const staticHealthCheckResultStatus = {
  WAITING_FOR_APPROVAL: "Waiting for Approval",
  COMPLETED: "Completed",
  FOLLOW_UP_REQUIRED: "FollowUpRequired",
  CANCELLED_COMPLETELY: "CancelledCompletely",
  CANCELLED_FOR_ADJUSTMENT: "CancelledForAdjustment",
  NO_FOLLOW_UP_REQUIRED: "NoFollowUpRequired",
  SOFT_DELETED: "SoftDeleted",
};

// Đăng ký các thành phần ChartJS
ChartJS.register(
  ArcElement,
  ChartTooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title
);

const formatDate = (date: string | undefined) => {
  if (!date) return '';
  return moment(date).format('DD/MM/YYYY');
};

const formatDateTime = (datetime: string | undefined) => {
  if (!datetime) return '';
  return moment(datetime).format('DD/MM/YYYY HH:mm:ss');
};

const DEFAULT_VISIBLE_COLUMNS = [
  "code",
  "patient",
  "checkupDate",
  "staff",
  "followUp",
  "status",
  "actions",
];

const DEFAULT_EXPORT_CONFIG = {
  exportAllPages: true,
  includeCode: true,
  includeUser: true,
  includeStaff: true,
  includeCheckupDate: true,
  includeFollowUp: true,
  includeStatus: true,
  includeCreatedAt: true,
  includeUpdatedAt: true,
  includeDetails: true
};

const getStatusColor = (status: string | undefined) => {
  switch (status) {
    case 'Completed':
      return 'success';
    case 'Approved':
      return 'processing';
    case 'Pending':
      return 'warning';
    case 'Cancelled':
      return 'error';
    case 'CancelledForAdjustment':
      return 'orange';
    case 'SoftDeleted':
      return 'default';
    default:
      return 'default';
  }
};

export function HealthCheckResultManagement() {
  const router = useRouter();
  const [healthCheckResults, setHealthCheckResults] = useState<HealthCheckResultsResponseDTO[]>([]);
  const [statistics, setStatistics] = useState<HealthCheckResultsStatisticsDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [selectedResult, setSelectedResult] = useState<HealthCheckResultsResponseDTO | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [codeSearch, setCodeSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [staffSearch, setStaffSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string | undefined>(undefined);
  const [showDefaultFilter, setShowDefaultFilter] = useState(true);
  const [sortBy, setSortBy] = useState("CheckupDate");
  const [ascending, setAscending] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_VISIBLE_COLUMNS);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [checkupDateRange, setCheckupDateRange] = useState<[moment.Moment | null, moment.Moment | null]>([null, null]);
  const [followUpRequired, setFollowUpRequired] = useState<boolean | undefined>();
  const [followUpDateRange, setFollowUpDateRange] = useState<[moment.Moment | null, moment.Moment | null]>([null, null]);
  const [userOptions, setUserOptions] = useState<{ id: string; fullName: string; email: string }[]>([]);
  const [staffOptions, setStaffOptions] = useState<{ id: string; fullName: string; email: string }[]>([]);
  const [healthCheckCodes, setHealthCheckCodes] = useState<string[]>([]);
  const [healthCheckStaff, setHealthCheckStaff] = useState<{ id: string; fullName: string; email: string }[]>([]);
  const [showExportConfigModal, setShowExportConfigModal] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportConfig, setExportConfig] = useState<HealthCheckResultExportConfigDTO>(DEFAULT_EXPORT_CONFIG);
  const [form] = Form.useForm();

  const fetchUsers = useCallback(async () => {
    try {
      const users = await getUsers();
      const userRoleUsers = users.filter((user: UserProfile) => 
        user.roles.includes('User')
      ).map((user: UserProfile) => ({
        id: user.id,
        fullName: user.fullName,
        email: user.email
      }));
      setUserOptions(userRoleUsers);

      const staffRoleUsers = users.filter((user: UserProfile) => 
        user.roles.includes('Doctor') || user.roles.includes('Nurse')
      ).map((user: UserProfile) => ({
        id: user.id,
        fullName: user.fullName,
        email: user.email
      }));
      setStaffOptions(staffRoleUsers);
    } catch (error) {
      toast.error("Không thể tải danh sách người dùng");
    }
  }, []);

  const fetchStatistics = useCallback(async () => {
    setStatsLoading(true);
    try {
      const response = await getHealthCheckResultsStatistics();
      if (response.isSuccess) {
        setStatistics(response.data);
      } else {
        toast.error(response.message || "Không thể tải thống kê");
        // Handle the error case gracefully with default data
        setStatistics({
          totalResults: 0,
          statusDistribution: {
            waitingForApproval: 0,
            followUpRequired: 0,
            noFollowUpRequired: 0,
            completed: 0,
            cancelledCompletely: 0,
            cancelledForAdjustment: 0,
            softDeleted: 0
          },
          followUpStatistics: {
            totalFollowUps: 0,
            upcomingFollowUps: 0,
            overdueFollowUps: 0,
            followUpsToday: 0
          },
          monthlyDistribution: []
        });
      }
    } catch (error) {
      toast.error("Không thể tải thống kê");
      // Handle the error case gracefully with default data
      setStatistics({
        totalResults: 0,
        statusDistribution: {
          waitingForApproval: 0,
          followUpRequired: 0,
          noFollowUpRequired: 0,
          completed: 0,
          cancelledCompletely: 0,
          cancelledForAdjustment: 0,
          softDeleted: 0
        },
        followUpStatistics: {
          totalFollowUps: 0,
          upcomingFollowUps: 0,
          overdueFollowUps: 0,
          followUpsToday: 0
        },
        monthlyDistribution: []
      });
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchHealthCheckCodesAndStaff = useCallback(async () => {
    try {
      // Fetch tất cả kết quả khám (không phân trang)
      const response = await getAllHealthCheckResults(
        1,
        1000, // Số lượng lớn để lấy tất cả
        undefined,
        undefined,
        undefined,
        "Code",
        true,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined
      );

      if (response.isSuccess) {
        // Lấy danh sách các mã duy nhất
        const uniqueCodes = Array.from(new Set(
          response.data.map((result: HealthCheckResultsResponseDTO) => result.healthCheckResultCode)
        )) as string[];
        setHealthCheckCodes(uniqueCodes);

        // Lấy danh sách healthcare staff duy nhất từ kết quả khám
        const staffMap = new Map<string, { id: string; fullName: string; email: string }>();
        response.data.forEach((result: HealthCheckResultsResponseDTO) => {
          if (result.staff && !staffMap.has(result.staff.id)) {
            staffMap.set(result.staff.id, {
              id: result.staff.id,
              fullName: result.staff.fullName,
              email: result.staff.email
            });
          }
        });
        
        const uniqueStaff = Array.from(staffMap.values());
        setHealthCheckStaff(uniqueStaff);
      }
    } catch (error) {
      console.error("Không thể tải danh sách mã kết quả khám và staff:", error);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchStatistics();
    fetchHealthCheckCodesAndStaff();
  }, [fetchUsers, fetchStatistics, fetchHealthCheckCodesAndStaff]);

  const fetchHealthCheckResults = useCallback(async () => {
    setLoading(true);
    try {
      const checkupStartDate = checkupDateRange[0] ? checkupDateRange[0].format('YYYY-MM-DD') : undefined;
      const checkupEndDate = checkupDateRange[1] ? checkupDateRange[1].format('YYYY-MM-DD') : undefined;
      const followUpStartDate = followUpDateRange[0] ? followUpDateRange[0].format('YYYY-MM-DD') : undefined;
      const followUpEndDate = followUpDateRange[1] ? followUpDateRange[1].format('YYYY-MM-DD') : undefined;

      const response = await getAllHealthCheckResults(
        currentPage,
        pageSize,
        codeSearch || undefined,
        userSearch || undefined,
        staffSearch || undefined,
        sortBy,
        ascending,
        statusFilter,
        checkupStartDate,
        checkupEndDate,
        followUpRequired,
        followUpStartDate,
        followUpEndDate
      );

      if (response.isSuccess) {
        if (showDefaultFilter && !statusFilter) {
          const filteredResults = response.data.filter(
            (result: HealthCheckResultsResponseDTO) => 
              result.status === 'Completed' || result.status === 'CancelledCompletely'
          );
          setHealthCheckResults(filteredResults);
          setTotal(filteredResults.length);
        } else {
          setHealthCheckResults(response.data);
          setTotal(response.totalRecords);
        }
      } else {
        toast.error(response.message || "Không thể tải danh sách kết quả khám");
      }
    } catch (error) {
      toast.error("Không thể tải danh sách kết quả khám");
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    pageSize,
    codeSearch,
    userSearch,
    staffSearch,
    sortBy,
    ascending,
    statusFilter,
    checkupDateRange,
    followUpRequired,
    followUpDateRange,
    showDefaultFilter,
  ]);

  useEffect(() => {
    fetchHealthCheckResults();
  }, [fetchHealthCheckResults]);

  const handleColumnVisibilityChange = (key: string) => {
    const newVisibleColumns = visibleColumns.includes(key)
      ? visibleColumns.filter((col) => col !== key)
      : [...visibleColumns, key];
    setVisibleColumns(newVisibleColumns);
  };

  const handleSoftDelete = async (id: string) => {
    try {
      const response = await softDeleteHealthCheckResults([id]);
      if (response.isSuccess) {
        toast.success("Kết quả khám đã được xóa tạm thời!");
        fetchHealthCheckResults();
        fetchStatistics();
      } else {
        toast.error(response.message || "Không thể xóa tạm thời kết quả khám");
      }
    } catch (error) {
      toast.error("Không thể xóa tạm thời kết quả khám");
    }
  };

  const handleRestore = async (id: string) => {
    try {
      const response = await restoreSoftDeletedHealthCheckResults([id]);
      if (response.isSuccess) {
        toast.success("Kết quả khám đã được khôi phục!");
        fetchHealthCheckResults();
        fetchStatistics();
      } else {
        toast.error(response.message || "Không thể khôi phục kết quả khám");
      }
    } catch (error) {
      toast.error("Không thể khôi phục kết quả khám");
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const response = await approveHealthCheckResult(id);
      if (response.isSuccess) {
        toast.success("Kết quả khám đã được phê duyệt!");
        fetchHealthCheckResults();
        fetchStatistics();
      } else {
        toast.error(response.message || "Không thể phê duyệt kết quả khám");
      }
    } catch (error) {
      toast.error("Không thể phê duyệt kết quả khám");
    }
  };

  const handleComplete = async (id: string) => {
    try {
      const response = await completeHealthCheckResult(id);
      if (response.isSuccess) {
        toast.success("Kết quả khám đã được hoàn thành!");
        fetchHealthCheckResults();
        fetchStatistics();
      } else {
        toast.error(response.message || "Không thể hoàn thành kết quả khám");
      }
    } catch (error) {
      toast.error("Không thể hoàn thành kết quả khám");
    }
  };

  const handleCancel = async (id: string, reason: string) => {
    try {
      const response = await cancelCompletelyHealthCheckResult(id, reason);
      if (response.isSuccess) {
        toast.success("Kết quả khám đã bị hủy!");
        fetchHealthCheckResults();
        fetchStatistics();
      } else {
        toast.error(response.message || "Không thể hủy kết quả khám");
      }
    } catch (error) {
      toast.error("Không thể hủy kết quả khám");
    }
  };

  const handleCancelForAdjustment = async (id: string, reason: string) => {
    try {
      const response = await cancelForAdjustmentHealthCheckResult(id, reason);
      if (response.isSuccess) {
        toast.success("Kết quả khám đã bị hủy để điều chỉnh!");
        fetchHealthCheckResults();
        fetchStatistics();
      } else {
        toast.error(response.message || "Không thể hủy kết quả khám để điều chỉnh");
      }
    } catch (error) {
      toast.error("Không thể hủy kết quả khám để điều chỉnh");
    }
  };

  const handleBulkDelete = async () => {
    try {
      const response = await softDeleteHealthCheckResults(selectedRowKeys as string[]);
      if (response.isSuccess) {
        toast.success("Các kết quả khám đã được xóa tạm thời!");
        setSelectedRowKeys([]);
        fetchHealthCheckResults();
        fetchStatistics();
      } else {
        toast.error(response.message || "Không thể xóa tạm thời các kết quả khám đã chọn");
      }
    } catch (error) {
      toast.error("Không thể xóa tạm thời các kết quả khám đã chọn");
    }
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const checkupStartDate = checkupDateRange[0] ? checkupDateRange[0].format('YYYY-MM-DD') : undefined;
      const checkupEndDate = checkupDateRange[1] ? checkupDateRange[1].format('YYYY-MM-DD') : undefined;
      const followUpStartDate = followUpDateRange[0] ? followUpDateRange[0].format('YYYY-MM-DD') : undefined;
      const followUpEndDate = followUpDateRange[1] ? followUpDateRange[1].format('YYYY-MM-DD') : undefined;
      
      // Đảm bảo đã load đầy đủ dữ liệu cho dropdown
      if (healthCheckCodes.length === 0 || healthCheckStaff.length === 0) {
        await fetchHealthCheckCodesAndStaff();
      }
      
      // Cập nhật giá trị ban đầu cho form
      form.setFieldsValue({
        exportAllPages: true, // Mặc định chọn xuất tất cả
        includeCode: true,
        includeUser: true,
        includeStaff: true,
        includeCheckupDate: true,
        includeFollowUp: true,
        includeStatus: true,
        includeCreatedAt: true,
        includeUpdatedAt: true,
        includeDetails: true,
        // Giá trị lọc
        filterCodeSearch: codeSearch,
        filterUserSearch: userSearch,
        filterStaffSearch: staffSearch,
        filterStatus: statusFilter,
        filterCheckupDateRange: checkupDateRange,
        filterFollowUpRequired: followUpRequired,
        filterFollowUpDateRange: followUpDateRange,
        // Tùy chọn sắp xếp
        sortOption: sortBy,
        sortDirection: ascending ? "asc" : "desc"
      });
      
      // Đặt giá trị mặc định cho exportConfig
      setExportConfig({
        ...DEFAULT_EXPORT_CONFIG,
        exportAllPages: true // Đảm bảo chọn xuất tất cả
      });
      
      setShowExportConfigModal(true);
      setExportLoading(false);
    } catch (error) {
      toast.error("Không thể xuất Excel");
      setExportLoading(false);
    }
  };

  const closeConfigModal = () => {
    // Reset form và export config khi đóng modal
    form.setFieldsValue({
      ...DEFAULT_EXPORT_CONFIG,
      exportAllPages: true // Đảm bảo mặc định là xuất tất cả
    });
    setExportConfig({
      ...DEFAULT_EXPORT_CONFIG,
      exportAllPages: true
    });
    setShowExportConfigModal(false);
    setExportLoading(false);
  };

  const handleExportWithConfig = async () => {
    setExportLoading(true);
    try {
      const values = form.getFieldsValue();
      
      // Build export configuration
      const config = {
        exportAllPages: values.exportAllPages || false,
        includeCode: values.includeCode !== false,
        includeUser: values.includeUser !== false,
        includeStaff: values.includeStaff !== false,
        includeCheckupDate: values.includeCheckupDate !== false,
        includeFollowUp: values.includeFollowUp !== false,
        includeStatus: values.includeStatus !== false,
        includeCreatedAt: values.includeCreatedAt !== false,
        includeUpdatedAt: values.includeUpdatedAt !== false,
        includeDetails: values.includeDetails !== false,
      };
      
      // Xử lý dữ liệu ngày tháng
      const filterCheckupDateRange = values.filterCheckupDateRange;
      const filterFollowUpDateRange = values.filterFollowUpDateRange;
      
      const modalCheckupStartDate = filterCheckupDateRange && filterCheckupDateRange[0] 
        ? filterCheckupDateRange[0].format('YYYY-MM-DD') 
        : undefined;
      const modalCheckupEndDate = filterCheckupDateRange && filterCheckupDateRange[1] 
        ? filterCheckupDateRange[1].format('YYYY-MM-DD') 
        : undefined;
      const modalFollowUpStartDate = filterFollowUpDateRange && filterFollowUpDateRange[0] 
        ? filterFollowUpDateRange[0].format('YYYY-MM-DD') 
        : undefined;
      const modalFollowUpEndDate = filterFollowUpDateRange && filterFollowUpDateRange[1] 
        ? filterFollowUpDateRange[1].format('YYYY-MM-DD') 
        : undefined;
      
      // Xác định thứ tự sắp xếp
      const modalSortBy = values.sortOption || sortBy;
      const modalAscending = values.sortDirection === "asc";
      
      // Cập nhật lại giá trị sortBy và ascending
      setSortBy(modalSortBy);
      setAscending(modalAscending);

      const checkupStartDate = checkupDateRange[0] ? checkupDateRange[0].format('YYYY-MM-DD') : undefined;
      const checkupEndDate = checkupDateRange[1] ? checkupDateRange[1].format('YYYY-MM-DD') : undefined;
      const followUpStartDate = followUpDateRange[0] ? followUpDateRange[0].format('YYYY-MM-DD') : undefined;
      const followUpEndDate = followUpDateRange[1] ? followUpDateRange[1].format('YYYY-MM-DD') : undefined;
      
      // Sử dụng các giá trị từ modal thay vì giá trị ngoài
      await exportHealthCheckResultsToExcelWithConfig(
        config,
        currentPage,
        pageSize,
        values.exportAllPages ? undefined : values.filterCodeSearch || codeSearch || undefined,
        values.exportAllPages ? undefined : values.filterUserSearch || userSearch || undefined,
        values.exportAllPages ? undefined : values.filterStaffSearch || staffSearch || undefined,
        modalSortBy,
        modalAscending,
        values.exportAllPages ? undefined : values.filterStatus || statusFilter,
        values.exportAllPages ? undefined : modalCheckupStartDate || checkupStartDate,
        values.exportAllPages ? undefined : modalCheckupEndDate || checkupEndDate,
        values.exportAllPages ? undefined : values.filterFollowUpRequired === undefined ? followUpRequired : values.filterFollowUpRequired,
        values.exportAllPages ? undefined : modalFollowUpStartDate || followUpStartDate,
        values.exportAllPages ? undefined : modalFollowUpEndDate || followUpEndDate
      );
      
      closeConfigModal();
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Không thể xuất Excel");
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportConfigChange = (changedValues: any) => {
    setExportConfig(prev => ({ ...prev, ...changedValues }));
  };

  const isExportAllPages = () => {
    return form.getFieldValue('exportAllPages');
  };

  const ALL_COLUMNS = [
    {
      key: "code",
      title: "Mã kết quả khám",
      render: (record: HealthCheckResultsResponseDTO) => (
        <span>{record.healthCheckResultCode}</span>
      ),
      hidden: !visibleColumns.includes("code"),
    },
    {
      key: "patient",
      title: "Bệnh nhân",
      render: (record: HealthCheckResultsResponseDTO) => (
        <div className="flex flex-col">
          <Typography.Text strong>{record.user.fullName}</Typography.Text>
          <Typography.Text type="secondary" className="text-sm">{record.user.email}</Typography.Text>
        </div>
      ),
    },
    { 
      key: "checkupDate", 
      title: "Ngày khám", 
      render: (record: HealthCheckResultsResponseDTO) => (
        <Tooltip title="Nhấn để xem chi tiết">
          <Typography.Link onClick={() => router.push(`/health-check-result/${record.id}`)}>
            {formatDate(record.checkupDate)}
          </Typography.Link>
        </Tooltip>
      ),
      sorter: true
    },
    { 
      key: "staff", 
      title: "Bác sĩ / Y tá", 
      render: (record: HealthCheckResultsResponseDTO) => (
        <div className="flex flex-col">
          <Typography.Text>{record.staff.fullName}</Typography.Text>
          <Typography.Text type="secondary" className="text-sm">{record.staff.email}</Typography.Text>
        </div>
      )
    },
    { 
      key: "followUp",
      title: "Tái khám",
      render: (record: HealthCheckResultsResponseDTO) => (
        <Space direction="vertical" size="small">
          {record.followUpRequired ? (
            <>
              <Badge status="processing" text="Yêu cầu tái khám" />
              <Typography.Text>{record.followUpDate ? formatDate(record.followUpDate) : 'Chưa lên lịch'}</Typography.Text>
            </>
          ) : (
            <Badge status="default" text="Không yêu cầu tái khám" />
          )}
        </Space>
      )
    },
    { 
      key: "status", 
      title: "Trạng thái", 
      render: (record: HealthCheckResultsResponseDTO) => (
        <Tag color={getStatusColor(record.status)}>
          {record.status}
        </Tag>
      ),
      filters: [
        { text: 'Pending', value: 'Pending' },
        { text: 'Approved', value: 'Approved' },
        { text: 'Completed', value: 'Completed' },
        { text: 'Cancelled', value: 'Cancelled' },
        { text: 'CancelledForAdjustment', value: 'CancelledForAdjustment' },
      ],
    },
    {
      key: "actions",
      title: "Thao tác",
      render: (record: HealthCheckResultsResponseDTO) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => router.push(`/health-check-result/${record.id}`)}
            />
          </Tooltip>
          
          {record.status === 'Pending' && (
            <Tooltip title="Phê duyệt">
              <Button
                type="text"
                icon={<CheckCircleOutlined />}
                className="text-green-600"
                onClick={() => handleApprove(record.id)}
              />
            </Tooltip>
          )}
          
          {record.status === 'Approved' && (
            <Tooltip title="Hoàn thành">
              <Button
                type="text"
                icon={<CheckSquareOutlined />}
                className="text-green-600"
                onClick={() => handleComplete(record.id)}
              />
            </Tooltip>
          )}
          
          {(record.status === 'Pending' || record.status === 'Approved') && (
            <Tooltip title="Hủy">
              <Popconfirm
                title="Nhập lý do hủy"
                description={
                  <Input.TextArea 
                    placeholder="Lý do hủy"
                    onChange={(e) => {
                      (e.target as any).reason = e.target.value;
                    }}
                    rows={3}
                  />
                }
                onConfirm={(e) => {
                  const target = e?.target as any;
                  const reason = target?.reason || "Không có lý do";
                  handleCancel(record.id, reason);
                }}
                okText="Xác nhận"
                cancelText="Hủy"
              >
                <Button
                  type="text"
                  icon={<CloseCircleOutlined />}
                  className="text-red-600"
                />
              </Popconfirm>
            </Tooltip>
          )}
          
          {(record.status === 'Pending' || record.status === 'Approved') && (
            <Tooltip title="Hủy để điều chỉnh">
              <Popconfirm
                title="Nhập lý do hủy để điều chỉnh"
                description={
                  <Input.TextArea 
                    placeholder="Lý do hủy để điều chỉnh"
                    onChange={(e) => {
                      (e.target as any).reason = e.target.value;
                    }}
                    rows={3}
                  />
                }
                onConfirm={(e) => {
                  const target = e?.target as any;
                  const reason = target?.reason || "Không có lý do";
                  handleCancelForAdjustment(record.id, reason);
                }}
                okText="Xác nhận"
                cancelText="Hủy"
              >
                <Button
                  type="text"
                  icon={<CloseSquareOutlined />}
                  className="text-orange-600"
                />
              </Popconfirm>
            </Tooltip>
          )}
          
          {record.status !== 'SoftDeleted' ? (
            <Tooltip title="Xóa tạm thời">
              <Popconfirm
                title="Bạn có chắc chắn muốn xóa tạm thời kết quả khám này?"
                onConfirm={() => handleSoftDelete(record.id)}
                okText="Xác nhận"
                cancelText="Hủy"
              >
                <Button
                  type="text"
                  icon={<DeleteOutlined />}
                  className="text-red-600"
                />
              </Popconfirm>
            </Tooltip>
          ) : (
            <Tooltip title="Khôi phục">
              <Button
                type="text"
                icon={<CheckCircleOutlined />}
                className="text-green-600"
                onClick={() => handleRestore(record.id)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  const columns = ALL_COLUMNS.filter(col => visibleColumns.includes(col.key));

  const statisticsCards = (
    <Row gutter={[16, 16]} className="mb-4">
      <Col xs={24} sm={12} md={6}>
        <Card className="h-full">
          <Statistic
            title="Tổng số kết quả khám"
            value={statistics?.totalResults || 0}
            prefix={<LineChartOutlined />}
          />
        </Card>
      </Col>

      {/* Pie Chart cho phân bố trạng thái */}
      <Col xs={24} sm={12} md={9}>
        <Card title="Phân bố trạng thái" className="h-full">
          {statsLoading ? (
            <div className="flex items-center justify-center h-64">
              <Spin />
            </div>
          ) : (
            <div style={{ height: 300 }}>
              <Pie 
                data={{
                  labels: [
                    'Chờ phê duyệt',
                    'Tái khám',
                    'Không tái khám',
                    'Hoàn thành',
                    'Đã hủy',
                    'Hủy để điều chỉnh',
                    'Đã xóa tạm thời'
                  ],
                  datasets: [
                    {
                      data: [
                        statistics?.statusDistribution?.waitingForApproval || 0,
                        statistics?.statusDistribution?.followUpRequired || 0,
                        statistics?.statusDistribution?.noFollowUpRequired || 0,
                        statistics?.statusDistribution?.completed || 0,
                        statistics?.statusDistribution?.cancelledCompletely || 0,
                        statistics?.statusDistribution?.cancelledForAdjustment || 0,
                        statistics?.statusDistribution?.softDeleted || 0
                      ],
                      backgroundColor: [
                        '#faad14', // Vàng - Chờ phê duyệt
                        '#1890ff', // Xanh dương - Tái khám
                        '#52c41a', // Xanh lá - Không tái khám
                        '#13c2c2', // Lục lam - Hoàn thành
                        '#ff4d4f', // Đỏ - Đã hủy
                        '#fa8c16', // Cam - Hủy để điều chỉnh
                        '#d9d9d9'  // Xám - Đã xóa tạm thời
                      ],
                      borderColor: [
                        '#fff',
                        '#fff',
                        '#fff',
                        '#fff',
                        '#fff',
                        '#fff',
                        '#fff'
                      ],
                      borderWidth: 1,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right',
                      labels: {
                        boxWidth: 10,
                        font: {
                          size: 10
                        }
                      }
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          let label = context.label || '';
                          if (label) {
                            label += ': ';
                          }
                          if (context.parsed !== undefined) {
                            label += context.parsed;
                          }
                          return label;
                        }
                      }
                    }
                  }
                }}
              />
            </div>
          )}
        </Card>
      </Col>

      {/* Bar Chart cho tái khám */}
      <Col xs={24} sm={12} md={9}>
        <Card title="Thống kê tái khám" className="h-full">
          {statsLoading ? (
            <div className="flex items-center justify-center h-64">
              <Spin />
            </div>
          ) : (
            <div style={{ height: 300 }}>
              <Bar 
                data={{
                  labels: ['Tổng số', 'Sắp tới', 'Quá hạn', 'Hôm nay'],
                  datasets: [
                    {
                      label: 'Tái khám',
                      data: [
                        statistics?.followUpStatistics?.totalFollowUps || 0,
                        statistics?.followUpStatistics?.upcomingFollowUps || 0,
                        statistics?.followUpStatistics?.overdueFollowUps || 0,
                        statistics?.followUpStatistics?.followUpsToday || 0
                      ],
                      backgroundColor: [
                        '#8884d8',
                        '#1890ff',
                        '#ff4d4f',
                        '#52c41a'
                      ],
                    }
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          let label = context.dataset.label || '';
                          if (label) {
                            label += ': ';
                          }
                          if (context.parsed.y !== undefined) {
                            label += context.parsed.y;
                          }
                          return label;
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        precision: 0
                      }
                    }
                  }
                }}
              />
            </div>
          )}
        </Card>
      </Col>

      {/* Line Chart cho phân bố theo tháng */}
      <Col xs={24}>
        <Card title="Phân bố theo tháng" className="h-full">
          {statsLoading ? (
            <div className="flex items-center justify-center h-64">
              <Spin />
            </div>
          ) : (!statistics?.monthlyDistribution || statistics.monthlyDistribution.length === 0) ? (
            <Empty description="Không có dữ liệu phân bố theo tháng" />
          ) : (
            <div style={{ height: 300 }}>
              <Line 
                data={{
                  labels: statistics?.monthlyDistribution.map(item => `${item.month}/${item.year}`),
                  datasets: [
                    {
                      label: 'Số lượng',
                      data: statistics?.monthlyDistribution.map(item => item.count),
                      fill: false,
                      backgroundColor: '#1890ff',
                      borderColor: '#1890ff',
                      tension: 0.1
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          let label = context.dataset.label || '';
                          if (label) {
                            label += ': ';
                          }
                          if (context.parsed.y !== undefined) {
                            label += context.parsed.y;
                          }
                          return label;
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        precision: 0
                      }
                    }
                  }
                }}
              />
            </div>
          )}
        </Card>
      </Col>
    </Row>
  );

  const topContent = (
    <Card className="mb-4 shadow-sm">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Typography.Title level={4} className="mb-4">
            Quản lý kết quả khám
          </Typography.Title>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Input
            placeholder="Tìm theo mã kết quả khám"
            value={codeSearch}
            onChange={(e) => setCodeSearch(e.target.value)}
            prefix={<SearchOutlined />}
            allowClear
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Input
            placeholder="Tìm theo bệnh nhân"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            prefix={<SearchOutlined />}
            allowClear
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Input
            placeholder="Tìm theo bác sĩ/y tá"
            value={staffSearch}
            onChange={(e) => setStaffSearch(e.target.value)}
            prefix={<SearchOutlined />}
            allowClear
          />
        </Col>
        <Col span={24}>
          <Space size="middle" wrap>
            <Select
              placeholder="Lọc theo trạng thái"
              onChange={(value) => {
                if (value === 'ALL') {
                  setStatusFilter(undefined);
                  setShowDefaultFilter(false);
                } else if (value === 'DEFAULT') {
                  setStatusFilter(undefined);
                  setShowDefaultFilter(true);
                } else {
                  setStatusFilter(value);
                  setShowDefaultFilter(false);
                }
                setSelectedStatusFilter(value);
              }}
              style={{ width: 200 }}
              allowClear
              value={selectedStatusFilter}
              onClear={() => {
                setStatusFilter(undefined);
                setShowDefaultFilter(true);
                setSelectedStatusFilter(undefined);
              }}
              suffixIcon={<FilterOutlined />}
            >
              <Option value="DEFAULT">
                <Badge status="default" text="Mặc định (Hoàn thành & Đã hủy)" />
              </Option>
              <Option value="ALL">
                <Badge status="default" text="Tất cả trạng thái" />
              </Option>
              <Option value="Waiting for Approval">
                <Badge status="warning" text="Chờ phê duyệt" />
              </Option>
              <Option value="Completed">
                <Badge status="success" text="Hoàn thành" />
              </Option>
              <Option value="FollowUpRequired">
                <Badge status="processing" text="Yêu cầu tái khám" />
              </Option>
              <Option value="CancelledCompletely">
                <Badge status="error" text="Đã hủy hoàn toàn" />
              </Option>
              <Option value="CancelledForAdjustment">
                <Badge color="orange" text="Hủy để điều chỉnh" />
              </Option>
              <Option value="NoFollowUpRequired">
                <Badge status="default" text="Không yêu cầu tái khám" />
              </Option>
              <Option value="SoftDeleted">
                <Badge status="default" text="Đã xóa tạm thời" />
              </Option>
            </Select>
            <RangePicker
              placeholder={["Từ ngày khám", "Đến ngày khám"]}
              onChange={(dates) => {
                setCheckupDateRange(dates as [moment.Moment | null, moment.Moment | null]);
              }}
              allowClear
            />
            <Select
              placeholder="Yêu cầu tái khám"
              onChange={(value) => setFollowUpRequired(value)}
              style={{ width: 150 }}
              allowClear
            >
              <Option value={true}>Có</Option>
              <Option value={false}>Không</Option>
            </Select>
            <RangePicker
              placeholder={["Từ ngày tái khám", "Đến ngày tái khám"]}
              onChange={(dates) => {
                setFollowUpDateRange(dates as [moment.Moment | null, moment.Moment | null]);
              }}
              allowClear
              disabled={followUpRequired === false}
            />
          </Space>
        </Col>
        <Col span={24}>
          <Space size="middle" wrap>
            <Dropdown
              overlay={
                <Menu>
                  <Menu.ItemGroup title="Hiển thị cột">
                    {ALL_COLUMNS.map((column) => (
                      <Menu.Item key={column.key}>
                        <Checkbox 
                          checked={visibleColumns.includes(column.key)}
                          onChange={() => handleColumnVisibilityChange(column.key)}
                        >
                          {column.title}
                        </Checkbox>
                      </Menu.Item>
                    ))}
                  </Menu.ItemGroup>
                </Menu>
              }
              trigger={['click']}
            >
              <Button icon={<SettingOutlined />}>
                Cột
              </Button>
            </Dropdown>
            <Button 
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsCreateModalVisible(true)}
            >
              Tạo mới
            </Button>
            <Button 
              icon={<ExportOutlined />}
              onClick={handleExport}
            >
              Xuất Excel
            </Button>
          </Space>
        </Col>
        <Col span={24}>
          <Row justify="space-between" align="middle">
            <Col>
              <Space>
                {selectedRowKeys.length > 0 && (
                  <Popconfirm
                    title="Bạn có chắc chắn muốn xóa tạm thời các kết quả khám đã chọn?"
                    onConfirm={handleBulkDelete}
                    okText="Xác nhận"
                    cancelText="Hủy"
                  >
                    <Button 
                      danger 
                      type="primary"
                      icon={<DeleteOutlined />}
                      className="hover:opacity-90"
                    >
                      Xóa đã chọn ({selectedRowKeys.length})
                    </Button>
                  </Popconfirm>
                )}
              </Space>
            </Col>
            <Col>
              <Space align="center">
                <Typography.Text type="secondary">
                  Dòng mỗi trang:
                </Typography.Text>
                <Select
                  value={pageSize}
                  onChange={(value) => {
                    setPageSize(value);
                    setCurrentPage(1);
                  }}
                  className="min-w-[80px]"
                >
                  <Option value={5}>5</Option>
                  <Option value={10}>10</Option>
                  <Option value={15}>15</Option>
                  <Option value={20}>20</Option>
                </Select>
              </Space>
            </Col>
          </Row>
        </Col>
      </Row>
    </Card>
  );

  const bottomContent = (
    <Card className="mt-4 shadow-sm">
      <Row justify="space-between" align="middle">
        <Col>
          <Typography.Text type="secondary">
            Tổng cộng {total} kết quả khám
          </Typography.Text>
        </Col>
        <Col>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={total}
            onChange={(page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            }}
            showSizeChanger={false}
          />
        </Col>
      </Row>
    </Card>
  );

  return (
    <Fragment>
      <div className="p-6">
        {statisticsCards}
        {topContent}
        <Card className="shadow-sm">
          <Table
            columns={columns}
            dataSource={healthCheckResults}
            loading={loading}
            pagination={false}
            rowKey="id"
            rowSelection={{
              selectedRowKeys,
              onChange: (keys) => setSelectedRowKeys(keys),
            }}
            className="border rounded-lg"
          />
        </Card>
        {bottomContent}
        <CreateModal
          visible={isCreateModalVisible}
          onClose={() => setIsCreateModalVisible(false)}
          onSuccess={() => {
            fetchHealthCheckResults();
            fetchStatistics();
          }}
          userOptions={userOptions}
          staffOptions={staffOptions}
        />
      </div>
      
      <Modal
        title="Cấu hình xuất file Excel"
        open={showExportConfigModal}
        onCancel={closeConfigModal}
        width={800}
        footer={[
          <Button key="cancel" onClick={closeConfigModal}>
            Hủy
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            loading={exportLoading}
            onClick={handleExportWithConfig}
          >
            Xuất file
          </Button>
        ]}
        maskClosable={true}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={exportConfig}
          onValuesChange={handleExportConfigChange}
        >
          <Row gutter={[16, 8]}>
            <Col span={24}>
              <Typography.Title level={5}>Tùy chọn cơ bản</Typography.Title>
            </Col>
            
            <Col span={24}>
              <Form.Item 
                name="exportAllPages" 
                valuePropName="checked"
                style={{ marginBottom: "12px" }}
              >
                <Checkbox>Xuất tất cả dữ liệu (bỏ qua phân trang)</Checkbox>
              </Form.Item>
            </Col>
            
            <Col span={24} style={{ display: isExportAllPages() ? 'none' : 'block' }}>
              <Typography.Title level={5}>Bộ lọc dữ liệu</Typography.Title>
            </Col>
            
            <Col span={8} style={{ display: isExportAllPages() ? 'none' : 'block' }}>
              <Form.Item label="Tìm theo mã" name="filterCodeSearch">
                <Select
                  placeholder="Tìm theo mã kết quả khám"
                  allowClear
                  showSearch
                  defaultValue={codeSearch || undefined}
                  style={{ width: '100%' }}
                  filterOption={(input, option) =>
                    (option?.children as unknown as string)?.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {healthCheckCodes.map(code => (
                    <Option key={code} value={code}>
                      {code}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={8} style={{ display: isExportAllPages() ? 'none' : 'block' }}>
              <Form.Item label="Tìm theo bệnh nhân" name="filterUserSearch">
                <Select
                  placeholder="Tìm theo bệnh nhân"
                  allowClear
                  showSearch
                  defaultValue={userSearch || undefined}
                  style={{ width: '100%' }}
                  filterOption={(input, option) =>
                    (option?.children as unknown as string)?.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                  optionFilterProp="children"
                >
                  {userOptions.map(user => (
                    <Option key={user.id} value={user.fullName}>
                      {user.fullName} ({user.email})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={8} style={{ display: isExportAllPages() ? 'none' : 'block' }}>
              <Form.Item label="Tìm theo bác sĩ/y tá" name="filterStaffSearch">
                <Select
                  placeholder="Tìm theo healthcare staff"
                  allowClear
                  showSearch
                  defaultValue={staffSearch || undefined}
                  style={{ width: '100%' }}
                  filterOption={(input, option) =>
                    (option?.children as unknown as string)?.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                  optionFilterProp="children"
                >
                  {healthCheckStaff.map(staff => (
                    <Option key={staff.id} value={staff.fullName}>
                      {staff.fullName} ({staff.email})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={8} style={{ display: isExportAllPages() ? 'none' : 'block' }}>
              <Form.Item label="Trạng thái" name="filterStatus">
                <Select
                  placeholder="Trạng thái"
                  allowClear
                  style={{ width: '100%' }}
                  defaultValue={statusFilter}
                >
                  <Option value="Waiting for Approval">Chờ phê duyệt</Option>
                  <Option value="Completed">Hoàn thành</Option>
                  <Option value="FollowUpRequired">Yêu cầu tái khám</Option>
                  <Option value="CancelledCompletely">Đã hủy hoàn toàn</Option>
                  <Option value="CancelledForAdjustment">Hủy để điều chỉnh</Option>
                  <Option value="NoFollowUpRequired">Không yêu cầu tái khám</Option>
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={8} style={{ display: isExportAllPages() ? 'none' : 'block' }}>
              <Form.Item label="Khoảng thời gian khám" name="filterCheckupDateRange">
                <RangePicker
                  placeholder={["Từ ngày khám", "Đến ngày khám"]}
                  style={{ width: '100%' }}
                  defaultValue={checkupDateRange as any}
                />
              </Form.Item>
            </Col>
            
            <Col span={8} style={{ display: isExportAllPages() ? 'none' : 'block' }}>
              <Form.Item label="Yêu cầu tái khám" name="filterFollowUpRequired">
                <Select
                  placeholder="Yêu cầu tái khám"
                  allowClear
                  style={{ width: '100%' }}
                  defaultValue={followUpRequired}
                >
                  <Option value={true}>Có</Option>
                  <Option value={false}>Không</Option>
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={8} style={{ display: isExportAllPages() ? 'none' : 'block' }}>
              <Form.Item label="Khoảng thời gian tái khám" name="filterFollowUpDateRange">
                <RangePicker
                  placeholder={["Từ ngày tái khám", "Đến ngày tái khám"]}
                  style={{ width: '100%' }}
                  disabled={form.getFieldValue('filterFollowUpRequired') === false}
                  defaultValue={followUpDateRange as any}
                />
              </Form.Item>
            </Col>
            
            <Col span={24}>
              <Typography.Title level={5}>Tùy chọn sắp xếp</Typography.Title>
            </Col>
            
            <Col span={12}>
              <Form.Item 
                label="Sắp xếp theo"
                name="sortOption"
              >
                <Select
                  style={{ width: '100%' }}
                  defaultValue={sortBy}
                >
                  <Option value="CheckupDate">Ngày khám</Option>
                  <Option value="Code">Mã kết quả khám</Option>
                  <Option value="CreatedAt">Thời gian tạo</Option>
                  <Option value="UpdatedAt">Thời gian cập nhật</Option>
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item 
                label="Thứ tự sắp xếp"
                name="sortDirection"
              >
                <Select
                  style={{ width: '100%' }}
                  defaultValue={ascending ? "asc" : "desc"}
                >
                  <Option value="asc">Tăng dần</Option>
                  <Option value="desc">Giảm dần</Option>
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={24}>
              <Divider />
              <Typography.Title level={5}>Chọn các cột hiển thị</Typography.Title>
            </Col>
            
            <Col span={8}>
              <Form.Item 
                name="includeCode" 
                valuePropName="checked"
                style={{ marginBottom: "8px" }}
              >
                <Checkbox>Mã kết quả khám</Checkbox>
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item 
                name="includeUser" 
                valuePropName="checked"
                style={{ marginBottom: "8px" }}
              >
                <Checkbox>Thông tin bệnh nhân</Checkbox>
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item 
                name="includeStaff" 
                valuePropName="checked"
                style={{ marginBottom: "8px" }}
              >
                <Checkbox>Thông tin nhân viên y tế</Checkbox>
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item 
                name="includeCheckupDate" 
                valuePropName="checked"
                style={{ marginBottom: "8px" }}
              >
                <Checkbox>Ngày khám</Checkbox>
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item 
                name="includeFollowUp" 
                valuePropName="checked"
                style={{ marginBottom: "8px" }}
              >
                <Checkbox>Thông tin tái khám</Checkbox>
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item 
                name="includeStatus" 
                valuePropName="checked"
                style={{ marginBottom: "8px" }}
              >
                <Checkbox>Trạng thái</Checkbox>
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item 
                name="includeCreatedAt" 
                valuePropName="checked"
                style={{ marginBottom: "8px" }}
              >
                <Checkbox>Thời gian tạo</Checkbox>
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item 
                name="includeUpdatedAt" 
                valuePropName="checked"
                style={{ marginBottom: "8px" }}
              >
                <Checkbox>Thông tin cập nhật</Checkbox>
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item 
                name="includeDetails" 
                valuePropName="checked"
                style={{ marginBottom: "8px" }}
              >
                <Checkbox>Chi tiết kết quả khám</Checkbox>
              </Form.Item>
            </Col>
          </Row>
          
          <Alert
            message="Thông tin về định dạng Excel"
            description="Khi chọn 'Chi tiết kết quả khám', các thông tin chi tiết sẽ được hiển thị cùng với kết quả khám trên cùng một worksheet. Mỗi kết quả khám có nhiều chi tiết sẽ được hiển thị trên nhiều dòng khác nhau."
            type="info"
            showIcon
            style={{ marginTop: "16px" }}
          />
        </Form>
      </Modal>
    </Fragment>
  );
} 