import React, { useEffect, useState } from "react";
import { Button, Input, Textarea } from "@heroui/react";
import {
  updateDrugSupplier,
  getDrugSupplierById,
  DrugSupplierUpdateRequest,
} from "@/api/drugsupplier";
import { toast } from "react-toastify";

interface EditDrugSupplierFormProps {
  drugSupplierId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export const EditDrugSupplierForm: React.FC<EditDrugSupplierFormProps> = ({
  drugSupplierId,
  onClose,
  onUpdate,
}) => {
  const [formData, setFormData] = useState<DrugSupplierUpdateRequest | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const drugSupplierData = await getDrugSupplierById(drugSupplierId);
        setFormData({
          supplierName: drugSupplierData.supplierName,
          contactNumber: drugSupplierData.contactNumber || "",
          email: drugSupplierData.email || "",
          address: drugSupplierData.address || "",
          createdAt: drugSupplierData.createdAt,
          updatedAt: new Date().toISOString(),
          status: drugSupplierData.status || "Active",
        });
      } catch (error) {
        toast.error("Failed to load drug supplier details");
      }
    };

    fetchData();
  }, [drugSupplierId]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    try {
      setLoading(true);
      const response = await updateDrugSupplier(drugSupplierId, formData);
      if (response.isSuccess) {
        toast.success(response.message || "Drug supplier updated successfully");
        onUpdate();
        onClose();
      } else {
        if (response.code === 409) {
          toast.error("Drug Supplier name already exists");
        } else {
          toast.error(response.message || "Failed to update drug supplier");
        }
      }
    } catch (error) {
      toast.error("Failed to update drug supplier");
    } finally {
      setLoading(false);
    }
  };

  if (!formData) {
    return <p>Loading...</p>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-4">
        <Input
          label="Supplier Name"
          name="supplierName"
          value={formData.supplierName}
          onChange={handleInputChange}
          required
        />
        <Input
          label="Contact Number"
          name="contactNumber"
          value={formData.contactNumber}
          onChange={handleInputChange}
        />
        <Input
          label="Email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
        />
        <div className="col-span-1">
          <Textarea
            label="Address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <Button type="button" variant="flat" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" color="primary" isLoading={loading}>
          Update
        </Button>
      </div>
    </form>
  );
};
