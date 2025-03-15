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
  Modal,
  Tooltip,
  Popconfirm,
  Card,
  Typography,
  Badge,
  Divider
} from "antd";
import { toast } from "react-toastify";
import moment from "moment";
import {
  getAllHealthInsurances,
  HealthInsuranceResponseDTO,
  setupHealthInsuranceRealTime,
  resendUpdateRequest,
  softDeleteHealthInsurances,
} from "@/api/healthinsurance";
import { 
  SearchOutlined, 
  RedoOutlined, 
  WarningOutlined, 
  DeleteOutlined,
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
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

export function ExpiredUpdateList() {
  const [insurances, setInsurances] = useState<HealthInsuranceResponseDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [resendingId, setResendingId] = useState<string | null>(null);

  const fetchInsurances = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAllHealthInsurances(
        currentPage,
        pageSize,
        searchText,
        "Deadline",
        true,
        "Expired"
      );
      setInsurances(result.data);
      setTotal(result.totalRecords);
    } catch (error) {
      toast.error("Unable to load expired insurances.");
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

  const handleResendRequest = async (id: string) => {
    try {
      setResendingId(id);
      const response = await resendUpdateRequest(id);
      if (response.isSuccess) {
        toast.success("Update request resent successfully!");
        fetchInsurances();
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error("Unable to resend update request.");
    } finally {
      setResendingId(null);
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
          Insurance Number
        </div>
      ),
      dataIndex: "healthInsuranceNumber",
      render: (text: string) => (
        <Text strong className="text-blue-600">{text}</Text>
      ),
    },
    {
      title: (
        <div className="flex items-center">
          <CalendarOutlined className="mr-2" />
          Valid Period
        </div>
      ),
      render: (record: HealthInsuranceResponseDTO) => (
        <div className="space-y-1">
          <div className="flex items-center">
            <Badge status="success" />
            <Text className="ml-2">From: {formatDate(record.validFrom)}</Text>
          </div>
          <div className="flex items-center">
            <Badge status="error" />
            <Text className="ml-2">To: {formatDate(record.validTo)}</Text>
          </div>
        </div>
      ),
    },
    {
      title: (
        <div className="flex items-center">
          <WarningOutlined className="mr-2" />
          Status
        </div>
      ),
      render: (record: HealthInsuranceResponseDTO) => (
        <Tag icon={<WarningOutlined />} color="error" className="px-3 py-1">
          {record.status}
        </Tag>
      ),
    },
    {
      title: (
        <div className="flex items-center">
          <ClockCircleOutlined className="mr-2" />
          Deadline
        </div>
      ),
      render: (record: HealthInsuranceResponseDTO) => (
        <Tooltip title={moment(record.deadline).fromNow()}>
          <div className="flex items-center space-x-2">
            <ExclamationCircleOutlined className="text-red-500" />
            <Text type="danger">{formatDateTime(record.deadline)}</Text>
          </div>
        </Tooltip>
      ),
    },
    {
      title: (
        <div className="flex items-center">
          <SyncOutlined className="mr-2" />
          Actions
        </div>
      ),
      render: (record: HealthInsuranceResponseDTO) => (
        <Space>
          <Button
            type="primary"
            icon={<RedoOutlined />}
            loading={resendingId === record.id}
            onClick={() => {
              Modal.confirm({
                title: "Resend Update Request",
                content: "Are you sure you want to resend the update request to this user?",
                okText: "Yes",
                cancelText: "No",
                icon: <ExclamationCircleOutlined className="text-blue-500" />,
                onOk: () => handleResendRequest(record.id),
              });
            }}
            className="bg-blue-500 hover:bg-blue-600"
          >
            Resend Request
          </Button>
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
    },
  ];

  const topContent = (
    <Card className="mb-4">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <Title level={5} className="mb-0">Expired Insurance List</Title>
          <Text type="secondary">Total: {total}</Text>
        </div>
        <Divider className="my-3" />
        <Row gutter={[16, 16]} align="middle" justify="space-between">
          <Col>
            <Space size="middle">
              <Input.Search
                placeholder="Search by insurance number"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 300 }}
                className="search-input"
              />
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