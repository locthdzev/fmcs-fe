import React, { useState } from "react";
import { Button, Input, Select, SelectItem } from "@heroui/react";
import { DrugCreateRequest, createDrug } from "@/api/drug";
import { toast } from "react-toastify";

export function CreateDrugForm() {
  const [formData, setFormData] = useState<DrugCreateRequest>({
    drugCode: "",
    name: "",
    unit: "",
    price: 0,
    drugGroupId: "",
    description: "",
    manufacturer: "",
    createdAt: new Date().toISOString(),
    status: "Active",
    imageUrl: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
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

      if (imageFile) {
        formDataToSend.append("imageFile", imageFile);
      }

      const response = await createDrug(formDataToSend);
      console.log(response); // Debug API response

      toast.success("Drug created successfully");
      setFormData({
        drugCode: "",
        name: "",
        unit: "",
        price: 0,
        drugGroupId: "",
        description: "",
        manufacturer: "",
        createdAt: new Date().toISOString(),
        status: "Active",
        imageUrl: "",
      }); // Reset form
      setImageFile(null);
    } catch (error) {
      toast.error("Failed to create drug");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Drug Code"
          name="drugCode"
          value={formData.drugCode}
          onChange={handleInputChange}
          required
        />
        <Input
          label="Name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          required
        />
        <Input
          label="Unit"
          name="unit"
          value={formData.unit}
          onChange={handleInputChange}
          required
        />
        <Input
          type="number"
          label="Price"
          name="price"
          value={formData.price.toString()}
          onChange={handleInputChange}
          required
        />
        <Input
          label="Drug Group ID"
          name="drugGroupId"
          value={formData.drugGroupId}
          onChange={handleInputChange}
        />
        <Input
          label="Manufacturer"
          name="manufacturer"
          value={formData.manufacturer || ""}
          onChange={handleInputChange}
        />
        <Input
          label="Description"
          name="description"
          value={formData.description || ""}
          onChange={handleInputChange}
        />
        <Input
          type="file"
          label="Image"
          accept="image/*"
          onChange={handleImageChange}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="flat">
          Cancel
        </Button>
        <Button type="submit" color="primary">
          Create Drug
        </Button>
      </div>
    </form>
  );
}
