import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Input,
  Pagination,
  Space,
  Row,
  Col,
  Card,
  Typography,
  Badge,
  Divider,
  Tag,
  Tooltip,
} from "antd";
import { toast } from "react-toastify";
import moment from "moment";
import {
  getAllHealthInsurances,
  HealthInsuranceResponseDTO,
  setupHealthInsuranceRealTime,
} from "@/api/healthinsurance";
import {
  SearchOutlined,
  UserOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  MailOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

const formatDateTime = (datetime: string | undefined) => {
  if (!datetime) return "";
  return moment(datetime).format("DD/MM/YYYY HH:mm:ss");
};

export function NoInsuranceList() {
  const [insurances, setInsurances] = useState<HealthInsuranceResponseDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchText, setSearchText] = useState("");

  const fetchInsurances = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAllHealthInsurances(
        currentPage,
        pageSize,
        searchText,
        "CreatedAt",
        false,
        "NoInsurance"
      );
      setInsurances(result.data);
      setTotal(result.totalRecords);
    } catch (error) {
      toast.error("Unable to load users without insurance.");
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

  const columns = [
    {
      title: (
        <div className="flex items-center">
          <UserOutlined className="mr-2" />
          User Information
        </div>
      ),
      render: (record: HealthInsuranceResponseDTO) => (
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
            <UserOutlined className="text-red-500" />
          </div>
          <div>
            <Text strong className="block">{record.user.fullName}</Text>
            <div className="flex items-center space-x-2">
              <MailOutlined className="text-gray-400" />
              <Text type="secondary" className="text-sm">{record.user.email}</Text>
            </div>
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
      dataIndex: "status",
      render: (status: string) => (
        <Tag icon={<ExclamationCircleOutlined />} color="error" className="px-3 py-1">
          No Insurance
        </Tag>
      ),
    },
    {
      title: (
        <div className="flex items-center">
          <ClockCircleOutlined className="mr-2" />
          Last Updated
        </div>
      ),
      dataIndex: "updatedAt",
      render: (datetime: string) => (
        <Tooltip title={moment(datetime).fromNow()}>
          <div className="flex items-center space-x-2">
            <ClockCircleOutlined className="text-gray-400" />
            <Text>{formatDateTime(datetime)}</Text>
          </div>
        </Tooltip>
      ),
    },
  ];

  const topContent = (
    <Card className="mb-4">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <WarningOutlined className="text-red-500 text-xl" />
            <Title level={5} className="mb-0">Users Without Insurance</Title>
          </div>
          <Badge count={total} showZero className="site-badge-count-4" />
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