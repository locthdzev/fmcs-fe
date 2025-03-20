import React, { useState, useEffect } from "react";
import { Typography, Card, Row, Col, Statistic, Button, Table, Tag, Avatar, List, Calendar, Badge } from "antd";
import { PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { UserOutlined, MedicineBoxOutlined, CalendarOutlined, FileTextOutlined, ScheduleOutlined, TeamOutlined, BarChartOutlined, AlertOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';
import { DashboardLayout } from "@/dashboard/Layout";
import { getHealthCheckResultsStatistics } from "@/api/healthcheckresult";
import moment from "moment";
import type { Moment } from 'moment';
import RoleVerification from '@/components/RoleVerification';

const { Title, Text } = Typography;

// Sample data for manager dashboard
const managerSampleData = {
  staffStatistics: {
    total: 135,
    onDuty: 42,
    onLeave: 8,
    newHires: 3
  },
  pharmacyInventory: {
    totalProducts: 487,
    lowStock: 24,
    expiringWithin30Days: 16,
    valuationUSD: 128450
  },
  teamPerformance: [
    { name: 'Jan', appointments: 180, prescriptions: 142 },
    { name: 'Feb', appointments: 200, prescriptions: 160 },
    { name: 'Mar', appointments: 220, prescriptions: 170 },
    { name: 'Apr', appointments: 190, prescriptions: 150 },
    { name: 'May', appointments: 240, prescriptions: 190 },
    { name: 'Jun', appointments: 230, prescriptions: 180 },
    { name: 'Jul', appointments: 250, prescriptions: 200 },
    { name: 'Aug', appointments: 270, prescriptions: 220 },
    { name: 'Sep', appointments: 260, prescriptions: 210 },
    { name: 'Oct', appointments: 280, prescriptions: 225 },
    { name: 'Nov', appointments: 250, prescriptions: 200 },
    { name: 'Dec', appointments: 240, prescriptions: 190 },
  ],
  departmentWorkload: [
    { name: 'General Care', value: 42 },
    { name: 'Specialized Care', value: 28 },
    { name: 'Emergency', value: 15 },
    { name: 'Pharmacy', value: 35 },
    { name: 'Admin', value: 20 },
  ],
  recentStaffActivities: [
    { id: 1, staff: "Dr. Nguyen Van A", action: "Processed 8 appointments", time: "2 hours ago", department: "General Care" },
    { id: 2, staff: "Nurse Tran B", action: "Administered vaccinations", time: "3 hours ago", department: "Specialized Care" },
    { id: 3, staff: "Pharmacist Le C", action: "Filled 12 prescriptions", time: "Yesterday", department: "Pharmacy" },
    { id: 4, staff: "Dr. Pham D", action: "Updated patient records", time: "Yesterday", department: "Emergency" },
    { id: 5, staff: "Admin Hoang E", action: "Generated monthly report", time: "2 days ago", department: "Admin" }
  ],
  scheduledEvents: [
    { id: 1, title: 'Staff Meeting', date: '2023-11-20', type: 'meeting' },
    { id: 2, title: 'Pharmacy Inventory Check', date: '2023-11-22', type: 'inventory' },
    { id: 3, title: 'New Staff Orientation', date: '2023-11-25', type: 'training' },
    { id: 4, title: 'Quarterly Review', date: '2023-12-01', type: 'review' },
    { id: 5, title: 'Health & Safety Training', date: '2023-12-05', type: 'training' }
  ]
};

// Color configuration
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
const departmentColors: Record<string, string> = {
  'General Care': 'green',
  'Specialized Care': 'blue',
  'Emergency': 'red',
  'Pharmacy': 'purple',
  'Admin': 'cyan',
};

const eventTypeColors: Record<string, string> = {
  'meeting': 'blue',
  'inventory': 'purple',
  'training': 'green',
  'review': 'orange',
};

const ManagerHomePage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<any>(null);

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

  const renderManagerWelcome = () => {
    return (
      <Card className="mb-6 bg-gradient-to-r from-blue-600 to-teal-500 text-white">
        <Row gutter={[16, 16]} align="middle">
          <Col span={24} md={16}>
            <Title level={2} style={{ color: 'white', margin: 0 }}>
              Healthcare Manager Dashboard
            </Title>
            <Text style={{ color: 'white', opacity: 0.9 }}>
              Welcome to the FMCS Management Panel. Monitor staff performance, manage resources, and oversee healthcare operations.
            </Text>
            <div className="mt-4">
              <Button type="primary" icon={<TeamOutlined />} className="mr-4" onClick={() => router.push('/schedule/management')}>
                Staff Scheduling
              </Button>
              <Button icon={<BarChartOutlined />} style={{ background: 'rgba(255, 255, 255, 0.2)', borderColor: 'white', color: 'white' }} 
                onClick={() => router.push('/report/management')}>
                Performance Reports
              </Button>
            </div>
          </Col>
          <Col span={24} md={8} className="flex justify-end">
            <div className="flex items-center justify-center w-32 h-32 bg-white rounded-full">
              <TeamOutlined style={{ fontSize: '64px', color: '#0284c7' }} />
            </div>
          </Col>
        </Row>
      </Card>
    );
  };

  const renderResourceStats = () => {
    return (
      <Row gutter={[16, 16]} className="mb-6">
        <Col span={24} md={6}>
          <Card>
            <Statistic 
              title="Staff on Duty" 
              value={managerSampleData.staffStatistics.onDuty} 
              valueStyle={{ color: '#1890ff' }}
              prefix={<TeamOutlined />} 
            />
            <Text type="secondary">Out of {managerSampleData.staffStatistics.total} total staff</Text>
          </Card>
        </Col>
        <Col span={24} md={6}>
          <Card>
            <Statistic 
              title="Pharmaceutical Products" 
              value={managerSampleData.pharmacyInventory.totalProducts} 
              valueStyle={{ color: '#52c41a' }}
              prefix={<MedicineBoxOutlined />} 
            />
            <Text type="secondary">{managerSampleData.pharmacyInventory.lowStock} products in low stock</Text>
          </Card>
        </Col>
        <Col span={24} md={6}>
          <Card>
            <Statistic 
              title="Appointments Today" 
              value={statistics?.followUpStatistics?.appointmentsToday || 35} 
              valueStyle={{ color: '#722ed1' }}
              prefix={<CalendarOutlined />} 
            />
          </Card>
        </Col>
        <Col span={24} md={6}>
          <Card>
            <Statistic 
              title="Reports Pending Review" 
              value={18} 
              valueStyle={{ color: '#fa8c16' }}
              prefix={<FileTextOutlined />} 
            />
          </Card>
        </Col>
      </Row>
    );
  };

  const renderPerformanceCharts = () => {
    return (
      <Row gutter={[16, 16]} className="mb-6">
        <Col span={24} md={16}>
          <Card title="Team Performance - Monthly Trend">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={managerSampleData.teamPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="appointments" stroke="#8884d8" activeDot={{ r: 8 }} name="Appointments" />
                <Line type="monotone" dataKey="prescriptions" stroke="#82ca9d" name="Prescriptions" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={24} md={8}>
          <Card title="Department Workload Distribution">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={managerSampleData.departmentWorkload}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {managerSampleData.departmentWorkload.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    );
  };

  const renderRecentActivitiesAndSchedule = () => {
    return (
      <Row gutter={[16, 16]}>
        <Col span={24} md={12}>
          <Card title="Recent Staff Activities" className="mb-6">
            <List
              itemLayout="horizontal"
              dataSource={managerSampleData.recentStaffActivities}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} />}
                    title={<span>{item.staff} - <Tag color={departmentColors[item.department] || 'default'}>{item.department}</Tag></span>}
                    description={`${item.action} - ${item.time}`}
                  />
                </List.Item>
              )}
            />
            <div className="mt-4 text-right">
              <Button type="primary" onClick={() => router.push('/user/activity-log')}>
                View All Staff Activities
              </Button>
            </div>
          </Card>
        </Col>
        <Col span={24} md={12}>
          <Card title="Upcoming Schedule" className="mb-6">
            <List
              itemLayout="horizontal"
              dataSource={managerSampleData.scheduledEvents}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<ScheduleOutlined />} style={{ backgroundColor: eventTypeColors[item.type] || 'default' }} />}
                    title={<span>{item.title}</span>}
                    description={
                      <div>
                        <Tag color={eventTypeColors[item.type] || 'default'}>{item.type}</Tag>
                        <span className="ml-2">{moment(item.date).format('DD/MM/YYYY')}</span>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
            <div className="mt-4 text-right">
              <Button type="primary" onClick={() => router.push('/schedule/management')}>
                Manage Schedule
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
                  onClick={() => router.push('/schedule/management')}
                >
                  <ScheduleOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                  <div className="mt-2">Scheduling</div>
                </Card>
              </Col>
              <Col span={8} md={4}>
                <Card 
                  hoverable 
                  className="text-center" 
                  onClick={() => router.push('/inventory-record/management')}
                >
                  <MedicineBoxOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                  <div className="mt-2">Inventory</div>
                </Card>
              </Col>
              <Col span={8} md={4}>
                <Card 
                  hoverable 
                  className="text-center" 
                  onClick={() => router.push('/appointment/management')}
                >
                  <CalendarOutlined style={{ fontSize: 24, color: '#fa8c16' }} />
                  <div className="mt-2">Appointments</div>
                </Card>
              </Col>
              <Col span={8} md={4}>
                <Card 
                  hoverable 
                  className="text-center" 
                  onClick={() => router.push('/health-check-result/management')}
                >
                  <FileTextOutlined style={{ fontSize: 24, color: '#eb2f96' }} />
                  <div className="mt-2">Health Records</div>
                </Card>
              </Col>
              <Col span={8} md={4}>
                <Card 
                  hoverable 
                  className="text-center" 
                  onClick={() => router.push('/report/management')}
                >
                  <BarChartOutlined style={{ fontSize: 24, color: '#722ed1' }} />
                  <div className="mt-2">Reports</div>
                </Card>
              </Col>
              <Col span={8} md={4}>
                <Card 
                  hoverable 
                  className="text-center" 
                  onClick={() => router.push('/notification/management')}
                >
                  <AlertOutlined style={{ fontSize: 24, color: '#13c2c2' }} />
                  <div className="mt-2">Alerts</div>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    );
  };

  return (
    <RoleVerification requiredRole="Manager">
      <div style={{ padding: '20px' }}>
        {renderManagerWelcome()}
        {renderQuickAccess()}
        {renderResourceStats()}
        {renderPerformanceCharts()}
        {renderRecentActivitiesAndSchedule()}
      </div>
    </RoleVerification>
  );
};

ManagerHomePage.getLayout = function getLayout(page: React.ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default ManagerHomePage; 