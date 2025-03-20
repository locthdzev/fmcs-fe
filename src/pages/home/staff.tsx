import React, { useState, useEffect } from "react";
import { Typography, Card, Row, Col, Statistic, Button, List, Avatar, Tag, Badge, Timeline, Calendar } from "antd";
import { CalendarOutlined, MedicineBoxOutlined, UserOutlined, FileDoneOutlined, ClockCircleOutlined, NotificationOutlined, FileSearchOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';
import { DashboardLayout } from "@/dashboard/Layout";
import { getHealthCheckResultsStatistics } from "@/api/healthcheckresult";
import moment from "moment";
import type { Moment } from 'moment';
import RoleVerification from '@/components/RoleVerification';

const { Title, Text } = Typography;

// Sample data for staff dashboard
const staffSampleData = {
  dailyAppointments: [
    { id: 1, patientName: "Nguyen Van A", time: "9:00 AM", type: "General Checkup", status: "Checked In" },
    { id: 2, patientName: "Tran Thi B", time: "10:30 AM", type: "Follow-up", status: "Waiting" },
    { id: 3, patientName: "Le Van C", time: "11:45 AM", type: "Vaccination", status: "Scheduled" },
    { id: 4, patientName: "Pham Thi D", time: "2:15 PM", type: "Consultation", status: "Scheduled" },
    { id: 5, patientName: "Hoang Van E", time: "3:30 PM", type: "Prescription Renewal", status: "Scheduled" }
  ],
  medicationDispensing: [
    { id: 1, patient: "Nguyen Van A", medication: "Amoxicillin 500mg", quantity: "30 tablets", time: "9:30 AM" },
    { id: 2, patient: "Pham Van F", medication: "Lisinopril 10mg", quantity: "60 tablets", time: "11:15 AM" },
    { id: 3, patient: "Tran Thi G", medication: "Metformin 850mg", quantity: "90 tablets", time: "Yesterday" }
  ],
  tasksForToday: [
    { id: 1, task: "Review lab results for Patient ID#1234", priority: "High", status: "In Progress" },
    { id: 2, task: "Update vaccination records", priority: "Medium", status: "Pending" },
    { id: 3, task: "Inventory check - Antibiotics", priority: "Medium", status: "Pending" },
    { id: 4, task: "Schedule follow-ups for post-op patients", priority: "High", status: "Not Started" }
  ],
  shiftInfo: {
    today: "8:00 AM - 5:00 PM",
    tomorrow: "8:00 AM - 5:00 PM",
    dayAfterTomorrow: "Off Duty",
    nextWeek: [
      { date: "Monday", time: "8:00 AM - 5:00 PM" },
      { date: "Tuesday", time: "8:00 AM - 5:00 PM" },
      { date: "Wednesday", time: "1:00 PM - 10:00 PM" },
      { date: "Thursday", time: "1:00 PM - 10:00 PM" },
      { date: "Friday", time: "Off Duty" },
      { date: "Saturday", time: "8:00 AM - 5:00 PM" },
      { date: "Sunday", time: "Off Duty" }
    ]
  },
  recentNotifications: [
    { id: 1, title: "New appointment request", time: "30 minutes ago", type: "appointment" },
    { id: 2, title: "Lab results ready for Patient ID#5678", time: "2 hours ago", type: "lab" },
    { id: 3, title: "Medication inventory alert: Low stock on Paracetamol", time: "Yesterday", type: "inventory" },
    { id: 4, title: "Meeting reminder: Staff briefing at 4:00 PM", time: "Yesterday", type: "meeting" }
  ]
};

// Color configuration
const priorityColors = {
  "High": "red",
  "Medium": "orange",
  "Low": "green"
};

const statusColors = {
  "Checked In": "green",
  "Waiting": "gold",
  "Scheduled": "blue",
  "Completed": "gray",
  "Cancelled": "red",
  "In Progress": "blue",
  "Pending": "gold",
  "Not Started": "purple"
};

const notificationColors = {
  "appointment": "blue",
  "lab": "green",
  "inventory": "orange",
  "meeting": "purple"
};

const StaffHomePage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<any>(null);
  const [currentDate, setCurrentDate] = useState<Moment>(moment());

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

  const renderStaffWelcome = () => {
    return (
      <Card className="mb-6 bg-gradient-to-r from-emerald-500 to-teal-700 text-white">
        <Row gutter={[16, 16]} align="middle">
          <Col span={24} md={16}>
            <Title level={2} style={{ color: 'white', margin: 0 }}>
              Medical Staff Dashboard
            </Title>
            <Text style={{ color: 'white', opacity: 0.9 }}>
              Welcome to your FMCS workspace. Manage patient appointments, track medications, and access medical records.
            </Text>
            <div className="mt-4">
              <Button type="primary" icon={<CalendarOutlined />} className="mr-4" onClick={() => router.push('/appointment/management')}>
                Manage Appointments
              </Button>
              <Button icon={<FileSearchOutlined />} style={{ background: 'rgba(255, 255, 255, 0.2)', borderColor: 'white', color: 'white' }} 
                onClick={() => router.push('/health-check-result/management')}>
                Patient Records
              </Button>
            </div>
          </Col>
          <Col span={24} md={8} className="flex justify-end">
            <div className="flex items-center justify-center w-32 h-32 bg-white rounded-full">
              <UserOutlined style={{ fontSize: '64px', color: '#047857' }} />
            </div>
          </Col>
        </Row>
      </Card>
    );
  };

  const renderDailyStats = () => {
    return (
      <Row gutter={[16, 16]} className="mb-6">
        <Col span={24} md={6}>
          <Card>
            <Statistic 
              title="Today's Appointments" 
              value={staffSampleData.dailyAppointments.length} 
              valueStyle={{ color: '#1890ff' }}
              prefix={<CalendarOutlined />} 
            />
            <Text type="secondary">{staffSampleData.dailyAppointments.filter(a => a.status === "Checked In").length} checked in</Text>
          </Card>
        </Col>
        <Col span={24} md={6}>
          <Card>
            <Statistic 
              title="Medications Dispensed" 
              value={staffSampleData.medicationDispensing.length} 
              valueStyle={{ color: '#52c41a' }}
              prefix={<MedicineBoxOutlined />} 
            />
            <Text type="secondary">Today</Text>
          </Card>
        </Col>
        <Col span={24} md={6}>
          <Card>
            <Statistic 
              title="Tasks for Today" 
              value={staffSampleData.tasksForToday.length} 
              valueStyle={{ color: '#722ed1' }}
              prefix={<FileDoneOutlined />} 
            />
            <Text type="secondary">{staffSampleData.tasksForToday.filter(t => t.status === "In Progress" || t.status === "Completed").length} completed</Text>
          </Card>
        </Col>
        <Col span={24} md={6}>
          <Card>
            <Statistic 
              title="Current Shift" 
              value={staffSampleData.shiftInfo.today} 
              valueStyle={{ color: '#fa8c16' }}
              prefix={<ClockCircleOutlined />} 
            />
            <Text type="secondary">Tomorrow: {staffSampleData.shiftInfo.tomorrow}</Text>
          </Card>
        </Col>
      </Row>
    );
  };

  const renderAppointmentsAndMedication = () => {
    return (
      <Row gutter={[16, 16]} className="mb-6">
        <Col span={24} md={12}>
          <Card title="Today's Appointments" extra={<a href="/appointment/management">View All</a>}>
            <List
              itemLayout="horizontal"
              dataSource={staffSampleData.dailyAppointments}
              renderItem={(item) => (
                <List.Item actions={[
                  <Button key="view" size="small" type="primary" onClick={() => router.push(`/appointment/${item.id}`)}>
                    View
                  </Button>
                ]}>
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} />}
                    title={
                      <span>
                        {item.patientName} - {item.time}
                      </span>
                    }
                    description={
                      <div>
                        <Tag>{item.type}</Tag>
                        <Tag color={statusColors[item.status as keyof typeof statusColors]}>{item.status}</Tag>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col span={24} md={12}>
          <Card title="Recent Medication Dispensing" extra={<a href="/inventory-record/management">View All</a>}>
            <List
              itemLayout="horizontal"
              dataSource={staffSampleData.medicationDispensing}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<MedicineBoxOutlined />} />}
                    title={
                      <span>
                        {item.patient} - {item.time}
                      </span>
                    }
                    description={
                      <div>
                        <Tag color="blue">{item.medication}</Tag>
                        <Tag color="green">{item.quantity}</Tag>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    );
  };

  const renderTasksAndNotifications = () => {
    return (
      <Row gutter={[16, 16]} className="mb-6">
        <Col span={24} md={12}>
          <Card title="Tasks" extra={<Badge count={staffSampleData.tasksForToday.length} style={{ backgroundColor: '#52c41a' }} />}>
            <Timeline mode="left">
              {staffSampleData.tasksForToday.map((task) => (
                <Timeline.Item 
                  key={task.id} 
                  color={priorityColors[task.priority as keyof typeof priorityColors]}
                  label={<Tag color={statusColors[task.status as keyof typeof statusColors]}>{task.status}</Tag>}
                >
                  <div className="font-medium">{task.task}</div>
                  <div><Tag color={priorityColors[task.priority as keyof typeof priorityColors]}>{task.priority} Priority</Tag></div>
                </Timeline.Item>
              ))}
            </Timeline>
            <div className="mt-4 text-right">
              <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => router.push('/task/management')}>
                Manage Tasks
              </Button>
            </div>
          </Card>
        </Col>
        <Col span={24} md={12}>
          <Card title="Recent Notifications" extra={<Badge count={staffSampleData.recentNotifications.length} />}>
            <List
              itemLayout="horizontal"
              dataSource={staffSampleData.recentNotifications}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<NotificationOutlined />} style={{ backgroundColor: notificationColors[item.type as keyof typeof notificationColors] }} />}
                    title={<span>{item.title}</span>}
                    description={
                      <div>
                        <Tag color={notificationColors[item.type as keyof typeof notificationColors]}>{item.type}</Tag>
                        <span className="ml-2">{item.time}</span>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
            <div className="mt-4 text-right">
              <Button type="primary" onClick={() => router.push('/notification/management')}>
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
                  <div className="mt-2">New Appointment</div>
                </Card>
              </Col>
              <Col span={8} md={4}>
                <Card 
                  hoverable 
                  className="text-center" 
                  onClick={() => router.push('/health-check-result/add')}
                >
                  <FileSearchOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                  <div className="mt-2">New Health Record</div>
                </Card>
              </Col>
              <Col span={8} md={4}>
                <Card 
                  hoverable 
                  className="text-center" 
                  onClick={() => router.push('/inventory-record/management')}
                >
                  <MedicineBoxOutlined style={{ fontSize: 24, color: '#fa8c16' }} />
                  <div className="mt-2">Medications</div>
                </Card>
              </Col>
              <Col span={8} md={4}>
                <Card 
                  hoverable 
                  className="text-center" 
                  onClick={() => router.push('/schedule/management')}
                >
                  <ClockCircleOutlined style={{ fontSize: 24, color: '#eb2f96' }} />
                  <div className="mt-2">My Schedule</div>
                </Card>
              </Col>
              <Col span={8} md={4}>
                <Card 
                  hoverable 
                  className="text-center" 
                  onClick={() => router.push('/notification/management')}
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
    <RoleVerification requiredRole="Staff">
      <div style={{ padding: '20px' }}>
        {renderStaffWelcome()}
        {renderQuickAccess()}
        {renderDailyStats()}
        {renderAppointmentsAndMedication()}
        {renderTasksAndNotifications()}
      </div>
    </RoleVerification>
  );
};

StaffHomePage.getLayout = function getLayout(page: React.ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default StaffHomePage; 