import React, { useEffect, useState } from "react";
import { Button, Input, Textarea } from "@heroui/react";
import {
    updateCanteenItem,
    getCanteenItem,
    UpdateCanteenItemsDTO,
    CanteenItemResponse,
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
                    unitPrice: canteenItemData.unitPrice,
                    available: canteenItemData.available,
                    updatedAt: new Date().toISOString(),
                    status: canteenItemData.status || "Active",
                });
            } catch (error) {
                toast.error("Failed to load canteen item details");
            }
        };

        fetchData();
    }, [canteenItemId]);

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

    if (!formData) {
        return <p>Loading...</p>;
    }

    return (
        <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4">
                <Input
                    label="Group Name"
                    name="groupName"
                    value={formData.itemName}
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