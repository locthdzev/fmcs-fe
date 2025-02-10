import React, { useEffect, useState } from "react";
import { Button, Input, Select, SelectItem, Textarea } from "@heroui/react";
import { updateTruck, getTruckById, TruckUpdateRequest } from "@/api/truck";
import { toast } from "react-toastify";
import { FileUpload } from "../ui/file-upload";

interface EditTruckFormProps {
  truckId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export const EditTruckForm: React.FC<EditTruckFormProps> = ({
  truckId,
  onClose,
  onUpdate,
}) => {
  const [formData, setFormData] = useState<TruckUpdateRequest | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const truckData = await getTruckById(truckId);
        setFormData({
          licensePlate: truckData.licensePlate,
          driverName: truckData.driverName || "",
          driverContact: truckData.driverContact || "",
          description: truckData.description || "",
          status: truckData.status || "Active",
          truckImage: truckData.truckImage || "",
        });
      } catch (error) {
        toast.error("Failed to load truck details");
      }
    };

    fetchData();
  }, [truckId]);

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
        formDataToSend.append("truckImage", imageFile);
      }

      setLoading(true);
      await updateTruck(truckId, formDataToSend);
      toast.success("Truck updated successfully");
      onUpdate();
      onClose();
    } catch (error) {
      toast.error("Failed to update truck");
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

        <div className="col-span-2">
          <div className="flex gap-4">
            <p className="text-sm text-gray-500 mb-2 text-left">Current Image:</p>
            {formData.truckImage && (
              <img
                src={formData.truckImage}
                alt="Truck"
                className="w-24 h-24 rounded"
              />
            )}
          </div>
        </div>
        <div className="col-span-2">
          <FileUpload onChange={(files) => setImageFile(files[0])} />
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-6">
        <Button type="button" variant="flat" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" color="primary" isLoading={loading}>
          Update Truck
        </Button>
      </div>
    </form>
  );
};
