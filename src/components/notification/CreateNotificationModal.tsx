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
  Spin,
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
  forceReset?: boolean;
  initialLoading?: boolean;
}

const CreateNotificationModal: React.FC<CreateNotificationModalProps> = ({
  visible,
  onClose,
  onSuccess,
  roles,
  notification,
  forceReset = false,
  initialLoading = false,
}) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [editorContent, setEditorContent] = useState("");
  const [formInitialized, setFormInitialized] = useState(true);
  const [currentRecipientType, setCurrentRecipientType] = useState("System");

  // Initialize form with data when it's for copying
  useEffect(() => {
    if (visible && notification) {
      console.log("Initializing copy modal with notification:", notification.id);
      
      // Tạm ẩn form khi đang load dữ liệu
      setFormInitialized(false);
      
      // Chuyển đổi recipientType từ backend sang giá trị phù hợp cho frontend
      let frontendRecipientType;
      
      // Xử lý các trường hợp khác nhau của recipientType
      if (notification.recipientType === "System") {
        frontendRecipientType = "System";
      } else {
        // Nếu là "Role" hoặc bất kỳ tên role nào khác, đều coi là "Role"
        frontendRecipientType = "Role";
      }
      
      // Cập nhật state trước
      setCurrentRecipientType(frontendRecipientType);
      
      // Sau đó set form values
      const formData: any = {
        title: `Copy of ${notification.title}`,
        recipientType: frontendRecipientType,
        sendEmail: notification.sendEmail
      };

      // Xử lý roleId cho Role-Based notifications
      if (frontendRecipientType === "Role" && notification.roleId) {
        formData.roleId = notification.roleId;
      }
      
      form.setFieldsValue(formData);

      // Set content từ notification gốc
      if (notification.content) {
        setEditorContent(notification.content);
      } else {
        setEditorContent("");
      }

      // Set file attachment nếu có
      if (notification.attachment) {
        const fileName = notification.attachment.split('/').pop() || 'attachment';
        
        // Tạo đối tượng UploadFile giả để hiển thị tên file
        const fakeFile: UploadFile = {
          uid: '-1',
          name: fileName,
          status: 'done',
          url: notification.attachment,
        };
        
        setFileList([fakeFile]);
      } else {
        // Reset file list
        setFileList([]);
      }
      
      // Đánh dấu form đã khởi tạo xong
      setTimeout(() => {
        setFormInitialized(true);
      }, 100);
    } else if (visible) {
      form.resetFields();
      setEditorContent("");
      setFileList([]);
      setFormInitialized(true);
    }
  }, [visible, notification, form]);

  // Add useEffect to explicitly reset the editor content when modal is no longer visible
  useEffect(() => {
    if (!visible) {
      console.log("Modal closed, resetting editor content");
      setEditorContent("");
      form.resetFields();
    }
  }, [visible, form]);

  // Add useEffect to reset content when switching between create/copy mode
  useEffect(() => {
    if (visible) {
      // Nếu không có notification (mode create), xóa sạch editorContent
      if (!notification) {
        console.log("Create mode: resetting editor content");
        setEditorContent("");
      }
    }
  }, [visible, notification]);

  // Thêm useEffect để reset editor content khi forceReset = true
  useEffect(() => {
    if (forceReset && visible) {
      console.log("Force reset applied");
      setEditorContent("");
      form.resetFields();
      setCurrentRecipientType("System");
    }
  }, [forceReset, visible, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const formData = new FormData();
      formData.append("title", values.title);
      
      // Đảm bảo rằng content được thêm vào formData
      if (editorContent) {
        formData.append("content", editorContent);
      }
      
      formData.append("sendEmail", values.sendEmail.toString());
      
      // Gửi recipientType đúng định dạng theo backend
      const backendRecipientType = values.recipientType;
      formData.append("recipientType", backendRecipientType);

      // Handle role-based recipient type
      if (values.recipientType === "Role" && values.roleId) {
        formData.append("roleId", values.roleId);
      }

      // Xử lý file attachment
      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append("file", fileList[0].originFileObj);
      } 

      let response;
      if (notification) {
        // Copy existing notification
        console.log("Copying notification with ID:", notification.id);
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
        // Reset form và data
        form.resetFields();
        setEditorContent("");
        setFileList([]);
        setCurrentRecipientType("System");
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
    console.log("Modal cancelled, cleaning up all data");
    form.resetFields();
    setEditorContent("");
    setFileList([]);
    setCurrentRecipientType("System");
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
    // Preview cho file attachment từ notification gốc
    onPreview: async (file) => {
      if (file.url) {
        window.open(file.url, '_blank');
      }
    }
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
      destroyOnClose={true}
    >
      {/* Hiển thị loading khi đang lấy dữ liệu notification chi tiết */}
      {initialLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <Spin tip="Loading notification details..." />
        </div>
      )}
      
      {/* Hiển thị form khi đã khởi tạo và không trong trạng thái initialLoading */}
      {formInitialized && !initialLoading && (
        <Form
          form={form}
          layout="vertical"
          className="mt-4"
          onValuesChange={(changedValues) => {
            // Cập nhật state khi recipientType thay đổi
            if ('recipientType' in changedValues) {
              const newType = changedValues.recipientType;
              console.log("RecipientType changed to:", newType);
              setCurrentRecipientType(newType);
              
              // Nếu đổi từ Role sang System, xóa roleId
              if (newType === "System") {
                form.setFieldsValue({ roleId: undefined });
              }
            }
          }}
        >
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
          >
            <Select placeholder="Select recipient type">
              <Option value="System">System</Option>
              <Option value="Role">Role-Based</Option>
            </Select>
          </Form.Item>

          {/* Hiển thị Role Selection field khi recipientType là Role */}
          {currentRecipientType === "Role" && (
            <Form.Item
              name="roleId"
              label="Select Role"
              rules={[{ required: true, message: "Please select a role" }]}
            >
              <Select 
                placeholder="Select role"
                showSearch
                optionFilterProp="children"
              >
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
            <Upload {...uploadProps} listType="picture">
              <Button icon={<UploadOutlined />}>Select File (Max: 5MB)</Button>
            </Upload>
          </Form.Item>
        </Form>
      )}
      
      {/* Hiển thị loading khi form đang khởi tạo */}
      {!formInitialized && !initialLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <Spin tip="Initializing form..." />
        </div>
      )}
    </Modal>
  );
};

// Tạo thêm một component riêng với cùng code để làm CopyNotificationModal
export const CopyNotificationModal = CreateNotificationModal;

export default CreateNotificationModal;
