import React from 'react';
import { AppstoreOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Typography, Divider, Row, Col, Button } from 'antd';

const { Title } = Typography;

const AppointmentToolbar: React.FC = () => {
  return (
    <>
      <Row align="middle" gutter={[16, 16]}>
        <Col span={24}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => window.history.back()}
              style={{ marginRight: "16px" }}
            >
              Back
            </Button>
            <Title level={4} style={{ margin: 0 }}>
              <AppstoreOutlined
                style={{ marginRight: "8px", fontSize: "20px" }}
              />
              Appointment Management
            </Title>
          </div>
        </Col>
      </Row>

      <Divider style={{ margin: "16px 0" }} />
    </>
  );
};

export default AppointmentToolbar; 