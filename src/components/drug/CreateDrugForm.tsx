import React, { useEffect, useState } from "react";
import { Button, Input, Select, SelectItem, Textarea } from "@heroui/react";
import { createDrug } from "@/api/drug";
import { getDrugGroups } from "@/api/druggroup";
import { toast } from "react-toastify";
import { FileUpload } from "../ui/file-upload";

interface DrugGroup {
  id: string;
  groupName: string;
  status: string;
}

interface CreateDrugFormProps {
  onClose: () => void;
  onCreate: () => void;
}

const initialFormState = {
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
};

export const CreateDrugForm: React.FC<CreateDrugFormProps> = ({
  onClose,
  onCreate,
}) => {
  const [drugGroups, setDrugGroups] = useState<DrugGroup[]>([]);
  const [formData, setFormData] = useState(initialFormState);
  const [imageFile, setImageFile] = useState<File | null>(null);
  //   const [resetTrigger, setResetTrigger] = useState(false); // reset file trong form
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      drugGroupId: e.target.value,
    }));
  };

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

      if (imageFile) {
        formDataToSend.append("imageFile", imageFile);
      }
      setLoading(true);
      try {
        await createDrug(formDataToSend);
        toast.success("Drug created successfully");
        onCreate();
        onClose();
      } catch (error) {
        toast.error("Failed to create drug");
      }
    } catch (error) {
      toast.error("Failed to create drug");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData(initialFormState);
    setImageFile(null);
  };

  //   const handleReset = () => {
  //     setFormData(initialFormState);
  //     setImageFile(null);
  //     setResetTrigger((prev) => !prev); // reset file trong form
  //   };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-4">
        <Select
          isRequired
          className="w-full"
          label="Drug Group"
          id="drugGroupId"
          name="drugGroupId"
          value={formData.drugGroupId}
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
          isRequired
        />
        <Input
          label="Manufacturer"
          name="manufacturer"
          value={formData.manufacturer || ""}
          onChange={handleInputChange}
          required
        />

        <div className="col-span-2">
          <Textarea
            label="Description"
            name="description"
            value={formData.description || ""}
            onChange={handleInputChange}
          />
        </div>

        <div className="col-span-2 flex justify-center">
          <div>
            <FileUpload onChange={(files) => setImageFile(files[0])} />
            {/* <FileUpload onChange={(files) => setImageFile(files[0])} resetTrigger={resetTrigger} /> // reset file trong form */}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-6">
        <Button type="button" variant="flat" onClick={handleReset}>
          Reset
        </Button>
        <Button type="submit" color="primary">
          Create Drug
        </Button>
      </div>
    </form>
  );
};
