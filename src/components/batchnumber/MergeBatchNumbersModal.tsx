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
      const result = await getAllBatchNumbers(1, 1000); // Lấy tất cả để hiển thị trong select
      setBatchNumbers(result.data);
      form.setFieldsValue({ batchNumberIds: selectedIds });
    } catch {
      toast.error("Không thể tải danh sách batch number.");
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
        toast.success("Gộp batch number thành công!");
        onSuccess();
        onClose();
      } else {
        toast.error(response.message || "Không thể gộp batch number");
      }
    } catch {
      toast.error("Không thể gộp batch number");
    }
  };

  return (
    <Modal
      title="Gộp Batch Numbers"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Hủy
        </Button>,
        <Button key="submit" type="primary" onClick={() => form.submit()}>
          Gộp
        </Button>,
      ]}
    >
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <Form.Item
          name="batchNumberIds"
          label="Chọn Batch Numbers để gộp"
          rules={[
            { required: true, message: "Vui lòng chọn ít nhất 2 batch number" },
          ]}
        >
          <Select mode="multiple" placeholder="Chọn batch numbers">
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
