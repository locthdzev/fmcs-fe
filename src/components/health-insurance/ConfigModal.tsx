import React, { useState, useEffect } from "react";
import { Modal, Form, InputNumber, Button } from "antd";
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

const ConfigModal: React.FC<ConfigModalProps> = ({ visible, onClose }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchConfig();
    }
  }, [visible]);

  const fetchConfig = async () => {
    try {
      const config = await getHealthInsuranceConfig();
      form.setFieldsValue(config);
    } catch (error) {
      toast.error("Unable to load config.");
    }
  };

  const handleSave = async (values: HealthInsuranceConfigDTO) => {
    setLoading(true);
    try {
      const response = await setHealthInsuranceConfig(values);
      if (response.isSuccess) {
        toast.success("Config updated successfully!");
        onClose();
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error("Unable to update config.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      title="Health Insurance Config"
      onCancel={onClose}
      footer={null}
    >
      <Form form={form} onFinish={handleSave} layout="vertical">
        <Form.Item
          label="Reminder Interval (days)"
          name="reminderIntervalDays"
          rules={[{ required: true }]}
        >
          <InputNumber min={1} />
        </Form.Item>
        <Form.Item
          label="Deadline (days)"
          name="deadlineDays"
          rules={[{ required: true }]}
        >
          <InputNumber min={1} />
        </Form.Item>
        <Form.Item
          label="Warning Thresholds (days)"
          name="warningThresholdDays"
          rules={[{ required: true }]}
        >
          <InputNumber min={1} multiple />{" "}
          {/* Giả sử hỗ trợ nhập nhiều giá trị */}
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          Save
        </Button>
      </Form>
    </Modal>
  );
};

export default ConfigModal;
