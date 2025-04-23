import React, { useState, useEffect } from "react";
import { Modal, Form, Input, InputNumber, DatePicker, Button, Spin, Divider, Select } from "antd";
import { toast } from "react-toastify";
import dayjs, { Dayjs } from "dayjs";
import {
  PeriodicHealthCheckupsDetailsStudentRequestDTO,
  PeriodicHealthCheckupsDetailsStudentResponseDTO,
  updateHealthCheckup,
} from "@/api/periodic-health-checkup-student-api";
import Cookies from "js-cookie";

interface UpdateStudentHealthCheckupProps {
  visible: boolean;
  checkup: PeriodicHealthCheckupsDetailsStudentResponseDTO | null;
  onClose: () => void;
  onSuccess: () => void;
}

const UpdateStudentHealthCheckup: React.FC<UpdateStudentHealthCheckupProps> = ({
  visible,
  checkup,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (checkup && visible) {
      form.setFieldsValue({
        heightCm: checkup.heightCm,
        weightKg: checkup.weightKg,
        bmi: checkup.bmi,
        pulseRate: checkup.pulseRate,
        bloodPressure: checkup.bloodPressure,
        internalMedicineStatus: checkup.internalMedicineStatus,
        surgeryStatus: checkup.surgeryStatus,
        dermatologyStatus: checkup.dermatologyStatus,
        eyeRightScore: checkup.eyeRightScore,
        eyeLeftScore: checkup.eyeLeftScore,
        eyePathology: checkup.eyePathology,
        entStatus: checkup.entstatus, // Consistent naming
        dentalOralStatus: checkup.dentalOralStatus,
        conclusion: checkup.conclusion,
        recommendations: checkup.recommendations,
        nextCheckupDate: checkup.nextCheckupDate ? dayjs(checkup.nextCheckupDate) : null,
        status: checkup.status,
      });
    }
  }, [checkup, visible, form]);

  const calculateBMI = () => {
    const height = form.getFieldValue("heightCm");
    const weight = form.getFieldValue("weightKg");
    if (height && weight) {
      const heightInMeters = height / 100;
      const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(1);
      form.setFieldsValue({ bmi: parseFloat(bmi) });
    }
  };

  const handleSubmit = async (values: any) => {
    if (!checkup) return;

    setLoading(true);
    try {
      const token = Cookies.get("token");
      if (!token) throw new Error("No authentication token found");

      const requestData: PeriodicHealthCheckupsDetailsStudentRequestDTO = {
        periodicHealthCheckUpId: checkup.periodicHealthCheckUpId,
        heightCm: values.heightCm,
        weightKg: values.weightKg,
        bmi: values.bmi,
        pulseRate: values.pulseRate,
        bloodPressure: values.bloodPressure,
        internalMedicineStatus: values.internalMedicineStatus,
        surgeryStatus: values.surgeryStatus,
        dermatologyStatus: values.dermatologyStatus,
        eyeRightScore: values.eyeRightScore,
        eyeLeftScore: values.eyeLeftScore,
        eyePathology: values.eyePathology,
        entstatus: values.entStatus,
        dentalOralStatus: values.dentalOralStatus,
        classification: undefined,
        conclusion: values.conclusion,
        recommendations: values.recommendations,
        nextCheckupDate: values.nextCheckupDate ? values.nextCheckupDate.toISOString() : undefined,
        status: values.status,
        createdBy: checkup.createdBy,
        mssv: checkup.mssv,
      };

      const response = await updateHealthCheckup(checkup.id, requestData, token);
      if (response.isSuccess) {
        toast.success("Health checkup updated successfully!");
        onSuccess();
        onClose();
      } else {
        throw new Error(response.message || "Failed to update health checkup");
      }
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Update Student Health Checkup"
      open={visible} // Updated from 'visible' to 'open' for Ant Design v5 compatibility
      onCancel={onClose}
      footer={null}
      width={800}
      style={{ top: 20 }}
    >
      <Spin spinning={loading} tip="Updating health checkup...">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{}}
          onValuesChange={(changedValues) => {
            if (changedValues.heightCm || changedValues.weightKg) calculateBMI();
          }}
        >
          <Divider orientation="left">Vital Signs</Divider>
          <div style={{ display: "flex", gap: "16px" }}>
            <Form.Item
              name="heightCm"
              label="Height (cm)"
              rules={[
                { required: true, message: "Please enter height" },
                { type: "number", min: 50, max: 250, message: "Height must be between 50 and 250 cm" },
              ]}
              style={{ flex: 1 }}
            >
              <InputNumber min={50} max={250} style={{ width: "100%" }} placeholder="e.g., 170" />
            </Form.Item>
            <Form.Item
              name="weightKg"
              label="Weight (kg)"
              rules={[
                { required: true, message: "Please enter weight" },
                { type: "number", min: 20, max: 200, message: "Weight must be between 20 and 200 kg" },
              ]}
              style={{ flex: 1 }}
            >
              <InputNumber min={20} max={200} style={{ width: "100%" }} placeholder="e.g., 70" />
            </Form.Item>
            <Form.Item name="bmi" label="BMI" style={{ flex: 1 }}>
              <InputNumber disabled style={{ width: "100%" }} placeholder="Auto-calculated" />
            </Form.Item>
          </div>

          <div style={{ display: "flex", gap: "16px" }}>
            <Form.Item
              name="pulseRate"
              label="Pulse Rate (bpm)"
              rules={[{ type: "number", min: 30, max: 200, message: "Pulse rate must be between 30 and 200 bpm" }]}
              style={{ flex: 1 }}
            >
              <InputNumber min={30} max={200} style={{ width: "100%" }} placeholder="e.g., 72" />
            </Form.Item>
            <Form.Item
              name="bloodPressure"
              label="Blood Pressure (mmHg)"
              rules={[
                { required: true, message: "Please enter blood pressure" },
                { pattern: /^\d{2,3}\/\d{2,3}$/, message: "Format: systolic/diastolic (e.g., 120/80)" },
              ]}
              style={{ flex: 1 }}
            >
              <Input placeholder="e.g., 120/80" />
            </Form.Item>
          </div>

          <Divider orientation="left">Specialty Examinations</Divider>
          <div style={{ display: "flex", gap: "16px" }}>
            <Form.Item name="internalMedicineStatus" label="Internal Medicine" style={{ flex: 1 }}>
              <Input placeholder="e.g., Normal" />
            </Form.Item>
            <Form.Item name="surgeryStatus" label="Surgery" style={{ flex: 1 }}>
              <Input placeholder="e.g., No issues" />
            </Form.Item>
          </div>
          <div style={{ display: "flex", gap: "16px" }}>
            <Form.Item name="dermatologyStatus" label="Dermatology" style={{ flex: 1 }}>
              <Input placeholder="e.g., Clear skin" />
            </Form.Item>
            <Form.Item name="entStatus" label="ENT" style={{ flex: 1 }}>
              <Input placeholder="e.g., Normal hearing" />
            </Form.Item>
          </div>

          <Divider orientation="left">Vision and Dental</Divider>
          <div style={{ display: "flex", gap: "16px" }}>
            <Form.Item
              name="eyeRightScore"
              label="Right Eye Score"
              rules={[{ type: "number", min: 0, max: 10, message: "Score must be between 0 and 10" }]}
              style={{ flex: 1 }}
            >
              <InputNumber min={0} max={10} style={{ width: "100%" }} placeholder="e.g., 10" />
            </Form.Item>
            <Form.Item
              name="eyeLeftScore"
              label="Left Eye Score"
              rules={[{ type: "number", min: 0, max: 10, message: "Score must be between 0 and 10" }]}
              style={{ flex: 1 }}
            >
              <InputNumber min={0} max={10} style={{ width: "100%" }} placeholder="e.g., 10" />
            </Form.Item>
            <Form.Item name="eyePathology" label="Eye Pathology" style={{ flex: 1 }}>
              <Input placeholder="e.g., None" />
            </Form.Item>
          </div>
          <Form.Item name="dentalOralStatus" label="Dental/Oral Status">
            <Input placeholder="e.g., Healthy teeth" />
          </Form.Item>

          <Divider orientation="left">Summary</Divider>
          <Form.Item name="conclusion" label="Conclusion">
            <Input.TextArea rows={3} placeholder="Overall health assessment" />
          </Form.Item>
          <Form.Item name="recommendations" label="Recommendations">
            <Input.TextArea rows={3} placeholder="e.g., Annual checkup recommended" />
          </Form.Item>
          <Form.Item name="nextCheckupDate" label="Next Checkup Date">
            <DatePicker
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
              disabledDate={(current) => current && current < dayjs().endOf("day")}
            />
          </Form.Item>
          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: "Please select a status" }]}
          >
            <Select placeholder="Select status">
              <Select.Option value="Active">Active</Select.Option>
              <Select.Option value="Inactive">Inactive</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <div style={{ textAlign: "right" }}>
              <Button onClick={onClose} style={{ marginRight: 8 }} disabled={loading}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Update
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
};

export default UpdateStudentHealthCheckup;