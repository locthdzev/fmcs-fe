import React, { useState, useEffect } from "react";
import {
  Card,
  Typography,
  Tag,
  Button,
  Space,
  Spin,
  Row,
  Col,
  Progress,
  Badge,
  Descriptions,
  Divider,
  Alert,
  message,
  Flex,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
} from "antd";
import { 
  ArrowLeftOutlined,
  EyeOutlined, 
  HeartOutlined, 
  SkinOutlined, 
  SmileOutlined, 
  BarChartOutlined,
  AlertOutlined,
  FilePdfOutlined,
  MedicineBoxOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useRouter } from "next/router";
import { getHealthCheckupById, PeriodicHealthCheckupsDetailsStudentResponseDTO, updateHealthCheckup, PeriodicHealthCheckupsDetailsStudentRequestDTO } from "@/api/periodic-health-checkup-student-api";
import Cookies from "js-cookie";

const { Title, Text } = Typography;

interface CheckupDetailStudentProps {
  id: string;
}

const formatDate = (datetime?: string) => (datetime ? dayjs(datetime).format("DD/MM/YYYY") : "N/A");
const formatDateTime = (datetime?: string) => (datetime ? dayjs(datetime).format("DD/MM/YYYY HH:mm") : "N/A");

const getStatusColor = (status?: string) => {
  switch (status?.toLowerCase()) {
    case "active": return "green";
    case "inactive": return "red";
    default: return "default";
  }
};

const getBmiCategory = (bmi?: number): { label: string; color: string } => {
  if (!bmi) return { label: "N/A", color: "gray" };
  if (bmi < 18.5) return { label: "Underweight", color: "orange" };
  if (bmi < 25) return { label: "Normal", color: "green" };
  if (bmi < 30) return { label: "Overweight", color: "gold" };
  return { label: "Obese", color: "red" };
};

const getPulseStatus = (pulse?: number): { percent: number; status: "success" | "normal" | "exception" } => {
  if (!pulse) return { percent: 0, status: "normal" };
  const percent = Math.min((pulse / 120) * 100, 100);
  return { percent, status: pulse < 60 || pulse > 100 ? "exception" : "success" };
};

const getExamStatus = (status?: string): { label: string; color: string } => {
  if (!status) return { label: "Not Examined", color: "gray" };
  const normalized = status.toLowerCase();
  if (normalized.includes("bình thường") || normalized.includes("normal")) {
    return { label: "Normal", color: "green" };
  }
  return { label: "Abnormal", color: "red" };
};

const getEyeScoreStatus = (score?: number): { percent: number; status: "success" | "exception" | "normal" } => {
  if (score === undefined) return { percent: 0, status: "normal" };
  const percent = (score / 10) * 100;
  return { percent, status: score < 8 ? "exception" : "success" };
};

const CheckupDetailStudent: React.FC<CheckupDetailStudentProps> = ({ id }) => {
  const router = useRouter();
  const [checkup, setCheckup] = useState<PeriodicHealthCheckupsDetailsStudentResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [messageApi, contextHolder] = message.useMessage();
  const [exportLoading, setExportLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (id) {
      fetchCheckupDetails();
    }
  }, [id]);

  // Check URL for edit parameter and enable edit mode if present
  useEffect(() => {
    const query = router.query;
    if (query.edit === 'true') {
      setIsEditing(true);
    }
  }, [router.query]);

  useEffect(() => {
    if (isEditing && checkup) {
      form.setFieldsValue({
        heightCm: checkup.heightCm,
        weightKg: checkup.weightKg,
        bmi: checkup.bmi,
        pulseRate: checkup.pulseRate,
        bloodPressure: checkup.bloodPressure,
        internalMedicineStatus: checkup.internalMedicineStatus,
        surgeryStatus: checkup.surgeryStatus,
        dermatologyStatus: checkup.dermatologyStatus,
        eyeRightScore: checkup.eyeRightScore,
        eyeLeftScore: checkup.eyeLeftScore,
        eyePathology: checkup.eyePathology,
        entStatus: checkup.entstatus, // Consistent naming
        dentalOralStatus: checkup.dentalOralStatus,
        conclusion: checkup.conclusion,
        recommendations: checkup.recommendations,
        nextCheckupDate: checkup.nextCheckupDate ? dayjs(checkup.nextCheckupDate) : null,
        status: checkup.status,
      });
    }
  }, [isEditing, checkup, form]);

  const calculateBMI = () => {
    const height = form.getFieldValue("heightCm");
    const weight = form.getFieldValue("weightKg");
    if (height && weight) {
      const heightInMeters = height / 100;
      const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(1);
      form.setFieldsValue({ bmi: parseFloat(bmi) });
    }
  };

  const handleSave = async () => {
    if (!checkup) return;

    try {
      const values = await form.validateFields();
      setSaveLoading(true);

      const token = Cookies.get("token");
      if (!token) throw new Error("No authentication token found");

      const requestData: PeriodicHealthCheckupsDetailsStudentRequestDTO = {
        periodicHealthCheckUpId: checkup.periodicHealthCheckUpId,
        heightCm: values.heightCm,
        weightKg: values.weightKg,
        bmi: values.bmi,
        pulseRate: values.pulseRate,
        bloodPressure: values.bloodPressure,
        internalMedicineStatus: values.internalMedicineStatus,
        surgeryStatus: values.surgeryStatus,
        dermatologyStatus: values.dermatologyStatus,
        eyeRightScore: values.eyeRightScore,
        eyeLeftScore: values.eyeLeftScore,
        eyePathology: values.eyePathology,
        entstatus: values.entStatus,
        dentalOralStatus: values.dentalOralStatus,
        classification: undefined,
        conclusion: values.conclusion,
        recommendations: values.recommendations,
        nextCheckupDate: values.nextCheckupDate ? values.nextCheckupDate.toISOString() : undefined,
        status: values.status,
        createdBy: checkup.createdBy,
        mssv: checkup.mssv,
      };

      const response = await updateHealthCheckup(checkup.id, requestData, token);
      if (response.isSuccess) {
        messageApi.success("Health checkup updated successfully!");
        setIsEditing(false);
        fetchCheckupDetails(); // Refresh the data
      } else {
        throw new Error(response.message || "Failed to update health checkup");
      }
    } catch (error: any) {
      messageApi.error(`Error: ${error.message}`);
    } finally {
      setSaveLoading(false);
    }
  };

  const fetchCheckupDetails = async () => {
    try {
      setLoading(true);
      const response = await getHealthCheckupById(id);
      if (response.isSuccess && response.data) {
        setCheckup(response.data);
      } else {
        messageApi.error({
          content: response.message || "Failed to fetch checkup details",
          duration: 5,
        });
      }
    } catch (error: any) {
      console.error("Error fetching checkup details:", error);
      messageApi.error({
        content: "Failed to fetch checkup details",
        duration: 5,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    // This would be implemented when the API is available
    try {
      setExportLoading(true);
      // Placeholder for future implementation
      messageApi.info("PDF export functionality will be implemented soon");
    } catch (error) {
      messageApi.error("Failed to export PDF");
    } finally {
      setExportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        {contextHolder}
        <Spin size="large" />
      </div>
    );
  }

  if (!checkup) {
    return (
      <div className="p-4">
        {contextHolder}
        <Title level={2}>Health Checkup Not Found</Title>
      </div>
    );
  }

  // Calculate all derived values
  const bmiInfo = getBmiCategory(checkup.bmi);
  const pulseInfo = getPulseStatus(checkup.pulseRate);
  const eyeRightStatus = getEyeScoreStatus(checkup.eyeRightScore);
  const eyeLeftStatus = getEyeScoreStatus(checkup.eyeLeftScore);
  const examStatuses = {
    internalMedicine: getExamStatus(checkup.internalMedicineStatus),
    surgery: getExamStatus(checkup.surgeryStatus),
    dermatology: getExamStatus(checkup.dermatologyStatus),
    ent: getExamStatus(checkup.entstatus),
    dentalOral: getExamStatus(checkup.dentalOralStatus),
  };

  return (
    <div className="p-4">
      {contextHolder}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push(checkup.status?.toLowerCase() === "inactive" ? "/periodic-health-checkup?tab=student-inactive" : "/periodic-health-checkup?tab=student")}
            style={{ marginRight: "8px" }}
          >
            Back
          </Button>
          <MedicineBoxOutlined style={{ fontSize: "24px" }} />
          <h3 className="text-xl font-bold">Student Health Checkup Details</h3>
        </div>
        <div>
          {isEditing ? (
            <Space>
              <Button 
                icon={<SaveOutlined />} 
                type="primary"
                onClick={handleSave}
                loading={saveLoading}
              >
                Save
              </Button>
              <Button 
                icon={<CloseOutlined />} 
                onClick={() => setIsEditing(false)}
                disabled={saveLoading}
              >
                Cancel
              </Button>
            </Space>
          ) : (
            <Space>
              <Button
                icon={<EditOutlined />}
                type="primary"
                onClick={() => setIsEditing(true)}
                style={{ marginRight: "8px" }}
              >
                Edit
              </Button>
              <Button
                icon={<FilePdfOutlined />}
                loading={exportLoading}
                onClick={handleExportPDF}
              >
                Export to PDF
              </Button>
            </Space>
          )}
        </div>
      </div>

      {isEditing ? (
        <Form
          form={form}
          layout="vertical"
          onValuesChange={(changedValues) => {
            if (changedValues.heightCm || changedValues.weightKg) calculateBMI();
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card title={<span style={{ fontWeight: "bold" }}>Basic Information</span>}>
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Text strong>Checkup ID:</Text> {checkup?.id}
                </Col>
                <Col span={24}>
                  <Text strong>Student ID (MSSV):</Text> {checkup?.mssv || "N/A"}
                </Col>
                <Col span={24}>
                  <Text strong>Created:</Text> {formatDateTime(checkup?.createdAt)}
                </Col>
                <Col span={24}>
                  <Text strong>Updated:</Text> {formatDateTime(checkup?.updatedAt)}
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="nextCheckupDate"
                    label="Next Checkup Date"
                  >
                    <DatePicker
                      style={{ width: "100%" }}
                      format="DD/MM/YYYY"
                      disabledDate={(current) => current && current < dayjs().endOf("day")}
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Text strong>Created By:</Text> {checkup?.createdBy || "N/A"}
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="status"
                    label="Status"
                    rules={[{ required: true, message: "Please select a status" }]}
                  >
                    <Select placeholder="Select status">
                      <Select.Option value="Active">Active</Select.Option>
                      <Select.Option value="Inactive">Inactive</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card title={<span style={{ fontWeight: "bold" }}>Vital Signs</span>}>
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Form.Item
                    name="heightCm"
                    label="Height (cm)"
                    rules={[
                      { required: true, message: "Please enter height" },
                      { type: "number", min: 50, max: 250, message: "Height must be between 50 and 250 cm" },
                    ]}
                  >
                    <InputNumber min={50} max={250} style={{ width: "100%" }} placeholder="e.g., 170" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="weightKg"
                    label="Weight (kg)"
                    rules={[
                      { required: true, message: "Please enter weight" },
                      { type: "number", min: 20, max: 200, message: "Weight must be between 20 and 200 kg" },
                    ]}
                  >
                    <InputNumber min={20} max={200} style={{ width: "100%" }} placeholder="e.g., 70" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="bmi" label="BMI">
                    <InputNumber disabled style={{ width: "100%" }} placeholder="Auto-calculated" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="pulseRate"
                    label="Pulse Rate (bpm)"
                    rules={[{ type: "number", min: 30, max: 200, message: "Pulse rate must be between 30 and 200 bpm" }]}
                  >
                    <InputNumber min={30} max={200} style={{ width: "100%" }} placeholder="e.g., 72" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="bloodPressure"
                    label="Blood Pressure (mmHg)"
                    rules={[
                      { required: true, message: "Please enter blood pressure" },
                      { pattern: /^\d{2,3}\/\d{2,3}$/, message: "Format: systolic/diastolic (e.g., 120/80)" },
                    ]}
                  >
                    <Input placeholder="e.g., 120/80" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </div>
          
          {isEditing ? (
            <Card title={<span style={{ fontWeight: "bold" }}>Specialist Examinations</span>} style={{ marginBottom: '16px' }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="eyeRightScore"
                    label="Right Eye Score"
                    rules={[{ type: "number", min: 0, max: 10, message: "Score must be between 0 and 10" }]}
                  >
                    <InputNumber min={0} max={10} style={{ width: "100%" }} placeholder="e.g., 10" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="eyeLeftScore"
                    label="Left Eye Score"
                    rules={[{ type: "number", min: 0, max: 10, message: "Score must be between 0 and 10" }]}
                  >
                    <InputNumber min={0} max={10} style={{ width: "100%" }} placeholder="e.g., 10" />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item name="eyePathology" label="Eye Pathology">
                    <Input placeholder="e.g., None" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="internalMedicineStatus" label="Internal Medicine">
                    <Input placeholder="e.g., Normal" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="surgeryStatus" label="Surgery">
                    <Input placeholder="e.g., No issues" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="dermatologyStatus" label="Dermatology">
                    <Input placeholder="e.g., Clear skin" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="entStatus" label="ENT">
                    <Input placeholder="e.g., Normal hearing" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="dentalOralStatus" label="Dental/Oral Status">
                    <Input placeholder="e.g., Healthy teeth" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          ) : (
            <Card title={<span style={{ fontWeight: "bold" }}>Specialist Examinations</span>}>
              <Row gutter={[16, 16]} className="exam-sections">
                <Col xs={24} md={12}>
                  <div className="exam-section">
                    <Text strong><EyeOutlined /> Eye Examination</Text>
                    <Tag
                      color={
                        checkup.eyePathology || eyeRightStatus.status === "exception" || eyeLeftStatus.status === "exception"
                          ? "red"
                          : "green"
                      }
                      style={{ marginLeft: 8 }}
                    >
                      {checkup.eyePathology || eyeRightStatus.status === "exception" || eyeLeftStatus.status === "exception" ? (
                        <><AlertOutlined /> Abnormal</>
                      ) : (
                        "Normal"
                      )}
                    </Tag>
                    <Row gutter={[8, 8]} style={{ marginTop: 8 }}>
                      <Col xs={12}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                          <Text>Right Eye:</Text>
                          {checkup.eyeRightScore !== undefined ? (
                            <Flex style={{ marginTop: '8px' }}>
                              <Progress 
                                type="circle" 
                                percent={eyeRightStatus.percent}
                                status={eyeRightStatus.status}
                                format={() => `${checkup.eyeRightScore}/10`}
                                size={60}
                              />
                            </Flex>
                          ) : (
                            "N/A"
                          )}
                        </div>
                      </Col>
                      <Col xs={12}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                          <Text>Left Eye:</Text>
                          {checkup.eyeLeftScore !== undefined ? (
                            <Flex style={{ marginTop: '8px' }}>
                              <Progress 
                                type="circle" 
                                percent={eyeLeftStatus.percent}
                                status={eyeLeftStatus.status}
                                format={() => `${checkup.eyeLeftScore}/10`}
                                size={60}
                              />
                            </Flex>
                          ) : (
                            "N/A"
                          )}
                        </div>
                      </Col>
                      <Col xs={24}>
                        <Text strong>Pathology:</Text>{" "}
                        <Tag color={checkup.eyePathology ? "red" : "green"}>
                          {checkup.eyePathology || "Normal"}
                        </Tag>
                      </Col>
                    </Row>
                  </div>
                </Col>

                <Col xs={24} md={12}>
                  <div className="exam-section">
                    <Text strong><HeartOutlined /> Internal Medicine</Text>
                    <Tag color={examStatuses.internalMedicine.color} style={{ marginLeft: 8 }}>
                      {examStatuses.internalMedicine.label}
                    </Tag>
                    <div style={{ marginTop: 8 }}>
                      <Text>{checkup.internalMedicineStatus || "No findings"}</Text>
                    </div>
                  </div>
                </Col>

                <Col xs={24} md={12}>
                  <div className="exam-section">
                    <Text strong><SkinOutlined /> Dermatology</Text>
                    <Tag color={examStatuses.dermatology.color} style={{ marginLeft: 8 }}>
                      {examStatuses.dermatology.label}
                    </Tag>
                    <div style={{ marginTop: 8 }}>
                      <Text>{checkup.dermatologyStatus || "No findings"}</Text>
                    </div>
                  </div>
                </Col>

                <Col xs={24} md={12}>
                  <div className="exam-section">
                    <Text strong>ENT</Text>
                    <Tag color={examStatuses.ent.color} style={{ marginLeft: 8 }}>
                      {examStatuses.ent.label}
                    </Tag>
                    <div style={{ marginTop: 8 }}>
                      <Text>{checkup.entstatus || "No findings"}</Text>
                    </div>
                  </div>
                </Col>

                <Col xs={24} md={12}>
                  <div className="exam-section">
                    <Text strong><SmileOutlined /> Dental/Oral</Text>
                    <Tag color={examStatuses.dentalOral.color} style={{ marginLeft: 8 }}>
                      {examStatuses.dentalOral.label}
                    </Tag>
                    <div style={{ marginTop: 8 }}>
                      <Text>{checkup.dentalOralStatus || "No findings"}</Text>
                    </div>
                  </div>
                </Col>

                <Col xs={24} md={12}>
                  <div className="exam-section">
                    <Text strong>Surgery</Text>
                    <Tag color={examStatuses.surgery.color} style={{ marginLeft: 8 }}>
                      {examStatuses.surgery.label}
                    </Tag>
                    <div style={{ marginTop: 8 }}>
                      <Text>{checkup.surgeryStatus || "No findings"}</Text>
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>
          )}
        </Form>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card
              title={<span style={{ fontWeight: "bold" }}>Basic Information</span>}
            >
              <Descriptions
                bordered
                column={{ xxl: 1, xl: 1, lg: 1, md: 1, sm: 1, xs: 1 }}
                size="small"
                style={{ marginBottom: 16 }}
              >
                <Descriptions.Item label="Checkup ID">{checkup.id}</Descriptions.Item>
                <Descriptions.Item label="Student ID (MSSV)">{checkup.mssv || "N/A"}</Descriptions.Item>
                <Descriptions.Item label="Created">{formatDateTime(checkup.createdAt)}</Descriptions.Item>
                <Descriptions.Item label="Updated">{formatDateTime(checkup.updatedAt)}</Descriptions.Item>
                <Descriptions.Item label="Next Checkup">
                  <Badge
                    status={checkup.nextCheckupDate && dayjs(checkup.nextCheckupDate).isBefore(dayjs()) ? "error" : "processing"}
                    text={formatDate(checkup.nextCheckupDate)}
                  />
                </Descriptions.Item>
                <Descriptions.Item label="Created By">{checkup.createdBy || "N/A"}</Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag color={getStatusColor(checkup.status)}>
                    {checkup.status}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card
              title={<span style={{ fontWeight: "bold" }}>Vital Signs</span>}
            >
              <Row gutter={[16, 16]} align="middle">
                <Col xs={24} sm={12}>
                  <Text strong>Height:</Text> {checkup.heightCm ? `${checkup.heightCm} cm` : "N/A"}
                </Col>
                <Col xs={24} sm={12}>
                  <Text strong>Weight:</Text> {checkup.weightKg ? `${checkup.weightKg} kg` : "N/A"}
                </Col>
                <Col xs={24} sm={12}>
                  <Text strong>BMI:</Text>{" "}
                  {checkup.bmi ? (
                    <Tag color={bmiInfo.color}>{`${checkup.bmi} (${bmiInfo.label})`}</Tag>
                  ) : (
                    "N/A"
                  )}
                </Col>
                <Col xs={24} sm={12}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Text strong>Pulse:</Text>
                    {checkup.pulseRate ? (
                      <Flex>
                        <Progress 
                          type="circle" 
                          percent={pulseInfo.percent} 
                          status={pulseInfo.status}
                          format={() => (
                            <span style={{ fontSize: '12px' }}>{checkup.pulseRate}<br/>bpm</span>
                          )}
                          size={60}
                        />
                      </Flex>
                    ) : (
                      "N/A"
                    )}
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <Text strong>Blood Pressure:</Text> {checkup.bloodPressure || "N/A"}
                </Col>
              </Row>
            </Card>
          </div>
          
          {isEditing ? (
            <Card title={<span style={{ fontWeight: "bold" }}>Summary</span>} style={{ marginTop: "16px" }}>
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Form.Item name="conclusion" label="Conclusion">
                    <Input.TextArea rows={4} placeholder="Overall health assessment" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="recommendations" label="Recommendations">
                    <Input.TextArea rows={4} placeholder="e.g., Annual checkup recommended" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          ) : (
            <Card 
              title={<span style={{ fontWeight: "bold" }}>Summary</span>} 
              style={{ marginTop: "16px" }}
            >
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Text strong>Conclusion:</Text>
                  <div style={{ marginTop: 8, background: "#fafafa", padding: 8, borderRadius: 4 }}>
                    {checkup.conclusion ? (
                      checkup.conclusion.split("\n").map((line, i) => (
                        <Text key={i} style={{ display: "block" }}>{line || "N/A"}</Text>
                      ))
                    ) : (
                      "N/A"
                    )}
                  </div>
                </Col>
                <Col span={24}>
                  <Text strong>Recommendations:</Text>
                  <div style={{ marginTop: 8, background: "#fafafa", padding: 8, borderRadius: 4 }}>
                    {checkup.recommendations ? (
                      checkup.recommendations.split("\n").map((line, i) => (
                        <Text key={i} style={{ display: "block" }}>{line || "N/A"}</Text>
                      ))
                    ) : (
                      "N/A"
                    )}
                  </div>
                </Col>
              </Row>
            </Card>
          )}
        </>
      )}

      <style jsx>{`
        .exam-section {
          background: #fff;
          padding: 12px;
          border-radius: 4px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          margin-bottom: 16px;
          height: 100%;
        }
        .exam-sections :global(.ant-col) {
          display: flex;
        }
        .exam-section :global(.ant-progress-circle) {
          margin-left: 8px;
          vertical-align: middle;
        }
        .exam-section :global(.ant-tag) {
          margin-left: 8px;
        }
      `}</style>
    </div>
  );
};

export default CheckupDetailStudent; 