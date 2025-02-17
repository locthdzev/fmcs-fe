import React, { useEffect, useState } from "react";
import { Button, Input } from "@heroui/react";
import { updateCanteenOrder, getCanteenOrderById, CanteenOrderUpdateRequest } from "@/api/canteenorder";
import { toast } from "react-toastify";

interface EditCanteenOrderFormProps {
  orderId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export const EditCanteenOrderForm: React.FC<EditCanteenOrderFormProps> = ({
  orderId,
  onClose,
  onUpdate,
}) => {
  const [formData, setFormData] = useState<CanteenOrderUpdateRequest | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const orderData = await getCanteenOrderById(orderId);
        setFormData({
          licensePlate: orderData.licensePlate,
          orderDate: orderData.orderDate,
          updatedAt: new Date().toISOString(),
          status: orderData.status || "Active",
        });
      } catch (error) {
        toast.error("Failed to load order details");
      }
    };

    fetchData();
  }, [orderId]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formDataToSend.append(key, value.toString());
        }
      });

      setLoading(true);
      await updateCanteenOrder(orderId, formDataToSend);
      toast.success("Canteen order updated successfully");
      onUpdate();
      onClose();
    } catch (error) {
      toast.error("Failed to update canteen order");
    } finally {
      setLoading(false);
    }
  };

  if (!formData) {
    return <p>Loading...</p>;
  }

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
        />
        <Input
          label="Status"
          name="status"
          value={formData.status}
          onChange={handleInputChange}
        />
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <Button type="button" variant="flat" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" color="primary" isLoading={loading}>
          Update Order
        </Button>
      </div>
    </form>
  );
};
