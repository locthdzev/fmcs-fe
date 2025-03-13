import React, { useState, useEffect } from "react";
import { Modal, Form, Input, DatePicker, Button, Tabs, Table } from "antd";
import {
  HealthInsuranceResponseDTO,
  updateHealthInsuranceByAdmin,
  getHealthInsuranceHistory,
  resendUpdateRequest,
  HistoryDTO,
} from "@/api/healthinsurance";
import { toast } from "react-toastify";

interface DetailModalProps {
  visible: boolean;
  insurance: HealthInsuranceResponseDTO | null;
  onClose: () => void;
  onSuccess: () => void;
}

const DetailModal: React.FC<DetailModalProps> = ({
  visible,
  insurance,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | undefined>();
  const [history, setHistory] = useState<HistoryDTO[]>([]);

  useEffect(() => {
    if (insurance) {
      form.setFieldsValue(insurance);
      fetchHistory();
    }
  }, [insurance, form]);

  const fetchHistory = async () => {
    if (!insurance) return;
    try {
      const historyData = await getHealthInsuranceHistory(insurance.id);
      setHistory(historyData);
    } catch (error) {
      toast.error("Unable to load history.");
    }
  };

  const handleUpdate = async (values: any) => {
    if (!insurance) return;
    setLoading(true);
    try {
      const data = { hasInsurance: true, ...values };
      const response = await updateHealthInsuranceByAdmin(
        insurance.id,
        data,
        imageFile
      );
      if (response.isSuccess) {
        toast.success("Insurance updated successfully!");
        onSuccess();
        onClose();
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error("Unable to update insurance.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendRequest = async () => {
    if (!insurance) return;
    try {
      const response = await resendUpdateRequest(insurance.id);
      if (response.isSuccess) {
        toast.success("Update request resent!");
        onSuccess();
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error("Unable to resend request.");
    }
  };

  const historyColumns = [
    { title: "Updated At", dataIndex: "updatedAt" },
    {
      title: "Updated By",
      render: (record: HistoryDTO) => record.updatedBy.userName,
    },
    { title: "Previous Status", dataIndex: "previousStatus" },
    { title: "New Status", dataIndex: "newStatus" },
    { title: "Change Details", dataIndex: "changeDetails" },
  ];

  const items = [
    {
      key: "1",
      label: "Details",
      children: (
        <Form form={form} onFinish={handleUpdate} layout="vertical">
          <Form.Item label="Insurance Number" name="healthInsuranceNumber">
            <Input />
          </Form.Item>
          <Form.Item label="Full Name" name="fullName">
            <Input />
          </Form.Item>
          <Form.Item label="Valid From" name="validFrom">
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Valid To" name="validTo">
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Image">
            <input
              type="file"
              onChange={(e) => setImageFile(e.target.files?.[0])}
            />
            {insurance?.imageUrl && (
              <img
                src={insurance.imageUrl}
                alt="Insurance"
                style={{ width: 100, marginTop: 8 }}
              />
            )}
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Update
          </Button>
          {insurance?.status === "DeadlineExpired" && (
            <Button onClick={handleResendRequest} style={{ marginLeft: 8 }}>
              Resend Update Request
            </Button>
          )}
        </Form>
      ),
    },
    {
      key: "2",
      label: "History",
      children: (
        <Table
          columns={historyColumns}
          dataSource={history}
          rowKey="id"
          pagination={false}
        />
      ),
    },
  ];

  return (
    <Modal
      visible={visible}
      title="Health Insurance Details"
      onCancel={onClose}
      footer={null}
      width={800}
    >
      {insurance && <Tabs defaultActiveKey="1" items={items} />}
    </Modal>
  );
};

export default DetailModal;
