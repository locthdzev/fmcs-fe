import React from "react";
import { Modal } from "antd";
import { DrugSupplierResponse } from "@/api/drugsupplier";
import { DrugSupplierDetail } from "./DrugSupplierDetails";

interface DrugSupplierDetailsModalProps {
  supplier: DrugSupplierResponse | null;
  isOpen: boolean;
  onClose: () => void;
}

const DrugSupplierDetailsModal: React.FC<DrugSupplierDetailsModalProps> = ({ 
  supplier, 
  isOpen, 
  onClose 
}) => {
  if (!supplier) {
    return null;
  }

  return (
    <Modal
      title="Supplier Details"
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      <DrugSupplierDetail id={supplier.id} />
    </Modal>
  );
};

export default DrugSupplierDetailsModal; 