import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  Table,
  Switch,
  Modal,
  Form,
  Upload,
  Select,
  Space,
  Input,
} from "antd";
import { toast } from "react-toastify";
import {
  getAllNotifications,
  deleteNotifications,
  updateNotificationStatus,
  createNotification,
  reupNotification,
  copyNotification,
  NotificationResponseDTO,
  setupNotificationRealTime,
  getAllRoles,
  RoleResponseDTO,
} from "@/api/notification";

const { Column } = Table;
const { Option } = Select;
const { TextArea } = Input;

export function NotificationManagement() {
  const [notifications, setNotifications] = useState<NotificationResponseDTO[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [isCopyModalVisible, setIsCopyModalVisible] = useState(false);
  const [selectedNotification, setSelectedNotification] =
    useState<NotificationResponseDTO | null>(null);
  const [form] = Form.useForm();
  const [copyForm] = Form.useForm();
  const [roles, setRoles] = useState<RoleResponseDTO[]>([]);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAllNotifications();
      setNotifications(result.data);
    } catch (error) {
      toast.error("Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRoles = async () => {
    try {
      const roleList = await getAllRoles();
      setRoles(roleList);
    } catch (error) {
      toast.error("Unable to load roles.");
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchNotifications(), fetchRoles()]);
    };
    loadData();

    const connection = setupNotificationRealTime((data) => {
      if (Array.isArray(data)) {
        setNotifications((prev) => prev.filter((n) => !data.includes(n.id)));
      } else {
        setNotifications((prev) => {
          const updated = [data, ...prev.filter((n) => n.id !== data.id)];
          return updated;
        });
      }
    });

    return () => {
      connection.stop();
    };
  }, [fetchNotifications]);

  const handleToggleStatus = async (id: string, status: string) => {
    try {
      const response = await updateNotificationStatus(
        id,
        status === "Active" ? "Inactive" : "Active"
      );
      if (response.isSuccess) {
        toast.success("Status updated successfully!");
      } else {
        toast.error(response.message);
      }
    } catch {
      toast.error("Unable to update status.");
    }
  };

  const handleDelete = async () => {
    try {
      const response = await deleteNotifications(selectedRowKeys as string[]);
      if (response.isSuccess) {
        toast.success("Notifications deleted successfully!");
        setSelectedRowKeys([]);
      } else {
        toast.error(response.message);
      }
    } catch {
      toast.error("Unable to delete notifications.");
    }
  };

  const handleCreate = async (values: any) => {
    const formData = new FormData();
    formData.append("title", values.title);
    if (values.content) formData.append("content", values.content);
    formData.append("sendEmail", values.sendEmail.toString());
    formData.append("recipientType", values.recipientType);
    if (values.recipientType === "Role" && values.roleId)
      formData.append("roleId", values.roleId);
    if (values.file && values.file[0])
      formData.append("file", values.file[0].originFileObj);

    try {
      const response = await createNotification(formData);
      if (response.isSuccess) {
        toast.success(response.message || "Notification created successfully!");
        setIsCreateModalVisible(false);
        form.resetFields();
      } else {
        toast.error(response.message || "Unable to create notification.");
      }
    } catch {
      toast.error("An error occurred while creating the notification.");
    }
  };

  const handleReup = async (id: string) => {
    try {
      const response = await reupNotification(id, true);
      if (response.isSuccess) {
        toast.success(response.message || "Notification reupped successfully!");
      } else {
        toast.error(response.message);
      }
    } catch {
      toast.error("Unable to reup notification.");
    }
  };

  const handleCopy = async (values: any) => {
    const formData = new FormData();
    formData.append("title", values.title);
    if (values.content) formData.append("content", values.content);
    formData.append("sendEmail", values.sendEmail.toString());
    formData.append("recipientType", values.recipientType);
    if (values.recipientType === "Role" && values.roleId)
      formData.append("roleId", values.roleId);
    if (values.file && values.file[0])
      formData.append("file", values.file[0].originFileObj);

    try {
      const response = await copyNotification(
        selectedNotification!.id,
        formData
      );
      if (response.isSuccess) {
        toast.success(
          response.message || "Notification copied and created successfully!"
        );
        setIsCopyModalVisible(false);
        copyForm.resetFields();
      } else {
        toast.error(response.message);
      }
    } catch {
      toast.error("Unable to copy notification.");
    }
  };

  const openDetailModal = (record: NotificationResponseDTO) => {
    setSelectedNotification(record);
    setIsDetailModalVisible(true);
  };

  const openCopyModal = (record: NotificationResponseDTO) => {
    setSelectedNotification(record);
    copyForm.setFieldsValue({
      title: record.title,
      content: record.content,
      sendEmail: false,
      recipientType: record.recipientType === "System" ? "All" : "Role",
      roleId: record.roleId,
      file: record.attachment
        ? [{ url: record.attachment, name: record.attachment.split("/").pop() }]
        : null,
    });
    setIsCopyModalVisible(true);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  };

  return (
    <div>
      <Button
        type="primary"
        onClick={() => setIsCreateModalVisible(true)}
        style={{ marginBottom: 16 }}
      >
        Create Notification
      </Button>
      <Button
        danger
        onClick={handleDelete}
        disabled={!selectedRowKeys.length}
        style={{ marginLeft: 8 }}
      >
        Delete Selected
      </Button>
      <Table
        rowSelection={rowSelection}
        dataSource={notifications}
        rowKey="id"
        loading={loading}
      >
        <Column
          title="Title"
          dataIndex="title"
          key="title"
          render={(text, record: NotificationResponseDTO) => (
            <a
              onClick={() => openDetailModal(record)}
              style={{ cursor: "pointer" }}
            >
              {text}
            </a>
          )}
        />
        <Column
          title="Recipient Type"
          dataIndex="recipientType"
          key="recipientType"
        />
        <Column
          title="Created At"
          dataIndex="createdAt"
          key="createdAt"
          render={(date) => new Date(date).toLocaleString()}
        />
        <Column
          title="Created By"
          dataIndex={["createdBy", "userName"]}
          key="createdBy"
          render={(userName) => userName || "-"}
        />
        <Column title="Status" dataIndex="status" key="status" />
        <Column
          title=""
          key="switch"
          render={(_, record: NotificationResponseDTO) => (
            <Switch
              checked={record.status === "Active"}
              onChange={(checked) =>
                handleToggleStatus(record.id, record.status!)
              }
            />
          )}
        />
        <Column
          title="Actions"
          key="actions"
          render={(_, record: NotificationResponseDTO) => (
            <Space>
              <Button onClick={() => handleReup(record.id)}>Reup</Button>
              <Button onClick={() => openCopyModal(record)}>Copy</Button>
            </Space>
          )}
        />
      </Table>

      {/* Modal Create Notification */}
      <Modal
        title="Create Notification"
        open={isCreateModalVisible}
        onCancel={() => setIsCreateModalVisible(false)}
        onOk={() => form.submit()}
        width={800}
      >
        <Form form={form} onFinish={handleCreate} layout="vertical">
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="content" label="Content">
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item
            name="sendEmail"
            label="Send Email"
            valuePropName="checked"
            initialValue={false}
          >
            <Switch />
          </Form.Item>
          <Form.Item
            name="recipientType"
            label="Recipient Type"
            initialValue="All"
            rules={[{ required: true }]}
          >
            <Select>
              <Option value="All">All Users</Option>
              <Option value="Role">Specific Role</Option>
            </Select>
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.recipientType !== currentValues.recipientType
            }
          >
            {({ getFieldValue }) =>
              getFieldValue("recipientType") === "Role" ? (
                <Form.Item
                  name="roleId"
                  label="Role"
                  rules={[{ required: true, message: "Please select a role!" }]}
                >
                  <Select placeholder="Select a role">
                    {roles.map((role) => (
                      <Option key={role.id} value={role.id}>
                        {role.roleName}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              ) : null
            }
          </Form.Item>
          <Form.Item
            name="file"
            label="Attachment"
            valuePropName="fileList"
            getValueFromEvent={(e) => e.fileList}
          >
            <Upload maxCount={1}>
              <Button>Upload File</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Detail Notification */}
      <Modal
        title={selectedNotification?.title}
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={null}
        width={600}
      >
        <div style={{ maxHeight: "400px", overflowY: "auto" }}>
          <div>{selectedNotification?.content}</div>
          {selectedNotification?.attachment &&
            (selectedNotification.attachment.includes(".jpg") ||
            selectedNotification.attachment.includes(".png") ? (
              <img
                src={selectedNotification.attachment}
                alt="Attachment"
                style={{ maxWidth: "100%" }}
              />
            ) : (
              <a href={selectedNotification.attachment} download>
                Download
              </a>
            ))}
        </div>
      </Modal>

      {/* Modal Copy Notification */}
      <Modal
        title="Copy Notification"
        open={isCopyModalVisible}
        onCancel={() => setIsCopyModalVisible(false)}
        onOk={() => copyForm.submit()}
        width={800}
      >
        <Form form={copyForm} onFinish={handleCopy} layout="vertical">
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="content" label="Content">
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item
            name="sendEmail"
            label="Send Email"
            valuePropName="checked"
            initialValue={false}
          >
            <Switch />
          </Form.Item>
          <Form.Item
            name="recipientType"
            label="Recipient Type"
            rules={[{ required: true }]}
          >
            <Select>
              <Option value="All">All Users</Option>
              <Option value="Role">Specific Role</Option>
            </Select>
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.recipientType !== currentValues.recipientType
            }
          >
            {({ getFieldValue }) =>
              getFieldValue("recipientType") === "Role" ? (
                <Form.Item
                  name="roleId"
                  label="Role"
                  rules={[{ required: true, message: "Please select a role!" }]}
                >
                  <Select placeholder="Select a role">
                    {roles.map((role) => (
                      <Option key={role.id} value={role.id}>
                        {role.roleName}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              ) : null
            }
          </Form.Item>
          <Form.Item
            name="file"
            label="Attachment"
            valuePropName="fileList"
            getValueFromEvent={(e) => e.fileList}
          >
            <Upload maxCount={1}>
              <Button>Upload File</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
