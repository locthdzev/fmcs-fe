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
  const [pendingRoles, setPendingRoles] = useState<{id: string; roleName: string}[]>([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

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

  useEffect(() => {
    if (allRoles.length > 0) {
      const uniqueRoles = [...new Set(user.roles)];
      const mappedRoles = uniqueRoles.map(roleName => {
        const role = allRoles.find(r => r.roleName === roleName);
        return role || { id: '', roleName };
      });
      
      const uniqueMappedRoles = mappedRoles.filter((role, index, self) => 
        index === self.findIndex(r => r.id === role.id)
      );
      
      setPendingRoles(uniqueMappedRoles);
    }
  }, [allRoles, user.roles]);

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
      pendingRoles.some((role) => !user.roles.includes(role.roleName)) ||
      user.roles.some((role) => !pendingRoles.some(r => r.roleName === role));

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
        const currentRoleNames = user.roles;
        const pendingRoleNames = pendingRoles.map(r => r.roleName);

        const rolesToAdd = pendingRoles.filter(
          (role) => !currentRoleNames.includes(role.roleName)
        );
        const rolesToRemove = allRoles.filter(
          (role) => currentRoleNames.includes(role.roleName) && !pendingRoleNames.includes(role.roleName)
        );

        for (const role of rolesToAdd) {
          await assignRoleToUser(user.id, role.id);
        }

        for (const role of rolesToRemove) {
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

  const handlePendingUnassignRole = (roleToRemove: {id: string; roleName: string}) => {
    if (pendingRoles.length <= 1) {
      toast.error("User must have at least one role");
      return;
    }
    setPendingRoles(pendingRoles.filter(role => role.id !== roleToRemove.id));
  };

  const handlePendingAssignRole = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.preventDefault();
    const roleId = e.target.value;
    if (roleId && !pendingRoles.some(r => r.id === roleId)) {
      const role = allRoles.find((r) => r.id === roleId);
      if (role) {
        setPendingRoles([...pendingRoles, role]);
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

  // Thêm hàm debug
  const debugEvent = (event: any, source: string) => {
    console.log(`[DEBUG ${source}]`, {
      type: event.type,
      target: event.target,
      currentTarget: event.currentTarget,
      defaultPrevented: event.defaultPrevented,
    });
  };

  // Thêm hàm xử lý thêm role mới
  const handleAddRole = (roleToAdd: { id: string; roleName: string }) => {
    if (!pendingRoles.some(r => r.id === roleToAdd.id)) {
      setPendingRoles([...pendingRoles, roleToAdd]);
      setShowRoleDropdown(false);
    }
  };

  return (
    <Modal isOpen={true} onOpenChange={onClose} className="max-w-3xl max-h-[90vh]">
      <ModalContent className="rounded-lg shadow-lg border border-gray-200 bg-white">
        <ModalHeader>Edit User</ModalHeader>
        <ModalBody className="max-h-[70vh] overflow-y-auto">
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
                      <SelectItem key={item.value} id={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </Select>
                  <Input
                    variant="bordered"
                    radius="sm"
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
                  <div className="flex flex-wrap gap-2 mb-4">
                    {pendingRoles.map((role, index) => (
                      <div
                        key={index}
                        className={`${
                          roleColorMap[role.roleName] || roleColorMap.Unknown
                        } px-3 py-1 rounded-full flex items-center`}
                      >
                        <span>{role.roleName}</span>
                        <button
                          onClick={() => handlePendingUnassignRole(role)}
                          className="ml-2 hover:opacity-80"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="relative">
                    <Button 
                      variant="bordered" 
                      radius="sm" 
                      className="w-full flex justify-between"
                      onClick={() => setIsRoleModalOpen(true)}
                    >
                      <span>Assign new role</span>
                      <span>▼</span>
                    </Button>
                    
                    <Modal 
                      isOpen={isRoleModalOpen} 
                      onOpenChange={(open) => setIsRoleModalOpen(open)}
                      className="max-w-md"
                    >
                      <ModalContent className="rounded-lg shadow-lg border border-gray-200 bg-white">
                        <ModalHeader>Select Role</ModalHeader>
                        <ModalBody>
                          <div className="grid grid-cols-1 gap-2">
                            {allRoles
                              .filter(role => !pendingRoles.some(pr => pr.id === role.id))
                              .map((role) => (
                                <button 
                                  key={role.id}
                                  className="px-4 py-2 text-left hover:bg-gray-100 rounded-md"
                                  onClick={() => {
                                    handleAddRole(role);
                                    setIsRoleModalOpen(false);
                                  }}
                                >
                                  {role.roleName}
                                </button>
                              ))}
                          </div>
                        </ModalBody>
                        <ModalFooter>
                          <Button radius="sm" onClick={() => setIsRoleModalOpen(false)}>
                            Đóng
                          </Button>
                        </ModalFooter>
                      </ModalContent>
                    </Modal>
                  </div>
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
