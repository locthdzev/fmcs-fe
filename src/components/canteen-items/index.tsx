import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  PlusIcon,
  VerticalDotsIcon,
  SearchIcon,
  ChevronDownIcon,
  CanteenItemIcon,
} from "./Icons";
import {
  getAllCanteenItems,
  CanteenItemResponse,
  activateCanteenItems,
  deactivateCanteenItems,
} from "@/api/canteenitems";
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
import { CreateCanteenItemForm } from "./CreateCanteenItemForm";
import { EditCanteenItemForm } from "./EditCanteenItemForm";

export function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
}

const columns = [
  { name: "ITEM NAME", uid: "itemName", sortable: true },
  { name: "DESCRIPTION", uid: "description" },
  { name: "UNIT PRICE", uid: "unitPrice", sortable: true },
  { name: "AVAILABLE", uid: "available", sortable: true },
  { name: "CREATED AT", uid: "createdAt", sortable: true },
  { name: "UPDATED AT", uid: "updatedAt", sortable: true },
  { name: "STATUS", uid: "status" },
  { name: "ACTIONS", uid: "actions" },
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
  "itemName",
  "description",
  "unitPrice",
  "available",
  "createdAt",
  "status",
  "actions",
];

export function CanteenItems() {
  const [editingCanteenItemId, setEditingCanteenItemId] = useState<string>("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterValue, setFilterValue] = React.useState("");
  const [selectedCanteenItems, setSelectedCanteenItems] = useState<
    CanteenItemResponse[]
  >([]);
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
  const [sortDescriptor, setSortDescriptor] = React.useState<SortDescriptor>({
    column: "createdAt",
    direction: "ascending",
  });

  const [page, setPage] = React.useState(1);
  const [canteenItems, setCanteenItems] = React.useState<CanteenItemResponse[]>([]);

  const fetchCanteenItems = async () => {
    const data = await getAllCanteenItems();
    setCanteenItems(data);
  };

  useEffect(() => {
    fetchCanteenItems();
  }, []);

  useEffect(() => {
    let selected: CanteenItemResponse[] = [];

    if (selectedKeys === "all") {
      selected = canteenItems;
    } else {
      selected = canteenItems.filter((canteenItem) =>
        (selectedKeys as Set<string>).has(canteenItem.id)
      );
    }

    setSelectedCanteenItems(selected);

    const hasActive = selected.some(
      (canteenItem) => canteenItem.status === "Active"
    );
    const hasInactive = selected.some(
      (canteenItem) => canteenItem.status === "Inactive"
    );

    setShowActivate(hasInactive);
    setShowDeactivate(hasActive);
  }, [selectedKeys, canteenItems]);

  const hasSearchFilter = Boolean(filterValue);

  const headerColumns = React.useMemo(() => {
    if (visibleColumns === "all") return columns;

    return columns.filter((column) =>
      Array.from(visibleColumns).includes(column.uid)
    );
  }, [visibleColumns]);

  const filteredItems = React.useMemo(() => {
    let filteredCanteenItems = [...canteenItems];

    if (hasSearchFilter) {
      filteredCanteenItems = filteredCanteenItems.filter((item) =>
        item.itemName.toLowerCase().includes(filterValue.toLowerCase())
      );
    }
    if (
      statusFilter !== "all" &&
      Array.from(statusFilter).length !== statusOptions.length
    ) {
      filteredCanteenItems = filteredCanteenItems.filter(
        (item) =>
          item.status !== undefined &&
          Array.from(statusFilter).includes(item.status)
      );
    }

    return filteredCanteenItems;
  }, [canteenItems, filterValue, statusFilter]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage);

  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  const sortedItems = React.useMemo(() => {
    return [...items].sort((a: CanteenItemResponse, b: CanteenItemResponse) => {
      const first = a[sortDescriptor.column as keyof CanteenItemResponse];
      const second = b[sortDescriptor.column as keyof CanteenItemResponse];

      let cmp = 0;
      if (typeof first === "string" && typeof second === "string") {
        cmp = first.localeCompare(second);
      }

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, items]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const handleOpenEditModal = (id: string) => {
    setEditingCanteenItemId(id);
    setIsEditModalOpen(true);
  };

  const handleUpdateSuccess = () => {
    fetchCanteenItems();
    setIsEditModalOpen(false);
    setEditingCanteenItemId("");
  };

  const handleActivate = async () => {
    const ids = selectedCanteenItems
      .filter((d) => d.status === "Inactive")
      .map((d) => d.id);
    if (ids.length === 0) return;

    try {
      await activateCanteenItems(ids);
      toast.success("Canteen Items activated successfully");
      fetchCanteenItems();
      setSelectedKeys(new Set());
    } catch (error) {
      toast.error("Failed to activate canteen items");
    }
  };

  const handleDeactivate = async () => {
    const ids = selectedCanteenItems
      .filter((d) => d.status === "Active")
      .map((d) => d.id);
    if (ids.length === 0) return;

    try {
      await deactivateCanteenItems(ids);
      toast.success("Canteen items deactivated successfully");
      fetchCanteenItems();
      setSelectedKeys(new Set());
    } catch (error) {
      toast.error("Failed to deactivate canteen items");
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
    (canteenItem: CanteenItemResponse, columnKey: React.Key) => {
      const cellValue = canteenItem[columnKey as keyof CanteenItemResponse];

      switch (columnKey) {
        case "itemName":
          return (
            <div className="flex flex-col">
              <p className="text-bold text-small capitalize text-primary">
                {cellValue as string}
              </p>
            </div>
          );
        case "status":
          return (
            <Chip
              className="capitalize"
              color={
                statusColorMap[canteenItem.status as keyof typeof statusColorMap]
              }
              size="sm"
              variant="flat"
            >
              {cellValue as string}
            </Chip>
          );
        case "createdAt":
          return cellValue ? formatDate(cellValue as string) : "-";
        case "available":
          return cellValue ? "Yes" : "No"; // Vì cellValue đã là boolean, không cần toLowerCase()
        case "updatedAt":
          return cellValue ? formatDate(cellValue as string) : "-";
        case "actions":
          return (
            <div className="relative flex justify-end items-center gap-2">
              <Dropdown>
                <DropdownTrigger>
                  <Button isIconOnly size="sm" variant="light">
                    <VerticalDotsIcon className="text-default-300" />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu>
                  <DropdownItem
                    key="edit"
                    onClick={() => handleOpenEditModal(canteenItem.id)}
                  >
                    Edit
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          );
        default:
          return cellValue;
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
            placeholder="Search by item name..."
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
            Total {canteenItems.length} canteen items
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
    selectedCanteenItems,
    filterValue,
    statusFilter,
    visibleColumns,
    selectedKeys,
    onSearchChange,
    onRowsPerPageChange,
    canteenItems.length,
  ]);

  const bottomContent = React.useMemo(() => {
    return (
      <div className="py-2 px-2 flex justify-between items-center">
        <span className="w-[30%] text-small text-default-400 ml-4">
          {selectedKeys === "all"
            ? "All items selected"
            : `${(selectedKeys as Set<string>).size} of ${filteredItems.length
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
  }, [selectedKeys, items.length, page, pages, hasSearchFilter]);

  return (
    <>
      <div className="flex items-center gap-2 mb-4 ml-4">
        <CanteenItemIcon />
        <h3 className="text-2xl font-bold">Canteen Items Management</h3>
      </div>

      {isModalOpen && (
        <Modal isOpen={isModalOpen} onOpenChange={setIsModalOpen}>
          <ModalContent className="max-w-[500px]">
            <ModalHeader>Add New Canteen Item</ModalHeader>
            <ModalBody>
              <CreateCanteenItemForm
                onClose={() => {
                  setIsModalOpen(false);
                }}
                onCreate={fetchCanteenItems}
              />
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      {isEditModalOpen && (
        <Modal isOpen={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <ModalContent className="max-w-[500px]">
            <ModalHeader>Edit Item</ModalHeader>
            <ModalBody>
              <EditCanteenItemForm
                canteenItemId={editingCanteenItemId}
                onClose={() => setIsEditModalOpen(false)}
                onUpdate={handleUpdateSuccess}
              />
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
      >
        <ModalContent>
          <ModalHeader>Confirm Action</ModalHeader>
          <ModalBody>
            Are you sure you want to{" "}
            {confirmAction === "activate" ? "activate" : "deactivate"} the
            selected drugs?
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
        aria-label="Drug groups table"
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
        <TableBody emptyContent={"No drug groups found"} items={sortedItems}>
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
