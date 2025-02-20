// src/components/schedule/ScheduleModal.tsx
import React, { useEffect } from "react";
import {
  Modal,
  Form,
  Select,
  Checkbox,
  DatePicker,
  Button,
  Input,
  Switch,
} from "antd";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import { ScheduleCreateRequest } from "@/api/schedule";
import { toast } from "react-toastify";
import { ShiftResponse } from "@/api/shift";

interface ScheduleModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (values: ScheduleCreateRequest) => void;
  viewMode: "staff" | "shift";
  options: any[];
  fullName?: string;
  userName?: string;
  selectedDate?: string;
  shiftName?: string; // Tên ca làm việc
  startTime?: string; // Thời gian bắt đầu
  endTime?: string; // Thời gian kết thúc
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({
  visible,
  onCancel,
  onSubmit,
  viewMode,
  options,
  fullName,
  userName,
  selectedDate,
  shiftName,
  startTime,
  endTime,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (!visible) form.resetFields();
  }, [visible]);

  const handleSubmit = () => {
    form
      .validateFields()
      .then((values) => {
        try {
          const processedValues = {
            ...values,
            recurringEndDate: values.recurringEndDate?.format("YYYY-MM-DD"),
            recurringDays: values.recurringDays?.map(Number),
          };
          onSubmit(processedValues);
          toast.success("Schedule created successfully");
        } catch (error) {
          toast.error("Failed to create schedule");
        }
      })
      .catch(() => {
        toast.error("Please fill in all required fields");
      });
  };

  return (
    <Modal
      title={`Add ${viewMode === "staff" ? "Shift" : "Staff"}`}
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" onClick={handleSubmit}>
          Submit
        </Button>,
      ]}
    >
      <div style={{ marginBottom: "15px" }}>
        {/* Hiển thị thông tin nhân viên nếu viewMode là "staff" */}
        {viewMode === "staff" && fullName && (
          <p>
            <strong>Staff:</strong> {fullName} {userName && `(${userName})`}
          </p>
        )}

        {/* Hiển thị thông tin ca làm việc nếu viewMode là "shift" */}
        {viewMode === "shift" && shiftName && (
          <p>
            <strong>Shift:</strong> {shiftName} ({startTime?.slice(0, 5)} -{" "}
            {endTime?.slice(0, 5)})
          </p>
        )}

        {/* Hiển thị ngày tháng năm và thứ */}
        {selectedDate && (
          <p>
            <strong>Date:</strong>{" "}
            {dayjs(selectedDate).format("dddd, DD/MM/YYYY")}
          </p>
        )}
      </div>
      <Form form={form} layout="vertical">
        <Form.Item
          name={viewMode === "staff" ? "shiftId" : "staffId"}
          label={viewMode === "staff" ? "Select Shift" : "Select Staff"}
          rules={[{ required: true, message: "This field is required" }]}
        >
          <Select
            showSearch
            optionFilterProp="label"
            options={options
              .filter(
                (option) =>
                  viewMode !== "staff" ||
                  (option as ShiftResponse).status === "Active"
              )
              .map((option) => ({
                value: option.id,
                label:
                  viewMode === "staff" ? option.shiftName : option.fullName,
              }))}
          />
        </Form.Item>

        <Form.Item name="note" label="Note">
          <Input.TextArea placeholder="Enter note..." />
        </Form.Item>

        <Form.Item name="isRecurring" valuePropName="checked">
          <Switch
            checkedChildren="Repeat weekly"
            unCheckedChildren="One time"
          />
        </Form.Item>
        <Form.Item
          noStyle
          shouldUpdate={(prev, current) =>
            prev.isRecurring !== current.isRecurring
          }
        >
          {({ getFieldValue }) =>
            getFieldValue("isRecurring") && (
              <>
                <Form.Item
                  name="recurringDays"
                  label="Repeat on days"
                  rules={[{ required: true, message: "Please select days" }]}
                >
                  <Select mode="multiple">
                    {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                      <Select.Option key={day} value={day}>
                        {dayjs().day(day).format("dddd")}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  name="recurringEndDate"
                  label="Repeat until"
                  rules={[
                    { required: true, message: "Please select end date" },
                  ]}
                >
                  <DatePicker
                    disabledDate={(current) =>
                      current && current < dayjs().endOf("day")
                    }
                  />
                </Form.Item>
              </>
            )
          }
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ScheduleModal;
