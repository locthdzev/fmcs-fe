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
import { SearchOutlined, RedoOutlined, WarningOutlined, DeleteOutlined } from "@ant-design/icons";

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
      title: "Policyholder",
      render: (record: HealthInsuranceResponseDTO) => (
        <div>
          <div>{record.user.fullName}</div>
          <div className="text-gray-500">{record.user.email}</div>
        </div>
      ),
    },
    {
      title: "Insurance Number",
      dataIndex: "healthInsuranceNumber",
    },
    {
      title: "Valid Period",
      render: (record: HealthInsuranceResponseDTO) => (
        <Space direction="vertical" size={0}>
          <div>From: {formatDate(record.validFrom)}</div>
          <div>To: {formatDate(record.validTo)}</div>
        </Space>
      ),
    },
    {
      title: "Status",
      render: (record: HealthInsuranceResponseDTO) => (
        <Tag icon={<WarningOutlined />} color="error">
          {record.status}
        </Tag>
      ),
    },
    {
      title: "Deadline",
      render: (record: HealthInsuranceResponseDTO) => (
        <Tooltip title={moment(record.deadline).fromNow()}>
          <Tag color="red">{formatDateTime(record.deadline)}</Tag>
        </Tooltip>
      ),
    },
    {
      title: "Actions",
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
                onOk: () => handleResendRequest(record.id),
              });
            }}
          >
            Resend Request
          </Button>
          <Popconfirm
            title="Soft Delete Insurance"
            description="Are you sure you want to soft delete this insurance?"
            onConfirm={() => handleSoftDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const topContent = (
    <Row gutter={[16, 16]} align="middle" justify="space-between">
      <Col>
        <Space>
          <Input
            placeholder="Search by insurance number"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<SearchOutlined />}
          />
        </Space>
      </Col>
      <Col>
        <span style={{ color: "rgba(0, 0, 0, 0.45)" }}>
          Total {total} expired insurances
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