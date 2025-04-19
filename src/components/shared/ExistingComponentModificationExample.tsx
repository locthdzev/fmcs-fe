import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Table, Button, Card, message } from 'antd';
import { MedicineBoxOutlined, PlusOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import PageContainer from './PageContainer';

// This is an example showing how to convert an existing component to use PageContainer

// BEFORE MODIFICATION:
const BeforeExample: React.FC = () => {
  const router = useRouter();
  
  const handleBack = () => {
    router.back();
  };

  return (
    <div className="history-container" style={{ padding: "20px" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={handleBack}
            style={{ marginRight: "8px" }}
          >
            Back
          </Button>
          <MedicineBoxOutlined style={{ fontSize: "24px" }} />
          <h3 className="text-xl font-bold">Treatment Plan Management</h3>
        </div>
      </div>
      
      {/* Content */}
      <Card>
        <Table 
          // table props
        />
      </Card>
    </div>
  );
};

// AFTER MODIFICATION:
const AfterExample: React.FC = () => {
  const router = useRouter();
  
  const handleBack = () => {
    router.back();
  };

  return (
    <PageContainer
      title="Treatment Plan Management"
      icon={<MedicineBoxOutlined style={{ fontSize: "24px" }} />}
      onBack={handleBack}
    >
      <Card>
        <Table 
          // table props
        />
      </Card>
    </PageContainer>
  );
};

export { BeforeExample, AfterExample }; 