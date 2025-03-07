import React, { useEffect, useState } from "react";
import { Modal, Form, Input, DatePicker, Switch, Select, Upload, Button } from "antd";
import {
  HealthInsuranceResponseDTO,
  HealthInsuranceCreateManualDTO,
  HealthInsuranceUpdateRequestDTO,
  createHealthInsuranceManual,
  updateHealthInsurance,
} from "@/api/health-insurance-api";
import { toast } from "react-toastify";
import moment from "moment";

interface EditHealthInsuranceModalProps {
  visible: boolean;
  insurance: HealthInsuranceResponseDTO | null;
  onClose: () => void;
  onSuccess: () => void;
}

const EditHealthInsuranceModal: React.FC<EditHealthInsuranceModalProps> = ({
  visible,
  insurance,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);
  const [hasInsurance, setHasInsurance] = useState<boolean>(true);

  useEffect(() => {
    if (insurance) {
      form.setFieldsValue({
        userId: insurance.userId,
        healthInsuranceNumber: insurance.healthInsuranceNumber,
        fullName: insurance.fullName,
        dateOfBirth: insurance.dateOfBirth ? moment(insurance.dateOfBirth) : null,
        gender: insurance.gender,
        address: insurance.address,
        healthcareProviderName: insurance.healthcareProviderName,
        healthcareProviderCode: insurance.healthcareProviderCode,
        validFrom: insurance.validFrom ? moment(insurance.validFrom) : null,
        validTo: insurance.validTo ? moment(insurance.validTo) : null,
        issueDate: insurance.issueDate ? moment(insurance.issueDate) : null,
        hasInsurance: insurance.status !== "NotApplicable",
        updateMethod: "Manual",
      });
      setHasInsurance(insurance.status !== "NotApplicable");
      if (insurance.imageUrl) {
        setFileList([{ uid: "-1", name: "image", url: insurance.imageUrl }]);
      }
    } else {
      form.resetFields();
      setFileList([]);
      setHasInsurance(true);
    }
  }, [insurance, form]);

  const handleSubmit = async (values: any) => {
    try {
      const imageFile = fileList[0]?.originFileObj;
      if (insurance) {
        const request: HealthInsuranceUpdateRequestDTO = {
          healthInsuranceNumber: values.healthInsuranceNumber,
          fullName: values.fullName,
          dateOfBirth: values.dateOfBirth?.format("YYYY-MM-DD"),
          gender: values.gender,
          address: values.address,
          healthcareProviderName: values.healthcareProviderName,
          healthcareProviderCode: values.healthcareProviderCode,
          validFrom: values.validFrom?.format("YYYY-MM-DD"),
          validTo: values.validTo?.format("YYYY-MM-DD"),
          issueDate: values.issueDate?.format("YYYY-MM-DD"),
          hasInsurance: values.hasInsurance,
          updateMethod: values.updateMethod,
        };
        const response = await updateHealthInsurance(insurance.id, request, imageFile);
        if (response.isSuccess) {
          toast.success("Health insurance updated successfully!");
          onSuccess();
          onClose();
        } else {
          toast.error(response.message || "Unable to update health insurance");
        }
      } else {
        const request: HealthInsuranceCreateManualDTO = {
          userId: values.userId,
          healthInsuranceNumber: values.healthInsuranceNumber,
          fullName: values.fullName,
          dateOfBirth: values.dateOfBirth?.format("YYYY-MM-DD"),
          gender: values.gender,
          address: values.address,
          healthcareProviderName: values.healthcareProviderName,
          healthcareProviderCode: values.healthcareProviderCode,
          validFrom: values.validFrom?.format("YYYY-MM-DD"),
          validTo: values.validTo?.format("YYYY-MM-DD"),
          issueDate: values.issueDate?.format("YYYY-MM-DD"),
          hasInsurance: values.hasInsurance,
        };
        const response = await createHealthInsuranceManual(request, imageFile);
        if (response.isSuccess) {
          toast.success("Health insurance created successfully!");
          onSuccess();
          onClose();
        } else {
          toast.error(response.message || "Unable to create health insurance");
        }
      }
    } catch {
      toast.error("An error occurred while saving health insurance");
    }
  };

  const uploadProps = {
    onRemove: () => setFileList([]),
    beforeUpload: (file: any) => {
      setFileList([file]);
      return false;
    },
    fileList,
  };

  return (
    <Modal
      title={insurance ? "Edit Health Insurance" : "Add Health Insurance"}
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" onClick={() => form.submit()}>
          {insurance ? "Update" : "Create"}
        </Button>,
      ]}
    >
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <Form.Item
          name="userId"
          label="User ID"
          rules={[{ required: true, message: "Please enter User ID!" }]}
        >
          <Input disabled={!!insurance} />
        </Form.Item>
        <Form.Item name="hasInsurance" label="Has Insurance" valuePropName="checked">
          <Switch onChange={setHasInsurance} />
        </Form.Item>
        {hasInsurance && (
          <>
            <Form.Item name="healthInsuranceNumber" label="Insurance Number">
              <Input />
            </Form.Item>
            <Form.Item name="fullName" label="Full Name">
              <Input />
            </Form.Item>
            <Form.Item name="dateOfBirth" label="Date of Birth">
              <DatePicker format="YYYY-MM-DD" />
            </Form.Item>
            <Form.Item name="gender" label="Gender">
              <Select>
                <Select.Option value="Male">Male</Select.Option>
                <Select.Option value="Female">Female</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="address" label="Address">
              <Input />
            </Form.Item>
            <Form.Item name="healthcareProviderName" label="Healthcare Provider Name">
              <Input />
            </Form.Item>
            <Form.Item name="healthcareProviderCode" label="Healthcare Provider Code">
              <Input />
            </Form.Item>
            <Form.Item name="validFrom" label="Valid From">
              <DatePicker format="YYYY-MM-DD" />
            </Form.Item>
            <Form.Item name="validTo" label="Valid To">
              <DatePicker format="YYYY-MM-DD" />
            </Form.Item>
            <Form.Item name="issueDate" label="Issue Date">
              <DatePicker format="YYYY-MM-DD" />
            </Form.Item>
            {insurance && (
              <Form.Item name="updateMethod" label="Update Method">
                <Select>
                  <Select.Option value="Manual">Manual</Select.Option>
                  <Select.Option value="FromImage">From Image</Select.Option>
                </Select>
              </Form.Item>
            )}
            <Form.Item label="Insurance Image">
              <Upload {...uploadProps} accept="image/*">
                <Button>Upload Image</Button>
              </Upload>
            </Form.Item>
          </>
        )}
      </Form>
    </Modal>
  );
};

export default EditHealthInsuranceModal;