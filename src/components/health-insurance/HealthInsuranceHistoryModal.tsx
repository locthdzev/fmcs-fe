import React, { useEffect, useState } from "react";
import { Modal, Table, Button } from "antd";
import { HealthInsuranceResponseDTO, getHealthInsuranceHistory } from "@/api/health-insurance-api";
import { toast } from "react-toastify";

const { Column } = Table;

interface HealthInsuranceHistoryModalProps {
  visible: boolean;
  insurance: HealthInsuranceResponseDTO | null;
  onClose: () => void;
}

const HealthInsuranceHistoryModal: React.FC<HealthInsuranceHistoryModalProps> = ({
  visible,
  insurance,
  onClose,
}) => {
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (visible && insurance) {
      getHealthInsuranceHistory(insurance.id)
        .then((data) => setHistory(data))
        .catch(() => toast.error("Failed to load history"));
    }
  }, [visible, insurance]);

  return (
    <Modal
      title="Health Insurance History"
      open={visible}
      onCancel={onClose}
      footer={<Button onClick={onClose}>Close</Button>}
      width={800}
    >
      <Table dataSource={history} rowKey="id" pagination={false}>
        <Column title="Updated By" dataIndex={["updatedBy", "userName"]} key="updatedBy" />
        <Column
          title="Updated At"
          dataIndex="updatedAt"
          key="updatedAt"
          render={(date) => new Date(date).toLocaleString()}
        />
        <Column title="Previous Status" dataIndex="previousStatus" key="previousStatus" />
        <Column title="New Status" dataIndex="newStatus" key="newStatus" />
        <Column
          title="Change Details"
          dataIndex="changeDetails"
          key="changeDetails"
          render={(text) => <pre>{text}</pre>}
        />
      </Table>
    </Modal>
  );
};

export default HealthInsuranceHistoryModal;