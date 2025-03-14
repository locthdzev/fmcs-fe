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
} from "antd";
import { toast } from "react-toastify";
import moment from "moment";
import {
  getAllHealthInsurances,
  HealthInsuranceResponseDTO,
  setupHealthInsuranceRealTime,
  sendHealthInsuranceUpdateRequest,
} from "@/api/healthinsurance";
import { SearchOutlined, SendOutlined } from "@ant-design/icons";

const formatDate = (date: string | undefined) => {
  if (!date) return "";
  return moment(date).format("DD/MM/YYYY");
};

const formatDateTime = (datetime: string | undefined) => {
  if (!datetime) return "";
  return moment(datetime).format("DD/MM/YYYY HH:mm:ss");
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
    try {
      setIsSendingRequest(true);
      const response = await sendHealthInsuranceUpdateRequest();
      if (response.isSuccess) {
        toast.success("Update requests sent successfully!");
        fetchInsurances();
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error("Unable to send update requests.");
    } finally {
      setIsSendingRequest(false);
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
      title: "Status",
      render: (record: HealthInsuranceResponseDTO) => (
        <Tag color={record.status === "Pending" ? "gold" : "green"}>
          {record.status}
        </Tag>
      ),
    },
    {
      title: "Created At",
      render: (record: HealthInsuranceResponseDTO) => formatDateTime(record.createdAt),
    },
    {
      title: "Created By",
      render: (record: HealthInsuranceResponseDTO) =>
        record.createdBy ? (
          <div>
            <div>{record.createdBy.userName}</div>
            <div className="text-gray-500">{record.createdBy.email}</div>
          </div>
        ) : (
          "System"
        ),
    },
    {
      title: "Deadline",
      render: (record: HealthInsuranceResponseDTO) => (
        <Tag color={moment(record.deadline).isBefore(moment()) ? "red" : "blue"}>
          {formatDateTime(record.deadline)}
        </Tag>
      ),
    },
    {
      title: "Actions",
      render: () => (
        <Button
          type="link"
          icon={<SendOutlined />}
          onClick={() => {
            Modal.confirm({
              title: "Send Update Request",
              content: "Are you sure you want to send update requests to all pending users?",
              okText: "Yes",
              cancelText: "No",
              onOk: handleSendUpdateRequest,
            });
          }}
        >
          Send Request
        </Button>
      ),
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
          <Button
            type="primary"
            icon={<SendOutlined />}
            loading={isSendingRequest}
            onClick={() => {
              Modal.confirm({
                title: "Send Update Request",
                content: "Are you sure you want to send update requests to all pending users?",
                okText: "Yes",
                cancelText: "No",
                onOk: handleSendUpdateRequest,
              });
            }}
          >
            Send All Requests
          </Button>
        </Space>
      </Col>
      <Col>
        <span style={{ color: "rgba(0, 0, 0, 0.45)" }}>
          Total {total} initial insurances
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