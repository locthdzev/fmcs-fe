import React, { useState } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Row,
  Col,
  message,
} from "antd";
import dayjs from "dayjs";
import { createUser } from "@/api/user";

const { Option } = Select;

interface CreateModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

const CreateModal: React.FC<CreateModalProps> = ({
  visible,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  // Reset form when modal opens
  React.useEffect(() => {
    if (visible) {
      form.resetFields();
    }
  }, [visible, form]);

  const handleCreate = async () => {
    try {
      setSubmitLoading(true);
      messageApi.loading({ content: "Creating user...", key: "createUser" });
      const values = await form.validateFields();
      
      // Format date of birth and set current timestamp for createdAt
      const formattedValues = {
        ...values,
        dob: values.dob.format("YYYY-MM-DD"),
        createdAt: new Date().toISOString(),
        status: "Active"
      };

      const response = await createUser(formattedValues);
      
      if (response.isSuccess) {
        messageApi.success({ content: "User created successfully", key: "createUser" });
        onSuccess();
      } else {
        messageApi.error({ 
          content: response.message || "Failed to create user", 
          key: "createUser" 
        });
      }
    } catch (error: any) {
      console.error("Error creating user:", error);
      messageApi.error({ 
        content: "An error occurred while validating the form", 
        key: "createUser" 
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <Modal
      title="Create New User"
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel} disabled={submitLoading}>
          Cancel
        </Button>,
        <Button
          key="create"
          type="primary"
          loading={submitLoading}
          onClick={handleCreate}
        >
          Create
        </Button>,
      ]}
      width={800}
      maskClosable={!submitLoading}
      closable={!submitLoading}
    >
      {contextHolder}
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="fullName"
              label="Full Name"
              rules={[
                { required: true, message: "Please enter the full name" },
                { min: 3, message: "Name must be at least 3 characters" },
                { max: 100, message: "Name cannot exceed 100 characters" },
              ]}
            >
              <Input placeholder="Enter full name" maxLength={100} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="userName"
              label="Username"
              rules={[
                { required: true, message: "Please enter a username" },
                { min: 3, message: "Username must be at least 3 characters" },
                { max: 50, message: "Username cannot exceed 50 characters" },
                {
                  pattern: /^[a-zA-Z0-9_]+$/,
                  message: "Username can only contain letters, numbers, and underscores",
                },
              ]}
            >
              <Input placeholder="Enter username" maxLength={50} />
            </Form.Item>
          </Col>
        </Row>
        
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: "Please enter an email" },
                { type: "email", message: "Please enter a valid email" },
                { max: 100, message: "Email cannot exceed 100 characters" },
                {
                  pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                  message: "Please enter a valid email format",
                },
              ]}
            >
              <Input placeholder="Enter email" maxLength={100} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="phone"
              label="Phone"
              rules={[
                { required: true, message: "Please enter a phone number" },
                {
                  pattern: /^(0|\+84)[3|5|7|8|9][0-9]{8}$/,
                  message: "Please enter a valid Vietnam phone number (eg: 0912345678 or +84912345678)",
                },
              ]}
            >
              <Input placeholder="Enter phone number" maxLength={15} />
            </Form.Item>
          </Col>
        </Row>
        
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="gender"
              label="Gender"
              rules={[{ required: true, message: "Please select a gender" }]}
            >
              <Select placeholder="Select gender">
                <Option value="Male">Male</Option>
                <Option value="Female">Female</Option>
                <Option value="Other">Other</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="dob"
              label="Date of Birth"
              rules={[
                { required: true, message: "Please select date of birth" },
                {
                  validator: (_, value) => {
                    if (!value) return Promise.resolve();
                    if (value.isAfter(dayjs().subtract(18, "year"))) {
                      return Promise.reject("User must be at least 18 years old");
                    }
                    if (value.isBefore(dayjs().subtract(100, "year"))) {
                      return Promise.reject("Date of birth is too far in the past");
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>
        
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="address"
              label="Address"
              rules={[
                { required: true, message: "Please enter an address" },
                { max: 200, message: "Address cannot exceed 200 characters" },
              ]}
            >
              <Input.TextArea 
                placeholder="Enter address" 
                maxLength={200} 
                rows={3}
                style={{ resize: 'none' }}
              />
            </Form.Item>
          </Col>
        </Row>
        
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: true, message: "Please enter a password" },
                { min: 8, message: "Password must be at least 8 characters" },
                { max: 50, message: "Password must not exceed 50 characters" },
                {
                  pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                  message:
                    "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character",
                },
              ]}
            >
              <Input.Password placeholder="Enter password" maxLength={50} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="confirmPassword"
              label="Confirm Password"
              dependencies={["password"]}
              rules={[
                { required: true, message: "Please confirm your password" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("Passwords do not match"));
                  },
                }),
              ]}
            >
              <Input.Password placeholder="Confirm password" maxLength={50} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default CreateModal; 