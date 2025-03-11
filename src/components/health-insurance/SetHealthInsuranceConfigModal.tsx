import React, { useEffect } from "react";
import { Modal, Form, InputNumber, Button, Input } from "antd";
import { setHealthInsuranceConfig, getHealthInsuranceConfig } from "@/api/health-insurance-api";
import { toast } from "react-toastify";

interface SetHealthInsuranceConfigModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SetHealthInsuranceConfigModal: React.FC<SetHealthInsuranceConfigModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible) {
      getHealthInsuranceConfig().then((config) => {
        form.setFieldsValue({
          reminderInterval: config.reminderInterval,
          deadlineDays: config.deadlineDays,
          warningThresholdDays: config.warningThresholdDays.join(", "),
        });
      });
    }
  }, [visible, form]);

  const handleSetConfig = async (values: any) => {
    try {
      const request = {
        reminderInterval: values.reminderInterval,
        deadlineDays: values.deadlineDays,
        warningThresholdDays: values.warningThresholdDays.split(",").map((day: string) => parseInt(day.trim())),
      };
      const response = await setHealthInsuranceConfig(request);
      if (response.isSuccess) {
        toast.success("Configuration updated successfully!");
        onSuccess();
        onClose();
      } else {
        toast.error(response.message || "Failed to update configuration");
      }
    } catch {
      toast.error("An error occurred while updating configuration");
    }
  };

  return (
    <Modal
      title="Set Health Insurance Configuration"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" onClick={() => form.submit()}>
          Save
        </Button>,
      ]}
    >
      <Form form={form} onFinish={handleSetConfig} layout="vertical">
        <Form.Item
          name="reminderInterval"
          label="Reminder Interval (days)"
          rules={[{ required: true, message: "Please enter reminder interval!" }]}
        >
          <InputNumber min={1} />
        </Form.Item>
        <Form.Item
          name="deadlineDays"
          label="Deadline Days"
          rules={[{ required: true, message: "Please enter deadline days!" }]}
        >
          <InputNumber min={1} />
        </Form.Item>
        <Form.Item
          name="warningThresholdDays"
          label="Warning Threshold Days (comma-separated)"
          rules={[{ required: true, message: "Please enter warning threshold days!" }]}
        >
          <Input placeholder="e.g., 30, 7, 1" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default SetHealthInsuranceConfigModal;