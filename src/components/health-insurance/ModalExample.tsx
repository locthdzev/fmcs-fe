import React, { useState, useEffect } from 'react';
import { Button, Card, Space, Typography } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import HealthInsuranceEditModal from './HealthInsuranceEditModal';
import { getHealthInsuranceById, HealthInsuranceResponseDTO } from '@/api/healthinsurance';

interface ModalExampleProps {
  insuranceId: string;
}

const ModalExample: React.FC<ModalExampleProps> = ({ insuranceId }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [insurance, setInsurance] = useState<HealthInsuranceResponseDTO | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchInsuranceDetails = async () => {
    if (!insuranceId) return;
    
    setLoading(true);
    try {
      const response = await getHealthInsuranceById(insuranceId);
      if (response.isSuccess) {
        setInsurance(response.data);
      }
    } catch (error) {
      console.error('Error fetching insurance details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsuranceDetails();
  }, [insuranceId]);

  const handleEditSuccess = () => {
    // Refresh the insurance data after successful edit
    fetchInsuranceDetails();
  };

  return (
    <div>
      <Card title="Health Insurance Details" loading={loading}>
        {insurance && (
          <>
            <Typography.Title level={5}>
              {insurance.user.fullName}'s Insurance
            </Typography.Title>
            <Typography.Paragraph>
              Number: {insurance.healthInsuranceNumber || 'N/A'}
            </Typography.Paragraph>
            <Space>
              <Button 
                type="primary" 
                icon={<EditOutlined />}
                onClick={() => setModalVisible(true)}
              >
                Edit Insurance
              </Button>
            </Space>
          </>
        )}
      </Card>

      {insurance && (
        <HealthInsuranceEditModal
          visible={modalVisible}
          insurance={insurance}
          onClose={() => setModalVisible(false)}
          onSuccess={handleEditSuccess}
          isAdmin={true}
        />
      )}
    </div>
  );
};

export default ModalExample; 