import React, { useState, useEffect } from "react";
import { Typography, Card, Row, Col, Statistic, Button, Table, Tag, Avatar, List } from "antd";
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { UserOutlined, SettingOutlined, TeamOutlined, MedicineBoxOutlined, AlertOutlined, CheckCircleOutlined, ClockCircleOutlined, ShoppingOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';
import { DashboardLayout } from "@/dashboard/Layout";
import { getHealthCheckResultsStatistics } from "@/api/healthcheckresult";
import RoleVerification from '@/components/RoleVerification';

const { Title, Text } = Typography;

// Sample data for admin dashboard
const adminSampleData = {
  userStatistics: {
    total: 1245,
    active: 1180,
    inactive: 65,
    newThisMonth: 42
  },
  systemStatus: {
    uptime: "99.9%",
    lastRestart: "2023-10-15",
    activeSessions: 78,
    pendingTasks: 12
  },
  recentActivities: [
    { id: 1, user: "Dr. Nguyen Van A", action: "Updated user role", time: "2 hours ago", type: "user" },
    { id: 2, user: "Pharmacist Tran B", action: "Added new medication", time: "3 hours ago", type: "drug" },
    { id: 3, user: "Admin Le C", action: "System backup", time: "Yesterday", type: "system" },
    { id: 4, user: "Manager Pham D", action: "Generated monthly report", time: "Yesterday", type: "report" },
    { id: 5, user: "Dr. Hoang E", action: "Updated treatment protocol", time: "2 days ago", type: "protocol" }
  ],
  roleDistribution: [
    { name: 'Administrators', value: 15 },
    { name: 'Managers', value: 30 },
    { name: 'Staff', value: 120 },
    { name: 'Users', value: 1080 },
  ],
  medicationData: [
    { name: 'Anti-inflammatory', stock: 450, usage: 120, reorder: 100 },
    { name: 'Antibiotics', stock: 320, usage: 85, reorder: 80 },
    { name: 'Pain relief', stock: 680, usage: 230, reorder: 150 },
    { name: 'Vitamins', stock: 540, usage: 95, reorder: 120 },
    { name: 'Allergy', stock: 210, usage: 65, reorder: 70 },
  ]
};

// Color configuration
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
const roleColors: Record<string, string> = {
  'user': 'green',
  'drug': 'blue',
  'system': 'purple',
  'report': 'orange',
  'protocol': 'cyan',
};

const AdminHomePage = () => {
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

  const renderAdminWelcome = () => {
    return (
      <Card className="mb-6 bg-gradient-to-r from-purple-600 to-indigo-800 text-white">
        <Row gutter={[16, 16]} align="middle">
          <Col span={24} md={16}>
            <Title level={2} style={{ color: 'white', margin: 0 }}>
              Admin Dashboard
            </Title>
            <Text style={{ color: 'white', opacity: 0.9 }}>
              Welcome to the FMCS Administration Panel. Monitor system performance, manage users, and oversee all operations.
            </Text>
            <div className="mt-4">
              <Button type="primary" icon={<UserOutlined />} className="mr-4" onClick={() => router.push('/user/management')}>
                User Management
              </Button>
              <Button icon={<SettingOutlined />} style={{ background: 'rgba(255, 255, 255, 0.2)', borderColor: 'white', color: 'white' }} 
                onClick={() => router.push('/admin/settings')}>
                System Settings
              </Button>
            </div>
          </Col>
          <Col span={24} md={8} className="flex justify-end">
            <div className="flex items-center justify-center w-32 h-32 bg-white rounded-full">
              <SettingOutlined style={{ fontSize: '64px', color: '#4C1D95' }} />
            </div>
          </Col>
        </Row>
      </Card>
    );
  };

  const renderSystemStatus = () => {
    return (
      <Row gutter={[16, 16]} className="mb-6">
        <Col span={24} md={6}>
          <Card>
            <Statistic 
              title="Total Users" 
              value={adminSampleData.userStatistics.total} 
              valueStyle={{ color: '#1890ff' }}
              prefix={<TeamOutlined />} 
            />
            <Text type="secondary">{adminSampleData.userStatistics.newThisMonth} new this month</Text>
          </Card>
        </Col>
        <Col span={24} md={6}>
          <Card>
            <Statistic 
              title="System Uptime" 
              value={adminSampleData.systemStatus.uptime} 
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />} 
            />
            <Text type="secondary">Last restart: {adminSampleData.systemStatus.lastRestart}</Text>
          </Card>
        </Col>
        <Col span={24} md={6}>
          <Card>
            <Statistic 
              title="Active Sessions" 
              value={adminSampleData.systemStatus.activeSessions} 
              valueStyle={{ color: '#722ed1' }}
              prefix={<UserOutlined />} 
            />
          </Card>
        </Col>
        <Col span={24} md={6}>
          <Card>
            <Statistic 
              title="Pending Tasks" 
              value={adminSampleData.systemStatus.pendingTasks} 
              valueStyle={{ color: '#fa8c16' }}
              prefix={<ClockCircleOutlined />} 
            />
          </Card>
        </Col>
      </Row>
    );
  };

  const renderUserDistribution = () => {
    return (
      <Row gutter={[16, 16]} className="mb-6">
        <Col span={24} md={12}>
          <Card title="User Role Distribution">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={adminSampleData.roleDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {adminSampleData.roleDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={24} md={12}>
          <Card title="Medication Inventory Status">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={adminSampleData.medicationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="stock" fill="#8884d8" name="Current Stock" />
                <Bar dataKey="usage" fill="#82ca9d" name="Monthly Usage" />
                <Bar dataKey="reorder" fill="#ffc658" name="Reorder Level" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    );
  };

  const renderRecentActivity = () => {
    return (
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="Recent System Activities" className="mb-6">
            <List
              itemLayout="horizontal"
              dataSource={adminSampleData.recentActivities}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} />}
                    title={<span>{item.user} - <Tag color={roleColors[item.type] || 'default'}>{item.type}</Tag></span>}
                    description={`${item.action} - ${item.time}`}
                  />
                </List.Item>
              )}
            />
            <div className="mt-4 text-right">
              <Button type="primary" onClick={() => router.push('/admin/logs')}>
                View All Activity Logs
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
                  onClick={() => router.push('/user/management')}
                >
                  <UserOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                  <div className="mt-2">Users</div>
                </Card>
              </Col>
              <Col span={8} md={4}>
                <Card 
                  hoverable 
                  className="text-center" 
                  onClick={() => router.push('/drug/management')}
                >
                  <MedicineBoxOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                  <div className="mt-2">Drugs</div>
                </Card>
              </Col>
              <Col span={8} md={4}>
                <Card 
                  hoverable 
                  className="text-center" 
                  onClick={() => router.push('/drug-order/management')}
                >
                  <ShoppingOutlined style={{ fontSize: 24, color: '#fa8c16' }} />
                  <div className="mt-2">Orders</div>
                </Card>
              </Col>
              <Col span={8} md={4}>
                <Card 
                  hoverable 
                  className="text-center" 
                  onClick={() => router.push('/notification/management')}
                >
                  <AlertOutlined style={{ fontSize: 24, color: '#eb2f96' }} />
                  <div className="mt-2">Alerts</div>
                </Card>
              </Col>
              <Col span={8} md={4}>
                <Card 
                  hoverable 
                  className="text-center" 
                  onClick={() => router.push('/report/management')}
                >
                  <BarChart style={{ fontSize: 24, color: '#722ed1' }} />
                  <div className="mt-2">Reports</div>
                </Card>
              </Col>
              <Col span={8} md={4}>
                <Card 
                  hoverable 
                  className="text-center" 
                  onClick={() => router.push('/admin/settings')}
                >
                  <SettingOutlined style={{ fontSize: 24, color: '#13c2c2' }} />
                  <div className="mt-2">Settings</div>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    );
  };

  return (
    <RoleVerification requiredRole="Admin">
      <div style={{ padding: '20px' }}>
        {renderAdminWelcome()}
        {renderQuickAccess()}
        {renderSystemStatus()}
        {renderUserDistribution()}
        {renderRecentActivity()}
      </div>
    </RoleVerification>
  );
};

AdminHomePage.getLayout = function getLayout(page: React.ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default AdminHomePage; 