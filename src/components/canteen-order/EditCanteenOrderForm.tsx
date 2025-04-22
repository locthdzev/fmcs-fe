import React, { useEffect, useState } from "react";
import {
  Button,
  Input,
  Modal,
  Form,
  Space,
  Spin,
  message,
} from "antd";
import { Select } from "antd";
import {
  updateCanteenOrder,
  getCanteenOrderById,
  CanteenOrderResponse,
} from "@/api/canteenorder";
import { CanteenItemResponse, getAllCanteenItems } from "@/api/canteenitems";
import { DeleteOutlined } from "@ant-design/icons";
import { getTrucks } from "@/api/truck";
import { ConfirmModal } from "./Confirm";

interface EditCanteenOrderFormProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  orderId: string;
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
  item?: {
    itemName: string;
  };
  canteenItem?: {
    itemName: string;
    unitPrice?: number;
    imageUrl?: string;
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
  isOpen,
  onClose,
  onUpdate,
  orderId,
}) => {
  const [trucks, setTrucks] = useState<any[]>([]);
  const [order, setOrder] = useState<CanteenOrderResponse | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(false);
  const [canteenItems, setCanteenItems] = useState<CanteenItem[]>([]);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const selectedItemIds = new Set(
    formData?.canteenOrderDetails.map((detail) => detail.itemId)
  );

  useEffect(() => {
    if (isOpen) {
      fetchData();
      fetchCanteenItems();
      fetchTrucks();
    }
  }, [isOpen, orderId]);

  const fetchData = async () => {
    try {
      const orderData = await getCanteenOrderById(orderId);
      console.log("API Response:", orderData);
      setOrder(orderData);
      setFormData({
        licensePlate: orderData.truck?.licensePlate || "",
        orderDate: orderData.orderDate,
        updatedAt: new Date().toISOString(),
        status: orderData.status || "Active",
        canteenOrderDetails: orderData.canteenOrderDetails.map(
          (detail: any) => {
            return {
              itemId: detail.itemId,
              quantity: detail.quantity,
              unitPrice: detail.unitPrice,
              canteenItem: detail.item
                ? {
                    itemName: detail.item.itemName,
                    unitPrice: detail.item.unitPrice,
                    imageUrl: detail.item.imageUrl,
                  }
                : undefined,
            };
          }
        ),
      });
    } catch (error) {
      messageApi.error("Failed to load order details", 5);
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
      if (!prev) return null;

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
      if (!prev) return null;

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
  const fetchTrucks = async () => {
    try {
      const trucksData = await getTrucks("Active");
      setTrucks(trucksData);
    } catch (error) {
      messageApi.error("Failed to fetch trucks", 5);
    }
  };
  const fetchCanteenItems = async () => {
    try {
      const items = await getAllCanteenItems();
      setCanteenItems(items);
    } catch (error) {
      messageApi.error("Failed to fetch canteen items", 5);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  const handleAddItem = () => {
    setFormData((prev) => {
      if (!prev) return null;

      return {
        ...prev,
        canteenOrderDetails: [
          ...(prev.canteenOrderDetails || []),
          {
            itemId: "",
            quantity: 1,
            unitPrice: 0,
            canteenItem: undefined,
          },
        ],
      };
    });
  };

  const handleRemoveItem = (itemId: string) => {
    if (!formData) return;

    const updatedDetails = formData.canteenOrderDetails.filter(
      (detail) => detail.itemId !== itemId
    );

    setFormData({
      ...formData,
      canteenOrderDetails: updatedDetails,
    });

    messageApi.success("Item removed successfully", 5);
  };

  const handleSubmit = () => {
    if (!formData) return;
    setIsConfirmationModalOpen(true);
  };

  const handleConfirmUpdate = async () => {
    if (!formData) return;

    try {
      setLoading(true);
      const formDataToSend = new FormData();

      formDataToSend.append("licensePlate", formData.licensePlate);
      formDataToSend.append("orderDate", formData.orderDate);
      formDataToSend.append("updatedAt", formData.updatedAt);
      formDataToSend.append("status", formData.status);

      const orderDetails = formData.canteenOrderDetails.map((detail) => ({
        itemId: detail.itemId,
        quantity: detail.quantity,
      }));

      orderDetails.forEach((detail, index) => {
        formDataToSend.append(`orderDetails[${index}].itemId`, detail.itemId);
        formDataToSend.append(
          `orderDetails[${index}].quantity`,
          detail.quantity.toString()
        );
      });

      await updateCanteenOrder(orderId, formDataToSend);
      messageApi.success("Canteen order updated successfully", 5);
      onUpdate();
      onClose();
    } catch (error) {
      messageApi.error("Failed to update canteen order", 5);
    } finally {
      setLoading(false);
      setIsConfirmationModalOpen(false);
    }
  };

  if (!formData) {
    return (
      <Modal
        open={isOpen}
        onCancel={onClose}
        footer={null}
        width={1000}
      >
        <div style={{ textAlign: 'center', padding: '30px' }}>
          <Spin size="large" tip="Loading order data..." />
        </div>
      </Modal>
    );
  }

  return (
    <>
      {contextHolder}
      <Modal
        open={isOpen}
        onCancel={onClose}
        footer={null}
        width={1000}
        style={{ maxHeight: "90vh" }}
      >
        <Form onFinish={handleSubmit}>
          <div className="grid grid-cols-1 gap-3">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">
                Canteen Order Information
              </h3>
              <Select
                style={{ width: "100%" }}
                placeholder="Select License Plate"
                value={formData.licensePlate}
                onChange={(value) => {
                  setFormData((prev) =>
                    prev
                      ? {
                          ...prev,
                          licensePlate: value,
                        }
                      : null
                  );
                }}
              >
                {trucks.map((truck) => (
                  <Select.Option key={truck.id} value={truck.licensePlate}>
                    {truck.licensePlate}
                  </Select.Option>
                ))}
              </Select>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mt-1">
              <h3 className="text-lg font-semibold mb-4">
                Edit Items In Order
              </h3>
              {formData.canteenOrderDetails.map((detail, index) => (
                <div
                  key={index}
                  className="mb-6 p-4 border border-gray-200 rounded-lg bg-white"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_40px] gap-4 items-end">
                    <Form.Item label="Select Item" className="mb-0">
                      <Select
                        showSearch
                        style={{ width: "100%", height: "32px" }}
                        placeholder="Search to Select Item"
                        optionFilterProp="children"
                        value={detail.itemId || undefined}
                        onChange={(value) =>
                          handleCanteenDetailChange(index, "itemId", value)
                        }
                        onSearch={(value) =>
                          handleCanteenSearch(index, value)
                        }
                        filterOption={false}
                        options={getFilteredCanteenItems(
                          detail.searchItem || ""
                        ).map((item) => ({
                          value: item.id,
                          label: (
                            <div className="flex items-center gap-2" style={{ height: "24px", lineHeight: "24px", overflow: "hidden" }}>
                              <img
                                src={item.imageUrl || "/placeholder.png"}
                                alt={item.itemName}
                                className="w-6 h-6 object-cover rounded-md"
                              />
                              <div className="flex-1 truncate">
                                <span>{item.itemName}</span>
                              </div>
                              <div className="text-right">
                                <span>{`${item.unitPrice}`}</span>
                              </div>
                            </div>
                          ),
                          disabled: selectedItemIds.has(item.id),
                        }))}
                      >
                        {canteenItems.map((item) => (
                          <Select.Option key={item.id} value={item.id}>
                            <div className="flex items-center gap-2" style={{ height: "24px", lineHeight: "24px", overflow: "hidden" }}>
                              <img
                                src={item.imageUrl || "/placeholder.png"}
                                alt={item.itemName}
                                className="w-6 h-6 object-cover rounded-md"
                              />
                              <div className="flex-1 truncate">
                                <span>{item.itemName}</span>
                              </div>
                              <div className="text-right">
                                <span>{`${item.unitPrice}`}</span>
                              </div>
                            </div>
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                    <Form.Item label="Quantity" className="mb-0">
                      <Input
                        type="number"
                        value={detail.quantity.toString()}
                        onChange={(e) => {
                          const newDetails = [
                            ...formData.canteenOrderDetails,
                          ];
                          newDetails[index].quantity = Number(e.target.value);
                          setFormData({
                            ...formData,
                            canteenOrderDetails: newDetails,
                          });
                        }}
                        min={1}
                        required
                        className="w-full"
                      />
                    </Form.Item>
                    <Form.Item label="Total Price" className="mb-0">
                      <Input
                        type="text"
                        value={
                          (
                            detail.quantity * (detail.unitPrice ?? 0)
                          ).toLocaleString() + " VND"
                        }
                        disabled
                        className="w-full"
                      />
                    </Form.Item>

                    <Button
                      danger
                      type="text"
                      onClick={() => handleRemoveItem(detail.itemId)}
                      icon={<DeleteOutlined />}
                    />
                  </div>
                </div>
              ))}{" "}
              <Button
                type="default"
                onClick={handleAddItem}
                className="w-full mt-4"
              >
                + Add New Item
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between w-full gap-4 mt-4">
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
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                loading={loading}
                onClick={handleSubmit}
              >
                Update Order
              </Button>
            </div>
          </div>
        </Form>
      </Modal>

      <ConfirmModal
        isOpen={isConfirmationModalOpen}
        onClose={() => setIsConfirmationModalOpen(false)}
        onConfirm={handleConfirmUpdate}
        title="Confirm Update"
        message="Please review your order details carefully before proceeding. Are you sure you want to update this order?"
        confirmText="Update Order"
        cancelText="Cancel"
      />
    </>
  );
};
