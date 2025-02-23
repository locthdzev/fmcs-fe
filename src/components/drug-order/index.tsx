import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  PlusIcon,
  VerticalDotsIcon,
  SearchIcon,
  ChevronDownIcon,
  DrugOrderIcon,
} from "./Icons";
import {
  getDrugOrders,
  DrugOrderResponse,
  approveDrugOrders,
  rejectDrugOrders,
  completeDrugOrders,
} from "@/api/drugorder";
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
import { CreateDrugOrderForm } from "./CreateForm";
import { EditDrugOrderForm } from "./EditForm";
import { useRouter } from "next/router";
import { DrugSupplierResponse, getDrugSupplierById } from "@/api/drugsupplier";
import DrugSupplierDetailsModal from "../drug-supplier/Details";

export function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
}

const columns = [
  { name: "ORDER CODE", uid: "drugOrderCode", sortable: true },
  { name: "SUPPLIER", uid: "supplier", sortable: true },
  { name: "ORDER DATE", uid: "orderDate", sortable: true },
  { name: "TOTAL QUANTITY", uid: "totalQuantity", sortable: true },
  { name: "TOTAL PRICE", uid: "totalPrice", sortable: true },
  { name: "CREATED BY", uid: "createdBy" },
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
  "drugOrderCode",
  "supplier",
  "orderDate",
  "totalQuantity",
  "totalPrice",
  "createdBy",
  "status",
  "actions",
];

export function DrugOrders() {
  const [selectedSupplier, setSelectedSupplier] =
    useState<DrugSupplierResponse | null>(null);
  const [isSupplierDetailsModalOpen, setIsSupplierDetailsModalOpen] =
    useState(false);
  const [editingDrugOrderId, setEditingDrugOrderId] = useState<string>("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filterValue, setFilterValue] = React.useState("");
  const [selectedDrugOrders, setSelectedDrugOrders] = useState<
    DrugOrderResponse[]
  >([]);
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
  const [sortDescriptor, setSortDescriptor] = React.useState<SortDescriptor>({
    column: "createdAt",
    direction: "descending",
  });

  const [page, setPage] = React.useState(1);
  const [drugOrders, setDrugOrders] = React.useState<DrugOrderResponse[]>([]);

  const fetchDrugOrders = async () => {
    const data = await getDrugOrders();
    const sortedData = data.sort(
      (a: DrugOrderResponse, b: DrugOrderResponse) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    setDrugOrders(sortedData);
  };

  useEffect(() => {
    fetchDrugOrders();
  }, []);

  useEffect(() => {
    setPage(1); // Reset trang về 1 khi filter thay đổi
  }, [statusFilter, filterValue]);

  useEffect(() => {
    let selected: DrugOrderResponse[] = [];

    if (selectedKeys === "all") {
      selected = drugOrders;
    } else {
      selected = drugOrders.filter((drugOrder) =>
        (selectedKeys as Set<string>).has(drugOrder.id)
      );
    }

    setSelectedDrugOrders(selected);

    const hasPendingOrRejected = selected.some(
      (drugOrder) =>
        drugOrder.status === "Pending" || drugOrder.status === "Rejected"
    );
    const hasPendingOrApproved = selected.some(
      (drugOrder) =>
        drugOrder.status === "Pending" || drugOrder.status === "Approved"
    );
    const hasApproved = selected.some(
      (drugOrder) => drugOrder.status === "Approved"
    );

    setShowApprove(hasPendingOrRejected);
    setShowReject(hasPendingOrApproved);
    setShowComplete(hasApproved);
  }, [selectedKeys, drugOrders]);

  const hasSearchFilter = Boolean(filterValue);

  const headerColumns = React.useMemo(() => {
    if (visibleColumns === "all") return columns;

    return columns.filter((column) =>
      Array.from(visibleColumns).includes(column.uid)
    );
  }, [visibleColumns]);

  const filteredItems = React.useMemo(() => {
    let filteredOrders = [...drugOrders];

    if (hasSearchFilter) {
      filteredOrders = filteredOrders.filter((order) =>
        order.drugOrderCode.toLowerCase().includes(filterValue.toLowerCase())
      );
    }
    if (
      statusFilter !== "all" &&
      Array.from(statusFilter).length !== statusOptions.length
    ) {
      filteredOrders = filteredOrders.filter(
        (order) =>
          order.status !== undefined &&
          Array.from(statusFilter).includes(order.status)
      );
    }

    return filteredOrders;
  }, [drugOrders, filterValue, statusFilter]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage);

  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  const sortedItems = React.useMemo(() => {
    return [...filteredItems]
      .sort((a: DrugOrderResponse, b: DrugOrderResponse) => {
        const first = a[sortDescriptor.column as keyof DrugOrderResponse];
        const second = b[sortDescriptor.column as keyof DrugOrderResponse];

        let cmp = 0;
        if (sortDescriptor.column === "supplier") {
          cmp = (first as { supplierName: string }).supplierName.localeCompare(
            (second as { supplierName: string }).supplierName
          );
        } else if (typeof first === "number" && typeof second === "number") {
          cmp = first - second;
        } else if (typeof first === "string" && typeof second === "string") {
          cmp = first.localeCompare(second);
        }

        return sortDescriptor.direction === "descending" ? -cmp : cmp;
      })
      .slice((page - 1) * rowsPerPage, page * rowsPerPage);
  }, [sortDescriptor, filteredItems, page, rowsPerPage]);

  const handleOpenDetails = async (id: string) => {
    try {
      const supplier = await getDrugSupplierById(id);
      setSelectedSupplier(supplier); // Đúng hơn là set dữ liệu supplier
      setIsSupplierDetailsModalOpen(true);
    } catch (error) {
      toast.error("Failed to load drug details");
    }
  };

  const handleOpenEditModal = (id: string) => {
    setEditingDrugOrderId(id);
    setIsEditModalOpen(true);
  };

  const handleCreateSuccess = () => {
    fetchDrugOrders();
    setIsCreateModalOpen(false);
    setSelectedKeys(new Set()); // Reset selected items
  };

  useEffect(() => {
    setSelectedKeys(new Set());
  }, [drugOrders]);

  const handleUpdateSuccess = () => {
    fetchDrugOrders();
    setIsEditModalOpen(false);
    setEditingDrugOrderId("");
  };

  const handleApprove = async () => {
    const ids = selectedDrugOrders
      .filter((d) => d.status === "Pending" || d.status === "Rejected")
      .map((d) => d.id);
    if (ids.length === 0) {
      toast.error("No valid drug orders found for approval.");
      return;
    }

    try {
      await approveDrugOrders(ids);
      toast.success("Drug Orders approved successfully");
      fetchDrugOrders();
      setSelectedKeys(new Set());
    } catch (error) {
      toast.error("Failed to approve drug orders");
    }
  };

  const handleReject = async () => {
    const ids = selectedDrugOrders
      .filter((d) => d.status === "Pending" || d.status === "Approved")
      .map((d) => d.id);
    if (ids.length === 0) {
      toast.error("No valid drug orders found for rejection.");
      return;
    }

    try {
      await rejectDrugOrders(ids);
      toast.success("Drug orders rejected successfully");
      fetchDrugOrders();
      setSelectedKeys(new Set());
    } catch (error) {
      toast.error("Failed to reject drug orders");
    }
  };

  const handleComplete = async () => {
    const ids = selectedDrugOrders
      .filter((d) => d.status === "Approved")
      .map((d) => d.id);
    if (ids.length === 0) {
      toast.error("No valid drug orders found for completion.");
      return;
    }

    try {
      await completeDrugOrders(ids);
      toast.success("Drug orders completed successfully");
      fetchDrugOrders();
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

  const router = useRouter();

  useEffect(() => {
    const queryPage = Number(router.query.page) || 1;
    setPage(queryPage);
  }, [router.query.page]);

  const updatePageInUrl = (newPage: number) => {
    router.push(
      {
        pathname: router.pathname,
        query: { ...router.query, page: newPage },
      },
      undefined,
      { shallow: true }
    );
  };

  const onPageChange = (newPage: number) => {
    setPage(newPage);
    updatePageInUrl(newPage);
  };

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

  const renderCell = React.useCallback(
    (drugOrder: DrugOrderResponse, columnKey: React.Key) => {
      const cellValue = drugOrder[columnKey as keyof DrugOrderResponse];
      switch (columnKey) {
        case "drugOrderCode":
          return (
            <div
              className="text-bold text-small text-primary cursor-pointer hover:underline"
              onClick={() =>
                router.push(`/drug-order/details?id=${drugOrder.id}`)
              }
            >
              {cellValue as string}
            </div>
          );
        case "supplier":
          return cellValue && typeof cellValue === "object" ? (
            <div
              className="text-bold text-small capitalize text-primary cursor-pointer hover:underline"
              onClick={() => handleOpenDetails(drugOrder.supplier.id)}
            >
              {(cellValue as { supplierName: string }).supplierName}
            </div>
          ) : (
            "-"
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
        case "status":
          return (
            <Chip
              className="capitalize"
              color={
                statusColorMap[drugOrder.status as keyof typeof statusColorMap]
              }
              size="sm"
              variant="flat"
            >
              {cellValue as string}
            </Chip>
          );
        case "totalPrice":
          return formatPrice(cellValue as number);
        case "orderDate":
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
                    onClick={() => handleOpenEditModal(drugOrder.id)}
                    isDisabled={drugOrder.status === "Completed"}
                  >
                    Edit
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
            placeholder="Search by order code..."
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
                radius="sm"
                variant="bordered"
                className="bg-danger-100 text-danger-600"
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
                radius="sm"
                variant="bordered"
                className="bg-success-100 text-success-600"
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
                  radius="sm"
                  endContent={<ChevronDownIcon className="text-small" />}
                  variant="bordered"
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
                  radius="sm"
                  endContent={<ChevronDownIcon className="text-small" />}
                  variant="bordered"
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
              onClick={() => setIsCreateModalOpen(true)}
            >
              Add New
            </Button>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-default-400 text-small ml-4">
            Total {drugOrders.length} drug orders
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
    filterValue,
    statusFilter,
    visibleColumns,
    onSearchChange,
    onRowsPerPageChange,
    drugOrders.length,
    showApprove,
    showReject,
    showComplete,
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
          onChange={onPageChange}
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
  }, [selectedKeys, items.length, page, pages, hasSearchFilter]);

  return (
    <>
      <div className="flex items-center gap-2 mb-4 ml-4">
        <DrugOrderIcon />
        <h3 className="text-2xl font-bold">Drug Order Management</h3>
      </div>

      <CreateDrugOrderForm
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={() => handleCreateSuccess()}
      />

      <EditDrugOrderForm
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onEdit={handleUpdateSuccess}
        orderId={editingDrugOrderId}
      />

      <Modal
        isOpen={isConfirmModalOpen}
        onOpenChange={(open) => !open && setIsConfirmModalOpen(false)}
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

      <DrugSupplierDetailsModal
        supplier={selectedSupplier}
        isOpen={isSupplierDetailsModalOpen}
        onClose={() => setIsSupplierDetailsModalOpen(false)}
      />

      <Table
        isHeaderSticky
        aria-label="Drug orders table"
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
        <TableBody emptyContent={"No drug orders found"} items={sortedItems}>
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
