import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  InputNumber,
  Button,
  Space,
  Typography,
  message,
  Select,
  Divider,
  Card,
} from "antd";
import {
  SettingOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  CalendarOutlined,
} from "@ant-design/icons";

import {
  getHealthInsuranceConfig,
  setHealthInsuranceConfig,
} from "@/api/healthinsurance";

const { Title, Text } = Typography;
const { Option } = Select;

interface InsuranceConfigModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const InsuranceConfigModal: React.FC<InsuranceConfigModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchLoading, setFetchLoading] = useState<boolean>(false);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (visible) {
      fetchConfig();
    }
  }, [visible]);

  const fetchConfig = async () => {
    setFetchLoading(true);
    try {
      const config = await getHealthInsuranceConfig();
      form.setFieldsValue({
        reminderInterval: config.reminderIntervalDays,
        deadlineDays: config.deadlineDays,
        warningThresholdDays: config.warningThresholdDays,
      });
    } catch (error) {
      messageApi.error("Failed to fetch insurance configuration");
      console.error("Error fetching insurance configuration:", error);
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const config = {
        reminderIntervalDays: values.reminderInterval,
        deadlineDays: values.deadlineDays,
        warningThresholdDays: values.warningThresholdDays,
      };

      const result = await setHealthInsuranceConfig(config);
      
      if (result.isSuccess) {
        messageApi.success("Insurance configuration updated successfully");
        onSuccess();
      } else {
        messageApi.error(result.message || "Failed to update insurance configuration");
      }
    } catch (error) {
      messageApi.error("Failed to update insurance configuration");
      console.error("Error updating insurance configuration:", error);
    } finally {
      setLoading(false);
    }
  };

  const warningThresholdOptions = [
    { value: 1, label: "1 day before expiry" },
    { value: 3, label: "3 days before expiry" },
    { value: 7, label: "7 days before expiry" },
    { value: 14, label: "14 days before expiry" },
    { value: 30, label: "30 days before expiry" },
    { value: 60, label: "60 days before expiry" },
    { value: 90, label: "90 days before expiry" },
  ];

  return (
    <Modal
      title={
        <Space>
          <SettingOutlined />
          <Title level={4} style={{ margin: 0 }}>
            Health Insurance Configuration
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
          reminderInterval: 3,
          deadlineDays: 7,
          warningThresholdDays: [30, 7, 1],
        }}
      >
        <Card className="mb-4">
          <Space align="center" className="mb-2">
            <ClockCircleOutlined />
            <Text strong>Reminder Settings</Text>
          </Space>
          <Divider style={{ margin: "8px 0" }} />

          <Form.Item
            name="reminderInterval"
            label="Reminder Interval (days)"
            rules={[
              { required: true, message: "Please input reminder interval" },
              { type: "number", min: 1, message: "Interval must be at least 1 day" }
            ]}
          >
            <InputNumber 
              min={1} 
              max={30} 
              style={{ width: "100%" }} 
              placeholder="Enter interval in days"
            />
          </Form.Item>

          <Form.Item
            name="deadlineDays"
            label="Deadline After Initial Creation (days)"
            rules={[
              { required: true, message: "Please input deadline days" },
              { type: "number", min: 1, message: "Deadline must be at least 1 day" }
            ]}
            tooltip="Number of days users have to complete their insurance information after initial creation"
          >
            <InputNumber 
              min={1} 
              max={90} 
              style={{ width: "100%" }} 
              placeholder="Enter deadline in days"
            />
          </Form.Item>
        </Card>

        <Card className="mb-4">
          <Space align="center" className="mb-2">
            <ExclamationCircleOutlined />
            <Text strong>Warning Thresholds</Text>
          </Space>
          <Divider style={{ margin: "8px 0" }} />

          <Form.Item
            name="warningThresholdDays"
            label="Warning Threshold Days Before Expiry"
            rules={[
              { required: true, message: "Please select at least one warning threshold" },
            ]}
            tooltip="System will send warnings when insurance is about to expire at these thresholds"
          >
            <Select
              mode="multiple"
              placeholder="Select warning thresholds"
              style={{ width: "100%" }}
              options={warningThresholdOptions}
            />
          </Form.Item>
        </Card>

        <div className="flex justify-end">
          <Space>
            <Button onClick={onClose}>Cancel</Button>
            <Button 
              type="primary" 
              onClick={handleSubmit}
              loading={loading}
            >
              Save Configuration
            </Button>
          </Space>
        </div>
      </Form>
    </Modal>
  );
};

export default InsuranceConfigModal;
