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
  const [loading, setLoading] = React.useState(false);

  useEffect(() => {
    if (record) {
      form.setFieldsValue({ reorderLevel: record.reorderLevel });
    }
  }, [record, form]);

  const handleSubmit = async (values: { reorderLevel: number }) => {
    try {
      setLoading(true);
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
    } catch (error) {
      console.error("Error updating inventory record:", error);
      messageApi.error({
        content: "Failed to update inventory record",
        duration: 5,
      });
    } finally {
      setLoading(false);
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
        <Button 
          key="submit" 
          type="primary" 
          loading={loading} 
          onClick={() => form.submit()}
        >
          Update
        </Button>,
      ]}
    >
      {contextHolder}
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Drug:</div>
          <div>{record?.drug?.name} ({record?.drug?.drugCode})</div>
        </div>
        
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Batch Code:</div>
          <div>{record?.batchCode}</div>
        </div>
        
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Quantity in Stock:</div>
          <div>{record?.quantityInStock}</div>
        </div>
        
        <Form.Item
          name="reorderLevel"
          label="Reorder Level"
          rules={[
            { required: true, message: "Please enter reorder level" },
            { type: "number", min: 0, message: "Reorder level must be at least 0" }
          ]}
        >
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditInventoryRecordModal;
