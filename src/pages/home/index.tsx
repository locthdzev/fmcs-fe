import React, { useState, useEffect, useContext } from "react";
import { Typography, Card, Row, Col, Statistic, Button, List, Avatar, Tag, Spin, Divider } from "antd";
import { PieChart, Pie, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { UserOutlined, MedicineBoxOutlined, CalendarOutlined, SafetyCertificateOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';
import { UserContext } from '@/context/UserContext';
import { getHealthCheckResultsStatistics } from "@/api/healthcheckresult";
import moment from "moment";
import { Cell } from 'recharts';

const { Title, Text } = Typography;

export default function HomePage() {
  const router = useRouter();
  const userContext = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<any>(null);

  const getHighestRole = (roles: string[]) => {
    const roleHierarchy = ["Admin", "Manager", "Staff", "User"];
    for (const role of roleHierarchy) {
      if (roles.includes(role)) {
        return role;
      }
    }
    return "User";
  };

  useEffect(() => {
    if (userContext?.user && userContext.user.role) {
      const highestRole = getHighestRole(userContext.user.role);
      router.push(`/home/${highestRole.toLowerCase()}`);
    }
  }, [userContext, router]);

  useEffect(() => {
    const fetchStatistics = async () => {
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

    fetchStatistics();
  }, []);

  // Dữ liệu mẫu cho biểu đồ
  const chartData = {
    monthlyDistribution: [
      { name: 'Jan', value: 65 },
      { name: 'Feb', value: 59 },
      { name: 'Mar', value: 80 },
      { name: 'Apr', value: 81 },
      { name: 'May', value: 56 },
      { name: 'Jun', value: 55 },
      { name: 'Jul', value: 40 },
      { name: 'Aug', value: 70 },
      { name: 'Sep', value: 90 },
      { name: 'Oct', value: 75 },
      { name: 'Nov', value: 60 },
      { name: 'Dec', value: 80 },
    ],
    statusDistribution: [
      { name: 'Đang chờ', value: 400 },
      { name: 'Hoàn thành', value: 300 },
      { name: 'Cần tái khám', value: 200 },
      { name: 'Đã hủy', value: 100 },
    ],
    upcomingEvents: [
      { title: 'Khám sức khỏe định kỳ năm 2023', date: '2023-12-15', location: 'Phòng Y tế - Tòa nhà Alpha', type: 'health-checkup' },
      { title: 'Chiến dịch tiêm vaccine mùa thu', date: '2023-11-20', location: 'Phòng Y tế - Tòa nhà Beta', type: 'vaccination' },
      { title: 'Hội thảo Dinh dưỡng & Sức khỏe', date: '2023-11-25', location: 'Hội trường A', type: 'seminar' },
      { title: 'Khám nha khoa miễn phí', date: '2023-12-01', location: 'Phòng Y tế - Tòa nhà Gamma', type: 'dental' }
    ]
  };

  // Tạo dữ liệu biểu đồ từ statistics nếu có
  const getChartDataFromStatistics = () => {
    if (!statistics) return chartData;

    const data = { ...chartData };
    
    if (statistics.monthlyDistribution) {
      data.monthlyDistribution = statistics.monthlyDistribution.map((item: any) => ({
        name: moment().month(item.month - 1).format('MMM'),
        value: item.count
      }));
    }

    if (statistics.statusDistribution) {
      data.statusDistribution = [
        { name: 'Đang chờ', value: statistics.statusDistribution.waitingForApproval || 0 },
        { name: 'Hoàn thành', value: statistics.statusDistribution.completed || 0 },
        { name: 'Cần tái khám', value: statistics.statusDistribution.followUpRequired || 0 },
        { name: 'Đã hủy', value: (statistics.statusDistribution.cancelledCompletely || 0) + (statistics.statusDistribution.cancelledForAdjustment || 0) }
      ];
    }

    return data;
  };

  const data = getChartDataFromStatistics();

  const getEventTagColor = (type: string) => {
    switch (type) {
      case 'health-checkup': return 'blue';
      case 'vaccination': return 'green';
      case 'seminar': return 'purple';
      case 'dental': return 'cyan';
      default: return 'default';
    }
  };

  const getEventTypeText = (type: string) => {
    switch (type) {
      case 'health-checkup': return 'Khám sức khỏe';
      case 'vaccination': return 'Tiêm vaccine';
      case 'seminar': return 'Hội thảo';
      case 'dental': return 'Nha khoa';
      default: return type;
    }
  };

  const renderUserWelcome = () => {
    return (
      <Card className="mb-6 bg-gradient-to-r from-blue-500 to-blue-700 text-white">
        <Row gutter={[16, 16]} align="middle">
          <Col span={24} md={16}>
            <Title level={3} style={{ color: 'white', margin: 0 }}>
              Xin chào, {userContext?.user?.userName || 'Người dùng'}!
            </Title>
            <Text style={{ color: 'white', opacity: 0.9 }}>
              Chào mừng bạn đến với Hệ thống Chăm sóc Y tế FPT. Chúng tôi luôn sẵn sàng hỗ trợ sức khỏe của bạn mọi lúc.
            </Text>
            <div className="mt-4">
              <Button type="primary" ghost className="mr-4" onClick={() => router.push('/appointment/book')}>
                Đặt lịch khám
              </Button>
              <Button type="default" style={{ background: 'rgba(255, 255, 255, 0.2)', borderColor: 'white', color: 'white' }} 
                onClick={() => router.push('/health-insurance/my-insurance')}>
                Bảo hiểm y tế
              </Button>
            </div>
          </Col>
          <Col span={24} md={8} className="flex justify-end">
            <img src="/images/doctor-illustration.svg" alt="Doctor" className="h-32" />
          </Col>
        </Row>
      </Card>
    );
  };

  const renderQuickStats = () => {
    return (
      <Row gutter={[16, 16]} className="mb-6">
        <Col span={24} md={6}>
          <Card>
            <Statistic 
              title="Lịch khám đang chờ" 
              value={statistics?.statusDistribution?.waitingForApproval || 25} 
              valueStyle={{ color: '#3f8600' }}
              prefix={<CalendarOutlined />} 
              suffix={<ArrowUpOutlined />} 
            />
          </Card>
        </Col>
        <Col span={24} md={6}>
          <Card>
            <Statistic 
              title="Cần tái khám" 
              value={statistics?.followUpStatistics?.totalFollowUps || 18} 
              valueStyle={{ color: '#cf1322' }}
              prefix={<MedicineBoxOutlined />} 
              suffix={<ArrowUpOutlined />} 
            />
          </Card>
        </Col>
        <Col span={24} md={6}>
          <Card>
            <Statistic 
              title="Lịch khám hôm nay" 
              value={statistics?.followUpStatistics?.followUpsToday || 5} 
              valueStyle={{ color: '#1890ff' }}
              prefix={<CalendarOutlined />} 
            />
          </Card>
        </Col>
        <Col span={24} md={6}>
          <Card>
            <Statistic 
              title="Tổng kết quả khám" 
              value={statistics?.totalResults || 287} 
              valueStyle={{ color: '#722ed1' }}
              prefix={<SafetyCertificateOutlined />} 
              suffix={<ArrowUpOutlined />} 
            />
          </Card>
        </Col>
      </Row>
    );
  };

  const renderCharts = () => {
    return (
      <Row gutter={[16, 16]} className="mb-6">
        <Col span={24} md={16}>
          <Card title="Phân bố kết quả khám theo tháng">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.monthlyDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="value" stroke="#8884d8" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={24} md={8}>
          <Card title="Phân bố trạng thái">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {data.statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042'][index % 4]} />
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

  const renderUpcomingEvents = () => {
    return (
      <Card title="Sự kiện sắp tới" className="mb-6">
        <List
          itemLayout="horizontal"
          dataSource={data.upcomingEvents}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                avatar={<Avatar icon={<CalendarOutlined />} style={{ backgroundColor: getEventTagColor(item.type) }} />}
                title={<a href="#">{item.title}</a>}
                description={
                  <div>
                    <Tag color={getEventTagColor(item.type)}>{getEventTypeText(item.type)}</Tag>
                    <span className="ml-2">{moment(item.date).format('DD/MM/YYYY')}</span>
                    <div>{item.location}</div>
                  </div>
                }
              />
              <Button type="primary" size="small">Đăng ký</Button>
            </List.Item>
          )}
        />
      </Card>
    );
  };

  const renderQuickAccess = () => {
    const quickLinks = [
      { title: 'Đặt lịch khám', icon: <CalendarOutlined />, link: '/appointment/book', color: '#1890ff' },
      { title: 'Kết quả khám', icon: <MedicineBoxOutlined />, link: '/health-check-result/management', color: '#52c41a' },
      { title: 'Bảo hiểm y tế', icon: <SafetyCertificateOutlined />, link: '/health-insurance/my-insurance', color: '#722ed1' },
      { title: 'Thông báo', icon: <UserOutlined />, link: '/notification', color: '#fa8c16' },
    ];

    return (
      <Card title="Truy cập nhanh" className="mb-6">
        <Row gutter={[16, 16]}>
          {quickLinks.map((link, index) => (
            <Col span={12} md={6} key={index}>
              <Card 
                hoverable 
                className="text-center" 
                onClick={() => router.push(link.link)}
                style={{ borderTop: `2px solid ${link.color}` }}
              >
                <div style={{ fontSize: '32px', color: link.color }}>{link.icon}</div>
                <div className="mt-2">{link.title}</div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spin size="large" />
        <p className="ml-2">Redirecting to your homepage...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {renderUserWelcome()}
      {renderQuickStats()}
      {renderQuickAccess()}
      {renderCharts()}
      {renderUpcomingEvents()}
      
      <Divider />
      
      <Row className="mt-8 text-center">
        <Col span={24}>
          <Title level={4}>Hệ thống Chăm sóc Y tế FPT</Title>
          <Text type="secondary">Chăm sóc sức khỏe - Bảo vệ cuộc sống</Text>
        </Col>
      </Row>
    </div>
  );
}
