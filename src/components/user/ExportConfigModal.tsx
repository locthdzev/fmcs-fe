import React from "react";
import {
  Modal,
  Form,
  Checkbox,
  Button,
  Divider,
  Row,
  Col,
  Typography,
  Alert,
} from "antd";
import { UserExportConfigDTO } from "@/api/user";

const { Text } = Typography;

interface ExportConfigModalProps {
  visible: boolean;
  onCancel: () => void;
  config: UserExportConfigDTO;
  onChange: (changedValues: any) => void;
  onExport: () => void;
}

const ExportConfigModal: React.FC<ExportConfigModalProps> = ({
  visible,
  onCancel,
  config,
  onChange,
  onExport,
}) => {
  const [form] = Form.useForm();

  React.useEffect(() => {
    if (visible) {
      form.setFieldsValue(config);
    }
  }, [visible, config, form]);

  const handleValuesChange = (changedValues: any) => {
    onChange(changedValues);
  };

  const handleExport = () => {
    form.validateFields().then(() => {
      onExport();
    });
  };

  // Function to check if at least one column is selected
  const hasAtLeastOneColumn = () => {
    return (
      config.includeFullName ||
      config.includeUserName ||
      config.includeEmail ||
      config.includePhone ||
      config.includeGender ||
      config.includeDob ||
      config.includeAddress ||
      config.includeRole ||
      config.includeStatus ||
      config.includeCreatedAt ||
      config.includeUpdatedAt
    );
  };

  return (
    <Modal
      title="Configure Export"
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button
          key="export"
          type="primary"
          onClick={handleExport}
          disabled={!hasAtLeastOneColumn()}
        >
          Export to Excel
        </Button>,
      ]}
    >
      {!hasAtLeastOneColumn() && (
        <Alert
          message="You must select at least one column to export."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        initialValues={config}
        onValuesChange={handleValuesChange}
      >
        <Divider orientation="left">Export Options</Divider>
        <Form.Item
          name="exportAllPages"
          valuePropName="checked"
        >
          <Checkbox>Export all users (ignores pagination)</Checkbox>
        </Form.Item>

        <Divider orientation="left">Select Columns to Export</Divider>
        <Row gutter={[16, 8]}>
          <Col span={12}>
            <Form.Item
              name="includeFullName"
              valuePropName="checked"
            >
              <Checkbox>Full Name</Checkbox>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="includeUserName"
              valuePropName="checked"
            >
              <Checkbox>Username</Checkbox>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="includeEmail"
              valuePropName="checked"
            >
              <Checkbox>Email</Checkbox>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="includePhone"
              valuePropName="checked"
            >
              <Checkbox>Phone</Checkbox>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="includeGender"
              valuePropName="checked"
            >
              <Checkbox>Gender</Checkbox>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="includeDob"
              valuePropName="checked"
            >
              <Checkbox>Date of Birth</Checkbox>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="includeAddress"
              valuePropName="checked"
            >
              <Checkbox>Address</Checkbox>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="includeRole"
              valuePropName="checked"
            >
              <Checkbox>Roles</Checkbox>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="includeStatus"
              valuePropName="checked"
            >
              <Checkbox>Status</Checkbox>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="includeCreatedAt"
              valuePropName="checked"
            >
              <Checkbox>Created At</Checkbox>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="includeUpdatedAt"
              valuePropName="checked"
            >
              <Checkbox>Updated At</Checkbox>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default ExportConfigModal; 