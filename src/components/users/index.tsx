import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  PlusIcon,
  VerticalDotsIcon,
  SearchIcon,
  ChevronDownIcon,
  UsersIcon,
} from "./Icons";
import { getUsers, activateUsers, deactivateUsers } from "@/api/user";
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
  User,
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
import { UserDetails } from "./UserDetails";
import { EditUserForm } from "./EditUserForm";
import { CreateUserForm } from "./CreateUserForm";
import { useRouter } from "next/router";

export function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
}

export const columns = [
  { name: "NAME", uid: "fullName", sortable: true },
  { name: "USERNAME", uid: "userName", sortable: true },
  { name: "EMAIL", uid: "email", sortable: true },
  { name: "GENDER", uid: "gender" },
  { name: "DOB", uid: "dob", sortable: true },
  { name: "ROLE", uid: "roles" },
  { name: "PHONE", uid: "phone" },
  { name: "ADDRESS", uid: "address" },
  { name: "CREATED AT", uid: "createdAt", sortable: true },
  { name: "UPDATED AT", uid: "updatedAt", sortable: true },
  { name: "STATUS", uid: "status" },
  { name: "ACTIONS", uid: "actions" },
];

export const statusOptions = [
  { name: "Active", uid: "Active" },
  { name: "Inactive", uid: "Inactive" },
];

const statusColorMap: Record<string, ChipProps["color"]> = {
  Active: "success",
  Inactive: "danger",
};

const roleColorMap: Record<string, ChipProps["color"]> = {
  Admin: "danger",
  Manager: "warning",
  Staff: "primary",
  User: "success",
  Unknown: "default",
};

const INITIAL_VISIBLE_COLUMNS = [
  "fullName",
  "userName",
  "email",
  "gender",
  "dob",
  "phone",
  "roles",
  "status",
  "actions",
];

type User = {
  id: string;
  fullName: string;
  userName: string;
  email: string;
  roles: string[];
  gender: string;
  dob: string;
  address: string;
  phone: string;
  createdAt: string;
  updatedAt?: string;
  status?: string;
};

export function Users() {
  const router = useRouter();
  const [creatingUser, setCreatingUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [filterValue, setFilterValue] = React.useState("");
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
  const [isReady, setIsReady] = useState(false);

  const [page, setPage] = React.useState(1);
  const [users, setUsers] = React.useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [showActivate, setShowActivate] = useState(false);
  const [showDeactivate, setShowDeactivate] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    "activate" | "deactivate" | null
  >(null);

  const fetchUsers = async () => {
    try {
      const userData = await getUsers();
      if (!userData || !Array.isArray(userData)) {
        console.error("Invalid data received:", userData);
        setUsers([]);
        return;
      }
      setUsers(userData);
      setIsReady(true);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setUsers([]);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    setPage(1); // Reset trang về 1 khi filter thay đổi
  }, [statusFilter, filterValue]);

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

  const hasSearchFilter = Boolean(filterValue);

  const headerColumns = React.useMemo(() => {
    if (visibleColumns === "all") return columns;

    return columns.filter((column) =>
      Array.from(visibleColumns).includes(column.uid)
    );
  }, [visibleColumns]);

  // Add this helper function at the top of the file
  function removeVietnameseTones(str: string) {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D");
  }

  // Then modify the filteredItems useMemo, specifically the search filter part:
  const filteredItems = React.useMemo(() => {
    let filteredUsers = [...users];

    if (hasSearchFilter) {
      const normalizedFilter = removeVietnameseTones(filterValue.toLowerCase());

      filteredUsers = filteredUsers.filter(
        (user) =>
          removeVietnameseTones(user.fullName.toLowerCase()).includes(
            normalizedFilter
          ) ||
          removeVietnameseTones(user.userName.toLowerCase()).includes(
            normalizedFilter
          ) ||
          removeVietnameseTones(user.email.toLowerCase()).includes(
            normalizedFilter
          ) ||
          removeVietnameseTones(user.phone.toLowerCase()).includes(
            normalizedFilter
          )
      );
    }

    // Rest of the filtering logic remains the same
    if (
      statusFilter !== "all" &&
      Array.from(statusFilter).length !== statusOptions.length
    ) {
      filteredUsers = filteredUsers.filter(
        (user) =>
          user.status !== undefined &&
          Array.from(statusFilter).includes(user.status)
      );
    }

    return filteredUsers;
  }, [users, filterValue, statusFilter]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage);

  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  const sortedItems = React.useMemo(() => {
    return [...filteredItems]
      .sort((a: User, b: User) => {
        const first = a[sortDescriptor.column as keyof User];
        const second = b[sortDescriptor.column as keyof User];

        let cmp = 0;

        if (typeof first === "string" && typeof second === "string") {
          cmp = first.localeCompare(second);
        } else if (typeof first === "number" && typeof second === "number") {
          cmp = first - second;
        } else if (first instanceof Date && second instanceof Date) {
          cmp = first.getTime() - second.getTime();
        }

        return sortDescriptor.direction === "descending" ? -cmp : cmp;
      })
      .slice((page - 1) * rowsPerPage, page * rowsPerPage);
  }, [sortDescriptor, filteredItems, page, rowsPerPage]);
  const ROLE_PRIORITY = ["Admin", "Manager", "Staff", "User"];

  const getHighestRole = (roles: string[]) => {
    if (!roles || roles.length === 0) return "Unknown";

    return (
      roles
        .slice()
        .sort(
          (a, b) => ROLE_PRIORITY.indexOf(a) - ROLE_PRIORITY.indexOf(b)
        )[0] || "Unknown"
    );
  };

  const formatDate = (dateString: string, includeTime: boolean = false) => {
    const date = new Date(dateString);
    if (includeTime) {
      return `${date.toLocaleDateString("vi-VN")} ${date.getHours()}:${String(
        date.getMinutes()
      ).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`;
    }
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  useEffect(() => {
    let selected: User[] = [];

    if (selectedKeys === "all") {
      selected = filteredItems;
    } else {
      selected = users.filter((user) =>
        (selectedKeys as Set<string>).has(user.id)
      );
    }

    setSelectedUsers(selected);

    const hasActive = selected.some((user) => user.status === "Active");
    const hasInactive = selected.some((user) => user.status === "Inactive");

    setShowActivate(hasInactive);
    setShowDeactivate(hasActive);
  }, [selectedKeys, filteredItems, users]);

  const handleActivate = async () => {
    const ids = selectedUsers
      .filter((u) => u.status === "Inactive")
      .map((u) => u.id);
    if (ids.length === 0) return;

    try {
      await activateUsers(ids);
      toast.success("Users activated successfully");
      fetchUsers();
      setSelectedKeys(new Set());
    } catch (error) {
      toast.error("Failed to activate users");
    }
  };

  const handleDeactivate = async () => {
    const ids = selectedUsers
      .filter((u) => u.status === "Active")
      .map((u) => u.id);

    if (ids.length === 0) return;

    try {
      await deactivateUsers(ids);
      toast.success("Users deactivated successfully");
      fetchUsers();
      setSelectedKeys(new Set());
    } catch (error) {
      toast.error("Failed to deactivate users");
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
    fetchUsers();
  };

  const renderCell = React.useCallback((user: User, columnKey: React.Key) => {
    const cellValue = user[columnKey as keyof User];
    switch (columnKey) {
      case "fullName":
        return (
          <div className="flex flex-col">
            <p
              className="text-bold text-small text-primary cursor-pointer hover:underline"
              onClick={() => setSelectedUser(user)}
            >
              {cellValue as string}
            </p>
          </div>
        );
      case "userName":
        return <span className="font-medium">{cellValue as string}</span>;
      case "roles":
        const highestRole = getHighestRole(user.roles);
        return (
          <Chip
            className="capitalize"
            color={roleColorMap[highestRole] || "default"}
            size="sm"
            variant="flat"
          >
            {highestRole}
          </Chip>
        );
      case "status":
        return (
          <Chip
            className="capitalize"
            color={statusColorMap[user.status as keyof typeof statusColorMap]}
            size="sm"
            variant="flat"
          >
            {cellValue as string}
          </Chip>
        );
      case "dob":
        return <span>{formatDate(user.dob)}</span>;
      case "createdAt":
      case "updatedAt":
        return cellValue ? (
          <span>{formatDate(cellValue as string, true)}</span>
        ) : (
          "-"
        );
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
                <DropdownItem key="edit" onClick={() => setEditingUser(user)}>
                  Edit
                </DropdownItem>
                {/* <DropdownItem key="delete">Delete</DropdownItem> */}
              </DropdownMenu>
            </Dropdown>
          </div>
        );

      default:
        return cellValue;
    }
  }, []);

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
            radius="sm"
            isClearable
            className="w-full sm:max-w-[44%]"
            placeholder="Search by name, username, email, phone..."
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
              radius="sm"
              color="primary"
              endContent={<PlusIcon />}
              onClick={() => setCreatingUser(true)}
            >
              Add New
            </Button>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-default-400 text-small ml-4">
            Total {users.length} users
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
    router,
    selectedUsers,
    filterValue,
    statusFilter,
    visibleColumns,
    onSearchChange,
    onRowsPerPageChange,
    users.length,
    hasSearchFilter,
    selectedKeys,
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
        <UsersIcon />
        <h3 className="text-2xl font-bold">Users Management</h3>
      </div>
      <Modal
        isOpen={isConfirmModalOpen}
        onOpenChange={(open) => !open && setIsConfirmModalOpen(false)}
      >
        <ModalContent className="max-w-[500px] rounded-lg shadow-lg border border-gray-200 bg-white">
          <ModalHeader className="border-b pb-3">Confirm Action</ModalHeader>
          <ModalBody>
            <p className="text-gray-700">
              Are you sure you want to{" "}
              <span
                className={
                  confirmAction === "activate"
                    ? "text-green-600"
                    : "text-red-600"
                }
              >
                {confirmAction === "activate" ? "activate" : "deactivate"}
              </span>{" "}
              the selected users?
            </p>
          </ModalBody>
          <ModalFooter className="border-t pt-4">
            <div className="flex justify-end gap-3">
              <Button
                radius="sm"
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                radius="sm"
                type="button"
                color="primary"
                onClick={handleConfirmAction}
              >
                Confirm
              </Button>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>{" "}
      <Table
        isHeaderSticky
        aria-label="Example table with custom cells, pagination and sorting"
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
        <TableBody emptyContent={"No users found"} items={sortedItems}>
          {(item) => (
            <TableRow key={item.id}>
              {(columnKey) => (
                <TableCell>{renderCell(item, columnKey)}</TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
      {selectedUser && (
        <UserDetails
          isOpen={!!selectedUser}
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
      {editingUser && (
        <EditUserForm
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onUpdate={() => {
            setEditingUser(null);
            fetchUsers();
          }}
        />
      )}
      {creatingUser && (
        <CreateUserForm
          onClose={() => setCreatingUser(false)}
          onCreate={fetchUsers}
        />
      )}
    </>
  );
}
