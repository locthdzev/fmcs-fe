import React, { useState } from "react";
import {
  Modal,
  Descriptions,
  Button,
  Space,
  Image,
  Typography,
  Divider,
  message,
  Radio,
  Input,
  Form,
  Row,
  Col,
  Card,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import {
  UpdateRequestDTO,
  verifyHealthInsurance,
} from "@/api/healthinsurance";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface VerificationModalProps {
  visible: boolean;
  request: UpdateRequestDTO;
  onClose: () => void;
  onSuccess: () => void;
}

const VerificationModal: React.FC<VerificationModalProps> = ({
  visible,
  request,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [verificationStatus, setVerificationStatus] = useState<string>("Verified");
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [messageApi, contextHolder] = message.useMessage();

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "-";
    return dayjs(dateStr).format("DD/MM/YYYY");
  };

  const formatDateTime = (dateStr: string | undefined) => {
    if (!dateStr) return "-";
    return dayjs(dateStr).format("DD/MM/YYYY HH:mm:ss");
  };

  const handleVerification = async () => {
    setLoading(true);
    try {
      const result = await verifyHealthInsurance(
        request.healthInsuranceId, 
        verificationStatus,
        verificationStatus === "Rejected" ? rejectionReason : undefined
      );
      
      if (result.isSuccess) {
        messageApi.success(`Insurance ${verificationStatus.toLowerCase()} successfully`);
        onSuccess();
      } else {
        messageApi.error(result.message || "Failed to verify insurance");
      }
    } catch (error) {
      messageApi.error("Failed to verify insurance");
      console.error("Error verifying insurance:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={<Title level={4}>Verify Health Insurance</Title>}
      open={visible}
      onCancel={onClose}
      width={1000}
      footer={null}
    >
      {contextHolder}
      <Descriptions
        bordered
        column={2}
        size="small"
        layout="vertical"
        title={<Text strong>User Information</Text>}
      >
        <Descriptions.Item label="Name">{request.requestedBy?.userName || "-"}</Descriptions.Item>
        <Descriptions.Item label="Email">{request.requestedBy?.email || "-"}</Descriptions.Item>
      </Descriptions>

      <Divider />

      <Row gutter={[24, 24]} align="top">
        <Col xs={24} md={14}>
          <Text strong className="block mb-2">Insurance Details</Text>
          <Descriptions
            bordered
            column={2}
            size="small"
          >
            <Descriptions.Item label="Insurance Number" span={2}>{request.healthInsuranceNumber || "-"}</Descriptions.Item>
            <Descriptions.Item label="Full Name">
              {request.fullName || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Date of Birth">
              {formatDate(request.dateOfBirth)}
            </Descriptions.Item>
            <Descriptions.Item label="Gender">
              {request.gender || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Address" span={2}>
              {request.address || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Healthcare Provider" span={2}>
              {request.healthcareProviderName}{" "}
              {request.healthcareProviderCode ? `(${request.healthcareProviderCode})` : ""}
            </Descriptions.Item>
            <Descriptions.Item label="Valid From">
              {formatDate(request.validFrom)}
            </Descriptions.Item>
            <Descriptions.Item label="Valid To">
              {formatDate(request.validTo)}
            </Descriptions.Item>
            <Descriptions.Item label="Issue Date">
              {formatDate(request.issueDate)}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              {request.status}
            </Descriptions.Item>
            <Descriptions.Item label="Has Insurance" span={2}>
              {request.hasInsurance ? "Yes" : "No"}
            </Descriptions.Item>
            <Descriptions.Item label="Requested At" span={2}>
              {formatDateTime(request.requestedAt)}
            </Descriptions.Item>
          </Descriptions>
        </Col>

        <Col xs={24} md={10}>
          {request.imageUrl && (
            <>
              <Text strong className="block mb-2">Insurance Card Image</Text>
              <div className="flex justify-center border rounded-md p-3">
                <Image 
                  src={request.imageUrl} 
                  alt="Insurance Card" 
                  style={{ maxWidth: "100%", maxHeight: "350px" }} 
                />
              </div>
            </>
          )}
        </Col>
      </Row>

      <Divider />

      <Form layout="vertical">
        <Form.Item label="Verification Action" required>
          <Radio.Group 
            value={verificationStatus} 
            onChange={(e) => setVerificationStatus(e.target.value)}
          >
            <Radio value="Verified">
              <Space>
                <CheckCircleOutlined style={{ color: "#52c41a" }} />
                Verify
              </Space>
            </Radio>
            <Radio value="Rejected">
              <Space>
                <CloseCircleOutlined style={{ color: "#ff4d4f" }} />
                Reject
              </Space>
            </Radio>
          </Radio.Group>
        </Form.Item>

        {verificationStatus === "Rejected" && (
          <Form.Item 
            label="Rejection Reason" 
            required
            rules={[{ required: true, message: "Please provide a reason for rejection" }]}
          >
            <TextArea 
              rows={4} 
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Please provide a reason for rejection"
            />
          </Form.Item>
        )}

        <Form.Item className="text-right">
          <Space>
            <Button onClick={onClose}>Cancel</Button>
            <Button 
              type="primary" 
              onClick={handleVerification}
              loading={loading}
              disabled={verificationStatus === "Rejected" && !rejectionReason}
            >
              Submit
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default VerificationModal;
