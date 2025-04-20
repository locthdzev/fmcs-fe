import React, { useState } from "react";
import {
  Modal,
  Form,
  Button,
  Space,
  Typography,
  Checkbox,
  Divider,
  Select,
  Card,
  message,
} from "antd";
import {
  ExportOutlined,
  TableOutlined,
  CheckSquareOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import { exportHealthInsurances } from "@/api/healthinsurance";

const { Title, Text } = Typography;
const { Option } = Select;

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
      
      // Prepare export parameters
      const exportParams = {
        ...filters,
        status: values.statusFilter || getDefaultStatus(),
        ...values.includeFilters ? filters : {},
      };
      
      await exportHealthInsurances();
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
      default:
        return undefined;
    }
  };

  // Status options vary based on tab
  const getStatusOptions = () => {
    switch (tabKey) {
      case "verified":
        return [
          { value: "Active", label: "Active" },
          { value: "AboutToExpire", label: "About To Expire" },
          { value: "Expired", label: "Expired" },
          { value: "All", label: "All Verified Records" },
        ];
      case "initial":
        return [
          { value: "Initial", label: "Initial" },
          { value: "PendingDeadline", label: "Pending Deadline" },
          { value: "All", label: "All Initial Records" },
        ];
      case "verification":
        return [
          { value: "Pending", label: "Pending Verification" },
          { value: "All", label: "All Verification Records" },
        ];
      case "updateRequest":
        return [
          { value: "Pending", label: "Pending Review" },
          { value: "Rejected", label: "Rejected" },
          { value: "Approved", label: "Approved" },
          { value: "All", label: "All Update Requests" },
        ];
      case "expiredUpdate":
        return [
          { value: "ExpiredUpdate", label: "Expired Update" },
          { value: "All", label: "All Expired Updates" },
        ];
      case "expired":
        return [
          { value: "Expired", label: "Expired" },
          { value: "All", label: "All Expired Records" },
        ];
      case "uninsured":
        return [
          { value: "NoInsurance", label: "No Insurance" },
          { value: "All", label: "All Uninsured Records" },
        ];
      case "softDelete":
        return [
          { value: "SoftDeleted", label: "Soft Deleted" },
          { value: "All", label: "All Soft Deleted Records" },
        ];
      default:
        return [
          { value: "All", label: "All Records" },
        ];
    }
  };

  return (
    <Modal
      title={
        <Space>
          <ExportOutlined />
          <Title level={4} style={{ margin: 0 }}>
            Export Health Insurance Records
          </Title>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={600}
      footer={null}
    >
      {contextHolder}
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          statusFilter: getDefaultStatus(),
          includeFilters: Object.keys(filters).length > 0,
          fileFormat: "xlsx",
          columns: [
            "owner",
            "insuranceNumber",
            "fullName",
            "validPeriod",
            "issueDate",
            "status",
            "verification",
            "createdAt",
            "createdBy",
          ],
        }}
      >
        <Card className="mb-4">
          <Space align="center" className="mb-2">
            <FilterOutlined />
            <Text strong>Export Filters</Text>
          </Space>
          <Divider style={{ margin: "8px 0" }} />

          <Form.Item
            name="statusFilter"
            label="Status Filter"
            rules={[{ required: true, message: "Please select status" }]}
          >
            <Select
              placeholder="Select status for export"
              style={{ width: "100%" }}
              options={getStatusOptions()}
            />
          </Form.Item>

          {Object.keys(filters).length > 0 && (
            <Form.Item name="includeFilters" valuePropName="checked">
              <Checkbox>Include current applied filters</Checkbox>
            </Form.Item>
          )}

          <Form.Item name="fileFormat" label="File Format">
            <Select
              placeholder="Select export format"
              style={{ width: "100%" }}
            >
              <Option value="xlsx">Excel (.xlsx)</Option>
              <Option value="csv">CSV (.csv)</Option>
              <Option value="pdf">PDF (.pdf)</Option>
            </Select>
          </Form.Item>
        </Card>

        <Card className="mb-4">
          <Space align="center" className="mb-2">
            <TableOutlined />
            <Text strong>Columns to Export</Text>
          </Space>
          <Divider style={{ margin: "8px 0" }} />

          <Form.Item name="columns" label="Select Columns">
            <Checkbox.Group style={{ width: "100%" }}>
              <div className="grid grid-cols-2 gap-2">
                <Checkbox value="owner">Owner</Checkbox>
                <Checkbox value="insuranceNumber">Insurance Number</Checkbox>
                <Checkbox value="fullName">Full Name</Checkbox>
                <Checkbox value="dob">Date of Birth</Checkbox>
                <Checkbox value="gender">Gender</Checkbox>
                <Checkbox value="address">Address</Checkbox>
                <Checkbox value="healthcareProvider">Healthcare Provider</Checkbox>
                <Checkbox value="validPeriod">Valid Period</Checkbox>
                <Checkbox value="issueDate">Issue Date</Checkbox>
                <Checkbox value="status">Status</Checkbox>
                <Checkbox value="verification">Verification</Checkbox>
                <Checkbox value="createdAt">Created At</Checkbox>
                <Checkbox value="createdBy">Created By</Checkbox>
                <Checkbox value="updatedAt">Updated At</Checkbox>
                <Checkbox value="updatedBy">Updated By</Checkbox>
                <Checkbox value="deadline">Deadline</Checkbox>
              </div>
            </Checkbox.Group>
          </Form.Item>
        </Card>

        <div className="flex justify-end">
          <Space>
            <Button onClick={onClose}>Cancel</Button>
            <Button
              type="primary"
              icon={<ExportOutlined />}
              loading={loading}
              onClick={handleExport}
            >
              Export
            </Button>
          </Space>
        </div>
      </Form>
    </Modal>
  );
};

export default ExportConfigurationModal;
