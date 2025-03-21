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
  Empty
} from "antd";
import { toast } from "react-toastify";
import moment from "moment";
import {
  getAllHealthCheckResults,
  HealthCheckResultsResponseDTO
} from "@/api/healthcheckresult";
import { 
  SearchOutlined, 
  EditOutlined,
  EyeOutlined,
  ArrowLeftOutlined,
  InfoCircleOutlined
} from "@ant-design/icons";
import { useRouter } from 'next/router';
import EditModal from "./EditModal";
import { getUsers } from "@/api/user";

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title, Text, Paragraph } = Typography;

const formatDate = (date: string | undefined) => {
  if (!date) return '';
  return moment(date).format('DD/MM/YYYY');
};

const formatDateTime = (datetime: string | undefined) => {
  if (!datetime) return '';
  return moment(datetime).format('DD/MM/YYYY HH:mm:ss');
};

export const HealthCheckResultAdjustmentList: React.FC = () => {
  const router = useRouter();
  const [healthCheckResults, setHealthCheckResults] = useState<HealthCheckResultsResponseDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [userSearch, setUserSearch] = useState("");
  const [staffSearch, setStaffSearch] = useState("");
  const [checkupDateRange, setCheckupDateRange] = useState<[moment.Moment | null, moment.Moment | null]>([null, null]);
  const [sortBy, setSortBy] = useState("CancelledDate");
  const [ascending, setAscending] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentResult, setCurrentResult] = useState<HealthCheckResultsResponseDTO | null>(null);
  const [userOptions, setUserOptions] = useState<{ id: string; fullName: string; email: string }[]>([]);
  const [staffOptions, setStaffOptions] = useState<{ id: string; fullName: string; email: string }[]>([]);
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
        "CancelledForAdjustment", // Match the actual backend value
        checkupStartDate,
        checkupEndDate
      );

      if (response.isSuccess) {
        setHealthCheckResults(response.data);
        setTotal(response.totalRecords);
      } else {
        toast.error(response.message || "Failed to load health check results cancelled for adjustment");
      }
    } catch (error) {
      toast.error("Failed to load health check results cancelled for adjustment");
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
    checkupDateRange
  ]);

  useEffect(() => {
    fetchHealthCheckResults();
  }, [fetchHealthCheckResults]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Lấy danh sách người dùng
        const users = await getUsers();
        
        // Lọc ra người dùng thông thường (không phải staff)
        const normalUsers = users.filter((user: any) => 
          user.roles && !user.roles.some((role: string) => role === "Medical_Staff" || role === "Admin")
        );
        setUserOptions(normalUsers.map((user: any) => ({
          id: user.id,
          fullName: user.fullName,
          email: user.email
        })));
        
        // Lấy danh sách staff y tế
        const medicalStaff = users.filter((user: any) => 
          user.roles && user.roles.some((role: string) => role === "Medical_Staff")
        );
        setStaffOptions(medicalStaff.map((staff: any) => ({
          id: staff.id,
          fullName: staff.fullName,
          email: staff.email
        })));
      } catch (error) {
        console.error("Failed to fetch users:", error);
        toast.error("Không thể tải danh sách người dùng");
      }
    };
    
    fetchUsers();
  }, []);
  
  const handleEdit = (record: HealthCheckResultsResponseDTO) => {
    setCurrentResult(record);
    setIsModalVisible(true);
  };
  
  const handleCloseModal = () => {
    setIsModalVisible(false);
    setCurrentResult(null);
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
      title: "Cancelled Date",
      dataIndex: "cancelledDate",
      render: (cancelledDate: string) => formatDateTime(cancelledDate),
    },
    {
      title: "Cancellation Reason",
      dataIndex: "cancellationReason",
      render: (reason: string) => (
        <Tooltip title={reason}>
          <Paragraph ellipsis={{ rows: 2 }}>
            {reason || "No reason provided"}
          </Paragraph>
        </Tooltip>
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
          
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              className="text-blue-600"
            />
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
                Health Check Results Cancelled for Adjustment
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
                <Option value="CancelledDate">Cancelled Date</Option>
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
            emptyText: <Empty description="No health check results cancelled for adjustment found" />,
          }}
          className="border rounded-lg"
        />
      </Card>

      <Card className="mt-4 shadow-sm">
        <Row justify="space-between" align="middle">
          <Col>
            <Text type="secondary">
              Total: {total} health check results cancelled for adjustment
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
      
      <EditModal
        visible={isModalVisible}
        onClose={handleCloseModal}
        onSuccess={fetchHealthCheckResults}
        healthCheckResult={currentResult}
        userOptions={userOptions}
        staffOptions={staffOptions}
      />
    </div>
  );
}; 