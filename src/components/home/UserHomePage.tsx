import React, { useContext, useEffect, useState } from 'react';
import { UserContext } from '@/context/UserContext';
import { Card, Typography, Button, Row, Col, Divider, Spin, Alert, message as antMessage, Tag, Space, Tooltip } from 'antd';
import { 
  MedicineBoxOutlined, 
  CalendarOutlined,
  ShoppingCartOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  BellOutlined,
  FileOutlined,
  MailOutlined,
  TeamOutlined,
  SolutionOutlined,
  DashboardOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { getLatestUserNotification, NotificationResponseDTO } from '@/api/notification';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

const UserHomePage: React.FC = () => {
  const userContext = useContext(UserContext);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<NotificationResponseDTO | null>(null);

  // Fetch notifications
  useEffect(() => {
    fetchLatestNotification();
  }, []);

  const fetchLatestNotification = async () => {
    try {
      setLoading(true);
      const result = await getLatestUserNotification();
      
      if (result.isSuccess && result.data) {
        setNotification(result.data);
      }
    } catch (error) {
      console.error('Error fetching notification:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAccessClick = (path: string) => {
    router.push(path);
  };

  const renderStatusTag = (status: string) => {
    switch (status) {
      case 'Active':
        return <Tag color="green">{status}</Tag>;
      case 'Inactive':
        return <Tag color="red">{status}</Tag>;
      default:
        return <Tag color="default">{status}</Tag>;
    }
  };

  const formatDate = (dateString: string) => {
    return dayjs(dateString).format('DD/MM/YYYY HH:mm');
  };

  const renderRecipientType = (type: string) => {
    switch (type) {
      case 'System':
        return <Tag icon={<TeamOutlined />} color="blue">All Users</Tag>;
      case 'ROLE':
        return <Tag icon={<TeamOutlined />} color="orange">Role-based</Tag>;
      default:
        return <Tag color="default">{type}</Tag>;
    }
  };

  const renderSendEmail = (sendEmail: boolean) => {
    return sendEmail ? (
      <Tag icon={<MailOutlined />} color="green">Email Sent</Tag>
    ) : (
      <Tag icon={<MailOutlined />} color="default">No Email</Tag>
    );
  };

  const quickAccessItems = [
    {
      title: 'Health Checkups',
      icon: <MedicineBoxOutlined style={{ fontSize: '24px' }} />,
      path: '/health-checkups',
      description: 'View your health checkup history and results'
    },
    {
      title: 'Appointments',
      icon: <CalendarOutlined style={{ fontSize: '24px' }} />,
      path: '/appointments',
      description: 'Book and manage your appointments'
    },
    {
      title: 'Canteen Orders',
      icon: <ShoppingCartOutlined style={{ fontSize: '24px' }} />,
      path: '/canteen-orders',
      description: 'Order food from the canteen'
    },
    {
      title: 'Treatment Plans',
      icon: <SolutionOutlined style={{ fontSize: '24px' }} />,
      path: '/treatment-plans',
      description: 'View your treatment plans'
    },
    {
      title: 'Health Records',
      icon: <FileTextOutlined style={{ fontSize: '24px' }} />,
      path: '/health-records',
      description: 'Access your health records'
    },
    {
      title: 'Notifications',
      icon: <BellOutlined style={{ fontSize: '24px' }} />,
      path: '/notification',
      description: 'View all notifications'
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <Card className="welcome-card" style={{ marginBottom: '20px', borderRadius: '8px' }}>
        <Title level={2}>
          Welcome, {userContext?.user?.userName || 'User'}!
          <CheckCircleOutlined style={{ color: '#52c41a', marginLeft: '10px' }} />
        </Title>
        <Text>You can book appointments, order from the canteen, and access your health information here.</Text>
      </Card>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card 
            title={<Title level={4}><BellOutlined /> Latest Notification</Title>} 
            style={{ borderRadius: '8px', height: '100%' }}
            extra={
              <Button 
                type="link" 
                onClick={() => router.push('/notification')}
              >
                View All
              </Button>
            }
          >
            <div style={{ minHeight: '300px' }}>
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Spin size="large" />
                </div>
              ) : notification ? (
                <div className="notification-detail">
                  {/* Notification Header */}
                  <Row gutter={16} style={{ marginBottom: '20px' }}>
                    <Col span={24}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Title level={3}>{notification.title}</Title>
                        {notification.status && renderStatusTag(notification.status)}
                      </div>
                    </Col>
                  </Row>

                  {/* Notification Metadata */}
                  <Row gutter={16} style={{ marginBottom: '20px' }}>
                    <Col span={24}>
                      <Space size={16} wrap>
                        <div>
                          <Text type="secondary" strong>Created:</Text>{' '}
                          <Text>{formatDate(notification.createdAt)}</Text>
                        </div>
                        
                        {notification.createdBy && (
                          <div>
                            <Text type="secondary" strong>By:</Text>{' '}
                            <Text>{notification.createdBy.userName || 'Unknown'}</Text>
                          </div>
                        )}
                        
                        <div>
                          <Text type="secondary" strong>Type:</Text>{' '}
                          {renderRecipientType(notification.recipientType)}
                        </div>
                        
                        <div>
                          {renderSendEmail(notification.sendEmail)}
                        </div>
                      </Space>
                    </Col>
                  </Row>

                  {/* Notification Content */}
                  <Row>
                    <Col span={24}>
                      <Card 
                        bordered={false} 
                        className="notification-content"
                        style={{ 
                          background: '#f9f9f9', 
                          borderRadius: '8px',
                          marginBottom: '20px'
                        }}
                      >
                        {notification.content ? (
                          <div 
                            dangerouslySetInnerHTML={{ __html: notification.content }} 
                            style={{ padding: '10px', minHeight: '100px' }}
                          />
                        ) : (
                          <div style={{ padding: '10px', minHeight: '100px' }}>
                            <Text type="secondary">No content available</Text>
                          </div>
                        )}
                      </Card>
                    </Col>
                  </Row>

                  {/* Attachment Section */}
                  {notification.attachment && (
                    <Row style={{ marginBottom: '20px' }}>
                      <Col span={24}>
                        <Card size="small" title="Attachment">
                          <a 
                            href={notification.attachment} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="attachment-link"
                          >
                            <FileOutlined style={{ marginRight: '8px' }} />
                            View Attachment
                          </a>
                        </Card>
                      </Col>
                    </Row>
                  )}

                  {/* Action Button */}
                  <Row>
                    <Col span={24} style={{ textAlign: 'right' }}>
                      <Button 
                        type="primary"
                        onClick={() => router.push(`/notification/${notification.id}`)}
                      >
                        View Full Details
                      </Button>
                    </Col>
                  </Row>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Text type="secondary">No notifications available</Text>
                </div>
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card 
            title={<Title level={4}><DashboardOutlined /> Quick Access</Title>} 
            style={{ borderRadius: '8px' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {quickAccessItems.map((item, index) => (
                <Button 
                  key={index} 
                  type="default"
                  size="large"
                  icon={item.icon}
                  onClick={() => handleQuickAccessClick(item.path)}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'flex-start',
                    height: 'auto', 
                    padding: '12px 16px',
                    borderRadius: '6px',
                    boxShadow: '0 2px 0 rgba(0,0,0,0.02)'
                  }}
                >
                  <div style={{ textAlign: 'left', marginLeft: '10px' }}>
                    <div style={{ fontWeight: 'bold' }}>{item.title}</div>
                    <div style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.45)' }}>{item.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      <Row style={{ marginTop: '24px' }}>
        <Col span={24}>
          <Card 
            title={<Title level={4}><CalendarOutlined /> Your Health Status</Title>} 
            style={{ borderRadius: '8px' }}
          >
            <Row gutter={16}>
              <Col span={8}>
                <Card style={{ textAlign: 'center', borderRadius: '6px' }}>
                  <Title level={2} style={{ margin: 0, color: '#1890ff' }}>2</Title>
                  <Text>Upcoming Appointments</Text>
                </Card>
              </Col>
              <Col span={8}>
                <Card style={{ textAlign: 'center', borderRadius: '6px' }}>
                  <Title level={2} style={{ margin: 0, color: '#52c41a' }}>Good</Title>
                  <Text>Health Status</Text>
                </Card>
              </Col>
              <Col span={8}>
                <Card style={{ textAlign: 'center', borderRadius: '6px' }}>
                  <Title level={2} style={{ margin: 0, color: '#fa8c16' }}>3</Title>
                  <Text>Active Prescriptions</Text>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default UserHomePage;
