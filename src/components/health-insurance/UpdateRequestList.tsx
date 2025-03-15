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
  getUpdateRequests,
  UpdateRequestDTO,
  reviewUpdateRequest,
  setupHealthInsuranceRealTime,
} from "@/api/healthinsurance";
import {
  SearchOutlined,
  UserOutlined,
  CalendarOutlined,
  IdcardOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileImageOutlined,
  ExclamationCircleOutlined,
  HomeOutlined,
  MedicineBoxOutlined,
  GlobalOutlined,
  ClockCircleOutlined,
  MailOutlined,
  FilterOutlined,
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;
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
      title: (
        <div className="flex items-center">
          <UserOutlined className="mr-2" />
          Requested By
        </div>
      ),
      render: (record: UpdateRequestDTO) => (
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <UserOutlined className="text-blue-500" />
          </div>
          <div>
            <Text strong className="block">{record.requestedBy.userName}</Text>
            <div className="flex items-center space-x-2">
              <MailOutlined className="text-gray-400" />
              <Text type="secondary" className="text-sm">{record.requestedBy.email}</Text>
            </div>
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
        <Text strong className="text-blue-600">{text}</Text>
      ),
    },
    {
      title: (
        <div className="flex items-center">
          <UserOutlined className="mr-2" />
          Full Name
        </div>
      ),
      dataIndex: "fullName",
      render: (text: string) => (
        <Text strong>{text}</Text>
      ),
    },
    {
      title: (
        <div className="flex items-center">
          <ClockCircleOutlined className="mr-2" />
          Requested At
        </div>
      ),
      render: (record: UpdateRequestDTO) => (
        <Tooltip title={moment(record.requestedAt).fromNow()}>
          <div className="flex items-center space-x-2">
            <ClockCircleOutlined className="text-gray-400" />
            <Text>{formatDateTime(record.requestedAt)}</Text>
          </div>
        </Tooltip>
      ),
    },
    {
      title: (
        <div className="flex items-center">
          <ExclamationCircleOutlined className="mr-2" />
          Status
        </div>
      ),
      dataIndex: "status",
      render: (status: string) => {
        const statusConfig = {
          Pending: { color: 'warning', icon: <ClockCircleOutlined /> },
          Approved: { color: 'success', icon: <CheckCircleOutlined /> },
          Rejected: { color: 'error', icon: <CloseCircleOutlined /> },
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        return (
          <Tag icon={config.icon} color={config.color} className="px-3 py-1">
            {status}
          </Tag>
        );
      },
    },
    {
      title: (
        <div className="flex items-center">
          <CheckCircleOutlined className="mr-2" />
          Actions
        </div>
      ),
      render: (record: UpdateRequestDTO) => (
        <Button
          type="primary"
          icon={<CheckCircleOutlined />}
          onClick={() => {
            setSelectedRequest(record);
            setIsModalVisible(true);
          }}
          className="bg-blue-500 hover:bg-blue-600"
          disabled={record.status !== "Pending"}
        >
          Review
        </Button>
      ),
    },
  ];

  const topContent = (
    <Card className="mb-4">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileImageOutlined className="text-blue-500 text-xl" />
            <Title level={5} className="mb-0">Insurance Update Requests</Title>
          </div>
          <Badge count={total} showZero className="site-badge-count-4" />
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
              <Select
                placeholder="Filter by status"
                value={statusFilter}
                onChange={setStatusFilter}
                allowClear
                style={{ width: 150 }}
                suffixIcon={<FilterOutlined />}
              >
                <Option value="Pending">
                  <ClockCircleOutlined className="mr-2" />Pending
                </Option>
                <Option value="Approved">
                  <CheckCircleOutlined className="mr-2" />Approved
                </Option>
                <Option value="Rejected">
                  <CloseCircleOutlined className="mr-2" />Rejected
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
          dataSource={requests}
          loading={loading}
          pagination={false}
          rowKey="id"
          className="custom-table"
        />
      </Card>
      {bottomContent}

      <Modal
        title={
          <div className="flex items-center space-x-2">
            <FileImageOutlined className="text-blue-500" />
            <Text strong>Review Insurance Update Request</Text>
          </div>
        }
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setRejectionReason("");
        }}
        footer={[
          <Button
            key="reject"
            danger
            icon={<CloseCircleOutlined />}
            onClick={() => handleReview(selectedRequest?.id || "", false)}
            disabled={!rejectionReason}
          >
            Reject
          </Button>,
          <Button
            key="approve"
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => handleReview(selectedRequest?.id || "", true)}
            className="bg-green-500 hover:bg-green-600"
          >
            Approve
          </Button>,
        ]}
        width={800}
        className="review-modal"
      >
        {selectedRequest && (
          <div className="space-y-6">
            <Card className="shadow-sm">
              <Descriptions title={
                <div className="flex items-center space-x-2 mb-4">
                  <IdcardOutlined className="text-blue-500" />
                  <Text strong>Request Information</Text>
                </div>
              } bordered column={2}>
                <Descriptions.Item 
                  label={
                    <div className="flex items-center space-x-2">
                      <IdcardOutlined />
                      <span>Insurance Number</span>
                    </div>
                  }
                >
                  <Text strong>{selectedRequest.healthInsuranceNumber}</Text>
                </Descriptions.Item>
                <Descriptions.Item 
                  label={
                    <div className="flex items-center space-x-2">
                      <UserOutlined />
                      <span>Full Name</span>
                    </div>
                  }
                >
                  <Text strong>{selectedRequest.fullName}</Text>
                </Descriptions.Item>
                <Descriptions.Item 
                  label={
                    <div className="flex items-center space-x-2">
                      <CalendarOutlined />
                      <span>Date of Birth</span>
                    </div>
                  }
                >
                  {formatDate(selectedRequest.dateOfBirth)}
                </Descriptions.Item>
                <Descriptions.Item 
                  label={
                    <div className="flex items-center space-x-2">
                      <UserOutlined />
                      <span>Gender</span>
                    </div>
                  }
                >
                  {selectedRequest.gender}
                </Descriptions.Item>
                <Descriptions.Item 
                  label={
                    <div className="flex items-center space-x-2">
                      <HomeOutlined />
                      <span>Address</span>
                    </div>
                  }
                  span={2}
                >
                  {selectedRequest.address}
                </Descriptions.Item>
                <Descriptions.Item 
                  label={
                    <div className="flex items-center space-x-2">
                      <MedicineBoxOutlined />
                      <span>Healthcare Provider</span>
                    </div>
                  }
                  span={2}
                >
                  <Space>
                    <Text strong>{selectedRequest.healthcareProviderName}</Text>
                    <Tag color="blue">{selectedRequest.healthcareProviderCode}</Tag>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item 
                  label={
                    <div className="flex items-center space-x-2">
                      <CalendarOutlined />
                      <span>Valid Period</span>
                    </div>
                  }
                  span={2}
                >
                  <Space>
                    <Badge status="processing" text={`From: ${formatDate(selectedRequest.validFrom)}`} />
                    <Badge status="warning" text={`To: ${formatDate(selectedRequest.validTo)}`} />
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item 
                  label={
                    <div className="flex items-center space-x-2">
                      <GlobalOutlined />
                      <span>Issue Date</span>
                    </div>
                  }
                >
                  {formatDate(selectedRequest.issueDate)}
                </Descriptions.Item>
                <Descriptions.Item 
                  label={
                    <div className="flex items-center space-x-2">
                      <ExclamationCircleOutlined />
                      <span>Has Insurance</span>
                    </div>
                  }
                >
                  <Tag color={selectedRequest.hasInsurance ? "success" : "error"}>
                    {selectedRequest.hasInsurance ? "Yes" : "No"}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {selectedRequest.imageUrl && (
              <Card 
                title={
                  <div className="flex items-center space-x-2">
                    <FileImageOutlined className="text-blue-500" />
                    <Text strong>Insurance Image</Text>
                  </div>
                }
                className="shadow-sm"
              >
                <Image
                  src={selectedRequest.imageUrl}
                  alt="Insurance"
                  style={{ maxWidth: "100%" }}
                  className="rounded-lg"
                />
              </Card>
            )}

            <Card 
              title={
                <div className="flex items-center space-x-2">
                  <CloseCircleOutlined className="text-red-500" />
                  <Text strong>Rejection Reason</Text>
                </div>
              }
              className="shadow-sm"
            >
              <Form layout="vertical">
                <Form.Item
                  required={true}
                  rules={[{ required: true, message: "Please provide a rejection reason" }]}
                >
                  <TextArea
                    rows={4}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter reason for rejection..."
                    className="rejection-reason"
                  />
                </Form.Item>
              </Form>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
}
