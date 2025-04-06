import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function SurveyIndexPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to survey management page
    router.push('/survey/management');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-lg">Đang chuyển hướng...</p>
    </div>
  );
} 