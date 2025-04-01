import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  Button,
  Divider,
  Typography,
  Space,
  Spin,
} from "antd";
import { toast } from "react-toastify";
import moment from "moment";
import {
  updateTreatmentPlan,
  TreatmentPlanUpdateRequestDTO,
  TreatmentPlanResponseDTO,
} from "@/api/treatment-plan";
import { DrugResponse } from "@/api/drug";

const { Option } = Select;
const { TextArea } = Input;
const { Title } = Typography;

interface EditModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  treatmentPlan: TreatmentPlanResponseDTO;
  drugOptions: DrugResponse[];
}

const EditModal: React.FC<EditModalProps> = ({
  visible,
  onClose,
  onSuccess,
  treatmentPlan,
  drugOptions,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Reset form when modal is closed or treatmentPlan changes
  useEffect(() => {
    if (!visible || !treatmentPlan) return;

    form.setFieldsValue({
      treatmentDescription: treatmentPlan.treatmentDescription,
      instructions: treatmentPlan.instructions,
      startDate: moment(treatmentPlan.startDate),
      endDate: moment(treatmentPlan.endDate),
    });
  }, [visible, treatmentPlan, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Transform the form data to match the API structure
      const requestData: TreatmentPlanUpdateRequestDTO = {
        treatmentDescription: values.treatmentDescription,
        instructions: values.instructions,
        startDate: values.startDate.format("YYYY-MM-DD"),
        endDate: values.endDate.format("YYYY-MM-DD"),
      };

      const response = await updateTreatmentPlan(treatmentPlan.id, requestData);

      if (response.success || response.isSuccess) {
        toast.success("Treatment plan updated successfully");
        form.resetFields();
        onClose();
        onSuccess();
      } else {
        toast.error(response.message || "Failed to update treatment plan");
      }
    } catch (error) {
      console.error("Form validation error:", error);
      toast.error("Please check the form for errors");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="Edit Treatment Plan"
      open={visible}
      onCancel={handleCancel}
      width={800}
      footer={[
        <Button key="back" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
        >
          Update
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
      >
        <Title level={5}>Basic Information</Title>

        <Form.Item
          name="treatmentDescription"
          label="Treatment Description"
          rules={[{ required: true, message: "Please enter treatment description" }]}
        >
          <TextArea rows={4} placeholder="Enter treatment description" />
        </Form.Item>

        <Form.Item
          name="instructions"
          label="Instructions"
          rules={[{ required: true, message: "Please enter instructions" }]}
        >
          <TextArea rows={4} placeholder="Enter instructions" />
        </Form.Item>

        <Space className="w-full" direction="vertical">
          <Form.Item
            name="startDate"
            label="Start Date"
            rules={[{ required: true, message: "Please select start date" }]}
          >
            <DatePicker
              format="DD/MM/YYYY"
              style={{ width: "100%" }}
              placeholder="Select start date"
            />
          </Form.Item>

          <Form.Item
            name="endDate"
            label="End Date"
            rules={[
              { required: true, message: "Please select end date" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || !getFieldValue('startDate') || value.isAfter(getFieldValue('startDate'))) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('End date must be after start date'));
                },
              }),
            ]}
          >
            <DatePicker
              format="DD/MM/YYYY"
              style={{ width: "100%" }}
              placeholder="Select end date"
            />
          </Form.Item>
        </Space>
      </Form>
    </Modal>
  );
};

export default EditModal; 