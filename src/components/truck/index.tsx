import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  PlusIcon,
  VerticalDotsIcon,
  SearchIcon,
  ChevronDownIcon,
  TrucksIcon,
} from "./Icons";
import {
  getTrucks,
  createTruck,
  updateTruck,
  deleteTruck,
  TruckResponse,
  getTruckById,
  activateTrucks,
  deactivateTrucks,
} from "@/api/truck";
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
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  SortDescriptor,
  ChipProps,
} from "@heroui/react";
import { CreateTruckForm } from "./CreateTruckForm";
import TruckDetailsModal from "./TruckDetails";
import { EditTruckForm } from "./EditTruckForm";
import ConfirmDeleteTruckModal from "./ConfirmDelete";
import { useRouter } from "next/router";

export function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
}

const columns = [
  { name: "LICENSE PLATE", uid: "licensePlate", sortable: true },
  { name: "DRIVER NAME", uid: "driverName", sortable: true },
  { name: "DRIVER CONTACT", uid: "driverContact", sortable: true },
  { name: "STATUS", uid: "status" },
  { name: "CREATED AT", uid: "createdAt", sortable: true },
  { name: "UPDATED AT", uid: "updatedAt", sortable: true },
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
  "licensePlate",
  "driverName",
  "driverContact",
  "createdAt",
  "status",
  "actions",
];

export function Trucks() {
  const router = useRouter();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTruckId, setEditingTruckId] = useState<string>("");
  const [selectedTruck, setSelectedTruck] = useState<TruckResponse | null>(
    null
  );
  const [deletingTruck, setDeletingTruck] = useState<TruckResponse | null>(
    null
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    "activate" | "deactivate" | null
  >(null);
  const [selectedTrucks, setSelectedTrucks] = useState<TruckResponse[]>([]);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterValue, setFilterValue] = React.useState("");
  const [showActivate, setShowActivate] = useState(false);
  const [showDeactivate, setShowDeactivate] = useState(false);

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
  const [trucks, setTrucks] = useState<TruckResponse[]>([]);

  const fetchTrucks = async () => {
    const data = await getTrucks();
    setTrucks(data);
  };

  useEffect(() => {
    fetchTrucks();
  }, []);

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

  useEffect(() => {
    let selected: TruckResponse[] = [];

    if (selectedKeys === "all") {
      selected = trucks; // Nếu chọn "all", lấy toàn bộ danh sách thuốc
    } else {
      selected = trucks.filter((truck) =>
        (selectedKeys as Set<string>).has(truck.id)
      );
    }

    setSelectedTrucks(selected);

    const hasActive = selected.some((truck) => truck.status === "Active");
    const hasInactive = selected.some((truck) => truck.status === "Inactive");

    setShowActivate(hasInactive);
    setShowDeactivate(hasActive);
  }, [selectedKeys, trucks]);

  const hasSearchFilter = Boolean(filterValue);

  const headerColumns = React.useMemo(() => {
    if (visibleColumns === "all") return columns;

    return columns.filter((column) =>
      Array.from(visibleColumns).includes(column.uid)
    );
  }, [visibleColumns]);

  const filteredItems = React.useMemo(() => {
    let filteredTrucks = [...trucks];

    if (hasSearchFilter) {
      filteredTrucks = filteredTrucks.filter((truck) =>
        truck.licensePlate.toLowerCase().includes(filterValue.toLowerCase())
      );
    }
    if (
      statusFilter !== "all" &&
      Array.from(statusFilter).length !== statusOptions.length
    ) {
      filteredTrucks = filteredTrucks.filter(
        (truck) =>
          truck.status !== undefined &&
          Array.from(statusFilter).includes(truck.status)
      );
    }

    return filteredTrucks;
  }, [trucks, filterValue, statusFilter]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage);

  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  const sortedItems = React.useMemo(() => {
    return [...items].sort((a: TruckResponse, b: TruckResponse) => {
      const first = a[sortDescriptor.column as keyof TruckResponse];
      const second = b[sortDescriptor.column as keyof TruckResponse];

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

  const handleOpenDetails = async (id: string) => {
    try {
      const truck = await getTruckById(id);
      setSelectedTruck(truck);
      setIsDetailsModalOpen(true);
    } catch (error) {
      toast.error("Failed to load truck details");
    }
  };

  const handleOpenEditModal = (id: string) => {
    setEditingTruckId(id);
    setIsEditModalOpen(true);
  };

  const handleUpdateSuccess = () => {
    fetchTrucks();
    setIsEditModalOpen(false);
    setEditingTruckId("");
  };

  const handleOpenDeleteModal = async (id: string) => {
    try {
      const drug = await getTruckById(id);
      setDeletingTruck(drug);
      setIsDeleteModalOpen(true);
    } catch (error) {
      toast.error("Failed to load drug details for deletion");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingTruck) return;
    try {
      const response = await deleteTruck(deletingTruck.id);
      if (!response.isSuccess) {
        toast.error(response.message);
        return;
      }

      toast.success("Truck deleted successfully");
      await fetchTrucks();
      setSelectedKeys(new Set());
      setIsDeleteModalOpen(false);
      setDeletingTruck(null);
    } catch (error: any) {
      toast.error("Failed to delete truck");
    }
  };

  const handleActivate = async () => {
    const ids = selectedTrucks
      .filter((d) => d.status === "Inactive")
      .map((d) => d.id);
    if (ids.length === 0) return;

    try {
      await activateTrucks(ids);
      toast.success("Trucks activated successfully");
      fetchTrucks();
      setSelectedKeys(new Set());
    } catch (error) {
      toast.error("Failed to activate trucks");
    }
  };
  const handleDeactivate = async () => {
    const ids = selectedTrucks
      .filter((d) => d.status === "Active")
      .map((d) => d.id);
    if (ids.length === 0) return;

    try {
      await deactivateTrucks(ids);
      toast.success("Trucks deactivated successfully");
      fetchTrucks();
      setSelectedKeys(new Set());
    } catch (error) {
      toast.error("Failed to deactivate trucks");
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
    (truck: TruckResponse, columnKey: React.Key) => {
      const cellValue = truck[columnKey as keyof TruckResponse];

      switch (columnKey) {
        case "licensePlate":
          return (
            <div className="flex flex-col items-start">
              <div className="flex items-center">
                <img
                  src={truck.truckImage}
                  alt={truck.licensePlate}
                  className="w-8 h-8 mr-2 rounded"
                />
                <p
                  className="text-bold text-small capitalize text-primary cursor-pointer hover:underline"
                  onClick={() => handleOpenDetails(truck.id)}
                >
                  {cellValue as string}
                </p>
              </div>
            </div>
          );
        case "driverContact":
          return (
            <div className="flex flex-col">
              <p className="text-bold text-small">
                {truck.driverContact || "-"}
              </p>
            </div>
          );
        case "status":
          return (
            <Chip
              className="capitalize"
              color={
                statusColorMap[truck.status as keyof typeof statusColorMap]
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
                    onClick={() => handleOpenEditModal(truck.id)}
                  >
                    Edit
                  </DropdownItem>
                  <DropdownItem
                    key="delete"
                    className="text-danger"
                    onClick={() => handleOpenDeleteModal(truck.id)}
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
              radius="sm"
              color="primary"
              endContent={<PlusIcon />}
              onClick={() => setIsModalOpen(true)}
            >
              Add New Truck
            </Button>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-default-400 text-small ml-4">
            Total {trucks.length} drugs
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
    selectedKeys,
    onSearchChange,
    onRowsPerPageChange,
    trucks.length,
    showActivate,
    showDeactivate,
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
  }, [selectedKeys, items.length, page, pages]);

  return (
    <>
      <div className="flex items-center gap-2 mb-4 ml-4">
        <TrucksIcon />
        <h3 className="text-2xl font-bold">Truck Management</h3>
      </div>

      {isModalOpen && (
        <Modal isOpen={isModalOpen} onOpenChange={setIsModalOpen}>
          <ModalContent className="max-w-[500px] rounded-lg shadow-lg border border-gray-200 bg-white" >
            <ModalHeader>Add New Truck</ModalHeader>
            <ModalBody>
              <CreateTruckForm
                onClose={() => {
                  setIsModalOpen(false);
                }}
                onCreate={fetchTrucks}
              />
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      <TruckDetailsModal
        truck={selectedTruck}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
      />

      {isEditModalOpen && (
        <Modal isOpen={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <ModalContent className="max-w-[500px] rounded-lg shadow-lg border border-gray-200 bg-white">
            <ModalHeader>Edit Truck</ModalHeader>
            <ModalBody>
              <EditTruckForm
                truckId={editingTruckId}
                onClose={() => setIsEditModalOpen(false)}
                onUpdate={handleUpdateSuccess}
              />
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      <ConfirmDeleteTruckModal
        truck={deletingTruck}
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirmDelete={handleConfirmDelete}
      />

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

      <Table
        isHeaderSticky
        aria-label="Trucks table"
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
        <TableBody emptyContent={"No trucks found"} items={sortedItems}>
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
