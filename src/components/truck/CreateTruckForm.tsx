import React, { useEffect, useState } from "react";
import { Button, Input, Textarea } from "@heroui/react";
import { createTruck } from "@/api/truck";
import { toast } from "react-toastify";
import { FileUpload } from "../ui/file-upload";

interface CreateTruckFormProps {
  onClose: () => void;
  onCreate: () => void;
}

const initialFormState = {
  licensePlate: "",
  driverName: "",
  driverContact: "",
  description: "",
  status: "Active",
  truckImage: "",
  createdAt: new Date().toISOString(),
};

export const CreateTruckForm: React.FC<CreateTruckFormProps> = ({
  onClose,
  onCreate,
}) => {
  const [formData, setFormData] = useState(initialFormState);
  const [imageFile, setImageFile] = useState<File | null>(null);
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
        await createTruck(formDataToSend);
        toast.success("Truck created successfully");
        onCreate();
        onClose();
      } catch (error) {
        toast.error("Failed to create truck");
      }
    } catch (error) {
      toast.error("Failed to create truck");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData(initialFormState);
    setImageFile(null);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="License Plate"
          name="licensePlate"
          value={formData.licensePlate}
          onChange={handleInputChange}
          required
        />
        <Input
          label="Driver Name"
          name="driverName"
          value={formData.driverName}
          onChange={handleInputChange}
        />
        <Input
          label="Driver Contact"
          name="driverContact"
          value={formData.driverContact}
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

        <div className="col-span-2 flex justify-center">
          <div>
            <FileUpload onChange={(files) => setImageFile(files[0])} />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-6">
        <Button type="button" variant="flat" onClick={handleReset}>
          Reset
        </Button>
        <Button type="submit" color="primary" isLoading={loading}>
          Create Truck
        </Button>
      </div>
    </form>
  );
};
