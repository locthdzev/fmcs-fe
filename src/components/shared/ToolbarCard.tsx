import React from 'react';
import { Card, Row, Col, Typography, Divider } from 'antd';
import { AppstoreOutlined } from '@ant-design/icons';

const { Title } = Typography;

interface ToolbarCardProps {
  /** Left side content for filters and search controls */
  leftContent: React.ReactNode;
  /** Right side content for action buttons */
  rightContent?: React.ReactNode;
  /** Custom toolbar title */
  title?: string;
  /** Custom toolbar icon */
  icon?: React.ReactNode;
  /** Additional class names */
  className?: string;
}

const ToolbarCard: React.FC<ToolbarCardProps> = ({
  leftContent,
  rightContent,
  title = 'Toolbar',
  icon = <AppstoreOutlined style={{ marginRight: "8px", fontSize: "20px" }} />,
  className = '',
}) => {
  return (
    <Card
      className={`shadow mb-4 ${className}`}
      bodyStyle={{ padding: "16px" }}
      style={{ borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
    >
      <Row align="middle" gutter={[16, 16]}>
        <Col span={24}>
          <Title level={4} style={{ margin: 0 }}>
            {icon}
            {title}
          </Title>
        </Col>
      </Row>

      <Divider style={{ margin: "16px 0" }} />

      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {leftContent}
        </div>

        {rightContent && (
          <div>
            {rightContent}
          </div>
        )}
      </div>
    </Card>
  );
};

export default ToolbarCard; 