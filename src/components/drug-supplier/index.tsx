import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  PlusIcon,
  VerticalDotsIcon,
  SearchIcon,
  ChevronDownIcon,
  DrugSupplierIcon,
} from "./Icons";
import {
  getDrugSuppliers,
  DrugSupplierResponse,
  activateDrugSuppliers,
  deactivateDrugSuppliers,
  getDrugSupplierById,
} from "@/api/drugsupplier";
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
import { CreateDrugSupplierForm } from "./CreateForm";
import { EditDrugSupplierForm } from "./EditForm";
import { useRouter } from "next/router";
import DrugSupplierDetailsModal from "./Details";

export function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
}

const columns = [
  { name: "SUPPLIER NAME", uid: "supplierName", sortable: true },
  { name: "CONTACT NUMBER", uid: "contactNumber" },
  { name: "EMAIL", uid: "email" },
  { name: "ADDRESS", uid: "address" },
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
  "supplierName",
  "contactNumber",
  "email",
  "status",
  "actions",
];

export function DrugSuppliers() {
  const [selectedSupplier, setSelectedSupplier] =
    useState<DrugSupplierResponse | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [editingSupplierId, setEditingSupplierId] = useState<string>("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterValue, setFilterValue] = useState("");
  const [selectedSuppliers, setSelectedSuppliers] = useState<
    DrugSupplierResponse[]
  >([]);
  const [showActivate, setShowActivate] = useState(false);
  const [showDeactivate, setShowDeactivate] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    "activate" | "deactivate" | null
  >(null);
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
  const [visibleColumns, setVisibleColumns] = useState<Selection>(
    new Set(INITIAL_VISIBLE_COLUMNS)
  );
  const [statusFilter, setStatusFilter] = useState<Selection>("all");
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "createdAt",
    direction: "descending",
  });
  const [isReady, setIsReady] = useState(false);
  const [page, setPage] = useState(1);
  const [suppliers, setSuppliers] = useState<DrugSupplierResponse[]>([]);

  const fetchDrugSuppliers = async () => {
    const data = await getDrugSuppliers();
    const sortedData = data.sort(
      (a: DrugSupplierResponse, b: DrugSupplierResponse) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    setSuppliers(sortedData);
    setIsReady(true);
  };

  useEffect(() => {
    fetchDrugSuppliers();
  }, []);

  useEffect(() => {
    setPage(1); // Reset trang về 1 khi filter thay đổi
  }, [statusFilter, filterValue]);

  useEffect(() => {
    let selected: DrugSupplierResponse[] = [];
    if (selectedKeys === "all") {
      selected = suppliers; // If "all" is selected, get all suppliers
    } else {
      selected = suppliers.filter((supplier) =>
        (selectedKeys as Set<string>).has(supplier.id)
      );
    }

    setSelectedSuppliers(selected);
    const hasActive = selected.some((supplier) => supplier.status === "Active");
    const hasInactive = selected.some(
      (supplier) => supplier.status === "Inactive"
    );

    setShowActivate(hasInactive);
    setShowDeactivate(hasActive);
  }, [selectedKeys, suppliers]);

  const hasSearchFilter = Boolean(filterValue);

  const headerColumns = React.useMemo(() => {
    if (visibleColumns === "all") return columns;
    return columns.filter((column) =>
      Array.from(visibleColumns).includes(column.uid)
    );
  }, [visibleColumns]);

  const filteredItems = React.useMemo(() => {
    let filteredSuppliers = [...suppliers];

    if (hasSearchFilter) {
      filteredSuppliers = filteredSuppliers.filter((supplier) =>
        supplier.supplierName.toLowerCase().includes(filterValue.toLowerCase())
      );
    }
    if (
      statusFilter !== "all" &&
      Array.from(statusFilter).length !== statusOptions.length
    ) {
      filteredSuppliers = filteredSuppliers.filter(
        (supplier) =>
          supplier.status !== undefined &&
          Array.from(statusFilter).includes(supplier.status)
      );
    }

    return filteredSuppliers;
  }, [suppliers, filterValue, statusFilter]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage);

  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  const sortedItems = React.useMemo(() => {
    return [...filteredItems]
      .sort((a: DrugSupplierResponse, b: DrugSupplierResponse) => {
        const first = a[sortDescriptor.column as keyof DrugSupplierResponse];
        const second = b[sortDescriptor.column as keyof DrugSupplierResponse];

        let cmp = 0;
        if (typeof first === "string" && typeof second === "string") {
          cmp = first.localeCompare(second);
        }

        return sortDescriptor.direction === "descending" ? -cmp : cmp;
      })
      .slice((page - 1) * rowsPerPage, page * rowsPerPage); // Apply pagination after sorting
  }, [sortDescriptor, filteredItems, page, rowsPerPage]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const handleOpenDetails = async (id: string) => {
    try {
      const supplier = await getDrugSupplierById(id);
      setSelectedSupplier(supplier); // Đúng hơn là set dữ liệu supplier
      setIsDetailsModalOpen(true);
    } catch (error) {
      toast.error("Failed to load drug details");
    }
  };

  const handleOpenEditModal = (id: string) => {
    setEditingSupplierId(id);
    setIsEditModalOpen(true);
  };

  const handleUpdateSuccess = () => {
    fetchDrugSuppliers();
    setIsEditModalOpen(false);
    setEditingSupplierId("");
  };

  const handleActivate = async () => {
    const ids = selectedSuppliers
      .filter((s) => s.status === "Inactive")
      .map((s) => s.id);
    if (ids.length === 0) return;

    try {
      await activateDrugSuppliers(ids);
      toast.success("Drug Suppliers activated successfully");
      fetchDrugSuppliers();
      setSelectedKeys(new Set());
    } catch (error) {
      toast.error("Failed to activate drug suppliers");
    }
  };

  const handleDeactivate = async () => {
    const ids = selectedSuppliers
      .filter((s) => s.status === "Active")
      .map((s) => s.id);
    if (ids.length === 0) return;

    try {
      await deactivateDrugSuppliers(ids);
      toast.success("Drug suppliers deactivated successfully");
      fetchDrugSuppliers();
      setSelectedKeys(new Set());
    } catch (error) {
      toast.error("Failed to deactivate drug suppliers");
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

  const router = useRouter();

  // Lấy page từ URL khi component mount
  useEffect(() => {
    const queryPage = Number(router.query.page) || 1;
    setPage(queryPage);
  }, [router.query.page]);

  // Hàm cập nhật URL khi đổi trang
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

  const renderCell = React.useCallback(
    (supplier: DrugSupplierResponse, columnKey: React.Key) => {
      const cellValue = supplier[columnKey as keyof DrugSupplierResponse];

      switch (columnKey) {
        case "supplierName":
          return (
            <div className="flex flex-col">
              <p
                className="text-bold text-small capitalize text-primary cursor-pointer hover:underline"
                onClick={() => handleOpenDetails(supplier.id)}
              >
                {cellValue as string}
              </p>
            </div>
          );
        case "status":
          return (
            <Chip
              className="capitalize"
              color={
                statusColorMap[supplier.status as keyof typeof statusColorMap]
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
                    onClick={() => handleOpenEditModal(supplier.id)}
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
            placeholder="Search by supplier name..."
            startContent={<SearchIcon />}
            value={filterValue}
            onClear={() => onClear()}
            onValueChange={onSearchChange}
          />
          <div className="flex gap-3">
            <div className="flex gap-2">
              {showActivate && (
                <Button
                  radius="sm"
                  variant="bordered"
                  className="bg-success-100 text-success-600"
                  onClick={handleConfirmActivate}
                >
                  Activate Selected
                </Button>
              )}
              {showDeactivate && (
                <Button
                  radius="sm"
                  variant="bordered"
                  className="bg-danger-100 text-danger-600"
                  onClick={handleConfirmDeactivate}
                >
                  Deactivate Selected
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
              onClick={() => setIsModalOpen(true)}
            >
              Add New
            </Button>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-default-400 text-small ml-4">
            Total {suppliers.length} drug suppliers
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
    selectedSuppliers,
    filterValue,
    statusFilter,
    visibleColumns,
    selectedKeys,
    onSearchChange,
    onRowsPerPageChange,
    suppliers.length,
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
        {isReady && (
                  <Pagination
                    key={page}
                    showControls
                    page={page}
                    total={pages}
                    onChange={(newPage) => setPage(newPage)}
                    color="primary"
                  />
                )}
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
        <DrugSupplierIcon />
        <h3 className="text-2xl font-bold">Drug Supplier Management</h3>
      </div>

      {isModalOpen && (
        <Modal isOpen={isModalOpen} onOpenChange={setIsModalOpen}>
          <ModalContent className="max-w-[500px] rounded-lg shadow-lg border border-gray-200 bg-white">
            <ModalHeader className="pb-3">Add New Drug Supplier</ModalHeader>
            <ModalBody>
              <CreateDrugSupplierForm
                onClose={() => {
                  setIsModalOpen(false);
                }}
                onCreate={fetchDrugSuppliers}
              />
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      {isEditModalOpen && (
        <Modal isOpen={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <ModalContent className="max-w-[500px] rounded-lg shadow-lg border border-gray-200 bg-white">
            <ModalHeader className=" pb-3">Edit Drug</ModalHeader>
            <ModalBody>
              <EditDrugSupplierForm
                drugSupplierId={editingSupplierId}
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
        <ModalContent className="max-w-[500px] rounded-lg shadow-lg border border-gray-200 bg-white">
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

      <DrugSupplierDetailsModal
        supplier={selectedSupplier}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
      />

      <Table
        isHeaderSticky
        aria-label="Drug supplier table"
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
        <TableBody emptyContent={"No drug supplier found"} items={sortedItems}>
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
