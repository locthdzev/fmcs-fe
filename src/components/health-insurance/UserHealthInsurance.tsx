import React, { useEffect, useState } from "react";
import {
  Card,
  Button,
  Descriptions,
  Image,
  Spin,
  Row,
  Col,
  Tag,
  Alert,
  Divider,
  Typography,
  Space,
  Statistic,
  Badge,
  Empty,
  Modal,
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  FileImageOutlined,
  InfoCircleOutlined,
  MedicineBoxOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getCurrentUserHealthInsurance,
} from "@/api/healthinsurance";
import { formatDate } from "@/utils/dateUtils";
import UpdateRequestModal from "./UpdateRequestModal";

const { Title, Text, Paragraph } = Typography;

export function UserHealthInsurance() {
  const [loading, setLoading] = useState(true);
  const [insurance, setInsurance] = useState<any>(null);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);

  useEffect(() => {
    fetchInsurance();
  }, []);

  const fetchInsurance = async () => {
    try {
      const response = await getCurrentUserHealthInsurance();
      if (response.isSuccess) {
        setInsurance(response.data);
      }
    } catch (error) {
      Modal.error({
        title: 'Error',
        content: 'Failed to fetch insurance information. Please try again later.',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return <Badge status="success" text={<Text strong>{status}</Text>} />;
      case 'Pending':
        return <Badge status="processing" text={<Text strong>{status}</Text>} />;
      case 'Submitted':
        return <Badge status="warning" text={<Text strong>{status}</Text>} />;
      case 'Expired':
        return <Badge status="error" text={<Text strong>{status}</Text>} />;
      default:
        return <Badge status="default" text={<Text strong>{status}</Text>} />;
    }
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'Verified':
        return <Badge status="success" text={<Text strong>{status}</Text>} />;
      case 'Unverified':
        return <Badge status="warning" text={<Text strong>{status}</Text>} />;
      case 'Rejected':
        return <Badge status="error" text={<Text strong>{status}</Text>} />;
      default:
        return <Badge status="default" text={<Text strong>{status}</Text>} />;
    }
  };

  const handleUpdateSuccess = () => {
    setUpdateModalVisible(false);
    fetchInsurance();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Spin size="large" tip="Loading your insurance information..." />
      </div>
    );
  }

  if (!insurance) {
    return (
      <Card>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No insurance information found"
        >
          <Button type="primary" onClick={() => setUpdateModalVisible(true)}>
            Add Insurance Information
          </Button>
        </Empty>
      </Card>
    );
  }

  const isExpired = insurance.validTo && dayjs(insurance.validTo).isBefore(dayjs());
  const isExpiringSoon = insurance.validTo && 
    dayjs(insurance.validTo).isAfter(dayjs()) && 
    dayjs(insurance.validTo).diff(dayjs(), 'day') <= 30;

  return (
    <>
      <Card 
        title={
          <Title level={4}>
            <MedicineBoxOutlined /> My Health Insurance
          </Title>
        }
        extra={
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            onClick={() => setUpdateModalVisible(true)}
          >
            {insurance.verificationStatus === "Verified" 
              ? "Request Update" 
              : "Update Information"}
          </Button>
        }
      >
        {isExpired && (
          <Alert
            message="Insurance Expired"
            description="Your health insurance has expired. Please update your insurance information."
            type="error"
            showIcon
            icon={<ExclamationCircleOutlined />}
            style={{ marginBottom: 16 }}
          />
        )}

        {isExpiringSoon && (
          <Alert
            message="Insurance Expiring Soon"
            description={`Your health insurance will expire on ${formatDate(insurance.validTo)}. Please consider renewing it soon.`}
            type="warning"
            showIcon
            icon={<WarningOutlined />}
            style={{ marginBottom: 16 }}
          />
        )}

        {insurance.status === "Pending" && (
          <Alert
            message="Action Required"
            description="Your insurance information is pending. Please complete your submission."
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
            style={{ marginBottom: 16 }}
          />
        )}

        <Row gutter={[24, 24]}>
          <Col xs={24} md={16}>
            <Card 
              type="inner" 
              title={<Text strong><InfoCircleOutlined /> Insurance Status</Text>}
              style={{ marginBottom: 16 }}
            >
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic 
                    title="Status" 
                    value={insurance.status} 
                    valueRender={() => getStatusBadge(insurance.status)}
                  />
                </Col>
                <Col span={12}>
                  <Statistic 
                    title="Verification" 
                    value={insurance.verificationStatus} 
                    valueRender={() => getVerificationBadge(insurance.verificationStatus)}
                  />
                </Col>
                {insurance.deadline && (
                  <Col span={24}>
                    <Alert
                      message={
                        <Space>
                          <ClockCircleOutlined />
                          <Text strong>Deadline: {formatDate(insurance.deadline)}</Text>
                        </Space>
                      }
                      type="info"
                      style={{ marginTop: 8 }}
                    />
                  </Col>
                )}
              </Row>
            </Card>

            {insurance.hasInsurance && (
              <Card 
                type="inner" 
                title={<Text strong><CheckCircleOutlined /> Insurance Details</Text>}
              >
                <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small">
                  <Descriptions.Item label="Insurance Number" span={2}>
                    <Text copyable>{insurance.healthInsuranceNumber}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Full Name">
                    {insurance.fullName}
                  </Descriptions.Item>
                  <Descriptions.Item label="Date of Birth">
                    {formatDate(insurance.dateOfBirth)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Gender">
                    {insurance.gender}
                  </Descriptions.Item>
                  <Descriptions.Item label="Address">
                    {insurance.address}
                  </Descriptions.Item>
                  <Descriptions.Item label="Healthcare Provider" span={2}>
                    <div>
                      <div>{insurance.healthcareProviderName}</div>
                      <Text type="secondary">Code: {insurance.healthcareProviderCode}</Text>
                    </div>
                  </Descriptions.Item>
                  <Descriptions.Item label="Valid From">
                    {formatDate(insurance.validFrom)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Valid To">
                    <Space>
                      {formatDate(insurance.validTo)}
                      {isExpired && <Tag color="red">Expired</Tag>}
                      {isExpiringSoon && <Tag color="orange">Expiring Soon</Tag>}
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Issue Date">
                    {formatDate(insurance.issueDate)}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}
          </Col>

          <Col xs={24} md={8}>
            <Card 
              type="inner" 
              title={<Text strong><FileImageOutlined /> Insurance Card</Text>}
              style={{ height: '100%' }}
            >
              {insurance.imageUrl ? (
                <div style={{ textAlign: 'center' }}>
                  <Image 
                    src={insurance.imageUrl} 
                    alt="Insurance Card" 
                    style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }}
                  />
                </div>
              ) : (
                <Empty 
                  image={Empty.PRESENTED_IMAGE_SIMPLE} 
                  description="No insurance image uploaded"
                />
              )}
            </Card>
          </Col>
        </Row>

        <Divider />

        <Row>
          <Col span={24}>
            <Paragraph type="secondary">
              <InfoCircleOutlined /> Last updated: {formatDate(insurance.updatedAt || insurance.createdAt)}
              {insurance.updatedBy ? ` by ${insurance.updatedBy.userName}` : ''}
            </Paragraph>
          </Col>
        </Row>
      </Card>

      <UpdateRequestModal
        visible={updateModalVisible}
        insurance={insurance}
        onClose={() => setUpdateModalVisible(false)}
        onSuccess={handleUpdateSuccess}
      />
    </>
  );
} 