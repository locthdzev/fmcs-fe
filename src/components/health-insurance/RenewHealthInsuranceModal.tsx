import React, { useEffect, useState } from "react";
import { Modal, Form, DatePicker, Button, Upload } from "antd";
import { HealthInsuranceResponseDTO, renewHealthInsurance } from "@/api/health-insurance-api";
import { toast } from "react-toastify";
import moment from "moment";

interface RenewHealthInsuranceModalProps {
  visible: boolean;
  insurance: HealthInsuranceResponseDTO | null;
  onClose: () => void;
  onSuccess: () => void;
}

const RenewHealthInsuranceModal: React.FC<RenewHealthInsuranceModalProps> = ({
  visible,
  insurance,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);

  useEffect(() => {
    if (insurance) {
      form.setFieldsValue({
        validFrom: insurance.validFrom ? moment(insurance.validFrom) : null,
        validTo: insurance.validTo ? moment(insurance.validTo) : null,
        issueDate: insurance.issueDate ? moment(insurance.issueDate) : null,
      });
      if (insurance.imageUrl) {
        setFileList([{ uid: "-1", name: "image", url: insurance.imageUrl }]);
      }
    }
  }, [insurance, form]);

  const handleRenew = async (values: any) => {
    try {
      const imageFile = fileList[0]?.originFileObj;
      const request = {
        validFrom: values.validFrom.format("YYYY-MM-DD"),
        validTo: values.validTo.format("YYYY-MM-DD"),
        issueDate: values.issueDate?.format("YYYY-MM-DD"),
      };
      const response = await renewHealthInsurance(insurance!.id, request, imageFile);
      if (response.isSuccess) {
        toast.success("Health insurance renewed successfully!");
        onSuccess();
        onClose();
      } else {
        toast.error(response.message || "Failed to renew health insurance");
      }
    } catch {
      toast.error("An error occurred while renewing health insurance");
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
      title="Renew Health Insurance"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" onClick={() => form.submit()}>
          Renew
        </Button>,
      ]}
    >
      <Form form={form} onFinish={handleRenew} layout="vertical">
        <Form.Item
          name="validFrom"
          label="Valid From"
          rules={[{ required: true, message: "Please select Valid From date!" }]}
        >
          <DatePicker format="YYYY-MM-DD" />
        </Form.Item>
        <Form.Item
          name="validTo"
          label="Valid To"
          rules={[{ required: true, message: "Please select Valid To date!" }]}
        >
          <DatePicker format="YYYY-MM-DD" />
        </Form.Item>
        <Form.Item name="issueDate" label="Issue Date">
          <DatePicker format="YYYY-MM-DD" />
        </Form.Item>
        <Form.Item label="New Insurance Image">
          <Upload {...uploadProps} accept="image/*">
            <Button>Upload Image</Button>
          </Upload>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default RenewHealthInsuranceModal;