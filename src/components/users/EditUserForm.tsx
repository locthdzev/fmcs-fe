import React, { useEffect, useState } from "react";
import {
  updateUser,
  assignRoleToUser,
  unassignRoleFromUser,
  getAllRoles,
} from "@/api/user";
import { toast } from "react-toastify";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Select,
  SelectItem,
  Tab,
  Tabs,
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

    try {
      setLoading(true);
      await updateUser(user.id, formData);

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

  return (
    <Modal isOpen={true} onOpenChange={onClose}>
      <ModalContent className="max-w-[800px]">
        <ModalHeader className="border-b pb-3">Edit User</ModalHeader>
        <ModalBody>
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(String(key))}
          >
            <Tab key="profile" title="Profile">
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                  />
                  <Input
                    label="Username"
                    name="userName"
                    value={formData.userName}
                    onChange={handleInputChange}
                    required
                  />
                  <Input
                    label="Email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                  <Select
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
                    label="Date of Birth"
                    type="date"
                    name="dob"
                    value={formData.dob.split("T")[0]}
                    onChange={handleInputChange}
                    required
                  />
                  <Input
                    label="Phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                  <Input
                    className="col-span-2"
                    label="Address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <Button type="button" variant="flat" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" color="primary" isLoading={loading}>
                    Update
                  </Button>
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
                    isRequired
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
                <div className="flex justify-end gap-2 mt-6">
                  <Button
                    type="button"
                    variant="flat"
                    onClick={() => {
                      setPendingRoles([...user.roles]);
                      onClose();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    color="primary"
                    isLoading={loading}
                  >
                    Save
                  </Button>
                </div>
              </div>
            </Tab>
          </Tabs>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
