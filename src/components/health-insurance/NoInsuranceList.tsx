import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Input,
  Pagination,
  Space,
  Row,
  Col,
} from "antd";
import { toast } from "react-toastify";
import {
  getAllHealthInsurances,
  HealthInsuranceResponseDTO,
  setupHealthInsuranceRealTime,
} from "@/api/healthinsurance";
import { SearchOutlined } from "@ant-design/icons";

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
      title: "User",
      render: (record: HealthInsuranceResponseDTO) => (
        <div>
          <div>{record.user.fullName}</div>
          <div className="text-gray-500">{record.user.email}</div>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
    },
    {
      title: "Last Updated",
      dataIndex: "updatedAt",
    },
  ];

  const topContent = (
    <Row gutter={[16, 16]} align="middle" justify="space-between">
      <Col>
        <Space>
          <Input
            placeholder="Search by name or email"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<SearchOutlined />}
          />
        </Space>
      </Col>
      <Col>
        <span style={{ color: "rgba(0, 0, 0, 0.45)" }}>
          Total {total} users without insurance
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
        dataSource={insurances}
        loading={loading}
        pagination={false}
        rowKey="id"
        style={{ marginTop: 16 }}
      />
      {bottomContent}
    </div>
  );
} 