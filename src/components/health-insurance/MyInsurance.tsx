import React, { useState, useEffect } from "react";
import {
  Card,
  Typography,
  Button,
  Spin,
  Empty,
  Space,
  Tag,
  Image,
  Row,
  Col,
  Descriptions,
  Divider,
  message,
  Alert,
} from "antd";
import {
  FileImageOutlined,
  EditOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  FileExclamationOutlined,
  WarningOutlined,
  FormOutlined,
  SyncOutlined,
  SendOutlined,
  CloseCircleOutlined,
  QuestionCircleOutlined,
  StopOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getCurrentUserHealthInsurance,
  HealthInsuranceResponseDTO,
  getCurrentUserPendingUpdateRequests,
  UpdateRequestDTO,
} from "@/api/healthinsurance";
import MyInsuranceUpdateModal from "./MyInsuranceUpdateModal";
import MyInsuranceUpdateRequestModal from "./MyInsuranceUpdateRequestModal";

const { Title, Text } = Typography;

const formatDate = (dateStr: string | undefined) => {
  if (!dateStr) return "-";
  return dayjs(dateStr).format("DD/MM/YYYY");
};

const formatDateTime = (dateStr: string | undefined) => {
  if (!dateStr) return "-";
  return dayjs(dateStr).format("DD/MM/YYYY HH:mm:ss");
};

const getStatusTag = (status: string | undefined) => {
  if (!status) return <Tag>Unknown</Tag>;
  
  switch (status) {
    case "Pending":
      return <Tag icon={<ClockCircleOutlined />} color="processing">Pending</Tag>;
    case "Submitted":
      return <Tag icon={<SendOutlined />} color="blue">Submitted</Tag>;
    case "Completed":
      return <Tag icon={<CheckCircleOutlined />} color="success">Completed</Tag>;
    case "Expired":
      return <Tag icon={<WarningOutlined />} color="error">Expired</Tag>;
    case "DeadlineExpired":
      return <Tag icon={<FileExclamationOutlined />} color="volcano">Deadline Expired</Tag>;
    case "SoftDeleted":
      return <Tag icon={<StopOutlined />} color="default">Soft Deleted</Tag>;
    case "NotApplicable":
      return <Tag icon={<QuestionCircleOutlined />} color="default">N/A</Tag>;
    case "Initial":
      return <Tag icon={<ClockCircleOutlined />} color="processing">Initial</Tag>;
    case "AboutToExpire":
      return <Tag icon={<WarningOutlined />} color="orange">About To Expire</Tag>;
    case "ExpiredUpdate":
      return <Tag icon={<FileExclamationOutlined />} color="magenta">Expired Update</Tag>;
    case "NoInsurance":
      return <Tag icon={<QuestionCircleOutlined />} color="purple">No Insurance</Tag>;
    case "Active":
      return <Tag icon={<CheckCircleOutlined />} color="success">Active</Tag>;
    default:
      return <Tag>{status}</Tag>;
  }
};

const getVerificationTag = (status: string | undefined) => {
  if (!status) return <Tag>Not Verified</Tag>;
  
  switch (status) {
    case "Unverified":
      return <Tag icon={<ClockCircleOutlined />} color="warning">Unverified</Tag>;
    case "Verified":
      return <Tag icon={<CheckCircleOutlined />} color="success">Verified</Tag>;
    case "Rejected":
      return <Tag icon={<CloseCircleOutlined />} color="error">Rejected</Tag>;
    case "Pending":
      return <Tag icon={<ClockCircleOutlined />} color="warning">Pending</Tag>;
    default:
      return <Tag>{status}</Tag>;
  }
};

export const UserHealthInsurance: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [insurance, setInsurance] = useState<HealthInsuranceResponseDTO | null>(null);
  const [pendingRequests, setPendingRequests] = useState<UpdateRequestDTO[]>([]);
  const [updateModalVisible, setUpdateModalVisible] = useState<boolean>(false);
  const [updateRequestModalVisible, setUpdateRequestModalVisible] = useState<boolean>(false);
  const [messageApi, contextHolder] = message.useMessage();

  const fetchInsurance = async () => {
    try {
      setLoading(true);
      const response = await getCurrentUserHealthInsurance();
      if (response.isSuccess) {
        setInsurance(response.data);
      } else {
        messageApi.error(response.message || "Failed to load insurance information");
      }
    } catch (error) {
      console.error("Error fetching insurance:", error);
      messageApi.error("Failed to load insurance information");
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const response = await getCurrentUserPendingUpdateRequests();
      if (response.isSuccess) {
        setPendingRequests(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching pending requests:", error);
    }
  };

  useEffect(() => {
    fetchInsurance();
    fetchPendingRequests();
  }, []);

  const handleUpdate = () => {
    setUpdateModalVisible(true);
  };

  const handleUpdateRequest = () => {
    setUpdateRequestModalVisible(true);
  };

  const handleUpdateSuccess = () => {
    fetchInsurance();
    fetchPendingRequests();
    setUpdateModalVisible(false);
    messageApi.success("Your insurance has been updated and is waiting for verification");
  };

  const handleUpdateRequestSuccess = () => {
    fetchInsurance();
    fetchPendingRequests();
    setUpdateRequestModalVisible(false);
    messageApi.success("Your update request has been submitted for review");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Spin size="large" tip="Loading your health insurance information..." />
      </div>
    );
  }

  if (!insurance) {
    return (
      <Card>
        <Empty
          description="No health insurance information found"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  const canUpdateDirectly = 
    insurance.status === "Pending" && 
    insurance.verificationStatus === "Unverified";
    
  const canRequestUpdate = insurance.verificationStatus === "Verified";
  const hasPendingRequests = pendingRequests.length > 0;

  return (
    <>
      {contextHolder}
      <Card className="shadow-md rounded-lg mb-6">
        <div className="flex justify-between items-center mb-4">
          <Title level={4} className="m-0">My Health Insurance</Title>
          <Space>
            {canUpdateDirectly && !hasPendingRequests && (
              <Button 
                type="primary" 
                icon={<EditOutlined />} 
                onClick={handleUpdate}
              >
                Update Health Insurance
              </Button>
            )}
            {canRequestUpdate && !hasPendingRequests && (
              <Button 
                type="primary" 
                icon={<FormOutlined />} 
                onClick={handleUpdateRequest}
              >
                Request Health Insurance Update
              </Button>
            )}
          </Space>
        </div>

        {hasPendingRequests && (
          <Alert
            message="Pending Update Request"
            description="You have pending update requests that need to be reviewed by an administrator. You cannot make new requests until the current ones are processed."
            type="info"
            showIcon
            icon={<SyncOutlined spin />}
            className="mb-4"
          />
        )}

        {insurance.verificationStatus === "Rejected" && (
          <Alert
            message="Health Insurance Rejected"
            description="Your health insurance information has been rejected. Please update the information and submit again."
            type="error"
            showIcon
            className="mb-4"
          />
        )}

        <Row gutter={[24, 24]}>
          <Col xs={24} md={16}>
            <Card title="Insurance Information" className="mb-4">
              <Descriptions column={2} bordered>
                <Descriptions.Item label="Status" span={2}>
                  {getStatusTag(insurance.status)}
                  {" "}
                  {getVerificationTag(insurance.verificationStatus)}
                </Descriptions.Item>
                <Descriptions.Item label="Insurance Number" span={2}>
                  {insurance.healthInsuranceNumber || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Full Name">
                  {insurance.fullName || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Date of Birth">
                  {formatDate(insurance.dateOfBirth)}
                </Descriptions.Item>
                <Descriptions.Item label="Gender">
                  {insurance.gender || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Address" span={2}>
                  {insurance.address || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Healthcare Provider" span={2}>
                  {insurance.healthcareProviderName} {insurance.healthcareProviderCode ? `(${insurance.healthcareProviderCode})` : ""}
                </Descriptions.Item>
                <Descriptions.Item label="Valid From">
                  {formatDate(insurance.validFrom)}
                </Descriptions.Item>
                <Descriptions.Item label="Valid To">
                  {formatDate(insurance.validTo)}
                </Descriptions.Item>
                <Descriptions.Item label="Issue Date">
                  {formatDate(insurance.issueDate)}
                </Descriptions.Item>
                <Descriptions.Item label="Deadline" span={insurance.deadline ? 1 : 2}>
                  {insurance.deadline ? formatDateTime(insurance.deadline) : "-"}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="Record Information">
              <Descriptions column={1} bordered>
                <Descriptions.Item label="Created At">
                  {formatDateTime(insurance.createdAt)}
                </Descriptions.Item>
                <Descriptions.Item label="Created By">
                  {insurance.createdBy ? `${insurance.createdBy.userName || ""} (${insurance.createdBy.email || ""})` : "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Updated At">
                  {formatDateTime(insurance.updatedAt)}
                </Descriptions.Item>
                <Descriptions.Item label="Updated By">
                  {insurance.updatedBy ? `${insurance.updatedBy.userName || ""} (${insurance.updatedBy.email || ""})` : "-"}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card title="Insurance Card Image" className="mb-4">
              {insurance.imageUrl ? (
                <div className="flex justify-center">
                  <Image
                    src={insurance.imageUrl}
                    alt="Insurance Card"
                    style={{ maxWidth: "100%" }}
                  />
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileImageOutlined style={{ fontSize: 48, color: '#ccc' }} />
                  <div className="mt-2">No image available</div>
                </div>
              )}
            </Card>

            {hasPendingRequests && (
              <Card title="Pending Update Requests">
                {pendingRequests.map((request, index) => (
                  <div key={request.id} className="mb-2">
                    <Text>
                      Request submitted on {formatDateTime(request.requestedAt)}
                    </Text>
                    <br />
                    <Text type="secondary">Status: {request.status}</Text>
                    {index < pendingRequests.length - 1 && <Divider />}
                  </div>
                ))}
              </Card>
            )}
          </Col>
        </Row>
      </Card>

      <MyInsuranceUpdateModal
        visible={updateModalVisible}
        insurance={insurance}
        onClose={() => setUpdateModalVisible(false)}
        onSuccess={handleUpdateSuccess}
      />

      <MyInsuranceUpdateRequestModal
        visible={updateRequestModalVisible}
        insurance={insurance}
        onClose={() => setUpdateRequestModalVisible(false)}
        onSuccess={handleUpdateRequestSuccess}
      />
    </>
  );
};

