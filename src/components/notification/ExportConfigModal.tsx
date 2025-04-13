import React from "react";
import { Modal, Form, Checkbox, Button, Typography, Divider } from "antd";

const { Text } = Typography;

interface ExportConfigModalProps {
  visible: boolean;
  onClose: () => void;
  exportConfig: {
    exportAllPages: boolean;
    includeTitle: boolean;
    includeRecipientType: boolean;
    includeStatus: boolean;
    includeSendEmail: boolean;
    includeCreatedAt: boolean;
    includeCreatedBy: boolean;
  };
  onChange: (values: any) => void;
  onExport: () => void;
}

const ExportConfigModal: React.FC<ExportConfigModalProps> = ({
  visible,
  onClose,
  exportConfig,
  onChange,
  onExport,
}) => {
  const [form] = Form.useForm();

  React.useEffect(() => {
    if (visible) {
      form.setFieldsValue(exportConfig);
    }
  }, [visible, exportConfig, form]);

  const handleValuesChange = (changedValues: any) => {
    onChange(changedValues);
  };

  const handleExport = () => {
    onExport();
    onClose();
  };

  return (
    <Modal
      title="Export Configuration"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="export" type="primary" onClick={handleExport}>
          Export to Excel
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={exportConfig}
        onValuesChange={handleValuesChange}
      >
        <Form.Item name="exportAllPages" valuePropName="checked">
          <Checkbox>Export all pages (not just current page)</Checkbox>
        </Form.Item>

        <Divider orientation="left">
          <Text type="secondary">Columns to Include</Text>
        </Divider>

        <div className="grid grid-cols-2 gap-2">
          <Form.Item
            name="includeTitle"
            valuePropName="checked"
            className="mb-2"
          >
            <Checkbox>Title</Checkbox>
          </Form.Item>

          <Form.Item
            name="includeRecipientType"
            valuePropName="checked"
            className="mb-2"
          >
            <Checkbox>Recipient Type</Checkbox>
          </Form.Item>

          <Form.Item
            name="includeStatus"
            valuePropName="checked"
            className="mb-2"
          >
            <Checkbox>Status</Checkbox>
          </Form.Item>

          <Form.Item
            name="includeSendEmail"
            valuePropName="checked"
            className="mb-2"
          >
            <Checkbox>Send Email</Checkbox>
          </Form.Item>

          <Form.Item
            name="includeCreatedAt"
            valuePropName="checked"
            className="mb-2"
          >
            <Checkbox>Created At</Checkbox>
          </Form.Item>

          <Form.Item
            name="includeCreatedBy"
            valuePropName="checked"
            className="mb-2"
          >
            <Checkbox>Created By</Checkbox>
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
};

export default ExportConfigModal;
