import React, { useState, useEffect } from "react";
import { Modal, Form, Select, Button } from "antd";
import { getAllBatchNumbers, mergeBatchNumbers } from "@/api/batchnumber";
import { toast } from "react-toastify";

interface MergeBatchNumbersModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedIds: string[];
}

const MergeBatchNumbersModal: React.FC<MergeBatchNumbersModalProps> = ({
  visible,
  onClose,
  onSuccess,
  selectedIds,
}) => {
  const [form] = Form.useForm();
  const [batchNumbers, setBatchNumbers] = useState<any[]>([]);

  const fetchBatchNumbers = async () => {
    try {
      const result = await getAllBatchNumbers(1, 1000); // Get all to display in select
      setBatchNumbers(result.data);
      form.setFieldsValue({ batchNumberIds: selectedIds });
    } catch {
      toast.error("Unable to load batch number list.");
    }
  };

  useEffect(() => {
    if (visible) fetchBatchNumbers();
  }, [visible]);

  const handleSubmit = async (values: { batchNumberIds: string[] }) => {
    try {
      const response = await mergeBatchNumbers({
        batchNumberIds: values.batchNumberIds,
      });
      if (response.isSuccess) {
        toast.success("Batch numbers merged successfully!");
        onSuccess();
        onClose();
      } else {
        toast.error(response.message || "Unable to merge batch numbers");
      }
    } catch {
      toast.error("Unable to merge batch numbers");
    }
  };

  return (
    <Modal
      title="Merge Batch Numbers"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" onClick={() => form.submit()}>
          Merge
        </Button>,
      ]}
    >
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <Form.Item
          name="batchNumberIds"
          label="Select Batch Numbers to merge"
          rules={[
            {
              required: true,
              message: "Please select at least 2 batch numbers",
            },
          ]}
        >
          <Select mode="multiple" placeholder="Select batch numbers">
            {batchNumbers.map((bn) => (
              <Select.Option key={bn.id} value={bn.id}>
                {`${bn.batchCode} - ${bn.drug.name}`}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default MergeBatchNumbersModal;
