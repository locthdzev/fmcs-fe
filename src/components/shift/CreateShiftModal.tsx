import React, { useState } from "react";
import { Modal, Form, Input, Button, TimePicker, Space, Card, Typography, Tooltip } from "antd";
import { ShiftCreateRequest, createShift } from "@/api/shift";
import { toast } from "react-toastify";
import { InfoCircleOutlined, ClockCircleOutlined } from "@ant-design/icons";
import moment from "moment";
import type { Moment } from "moment";

const { Text } = Typography;

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

  const handleSubmit = async (values: any) => {
    try {
      // Format the time
      const formattedValues: ShiftCreateRequest = {
        shiftName: values.shiftName,
        startTime: values.startTime.format("HH:mm:ss"),
        endTime: values.endTime.format("HH:mm:ss"),
      };

      const response = await createShift(formattedValues);
      if (response.isSuccess) {
        toast.success("Shift created successfully!");
        form.resetFields();
        setTotalTime("");
        onSuccess();
        onClose();
      } else {
        toast.error(response.message || "Failed to create shift");
      }
    } catch (error) {
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

  const calculateTotalTime = (startTime: Moment, endTime: Moment) => {
    const start = startTime.clone();
    const end = endTime.clone();
    
    let diffMinutes = end.diff(start, 'minutes');
    if (diffMinutes < 0) {
      diffMinutes += 24 * 60; // Add 24 hours if end time is before start time
    }
    
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    
    return `${hours} hours ${minutes} minutes`;
  };

  return (
    <Modal
      title={
        <Space>
          <ClockCircleOutlined />
          <span>Add New Shift</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={550}
      bodyStyle={{ paddingTop: 24 }}
      footer={[
        <Button key="reset" onClick={handleReset} icon={<ClockCircleOutlined />}>
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
          rules={[{ required: true, message: "Please enter shift name" }]}
          tooltip="Enter a descriptive name for the shift (e.g., Morning Shift, Night Shift)"
        >
          <Input placeholder="Enter shift name" />
        </Form.Item>

        <Card className="mb-4" size="small" title="Shift Time">
          <div className="flex flex-col gap-4">
            <Form.Item
              name="startTime"
              label={
                <Space>
                  <Text>Start Time</Text>
                  <Tooltip title="Select the time when the shift begins">
                    <InfoCircleOutlined style={{ color: "#1890ff" }} />
                  </Tooltip>
                </Space>
              }
              rules={[{ required: true, message: "Please select start time" }]}
            >
              <TimePicker 
                format="HH:mm" 
                onChange={handleTimeChange}
                placeholder="Select start time"
                style={{ width: '100%' }}
                className="w-full"
                inputReadOnly
                minuteStep={5}
              />
            </Form.Item>

            <Form.Item
              name="endTime"
              label={
                <Space>
                  <Text>End Time</Text>
                  <Tooltip title="Select the time when the shift ends">
                    <InfoCircleOutlined style={{ color: "#1890ff" }} />
                  </Tooltip>
                </Space>
              }
              rules={[{ required: true, message: "Please select end time" }]}
            >
              <TimePicker 
                format="HH:mm" 
                onChange={handleTimeChange}
                placeholder="Select end time"
                style={{ width: '100%' }}
                className="w-full"
                inputReadOnly
                minuteStep={5}
              />
            </Form.Item>

            {totalTime && (
              <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                <Space>
                  <ClockCircleOutlined style={{ color: "#1890ff" }} />
                  <Text strong>Total Duration: {totalTime}</Text>
                </Space>
              </div>
            )}
          </div>
        </Card>
        <Text type="secondary">
          Note: Please ensure that the shift times are accurate. For overnight shifts, set the end time after midnight.
        </Text>
      </Form>
    </Modal>
  );
};

export default CreateShiftModal;