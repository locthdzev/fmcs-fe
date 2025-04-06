import React, { useEffect, useState } from "react";
import { Button, Table, Modal, Form, Input, DatePicker, Select, message } from "antd";
import {
  AppointmentResponseDTO,
  getAppointmentsByUserId, // Assuming this can filter by staffId; adjust if needed
  scheduleAppointmentForHealthcareStaff,
  updateAppointmentByHealthcareStaff,
  cancelAppointmentForStaff,
  AppointmentCreateRequestDTO,
  AppointmentUpdateRequestDTO,
  getAllAppointments,
} from "@/api/appointment-api";
import Cookies from "js-cookie";
import moment from "moment";
import { createSurveyForFinishedAppointment } from "@/api/survey";

const { Option } = Select;

const AppointmentManagement: React.FC = () => {
  const [appointments, setAppointments] = useState<AppointmentResponseDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingAppointment, setEditingAppointment] = useState<AppointmentResponseDTO | null>(null);
  const token = Cookies.get("token");
  const staffId = "current-staff-id"; // Replace with actual staff ID from context or token

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const response = await getAppointmentsByUserId(staffId, 1, 10, "AppointmentDate", true); // Adjust to filter by staffId
      setAppointments(response.data);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      message.error("Failed to load appointments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchAppointments();
  }, [token]);

  const handleCreateOrUpdate = async (values: any) => {
    try {
      if (editingAppointment) {
        const updateRequest: AppointmentUpdateRequestDTO = {
          id: editingAppointment.id,
          userId: values.userId,
          staffId,
          appointmentDate: values.appointmentDate.toISOString(),
          reason: values.reason,
          status: values.status,
          sendEmailToUser: true,
          sendNotificationToUser: true,
          sendEmailToStaff: false,
          sendNotificationToStaff: false,
        };
        const response = await updateAppointmentByHealthcareStaff(editingAppointment.id, updateRequest);
        
        // Nếu trạng thái được cập nhật thành Finished, tạo khảo sát và gửi email
        if (values.status === "Finished") {
          try {
            const surveyResponse = await createSurveyForFinishedAppointment(editingAppointment.id);
            if (surveyResponse.isSuccess) {
              message.success("Survey created and email sent to user!");
            } else {
              message.warning("Appointment updated but failed to create survey. Please try again.");
            }
          } catch (error) {
            console.error("Failed to create survey:", error);
            message.warning("Appointment updated but failed to create survey. Please try again.");
          }
        }
        
        message.success("Appointment updated successfully!");
      } else {
        const createRequest: AppointmentCreateRequestDTO = {
          userId: values.userId,
          staffId,
          appointmentDate: values.appointmentDate.toISOString(),
          reason: values.reason,
          sendEmailToUser: true,
          sendNotificationToUser: true,
          sendEmailToStaff: false,
          sendNotificationToStaff: false,
          sessionId: "default-session",
        };
        await scheduleAppointmentForHealthcareStaff(createRequest);
        message.success("Appointment scheduled successfully!");
      }
      fetchAppointments();
      setIsModalVisible(false);
      form.resetFields();
      setEditingAppointment(null);
    } catch (error) {
      message.error("Failed to save appointment.");
    }
  };

  const handleCancel = async (id: string) => {
    Modal.confirm({
      title: "Are you sure you want to cancel this appointment?",
      onOk: async () => {
        try {
          await cancelAppointmentForStaff(id);
          message.success("Appointment cancelled successfully!");
          fetchAppointments();
        } catch (error) {
          message.error("Failed to cancel appointment.");
        }
      },
    });
  };

  const columns = [
    { title: "Student Name", dataIndex: "studentName", key: "studentName" },
    {
      title: "Appointment Date",
      dataIndex: "appointmentDate",
      key: "appointmentDate",
      render: (date: string) => new Date(date).toLocaleString(),
    },
    { title: "Reason", dataIndex: "reason", key: "reason" },
    { title: "Status", dataIndex: "status", key: "status" },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: AppointmentResponseDTO) => (
        <span>
          <Button onClick={() => {
            setEditingAppointment(record);
            form.setFieldsValue({
              userId: record.userId,
              appointmentDate: moment(record.appointmentDate),
              reason: record.reason,
              status: record.status,
            });
            setIsModalVisible(true);
          }}>Edit</Button>
          <Button danger onClick={() => handleCancel(record.id)} style={{ marginLeft: 8 }}>
            Cancel
          </Button>
        </span>
      ),
    },
  ];

  if (!token) return null;

  return (
    <div style={{ padding: "24px" }}>
      <h1>Manage Appointments</h1>
      <Button
        type="primary"
        onClick={() => {
          setEditingAppointment(null);
          form.resetFields();
          setIsModalVisible(true);
        }}
        style={{ marginBottom: 16 }}
      >
        Schedule New Appointment
      </Button>
      <Table
        dataSource={appointments}
        columns={columns}
        rowKey="id"
        loading={loading}
      />
      <Modal
        title={editingAppointment ? "Edit Appointment" : "Schedule Appointment"}
        visible={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingAppointment(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
      >
        <Form form={form} onFinish={handleCreateOrUpdate} layout="vertical">
          <Form.Item
            name="userId"
            label="Student ID"
            rules={[{ required: true, message: "Please enter student ID" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="appointmentDate"
            label="Appointment Date"
            rules={[{ required: true, message: "Please select a date" }]}
          >
            <DatePicker showTime format="YYYY-MM-DD HH:mm" />
          </Form.Item>
          <Form.Item
            name="reason"
            label="Reason"
            rules={[{ required: true, message: "Please enter a reason" }]}
          >
            <Input />
          </Form.Item>
          {editingAppointment && (
            <Form.Item name="status" label="Status" rules={[{ required: true }]}>
              <Select>
                <Option value="Pending">Pending</Option>
                <Option value="Confirmed">Confirmed</Option>
                <Option value="Completed">Completed</Option>
                <Option value="Cancelled">Cancelled</Option>
              </Select>
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default AppointmentManagement;