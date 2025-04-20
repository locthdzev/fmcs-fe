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
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import {
  UpdateRequestDTO,
  reviewUpdateRequest,
} from "@/api/healthinsurance";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface ReviewModalProps {
  visible: boolean;
  request: UpdateRequestDTO;
  onClose: () => void;
  onSuccess: () => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({
  visible,
  request,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [isApproved, setIsApproved] = useState<boolean>(true);
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

  const handleReview = async () => {
    setLoading(true);
    try {
      const result = await reviewUpdateRequest(
        request.id, 
        isApproved,
        !isApproved ? rejectionReason : undefined
      );
      
      if (result.isSuccess) {
        messageApi.success(`Update request ${isApproved ? 'approved' : 'rejected'} successfully`);
        onSuccess();
      } else {
        messageApi.error(result.message || "Failed to review update request");
      }
    } catch (error) {
      messageApi.error("Failed to review update request");
      console.error("Error reviewing update request:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={<Title level={4}>Review Insurance Update Request</Title>}
      open={visible}
      onCancel={onClose}
      width={800}
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

      {request.hasInsurance ? (
        <Descriptions
          bordered
          column={2}
          size="small"
          layout="vertical"
          title={<Text strong>Insurance Update Details</Text>}
        >
          <Descriptions.Item label="Insurance Number">{request.healthInsuranceNumber || "-"}</Descriptions.Item>
          <Descriptions.Item label="Full Name">{request.fullName || "-"}</Descriptions.Item>
          <Descriptions.Item label="Date of Birth">{formatDate(request.dateOfBirth)}</Descriptions.Item>
          <Descriptions.Item label="Gender">{request.gender || "-"}</Descriptions.Item>
          <Descriptions.Item label="Address">{request.address || "-"}</Descriptions.Item>
          <Descriptions.Item label="Healthcare Provider">
            {request.healthcareProviderName}{" "}
            {request.healthcareProviderCode ? `(${request.healthcareProviderCode})` : ""}
          </Descriptions.Item>
          <Descriptions.Item label="Valid From">{formatDate(request.validFrom)}</Descriptions.Item>
          <Descriptions.Item label="Valid To">{formatDate(request.validTo)}</Descriptions.Item>
          <Descriptions.Item label="Issue Date">{formatDate(request.issueDate)}</Descriptions.Item>
          <Descriptions.Item label="Has Insurance">{request.hasInsurance ? "Yes" : "No"}</Descriptions.Item>
          <Descriptions.Item label="Status">{request.status}</Descriptions.Item>
          <Descriptions.Item label="Requested At">{formatDateTime(request.requestedAt)}</Descriptions.Item>
        </Descriptions>
      ) : (
        <Descriptions
          bordered
          column={1}
          size="small"
          layout="vertical"
          title={<Text strong>No Insurance Declaration</Text>}
        >
          <Descriptions.Item label="Has Insurance">No</Descriptions.Item>
          <Descriptions.Item label="Requested At">{formatDateTime(request.requestedAt)}</Descriptions.Item>
          <Descriptions.Item label="Status">{request.status}</Descriptions.Item>
        </Descriptions>
      )}

      {request.imageUrl && (
        <>
          <Divider />
          <div className="text-center">
            <Text strong>Insurance Card Image</Text>
            <div className="mt-2">
              <Image 
                src={request.imageUrl} 
                alt="Insurance Card" 
                style={{ maxWidth: "100%", maxHeight: "300px" }} 
              />
            </div>
          </div>
        </>
      )}

      <Divider />

      <Form layout="vertical">
        <Form.Item label="Review Decision" required>
          <Radio.Group 
            value={isApproved} 
            onChange={(e) => setIsApproved(e.target.value)}
          >
            <Radio value={true}>
              <Space>
                <CheckCircleOutlined style={{ color: "#52c41a" }} />
                Approve
              </Space>
            </Radio>
            <Radio value={false}>
              <Space>
                <CloseCircleOutlined style={{ color: "#ff4d4f" }} />
                Reject
              </Space>
            </Radio>
          </Radio.Group>
        </Form.Item>

        {!isApproved && (
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
              onClick={handleReview}
              loading={loading}
              disabled={!isApproved && !rejectionReason}
            >
              Submit
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ReviewModal;
