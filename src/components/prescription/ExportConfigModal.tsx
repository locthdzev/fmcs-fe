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
  exportPrescriptionsToExcelWithConfig,
  PrescriptionExportConfigDTO,
} from "@/api/prescription";

const { Title } = Typography;

interface ExportConfigModalProps {
  visible: boolean;
  onClose: () => void;
  config: PrescriptionExportConfigDTO;
  onChange: (values: any) => void;
  filters: any;
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

      const exportConfig: PrescriptionExportConfigDTO = {
        exportAllPages: values.exportAllPages,
        includePatient: values.includePatient,
        includeHealthCheckCode: values.includeHealthCheckCode,
        includePrescriptionCode: values.includePrescriptionCode,
        includePrescriptionDate: values.includePrescriptionDate,
        includeHealthcareStaff: values.includeHealthcareStaff,
        includeMedications: values.includeMedications,
        includeStatus: values.includeStatus,
        includeCreatedAt: values.includeCreatedAt,
        includeUpdatedAt: values.includeUpdatedAt,
        includeUpdatedBy: values.includeUpdatedBy,
      };

      const {
        currentPage,
        pageSize,
        prescriptionCodeSearch,
        healthCheckResultCodeSearch,
        userSearch,
        staffSearch,
        drugSearch,
        updatedBySearch,
        sortBy,
        ascending,
        statusFilter,
        prescriptionDateRange,
        createdDateRange,
        updatedDateRange,
      } = filters;

      const prescriptionStartDate = prescriptionDateRange[0]?.format("YYYY-MM-DD");
      const prescriptionEndDate = prescriptionDateRange[1]?.format("YYYY-MM-DD");
      const createdStartDate = createdDateRange[0]?.format("YYYY-MM-DD");
      const createdEndDate = createdDateRange[1]?.format("YYYY-MM-DD");
      const updatedStartDate = updatedDateRange[0]?.format("YYYY-MM-DD");
      const updatedEndDate = updatedDateRange[1]?.format("YYYY-MM-DD");

      await exportPrescriptionsToExcelWithConfig(
        exportConfig,
        currentPage,
        pageSize,
        prescriptionCodeSearch,
        healthCheckResultCodeSearch,
        userSearch,
        staffSearch,
        drugSearch,
        updatedBySearch,
        sortBy,
        ascending,
        statusFilter,
        prescriptionStartDate,
        prescriptionEndDate,
        createdStartDate,
        createdEndDate,
        updatedStartDate,
        updatedEndDate
      );

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
          name="includePrescriptionCode"
          valuePropName="checked"
        >
          <Checkbox>Prescription Code</Checkbox>
        </Form.Item>
        
        <Form.Item
          name="includeHealthCheckCode"
          valuePropName="checked"
        >
          <Checkbox>Health Check Code</Checkbox>
        </Form.Item>
        
        <Form.Item
          name="includePatient"
          valuePropName="checked"
        >
          <Checkbox>Patient Details</Checkbox>
        </Form.Item>
        
        <Form.Item
          name="includePrescriptionDate"
          valuePropName="checked"
        >
          <Checkbox>Prescription Date</Checkbox>
        </Form.Item>
        
        <Form.Item
          name="includeHealthcareStaff"
          valuePropName="checked"
        >
          <Checkbox>Healthcare Staff</Checkbox>
        </Form.Item>
        
        <Form.Item
          name="includeMedications"
          valuePropName="checked"
        >
          <Checkbox>Medications</Checkbox>
        </Form.Item>
        
        <Form.Item
          name="includeStatus"
          valuePropName="checked"
        >
          <Checkbox>Status</Checkbox>
        </Form.Item>
        
        <Form.Item
          name="includeCreatedAt"
          valuePropName="checked"
        >
          <Checkbox>Created At</Checkbox>
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
      </Form>
    </Modal>
  );
};

export default ExportConfigModal; 