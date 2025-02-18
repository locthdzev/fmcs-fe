// src/components/schedule/ScheduleModal.tsx
import React, { useEffect } from "react";
import { Modal, Form, Select, Checkbox, DatePicker, Button, Input } from "antd";
import dayjs from "dayjs";
import { ScheduleCreateRequest } from "@/api/schedule";

interface ScheduleModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (values: ScheduleCreateRequest) => void;
  viewMode: "staff" | "shift";
  options: any[];
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({
  visible,
  onCancel,
  onSubmit,
  viewMode,
  options,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (!visible) form.resetFields();
  }, [visible]);

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const processedValues = {
        ...values,
        recurringEndDate: values.recurringEndDate?.format("YYYY-MM-DD"),
        recurringDays: values.recurringDays?.map(Number),
      };
      onSubmit(processedValues);
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
      <Form form={form} layout="vertical">
        <Form.Item
          name={viewMode === "staff" ? "shiftId" : "staffId"}
          label={viewMode === "staff" ? "Select Shift" : "Select Staff"}
          rules={[{ required: true, message: "This field is required" }]}
        >
          <Select
            showSearch
            optionFilterProp="label"
            options={options.map((option) => ({
              value: option.id,
              label: viewMode === "staff" ? option.shiftName : option.fullName,
            }))}
          />
        </Form.Item>

        <Form.Item name="note" label="Note">
          <Input.TextArea placeholder="Enter note..." />
        </Form.Item>

        <Form.Item name="isRecurring" valuePropName="checked">
          <Checkbox>Repeat weekly</Checkbox>
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
