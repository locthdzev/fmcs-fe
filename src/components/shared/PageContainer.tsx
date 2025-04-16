import React from 'react';
import { Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { IconType } from 'antd/es/notification/interface';

interface PageContainerProps {
  title: string;
  icon?: React.ReactNode;
  onBack?: () => void;
  children: React.ReactNode;
  rightContent?: React.ReactNode;
}

const PageContainer: React.FC<PageContainerProps> = ({
  title,
  icon,
  onBack,
  children,
  rightContent
}) => {
  return (
    <div className="history-container" style={{ padding: "20px" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {onBack && (
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={onBack}
              style={{ marginRight: "8px" }}
            >
              Back
            </Button>
          )}
          {icon}
          <h3 className="text-xl font-bold">{title}</h3>
        </div>
        {rightContent && (
          <div className="flex items-center">
            {rightContent}
          </div>
        )}
      </div>

      {/* Content */}
      {children}
    </div>
  );
};

export default PageContainer; 