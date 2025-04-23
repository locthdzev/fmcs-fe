// components/ScheduleAppointmentForStaff.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  Button,
  Spin,
  Typography,
} from "antd";
import { toast } from "react-toastify";
import moment from "moment-timezone";
import Cookies from "js-cookie";
import {
  scheduleAppointment,
  AppointmentCreateRequestDTO,
  getAvailableTimeSlots,
  TimeSlotDTO,
} from "@/api/appointment-api";
import jwtDecode from "jwt-decode";
import dayjs from "dayjs";

const { Option } = Select;
const { Title } = Typography;

interface ScheduleAppointmentForStaffProps {
  visible: boolean;
  onClose: () => void;
  staffId: string;
}

const allTimeSlots = [
  "08:00 - 08:30",
  "08:30 - 09:00",
  "09:00 - 09:30",
  "09:30 - 10:00",
  "10:00 - 10:30",
  "10:30 - 11:00",
  "11:00 - 11:30",
  "11:30 - 12:00",
  "13:30 - 14:00",
  "14:00 - 14:30",
  "14:30 - 15:00",
  "15:00 - 15:30",
  "15:30 - 16:00",
  "16:00 - 16:30",
  "16:30 - 17:00",
  "17:00 - 17:30",
];

const ScheduleAppointmentForStaff: React.FC<
  ScheduleAppointmentForStaffProps
> = ({ visible, onClose, staffId }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<TimeSlotDTO[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const token = Cookies.get("token");

  const fetchAvailableSlots = useCallback(
    async (date: string) => {
      if (!token) return;
      setLoading(true);
      try {
        const response = await getAvailableTimeSlots(staffId, date, token);
        setAvailableSlots(response.data?.availableSlots || []);
      } catch (error: any) {
        console.error("Failed to fetch slots:", error);
        toast.error("Failed to load available slots.");
      } finally {
        setLoading(false);
      }
    },
    [staffId, token]
  );

  const onDateChange = (date: moment.Moment | null) => {
    if (date) {
      const dateStr = date.format("YYYY-MM-DD");
      setSelectedDate(dateStr);
      fetchAvailableSlots(dateStr);
    } else {
      setSelectedDate(null);
      setAvailableSlots([]);
    }
  };

  const onFinish = async (values: any) => {
    if (!token) {
      toast.error("Authentication token missing.");
      return;
    }

    setLoading(true);
    try {
      const [startTime] = values.timeSlot.split(" - ");
      const vietnamMoment = moment.tz(
        `${selectedDate} ${startTime}`,
        "YYYY-MM-DD HH:mm",
        "Asia/Ho_Chi_Minh"
      );
      const appointmentDate = vietnamMoment.format("YYYY-MM-DDTHH:mm:ssZ");

      const request: AppointmentCreateRequestDTO = {
        userId: values.userId,
        staffId,
        appointmentDate,
        reason: values.reason,
        sendEmailToUser: true,
        sendNotificationToUser: true,
        sendEmailToStaff: true,
        sendNotificationToStaff: true,
        sessionId: "",
      };

      const response = await scheduleAppointment(request, token);
      if (response.isSuccess) {
        toast.success("Appointment scheduled successfully!");
        form.resetFields();
        onClose();
      } else {
        toast.error(
          `Failed to schedule: ${response.message || "Unknown error"}`
        );
      }
    } catch (error: any) {
      console.error("Error scheduling appointment:", error);
      toast.error("Failed to schedule appointment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={<Title level={4}>Schedule Appointment with User</Title>}
      visible={visible}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ reason: "Health consultation" }}
      >
        <Form.Item
          name="userId"
          label="Student/User ID"
          rules={[
            { required: true, message: "Please enter the student/user ID" },
          ]}
        >
          <Input placeholder="Enter student/user ID" />
        </Form.Item>

        <Form.Item
          name="appointmentDate"
          label="Date"
          rules={[{ required: true, message: "Please select a date" }]}
        >
          <DatePicker
            format="YYYY-MM-DD"
            onChange={onDateChange}
            disabledDate={(current) =>
              current && current.isBefore(dayjs().startOf("day"))
            }
            style={{ width: "100%" }}
          />
        </Form.Item>

        <Form.Item
          name="timeSlot"
          label="Time Slot"
          rules={[{ required: true, message: "Please select a time slot" }]}
        >
          <Select
            placeholder="Select a time slot"
            disabled={!selectedDate || loading}
            loading={loading}
          >
            {availableSlots
              .filter((slot) => slot.isAvailable && !slot.isLocked)
              .map((slot) => (
                <Option key={slot.timeSlot} value={slot.timeSlot}>
                  {slot.timeSlot}
                </Option>
              ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="reason"
          label="Reason"
          rules={[{ required: true, message: "Please enter a reason" }]}
        >
          <Input.TextArea rows={3} placeholder="Enter reason for appointment" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Schedule Appointment
          </Button>
        </Form.Item>
      </Form>
      {loading && <Spin />}
    </Modal>
  );
};

export default ScheduleAppointmentForStaff;
