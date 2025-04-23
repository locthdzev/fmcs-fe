import React from 'react';
import { AppstoreOutlined } from '@ant-design/icons';
import { Typography, Divider, Row, Col } from 'antd';

const { Title } = Typography;

const DrugGroupToolbar: React.FC = () => {
  return (
    <>
      <Row align="middle" gutter={[16, 16]}>
        <Col span={24}>
          <Title level={4} style={{ margin: 0 }}>
            <AppstoreOutlined
              style={{ marginRight: "8px", fontSize: "20px" }}
            />
            Toolbar
          </Title>
        </Col>
      </Row>

      <Divider style={{ margin: "16px 0" }} />
    </>
  );
};

export default DrugGroupToolbar; 