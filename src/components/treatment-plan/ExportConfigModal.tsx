import React, { useState } from "react";
import {
  Modal,
  Form,
  Checkbox,
  Button,
  Typography,
  message,
} from "antd";
import {
  exportTreatmentPlansToExcelWithConfig,
  TreatmentPlanExportConfigDTO,
} from "@/api/treatment-plan";
import dayjs from "dayjs";

const { Title } = Typography;

interface ExportConfigModalProps {
  visible: boolean;
  onClose: () => void;
  config: TreatmentPlanExportConfigDTO;
  onChange: (values: any) => void;
  filters: {
    currentPage: number;
    pageSize: number;
    treatmentPlanCodeSearch?: string;
    healthCheckResultCodeSearch?: string;
    userSearch?: string;
    drugSearch?: string;
    updatedBySearch?: string;
    sortBy: string;
    ascending: boolean;
    statusFilter?: string;
    dateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null];
    createdDateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null];
    updatedDateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null];
  };
}

const ExportConfigModal: React.FC<ExportConfigModalProps> = ({
  visible,
  onClose,
  config,
  onChange,
  filters,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const exportConfig: TreatmentPlanExportConfigDTO = {
        exportAllPages: values.exportAllPages,
        includePatient: values.includePatient,
        includeHealthCheckCode: values.includeHealthCheckCode,
        includeDrug: values.includeDrug,
        includeTreatmentDescription: values.includeTreatmentDescription,
        includeInstructions: values.includeInstructions,
        includeStartDate: values.includeStartDate,
        includeEndDate: values.includeEndDate,
        includeCreatedAt: values.includeCreatedAt,
        includeCreatedBy: values.includeCreatedBy,
        includeUpdatedAt: values.includeUpdatedAt,
        includeUpdatedBy: values.includeUpdatedBy,
        includeStatus: values.includeStatus,
      };

      const {
        currentPage,
        pageSize,
        treatmentPlanCodeSearch,
        healthCheckResultCodeSearch,
        userSearch,
        drugSearch,
        updatedBySearch,
        sortBy,
        ascending,
        statusFilter,
        dateRange,
        createdDateRange,
        updatedDateRange,
      } = filters;

      const startDate = dateRange?.[0]?.format("YYYY-MM-DD");
      const endDate = dateRange?.[1]?.format("YYYY-MM-DD");
      const createdStartDate = createdDateRange?.[0]?.format("YYYY-MM-DD");
      const createdEndDate = createdDateRange?.[1]?.format("YYYY-MM-DD");
      const updatedStartDate = updatedDateRange?.[0]?.format("YYYY-MM-DD");
      const updatedEndDate = updatedDateRange?.[1]?.format("YYYY-MM-DD");

      const response = await exportTreatmentPlansToExcelWithConfig(
        exportConfig,
        currentPage,
        pageSize,
        treatmentPlanCodeSearch,
        healthCheckResultCodeSearch,
        userSearch,
        drugSearch,
        updatedBySearch,
        sortBy,
        ascending,
        statusFilter as string,
        startDate,
        endDate,
        createdStartDate,
        createdEndDate,
        updatedStartDate,
        updatedEndDate
      );

      if (response.success && response.data) {
        window.open(response.data, "_blank");
        messageApi.success("Treatment plans exported to Excel successfully", 5);
      } else {
        messageApi.error(response.message || "Failed to export Excel file", 5);
      }

      onChange(values);
      onClose();
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Modal
      title="Export Configuration"
      open={visible}
      onCancel={handleCancel}
      width={600}
      footer={[
        <Button key="back" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
        >
          Export
        </Button>,
      ]}
    >
      {contextHolder}
      <Form
        form={form}
        layout="vertical"
        initialValues={config}
      >
        <Title level={5}>Export Options</Title>
        
        <Form.Item
          name="exportAllPages"
          valuePropName="checked"
        >
          <Checkbox>Export all pages (not just current page)</Checkbox>
        </Form.Item>

        <Title level={5}>Include Columns</Title>
        
        <Form.Item
          name="includePatient"
          valuePropName="checked"
        >
          <Checkbox>Patient Details</Checkbox>
        </Form.Item>
        
        <Form.Item
          name="includeHealthCheckCode"
          valuePropName="checked"
        >
          <Checkbox>Health Check Code</Checkbox>
        </Form.Item>
        
        <Form.Item
          name="includeDrug"
          valuePropName="checked"
        >
          <Checkbox>Drug Information</Checkbox>
        </Form.Item>
        
        <Form.Item
          name="includeTreatmentDescription"
          valuePropName="checked"
        >
          <Checkbox>Treatment Description</Checkbox>
        </Form.Item>
        
        <Form.Item
          name="includeInstructions"
          valuePropName="checked"
        >
          <Checkbox>Instructions</Checkbox>
        </Form.Item>
        
        <Form.Item
          name="includeStartDate"
          valuePropName="checked"
        >
          <Checkbox>Start Date</Checkbox>
        </Form.Item>
        
        <Form.Item
          name="includeEndDate"
          valuePropName="checked"
        >
          <Checkbox>End Date</Checkbox>
        </Form.Item>
        
        <Form.Item
          name="includeCreatedAt"
          valuePropName="checked"
        >
          <Checkbox>Created At</Checkbox>
        </Form.Item>
        
        <Form.Item
          name="includeCreatedBy"
          valuePropName="checked"
        >
          <Checkbox>Created By</Checkbox>
        </Form.Item>
        
        <Form.Item
          name="includeUpdatedAt"
          valuePropName="checked"
        >
          <Checkbox>Updated At</Checkbox>
        </Form.Item>
        
        <Form.Item
          name="includeUpdatedBy"
          valuePropName="checked"
        >
          <Checkbox>Updated By</Checkbox>
        </Form.Item>
        
        <Form.Item
          name="includeStatus"
          valuePropName="checked"
        >
          <Checkbox>Status</Checkbox>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ExportConfigModal; 