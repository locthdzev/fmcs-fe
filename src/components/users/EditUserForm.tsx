import React, { useEffect, useState } from "react";
import {
  updateUser,
  assignRoleToUser,
  unassignRoleFromUser,
  getAllRoles,
} from "@/api/user";
import { toast } from "react-toastify";

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

interface EditUserFormProps {
  user: User;
  onClose: () => void;
  onUpdate: () => void;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("vi-VN");
};

export const EditUserForm: React.FC<EditUserFormProps> = ({
  user,
  onClose,
  onUpdate,
}) => {
  const [activeTab, setActiveTab] = useState("profile");
  const [formData, setFormData] = useState({ ...user });
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [allRoles, setAllRoles] = useState<{ id: string; roleName: string }[]>(
    []
  );
  const [pendingRoles, setPendingRoles] = useState<string[]>([...user.roles]);
  const [selectedRole, setSelectedRole] = useState("");

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const roles = await getAllRoles();
        console.log("Fetched Roles:", roles);
        setAllRoles(roles);
      } catch (error) {
        console.error("Failed to fetch roles", error);
      }
    };
    fetchRoles();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await updateUser(user.id, formData);

      // Handle role changes
      const rolesToAdd = pendingRoles.filter(
        (role) => !user.roles.includes(role)
      );
      const rolesToRemove = user.roles.filter(
        (role) => !pendingRoles.includes(role)
      );

      for (const roleId of rolesToAdd) {
        const role = allRoles.find((r) => r.roleName === roleId);
        if (role) {
          await assignRoleToUser(user.id, role.id);
        }
      }

      for (const roleId of rolesToRemove) {
        const role = allRoles.find((r) => r.roleName === roleId);
        if (role) {
          await unassignRoleFromUser(user.id, role.id);
        }
      }

      toast.success("User information and roles updated successfully.");
      onUpdate();
      onClose();
    } catch (error) {
      console.error("Failed to update user", error);
      toast.error("Failed to update user information.");
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  const handlePendingUnassignRole = (roleId: string) => {
    setPendingRoles(pendingRoles.filter((role) => role !== roleId));
  };

  const handlePendingAssignRole = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const roleId = e.target.value;
    if (roleId && !pendingRoles.includes(roleId)) {
      const role = allRoles.find((r) => r.id === roleId);
      if (role) {
        setPendingRoles([...pendingRoles, role.roleName]);
      }
    }
    setSelectedRole("");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full lg:w-8/12 bg-white rounded-3xl shadow-xl p-8">
        <h3 className="text-3xl font-bold mb-6">Edit User</h3>

        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-4">
            <button
              className={`py-2 px-4 ${
                activeTab === "profile"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500"
              }`}
              onClick={() => setActiveTab("profile")}
            >
              Profile
            </button>
            <button
              className={`py-2 px-4 ${
                activeTab === "roles"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500"
              }`}
              onClick={() => setActiveTab("roles")}
            >
              Assign & Unassign Role
            </button>
          </div>
        </div>

        {activeTab === "profile" ? (
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  label: "Full Name",
                  name: "fullName",
                  placeholder: "Daisy",
                  type: "text",
                },
                {
                  label: "Username",
                  name: "userName",
                  placeholder: "Username",
                  type: "text",
                },
                {
                  label: "Email",
                  name: "email",
                  placeholder: "daisy@site.com",
                  type: "email",
                },
                {
                  label: "Gender",
                  name: "gender",
                  placeholder: "Gender",
                  type: "select",
                  options: ["Male", "Female"],
                },
                {
                  label: "Date of Birth",
                  name: "dob",
                  placeholder: "Date of Birth",
                  type: "date",
                },
                {
                  label: "Phone",
                  name: "phone",
                  placeholder: "Phone",
                  type: "text",
                },
              ].map((field, index) => (
                <label
                  key={index}
                  htmlFor={field.name}
                  className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
                >
                  <span className="text-xs font-medium text-gray-700">
                    {field.label}
                  </span>
                  {field.type === "select" ? (
                    <select
                      id={field.name}
                      name={field.name}
                      value={formData[field.name as keyof User] || ""}
                      onChange={handleChange}
                      className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
                    >
                      {field.options?.map((option, idx) => (
                        <option key={idx} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      id={field.name}
                      name={field.name}
                      value={
                        field.type === "date" &&
                        formData[field.name as keyof User]
                          ? (
                              formData[field.name as keyof User] as string
                            ).split("T")[0]
                          : formData[field.name as keyof User] || ""
                      }
                      onChange={handleChange}
                      className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
                      placeholder={field.placeholder}
                    />
                  )}
                </label>
              ))}
              <label
                htmlFor="address"
                className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 md:col-span-2"
              >
                <span className="text-xs font-medium text-gray-700">
                  Address
                </span>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address || ""}
                  onChange={handleChange}
                  className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
                  placeholder="Address"
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                className="bg-gradient-to-tr from-blue-600 to-blue-300 text-white shadow-lg rounded-full px-4 py-2 mr-2"
                disabled={loading}
              >
                {loading ? "Updating..." : "Save"}
              </button>
              <button
                type="button"
                className="bg-gradient-to-tr from-gray-500 to-gray-300 text-white shadow-lg rounded-full px-4 py-2"
                onClick={onClose}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="p-4">
            <h4 className="text-xl font-semibold mb-4">User Roles</h4>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {pendingRoles.map((role, index) => (
                  <div
                    key={index}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center"
                  >
                    <span>{role}</span>
                    <button
                      onClick={() => handlePendingUnassignRole(role)}
                      className="ml-2 text-blue-800 hover:text-blue-900"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <select
                  className="w-full p-2 border rounded bg-white text-black"
                  onChange={handlePendingAssignRole}
                  value={selectedRole}
                >
                  <option value="">Assign new role...</option>
                  {allRoles.map((role) => (
                    <option
                      key={role.id}
                      value={role.id}
                      className="text-black"
                    >
                      {role.roleName || "Unnamed Role"}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSubmit}
                className="bg-gradient-to-tr from-blue-600 to-blue-300 text-white shadow-lg rounded-full px-4 py-2 mr-2"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => {
                  setPendingRoles([...user.roles]);
                  onClose();
                }}
                className="bg-gradient-to-tr from-gray-500 to-gray-300 text-white shadow-lg rounded-full px-4 py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h4 className="text-lg font-semibold mb-4">Confirm Update</h4>
            <p className="mb-6">
              Are you sure you want to update this user's information?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowConfirm(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                disabled={loading}
              >
                {loading ? "Updating..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
