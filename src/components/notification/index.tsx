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
  getNotificationDetailForAdmin,
} from "@/api/notification";
import { Card, CardHeader, CardBody } from "@heroui/react";
import {
  BellIcon,
  TrashIcon,
  PlusIcon,
  DocumentDuplicateIcon,
  DocumentTextIcon,
  UserIcon,
  CalendarIcon,
  PaperClipIcon,
  EnvelopeIcon,
  UsersIcon,
  RectangleGroupIcon,
} from "@heroicons/react/24/outline";
import { Chip } from "@heroui/react";
import { Icon2fa } from "@tabler/icons-react";

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
    } catch {
      toast.error("Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRoles = async () => {
    try {
      const roleList = await getAllRoles();
      setRoles(roleList);
    } catch {
      toast.error("Unable to load roles.");
    }
  };

  useEffect(() => {
    const initialize = async () => {
      await fetchNotifications();
      await fetchRoles();

      const connection = setupNotificationRealTime(
        (data: NotificationResponseDTO | string[] | any) => {
          console.log(
            "SignalR notification data received in NotificationManagement:",
            data
          );

          if (Array.isArray(data)) {
            console.log("Processing notification deletion:", data);
            setNotifications((prev) =>
              prev.filter((n) => !data.includes(n.id))
            );
            setSelectedRowKeys((prev) =>
              prev.filter((key) => !data.includes(key.toString()))
            );
          } else if (data && typeof data === "object") {
            console.log(
              "Processing notification update or new notification:",
              data
            );
            if (data.id && data.title) {
              console.log("Adding/updating notification in list:", data.id);
              setNotifications((prev) => {
                const exists = prev.find((n) => n.id === data.id);
                if (exists) {
                  console.log("Updating existing notification:", data.id);
                  return prev.map((n) =>
                    n.id === data.id ? { ...n, ...data } : n
                  );
                } else {
                  console.log("Adding new notification:", data.id);
                  return [data, ...prev.filter((n) => n.id !== data.id)];
                }
              });
            }
          }
        }
      );

      return () => connection.stop();
    };

    initialize();
  }, [fetchNotifications]);

  const handleToggleStatus = async (id: string, status: string) => {
    try {
      const newStatus = status === "Active" ? "Inactive" : "Active";
      const response = await updateNotificationStatus(id, newStatus);
      if (response.isSuccess) {
        toast.success("Status updated successfully!");
      }
    } catch (error) {
      toast.error("Unable to update status.");
      console.error("Error toggling status:", error);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await deleteNotifications(selectedRowKeys as string[]);
      if (response.isSuccess) {
        toast.success("Notifications deleted successfully!");
        setSelectedRowKeys([]);
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
        toast.success(response.message);
        setIsCreateModalVisible(false);
        form.resetFields();
        fetchNotifications();
      }
    } catch {
      toast.error("Unable to create notification.");
    }
  };

  const handleReup = async (id: string) => {
    try {
      const response = await reupNotification(id, true);
      if (response.isSuccess) {
        toast.success(response.message);
        fetchNotifications();
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
        toast.success(response.message);
        setIsCopyModalVisible(false);
        copyForm.resetFields();
        fetchNotifications();
      }
    } catch {
      toast.error("Unable to copy notification.");
    }
  };

  const openDetailModal = async (record: NotificationResponseDTO) => {
    const detail = await getNotificationDetailForAdmin(record.id);
    setSelectedNotification(detail);
    setIsDetailModalVisible(true);
  };

  const openCopyModal = (record: NotificationResponseDTO) => {
    setSelectedNotification(record);
    copyForm.setFieldsValue({
      title: record.title,
      content: record.content,
      sendEmail: record.sendEmail,
      recipientType: record.recipientType,
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
      <Card className="m-4">
        <CardHeader className="flex items-center gap-2">
          <BellIcon className="w-6 h-6" />
          <h3 className="text-2xl font-bold">Notification Management</h3>
        </CardHeader>
        <CardBody>
          <Space
            style={{
              marginBottom: 16,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <Space>
              <Input
                placeholder="Search by Title"
                onChange={(e) => {
                  // Thêm logic tìm kiếm nếu cần API hỗ trợ
                }}
                style={{ width: 200 }}
              />
            </Space>
            <Space>
              <Button
                type="primary"
                onClick={() => setIsCreateModalVisible(true)}
                icon={<PlusIcon className="w-5 h-5" />}
              >
                Create Notification
              </Button>
              <Button
                type="primary"
                danger
                onClick={handleDelete}
                disabled={!selectedRowKeys.length}
                icon={<TrashIcon className="w-5 h-5" />}
              >
                Delete Selected
              </Button>
            </Space>
          </Space>

          <Table
            rowSelection={rowSelection}
            dataSource={notifications}
            rowKey="id"
            loading={loading}
            pagination={false}
          >
            <Column
              title="TITLE"
              dataIndex="title"
              key="title"
              render={(text, record: NotificationResponseDTO) => (
                <a
                  onClick={() => openDetailModal(record)}
                  className="text-blue-500 hover:underline cursor-pointer"
                >
                  {text}
                </a>
              )}
            />
            <Column
              title="RECIPIENT TYPE"
              dataIndex="recipientType"
              key="recipientType"
            />
            <Column
              title="SEND EMAIL"
              dataIndex="sendEmail"
              key="sendEmail"
              render={(sendEmail) => (sendEmail ? "Yes" : "No")}
            />
            <Column
              title="CREATED AT"
              dataIndex="createdAt"
              key="createdAt"
              render={(date) => (date ? new Date(date).toLocaleString() : "-")}
            />
            <Column
              title="CREATED BY"
              dataIndex={["createdBy", "userName"]}
              key="createdBy"
              render={(userName) => userName || "-"}
            />
            <Column
              title="STATUS"
              dataIndex="status"
              key="status"
              render={(status) => (
                <Chip
                  className="capitalize"
                  color={
                    status === "Active"
                      ? "success"
                      : status === "Inactive"
                      ? "danger"
                      : "secondary"
                  }
                  size="sm"
                  variant="flat"
                >
                  {status}
                </Chip>
              )}
            />
            <Column
              title=""
              key="toggle"
              align="center"
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
              title="ACTIONS"
              key="actions"
              align="center"
              render={(_, record: NotificationResponseDTO) => (
                <Space>
                  <Button
                    type="text"
                    onClick={() => handleReup(record.id)}
                    icon={<RectangleGroupIcon className="w-5 h-5 text-green-500" />}
                  />
                  <Button
                    type="text"
                    onClick={() => openCopyModal(record)}
                    icon={
                      <DocumentDuplicateIcon className="w-5 h-5 text-blue-500" />
                    }
                  />
                </Space>
              )}
            />
          </Table>
        </CardBody>
      </Card>

      {/* Modal Create Notification */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <BellIcon className="w-6 h-6 text-blue-500" />
            <span className="text-xl font-semibold">Create Notification</span>
          </div>
        }
        open={isCreateModalVisible}
        onCancel={() => setIsCreateModalVisible(false)}
        footer={null}
        width={700}
        className="rounded-lg"
      >
        <div className="max-h-[70vh] overflow-y-auto p-4">
          <Form
            form={form}
            onFinish={handleCreate}
            layout="vertical"
            className="space-y-4"
          >
            <Form.Item
              name="title"
              label={<span className="font-medium">Title</span>}
              rules={[{ required: true, message: "Please enter a title!" }]}
            >
              <Input
                placeholder="Enter notification title"
                className="rounded-md"
              />
            </Form.Item>

            <Form.Item
              name="content"
              label={<span className="font-medium">Content</span>}
            >
              <TextArea
                rows={6}
                placeholder="Enter notification content"
                className="rounded-md"
              />
            </Form.Item>

            <Form.Item
              name="sendEmail"
              label={<span className="font-medium">Send Email</span>}
              valuePropName="checked"
              initialValue={false}
            >
              <Switch checkedChildren="Yes" unCheckedChildren="No" />
            </Form.Item>

            <Form.Item
              name="recipientType"
              label={<span className="font-medium">Recipient Type</span>}
              initialValue="System"
              rules={[
                { required: true, message: "Please select a recipient type!" },
              ]}
            >
              <Select className="rounded-md">
                <Option value="System">System</Option>
                <Option value="Role">Specific Role</Option>
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
                    label={<span className="font-medium">Role</span>}
                    rules={[
                      { required: true, message: "Please select a role!" },
                    ]}
                  >
                    <Select placeholder="Select a role" className="rounded-md">
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
              name="file"
              label={<span className="font-medium">Attachment</span>}
              valuePropName="fileList"
              getValueFromEvent={(e) => e.fileList}
            >
              <Upload maxCount={1}>
                <Button className="flex items-center gap-2">
                  <PaperClipIcon className="w-5 h-5" />
                  Upload File
                </Button>
              </Upload>
            </Form.Item>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                onClick={() => setIsCreateModalVisible(false)}
                className="bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </Button>
              <Button
                type="primary"
                onClick={() => form.submit()}
                className="bg-blue-500 hover:bg-blue-600 rounded-md"
              >
                Create
              </Button>
            </div>
          </Form>
        </div>
      </Modal>

      {/* Modal Notification Detail */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <DocumentTextIcon className="w-6 h-6 text-blue-500" />
            <span className="text-xl font-semibold">
              {selectedNotification?.title}
            </span>
          </div>
        }
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={null}
        width={800}
        className="rounded-lg"
      >
        <div className="max-h-[70vh] overflow-y-auto p-4">
          <Card className="shadow-md">
            <CardBody className="p-6">
              <div className="space-y-6">
                <div className="flex items-start gap-3">
                  <DocumentTextIcon className="w-6 h-6 text-gray-500 mt-1" />
                  <div className="flex-1">
                    <p className="text-lg font-semibold text-gray-700">
                      Content
                    </p>
                    <p className="text-gray-600 mt-1">
                      {selectedNotification?.content || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <PaperClipIcon className="w-6 h-6 text-gray-500 mt-1" />
                  <div className="flex-1">
                    <p className="text-lg font-semibold text-gray-700">
                      Attachment
                    </p>
                    {selectedNotification?.attachment ? (
                      selectedNotification.attachment.match(/\.(jpg|png)$/i) ? (
                        <img
                          src={selectedNotification.attachment}
                          alt="Attachment"
                          className="max-w-full mt-2 rounded-md shadow-sm"
                        />
                      ) : (
                        <a
                          href={selectedNotification.attachment}
                          download
                          className="text-blue-500 hover:underline mt-1 inline-block"
                        >
                          Download Attachment
                        </a>
                      )
                    ) : (
                      <p className="text-gray-600 mt-1">N/A</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CalendarIcon className="w-6 h-6 text-gray-500 mt-1" />
                  <div className="flex-1">
                    <p className="text-lg font-semibold text-gray-700">
                      Created At
                    </p>
                    <p className="text-gray-600 mt-1">
                      {new Date(
                        selectedNotification?.createdAt || ""
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <UserIcon className="w-6 h-6 text-gray-500 mt-1" />
                  <div className="flex-1">
                    <p className="text-lg font-semibold text-gray-700">
                      Created By
                    </p>
                    <p className="text-gray-600 mt-1">
                      {selectedNotification?.createdBy?.userName || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <BellIcon className="w-6 h-6 text-gray-500 mt-1" />
                  <div className="flex-1">
                    <p className="text-lg font-semibold text-gray-700">
                      Status
                    </p>
                    <Chip
                      className="capitalize mt-1"
                      color={
                        selectedNotification?.status === "Active"
                          ? "success"
                          : selectedNotification?.status === "Inactive"
                          ? "danger"
                          : "secondary"
                      }
                      size="sm"
                      variant="flat"
                    >
                      {selectedNotification?.status}
                    </Chip>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <EnvelopeIcon className="w-6 h-6 text-gray-500 mt-1" />
                  <div className="flex-1">
                    <p className="text-lg font-semibold text-gray-700">
                      Send Email
                    </p>
                    <p className="text-gray-600 mt-1">
                      {selectedNotification?.sendEmail ? "Yes" : "No"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <UsersIcon className="w-6 h-6 text-gray-500 mt-1" />
                  <div className="flex-1">
                    <p className="text-lg font-semibold text-gray-700">
                      Recipient Type
                    </p>
                    <p className="text-gray-600 mt-1">
                      {selectedNotification?.recipientType}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <UsersIcon className="w-6 h-6 text-gray-500 mt-1" />
                  <div className="flex-1">
                    <p className="text-lg font-semibold text-gray-700">
                      Recipients
                    </p>
                    <p className="text-gray-600 mt-1">
                      {selectedNotification?.recipientIds.length}
                    </p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </Modal>
      {/* Modal Copy Notification */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <DocumentDuplicateIcon className="w-6 h-6 text-blue-500" />
            <span className="text-xl font-semibold">Copy Notification</span>
          </div>
        }
        open={isCopyModalVisible}
        onCancel={() => setIsCopyModalVisible(false)}
        footer={null}
        width={700}
        className="rounded-lg"
      >
        <div className="max-h-[70vh] overflow-y-auto p-4">
          <Form
            form={copyForm}
            onFinish={handleCopy}
            layout="vertical"
            className="space-y-4"
          >
            <Form.Item
              name="title"
              label={<span className="font-medium">Title</span>}
              rules={[{ required: true, message: "Please enter a title!" }]}
            >
              <Input
                placeholder="Enter notification title"
                className="rounded-md"
              />
            </Form.Item>

            <Form.Item
              name="content"
              label={<span className="font-medium">Content</span>}
            >
              <TextArea
                rows={6}
                placeholder="Enter notification content"
                className="rounded-md"
              />
            </Form.Item>

            <Form.Item
              name="sendEmail"
              label={<span className="font-medium">Send Email</span>}
              valuePropName="checked"
              initialValue={false}
            >
              <Switch checkedChildren="Yes" unCheckedChildren="No" />
            </Form.Item>

            <Form.Item
              name="recipientType"
              label={<span className="font-medium">Recipient Type</span>}
              rules={[
                { required: true, message: "Please select a recipient type!" },
              ]}
            >
              <Select className="rounded-md">
                <Option value="System">System</Option>
                <Option value="Role">Specific Role</Option>
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
                    label={<span className="font-medium">Role</span>}
                    rules={[
                      { required: true, message: "Please select a role!" },
                    ]}
                  >
                    <Select placeholder="Select a role" className="rounded-md">
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
              name="file"
              label={<span className="font-medium">Attachment</span>}
              valuePropName="fileList"
              getValueFromEvent={(e) => e.fileList}
            >
              <Upload maxCount={1}>
                <Button className="flex items-center gap-2">
                  <PaperClipIcon className="w-5 h-5" />
                  Upload File
                </Button>
              </Upload>
            </Form.Item>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                onClick={() => setIsCopyModalVisible(false)}
                className="bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </Button>
              <Button
                type="primary"
                onClick={() => copyForm.submit()}
                className="bg-blue-500 hover:bg-blue-600 rounded-md"
              >
                Copy
              </Button>
            </div>
          </Form>
        </div>
      </Modal>
    </div>
  );
}
