import React, { useState } from 'react';
import { Modal, Form, Input, message } from 'antd';
import { CloseCircleOutlined } from '@ant-design/icons';

interface ConfirmCancelPrescriptionModalProps {
  visible: boolean;
  prescriptionId: string;
  onCancel: () => void;
  onConfirm: (id: string, reason: string) => Promise<void>;
}

const ConfirmCancelPrescriptionModal: React.FC<ConfirmCancelPrescriptionModalProps> = ({
  visible,
  prescriptionId,
  onCancel,
  onConfirm
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await onConfirm(prescriptionId, values.reason);
      form.resetFields();
      onCancel();
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="Confirm Cancel Prescription"
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="Confirm"
      cancelText="Cancel"
      okButtonProps={{ 
        danger: true,
        icon: <CloseCircleOutlined /> 
      }}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="reason"
          label="Cancellation Reason"
          rules={[{ required: true, message: 'Please enter a reason for cancellation' }]}
        >
          <Input.TextArea rows={4} placeholder="Enter reason for cancellation..." />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ConfirmCancelPrescriptionModal;
