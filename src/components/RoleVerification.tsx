import React, { useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import { UserContext } from '@/context/UserContext';
import { Spin, Result, Button } from 'antd';

interface RoleVerificationProps {
  requiredRole: string;
  children: React.ReactNode;
}

const RoleVerification: React.FC<RoleVerificationProps> = ({ requiredRole, children }) => {
  const router = useRouter();
  const userContext = useContext(UserContext);
  const [loading, setLoading] = React.useState(true);
  const [authorized, setAuthorized] = React.useState(false);

  useEffect(() => {
    if (userContext) {
      setLoading(false);
      const hasRole = userContext.user?.role?.includes(requiredRole);
      setAuthorized(!!hasRole);

      if (!hasRole && !loading) {
        setTimeout(() => {
          router.push('/home');
        }, 2000);
      }
    }
  }, [userContext, requiredRole, router, loading]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spin size="large" />
        <p className="ml-2">Verifying access...</p>
      </div>
    );
  }

  if (!authorized) {
    return (
      <Result
        status="403"
        title="Access Denied"
        subTitle="Sorry, you are not authorized to access this page."
        extra={
          <Button type="primary" onClick={() => router.push('/home')}>
            Go back to home
          </Button>
        }
      />
    );
  }

  return <>{children}</>;
};

export default RoleVerification; 