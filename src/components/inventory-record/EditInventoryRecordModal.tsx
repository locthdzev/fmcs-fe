import React, { useEffect } from "react";
import { Modal, Form, InputNumber, Button } from "antd";
import { InventoryRecordResponseDTO, updateInventoryRecord } from "@/api/inventoryrecord";
import { toast } from "react-toastify";

interface EditInventoryRecordModalProps {
  visible: boolean;
  record: InventoryRecordResponseDTO;
  onClose: () => void;
  onSuccess: () => void;
}

const EditInventoryRecordModal: React.FC<EditInventoryRecordModalProps> = ({
  visible,
  record,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (record) {
      form.setFieldsValue({ reorderLevel: record.reorderLevel });
    }
  }, [record, form]);

  const handleSubmit = async (values: { reorderLevel: number }) => {
    try {
      const response = await updateInventoryRecord(record.id, { reorderLevel: values.reorderLevel });
      if (response.isSuccess) {
        toast.success("Cập nhật inventory record thành công!");
        onSuccess();
        onClose();
      } else {
        toast.error(response.message || "Không thể cập nhật inventory record");
      }
    } catch {
      toast.error("Không thể cập nhật inventory record");
    }
  };

  return (
    <Modal
      title="Chỉnh sửa Inventory Record"
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
        <Form.Item name="reorderLevel" label="Mức đặt lại" rules={[{ required: true }]}>
          <InputNumber min={0} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditInventoryRecordModal;