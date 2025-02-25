import React, { useEffect } from "react";
import { Modal, Form, DatePicker, Select, Button } from "antd";
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
        status: batchNumber.status,
      });
    }
  }, [batchNumber, form]);

  const handleSubmit = async (values: any) => {
    try {
      const response = await updateBatchNumber(batchNumber.id, {
        manufacturingDate: values.manufacturingDate?.format("YYYY-MM-DD"),
        expiryDate: values.expiryDate?.format("YYYY-MM-DD"),
        status: values.status,
      });
      if (response.isSuccess) {
        toast.success("Cập nhật batch number thành công!");
        onSuccess();
        onClose();
      } else {
        toast.error(response.message || "Không thể cập nhật batch number");
      }
    } catch {
      toast.error("Không thể cập nhật batch number");
    }
  };

  return (
    <Modal
      title="Chỉnh sửa Batch Number"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Hủy
        </Button>,
        <Button key="submit" type="primary" onClick={() => form.submit()}>
          Cập nhật
        </Button>,
      ]}
    >
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <Form.Item
          name="manufacturingDate"
          label="Ngày sản xuất"
          rules={[{ required: true }]}
        >
          <DatePicker format="YYYY-MM-DD" />
        </Form.Item>
        <Form.Item
          name="expiryDate"
          label="Ngày hết hạn"
          rules={[{ required: true }]}
        >
          <DatePicker format="YYYY-MM-DD" />
        </Form.Item>
        <Form.Item name="status" label="Trạng thái">
          <Select>
            <Select.Option value="ACTIVE">Active</Select.Option>
            <Select.Option value="INACTIVE">Inactive</Select.Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditBatchNumberModal;
