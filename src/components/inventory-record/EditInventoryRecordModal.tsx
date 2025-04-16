import React, { useEffect } from "react";
import { Modal, Form, InputNumber, Button, message } from "antd";
import {
  InventoryRecordResponseDTO,
  updateInventoryRecord,
} from "@/api/inventoryrecord";

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
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (record) {
      form.setFieldsValue({ reorderLevel: record.reorderLevel });
    }
  }, [record, form]);

  const handleSubmit = async (values: { reorderLevel: number }) => {
    try {
      const response = await updateInventoryRecord(record.id, {
        reorderLevel: values.reorderLevel,
      });
      if (response.isSuccess) {
        messageApi.success({
          content: "Inventory record updated successfully!",
          duration: 5,
        });
        onSuccess();
        onClose();
      } else {
        messageApi.error({
          content: response.message || "Failed to update inventory record",
          duration: 5,
        });
      }
    } catch {
      messageApi.error({
        content: "Failed to update inventory record",
        duration: 5,
      });
    }
  };

  return (
    <Modal
      title="Edit Inventory Record"
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
      {contextHolder}
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <Form.Item
          name="reorderLevel"
          label="Reorder Level"
          rules={[{ required: true }]}
        >
          <InputNumber min={0} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditInventoryRecordModal;
