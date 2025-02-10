import React, { useEffect, useState } from "react";
import { Button, Input, Textarea } from "@heroui/react";
import {
  updateDrugGroup,
  getDrugGroupById,
  DrugGroupUpdateRequest,
} from "@/api/druggroup";
import { toast } from "react-toastify";

interface EditDrugGroupFormProps {
  drugGroupId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export const EditDrugGroupForm: React.FC<EditDrugGroupFormProps> = ({
  drugGroupId,
  onClose,
  onUpdate,
}) => {
  const [formData, setFormData] = useState<DrugGroupUpdateRequest | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const drugGroupData = await getDrugGroupById(drugGroupId);
        setFormData({
          groupName: drugGroupData.groupName,
          description: drugGroupData.description || "",
          createdAt: drugGroupData.createdAt,
          updatedAt: new Date().toISOString(),
          status: drugGroupData.status || "Active",
        });
      } catch (error) {
        toast.error("Failed to load drug group details");
      }
    };

    fetchData();
  }, [drugGroupId]);

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
      setLoading(true);
      const response = await updateDrugGroup(drugGroupId, formData);
      if (response.isSuccess) {
        toast.success(response.message || "Drug group updated successfully");
        onUpdate();
        onClose();
      } else {
        if (response.code === 409) {
          toast.error("Drug Group name already exists");
        } else {
          toast.error(response.message || "Failed to update drug group");
        }
      }
    } catch (error) {
      toast.error("Failed to update drug group");
    } finally {
      setLoading(false);
    }
  };

  if (!formData) {
    return <p>Loading...</p>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-4">
        <Input
          label="Group Name"
          name="groupName"
          value={formData.groupName}
          onChange={handleInputChange}
          required
        />
        <div className="col-span-1">
          <Textarea
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <Button type="button" variant="flat" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" color="primary" isLoading={loading}>
          Update Drug Group
        </Button>
      </div>
    </form>
  );
};
