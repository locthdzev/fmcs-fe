import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Input,
  Pagination,
  Space,
  Row,
  Col,
  Tag,
  Button,
  Popconfirm,
  Card,
  Typography,
  Badge,
  Tooltip,
  Divider
} from "antd";
import { toast } from "react-toastify";
import moment from "moment";
import {
  getAllHealthInsurances,
  HealthInsuranceResponseDTO,
  setupHealthInsuranceRealTime,
  sendHealthInsuranceUpdateRequest,
  softDeleteHealthInsurances,
} from "@/api/healthinsurance";
import {
  SearchOutlined,
  SendOutlined,
  DeleteOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined
} from "@ant-design/icons";

const { Title, Text } = Typography;

const formatDate = (date: string | undefined) => {
  if (!date) return "";
  return moment(date).format("DD/MM/YYYY");
};

const formatDateTime = (datetime: string | undefined) => {
  if (!datetime) return "";
  return moment(datetime).format("DD/MM/YYYY HH:mm:ss");
};

const getStatusColor = (status: string | undefined) => {
  if (!status) return "default";
  switch (status) {
    case "Pending":
      return "warning";
    case "Completed":
      return "success";
    case "Expired":
      return "error";
    default:
      return "default";
  }
};

const getDeadlineStatus = (deadline: string | undefined) => {
  if (!deadline) return {
    color: 'default',
    icon: <ClockCircleOutlined />,
    text: 'No deadline'
  };
  
  const now = moment();
  const deadlineDate = moment(deadline);
  const daysUntil = deadlineDate.diff(now, 'days');

  if (deadlineDate.isBefore(now)) {
    return {
      color: 'red',
      icon: <ExclamationCircleOutlined />,
      text: 'Expired'
    };
  } else if (daysUntil <= 3) {
    return {
      color: 'orange',
      icon: <ClockCircleOutlined />,
      text: `${daysUntil} days left`
    };
  } else {
    return {
      color: 'green',
      icon: <CheckCircleOutlined />,
      text: `${daysUntil} days left`
    };
  }
};

export function InitialInsuranceList() {
  const [insurances, setInsurances] = useState<HealthInsuranceResponseDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [isSendingRequest, setIsSendingRequest] = useState(false);

  const fetchInsurances = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAllHealthInsurances(
        currentPage,
        pageSize,
        searchText,
        "CreatedAt",
        false,
        "Pending"
      );
      setInsurances(result.data);
      setTotal(result.totalRecords);
    } catch (error) {
      toast.error("Unable to load initial insurances.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchText]);

  useEffect(() => {
    fetchInsurances();
    const connection = setupHealthInsuranceRealTime(() => {
      fetchInsurances();
    });
    return () => {
      connection.stop();
    };
  }, [fetchInsurances]);

  const handleSendUpdateRequest = async () => {
    console.log("handleSendUpdateRequest called");
    try {
      setIsSendingRequest(true);
      console.log("Calling sendHealthInsuranceUpdateRequest API");
      const response = await sendHealthInsuranceUpdateRequest();
      console.log("API response:", response);
      if (response.isSuccess) {
        toast.success("Update requests sent to all pending users successfully!");
        fetchInsurances();
      } else {
        toast.error(response.message || "Failed to send update requests");
      }
    } catch (error) {
      console.error("Error in sendHealthInsuranceUpdateRequest:", error);
      toast.error("Unable to send update requests.");
    } finally {
      setIsSendingRequest(false);
    }
  };

  const handleSoftDelete = async (id: string) => {
    try {
      const response = await softDeleteHealthInsurances([id]);
      if (response.isSuccess) {
        toast.success("Insurance soft deleted successfully!");
        fetchInsurances();
      } else {
        toast.error(response.message || "Failed to soft delete insurance");
      }
    } catch (error) {
      toast.error("Unable to soft delete insurance.");
    }
  };

  const columns = [
    {
      title: (
        <div className="flex items-center">
          <UserOutlined className="mr-2" />
          Policyholder
        </div>
      ),
      render: (record: HealthInsuranceResponseDTO) => (
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <UserOutlined className="text-blue-500" />
          </div>
          <div>
            <Text strong className="block">{record.user.fullName}</Text>
            <Text type="secondary" className="text-sm">{record.user.email}</Text>
          </div>
        </div>
      ),
    },
    {
      title: (
        <div className="flex items-center">
          <SyncOutlined className="mr-2" />
          Status
        </div>
      ),
      width: 150,
      render: (record: HealthInsuranceResponseDTO) => (
        <Badge
          status={getStatusColor(record.status)}
          text={
            <Text style={{ color: record.status === 'Pending' ? '#faad14' : record.status === 'Completed' ? '#52c41a' : '#ff4d4f' }}>
              {record.status}
            </Text>
          }
        />
      ),
    },
    {
      title: (
        <div className="flex items-center">
          <CalendarOutlined className="mr-2" />
          Created Date
        </div>
      ),
      width: 200,
      render: (record: HealthInsuranceResponseDTO) => (
        <div className="flex flex-col">
          <Text strong>{moment(record.createdAt).format('DD/MM/YYYY')}</Text>
          <Text type="secondary" className="text-sm">{moment(record.createdAt).format('HH:mm:ss')}</Text>
        </div>
      ),
    },
    {
      title: (
        <div className="flex items-center">
          <UserOutlined className="mr-2" />
          Created By
        </div>
      ),
      width: 200,
      render: (record: HealthInsuranceResponseDTO) =>
        record.createdBy ? (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <UserOutlined className="text-green-500" />
            </div>
            <div>
              <Text strong className="block">{record.createdBy.userName}</Text>
              <Text type="secondary" className="text-sm">{record.createdBy.email}</Text>
            </div>
          </div>
        ) : (
          <Tag color="default">System</Tag>
        ),
    },
    {
      title: (
        <div className="flex items-center">
          <ClockCircleOutlined className="mr-2" />
          Deadline
        </div>
      ),
      width: 150,
      render: (record: HealthInsuranceResponseDTO) => {
        const status = getDeadlineStatus(record.deadline);
        return (
          <Tooltip title={formatDateTime(record.deadline)}>
            <div className="flex items-center space-x-2">
              {status.icon}
              <Text style={{ color: status.color }}>{status.text}</Text>
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: "Actions",
      width: 120,
      render: (record: HealthInsuranceResponseDTO) => (
        <Space>
          <Popconfirm
            title="Delete Insurance"
            description="Are you sure you want to delete this insurance?"
            onConfirm={() => handleSoftDelete(record.id)}
            okText="Yes"
            cancelText="No"
            icon={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              className="hover:bg-red-50"
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    }
  ];

  const topContent = (
    <Card className="mb-4">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <Title level={5} className="mb-0">Initial Insurance List</Title>
          <Text type="secondary">Total: {total}</Text>
        </div>
        <Divider className="my-3" />
        <Row gutter={[16, 16]} align="middle" justify="space-between">
          <Col>
            <Space size="middle">
              <Input.Search
                placeholder="Search by name or email"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 300 }}
                className="search-input"
              />
              <Popconfirm
                title="Send Update Request"
                description="Are you sure you want to send update requests to all pending users?"
                onConfirm={handleSendUpdateRequest}
                okText="Yes"
                cancelText="No"
                icon={<ExclamationCircleOutlined style={{ color: '#1890ff' }} />}
              >
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  loading={isSendingRequest}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  Send All Requests
                </Button>
              </Popconfirm>
            </Space>
          </Col>
        </Row>
      </div>
    </Card>
  );

  const bottomContent = (
    <Card className="mt-4">
      <Row justify="end">
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={total}
          onChange={(page, size) => {
            setCurrentPage(page);
            setPageSize(size);
          }}
          showSizeChanger
          showTotal={(total) => `Total ${total} records`}
          className="pagination-custom"
        />
      </Row>
    </Card>
  );

  return (
    <div className="space-y-4">
      {topContent}
      <Card bodyStyle={{ padding: 0 }}>
        <Table
          columns={columns}
          dataSource={insurances}
          loading={loading}
          pagination={false}
          rowKey="id"
          className="custom-table"
        />
      </Card>
      {bottomContent}
    </div>
  );
} 