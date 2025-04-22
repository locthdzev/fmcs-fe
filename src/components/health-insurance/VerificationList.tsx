import React, { useState, useEffect } from "react";
import { List, Card, Button, Avatar, Tag, Skeleton, Typography, Space, Row, Col, Empty, message } from "antd";
import { UserOutlined, CheckCircleOutlined, CloseCircleOutlined, EyeOutlined, RightOutlined } from "@ant-design/icons";
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
  const [messageApi, contextHolder] = message.useMessage();
  
  // Debug log
  useEffect(() => {
    console.log("VerificationList received updateRequests:", updateRequests);
  }, [updateRequests]);

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "-";
    return dayjs(dateStr).format("DD/MM/YYYY");
  };

  const formatDateTime = (dateStr: string | undefined) => {
    if (!dateStr) return "-";
    return dayjs(dateStr).format("DD/MM/YYYY HH:mm:ss");
  };

  const handleViewDetails = (request: UpdateRequestDTO) => {
    console.log("Selected request for verification:", request);
    setSelectedRequest(request);
    setModalVisible(true);
  };

  const onModalClose = () => {
    setModalVisible(false);
    setSelectedRequest(null);
  };

  const onVerificationSuccess = () => {
    setTimeout(() => {
      setModalVisible(false);
      setSelectedRequest(null);
      refreshData();
    }, 1000);
  };

  if (updateRequests.length === 0 && !loading) {
    return (
      <Empty 
        description="No verification requests found" 
        image={Empty.PRESENTED_IMAGE_SIMPLE} 
      />
    );
  }

  return (
    <>
      {contextHolder}
      <List
        grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 3, xxl: 4 }}
        dataSource={updateRequests}
        loading={loading}
        locale={{ emptyText: "No verification requests found" }}
        renderItem={(request) => (
          <List.Item>
            <Card
              hoverable
              className="verification-card"
              onClick={() => handleViewDetails(request)}
              actions={[
                <RightOutlined key="arrow" style={{ fontSize: '16px', color: '#1890ff' }} />,
              ]}
              extra={<Tag color="processing">Verification Needed</Tag>}
            >
              <Skeleton loading={loading} active avatar>
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Avatar size="large" icon={<UserOutlined />} />
                        <div className="ml-2">
                          <Title level={5} className="mb-0">
                            {request.requestedBy?.userName || "Unknown User"}
                          </Title>
                          <Text type="secondary">{request.requestedBy?.email || ""}</Text>
                        </div>
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
