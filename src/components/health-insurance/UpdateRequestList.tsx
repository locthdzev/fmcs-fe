import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  Table,
  Input,
  Select,
  Pagination,
  Space,
  Row,
  Col,
  Modal,
  Image,
  Descriptions,
  Form,
} from "antd";
import { toast } from "react-toastify";
import moment from "moment";
import {
  getUpdateRequests,
  UpdateRequestDTO,
  reviewUpdateRequest,
  setupHealthInsuranceRealTime,
} from "@/api/healthinsurance";
import { SearchOutlined } from "@ant-design/icons";

const { Option } = Select;
const { TextArea } = Input;

const formatDate = (date: string | undefined) => {
  if (!date) return "";
  return moment(date).format("DD/MM/YYYY");
};

const formatDateTime = (date: string | undefined) => {
  if (!date) return "";
  return moment(date).format("DD/MM/YYYY HH:mm:ss");
};

export function UpdateRequestList() {
  const [requests, setRequests] = useState<UpdateRequestDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>();
  const [selectedRequest, setSelectedRequest] = useState<UpdateRequestDTO | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getUpdateRequests(
        currentPage,
        pageSize,
        searchText,
        "RequestedAt",
        false,
        statusFilter
      );
      setRequests(result.data);
      setTotal(result.totalRecords);
    } catch (error) {
      toast.error("Unable to load update requests.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchText, statusFilter]);

  useEffect(() => {
    fetchRequests();
    const connection = setupHealthInsuranceRealTime(() => {
      fetchRequests();
    });
    return () => {
      connection.stop();
    };
  }, [fetchRequests]);

  const handleReview = async (requestId: string, isApproved: boolean) => {
    try {
      const response = await reviewUpdateRequest(requestId, isApproved, isApproved ? undefined : rejectionReason);
      if (response.isSuccess) {
        toast.success(isApproved ? "Request approved!" : "Request rejected!");
        fetchRequests();
        setIsModalVisible(false);
        setRejectionReason("");
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error("Unable to review request.");
    }
  };

  const columns = [
    {
      title: "Requested By",
      render: (record: UpdateRequestDTO) => (
        <div>
          <div>{record.requestedBy.userName}</div>
          <div className="text-gray-500">{record.requestedBy.email}</div>
        </div>
      ),
    },
    {
      title: "Insurance Number",
      dataIndex: "healthInsuranceNumber",
    },
    {
      title: "Full Name",
      dataIndex: "fullName",
    },
    {
      title: "Requested At",
      render: (record: UpdateRequestDTO) => formatDateTime(record.requestedAt),
    },
    {
      title: "Status",
      dataIndex: "status",
    },
    {
      title: "Actions",
      render: (record: UpdateRequestDTO) => (
        <Space>
          <Button
            onClick={() => {
              setSelectedRequest(record);
              setIsModalVisible(true);
            }}
          >
            Review
          </Button>
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
          <Select
            placeholder="Filter by status"
            value={statusFilter}
            onChange={setStatusFilter}
            allowClear
            style={{ width: 150 }}
          >
            <Option value="Pending">Pending</Option>
            <Option value="Approved">Approved</Option>
            <Option value="Rejected">Rejected</Option>
          </Select>
        </Space>
      </Col>
      <Col>
        <span style={{ color: "rgba(0, 0, 0, 0.45)" }}>
          Total {total} requests
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
        dataSource={requests}
        loading={loading}
        pagination={false}
        rowKey="id"
        style={{ marginTop: 16 }}
      />
      {bottomContent}

      <Modal
        title="Review Update Request"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setRejectionReason("");
        }}
        footer={[
          <Button
            key="reject"
            danger
            onClick={() => handleReview(selectedRequest?.id || "", false)}
            disabled={!rejectionReason}
          >
            Reject
          </Button>,
          <Button
            key="approve"
            type="primary"
            onClick={() => handleReview(selectedRequest?.id || "", true)}
          >
            Approve
          </Button>,
        ]}
        width={800}
      >
        {selectedRequest && (
          <div>
            <Descriptions title="Request Information" bordered column={2}>
              <Descriptions.Item label="Insurance Number">
                {selectedRequest.healthInsuranceNumber}
              </Descriptions.Item>
              <Descriptions.Item label="Full Name">
                {selectedRequest.fullName}
              </Descriptions.Item>
              <Descriptions.Item label="Date of Birth">
                {formatDate(selectedRequest.dateOfBirth)}
              </Descriptions.Item>
              <Descriptions.Item label="Gender">
                {selectedRequest.gender}
              </Descriptions.Item>
              <Descriptions.Item label="Address">
                {selectedRequest.address}
              </Descriptions.Item>
              <Descriptions.Item label="Healthcare Provider">
                {selectedRequest.healthcareProviderName} ({selectedRequest.healthcareProviderCode})
              </Descriptions.Item>
              <Descriptions.Item label="Valid From">
                {formatDate(selectedRequest.validFrom)}
              </Descriptions.Item>
              <Descriptions.Item label="Valid To">
                {formatDate(selectedRequest.validTo)}
              </Descriptions.Item>
              <Descriptions.Item label="Issue Date">
                {formatDate(selectedRequest.issueDate)}
              </Descriptions.Item>
              <Descriptions.Item label="Has Insurance">
                {selectedRequest.hasInsurance ? "Yes" : "No"}
              </Descriptions.Item>
            </Descriptions>
            {selectedRequest.imageUrl && (
              <div style={{ marginTop: 16 }}>
                <h4>Insurance Image</h4>
                <Image
                  src={selectedRequest.imageUrl}
                  alt="Insurance"
                  style={{ maxWidth: "100%" }}
                />
              </div>
            )}
            <Form layout="vertical" style={{ marginTop: 16 }}>
              <Form.Item
                label="Rejection Reason"
                required={true}
                rules={[{ required: true, message: "Please provide a rejection reason" }]}
              >
                <TextArea
                  rows={4}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter reason for rejection..."
                />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
}
