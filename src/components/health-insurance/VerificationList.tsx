import React, { useState } from "react";
import { List, Card, Button, Avatar, Tag, Skeleton, Typography, Space, Row, Col } from "antd";
import { UserOutlined, CheckCircleOutlined, CloseCircleOutlined, EyeOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

import VerificationModal from "./VerificationModal";
import { UpdateRequestDTO } from "@/api/healthinsurance";

const { Text, Title } = Typography;

interface VerificationListProps {
  loading: boolean;
  updateRequests: UpdateRequestDTO[];
  refreshData: () => void;
}

const VerificationList: React.FC<VerificationListProps> = ({
  loading,
  updateRequests,
  refreshData,
}) => {
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedRequest, setSelectedRequest] = useState<UpdateRequestDTO | null>(null);

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "-";
    return dayjs(dateStr).format("DD/MM/YYYY");
  };

  const formatDateTime = (dateStr: string | undefined) => {
    if (!dateStr) return "-";
    return dayjs(dateStr).format("DD/MM/YYYY HH:mm:ss");
  };

  const handleViewDetails = (request: UpdateRequestDTO) => {
    setSelectedRequest(request);
    setModalVisible(true);
  };

  const onModalClose = () => {
    setModalVisible(false);
    setSelectedRequest(null);
  };

  const onVerificationSuccess = () => {
    setModalVisible(false);
    setSelectedRequest(null);
    refreshData();
  };

  return (
    <>
      <List
        grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 3, xxl: 4 }}
        dataSource={updateRequests}
        loading={loading}
        renderItem={(request) => (
          <List.Item>
            <Card
              hoverable
              className="verification-card"
              actions={[
                <Button 
                  key="view" 
                  type="primary" 
                  icon={<EyeOutlined />} 
                  onClick={() => handleViewDetails(request)}
                >
                  View Details
                </Button>,
              ]}
            >
              <Skeleton loading={loading} active avatar>
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <div className="flex items-center">
                      <Avatar size="large" icon={<UserOutlined />} />
                      <div className="ml-2">
                        <Title level={5} className="mb-0">
                          {request.requestedBy?.userName || "Unknown User"}
                        </Title>
                        <Text type="secondary">{request.requestedBy?.email || ""}</Text>
                      </div>
                    </div>
                  </Col>

                  <Col span={24}>
                    <Text strong>Request Information:</Text>
                    <div className="mt-2">
                      <Space direction="vertical" size="small">
                        <Text>
                          Insurance Number: <Text strong>{request.healthInsuranceNumber || "N/A"}</Text>
                        </Text>
                        <Text>
                          Full Name: <Text strong>{request.fullName || "N/A"}</Text>
                        </Text>
                        <Text>
                          Status: <Tag color="processing">Verification</Tag>
                        </Text>
                        <Text>
                          Requested At: <Text strong>{formatDateTime(request.requestedAt)}</Text>
                        </Text>
                      </Space>
                    </div>
                  </Col>
                </Row>
              </Skeleton>
            </Card>
          </List.Item>
        )}
      />

      {selectedRequest && (
        <VerificationModal
          visible={modalVisible}
          request={selectedRequest}
          onClose={onModalClose}
          onSuccess={onVerificationSuccess}
        />
      )}
    </>
  );
};

export default VerificationList;
