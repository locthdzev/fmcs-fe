import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Typography,
  Descriptions,
  Tag,
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
  Timeline,
  Modal,
  Form,
  InputNumber,
  Select,
  Spin,
  Tooltip,
} from "antd";
import { useRouter } from "next/router";
import {
  getPrescriptionById,
  PrescriptionResponseDTO,
  PrescriptionDetailResponseDTO,
  exportPrescriptionToPDF,
  getPrescriptionHistoriesByPrescriptionId,
  PrescriptionHistoryResponseDTO,
  cancelPrescription,
  updatePrescription,
  softDeletePrescriptions,
  restoreSoftDeletedPrescriptions,
  PrescriptionDetailUpdateRequestDTO,
  PrescriptionUpdateRequestDTO,
} from "@/api/prescription";
import { getDrugs, DrugResponse } from "@/api/drug";
import moment from "moment";
import {
  ArrowLeftOutlined,
  FilePdfOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  HistoryOutlined,
  FormOutlined,
  FileTextOutlined,
  MedicineBoxOutlined,
  SaveOutlined,
  DeleteOutlined,
  UndoOutlined,
  PlusOutlined,
  PrinterOutlined,
  UserOutlined,
  FileOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  GiftOutlined,
} from "@ant-design/icons";
import ConfirmCancelPrescriptionModal from "./ConfirmCancelPrescriptionModal";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface PrescriptionDetailProps {
  id: string;
}

export const PrescriptionDetail: React.FC<PrescriptionDetailProps> = ({
  id,
}) => {
  const router = useRouter();
  const [prescription, setPrescription] =
    useState<PrescriptionResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [histories, setHistories] = useState<PrescriptionHistoryResponseDTO[]>(
    []
  );
  const [historiesLoading, setHistoriesLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [drugOptions, setDrugOptions] = useState<DrugResponse[]>([]);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  // Thêm loading states cho từng action
  const [cancelLoading, setCancelLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // Thêm state cho modal hủy đơn thuốc
  const [cancelModalVisible, setCancelModalVisible] = useState(false);

  // Check if edit query parameter is present
  useEffect(() => {
    if (router.query.edit === "true") {
      setIsEditing(true);
    }
  }, [router.query]);

  const fetchPrescription = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await getPrescriptionById(id);
      if (response.success) {
        setPrescription(response.data);

        // Initialize form with prescription data for editing
        if (response.data.prescriptionDetails) {
          form.setFieldsValue({
            prescriptionDetails: response.data.prescriptionDetails.map(
              (detail: PrescriptionDetailResponseDTO) => ({
                id: detail.id,
                drugId: detail.drug?.id,
                dosage: detail.dosage,
                quantity: detail.quantity,
                instructions: detail.instructions,
              })
            ),
          });
        }
      } else {
        messageApi.error(response.message || "Failed to load prescription details");
      }
    } catch (error) {
      console.error("Error fetching prescription details:", error);
      messageApi.error("Failed to load prescription details");
    } finally {
      setLoading(false);
    }
  };

  const fetchHistories = async () => {
    if (!id) return;
    setHistoriesLoading(true);
    try {
      const response = await getPrescriptionHistoriesByPrescriptionId(id);
      if (response.success) {
        setHistories(response.data);
      } else {
        messageApi.error(response.message || "Failed to load prescription history");
      }
    } catch (error) {
      console.error("Error fetching prescription history:", error);
      messageApi.error("Failed to load prescription history");
    } finally {
      setHistoriesLoading(false);
    }
  };

  const fetchDrugs = async () => {
    try {
      const drugs = await getDrugs();
      setDrugOptions(drugs);
    } catch (error) {
      console.error("Error fetching drugs:", error);
      messageApi.error("Failed to load drugs");
    }
  };

  useEffect(() => {
    if (id) {
      fetchPrescription();
      fetchHistories();
      fetchDrugs();
    }
  }, [id]);

  const handleExportPDF = async () => {
    if (!id) return;
    try {
      setExportLoading(true);
      await exportPrescriptionToPDF(id);
      messageApi.success("PDF exported successfully");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      messageApi.error("Failed to export PDF");
    } finally {
      setExportLoading(false);
    }
  };

  const handleCancel = async (reason: string) => {
    if (!id) return;
    try {
      setCancelLoading(true);
      const response = await cancelPrescription(id, reason);
      if (response.success) {
        messageApi.success("Prescription cancelled successfully");
        fetchPrescription();
        fetchHistories();
      } else {
        messageApi.error(response.message || "Failed to cancel prescription");
      }
    } catch (error) {
      console.error("Error cancelling prescription:", error);
      messageApi.error("Failed to cancel prescription");
    } finally {
      setCancelLoading(false);
      setCancelModalVisible(false);
    }
  };

  const handleSoftDelete = async () => {
    if (!id) return;
    try {
      setDeleteLoading(true);
      const response = await softDeletePrescriptions([id]);
      if (response.success) {
        messageApi.success("Prescription soft deleted successfully");
        fetchPrescription();
        fetchHistories();
      } else {
        messageApi.error(response.message || "Failed to soft delete prescription");
      }
    } catch (error) {
      console.error("Error soft deleting prescription:", error);
      messageApi.error("Failed to soft delete prescription");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!id) return;
    try {
      setRestoreLoading(true);
      const response = await restoreSoftDeletedPrescriptions([id]);
      if (response.success) {
        messageApi.success("Prescription restored successfully");
        fetchPrescription();
        fetchHistories();
      } else {
        messageApi.error(response.message || "Failed to restore prescription");
      }
    } catch (error) {
      console.error("Error restoring prescription:", error);
      messageApi.error("Failed to restore prescription");
    } finally {
      setRestoreLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      setEditLoading(true);
      const values = await form.validateFields();
      
      // Handle prescription details
      const details: PrescriptionDetailUpdateRequestDTO[] = values.prescriptionDetails.map(
        (detail: any) => ({
          id: detail.id,
          drugId: detail.drugId,
          dosage: detail.dosage,
          quantity: detail.quantity,
          instructions: detail.instructions,
        })
      );
      
      const updateData: PrescriptionUpdateRequestDTO = {
        prescriptionDetails: details,
      };
      
      const response = await updatePrescription(id, updateData);
      
      if (response.success) {
        messageApi.success("Prescription updated successfully");
        setIsEditing(false);
        fetchPrescription();
        fetchHistories();
      } else {
        messageApi.error(response.message || "Failed to update prescription");
      }
    } catch (error: any) {
      if (error.errorFields) {
        messageApi.error("Please check the form for errors");
      } else {
        console.error("Error updating prescription:", error);
        messageApi.error("Failed to update prescription");
      }
    } finally {
      setEditLoading(false);
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
      case "Dispensed":
        return "processing";
      case "Updated":
        return "warning";
      case "Used":
        return "success";
      case "UpdatedAndUsed":
        return "success";
      case "Inactive":
        return "default";
      case "Cancelled":
        return "error";
      case "SoftDeleted":
        return "default";
      default:
        return "default";
    }
  };

  const getActionColor = (action: string): string => {
    switch (action) {
      case "Create":
        return "green";
      case "Update":
        return "blue";
      case "Cancel":
        return "red";
      case "StatusChange":
        return "orange";
      case "SoftDelete":
        return "gray";
      case "Restore":
        return "green";
      default:
        return "blue";
    }
  };

  const getActionIcon = (action: string) => {
    if (!action) return null;

    switch (action.toLowerCase()) {
      case "create":
        return <PlusOutlined />;
      case "update":
        return <FormOutlined />;
      case "cancel":
        return <CloseCircleOutlined />;
      case "statuschange":
        return <ClockCircleOutlined />;
      case "softdelete":
        return <DeleteOutlined />;
      case "restore":
        return <UndoOutlined />;
      default:
        return <HistoryOutlined />;
    }
  };

  const canEditPrescription = (status: string | undefined) => {
    return status === "Dispensed";
  };

  const canCancelPrescription = (status: string | undefined) => {
    return status === "Dispensed";
  };

  const canSoftDeletePrescription = (status: string | undefined) => {
    return (
      status === "Used" ||
      status === "UpdatedAndUsed"
    );
  };

  const canRestorePrescription = (status: string | undefined) => {
    return status === "SoftDeleted";
  };

  const getBatchStatusColor = (status: string | undefined) => {
    switch (status) {
      case "Priority":
        return "primary";
      case "Active":
        return "success";
      case "NearExpiry":
        return "warning";
      case "Inactive":
        return "default";
      case "Expired":
        return "error";
      default:
        return "default";
    }
  };

  const renderActionButtons = () => {
    if (!prescription) return null;

    const canEdit = canEditPrescription(prescription.status);
    const canCancel = canCancelPrescription(prescription.status);
    const canSoftDelete = canSoftDeletePrescription(prescription.status);
    const canRestore = canRestorePrescription(prescription.status);

    return (
      <Space>
        {isEditing ? (
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleUpdate}
            loading={editLoading}
          >
            Save Changes
          </Button>
        ) : (
          canEdit && (
            <Button icon={<FormOutlined />} onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          )
        )}

        {canCancel && (
          <Button 
            danger 
            icon={<CloseCircleOutlined />} 
            loading={cancelLoading}
            onClick={() => setCancelModalVisible(true)}
          >
            Cancel Prescription
          </Button>
        )}

        {canSoftDelete && (
          <Popconfirm
            title="Soft Delete Prescription"
            description="Are you sure you want to soft delete this prescription?"
            okText="Yes"
            cancelText="No"
            okButtonProps={{ loading: deleteLoading }}
            onConfirm={handleSoftDelete}
          >
            <Button danger icon={<DeleteOutlined />} loading={deleteLoading}>
              Soft Delete
            </Button>
          </Popconfirm>
        )}

        {canRestore && (
          <Popconfirm
            title="Restore Prescription"
            description="Are you sure you want to restore this prescription?"
            okText="Yes"
            cancelText="No"
            okButtonProps={{ loading: restoreLoading }}
            onConfirm={handleRestore}
          >
            <Button icon={<UndoOutlined />} loading={restoreLoading}>
              Restore
            </Button>
          </Popconfirm>
        )}

        <Button
          type="primary"
          icon={<FilePdfOutlined />}
          onClick={handleExportPDF}
          loading={exportLoading}
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

  if (!prescription) {
    return (
      <div className="p-4">
        {contextHolder}
        <Empty description="Prescription not found" />
        <div className="mt-4 text-center">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push("/prescription")}
          >
            Back to List
          </Button>
        </div>
      </div>
    );
  }

  const renderPrescriptionDetails = () => {
    if (isEditing) {
      return (
        <Form form={form} layout="vertical">
          <Form.List name="prescriptionDetails">
            {(fields) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Card key={key} style={{ marginBottom: 16 }}>
                    <Row gutter={16}>
                      <Col span={24}>
                        <Form.Item {...restField} name={[name, "id"]} hidden>
                          <Input />
                        </Form.Item>

                        <Form.Item
                          {...restField}
                          name={[name, "drugId"]}
                          label="Medicine"
                          rules={[
                            {
                              required: true,
                              message: "Please select a medicine",
                            },
                          ]}
                        >
                          <Select
                            disabled
                            placeholder="Select medicine"
                            style={{ width: "100%" }}
                          >
                            {drugOptions.map((drug) => (
                              <Option key={drug.id} value={drug.id}>
                                {drug.name} ({drug.drugCode})
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>

                      <Col span={24}>
                        <Form.Item
                          {...restField}
                          name={[name, "dosage"]}
                          label="Dosage"
                          rules={[
                            { required: true, message: "Please enter dosage" },
                          ]}
                        >
                          <Input placeholder="e.g. 1 tablet twice daily" />
                        </Form.Item>
                      </Col>

                      <Col span={24}>
                        <Form.Item
                          {...restField}
                          name={[name, "quantity"]}
                          label="Quantity"
                          rules={[
                            {
                              required: true,
                              message: "Please enter quantity",
                            },
                          ]}
                        >
                          <InputNumber min={1} style={{ width: "100%" }} />
                        </Form.Item>
                      </Col>

                      <Col span={24}>
                        <Form.Item
                          {...restField}
                          name={[name, "instructions"]}
                          label="Instructions"
                          rules={[
                            {
                              required: true,
                              message: "Please enter instructions",
                            },
                          ]}
                        >
                          <TextArea
                            rows={3}
                            placeholder="Instructions for taking the medicine"
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Card>
                ))}
              </>
            )}
          </Form.List>
        </Form>
      );
    }

    return (
      <div>
        {prescription.prescriptionDetails.map((detail, index) => (
          <Card key={index} style={{ marginBottom: 16 }}>
            <Descriptions
              title={`Medicine ${index + 1}: ${detail.drug?.name} (${
                detail.drug?.drugCode
              })`}
              bordered
              column={1}
            >
              <Descriptions.Item label="Dosage">
                {detail.dosage}
              </Descriptions.Item>
              <Descriptions.Item label="Quantity">
                {detail.quantity}
              </Descriptions.Item>
              <Descriptions.Item label="Instructions">
                {detail.instructions}
              </Descriptions.Item>
            </Descriptions>

            {detail.batchDetails && detail.batchDetails.length > 0 && (
              <div className="mt-4">
                <Divider orientation="left">Batch Information</Divider>
                <Descriptions bordered column={1}>
                  <Descriptions.Item label="Batch Number">
                    <Button 
                      type="link" 
                      onClick={() => router.push(`/batch-number/${detail.batchDetails?.[0].batchId}`)}
                      style={{ padding: 0, margin: 0 }}
                    >
                      {detail.batchDetails?.[0].batchCode}
                    </Button>
                  </Descriptions.Item>
                  <Descriptions.Item label="Quantity Used">
                    {detail.batchDetails?.[0].quantityUsed}
                  </Descriptions.Item>
                  <Descriptions.Item label="Expiry Date">
                    {formatDate(detail.batchDetails?.[0].expiryDate)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Batch Status">
                    <Tag color={getBatchStatusColor(detail.batchDetails?.[0].status)}>
                      {detail.batchDetails?.[0].status}
                    </Tag>
                  </Descriptions.Item>
                </Descriptions>
              </div>
            )}
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="p-4">
      {contextHolder}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.back()}
            style={{ marginRight: "8px" }}
          >
            Back
          </Button>
          <MedicineBoxOutlined style={{ fontSize: "24px" }} />
          <h3 className="text-xl font-bold">Prescription Details</h3>
        </div>
        <div>{renderActionButtons()}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card title={<span style={{ fontWeight: "bold" }}>Basic Information</span>}>
          <div className="space-y-4">
            <div>
              <Text strong>Prescription Code:</Text>
              <Text className="ml-2">{prescription.prescriptionCode}</Text>
            </div>
            <div>
              <Text strong>Health Check Code:</Text>
              {prescription?.healthCheckResult ? (
                <Button
                  type="link"
                  onClick={() =>
                    router.push(
                      `/health-check-result/${prescription?.healthCheckResult?.id}`
                    )
                  }
                  style={{ paddingLeft: "8px", margin: 0, height: "auto" }}
                >
                  {prescription?.healthCheckResult?.healthCheckResultCode}
                </Button>
              ) : (
                <Text className="ml-2">N/A</Text>
              )}
            </div>
            <div>
              <Text strong>Patient:</Text>
              <Text className="ml-2">
                {prescription?.healthCheckResult?.user?.fullName} ({prescription?.healthCheckResult?.user?.email})
              </Text>
            </div>
            <div>
              <Text strong>Healthcare Staff:</Text>
              <Text className="ml-2">
                {prescription.staff?.fullName} ({prescription.staff?.email})
              </Text>
            </div>
            <div>
              <Text strong>Prescription Date:</Text>
              <Text className="ml-2">{formatDate(prescription.prescriptionDate)}</Text>
            </div>
            <div>
              <Text strong>Status:</Text>
              <Tag color={getStatusColor(prescription.status)} className="ml-2">
                {prescription.status}
              </Tag>
            </div>
          </div>
        </Card>

        <Card title={<span style={{ fontWeight: "bold" }}>Additional Information</span>}>
          <div className="space-y-4">
            <div>
              <Text strong>Created At:</Text>
              <Text className="ml-2">{formatDateTime(prescription.createdAt)}</Text>
            </div>
            <div>
              <Text strong>Updated At:</Text>
              <Text className="ml-2">{formatDateTime(prescription.updatedAt) || "N/A"}</Text>
            </div>
            <div>
              <Text strong>Updated By:</Text>
              <Text className="ml-2">
                {prescription.updatedBy ? `${prescription.updatedBy.fullName} (${prescription.updatedBy.email})` : "N/A"}
              </Text>
            </div>
          </div>
        </Card>
      </div>

      <Card title={<span style={{ fontWeight: "bold" }}>Medications</span>} className="mb-8">
        {renderPrescriptionDetails()}
      </Card>

      <Card title={<span style={{ fontWeight: "bold" }}>History Timeline</span>}>
        {historiesLoading ? (
          <Skeleton active />
        ) : histories.length === 0 ? (
          <Empty description="No history records found" />
        ) : (
          <Timeline
            mode="left"
            items={histories.map((history) => ({
              color: getActionColor(history.action),
              dot: getActionIcon(history.action),
              children: (
                <Card size="small" className="mb-2 hover:shadow-md transition-shadow">
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontWeight: 500 }}>{history.action}</div>
                      <div style={{ fontSize: "14px", color: "#8c8c8c" }}>
                        {formatDateTime(history.actionDate)}
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "4px" }}>
                      <div style={{ display: "flex" }}>
                        <div style={{ width: "180px", color: "#8c8c8c" }}>Performed by:</div>
                        <div>
                          {history.performedBy ? `${history.performedBy.fullName} (${history.performedBy.email})` : "N/A"}
                        </div>
                      </div>

                      {history.previousStatus && history.newStatus && (
                        <div style={{ display: "flex" }}>
                          <div style={{ width: "180px", color: "#8c8c8c" }}>Status:</div>
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
                          <div style={{ width: "180px", color: "#8c8c8c" }}>Details:</div>
                          <div style={{ flex: 1, whiteSpace: "pre-wrap" }}>
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
        )}
      </Card>

      {/* Modal hủy đơn thuốc */}
      <ConfirmCancelPrescriptionModal
        visible={cancelModalVisible}
        prescriptionId={id}
        onCancel={() => setCancelModalVisible(false)}
        onConfirm={handleCancel}
      />
    </div>
  );
};
