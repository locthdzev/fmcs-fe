import React from "react";
import {
  Modal,
  Button,
  Space,
  Typography,
  Divider,
  Checkbox,
  Alert,
  DatePicker,
  Tag,
  Radio,
} from "antd";
import {
  FileExcelOutlined,
  QuestionCircleOutlined,
  CheckCircleOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export interface ExportConfig {
  exportAllPages: boolean;
  includeStudentCheckups: boolean;
  includeStaffCheckups: boolean;
  includeBasicInfo: boolean;
  includeHealthMetrics: boolean;
  includeSpecialistExams: boolean;
  includeLaboratoryTests: boolean;
  includeImagingResults: boolean;
  includeDetailedMeasurements: boolean;
  includeCreatedInfo: boolean;
  includeUpdatedInfo: boolean;
  includeRecommendations: boolean;
}

interface PeriodicHealthCheckupExcelModalProps {
  visible: boolean;
  onCancel: () => void;
  onExport: (config: ExportConfig, dateRange?: [dayjs.Dayjs | null, dayjs.Dayjs | null]) => void;
  loading: boolean;
  initialConfig?: ExportConfig;
}

const defaultConfig: ExportConfig = {
  exportAllPages: true,
  includeStudentCheckups: true,
  includeStaffCheckups: true,
  includeBasicInfo: true,
  includeHealthMetrics: true,
  includeSpecialistExams: true,
  includeLaboratoryTests: true,
  includeImagingResults: true,
  includeDetailedMeasurements: true,
  includeCreatedInfo: true,
  includeUpdatedInfo: true,
  includeRecommendations: true,
};

const PeriodicHealthCheckupExcelModal: React.FC<PeriodicHealthCheckupExcelModalProps> = ({
  visible,
  onCancel,
  onExport,
  loading,
  initialConfig = defaultConfig,
}) => {
  const [config, setConfig] = React.useState<ExportConfig>(initialConfig);
  const [dateRange, setDateRange] = React.useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);

  React.useEffect(() => {
    if (visible) {
      setConfig(initialConfig);
      setDateRange([null, null]);
    }
  }, [visible, initialConfig]);

  const handleConfigChange = (key: keyof ExportConfig, value: boolean) => {
    setConfig({ ...config, [key]: value });
  };

  const handleDateRangeChange = (dates: any) => {
    setDateRange(dates);
  };

  const handleExportAll = () => {
    onExport(config);
  };

  const handleExportDateRange = () => {
    if (dateRange[0] && dateRange[1]) {
      onExport(config, dateRange);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <FileExcelOutlined style={{ color: '#52c41a' }} />
          <span>Export Periodic Health Checkup Report</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      width={700}
      footer={[
        <Button key="cancel" onClick={onCancel} icon={<CloseOutlined />}>
          Cancel
        </Button>,
        <Button
          key="exportAll"
          type="primary"
          icon={<FileExcelOutlined />}
          loading={loading}
          onClick={handleExportAll}
        >
          Export All Data
        </Button>,
        <Button
          key="exportRange"
          type="primary"
          icon={<FileExcelOutlined />}
          loading={loading}
          disabled={!dateRange[0] || !dateRange[1]}
          onClick={handleExportDateRange}
        >
          Export By Date Range
        </Button>,
      ]}
    >
      <div style={{ marginBottom: "20px" }}>
        <Title level={5}>Select Date Range (Optional)</Title>
        <RangePicker
          style={{ width: "100%", marginTop: "8px" }}
          placeholder={["Start date", "End date"]}
          value={dateRange}
          onChange={handleDateRangeChange}
          presets={[
            { label: "Today", value: [dayjs(), dayjs()] },
            {
              label: "Last 7 Days",
              value: [dayjs().subtract(6, "day"), dayjs()],
            },
            {
              label: "Last 30 Days",
              value: [dayjs().subtract(29, "day"), dayjs()],
            },
            {
              label: "This Month",
              value: [dayjs().startOf("month"), dayjs().endOf("month")],
            },
            {
              label: "Last Month",
              value: [
                dayjs().subtract(1, "month").startOf("month"),
                dayjs().subtract(1, "month").endOf("month"),
              ],
            },
            {
              label: "This Year",
              value: [dayjs().startOf("year"), dayjs().endOf("year")],
            },
            {
              label: "All Time",
              value: [dayjs("2020-01-01"), dayjs("2030-12-31")],
            },
          ]}
        />
      </div>

      <Divider orientation="left">Data Selection</Divider>

      <div style={{ marginBottom: "16px" }}>
        <Radio.Group
          value={config.exportAllPages}
          onChange={(e) => handleConfigChange("exportAllPages", e.target.value)}
          style={{ width: "100%" }}
        >
          <Space direction="vertical" style={{ width: "100%" }}>
            <Radio value={true}>Export all records</Radio>
            <Radio value={false}>Export current page only</Radio>
          </Space>
        </Radio.Group>
      </div>

      <Divider orientation="left">Checkup Types</Divider>
      <div style={{ marginBottom: "16px", display: "flex", gap: "24px" }}>
        <Checkbox
          checked={config.includeStudentCheckups}
          onChange={(e) => handleConfigChange("includeStudentCheckups", e.target.checked)}
        >
          Student Checkups
        </Checkbox>
        <Checkbox
          checked={config.includeStaffCheckups}
          onChange={(e) => handleConfigChange("includeStaffCheckups", e.target.checked)}
        >
          Staff Checkups
        </Checkbox>
      </div>

      <Divider orientation="left">Basic Information</Divider>
      <div style={{ marginBottom: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <Checkbox
          checked={config.includeBasicInfo}
          onChange={(e) => handleConfigChange("includeBasicInfo", e.target.checked)}
        >
          Basic Information
        </Checkbox>
        <Checkbox
          checked={config.includeHealthMetrics}
          onChange={(e) => handleConfigChange("includeHealthMetrics", e.target.checked)}
        >
          Health Metrics
        </Checkbox>
        <Checkbox
          checked={config.includeCreatedInfo}
          onChange={(e) => handleConfigChange("includeCreatedInfo", e.target.checked)}
        >
          Creation Date/User
        </Checkbox>
        <Checkbox
          checked={config.includeUpdatedInfo}
          onChange={(e) => handleConfigChange("includeUpdatedInfo", e.target.checked)}
        >
          Last Update Date/User
        </Checkbox>
      </div>

      <Divider orientation="left">Detailed Data</Divider>
      <div style={{ marginBottom: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <Checkbox
          checked={config.includeSpecialistExams}
          onChange={(e) => handleConfigChange("includeSpecialistExams", e.target.checked)}
        >
          Specialist Exams
        </Checkbox>
        <Checkbox
          checked={config.includeLaboratoryTests}
          onChange={(e) => handleConfigChange("includeLaboratoryTests", e.target.checked)}
        >
          Laboratory Tests
        </Checkbox>
        <Checkbox
          checked={config.includeImagingResults}
          onChange={(e) => handleConfigChange("includeImagingResults", e.target.checked)}
        >
          Imaging Results
        </Checkbox>
        <Checkbox
          checked={config.includeDetailedMeasurements}
          onChange={(e) => handleConfigChange("includeDetailedMeasurements", e.target.checked)}
        >
          Detailed Measurements
        </Checkbox>
        <Checkbox
          checked={config.includeRecommendations}
          onChange={(e) => handleConfigChange("includeRecommendations", e.target.checked)}
        >
          Recommendations
        </Checkbox>
      </div>

      <Divider orientation="left">Report Information</Divider>
      
      <div style={{ marginBottom: "16px" }}>
        <Alert
          message="Report Contents"
          description={
            <div>
              The exported Excel file will include all selected data fields. Each type of 
              checkup (student and staff) will be placed in separate sheets for better organization.
              The report will also include summary statistics about the health checkups.
            </div>
          }
          type="info"
          showIcon
          style={{ marginTop: '12px' }}
        />
      </div>
      
      <div style={{ marginTop: "16px" }}>
        <Title level={5}>Export Preview</Title>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: "8px" }}>
          <Tag color="green">Summary Statistics</Tag>
          {config.includeStudentCheckups && <Tag color="blue">Student Checkups</Tag>}
          {config.includeStaffCheckups && <Tag color="purple">Staff Checkups</Tag>}
          {config.includeBasicInfo && <Tag color="cyan">Basic Information</Tag>}
          {config.includeHealthMetrics && <Tag color="orange">Health Metrics</Tag>}
          {config.includeSpecialistExams && <Tag color="magenta">Specialist Exams</Tag>}
          {config.includeLaboratoryTests && <Tag color="gold">Laboratory Tests</Tag>}
          {config.includeImagingResults && <Tag color="lime">Imaging Results</Tag>}
        </div>
      </div>
    </Modal>
  );
};

export default PeriodicHealthCheckupExcelModal;
