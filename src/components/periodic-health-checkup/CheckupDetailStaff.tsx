import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  Typography,
  Tag,
  Button,
  Space,
  Spin,
  Row,
  Col,
  Descriptions,
  Divider,
  Alert,
  message,
  Tooltip,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Tabs,
  Switch,
  Badge,
} from "antd";
import { 
  ArrowLeftOutlined,
  LinkOutlined, 
  InfoCircleOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  MedicineBoxOutlined,
  CalendarOutlined,
  EyeOutlined,
  HeartOutlined,
  SkinOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useRouter } from "next/router";
import { getStaffHealthCheckupById, PeriodicHealthCheckupsDetailsStaffResponseDTO, updateStaffHealthCheckup } from "@/api/periodic-health-checkup-staff-api";
import Cookies from "js-cookie";

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;

interface CheckupDetailStaffProps {
  id: string;
}

// Utility functions
const formatDate = (datetime?: string) => (datetime ? dayjs(datetime).format("DD/MM/YYYY") : "N/A");
const formatDateTime = (datetime?: string) => (datetime ? dayjs(datetime).format("DD/MM/YYYY HH:mm") : "N/A");
const formatBoolean = (value?: boolean) => (value === undefined ? "N/A" : value ? "Positive" : "Negative");

const getStatusColor = (status?: string) => {
  switch (status?.toLowerCase()) {
    case "active": return "green";
    case "inactive": return "red";
    default: return "default";
  }
};

const getBloodGlucoseStatus = (value?: number) => {
  if (value === undefined) return { color: "gray", label: "N/A", tooltip: "No data available" };
  if (value < 3.9) return { color: "red", label: "Hypoglycemia", tooltip: "Below normal range (< 3.9 mmol/L)" };
  if (value <= 5.6) return { color: "green", label: "Normal", tooltip: "Normal range (3.9-5.6 mmol/L)" };
  if (value <= 6.9) return { color: "orange", label: "Prediabetes", tooltip: "Prediabetes range (5.7-6.9 mmol/L)" };
  return { color: "red", label: "Diabetes", tooltip: "Above normal range (> 6.9 mmol/L)" };
};

const getCholesterolStatus = (value?: number) => {
  if (value === undefined) return { color: "gray", label: "N/A", tooltip: "No data available" };
  if (value < 200) return { color: "green", label: "Desirable", tooltip: "Optimal level (< 200 mg/dL)" };
  if (value <= 239) return { color: "orange", label: "Borderline", tooltip: "Borderline high (200-239 mg/dL)" };
  return { color: "red", label: "High", tooltip: "High risk (> 239 mg/dL)" };
};

const getExamStatus = (status?: string) => {
  if (!status) return { color: "gray", label: "Not Examined", tooltip: "No examination recorded", original: "N/A" };
  const normalized = status.toLowerCase();
  const isNormal = normalized.includes("normal") || normalized.includes("no abnormalities") || normalized.includes("bình thường");
  return {
    color: isNormal ? "green" : "red",
    label: isNormal ? "Normal" : "Abnormal",
    tooltip: isNormal ? "No issues detected" : "Abnormalities detected",
    original: status // Preserve original text
  };
};

// New utility function to normalize and convert Rh type to symbols
const formatRhType = (rhtype?: string): string => {
  if (!rhtype) return ""; // Return empty string if undefined or null

  const normalized = rhtype.toLowerCase().trim();

  // Positive variations
  if (["duong", "dương", "positive","Positive",  "duong Duong", "dương Dương"].includes(normalized)) {
    return "+";
  }
  // Negative variations
  if (["am", "âm", "negative","Negative", "am Am", "âm Âm"].includes(normalized)) {
    return "-";
  }

  // If already a symbol, return it as is
  if (["+", "-"].includes(normalized)) {
    return normalized;
  }

  // Fallback: return the original value if no match (could log this for debugging)
  console.warn(`Unknown Rh type value: ${rhtype}`);
  return rhtype;
};

// Add this after formatRhType
const parseBloodTypeAndRh = (bloodType?: string, rhtype?: string): { type: string; rh: string } => {
  if (!bloodType && !rhtype) {
    return { type: "Unknown", rh: "" };
  }
  if (rhtype) {
    return {
      type: bloodType || "Unknown",
      rh: formatRhType(rhtype),
    };
  }
  if (bloodType) {
    const parts = bloodType.split(" ");
    if (parts.length > 1) {
      const type = parts[0];
      const rhPart = parts.slice(1).join(" ");
      return {
        type,
        rh: formatRhType(rhPart),
      };
    }
    return {
      type: bloodType,
      rh: "",
    };
  }
  return { type: "Unknown", rh: "" };
};

const CheckupDetailStaff: React.FC<CheckupDetailStaffProps> = ({ id }) => {
  const router = useRouter();
  const [checkup, setCheckup] = useState<PeriodicHealthCheckupsDetailsStaffResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [messageApi, contextHolder] = message.useMessage();
  const [isEditing, setIsEditing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("1");
  const [form] = Form.useForm();

  const validationRules = useMemo(() => ({
    required: { required: true, message: "Required" },
    numberPositive: { type: "number" as const, min: 0, message: "Must be positive" },
    url: { type: "url" as const, message: "Enter a valid URL" },
  }), []);

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

  const fetchCheckupDetails = async () => {
    try {
      setLoading(true);
      const token = Cookies.get("token");
      if (!token) throw new Error("No authentication token found");

      const response = await getStaffHealthCheckupById(id, token);
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

  useEffect(() => {
    if (isEditing && checkup) {
      // Set up form fields with checkup data
      form.setFieldsValue({
        // Basic info
        status: checkup.status,
        hospitalName: checkup.hospitalName,
        reportIssuanceDate: checkup.reportIssuanceDate ? dayjs(checkup.reportIssuanceDate) : null,
        hospitalReportUrl: checkup.hospitalReportUrl,
        
        // Blood tests
        completeBloodCount: checkup.completeBloodCount,
        completeUrinalysis: checkup.completeUrinalysis,
        bloodGlucose: checkup.bloodGlucose,
        hbA1c: checkup.hbA1c,
        triglycerides: checkup.triglycerides,
        cholesterol: checkup.cholesterol,
        hdl: checkup.hdl,
        ldl: checkup.ldl,
        sgot: checkup.sgot,
        sgpt: checkup.sgpt,
        ggt: checkup.ggt,
        urea: checkup.urea,
        creatinine: checkup.creatinine,
        hbsAg: checkup.hbsAg,
        hbsAb: checkup.hbsAb,
        hcvab: checkup.hcvab,
        antiHavigM: checkup.antiHavigM,
        hiv: checkup.hiv,
        serumIron: checkup.serumIron,
        thyroidT3: checkup.thyroidT3,
        thyroidFt4: checkup.thyroidFt4,
        thyroidTsh: checkup.thyroidTsh,
        bloodType: checkup.bloodType,
        rhType: checkup.rhType,
        totalCalcium: checkup.totalCalcium,
        uricAcid: checkup.uricAcid,
        liverAfp: checkup.liverAfp,
        prostatePsa: checkup.prostatePsa,
        colonCea: checkup.colonCea,
        stomachCa724: checkup.stomachCa724,
        pancreasCa199: checkup.pancreasCa199, 
        breastCa153: checkup.breastCa153,
        ovariesCa125: checkup.ovariesCa125,
        lungCyfra211: checkup.lungCyfra211,
        ferritin: checkup.ferritin,
        toxocaraCanis: checkup.toxocaraCanis,
        rf: checkup.rf,
        electrolytesNa: checkup.electrolytesNa,
        electrolytesK: checkup.electrolytesK,
        electrolytesCl: checkup.electrolytesCl,
        
        // Imaging & Exams
        generalExam: checkup.generalExam,
        eyeExam: checkup.eyeExam,
        dentalExam: checkup.dentalExam,
        entexam: checkup.entexam,
        gynecologicalExam: checkup.gynecologicalExam,
        dermatologyExam: checkup.dermatologyExam,
        abdominalUltrasound: checkup.abdominalUltrasound,
        thyroidUltrasound: checkup.thyroidUltrasound,
        breastUltrasound: checkup.breastUltrasound,
        ecg: checkup.ecg,
        chestXray: checkup.chestXray,
        lumbarSpineXray: checkup.lumbarSpineXray,
        cervicalSpineXray: checkup.cervicalSpineXray,
        dopplerHeart: checkup.dopplerHeart,
        carotidDoppler: checkup.carotidDoppler,
        transvaginalUltrasound: checkup.transvaginalUltrasound,
        vaginalWetMount: checkup.vaginalWetMount,
        cervicalCancerPap: checkup.cervicalCancerPap,
        refractiveError: checkup.refractiveError,
        boneDensityTscore: checkup.boneDensityTscore,
        echinococcus: checkup.echinococcus,
        
        // Summary
        conclusion: checkup.conclusion,
        recommendations: checkup.recommendations,
      });
    }
  }, [isEditing, checkup, form]);

  const handleSave = async () => {
    if (!checkup) return;

    try {
      const values = await form.validateFields();
      setSaveLoading(true);
      
      const token = Cookies.get("token");
      if (!token) throw new Error("No authentication token found");

      // Prepare update data
      const updatedData = {
        ...checkup,
        ...values,
        reportIssuanceDate: values.reportIssuanceDate ? values.reportIssuanceDate.toISOString() : undefined,
      };

      console.log("Sending update request with data:", updatedData);
      const response = await updateStaffHealthCheckup(checkup.id, updatedData, token);
      
      if (response.isSuccess) {
        messageApi.success("Staff health checkup updated successfully!");
        setIsEditing(false);
        fetchCheckupDetails(); // Refresh data
      } else {
        throw new Error(response.message || "Failed to update staff health checkup");
      }
    } catch (error: any) {
      messageApi.error(`Error: ${error.message}`);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleReset = () => {
    if (!checkup) return;
    
    messageApi.info("Form has been reset to original values");
    if (isEditing && checkup) {
      // Reset form to original values
      form.setFieldsValue({
        // Lặp lại đoạn code từ useEffect
        status: checkup.status,
        hospitalName: checkup.hospitalName,
        reportIssuanceDate: checkup.reportIssuanceDate ? dayjs(checkup.reportIssuanceDate) : null,
        hospitalReportUrl: checkup.hospitalReportUrl,
        
        // Blood tests
        completeBloodCount: checkup.completeBloodCount,
        completeUrinalysis: checkup.completeUrinalysis,
        bloodGlucose: checkup.bloodGlucose,
        hbA1c: checkup.hbA1c,
        triglycerides: checkup.triglycerides,
        cholesterol: checkup.cholesterol,
        hdl: checkup.hdl,
        ldl: checkup.ldl,
        sgot: checkup.sgot,
        sgpt: checkup.sgpt,
        ggt: checkup.ggt,
        urea: checkup.urea,
        creatinine: checkup.creatinine,
        hbsAg: checkup.hbsAg,
        hbsAb: checkup.hbsAb,
        hcvab: checkup.hcvab,
        antiHavigM: checkup.antiHavigM,
        hiv: checkup.hiv,
        serumIron: checkup.serumIron,
        thyroidT3: checkup.thyroidT3,
        thyroidFt4: checkup.thyroidFt4,
        thyroidTsh: checkup.thyroidTsh,
        bloodType: checkup.bloodType,
        rhType: checkup.rhType,
        totalCalcium: checkup.totalCalcium,
        uricAcid: checkup.uricAcid,
        liverAfp: checkup.liverAfp,
        prostatePsa: checkup.prostatePsa,
        colonCea: checkup.colonCea,
        stomachCa724: checkup.stomachCa724,
        pancreasCa199: checkup.pancreasCa199, 
        breastCa153: checkup.breastCa153,
        ovariesCa125: checkup.ovariesCa125,
        lungCyfra211: checkup.lungCyfra211,
        ferritin: checkup.ferritin,
        toxocaraCanis: checkup.toxocaraCanis,
        rf: checkup.rf,
        electrolytesNa: checkup.electrolytesNa,
        electrolytesK: checkup.electrolytesK,
        electrolytesCl: checkup.electrolytesCl,
        
        // Imaging & Exams
        generalExam: checkup.generalExam,
        eyeExam: checkup.eyeExam,
        dentalExam: checkup.dentalExam,
        entexam: checkup.entexam,
        gynecologicalExam: checkup.gynecologicalExam,
        dermatologyExam: checkup.dermatologyExam,
        abdominalUltrasound: checkup.abdominalUltrasound,
        thyroidUltrasound: checkup.thyroidUltrasound,
        breastUltrasound: checkup.breastUltrasound,
        ecg: checkup.ecg,
        chestXray: checkup.chestXray,
        lumbarSpineXray: checkup.lumbarSpineXray,
        cervicalSpineXray: checkup.cervicalSpineXray,
        dopplerHeart: checkup.dopplerHeart,
        carotidDoppler: checkup.carotidDoppler,
        transvaginalUltrasound: checkup.transvaginalUltrasound,
        vaginalWetMount: checkup.vaginalWetMount,
        cervicalCancerPap: checkup.cervicalCancerPap,
        refractiveError: checkup.refractiveError,
        boneDensityTscore: checkup.boneDensityTscore,
        echinococcus: checkup.echinococcus,
        
        // Summary
        conclusion: checkup.conclusion,
        recommendations: checkup.recommendations,
      });
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

  // Memoized status calculations
  const bloodGlucoseStatus = getBloodGlucoseStatus(checkup.bloodGlucose);
  const cholesterolStatus = getCholesterolStatus(checkup.cholesterol);
  const examStatuses = {
    general: getExamStatus(checkup.generalExam),
    eye: getExamStatus(checkup.eyeExam),
    dental: getExamStatus(checkup.dentalExam),
    ent: getExamStatus(checkup.entexam),
    dermatology: getExamStatus(checkup.dermatologyExam),
    gynecological: getExamStatus(checkup.gynecologicalExam),
  };

  return (
    <div className="p-4">
      {contextHolder}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push(checkup.status === "Inactive" ? "/periodic-health-checkup?tab=staff-inactive" : "/periodic-health-checkup?tab=staff")}
            style={{ marginRight: "8px" }}
          >
            Back
          </Button>
          <h3 className="text-xl font-bold">Staff Health Checkup Details</h3>
          <Tag color={getStatusColor(checkup.status)}>
            {checkup.status}
          </Tag>
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
                icon={<ReloadOutlined />} 
                onClick={handleReset}
                disabled={saveLoading}
              >
                Reset
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
              {checkup.hospitalReportUrl && (
                <Button
                  type="primary"
                  icon={<LinkOutlined />}
                  href={checkup.hospitalReportUrl}
                  target="_blank"
                >
                  View Full Report
                </Button>
              )}
            </Space>
          )}
        </div>
      </div>

      {isEditing ? (
        <Form
          form={form}
          layout="vertical"
        >
          <Tabs activeKey={activeTab} onChange={setActiveTab} type="card">
            <TabPane 
              tab={<span><InfoCircleOutlined /> Basic Info</span>}
              key="1"
            >
              <Card className="mb-4">
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="status"
                      label="Status"
                      rules={[validationRules.required]}
                    >
                      <Select>
                        <Select.Option value="Active">Active</Select.Option>
                        <Select.Option value="Inactive">Inactive</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="hospitalName"
                      label="Hospital Name"
                      rules={[validationRules.required]}
                    >
                      <Input placeholder="Enter hospital name" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="reportIssuanceDate"
                      label="Report Issuance Date"
                      rules={[validationRules.required]}
                    >
                      <DatePicker 
                        style={{ width: '100%' }} 
                        format="DD/MM/YYYY"
                        disabledDate={(current) => current && current > dayjs().endOf("day")}
                        suffixIcon={<CalendarOutlined />}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="hospitalReportUrl"
                      label="Hospital Report URL"
                      rules={[validationRules.url]}
                    >
                      <Input placeholder="https://example.com/report.pdf" />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </TabPane>
            
            <TabPane 
              tab={<span><HeartOutlined /> Blood Tests</span>}
              key="2"
            >
              <Card className="mb-4">
                <Title level={5}>General Blood Tests</Title>
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12}>
                    <Form.Item name="completeBloodCount" label="Complete Blood Count">
                      <Input placeholder="e.g., Normal" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name="completeUrinalysis" label="Complete Urinalysis">
                      <Input placeholder="e.g., Normal" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="bloodGlucose"
                      label={<Tooltip title="Normal: 3.9-5.6 mmol/L"><span>Blood Glucose (mmol/L) <InfoCircleOutlined /></span></Tooltip>}
                      rules={[validationRules.numberPositive]}
                    >
                      <InputNumber step="0.01" style={{ width: '100%' }} placeholder="e.g., 5.2" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="hbA1c"
                      label={<Tooltip title="Normal: 4-5.6%"><span>HbA1c (%) <InfoCircleOutlined /></span></Tooltip>}
                      rules={[validationRules.numberPositive]}
                    >
                      <InputNumber step="0.01" style={{ width: '100%' }} placeholder="e.g., 5.0" />
                    </Form.Item>
                  </Col>
                </Row>
                
                <Title level={5}>Lipid Profile</Title>
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="triglycerides"
                      label={<Tooltip title="Normal: < 150 mg/dL"><span>Triglycerides (mg/dL) <InfoCircleOutlined /></span></Tooltip>}
                      rules={[validationRules.numberPositive]}
                    >
                      <InputNumber step="0.01" style={{ width: '100%' }} placeholder="e.g., 120" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="cholesterol"
                      label={<Tooltip title="Normal: < 200 mg/dL"><span>Cholesterol (mg/dL) <InfoCircleOutlined /></span></Tooltip>}
                      rules={[validationRules.numberPositive]}
                    >
                      <InputNumber step="0.01" style={{ width: '100%' }} placeholder="e.g., 180" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="hdl"
                      label={<Tooltip title="Normal: > 40 mg/dL"><span>HDL (mg/dL) <InfoCircleOutlined /></span></Tooltip>}
                      rules={[validationRules.numberPositive]}
                    >
                      <InputNumber step="0.01" style={{ width: '100%' }} placeholder="e.g., 50" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="ldl"
                      label={<Tooltip title="Normal: < 100 mg/dL"><span>LDL (mg/dL) <InfoCircleOutlined /></span></Tooltip>}
                      rules={[validationRules.numberPositive]}
                    >
                      <InputNumber step="0.01" style={{ width: '100%' }} placeholder="e.g., 90" />
                    </Form.Item>
                  </Col>
                </Row>
                
                <Title level={5}>Liver & Kidney Function</Title>
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="sgot"
                      label={<Tooltip title="Normal: 10-40 U/L"><span>SGOT (U/L) <InfoCircleOutlined /></span></Tooltip>}
                      rules={[validationRules.numberPositive]}
                    >
                      <InputNumber step="0.01" style={{ width: '100%' }} placeholder="e.g., 25" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="sgpt"
                      label={<Tooltip title="Normal: 7-56 U/L"><span>SGPT (U/L) <InfoCircleOutlined /></span></Tooltip>}
                      rules={[validationRules.numberPositive]}
                    >
                      <InputNumber step="0.01" style={{ width: '100%' }} placeholder="e.g., 30" />
                    </Form.Item>
                  </Col>
                </Row>
                
                {/* Thêm các phần còn lại của Blood Tests ở đây */}
              </Card>
            </TabPane>
            
            <TabPane 
              tab={<span><EyeOutlined /> Imaging & Exams</span>}
              key="3"
            >
              <Card className="mb-4">
                <Title level={5}>Physical Examinations</Title>
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12}>
                    <Form.Item name="generalExam" label="General Exam">
                      <Input placeholder="e.g., Normal" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name="eyeExam" label="Eye Exam">
                      <Input placeholder="e.g., 20/20 vision" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name="dentalExam" label="Dental Exam">
                      <Input placeholder="e.g., No cavities" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name="entexam" label="ENT Exam">
                      <Input placeholder="e.g., Normal" />
                    </Form.Item>
                  </Col>
                </Row>
                
                {/* Thêm các phần còn lại của Imaging & Exams ở đây */}
              </Card>
            </TabPane>
            
            <TabPane 
              tab={<span><SkinOutlined /> Summary</span>}
              key="4"
            >
              <Card className="mb-4">
                <Form.Item
                  name="conclusion"
                  label="Medical Conclusion"
                >
                  <TextArea rows={4} placeholder="Enter medical conclusions" />
                </Form.Item>
                <Form.Item
                  name="recommendations"
                  label="Recommendations"
                >
                  <TextArea rows={4} placeholder="Enter recommendations" />
                </Form.Item>
              </Card>
            </TabPane>
          </Tabs>
        </Form>
      ) : (
        <>
          {/* View mode - Basic Information */}
          <Card size="small" className="mb-4">
            <Descriptions
              bordered
              column={{ xxl: 3, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
              size="small"
            >
              <Descriptions.Item label="Checkup ID">{checkup.id}</Descriptions.Item>
              <Descriptions.Item label="Periodic ID">{checkup.periodicHealthCheckUpId}</Descriptions.Item>
              <Descriptions.Item label="Hospital">{checkup.hospitalName || "N/A"}</Descriptions.Item>
              <Descriptions.Item label="Report Date">{formatDate(checkup.reportIssuanceDate)}</Descriptions.Item>
              <Descriptions.Item label="Created">{formatDateTime(checkup.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="Updated">{formatDateTime(checkup.updatedAt)}</Descriptions.Item>
              <Descriptions.Item label="Created By">{checkup.createdBy || "N/A"}</Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Blood Tests */}
          <Divider orientation="left">Blood Tests</Divider>
          <Card className="mb-4">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8}>
                <Text strong>Blood Type:</Text> 
                {(() => {
                  const { type, rh } = parseBloodTypeAndRh(checkup.bloodType, checkup.rhType);
                  return type === "Unknown" && !rh ? " N/A" : ` ${type}${rh ? " " + rh : ""}`;
                })()}
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Text strong>Cholesterol:</Text>
                <Tooltip title={cholesterolStatus.tooltip}>
                  <Tag color={cholesterolStatus.color}>
                    {checkup.cholesterol ? `${checkup.cholesterol} mg/dL (${cholesterolStatus.label})` : "N/A"}
                  </Tag>
                </Tooltip>
              </Col>
              <Col xs={24} sm={12} md={8}><Text strong>HbA1c:</Text> {checkup.hbA1c ? `${checkup.hbA1c}%` : "N/A"}</Col>
              <Col xs={24} sm={12} md={8}><Text strong>Complete Blood Count:</Text> {checkup.completeBloodCount || "N/A"}</Col>
              <Col xs={24} sm={12} md={8}><Text strong>Complete Urinalysis:</Text> {checkup.completeUrinalysis || "N/A"}</Col>
              <Col xs={24} sm={12} md={8}><Text strong>Uric Acid:</Text> {checkup.uricAcid ? `${checkup.uricAcid} mg/dL` : "N/A"}</Col>
              <Col xs={24} sm={12} md={8}><Text strong>Triglycerides:</Text> {checkup.triglycerides ? `${checkup.triglycerides} mg/dL` : "N/A"}</Col>
              <Col xs={24} sm={12} md={8}><Text strong>HDL:</Text> {checkup.hdl ? `${checkup.hdl} mg/dL` : "N/A"}</Col>
              <Col xs={24} sm={12} md={8}><Text strong>LDL:</Text> {checkup.ldl ? `${checkup.ldl} mg/dL` : "N/A"}</Col>
            </Row>
          </Card>

          {/* Liver & Thyroid Function */}
          <Divider orientation="left">Liver & Thyroid Function</Divider>
          <Card className="mb-4">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8}><Text strong>SGOT:</Text> {checkup.sgot ? `${checkup.sgot} U/L` : "N/A"}</Col>
              <Col xs={24} sm={12} md={8}><Text strong>SGPT:</Text> {checkup.sgpt ? `${checkup.sgpt} U/L` : "N/A"}</Col>
              <Col xs={24} sm={12} md={8}><Text strong>GGT:</Text> {checkup.ggt ? `${checkup.ggt} U/L` : "N/A"}</Col>
              <Col xs={24} sm={12} md={8}><Text strong>Urea:</Text> {checkup.urea ? `${checkup.urea} mg/dL` : "N/A"}</Col>
              <Col xs={24} sm={12} md={8}><Text strong>Creatinine:</Text> {checkup.creatinine ? `${checkup.creatinine} mg/dL` : "N/A"}</Col>
              <Col xs={24} sm={12} md={8}><Text strong>Serum Iron:</Text> {checkup.serumIron ? `${checkup.serumIron} µg/dL` : "N/A"}</Col>
              <Col xs={24} sm={12} md={8}><Text strong>Ferritin:</Text> {checkup.ferritin ? `${checkup.ferritin} ng/mL` : "N/A"}</Col>
              <Col xs={24} sm={12} md={8}><Text strong>Thyroid T3:</Text> {checkup.thyroidT3 ? `${checkup.thyroidT3} ng/mL` : "N/A"}</Col>
              <Col xs={24} sm={12} md={8}><Text strong>Thyroid FT4:</Text> {checkup.thyroidFt4 ? `${checkup.thyroidFt4} ng/dL` : "N/A"}</Col>
              <Col xs={24} sm={12} md={8}><Text strong>Thyroid TSH:</Text> {checkup.thyroidTsh ? `${checkup.thyroidTsh} µIU/mL` : "N/A"}</Col>
              <Col xs={24} sm={12} md={8}><Text strong>Liver AFP:</Text> {checkup.liverAfp ? `${checkup.liverAfp} ng/mL` : "N/A"}</Col>
            </Row>
          </Card>

          {/* Infectious Disease Markers */}
          <Divider orientation="left">Infectious Disease Markers</Divider>
          <Card className="mb-4">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8}><Text strong>HBsAg:</Text> {formatBoolean(checkup.hbsAg)}</Col>
              <Col xs={24} sm={12} md={8}><Text strong>HBsAb:</Text> {formatBoolean(checkup.hbsAb)}</Col>
              <Col xs={24} sm={12} md={8}><Text strong>HCVAb:</Text> {formatBoolean(checkup.hcvab)}</Col>
              <Col xs={24} sm={12} md={8}><Text strong>Anti-HAV IgM:</Text> {formatBoolean(checkup.antiHavigM)}</Col>
              <Col xs={24} sm={12} md={8}><Text strong>HIV:</Text> {formatBoolean(checkup.hiv)}</Col>
              <Col xs={24} sm={12} md={8}><Text strong>Toxocara Canis:</Text> {formatBoolean(checkup.toxocaraCanis)}</Col>
              <Col xs={24} sm={12} md={8}><Text strong>Echinococcus:</Text> {formatBoolean(checkup.echinococcus)}</Col>
            </Row>
          </Card>

          {/* Electrolytes */}
          <Divider orientation="left">Electrolytes</Divider>
          <Card className="mb-4">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8}><Text strong>Sodium (Na):</Text> {checkup.electrolytesNa ? `${checkup.electrolytesNa} mmol/L` : "N/A"}</Col>
              <Col xs={24} sm={12} md={8}><Text strong>Potassium (K):</Text> {checkup.electrolytesK ? `${checkup.electrolytesK} mmol/L` : "N/A"}</Col>
              <Col xs={24} sm={12} md={8}><Text strong>Chloride (Cl):</Text> {checkup.electrolytesCl ? `${checkup.electrolytesCl} mmol/L` : "N/A"}</Col>
              <Col xs={24} sm={12} md={8}><Text strong>Total Calcium:</Text> {checkup.totalCalcium ? `${checkup.totalCalcium} mmol/L` : "N/A"}</Col>
              <Col xs={24} sm={12} md={8}><Text strong>Rheumatoid Factor (RF):</Text> {checkup.rf ? `${checkup.rf} IU/mL` : "N/A"}</Col>
            </Row>
          </Card>

          {/* Tumor Markers */}
          <Divider orientation="left">Tumor Markers</Divider>
          <Card className="mb-4">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8}><Text strong>Prostate PSA:</Text> {checkup.prostatePsa ? `${checkup.prostatePsa} ng/mL` : "N/A"}</Col>
              <Col xs={24} sm={12} md={8}><Text strong>Colon CEA:</Text> {checkup.colonCea ? `${checkup.colonCea} ng/mL` : "N/A"}</Col>
              <Col xs={24} sm={12} md={8}><Text strong>Stomach CA 72-4:</Text> {checkup.stomachCa724 ? `${checkup.stomachCa724} U/mL` : "N/A"}</Col>
              <Col xs={24} sm={12} md={8}><Text strong>Pancreas CA 19-9:</Text> {checkup.pancreasCa199 ? `${checkup.pancreasCa199} U/mL` : "N/A"}</Col>
              <Col xs={24} sm={12} md={8}><Text strong>Breast CA 15-3:</Text> {checkup.breastCa153 ? `${checkup.breastCa153} U/mL` : "N/A"}</Col>
              <Col xs={24} sm={12} md={8}><Text strong>Ovaries CA 125:</Text> {checkup.ovariesCa125 ? `${checkup.ovariesCa125} U/mL` : "N/A"}</Col>
              <Col xs={24} sm={12} md={8}><Text strong>Lung CYFRA 21-1:</Text> {checkup.lungCyfra211 ? `${checkup.lungCyfra211} ng/mL` : "N/A"}</Col>
            </Row>
          </Card>

          {/* Specialist Examinations */}
          <Divider orientation="left">Specialist Examinations</Divider>
          <Card className="mb-4">
            <Row gutter={[16, 16]}>
              {Object.entries(examStatuses).map(([key, status]) => (
                <Col xs={24} sm={12} md={8} key={key}>
                  <Card size="small" className="exam-card">
                    <Space direction="vertical" size={4} style={{ width: "100%" }}>
                      <Space>
                        <Text strong>{key === "ent" ? "ENT" : key.charAt(0).toUpperCase() + key.slice(1)} Exam</Text>
                        <Tooltip title={status.tooltip}>
                          <Tag color={status.color}>{status.label}</Tag>
                        </Tooltip>
                      </Space>
                      <Text>{status.original}</Text>
                      {key === "eye" && checkup.refractiveError && (
                        <Text type="secondary">Refractive Error: {checkup.refractiveError}</Text>
                      )}
                      {key === "gynecological" && checkup.gynecologicalExam && (
                        <>
                          {checkup.vaginalWetMount && (
                            <Text type="secondary">Vaginal Wet Mount: {checkup.vaginalWetMount}</Text>
                          )}
                          {checkup.cervicalCancerPap && (
                            <Text type="secondary">Cervical Pap: {checkup.cervicalCancerPap}</Text>
                          )}
                        </>
                      )}
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>

          {/* Imaging & Diagnostics */}
          <Divider orientation="left">Imaging & Diagnostics</Divider>
          <Card className="mb-4">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8}><Text strong>ECG:</Text> {checkup.ecg || "N/A"}</Col>
              <Col xs={24} sm={12} md={8}><Text strong>Chest X-ray:</Text> {checkup.chestXray || "N/A"}</Col>
              <Col xs={24} sm={12} md={8}><Text strong>Lumbar Spine X-ray:</Text> {checkup.lumbarSpineXray || "N/A"}</Col>
              <Col xs={24} sm={12} md={8}><Text strong>Cervical Spine X-ray:</Text> {checkup.cervicalSpineXray || "N/A"}</Col>
              <Col xs={24} sm={12} md={8}><Text strong>Abdominal Ultrasound:</Text> {checkup.abdominalUltrasound || "N/A"}</Col>
              <Col xs={24} sm={12} md={8}><Text strong>Thyroid Ultrasound:</Text> {checkup.thyroidUltrasound || "N/A"}</Col>
              <Col xs={24} sm={12} md={8}><Text strong>Breast Ultrasound:</Text> {checkup.breastUltrasound || "N/A"}</Col>
              <Col xs={24} sm={12} md={8}><Text strong>Transvaginal Ultrasound:</Text> {checkup.transvaginalUltrasound || "N/A"}</Col>
              <Col xs={24} sm={12} md={8}><Text strong>Doppler Heart:</Text> {checkup.dopplerHeart || "N/A"}</Col>
              <Col xs={24} sm={12} md={8}><Text strong>Carotid Doppler:</Text> {checkup.carotidDoppler || "N/A"}</Col>
              <Col xs={24} sm={12} md={8}><Text strong>Bone Density T-Score:</Text> {checkup.boneDensityTscore ?? "N/A"}</Col>
            </Row>
          </Card>

          {/* Summary */}
          <Divider orientation="left">Summary</Divider>
          <Card className="mb-4">
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              <div>
                <Text strong>Conclusion:</Text>
                <div style={{ background: "#fafafa", padding: 8, borderRadius: 4, marginTop: 4 }}>
                  {checkup.conclusion || "No conclusion provided"}
                </div>
              </div>
              <div>
                <Text strong>Recommendations:</Text>
                <div style={{ background: "#fafafa", padding: 8, borderRadius: 4, marginTop: 4 }}>
                  {checkup.recommendations || "No recommendations provided"}
                </div>
              </div>
            </Space>
          </Card>
        </>
      )}

      <style jsx>{`
        .exam-card {
          background: #fff;
          border: 1px solid #e8e8e8;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          transition: all 0.2s;
        }
        .exam-card:hover {
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
};

export default CheckupDetailStaff; 