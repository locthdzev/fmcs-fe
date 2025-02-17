import React, { useState, useEffect } from "react";
import { Button, Input, Textarea } from "@heroui/react";
import { updateCanteenItem, getCanteenItem } from "@/api/canteenitems";
import { toast } from "react-toastify";
import { CanteenItemResponse } from "@/api/canteenitems";


interface EditCanteenItemFormProps {
  canteenItemId: string;
  onClose: () => void;
  onUpdate: (updatedItem: CanteenItemResponse) => void;
}


const initialFormState = {
  itemName: "",
  description: "",
  unitPrice: "",
  available: false, // Dùng boolean thay vì string
  updatedAt: new Date().toISOString(), // Sử dụng updatedAt thay vì createdAt
  status: "Active",
  imageFile: undefined as File | undefined,
};

export const EditCanteenItemForm: React.FC<EditCanteenItemFormProps> = ({
  canteenItemId,
  onClose,
  onUpdate,
}) => {
  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const canteenItemData = await getCanteenItem(canteenItemId);
        setFormData({
          itemName: canteenItemData.itemName,
          description: canteenItemData.description || "",
          unitPrice: canteenItemData.unitPrice.toString(),
          available: canteenItemData.available === "true", // Chuyển thành boolean
          updatedAt: new Date().toISOString(), // Cập nhật thời gian mới
          status: canteenItemData.status || "Active",
          imageFile: undefined, // Không có file ảnh ban đầu
        });
      } catch (error) {
        toast.error("Failed to load canteen item details");
      }
    };

    fetchData();
  }, [canteenItemId]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    let { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      available: e.target.checked, // Dùng boolean thay vì string
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : undefined;
    setFormData((prev) => ({
      ...prev,
      imageFile: file,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const updatedItem = await updateCanteenItem(canteenItemId, {
        itemName: formData.itemName,
        description: formData.description,
        unitPrice: formData.unitPrice.trim(),
        available: formData.available.toString(),
        updatedAt: new Date().toISOString(),
        status: formData.status,
      }, formData.imageFile);
  
      toast.success("Canteen item updated successfully");
  
      onUpdate(updatedItem); // ✅ Cập nhật ngay sau khi chỉnh sửa
      onClose();
    } catch (error) {
      toast.error("Failed to update canteen item");
    } finally {
      setLoading(false);
    }
  };
  

  const handleReset = () => {
    setFormData(initialFormState);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <Input
          label="Item Name"
          name="itemName"
          value={formData.itemName}
          onChange={handleInputChange}
          required
        />
        <Textarea
          label="Description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
        />
        <Input
          label="Unit Price"
          name="unitPrice"
          value={formData.unitPrice}
          onChange={handleInputChange}
          required
        />
        <Input
          label="Available"
          name="available"
          type="checkbox"
          checked={formData.available} // Sử dụng boolean thay vì string
          onChange={handleCheckboxChange}
        />
        <Input
          label="Upload Image"
          name="imageFile"
          type="file"
          onChange={handleFileChange}
        />
      </div>
      <div className="flex justify-end space-x-2 mt-4">
        <Button type="button" variant="flat" onClick={handleReset}>
          Reset
        </Button>
        <Button type="submit" color="primary" isLoading={loading}>
          Update Canteen Item
        </Button>
      </div>
    </form>
  );
};
