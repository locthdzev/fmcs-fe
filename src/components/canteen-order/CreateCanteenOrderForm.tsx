import React, { useState, useEffect } from "react";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalFooter,
} from "@heroui/react";
import { Form, Select } from "antd";
import { createCanteenOrder } from "@/api/canteenorder";
import { getAllCanteenItems, CanteenItemResponse } from "@/api/canteenitems";
import { toast } from "react-toastify";
import { BinIcon } from "./Icons";
import { getTrucks } from "@/api/truck";

interface CreateCanteenOrderFormProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: () => void;
}

interface CanteenItem {
  id: string;
  itemName: string;
  unitPrice: number;
  available: string;
  imageUrl?: string;
}

interface OrderDetail {
  itemId: string;
  quantity: number;
  searchItem?: string;
  unitPrice: number;
  canteenItem?: {
    itemName: string;
    unitPrice?: number;
    imageUrl?: string;
  };
}

interface FormData {
  licensePlate: string;
  orderDate: string;
  createdAt: string;
  status: string;
  canteenOrderDetails: OrderDetail[];
}

export const CreateCanteenOrderForm: React.FC<CreateCanteenOrderFormProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [trucks, setTrucks] = useState<any[]>([]);
  const [formData, setFormData] = useState<FormData>({
    licensePlate: "",
    orderDate: "",
    createdAt: new Date().toISOString(),
    status: "Pending",
    canteenOrderDetails: [],
  });
  const [loading, setLoading] = useState(false);
  const [canteenItems, setCanteenItems] = useState<CanteenItem[]>([]);
  const selectedItemIds = new Set(
    formData.canteenOrderDetails.map((detail) => detail.itemId)
  );

  useEffect(() => {
    if (isOpen) {
      fetchCanteenItems();
      fetchTrucks();
    }
  }, [isOpen]);

  const fetchTrucks = async () => {
    try {
      const trucksData = await getTrucks();
      setTrucks(trucksData);
    } catch (error) {
      toast.error("Failed to fetch trucks");
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

  const getFilteredCanteenItems = (searchTerm: string) => {
    if (!searchTerm) return canteenItems;
    return canteenItems.filter((item) =>
      item.itemName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const handleCanteenDetailChange = (
    index: number,
    field: string,
    value: string | number
  ) => {
    setFormData((prev) => {
      const newDetails = [...prev.canteenOrderDetails];

      if (field === "itemId") {
        const selectedItem = canteenItems.find((item) => item.id === value);
        newDetails[index] = {
          ...newDetails[index],
          [field]: value as string,
          unitPrice: selectedItem?.unitPrice || 0,
          canteenItem: selectedItem
            ? {
                itemName: selectedItem.itemName,
                unitPrice: selectedItem.unitPrice,
                imageUrl: selectedItem.imageUrl,
              }
            : newDetails[index].canteenItem,
        };
      } else {
        newDetails[index] = {
          ...newDetails[index],
          [field]: typeof value === "string" ? value : String(value),
        };
      }

      return {
        ...prev,
        canteenOrderDetails: newDetails,
      };
    });
  };

  const handleCanteenSearch = (index: number, value: string) => {
    setFormData((prev) => {
      const newDetails = [...prev.canteenOrderDetails];
      newDetails[index] = {
        ...newDetails[index],
        searchItem: value,
      };

      return {
        ...prev,
        canteenOrderDetails: newDetails,
      };
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddItem = () => {
    const hasEmptyItem = formData.canteenOrderDetails.some(
      detail => !detail.itemId
    );
    if (hasEmptyItem) {
      toast.warning("Please complete current item before adding new");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      canteenOrderDetails: [
        ...prev.canteenOrderDetails,
        {
          itemId: "",
          quantity: 1,
          unitPrice: 0,
          canteenItem: undefined,
        },
      ],
    }));
  };

  const handleRemoveItem = (itemId: string) => {
    setFormData((prev) => ({
      ...prev,
      canteenOrderDetails: prev.canteenOrderDetails.filter(
        (detail) => detail.itemId !== itemId
      ),
    }));
    toast.success("Item removed successfully");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.canteenOrderDetails.length === 0) {
      toast.warning("Please add at least one item");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        ...formData,
        orderDetails: formData.canteenOrderDetails.map((detail) => ({
          itemId: detail.itemId,
          quantity: detail.quantity,
        })),
      };

      await createCanteenOrder(payload);
      toast.success("Canteen order created successfully");
      onCreate();
      onClose();
      setFormData({
        licensePlate: "",
        orderDate: "",
        createdAt: new Date().toISOString(),
        status: "Pending",
        canteenOrderDetails: [],
      });
    } catch (error) {
      toast.error("Failed to create canteen order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalContent className="max-w-[1000px] min-h-[700px] max-h-[90vh]">
      <ModalHeader className="border-b pb-3">Create Canteen Order</ModalHeader>
      <ModalBody className="max-h-[80vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">
                Canteen Order Information
              </h3>
              <div className="grid grid-cols-[60%_30%] gap-4">
                <Form.Item
                  label="License Plate"
                  required
                  style={{ width: "90%" }}
                >
                  <Select
                    style={{ width: "80%" }}
                    placeholder="Please Select License Plate"
                    value={formData.licensePlate}
                    onChange={(value) =>
                      setFormData((prev) => ({ ...prev, licensePlate: value }))
                    }
                    getPopupContainer={(triggerNode) =>
                      triggerNode.parentElement!
                    }
                  >
                    {trucks.map((truck) => (
                      <Select.Option key={truck.id} value={truck.licensePlate}>
                        {truck.licensePlate}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
                <Input
                  label="Order Date & Time"
                  type="datetime-local"
                  name="orderDate"
                  value={formData.orderDate}
                  onChange={handleInputChange}
                  required
                  className="w-full"
                  placeholder=" "
                />
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Add Items to Order</h3>
              {formData.canteenOrderDetails.map((detail, index) => (
                <div
                  key={index}
                  className="mb-6 p-4 border border-gray-200 rounded-lg bg-white"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_40px] gap-4 items-end">
                    <div className="col-span-1 lg:col-span-1">
                      <Select
                        showSearch
                        style={{ width: "100%", height: "56px" }}
                        placeholder="Search to Select Item"
                        optionFilterProp="children"
                        value={detail.itemId || undefined}
                        onChange={(value) =>
                          handleCanteenDetailChange(index, "itemId", value)
                        }
                        onSearch={(value) => handleCanteenSearch(index, value)}
                        filterOption={false}
                        options={getFilteredCanteenItems(
                          detail.searchItem || ""
                        ).map((item) => ({
                          value: item.id,
                          label: (
                            <div className="flex items-center gap-4">
                              <img
                                src={item.imageUrl || "/placeholder.png"}
                                alt={item.itemName}
                                className="w-12 h-12 object-cover rounded-md"
                              />
                              <div className="flex flex-col flex-1">
                                <span>{item.itemName}</span>
                              </div>
                              <div className="text-right">
                                <span>{`${item.unitPrice}`}</span>
                              </div>
                            </div>
                          ),
                          disabled: selectedItemIds.has(item.id),
                        }))}
                        getPopupContainer={(trigger) => trigger.parentElement!}
                      />
                    </div>
                    <Input
                      label="Quantity"
                      type="number"
                      value={detail.quantity.toString()}
                      onChange={(e) =>
                        handleCanteenDetailChange(
                          index,
                          "quantity",
                          e.target.value
                        )
                      }
                      min="1"
                      required
                      className="w-full"
                    />
                    <Input
                      label="Total Price"
                      type="text"
                      value={`${(
                        detail.quantity * (detail.unitPrice ?? 0)
                      ).toLocaleString()} VND`}
                      disabled
                      className="w-full"
                    />
                    <Button
                      type="button"
                      variant="flat"
                      color="danger"
                      onClick={() => handleRemoveItem(detail.itemId)}
                      isIconOnly
                      className="h-10 w-10"
                    >
                      <BinIcon />
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="flat"
                onClick={handleAddItem}
                className="w-full mt-4"
              >
                + Add New Item
              </Button>
            </div>
          </div>
        </form>
      </ModalBody>
      <ModalFooter className="border-t pt-4">
        <div className="flex items-center justify-between w-full gap-4">
            <div className="flex items-center gap-4">
                <div className="flex flex-col items-center">
                  <span className="text-gray-500 text-sm">Total Quantity</span>
                  <span className="text-xl font-bold text-primary">
                    {formData.canteenOrderDetails.reduce(
                      (total, detail) => total + (detail.quantity || 0),
                      0
                    )}
                  </span>
                </div>

                <div className="h-8 w-px bg-gray-300"></div>

                <div className="flex flex-col items-center">
                  <span className="text-gray-500 text-sm">Total Amount</span>
                  <span className="text-xl font-bold text-green-600">

                  {formData.canteenOrderDetails
                    .reduce(
                      (total, detail) =>
                        total +
                        (detail.quantity || 0) * (detail.unitPrice || 0),
                      0
                    )
                    .toLocaleString() + " VND"}
                  </span>
                </div>
              </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="flat"
              onClick={onClose}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              color="primary"
              isLoading={loading}
              className="px-6"
              onClick={handleSubmit}
            >
              Create Order
            </Button>
          </div>
        </div>
      </ModalFooter>
    </ModalContent>
  );
};