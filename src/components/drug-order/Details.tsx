import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Card, CardHeader, CardBody, Chip, ChipProps } from "@heroui/react";
import { Steps } from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { getDrugOrderById, DrugOrderIdResponse } from "@/api/drugorder";

const statusColorMap: Record<string, ChipProps["color"]> = {
  Pending: "warning",
  Approved: "primary",
  Rejected: "danger",
  Completed: "success",
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
    case "Approved":
      return 1;
    case "Rejected":
      return 1;
    case "Completed":
      return 2;
    default:
      return 0;
  }
};

export function DrugOrderDetails() {
  const router = useRouter();
  const { id } = router.query;
  const [drugOrder, setDrugOrder] = useState<DrugOrderIdResponse | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (id && typeof id === "string") {
        try {
          const orderData = await getDrugOrderById(id);
          setDrugOrder(orderData);
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

  return (
    <div ref={{ current: null }} className="space-y-6 p-6">
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
          <h4 className="text-xl font-bold">Drug Order Details</h4>
          <div className="w-[550px]">
            <Steps
              size="small"
              current={getStepStatus(drugOrder?.status || "Pending")}
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
                  status:
                    drugOrder?.status === "Pending" ? "process" : "finish",
                  icon:
                    drugOrder?.status === "Pending" ? (
                      <LoadingOutlined />
                    ) : (
                      <CheckOutlined />
                    ),
                },
                {
                  title:
                    drugOrder?.status === "Rejected" ? (
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
                    drugOrder?.status === "Rejected"
                      ? "error"
                      : drugOrder?.status === "Approved"
                      ? "process"
                      : drugOrder?.status === "Completed"
                      ? "finish"
                      : "wait",
                  icon:
                    drugOrder?.status === "Rejected" ? (
                      <CloseOutlined />
                    ) : drugOrder?.status === "Approved" ? (
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
                  status: drugOrder?.status === "Completed" ? "finish" : "wait",
                  icon:
                    drugOrder?.status === "Completed" ? (
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
            {/* Order Code */}
            <div className="p-4 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-2">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Order Code</p>
                  <p className="font-semibold text-base text-gray-800">
                    {drugOrder?.drugOrderCode}
                  </p>
                </div>
              </div>
            </div>

            {/* Supplier */}
            <div className="p-4 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-2">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Supplier</p>
                  <p className="font-semibold text-base text-gray-800">
                    {drugOrder?.supplier.supplierName}
                  </p>
                </div>
              </div>
            </div>

            {/* Created By */}
            <div className="p-4 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-2">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Created By</p>
                  <p className="font-semibold text-base text-gray-800">
                    {drugOrder?.createdBy.userName}
                  </p>
                  <Chip
                    className="capitalize mt-1"
                    color={
                      roleColorMap[
                        drugOrder?.createdBy.role as keyof typeof roleColorMap
                      ]
                    }
                    size="sm"
                    variant="flat"
                  >
                    {drugOrder?.createdBy.role}
                  </Chip>
                </div>
              </div>
            </div>

            {/* Order Date */}
            <div className="p-4 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-2">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Order Date</p>
                  <p className="font-semibold text-base text-gray-800">
                    {drugOrder?.orderDate
                      ? formatDate(drugOrder.orderDate)
                      : "-"}
                  </p>
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
                      !drugOrder?.updatedAt
                        ? "italic text-gray-400"
                        : "text-gray-800"
                    }`}
                  >
                    {drugOrder?.updatedAt
                      ? formatDate(drugOrder.updatedAt)
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
                      !drugOrder?.updatedBy?.userName
                        ? "italic text-gray-400"
                        : "text-gray-800"
                    }`}
                  >
                    {drugOrder?.updatedBy?.userName || "Not updated yet"}
                  </p>
                  {drugOrder?.updatedBy?.role && (
                    <Chip
                      className="capitalize mt-1"
                      color={
                        roleColorMap[
                          drugOrder.updatedBy.role as keyof typeof roleColorMap
                        ]
                      }
                      size="sm"
                      variant="flat"
                    >
                      {drugOrder.updatedBy.role}
                    </Chip>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Total Drug Types, Total Quantity, Total Price */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            {/* Total Drug Types */}
            <div className="p-4 bg-purple-50 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-2">
                <div>
                  <p className="text-purple-600 text-sm mb-1">
                    Total Drug Types
                  </p>
                  <p className="font-semibold text-base text-purple-800">
                    {drugOrder?.drugOrderDetails.length || 0} types
                  </p>
                </div>
              </div>
            </div>

            {/* Total Quantity */}
            <div className="p-4 bg-blue-50 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-2">
                <div>
                  <p className="text-blue-600 text-sm mb-1">Total Quantity</p>
                  <p className="font-semibold text-base text-blue-800">
                    {drugOrder?.totalQuantity.toLocaleString()} units
                  </p>
                </div>
              </div>
            </div>

            {/* Total Price */}
            <div className="p-4 bg-green-50 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-2">
                <div>
                  <p className="text-green-600 text-sm mb-1">Total Price</p>
                  <p className="font-semibold text-base text-green-800">
                    {drugOrder?.totalPrice
                      ? formatPrice(drugOrder.totalPrice)
                      : "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
      <Card>
        <CardHeader>
          <h4 className="text-xl font-bold">Drugs In The Order</h4>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {drugOrder?.drugOrderDetails.map((detail) => (
              <div
                key={detail.id}
                className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-100"
              >
                <div className="flex items-start space-x-4">
                  {/* Hình ảnh thuốc */}
                  {detail.drug.imageUrl && (
                    <img
                      src={detail.drug.imageUrl}
                      alt={detail.drug.name}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    {/* Tên thuốc và mã thuốc */}
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-semibold text-lg text-gray-800">
                          {detail.drug.name}
                        </h5>
                        <p className="text-sm text-gray-500">
                          Code: {detail.drug.drugCode}
                        </p>
                      </div>
                      {/* Chip status */}
                      {detail.status && (
                        <Chip
                          color={
                            statusColorMap[
                              detail.status as keyof typeof statusColorMap
                            ]
                          }
                          size="sm"
                          variant="flat"
                          className="capitalize"
                        >
                          {detail.status}
                        </Chip>
                      )}
                    </div>

                    {/* Thông tin chi tiết */}
                    <div className="mt-4 space-y-3">
                      <div className="flex justify-between">
                        <p className="text-sm text-gray-600">Quantity</p>
                        <p className="font-semibold text-gray-800">
                          {detail.quantity} {detail.drug.unit}
                        </p>
                      </div>
                      <div className="flex justify-between">
                        <p className="text-sm text-gray-600">Price Per Unit</p>
                        <p className="font-semibold text-gray-800">
                          {formatPrice(detail.pricePerUnit)}
                        </p>
                      </div>
                      <div className="flex justify-between">
                        <p className="text-sm text-gray-600">Total</p>
                        <p className="font-semibold text-blue-600">
                          {formatPrice(detail.quantity * detail.pricePerUnit)}
                        </p>
                      </div>
                    </div>

                    {/* Thông tin người tạo và ngày tạo */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-sm text-gray-500">
                        Created by:{" "}
                        <span className="font-semibold text-gray-700">
                          {detail.createdBy.userName}
                        </span>
                      </p>
                      <p className="text-sm text-gray-500">
                        Created at:{" "}
                        <span className="font-semibold text-gray-700">
                          {formatDate(detail.createdAt)}
                        </span>
                      </p>
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
