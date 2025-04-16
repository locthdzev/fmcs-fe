import React, { useState } from 'react';
import { Button, Card, Table, message } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import TableControls, { createDeleteBulkAction, createRestoreBulkAction } from './TableControls';
import PaginationFooter from './PaginationFooter';
import type { BulkAction } from './TableControls';

// Example data interface
interface DataItem {
  key: string;
  name: string;
  age: number;
  address: string;
  status: 'active' | 'deleted' | 'archived';
}

const TableControlsExample: React.FC = () => {
  // Sample data
  const generateData = (): DataItem[] => {
    return Array.from({ length: 100 }, (_, i) => ({
      key: i.toString(),
      name: `User ${i}`,
      age: 20 + (i % 40),
      address: `Street ${100 + i}, City ${i % 5}`,
      status: i % 5 === 0 ? 'deleted' : (i % 7 === 0 ? 'archived' : 'active')
    }));
  };

  // State for the example
  const [data, setData] = useState<DataItem[]>(generateData());
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deletingItems, setDeletingItems] = useState(false);
  const [restoringItems, setRestoringItems] = useState(false);
  const [approvingItems, setApprovingItems] = useState(false);

  // Calculate total items and current page data
  const total = data.length;
  const currentData = data.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Selection states for filtering actions
  const hasDeletedItems = selectedRowKeys.some(key => 
    data.find(item => item.key === key)?.status === 'deleted'
  );
  
  const hasActiveItems = selectedRowKeys.some(key => 
    data.find(item => item.key === key)?.status === 'active'
  );

  // Handlers for bulk actions
  const handleBulkDelete = async () => {
    setDeletingItems(true);
    try {
      // Simulate an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update data
      setData(prev => prev.map(item => 
        selectedRowKeys.includes(item.key) 
          ? { ...item, status: 'deleted' } 
          : item
      ));
      
      message.success(`${selectedRowKeys.length} items deleted`);
      setSelectedRowKeys([]);
    } catch (error) {
      message.error('Failed to delete items');
    } finally {
      setDeletingItems(false);
    }
  };

  const handleBulkRestore = async () => {
    setRestoringItems(true);
    try {
      // Simulate an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update data
      setData(prev => prev.map(item => 
        selectedRowKeys.includes(item.key) && item.status === 'deleted'
          ? { ...item, status: 'active' } 
          : item
      ));
      
      message.success(`${selectedRowKeys.length} items restored`);
      setSelectedRowKeys([]);
    } catch (error) {
      message.error('Failed to restore items');
    } finally {
      setRestoringItems(false);
    }
  };

  const handleBulkApprove = async () => {
    setApprovingItems(true);
    try {
      // Simulate an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      message.success(`${selectedRowKeys.length} items approved`);
      setSelectedRowKeys([]);
    } catch (error) {
      message.error('Failed to approve items');
    } finally {
      setApprovingItems(false);
    }
  };

  // Handle page change
  const handlePageChange = (page: number, newPageSize?: number) => {
    setCurrentPage(page);
    if (newPageSize && newPageSize !== pageSize) {
      setPageSize(newPageSize);
    }
  };

  // Handle page size change
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Custom bulk action
  const customApproveAction: BulkAction = {
    key: 'approve',
    title: 'Approve selected items',
    description: `Are you sure you want to approve ${selectedRowKeys.length} selected item(s)?`,
    icon: <CheckOutlined />,
    buttonText: 'Approve',
    buttonType: 'primary',
    tooltip: 'Approve selected items',
    isVisible: hasActiveItems,
    isLoading: approvingItems,
    onConfirm: handleBulkApprove
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
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors = {
          active: 'green',
          deleted: 'red',
          archived: 'gray'
        };
        return <span style={{ color: colors[status as keyof typeof colors] }}>{status}</span>;
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: DataItem) => (
        <Button 
          type="link" 
          onClick={() => message.info(`Viewing details for ${record.name}`)}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <h2 className="mb-4">TableControls Example</h2>
      
      {/* Using the TableControls component */}
      <TableControls
        selectedRowKeys={selectedRowKeys}
        pageSize={pageSize}
        onPageSizeChange={handlePageSizeChange}
        bulkActions={[
          createDeleteBulkAction(
            selectedRowKeys.length,
            deletingItems,
            handleBulkDelete,
            hasActiveItems // Only show delete for active items
          ),
          createRestoreBulkAction(
            selectedRowKeys.length,
            restoringItems,
            handleBulkRestore,
            hasDeletedItems // Only show restore for deleted items
          ),
          customApproveAction // Custom approve action
        ]}
        maxRowsPerPage={100}
      />
      
      {/* Example table */}
      <Card className="shadow-sm">
        <Table
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          columns={columns}
          dataSource={currentData}
          loading={loading}
          pagination={false}
          rowKey="key"
          bordered
        />
        
        {/* Using PaginationFooter */}
        <PaginationFooter
          current={currentPage}
          pageSize={pageSize}
          total={total}
          onChange={handlePageChange}
          showSizeChanger={true}
        />
      </Card>
      
      <div className="mt-4 p-4 bg-gray-50 rounded">
        <h3>Component Features</h3>
        <ul className="list-disc pl-6 mt-2">
          <li>Shows count of selected items when rows are selected</li>
          <li>Displays bulk actions with confirmation (Delete, Restore, Approve)</li>
          <li>Actions are conditionally shown based on the status of selected items</li>
          <li>Provides rows per page selection (5, 10, 15, 20, 50, 100)</li>
          <li>Works together with PaginationFooter for a complete table UI</li>
        </ul>
      </div>
    </div>
  );
};

export default TableControlsExample; 