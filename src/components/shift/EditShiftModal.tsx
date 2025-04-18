import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Button, message } from "antd";
import { ShiftResponse, ShiftUpdateRequest, updateShift } from "@/api/shift";

interface EditShiftModalProps {
  visible: boolean;
  shift: ShiftResponse | null;
  onClose: () => void;
  onSuccess: () => void;
}

const EditShiftModal: React.FC<EditShiftModalProps> = ({
  visible,
  shift,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [totalTime, setTotalTime] = useState<string>("");
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (shift) {
      form.setFieldsValue({
        shiftName: shift.shiftName,
        startTime: shift.startTime,
        endTime: shift.endTime,
      });
      setTotalTime(calculateTotalTime(shift.startTime, shift.endTime));
    }
  }, [shift, form]);

  const handleSubmit = async (values: ShiftUpdateRequest) => {
    if (!shift) return;
    if (
      values.shiftName === shift.shiftName &&
      values.startTime === shift.startTime &&
      values.endTime === shift.endTime
    ) {
      messageApi.info({
        content: "No changes were made to the shift",
        duration: 5,
      });
      onClose();
      return;
    }
    try {
      const response = await updateShift(shift.id, values);
      if (response.isSuccess) {
        messageApi.success({
          content: "Shift updated successfully!",
          duration: 5,
        });
        onSuccess();
        onClose();
      } else {
        messageApi.error({
          content: response.message || "Failed to update shift",
          duration: 5,
        });
      }
    } catch {
      messageApi.error({
        content: "Failed to update shift",
        duration: 5,
      });
    }
  };

  const handleTimeChange = () => {
    const startTime = form.getFieldValue("startTime");
    const endTime = form.getFieldValue("endTime");
    if (startTime && endTime) {
      setTotalTime(calculateTotalTime(startTime, endTime));
    }
  };

  const calculateTotalTime = (startTime: string, endTime: string) => {
    const start = new Date(`2000/01/01 ${startTime}`);
    const end = new Date(`2000/01/01 ${endTime}`);
    let diff = end.getTime() - start.getTime();
    if (diff < 0) diff += 24 * 60 * 60 * 1000;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <Modal
      title="Edit Shift"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" onClick={() => form.submit()}>
          Update
        </Button>,
      ]}
    >
      {contextHolder}
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <Form.Item
          name="shiftName"
          label="Shift Name"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="startTime"
          label="Start Time"
          rules={[{ required: true }]}
        >
          <Input type="time" onChange={handleTimeChange} />
        </Form.Item>
        <Form.Item name="endTime" label="End Time" rules={[{ required: true }]}>
          <Input type="time" onChange={handleTimeChange} />
        </Form.Item>
        {totalTime && (
          <Form.Item label="Total Time">
            <Input value={totalTime} disabled />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};

export default EditShiftModal;
