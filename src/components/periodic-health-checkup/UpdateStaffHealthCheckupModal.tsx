import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Space,
  Row,
  Col,
  Typography,
  Spin,
  Card,
  Descriptions,
  Tabs,
  Tooltip,
  Divider,
  Badge,
  Switch,
} from "antd";
import '@ant-design/v5-patch-for-react-19';
import {
  MedicineBoxOutlined,
  CalendarOutlined,
  InfoCircleOutlined,
  SaveOutlined,
  ReloadOutlined,
  CloseOutlined,
  CheckCircleFilled,
  EyeOutlined,
  HeartOutlined,
  SkinOutlined,
} from "@ant-design/icons";
import { toast } from "react-toastify";
import dayjs, { Dayjs } from "dayjs";
import Cookies from "js-cookie";
import { updateStaffHealthCheckup, PeriodicHealthCheckupsDetailsStaffResponseDTO } from "@/api/periodic-health-checkup-staff-api";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface PeriodicHealthCheckupsDetailsStaffRequestDTO extends PeriodicHealthCheckupsDetailsStaffResponseDTO {}

interface FormValues extends Partial<PeriodicHealthCheckupsDetailsStaffResponseDTO> {
  reportIssuanceDate: string | undefined;
}

// Extend the DTO to include potential lowercase 'rhtype' from API
interface ExtendedCheckup extends PeriodicHealthCheckupsDetailsStaffResponseDTO {
    rhtype?: string; // Still optional for backwards compatibility
    rhType?: string; // Can now be "Positive", "Negative", "Weak D", etc.
  }

interface UpdateStaffHealthCheckupProps {
  visible: boolean;
  checkup: PeriodicHealthCheckupsDetailsStaffResponseDTO | null;
  onClose: () => void;
  onSuccess: (updatedCheckup?: PeriodicHealthCheckupsDetailsStaffResponseDTO) => void;
}

const UpdateStaffHealthCheckupModal: React.FC<UpdateStaffHealthCheckupProps> = ({
  visible,
  checkup,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [activeTab, setActiveTab] = useState("1");

  const initializeForm = useCallback(() => {
    if (!checkup) return;
    setInitializing(true);

    // Cast checkup to include potential 'rhtype'
    const extendedCheckup = checkup as ExtendedCheckup;
    // Use 'rhType' if present, otherwise fall back to 'rhtype'
    const rawRhType = extendedCheckup.rhType ?? extendedCheckup.rhtype;

    const initialValues = {
        ...checkup,
        reportIssuanceDate: checkup.reportIssuanceDate ? checkup.reportIssuanceDate : undefined,
        rhType: checkup.rhType ?? (checkup as ExtendedCheckup).rhtype, // Use as-is without transformation
      };
    console.log("Initializing form with:", initialValues);
    console.log("Raw rhType:", rawRhType, "Transformed rhType:", initialValues.rhType);
    form.setFieldsValue({
      ...initialValues,
      reportIssuanceDate: checkup.reportIssuanceDate ? dayjs(checkup.reportIssuanceDate) : undefined,
    });
    console.log("Form rhType after set:", form.getFieldValue("rhType"));
    setInitializing(false);
  }, [checkup, form]);

  useEffect(() => {
    if (visible && checkup) {
      console.log("Checkup data received:", checkup);
      initializeForm();
    }
    return () => {
      if (!visible) {
        form.resetFields();
        setActiveTab("1");
      }
    };
  }, [visible, checkup, form, initializeForm]);

  const handleSubmit = async (values: FormValues) => {
    console.log("handleSubmit triggered with values:", values);
    Modal.confirm({
      title: "Confirm Update",
      content: "Are you sure you want to update this health checkup record?",
      async onOk() {
        setLoading(true);
        try {
          const token = Cookies.get("token");
          if (!token) throw new Error("Authentication required. Please log in again.");
          if (!checkup?.id) throw new Error("Checkup ID is missing");

          const reportIssuanceDate = dayjs.isDayjs(values.reportIssuanceDate)
            ? (values.reportIssuanceDate as Dayjs).format("YYYY-MM-DD")
            : values.reportIssuanceDate || checkup.reportIssuanceDate;

          const requestData: PeriodicHealthCheckupsDetailsStaffRequestDTO = {
            ...checkup,
            ...values,
            reportIssuanceDate,
            periodicHealthCheckUpId: checkup.periodicHealthCheckUpId,
          };

          console.log("Sending update request with data:", requestData);
          const response = await updateStaffHealthCheckup(checkup.id, requestData, token);

          if (!response.isSuccess || !response.data) {
            throw new Error(response.message || "Failed to update health checkup");
          }

          toast.success("Health checkup updated successfully!");
          onSuccess(response.data);
          onClose();
        } catch (error: any) {
          toast.error(`Error: ${error.message || "An unexpected error occurred"}`);
          console.error("Update error:", error);
        } finally {
          setLoading(false);
        }
      },
      onCancel() {
        console.log("Update cancelled");
      },
    });
  };

  const handleReset = () => {
    Modal.confirm({
      title: "Reset Form",
      content: "Are you sure you want to reset all fields to their original values?",
      onOk: () => {
        initializeForm();
        toast.info("Form reset to original values");
      },
    });
  };

  const onFinishFailed = (errorInfo: any) => {
    console.log("Form submission failed:", errorInfo);
    toast.error("Please fill in all required fields correctly.");
  };

  const validationRules = useMemo(() => ({
    required: { required: true, message: "Required" },
    numberPositive: { type: "number" as const, min: 0, message: "Must be positive" },
    url: { type: "url" as const, message: "Enter a valid URL" },
  }), []);

  const tabItems = useMemo(() => [
    {
      key: "1",
      label: <span><InfoCircleOutlined /> Basic Info</span>,
      children: (
        <Descriptions column={2} bordered size="middle" className="mb-6">
          <Descriptions.Item label="Status" span={1}>
            <Form.Item name="status" rules={[validationRules.required]}>
              <Select className="w-full">
                <Option value="Active">Active</Option>
                <Option value="Inactive">Inactive</Option>
              </Select>
            </Form.Item>
          </Descriptions.Item>
          <Descriptions.Item label="Hospital Name" span={1}>
            <Form.Item name="hospitalName" rules={[validationRules.required]}>
              <Input className="w-full" placeholder="Enter hospital name" />
            </Form.Item>
          </Descriptions.Item>
          <Descriptions.Item label="Report Date" span={2}>
            <Form.Item name="reportIssuanceDate" rules={[validationRules.required]}>
              <DatePicker
                className="w-full"
                format="DD/MM/YYYY"
                disabledDate={(current) => current && current > dayjs().endOf("day")}
                suffixIcon={<CalendarOutlined />}
              />
            </Form.Item>
          </Descriptions.Item>
          <Descriptions.Item label="Report URL" span={2}>
            <Form.Item name="hospitalReportUrl" rules={[validationRules.url]}>
              <Input placeholder="https://example.com/report.pdf" />
            </Form.Item>
          </Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: "2",
      label: <span><HeartOutlined /> Blood Tests</span>,
      children: (
        <div className="mb-6">
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
                <Input type="number" step="0.01" placeholder="e.g., 5.2" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="hbA1c"
                label={<Tooltip title="Normal: 4-5.6%"><span>HbA1c (%) <InfoCircleOutlined /></span></Tooltip>}
                rules={[validationRules.numberPositive]}
              >
                <Input type="number" step="0.01" placeholder="e.g., 5.0" />
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
                <Input type="number" step="0.01" placeholder="e.g., 120" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="cholesterol"
                label={<Tooltip title="Normal: < 200 mg/dL"><span>Cholesterol (mg/dL) <InfoCircleOutlined /></span></Tooltip>}
                rules={[validationRules.numberPositive]}
              >
                <Input type="number" step="0.01" placeholder="e.g., 180" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="hdl"
                label={<Tooltip title="Normal: > 40 mg/dL"><span>HDL (mg/dL) <InfoCircleOutlined /></span></Tooltip>}
                rules={[validationRules.numberPositive]}
              >
                <Input type="number" step="0.01" placeholder="e.g., 50" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="ldl"
                label={<Tooltip title="Normal: < 100 mg/dL"><span>LDL (mg/dL) <InfoCircleOutlined /></span></Tooltip>}
                rules={[validationRules.numberPositive]}
              >
                <Input type="number" step="0.01" placeholder="e.g., 90" />
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
                <Input type="number" step="0.01" placeholder="e.g., 25" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="sgpt"
                label={<Tooltip title="Normal: 7-56 U/L"><span>SGPT (U/L) <InfoCircleOutlined /></span></Tooltip>}
                rules={[validationRules.numberPositive]}
              >
                <Input type="number" step="0.01" placeholder="e.g., 30" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="ggt"
                label={<Tooltip title="Normal: 9-48 U/L"><span>GGT (U/L) <InfoCircleOutlined /></span></Tooltip>}
                rules={[validationRules.numberPositive]}
              >
                <Input type="number" step="0.01" placeholder="e.g., 20" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="urea"
                label={<Tooltip title="Normal: 10-50 mg/dL"><span>Urea (mg/dL) <InfoCircleOutlined /></span></Tooltip>}
                rules={[validationRules.numberPositive]}
              >
                <Input type="number" step="0.01" placeholder="e.g., 30" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="creatinine"
                label={<Tooltip title="Normal: 0.6-1.2 mg/dL"><span>Creatinine (mg/dL) <InfoCircleOutlined /></span></Tooltip>}
                rules={[validationRules.numberPositive]}
              >
                <Input type="number" step="0.01" placeholder="e.g., 0.9" />
              </Form.Item>
            </Col>
          </Row>

          <Title level={5}>Infectious Diseases</Title>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item name="hbsAg" label="HBsAg" valuePropName="checked">
                <Switch checkedChildren="Positive" unCheckedChildren="Negative" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="hbsAb" label="HBsAb" valuePropName="checked">
                <Switch checkedChildren="Positive" unCheckedChildren="Negative" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="hcvab" label="HCVAb" valuePropName="checked">
                <Switch checkedChildren="Positive" unCheckedChildren="Negative" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="antiHavigM" label="Anti-HAV IgM" valuePropName="checked">
                <Switch checkedChildren="Positive" unCheckedChildren="Negative" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="hiv" label="HIV" valuePropName="checked">
                <Switch checkedChildren="Positive" unCheckedChildren="Negative" />
              </Form.Item>
            </Col>
          </Row>

          <Title level={5}>Other Tests</Title>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="serumIron"
                label={<Tooltip title="Normal: 60-170 µg/dL"><span>Serum Iron (µg/dL) <InfoCircleOutlined /></span></Tooltip>}
                rules={[validationRules.numberPositive]}
              >
                <Input type="number" step="0.01" placeholder="e.g., 100" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="thyroidT3"
                label={<Tooltip title="Normal: 0.8-2.0 ng/mL"><span>Thyroid T3 (ng/mL) <InfoCircleOutlined /></span></Tooltip>}
                rules={[validationRules.numberPositive]}
              >
                <Input type="number" step="0.01" placeholder="e.g., 1.5" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="thyroidFt4"
                label={<Tooltip title="Normal: 0.9-1.7 ng/dL"><span>Thyroid FT4 (ng/dL) <InfoCircleOutlined /></span></Tooltip>}
                rules={[validationRules.numberPositive]}
              >
                <Input type="number" step="0.01" placeholder="e.g., 1.2" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="thyroidTsh"
                label={<Tooltip title="Normal: 0.4-4.0 µIU/mL"><span>Thyroid TSH (µIU/mL) <InfoCircleOutlined /></span></Tooltip>}
                rules={[validationRules.numberPositive]}
              >
                <Input type="number" step="0.01" placeholder="e.g., 2.5" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="bloodType" label="Blood Type">
                <Select placeholder="Select blood type">
                  <Option value="A">A</Option>
                  <Option value="B">B</Option>
                  <Option value="AB">AB</Option>
                  <Option value="O">O</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
                <Form.Item 
                    name="rhType" 
                    label={
                    <Tooltip title="Common types: Positive (+), Negative (-), or specific variants">
                        <span>Rh Type <InfoCircleOutlined /></span>
                    </Tooltip>
                    }
                >
                    <Input 
                    placeholder="e.g., Positive, Negative, Weak D" 
                    maxLength={50}
                    />
                </Form.Item>
                </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="totalCalcium"
                label={<Tooltip title="Normal: 8.5-10.2 mmol/L"><span>Total Calcium (mmol/L) <InfoCircleOutlined /></span></Tooltip>}
                rules={[validationRules.numberPositive]}
              >
                <Input type="number" step="0.01" placeholder="e.g., 9.5" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="uricAcid"
                label={<Tooltip title="Normal: 3.4-7.0 mg/dL"><span>Uric Acid (mg/dL) <InfoCircleOutlined /></span></Tooltip>}
                rules={[validationRules.numberPositive]}
              >
                <Input type="number" step="0.01" placeholder="e.g., 5.0" />
              </Form.Item>
            </Col>
          </Row>

          <Title level={5}>Tumor Markers</Title>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="liverAfp"
                label={<Tooltip title="Normal: < 10 ng/mL"><span>Liver AFP (ng/mL) <InfoCircleOutlined /></span></Tooltip>}
                rules={[validationRules.numberPositive]}
              >
                <Input type="number" step="0.01" placeholder="e.g., 5" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="prostatePsa"
                label={<Tooltip title="Normal: < 4 ng/mL"><span>Prostate PSA (ng/mL) <InfoCircleOutlined /></span></Tooltip>}
                rules={[validationRules.numberPositive]}
              >
                <Input type="number" step="0.01" placeholder="e.g., 2" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="colonCea"
                label={<Tooltip title="Normal: < 5 ng/mL"><span>Colon CEA (ng/mL) <InfoCircleOutlined /></span></Tooltip>}
                rules={[validationRules.numberPositive]}
              >
                <Input type="number" step="0.01" placeholder="e.g., 3" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="stomachCa724"
                label={<Tooltip title="Normal: < 6.9 U/mL"><span>Stomach CA 72-4 (U/mL) <InfoCircleOutlined /></span></Tooltip>}
                rules={[validationRules.numberPositive]}
              >
                <Input type="number" step="0.01" placeholder="e.g., 4" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="pancreasCa199"
                label={<Tooltip title="Normal: < 37 U/mL"><span>Pancreas CA 19-9 (U/mL) <InfoCircleOutlined /></span></Tooltip>}
                rules={[validationRules.numberPositive]}
              >
                <Input type="number" step="0.01" placeholder="e.g., 20" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="breastCa153"
                label={<Tooltip title="Normal: < 25 U/mL"><span>Breast CA 15-3 (U/mL) <InfoCircleOutlined /></span></Tooltip>}
                rules={[validationRules.numberPositive]}
              >
                <Input type="number" step="0.01" placeholder="e.g., 15" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="ovariesCa125"
                label={<Tooltip title="Normal: < 35 U/mL"><span>Ovaries CA 125 (U/mL) <InfoCircleOutlined /></span></Tooltip>}
                rules={[validationRules.numberPositive]}
              >
                <Input type="number" step="0.01" placeholder="e.g., 20" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="lungCyfra211"
                label={<Tooltip title="Normal: < 3.3 ng/mL"><span>Lung CYFRA 21-1 (ng/mL) <InfoCircleOutlined /></span></Tooltip>}
                rules={[validationRules.numberPositive]}
              >
                <Input type="number" step="0.01" placeholder="e.g., 2" />
              </Form.Item>
            </Col>
          </Row>

          <Title level={5}>Additional Markers</Title>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="ferritin"
                label={<Tooltip title="Normal: 20-250 ng/mL"><span>Ferritin (ng/mL) <InfoCircleOutlined /></span></Tooltip>}
                rules={[validationRules.numberPositive]}
              >
                <Input type="number" step="0.01" placeholder="e.g., 100" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="toxocaraCanis" label="Toxocara Canis" valuePropName="checked">
                <Switch checkedChildren="Positive" unCheckedChildren="Negative" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="rf"
                label={<Tooltip title="Normal: < 14 IU/mL"><span>Rheumatoid Factor (IU/mL) <InfoCircleOutlined /></span></Tooltip>}
                rules={[validationRules.numberPositive]}
              >
                <Input type="number" step="0.01" placeholder="e.g., 10" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="electrolytesNa"
                label={<Tooltip title="Normal: 135-145 mmol/L"><span>Electrolytes Na (mmol/L) <InfoCircleOutlined /></span></Tooltip>}
                rules={[validationRules.numberPositive]}
              >
                <Input type="number" step="0.01" placeholder="e.g., 140" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="electrolytesK"
                label={<Tooltip title="Normal: 3.5-5.0 mmol/L"><span>Electrolytes K (mmol/L) <InfoCircleOutlined /></span></Tooltip>}
                rules={[validationRules.numberPositive]}
              >
                <Input type="number" step="0.01" placeholder="e.g., 4.0" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="electrolytesCl"
                label={<Tooltip title="Normal: 98-106 mmol/L"><span>Electrolytes Cl (mmol/L) <InfoCircleOutlined /></span></Tooltip>}
                rules={[validationRules.numberPositive]}
              >
                <Input type="number" step="0.01" placeholder="e.g., 100" />
              </Form.Item>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: "3",
      label: <span><EyeOutlined /> Imaging & Exams</span>,
      children: (
        <div className="mb-6">
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
            <Col xs={24} sm={12}>
              <Form.Item name="gynecologicalExam" label="Gynecological Exam">
                <Input placeholder="e.g., Normal" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="dermatologyExam" label="Dermatology Exam">
                <Input placeholder="e.g., Clear skin" />
              </Form.Item>
            </Col>
          </Row>

          <Title level={5}>Imaging</Title>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item name="abdominalUltrasound" label="Abdominal Ultrasound">
                <Input placeholder="e.g., Normal" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="thyroidUltrasound" label="Thyroid Ultrasound">
                <Input placeholder="e.g., Normal" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="breastUltrasound" label="Breast Ultrasound">
                <Input placeholder="e.g., Normal" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="ecg" label="ECG">
                <Input placeholder="e.g., Normal sinus rhythm" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="chestXray" label="Chest X-ray">
                <Input placeholder="e.g., Clear lungs" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="lumbarSpineXray" label="Lumbar Spine X-ray">
                <Input placeholder="e.g., Normal" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="cervicalSpineXray" label="Cervical Spine X-ray">
                <Input placeholder="e.g., Normal" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="dopplerHeart" label="Doppler Heart">
                <Input placeholder="e.g., Normal" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="carotidDoppler" label="Carotid Doppler">
                <Input placeholder="e.g., Normal" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="transvaginalUltrasound" label="Transvaginal Ultrasound">
                <Input placeholder="e.g., Normal" />
              </Form.Item>
            </Col>
          </Row>

          <Title level={5}>Specialized Tests</Title>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item name="vaginalWetMount" label="Vaginal Wet Mount">
                <Input placeholder="e.g., Normal" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="cervicalCancerPap" label="Cervical Cancer Pap">
                <Input placeholder="e.g., Negative" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="refractiveError" label="Refractive Error">
                <Input placeholder="e.g., None" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="boneDensityTscore"
                label={<Tooltip title="Normal: > -1"><span>Bone Density T-Score <InfoCircleOutlined /></span></Tooltip>}
                rules={[{ type: "number" }]}
              >
                <Input type="number" step="0.01" placeholder="e.g., -0.5" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="echinococcus" label="Echinococcus" valuePropName="checked">
                <Switch checkedChildren="Positive" unCheckedChildren="Negative" />
              </Form.Item>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: "4",
      label: <span><SkinOutlined /> Summary</span>,
      children: (
        <>
          <Form.Item
            name="conclusion"
            label="Medical Conclusion"
            extra={<Text type="secondary">Summarize the health checkup findings</Text>}
          >
            <TextArea rows={4} placeholder="Enter medical conclusions" />
          </Form.Item>
          <Form.Item
            name="recommendations"
            label="Recommendations"
            extra={<Text type="secondary">Provide follow-up advice</Text>}
          >
            <TextArea rows={4} placeholder="Enter recommendations" />
          </Form.Item>
        </>
      ),
    },
  ], [validationRules]);

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1200}
      maskClosable={false}
      styles={{ body: { padding: 0 } }}
    >
      {(initializing || !checkup) && visible ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <Spin size="large" tip="Loading health checkup data..." />
        </div>
      ) : (
        <Card
          title={
            <div className="flex items-center justify-between py-4 px-6 bg-teal-50">
              <Space>
                <MedicineBoxOutlined className="text-2xl text-teal-600" />
                <Title level={4} className="m-0 text-teal-800">
                  Update Health Checkup Record
                </Title>
              </Space>
              <Badge
                status={checkup?.status === "Active" ? "success" : "default"}
                text={
                  <Text strong>
                    {checkup?.status}
                    {checkup?.status === "Active" && <CheckCircleFilled className="ml-2 text-green-500" />}
                  </Text>
                }
              />
            </div>
          }
          variant="outlined"
        >
          {loading ? (
            <div className="flex justify-center items-center min-h-[300px]">
              <Spin size="large" tip="Saving changes..." />
            </div>
          ) : (
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              onFinishFailed={onFinishFailed}
              disabled={loading}
              className="p-6"
            >
              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                type="card"
                items={tabItems}
              />
              <Divider />
              <div className="flex justify-end gap-3">
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={loading}
                  className="bg-teal-600 hover:bg-teal-700 border-none"
                >
                  Save Changes
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleReset}
                  disabled={loading}
                  className="border-teal-600 text-teal-600 hover:bg-teal-50"
                >
                  Reset Form
                </Button>
                <Button
                  icon={<CloseOutlined />}
                  onClick={onClose}
                  disabled={loading}
                  className="border-gray-400 text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </Button>
              </div>
            </Form>
          )}
        </Card>
      )}
    </Modal>
  );
};

export default UpdateStaffHealthCheckupModal;