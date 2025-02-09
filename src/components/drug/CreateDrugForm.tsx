import React, { useEffect, useState } from "react";
import { Button, Input, Select, SelectItem, Textarea } from "@heroui/react";
import { DrugCreateRequest, createDrug } from "@/api/drug";
import { getDrugGroups } from "@/api/druggroup";
import { toast } from "react-toastify";
import { FileUpload } from "../ui/file-upload";

interface DrugGroup {
  id: string;
  groupName: string;
  status: string;
}

interface CreateDrugFormProps {
  onSuccess?: () => void; // Nhận callback khi tạo thuốc thành công
}

export function CreateDrugForm({ onSuccess }: CreateDrugFormProps) {
  const [drugGroups, setDrugGroups] = useState<DrugGroup[]>([]); // 🔹 State lưu danh sách nhóm thuốc
  const [formData, setFormData] = useState<DrugCreateRequest>({
    drugCode: "",
    name: "",
    unit: "",
    price: 0,
    drugGroupId: "", // 🔹 Chọn nhóm thuốc từ Select
    description: "",
    manufacturer: "",
    createdAt: new Date().toISOString(),
    status: "Active",
    imageUrl: "",
  });

  useEffect(() => {
    const fetchDrugGroups = async () => {
      try {
        const data = await getDrugGroups();
        setDrugGroups(data);
      } catch (error) {
        toast.error("Failed to load drug groups");
      }
    };
    fetchDrugGroups();
  }, []);

  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 🔹 Xử lý khi chọn Drug Group từ dropdown
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      drugGroupId: e.target.value,
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

      await createDrug(formDataToSend);
      toast.success("Drug created successfully");

      // Reset form
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
      });
      setImageFile(null);

      // 🔹 Gọi callback cập nhật danh sách thuốc
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast.error("Failed to create drug");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-4">
        <Select
          className="w-full"
          label="Drug Group"
          id="drugGroupId"
          name="drugGroupId"
          value={formData.drugGroupId}
          onChange={handleSelectChange}
          required
        >
          {drugGroups
            .filter((group) => group.status === "Active")
            .map((group) => (
              <SelectItem key={group.id} value={group.id}>
                {group.groupName}
              </SelectItem>
            ))}
        </Select>
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
          label="Manufacturer"
          name="manufacturer"
          value={formData.manufacturer || ""}
          onChange={handleInputChange}
        />
        {/* 🔹 Description full width */}
        <div className="col-span-2">
          <Textarea
            label="Description"
            name="description"
            value={formData.description || ""}
            onChange={handleInputChange}
          />
        </div>
        {/* 🔹 File Upload xuống dưới và nhỏ lại */}
        <div className="col-span-2 flex justify-center">
          <div>
            <FileUpload onChange={(files) => setImageFile(files[0])} />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-6">
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
