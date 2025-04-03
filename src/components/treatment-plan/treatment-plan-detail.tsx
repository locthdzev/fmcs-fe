import React, { useState, useEffect } from "react";
import {
  Card,
  Typography,
  Tag,
  Timeline,
  Button,
  Space,
  Modal,
  Form,
  Input,
  DatePicker,
  message,
  Spin,
} from "antd";
import { toast } from "react-toastify";
import moment from "moment";
import {
  getTreatmentPlanById,
  TreatmentPlanResponseDTO,
  cancelTreatmentPlan,
  softDeleteTreatmentPlans,
  restoreSoftDeletedTreatmentPlans,
  updateTreatmentPlan,
  TreatmentPlanUpdateRequestDTO,
  exportTreatmentPlanToPDF,
  getTreatmentPlanHistoriesByTreatmentPlanId,
} from "@/api/treatment-plan";
import { getAllTreatmentPlanHistories, TreatmentPlanHistoryResponseDTO } from "@/api/treatment-plan";
import { EditOutlined, DeleteOutlined, UndoOutlined, FilePdfOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface TreatmentPlanDetailProps {
  id: string;
}

export const TreatmentPlanDetail: React.FC<TreatmentPlanDetailProps> = ({ id }) => {
  const [treatmentPlan, setTreatmentPlan] = useState<TreatmentPlanResponseDTO | null>(null);
  const [histories, setHistories] = useState<TreatmentPlanHistoryResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  useEffect(() => {
    fetchTreatmentPlan();
    fetchHistories();
  }, [id]);

  const fetchTreatmentPlan = async () => {
    try {
      const response = await getTreatmentPlanById(id);
      if (response.success) {
        setTreatmentPlan(response.data);
      } else {
        toast.error("Failed to fetch treatment plan");
      }
    } catch (error) {
      console.error("Error fetching treatment plan:", error);
      toast.error("Failed to fetch treatment plan");
    } finally {
      setLoading(false);
    }
  };

  const fetchHistories = async () => {
    try {
      setLoading(true);
      const response = await getTreatmentPlanHistoriesByTreatmentPlanId(id);
      if (response.success) {
        setHistories(response.data);
      } else {
        toast.error(response.message || "Failed to fetch histories");
      }
    } catch (error) {
      console.error("Error fetching histories:", error);
      toast.error("Failed to fetch histories");
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      const response = await exportTreatmentPlanToPDF(id);
      if (response.success && response.data) {
        window.open(response.data, "_blank");
        toast.success("Treatment plan exported to PDF successfully");
      } else {
        toast.error(response.message || "Failed to export PDF");
      }
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Failed to export PDF");
    }
  };

  const handleCancel = async () => {
    try {
      const response = await cancelTreatmentPlan(id, cancelReason);
      if (response.success) {
        toast.success("Treatment plan cancelled successfully");
        setCancelModalVisible(false);
        setCancelReason("");
        fetchTreatmentPlan();
        fetchHistories();
      } else {
        toast.error(response.message || "Failed to cancel treatment plan");
      }
    } catch (error) {
      console.error("Error cancelling treatment plan:", error);
      toast.error("Failed to cancel treatment plan");
    }
  };

  const handleSoftDelete = async () => {
    try {
      const response = await softDeleteTreatmentPlans([id]);
      if (response.success) {
        toast.success("Treatment plan deleted successfully");
        fetchTreatmentPlan();
        fetchHistories();
      } else {
        toast.error(response.message || "Failed to delete treatment plan");
      }
    } catch (error) {
      console.error("Error deleting treatment plan:", error);
      toast.error("Failed to delete treatment plan");
    }
  };

  const handleRestore = async () => {
    try {
      const response = await restoreSoftDeletedTreatmentPlans([id]);
      if (response.success) {
        toast.success("Treatment plan restored successfully");
        fetchTreatmentPlan();
        fetchHistories();
      } else {
        toast.error(response.message || "Failed to restore treatment plan");
      }
    } catch (error) {
      console.error("Error restoring treatment plan:", error);
      toast.error("Failed to restore treatment plan");
    }
  };

  const handleUpdate = async () => {
    try {
      const values = await form.validateFields();
      const updateData: TreatmentPlanUpdateRequestDTO = {
        treatmentDescription: values.treatmentDescription,
        instructions: values.instructions,
        startDate: values.startDate.format("YYYY-MM-DD"),
        endDate: values.endDate.format("YYYY-MM-DD"),
      };

      const response = await updateTreatmentPlan(id, updateData);
      if (response.success) {
        toast.success("Treatment plan updated successfully");
        setEditModalVisible(false);
        form.resetFields();
        fetchTreatmentPlan();
        fetchHistories();
      } else {
        toast.error(response.message || "Failed to update treatment plan");
      }
    } catch (error) {
      console.error("Error updating treatment plan:", error);
      toast.error("Failed to update treatment plan");
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
      case 'IN_PROGRESS':
        return 'processing';
      case 'COMPLETED':
        return 'success';
      case 'CANCELLED':
        return 'error';
      case 'SOFT_DELETED':
        return 'default';
      default:
        return 'default';
    }
  };

  const getActionColor = (action: string): string => {
    switch (action) {
      case 'Create':
        return 'green';
      case 'Update':
        return 'blue';
      case 'Cancel':
        return 'red';
      case 'StatusChange':
        return 'orange';
      case 'SoftDelete':
        return 'gray';
      case 'Restore':
        return 'green';
      default:
        return 'blue';
    }
  };

  const renderActionButtons = () => {
    if (!treatmentPlan) return null;

    return (
      <Space>
        <Button
          icon={<EditOutlined />}
          onClick={() => {
            form.setFieldsValue({
              treatmentDescription: treatmentPlan.treatmentDescription,
              instructions: treatmentPlan.instructions,
              startDate: moment(treatmentPlan.startDate),
              endDate: moment(treatmentPlan.endDate),
            });
            setEditModalVisible(true);
          }}
          disabled={treatmentPlan.status === 'CANCELLED' || treatmentPlan.status === 'SOFT_DELETED'}
        >
          Edit
        </Button>
        <Button
          icon={<FilePdfOutlined />}
          onClick={handleExportPDF}
        >
          Export PDF
        </Button>
        {treatmentPlan.status !== 'CANCELLED' && treatmentPlan.status !== 'SOFT_DELETED' && (
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => setCancelModalVisible(true)}
          >
            Cancel
          </Button>
        )}
        {treatmentPlan.status === 'SOFT_DELETED' && (
          <Button
            icon={<UndoOutlined />}
            onClick={handleRestore}
          >
            Restore
          </Button>
        )}
        {treatmentPlan.status !== 'SOFT_DELETED' && (
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={handleSoftDelete}
          >
            Delete
          </Button>
        )}
      </Space>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!treatmentPlan) {
    return (
      <div className="p-4">
        <Title level={2}>Treatment Plan Not Found</Title>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>Treatment Plan Details</Title>
        {renderActionButtons()}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card title="Basic Information">
          <div className="space-y-4">
            <div>
              <Text strong>Treatment Plan Code:</Text>
              <Text className="ml-2">{treatmentPlan.treatmentPlanCode}</Text>
            </div>
            <div>
              <Text strong>Health Check Code:</Text>
              <Text className="ml-2">{treatmentPlan.healthCheckResult?.healthCheckResultCode}</Text>
            </div>
            <div>
              <Text strong>Patient:</Text>
              <Text className="ml-2">
                {treatmentPlan.healthCheckResult?.user?.fullName} ({treatmentPlan.healthCheckResult?.user?.email})
              </Text>
            </div>
            <div>
              <Text strong>Drug:</Text>
              <Text className="ml-2">
                {treatmentPlan.drug?.name} ({treatmentPlan.drug?.drugCode})
              </Text>
            </div>
            <div>
              <Text strong>Status:</Text>
              <Tag color={getStatusColor(treatmentPlan.status)} className="ml-2">
                {treatmentPlan.status}
              </Tag>
            </div>
          </div>
        </Card>

        <Card title="Treatment Details">
          <div className="space-y-4">
            <div>
              <Text strong>Treatment Description:</Text>
              <Text className="ml-2 block">{treatmentPlan.treatmentDescription}</Text>
            </div>
            <div>
              <Text strong>Instructions:</Text>
              <Text className="ml-2 block">{treatmentPlan.instructions}</Text>
            </div>
            <div>
              <Text strong>Start Date:</Text>
              <Text className="ml-2">{formatDate(treatmentPlan.startDate)}</Text>
            </div>
            <div>
              <Text strong>End Date:</Text>
              <Text className="ml-2">{formatDate(treatmentPlan.endDate)}</Text>
            </div>
          </div>
        </Card>
      </div>

      <Card title="History Timeline">
        <Timeline>
          {histories.map((history) => (
            <Timeline.Item
              key={history.id}
              color={getActionColor(history.action)}
            >
              <div className="space-y-1">
                <div className="flex justify-between">
                  <Text strong>{history.action}</Text>
                  <Text type="secondary">{formatDateTime(history.actionDate)}</Text>
                </div>
                <div>
                  <Text type="secondary">Performed by: {history.performedBy?.fullName}</Text>
                </div>
                {history.previousStatus && history.newStatus && (
                  <div>
                    <Text type="secondary">
                      Status changed from{" "}
                      <Tag color={getStatusColor(history.previousStatus)}>
                        {history.previousStatus}
                      </Tag>{" "}
                      to{" "}
                      <Tag color={getStatusColor(history.newStatus)}>
                        {history.newStatus}
                      </Tag>
                    </Text>
                  </div>
                )}
                {history.changeDetails && (
                  <div>
                    <Text type="secondary">Details: {history.changeDetails}</Text>
                  </div>
                )}
              </div>
            </Timeline.Item>
          ))}
        </Timeline>
      </Card>

      <Modal
        title="Edit Treatment Plan"
        open={editModalVisible}
        onOk={handleUpdate}
        onCancel={() => setEditModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="treatmentDescription"
            label="Treatment Description"
            rules={[{ required: true, message: "Please enter treatment description" }]}
          >
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item
            name="instructions"
            label="Instructions"
            rules={[{ required: true, message: "Please enter instructions" }]}
          >
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item
            name="startDate"
            label="Start Date"
            rules={[{ required: true, message: "Please select start date" }]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="endDate"
            label="End Date"
            rules={[{ required: true, message: "Please select end date" }]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Cancel Treatment Plan"
        open={cancelModalVisible}
        onOk={handleCancel}
        onCancel={() => setCancelModalVisible(false)}
      >
        <Form layout="vertical">
          <Form.Item
            label="Reason for Cancellation"
            required
          >
            <TextArea
              rows={4}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}; 