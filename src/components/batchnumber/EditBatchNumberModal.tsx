import React, { useEffect } from "react";
import { Modal, Form, DatePicker, Button } from "antd";
import { BatchNumberResponseDTO, updateBatchNumber } from "@/api/batchnumber";
import { toast } from "react-toastify";
import moment from "moment";

interface EditBatchNumberModalProps {
  visible: boolean;
  batchNumber: BatchNumberResponseDTO;
  onClose: () => void;
  onSuccess: () => void;
}

const EditBatchNumberModal: React.FC<EditBatchNumberModalProps> = ({
  visible,
  batchNumber,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (batchNumber) {
      form.setFieldsValue({
        manufacturingDate: batchNumber.manufacturingDate
          ? moment(batchNumber.manufacturingDate)
          : null,
        expiryDate: batchNumber.expiryDate
          ? moment(batchNumber.expiryDate)
          : null,
      });
    }
  }, [batchNumber, form]);

  const handleSubmit = async (values: any) => {
    try {
      const response = await updateBatchNumber(batchNumber.id, {
        manufacturingDate: values.manufacturingDate?.format("YYYY-MM-DD"),
        expiryDate: values.expiryDate?.format("YYYY-MM-DD"),
      });
      if (response.isSuccess) {
        toast.success("Batch number updated successfully!");
        onSuccess();
        onClose();
      } else {
        toast.error(response.message || "Unable to update batch number");
      }
    } catch {
      toast.error("Unable to update batch number");
    }
  };

  return (
    <Modal
      title="Edit Batch Number"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" onClick={() => form.submit()}>
          Update
        </Button>,
      ]}
    >
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <Form.Item
          name="manufacturingDate"
          label="Manufacturing Date"
          rules={[
            { required: true, message: "Please select manufacturing date!" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || !getFieldValue("expiryDate"))
                  return Promise.resolve();
                if (value.isAfter(getFieldValue("expiryDate"))) {
                  return Promise.reject(
                    new Error(
                      "Manufacturing date cannot be later than expiry date"
                    )
                  );
                }
                return Promise.resolve();
              },
            }),
          ]}
        >
          <DatePicker format="YYYY-MM-DD" />
        </Form.Item>
        <Form.Item
          name="expiryDate"
          label="Expiry Date"
          rules={[
            { required: true, message: "Please select expiry date!" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || !getFieldValue("manufacturingDate"))
                  return Promise.resolve();
                if (getFieldValue("manufacturingDate").isAfter(value)) {
                  return Promise.reject(
                    new Error(
                      "Expiry date cannot be earlier than manufacturing date"
                    )
                  );
                }
                return Promise.resolve();
              },
            }),
          ]}
        >
          <DatePicker format="YYYY-MM-DD" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditBatchNumberModal;
