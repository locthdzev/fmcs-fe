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
      width={1000}
      style={{ top: 20 }}
    >
      <Table 
        dataSource={history} 
        rowKey="id" 
        pagination={false}
        bordered
        scroll={{ y: 'calc(100vh - 300px)' }}
      >
        <Column 
          title="Updated By" 
          dataIndex={["updatedBy", "userName"]} 
          key="updatedBy"
          width={150} 
        />
        <Column
          title="Updated At"
          dataIndex="updatedAt"
          key="updatedAt"
          width={180}
          render={(date) => new Date(date).toLocaleString()}
        />
        <Column 
          title="Previous Status" 
          dataIndex="previousStatus" 
          key="previousStatus"
          width={150} 
        />
        <Column 
          title="New Status" 
          dataIndex="newStatus" 
          key="newStatus"
          width={150} 
        />
        <Column
          title="Change Details"
          dataIndex="changeDetails"
          key="changeDetails"
          render={(text) => <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{text}</pre>}
        />
      </Table>
    </Modal>
  );
};

export default HealthInsuranceHistoryModal;