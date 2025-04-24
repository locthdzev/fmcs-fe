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
  exportHealthCheckResultHistoriesByResultIdToExcel,
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
  FormOutlined,
  FileTextOutlined,
  MedicineBoxOutlined,
  CheckSquareOutlined,
  CloseSquareOutlined,
  UserOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;

interface HealthCheckResultDetailProps {
  id: string;
}

export const HealthCheckResultDetail: React.FC<
  HealthCheckResultDetailProps
> = ({ id }) => {
  const router = useRouter();
  const [healthCheckResult, setHealthCheckResult] =
    useState<HealthCheckResultsIdResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [histories, setHistories] = useState<
    HealthCheckResultHistoryResponseDTO[]
  >([]);
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
        toast.error(
          response.message || "Unable to load health check result information"
        );
      }
    } catch (error) {
      toast.error("Unable to load health check result information");
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
        setHistories(response.data || []);
      } else {
        console.error("Failed to fetch histories:", response.message);
        setHistories([]);
      }
    } catch (error) {
      console.error("Unable to load health check result history:", error);
      setHistories([]);
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
      toast.success("PDF export successful!");
    } catch (error) {
      toast.error("Unable to export PDF file");
    }
  };

  const handleApprove = async () => {
    if (!id) return;
    try {
      const response = await approveHealthCheckResult(id);
      if (response.isSuccess) {
        toast.success("Health check result approved successfully!");
        fetchHealthCheckResult();
        fetchHistories();
      } else {
        toast.error(
          response.message || "Unable to approve health check result"
        );
      }
    } catch (error) {
      toast.error("Unable to approve health check result");
    }
  };

  const handleComplete = async () => {
    if (!id) return;
    try {
      const response = await completeHealthCheckResult(id);
      if (response.isSuccess) {
        toast.success("Health check result completed successfully!");
        fetchHealthCheckResult();
        fetchHistories();
      } else {
        toast.error(
          response.message || "Unable to complete health check result"
        );
      }
    } catch (error) {
      toast.error("Unable to complete health check result");
    }
  };

  const handleCancel = async (reason: string) => {
    if (!id) return;
    try {
      const response = await cancelCompletelyHealthCheckResult(id, reason);
      if (response.isSuccess) {
        toast.success("Health check result cancelled successfully!");
        fetchHealthCheckResult();
        fetchHistories();
      } else {
        toast.error(response.message || "Unable to cancel health check result");
      }
    } catch (error) {
      toast.error("Unable to cancel health check result");
    }
  };

  const handleCancelForAdjustment = async (reason: string) => {
    if (!id) return;
    try {
      const response = await cancelForAdjustmentHealthCheckResult(id, reason);
      if (response.isSuccess) {
        toast.success(
          "Health check result cancelled for adjustment successfully!"
        );
        fetchHealthCheckResult();
        fetchHistories();
      } else {
        toast.error(
          response.message ||
            "Unable to cancel health check result for adjustment"
        );
      }
    } catch (error) {
      toast.error("Unable to cancel health check result for adjustment");
    }
  };

  const handleScheduleFollowUp = async () => {
    if (!id || !followUpDate) return;
    try {
      const dateStr = moment(followUpDate).format("YYYY-MM-DD");
      const response = await scheduleFollowUp(id, dateStr);
      if (response.isSuccess) {
        toast.success("Follow-up scheduled successfully!");
        setShowFollowUpModal(false);
        fetchHealthCheckResult();
        fetchHistories();
      } else {
        toast.error(response.message || "Unable to schedule follow-up");
      }
    } catch (error) {
      toast.error("Unable to schedule follow-up");
    }
  };

  const handleCancelFollowUp = async () => {
    if (!id) return;
    try {
      const response = await cancelFollowUp(id);
      if (response.isSuccess) {
        toast.success("Follow-up cancelled successfully!");
        fetchHealthCheckResult();
        fetchHistories();
      } else {
        toast.error(response.message || "Unable to cancel follow-up");
      }
    } catch (error) {
      toast.error("Unable to cancel follow-up");
    }
  };

  const handleExportHistoryToExcel = async () => {
    if (!id) return;
    try {
      await exportHealthCheckResultHistoriesByResultIdToExcel(id);
      toast.success(
        "Health check result history exported to Excel successfully!"
      );
    } catch (error) {
      toast.error("Unable to export history to Excel file");
    }
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return "";
    return moment(date).format("DD/MM/YYYY");
  };

  const formatDateTime = (datetime: string | undefined) => {
    if (!datetime) return "";
    return moment(datetime).format("DD/MM/YYYY HH:mm:ss");
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case "Completed":
        return "success";
      case "Approved":
        return "processing";
      case "Pending":
        return "warning";
      case "Cancelled":
        return "error";
      case "CancelledForAdjustment":
        return "orange";
      case "SoftDeleted":
        return "default";
      default:
        return "default";
    }
  };

  const getActionColor = (action: string): string => {
    if (action.includes("Created")) return "green";
    if (action.includes("Updated") || action.includes("Approved"))
      return "blue";
    if (action.includes("Cancelled") || action.includes("Rejected"))
      return "red";
    return "gray";
  };

  const renderActionButtons = () => {
    if (!healthCheckResult) return null;

    return (
      <Space wrap>
        {healthCheckResult.status === "Pending" && (
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={handleApprove}
          >
            Approve
          </Button>
        )}

        {healthCheckResult.status === "Approved" && (
          <Button
            type="primary"
            icon={<CheckSquareOutlined />}
            onClick={handleComplete}
          >
            Complete
          </Button>
        )}

        {(healthCheckResult.status === "Pending" ||
          healthCheckResult.status === "Approved") && (
          <Popconfirm
            title="Enter cancellation reason"
            description={
              <TextArea
                placeholder="Cancellation reason"
                onChange={(e) => {
                  (e.target as any).reason = e.target.value;
                }}
                rows={3}
              />
            }
            onConfirm={(e) => {
              const target = e?.target as any;
              const reason = target?.reason || "No reason provided";
              handleCancel(reason);
            }}
            okText="Confirm"
            cancelText="Cancel"
          >
            <Button danger icon={<CloseCircleOutlined />}>
              Cancel
            </Button>
          </Popconfirm>
        )}

        {(healthCheckResult.status === "Pending" ||
          healthCheckResult.status === "Approved") && (
          <Popconfirm
            title="Enter reason for cancellation for adjustment"
            description={
              <TextArea
                placeholder="Reason for cancellation for adjustment"
                onChange={(e) => {
                  (e.target as any).reason = e.target.value;
                }}
                rows={3}
              />
            }
            onConfirm={(e) => {
              const target = e?.target as any;
              const reason = target?.reason || "No reason provided";
              handleCancelForAdjustment(reason);
            }}
            okText="Confirm"
            cancelText="Cancel"
          >
            <Button
              style={{ backgroundColor: "#FA8C16", color: "white" }}
              icon={<CloseSquareOutlined />}
            >
              Cancel for Adjustment
            </Button>
          </Popconfirm>
        )}

        {(healthCheckResult.status === "Approved" ||
          healthCheckResult.status === "Completed") && (
          <>
            {healthCheckResult.followUpRequired &&
            healthCheckResult.followUpDate ? (
              <Button
                danger
                icon={<CalendarOutlined />}
                onClick={handleCancelFollowUp}
              >
                Cancel Follow-up
              </Button>
            ) : (
              <Button
                type="default"
                icon={<CalendarOutlined />}
                onClick={() => setShowFollowUpModal(true)}
              >
                Schedule Follow-up
              </Button>
            )}
          </>
        )}

        <Button
          type="default"
          icon={<FilePdfOutlined />}
          onClick={handleExportPDF}
        >
          Export PDF
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
          <Empty description="Health check result not found">
            <Button
              type="primary"
              icon={<ArrowLeftOutlined />}
              onClick={() => router.back()}
            >
              Back
            </Button>
          </Empty>
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
                onClick={() => router.back()}
              >
                Back
              </Button>
              <Title level={4} style={{ margin: 0 }}>
                Health Check Result Details -{" "}
                {healthCheckResult.healthCheckResultCode}
              </Title>
              <Tag
                color={getStatusColor(healthCheckResult.status)}
                className="ml-2"
              >
                {healthCheckResult.status}
              </Tag>
            </Space>
          </Col>
          <Col span={24}>
            <Divider />
          </Col>
          <Col xs={24} md={12}>
            <Descriptions
              title="Person Examined Information"
              bordered
              column={1}
              size="small"
            >
              <Descriptions.Item label="Full Name">
                {healthCheckResult.user.fullName}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {healthCheckResult.user.email}
              </Descriptions.Item>
              <Descriptions.Item label="Gender">
                {healthCheckResult.user.gender || "No information"}
              </Descriptions.Item>
              <Descriptions.Item label="Date of Birth">
                {healthCheckResult.user.dob
                  ? formatDate(healthCheckResult.user.dob)
                  : "No information"}
              </Descriptions.Item>
              <Descriptions.Item label="Address">
                {healthCheckResult.user.address || "No information"}
              </Descriptions.Item>
              <Descriptions.Item label="Phone">
                {healthCheckResult.user.phone || "No information"}
              </Descriptions.Item>
            </Descriptions>
          </Col>
          <Col xs={24} md={12}>
            <Descriptions
              title="Health Check Information"
              bordered
              column={1}
              size="small"
            >
              <Descriptions.Item label="Health Check Result Code">
                {healthCheckResult.healthCheckResultCode}
              </Descriptions.Item>
              <Descriptions.Item label="Checkup Date">
                {formatDate(healthCheckResult.checkupDate)}
              </Descriptions.Item>
              <Descriptions.Item label="Healthcare Staff In Charge">
                {healthCheckResult.staff.fullName}
              </Descriptions.Item>
              <Descriptions.Item label="Follow-Up">
                {healthCheckResult.followUpRequired ? (
                  <Space>
                    <Badge status="processing" text="Follow-up required" />
                    {healthCheckResult.followUpDate
                      ? formatDate(healthCheckResult.followUpDate)
                      : "Not scheduled yet"}
                  </Space>
                ) : (
                  <Badge status="default" text="No follow-up required" />
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Created Date">
                {formatDateTime(healthCheckResult.createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label="Last Updated">
                {healthCheckResult.updatedAt
                  ? formatDateTime(healthCheckResult.updatedAt)
                  : "Not updated yet"}
              </Descriptions.Item>
              <Descriptions.Item label="Updated By">
                {healthCheckResult.updatedByUser
                  ? healthCheckResult.updatedByUser.fullName
                  : "No information"}
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
              <FileTextOutlined /> Health Check Details
            </span>
          }
          key="details"
        >
          <Card>
            {healthCheckResult.healthCheckResultDetails.length > 0 ? (
              healthCheckResult.healthCheckResultDetails.map(
                (detail, index) => (
                  <div key={detail.id} className="mb-4">
                    <Title level={5}>Detail #{index + 1}</Title>
                    <Descriptions
                      bordered
                      column={{ xs: 1, sm: 2 }}
                      size="small"
                    >
                      <Descriptions.Item label="Symptom" span={2}>
                        {detail.resultSummary}
                      </Descriptions.Item>
                      <Descriptions.Item label="Diagnosis" span={2}>
                        {detail.diagnosis}
                      </Descriptions.Item>
                      <Descriptions.Item label="Recommendations" span={2}>
                        {detail.recommendations}
                      </Descriptions.Item>
                      <Descriptions.Item label="Status">
                        <Tag color={getStatusColor(detail.status)}>
                          {detail.status}
                        </Tag>
                      </Descriptions.Item>
                    </Descriptions>
                    {index <
                      healthCheckResult.healthCheckResultDetails.length - 1 && (
                      <Divider />
                    )}
                  </div>
                )
              )
            ) : (
              <Empty description="No health check details available" />
            )}
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <MedicineBoxOutlined /> Prescriptions
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
                        onClick={() =>
                          message.info("This feature is not yet implemented")
                        }
                      >
                        View Details
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<MedicineBoxOutlined style={{ fontSize: 24 }} />}
                      title={`Prescription date ${formatDate(
                        item.prescriptionDate
                      )}`}
                      description={
                        <Space direction="vertical">
                          <Text>
                            Number of medicines: {item.totalMedicines}
                          </Text>
                          <Tag color={getStatusColor(item.status)}>
                            {item.status}
                          </Tag>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="No prescriptions available" />
            )}
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <ClockCircleOutlined /> Treatment Plans
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
                        onClick={() =>
                          message.info("This feature is not yet implemented")
                        }
                      >
                        View Details
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<ClockCircleOutlined style={{ fontSize: 24 }} />}
                      title={`Plan from ${formatDate(
                        item.startDate
                      )} to ${formatDate(item.endDate)}`}
                      description={
                        <Space direction="vertical">
                          <Text>{item.treatmentDescription}</Text>
                          <Space>
                            <Tag color={getStatusColor(item.status)}>
                              {item.status}
                            </Tag>
                            <Text type="secondary">
                              {item.daysRemaining > 0
                                ? `${item.daysRemaining} days remaining`
                                : "Completed"}
                            </Text>
                          </Space>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="No treatment plans available" />
            )}
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <HistoryOutlined /> History
            </span>
          }
          key="history"
        >
          <Card className="shadow-sm">
            <Row justify="space-between" align="middle" className="mb-4">
              <Col>
                <Title level={5}>Health Check Result History</Title>
              </Col>
              <Col>
                <Button
                  type="primary"
                  icon={<FileExcelOutlined />}
                  onClick={handleExportHistoryToExcel}
                >
                  Export to Excel
                </Button>
              </Col>
            </Row>

            {historiesLoading ? (
              <Skeleton active paragraph={{ rows: 6 }} />
            ) : histories.length > 0 ? (
              <Timeline>
                {histories.map((history) => (
                  <Timeline.Item
                    key={history.id}
                    color={getActionColor(history.action)}
                  >
                    <div className="flex flex-col">
                      <Text strong>{history.action}</Text>
                      <Text type="secondary">
                        {formatDateTime(history.actionDate)} by{" "}
                        {history.performedBy?.fullName}
                      </Text>
                      {history.previousStatus && history.newStatus && (
                        <Text>
                          Status:{" "}
                          <Tag color={getStatusColor(history.previousStatus)}>
                            {history.previousStatus}
                          </Tag>
                          {" → "}
                          <Tag color={getStatusColor(history.newStatus)}>
                            {history.newStatus}
                          </Tag>
                        </Text>
                      )}
                      {history.rejectionReason && (
                        <Text>Reason: {history.rejectionReason}</Text>
                      )}
                      {history.changeDetails && (
                        <Text>Details: {history.changeDetails}</Text>
                      )}
                    </div>
                  </Timeline.Item>
                ))}
              </Timeline>
            ) : (
              <Empty description="No history available" />
            )}
          </Card>
        </TabPane>
      </Tabs>

      <Modal
        title="Schedule Follow-up"
        open={showFollowUpModal}
        onCancel={() => setShowFollowUpModal(false)}
        onOk={handleScheduleFollowUp}
        okText="Confirm"
        cancelText="Cancel"
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
