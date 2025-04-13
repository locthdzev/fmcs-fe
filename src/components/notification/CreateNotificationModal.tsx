import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  Radio,
  Select,
  Upload,
  message,
  Switch,
  Typography,
  Space,
} from "antd";
import {
  UploadOutlined,
  InboxOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import type { UploadProps, UploadFile } from "antd/es/upload/interface";
import { NotificationResponseDTO, RoleResponseDTO, createNotification, copyNotification } from "@/api/notification";

const { TextArea } = Input;
const { Option } = Select;
const { Title } = Typography;

interface CreateNotificationModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  roles: RoleResponseDTO[];
  notification?: NotificationResponseDTO | null;
}

const CreateNotificationModal: React.FC<CreateNotificationModalProps> = ({
  visible,
  onClose,
  onSuccess,
  roles,
  notification,
}) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [recipientType, setRecipientType] = useState<"System" | "Role">("System");
  const [loading, setLoading] = useState(false);

  // Initialize form with data when it's for copying
  useEffect(() => {
    if (visible && notification) {
      form.setFieldsValue({
        title: `Copy of ${notification.title}`,
        content: notification.content,
        recipientType: notification.recipientType,
        roleId: notification.roleId,
        sendEmail: notification.sendEmail,
      });
      setRecipientType(notification.recipientType as "System" | "Role");
      
      // Reset file list when the modal becomes visible
      setFileList([]);
    } else if (visible) {
      form.resetFields();
      setRecipientType("System");
      setFileList([]);
    }
  }, [visible, notification, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const formData = new FormData();
      formData.append("title", values.title);
      if (values.content) formData.append("content", values.content);
      formData.append("sendEmail", values.sendEmail.toString());
      formData.append("recipientType", values.recipientType);
      
      if (values.recipientType === "Role" && values.roleId) {
        formData.append("roleId", values.roleId);
      }
      
      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append("file", fileList[0].originFileObj);
      }

      let response;
      if (notification) {
        // Copy existing notification
        response = await copyNotification(notification.id, formData);
      } else {
        // Create new notification
        response = await createNotification(formData);
      }

      if (response.isSuccess) {
        message.success(response.message || "Notification created successfully");
        onSuccess();
        form.resetFields();
        setFileList([]);
      } else {
        message.error(response.message || "Failed to create notification");
      }
    } catch (error) {
      console.error("Submit error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setFileList([]);
    onClose();
  };

  const uploadProps: UploadProps = {
    onRemove: () => {
      setFileList([]);
    },
    beforeUpload: (file) => {
      const isValidSize = file.size / 1024 / 1024 < 5;
      if (!isValidSize) {
        message.error("File must be smaller than 5MB");
        return Upload.LIST_IGNORE;
      }
      setFileList([file]);
      return false;
    },
    fileList,
    maxCount: 1,
  };

  const handleRecipientTypeChange = (e: any) => {
    setRecipientType(e.target.value);
  };

  return (
    <Modal
      title={
        <Title level={4} style={{ margin: 0 }}>
          {notification ? "Copy Notification" : "Create New Notification"}
        </Title>
      }
      open={visible}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleOk}
        >
          {notification ? "Copy" : "Create"}
        </Button>,
      ]}
      width={700}
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Form.Item
          name="title"
          label="Title"
          rules={[{ required: true, message: "Please input the title" }]}
        >
          <Input placeholder="Notification title" />
        </Form.Item>

        <Form.Item name="content" label="Content">
          <TextArea
            placeholder="Enter notification content"
            rows={5}
            showCount
            maxLength={1000}
          />
        </Form.Item>

        <Form.Item
          name="recipientType"
          label="Recipient Type"
          rules={[{ required: true, message: "Please select recipient type" }]}
          initialValue="System"
        >
          <Radio.Group onChange={handleRecipientTypeChange}>
            <Radio.Button value="System">All Users</Radio.Button>
            <Radio.Button value="Role">Role-Based</Radio.Button>
          </Radio.Group>
        </Form.Item>

        {recipientType === "Role" && (
          <Form.Item
            name="roleId"
            label="Select Role"
            rules={[{ required: true, message: "Please select a role" }]}
          >
            <Select placeholder="Select role">
              {roles.map((role) => (
                <Option key={role.id} value={role.id}>
                  {role.roleName}
                </Option>
              ))}
            </Select>
          </Form.Item>
        )}

        <Form.Item
          name="sendEmail"
          label="Send Email"
          valuePropName="checked"
          initialValue={false}
        >
          <Switch />
        </Form.Item>

        <Form.Item label="Attachment (Optional)">
          <Upload
            {...uploadProps}
            listType="picture"
          >
            <Button icon={<UploadOutlined />}>
              Select File (Max: 5MB)
            </Button>
          </Upload>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateNotificationModal; 