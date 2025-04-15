import React, { useContext, useEffect, useState } from 'react';
import { UserContext } from '@/context/UserContext';
import { Card, Typography, Button, Row, Col, Divider, Spin, Alert, message as antMessage, Tag, Space, Tooltip } from 'antd';
import { 
  DashboardOutlined, 
  ShoppingCartOutlined,
  AppstoreOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  BellOutlined,
  FileOutlined,
  MailOutlined,
  TeamOutlined,
  BarChartOutlined,
  ScheduleOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { getLatestUserNotification, NotificationResponseDTO } from '@/api/notification';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

const CanteenStaffHomePage: React.FC = () => {
  const userContext = useContext(UserContext);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<NotificationResponseDTO | null>(null);

  // Redirect if not canteen staff
  useEffect(() => {
    if (userContext?.user?.role && !userContext.user.role.includes('Canteen Staff')) {
      antMessage.error({
        content: 'You do not have permission to access this page.',
      });
      router.push('/home');
    }
  }, [userContext?.user, router]);

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
      title: 'Orders',
      icon: <ShoppingCartOutlined style={{ fontSize: '24px' }} />,
      path: '/dashboard/canteen-orders',
      description: 'View and manage food orders'
    },
    {
      title: 'Canteen Items',
      icon: <AppstoreOutlined style={{ fontSize: '24px' }} />,
      path: '/dashboard/canteen-items',
      description: 'Manage menu items and inventory'
    },
    {
      title: 'Order Reports',
      icon: <BarChartOutlined style={{ fontSize: '24px' }} />,
      path: '/dashboard/order-reports',
      description: 'View sales and order analytics'
    },
    {
      title: 'Work Schedule',
      icon: <ScheduleOutlined style={{ fontSize: '24px' }} />,
      path: '/dashboard/schedule',
      description: 'View your work schedule'
    },
    {
      title: 'Inventory',
      icon: <FileTextOutlined style={{ fontSize: '24px' }} />,
      path: '/dashboard/inventory',
      description: 'Manage food inventory'
    },
    {
      title: 'Notifications',
      icon: <BellOutlined style={{ fontSize: '24px' }} />,
      path: '/notification',
      description: 'View notifications'
    },
  ];

  if (!userContext?.user?.role || !userContext.user.role.includes('Canteen Staff')) {
    return (
      <div style={{ padding: '20px' }}>
        <Alert
          message="Access Denied"
          description="You don't have permission to access this page."
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <Card className="welcome-card" style={{ marginBottom: '20px', borderRadius: '8px' }}>
        <Title level={2}>
          Welcome, {userContext?.user?.userName || 'Canteen Staff'}!
          <CheckCircleOutlined style={{ color: '#52c41a', marginLeft: '10px' }} />
        </Title>
        <Text>You are logged in as a Canteen Staff member. You can manage orders, menu items, and inventory.</Text>
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
            title={<Title level={4}><ShoppingCartOutlined /> Order Status</Title>} 
            style={{ borderRadius: '8px' }}
          >
            <Row gutter={16}>
              <Col span={8}>
                <Card style={{ textAlign: 'center', borderRadius: '6px' }}>
                  <Title level={2} style={{ margin: 0, color: '#1890ff' }}>18</Title>
                  <Text>Total Orders Today</Text>
                </Card>
              </Col>
              <Col span={8}>
                <Card style={{ textAlign: 'center', borderRadius: '6px' }}>
                  <Title level={2} style={{ margin: 0, color: '#fa8c16' }}>5</Title>
                  <Text>Pending Orders</Text>
                </Card>
              </Col>
              <Col span={8}>
                <Card style={{ textAlign: 'center', borderRadius: '6px' }}>
                  <Title level={2} style={{ margin: 0, color: '#52c41a' }}>13</Title>
                  <Text>Completed Orders</Text>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CanteenStaffHomePage;
