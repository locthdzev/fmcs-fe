import React from 'react';
import { Pagination, InputNumber, Card, Row, Space, Typography } from 'antd';

const { Text } = Typography;

interface PaginationFooterProps {
  /**
   * Current page number
   */
  current: number;
  
  /**
   * Number of items per page
   */
  pageSize: number;
  
  /**
   * Total number of items
   */
  total: number;
  
  /**
   * Function called when page changes
   */
  onChange: (page: number, pageSize?: number) => void;
  
  /**
   * Show page size changer (default: false)
   */
  showSizeChanger?: boolean;
  
  /**
   * Show "Go to page" input (default: true)
   */
  showGoToPage?: boolean;
  
  /**
   * Show total number of items (default: true)
   */
  showTotal?: boolean;
  
  /**
   * Additional CSS class
   */
  className?: string;
}

/**
 * PaginationFooter is a reusable component that provides a consistent pagination UI
 * with current page indicator, page selection, and "Go to page" input.
 */
const PaginationFooter: React.FC<PaginationFooterProps> = ({
  current,
  pageSize,
  total,
  onChange,
  showSizeChanger = false,
  showGoToPage = true,
  showTotal = true,
  className,
}) => {
  // Calculate max page number
  const maxPage = Math.ceil(total / pageSize) || 1;
  
  // Handle direct page input change
  const handlePageInputChange = (value: number | null) => {
    if (value && value > 0 && value <= maxPage) {
      onChange(value, pageSize);
    }
  };
  
  return (
    <Card className={`mt-4 shadow-sm ${className || ''}`}>
      <Row justify="center" align="middle">
        <Space size="large" align="center">
          {showTotal && <Text type="secondary">Total {total} items</Text>}
          
          <Space align="center" size="large">
            <Pagination
              current={current}
              pageSize={pageSize}
              total={total}
              onChange={onChange}
              showSizeChanger={showSizeChanger}
              showTotal={() => ""}
            />
            
            {showGoToPage && (
              <Space align="center">
                <Text type="secondary">Go to page:</Text>
                <InputNumber
                  min={1}
                  max={maxPage}
                  value={current}
                  onChange={handlePageInputChange}
                  style={{ width: "60px" }}
                />
              </Space>
            )}
          </Space>
        </Space>
      </Row>
    </Card>
  );
};

export default PaginationFooter; 