import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  PlusIcon,
  VerticalDotsIcon,
  SearchIcon,
  ChevronDownIcon,
} from "./Icons";
import { getUsers, updateAccountsStatus } from "@/api/user";
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
} from "@heroui/react";
import { UserDetails } from "./UserDetails";
import { EditUserForm } from "./EditUserForm";
import { CreateUserForm } from "./CreateUserForm";

export function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
}

export const columns = [
  //   { name: "ID", uid: "id", sortable: true },
  { name: "NAME", uid: "fullName", sortable: true },
  { name: "USERNAME", uid: "userName", sortable: true },
  { name: "EMAIL", uid: "email", sortable: true },
  { name: "ROLE", uid: "roles" },
  { name: "GENDER", uid: "gender" },
  { name: "DOB", uid: "dob", sortable: true },
  { name: "ADDRESS", uid: "address" },
  { name: "PHONE", uid: "phone" },
  { name: "CREATED AT", uid: "createdAt", sortable: true },
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
  status?: string;
};
export function Users() {
  const [confirmingStatusUpdate, setConfirmingStatusUpdate] = useState<{
    status: string;
    count: number;
  } | null>(null);

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
    column: "age",
    direction: "ascending",
  });

  const [page, setPage] = React.useState(1);
  console.log("Current page:", page);

  const [users, setUsers] = React.useState<User[]>([]);

  const fetchUsers = async () => {
    const userData = await getUsers();
    setUsers(userData);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const hasSearchFilter = Boolean(filterValue);

  const headerColumns = React.useMemo(() => {
    if (visibleColumns === "all") return columns;

    return columns.filter((column) =>
      Array.from(visibleColumns).includes(column.uid)
    );
  }, [visibleColumns]);

  const filteredItems = React.useMemo(() => {
    let filteredUsers = [...users];

    if (hasSearchFilter) {
      filteredUsers = filteredUsers.filter((user) =>
        user.fullName.toLowerCase().includes(filterValue.toLowerCase())
      );
    }
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
    return [...items].sort((a: User, b: User) => {
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
    });
  }, [sortDescriptor, items]);

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (
      selectedKeys === "all" ||
      (selectedKeys instanceof Set && selectedKeys.size === 0)
    )
      return;

    const selectedUserIds = Array.from(selectedKeys as Set<string>);

    // Hiển thị xác nhận thay vì gọi API ngay
    setConfirmingStatusUpdate({
      status: newStatus,
      count: selectedUserIds.length,
    });
  };

  const getBulkActionLabel = () => {
    const selectedUsersArray = users.filter(
      (user) =>
        selectedKeys !== "all" && (selectedKeys as Set<string>).has(user.id)
    );

    const allInactive = selectedUsersArray.every(
      (user) => user.status === "Inactive"
    );

    return allInactive ? "Activate Selected" : "Deactivate Selected";
  };

  const renderCell = React.useCallback((user: User, columnKey: React.Key) => {
    const cellValue = user[columnKey as keyof User];

    switch (columnKey) {
      case "fullName":
        return (
          <div className="flex flex-col">
            <p
              className="text-bold text-small capitalize text-primary cursor-pointer hover:underline"
              onClick={() => setSelectedUser(user)}
            >
              {cellValue as string}
            </p>
          </div>
        );

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
        return formatDate(user.dob);
      case "createdAt":
        return formatDate(user.createdAt);
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
                <DropdownItem key="view" onClick={() => setSelectedUser(user)}>
                  View
                </DropdownItem>
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
            isClearable
            className="w-full sm:max-w-[44%]"
            placeholder="Search by name..."
            startContent={<SearchIcon />}
            value={filterValue}
            onClear={() => onClear()}
            onValueChange={onSearchChange}
          />
          <div className="flex gap-3">
            {selectedKeys !== "all" &&
              (selectedKeys as Set<string>).size > 0 && (
                <Button
                  color="warning"
                  onClick={() =>
                    handleBulkStatusUpdate(
                      getBulkActionLabel() === "Activate Selected"
                        ? "Active"
                        : "Inactive"
                    )
                  }
                >
                  {getBulkActionLabel()}
                </Button>
              )}
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
    filterValue,
    statusFilter,
    visibleColumns,
    onSearchChange,
    onRowsPerPageChange,
    users.length,
    hasSearchFilter,
    selectedKeys,
    getBulkActionLabel,
    handleBulkStatusUpdate,
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
  }, [selectedKeys, items.length, page, pages, hasSearchFilter]);

  return (
    <>
      <h3 className="text-2xl font-bold mb-4 ml-4">User Management</h3>
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
      {confirmingStatusUpdate && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Confirm Action</h2>
            <p>
              Are you sure you want to{" "}
              {confirmingStatusUpdate.status === "Active"
                ? "activate"
                : "deactivate"}{" "}
              {confirmingStatusUpdate.count} user(s)?
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setConfirmingStatusUpdate(null)}
              >
                Cancel
              </Button>
              <Button
                color={
                  confirmingStatusUpdate.status === "Active"
                    ? "success"
                    : "danger"
                }
                onClick={async () => {
                  const selectedUserIds = Array.from(
                    selectedKeys as Set<string>
                  );
                  try {
                    await updateAccountsStatus({
                      userId: selectedUserIds,
                      status: confirmingStatusUpdate.status,
                    });
                    fetchUsers();
                    setSelectedKeys(new Set());
                    toast.success(
                      `Successfully ${
                        confirmingStatusUpdate.status === "Active"
                          ? "activated"
                          : "deactivated"
                      } ${selectedUserIds.length} user(s).`
                    );
                  } catch (error) {
                    toast.error(
                      "Failed to update user status. Please try again."
                    );
                  } finally {
                    setConfirmingStatusUpdate(null);
                  }
                }}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
