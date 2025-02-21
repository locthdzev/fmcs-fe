import React, { useEffect, useState } from "react";
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
  shiftName?: string;
  startTime?: string;
  endTime?: string;
  schedules: any[]; // Thêm prop schedules
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
  schedules, // Nhận schedules từ prop
}) => {
  const [form] = Form.useForm();
  const [isRecurring, setIsRecurring] = useState(false); // State để theo dõi trạng thái của Switch

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

  // Hàm kiểm tra xem ca làm việc hoặc nhân viên đã được thêm vào chưa
  const isOptionDisabled = (optionId: string) => {
    return schedules.some(
      (schedule) =>
        schedule[viewMode === "staff" ? "shiftId" : "staffId"] === optionId &&
        dayjs(schedule.workDate).isSame(selectedDate, "day")
    );
  };

  return (
    <Modal
      title={`Add ${viewMode === "staff" ? "Shifts" : "Staff"}`}
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
        {viewMode === "staff" && fullName && (
          <p>
            <strong>Staff:</strong> {fullName} {userName && `(${userName})`}
          </p>
        )}

        {viewMode === "shift" && shiftName && (
          <p>
            <strong>Shift:</strong> {shiftName} ({startTime?.slice(0, 5)} -{" "}
            {endTime?.slice(0, 5)})
          </p>
        )}

        {selectedDate && (
          <p>
            <strong>Date:</strong>{" "}
            {dayjs(selectedDate).format("dddd, DD/MM/YYYY")}
          </p>
        )}
      </div>
      <Form form={form} layout="vertical">
        <Form.Item
          name={viewMode === "staff" ? "shiftIds" : "staffIds"}
          label={viewMode === "staff" ? "Select Shifts" : "Select Staff"}
          rules={[{ required: true, message: "This field is required" }]}
        >
          <Select
            mode="multiple"
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
                disabled: isOptionDisabled(option.id), // Disable nếu đã được thêm
              }))}
          />
        </Form.Item>

        <Form.Item name="note" label="Note">
          <Input.TextArea placeholder="Enter note..." />
        </Form.Item>

        <div style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
          <Form.Item name="isRecurring" valuePropName="checked" noStyle>
            <Switch
              checked={isRecurring}
              onChange={(checked) => setIsRecurring(checked)}
            />
          </Form.Item>
          <span style={{ marginLeft: "8px" }}>
            {isRecurring ? "Repeat weekly" : "One time"}
          </span>
        </div>

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