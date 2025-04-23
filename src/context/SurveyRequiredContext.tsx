import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { getSurveysByUserId, SurveyResponse } from '@/api/survey';
import { UserContext } from './UserContext';

interface SurveyRequiredContextType {
  hasPendingSurveys: boolean;
  isPendingSurveysLoading: boolean;
  checkPendingSurveys: () => Promise<void>;
}

const SurveyRequiredContext = createContext<SurveyRequiredContextType | undefined>(undefined);

export const SurveyRequiredProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [hasPendingSurveys, setHasPendingSurveys] = useState<boolean>(false);
  const [isPendingSurveysLoading, setIsPendingSurveysLoading] = useState<boolean>(false);
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  
  const userContext = useContext(UserContext);

  // Kiểm tra khảo sát pending
  const checkPendingSurveys = async () => {
    // Nếu không có user hoặc không xác thực, không cần kiểm tra
    if (!userContext?.user?.auth || !userContext?.user?.userId) {
      setHasPendingSurveys(false);
      setIsPendingSurveysLoading(false);
      return;
    }

    // Nếu đã kiểm tra trong phiên đăng nhập này rồi và không phải lần đầu, không cần kiểm tra lại
    if (lastChecked === userContext.user.userId) {
      return;
    }

    try {
      setIsPendingSurveysLoading(true);
      console.log('Checking pending surveys for user:', userContext.user.userId);
      
      const response = await getSurveysByUserId(userContext.user.userId, {
        pageSize: 10,
        sortBy: 'surveyDate',
        ascending: false
      });

      if (response.isSuccess && response.data) {
        let pendingSurveys: SurveyResponse[] = [];
        
        if (Array.isArray(response.data)) {
          pendingSurveys = response.data.filter((survey: SurveyResponse) => survey.status === "Pending");
        } 
        else if (response.data.items && Array.isArray(response.data.items)) {
          pendingSurveys = response.data.items.filter((survey: SurveyResponse) => survey.status === "Pending");
        }
        
        console.log(`Found ${pendingSurveys.length} pending surveys`);
        setHasPendingSurveys(pendingSurveys.length > 0);
      } else {
        setHasPendingSurveys(false);
      }
      
      // Đánh dấu đã kiểm tra trong phiên này
      setLastChecked(userContext.user.userId);
      
    } catch (error) {
      console.error('Error checking pending surveys:', error);
      setHasPendingSurveys(false);
    } finally {
      setIsPendingSurveysLoading(false);
    }
  };

  // Reset lastChecked khi user thay đổi - nghĩa là đăng nhập mới
  useEffect(() => {
    if (userContext?.user?.userId) {
      // Nếu userId thay đổi, reset lastChecked để kiểm tra lại
      if (lastChecked !== userContext.user.userId) {
        checkPendingSurveys();
      }
    } else {
      setHasPendingSurveys(false);
    }
  }, [userContext?.user?.userId]);

  return (
    <SurveyRequiredContext.Provider 
      value={{ 
        hasPendingSurveys, 
        isPendingSurveysLoading, 
        checkPendingSurveys
      }}
    >
      {children}
    </SurveyRequiredContext.Provider>
  );
};

export const useSurveyRequired = () => {
  const context = useContext(SurveyRequiredContext);
  if (context === undefined) {
    throw new Error('useSurveyRequired must be used within a SurveyRequiredProvider');
  }
  return context;
}; 