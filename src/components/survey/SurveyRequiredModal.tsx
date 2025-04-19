import React, { useState, useEffect, useContext } from 'react';
import { Modal, Typography, Spin, notification, Button } from 'antd';
import { ExclamationCircleOutlined, LockOutlined } from '@ant-design/icons';
import { useSurveyRequired } from '@/context/SurveyRequiredContext';
import { UserContext } from '@/context/UserContext';
import { getSurveysByUserId, SurveyResponse } from '@/api/survey';
import { Survey } from './my-survey';

const { Title, Text } = Typography;

interface SurveyRequiredModalProps {
  onSuccess?: () => void;
}

export const SurveyRequiredModal: React.FC<SurveyRequiredModalProps> = ({ onSuccess }) => {
  const [visible, setVisible] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [pendingSurveys, setPendingSurveys] = useState<SurveyResponse[]>([]);
  const [currentSurveyIndex, setCurrentSurveyIndex] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  
  const { hasPendingSurveys, checkPendingSurveys } = useSurveyRequired();
  const userContext = useContext(UserContext);
  
  // Lấy danh sách surveys đang pending khi có thông báo pendingSurveys
  useEffect(() => {
    if (hasPendingSurveys && userContext?.user?.userId) {
      fetchPendingSurveys();
    } else {
      setVisible(false);
    }
  }, [hasPendingSurveys, userContext?.user?.userId]);
  
  // Lấy danh sách surveys đang pending
  const fetchPendingSurveys = async () => {
    if (!userContext?.user?.userId) return;
    
    try {
      setLoading(true);
      
      const response = await getSurveysByUserId(userContext.user.userId, {
        pageSize: 100, // Lấy số lượng lớn để đảm bảo tất cả pending surveys
        sortBy: 'surveyDate',
        ascending: false
      });

      let pendingSurveysList: SurveyResponse[] = [];
      
      if (response.isSuccess && response.data) {
        // Xử lý cả hai trường hợp API trả về
        if (Array.isArray(response.data)) {
          pendingSurveysList = response.data.filter((survey: SurveyResponse) => survey.status === "Pending");
        } else if (response.data.items && Array.isArray(response.data.items)) {
          pendingSurveysList = response.data.items.filter((survey: SurveyResponse) => survey.status === "Pending");
        }
        
        setPendingSurveys(pendingSurveysList);
        
        // Hiển thị modal nếu có pending surveys
        if (pendingSurveysList.length > 0) {
          setVisible(true);
          setCurrentSurveyIndex(0); // Reset về survey đầu tiên
        } else {
          setVisible(false);
        }
      }
    } catch (error) {
      console.error('Error fetching pending surveys:', error);
      setError('Failed to load surveys. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Khi submit thành công một survey
  const handleSurveySuccess = async () => {
    // Nếu còn survey khác, chuyển sang survey tiếp theo
    if (currentSurveyIndex < pendingSurveys.length - 1) {
      setCurrentSurveyIndex(prev => prev + 1);
    } else {
      // Đã hoàn thành tất cả surveys
      setVisible(false);
      notification.success({
        message: 'Surveys Completed',
        description: 'Thank you for completing all pending surveys!',
        duration: 5
      });
      
      // Cập nhật lại trạng thái sau khi hoàn thành
      await checkPendingSurveys();
      
      // Nếu có callback onSuccess, gọi nó
      if (onSuccess) onSuccess();
    }
  };

  // Hiện thị số lượng surveys còn lại
  const getModalTitle = () => {
    return (
      <div className="flex items-center space-x-2">
        <LockOutlined className="text-yellow-500" />
        <span>Survey Required ({currentSurveyIndex + 1}/{pendingSurveys.length})</span>
      </div>
    );
  };

  const currentSurvey = pendingSurveys[currentSurveyIndex];

  return (
    <Modal
      title={getModalTitle()}
      open={visible}
      closable={false}
      maskClosable={false}  // Không cho phép đóng khi click bên ngoài
      keyboard={false}      // Không cho phép đóng bằng ESC
      width={800}
      footer={null}         // Không hiển thị footer mặc định
    >
      {loading ? (
        <div className="py-10 text-center">
          <Spin size="large" />
          <p className="mt-3">Loading survey data...</p>
        </div>
      ) : error ? (
        <div className="py-10 text-center">
          <ExclamationCircleOutlined className="text-red-500 text-2xl" />
          <p className="mt-3 text-red-500">{error}</p>
          <Button 
            className="mt-4" 
            type="primary" 
            onClick={fetchPendingSurveys}
          >
            Retry
          </Button>
        </div>
      ) : currentSurvey ? (
        <div className="survey-required-container">
          <div className="mb-4 bg-blue-50 p-3 rounded-md">
            <Text strong>
              You have pending surveys that require completion. You must complete this survey to continue using the system.
            </Text>
          </div>
          
          <Survey 
            id={currentSurvey.id} 
            onSuccess={handleSurveySuccess}
          />
        </div>
      ) : (
        <div className="py-10 text-center">
          <p>No pending surveys found.</p>
          <Button 
            className="mt-4" 
            type="primary" 
            onClick={() => setVisible(false)}
          >
            Close
          </Button>
        </div>
      )}
    </Modal>
  );
}; 