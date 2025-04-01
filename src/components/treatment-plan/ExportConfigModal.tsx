import React, { useState } from "react";
import {
  Modal,
  Form,
  Checkbox,
  Button,
  Typography,
  message,
} from "antd";
import { toast } from "react-toastify";
import {
  exportTreatmentPlansToExcelWithConfig,
  TreatmentPlanExportConfigDTO,
} from "@/api/treatment-plan";
import moment from "moment";

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
    dateRange: [moment.Moment, moment.Moment] | null;
    createdDateRange: [moment.Moment, moment.Moment] | null;
    updatedDateRange: [moment.Moment, moment.Moment] | null;
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
        toast.success("Treatment plans exported to Excel successfully");
      } else {
        toast.error(response.message || "Failed to export Excel file");
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