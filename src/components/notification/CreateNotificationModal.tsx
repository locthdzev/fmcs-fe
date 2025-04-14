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
import { UploadOutlined, InboxOutlined, PlusOutlined } from "@ant-design/icons";
import type { UploadProps, UploadFile } from "antd/es/upload/interface";
import {
  NotificationResponseDTO,
  RoleResponseDTO,
  createNotification,
  copyNotification,
} from "@/api/notification";
import RichTextEditor from "@/components/rich-text-editor";

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
  const [loading, setLoading] = useState(false);
  const [editorContent, setEditorContent] = useState("");

  // Initialize form with data when it's for copying
  useEffect(() => {
    if (visible && notification) {
      form.setFieldsValue({
        title: `Copy of ${notification.title}`,
        recipientType: notification.recipientType,
        roleId: notification.roleId,
        sendEmail: notification.sendEmail,
      });

      // Ensure content is properly set for copying
      if (notification.content) {
        setEditorContent(notification.content);
      } else {
        setEditorContent("");
      }

      // Reset file list when the modal becomes visible
      setFileList([]);
    } else if (visible) {
      form.resetFields();
      setEditorContent("");
      setFileList([]);
    }
  }, [visible, notification, form]);

  // Add useEffect to explicitly reset the editor content when modal is no longer visible
  useEffect(() => {
    if (!visible) {
      setEditorContent("");
      form.resetFields();
    }
  }, [visible, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const formData = new FormData();
      formData.append("title", values.title);
      if (editorContent) formData.append("content", editorContent);
      formData.append("sendEmail", values.sendEmail.toString());
      formData.append("recipientType", values.recipientType);

      // Handle role-based recipient type
      if (values.recipientType === "Role" && values.roleId) {
        formData.append("roleId", values.roleId);
        console.log("Adding roleId to formData:", values.roleId);
      }

      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append("file", fileList[0].originFileObj);
      }

      // Debug logging
      console.log("FormData entries to be sent:");
      for (let pair of formData.entries()) {
        const value = pair[1];
        console.log(
          `${pair[0]}: ${
            value instanceof File
              ? `File (${(value as File).name}, ${(value as File).type}, ${
                  (value as File).size
                } bytes)`
              : value
          }`
        );
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
        message.success(
          response.message || "Notification created successfully"
        );
        onSuccess();
        form.resetFields();
        setEditorContent("");
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
    setEditorContent("");
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

      // Tạo một đối tượng UploadFile mới với originFileObj
      const uploadFile = {
        uid: Date.now().toString(),
        name: file.name,
        size: file.size,
        type: file.type,
        status: "done",
        originFileObj: file, // Thêm trường originFileObj
      } as UploadFile;

      console.log("File selected for upload:", {
        name: uploadFile.name,
        type: uploadFile.type,
        size: uploadFile.size,
        hasOriginFileObj: !!uploadFile.originFileObj,
      });

      setFileList([uploadFile]);
      return false;
    },
    fileList,
    maxCount: 1,
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
      width={800}
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Form.Item
          name="title"
          label="Title"
          rules={[{ required: true, message: "Please input the title" }]}
        >
          <Input placeholder="Notification title" />
        </Form.Item>

        <Form.Item
          label="Content"
          required
          rules={[
            {
              validator: () => {
                if (!editorContent || editorContent === "<p></p>") {
                  return Promise.reject("Please enter content");
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <RichTextEditor content={editorContent} onChange={setEditorContent} />
        </Form.Item>

        <Form.Item
          name="recipientType"
          label="Recipient Type"
          rules={[{ required: true, message: "Please select recipient type" }]}
          initialValue="System"
        >
          <Select placeholder="Select recipient type">
            <Option value="System">System</Option>
            <Option value="Role">Role-Based</Option>
          </Select>
        </Form.Item>

        <Form.Item
          noStyle
          shouldUpdate={(prev, curr) =>
            prev.recipientType !== curr.recipientType
          }
        >
          {({ getFieldValue }) =>
            getFieldValue("recipientType") === "Role" && (
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
            )
          }
        </Form.Item>

        <Form.Item
          name="sendEmail"
          label="Send Email"
          valuePropName="checked"
          initialValue={false}
        >
          <Switch />
        </Form.Item>

        <Form.Item label="Attachment (Optional)">
          <Upload {...uploadProps} listType="picture">
            <Button icon={<UploadOutlined />}>Select File (Max: 5MB)</Button>
          </Upload>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateNotificationModal;
