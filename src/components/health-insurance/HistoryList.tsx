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
} from "antd";
import type { TableProps } from "antd";
import { toast } from "react-toastify";
import moment from "moment";
import {
  getAllHealthInsuranceHistories,
  HistoryDTO,
  setupHealthInsuranceRealTime,
} from "@/api/healthinsurance";
import { SearchOutlined } from "@ant-design/icons";

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
      title: "Updated By",
      render: (record: HistoryDTO) => (
        <div>
          <div>{record.updatedBy.userName}</div>
          <div className="text-gray-500">{record.updatedBy.email}</div>
        </div>
      ),
    },
    {
      title: "Updated At",
      render: (record: HistoryDTO) => formatDateTime(record.updatedAt),
      sorter: true,
      sortOrder: sortBy === "UpdatedAt" ? (ascending ? "ascend" : "descend") : undefined,
    },
    {
      title: "Status Change",
      render: (record: HistoryDTO) => (
        <Space direction="vertical">
          {record.previousStatus !== record.newStatus && (
            <div>
              Status: <Tag color="orange">{record.previousStatus}</Tag> →{" "}
              <Tag color="green">{record.newStatus}</Tag>
            </div>
          )}
          {record.previousVerificationStatus !== record.newVerificationStatus && (
            <div>
              Verification: <Tag color="orange">{record.previousVerificationStatus}</Tag> →{" "}
              <Tag color="green">{record.newVerificationStatus}</Tag>
            </div>
          )}
        </Space>
      ),
    },
    {
      title: "Change Details",
      dataIndex: "changeDetails",
      width: "30%",
    },
  ];

  const topContent = (
    <Row gutter={[16, 16]} align="middle" justify="space-between">
      <Col>
        <Space>
          <Input
            placeholder="Search by user or details"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<SearchOutlined />}
          />
          <Select
            value={sortBy}
            onChange={(value) => {
              setSortBy(value);
              setAscending(false);
            }}
            style={{ width: 150 }}
          >
            <Option value="UpdatedAt">Updated At</Option>
            <Option value="UserName">User Name</Option>
          </Select>
          <Select
            value={ascending ? "asc" : "desc"}
            onChange={(value) => setAscending(value === "asc")}
            style={{ width: 120 }}
          >
            <Option value="asc">Ascending</Option>
            <Option value="desc">Descending</Option>
          </Select>
        </Space>
      </Col>
      <Col>
        <span style={{ color: "rgba(0, 0, 0, 0.45)" }}>
          Total {total} history records
        </span>
      </Col>
    </Row>
  );

  const bottomContent = (
    <Row justify="end" style={{ marginTop: 16 }}>
      <Pagination
        current={currentPage}
        pageSize={pageSize}
        total={total}
        onChange={(page, size) => {
          setCurrentPage(page);
          setPageSize(size);
        }}
        showSizeChanger
        showTotal={(total) => `Total ${total} items`}
      />
    </Row>
  );

  return (
    <div>
      {topContent}
      <Table
        columns={columns}
        dataSource={histories}
        loading={loading}
        pagination={false}
        rowKey="id"
        style={{ marginTop: 16 }}
        onChange={(pagination, filters, sorter) => {
          if (sorter && !Array.isArray(sorter)) {
            setAscending(sorter.order === "ascend");
          }
        }}
      />
      {bottomContent}
    </div>
  );
} 