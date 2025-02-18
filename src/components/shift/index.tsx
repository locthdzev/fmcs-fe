import React, { useState, useEffect } from "react";
import {
  Select,
  Button,
  message,
  Input,
  DatePicker,
  Table,
  Modal,
  Form,
  Switch,
} from "antd";

import { Chip } from "@heroui/react";
import {
  getShifts,
  createShift,
  updateShift,
  activateShifts,
  deactivateShifts,
  ShiftResponse,
  ShiftCreateRequest,
  ShiftUpdateRequest,
} from "@/api/shift";
import { PlusIcon, ScheduleIcon } from "../schedule/Icons";
import { toast } from "react-toastify";

const { Column } = Table;

export function ShiftManagement() {
  const [shifts, setShifts] = useState<ShiftResponse[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentShift, setCurrentShift] = useState<ShiftResponse | null>(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [totalTime, setTotalTime] = useState<string>("");

  const fetchShifts = async () => {
    try {
      const data = await getShifts();
      setShifts(data);
    } catch (error) {
      toast.error("Failed to fetch shifts.");
    }
  };

  useEffect(() => {
    fetchShifts();
  }, []);

  const showModal = (shift: ShiftResponse | null = null) => {
    if (shift) {
      setIsEditMode(true);
      setCurrentShift(shift);
      form.setFieldsValue({
        shiftName: shift.shiftName,
        startTime: shift.startTime,
        endTime: shift.endTime,
      });
      setTotalTime(calculateTotalTime(shift.startTime, shift.endTime));
    } else {
      setIsEditMode(false);
      setCurrentShift(null);
      form.resetFields();
      setTotalTime("");
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setTotalTime("");
  };

  const handleSubmit = async (
    values: ShiftCreateRequest | ShiftUpdateRequest
  ) => {
    try {
      if (isEditMode && currentShift) {
        const response = await updateShift(
          currentShift.id,
          values as ShiftUpdateRequest
        );
        if (response.isSuccess) {
          toast.success(response.message || "Shift updated successfully!");
        } else {
          toast.error(response.message || "Failed to update shift");
        }
      } else {
        const response = await createShift(values as ShiftCreateRequest);
        if (response.isSuccess) {
          toast.success(response.message || "Shift created successfully!");
        } else {
          toast.error(response.message || "Failed to create shift");
        }
      }
      fetchShifts();
      setIsModalVisible(false);
    } catch (error) {
      toast.error("Failed to save shift");
    }
  };

  const handleToggleStatus = async (shiftId: string, isActive: boolean) => {
    try {
      setLoading((prev) => ({ ...prev, [shiftId]: true }));

      if (isActive) {
        const response = await activateShifts([shiftId]);
        if (response.isSuccess) {
          toast.success(response.message || "Shift activated successfully!");
        } else {
          toast.error(response.message || "Failed to activate shift");
        }
      } else {
        const response = await deactivateShifts([shiftId]);
        if (response.isSuccess) {
          toast.success(response.message || "Shift deactivated successfully!");
        } else {
          toast.error(response.message || "Failed to deactivate shift");
        }
      }

      setShifts((prevShifts) =>
        prevShifts.map((shift) =>
          shift.id === shiftId
            ? { ...shift, status: isActive ? "Active" : "Inactive" }
            : shift
        )
      );
    } catch (error) {
      toast.error("Failed to toggle shift status");
    } finally {
      setLoading((prev) => ({ ...prev, [shiftId]: false }));
    }
  };

  const calculateTotalTime = (startTime: string, endTime: string) => {
    const start = new Date(`2000/01/01 ${startTime}`);
    const end = new Date(`2000/01/01 ${endTime}`);
    let diff = end.getTime() - start.getTime();

    if (diff < 0) {
      diff += 24 * 60 * 60 * 1000;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  };

  const handleTimeChange = () => {
    const startTime = form.getFieldValue("startTime");
    const endTime = form.getFieldValue("endTime");
    if (startTime && endTime) {
      setTotalTime(calculateTotalTime(startTime, endTime));
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 ml-4">
        <ScheduleIcon />
        <h3 className="text-2xl font-bold">Shift Management</h3>
      </div>
      <div style={{ padding: "16px" }}>
        <div
          style={{
            marginBottom: 16,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <Button
            type="primary"
            onClick={() => showModal()}
            icon={<PlusIcon />}
          >
            Add New Shift
          </Button>
        </div>

        <Table dataSource={shifts} rowKey="id">
          <Column title="Shift Name" dataIndex="shiftName" key="shiftName" />
          <Column title="Start Time" dataIndex="startTime" key="startTime" />
          <Column title="End Time" dataIndex="endTime" key="endTime" />
          <Column
            title="Total Time"
            key="totalTime"
            render={(_, record: ShiftResponse) =>
              calculateTotalTime(record.startTime, record.endTime)
            }
          />
          <Column
            title="Status"
            dataIndex="status"
            key="status"
            render={(status: string) => (
              <Chip
                className="capitalize"
                color={status === "Active" ? "success" : "danger"}
                size="sm"
                variant="flat"
              >
                {status}
              </Chip>
            )}
          />
          <Column
            title=""
            key="toggle"
            align="center"
            render={(_, record: ShiftResponse) => (
              <Switch
                checked={record.status === "Active"}
                loading={loading[record.id]}
                onChange={(checked) => handleToggleStatus(record.id, checked)}
              />
            )}
          />
          <Column
            title="Actions"
            key="actions"
            align="center"
            render={(_, record: ShiftResponse) => (
              <Button type="link" onClick={() => showModal(record)}>
                Edit
              </Button>
            )}
          />
        </Table>

        <Modal
          title={isEditMode ? "Edit Shift" : "Add New Shift"}
          open={isModalVisible}
          onCancel={handleCancel}
          footer={[
            <Button key="cancel" onClick={handleCancel}>
              Cancel
            </Button>,
            <Button key="submit" type="primary" onClick={() => form.submit()}>
              {isEditMode ? "Update" : "Create"}
            </Button>,
          ]}
        >
          <Form form={form} onFinish={handleSubmit} layout="vertical">
            <Form.Item
              name="shiftName"
              label="Shift Name"
              rules={[{ required: true, message: "Please enter shift name" }]}
            >
              <Input placeholder="Enter shift name" />
            </Form.Item>
            <Form.Item
              name="startTime"
              label="Start Time"
              rules={[{ required: true, message: "Please enter start time" }]}
            >
              <Input type="time" onChange={handleTimeChange} />
            </Form.Item>
            <Form.Item
              name="endTime"
              label="End Time"
              rules={[{ required: true, message: "Please enter end time" }]}
            >
              <Input type="time" onChange={handleTimeChange} />
            </Form.Item>
            {totalTime && (
              <Form.Item label="Total Time">
                <Input value={totalTime} disabled />
              </Form.Item>
            )}
          </Form>
        </Modal>
      </div>
    </div>
  );
}
