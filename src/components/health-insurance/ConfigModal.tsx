import React, { useState, useEffect } from "react";
import { Modal, Form, InputNumber, Button, Space, Alert, Select } from "antd";
import {
  getHealthInsuranceConfig,
  setHealthInsuranceConfig,
  HealthInsuranceConfigDTO,
} from "@/api/healthinsurance";
import { toast } from "react-toastify";

interface ConfigModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ConfigModal({ visible, onClose }: ConfigModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchConfig();
    }
  }, [visible]);

  const fetchConfig = async () => {
    try {
      const response = await getHealthInsuranceConfig();
      console.log('Config response:', response);

      if (response.data) {
        const config = response.data;
        console.log('Setting form values:', config);
        form.setFieldsValue(config);
      }
    } catch (error) {
      console.error('Error loading config:', error);
      toast.error("Unable to load configuration");
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      console.log('Submitting values:', values);
      setLoading(true);

      const response = await setHealthInsuranceConfig(values);
      if (response.isSuccess) {
        toast.success("Configuration updated successfully");
        onClose();
      } else {
        toast.error(response.message || "Failed to update configuration");
      }
    } catch (error) {
      console.error('Error submitting config:', error);
      toast.error("Failed to update configuration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Health Insurance Configuration"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
          Save
        </Button>
      ]}
    >
      <Alert
        message="Configuration Information"
        description={
          <ul>
            <li>Reminder Interval: Number of days between reminder emails for pending insurance updates</li>
            <li>Deadline Days: Number of days given to users to update their insurance information</li>
            <li>Warning Threshold Days: Days before expiration when warning emails will be sent</li>
          </ul>
        }
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />
      
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          reminderInterval: 7,
          deadlineDays: 30,
          warningThresholdDays: [30, 7, 1]
        }}
      >
        <Form.Item
          name="reminderInterval"
          label="Reminder Interval (days)"
          rules={[
            { required: true, message: 'Please input reminder interval!' },
            { type: 'number', min: 1, message: 'Interval must be at least 1 day!' }
          ]}
        >
          <InputNumber style={{ width: '100%' }} placeholder="e.g., 3" />
        </Form.Item>

        <Form.Item
          name="deadlineDays"
          label="Deadline Days"
          rules={[
            { required: true, message: 'Please input deadline days!' },
            { type: 'number', min: 1, message: 'Deadline must be at least 1 day!' }
          ]}
        >
          <InputNumber style={{ width: '100%' }} placeholder="e.g., 30" />
        </Form.Item>

        <Form.Item
          name="warningThresholdDays"
          label="Warning Threshold Days"
          rules={[
            { required: true, message: 'Please select warning threshold days!' }
          ]}
          help="Select days before expiration to send warning emails"
        >
          <Select
            mode="multiple"
            placeholder="Select warning days"
            style={{ width: '100%' }}
            options={[
              { value: 30, label: '30 days before' },
              { value: 15, label: '15 days before' },
              { value: 7, label: '7 days before' },
              { value: 3, label: '3 days before' },
              { value: 1, label: '1 day before' }
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
