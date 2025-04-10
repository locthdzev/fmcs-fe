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
  Input as AntInput
} from "antd";
import { toast } from "react-toastify";
import moment from "moment";
import {
  getAllHealthCheckResults,
  HealthCheckResultsResponseDTO,
  approveHealthCheckResult,
  cancelCompletelyHealthCheckResult,
  cancelForAdjustmentHealthCheckResult
} from "@/api/healthcheckresult";
import { 
  SearchOutlined, 
  CheckCircleOutlined,
  EyeOutlined,
  CloseCircleOutlined,
  FilterOutlined,
  ArrowLeftOutlined,
  CloseSquareOutlined
} from "@ant-design/icons";
import { useRouter } from 'next/router';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title, Text } = Typography;
const { TextArea } = AntInput;

const formatDate = (date: string | undefined) => {
  if (!date) return '';
  return moment(date).format('DD/MM/YYYY');
};

const formatDateTime = (datetime: string | undefined) => {
  if (!datetime) return '';
  return moment(datetime).format('DD/MM/YYYY HH:mm:ss');
};

export const HealthCheckResultWaitingForApprovalList: React.FC = () => {
  const router = useRouter();
  const [healthCheckResults, setHealthCheckResults] = useState<HealthCheckResultsResponseDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [userSearch, setUserSearch] = useState("");
  const [staffSearch, setStaffSearch] = useState("");
  const [checkupDateRange, setCheckupDateRange] = useState<[moment.Moment | null, moment.Moment | null]>([null, null]);
  const [followUpRequired, setFollowUpRequired] = useState<boolean | undefined>();
  const [followUpDateRange, setFollowUpDateRange] = useState<[moment.Moment | null, moment.Moment | null]>([null, null]);
  const [sortBy, setSortBy] = useState("CheckupDate");
  const [ascending, setAscending] = useState(false);
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
        "Waiting for Approval",
        checkupStartDate,
        checkupEndDate,
        followUpRequired,
        followUpStartDate,
        followUpEndDate
      );

      if (response.isSuccess) {
        setHealthCheckResults(response.data);
        setTotal(response.totalRecords);
      } else {
        toast.error(response.message || "Failed to load health check results waiting for approval");
      }
    } catch (error) {
      toast.error("Failed to load health check results waiting for approval");
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
    followUpRequired,
    followUpDateRange,
    codeSearch
  ]);

  useEffect(() => {
    fetchHealthCheckResults();
  }, [fetchHealthCheckResults]);
  
  const handleApprove = async (id: string) => {
    try {
      const response = await approveHealthCheckResult(id);
      if (response.isSuccess) {
        toast.success("Health check result has been approved!");
        fetchHealthCheckResults();
      } else {
        toast.error(response.message || "Failed to approve health check result");
      }
    } catch (error) {
      toast.error("Failed to approve health check result");
    }
  };
  
  const handleCancel = async (id: string, reason: string) => {
    try {
      const response = await cancelCompletelyHealthCheckResult(id, reason);
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
  
  const handleCancelForAdjustment = async (id: string, reason: string) => {
    try {
      const response = await cancelForAdjustmentHealthCheckResult(id, reason);
      if (response.isSuccess) {
        toast.success("Health check result has been cancelled for adjustment!");
        fetchHealthCheckResults();
      } else {
        toast.error(response.message || "Failed to cancel health check result for adjustment");
      }
    } catch (error) {
      toast.error("Failed to cancel health check result for adjustment");
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
      title: "Follow-up",
      dataIndex: "followUpRequired",
      render: (followUpRequired: boolean, record: HealthCheckResultsResponseDTO) => (
        <Space direction="vertical" size={0}>
          {followUpRequired ? (
            <>
              <Badge status="processing" text="Follow-up Required" />
              <Text>{record.followUpDate ? formatDate(record.followUpDate) : 'Not scheduled yet'}</Text>
            </>
          ) : (
            <Badge status="default" text="No Follow-up Required" />
          )}
        </Space>
      )
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
          
          <Tooltip title="Approve">
            <Button
              type="text"
              icon={<CheckCircleOutlined />}
              onClick={() => handleApprove(record.id)}
              className="text-green-600"
            />
          </Tooltip>
          
          <Tooltip title="Cancel">
            <Popconfirm
              title="Enter reason for cancellation"
              description={
                <TextArea 
                  placeholder="Reason for cancellation"
                  onChange={(e) => {
                    (e.target as any).reason = e.target.value;
                  }}
                  rows={3}
                />
              }
              onConfirm={(e) => {
                const target = e?.target as any;
                const reason = target?.reason || "No reason provided";
                handleCancel(record.id, reason);
              }}
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
          
          <Tooltip title="Cancel for Adjustment">
            <Popconfirm
              title="Enter reason for adjustment"
              description={
                <TextArea 
                  placeholder="Reason for adjustment"
                  onChange={(e) => {
                    (e.target as any).reason = e.target.value;
                  }}
                  rows={3}
                />
              }
              onConfirm={(e) => {
                const target = e?.target as any;
                const reason = target?.reason || "No reason provided";
                handleCancelForAdjustment(record.id, reason);
              }}
              okText="Confirm"
              cancelText="Cancel"
            >
              <Button
                type="text"
                icon={<CloseSquareOutlined />}
                className="text-yellow-600"
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
                Health Check Results Waiting for Approval
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
              <Select
                placeholder="Follow-up Required"
                onChange={(value) => setFollowUpRequired(value === undefined ? undefined : value === "yes")}
                style={{ width: 150 }}
                allowClear
              >
                <Option value="yes">Yes</Option>
                <Option value="no">No</Option>
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
            emptyText: <Empty description="No health check results waiting for approval" />,
          }}
          className="border rounded-lg"
        />
      </Card>

      <Card className="mt-4 shadow-sm">
        <Row justify="space-between" align="middle">
          <Col>
            <Text type="secondary">
              Total: {total} health check results waiting for approval
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