import React, { useState } from "react";
import { Button, Input, Textarea } from "@heroui/react";
import { createDrugGroup } from "@/api/druggroup";
import { toast } from "react-toastify";

interface CreateDrugGroupFormProps {
  onClose: () => void;
  onCreate: () => void;
}

const initialFormState = {
  groupName: "",
  description: "",
  createdAt: new Date().toISOString(),
  status: "Active",
};

export const CreateDrugGroupForm: React.FC<CreateDrugGroupFormProps> = ({
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
      const response = await createDrugGroup(formData);
      if (response.isSuccess) {
        toast.success(response.message || "Drug group created successfully");
        onCreate();
        onClose();
      } else {
        if (response.code === 409) {
          toast.error("Drug Group name already exists");
        } else {
          toast.error(response.message || "Failed to create drug group");
        }
      }
    } catch (error) {
      toast.error("Failed to create drug group");
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
          label="Group Name"
          name="groupName"
          value={formData.groupName}
          onChange={handleInputChange}
          required
        />

        <div className="col-span-1">
          <Textarea
            isClearable
            radius="sm"
            variant="bordered"
            label="Description"
            name="description"
            value={formData.description || ""}
            onChange={handleInputChange}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-6">
        <Button type="button" variant="flat" onClick={handleReset}>
          Reset
        </Button>
        <Button type="submit" color="primary" isLoading={loading}>
          Create Drug Group
        </Button>
      </div>
    </form>
  );
};
