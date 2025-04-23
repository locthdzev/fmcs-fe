import React, { useState } from "react";
import { Modal, Form, Button, Space, Typography, Select, message } from "antd";
import { ExportOutlined, FileExcelOutlined } from "@ant-design/icons";
import { exportHealthInsurances } from "@/api/healthinsurance";

const { Title } = Typography;

interface ExportConfigurationModalProps {
  visible: boolean;
  onClose: () => void;
  filters?: any;
  tabKey: string;
}

const ExportConfigurationModal: React.FC<ExportConfigurationModalProps> = ({
  visible,
  onClose,
  filters = {},
  tabKey,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);
  const [messageApi, contextHolder] = message.useMessage();

  const handleExport = async () => {
    try {
      setLoading(true);
      const values = form.getFieldsValue();

      // Get selected status
      const selectedStatus = values.statusFilter || getDefaultStatus();

      await exportHealthInsurances(selectedStatus);
      messageApi.success("Export successful. The file is being downloaded.");
      onClose();
    } catch (error) {
      messageApi.error("Failed to export health insurance records");
      console.error("Error exporting health insurance records:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultStatus = () => {
    switch (tabKey) {
      case "verified":
        return "Active";
      case "initial":
        return "Initial";
      case "verification":
        return "Pending";
      case "updateRequest":
        return "Pending";
      case "expiredUpdate":
        return "ExpiredUpdate";
      case "expired":
        return "Expired";
      case "uninsured":
        return "NoInsurance";
      case "softDelete":
        return "SoftDeleted";
      case "rejected":
        return "Rejected";
      default:
        return "All";
    }
  };

  // Status options vary based on tab
  const getStatusOptions = () => {
    // Exact statuses from backend HealthInsuranceStatus class
    return [
      { value: "All", label: "All Records" },
      { value: "Pending", label: "Pending" },
      { value: "Submitted", label: "Submitted" },
      { value: "Completed", label: "Completed" },
      { value: "Expired", label: "Expired" },
      { value: "DeadlineExpired", label: "Deadline Expired" },
      { value: "SoftDeleted", label: "Soft Deleted" },
      { value: "NotApplicable", label: "Not Applicable" },
    ];
  };

  return (
    <Modal
      title={
        <Title level={4} style={{ margin: 0 }}>
          Export Configuration
        </Title>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="export"
          type="primary"
          icon={<ExportOutlined />}
          onClick={handleExport}
          loading={loading}
        >
          Export
        </Button>,
      ]}
      destroyOnClose
    >
      {contextHolder}

      <Form
        form={form}
        layout="vertical"
        initialValues={{ statusFilter: getDefaultStatus() }}
      >
        <Form.Item
          name="statusFilter"
          label="Select status to export:"
          rules={[{ required: true, message: "Please select status" }]}
        >
          <Select
            placeholder="Select status for export"
            style={{ width: "100%" }}
            options={getStatusOptions()}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ExportConfigurationModal;
