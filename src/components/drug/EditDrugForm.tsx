import React, { useEffect, useState } from "react";
import { Button, Input, Textarea, Modal, ModalContent, ModalBody } from "@heroui/react";
import { Select, message } from "antd";
import { updateDrug, getDrugById, DrugUpdateRequest } from "@/api/drug";
import { getDrugGroups } from "@/api/druggroup";
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
  const [messageApi, contextHolder] = message.useMessage();
  const [drugGroups, setDrugGroups] = useState<DrugGroup[]>([]);
  const [formData, setFormData] = useState<DrugUpdateRequest | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

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
        messageApi.error("Failed to load drug details");
      }
    };

    const fetchDrugGroups = async () => {
      try {
        const data = await getDrugGroups();
        setDrugGroups(data);
      } catch (error) {
        messageApi.error("Failed to load drug groups");
      }
    };

    fetchData();
    fetchDrugGroups();
  }, [drugId]);

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
      messageApi.success("Drug updated successfully");
      onUpdate();
      onClose();
    } catch (error) {
      messageApi.error("Failed to update drug");
    } finally {
      setLoading(false);
    }
  };

  if (!formData) {
    return <p>Loading...</p>;
  }

  const drugGroupOptions = drugGroups
    .filter((group) => group.status === "Active")
    .map((group) => ({
      value: group.id,
      label: group.groupName,
    }));

  return (
    <>
      {contextHolder}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4">
          <Select
            showSearch
            style={{ width: "100%", height: "56px" }}
            placeholder="Search to Select Drug Group"
            optionFilterProp="label"
            value={formData.drugGroupId || undefined}
            onChange={(value) =>
              setFormData((prev) =>
                prev ? { ...prev, drugGroupId: value } : null
              )
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
            onClear={() =>
              setFormData((prev) => (prev ? { ...prev, drugCode: "" } : null))
            }
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
            onClear={() =>
              setFormData((prev) => (prev ? { ...prev, name: "" } : null))
            }
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
            onClear={() =>
              setFormData((prev) => (prev ? { ...prev, unit: "" } : null))
            }
            required
          />
          <Input
            variant="bordered"
            radius="sm"
            type="number"
            label="Price"
            name="price"
            value={formData.price.toString()}
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
            value={formData.manufacturer}
            onChange={handleInputChange}
            onClear={() =>
              setFormData((prev) => (prev ? { ...prev, manufacturer: "" } : null))
            }
            required
          />
          <div className="col-span-2 relative">
            <Textarea
              variant="bordered"
              radius="sm"
              label="Description"
              name="description"
              value={formData.description}
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
            )}
          </div>
          <div className="col-span-2">
            <div className="flex gap-4">
              <div className="flex items-center justify-center">
                {formData.imageUrl && (
                  <img
                    src={formData.imageUrl}
                    alt="Drug"
                    className="w-20 h-20 rounded cursor-pointer transition-transform duration-300 hover:scale-105"
                    onClick={() => setIsImageModalOpen(true)}
                  />
                )}
              </div>
            </div>
          </div>
          <div className="col-span-2">
            <FileUpload onChange={(files) => setImageFile(files[0])} />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button type="button" radius="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" radius="sm" color="primary" isLoading={loading}>
            Update
          </Button>
        </div>
      </form>

      <Modal
        isOpen={isImageModalOpen}
        onOpenChange={() => setIsImageModalOpen(false)}
        size="2xl"
      >
        <ModalContent className="rounded-lg shadow-lg border border-gray-200 bg-white">
          <ModalBody className="flex justify-center items-center p-6">
            <img
              src={formData.imageUrl}
              alt={formData.name}
              className="max-w-full max-h-[80vh] rounded-md object-contain"
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};
