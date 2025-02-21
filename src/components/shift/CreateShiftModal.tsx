import React, { useState } from "react";
import { Modal, Form, Input, Button } from "antd";
import { ShiftCreateRequest, createShift } from "@/api/shift";
import { toast } from "react-toastify";

interface CreateShiftModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateShiftModal: React.FC<CreateShiftModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [totalTime, setTotalTime] = useState<string>("");

  const handleSubmit = async (values: ShiftCreateRequest) => {
    try {
      const response = await createShift(values);
      if (response.isSuccess) {
        toast.success("Shift created successfully!");
        form.resetFields();
        setTotalTime("");
        onSuccess();
        onClose();
      } else {
        toast.error(response.message || "Failed to create shift");
      }
    } catch {
      toast.error("Failed to create shift");
    }
  };

  const handleReset = () => {
    form.resetFields();
    setTotalTime("");
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
      title="Add New Shift"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="reset" onClick={handleReset}>
          Reset
        </Button>,
        <Button key="submit" type="primary" onClick={() => form.submit()}>
          Create
        </Button>,
      ]}
      afterClose={() => {
        form.resetFields();
        setTotalTime("");
      }}
    >
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

export default CreateShiftModal;