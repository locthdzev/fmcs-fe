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
  completeHealthCheckResult,
  cancelCompletelyHealthCheckResult
} from "@/api/healthcheckresult";
import { 
  SearchOutlined, 
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ArrowLeftOutlined
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

export const HealthCheckResultNoFollowUpList: React.FC = () => {
  const router = useRouter();
  const [healthCheckResults, setHealthCheckResults] = useState<HealthCheckResultsResponseDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [userSearch, setUserSearch] = useState("");
  const [staffSearch, setStaffSearch] = useState("");
  const [checkupDateRange, setCheckupDateRange] = useState<[moment.Moment | null, moment.Moment | null]>([null, null]);
  const [sortBy, setSortBy] = useState("CheckupDate");
  const [ascending, setAscending] = useState(false);
  const [codeSearch, setCodeSearch] = useState("");

  const fetchHealthCheckResults = useCallback(async () => {
    setLoading(true);
    try {
      const checkupStartDate = checkupDateRange[0] ? checkupDateRange[0].format('YYYY-MM-DD') : undefined;
      const checkupEndDate = checkupDateRange[1] ? checkupDateRange[1].format('YYYY-MM-DD') : undefined;

      const response = await getAllHealthCheckResults(
        currentPage,
        pageSize,
        codeSearch || undefined,
        userSearch || undefined,
        staffSearch || undefined,
        sortBy,
        ascending,
        "NoFollowUpRequired", // Match the actual backend value
        checkupStartDate,
        checkupEndDate,
        false // followUpRequired = false
      );

      if (response.isSuccess) {
        setHealthCheckResults(response.data);
        setTotal(response.totalRecords);
      } else {
        toast.error(response.message || "Failed to load health check results with no follow-up required");
      }
    } catch (error) {
      toast.error("Failed to load health check results with no follow-up required");
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
    codeSearch
  ]);

  useEffect(() => {
    fetchHealthCheckResults();
  }, [fetchHealthCheckResults]);
  
  const handleComplete = async (id: string) => {
    try {
      const response = await completeHealthCheckResult(id);
      if (response.isSuccess) {
        toast.success("Health check result has been completed!");
        fetchHealthCheckResults();
      } else {
        toast.error(response.message || "Failed to complete health check result");
      }
    } catch (error) {
      toast.error("Failed to complete health check result");
    }
  };
  
  const handleCancel = async (id: string) => {
    try {
      const response = await cancelCompletelyHealthCheckResult(id, "Cancelled by user");
      if (response.isSuccess) {
        toast.success("Health check result has been cancelled!");
        fetchHealthCheckResults();
      } else {
        toast.error(response.message || "Failed to cancel health check result");
      }
    } catch (error) {
      toast.error("Failed to cancel health check result");
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
      title: "Approved Date",
      dataIndex: "approvedDate",
      render: (approvedDate: string) => formatDateTime(approvedDate),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status: string) => (
        <Tag color="green">No Follow-up Required</Tag>
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
          
          <Tooltip title="Cancel">
            <Popconfirm
              title="Are you sure you want to cancel this health check result?"
              onConfirm={() => handleCancel(record.id)}
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
                Health Check Results - No Follow-up Required
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
                <Option value="ApprovedDate">Approved Date</Option>
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
            emptyText: <Empty description="No health check results found with no follow-up required" />,
          }}
          className="border rounded-lg"
        />
      </Card>

      <Card className="mt-4 shadow-sm">
        <Row justify="space-between" align="middle">
          <Col>
            <Text type="secondary">
              Total: {total} health check results with no follow-up required
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