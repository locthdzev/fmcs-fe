import React, { useState } from "react";
import { Button, Input } from "@heroui/react";
import { createCanteenOrder } from "@/api/canteenorder";
import { toast } from "react-toastify";

interface CreateCanteenOrderFormProps {
  onClose: () => void;
  onCreate: () => void;
}

const initialFormState = {
  licensePlate: "",
  orderDate: "",
  createdAt: new Date().toISOString(),
  status: "Active",
};

export const CreateCanteenOrderForm: React.FC<CreateCanteenOrderFormProps> = ({
  onClose,
  onCreate,
}) => {
  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formDataToSend.append(key, value.toString());
        }
      });

      setLoading(true);
      await createCanteenOrder(formDataToSend);
      toast.success("Canteen order created successfully");
      onCreate();
      onClose();
    } catch (error) {
      toast.error("Failed to create canteen order");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData(initialFormState);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="License Plate"
          name="licensePlate"
          value={formData.licensePlate}
          onChange={handleInputChange}
          required
        />
        <Input
          type="datetime-local"
          label="Order Date"
          name="orderDate"
          value={formData.orderDate}
          onChange={handleInputChange}
          required
          placeholder=" "
        />
      </div>

      <div className="flex justify-end gap-2 mt-6">
        <Button type="button" variant="flat" onClick={handleReset}>
          Reset
        </Button>
        <Button type="submit" color="primary" isLoading={loading}>
          Create Order
        </Button>
      </div>
    </form>
  );
};
