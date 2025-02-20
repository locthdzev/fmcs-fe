import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Chip,
} from "@heroui/react";
import { CanteenOrderResponse } from "@/api/canteenorder";

interface CanteenOrderDetailsModalProps {
  order: CanteenOrderResponse | null;
  isOpen: boolean;
  onClose: () => void;
}

const statusColorMap: Record<string, any> = {
  Active: "success",
  Inactive: "danger",
  Cancelled: "warning",
};

const CanteenOrderDetailsModal: React.FC<CanteenOrderDetailsModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  if (!order) return null;

  const totalAmount =
    order.canteenOrderDetails?.reduce((sum, detail) => {
      const unitPrice = detail.canteenItem?.unitPrice
        ? Number(detail.canteenItem.unitPrice)
        : Number(detail.unitPrice || 0);
      const quantity = detail.quantity || 0;
      return sum + quantity * unitPrice;
    }, 0) || 0;

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} className="max-w-2xl">
      <ModalContent className="rounded-lg shadow-lg border border-gray-200 bg-white">
        <ModalHeader className="border-b pb-3">
          Canteen Order Details
        </ModalHeader>
        <ModalBody className="p-6">
          <div className="space-y-6 text-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  label: "License Plate",
                  value: order.truck?.licensePlate || "N/A",
                },
                {
                  label: "Order Date",
                  value: new Date(order.orderDate).toLocaleDateString("vi-VN"),
                },
                {
                  label: "Created At",
                  value: new Date(order.createdAt).toLocaleDateString("vi-VN"),
                },
                {
                  label: "Updated At",
                  value: order.updatedAt
                    ? new Date(order.updatedAt).toLocaleDateString("vi-VN")
                    : "-",
                },
              ].map((field, index) => (
                <label
                  key={index}
                  className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm"
                >
                  <span className="text-xs font-medium text-gray-700">
                    {field.label}
                  </span>
                  <div className="mt-1 w-full border-none p-0 sm:text-sm">
                    {field.value}
                  </div>
                </label>
              ))}
            </div>

            {/* Order Items Table */}
            <div className="mt-6">
              <h3 className="font-semibold text-lg mb-3">Order Items</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item Name
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit Price
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {order.canteenOrderDetails?.map((detail) => {
                      // Log individual detail to verify structure
                      console.log("Detail:", detail);

                      return (
                        <tr key={detail.itemId || detail.itemId}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {detail.canteenItem?.itemName ||
                              detail.itemName ||
                              "N/A"}
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            $
                            {detail.canteenItem?.unitPrice ||
                              detail.unitPrice ||
                              "0"}
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            {detail.quantity || 0}
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            $
                            {(
                              (detail.quantity || 0) *
                              Number(
                                detail.canteenItem?.unitPrice ||
                                  detail.unitPrice ||
                                  0
                              )
                            ).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td
                        colSpan={3}
                        className="px-6 py-4 text-right font-semibold"
                      >
                        Total Amount:
                      </td>
                      <td className="px-6 py-4 text-right font-semibold">
                        ${totalAmount?.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 underline">
                Status:
              </span>
              <Chip
                className="capitalize px-2 py-1 text-sm font-medium"
                color={
                  order.status && statusColorMap[order.status]
                    ? statusColorMap[order.status]
                    : "default"
                }
                size="sm"
                variant="flat"
              >
                {order.status}
              </Chip>
            </div>
          </div>
        </ModalBody>

        <ModalFooter className="border-t pt-3">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CanteenOrderDetailsModal;
