import React from 'react';
import { Alert, Button, Space } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { useSurveyRequired } from '@/context/SurveyRequiredContext';
import { useRouter } from 'next/router';

export const SurveyAlert: React.FC = () => {
  const { hasPendingSurveys, isPendingSurveysLoading } = useSurveyRequired();
  const router = useRouter();

  // If loading or no pending surveys, don't display anything
  if (isPendingSurveysLoading || !hasPendingSurveys) {
    return null;
  }

  return (
    <Alert
      message="Survey Completion Required"
      description="You have pending surveys that need to be completed. These surveys are mandatory and must be completed to continue using all features of the system."
      type="warning"
      showIcon
      icon={<ExclamationCircleOutlined />}
      className="mb-4"
      action={
        <Button 
          size="small" 
          type="primary" 
          onClick={() => router.push('/my-submitted-survey')}
        >
          Complete Now
        </Button>
      }
      closable={false}
    />
  );
}; 