import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  PlusIcon,
  VerticalDotsIcon,
  SearchIcon,
  ChevronDownIcon,
  DrugIcon,
} from "./Icons";
import {
  getDrugs,
  deleteDrug,
  DrugResponse,
  getDrugById,
  activateDrugs,
  deactivateDrugs,
} from "@/api/drug";
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
import { CreateDrugForm } from "./CreateDrugForm";
import DrugDetailsModal from "./DrugDetails";
import { EditDrugForm } from "./EditDrugForm";
import ConfirmDeleteDrugModal from "./ConfirmDelete";

export function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
}

const columns = [
  { name: "DRUG CODE", uid: "drugCode", sortable: true },
  { name: "NAME", uid: "name", sortable: true },
  { name: "DRUG GROUP", uid: "drugGroup", sortable: true },
  { name: "UNIT", uid: "unit" },
  { name: "PRICE", uid: "price", sortable: true },
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
  "drugCode",
  "name",
  "unit",
  "price",
  "createdAt",
  "status",
  "drugGroup",
  "actions",
];

export function Drugs() {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingDrug, setDeletingDrug] = useState<DrugResponse | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDrugId, setEditingDrugId] = useState<string>("");
  const [selectedDrug, setSelectedDrug] = useState<DrugResponse | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterValue, setFilterValue] = React.useState("");
  const [selectedDrugs, setSelectedDrugs] = useState<DrugResponse[]>([]);
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
  const [drugs, setDrugs] = useState<DrugResponse[]>([]);

  const fetchDrugs = async () => {
    const data = await getDrugs();
    setDrugs(data);
  };

  useEffect(() => {
    fetchDrugs();
  }, []);

  useEffect(() => {
    let selected: DrugResponse[] = [];

    if (selectedKeys === "all") {
      selected = drugs; // Nếu chọn "all", lấy toàn bộ danh sách thuốc
    } else {
      selected = drugs.filter((drug) =>
        (selectedKeys as Set<string>).has(drug.id)
      );
    }

    setSelectedDrugs(selected);

    const hasActive = selected.some((drug) => drug.status === "Active");
    const hasInactive = selected.some((drug) => drug.status === "Inactive");

    setShowActivate(hasInactive);
    setShowDeactivate(hasActive);
  }, [selectedKeys, drugs]);

  const hasSearchFilter = Boolean(filterValue);

  const headerColumns = React.useMemo(() => {
    if (visibleColumns === "all") return columns;

    return columns.filter((column) =>
      Array.from(visibleColumns).includes(column.uid)
    );
  }, [visibleColumns]);

  const filteredItems = React.useMemo(() => {
    let filteredDrugs = [...drugs];

    if (hasSearchFilter) {
      filteredDrugs = filteredDrugs.filter((drug) =>
        drug.name.toLowerCase().includes(filterValue.toLowerCase())
      );
    }
    if (
      statusFilter !== "all" &&
      Array.from(statusFilter).length !== statusOptions.length
    ) {
      filteredDrugs = filteredDrugs.filter(
        (drug) =>
          drug.status !== undefined &&
          Array.from(statusFilter).includes(drug.status)
      );
    }

    return filteredDrugs;
  }, [drugs, filterValue, statusFilter]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage);

  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  const sortedItems = React.useMemo(() => {
    return [...items].sort((a: DrugResponse, b: DrugResponse) => {
      const first = a[sortDescriptor.column as keyof DrugResponse];
      const second = b[sortDescriptor.column as keyof DrugResponse];

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
      const drug = await getDrugById(id);
      setSelectedDrug(drug);
      setIsDetailsModalOpen(true);
    } catch (error) {
      toast.error("Failed to load drug details");
    }
  };

  const handleOpenEditModal = (id: string) => {
    setEditingDrugId(id);
    setIsEditModalOpen(true);
  };

  const handleUpdateSuccess = () => {
    fetchDrugs();
    setIsEditModalOpen(false);
    setEditingDrugId("");
  };

  const handleOpenDeleteModal = async (id: string) => {
    try {
      const drug = await getDrugById(id);
      setDeletingDrug(drug);
      setIsDeleteModalOpen(true);
    } catch (error) {
      toast.error("Failed to load drug details for deletion");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingDrug) return;
    try {
      await deleteDrug(deletingDrug.id);
      toast.success("Drug deleted successfully");
      await fetchDrugs();
      setSelectedKeys(new Set());
      setIsDeleteModalOpen(false);
      setDeletingDrug(null);
    } catch (error) {
      toast.error("Failed to delete drug");
    }
  };

  const handleActivate = async () => {
    const ids = selectedDrugs
      .filter((d) => d.status === "Inactive")
      .map((d) => d.id);
    if (ids.length === 0) return;

    try {
      await activateDrugs(ids);
      toast.success("Drugs activated successfully");
      fetchDrugs();
      setSelectedKeys(new Set());
    } catch (error) {
      toast.error("Failed to activate drugs");
    }
  };

  const handleDeactivate = async () => {
    const ids = selectedDrugs
      .filter((d) => d.status === "Active")
      .map((d) => d.id);
    if (ids.length === 0) return;

    try {
      await deactivateDrugs(ids);
      toast.success("Drugs deactivated successfully");
      fetchDrugs();
      setSelectedKeys(new Set());
    } catch (error) {
      toast.error("Failed to deactivate drugs");
    }
  };

  const renderCell = React.useCallback(
    (drug: DrugResponse, columnKey: React.Key) => {
      const cellValue = drug[columnKey as keyof DrugResponse];

      switch (columnKey) {
        case "name":
          return (
            <div className="flex flex-col items-start">
              <div className="flex items-center">
                <img
                  src={drug.imageUrl}
                  alt={drug.name}
                  className="w-8 h-8 mr-2 rounded"
                />
                <p
                  className="text-bold text-small capitalize text-primary cursor-pointer hover:underline"
                  onClick={() => handleOpenDetails(drug.id)}
                >
                  {cellValue as string}
                </p>
              </div>
            </div>
          );
        case "status":
          return (
            <Chip
              className="capitalize"
              color={statusColorMap[drug.status as keyof typeof statusColorMap]}
              size="sm"
              variant="flat"
            >
              {cellValue as string}
            </Chip>
          );
        case "createdAt":
        case "updatedAt":
          return cellValue ? formatDate(cellValue as string) : "-";
        case "drugGroup":
          return cellValue && typeof cellValue === "object"
            ? (cellValue as { groupName: string }).groupName
            : "-";
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
                    onClick={() => handleOpenEditModal(drug.id)}
                  >
                    Edit
                  </DropdownItem>
                  <DropdownItem
                    key="delete"
                    className="text-danger"
                    onClick={() => handleOpenDeleteModal(drug.id)}
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
            placeholder="Search by drug name..."
            startContent={<SearchIcon />}
            value={filterValue}
            onClear={() => onClear()}
            onValueChange={onSearchChange}
          />
          <div className="flex gap-3">
            <div className="flex gap-2">
              {showActivate && (
                <Button color="success" onClick={handleActivate}>
                  Activate Selected
                </Button>
              )}
              {showDeactivate && (
                <Button color="danger" onClick={handleDeactivate}>
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
            Total {drugs.length} drugs
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
    selectedDrugs,
    filterValue,
    statusFilter,
    visibleColumns,
    selectedKeys,
    onSearchChange,
    onRowsPerPageChange,
    drugs.length,
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
        <DrugIcon />
        <h3 className="text-2xl font-bold">Drug Management</h3>
      </div>

      {isModalOpen && (
        <Modal isOpen={isModalOpen} onOpenChange={setIsModalOpen}>
          <ModalContent className="max-w-[800px]">
            <ModalHeader>Add New Drug</ModalHeader>
            <ModalBody>
              <CreateDrugForm
                onClose={() => {
                  setIsModalOpen(false);
                }}
                onCreate={fetchDrugs}
              />
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      <DrugDetailsModal
        drug={selectedDrug}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
      />

      {isEditModalOpen && (
        <Modal isOpen={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <ModalContent className="max-w-[800px]">
            <ModalHeader>Edit Drug</ModalHeader>
            <ModalBody>
              <EditDrugForm
                drugId={editingDrugId}
                onClose={() => setIsEditModalOpen(false)}
                onUpdate={handleUpdateSuccess}
              />
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      <ConfirmDeleteDrugModal
        drug={deletingDrug}
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirmDelete={handleConfirmDelete}
      />

      <Table
        isHeaderSticky
        aria-label="Drugs table"
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
        <TableBody emptyContent={"No drugs found"} items={sortedItems}>
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
