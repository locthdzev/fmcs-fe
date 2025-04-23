import React from "react";
import { Modal, Typography, Button, Space, Divider } from "antd";
import AddStaffHealthCheckupPage from "./AddStaffHealthCheckupPage";
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  SaveOutlined, 
  UserAddOutlined 
} from "@ant-design/icons";

const { Title } = Typography;

interface AddStaffHealthCheckupModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddStaffHealthCheckupModal: React.FC<AddStaffHealthCheckupModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  return (
    <Modal
      title={
        <div className="flex items-center justify-between py-3 px-6">
          <div className="flex items-center">
            <UserAddOutlined style={{ fontSize: '20px', color: '#1890ff', marginRight: 10 }} />
            <Title level={4} style={{ margin: 0 }}>Add Staff Health Checkup</Title>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={680}
      bodyStyle={{ padding: 0 }}
      destroyOnClose
      centered
      maskClosable={false}
      footer={null}
    >
      <Divider style={{ margin: 0 }} />
      <div className="p-5">
        <AddStaffHealthCheckupPage onSuccess={onSuccess} onClose={onClose} />
      </div>
    </Modal>
  );
};

export default AddStaffHealthCheckupModal;