import React, { useEffect, useState } from "react";
import { Button, Input, Select, SelectItem, Textarea } from "@heroui/react";
import { updateDrug, getDrugById, DrugUpdateRequest } from "@/api/drug";
import { getDrugGroups } from "@/api/druggroup";
import { toast } from "react-toastify";
import { FileUpload } from "../ui/file-upload";

interface DrugGroup {
  id: string;
  groupName: string;
  status: string;
}

interface EditDrugFormProps {
  drugId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export const EditDrugForm: React.FC<EditDrugFormProps> = ({
  drugId,
  onClose,
  onUpdate,
}) => {
  const [drugGroups, setDrugGroups] = useState<DrugGroup[]>([]);
  const [formData, setFormData] = useState<DrugUpdateRequest | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const drugData = await getDrugById(drugId);
        setFormData({
          drugGroupId: drugData.drugGroup?.id || "",
          drugCode: drugData.drugCode,
          name: drugData.name,
          unit: drugData.unit,
          price: drugData.price,
          description: drugData.description || "",
          manufacturer: drugData.manufacturer || "",
          createdAt: drugData.createdAt,
          updatedAt: new Date().toISOString(),
          status: drugData.status || "Active",
          imageUrl: drugData.imageUrl || "",
        });
      } catch (error) {
        toast.error("Failed to load drug details");
      }
    };

    const fetchDrugGroups = async () => {
      try {
        const data = await getDrugGroups();
        setDrugGroups(data);
      } catch (error) {
        toast.error("Failed to load drug groups");
      }
    };

    fetchData();
    fetchDrugGroups();
  }, [drugId]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) =>
      prev ? { ...prev, drugGroupId: e.target.value } : null
    );
  };

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
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formDataToSend.append(key, value.toString());
        }
      });

      if (imageFile) {
        formDataToSend.append("imageFile", imageFile);
      }

      setLoading(true);
      await updateDrug(drugId, formDataToSend);
      toast.success("Drug updated successfully");
      onUpdate();
      onClose();
    } catch (error) {
      toast.error("Failed to update drug");
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
        <Select
          isRequired
          className="w-full"
          label="Drug Group"
          id="drugGroupId"
          name="drugGroupId"
          defaultSelectedKeys={
            formData.drugGroupId ? [formData.drugGroupId] : undefined
          }
          onChange={handleSelectChange}
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
          value={formData.manufacturer}
          onChange={handleInputChange}
        />
        <div className="col-span-2">
          <Textarea
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
          />
        </div>
        <div className="col-span-2">
          <div className="col-span-5">
            <div className="flex gap-4">
              <p className="text-sm text-gray-500 text-left underline">
                Current Drug Image:
              </p>
              <div className="flex items-center justify-center">
                {formData.imageUrl && (
                  <img
                    src={formData.imageUrl}
                    alt="Drug"
                    className="w-24 h-24 rounded"
                  />
                )}
              </div>
            </div>
          </div>
        </div>{" "}
        <div className="col-span-2">
          <FileUpload onChange={(files) => setImageFile(files[0])} />
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <Button type="button" variant="flat" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" color="primary" isLoading={loading}>
          Update Drug
        </Button>
      </div>
    </form>
  );
};
