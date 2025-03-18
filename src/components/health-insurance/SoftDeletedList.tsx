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
  Tooltip,
  Card,
  Typography,
  Badge,
  Divider,
} from "antd";
import { toast } from "react-toastify";
import moment from "moment";
import {
  getAllHealthInsurances,
  HealthInsuranceResponseDTO,
  setupHealthInsuranceRealTime,
  restoreHealthInsurance,
} from "@/api/healthinsurance";
import {
  SearchOutlined,
  UndoOutlined,
  DeleteOutlined,
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  MailOutlined,
  IdcardOutlined,
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

export function SoftDeletedList() {
  const [insurances, setInsurances] = useState<HealthInsuranceResponseDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const fetchInsurances = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAllHealthInsurances(
        currentPage,
        pageSize,
        searchText,
        "UpdatedAt",
        false,
        "SoftDeleted"
      );
      setInsurances(result.data);
      setTotal(result.totalRecords);
    } catch (error) {
      toast.error("Unable to load soft-deleted insurances.");
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

  const handleRestore = async (id: string) => {
    try {
      setRestoringId(id);
      const response = await restoreHealthInsurance(id);
      if (response.isSuccess) {
        toast.success("Insurance restored successfully!");
        fetchInsurances();
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error("Unable to restore insurance.");
    } finally {
      setRestoringId(null);
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
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <UserOutlined className="text-gray-500" />
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
          <IdcardOutlined className="mr-2" />
          Insurance Number
        </div>
      ),
      dataIndex: "healthInsuranceNumber",
      render: (text: string) => (
        <Text strong className="text-gray-600">{text}</Text>
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
            <Badge status="default" />
            <Text className="ml-2">From: {formatDate(record.validFrom)}</Text>
          </div>
          <div className="flex items-center">
            <Badge status="default" />
            <Text className="ml-2">To: {formatDate(record.validTo)}</Text>
          </div>
        </div>
      ),
    },
    {
      title: (
        <div className="flex items-center">
          <DeleteOutlined className="mr-2" />
          Status
        </div>
      ),
      render: (record: HealthInsuranceResponseDTO) => (
        <Tag icon={<DeleteOutlined />} color="default" className="px-3 py-1">
          Soft Deleted
        </Tag>
      ),
    },
    {
      title: (
        <div className="flex items-center">
          <ClockCircleOutlined className="mr-2" />
          Deleted At
        </div>
      ),
      render: (record: HealthInsuranceResponseDTO) => (
        <Tooltip title={moment(record.updatedAt).fromNow()}>
          <div className="flex items-center space-x-2">
            <ClockCircleOutlined className="text-gray-500" />
            <Text>{formatDateTime(record.updatedAt)}</Text>
          </div>
        </Tooltip>
      ),
    },
    {
      title: (
        <div className="flex items-center">
          <MailOutlined className="mr-2" />
          Deleted By
        </div>
      ),
      render: (record: HealthInsuranceResponseDTO) =>
        record.updatedBy ? (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <UserOutlined className="text-gray-500" />
            </div>
            <div>
              <Text strong className="block">{record.updatedBy.userName}</Text>
              <Text type="secondary" className="text-sm">{record.updatedBy.email}</Text>
            </div>
          </div>
        ) : (
          <Text type="secondary">System</Text>
        ),
    },
    {
      title: (
        <div className="flex items-center">
          <UndoOutlined className="mr-2" />
          Actions
        </div>
      ),
      render: (record: HealthInsuranceResponseDTO) => (
        <Popconfirm
          title="Restore Insurance"
          description="Are you sure you want to restore this insurance?"
          onConfirm={() => handleRestore(record.id)}
          okText="Yes"
          cancelText="No"
          icon={<ExclamationCircleOutlined style={{ color: '#52c41a' }} />}
        >
          <Button
            type="primary"
            icon={<UndoOutlined />}
            loading={restoringId === record.id}
            className="bg-green-500 hover:bg-green-600"
          >
            Restore
          </Button>
        </Popconfirm>
      ),
    },
  ];

  const topContent = (
    <Card className="mb-4">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <Title level={5} className="mb-0">Soft Deleted Insurance List</Title>
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