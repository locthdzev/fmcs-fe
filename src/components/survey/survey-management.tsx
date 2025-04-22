import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Card,
  Space,
  Button,
  Input,
  Select,
  DatePicker,
  Tag,
  Row,
  Col,
  Tooltip,
  Modal,
  Spin,
  Typography,
  notification,
  Popconfirm,
  Radio,
  Checkbox,
  Flex,
  Tabs,
  Badge,
  Avatar,
  Rate,
  Menu,
  Dropdown,
  Alert,
  Divider,
} from "antd";
import {
  SearchOutlined,
  EyeOutlined,
  ExportOutlined,
  FilterOutlined,
  ReloadOutlined,
  DownloadOutlined,
  UserOutlined,
  TeamOutlined,
  CalendarOutlined,
  FileTextOutlined,
  CheckCircleFilled,
  ExclamationCircleOutlined,
  FrownOutlined,
  MehOutlined,
  SmileOutlined,
  MoreOutlined,
  BarChartOutlined,
  FormOutlined,
  AppstoreOutlined,
  CaretDownOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import {
  getSurveys,
  getSurveyById,
  exportSurveysToExcel,
  SurveyExportConfig,
  SurveyResponse,
  SurveyUpdateRequest,
  updateSurvey,
} from "@/api/survey";
import { useRouter } from "next/router";
import moment from "moment";
import { Survey } from "./my-survey";
import PageContainer from "../shared/PageContainer";
import ToolbarCard from "../shared/ToolbarCard";
import PaginationFooter from "../shared/PaginationFooter";
import TableControls, { BulkAction } from "../shared/TableControls";
import { SurveyManagementIcon } from "@/dashboard/sidebar/icons/SurveyManagementIcon";
import { UserProfile, getAllStaff } from "@/api/user";

interface SurveyManagementProps {}

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

export const SurveyManagement: React.FC<SurveyManagementProps> = () => {
  const [surveys, setSurveys] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [totalSurveys, setTotalSurveys] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Filters
  const [userSearch, setUserSearch] = useState<string>("");
  const [staffSearch, setStaffSearch] = useState<string>("");
  const [ratingFilter, setRatingFilter] = useState<number | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<
    [moment.Moment | null, moment.Moment | null] | null
  >(null);

  // Sorting
  const [sortBy, setSortBy] = useState<string>("surveyDate");
  const [sortOrder, setSortOrder] = useState<boolean>(false); // false = descending, true = ascending

  // Detail view
  // const [detailModalVisible, setDetailModalVisible] = useState<boolean>(false);
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null);

  // Export config
  const [exportModalVisible, setExportModalVisible] = useState<boolean>(false);
  const [exportConfig, setExportConfig] = useState<SurveyExportConfig>({
    exportAllPages: false,
    includeUser: true,
    includeStaff: true,
    includeAppointment: true,
    includeSurveyDate: true,
    includeRating: true,
    includeFeedback: true,
    includeStatus: true,
    includeCreatedAt: true,
    includeUpdatedAt: true,
  });

  // Add column visibility state
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >({
    user: true,
    staff: true,
    surveyDate: true,
    rating: true,
    feedback: true,
    status: true,
    action: true,
  });

  // Add dropdown open state
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Add filter modal state
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const router = useRouter();

  // Status constants
  const SURVEY_STATUS = {
    PENDING: "Pending",
    SUBMITTED: "Submitted",
    UPDATED: "UpdatedAfterSubmission",
  };

  // Stats counters
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    submitted: 0,
    updated: 0,
    highRating: 0, // rating >= 4
    lowRating: 0, // rating <= 2
  });

  const [staffList, setStaffList] = useState<UserProfile[]>([]);
  const [staffLoading, setStaffLoading] = useState<boolean>(false);

  const fetchSurveys = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        pageSize,
        userSearch,
        staffSearch,
        ratingFilter,
        sortBy,
        ascending: sortOrder,
        status: statusFilter,
        surveyStartDate:
          dateRange && dateRange[0]
            ? dateRange[0].format("YYYY-MM-DD")
            : undefined,
        surveyEndDate:
          dateRange && dateRange[1]
            ? dateRange[1].format("YYYY-MM-DD")
            : undefined,
      };

      console.log("Fetching surveys with params:", params);

      const response = await getSurveys(params);
      console.log("API Response:", response);

      if (response && response.isSuccess) {
        // Process data from API
        if (response.data) {
          // Case 1: response.data has {items, totalItems} structure
          if (response.data.items && Array.isArray(response.data.items)) {
            const surveyItems = response.data.items;
            console.log(
              "Successfully loaded survey items (format 1):",
              surveyItems
            );
            setSurveys(surveyItems);
            setTotalSurveys(response.data.totalItems || surveyItems.length);

            // Calculate statistics
            const pendingCount = surveyItems.filter(
              (s: SurveyResponse) => s.status === SURVEY_STATUS.PENDING
            ).length;
            const submittedCount = surveyItems.filter(
              (s: SurveyResponse) => s.status === SURVEY_STATUS.SUBMITTED
            ).length;
            const updatedCount = surveyItems.filter(
              (s: SurveyResponse) => s.status === SURVEY_STATUS.UPDATED
            ).length;
            const highRatingCount = surveyItems.filter(
              (s: SurveyResponse) => s.rating >= 4
            ).length;
            const lowRatingCount = surveyItems.filter(
              (s: SurveyResponse) => s.rating <= 2
            ).length;

            setStats({
              total: response.data.totalItems || surveyItems.length,
              pending: pendingCount,
              submitted: submittedCount,
              updated: updatedCount,
              highRating: highRatingCount,
              lowRating: lowRatingCount,
            });
          }
          // Case 2: response.data is an array
          else if (Array.isArray(response.data)) {
            const surveyItems = response.data;
            console.log(
              "Successfully loaded survey items (format 2):",
              surveyItems
            );
            setSurveys(surveyItems);
            setTotalSurveys(surveyItems.length);

            // Calculate statistics
            const pendingCount = surveyItems.filter(
              (s: SurveyResponse) => s.status === SURVEY_STATUS.PENDING
            ).length;
            const submittedCount = surveyItems.filter(
              (s: SurveyResponse) => s.status === SURVEY_STATUS.SUBMITTED
            ).length;
            const updatedCount = surveyItems.filter(
              (s: SurveyResponse) => s.status === SURVEY_STATUS.UPDATED
            ).length;
            const highRatingCount = surveyItems.filter(
              (s: SurveyResponse) => s.rating >= 4
            ).length;
            const lowRatingCount = surveyItems.filter(
              (s: SurveyResponse) => s.rating <= 2
            ).length;

            setStats({
              total: surveyItems.length,
              pending: pendingCount,
              submitted: submittedCount,
              updated: updatedCount,
              highRating: highRatingCount,
              lowRating: lowRatingCount,
            });
          } else {
            console.error("Unexpected data structure:", response.data);
            notification.error({
              message: "Data Structure Error",
              description: "The API returned data in an unexpected format",
            });
          }
        } else {
          console.error("API response is missing data property");
          notification.error({
            message: "Error",
            description: "API response is missing data",
          });
        }
      } else {
        console.error("API call failed:", response?.message || "Unknown error");
        notification.error({
          message: "Error",
          description: response?.message || "Failed to fetch survey data",
        });
      }
    } catch (error: any) {
      console.error("Error in fetchSurveys:", error);
      notification.error({
        message: "Error",
        description: error.message || "Could not load survey list",
      });
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    pageSize,
    userSearch,
    staffSearch,
    ratingFilter,
    sortBy,
    sortOrder,
    statusFilter,
    dateRange,
  ]);

  useEffect(() => {
    fetchSurveys();
  }, [fetchSurveys]);

  // Fetch staff list
  useEffect(() => {
    const fetchStaff = async () => {
      setStaffLoading(true);
      try {
        const staffData = await getAllStaff();
        setStaffList(staffData);
      } catch (error: any) {
        console.error("Error fetching staff:", error);
        notification.error({
          message: "Error",
          description: error.message || "Could not load staff list",
        });
      } finally {
        setStaffLoading(false);
      }
    };

    fetchStaff();
  }, []);

  const handleViewDetail = (surveyId: string) => {
    router.push(`/survey/${surveyId}`);
  };

  const handleEditInNewPage = (surveyId: string) => {
    router.push(`/survey/details/${surveyId}`);
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      const params = {
        page: exportConfig.exportAllPages ? undefined : currentPage,
        pageSize: exportConfig.exportAllPages ? undefined : pageSize,
        userSearch,
        staffSearch,
        ratingFilter,
        sortBy,
        ascending: sortOrder,
        status: statusFilter,
        surveyStartDate:
          dateRange && dateRange[0]
            ? dateRange[0].format("YYYY-MM-DD")
            : undefined,
        surveyEndDate:
          dateRange && dateRange[1]
            ? dateRange[1].format("YYYY-MM-DD")
            : undefined,
      };

      const response = await exportSurveysToExcel(exportConfig, params);
      if (response.isSuccess) {
        notification.success({
          message: "Success",
          description: "Excel export successful!",
        });
        window.open(response.data, "_blank");
      } else {
        notification.error({
          message: "Error",
          description: "Could not export to Excel",
        });
      }
    } catch (error: any) {
      notification.error({
        message: "Error",
        description: error.message || "Could not export to Excel",
      });
    } finally {
      setLoading(false);
      setExportModalVisible(false);
    }
  };

  const resetFilters = () => {
    setUserSearch("");
    setRatingFilter(undefined);
    setStatusFilter(undefined);
    setDateRange(null);
    setCurrentPage(1);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case SURVEY_STATUS.PENDING:
        return "orange";
      case SURVEY_STATUS.SUBMITTED:
        return "green";
      case SURVEY_STATUS.UPDATED:
        return "blue";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case SURVEY_STATUS.PENDING:
        return "Pending";
      case SURVEY_STATUS.SUBMITTED:
        return "Submitted";
      case SURVEY_STATUS.UPDATED:
        return "Updated";
      default:
        return status || "Pending";
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case SURVEY_STATUS.SUBMITTED:
        return <CheckCircleFilled style={{ color: "#52c41a" }} />;
      case SURVEY_STATUS.PENDING:
        return <ExclamationCircleOutlined style={{ color: "#faad14" }} />;
      case SURVEY_STATUS.UPDATED:
        return <CheckCircleFilled style={{ color: "#1890ff" }} />;
      default:
        return <ExclamationCircleOutlined style={{ color: "#1677ff" }} />;
    }
  };

  const getIconColorClass = (rating: number): string => {
    switch (rating) {
      case 1:
        return "text-red-500";
      case 2:
        return "text-orange-500";
      case 3:
        return "text-yellow-500";
      case 4:
        return "text-blue-500";
      case 5:
        return "text-green-500";
      default:
        return "text-gray-400";
    }
  };

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);

    if (sorter.field) {
      setSortBy(sorter.field);
      setSortOrder(sorter.order === "ascend");
    }
  };

  const handlePageChange = (page: number, newPageSize?: number) => {
    setCurrentPage(page);
    if (newPageSize) {
      setPageSize(newPageSize);
    }
  };

  const renderRating = (rating: number) => (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => {
        // Check if this star should be colored
        const isColored = star <= rating;
        const colorClass = isColored
          ? star === 1
            ? "text-red-500"
            : star === 2
            ? "text-orange-500"
            : star === 3
            ? "text-yellow-500"
            : star === 4
            ? "text-blue-500"
            : "text-green-500"
          : "text-gray-400";

        // Display different icons based on value
        return (
          <span key={star} className="transition-transform hover:scale-110">
            {star === 1 || star === 2 ? (
              <FrownOutlined className={colorClass} style={{ fontSize: 18 }} />
            ) : star === 3 ? (
              <MehOutlined className={colorClass} style={{ fontSize: 18 }} />
            ) : (
              <SmileOutlined className={colorClass} style={{ fontSize: 18 }} />
            )}
          </span>
        );
      })}
      <span className="ml-2 text-sm font-medium">{rating}/5</span>
    </div>
  );

  const renderActionButtons = (record: SurveyResponse) => {
    return (
      <div style={{ textAlign: "center" }}>
        <Button
          icon={<EyeOutlined />}
          size="small"
          onClick={() => handleViewDetail(record.id)}
          type="text"
        />
      </div>
    );
  };

  // Handle column visibility
  const handleColumnVisibilityChange = (key: string) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Toggle all columns visibility
  const toggleAllColumns = (checked: boolean) => {
    const newVisibility = { ...columnVisibility };
    Object.keys(newVisibility).forEach((key) => {
      newVisibility[key] = checked;
    });
    setColumnVisibility(newVisibility);
  };

  // Check if all columns are visible
  const areAllColumnsVisible = () => {
    return Object.values(columnVisibility).every((value) => value === true);
  };

  // Handle dropdown visibility
  const handleDropdownVisibleChange = (visible: boolean) => {
    setDropdownOpen(visible);
  };

  // Handle menu click
  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Handle opening filter modal
  const handleOpenFilterModal = () => {
    setFilterModalVisible(true);
  };

  // Handle applying filters from modal
  const handleApplyFilters = () => {
    setFilterModalVisible(false);
    fetchSurveys();
  };

  const columns = [
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          USER
        </span>
      ),
      dataIndex: ["user", "fullName"],
      key: "user",
      sorter: true,
      render: (text: string, record: SurveyResponse) => {
        // Add timestamp to prevent caching
        const imageUrl = record.user.imageURL
          ? record.user.imageURL.includes("?")
            ? `${record.user.imageURL}&t=${new Date().getTime()}`
            : `${record.user.imageURL}?t=${new Date().getTime()}`
          : undefined;

        return (
          <div className="flex items-center">
            <Avatar
              src={imageUrl}
              icon={<UserOutlined />}
              className="mr-2 shadow-sm"
              size={40}
            />
            <div>
              <div className="font-medium">{text}</div>
              <div className="text-xs text-gray-500">{record.user.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          STAFF
        </span>
      ),
      dataIndex: ["staff", "fullName"],
      key: "staff",
      sorter: true,
      render: (text: string, record: SurveyResponse) => {
        // Add timestamp to prevent caching
        const imageUrl = record.staff.imageURL
          ? record.staff.imageURL.includes("?")
            ? `${record.staff.imageURL}&t=${new Date().getTime()}`
            : `${record.staff.imageURL}?t=${new Date().getTime()}`
          : undefined;

        return (
          <div className="flex items-center">
            <Avatar
              src={imageUrl}
              icon={<TeamOutlined />}
              className="mr-2 shadow-sm"
              style={{ backgroundColor: "#1890ff" }}
              size={40}
            />
            <div>
              <div className="font-medium">{text}</div>
              <div className="text-xs text-gray-500">{record.staff.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          SURVEY DATE
        </span>
      ),
      dataIndex: "surveyDate",
      key: "surveyDate",
      sorter: true,
      render: (text: string) => (
        <div className="flex items-center">
          <span className="font-medium">
            {moment(text).format("DD/MM/YYYY")}
          </span>
        </div>
      ),
    },
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          RATING
        </span>
      ),
      dataIndex: "rating",
      key: "rating",
      sorter: true,
      render: (rating: number) => renderRating(rating),
    },
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          FEEDBACK
        </span>
      ),
      dataIndex: "feedback",
      key: "feedback",
      ellipsis: true,
      render: (text: string) =>
        text ? (
          <Tooltip title={text}>
            <div className="flex items-start">
              <span className="line-clamp-2 text-sm">
                {text.length > 30 ? `${text.substring(0, 30)}...` : text}
              </span>
            </div>
          </Tooltip>
        ) : (
          <span className="text-gray-400 text-sm italic">No feedback</span>
        ),
    },
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          STATUS
        </span>
      ),
      dataIndex: "status",
      key: "status",
      render: (text: string) => (
        <Tag
          color={getStatusColor(text)}
          icon={getStatusIcon(text)}
          className="px-3 py-1 font-medium"
        >
          {getStatusLabel(text)}
        </Tag>
      ),
    },
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          ACTIONS
        </span>
      ),
      key: "action",
      render: (record: SurveyResponse) => renderActionButtons(record),
      width: 100,
      align: "center" as const,
    },
  ];

  // Filter columns based on visibility settings
  const visibleColumns = columns.filter((column) => {
    return columnVisibility[column.key as string];
  });

  return (
    <PageContainer
      title="Survey Management"
      icon={<SurveyManagementIcon />}
      onBack={() => router.push("/")}
    >
      <div className="space-y-4">
        {/* Toolbar Section */}
        <Card className="shadow-sm" bodyStyle={{ padding: "20px" }}>
          <div className="mb-4">
            <Typography.Title level={5} style={{ margin: 0, fontWeight: 600 }}>
              <AppstoreOutlined className="mr-2" style={{ fontSize: '20px' }} /> <span style={{ fontSize: '20px' }}>Toolbar</span>
            </Typography.Title>
          </div>

          <Divider style={{ margin: '0 0 16px 0' }} />

          {/* Search and Filters Row */}
          <div className="flex flex-wrap items-center gap-3">
            <Select
              placeholder="Select Staff"
              style={{ width: 250 }}
              allowClear
              showSearch
              loading={staffLoading}
              value={staffSearch || undefined}
              onChange={(value) => {
                setStaffSearch(value || "");
                fetchSurveys();
              }}
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.children as unknown as string)
                  ?.toLowerCase()
                  .includes(input.toLowerCase())
              }
            >
              {staffList.map((staff) => (
                <Option key={staff.id} value={staff.fullName}>
                  {staff.fullName}
                </Option>
              ))}
            </Select>

            <Button icon={<FilterOutlined />} onClick={handleOpenFilterModal}>
              Filters
            </Button>

            <Select
              placeholder="Status"
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value);
                fetchSurveys(); // Auto fetch when status changes
              }}
              style={{ width: 140 }}
              allowClear
            >
              <Option value={SURVEY_STATUS.PENDING}>Pending</Option>
              <Option value={SURVEY_STATUS.SUBMITTED}>Submitted</Option>
              <Option value={SURVEY_STATUS.UPDATED}>Updated</Option>
            </Select>

            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                // Đặt lại tất cả, bao gồm cả staffSearch
                setStaffSearch("");
                setUserSearch("");
                setRatingFilter(undefined);
                setStatusFilter(undefined);
                setDateRange(null);
                setCurrentPage(1);
                fetchSurveys();
              }}
              title="Reset all filters"
            />

            <Dropdown
              menu={{
                items: [
                  {
                    key: "selectAll",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={areAllColumnsVisible()}
                          onChange={(e) => toggleAllColumns(e.target.checked)}
                        >
                          Toggle All
                        </Checkbox>
                      </div>
                    ),
                  },
                  {
                    key: "divider",
                    type: "divider",
                  },
                  {
                    key: "user",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={columnVisibility.user}
                          onChange={() => handleColumnVisibilityChange("user")}
                        >
                          User
                        </Checkbox>
                      </div>
                    ),
                  },
                  {
                    key: "staff",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={columnVisibility.staff}
                          onChange={() => handleColumnVisibilityChange("staff")}
                        >
                          Staff
                        </Checkbox>
                      </div>
                    ),
                  },
                  {
                    key: "surveyDate",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={columnVisibility.surveyDate}
                          onChange={() =>
                            handleColumnVisibilityChange("surveyDate")
                          }
                        >
                          Survey Date
                        </Checkbox>
                      </div>
                    ),
                  },
                  {
                    key: "rating",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={columnVisibility.rating}
                          onChange={() =>
                            handleColumnVisibilityChange("rating")
                          }
                        >
                          Rating
                        </Checkbox>
                      </div>
                    ),
                  },
                  {
                    key: "feedback",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={columnVisibility.feedback}
                          onChange={() =>
                            handleColumnVisibilityChange("feedback")
                          }
                        >
                          Feedback
                        </Checkbox>
                      </div>
                    ),
                  },
                  {
                    key: "status",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={columnVisibility.status}
                          onChange={() =>
                            handleColumnVisibilityChange("status")
                          }
                        >
                          Status
                        </Checkbox>
                      </div>
                    ),
                  },
                  {
                    key: "action",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={columnVisibility.action}
                          onChange={() =>
                            handleColumnVisibilityChange("action")
                          }
                        >
                          Actions
                        </Checkbox>
                      </div>
                    ),
                  },
                ],
                onClick: (e) => {
                  // Prevent dropdown from closing
                  e.domEvent.stopPropagation();
                },
              }}
              trigger={["hover", "click"]}
              placement="bottomRight"
              arrow
              open={dropdownOpen}
              onOpenChange={handleDropdownVisibleChange}
              mouseEnterDelay={0.1}
              mouseLeaveDelay={0.3}
            >
              <Tooltip title="Column Settings">
                <Button icon={<SettingOutlined />}>Columns</Button>
              </Tooltip>
            </Dropdown>

            <div className="ml-auto flex gap-2">
              <Button
                type="primary"
                icon={<ExportOutlined />}
                onClick={() => setExportModalVisible(true)}
              >
                Export to Excel
              </Button>
            </div>
          </div>
        </Card>

        {/* Table Controls - Rows per page */}
        <div className="flex justify-end items-center">
          <div className="flex items-center gap-2">
            <Text type="secondary">Rows per page:</Text>
            <Select
              value={pageSize}
              onChange={(value) => handlePageChange(1, value)}
              style={{ width: 80 }}
            >
              <Option value={5}>5</Option>
              <Option value={10}>10</Option>
              <Option value={15}>15</Option>
              <Option value={20}>20</Option>
              <Option value={50}>50</Option>
              <Option value={100}>100</Option>
            </Select>
          </div>
        </div>

        {/* Data Table */}
        <Card className="shadow-sm" bodyStyle={{ padding: "16px" }}>
          <div style={{ overflowX: "auto" }}>
            <Table
              columns={visibleColumns}
              dataSource={surveys}
              rowKey="id"
              loading={loading}
              pagination={false}
              bordered
              scroll={{ x: "max-content" }}
            />
          </div>

          {/* Pagination Footer */}
          <PaginationFooter
            current={currentPage}
            pageSize={pageSize}
            total={totalSurveys}
            onChange={handlePageChange}
            showGoToPage={true}
            showTotal={true}
          />
        </Card>

        {/* Export Modal */}
        <Modal
          title={
            <div className="flex items-center">
              <ExportOutlined className="text-green-500 mr-2" />
              <span>Export Configuration</span>
            </div>
          }
          open={exportModalVisible}
          onOk={handleExport}
          onCancel={() => setExportModalVisible(false)}
          confirmLoading={loading}
        >
          <div className="mb-4">
            <Text strong>Select data to export:</Text>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <Radio.Group
              value={exportConfig.exportAllPages}
              onChange={(e) =>
                setExportConfig({
                  ...exportConfig,
                  exportAllPages: e.target.value,
                })
              }
              className="w-full"
            >
              <Space direction="vertical" className="w-full">
                <Radio value={false}>Export current page only</Radio>
                <Radio value={true}>Export all data</Radio>
              </Space>
            </Radio.Group>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Checkbox
              checked={exportConfig.includeUser}
              onChange={(e) =>
                setExportConfig({
                  ...exportConfig,
                  includeUser: e.target.checked,
                })
              }
            >
              User information
            </Checkbox>
            <Checkbox
              checked={exportConfig.includeStaff}
              onChange={(e) =>
                setExportConfig({
                  ...exportConfig,
                  includeStaff: e.target.checked,
                })
              }
            >
              Staff information
            </Checkbox>
            <Checkbox
              checked={exportConfig.includeAppointment}
              onChange={(e) =>
                setExportConfig({
                  ...exportConfig,
                  includeAppointment: e.target.checked,
                })
              }
            >
              Appointment information
            </Checkbox>
            <Checkbox
              checked={exportConfig.includeSurveyDate}
              onChange={(e) =>
                setExportConfig({
                  ...exportConfig,
                  includeSurveyDate: e.target.checked,
                })
              }
            >
              Survey date
            </Checkbox>
            <Checkbox
              checked={exportConfig.includeRating}
              onChange={(e) =>
                setExportConfig({
                  ...exportConfig,
                  includeRating: e.target.checked,
                })
              }
            >
              Rating
            </Checkbox>
            <Checkbox
              checked={exportConfig.includeFeedback}
              onChange={(e) =>
                setExportConfig({
                  ...exportConfig,
                  includeFeedback: e.target.checked,
                })
              }
            >
              Feedback
            </Checkbox>
            <Checkbox
              checked={exportConfig.includeStatus}
              onChange={(e) =>
                setExportConfig({
                  ...exportConfig,
                  includeStatus: e.target.checked,
                })
              }
            >
              Status
            </Checkbox>
            <Checkbox
              checked={exportConfig.includeCreatedAt}
              onChange={(e) =>
                setExportConfig({
                  ...exportConfig,
                  includeCreatedAt: e.target.checked,
                })
              }
            >
              Created date
            </Checkbox>
            <Checkbox
              checked={exportConfig.includeUpdatedAt}
              onChange={(e) =>
                setExportConfig({
                  ...exportConfig,
                  includeUpdatedAt: e.target.checked,
                })
              }
            >
              Updated date
            </Checkbox>
          </div>
        </Modal>

        {/* Filter Modal */}
        <Modal
          title={
            <div className="flex items-center">
              <FilterOutlined className="text-blue-500 mr-2" />
              <span className="text-lg font-semibold">Filter Surveys</span>
            </div>
          }
          open={filterModalVisible}
          onCancel={() => setFilterModalVisible(false)}
          footer={[
            <Button key="reset" onClick={resetFilters}>
              Reset Filters
            </Button>,
            <Button key="cancel" onClick={() => setFilterModalVisible(false)}>
              Cancel
            </Button>,
            <Button key="apply" type="primary" onClick={handleApplyFilters}>
              Apply Filters
            </Button>,
          ]}
          width={600}
        >
          <div className="space-y-6">
            <Alert
              message="Staff Selection"
              description="Use the dropdown menu at the top to filter surveys by staff name. You can search by typing in the dropdown."
              type="info"
              showIcon
              style={{ marginBottom: 20 }}
            />

            <div>
              <Typography.Title level={5}>
                Filter by Date Range
              </Typography.Title>
              <RangePicker
                style={{ width: "100%" }}
                placeholder={["Start date", "End date"]}
                value={dateRange as any}
                onChange={(dates) =>
                  setDateRange(
                    dates as [moment.Moment | null, moment.Moment | null]
                  )
                }
              />
            </div>

            <div>
              <Typography.Title level={5}>Filter by Rating</Typography.Title>
              <Radio.Group
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
              >
                <Space direction="vertical">
                  <Radio value={undefined}>All Ratings</Radio>
                  <Radio value={5}>
                    <div className="flex items-center">
                      <span>5 stars - Excellent</span>
                      <div className="ml-2 flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <SmileOutlined
                            key={star}
                            className="text-green-500"
                            style={{ fontSize: 16 }}
                          />
                        ))}
                      </div>
                    </div>
                  </Radio>
                  <Radio value={4}>
                    <div className="flex items-center">
                      <span>4 stars - Good</span>
                      <div className="ml-2 flex">
                        {[1, 2, 3, 4].map((star) => (
                          <SmileOutlined
                            key={star}
                            className="text-blue-500"
                            style={{ fontSize: 16 }}
                          />
                        ))}
                      </div>
                    </div>
                  </Radio>
                  <Radio value={3}>
                    <div className="flex items-center">
                      <span>3 stars - Average</span>
                      <div className="ml-2 flex">
                        {[1, 2, 3].map((star) => (
                          <MehOutlined
                            key={star}
                            className="text-yellow-500"
                            style={{ fontSize: 16 }}
                          />
                        ))}
                      </div>
                    </div>
                  </Radio>
                  <Radio value={2}>
                    <div className="flex items-center">
                      <span>2 stars - Poor</span>
                      <div className="ml-2 flex">
                        {[1, 2].map((star) => (
                          <FrownOutlined
                            key={star}
                            className="text-orange-500"
                            style={{ fontSize: 16 }}
                          />
                        ))}
                      </div>
                    </div>
                  </Radio>
                  <Radio value={1}>
                    <div className="flex items-center">
                      <span>1 star - Very Poor</span>
                      <div className="ml-2 flex">
                        <FrownOutlined
                          className="text-red-500"
                          style={{ fontSize: 16 }}
                        />
                      </div>
                    </div>
                  </Radio>
                </Space>
              </Radio.Group>
            </div>

            <div>
              <Typography.Title level={5}>Filter by Status</Typography.Title>
              <Select
                placeholder="Select status"
                value={statusFilter}
                onChange={(value) => setStatusFilter(value)}
                style={{ width: "100%" }}
                allowClear
              >
                <Option value={SURVEY_STATUS.PENDING}>Pending</Option>
                <Option value={SURVEY_STATUS.SUBMITTED}>Submitted</Option>
                <Option value={SURVEY_STATUS.UPDATED}>
                  Updated after submission
                </Option>
              </Select>
            </div>
          </div>
        </Modal>
      </div>
    </PageContainer>
  );
};
