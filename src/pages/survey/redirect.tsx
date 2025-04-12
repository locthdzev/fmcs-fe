import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function SurveyRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to survey user page
    router.push('/survey/surveyUser');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-lg">Đang chuyển hướng...</p>
    </div>
  );
} 