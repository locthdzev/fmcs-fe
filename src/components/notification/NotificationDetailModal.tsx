import React from "react";
import { Modal, Typography, Space, Descriptions, Tag, Button, Divider } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { NotificationResponseDTO } from "@/api/notification";

const { Title, Paragraph, Text } = Typography;

interface NotificationDetailModalProps {
  visible: boolean;
  onClose: () => void;
  notification: NotificationResponseDTO | null;
}

const NotificationDetailModal: React.FC<NotificationDetailModalProps> = ({
  visible,
  onClose,
  notification,
}) => {
  if (!notification) return null;

  const formatDate = (date: string) => {
    return dayjs(date).format("DD/MM/YYYY HH:mm:ss");
  };

  const renderRecipientInfo = () => {
    if (notification.recipientType === "System") {
      return <Tag color="blue">All Users</Tag>;
    } else if (notification.recipientType === "Role") {
      return <Tag color="green">Role-based</Tag>;
    }
    return null;
  };

  return (
    <Modal
      title={
        <Title level={4} style={{ margin: 0 }}>
          Notification Details
        </Title>
      }
      open={visible}
      onCancel={onClose}
      width={700}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
      ]}
    >
      <div className="mt-4">
        <Descriptions bordered column={1} size="small">
          <Descriptions.Item label="Title" labelStyle={{ width: "150px" }}>
            {notification.title}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={notification.status === "Active" ? "green" : "red"}>
              {notification.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Recipient Type">
            {renderRecipientInfo()}
          </Descriptions.Item>
          <Descriptions.Item label="Send Email">
            {notification.sendEmail ? "Yes" : "No"}
          </Descriptions.Item>
          <Descriptions.Item label="Created At">
            {formatDate(notification.createdAt)}
          </Descriptions.Item>
          <Descriptions.Item label="Created By">
            {notification.createdBy?.userName || "-"}
          </Descriptions.Item>
        </Descriptions>

        <Divider orientation="left">Content</Divider>
        <div className="border p-4 rounded bg-gray-50 min-h-[100px]">
          {notification.content ? (
            <Paragraph>{notification.content}</Paragraph>
          ) : (
            <Text type="secondary" italic>
              No content available
            </Text>
          )}
        </div>

        {notification.attachment && (
          <>
            <Divider orientation="left">Attachment</Divider>
            <div className="border p-4 rounded">
              {notification.attachment.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                <div className="text-center">
                  <img
                    src={notification.attachment}
                    alt="Attachment"
                    className="max-w-full max-h-[300px] mx-auto object-contain"
                  />
                  <Space className="mt-2">
                    <Button
                      type="primary"
                      href={notification.attachment}
                      target="_blank"
                      icon={<DownloadOutlined />}
                    >
                      View Full Size
                    </Button>
                  </Space>
                </div>
              ) : (
                <Button
                  type="primary"
                  href={notification.attachment}
                  download
                  icon={<DownloadOutlined />}
                >
                  Download Attachment
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default NotificationDetailModal; 