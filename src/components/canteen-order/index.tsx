import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  PlusIcon,
  VerticalDotsIcon,
  SearchIcon,
  ChevronDownIcon,
  CanteenOrderIcon,
} from "./Icons";
import {
  getCanteenOrders,
  deleteCanteenOrder,
  CanteenOrderResponse,
  getCanteenOrderById,
  approveCanteenOrders,
  rejectCanteenOrders,
  completeCanteenOrders,
} from "@/api/canteenorder";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Button,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  DropdownItem,
  Chip,
  Pagination,
  Selection,
  ChipProps,
  SortDescriptor,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import { CreateCanteenOrderForm } from "./CreateCanteenOrderForm";
import CanteenOrderDetailsModal from "./CanteenOrderDetails";
import { EditCanteenOrderForm } from "./EditCanteenOrderForm";
import ConfirmDeleteCanteenOrderModal from "./ConfirmDelete";
export function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
}
// Define columns
const columns = [
  { name: "LICENSE PLATE", uid: "licensePlate", sortable: true },
  { name: "ORDER DATE", uid: "orderDate", sortable: true },
  { name: "CREATED BY", uid: "createdBy" },
  { name: "Updated At", uid: "updatedAt", sortable: true },
  { name: "STATUS", uid: "status" },
  { name: "ACTIONS", uid: "actions" },
];

const statusOptions = [
  { name: "Pending", uid: "Pending" },
  { name: "Approved", uid: "Approved" },
  { name: "Rejected", uid: "Rejected" },
  { name: "Completed", uid: "Completed" },
];

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

const INITIAL_VISIBLE_COLUMNS = [
  "licensePlate",
  "orderDate",
  "createdBy",
  "updatedAt",
  "status",
  "actions",
];

export function CanteenOrders() {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingOrder, setDeletingOrder] =
    useState<CanteenOrderResponse | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string>("");
  const [selectedOrder, setSelectedOrder] =
    useState<CanteenOrderResponse | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterValue, setFilterValue] = React.useState("");
  const [selectedOrders, setSelectedOrders] = useState<CanteenOrderResponse[]>(
    []
  );
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    "approve" | "reject" | "complete" | null
  >(null);

  const [selectedKeys, setSelectedKeys] = React.useState<Selection>(
    new Set([])
  );
  const [visibleColumns, setVisibleColumns] = React.useState<Selection>(
    new Set(INITIAL_VISIBLE_COLUMNS)
  );
  const [statusFilter, setStatusFilter] = React.useState<Selection>("all");

  const [rowsPerPage, setRowsPerPage] = React.useState(5);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "orderDate",
    direction: "descending",
  });

  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState<CanteenOrderResponse[]>([]);
  // Modify the fetchOrders function to sort by date
  const fetchOrders = async () => {
    try {
      const data = await getCanteenOrders();
      if (Array.isArray(data)) {
        // Sort the data by orderDate in descending order (newest first)
        const sortedData = data.sort((a, b) => {
          return (
            new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
          );
        });
        setOrders(sortedData);
        setPage(1);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    let selected: CanteenOrderResponse[] = [];

    if (selectedKeys === "all") {
      selected = orders;
    } else {
      selected = orders.filter((order) =>
        (selectedKeys as Set<string>).has(order.id)
      );
    }

    setSelectedOrders(selected);
    const hasPendingOrRejected = selected.some(
      (canteenOrder) =>
        canteenOrder.status === "Pending" || canteenOrder.status === "Rejected"
    );
    const hasPendingOrApproved = selected.some(
      (canteenOrder) =>
        canteenOrder.status === "Pending" || canteenOrder.status === "Approved"
    );
    const hasApproved = selected.some(
      (canteenOrder) => canteenOrder.status === "Approved"
    );

    setShowApprove(hasPendingOrRejected);
    setShowReject(hasPendingOrApproved);
    setShowComplete(hasApproved);
  }, [selectedKeys, orders]);

  const headerColumns = React.useMemo(() => {
    if (visibleColumns === "all") return columns;

    return columns.filter((column) =>
      Array.from(visibleColumns).includes(column.uid)
    );
  }, [visibleColumns]);

  const filteredItems = React.useMemo(() => {
    let filteredOrders = [...orders];

    if (filterValue) {
      filteredOrders = filteredOrders.filter((order) =>
        order.truck?.licensePlate
          .toLowerCase()
          .includes(filterValue.toLowerCase())
      );
    }

    if (
      statusFilter !== "all" &&
      statusFilter instanceof Set &&
      statusFilter.size > 0
    ) {
      filteredOrders = filteredOrders.filter(
        (order) => order.status !== undefined && statusFilter.has(order.status)
      );
    }

    return filteredOrders;
  }, [orders, filterValue, statusFilter]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage);

  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  const sortedItems = React.useMemo(() => {
    return [...items].sort(
      (a: CanteenOrderResponse, b: CanteenOrderResponse) => {
        const getValue = (item: CanteenOrderResponse, column: string) => {
          if (column === "licensePlate") return item.truck?.licensePlate || "";
          return item[column as keyof CanteenOrderResponse];
        };

        const first = a[sortDescriptor.column as keyof CanteenOrderResponse];
        const second = b[sortDescriptor.column as keyof CanteenOrderResponse];

        let cmp = 0;
        if (typeof first === "string" && typeof second === "string") {
          cmp = first.localeCompare(second);
        }

        return sortDescriptor.direction === "descending" ? -cmp : cmp;
      }
    );
  }, [sortDescriptor, items]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const handleOpenDetails = async (id: string) => {
    try {
      const order = await getCanteenOrderById(id);
      setSelectedOrder(order);
      setIsDetailsModalOpen(true);
    } catch (error) {
      toast.error("Failed to load order details");
    }
  };

  const handleOpenEditModal = (id: string) => {
    setEditingOrderId(id);
    setIsEditModalOpen(true);
  };

  const handleUpdateSuccess = () => {
    fetchOrders();
    setIsEditModalOpen(false);
    setEditingOrderId("");
  };

  const handleOpenDeleteModal = async (id: string) => {
    try {
      const order = await getCanteenOrderById(id);
      setDeletingOrder(order);
      setIsDeleteModalOpen(true);
    } catch (error) {
      toast.error("Failed to load order details for deletion");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingOrder) return;
    try {
      await deleteCanteenOrder(deletingOrder.id);
      toast.success("Order deleted successfully");

      // Cập nhật danh sách trên FE
      setOrders((prevOrders) =>
        prevOrders.filter((order) => order.id !== deletingOrder.id)
      );

      setSelectedKeys(new Set());
      setIsDeleteModalOpen(false);
      setDeletingOrder(null);
    } catch (error) {
      toast.error("Failed to delete order");
    }
  };

  const handleApprove = async () => {
    const ids = selectedOrders
      .filter((d) => d.status === "Pending" || d.status === "Rejected")
      .map((d) => d.id);
    if (ids.length === 0) {
      toast.error("No valid drug orders found for approval.");
      return;
    }

    try {
      await approveCanteenOrders(ids);
      toast.success("Drug Orders approved successfully");
      fetchOrders();
      setSelectedKeys(new Set());
    } catch (error) {
      toast.error("Failed to approve drug orders");
    }
  };
  const handleReject = async () => {
    const ids = selectedOrders
      .filter((d) => d.status === "Pending" || d.status === "Approved")
      .map((d) => d.id);
    if (ids.length === 0) {
      toast.error("No valid drug orders found for rejection.");
      return;
    }

    try {
      await rejectCanteenOrders(ids);
      toast.success("Drug orders rejected successfully");
      fetchOrders();
      setSelectedKeys(new Set());
    } catch (error) {
      toast.error("Failed to reject drug orders");
    }
  };
  const handleComplete = async () => {
    const ids = selectedOrders
      .filter((d) => d.status === "Approved")
      .map((d) => d.id);
    if (ids.length === 0) {
      toast.error("No valid drug orders found for completion.");
      return;
    }

    try {
      await completeCanteenOrders(ids);
      toast.success("Drug orders completed successfully");
      fetchOrders();
      setSelectedKeys(new Set());
    } catch (error) {
      toast.error("Failed to complete drug orders");
    }
  };

  const handleConfirmAction = async () => {
    if (confirmAction === "approve") {
      await handleApprove();
    } else if (confirmAction === "reject") {
      await handleReject();
    } else if (confirmAction === "complete") {
      await handleComplete();
    }
    setIsConfirmModalOpen(false);
    setConfirmAction(null);
  };

  const renderCell = React.useCallback(
    (order: CanteenOrderResponse, columnKey: React.Key) => {
      const cellValue = order[columnKey as keyof CanteenOrderResponse];

      switch (columnKey) {
        case "licensePlate":
          return (
            <p
              className="text-bold text-small capitalize text-primary cursor-pointer hover:underline"
              onClick={() => handleOpenDetails(order.id)}
            >
              {order.truck?.licensePlate || "Not Available"}
            </p>
          );
        case "status":
          return (
            <Chip
              className="capitalize"
              color={
                statusColorMap[order.status as keyof typeof statusColorMap]
              }
              size="sm"
              variant="flat"
            >
              {cellValue as string}
            </Chip>
          );
        case "totalQuantity":
          return (
            <div className="flex justify-start gap-2">
              <p className="text-bold text-small">
                {order.canteenOrderDetails.reduce(
                  (sum, detail) => sum + detail.quantity,
                  0
                )}
              </p>
            </div>
          );

        case "createdBy":
          return cellValue && typeof cellValue === "object" ? (
            <div className="flex flex-col gap-1">
              {/* <span className="text-bold text-small text-primary cursor-pointer hover:underline"> */}
              <span className="text-bold text-small">
                {(cellValue as { userName: string }).userName}
              </span>
              <Chip
                className="capitalize"
                color={
                  roleColorMap[
                    (cellValue as { role: string })
                      .role as keyof typeof roleColorMap
                  ]
                }
                size="sm"
                variant="flat"
              >
                {(cellValue as { role: string }).role}
              </Chip>
            </div>
          ) : (
            "-"
          );
        case "updatedAt":
          return cellValue ? formatDate(cellValue as string) : "-";
        case "actions":
          return (
            <div className="relative flex justify-center">
              <Dropdown>
                <DropdownTrigger>
                  <Button isIconOnly size="sm" variant="light">
                    <VerticalDotsIcon className="text-default-300" />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu>
                  <DropdownItem
                    key="edit"
                    onClick={() => handleOpenEditModal(order.id)}
                  >
                    Edit
                  </DropdownItem>
                  <DropdownItem
                    key="delete"
                    className="text-danger"
                    onClick={() => handleOpenDeleteModal(order.id)}
                  >
                    Delete
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          );
        default:
          return typeof cellValue === "object"
            ? JSON.stringify(cellValue)
            : cellValue;
      }
    },
    []
  );

  const onNextPage = React.useCallback(() => {
    if (page < pages) {
      setPage(page + 1);
    }
  }, [page, pages]);

  const onPreviousPage = React.useCallback(() => {
    if (page > 1) {
      setPage(page - 1);
    }
  }, [page]);

  const onRowsPerPageChange = React.useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setRowsPerPage(Number(e.target.value));
      setPage(1);
    },
    []
  );

  const onSearchChange = React.useCallback((value?: string) => {
    if (value) {
      setFilterValue(value);
      setPage(1);
    } else {
      setFilterValue("");
    }
  }, []);

  const onClear = React.useCallback(() => {
    setFilterValue("");
    setPage(1);
  }, []);

  const topContent = React.useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between gap-3 items-end ml-4">
          <Input
            isClearable
            className="w-full sm:max-w-[44%]"
            placeholder="Search by license plate..."
            startContent={<SearchIcon />}
            value={filterValue}
            onClear={() => onClear()}
            onValueChange={onSearchChange}
          />
          <div className="flex gap-3">
            <div className="flex gap-2">
              {showApprove && (
                <Button
                  color="primary"
                  onClick={() => {
                    setConfirmAction("approve");
                    setIsConfirmModalOpen(true);
                  }}
                >
                  Approve Selected
                </Button>
              )}
              {showReject && (
                <Button
                  color="danger"
                  onClick={() => {
                    setConfirmAction("reject");
                    setIsConfirmModalOpen(true);
                  }}
                >
                  Reject Selected
                </Button>
              )}
              {showComplete && (
                <Button
                  color="success"
                  onClick={() => {
                    setConfirmAction("complete");
                    setIsConfirmModalOpen(true);
                  }}
                >
                  Complete Selected
                </Button>
              )}
            </div>

            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button
                  endContent={<ChevronDownIcon className="text-small" />}
                  variant="flat"
                >
                  Status
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Table Columns"
                closeOnSelect={false}
                selectedKeys={statusFilter}
                selectionMode="multiple"
                onSelectionChange={setStatusFilter}
              >
                {statusOptions.map((status) => (
                  <DropdownItem key={status.uid} className="capitalize">
                    {capitalize(status.name)}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>

            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button
                  endContent={<ChevronDownIcon className="text-small" />}
                  variant="flat"
                >
                  Columns
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Table Columns"
                closeOnSelect={false}
                selectedKeys={visibleColumns}
                selectionMode="multiple"
                onSelectionChange={setVisibleColumns}
              >
                {columns.map((column) => (
                  <DropdownItem key={column.uid} className="capitalize">
                    {capitalize(column.name)}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
            <Button
              color="primary"
              endContent={<PlusIcon />}
              onClick={() => setIsModalOpen(true)}
            >
              Add New
            </Button>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-default-400 text-small ml-4">
            Total {orders.length} orders
          </span>
          <label className="flex items-center text-default-400 text-small">
            Rows per page:
            <select
              className="bg-transparent outline-none text-default-400 text-small"
              onChange={onRowsPerPageChange}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
            </select>
          </label>
        </div>
      </div>
    );
  }, [
    selectedOrders,
    filterValue,
    statusFilter,
    visibleColumns,
    selectedKeys,
    onSearchChange,
    onRowsPerPageChange,
    orders.length,
  ]);

  const bottomContent = React.useMemo(() => {
    return (
      <div className="py-2 px-2 flex justify-between items-center">
        <span className="w-[30%] text-small text-default-400 ml-4">
          {selectedKeys === "all"
            ? "All items selected"
            : `${(selectedKeys as Set<string>).size} of ${
                filteredItems.length
              } selected`}
        </span>
        <Pagination
          isCompact
          showControls
          showShadow
          color="primary"
          page={page}
          total={pages}
          onChange={setPage}
        />
        <div className="hidden sm:flex w-[30%] justify-end gap-2">
          <Button
            isDisabled={pages === 1}
            size="sm"
            variant="flat"
            onPress={onPreviousPage}
          >
            Previous
          </Button>
          <Button
            isDisabled={pages === 1}
            size="sm"
            variant="flat"
            onPress={onNextPage}
          >
            Next
          </Button>
        </div>
      </div>
    );
  }, [selectedKeys, items.length, page, pages]);

  return (
    <>
      <div className="flex items-center gap-2 mb-4 ml-4">
        <CanteenOrderIcon />
        <h3 className="text-2xl font-bold">Canteen Order Management</h3>
      </div>

      {isModalOpen && (
        <Modal isOpen={isModalOpen} onOpenChange={setIsModalOpen}>
          <ModalContent className="max-w-[800px]">
            <ModalHeader className="border-b pb-3">Add New Order</ModalHeader>
            <ModalBody>
              <CreateCanteenOrderForm
                onClose={() => {
                  setIsModalOpen(false);
                }}
                onCreate={fetchOrders}
              />
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      <CanteenOrderDetailsModal
        order={selectedOrder}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
      />

      {isEditModalOpen && (
        <Modal isOpen={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <ModalContent className="max-w-[800px]">
            <ModalHeader className="border-b pb-3">Edit Order</ModalHeader>
            <ModalBody>
              <EditCanteenOrderForm
                orderId={editingOrderId}
                onClose={() => setIsEditModalOpen(false)}
                onUpdate={handleUpdateSuccess}
              />
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      <ConfirmDeleteCanteenOrderModal
        order={deletingOrder}
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirmDelete={handleConfirmDelete}
      />

      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
      >
        <ModalContent className="max-w-[500px]">
          <ModalHeader className="border-b pb-3">Confirm Action</ModalHeader>
          <ModalBody>
            <p className="text-gray-700 mb-2">
              Please review your action carefully before proceeding.
            </p>
            <p className="text-gray-600 text-sm">
              Are you sure you want to{" "}
              {confirmAction === "approve"
                ? "approve"
                : confirmAction === "reject"
                ? "reject"
                : confirmAction === "complete"
                ? "complete"
                : "perform this action on"}{" "}
              the selected drug orders?
            </p>
          </ModalBody>
          <ModalFooter className="border-t pt-4">
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="flat"
                onClick={() => setIsConfirmModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                color={
                  confirmAction === "approve"
                    ? "primary"
                    : confirmAction === "reject"
                    ? "danger"
                    : confirmAction === "complete"
                    ? "success"
                    : "default"
                }
                onClick={handleConfirmAction}
              >
                Confirm
              </Button>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Table
        isHeaderSticky
        aria-label="Orders table"
        bottomContent={bottomContent}
        bottomContentPlacement="outside"
        classNames={{
          wrapper: "max-h-[382px] ml-2",
        }}
        selectedKeys={selectedKeys}
        selectionMode="multiple"
        sortDescriptor={sortDescriptor}
        topContent={topContent}
        topContentPlacement="outside"
        onSelectionChange={setSelectedKeys}
        onSortChange={setSortDescriptor}
      >
        <TableHeader columns={headerColumns}>
          {(column) => (
            <TableColumn
              key={column.uid}
              align={column.uid === "actions" ? "center" : "start"}
              allowsSorting={column.sortable}
            >
              {column.name}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody emptyContent={"No orders found"} items={sortedItems}>
          {(item) => (
            <TableRow key={item.id}>
              {(columnKey) => (
                <TableCell>{renderCell(item, columnKey)}</TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </>
  );
}
