import React, { useState } from "react";
import { Modal, Form, Input, Button, Select } from "antd";
import { UpdateRequestDTO, reviewUpdateRequest } from "@/api/healthinsurance";
import { toast } from "react-toastify";

interface ReviewRequestModalProps {
  visible: boolean;
  request: UpdateRequestDTO | null;
  onClose: () => void;
  onSuccess: () => void;
}

const ReviewRequestModal: React.FC<ReviewRequestModalProps> = ({
  visible,
  request,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleReview = async (values: any) => {
    if (!request) return;
    setLoading(true);
    try {
      const response = await reviewUpdateRequest(
        request.id,
        values.isApproved,
        values.rejectionReason
      );
      if (response.isSuccess) {
        toast.success(
          `Request ${values.isApproved ? "approved" : "rejected"} successfully!`
        );
        onSuccess();
        onClose();
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error("Unable to review request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      title="Review Update Request"
      onCancel={onClose}
      footer={null}
    >
      {request && (
        <Form form={form} onFinish={handleReview} layout="vertical">
          <p>Insurance ID: {request.healthInsuranceId}</p>
          <p>Requested By: {request.requestedBy.userName}</p>
          <p>Requested At: {request.requestedAt}</p>
          <p>Full Name: {request.fullName}</p>
          <p>Insurance Number: {request.healthInsuranceNumber}</p>
          {request.imageUrl && (
            <img src={request.imageUrl} alt="Request" style={{ width: 100 }} />
          )}
          <Form.Item
            name="isApproved"
            label="Decision"
            rules={[{ required: true }]}
          >
            <Select>
              <Select.Option value={true}>Approve</Select.Option>
              <Select.Option value={false}>Reject</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="rejectionReason"
            label="Rejection Reason"
            rules={[
              {
                required: Form.useWatch("isApproved", form) === false,
                message: "Please provide a reason",
              },
            ]}
          >
            <Input.TextArea />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Submit
          </Button>
        </Form>
      )}
    </Modal>
  );
};

export default ReviewRequestModal;
