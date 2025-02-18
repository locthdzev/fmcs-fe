import React, { useEffect, useState } from "react";
import { Button, Input } from "@heroui/react";
import { updateCanteenOrder, getCanteenOrderById } from "@/api/canteenorder";
import { getAllCanteenItems } from "@/api/canteenitems";
import { toast } from "react-toastify";

interface EditCanteenOrderFormProps {
  orderId: string;
  onClose: () => void;
  onUpdate: () => void;
}

interface OrderDetail {
  itemId: string;
  quantity: number;
  item?: {
    itemName: string;
    unitPrice: string;
  };
  canteenItem?: {
    itemName: string;
    unitPrice: string;
  };
}

interface FormData {
  licensePlate: string;
  orderDate: string;
  updatedAt: string;
  status: string;
  canteenOrderDetails: OrderDetail[];
}

export const EditCanteenOrderForm: React.FC<EditCanteenOrderFormProps> = ({
  orderId,
  onClose,
  onUpdate,
}) => {
  const [formData, setFormData] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(false);
  const [canteenItems, setCanteenItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState("");
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchData();
    fetchCanteenItems();
  }, [orderId]);

  const fetchData = async () => {
    try {
      const orderData = await getCanteenOrderById(orderId);
      setFormData({
        licensePlate: orderData.truck.licensePlate,
        orderDate: orderData.orderDate,
        updatedAt: new Date().toISOString(),
        status: orderData.status || "Active",
        canteenOrderDetails: orderData.canteenOrderDetails.map((detail: {
          itemId: string;
          quantity: number;
          itemName?: string;
          unitPrice?: string;
          canteenItem?: {
            itemName: string;
            unitPrice: string;
          };
          item?: {
            itemName: string;
            unitPrice: string;
          };
        }) => ({
          itemId: detail.itemId,
          quantity: detail.quantity,
          canteenItem: {
            itemName: detail.canteenItem?.itemName || detail.itemName || detail.item?.itemName,
            unitPrice: detail.canteenItem?.unitPrice || detail.unitPrice || detail.item?.unitPrice
          }
        }))
      });
    } catch (error) {
      toast.error("Failed to load order details");
    }
  };
  

  const fetchCanteenItems = async () => {
    try {
      const items = await getAllCanteenItems();
      setCanteenItems(items);
    } catch (error) {
      toast.error("Failed to fetch canteen items");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  const handleAddItem = () => {
    if (!selectedItem || !formData) return;

    const item = canteenItems.find((i: any) => i.id === selectedItem);

    setFormData({
      ...formData,
      canteenOrderDetails: [
        ...formData.canteenOrderDetails,
        {
          itemId: selectedItem,
          quantity: quantity,
          canteenItem: item,
        },
      ],
    });

    setSelectedItem("");
    setQuantity(1);
  };

 // Update the handleRemoveItem function
const handleRemoveItem = (itemId: string) => {
  if (!formData) return;

  // Create new array without the removed item
  const updatedDetails = formData.canteenOrderDetails.filter(
    (detail) => detail.itemId !== itemId
  );

  // Update form data with new array
  setFormData({
    ...formData,
    canteenOrderDetails: updatedDetails,
  });

  // Show success message
  toast.success("Item removed successfully");
};


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    try {
      const formDataToSend = new FormData();
      
      // Add basic order info
      formDataToSend.append('licensePlate', formData.licensePlate);
      formDataToSend.append('orderDate', formData.orderDate);
      formDataToSend.append('updatedAt', formData.updatedAt);
      formDataToSend.append('status', formData.status);

      // Add order details as JSON string
      const orderDetails = formData.canteenOrderDetails.map(detail => ({
        itemId: detail.itemId,
        quantity: detail.quantity
      }));
      
      // Add as separate entries in FormData for proper binding
      orderDetails.forEach((detail, index) => {
        formDataToSend.append(`orderDetails[${index}].itemId`, detail.itemId);
        formDataToSend.append(`orderDetails[${index}].quantity`, detail.quantity.toString());
      });

      setLoading(true);
      await updateCanteenOrder(orderId, formDataToSend);
      toast.success("Canteen order updated successfully");
      onUpdate();
      onClose();
    } catch (error) {
      toast.error("Failed to update canteen order");
    } finally {
      setLoading(false);
    }
};


  if (!formData) {
    return <p>Loading...</p>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-4 mb-6">
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
        />
        <Input
          label="Status"
          name="status"
          value={formData.status}
          onChange={handleInputChange}
        />
      </div>

      <div className="border p-4 rounded-lg mb-6">
        <h3 className="font-semibold mb-4">Order Items</h3>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <select
            className="form-select rounded-md border-gray-300"
            value={selectedItem}
            onChange={(e) => setSelectedItem(e.target.value)}
          >
            <option value="">Select Item</option>
            {canteenItems.map((item: any) => (
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
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Item Name
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Unit Price
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Quantity
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {formData.canteenOrderDetails.map((detail) => (
                <tr key={detail.itemId}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {detail.item?.itemName ||
                      detail.canteenItem?.itemName ||
                      "N/A"}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    $
                    {detail.item?.unitPrice ||
                      detail.canteenItem?.unitPrice ||
                      "0"}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    {detail.quantity}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <Button
                      type="button"
                      variant="flat"
                      color="danger"
                      onClick={() => handleRemoveItem(detail.itemId)}
                    >
                      Remove
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="flat" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" color="primary" isLoading={loading}>
          Update Order
        </Button>
      </div>
    </form>
  );
};
