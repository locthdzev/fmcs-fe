import React from "react";
import { Modal, Typography, Button, Space, Divider } from "antd";
import AddStudentHealthCheckupPage from "./AddStudentHealthCheckupPage";
import { 
  CloseCircleOutlined, 
  SaveOutlined, 
  UserOutlined 
} from "@ant-design/icons";

const { Title } = Typography;

interface AddStudentHealthCheckupModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddStudentHealthCheckupModal: React.FC<AddStudentHealthCheckupModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  return (
    <Modal
      title={
        <div className="flex items-center justify-between py-3 px-6">
          <div className="flex items-center">
            <UserOutlined style={{ fontSize: '20px', color: '#1890ff', marginRight: 10 }} />
            <Title level={4} style={{ margin: 0 }}>Add Student Health Checkup</Title>
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
        <AddStudentHealthCheckupPage onSuccess={onSuccess} onClose={onClose} />
      </div>
    </Modal>
  );
};

export default AddStudentHealthCheckupModal;