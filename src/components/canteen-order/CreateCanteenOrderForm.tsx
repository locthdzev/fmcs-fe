import React, { useState, useEffect } from "react";
import { Button, Input } from "@heroui/react";
import { createCanteenOrder } from "@/api/canteenorder";
import { getAllCanteenItems } from "@/api/canteenitems";
import { toast } from "react-toastify";

interface CanteenItem {
  id: string;
  itemName: string;
  unitPrice: string;
  available: string;
}

interface OrderDetail {
  itemId: string;
  quantity: number;
}

interface CreateCanteenOrderFormProps {
  onClose: () => void;
  onCreate: () => void;
}

const initialFormState = {
  licensePlate: "",
  orderDate: "",
  createdAt: new Date().toISOString(),
  status: "Active",
  canteenOrderDetails: [] as OrderDetail[],
};

export const CreateCanteenOrderForm: React.FC<CreateCanteenOrderFormProps> = ({
  onClose,
  onCreate,
}) => {
  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [canteenItems, setCanteenItems] = useState<CanteenItem[]>([]);
  const [selectedItem, setSelectedItem] = useState("");
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchCanteenItems();
  }, []);

  const fetchCanteenItems = async () => {
    try {
      const response = await getAllCanteenItems();
      setCanteenItems(response);
    } catch (error) {
      toast.error("Failed to fetch canteen items");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddItem = () => {
    if (!selectedItem) {
      toast.warning("Please select an item");
      return;
    }

    const existingItem = formData.canteenOrderDetails.find(
      (detail) => detail.itemId === selectedItem
    );

    if (existingItem) {
      toast.warning("This item is already in the order");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      canteenOrderDetails: [
        ...prev.canteenOrderDetails,
        {
          itemId: selectedItem,
          quantity: quantity,
        },
      ],
    }));

    setSelectedItem("");
    setQuantity(1);
  };

  const handleRemoveItem = (itemId: string) => {
    setFormData((prev) => ({
      ...prev,
      canteenOrderDetails: prev.canteenOrderDetails.filter(
        (detail) => detail.itemId !== itemId
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.canteenOrderDetails.length === 0) {
      toast.warning("Please add at least one item");
      return;
    }

    try {
      setLoading(true);
      await createCanteenOrder(formData);
      toast.success("Canteen order created successfully");
      onCreate();
      onClose();
    } catch (error) {
      toast.error("Failed to create canteen order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="License Plate"
          name="licensePlate"
          value={formData.licensePlate}
          onChange={handleInputChange}
          required
        />
        <Input
          type="datetime-local"
          label="Order Date"
          name="orderDate"
          value={formData.orderDate}
          onChange={handleInputChange}
          required
          placeholder=" "
        />
      </div>

      <div className="border p-4 rounded-lg bg-gray-50">
        <h3 className="font-semibold mb-4">Add Items</h3>
        <div className="grid grid-cols-3 gap-4">
          <select
            className="form-select rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            value={selectedItem}
            onChange={(e) => setSelectedItem(e.target.value)}
          >
            <option value="">Select Item</option>
            {canteenItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.itemName} - ${item.unitPrice}
              </option>
            ))}
          </select>

          <Input
            type="number"
            min="1"
            value={quantity.toString()}
            onChange={(e) => setQuantity(Number(e.target.value))}
            label="Quantity"
          />
          <Button type="button" onClick={handleAddItem}>
            Add Item
          </Button>
        </div>

        {formData.canteenOrderDetails.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">Selected Items:</h4>
            <div className="bg-white rounded-lg p-4">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Item Name</th>
                    <th className="text-center py-2">Price</th>
                    <th className="text-center py-2">Quantity</th>
                    <th className="text-right py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.canteenOrderDetails.map((detail) => {
                    const item = canteenItems.find(
                      (i) => i.id === detail.itemId
                    );
                    return (
                      <tr key={detail.itemId} className="border-b">
                        <td className="py-2">{item?.itemName}</td>
                        <td className="text-center py-2">${item?.unitPrice}</td>
                        <td className="text-center py-2">{detail.quantity}</td>
                        <td className="text-right py-2">
                          <Button
                            type="button"
                            variant="flat"
                            color="danger"
                            size="sm"
                            onClick={() => handleRemoveItem(detail.itemId)}
                          >
                            Remove
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 mt-6">
        <Button
          type="button"
          variant="flat"
          onClick={() => setFormData(initialFormState)}
        >
          Reset
        </Button>
        <Button type="submit" color="primary" isLoading={loading}>
          Create Order
        </Button>
      </div>
    </form>
  );
};
