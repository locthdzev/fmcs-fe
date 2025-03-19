import React, { useState, useEffect } from "react";
import {
  Card,
  Typography,
  Descriptions,
  Tag,
  Tabs,
  Table,
  Button,
  Space,
  Row,
  Col,
  Divider,
  Skeleton,
  Badge,
  Popconfirm,
  Input,
  message,
  Empty,
  List,
  Timeline,
  Modal,
} from "antd";
import { useRouter } from "next/router";
import {
  getHealthCheckResultById,
  HealthCheckResultsIdResponseDTO,
  HealthCheckResultsDetailDTO,
  exportHealthCheckResultToPDF,
  approveHealthCheckResult,
  completeHealthCheckResult,
  cancelCompletelyHealthCheckResult,
  cancelForAdjustmentHealthCheckResult,
  scheduleFollowUp,
  cancelFollowUp,
  getHealthCheckResultHistoriesByResultId,
  HealthCheckResultHistoryResponseDTO,
} from "@/api/healthcheckresult";
import { toast } from "react-toastify";
import moment from "moment";
import {
  ArrowLeftOutlined,
  FilePdfOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  CloseCircleOutlined,
  HistoryOutlined,
  EditOutlined,
  FileTextOutlined,
  MedicineBoxOutlined,
  CheckSquareOutlined,
  CloseSquareOutlined,
  UserOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;

interface HealthCheckResultDetailProps {
  id: string;
}

export const HealthCheckResultDetail: React.FC<HealthCheckResultDetailProps> = ({ id }) => {
  const router = useRouter();
  const [healthCheckResult, setHealthCheckResult] = useState<HealthCheckResultsIdResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [histories, setHistories] = useState<HealthCheckResultHistoryResponseDTO[]>([]);
  const [historiesLoading, setHistoriesLoading] = useState(false);
  const [followUpDate, setFollowUpDate] = useState<string>("");
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);

  const fetchHealthCheckResult = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await getHealthCheckResultById(id);
      if (response.isSuccess) {
        setHealthCheckResult(response.data);
      } else {
        toast.error(response.message || "Không thể tải thông tin kết quả khám");
      }
    } catch (error) {
      toast.error("Không thể tải thông tin kết quả khám");
    } finally {
      setLoading(false);
    }
  };

  const fetchHistories = async () => {
    if (!id) return;
    setHistoriesLoading(true);
    try {
      const response = await getHealthCheckResultHistoriesByResultId(id);
      if (response.isSuccess) {
        setHistories(response.data);
      } else {
        toast.error(response.message || "Không thể tải lịch sử kết quả khám");
      }
    } catch (error) {
      toast.error("Không thể tải lịch sử kết quả khám");
    } finally {
      setHistoriesLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchHealthCheckResult();
      fetchHistories();
    }
  }, [id]);

  const handleExportPDF = async () => {
    if (!id) return;
    try {
      await exportHealthCheckResultToPDF(id);
      toast.success("Xuất PDF thành công!");
    } catch (error) {
      toast.error("Không thể xuất file PDF");
    }
  };

  const handleApprove = async () => {
    if (!id) return;
    try {
      const response = await approveHealthCheckResult(id);
      if (response.isSuccess) {
        toast.success("Phê duyệt kết quả khám thành công!");
        fetchHealthCheckResult();
        fetchHistories();
      } else {
        toast.error(response.message || "Không thể phê duyệt kết quả khám");
      }
    } catch (error) {
      toast.error("Không thể phê duyệt kết quả khám");
    }
  };

  const handleComplete = async () => {
    if (!id) return;
    try {
      const response = await completeHealthCheckResult(id);
      if (response.isSuccess) {
        toast.success("Hoàn thành kết quả khám thành công!");
        fetchHealthCheckResult();
        fetchHistories();
      } else {
        toast.error(response.message || "Không thể hoàn thành kết quả khám");
      }
    } catch (error) {
      toast.error("Không thể hoàn thành kết quả khám");
    }
  };

  const handleCancel = async (reason: string) => {
    if (!id) return;
    try {
      const response = await cancelCompletelyHealthCheckResult(id, reason);
      if (response.isSuccess) {
        toast.success("Hủy kết quả khám thành công!");
        fetchHealthCheckResult();
        fetchHistories();
      } else {
        toast.error(response.message || "Không thể hủy kết quả khám");
      }
    } catch (error) {
      toast.error("Không thể hủy kết quả khám");
    }
  };

  const handleCancelForAdjustment = async (reason: string) => {
    if (!id) return;
    try {
      const response = await cancelForAdjustmentHealthCheckResult(id, reason);
      if (response.isSuccess) {
        toast.success("Hủy kết quả khám để điều chỉnh thành công!");
        fetchHealthCheckResult();
        fetchHistories();
      } else {
        toast.error(response.message || "Không thể hủy kết quả khám để điều chỉnh");
      }
    } catch (error) {
      toast.error("Không thể hủy kết quả khám để điều chỉnh");
    }
  };

  const handleScheduleFollowUp = async () => {
    if (!id || !followUpDate) return;
    try {
      const dateStr = moment(followUpDate).format("YYYY-MM-DD");
      const response = await scheduleFollowUp(id, dateStr);
      if (response.isSuccess) {
        toast.success("Lên lịch tái khám thành công!");
        setShowFollowUpModal(false);
        fetchHealthCheckResult();
        fetchHistories();
      } else {
        toast.error(response.message || "Không thể lên lịch tái khám");
      }
    } catch (error) {
      toast.error("Không thể lên lịch tái khám");
    }
  };

  const handleCancelFollowUp = async () => {
    if (!id) return;
    try {
      const response = await cancelFollowUp(id);
      if (response.isSuccess) {
        toast.success("Hủy lịch tái khám thành công!");
        fetchHealthCheckResult();
        fetchHistories();
      } else {
        toast.error(response.message || "Không thể hủy lịch tái khám");
      }
    } catch (error) {
      toast.error("Không thể hủy lịch tái khám");
    }
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return '';
    return moment(date).format('DD/MM/YYYY');
  };

  const formatDateTime = (datetime: string | undefined) => {
    if (!datetime) return '';
    return moment(datetime).format('DD/MM/YYYY HH:mm:ss');
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'Completed':
        return 'success';
      case 'Approved':
        return 'processing';
      case 'Pending':
        return 'warning';
      case 'Cancelled':
        return 'error';
      case 'CancelledForAdjustment':
        return 'orange';
      case 'SoftDeleted':
        return 'default';
      default:
        return 'default';
    }
  };

  const renderActionButtons = () => {
    if (!healthCheckResult) return null;

    return (
      <Space wrap>
        {healthCheckResult.status === 'Pending' && (
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={handleApprove}
          >
            Phê duyệt
          </Button>
        )}

        {healthCheckResult.status === 'Approved' && (
          <Button
            type="primary"
            icon={<CheckSquareOutlined />}
            onClick={handleComplete}
          >
            Hoàn thành
          </Button>
        )}

        {(healthCheckResult.status === 'Pending' || healthCheckResult.status === 'Approved') && (
          <Popconfirm
            title="Nhập lý do hủy"
            description={
              <TextArea
                placeholder="Lý do hủy"
                onChange={(e) => {
                  (e.target as any).reason = e.target.value;
                }}
                rows={3}
              />
            }
            onConfirm={(e) => {
              const target = e?.target as any;
              const reason = target?.reason || "Không có lý do";
              handleCancel(reason);
            }}
            okText="Xác nhận"
            cancelText="Hủy"
          >
            <Button danger icon={<CloseCircleOutlined />}>
              Hủy
            </Button>
          </Popconfirm>
        )}

        {(healthCheckResult.status === 'Pending' || healthCheckResult.status === 'Approved') && (
          <Popconfirm
            title="Nhập lý do hủy để điều chỉnh"
            description={
              <TextArea
                placeholder="Lý do hủy để điều chỉnh"
                onChange={(e) => {
                  (e.target as any).reason = e.target.value;
                }}
                rows={3}
              />
            }
            onConfirm={(e) => {
              const target = e?.target as any;
              const reason = target?.reason || "Không có lý do";
              handleCancelForAdjustment(reason);
            }}
            okText="Xác nhận"
            cancelText="Hủy"
          >
            <Button
              style={{ backgroundColor: "#FA8C16", color: "white" }}
              icon={<CloseSquareOutlined />}
            >
              Hủy để điều chỉnh
            </Button>
          </Popconfirm>
        )}

        {(healthCheckResult.status === 'Approved' || healthCheckResult.status === 'Completed') && (
          <>
            {healthCheckResult.followUpRequired && healthCheckResult.followUpDate ? (
              <Button 
                danger 
                icon={<CalendarOutlined />}
                onClick={handleCancelFollowUp}
              >
                Hủy tái khám
              </Button>
            ) : (
              <Button 
                type="default" 
                icon={<CalendarOutlined />}
                onClick={() => setShowFollowUpModal(true)}
              >
                Lên lịch tái khám
              </Button>
            )}
          </>
        )}

        <Button
          type="default"
          icon={<FilePdfOutlined />}
          onClick={handleExportPDF}
        >
          Xuất PDF
        </Button>
      </Space>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <Skeleton active paragraph={{ rows: 10 }} />
        </Card>
      </div>
    );
  }

  if (!healthCheckResult) {
    return (
      <div className="p-6">
        <Card>
          <Empty description="Không tìm thấy kết quả khám" />
          <div className="text-center mt-4">
            <Button 
              type="primary" 
              icon={<ArrowLeftOutlined />}
              onClick={() => router.push('/health-check-result/management')}
            >
              Quay lại
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card className="mb-4">
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Space align="center">
              <Button 
                icon={<ArrowLeftOutlined />} 
                onClick={() => router.push('/health-check-result/management')}
              >
                Quay lại
              </Button>
              <Title level={4} style={{ margin: 0 }}>
                Chi tiết kết quả khám
              </Title>
              <Tag color={getStatusColor(healthCheckResult.status)} className="ml-2">
                {healthCheckResult.status}
              </Tag>
            </Space>
          </Col>
          <Col span={24}>
            <Divider />
          </Col>
          <Col xs={24} md={12}>
            <Descriptions title="Thông tin bệnh nhân" bordered column={1} size="small">
              <Descriptions.Item label="Họ tên">
                {healthCheckResult.user.fullName}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {healthCheckResult.user.email}
              </Descriptions.Item>
              <Descriptions.Item label="Giới tính">
                {healthCheckResult.user.gender || "Không có thông tin"}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày sinh">
                {healthCheckResult.user.dob ? formatDate(healthCheckResult.user.dob) : "Không có thông tin"}
              </Descriptions.Item>
              <Descriptions.Item label="Địa chỉ">
                {healthCheckResult.user.address || "Không có thông tin"}
              </Descriptions.Item>
              <Descriptions.Item label="Điện thoại">
                {healthCheckResult.user.phone || "Không có thông tin"}
              </Descriptions.Item>
            </Descriptions>
          </Col>
          <Col xs={24} md={12}>
            <Descriptions title="Thông tin khám" bordered column={1} size="small">
              <Descriptions.Item label="Ngày khám">
                {formatDate(healthCheckResult.checkupDate)}
              </Descriptions.Item>
              <Descriptions.Item label="Bác sĩ/Y tá phụ trách">
                {healthCheckResult.staff.fullName}
              </Descriptions.Item>
              <Descriptions.Item label="Tái khám">
                {healthCheckResult.followUpRequired ? (
                  <Space>
                    <Badge status="processing" text="Yêu cầu tái khám" />
                    {healthCheckResult.followUpDate
                      ? formatDate(healthCheckResult.followUpDate)
                      : "Chưa lên lịch"}
                  </Space>
                ) : (
                  <Badge status="default" text="Không yêu cầu tái khám" />
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">
                {formatDateTime(healthCheckResult.createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label="Cập nhật lần cuối">
                {healthCheckResult.updatedAt
                  ? formatDateTime(healthCheckResult.updatedAt)
                  : "Chưa cập nhật"}
              </Descriptions.Item>
              <Descriptions.Item label="Người cập nhật">
                {healthCheckResult.updatedByUser
                  ? healthCheckResult.updatedByUser.fullName
                  : "Không có thông tin"}
              </Descriptions.Item>
            </Descriptions>
          </Col>
          <Col span={24}>
            <Divider />
            <div className="flex justify-end">{renderActionButtons()}</div>
          </Col>
        </Row>
      </Card>

      <Tabs defaultActiveKey="details" type="card">
        <TabPane
          tab={
            <span>
              <FileTextOutlined /> Chi tiết kết quả khám
            </span>
          }
          key="details"
        >
          <Card>
            {healthCheckResult.healthCheckResultDetails.length > 0 ? (
              healthCheckResult.healthCheckResultDetails.map((detail, index) => (
                <div key={detail.id} className="mb-4">
                  <Title level={5}>Chi tiết #{index + 1}</Title>
                  <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small">
                    <Descriptions.Item label="Tóm tắt kết quả" span={2}>
                      {detail.resultSummary}
                    </Descriptions.Item>
                    <Descriptions.Item label="Chẩn đoán" span={2}>
                      {detail.diagnosis}
                    </Descriptions.Item>
                    <Descriptions.Item label="Khuyến nghị" span={2}>
                      {detail.recommendations}
                    </Descriptions.Item>
                    <Descriptions.Item label="Trạng thái">
                      <Tag color={getStatusColor(detail.status)}>{detail.status}</Tag>
                    </Descriptions.Item>
                  </Descriptions>
                  {index < healthCheckResult.healthCheckResultDetails.length - 1 && (
                    <Divider />
                  )}
                </div>
              ))
            ) : (
              <Empty description="Không có chi tiết kết quả khám" />
            )}
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <MedicineBoxOutlined /> Đơn thuốc
            </span>
          }
          key="prescriptions"
        >
          <Card>
            {healthCheckResult.prescriptions?.length > 0 ? (
              <List
                itemLayout="horizontal"
                dataSource={healthCheckResult.prescriptions}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Button
                        key="view"
                        type="link"
                        onClick={() => message.info("Chức năng chưa được triển khai")}
                      >
                        Xem chi tiết
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<MedicineBoxOutlined style={{ fontSize: 24 }} />}
                      title={`Đơn thuốc ngày ${formatDate(item.prescriptionDate)}`}
                      description={
                        <Space direction="vertical">
                          <Text>Số lượng thuốc: {item.totalMedicines}</Text>
                          <Tag color={getStatusColor(item.status)}>{item.status}</Tag>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="Không có đơn thuốc" />
            )}
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <ClockCircleOutlined /> Kế hoạch điều trị
            </span>
          }
          key="treatments"
        >
          <Card>
            {healthCheckResult.treatmentPlans?.length > 0 ? (
              <List
                itemLayout="horizontal"
                dataSource={healthCheckResult.treatmentPlans}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Button
                        key="view"
                        type="link"
                        onClick={() => message.info("Chức năng chưa được triển khai")}
                      >
                        Xem chi tiết
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<ClockCircleOutlined style={{ fontSize: 24 }} />}
                      title={`Kế hoạch từ ${formatDate(item.startDate)} đến ${formatDate(item.endDate)}`}
                      description={
                        <Space direction="vertical">
                          <Text>{item.treatmentDescription}</Text>
                          <Space>
                            <Tag color={getStatusColor(item.status)}>
                              {item.status}
                            </Tag>
                            <Text type="secondary">
                              {item.daysRemaining > 0
                                ? `Còn ${item.daysRemaining} ngày`
                                : "Đã kết thúc"}
                            </Text>
                          </Space>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="Không có kế hoạch điều trị" />
            )}
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <HistoryOutlined /> Lịch sử
            </span>
          }
          key="history"
        >
          <Card>
            {historiesLoading ? (
              <Skeleton active paragraph={{ rows: 6 }} />
            ) : histories.length > 0 ? (
              <Timeline mode="left">
                {histories.map((history) => (
                  <Timeline.Item
                    key={history.id}
                    label={formatDateTime(history.actionDate)}
                    color={
                      history.action.includes("Created")
                        ? "green"
                        : history.action.includes("Updated") ||
                          history.action.includes("Approved")
                        ? "blue"
                        : history.action.includes("Cancelled") ||
                          history.action.includes("Rejected")
                        ? "red"
                        : "gray"
                    }
                  >
                    <div>
                      <Text strong>{history.action}</Text>
                      <div>
                        <Text type="secondary">
                          Người thực hiện: {history.performedBy?.fullName || "N/A"}
                        </Text>
                      </div>
                      {history.previousStatus && history.newStatus && (
                        <div>
                          <Text type="secondary">
                            Trạng thái: {history.previousStatus} =&gt; {history.newStatus}
                          </Text>
                        </div>
                      )}
                      {history.rejectionReason && (
                        <div>
                          <Text type="secondary">
                            Lý do từ chối: {history.rejectionReason}
                          </Text>
                        </div>
                      )}
                      {history.changeDetails && (
                        <div>
                          <Text type="secondary">
                            Chi tiết thay đổi: {history.changeDetails}
                          </Text>
                        </div>
                      )}
                    </div>
                  </Timeline.Item>
                ))}
              </Timeline>
            ) : (
              <Empty description="Không có lịch sử" />
            )}
          </Card>
        </TabPane>
      </Tabs>

      <Modal
        title="Lên lịch tái khám"
        open={showFollowUpModal}
        onCancel={() => setShowFollowUpModal(false)}
        onOk={handleScheduleFollowUp}
        okText="Xác nhận"
        cancelText="Hủy"
      >
        <div className="mt-4">
          <Input
            type="date"
            value={followUpDate}
            onChange={(e) => setFollowUpDate(e.target.value)}
            min={moment().format("YYYY-MM-DD")}
          />
        </div>
      </Modal>
    </div>
  );
}; 