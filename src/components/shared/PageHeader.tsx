import { Typography } from 'antd';
import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle }) => {
  return (
    <div className="mb-6">
      <Typography.Title level={2} className="text-2xl font-bold text-gray-800">
        {title}
      </Typography.Title>
      {subtitle && (
        <Typography.Text className="text-gray-600">
          {subtitle}
        </Typography.Text>
      )}
    </div>
  );
}; 