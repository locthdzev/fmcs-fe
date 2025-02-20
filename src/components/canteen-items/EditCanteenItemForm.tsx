import React, { useState, useEffect } from "react";
import { Button, Input, Textarea, Checkbox } from "@heroui/react";
import { updateCanteenItem, getCanteenItem } from "@/api/canteenitems";
import { toast } from "react-toastify";
import { CanteenItemResponse } from "@/api/canteenitems";

interface EditCanteenItemFormProps {
  canteenItemId: string;
  onClose: () => void;
  onUpdate: (updatedItem: CanteenItemResponse) => void;
}

const initialFormState = {
  itemName: "",
  description: "",
  unitPrice: 0,
  available: false,
  updatedAt: new Date().toISOString(),
  status: "Active",
  imageFile: undefined as File | undefined,
};

export const EditCanteenItemForm: React.FC<EditCanteenItemFormProps> = ({
  canteenItemId,
  onClose,
  onUpdate,
}) => {
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null); // ✅ State để lưu ảnh preview

  useEffect(() => {
    const fetchData = async () => {
      if (!canteenItemId) return;

      try {
        const canteenItemData = await getCanteenItem(canteenItemId);
        if (canteenItemData) {
          setFormData({
            itemName: canteenItemData.itemName || "",
            description: canteenItemData.description || "",
            unitPrice: canteenItemData.unitPrice || 0,
            available: canteenItemData.available,
            updatedAt: new Date().toISOString(),
            status: canteenItemData.status || "Active",
            imageFile: undefined,
          });

          // ✅ Nếu có ảnh sẵn từ API, đặt làm preview
          if (canteenItemData.imageUrl) {
            setImagePreview(canteenItemData.imageUrl);
          }
        }
      } catch (error) {
        toast.error("Failed to load canteen item details");
      }
    };

    fetchData();
  }, [canteenItemId]);

  const validateForm = () => {
    let newErrors: Record<string, string> = {};

    if (!formData.itemName.trim()) {
      newErrors.itemName = "Item Name is required.";
    }

    if (isNaN(Number(formData.unitPrice))) {
      newErrors.unitPrice = "Unit Price must be a valid number.";
    } else if (Number(formData.unitPrice) <= 0) {
      newErrors.unitPrice = "Unit Price must be greater than 0.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === "unitPrice" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : undefined;

    if (file) {
      // ✅ Kiểm tra định dạng file
      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({ ...prev, imageFile: "Only image files are allowed." }));
        return;
      }
      setErrors((prev) => ({ ...prev, imageFile: "" }));

      setFormData((prev) => ({
        ...prev,
        imageFile: file,
      }));

      // ✅ Hiển thị preview ảnh
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix validation errors before submitting.");
      return;
    }

    try {
      setLoading(true);
      const updatedItem = await updateCanteenItem(
        canteenItemId,
        {
          itemName: formData.itemName,
          description: formData.description,
          unitPrice: formData.unitPrice,
          available: formData.available,
          updatedAt: new Date().toISOString(),
          status: formData.status,
        },
        formData.imageFile
      );

      toast.success("Canteen item updated successfully");
      onUpdate(updatedItem);
      onClose();
    } catch (error) {
      toast.error("Failed to update canteen item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <Input
          label="Item Name"
          name="itemName"
          value={formData.itemName}
          onChange={handleInputChange}
          required
        />
        {errors.itemName && <p className="text-red-500 text-sm">{errors.itemName}</p>}

        <Input
          label="Description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          required
        />

        <Input
          label="Unit Price"
          name="unitPrice"
          type="number"
          value={formData.unitPrice.toString()}
          onChange={handleInputChange}
          required
        />
        {errors.unitPrice && <p className="text-red-500 text-sm">{errors.unitPrice}</p>}

        <Checkbox
          isSelected={formData.available} // ✅ Sử dụng `isSelected` thay vì `checked`
          onChange={(event) => setFormData((prev) => ({ ...prev, available: event.target.checked }))} // ✅ Lấy `event.target.checked`
          color="success"
        >
          Available
        </Checkbox>

        <Input
          label="Upload Image"
          name="imageFile"
          type="file"
          accept="image/*" // ✅ Chỉ chấp nhận file ảnh
          onChange={handleFileChange}
        />
        {errors.imageFile && <p className="text-red-500 text-sm">{errors.imageFile}</p>}

        {/* ✅ Hiển thị ảnh preview nếu có */}
        {imagePreview && (
          <div className="mt-4">
            <p className="text-gray-500">Image Preview:</p>
            <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded-md border" />
          </div>
        )}
      </div>
      <div className="flex justify-end space-x-2 mt-4">
        <Button type="submit" color="primary" isLoading={loading}>
          Update Canteen Item
        </Button>
      </div>
    </form>
  );
};
