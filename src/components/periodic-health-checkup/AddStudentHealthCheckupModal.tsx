import React from "react";
import { Modal } from "antd";
import AddStudentHealthCheckupPage from "./AddStudentHealthCheckupPage";

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
      title={null}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
      bodyStyle={{ padding: 0 }}
      destroyOnClose
    >
      <AddStudentHealthCheckupPage onSuccess={onSuccess} onClose={onClose} />
    </Modal>
  );
};

export default AddStudentHealthCheckupModal;