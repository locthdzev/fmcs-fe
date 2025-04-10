import React, { createContext, useState, useEffect, useContext, ReactNode, useRef } from 'react';
import { notification } from 'antd';
import { getSurveysByUserId } from '@/api/survey';
import { UserContext } from './UserContext';
import { useRouter } from 'next/router';

interface SurveyRequiredContextType {
  hasPendingSurveys: boolean;
  isPendingSurveysLoading: boolean;
  checkPendingSurveys: () => Promise<void>;
  redirectToSurveyIfRequired: () => Promise<boolean>;
}

const SurveyRequiredContext = createContext<SurveyRequiredContextType | undefined>(undefined);

// Thời gian tối thiểu giữa các lần kiểm tra (5 giây)
const THROTTLE_TIME = 5000;

export const SurveyRequiredProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [hasPendingSurveys, setHasPendingSurveys] = useState<boolean>(false);
  const [isPendingSurveysLoading, setIsPendingSurveysLoading] = useState<boolean>(true);
  
  // Các biến ref để theo dõi thời gian và ngăn chặn gọi API trùng lặp
  const lastCheckTime = useRef<number>(0);
  const checkInProgress = useRef<boolean>(false);
  const cachedResult = useRef<{
    timestamp: number,
    hasPending: boolean
  } | null>(null);
  
  const userContext = useContext(UserContext);
  const router = useRouter();

  // Danh sách các trang được phép truy cập khi có khảo sát đang chờ
  const allowedRoutes = [
    '/survey/surveyUser',
    '/survey/details/',
    '/auth/login'
  ];

  // Kiểm tra xem người dùng có khảo sát nào đang ở trạng thái pending không
  const checkPendingSurveys = async () => {
    // Nếu không có user hoặc không xác thực, không cần kiểm tra
    if (!userContext?.user?.auth || !userContext?.user?.userId) {
      setHasPendingSurveys(false);
      setIsPendingSurveysLoading(false);
      return;
    }

    // Kiểm tra nếu đang trong quá trình kiểm tra, không thực hiện kiểm tra trùng lặp
    if (checkInProgress.current) {
      console.log('Check already in progress, skipping duplicate call');
      return;
    }

    // Kiểm tra nếu đã kiểm tra gần đây, sử dụng kết quả cache
    const now = Date.now();
    if (now - lastCheckTime.current < THROTTLE_TIME && cachedResult.current) {
      console.log('Using cached survey check result');
      if (cachedResult.current.hasPending !== hasPendingSurveys) {
        setHasPendingSurveys(cachedResult.current.hasPending);
      }
      return;
    }

    try {
      // Đánh dấu đang trong quá trình kiểm tra
      checkInProgress.current = true;
      
      // Chỉ set loading nếu đang chưa loading
      if (!isPendingSurveysLoading) {
        setIsPendingSurveysLoading(true);
      }
      
      const response = await getSurveysByUserId(userContext.user.userId, {
        pageSize: 5,
        sortBy: 'surveyDate',
        ascending: false
      });

      if (response.isSuccess && response.data) {
        // Kiểm tra có khảo sát nào đang pending không
        let pendingSurveys = [];
        
        // Trường hợp 1: data là mảng
        if (Array.isArray(response.data)) {
          pendingSurveys = response.data.filter((survey: { status?: string }) => survey.status === "Pending");
        } 
        // Trường hợp 2: data có cấu trúc {items, totalItems}
        else if (response.data.items && Array.isArray(response.data.items)) {
          pendingSurveys = response.data.items.filter((survey: { status?: string }) => survey.status === "Pending");
        }
        
        // Chỉ cập nhật state nếu giá trị thay đổi
        const hasPending = pendingSurveys.length > 0;
        if (hasPending !== hasPendingSurveys) {
          setHasPendingSurveys(hasPending);
        }
        
        // Cập nhật cache và thời gian kiểm tra cuối cùng
        cachedResult.current = {
          timestamp: now,
          hasPending: hasPending
        };
        lastCheckTime.current = now;
        
        console.log('Pending surveys check complete:', pendingSurveys.length);
      } else {
        // Chỉ cập nhật khi cần thiết
        if (hasPendingSurveys) {
          setHasPendingSurveys(false);
        }
        // Cập nhật cache
        cachedResult.current = {
          timestamp: now,
          hasPending: false
        };
        lastCheckTime.current = now;
      }
    } catch (error) {
      console.error('Error checking pending surveys:', error);
    } finally {
      setIsPendingSurveysLoading(false);
      checkInProgress.current = false;
    }
  };

  // Chuyển hướng đến trang khảo sát nếu cần thiết, trả về true nếu đã chuyển hướng
  const redirectToSurveyIfRequired = async (): Promise<boolean> => {
    if (isPendingSurveysLoading) {
      // Đợi cho lần kiểm tra hiện tại hoàn thành thay vì gọi đệ quy
      await new Promise(resolve => setTimeout(resolve, 500));
      if (isPendingSurveysLoading) return false; // Nếu vẫn loading, trả về false để tránh vòng lặp
    }

    // Kiểm tra chính xác hơn đối với trang được phép
    // Sử dụng pathname để kiểm tra chính xác hơn
    const currentPath = router.asPath || router.pathname;
    
    // Kiểm tra xem đường dẫn hiện tại có thuộc các trang được phép không
    const isAllowedPath = allowedRoutes.some(route => {
      if (currentPath.startsWith(route)) {
        // Cho phép trang chi tiết khảo sát dựa trên URL mẫu
        if (route === '/survey/details/') {
          // Phải có ID khảo sát hợp lệ (kết thúc bằng dạng UUID)
          const uuidRegex = /\/survey\/details\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
          return uuidRegex.test(currentPath);
        }
        return true;
      }
      return false;
    });

    // Nếu đang ở trang được phép, không cần chuyển hướng
    if (isAllowedPath) {
      return false;
    }

    // Sử dụng kết quả cache nếu mới kiểm tra gần đây
    const now = Date.now();
    if (now - lastCheckTime.current < THROTTLE_TIME && cachedResult.current) {
      if (!cachedResult.current.hasPending) {
        return false;
      }
    } else if (!checkInProgress.current) {
      // Kiểm tra lại xem có bất kỳ khảo sát pending nào không nếu chưa kiểm tra gần đây
      // và không có kiểm tra nào đang diễn ra
      try {
        await checkPendingSurveys();
      } catch (error) {
        console.error('Error checking pending surveys during redirect:', error);
      }
    }
    
    // Sau khi kiểm tra lại, nếu có khảo sát đang pending và không ở trang được phép, chuyển hướng
    if (hasPendingSurveys) {
      // Hiển thị thông báo chuyển hướng
      notification.warning({
        message: 'Survey Completion Required',
        description: 'Please complete your pending surveys before accessing other features.',
        duration: 5,
        key: 'survey-redirect',
      });
      
      // Thực hiện chuyển hướng
      router.push('/survey/surveyUser');
      return true;
    }

    return false;
  };

  // Kiểm tra khi context được khởi tạo hoặc khi user thay đổi
  useEffect(() => {
    if (userContext?.user?.userId) {
      checkPendingSurveys();
    }
  }, [userContext?.user?.userId]);

  return (
    <SurveyRequiredContext.Provider 
      value={{ 
        hasPendingSurveys, 
        isPendingSurveysLoading, 
        checkPendingSurveys,
        redirectToSurveyIfRequired
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