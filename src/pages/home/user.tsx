import React, { useState, useEffect } from "react";
import { Typography, Card, Row, Col, Statistic, Button, List, Avatar, Tag, Steps, Calendar, Badge, Empty } from "antd";
import { CalendarOutlined, MedicineBoxOutlined, FileDoneOutlined, UserOutlined, HeartOutlined, SafetyCertificateOutlined, FileSearchOutlined, NotificationOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';
import { DashboardLayout } from "@/dashboard/Layout";
import { getHealthCheckResultsStatistics } from "@/api/healthcheckresult";
import moment from "moment";
import type { Moment } from 'moment';
import RoleVerification from '@/components/RoleVerification';

const { Title, Text } = Typography;
const { Step } = Steps;

// Sample data for user dashboard
const userSampleData = {
  upcomingAppointments: [
    { id: 1, doctor: "Dr. Nguyen Van A", date: "2023-11-24", time: "9:00 AM", type: "General Checkup", status: "Confirmed" },
    { id: 2, doctor: "Dr. Tran Thi B", date: "2023-12-05", time: "10:30 AM", type: "Follow-up", status: "Scheduled" },
  ],
  currentPrescriptions: [
    { id: 1, medication: "Amoxicillin 500mg", dosage: "1 tablet, twice a day", prescribed: "2023-11-10", until: "2023-11-24", refillable: true },
    { id: 2, medication: "Loratadine 10mg", dosage: "1 tablet daily", prescribed: "2023-11-10", until: "2023-12-10", refillable: false },
  ],
  healthStats: {
    lastVisit: "2023-11-10",
    nextScheduledCheckup: "2024-05-15",
    bmi: "22.5",
    bloodPressure: "120/80",
    allergies: ["Penicillin", "Peanuts"]
  },
  healthInsurance: {
    provider: "Vietnam Health Insurance",
    policyNumber: "VHI1234567890",
    expiryDate: "2024-12-31",
    status: "Active",
    coverageType: "Comprehensive"
  },
  recentTests: [
    { id: 1, name: "Complete Blood Count", date: "2023-11-10", status: "Results Available" },
    { id: 2, name: "Liver Function Test", date: "2023-11-10", status: "Results Available" },
    { id: 3, name: "Urinalysis", date: "2023-11-10", status: "Processing" }
  ],
  notifications: [
    { id: 1, title: "Appointment Reminder", message: "You have an appointment tomorrow at 9:00 AM", time: "2 hours ago", type: "reminder" },
    { id: 2, title: "Test Results Available", message: "Your recent test results are now available", time: "Yesterday", type: "results" },
    { id: 3, title: "Medication Refill", message: "Your medication is due for refill in 3 days", time: "2 days ago", type: "medication" }
  ]
};

// Color configuration
const appointmentStatusColors = {
  "Confirmed": "green",
  "Scheduled": "blue",
  "Cancelled": "red",
  "Completed": "gray"
};

const testStatusColors = {
  "Results Available": "green",
  "Processing": "blue",
  "Pending": "orange"
};

const notificationTypeColors = {
  "reminder": "blue",
  "results": "green",
  "medication": "purple",
  "general": "orange"
};

const insuranceStatusColors = {
  "Active": "green",
  "Expired": "red",
  "Pending": "orange"
};

const UserHomePage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Moment>(moment());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getHealthCheckResultsStatistics();
        if (response.isSuccess) {
          setStatistics(response.data);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching statistics:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getListData = (value: Moment) => {
    const dateString = value.format('YYYY-MM-DD');
    
    const matchingAppointments = userSampleData.upcomingAppointments.filter(
      app => app.date === dateString
    );
    
    return matchingAppointments.map(app => ({
      type: 'success',
      content: `${app.time} - ${app.type}`
    }));
  };
  
  const dateCellRender = (value: Moment) => {
    const listData = getListData(value);
    return (
      <ul className="events">
        {listData.map((item, index) => (
          <li key={index}>
            <Badge status="success" text={item.content} />
          </li>
        ))}
      </ul>
    );
  };

  const renderUserWelcome = () => {
    return (
      <Card className="mb-6 bg-gradient-to-r from-violet-500 to-purple-700 text-white">
        <Row gutter={[16, 16]} align="middle">
          <Col span={24} md={16}>
            <Title level={2} style={{ color: 'white', margin: 0 }}>
              Welcome to Your Health Portal
            </Title>
            <Text style={{ color: 'white', opacity: 0.9 }}>
              Manage your appointments, view your health records, and track your medications all in one place.
            </Text>
            <div className="mt-4">
              <Button type="primary" icon={<CalendarOutlined />} className="mr-4" onClick={() => router.push('/appointment/book')}>
                Book Appointment
              </Button>
              <Button icon={<FileSearchOutlined />} style={{ background: 'rgba(255, 255, 255, 0.2)', borderColor: 'white', color: 'white' }} 
                onClick={() => router.push('/health-check-result/my-records')}>
                My Health Records
              </Button>
            </div>
          </Col>
          <Col span={24} md={8} className="flex justify-end">
            <div className="flex items-center justify-center w-32 h-32 bg-white rounded-full">
              <HeartOutlined style={{ fontSize: '64px', color: '#7e22ce' }} />
            </div>
          </Col>
        </Row>
      </Card>
    );
  };

  const renderHealthInsuranceCard = () => {
    return (
      <Card className="mb-6 bg-gradient-to-r from-gray-800 to-gray-900 text-white">
        <Row gutter={[16, 16]} align="middle">
          <Col span={24} md={18}>
            <div className="flex flex-col">
              <div className="flex items-center mb-4">
                <SafetyCertificateOutlined className="text-2xl mr-2" />
                <Title level={4} style={{ color: 'white', margin: 0 }}>
                  {userSampleData.healthInsurance.provider}
                </Title>
              </div>
              <div className="mb-2">
                <Text style={{ color: 'white', opacity: 0.7 }}>Policy Number</Text>
                <div className="text-lg font-semibold">{userSampleData.healthInsurance.policyNumber}</div>
              </div>
              <div className="mb-2">
                <Text style={{ color: 'white', opacity: 0.7 }}>Coverage Type</Text>
                <div className="text-lg font-semibold">{userSampleData.healthInsurance.coverageType}</div>
              </div>
              <div className="flex justify-between">
                <div>
                  <Text style={{ color: 'white', opacity: 0.7 }}>Expiry Date</Text>
                  <div className="text-lg font-semibold">{userSampleData.healthInsurance.expiryDate}</div>
                </div>
                <div>
                  <Text style={{ color: 'white', opacity: 0.7 }}>Status</Text>
                  <Tag color={insuranceStatusColors[userSampleData.healthInsurance.status as keyof typeof insuranceStatusColors]} className="mt-1">
                    {userSampleData.healthInsurance.status}
                  </Tag>
                </div>
              </div>
            </div>
          </Col>
          <Col span={24} md={6} className="flex justify-end">
            <Button type="primary" ghost onClick={() => router.push('/health-insurance/my-insurance')}>
              View Details
            </Button>
          </Col>
        </Row>
      </Card>
    );
  };

  const renderHealthSummary = () => {
    return (
      <Row gutter={[16, 16]} className="mb-6">
        <Col span={24} md={6}>
          <Card>
            <Statistic 
              title="Upcoming Appointments" 
              value={userSampleData.upcomingAppointments.length} 
              valueStyle={{ color: '#1890ff' }}
              prefix={<CalendarOutlined />} 
            />
            <Text type="secondary">Next: {userSampleData.upcomingAppointments.length > 0 ? userSampleData.upcomingAppointments[0].date : "None"}</Text>
          </Card>
        </Col>
        <Col span={24} md={6}>
          <Card>
            <Statistic 
              title="Active Prescriptions" 
              value={userSampleData.currentPrescriptions.length} 
              valueStyle={{ color: '#52c41a' }}
              prefix={<MedicineBoxOutlined />} 
            />
            <Text type="secondary">{userSampleData.currentPrescriptions.filter(p => p.refillable).length} refillable</Text>
          </Card>
        </Col>
        <Col span={24} md={6}>
          <Card>
            <Statistic 
              title="Test Results" 
              value={userSampleData.recentTests.filter(t => t.status === "Results Available").length} 
              valueStyle={{ color: '#722ed1' }}
              prefix={<FileDoneOutlined />} 
            />
            <Text type="secondary">of {userSampleData.recentTests.length} recent tests</Text>
          </Card>
        </Col>
        <Col span={24} md={6}>
          <Card>
            <Statistic 
              title="Next Checkup" 
              value={moment(userSampleData.healthStats.nextScheduledCheckup).format("MMM DD, YYYY")} 
              valueStyle={{ color: '#fa8c16' }}
              prefix={<UserOutlined />} 
            />
            <Text type="secondary">Last visit: {moment(userSampleData.healthStats.lastVisit).format("MMM DD, YYYY")}</Text>
          </Card>
        </Col>
      </Row>
    );
  };

  const renderAppointmentsAndPrescriptions = () => {
    return (
      <Row gutter={[16, 16]} className="mb-6">
        <Col span={24} md={12}>
          <Card title="Upcoming Appointments" extra={<a href="/appointment">View All</a>}>
            {userSampleData.upcomingAppointments.length > 0 ? (
              <List
                itemLayout="horizontal"
                dataSource={userSampleData.upcomingAppointments}
                renderItem={(item) => (
                  <List.Item actions={[
                    <Button key="view" size="small" type="primary" onClick={() => router.push(`/appointment/${item.id}`)}>
                      Details
                    </Button>
                  ]}>
                    <List.Item.Meta
                      avatar={<Avatar icon={<UserOutlined />} />}
                      title={
                        <span>
                          {item.doctor} - {moment(item.date).format("MMM DD, YYYY")} {item.time}
                        </span>
                      }
                      description={
                        <div>
                          <Tag>{item.type}</Tag>
                          <Tag color={appointmentStatusColors[item.status as keyof typeof appointmentStatusColors]}>{item.status}</Tag>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="No upcoming appointments" />
            )}
            <div className="mt-4 text-right">
              <Button type="primary" onClick={() => router.push('/appointment/book')}>
                Book New Appointment
              </Button>
            </div>
          </Card>
        </Col>
        <Col span={24} md={12}>
          <Card title="Current Prescriptions" extra={<a href="/prescription">View All</a>}>
            {userSampleData.currentPrescriptions.length > 0 ? (
              <List
                itemLayout="horizontal"
                dataSource={userSampleData.currentPrescriptions}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar icon={<MedicineBoxOutlined />} />}
                      title={
                        <span>
                          {item.medication} - {item.dosage}
                        </span>
                      }
                      description={
                        <div>
                          <div>Prescribed: {moment(item.prescribed).format("MMM DD, YYYY")}</div>
                          <div>Until: {moment(item.until).format("MMM DD, YYYY")}</div>
                          <Tag color={item.refillable ? "green" : "red"}>{item.refillable ? "Refillable" : "Non-refillable"}</Tag>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="No active prescriptions" />
            )}
          </Card>
        </Col>
      </Row>
    );
  };

  const renderTestResultsAndNotifications = () => {
    return (
      <Row gutter={[16, 16]} className="mb-6">
        <Col span={24} md={12}>
          <Card title="Recent Test Results" extra={<a href="/health-check-result/my-records">View All</a>}>
            {userSampleData.recentTests.length > 0 ? (
              <List
                itemLayout="horizontal"
                dataSource={userSampleData.recentTests}
                renderItem={(item) => (
                  <List.Item actions={[
                    item.status === "Results Available" ? (
                      <Button key="view" size="small" type="primary" onClick={() => router.push(`/health-check-result/${item.id}`)}>
                        View
                      </Button>
                    ) : null
                  ]}>
                    <List.Item.Meta
                      avatar={<Avatar icon={<FileDoneOutlined />} />}
                      title={<span>{item.name}</span>}
                      description={
                        <div>
                          <div>Date: {moment(item.date).format("MMM DD, YYYY")}</div>
                          <Tag color={testStatusColors[item.status as keyof typeof testStatusColors]}>{item.status}</Tag>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="No recent test results" />
            )}
          </Card>
        </Col>
        <Col span={24} md={12}>
          <Card title="Notifications" extra={<Badge count={userSampleData.notifications.length} />}>
            {userSampleData.notifications.length > 0 ? (
              <List
                itemLayout="horizontal"
                dataSource={userSampleData.notifications}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar icon={<NotificationOutlined />} style={{ backgroundColor: notificationTypeColors[item.type as keyof typeof notificationTypeColors] }} />}
                      title={<span>{item.title}</span>}
                      description={
                        <div>
                          <div>{item.message}</div>
                          <div className="mt-1">
                            <Tag color={notificationTypeColors[item.type as keyof typeof notificationTypeColors]}>{item.type}</Tag>
                            <span className="ml-2">{item.time}</span>
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="No notifications" />
            )}
            <div className="mt-4 text-right">
              <Button type="primary" onClick={() => router.push('/notification')}>
                View All Notifications
              </Button>
            </div>
          </Card>
        </Col>
      </Row>
    );
  };

  const renderQuickAccess = () => {
    return (
      <Row gutter={[16, 16]} className="mb-6">
        <Col span={24}>
          <Card title="Quick Access">
            <Row gutter={[16, 16]}>
              <Col span={8} md={4}>
                <Card 
                  hoverable 
                  className="text-center" 
                  onClick={() => router.push('/appointment/book')}
                >
                  <CalendarOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                  <div className="mt-2">Book Appointment</div>
                </Card>
              </Col>
              <Col span={8} md={4}>
                <Card 
                  hoverable 
                  className="text-center" 
                  onClick={() => router.push('/health-check-result/my-records')}
                >
                  <FileDoneOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                  <div className="mt-2">Health Records</div>
                </Card>
              </Col>
              <Col span={8} md={4}>
                <Card 
                  hoverable 
                  className="text-center" 
                  onClick={() => router.push('/prescription')}
                >
                  <MedicineBoxOutlined style={{ fontSize: 24, color: '#fa8c16' }} />
                  <div className="mt-2">Prescriptions</div>
                </Card>
              </Col>
              <Col span={8} md={4}>
                <Card 
                  hoverable 
                  className="text-center" 
                  onClick={() => router.push('/health-insurance/my-insurance')}
                >
                  <SafetyCertificateOutlined style={{ fontSize: 24, color: '#eb2f96' }} />
                  <div className="mt-2">Insurance</div>
                </Card>
              </Col>
              <Col span={8} md={4}>
                <Card 
                  hoverable 
                  className="text-center" 
                  onClick={() => router.push('/notification')}
                >
                  <NotificationOutlined style={{ fontSize: 24, color: '#722ed1' }} />
                  <div className="mt-2">Notifications</div>
                </Card>
              </Col>
              <Col span={8} md={4}>
                <Card 
                  hoverable 
                  className="text-center" 
                  onClick={() => router.push('/user/profile')}
                >
                  <UserOutlined style={{ fontSize: 24, color: '#13c2c2' }} />
                  <div className="mt-2">My Profile</div>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    );
  };

  return (
    <RoleVerification requiredRole="User">
      <div style={{ padding: '20px' }}>
        {renderUserWelcome()}
        {renderHealthInsuranceCard()}
        {renderQuickAccess()}
        {renderHealthSummary()}
        {renderAppointmentsAndPrescriptions()}
        {renderTestResultsAndNotifications()}
      </div>
    </RoleVerification>
  );
};

UserHomePage.getLayout = function getLayout(page: React.ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default UserHomePage; 