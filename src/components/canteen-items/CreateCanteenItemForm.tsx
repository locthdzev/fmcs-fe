import React, { useState } from "react";
import { Button, Input, Textarea, Checkbox } from "@heroui/react";
import { createCanteenItem } from "@/api/canteenitems";
import { toast } from "react-toastify";

interface CreateCanteenItemFormProps {
  onClose: () => void;
  onCreate: () => void;
}

const initialFormState = {
  itemName: "",
  description: "",
  unitPrice: 0, // ✅ Chuyển từ string thành number
  available: false, // ✅ Chuyển từ string thành boolean
  createdAt: new Date().toISOString(),
  status: "Active",
  imageFile: undefined as File | undefined,
};

export const CreateCanteenItemForm: React.FC<CreateCanteenItemFormProps> = ({
  onClose,
  onCreate,
}) => {
  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null); // ✅ Thêm preview ảnh

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "unitPrice" ? parseFloat(value) || 0 : value, // ✅ Chuyển unitPrice thành số
    }));
  };

  const handleCheckboxChange = (isSelected: boolean) => {
    setFormData((prev) => ({
      ...prev,
      available: isSelected, // ✅ Chuyển đổi đúng kiểu boolean
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : undefined;

    if (file) {
      // ✅ Kiểm tra xem file có phải là ảnh không
      if (!file.type.startsWith("image/")) {
        toast.error("Only image files are allowed.");
        return;
      }

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

    try {
      setLoading(true);

      // Gửi API với dữ liệu form và file ảnh
      await createCanteenItem(
        {
          itemName: formData.itemName,
          description: formData.description,
          unitPrice: formData.unitPrice, // ✅ Gửi dưới dạng số
          available: formData.available, // ✅ Boolean chính xác
          createdAt: new Date().toISOString(),
          status: formData.status,
        },
        formData.imageFile
      );

      toast.success("Canteen item created successfully!");
      onCreate();
      onClose();
    } catch (error) {
      console.error("API Error:", error);
      toast.error("Failed to create canteen item.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData(initialFormState);
    setImagePreview(null); // ✅ Xóa preview ảnh khi reset form
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <Input
        isClearable
        radius="sm"
        variant="bordered"
          label="Item Name"
          name="itemName"
          value={formData.itemName}
          onChange={handleInputChange}
          onClear={() => setFormData({ ...formData, itemName: "" })}
          required
        />

        <Textarea
        isClearable
        radius="sm"
        variant="bordered"
          label="Description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          onClear={() => setFormData({ ...formData, description: "" })}
        />

        <Input
        radius="sm"
        variant="bordered"
          label="Unit Price"
          name="unitPrice"
          type="number" // ✅ Đúng kiểu input cho số
          value={formData.unitPrice.toString()}
          onChange={handleInputChange}
          required
        />

        {/* ✅ Checkbox để chọn Available */}
        <Checkbox
          isSelected={formData.available} // ✅ Đúng cách để chọn giá trị ban đầu
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev) => ({ ...prev, available: event.target.checked })) // ✅ Lấy `event.target.checked`
          }
          color="success"
        >
          Available
        </Checkbox>


        {/* ✅ Upload hình ảnh */}
        <Input
          label="Upload Image"
          name="imageFile"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
        />

        {/* ✅ Hiển thị preview ảnh nếu có */}
        {imagePreview && (
          <div className="mt-4">
            <p className="text-gray-500">Image Preview:</p>
            <img
              src={imagePreview}
              alt="Preview"
              className="w-32 h-32 object-cover rounded-md border"
            />
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-2 mt-4">
        <Button type="button" variant="flat" onClick={handleReset}>
          Reset
        </Button>
        <Button type="submit" color="primary" isLoading={loading}>
          Create Canteen Item
        </Button>
      </div>
    </form>
  );
};
