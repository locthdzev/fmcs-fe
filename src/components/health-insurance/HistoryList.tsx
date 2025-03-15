import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Input,
  Select,
  Pagination,
  Space,
  Row,
  Col,
  Tag,
  Card,
  Typography,
  Badge,
  Divider,
  Tooltip,
} from "antd";
import type { TableProps } from "antd";
import { toast } from "react-toastify";
import moment from "moment";
import {
  getAllHealthInsuranceHistories,
  HistoryDTO,
  setupHealthInsuranceRealTime,
} from "@/api/healthinsurance";
import {
  SearchOutlined,
  UserOutlined,
  HistoryOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
  ClockCircleOutlined,
  SwapOutlined,
  MailOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;

const formatDateTime = (date: string | undefined) => {
  if (!date) return "";
  return moment(date).format("DD/MM/YYYY HH:mm:ss");
};

export function HistoryList() {
  const [histories, setHistories] = useState<HistoryDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [sortBy, setSortBy] = useState("UpdatedAt");
  const [ascending, setAscending] = useState(false);

  const fetchHistories = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAllHealthInsuranceHistories(
        currentPage,
        pageSize,
        searchText,
        sortBy,
        ascending
      );
      setHistories(result.data);
      setTotal(result.totalRecords);
    } catch (error) {
      toast.error("Unable to load histories.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchText, sortBy, ascending]);

  useEffect(() => {
    fetchHistories();
    const connection = setupHealthInsuranceRealTime(() => {
      fetchHistories();
    });
    return () => {
      connection.stop();
    };
  }, [fetchHistories]);

  const columns: TableProps<HistoryDTO>["columns"] = [
    {
      title: (
        <div className="flex items-center">
          <UserOutlined className="mr-2" />
          Updated By
        </div>
      ),
      render: (record: HistoryDTO) => (
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
            <UserOutlined className="text-purple-500" />
          </div>
          <div>
            <Text strong className="block">{record.updatedBy.userName}</Text>
            <div className="flex items-center space-x-2">
              <MailOutlined className="text-gray-400" />
              <Text type="secondary" className="text-sm">{record.updatedBy.email}</Text>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: (
        <div className="flex items-center">
          <ClockCircleOutlined className="mr-2" />
          Updated At
        </div>
      ),
      render: (record: HistoryDTO) => (
        <Tooltip title={moment(record.updatedAt).fromNow()}>
          <div className="flex items-center space-x-2">
            <ClockCircleOutlined className="text-gray-400" />
            <Text>{formatDateTime(record.updatedAt)}</Text>
          </div>
        </Tooltip>
      ),
      sorter: true,
      sortOrder: sortBy === "UpdatedAt" ? (ascending ? "ascend" : "descend") : undefined,
    },
    {
      title: (
        <div className="flex items-center">
          <SwapOutlined className="mr-2" />
          Status Change
        </div>
      ),
      render: (record: HistoryDTO) => (
        <Space direction="vertical" size="middle">
          {record.previousStatus !== record.newStatus && (
            <div className="flex items-center space-x-2">
              <Text>Status:</Text>
              <Tag icon={<InfoCircleOutlined />} color="orange">
                {record.previousStatus}
              </Tag>
              <SwapOutlined className="text-gray-400" />
              <Tag icon={<CheckCircleOutlined />} color="green">
                {record.newStatus}
              </Tag>
            </div>
          )}
          {record.previousVerificationStatus !== record.newVerificationStatus && (
            <div className="flex items-center space-x-2">
              <Text>Verification:</Text>
              <Tag icon={<InfoCircleOutlined />} color="orange">
                {record.previousVerificationStatus}
              </Tag>
              <SwapOutlined className="text-gray-400" />
              <Tag icon={<CheckCircleOutlined />} color="green">
                {record.newVerificationStatus}
              </Tag>
            </div>
          )}
        </Space>
      ),
    },
    {
      title: (
        <div className="flex items-center">
          <InfoCircleOutlined className="mr-2" />
          Change Details
        </div>
      ),
      dataIndex: "changeDetails",
      width: "30%",
      render: (text: string) => (
        <div className="whitespace-pre-wrap">
          <Text>{text}</Text>
        </div>
      ),
    },
  ];

  const topContent = (
    <Card className="mb-4">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <HistoryOutlined className="text-purple-500 text-xl" />
            <Title level={5} className="mb-0">Insurance History Records</Title>
          </div>
          <Badge count={total} showZero className="site-badge-count-4" />
        </div>
        <Divider className="my-3" />
        <Row gutter={[16, 16]} align="middle" justify="space-between">
          <Col>
            <Space size="middle">
              <Input.Search
                placeholder="Search by user or details"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 300 }}
                className="search-input"
              />
              <Select
                value={sortBy}
                onChange={(value) => {
                  setSortBy(value);
                  setAscending(false);
                }}
                style={{ width: 150 }}
                suffixIcon={<SortAscendingOutlined />}
              >
                <Option value="UpdatedAt">
                  <ClockCircleOutlined className="mr-2" />Updated At
                </Option>
                <Option value="UserName">
                  <UserOutlined className="mr-2" />User Name
                </Option>
              </Select>
              <Select
                value={ascending ? "asc" : "desc"}
                onChange={(value) => setAscending(value === "asc")}
                style={{ width: 120 }}
                suffixIcon={ascending ? <SortAscendingOutlined /> : <SortDescendingOutlined />}
              >
                <Option value="asc">
                  <SortAscendingOutlined className="mr-2" />Ascending
                </Option>
                <Option value="desc">
                  <SortDescendingOutlined className="mr-2" />Descending
                </Option>
              </Select>
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
          dataSource={histories}
          loading={loading}
          pagination={false}
          rowKey="id"
          className="custom-table"
          onChange={(pagination, filters, sorter) => {
            if (sorter && !Array.isArray(sorter)) {
              setAscending(sorter.order === "ascend");
            }
          }}
        />
      </Card>
      {bottomContent}
    </div>
  );
} 