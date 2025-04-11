import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Survey } from '@/components/survey';
import { Spin, Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';

export default function SurveyDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  // Set page loaded after initial render to trigger animations
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoaded(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Display loading when router is initializing
  if (router.isReady === false) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <Spin size="large" />
          <p className="mt-4 text-gray-500">Loading page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`container mx-auto py-8 px-4 max-w-6xl ${isPageLoaded ? 'animate-fadeIn' : 'opacity-0'}`}>
      <div className="mb-6">
        <Button 
          className="flex items-center text-blue-600 hover:text-blue-800 border-none shadow-none bg-white hover:bg-blue-50 transition-standard"
          onClick={() => router.push('/survey/surveyUser')}
          icon={<ArrowLeftOutlined />}
          size="large"
        >
          Back to Survey List
        </Button>
      </div>
      
      <div className={`${isPageLoaded ? 'animate-slideUp' : 'opacity-0'}`} style={{ animationDelay: '100ms' }}>
        {id ? (
          <Survey id={id as string} onSuccess={() => router.push('/survey/surveyUser')} />
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center card-clean">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Survey Not Found</h2>
            <p className="text-gray-600 mb-6">Invalid or non-existent survey ID.</p>
            <Button 
              type="primary" 
              size="large" 
              onClick={() => router.push('/survey/surveyUser')}
              className="hover-lift"
            >
              Go to Survey Page
            </Button>
          </div>
        )}
      </div>
      
      {/* Background decoration */}
      <div className="fixed top-0 right-0 -z-10 opacity-30">
        <svg width="400" height="400" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#3b82f6" strokeWidth="1" strokeDasharray="2 2" className="animate-spin" style={{ animationDuration: '20s' }} />
        </svg>
      </div>
      <div className="fixed bottom-0 left-0 -z-10 opacity-30">
        <svg width="300" height="300" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="30" fill="none" stroke="#34d399" strokeWidth="1" strokeDasharray="3 3" className="animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }} />
        </svg>
      </div>
    </div>
  );
} 