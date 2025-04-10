import React from "react";
import { Modal } from "antd";
import AddStaffHealthCheckupPage from "./AddStaffHealthCheckupPage";

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
      title={null}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
      bodyStyle={{ padding: 0 }}
      destroyOnClose
    >
      <AddStaffHealthCheckupPage onSuccess={onSuccess} onClose={onClose} />
    </Modal>
  );
};

export default AddStaffHealthCheckupModal;