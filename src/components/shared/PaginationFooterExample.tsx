import React, { useState } from 'react';
import { Card, Table, Select, Space, Typography } from 'antd';
import PaginationFooter from './PaginationFooter';

const { Text } = Typography;
const { Option } = Select;

interface DataItem {
  key: string;
  name: string;
  age: number;
  address: string;
}

const PaginationFooterExample: React.FC = () => {
  // Example pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  
  // Mock data
  const totalItems = 85;
  
  // Generate sample data
  const generateData = (page: number, size: number): DataItem[] => {
    const startIndex = (page - 1) * size;
    const endIndex = Math.min(startIndex + size, totalItems);
    
    return Array.from({ length: endIndex - startIndex }, (_, i) => {
      const index = startIndex + i;
      return {
        key: `item-${index}`,
        name: `Person ${index + 1}`,
        age: 20 + (index % 40),
        address: `Street ${100 + index}, City ${index % 5 + 1}`,
      };
    });
  };
  
  // Sample data for current page
  const data = generateData(currentPage, pageSize);
  
  // Handle page change
  const handlePageChange = (page: number, newPageSize?: number) => {
    console.log(`Page changed to ${page}, page size: ${newPageSize || pageSize}`);
    setCurrentPage(page);
    if (newPageSize && newPageSize !== pageSize) {
      setPageSize(newPageSize);
    }
  };
  
  // Table columns
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
  
  // Handle page size change
  const handlePageSizeChange = (value: number) => {
    setPageSize(value);
    setCurrentPage(1); // Reset to first page when changing page size
  };
  
  return (
    <div style={{ padding: '20px' }}>
      <Card className="shadow mb-4">
        <div className="flex justify-between items-center mb-4">
          <h2>Data Table with Pagination</h2>
          
          <Space align="center">
            <Text type="secondary">Rows per page:</Text>
            <Select
              value={pageSize}
              onChange={handlePageSizeChange}
              style={{ width: 80 }}
            >
              <Option value={5}>5</Option>
              <Option value={10}>10</Option>
              <Option value={15}>15</Option>
              <Option value={20}>20</Option>
            </Select>
          </Space>
        </div>
        
        <Table
          columns={columns}
          dataSource={data}
          pagination={false}
          bordered
        />
        
        {/* Using our PaginationFooter component */}
        <PaginationFooter
          current={currentPage}
          pageSize={pageSize}
          total={totalItems}
          onChange={handlePageChange}
          showSizeChanger={false}
          showGoToPage={true}
          showTotal={true}
        />
      </Card>
      
      {/* Variation with size changer */}
      <Card className="shadow mb-4">
        <h3 className="mb-4">Alternative Pagination with Size Changer</h3>
        <PaginationFooter
          current={currentPage}
          pageSize={pageSize}
          total={totalItems}
          onChange={handlePageChange}
          showSizeChanger={true}
          className="mb-0"
        />
      </Card>
      
      {/* Minimal variation */}
      <Card className="shadow">
        <h3 className="mb-4">Minimal Pagination (without "Go to page")</h3>
        <PaginationFooter
          current={currentPage}
          pageSize={pageSize}
          total={totalItems}
          onChange={handlePageChange}
          showGoToPage={false}
          showTotal={false}
          className="mb-0"
        />
      </Card>
    </div>
  );
};

export default PaginationFooterExample; 