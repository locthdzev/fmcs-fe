import React from "react";

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

type Props = {
  user: User;
  onClose: () => void;
};

const statusColorMap: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-red-100 text-red-800",
};

const roleColorMap: Record<string, string> = {
  Admin: "bg-red-100 text-red-800",
  Manager: "bg-yellow-100 text-yellow-800",
  Staff: "bg-blue-100 text-blue-800",
  User: "bg-green-100 text-green-800",
  Unknown: "bg-gray-100 text-gray-800",
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("vi-VN");
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

export const UserDetails: React.FC<Props> = ({ user, onClose }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full lg:w-6/12 bg-white rounded-3xl shadow-xl p-6">
        <h3 className="text-2xl font-bold mb-4">User Details</h3>
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
              value: formatDate(user.createdAt),
            },
            {
              label: "Role",
              value: (
                <span
                  className={`px-2 py-1 rounded-full ${
                    roleColorMap[getHighestRole(user.roles)]
                  }`}
                >
                  {getHighestRole(user.roles)}
                </span>
              ),
            },
            {
              label: "Status",
              value: (
                <span
                  className={`px-2 py-1 rounded-full ${
                    statusColorMap[user.status?.toLowerCase() || "inactive"]
                  }`}
                >
                  {user.status}
                </span>
              ),
            },
            {
              label: "Address",
              value: user.address,
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
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className="bg-gradient-to-tr from-gray-500 to-gray-300 text-white shadow-lg rounded-full px-3 py-1.5"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
