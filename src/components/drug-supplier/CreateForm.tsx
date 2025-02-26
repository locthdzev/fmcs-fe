import React, { useState } from "react";
import { Button, Input, Textarea } from "@heroui/react";
import { createDrugSupplier } from "@/api/drugsupplier";
import { toast } from "react-toastify";

interface CreateDrugSupplierFormProps {
  onClose: () => void;
  onCreate: () => void;
}

const initialFormState = {
  supplierName: "",
  contactNumber: "",
  email: "",
  address: "",
  createdAt: new Date().toISOString(),
  status: "Active",
};

export const CreateDrugSupplierForm: React.FC<CreateDrugSupplierFormProps> = ({
  onClose,
  onCreate,
}) => {
  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    try {
      setLoading(true);
      const response = await createDrugSupplier(formData);
      if (response.isSuccess) {
        toast.success(response.message || "Drug supplier created successfully");
        onCreate();
        onClose();
      } else {
        if (response.code === 409) {
          toast.error("Drug Supplier name already exists");
        } else {
          toast.error(response.message || "Failed to create drug supplier");
        }
      }
    } catch (error) {
      toast.error("Failed to create drug supplier");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData(initialFormState);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-4">
        <Input
          isClearable
          radius="sm"
          variant="bordered"
          label="Supplier Name"
          name="supplierName"
          value={formData.supplierName}
          onChange={handleInputChange}
          onClear={() => setFormData({ ...formData, supplierName: "" })}
          required
        />
        <Input
          isClearable
          radius="sm"
          variant="bordered"
          label="Contact Number"
          name="contactNumber"
          value={formData.contactNumber}
          onChange={handleInputChange}
          onClear={() => setFormData({ ...formData, contactNumber: "" })}
        />
        <Input
          isClearable
          radius="sm"
          variant="bordered"
          label="Email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          onClear={() => setFormData({ ...formData, email: "" })}
        />
        <div className="col-span-1">
          <Textarea
            isClearable
            radius="sm"
            variant="bordered"
            label="Address"
            name="address"
            value={formData.address || ""}
            onChange={handleInputChange}
            onClear={() => setFormData({ ...formData, address: "" })}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-6">
        <Button type="button" variant="flat" onClick={handleReset}>
          Reset
        </Button>
        <Button type="submit" color="primary" isLoading={loading}>
          Create
        </Button>
      </div>
    </form>
  );
};
