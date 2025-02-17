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
  activateCanteenOrders,
  deactivateCanteenOrders,
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
} from "@heroui/react"; // Ensure @heroui/react is installed
import { CreateCanteenOrderForm } from "./CreateCanteenOrderForm"; // Your form component for creating an order
import CanteenOrderDetailsModal from "./CanteenOrderDetails"; // Your modal component for viewing details
import { EditCanteenOrderForm } from "./EditCanteenOrderForm"; // Your form component for editing an order
import ConfirmDeleteCanteenOrderModal from "./ConfirmDelete"; // Your delete confirmation modal
export function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
}
// Define columns
const columns = [
  { name: "License Plate", uid: "licensePlate", sortable: true },
  { name: "Order Date", uid: "orderDate", sortable: true },
  { name: "Created At", uid: "createdAt", sortable: true },
  { name: "Updated At", uid: "updatedAt", sortable: true },
  { name: "Status", uid: "status" },
  { name: "Actions", uid: "actions" },
];

const statusOptions = [
  { name: "Active", uid: "Active" },
  { name: "Inactive", uid: "Inactive" },
];

const statusColorMap: Record<string, ChipProps["color"]> = {
  Active: "success",
  Inactive: "danger",
};

const INITIAL_VISIBLE_COLUMNS = [
  "licensePlate",
  "orderDate",
  "createdAt",
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
  const [showActivate, setShowActivate] = useState(false);
  const [showDeactivate, setShowDeactivate] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    "activate" | "deactivate" | null
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
    column: "createdAt",
    direction: "ascending",
  });

  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState<CanteenOrderResponse[]>([]);

  const fetchOrders = async () => {
    try {
      const data = await getCanteenOrders();
      console.log("Dữ liệu đơn hàng:", data);
      if (Array.isArray(data)) {
        setOrders(data);
      } else {
        console.error("Dữ liệu không phải là một mảng", data);
      }
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu đơn hàng:", error);
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

    const hasActive = selected.some((order) => order.status === "Active");
    const hasInactive = selected.some((order) => order.status === "Inactive");

    setShowActivate(hasInactive);
    setShowDeactivate(hasActive);
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
      await fetchOrders();
      setSelectedKeys(new Set());
      setIsDeleteModalOpen(false);
      setDeletingOrder(null);
    } catch (error) {
      toast.error("Failed to delete order");
    }
  };

  const handleActivate = async () => {
    const ids = selectedOrders
      .filter((order) => order.status === "Inactive")
      .map((order) => order.id);
    if (ids.length === 0) return;

    try {
      await activateCanteenOrders(ids);
      toast.success("Orders activated successfully");
      fetchOrders();
      setSelectedKeys(new Set());
    } catch (error) {
      toast.error("Failed to activate orders");
    }
  };

  const handleDeactivate = async () => {
    const ids = selectedOrders
      .filter((order) => order.status === "Active")
      .map((order) => order.id);
    if (ids.length === 0) return;

    try {
      await deactivateCanteenOrders(ids);
      toast.success("Orders deactivated successfully");
      fetchOrders();
      setSelectedKeys(new Set());
    } catch (error) {
      toast.error("Failed to deactivate orders");
    }
  };

  const handleConfirmActivate = () => {
    setConfirmAction("activate");
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDeactivate = () => {
    setConfirmAction("deactivate");
    setIsConfirmModalOpen(true);
  };

  const handleConfirmAction = async () => {
    if (confirmAction === "activate") {
      await handleActivate();
    } else if (confirmAction === "deactivate") {
      await handleDeactivate();
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
        case "createdAt":
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
              {showActivate && (
                <Button color="success" onClick={handleConfirmActivate}>
                  Activate Selected
                </Button>
              )}
              {showDeactivate && (
                <Button color="danger" onClick={handleConfirmDeactivate}>
                  Deactivate Selected
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
        <ModalContent>
          <ModalHeader className="border-b pb-3">Confirm Action</ModalHeader>
          <ModalBody>
            Are you sure you want to{" "}
            {confirmAction === "activate" ? "activate" : "deactivate"} the
            selected orders?
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onClick={() => setIsConfirmModalOpen(false)}>
              Cancel
            </Button>
            <Button
              color={confirmAction === "activate" ? "success" : "danger"}
              onClick={handleConfirmAction}
            >
              Confirm
            </Button>
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
