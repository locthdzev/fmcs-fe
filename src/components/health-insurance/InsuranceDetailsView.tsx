import React from "react";
import { 
  Button, 
  Card, 
  Descriptions, 
  Space, 
  Typography, 
  Image, 
  Tag, 
  Row, 
  Col, 
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileImageOutlined,
  UserOutlined,
  ClockCircleOutlined,
  SendOutlined,
  FileExclamationOutlined,
  WarningOutlined,
  StopOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import { HealthInsuranceResponseDTO } from "@/api/healthinsurance";
import { NextRouter } from "next/router";
import dayjs from "dayjs";

const { Text } = Typography;

interface InsuranceDetailsViewProps {
  insurance: HealthInsuranceResponseDTO;
  router: NextRouter;
}

// Define the type for the component with static property
interface InsuranceDetailsViewType extends React.FC<InsuranceDetailsViewProps> {
  HeaderActions: React.FC<HeaderActionsProps>;
}

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

interface HeaderActionsProps {
  insurance: HealthInsuranceResponseDTO;
  onEdit: () => void;
  onVerify: (status: string) => void;
  onDelete: () => void;
}

const HeaderActions: React.FC<HeaderActionsProps> = ({
  insurance,
  onEdit,
  onVerify,
  onDelete,
}) => {
  return (
    <Space>
      {insurance?.verificationStatus === "Pending" && (
        <>
          <Button 
            type="primary" 
            icon={<CheckCircleOutlined />} 
            onClick={() => onVerify("Verified")}
          >
            Verify
          </Button>
          <Button 
            danger 
            icon={<CloseCircleOutlined />} 
            onClick={() => onVerify("Rejected")}
          >
            Reject
          </Button>
        </>
      )}
      <Button 
        icon={<EditOutlined />} 
        onClick={onEdit}
      >
        Edit
      </Button>
      <Button 
        danger 
        icon={<DeleteOutlined />} 
        onClick={onDelete}
      >
        Delete
      </Button>
    </Space>
  );
};

const InsuranceDetailsView: InsuranceDetailsViewType = ({ insurance, router }) => {
  return (
    <Row gutter={[24, 24]}>
      <Col span={24} md={16}>
        <Card title="User Information" className="mb-4">
          <Descriptions column={1} bordered>
            <Descriptions.Item label="User">
              <Button type="link" style={{ padding: 0 }} onClick={() => router.push(`/user/${insurance.user?.id}`)}>
                {insurance.user?.fullName}
              </Button>
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              {insurance.user?.email || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              {getStatusTag(insurance.status)}
            </Descriptions.Item>
            <Descriptions.Item label="Verification">
              {getVerificationTag(insurance.verificationStatus)}
            </Descriptions.Item>
          </Descriptions>
        </Card>
        
        <Card title="Insurance Information">
          <Descriptions column={2} bordered>
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
            <Descriptions.Item label="Deadline">
              {formatDateTime(insurance.deadline)}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </Col>

      <Col span={24} md={8}>
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
    </Row>
  );
};

// Attach the HeaderActions component as a static property
InsuranceDetailsView.HeaderActions = HeaderActions;

export default InsuranceDetailsView; 