import React from 'react';
import { Button, Card, Table } from 'antd';
import { MedicineBoxOutlined, PlusOutlined } from '@ant-design/icons';
import PageContainer from './PageContainer';
import { useRouter } from 'next/router';

const PageContainerExample: React.FC = () => {
  const router = useRouter();
  
  // Example function for back button
  const handleBack = () => {
    router.back();
  };
  
  // Example data for table
  const dataSource = [
    {
      key: '1',
      name: 'John Doe',
      age: 32,
      address: 'New York',
    },
    {
      key: '2',
      name: 'Jane Smith',
      age: 42,
      address: 'London',
    },
  ];
  
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Age',
      dataIndex: 'age',
      key: 'age',
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
    },
  ];
  
  // Example right content with add button
  const rightContent = (
    <Button type="primary" icon={<PlusOutlined />}>
      Add New
    </Button>
  );
  
  return (
    <PageContainer 
      title="Example Page Title"
      icon={<MedicineBoxOutlined style={{ fontSize: "24px" }} />}
      onBack={handleBack}
      rightContent={rightContent}
    >
      <Card>
        <Table dataSource={dataSource} columns={columns} />
      </Card>
    </PageContainer>
  );
};

export default PageContainerExample; 