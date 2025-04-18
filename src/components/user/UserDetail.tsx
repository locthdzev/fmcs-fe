import React, { useEffect, useState } from "react";
import {
  Card,
  Descriptions,
  Tag,
  Space,
  Button,
  Typography,
  Divider,
  Row,
  Col,
  Avatar,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Modal,
  Spin,
} from "antd";
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
  CalendarOutlined,
  TagOutlined,
  CheckCircleOutlined,
  StopOutlined,
  FormOutlined,
  SaveOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  UserResponseDTO,
  getUserById,
  updateUser,
  assignRoleToUser,
  unassignRoleFromUser,
  getAllRoles,
} from "@/api/user";

const { Text, Title } = Typography;
const { Option } = Select;

interface UserDetailProps {
  id: string;
}

export function UserDetail({ id }: UserDetailProps) {
  const [user, setUser] = useState<UserResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form] = Form.useForm();
  const [roles, setRoles] = useState<{ id: string; roleName: string }[]>([]);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (id) {
      fetchUser();
      fetchRoles();
    }
  }, [id]);

  const fetchUser = async () => {
    try {
      const userData = await getUserById(id);
      setUser(userData);
      form.setFieldsValue({
        fullName: userData.fullName,
        userName: userData.userName,
        email: userData.email,
        gender: userData.gender,
        dob: dayjs(userData.dob),
        address: userData.address,
        phone: userData.phone,
      });
    } catch (error) {
      messageApi.error("Failed to fetch user details");
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const rolesData = await getAllRoles();
      setRoles(rolesData);
    } catch (error) {
      messageApi.error("Failed to fetch roles");
    }
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    form.resetFields();
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      await updateUser(user!.id, {
        ...values,
        dob: values.dob.format("YYYY-MM-DD"),
      });
      messageApi.success("User updated successfully");
      setEditing(false);
      fetchUser();
    } catch (error) {
      messageApi.error("Failed to update user");
    }
  };

  const handleAssignRole = async (roleId: string) => {
    try {
      await assignRoleToUser(user!.id, roleId);
      messageApi.success("Role assigned successfully");
      fetchUser();
    } catch (error) {
      messageApi.error("Failed to assign role");
    }
  };

  const handleUnassignRole = async (roleId: string) => {
    try {
      await unassignRoleFromUser(user!.id, roleId);
      messageApi.success("Role unassigned successfully");
      fetchUser();
    } catch (error) {
      messageApi.error("Failed to unassign role");
    }
  };

  if (loading) {
    return <Spin size="large" />;
  }

  if (!user) {
    return <div>User not found</div>;
  }

  return (
    <div style={{ padding: "24px" }}>
      {contextHolder}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card bordered={false}>
            <Row align="middle" gutter={16}>
              <Col xs={24} sm={6} md={4}>
                <Avatar
                  size={80}
                  icon={<UserOutlined />}
                  style={{ backgroundColor: "#1890ff" }}
                />
              </Col>
              <Col xs={24} sm={18} md={20}>
                <Title level={4}>{user.fullName}</Title>
                <Space size={[0, 8]} wrap>
                  {user.roles && user.roles.length > 0 ? (
                    user.roles.map((role) => (
                      <Tag color="blue" key={role}>
                        {role}
                      </Tag>
                    ))
                  ) : (
                    <Tag>No roles</Tag>
                  )}
                  <Tag color={user.status === "Active" ? "success" : "error"}>
                    {user.status}
                  </Tag>
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col span={24}>
          <Card
            title="Basic Information"
            extra={
              editing ? (
                <Space>
                  <Button icon={<CloseOutlined />} onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={handleSave}
                  >
                    Save
                  </Button>
                </Space>
              ) : (
                <Button icon={<FormOutlined />} onClick={handleEdit}>
                  Edit
                </Button>
              )
            }
          >
            <Form form={form} layout="vertical">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="fullName"
                    label="Full Name"
                    rules={[{ required: true }]}
                  >
                    <Input disabled={!editing} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="userName"
                    label="Username"
                    rules={[{ required: true }]}
                  >
                    <Input disabled={!editing} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[{ required: true, type: "email" }]}
                  >
                    <Input disabled={!editing} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="phone"
                    label="Phone"
                    rules={[{ required: true }]}
                  >
                    <Input disabled={!editing} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="gender"
                    label="Gender"
                    rules={[{ required: true }]}
                  >
                    <Select disabled={!editing}>
                      <Option value="Male">Male</Option>
                      <Option value="Female">Female</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="dob"
                    label="Date of Birth"
                    rules={[{ required: true }]}
                  >
                    <DatePicker style={{ width: "100%" }} disabled={!editing} />
                  </Form.Item>
                </Col>
              </Row>
              <Row>
                <Col span={24}>
                  <Form.Item
                    name="address"
                    label="Address"
                    rules={[{ required: true }]}
                  >
                    <Input.TextArea disabled={!editing} />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Card>
        </Col>

        <Col span={24}>
          <Card title="Roles">
            <Space direction="vertical" style={{ width: "100%" }}>
              {roles.map((role) => (
                <div key={role.id}>
                  <Space>
                    <Tag color="blue">{role.roleName}</Tag>
                    {user.roles.includes(role.roleName) ? (
                      <Button
                        danger
                        onClick={() => handleUnassignRole(role.id)}
                      >
                        Unassign
                      </Button>
                    ) : (
                      <Button
                        type="primary"
                        onClick={() => handleAssignRole(role.id)}
                      >
                        Assign
                      </Button>
                    )}
                  </Space>
                </div>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
