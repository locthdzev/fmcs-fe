import React, { useMemo, memo } from "react";
import {
  Modal,
  Row,
  Col,
  Typography,
  Tag,
  Button,
  Space,
  Alert,
  Descriptions,
  Divider,
  Card,
  Tooltip,
} from "antd";
import { LinkOutlined, InfoCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;

interface StaffCheckup {
  id: string;
  periodicHealthCheckUpId: string;
  fullName?: string;
  gender?: string;
  status: string;
  conclusion?: string;
  createdAt?: string;
  hospitalName?: string;
  reportIssuanceDate?: string;
  bloodGlucose?: number;
  cholesterol?: number;
  recommendations?: string;
  completeBloodCount?: string;
  completeUrinalysis?: string;
  hbA1c?: number;
  uricAcid?: number;
  triglycerides?: number;
  hdl?: number;
  ldl?: number;
  sgot?: number;
  sgpt?: number;
  ggt?: number;
  urea?: number;
  creatinine?: number;
  hbsAg?: boolean;
  hbsAb?: boolean;
  hcvab?: boolean;
  antiHavigM?: boolean;
  hiv?: boolean;
  serumIron?: number;
  thyroidT3?: number;
  thyroidFt4?: number;
  thyroidTsh?: number;
  bloodType?: string;
  rhtype?: string;
  totalCalcium?: number;
  liverAfp?: number;
  prostatePsa?: number;
  colonCea?: number;
  stomachCa724?: number;
  pancreasCa199?: number;
  breastCa153?: number;
  ovariesCa125?: number;
  lungCyfra211?: number;
  ferritin?: number;
  toxocaraCanis?: boolean;
  rf?: number;
  electrolytesNa?: number;
  electrolytesK?: number;
  electrolytesCl?: number;
  generalExam?: string;
  eyeExam?: string;
  dentalExam?: string;
  entexam?: string;
  gynecologicalExam?: string;
  vaginalWetMount?: string;
  cervicalCancerPap?: string;
  abdominalUltrasound?: string;
  thyroidUltrasound?: string;
  breastUltrasound?: string;
  ecg?: string;
  chestXray?: string;
  lumbarSpineXray?: string;
  cervicalSpineXray?: string;
  refractiveError?: string;
  dopplerHeart?: string;
  carotidDoppler?: string;
  transvaginalUltrasound?: string;
  boneDensityTscore?: number;
  echinococcus?: boolean;
  dermatologyExam?: string;
  hospitalReportUrl?: string;
  updatedAt?: string;
}

interface CheckupDetailStaffModalProps {
  visible: boolean;
  checkup: StaffCheckup | null;
  onClose: () => void;
  loading?: boolean;
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

const CheckupDetailStaffModal: React.FC<CheckupDetailStaffModalProps> = memo(({ 
  
  visible, 
  checkup, 
  onClose, 
  loading = false 
}) => {
  console.log('Staff Checkup in Modal:', checkup);
  console.log('Rh Type in Modal:', checkup?.rhtype); // Debug rhtype specifically
  const isDataValid = useMemo(() => checkup && Object.keys(checkup).length > 0, [checkup]);
  
  // Memoized status calculations
  const bloodGlucoseStatus = useMemo(() => getBloodGlucoseStatus(checkup?.bloodGlucose), [checkup?.bloodGlucose]);
  const cholesterolStatus = useMemo(() => getCholesterolStatus(checkup?.cholesterol), [checkup?.cholesterol]);
  const examStatuses = useMemo(() => ({
    general: getExamStatus(checkup?.generalExam),
    eye: getExamStatus(checkup?.eyeExam),
    dental: getExamStatus(checkup?.dentalExam),
    ent: getExamStatus(checkup?.entexam),
    dermatology: getExamStatus(checkup?.dermatologyExam),
    gynecological: getExamStatus(checkup?.gynecologicalExam),
  }), [checkup]);

  if (!visible) return null;

  if (!isDataValid) {
    return (
      <Modal
        title={<Title level={4}>Staff Health Checkup Details</Title>}
        open={visible}
        onCancel={onClose}
        footer={null}
        width={1200}
        maskClosable={false}
      >
        <Alert 
          message="No Data" 
          description="No valid checkup data available. Please try again or contact support."
          type="warning" 
          showIcon 
        />
      </Modal>
    );
  }

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

  const typedCheckup = checkup as StaffCheckup;
  console.log('Typed Checkup ENT Exam:', typedCheckup.entexam); // Add this
  return (
    <Modal
      title={
        <Space direction="vertical" size={4}>
          <Title level={4} style={{ margin: 0 }}>
            Staff Health Checkup - {typedCheckup.fullName || "Unknown"}
            <Tag color={getStatusColor(typedCheckup.status)} style={{ marginLeft: 8 }}>
              {typedCheckup.status}
            </Tag>
          </Title>
          <Text type="secondary">
            {typedCheckup.hospitalName ? `Hospital: ${typedCheckup.hospitalName}` : "Hospital: N/A"}
          </Text>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={
        <Space>
          {typedCheckup.hospitalReportUrl && (
            <Button
              type="link"
              icon={<LinkOutlined />}
              href={typedCheckup.hospitalReportUrl}
              target="_blank"
            >
              View Full Report
            </Button>
          )}
          <Button type="primary" onClick={onClose}>
            Close
          </Button>
        </Space>
      }
      width={1200}
      maskClosable={false}
      destroyOnClose
      className="checkup-detail-modal"
    >
      {loading ? (
        <Alert message="Loading..." type="info" showIcon />
      ) : (
        <div style={{ padding: "16px", maxHeight: "80vh", overflowY: "auto" }}>
          {/* Basic Information */}
          <Card size="small" style={{ marginBottom: 16 }}>
            <Descriptions
              bordered
              column={{ xxl: 3, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
              size="small"
            >
              <Descriptions.Item label="Checkup ID">{typedCheckup.id}</Descriptions.Item>
              <Descriptions.Item label="Periodic ID">{typedCheckup.periodicHealthCheckUpId}</Descriptions.Item>
              <Descriptions.Item label="Gender">{typedCheckup.gender || "N/A"}</Descriptions.Item>
              <Descriptions.Item label="Report Date">{formatDate(typedCheckup.reportIssuanceDate)}</Descriptions.Item>
              <Descriptions.Item label="Created">{formatDateTime(typedCheckup.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="Updated">{formatDateTime(typedCheckup.updatedAt)}</Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Blood Tests */}
          <Divider orientation="left">Blood Tests</Divider>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={8}>
          <Text strong>Blood Type:</Text> 
              {(() => {
                const { type, rh } = parseBloodTypeAndRh(typedCheckup.bloodType, typedCheckup.rhtype);
                return type === "Unknown" && !rh ? " N/A" : ` ${type}${rh ? " " + rh : ""}`;
              })()}
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Text strong>Cholesterol:</Text>
              <Tooltip title={cholesterolStatus.tooltip}>
                <Tag color={cholesterolStatus.color}>
                  {typedCheckup.cholesterol ? `${typedCheckup.cholesterol} mg/dL (${cholesterolStatus.label})` : "N/A"}
                </Tag>
              </Tooltip>
            </Col>
            <Col xs={24} sm={12} md={8}><Text strong>HbA1c:</Text> {typedCheckup.hbA1c ? `${typedCheckup.hbA1c}%` : "N/A"}</Col>
            <Col xs={24} sm={12} md={8}><Text strong>Complete Blood Count:</Text> {typedCheckup.completeBloodCount || "N/A"}</Col>
            <Col xs={24} sm={12} md={8}><Text strong>Complete Urinalysis:</Text> {typedCheckup.completeUrinalysis || "N/A"}</Col>
            <Col xs={24} sm={12} md={8}><Text strong>Uric Acid:</Text> {typedCheckup.uricAcid ? `${typedCheckup.uricAcid} mg/dL` : "N/A"}</Col>
            <Col xs={24} sm={12} md={8}><Text strong>Triglycerides:</Text> {typedCheckup.triglycerides ? `${typedCheckup.triglycerides} mg/dL` : "N/A"}</Col>
            <Col xs={24} sm={12} md={8}><Text strong>HDL:</Text> {typedCheckup.hdl ? `${typedCheckup.hdl} mg/dL` : "N/A"}</Col>
            <Col xs={24} sm={12} md={8}><Text strong>LDL:</Text> {typedCheckup.ldl ? `${typedCheckup.ldl} mg/dL` : "N/A"}</Col>
            <Col xs={24} sm={12} md={8}><Text strong>SGOT:</Text> {typedCheckup.sgot ? `${typedCheckup.sgot} U/L` : "N/A"}</Col>
            <Col xs={24} sm={12} md={8}><Text strong>SGPT:</Text> {typedCheckup.sgpt ? `${typedCheckup.sgpt} U/L` : "N/A"}</Col>
            <Col xs={24} sm={12} md={8}><Text strong>GGT:</Text> {typedCheckup.ggt ? `${typedCheckup.ggt} U/L` : "N/A"}</Col>
            <Col xs={24} sm={12} md={8}><Text strong>Urea:</Text> {typedCheckup.urea ? `${typedCheckup.urea} mg/dL` : "N/A"}</Col>
            <Col xs={24} sm={12} md={8}><Text strong>Creatinine:</Text> {typedCheckup.creatinine ? `${typedCheckup.creatinine} mg/dL` : "N/A"}</Col>
            <Col xs={24} sm={12} md={8}><Text strong>Serum Iron:</Text> {typedCheckup.serumIron ? `${typedCheckup.serumIron} µg/dL` : "N/A"}</Col>
            <Col xs={24} sm={12} md={8}><Text strong>Ferritin:</Text> {typedCheckup.ferritin ? `${typedCheckup.ferritin} ng/mL` : "N/A"}</Col>
          </Row>

          {/* Liver & Thyroid Function */}
          <Divider orientation="left">Liver & Thyroid Function</Divider>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={8}><Text strong>Thyroid T3:</Text> {typedCheckup.thyroidT3 ? `${typedCheckup.thyroidT3} ng/mL` : "N/A"}</Col>
            <Col xs={24} sm={12} md={8}><Text strong>Thyroid FT4:</Text> {typedCheckup.thyroidFt4 ? `${typedCheckup.thyroidFt4} ng/dL` : "N/A"}</Col>
            <Col xs={24} sm={12} md={8}><Text strong>Thyroid TSH:</Text> {typedCheckup.thyroidTsh ? `${typedCheckup.thyroidTsh} µIU/mL` : "N/A"}</Col>
            <Col xs={24} sm={12} md={8}><Text strong>Liver AFP:</Text> {typedCheckup.liverAfp ? `${typedCheckup.liverAfp} ng/mL` : "N/A"}</Col>
          </Row>

          {/* Infectious Disease Markers */}
          <Divider orientation="left">Infectious Disease Markers</Divider>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={8}><Text strong>HBsAg:</Text> {formatBoolean(typedCheckup.hbsAg)}</Col>
            <Col xs={24} sm={12} md={8}><Text strong>HBsAb:</Text> {formatBoolean(typedCheckup.hbsAb)}</Col>
            <Col xs={24} sm={12} md={8}><Text strong>HCVAb:</Text> {formatBoolean(typedCheckup.hcvab)}</Col>
            <Col xs={24} sm={12} md={8}><Text strong>Anti-HAV IgM:</Text> {formatBoolean(typedCheckup.antiHavigM)}</Col>
            <Col xs={24} sm={12} md={8}><Text strong>HIV:</Text> {formatBoolean(typedCheckup.hiv)}</Col>
            <Col xs={24} sm={12} md={8}><Text strong>Toxocara Canis:</Text> {formatBoolean(typedCheckup.toxocaraCanis)}</Col>
            <Col xs={24} sm={12} md={8}><Text strong>Echinococcus:</Text> {formatBoolean(typedCheckup.echinococcus)}</Col>
          </Row>

          {/* Electrolytes & Blood Type */}
          <Divider orientation="left">Electrolytes </Divider>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={8}><Text strong>Sodium (Na):</Text> {typedCheckup.electrolytesNa ? `${typedCheckup.electrolytesNa} mmol/L` : "N/A"}</Col>
            <Col xs={24} sm={12} md={8}><Text strong>Potassium (K):</Text> {typedCheckup.electrolytesK ? `${typedCheckup.electrolytesK} mmol/L` : "N/A"}</Col>
            <Col xs={24} sm={12} md={8}><Text strong>Chloride (Cl):</Text> {typedCheckup.electrolytesCl ? `${typedCheckup.electrolytesCl} mmol/L` : "N/A"}</Col>
            <Col xs={24} sm={12} md={8}>
           
          </Col>
            <Col xs={24} sm={12} md={8}><Text strong>Total Calcium:</Text> {typedCheckup.totalCalcium ? `${typedCheckup.totalCalcium} mmol/L` : "N/A"}</Col>
            <Col xs={24} sm={12} md={8}><Text strong>Rheumatoid Factor (RF):</Text> {typedCheckup.rf ? `${typedCheckup.rf} IU/mL` : "N/A"}</Col>
          </Row>

          {/* Tumor Markers */}
          <Divider orientation="left">Tumor Markers</Divider>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={8}><Text strong>Prostate PSA:</Text> {typedCheckup.prostatePsa ? `${typedCheckup.prostatePsa} ng/mL` : "N/A"}</Col>
            <Col xs={24} sm={12} md={8}><Text strong>Colon CEA:</Text> {typedCheckup.colonCea ? `${typedCheckup.colonCea} ng/mL` : "N/A"}</Col>
            <Col xs={24} sm={12} md={8}><Text strong>Stomach CA 72-4:</Text> {typedCheckup.stomachCa724 ? `${typedCheckup.stomachCa724} U/mL` : "N/A"}</Col>
            <Col xs={24} sm={12} md={8}><Text strong>Pancreas CA 19-9:</Text> {typedCheckup.pancreasCa199 ? `${typedCheckup.pancreasCa199} U/mL` : "N/A"}</Col>
            <Col xs={24} sm={12} md={8}><Text strong>Breast CA 15-3:</Text> {typedCheckup.breastCa153 ? `${typedCheckup.breastCa153} U/mL` : "N/A"}</Col>
            <Col xs={24} sm={12} md={8}><Text strong>Ovaries CA 125:</Text> {typedCheckup.ovariesCa125 ? `${typedCheckup.ovariesCa125} U/mL` : "N/A"}</Col>
            <Col xs={24} sm={12} md={8}><Text strong>Lung CYFRA 21-1:</Text> {typedCheckup.lungCyfra211 ? `${typedCheckup.lungCyfra211} ng/mL` : "N/A"}</Col>
          </Row>

          {/* Specialist Examinations */}
          <Divider orientation="left">Specialist Examinations</Divider>
<Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
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
          {key === "eye" && typedCheckup.refractiveError && (
            <Text type="secondary">Refractive Error: {typedCheckup.refractiveError}</Text>
          )}
          {key === "gynecological" && (
            <>
              {typedCheckup.vaginalWetMount && (
                <Text type="secondary">Vaginal Wet Mount: {typedCheckup.vaginalWetMount}</Text>
              )}
              {typedCheckup.cervicalCancerPap && (
                <Text type="secondary">Cervical Pap: {typedCheckup.cervicalCancerPap}</Text>
              )}
            </>
          )}
        </Space>
      </Card>
    </Col>
  ))}
</Row>

          {/* Imaging & Diagnostics */}
          <Divider orientation="left">Imaging & Diagnostics</Divider>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={8}><Text strong>ECG:</Text> {typedCheckup.ecg || "N/A"}</Col>
            <Col xs={24} sm={12} md={8}><Text strong>Chest X-ray:</Text> {typedCheckup.chestXray || "N/A"}</Col>
            <Col xs={24} sm={12} md={8}><Text strong>Lumbar Spine X-ray:</Text> {typedCheckup.lumbarSpineXray || "N/A"}</Col>
            <Col xs={24} sm={12} md={8}><Text strong>Cervical Spine X-ray:</Text> {typedCheckup.cervicalSpineXray || "N/A"}</Col>
            <Col xs={24} sm={12} md={8}><Text strong>Abdominal Ultrasound:</Text> {typedCheckup.abdominalUltrasound || "N/A"}</Col>
            <Col xs={24} sm={12} md={8}><Text strong>Thyroid Ultrasound:</Text> {typedCheckup.thyroidUltrasound || "N/A"}</Col>
            <Col xs={24} sm={12} md={8}><Text strong>Breast Ultrasound:</Text> {typedCheckup.breastUltrasound || "N/A"}</Col>
            <Col xs={24} sm={12} md={8}><Text strong>Transvaginal Ultrasound:</Text> {typedCheckup.transvaginalUltrasound || "N/A"}</Col>
            <Col xs={24} sm={12} md={8}><Text strong>Doppler Heart:</Text> {typedCheckup.dopplerHeart || "N/A"}</Col>
            <Col xs={24} sm={12} md={8}><Text strong>Carotid Doppler:</Text> {typedCheckup.carotidDoppler || "N/A"}</Col>
            <Col xs={24} sm={12} md={8}><Text strong>Bone Density T-Score:</Text> {typedCheckup.boneDensityTscore ?? "N/A"}</Col>
          </Row>

          {/* Summary */}
          <Divider orientation="left">Summary</Divider>
          <Card size="small">
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              <div>
                <Text strong>Conclusion:</Text>
                <div style={{ background: "#fafafa", padding: 8, borderRadius: 4, marginTop: 4 }}>
                  {typedCheckup.conclusion || "No conclusion provided"}
                </div>
              </div>
              <div>
                <Text strong>Recommendations:</Text>
                <div style={{ background: "#fafafa", padding: 8, borderRadius: 4, marginTop: 4 }}>
                  {typedCheckup.recommendations || "No recommendations provided"}
                </div>
              </div>
            </Space>
          </Card>
        </div>
      )}

      <style jsx>{`
        .checkup-detail-modal :global(.ant-descriptions-item-label) {
          background: #f5f5f5;
          font-weight: 500;
          padding: 8px 12px;
          width: 120px;
        }
        .checkup-detail-modal :global(.ant-descriptions-item-content) {
          padding: 8px 12px;
        }
        .checkup-detail-modal :global(.ant-divider) {
          margin: 24px 0 16px;
          font-weight: 500;
          font-size: 16px;
        }
        .exam-card {
          background: #fff;
          border: 1px solid #e8e8e8;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          transition: all 0.2s;
        }
        .exam-card:hover {
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        .checkup-detail-modal :global(.ant-row) {
          align-items: flex-start;
        }
        .checkup-detail-modal :global(.ant-col) {
          display: flex;
          flex-direction: column;
        }
      `}</style>
    </Modal>
  );
});

CheckupDetailStaffModal.displayName = "CheckupDetailStaffModal";

export default CheckupDetailStaffModal;