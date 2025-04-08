import React from "react";
import {
  Modal,
  Descriptions,
  Tag,
  Space,
  Button,
  Typography,
  Divider,
  Row,
  Col,
  Card,
  Avatar,
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
} from "@ant-design/icons";
import dayjs from "dayjs";
import { UserResponseDTO } from "@/api/user";

const { Text, Title } = Typography;

interface UserDetailModalProps {
  visible: boolean;
  onCancel: () => void;
  user: UserResponseDTO | null;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({
  visible,
  onCancel,
  user,
}) => {
  if (!user) return null;

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return dayjs(dateString).format("DD/MM/YYYY HH:mm:ss");
  };

  // Format date without time
  const formatDateOnly = (dateString?: string) => {
    if (!dateString) return "-";
    return dayjs(dateString).format("DD/MM/YYYY");
  };

  // Get role color
  const getRoleColor = (role: string) => {
    switch (role.toUpperCase()) {
      case "ADMIN":
        return "red";
      case "MANAGER":
        return "orange";
      case "STAFF":
        return "blue";
      case "USER":
        return "green";
      default:
        return "default";
    }
  };

  // Status tag component
  const StatusTag = ({ status }: { status: string }) => {
    const color = status.toUpperCase() === "ACTIVE" ? "success" : "error";
    const icon = status.toUpperCase() === "ACTIVE" ? <CheckCircleOutlined /> : <StopOutlined />;
    
    return (
      <Tag color={color} icon={icon}>
        {status}
      </Tag>
    );
  };

  return (
    <Modal
      title={
        <Space align="center">
          <UserOutlined />
          <span>User Details</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={[
        <Button key="close" onClick={onCancel}>
          Close
        </Button>,
      ]}
    >
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
                      <Tag color={getRoleColor(role)} key={role}>
                        {role}
                      </Tag>
                    ))
                  ) : (
                    <Tag>No roles</Tag>
                  )}
                  <StatusTag status={user.status} />
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col span={24}>
          <Divider orientation="left">Basic Information</Divider>
          <Descriptions bordered column={{ xxl: 3, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}>
            <Descriptions.Item label="Username">{user.userName}</Descriptions.Item>
            <Descriptions.Item label="Email">
              <Space>
                <MailOutlined />
                {user.email}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Phone">
              <Space>
                <PhoneOutlined />
                {user.phone}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Gender">{user.gender}</Descriptions.Item>
            <Descriptions.Item label="Date of Birth">
              <Space>
                <CalendarOutlined />
                {formatDateOnly(user.dob)}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Address">
              <Space>
                <HomeOutlined />
                {user.address}
              </Space>
            </Descriptions.Item>
          </Descriptions>
        </Col>

        <Col span={24}>
          <Divider orientation="left">System Information</Divider>
          <Descriptions bordered column={{ xxl: 3, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}>
            <Descriptions.Item label="Created At">
              {formatDate(user.createdAt)}
            </Descriptions.Item>
            <Descriptions.Item label="Updated At">
              {formatDate(user.updatedAt)}
            </Descriptions.Item>
            <Descriptions.Item label="ID">
              <Text code copyable={{ text: user.id }}>
                {user.id.substring(0, 8)}...
              </Text>
            </Descriptions.Item>
          </Descriptions>
        </Col>
      </Row>
    </Modal>
  );
};

export default UserDetailModal; 