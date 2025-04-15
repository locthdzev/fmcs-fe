import React, { useContext, useEffect, useState } from 'react';
import { UserContext } from '@/context/UserContext';
import { useRouter } from 'next/router';
import { Spin, Card, Typography, Button } from 'antd';
import AdminHomePage from '@/components/home/AdminHomePage';
import ManagerHomePage from '@/components/home/ManagerHomePage';
import HealthcareStaffHomePage from '@/components/home/HealthcareStaffHomePage';
import CanteenStaffHomePage from '@/components/home/CanteenStaffHomePage';
import UserHomePage from '@/components/home/UserHomePage';

const { Title, Text } = Typography;

export default function HomePage() {
  const userContext = useContext(UserContext);
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Giản lược useEffect, chỉ đợi userContext load xong
  useEffect(() => {
    if (userContext?.user !== undefined) {
      setLoading(false);
    }
  }, [userContext?.user]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  // Render appropriate home page based on user role
  const userRole = userContext?.user?.role || [];

  if (userRole.includes('Admin')) {
    return <AdminHomePage />;
  } else if (userRole.includes('Manager')) {
    return <ManagerHomePage />;
  } else if (userRole.includes('Healthcare Staff')) {
    return <HealthcareStaffHomePage />;
  } else if (userRole.includes('Canteen Staff')) {
    return <CanteenStaffHomePage />;
  } else if (userRole.includes('User')) {
    return <UserHomePage />;
  } else {
    // Default home page for other roles
    return (
      <div style={{ padding: '20px' }}>
        <Card style={{ marginBottom: '20px', borderRadius: '8px' }}>
          <Title level={2}>Welcome, {userContext?.user?.userName}!</Title>
          <Text>You are logged in as: {userRole.join(', ')}</Text>
        </Card>
        
        <Card title="Home Page" style={{ borderRadius: '8px' }}>
          <Text>
            This is the default home page. Role-specific home pages are under development.
          </Text>
          <div style={{ marginTop: '20px' }}>
            <Button type="primary" onClick={() => router.push('/dashboard')}>
              Go to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }
}
