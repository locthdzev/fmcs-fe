import React, { useEffect, useState } from "react";
import { Button, Input, Textarea, Checkbox, Select, SelectItem } from "@heroui/react";
import {
    updateCanteenItem,
    getCanteenItem,
    UpdateCanteenItemsDTO,
} from "@/api/canteenitems";
import { toast } from "react-toastify";

interface EditCanteenItemFormProps {
    canteenItemId: string;
    onClose: () => void;
    onUpdate: () => void;
}

export const EditCanteenItemForm: React.FC<EditCanteenItemFormProps> = ({
    canteenItemId,
    onClose,
    onUpdate,
}) => {
    const [formData, setFormData] = useState<UpdateCanteenItemsDTO | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const canteenItemData = await getCanteenItem(canteenItemId);
                setFormData({
                    itemName: canteenItemData.itemName,
                    description: canteenItemData.description || "",
                    unitPrice: canteenItemData.unitPrice.toString(),
                    available: canteenItemData.available.toString(),
                    updatedAt: new Date().toISOString(),
                    status: canteenItemData.status || "Active",
                });
            } catch (error) {
                toast.error("Failed to load canteen item details");
            }
        };

        fetchData();
    }, [canteenItemId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => prev ? { ...prev, [name]: value } : null);
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => prev ? { ...prev, available: e.target.checked ? "true" : "false" } : null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData) return;

        try {
            setLoading(true);
            const response = await updateCanteenItem(canteenItemId, formData);
            if (response.isSuccess) {
                toast.success(response.message || "Canteen item updated successfully");
                onUpdate();
                onClose();
            } else {
                toast.error(response.message || "Failed to update canteen item");
            }
        } catch (error) {
            toast.error("Failed to update canteen item");
        } finally {
            setLoading(false);
        }
    };

    if (!formData) return <p>Loading...</p>;

    return (
        <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4">
                <Input
                    label="Item Name"
                    name="itemName"
                    value={formData.itemName}
                    onChange={handleChange}
                    required
                />
                <Textarea
                    label="Description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                />
                <Input
                    label="Unit Price"
                    name="unitPrice"
                    type="text" // ✅ Để dạng text giữ nguyên string
                    value={formData.unitPrice}
                    onChange={handleChange}
                    required
                />
                <Checkbox
                    name="available"
                    isSelected={formData.available === "true"}
                    onChange={handleCheckboxChange}
                >
                    Available
                </Checkbox>
                <Select
                    label="Status"
                    name="status"
                    value={formData.status}
                    onChange={(e) => setFormData((prev) => prev ? { ...prev, status: e.target.value } : null)}
                    required
                >
                    <SelectItem key="Active" value="Active">Active</SelectItem>
                    <SelectItem key="Inactive" value="Inactive">Inactive</SelectItem>
                </Select>
            </div>

            <div className="flex justify-end gap-2 mt-4">
                <Button type="button" variant="flat" onClick={onClose}>
                    Cancel
                </Button>
                <Button type="submit" color="primary" isLoading={loading}>
                    Update Canteen Item
                </Button>
            </div>
        </form>
    );
};
