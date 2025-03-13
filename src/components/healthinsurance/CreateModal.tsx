import React, { useState } from "react";
import { Modal, Form, Input, DatePicker, Button, Select } from "antd";
import { createHealthInsuranceManual } from "@/api/healthinsurance";
import { toast } from "react-toastify";

interface CreateModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateModal: React.FC<CreateModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | undefined>();

  const handleCreate = async (values: any) => {
    setLoading(true);
    try {
      const response = await createHealthInsuranceManual(values, imageFile);
      if (response.isSuccess) {
        toast.success("Insurance created successfully!");
        onSuccess();
        onClose();
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error("Unable to create insurance.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      title="Create Health Insurance"
      onCancel={onClose}
      footer={null}
    >
      <Form form={form} onFinish={handleCreate} layout="vertical">
        <Form.Item
          label="User ID"
          name="userId"
          rules={[{ required: true, message: "Please enter user ID" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="Insurance Number"
          name="healthInsuranceNumber"
          rules={[{ required: true, message: "Please enter insurance number" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="Full Name"
          name="fullName"
          rules={[{ required: true, message: "Please enter full name" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item label="Date of Birth" name="dateOfBirth">
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item label="Gender" name="gender">
          <Select>
            <Select.Option value="Male">Male</Select.Option>
            <Select.Option value="Female">Female</Select.Option>
            <Select.Option value="Other">Other</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item label="Address" name="address">
          <Input />
        </Form.Item>
        <Form.Item
          label="Healthcare Provider Name"
          name="healthcareProviderName"
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="Healthcare Provider Code"
          name="healthcareProviderCode"
        >
          <Input />
        </Form.Item>
        <Form.Item label="Valid From" name="validFrom">
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          label="Valid To"
          name="validTo"
          rules={[{ required: true, message: "Please enter valid to date" }]}
        >
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item label="Issue Date" name="issueDate">
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item label="Image">
          <input
            type="file"
            onChange={(e) => setImageFile(e.target.files?.[0])}
          />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          Create
        </Button>
      </Form>
    </Modal>
  );
};

export default CreateModal;
