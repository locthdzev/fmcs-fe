import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  Card,
  CardHeader,
  CardBody,
  Chip,
  ChipProps,
  Button,
  Checkbox,
} from "@heroui/react";
import { Steps, message } from "antd"; // Nhập StepsProps để mở rộng kiểu
import { LoadingOutlined, CheckOutlined } from "@ant-design/icons";
import {
  getDrugOrderById,
  DrugOrderIdResponse,
  completeDrugOrderDetails,
  rejectDrugOrderDetails,
} from "@/api/drugorder";
import { ConfirmModal } from "./Confirm";

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
      return 2;
    case "Completed":
      return 3;
    default:
      return 0;
  }
};

export function DrugOrderDetails() {
  const router = useRouter();
  const { id } = router.query;
  const [drugOrder, setDrugOrder] = useState<DrugOrderIdResponse | null>(null);
  const [selectedDetailIds, setSelectedDetailIds] = useState<Set<string>>(
    new Set()
  );
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    "complete" | "reject" | null
  >(null);
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);

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

  const handleToggleSelect = (detailId: string) => {
    setSelectedDetailIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(detailId)) {
        newSet.delete(detailId);
      } else {
        newSet.add(detailId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allEligibleIds =
        drugOrder?.drugOrderDetails
          .filter((d) => d.isActive && d.status === "Approved")
          .map((d) => d.id) || [];
      setSelectedDetailIds(new Set(allEligibleIds));
    } else {
      setSelectedDetailIds(new Set());
    }
  };

  const handleCompleteDetails = async () => {
    if (selectedDetailIds.size === 0) {
      messageApi.error("Please select at least one detail to complete.");
      return;
    }

    try {
      setLoading(true);
      const response = await completeDrugOrderDetails({
        drugOrderDetailIds: Array.from(selectedDetailIds),
      });
      if (response.isSuccess) {
        messageApi.success("Selected drug order details completed successfully");
        const updatedOrder = await getDrugOrderById(id as string);
        setDrugOrder(updatedOrder);
        setSelectedDetailIds(new Set());
      } else {
        messageApi.error(
          response.message || "Failed to complete drug order details"
        );
      }
    } catch (error) {
      messageApi.error("Failed to complete drug order details");
    } finally {
      setLoading(false);
    }
  };

  const handleRejectDetails = async () => {
    if (selectedDetailIds.size === 0) {
      messageApi.error("Please select at least one detail to reject.");
      return;
    }

    try {
      setLoading(true);
      const response = await rejectDrugOrderDetails({
        drugOrderDetailIds: Array.from(selectedDetailIds),
      });
      if (response.isSuccess) {
        messageApi.success("Selected drug order details rejected successfully");
        const updatedOrder = await getDrugOrderById(id as string);
        setDrugOrder(updatedOrder);
        setSelectedDetailIds(new Set());
      } else {
        messageApi.error(response.message || "Failed to reject drug order details");
      }
    } catch (error) {
      messageApi.error("Failed to reject drug order details");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAction = async () => {
    if (confirmAction === "complete") {
      await handleCompleteDetails();
    } else if (confirmAction === "reject") {
      await handleRejectDetails();
    }
    setIsConfirmModalOpen(false);
    setConfirmAction(null);
  };

  const canCompleteOrReject = drugOrder?.status === "Approved";
  const showActionButtons = canCompleteOrReject && selectedDetailIds.size > 0;

  const activeDetails =
    drugOrder?.drugOrderDetails.filter((detail) => detail.isActive) || [];

  return (
    <div className="space-y-6 p-6">
      {contextHolder}
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
          <div className="w-[450px]">
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
                      <LoadingOutlined style={{ fontSize: "20px" }} />
                    ) : undefined,
                },
                {
                  title: (
                    <Chip
                      color={
                        drugOrder?.status === "Rejected"
                          ? statusColorMap["Rejected"]
                          : statusColorMap["Approved"]
                      }
                      size="sm"
                      variant="flat"
                    >
                      {drugOrder?.status === "Rejected"
                        ? "Rejected"
                        : "Approved"}
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
                    drugOrder?.status === "Approved" ? (
                      <LoadingOutlined style={{ fontSize: "20px" }} />
                    ) : undefined,
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
                    drugOrder?.status === "Completed" ? undefined : undefined,
                },
              ]}
            />{" "}
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-3 gap-4">
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

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="p-4 bg-purple-50 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-2">
                <div>
                  <p className="text-purple-600 text-sm mb-1">
                    Total Drug Types
                  </p>
                  <p className="font-semibold text-base text-purple-800">
                    {activeDetails.length} types
                  </p>
                </div>
              </div>
            </div>

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
        <CardHeader className="flex justify-between items-center">
          <h4 className="text-xl font-bold">Drugs In The Order</h4>
          <div className="flex gap-2 items-center">
            {canCompleteOrReject && (
              <>
                {showActionButtons && (
                  <>
                    <Button
                      color="success"
                      onClick={() => {
                        setConfirmAction("complete");
                        setIsConfirmModalOpen(true);
                      }}
                      isDisabled={
                        selectedDetailIds.size === 0 ||
                        !activeDetails.some(
                          (d) =>
                            selectedDetailIds.has(d.id) &&
                            d.status === "Approved"
                        )
                      }
                    >
                      Complete Selected
                    </Button>
                    <Button
                      color="danger"
                      onClick={() => {
                        setConfirmAction("reject");
                        setIsConfirmModalOpen(true);
                      }}
                      isDisabled={
                        selectedDetailIds.size === 0 ||
                        !activeDetails.some(
                          (d) =>
                            selectedDetailIds.has(d.id) &&
                            d.status === "Approved"
                        )
                      }
                    >
                      Reject Selected
                    </Button>
                  </>
                )}
                <Checkbox
                  size="sm"
                  isSelected={
                    selectedDetailIds.size ===
                    activeDetails.filter((d) => d.status === "Approved").length
                  }
                  onChange={(e) => handleSelectAll(e.target.checked)}
                >
                  Select All
                </Checkbox>
              </>
            )}
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {drugOrder?.drugOrderDetails.map((detail) => (
              <div
                key={detail.id}
                className={`p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border ${
                  detail.isActive
                    ? "bg-white border-gray-200"
                    : "bg-gray-100 border-gray-300 opacity-70"
                } relative`}
              >
                {canCompleteOrReject && detail.isActive && (
                  <Checkbox
                    size="sm"
                    isSelected={selectedDetailIds.has(detail.id)}
                    onChange={() => handleToggleSelect(detail.id)}
                    isDisabled={detail.status !== "Approved"}
                    className="absolute top-2 left-2"
                  />
                )}
                <div className="flex items-start space-x-4 mt-8">
                  {detail.drug.imageUrl && (
                    <img
                      src={detail.drug.imageUrl}
                      alt={detail.drug.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <h5 className="font-semibold text-lg text-gray-800">
                          {detail.drug.name}
                        </h5>
                        <p className="text-sm text-gray-500">
                          Code: {detail.drug.drugCode}
                        </p>
                      </div>
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

                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between">
                        <p className="text-sm text-gray-600">Quantity</p>
                        <p className="font-medium text-gray-800">
                          {detail.quantity} {detail.drug.unit}
                        </p>
                      </div>
                      <div className="flex justify-between">
                        <p className="text-sm text-gray-600">Price Per Unit</p>
                        <p className="font-medium text-gray-800">
                          {formatPrice(detail.pricePerUnit)}
                        </p>
                      </div>
                      <div className="flex justify-between">
                        <p className="text-sm text-gray-600">Total</p>
                        <p className="font-medium text-blue-600">
                          {formatPrice(detail.quantity * detail.pricePerUnit)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-500">
                        Created by:{" "}
                        <span className="font-medium text-gray-700">
                          {detail.createdBy.userName}
                        </span>
                      </p>
                      <p className="text-sm text-gray-500">
                        Created at:{" "}
                        <span className="font-medium text-gray-700">
                          {formatDate(detail.createdAt)}
                        </span>
                      </p>
                    </div>
                    {!detail.isActive && (
                      <p className="text-sm text-gray-500 mt-2 italic">
                        This detail is inactive and not included in totals.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmAction}
        title={`Confirm ${
          confirmAction === "complete" ? "Completion" : "Rejection"
        }`}
        message={
          confirmAction === "complete" ? (
            <span>
              Are you sure you want to{" "}
              <span className="text-green-600 font-semibold">complete</span> the
              selected drug order details? Once{" "}
              <span className="text-green-600 font-semibold">completed</span>,
              these details will be finalized, and stock will be updated in the
              inventory.
            </span>
          ) : (
            <span>
              Are you sure you want to{" "}
              <span className="text-red-600 font-semibold">reject</span> the
              selected drug order details? Once{" "}
              <span className="text-red-600 font-semibold">rejected</span>,
              these details will be marked inactive and removed from the order
              totals.
            </span>
          )
        }
        confirmText={confirmAction === "complete" ? "Complete" : "Reject"}
        cancelText="Cancel"
        confirmColor={confirmAction === "complete" ? "success" : "danger"}
      />
    </div>
  );
}
