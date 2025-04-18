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
  Popconfirm,
  Row,
  Col,
} from "antd";
import dayjs from "dayjs";
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
import {
  getAllTreatmentPlanHistories,
  TreatmentPlanHistoryResponseDTO,
} from "@/api/treatment-plan";
import {
  FormOutlined,
  DeleteOutlined,
  UndoOutlined,
  FilePdfOutlined,
  ArrowLeftOutlined,
  CloseCircleOutlined,
  MedicineBoxOutlined,
  PlusOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface TreatmentPlanDetailProps {
  id: string;
}

export const TreatmentPlanDetail: React.FC<TreatmentPlanDetailProps> = ({
  id,
}) => {
  const router = useRouter();
  const [treatmentPlan, setTreatmentPlan] =
    useState<TreatmentPlanResponseDTO | null>(null);
  const [histories, setHistories] = useState<TreatmentPlanHistoryResponseDTO[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [messageApi, contextHolder] = message.useMessage();

  // Thêm loading states cho từng action
  const [cancelLoading, setCancelLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    // Chỉ fetch dữ liệu khi id hợp lệ
    if (id) {
      fetchTreatmentPlan();
      fetchHistories();
    }
  }, [id]);

  const fetchTreatmentPlan = async () => {
    try {
      setLoading(true);
      // Kiểm tra id trước khi gọi API
      if (!id) {
        console.warn("Treatment plan ID is missing, cannot fetch data");
        return;
      }

      const response = await getTreatmentPlanById(id);
      if (response.success) {
        setTreatmentPlan(response.data);
      } else {
        messageApi.error({
          content: response.message || "Failed to fetch treatment plan",
          duration: 5,
        });
      }
    } catch (error) {
      console.error("Error fetching treatment plan:", error);
      messageApi.error({
        content: "Failed to fetch treatment plan",
        duration: 5,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchHistories = async () => {
    try {
      setLoading(true);
      // Kiểm tra id trước khi gọi API
      if (!id) {
        console.warn("Treatment plan ID is missing, cannot fetch histories");
        return;
      }

      const response = await getTreatmentPlanHistoriesByTreatmentPlanId(id);
      if (response.success) {
        setHistories(response.data);
      } else {
        messageApi.error({
          content: response.message || "Failed to fetch histories",
          duration: 5,
        });
      }
    } catch (error) {
      console.error("Error fetching histories:", error);
      messageApi.error({
        content: "Failed to fetch histories",
        duration: 5,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setExportLoading(true);
      const response = await exportTreatmentPlanToPDF(id);
      console.log("Export PDF response:", response);

      if (
        response.success &&
        response.data &&
        typeof response.data === "string" &&
        response.data.startsWith("http")
      ) {
        // Ensure we only open window when data is a valid URL
        window.open(response.data, "_blank");
        messageApi.success({
          content: "Treatment plan exported to PDF successfully",
          duration: 10,
        });
      } else if (response.success) {
        // Server reports success but no valid URL in data
        console.warn(
          "PDF export succeeded but no valid URL returned:",
          response
        );
        messageApi.warning({
          content:
            "PDF generated but download link is unavailable. Please try again.",
          duration: 10,
        });
      } else {
        // Server reports failure
        messageApi.error({
          content: response.message || "Failed to export PDF",
          duration: 5,
        });
      }
    } catch (error) {
      console.error("Error exporting PDF:", error);
      messageApi.error({
        content: "Failed to export PDF",
        duration: 5,
      });
    } finally {
      setExportLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason || cancelReason.trim() === "") {
      messageApi.error("Please enter a reason for cancellation", 5);
      return;
    }

    try {
      setCancelLoading(true);
      const response = await cancelTreatmentPlan(id, cancelReason);
      if (response.success) {
        messageApi.success("Treatment plan cancelled successfully", 5);
        setCancelModalVisible(false);
        setCancelReason("");
        fetchTreatmentPlan();
        fetchHistories();
      } else {
        messageApi.error(
          response.message || "Failed to cancel treatment plan",
          5
        );
      }
    } catch (error) {
      console.error("Error cancelling treatment plan:", error);
      messageApi.error("Failed to cancel treatment plan", 5);
    } finally {
      setCancelLoading(false);
    }
  };

  const handleSoftDelete = async () => {
    try {
      setDeleteLoading(true);
      const response = await softDeleteTreatmentPlans([id]);
      if (response.success) {
        messageApi.success("Treatment plan deleted successfully", 5);
        fetchTreatmentPlan();
        fetchHistories();
      } else {
        messageApi.error(
          response.message || "Failed to delete treatment plan",
          5
        );
      }
    } catch (error) {
      console.error("Error deleting treatment plan:", error);
      messageApi.error("Failed to delete treatment plan", 5);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleRestore = async () => {
    try {
      setRestoreLoading(true);
      const response = await restoreSoftDeletedTreatmentPlans([id]);
      if (response.success) {
        messageApi.success("Treatment plan restored successfully", 5);
        fetchTreatmentPlan();
        fetchHistories();
      } else {
        messageApi.error(
          response.message || "Failed to restore treatment plan",
          5
        );
      }
    } catch (error) {
      console.error("Error restoring treatment plan:", error);
      messageApi.error("Failed to restore treatment plan", 5);
    } finally {
      setRestoreLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      const values = await form.validateFields();
      setUpdateLoading(true);

      const updateData: TreatmentPlanUpdateRequestDTO = {
        treatmentDescription: values.treatmentDescription,
        instructions: values.instructions,
        startDate: values.startDate.format("YYYY-MM-DD"),
        endDate: values.endDate.format("YYYY-MM-DD"),
      };

      const response = await updateTreatmentPlan(id, updateData);
      if (response.success) {
        messageApi.success("Treatment plan updated successfully", 5);
        setEditModalVisible(false);
        form.resetFields();
        fetchTreatmentPlan();
        fetchHistories();
      } else {
        messageApi.error(
          response.message || "Failed to update treatment plan",
          5
        );
      }
    } catch (error) {
      console.error("Error updating treatment plan:", error);
      messageApi.error("Failed to update treatment plan", 5);
    } finally {
      setUpdateLoading(false);
    }
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return "";
    return dayjs(date).format("DD/MM/YYYY");
  };

  const formatDateTime = (datetime: string | undefined) => {
    if (!datetime) return "";
    return dayjs(datetime).format("DD/MM/YYYY HH:mm:ss");
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case "IN_PROGRESS":
      case "InProgress":
        return "processing";
      case "COMPLETED":
      case "Completed":
        return "success";
      case "CANCELLED":
      case "Cancelled":
        return "error";
      case "SOFT_DELETED":
      case "SoftDeleted":
        return "default";
      default:
        return "default";
    }
  };

  const getActionColor = (action: string): string => {
    if (!action) return "blue";

    switch (action.toLowerCase()) {
      case "created":
        return "green";
      case "updated":
        return "blue";
      case "cancelled":
        return "orange";
      case "statuschange":
        return "orange";
      case "softdeleted":
        return "gray";
      case "restored":
        return "lime";
      case "auto-completed":
        return "cyan";
      default:
        return "blue";
    }
  };

  const getActionIcon = (action: string) => {
    if (!action) return null;

    switch (action.toLowerCase()) {
      case "created":
        return <PlusOutlined />;
      case "updated":
        return <FormOutlined />;
      case "cancelled":
        return <CloseCircleOutlined />;
      case "softdeleted":
        return <DeleteOutlined />;
      case "restored":
        return <UndoOutlined />;
      case "auto-completed":
        return <CheckCircleOutlined />;
      default:
        return <HistoryOutlined />;
    }
  };

  const canEditTreatmentPlan = (status: string | undefined) => {
    return status === "IN_PROGRESS" || status === "InProgress";
  };

  const canCancelTreatmentPlan = (status: string | undefined) => {
    return status === "IN_PROGRESS" || status === "InProgress";
  };

  const canSoftDeleteTreatmentPlan = (status: string | undefined) => {
    return (
      status === "COMPLETED" ||
      status === "Completed" ||
      status === "CANCELLED" ||
      status === "Cancelled"
    );
  };

  const canRestoreTreatmentPlan = (status: string | undefined) => {
    return status === "SOFT_DELETED" || status === "SoftDeleted";
  };

  const renderActionButtons = () => {
    if (!treatmentPlan) return null;

    return (
      <Space>
        <Button
          icon={<FormOutlined />}
          disabled={!canEditTreatmentPlan(treatmentPlan.status)}
          onClick={() => {
            form.setFieldsValue({
              treatmentDescription: treatmentPlan.treatmentDescription,
              instructions: treatmentPlan.instructions,
              startDate: dayjs(treatmentPlan.startDate),
              endDate: dayjs(treatmentPlan.endDate),
            });
            setEditModalVisible(true);
          }}
        >
          Edit
        </Button>

        {canCancelTreatmentPlan(treatmentPlan.status) && (
          <Popconfirm
            title="Cancel Treatment Plan"
            description={
              <>
                <p>Are you sure you want to cancel this treatment plan?</p>
                <p style={{ marginTop: "8px", marginBottom: "4px" }}>
                  Reason for cancellation:
                </p>
                <Input.TextArea
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Please enter reason for cancellation"
                />
              </>
            }
            onConfirm={handleCancel}
            onCancel={() => setCancelReason("")}
            okText="Cancel Plan"
            cancelText="No"
            okButtonProps={{ loading: cancelLoading }}
          >
            <Button danger icon={<CloseCircleOutlined />}>
              Cancel
            </Button>
          </Popconfirm>
        )}

        {canRestoreTreatmentPlan(treatmentPlan.status) && (
          <Popconfirm
            title="Restore Treatment Plan"
            description="Are you sure you want to restore this treatment plan?"
            onConfirm={handleRestore}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ loading: restoreLoading }}
          >
            <Button icon={<UndoOutlined />} loading={restoreLoading}>
              Restore
            </Button>
          </Popconfirm>
        )}

        {canSoftDeleteTreatmentPlan(treatmentPlan.status) && (
          <Popconfirm
            title="Soft Delete Treatment Plan"
            description="Are you sure you want to soft delete this treatment plan?"
            onConfirm={handleSoftDelete}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ loading: deleteLoading }}
          >
            <Button danger icon={<DeleteOutlined />} loading={deleteLoading}>
              Delete
            </Button>
          </Popconfirm>
        )}

        <Button
          type="primary"
          icon={<FilePdfOutlined />}
          loading={exportLoading}
          onClick={handleExportPDF}
        >
          Export to PDF
        </Button>
      </Space>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        {contextHolder}
        <Spin size="large" />
      </div>
    );
  }

  if (!treatmentPlan) {
    return (
      <div className="p-4">
        {contextHolder}
        <Title level={2}>Treatment Plan Not Found</Title>
      </div>
    );
  }

  return (
    <div className="p-4">
      {contextHolder}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push("/treatment-plan")}
            style={{ marginRight: "8px" }}
          >
            Back
          </Button>
          <MedicineBoxOutlined style={{ fontSize: "24px" }} />
          <h3 className="text-xl font-bold">Treatment Plan Details</h3>
        </div>
        <div>{renderActionButtons()}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card
          title={<span style={{ fontWeight: "bold" }}>Basic Information</span>}
        >
          <div className="space-y-4">
            <div>
              <Text strong>Treatment Plan Code:</Text>
              <Text className="ml-2">{treatmentPlan.treatmentPlanCode}</Text>
            </div>
            <div>
              <Text strong>Health Check Code:</Text>
              {treatmentPlan.healthCheckResult ? (
                <Button
                  type="link"
                  onClick={() =>
                    treatmentPlan.healthCheckResult?.id &&
                    router.push(
                      `/health-check-result/${treatmentPlan.healthCheckResult.id}`
                    )
                  }
                  style={{ paddingLeft: "8px", margin: 0, height: "auto" }}
                >
                  {treatmentPlan.healthCheckResult.healthCheckResultCode}
                </Button>
              ) : (
                <Text className="ml-2">N/A</Text>
              )}
            </div>
            <div>
              <Text strong>Patient:</Text>
              <Text className="ml-2">
                {treatmentPlan.healthCheckResult?.user?.fullName} (
                {treatmentPlan.healthCheckResult?.user?.email})
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
              <Tag
                color={getStatusColor(treatmentPlan.status)}
                className="ml-2"
              >
                {treatmentPlan.status}
              </Tag>
            </div>
          </div>
        </Card>

        <Card
          title={<span style={{ fontWeight: "bold" }}>Treatment Details</span>}
        >
          <div className="space-y-4">
            <div>
              <Text strong>Treatment Description:</Text>
              <Text className="ml-2 block">
                {treatmentPlan.treatmentDescription}
              </Text>
            </div>
            <div>
              <Text strong>Instructions:</Text>
              <Text className="ml-2 block">{treatmentPlan.instructions}</Text>
            </div>
            <div>
              <Text strong>Start Date:</Text>
              <Text className="ml-2">
                {formatDate(treatmentPlan.startDate)}
              </Text>
            </div>
            <div>
              <Text strong>End Date:</Text>
              <Text className="ml-2">{formatDate(treatmentPlan.endDate)}</Text>
            </div>
          </div>
        </Card>
      </div>

      <Card
        title={<span style={{ fontWeight: "bold" }}>History Timeline</span>}
      >
        <Timeline
          mode="left"
          items={histories.map((history) => ({
            color: getActionColor(history.action),
            dot: getActionIcon(history.action),
            children: (
              <Card
                size="small"
                className="mb-2 hover:shadow-md transition-shadow"
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ fontWeight: 500 }}>{history.action}</div>
                    <div
                      style={{
                        fontSize: "14px",
                        color: "#8c8c8c",
                      }}
                    >
                      {formatDateTime(history.actionDate)}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr",
                      gap: "4px",
                    }}
                  >
                    <div style={{ display: "flex" }}>
                      <div
                        style={{
                          width: "180px",
                          color: "#8c8c8c",
                        }}
                      >
                        Performed by:
                      </div>
                      <div>
                        {history.action?.toLowerCase() === "auto-completed"
                          ? "System"
                          : `${history.performedBy?.fullName} (${
                              history.performedBy?.email || ""
                            })`}
                      </div>
                    </div>

                    {history.previousStatus && history.newStatus && (
                      <div style={{ display: "flex" }}>
                        <div
                          style={{
                            width: "180px",
                            color: "#8c8c8c",
                          }}
                        >
                          Status:
                        </div>
                        <div style={{ flex: 1 }}>
                          <Tag color={getStatusColor(history.previousStatus)}>
                            {history.previousStatus}
                          </Tag>
                          <Text type="secondary"> → </Text>
                          <Tag color={getStatusColor(history.newStatus)}>
                            {history.newStatus}
                          </Tag>
                        </div>
                      </div>
                    )}

                    {history.changeDetails && (
                      <div style={{ display: "flex" }}>
                        <div
                          style={{
                            width: "180px",
                            color: "#8c8c8c",
                          }}
                        >
                          Details:
                        </div>
                        <div
                          style={{
                            flex: 1,
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {history.changeDetails}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ),
          }))}
        />
      </Card>

      <Modal
        title="Edit Treatment Plan"
        open={editModalVisible}
        onOk={handleUpdate}
        onCancel={() => setEditModalVisible(false)}
        confirmLoading={updateLoading}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="treatmentDescription"
            label="Treatment Description"
            rules={[
              { required: true, message: "Please enter treatment description" },
            ]}
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
    </div>
  );
};
