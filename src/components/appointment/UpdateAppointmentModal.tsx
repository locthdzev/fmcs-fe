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
  AppointmentResponseDTO,
  AppointmentUpdateRequestDTO,
  updateAppointmentByStaff,
  getAvailableTimeSlots,
  TimeSlotDTO,
} from "@/api/appointment-api";
import dayjs from "dayjs";

const { Title } = Typography;
const { Option } = Select;

interface UpdateAppointmentModalProps {
  visible: boolean;
  onClose: () => void;
  appointment: AppointmentResponseDTO | null;
  onUpdateSuccess: () => void; // Callback to refresh appointments after update
}

const UpdateAppointmentModal: React.FC<UpdateAppointmentModalProps> = ({
  visible,
  onClose,
  appointment,
  onUpdateSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<TimeSlotDTO[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const token = Cookies.get("token");

  // Fetch available time slots when date changes
  const fetchAvailableSlots = useCallback(
    async (date: string) => {
      if (!token || !appointment?.staffId) return;
      setLoading(true);
      try {
        const response = await getAvailableTimeSlots(
          appointment.staffId,
          date,
          token
        );
        setAvailableSlots(response.data?.availableSlots || []);
      } catch (error: any) {
        console.error("Failed to fetch slots:", error);
        toast.error("Failed to load available slots.");
      } finally {
        setLoading(false);
      }
    },
    [appointment?.staffId, token]
  );

  // Initialize form with appointment data
  useEffect(() => {
    if (appointment && visible) {
      const appointmentDate = moment(appointment.appointmentDate);
      setSelectedDate(appointmentDate.format("YYYY-MM-DD"));
      fetchAvailableSlots(appointmentDate.format("YYYY-MM-DD"));

      form.setFieldsValue({
        email: appointment.studentEmail,
        appointmentDate: appointmentDate,
        timeSlot: `${moment(appointment.appointmentDate).format(
          "HH:mm"
        )} - ${moment(appointment.endTime).format("HH:mm")}`,
        reason: appointment.reason,
        status: appointment.status,
      });
    }
  }, [appointment, visible, form, fetchAvailableSlots]);

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
    if (!token || !appointment) {
      toast.error("Authentication token or appointment data missing.");
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

      const request: AppointmentUpdateRequestDTO = {
        id: appointment.id,
        userId: appointment.userId,
        staffId: appointment.staffId,
        appointmentDate,
        reason: values.reason,
        status: values.status,
        sendEmailToUser: true,
        sendNotificationToUser: true,
        sendEmailToStaff: true,
        sendNotificationToStaff: true,
      };

      const response = await updateAppointmentByStaff(
        appointment.id,
        token,
        request
      );
      if (response.isSuccess) {
        toast.success("Appointment updated successfully!");
        form.resetFields();
        onUpdateSuccess(); // Refresh the appointment list
        onClose();
      } else {
        toast.error(`Failed to update: ${response.message || "Unknown error"}`);
      }
    } catch (error: any) {
      console.error("Error updating appointment:", error);
      toast.error("Failed to update appointment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={<Title level={4}>Update Appointment</Title>}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ status: "Scheduled" }} // Default status if not set
      >
        <Form.Item
          name="email"
          label="User"
          rules={[
            { required: true, message: "Please enter the student/user Email" },
          ]}
        >
          <Input placeholder="Enter student/user Email" disabled />
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

        <Form.Item
          name="status"
          label="Status"
          rules={[{ required: true, message: "Please select a status" }]}
        >
          <Select placeholder="Select appointment status">
            <Option value="Scheduled">Scheduled</Option>
            <Option value="Happening">Happening</Option>
            <Option value="Finished">Finished</Option>
            <Option value="Missed">Missed</Option>
            <Option value="Cancelled">Cancelled</Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Update Appointment
          </Button>
        </Form.Item>
      </Form>
      {loading && <Spin />}
    </Modal>
  );
};

export default UpdateAppointmentModal;
