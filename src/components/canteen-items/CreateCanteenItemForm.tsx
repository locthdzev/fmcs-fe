import React, { useState } from "react";
import { Button, Input, Textarea } from "@heroui/react";
import { createCanteenItem } from "@/api/canteenitems";
import { toast } from "react-toastify";

interface CreateCanteenItemFormProps {
  onClose: () => void;
  onCreate: () => void;
}

const initialFormState = {
  itemName: "",
  description: "",
  unitPrice: "",
  available: "",
  createdAt: new Date().toISOString(),
  status: "Active",
  imageFile: undefined as File | undefined, // add this line to handle the imageFile state
};


export const CreateCanteenItemForm: React.FC<CreateCanteenItemFormProps> = ({
  onClose,
  onCreate,
}) => {
  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    let { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "available" ? (value === "true" ? "true" : "false") : value,
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
    console.log("Sending data:", formData);

    try {
      setLoading(true);

      // Gửi API với dữ liệu form và file ảnh
      const response = await createCanteenItem(
        {
          itemName: formData.itemName,
          description: formData.description,
          unitPrice: formData.unitPrice.trim(),
          available: formData.available.toString(),
          createdAt: new Date().toISOString(),
          status: formData.status,
        },
        formData.imageFile // Truyền file ảnh vào đây
      );

      console.log("API Response:", response);
      toast.success(response.message || "Canteen item created successfully");
      onCreate();
      onClose();
    } catch (error) {
      console.error("API Error:", error);
      toast.error("Failed to create canteen item");
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
          checked={formData.available === "true"}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              available: e.target.checked ? "true" : "false",
            }))
          }
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
          Create Canteen Item
        </Button>
      </div>
    </form>
  );
};
