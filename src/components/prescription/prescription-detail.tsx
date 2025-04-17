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
import { toast } from "react-toastify";
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
} from "@ant-design/icons";

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
        toast.error(response.message || "Failed to load prescription details");
      }
    } catch (error) {
      console.error("Error fetching prescription details:", error);
      toast.error("Failed to load prescription details");
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
        toast.error(response.message || "Failed to load prescription history");
      }
    } catch (error) {
      console.error("Error fetching prescription history:", error);
      toast.error("Failed to load prescription history");
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
      toast.error("Failed to load drugs");
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
      await exportPrescriptionToPDF(id);
      toast.success("PDF exported successfully");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Failed to export PDF");
    }
  };

  const handleCancel = async (reason: string) => {
    if (!id) return;
    try {
      const response = await cancelPrescription(id, reason);
      if (response.success) {
        toast.success("Prescription cancelled successfully");
        fetchPrescription();
        fetchHistories();
      } else {
        toast.error(response.message || "Failed to cancel prescription");
      }
    } catch (error) {
      console.error("Error cancelling prescription:", error);
      toast.error("Failed to cancel prescription");
    }
  };

  const handleSoftDelete = async () => {
    if (!id) return;
    try {
      const response = await softDeletePrescriptions([id]);
      if (response.success) {
        toast.success("Prescription soft deleted successfully");
        fetchPrescription();
        fetchHistories();
      } else {
        toast.error(response.message || "Failed to soft delete prescription");
      }
    } catch (error) {
      console.error("Error soft deleting prescription:", error);
      toast.error("Failed to soft delete prescription");
    }
  };

  const handleRestore = async () => {
    if (!id) return;
    try {
      const response = await restoreSoftDeletedPrescriptions([id]);
      if (response.success) {
        toast.success("Prescription restored successfully");
        fetchPrescription();
        fetchHistories();
      } else {
        toast.error(response.message || "Failed to restore prescription");
      }
    } catch (error) {
      console.error("Error restoring prescription:", error);
      toast.error("Failed to restore prescription");
    }
  };

  const handleUpdate = async () => {
    try {
      const values = await form.validateFields();
      setEditLoading(true);

      const requestData: PrescriptionUpdateRequestDTO = {
        prescriptionDetails: values.prescriptionDetails.map(
          (detail: any): PrescriptionDetailUpdateRequestDTO => ({
            id: detail.id,
            dosage: detail.dosage,
            quantity: detail.quantity,
            instructions: detail.instructions,
          })
        ),
      };

      const response = await updatePrescription(id, requestData);

      if (response.success) {
        toast.success("Prescription updated successfully");
        setIsEditing(false);
        fetchPrescription();
        fetchHistories();
      } else {
        toast.error(response.message || "Failed to update prescription");
      }
    } catch (error) {
      console.error("Form validation error:", error);
      toast.error("Please check the form for errors");
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

  const renderActionButtons = () => {
    if (!prescription) return null;

    const canEdit = prescription.status === "Dispensed";
    const canCancel = prescription.status === "Dispensed";
    const canSoftDelete =
      prescription.status === "Used" ||
      prescription.status === "UpdatedAndUsed";
    const canRestore = prescription.status === "SoftDeleted";

    return (
      <Space>
        <Button
          type="primary"
          icon={<FilePdfOutlined />}
          onClick={handleExportPDF}
        >
          Export to PDF
        </Button>

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
          <Popconfirm
            title="Cancel Prescription"
            description={
              <div>
                <p>Are you sure you want to cancel this prescription?</p>
                <TextArea
                  placeholder="Reason for cancellation"
                  id="cancel-reason"
                  rows={3}
                />
              </div>
            }
            okText="Yes"
            cancelText="No"
            onConfirm={() => {
              const reasonElement = document.getElementById(
                "cancel-reason"
              ) as HTMLTextAreaElement;
              if (reasonElement && reasonElement.value) {
                handleCancel(reasonElement.value);
              } else {
                toast.error("Please provide a reason for cancellation");
              }
            }}
          >
            <Button danger icon={<CloseCircleOutlined />}>
              Cancel Prescription
            </Button>
          </Popconfirm>
        )}

        {canSoftDelete && (
          <Popconfirm
            title="Soft Delete Prescription"
            description="Are you sure you want to soft delete this prescription?"
            okText="Yes"
            cancelText="No"
            onConfirm={handleSoftDelete}
          >
            <Button danger icon={<DeleteOutlined />}>
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
            onConfirm={handleRestore}
          >
            <Button icon={<UndoOutlined />}>Restore</Button>
          </Popconfirm>
        )}

        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push("/prescription/management")}
        >
          Back to List
        </Button>
      </Space>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <Skeleton active />
        <Divider />
        <Skeleton active />
        <Divider />
        <Skeleton active />
      </div>
    );
  }

  if (!prescription) {
    return (
      <div className="p-6">
        <Empty description="Prescription not found" />
        <div className="mt-4 text-center">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push("/prescription/management")}
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
          </Card>
        ))}
      </div>
    );
  };

  const renderPatientInfo = () => {
    if (!prescription || !prescription.healthCheckResult) return null;

    const { healthCheckResult } = prescription;
    const user = healthCheckResult?.user;

    return (
      <Card title="Patient Information" className="detail-card">
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Text strong>Patient Name:</Text>{" "}
            <Text>{user?.fullName || "N/A"}</Text>
          </Col>
          <Col span={12}>
            <Text strong>Gender:</Text> <Text>{user?.gender || "N/A"}</Text>
          </Col>
          <Col span={12}>
            <Text strong>Date of Birth:</Text>{" "}
            <Text>
              {user?.dob ? moment(user.dob).format("DD/MM/YYYY") : "N/A"}
            </Text>
          </Col>
          <Col span={12}>
            <Text strong>Phone:</Text> <Text>{user?.phone || "N/A"}</Text>
          </Col>
          <Col span={12}>
            <Text strong>Address:</Text> <Text>{user?.address || "N/A"}</Text>
          </Col>
          <Col span={12}>
            <Text strong>Email:</Text> <Text>{user?.email || "N/A"}</Text>
          </Col>
        </Row>
      </Card>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <Title level={2}>Prescription Details</Title>
          <div>{renderActionButtons()}</div>
        </div>

        <Card>
          <Descriptions
            title="Basic Information"
            bordered
            column={{ xxl: 4, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}
          >
            <Descriptions.Item label="Prescription Code">
              {prescription.prescriptionCode}
            </Descriptions.Item>
            <Descriptions.Item label="Health Check Code">
              {prescription?.healthCheckResult ? (
                <Button
                  type="link"
                  onClick={() =>
                    router.push(
                      `/health-check-result/${prescription?.healthCheckResult?.id}`
                    )
                  }
                >
                  {prescription?.healthCheckResult?.healthCheckResultCode}
                </Button>
              ) : (
                "N/A"
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Prescription Date">
              {formatDate(prescription.prescriptionDate)}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={getStatusColor(prescription.status)}>
                {prescription.status}
              </Tag>
            </Descriptions.Item>

            <Descriptions.Item label="Patient" span={2}>
              {prescription?.healthCheckResult?.user ? (
                <>
                  <div>
                    <strong>
                      {prescription?.healthCheckResult?.user.fullName}
                    </strong>
                  </div>
                  <div>{prescription?.healthCheckResult?.user.email}</div>
                  {prescription?.healthCheckResult?.user.phone && (
                    <div>
                      Phone: {prescription?.healthCheckResult?.user.phone}
                    </div>
                  )}
                  {prescription?.healthCheckResult?.user.gender && (
                    <div>
                      Gender: {prescription?.healthCheckResult?.user.gender}
                    </div>
                  )}
                </>
              ) : (
                "N/A"
              )}
            </Descriptions.Item>

            <Descriptions.Item label="Healthcare Staff" span={2}>
              {prescription.staff ? (
                <>
                  <div>
                    <strong>{prescription.staff.fullName}</strong>
                  </div>
                  <div>{prescription.staff.email}</div>
                </>
              ) : (
                "N/A"
              )}
            </Descriptions.Item>

            <Descriptions.Item label="Created At">
              {formatDateTime(prescription.createdAt)}
            </Descriptions.Item>
            <Descriptions.Item label="Updated At">
              {formatDateTime(prescription.updatedAt) || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Updated By" span={2}>
              {prescription.updatedBy ? (
                <>
                  <div>
                    <strong>{prescription.updatedBy.fullName}</strong>
                  </div>
                  <div>{prescription.updatedBy.email}</div>
                </>
              ) : (
                "N/A"
              )}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </div>

      <Divider orientation="left">Medications</Divider>

      <div className="mb-6">{renderPrescriptionDetails()}</div>

      <Divider orientation="left">Prescription History</Divider>

      <div className="mb-6">
        {historiesLoading ? (
          <Skeleton active />
        ) : histories.length === 0 ? (
          <Empty description="No history records found" />
        ) : (
          <Timeline mode="left">
            {histories.map((history) => (
              <Timeline.Item
                key={history.id}
                color={getActionColor(history.action)}
                label={formatDateTime(history.actionDate)}
              >
                <Card size="small">
                  <div>
                    <strong>Action:</strong> {history.action}
                  </div>
                  {history.performedBy && (
                    <div>
                      <strong>Performed By:</strong>{" "}
                      {history.performedBy.fullName} (
                      {history.performedBy.email})
                    </div>
                  )}
                  {history.previousStatus && (
                    <div>
                      <strong>Previous Status:</strong>{" "}
                      <Tag color={getStatusColor(history.previousStatus)}>
                        {history.previousStatus}
                      </Tag>
                    </div>
                  )}
                  {history.newStatus && (
                    <div>
                      <strong>New Status:</strong>{" "}
                      <Tag color={getStatusColor(history.newStatus)}>
                        {history.newStatus}
                      </Tag>
                    </div>
                  )}
                  {history.changeDetails && (
                    <div>
                      <strong>Change Details:</strong> {history.changeDetails}
                    </div>
                  )}
                </Card>
              </Timeline.Item>
            ))}
          </Timeline>
        )}
      </div>
    </div>
  );
};
