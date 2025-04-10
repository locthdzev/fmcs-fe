import React, { useMemo, memo } from "react";
import { Modal, Row, Col, Typography, Tag, Divider, Descriptions, Alert, Progress, Badge } from "antd";
import { EyeOutlined, HeartOutlined, SkinOutlined, SmileOutlined, BarChartOutlined, AlertOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;

interface StudentCheckup {
  id: string;
  periodicHealthCheckUpId: string;
  heightCm?: number;
  weightKg?: number;
  bmi?: number;
  pulseRate?: number;
  bloodPressure?: string;
  internalMedicineStatus?: string;
  surgeryStatus?: string;
  dermatologyStatus?: string;
  eyeRightScore?: number;
  eyeLeftScore?: number;
  eyePathology?: string;
  entstatus?: string;
  dentalOralStatus?: string;
  conclusion?: string;
  recommendations?: string;
  createdAt?: string;
  updatedAt?: string;
  status: string;
  createdBy?: string;
  nextCheckupDate?: string;
  mssv?: string;
}

interface CheckupDetailStudentModalProps {
  visible: boolean;
  checkup: StudentCheckup | null;
  onClose: () => void;
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

const CheckupDetailStudentModal: React.FC<CheckupDetailStudentModalProps> = memo(({ visible, checkup, onClose }) => {
  const isDataValid = useMemo(() => checkup && Object.keys(checkup).length > 0, [checkup]);
  const bmiInfo = useMemo(() => getBmiCategory(checkup?.bmi), [checkup?.bmi]);
  const pulseInfo = useMemo(() => getPulseStatus(checkup?.pulseRate), [checkup?.pulseRate]);
  const eyeRightStatus = useMemo(() => getEyeScoreStatus(checkup?.eyeRightScore), [checkup?.eyeRightScore]);
  const eyeLeftStatus = useMemo(() => getEyeScoreStatus(checkup?.eyeLeftScore), [checkup?.eyeLeftScore]);
  const examStatuses = useMemo(() => ({
    internalMedicine: getExamStatus(checkup?.internalMedicineStatus),
    surgery: getExamStatus(checkup?.surgeryStatus),
    dermatology: getExamStatus(checkup?.dermatologyStatus),
    ent: getExamStatus(checkup?.entstatus),
    dentalOral: getExamStatus(checkup?.dentalOralStatus),
  }), [checkup]);

  if (!visible) return null;

  if (!isDataValid) {
    return (
      <Modal
        title={<Title level={4}>Student Health Checkup Details</Title>}
        open={visible}
        onCancel={onClose}
        footer={null}
        width={900}
      >
        <Alert message="Error" description="No valid checkup data available." type="error" showIcon />
      </Modal>
    );
  }

  const typedCheckup = checkup as StudentCheckup;

  return (
    <Modal
      title={
        <div>
          <Title level={4} style={{ marginBottom: 4 }}>
            Student Health Checkup
            <Tag color={getStatusColor(typedCheckup.status)} style={{ marginLeft: 8 }}>
              {typedCheckup.status}
            </Tag>
          </Title>
          <Text type="secondary">MSSV: {typedCheckup.mssv || "N/A"}</Text>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={900}
      className="checkup-detail-modal"
    >
      <div style={{ padding: "16px", maxHeight: "70vh", overflowY: "auto" }}>
        <Descriptions
          bordered
          column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
          size="small"
          style={{ marginBottom: 16 }}
        >
          <Descriptions.Item label="Checkup ID">{typedCheckup.id}</Descriptions.Item>
          <Descriptions.Item label="Created">{formatDateTime(typedCheckup.createdAt)}</Descriptions.Item>
          <Descriptions.Item label="Updated">{formatDateTime(typedCheckup.updatedAt)}</Descriptions.Item>
          <Descriptions.Item label="Next Checkup">
            <Badge
              status={dayjs(typedCheckup.nextCheckupDate).isBefore(dayjs()) ? "error" : "processing"}
              text={formatDate(typedCheckup.nextCheckupDate)}
            />
          </Descriptions.Item>
          <Descriptions.Item label="Created By">{typedCheckup.createdBy || "N/A"}</Descriptions.Item>
        </Descriptions>

        <Divider orientation="left">
          <BarChartOutlined /> Vital Signs
        </Divider>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Text strong>Height:</Text> {typedCheckup.heightCm ? `${typedCheckup.heightCm} cm` : "N/A"}
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Text strong>Weight:</Text> {typedCheckup.weightKg ? `${typedCheckup.weightKg} kg` : "N/A"}
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Text strong>BMI:</Text>{" "}
            {typedCheckup.bmi ? <Tag color={bmiInfo.color}>{`${typedCheckup.bmi} (${bmiInfo.label})`}</Tag> : "N/A"}
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Text strong>Pulse:</Text>{" "}
            {typedCheckup.pulseRate ? (
              <Progress
                type="circle"
                percent={pulseInfo.percent}
                status={pulseInfo.status}
                width={40}
                format={() => `${typedCheckup.pulseRate} bpm`}
              />
            ) : (
              "N/A"
            )}
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Text strong>Blood Pressure:</Text> {typedCheckup.bloodPressure || "N/A"}
          </Col>
        </Row>

        <Divider orientation="left">Specialist Examinations</Divider>
        <Row gutter={[16, 16]} className="exam-sections">
          <Col xs={24} md={12}>
            <div className="exam-section">
              <Text strong><EyeOutlined /> Eye Examination</Text>
              <Tag
                color={
                  typedCheckup.eyePathology || eyeRightStatus.status === "exception" || eyeLeftStatus.status === "exception"
                    ? "red"
                    : "green"
                }
                style={{ marginLeft: 8 }}
              >
                {typedCheckup.eyePathology || eyeRightStatus.status === "exception" || eyeLeftStatus.status === "exception" ? (
                  <><AlertOutlined /> Abnormal</>
                ) : (
                  "Normal"
                )}
              </Tag>
              <Row gutter={[8, 8]} style={{ marginTop: 8 }}>
                <Col xs={12}>
                  <Text>Right Eye:</Text>{" "}
                  {typedCheckup.eyeRightScore !== undefined ? (
                    <Progress
                      type="circle"
                      percent={eyeRightStatus.percent}
                      status={eyeRightStatus.status}
                      width={40}
                      format={() => `${typedCheckup.eyeRightScore}/10`}
                    />
                  ) : (
                    "N/A"
                  )}
                </Col>
                <Col xs={12}>
                  <Text>Left Eye:</Text>{" "}
                  {typedCheckup.eyeLeftScore !== undefined ? (
                    <Progress
                      type="circle"
                      percent={eyeLeftStatus.percent}
                      status={eyeLeftStatus.status}
                      width={40}
                      format={() => `${typedCheckup.eyeLeftScore}/10`}
                    />
                  ) : (
                    "N/A"
                  )}
                </Col>
                <Col xs={24}>
                  <Text strong>Pathology:</Text>{" "}
                  <Tag color={typedCheckup.eyePathology ? "red" : "green"}>
                    {typedCheckup.eyePathology || "Normal"}
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
                <Text>{typedCheckup.internalMedicineStatus || "No findings"}</Text>
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
                <Text>{typedCheckup.dermatologyStatus || "No findings"}</Text>
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
                <Text>{typedCheckup.entstatus || "No findings"}</Text>
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
                <Text>{typedCheckup.dentalOralStatus || "No findings"}</Text>
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
                <Text>{typedCheckup.surgeryStatus || "No findings"}</Text>
              </div>
            </div>
          </Col>
        </Row>

        <Divider orientation="left">Summary</Divider>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Text strong>Conclusion:</Text>
            <div style={{ marginTop: 8, background: "#fafafa", padding: 8, borderRadius: 4 }}>
              {typedCheckup.conclusion ? (
                typedCheckup.conclusion.split("\n").map((line, i) => (
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
              {typedCheckup.recommendations ? (
                typedCheckup.recommendations.split("\n").map((line, i) => (
                  <Text key={i} style={{ display: "block" }}>{line || "N/A"}</Text>
                ))
              ) : (
                "N/A"
              )}
            </div>
          </Col>
        </Row>
      </div>

      <style jsx>{`
        .checkup-detail-modal :global(.ant-descriptions-item-label) {
          width: 120px;
          background: #f5f5f5;
          font-weight: 500;
        }
        .checkup-detail-modal :global(.ant-divider) {
          margin: 16px 0;
          font-size: 14px;
          font-weight: 500;
        }
        .checkup-detail-modal :global(.ant-progress-circle) {
          margin-left: 8px;
          vertical-align: middle;
        }
        .checkup-detail-modal :global(.ant-tag) {
          margin-left: 8px;
        }
        .exam-section {
          background: #fff;
          padding: 12px;
          border-radius: 4px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          margin-bottom: 16px;
        }
        .exam-sections :global(.ant-col) {
          display: flex;
        }
      `}</style>
    </Modal>
  );
});

CheckupDetailStudentModal.displayName = "CheckupDetailStudentModal";

export default CheckupDetailStudentModal;