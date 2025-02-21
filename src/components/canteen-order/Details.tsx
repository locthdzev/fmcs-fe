import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  Card,
  CardHeader,
  CardBody,
  Chip,
  ChipProps,
  Image,
} from "@heroui/react";
import { Steps } from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { getCanteenOrderById, CanteenOrderResponse } from "@/api/canteenorder";

const statusColorMap: Record<string, ChipProps["color"]> = {
  Pending: "warning",
  Processing: "primary",
  Completed: "success",
  Cancelled: "danger",
};
const roleColorMap: Record<string, ChipProps["color"]> = {
  Admin: "danger",
  Manager: "warning",
  Staff: "primary",
  User: "success",
  Unknown: "default",
};
const getStepStatus = (currentStatus: string) => {
  switch (currentStatus) {
    case "Pending":
      return 0;
    case "Processing":
      return 1;
    case "Completed":
      return 2;
    case "Cancelled":
      return 1;
    default:
      return 0;
  }
};

export function CanteenOrderDetails() {
  const router = useRouter();
  const { id } = router.query;
  const [order, setOrder] = useState<CanteenOrderResponse | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (id && typeof id === "string") {
        try {
          const orderData = await getCanteenOrderById(id);
          setOrder(orderData);
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      }
    };
    fetchData();
  }, [id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString("vi-VN")} ${date.getHours()}:${String(
      date.getMinutes()
    ).padStart(2, "0")}`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      currencyDisplay: "code",
    }).format(price);
  };

  const calculateTotalAmount = () => {
    return (
      order?.canteenOrderDetails?.reduce((sum, detail) => {
        const unitPrice = detail.unitPrice
          ? Number(detail.unitPrice)
          : Number(detail.unitPrice || 0);
        return sum + (detail.quantity || 0) * unitPrice;
      }, 0) || 0
    );
  };

  return (
    <div className="space-y-6 p-6">
      <button
        onClick={() => router.back()}
        className="p-0.5 text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-100 w-6 h-6 flex items-center justify-center mb-0"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>

      <Card>
        <CardHeader className="flex justify-between items-center">
          <h4 className="text-xl font-bold">Canteen Order Details</h4>
          <div className="w-[550px]">
            <Steps
              size="small"
              current={getStepStatus(order?.status || "Pending")}
              items={[
                {
                  title: (
                    <Chip
                      color={statusColorMap["Pending"]}
                      size="sm"
                      variant="flat"
                    >
                      Pending
                    </Chip>
                  ),
                  status: order?.status === "Pending" ? "process" : "finish",
                  icon:
                    order?.status === "Pending" ? (
                      <LoadingOutlined />
                    ) : (
                      <CheckOutlined />
                    ),
                },
                {
                  title:
                    order?.status === "Rejected" ? (
                      <Chip
                        color={statusColorMap["Rejected"]}
                        size="sm"
                        variant="flat"
                      >
                        Rejected
                      </Chip>
                    ) : (
                      <Chip
                        color={statusColorMap["Approved"]}
                        size="sm"
                        variant="flat"
                      >
                        Approved
                      </Chip>
                    ),
                  status:
                    order?.status === "Rejected"
                      ? "error"
                      : order?.status === "Approved"
                      ? "process"
                      : order?.status === "Completed"
                      ? "finish"
                      : "wait",
                  icon:
                    order?.status === "Rejected" ? (
                      <CloseOutlined />
                    ) : order?.status === "Approved" ? (
                      <LoadingOutlined />
                    ) : (
                      <CheckOutlined />
                    ),
                },
                {
                  title: (
                    <Chip
                      color={statusColorMap["Completed"]}
                      size="sm"
                      variant="flat"
                    >
                      Completed
                    </Chip>
                  ),
                  status: order?.status === "Completed" ? "finish" : "wait",
                  icon:
                    order?.status === "Completed" ? (
                      <CheckCircleOutlined />
                    ) : (
                      <CheckOutlined />
                    ),
                },
              ]}
            />
          </div>
        </CardHeader>

        <CardBody>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-2">
                <div>
                  <p className="text-gray-600 text-sm mb-1">License Plate</p>
                  <p className="font-semibold text-base text-gray-800">
                    {order?.truck?.licensePlate || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-2">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Order Date</p>
                  <p className="font-semibold text-base text-gray-800">
                    {order?.orderDate ? formatDate(order.orderDate) : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-2">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Created By</p>
                  <p className="font-semibold text-base text-gray-800">
                    {order?.createdBy?.userName || "N/A"}
                  </p>
                  {order?.createdBy?.role && (
                    <Chip
                      className="capitalize mt-1"
                      color={roleColorMap[order.createdBy.role]}
                      size="sm"
                      variant="flat"
                    >
                      {order.createdBy.role}
                    </Chip>
                  )}
                </div>
              </div>
            </div>

            {/* Updated At */}
            <div className="p-4 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-2">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Updated At</p>
                  <p
                    className={`font-semibold text-base ${
                      !order?.updatedAt
                        ? "italic text-gray-400"
                        : "text-gray-800"
                    }`}
                  >
                    {order?.updatedAt
                      ? formatDate(order.updatedAt)
                      : "Not updated yet"}
                  </p>
                </div>
              </div>
            </div>

            {/* Updated By */}
            <div className="p-4 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-2">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Updated By</p>
                  <p
                    className={`font-semibold text-base ${
                      !order?.updatedBy?.userName
                        ? "italic text-gray-400"
                        : "text-gray-800"
                    }`}
                  >
                    {order?.updatedBy?.userName || "Not updated yet"}
                  </p>
                  {order?.updatedBy?.role && (
                    <Chip
                      className="capitalize mt-1"
                      color={roleColorMap[order.updatedBy.role]}
                      size="sm"
                      variant="flat"
                    >
                      {order.updatedBy.role}
                    </Chip>
                  )}
                </div>
              </div>
            </div>

            {/* Total Quantity */}
            <div className="p-4 bg-blue-50 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-2">
                <div>
                  <p className="text-blue-600 text-sm mb-1">Total Quantity</p>
                  <p className="font-semibold text-base text-blue-800">
                    {order?.canteenOrderDetails
                      ? order.canteenOrderDetails
                          .reduce(
                            (sum, detail) => sum + (detail.quantity || 0),
                            0
                          )
                          .toLocaleString()
                      : 0}{" "}
                    items{" "}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-2">
                <div>
                  <p className="text-green-600 text-sm mb-1">Total Amount</p>
                  <p className="font-semibold text-base text-green-600">
                    {formatPrice(calculateTotalAmount())}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
      <Card>
        <CardHeader>
          <h4 className="text-xl font-bold">Order Items</h4>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {order?.canteenOrderDetails?.map((detail) => (
              <div
                key={detail.itemId}
                className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-100"
              >
                <div className="flex items-start space-x-4">
                  {detail.imageUrl && (
                    <Image
                      src={detail.imageUrl}
                      alt={detail.itemName}
                      className="w-24 h-24 object-cover rounded-lg"
                      isZoomed
                      width={96}
                      height={96}
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-semibold text-lg text-gray-800">
                          {detail.itemName || "N/A"}
                        </h5>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div className="flex justify-between">
                        <p className="text-sm text-gray-600">Unit Price</p>
                        <p className="font-semibold text-gray-800">
                          {formatPrice(
                            Number(detail.unitPrice || detail.unitPrice || 0)
                          )}
                        </p>
                      </div>
                      <div className="flex justify-between">
                        <p className="text-sm text-gray-600">Quantity</p>
                        <p className="font-semibold text-gray-800">
                          {detail.quantity || 0}
                        </p>
                      </div>
                      <div className="flex justify-between">
                        <p className="text-sm text-gray-600">Subtotal</p>
                        <p className="font-semibold text-blue-600">
                          {formatPrice(
                            (detail.quantity || 0) *
                              Number(detail.unitPrice || detail.unitPrice || 0)
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
