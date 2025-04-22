import React from 'react';
import { useRouter } from 'next/router';
import CheckupDetailStaff from '@/components/periodic-health-checkup/CheckupDetailStaff';

const StaffHealthCheckupDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;

  return (
    <div>
      {id && typeof id === 'string' ? (
        <CheckupDetailStaff id={id} />
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
};

export default StaffHealthCheckupDetailPage; 