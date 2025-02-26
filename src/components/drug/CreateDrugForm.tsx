import React, { useEffect, useState } from "react";
import { Button, Input, Textarea } from "@heroui/react";
import { Select } from "antd";
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

  const drugGroupOptions = drugGroups
    .filter((group) => group.status === "Active")
    .map((group) => ({
      value: group.id,
      label: group.groupName,
    }));

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-4">
        <Select
          showSearch
          style={{ width: "100%", height: "56px" }}
          placeholder="Search to Select Drug Group"
          optionFilterProp="label"
          value={formData.drugGroupId || undefined}
          onChange={(value) =>
            setFormData((prev) => ({ ...prev, drugGroupId: value }))
          }
          filterSort={(optionA, optionB) =>
            (optionA?.label ?? "")
              .toLowerCase()
              .localeCompare((optionB?.label ?? "").toLowerCase())
          }
          options={drugGroupOptions}
          dropdownStyle={{ zIndex: 9999 }}
          getPopupContainer={(trigger) => trigger.parentElement!}
        />
        <Input
          isClearable
          variant="bordered"
          radius="sm"
          label="Drug Code"
          name="drugCode"
          value={formData.drugCode}
          onChange={handleInputChange}
          onClear={() => setFormData({ ...formData, drugCode: "" })}
          required
        />
        <Input
          isClearable
          variant="bordered"
          radius="sm"
          label="Name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          onClear={() => setFormData({ ...formData, name: "" })}
          required
        />
        <Input
          isClearable
          variant="bordered"
          radius="sm"
          label="Unit"
          name="unit"
          value={formData.unit}
          onChange={handleInputChange}
          onClear={() => setFormData({ ...formData, unit: "" })}
          required
        />
        <Input
          variant="bordered"
          radius="sm"
          type="number"
          label="Price"
          name="price"
          value={formData.price === 0 ? "" : formData.price.toString()}
          onChange={handleInputChange}
          isRequired
          endContent={
            <div className="pointer-events-none flex items-center">
              <span className="text-default-400 text-small">VND</span>
            </div>
          }
        />
        <Input
          isClearable
          variant="bordered"
          radius="sm"
          label="Manufacturer"
          name="manufacturer"
          value={formData.manufacturer || ""}
          onChange={handleInputChange}
          onClear={() => setFormData({ ...formData, manufacturer: "" })}
          required
        />

        <div className="col-span-2 relative">
          <Textarea
            variant="bordered"
            radius="sm"
            label="Description"
            name="description"
            value={formData.description || ""}
            onChange={handleInputChange}
          />
          {formData.description && (
            <button
              type="button"
              className="absolute right-2 top-2 flex items-center justify-center text-default-500 hover:text-default-900"
              onClick={() => setFormData({ ...formData, description: "" })}
            >
              <svg
                aria-hidden="true"
                focusable="false"
                height="1em"
                role="presentation"
                viewBox="0 0 24 24"
                width="1em"
                className="w-5 h-5"
              >
                <path
                  d="M12 2a10 10 0 1010 10A10.016 10.016 0 0012 2zm3.36 12.3a.754.754 0 010 1.06.748.748 0 01-1.06 0l-2.3-2.3-2.3 2.3a.748.748 0 01-1.06 0 .754.754 0 010-1.06l2.3-2.3-2.3-2.3A.75.75 0 019.7 8.64l2.3 2.3 2.3-2.3a.75.75 0 011.06 1.06l-2.3 2.3z"
                  fill="currentColor"
                />
              </svg>
            </button>
          )}{" "}
        </div>

        <div className="col-span-2">
          <div>
            <FileUpload onChange={(files) => setImageFile(files[0])} />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-6">
        <Button type="button" radius="sm" onClick={handleReset}>
          Reset
        </Button>
        <Button type="submit" radius="sm" color="primary" isLoading={loading}>
          Create
        </Button>
      </div>
    </form>
  );
};
