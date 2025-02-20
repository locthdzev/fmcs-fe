import React, { useEffect, useState } from "react";
import {
  updateUser,
  assignRoleToUser,
  unassignRoleFromUser,
  getAllRoles,
} from "@/api/user";
import { toast } from "react-toastify";
import {
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Select,
  SelectItem,
  Tab,
  Tabs,
  ModalFooter,
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
  status?: string;
};

interface EditUserFormProps {
  user: User;
  onClose: () => void;
  onUpdate: () => void;
}

export const EditUserForm: React.FC<EditUserFormProps> = ({
  user,
  onClose,
  onUpdate,
}) => {
  const [activeTab, setActiveTab] = useState("profile");
  const [formData, setFormData] = useState({ ...user });
  const [loading, setLoading] = useState(false);
  const [allRoles, setAllRoles] = useState<{ id: string; roleName: string }[]>(
    []
  );
  const [pendingRoles, setPendingRoles] = useState<string[]>([...user.roles]);
  const [selectedRole, setSelectedRole] = useState("");

  const roleColorMap: Record<string, string> = {
    Admin: "bg-red-100 text-red-800",
    Manager: "bg-yellow-100 text-yellow-800",
    Staff: "bg-blue-100 text-blue-800",
    User: "bg-green-100 text-green-800",
    Unknown: "bg-gray-100 text-gray-800",
  };

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const roles = await getAllRoles();
        setAllRoles(roles);
      } catch (error) {
        console.error("Failed to fetch roles", error);
      }
    };
    fetchRoles();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    if (pendingRoles.length === 0) {
      toast.error("User must have at least one role");
      return;
    }

    // Validate empty or whitespace-only fields
    for (const [key, value] of Object.entries(formData)) {
      if (typeof value === "string" && value.trim() === "") {
        toast.error(
          `${
            key.charAt(0).toUpperCase() + key.slice(1)
          } cannot be empty or contain only whitespace`
        );
        return;
      }
    }

    // Check if there are any changes in the form data
    const hasFormDataChanges = Object.keys(formData).some((key) => {
      const formValue = formData[key as keyof User];
      const userValue = user[key as keyof User];
      return typeof formValue === "string"
        ? formValue.trim() !== userValue
        : formValue !== userValue;
    });

    // Check if there are any changes in roles
    const hasRoleChanges =
      pendingRoles.length !== user.roles.length ||
      pendingRoles.some((role) => !user.roles.includes(role)) ||
      user.roles.some((role) => !pendingRoles.includes(role));

    if (!hasFormDataChanges && !hasRoleChanges) {
      toast.info("No changes detected");
      onClose();
      return;
    }

    try {
      setLoading(true);

      if (hasFormDataChanges) {
        await updateUser(user.id, formData);
      }

      if (hasRoleChanges) {
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
      }

      toast.success("User updated successfully");
      onUpdate();
      onClose();
    } catch (error) {
      toast.error("Failed to update user");
    } finally {
      setLoading(false);
    }
  };

  const handlePendingUnassignRole = (roleId: string) => {
    if (pendingRoles.length <= 1) {
      toast.error("User must have at least one role");
      return;
    }
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

  const handleClear = (fieldName: string) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: "",
    }));
  };

  return (
    <Modal isOpen={true} onOpenChange={onClose} className="max-w-3xl">
      <ModalContent className="rounded-lg shadow-lg border border-gray-200 bg-white">
        <ModalHeader>Edit User</ModalHeader>
        <ModalBody>
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(String(key))}
          >
            <Tab key="profile" title="Profile">
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    isClearable
                    radius="sm"
                    variant="bordered"
                    isRequired
                    label="Full Name"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                    onClear={() => handleClear("fullName")}
                  />
                  <Input
                    isClearable
                    radius="sm"
                    variant="bordered"
                    isRequired
                    label="Username"
                    name="userName"
                    value={formData.userName}
                    onChange={handleInputChange}
                    required
                    onClear={() => handleClear("userName")}
                  />
                  <Input
                    isClearable
                    radius="sm"
                    variant="bordered"
                    isRequired
                    label="Email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    onClear={() => handleClear("email")}
                  />
                  <Select
                    variant="bordered"
                    radius="sm"
                    isRequired
                    className="w-full"
                    label="Gender"
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    defaultSelectedKeys={[formData.gender]}
                    onChange={handleInputChange}
                  >
                    {[
                      { value: "Male", label: "Male" },
                      { value: "Female", label: "Female" },
                    ].map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </Select>
                  <Input
                    variant="bordered"
                    radius="sm"
                    isRequired
                    label="Date of Birth"
                    type="date"
                    name="dob"
                    value={formData.dob.split("T")[0]}
                    onChange={handleInputChange}
                    required
                  />
                  <Input
                    isClearable
                    variant="bordered"
                    radius="sm"
                    isRequired
                    label="Phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    onClear={() => handleClear("phone")}
                  />
                  <Input
                    isClearable
                    variant="bordered"
                    radius="sm"
                    isRequired
                    label="Address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    onClear={() => handleClear("address")}
                    className="col-span-2"
                  />
                </div>
              </form>
            </Tab>
            <Tab key="roles" title="Assign & Unassign Role">
              <div className="p-4">
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {pendingRoles.map((role, index) => (
                      <div
                        key={index}
                        className={`${
                          roleColorMap[role] || roleColorMap.Unknown
                        } px-3 py-1 rounded-full flex items-center`}
                      >
                        <span>{role}</span>
                        <button
                          onClick={() => handlePendingUnassignRole(role)}
                          className="ml-2 hover:opacity-80"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <Select
                    variant="bordered"
                    size="sm"
                    radius="sm"
                    className="w-full"
                    label="Assign new role"
                    value={selectedRole}
                    defaultSelectedKeys={
                      selectedRole ? [selectedRole] : undefined
                    }
                    onChange={handlePendingAssignRole}
                  >
                    {allRoles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.roleName}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              </div>
            </Tab>
          </Tabs>
        </ModalBody>
        <ModalFooter>
          <Button radius="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            radius="sm"
            color="primary"
            isLoading={loading}
            onClick={handleSubmit}
          >
            Update
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
