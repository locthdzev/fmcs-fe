import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  Table,
  Input,
  Select,
  DatePicker,
  Pagination,
  Popconfirm,
  Space,
  Row,
  Col,
  Card,
  Typography,
  Badge,
  Tag,
  Tooltip,
  Empty,
} from "antd";
import { toast } from "react-toastify";
import moment from "moment";
import {
  getAllHealthCheckResults,
  HealthCheckResultsResponseDTO,
  cancelFollowUp,
  completeHealthCheckResult
} from "@/api/healthcheckresult";
import { 
  SearchOutlined, 
  CheckCircleOutlined,
  EyeOutlined,
  CloseCircleOutlined,
  FilterOutlined,
  ArrowLeftOutlined,
  CalendarOutlined
} from "@ant-design/icons";
import { useRouter } from 'next/router';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

const formatDate = (date: string | undefined) => {
  if (!date) return '';
  return moment(date).format('DD/MM/YYYY');
};

const formatDateTime = (datetime: string | undefined) => {
  if (!datetime) return '';
  return moment(datetime).format('DD/MM/YYYY HH:mm:ss');
};

export const HealthCheckResultFollowUpList: React.FC = () => {
  const router = useRouter();
  const [healthCheckResults, setHealthCheckResults] = useState<HealthCheckResultsResponseDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [userSearch, setUserSearch] = useState("");
  const [staffSearch, setStaffSearch] = useState("");
  const [checkupDateRange, setCheckupDateRange] = useState<[moment.Moment | null, moment.Moment | null]>([null, null]);
  const [followUpDateRange, setFollowUpDateRange] = useState<[moment.Moment | null, moment.Moment | null]>([null, null]);
  const [sortBy, setSortBy] = useState("FollowUpDate");
  const [ascending, setAscending] = useState(true);
  const [followUpStatus, setFollowUpStatus] = useState<string | undefined>();
  const [codeSearch, setCodeSearch] = useState("");

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
        "FollowUpRequired",
        checkupStartDate,
        checkupEndDate,
        true,
        followUpStartDate,
        followUpEndDate,
        followUpStatus === "overdue" ? "overdue" : 
          followUpStatus === "today" ? "today" : 
          followUpStatus === "upcoming" ? "upcoming" : undefined
      );

      if (response.isSuccess) {
        setHealthCheckResults(response.data);
        setTotal(response.totalRecords);
      } else {
        toast.error(response.message || "Không thể tải danh sách kết quả khám cần tái khám");
      }
    } catch (error) {
      toast.error("Không thể tải danh sách kết quả khám cần tái khám");
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    pageSize,
    userSearch,
    staffSearch,
    sortBy,
    ascending,
    checkupDateRange,
    followUpDateRange,
    followUpStatus,
    codeSearch
  ]);

  useEffect(() => {
    fetchHealthCheckResults();
  }, [fetchHealthCheckResults]);
  
  const handleCancelFollowUp = async (id: string) => {
    try {
      const response = await cancelFollowUp(id);
      if (response.isSuccess) {
        toast.success("Đã hủy lịch tái khám!");
        fetchHealthCheckResults();
      } else {
        toast.error(response.message || "Không thể hủy lịch tái khám");
      }
    } catch (error) {
      toast.error("Không thể hủy lịch tái khám");
    }
  };
  
  const handleComplete = async (id: string) => {
    try {
      const response = await completeHealthCheckResult(id);
      if (response.isSuccess) {
        toast.success("Đã hoàn thành kết quả khám!");
        fetchHealthCheckResults();
      } else {
        toast.error(response.message || "Không thể hoàn thành kết quả khám");
      }
    } catch (error) {
      toast.error("Không thể hoàn thành kết quả khám");
    }
  };

  // Kiểm tra xem ngày tái khám đã qua chưa
  const isFollowUpOverdue = (followUpDate: string | undefined) => {
    if (!followUpDate) return false;
    const today = moment().startOf('day');
    const followUp = moment(followUpDate).startOf('day');
    return followUp.isBefore(today);
  };

  // Kiểm tra xem ngày tái khám là hôm nay không
  const isFollowUpToday = (followUpDate: string | undefined) => {
    if (!followUpDate) return false;
    const today = moment().startOf('day');
    const followUp = moment(followUpDate).startOf('day');
    return followUp.isSame(today);
  };

  const getFollowUpStatusTag = (followUpDate: string | undefined) => {
    if (!followUpDate) return <Tag color="default">Not Scheduled</Tag>;
    
    if (isFollowUpOverdue(followUpDate)) {
      return <Tag color="error">Overdue</Tag>;
    } else if (isFollowUpToday(followUpDate)) {
      return <Tag color="success">Today</Tag>;
    } else {
      return <Tag color="processing">Upcoming</Tag>;
    }
  };

  const columns = [
    {
      title: "Health Check Result Code",
      dataIndex: "healthCheckResultCode",
      render: (code: string) => <Text copyable>{code}</Text>,
    },
    {
      title: "Patient",
      dataIndex: "user",
      render: (user: any) => (
        <div>
          <Text strong>{user?.fullName}</Text>
          <div>
            <Text type="secondary" className="text-sm">{user?.email}</Text>
          </div>
        </div>
      ),
    },
    {
      title: "Checkup Date",
      dataIndex: "checkupDate",
      render: (checkupDate: string) => formatDate(checkupDate),
      sorter: true,
    },
    {
      title: "Follow-up Date",
      dataIndex: "followUpDate",
      render: (followUpDate: string, record: HealthCheckResultsResponseDTO) => (
        <Space>
          {formatDate(followUpDate)}
          {getFollowUpStatusTag(followUpDate)}
        </Space>
      ),
      sorter: true,
    },
    {
      title: "Medical Staff",
      dataIndex: "staff",
      render: (staff: any) => (
        <div>
          <Text>{staff?.fullName}</Text>
          <div>
            <Text type="secondary" className="text-sm">{staff?.email}</Text>
          </div>
        </div>
      ),
    },
    {
      title: "Actions",
      render: (record: HealthCheckResultsResponseDTO) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => router.push(`/health-check-result/${record.id}`)}
            />
          </Tooltip>
          
          <Tooltip title="Complete">
            <Button
              type="text"
              icon={<CheckCircleOutlined />}
              onClick={() => handleComplete(record.id)}
              className="text-green-600"
            />
          </Tooltip>
          
          <Tooltip title="Cancel Follow-up">
            <Popconfirm
              title="Are you sure you want to cancel this follow-up?"
              onConfirm={() => handleCancelFollowUp(record.id)}
              okText="Confirm"
              cancelText="Cancel"
            >
              <Button
                type="text"
                icon={<CloseCircleOutlined />}
                className="text-red-600"
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card className="mb-4 shadow-sm">
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Space align="center">
              <Button 
                icon={<ArrowLeftOutlined />}
                onClick={() => router.push('/health-check-result/management')}
              >
                Back
              </Button>
              <Title level={4} style={{ margin: 0 }}>
                Follow-up Required Results
              </Title>
            </Space>
          </Col>
          <Col span={24}>
            <Space size="middle" wrap>
              <Input
                placeholder="Tìm theo mã kết quả khám"
                value={codeSearch}
                onChange={(e) => setCodeSearch(e.target.value)}
                prefix={<SearchOutlined />}
                style={{ width: 200 }}
                allowClear
              />
              <Input
                placeholder="Tìm theo bệnh nhân"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                prefix={<SearchOutlined />}
                style={{ width: 200 }}
                allowClear
              />
              <Input
                placeholder="Search by medical staff"
                value={staffSearch}
                onChange={(e) => setStaffSearch(e.target.value)}
                prefix={<SearchOutlined />}
                style={{ width: 200 }}
                allowClear
              />
              <RangePicker
                placeholder={["From checkup date", "To checkup date"]}
                onChange={(dates) => {
                  setCheckupDateRange(dates as [moment.Moment | null, moment.Moment | null]);
                }}
                allowClear
              />
              <RangePicker
                placeholder={["From follow-up date", "To follow-up date"]}
                onChange={(dates) => {
                  setFollowUpDateRange(dates as [moment.Moment | null, moment.Moment | null]);
                }}
                allowClear
              />
              <Select
                placeholder="Follow-up status"
                onChange={(value) => setFollowUpStatus(value)}
                style={{ width: 150 }}
                allowClear
              >
                <Option value="overdue">Overdue</Option>
                <Option value="today">Today</Option>
                <Option value="upcoming">Upcoming</Option>
              </Select>
            </Space>
          </Col>
          <Col span={24}>
            <Space size="middle" wrap>
              <Select
                placeholder="Sort by"
                value={sortBy}
                onChange={(value) => setSortBy(value)}
                style={{ width: 150 }}
              >
                <Option value="FollowUpDate">Follow-up Date</Option>
                <Option value="CheckupDate">Checkup Date</Option>
                <Option value="CreatedAt">Created Date</Option>
              </Select>
              <Select
                placeholder="Order"
                value={ascending ? "asc" : "desc"}
                onChange={(value) => setAscending(value === "asc")}
                style={{ width: 120 }}
              >
                <Option value="asc">Ascending</Option>
                <Option value="desc">Descending</Option>
              </Select>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card className="shadow-sm">
        <Table
          columns={columns}
          dataSource={healthCheckResults}
          loading={loading}
          pagination={false}
          rowKey="id"
          locale={{
            emptyText: <Empty description="No follow-up required results found" />,
          }}
          className="border rounded-lg"
        />
      </Card>

      <Card className="mt-4 shadow-sm">
        <Row justify="space-between" align="middle">
          <Col>
            <Text type="secondary">
              Total: {total} follow-up required results
            </Text>
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
              showSizeChanger
              onShowSizeChange={(current, size) => {
                setCurrentPage(1);
                setPageSize(size);
              }}
              pageSizeOptions={['5', '10', '15', '20']}
            />
          </Col>
        </Row>
      </Card>
    </div>
  );
}; 