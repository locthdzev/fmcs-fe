import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Chip,
  Button,
} from "@heroui/react";

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

type Props = {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
};

const statusColorMap: Record<string, any> = {
  active: "success",
  inactive: "danger",
};

const roleColorMap: Record<string, string> = {
  Admin: "danger",
  Manager: "warning",
  Staff: "primary",
  User: "success",
  Unknown: "default",
};

const formatDate = (dateString: string, includeTime: boolean = false) => {
  if (!dateString || dateString === "-") return "-";
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

const ROLE_PRIORITY = ["Admin", "Manager", "Staff", "User"];

const getHighestRole = (roles: string[]) => {
  if (!roles || roles.length === 0) return "Unknown";
  return (
    roles
      .slice()
      .sort((a, b) => ROLE_PRIORITY.indexOf(a) - ROLE_PRIORITY.indexOf(b))[0] ||
    "Unknown"
  );
};

export const UserDetails: React.FC<Props> = ({ user, isOpen, onClose }) => {
  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} className="max-w-3xl">
      <ModalContent className="rounded-lg shadow-lg border border-gray-200 bg-white">
        <ModalHeader className="flex justify-between items-center pb-2">
          <div className="flex items-center gap-2">
            <span>User Details</span>
            <span className="text-sm text-gray-500 font-bold">
              ({user.userName}) •{" "}
              <Chip
                className="capitalize px-2 py-1 text-sm font-medium"
                color={
                  roleColorMap[getHighestRole(user.roles)] as
                    | "success"
                    | "danger"
                    | "warning"
                    | "primary"
                    | "default"
                    | "secondary"
                    | undefined
                }
                size="sm"
                variant="flat"
              >
                {getHighestRole(user.roles)}
              </Chip>
            </span>
          </div>
          <Chip
            className="capitalize px-2 py-1 text-sm font-medium mr-4"
            color={
              user.status && statusColorMap[user.status.toLowerCase()]
                ? statusColorMap[user.status.toLowerCase()]
                : "default"
            }
            size="sm"
            variant="flat"
          >
            {user.status}
          </Chip>
        </ModalHeader>
        <ModalBody className="pt-2 px-6 pb-6">
          <div className="grid grid-cols-12 gap-6 items-start">
            <div className="col-span-12 space-y-4 text-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    label: "Full Name",
                    value: user.fullName,
                  },
                  {
                    label: "Username",
                    value: user.userName,
                  },
                  {
                    label: "Email",
                    value: user.email,
                  },
                  {
                    label: "Gender",
                    value: user.gender,
                  },
                  {
                    label: "Date of Birth",
                    value: formatDate(user.dob),
                  },
                  {
                    label: "Phone",
                    value: user.phone,
                  },
                  {
                    label: "Created At",
                    value: formatDate(user.createdAt, true),
                  },
                  {
                    label: "Updated At",
                    value: user.updatedAt
                      ? formatDate(user.updatedAt, true)
                      : "-",
                  },
                ].map((field, index) => (
                  <label
                    key={index}
                    className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm"
                  >
                    <span className="text-xs font-medium text-gray-700">
                      {field.label}
                    </span>
                    <div className="mt-1 w-full border-none p-0 sm:text-sm">
                      {field.value}
                    </div>
                  </label>
                ))}
              </div>
              <label className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm w-full">
                <span className="text-xs font-medium text-gray-700">
                  Address
                </span>
                <div className="mt-1 w-full border-none p-0 sm:text-sm">
                  {user.address}
                </div>
              </label>
            </div>
          </div>
        </ModalBody>
        <ModalFooter className="pt-2">
          <Button radius="sm" onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default UserDetails;
