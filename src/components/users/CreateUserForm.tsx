import React, { useState } from "react";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Select,
  SelectItem,
} from "@heroui/react";
import { createUser } from "@/api/user";
import { toast } from "react-toastify";

interface CreateUserFormProps {
  onClose: () => void;
  onCreate: () => void;
}

const initialFormState = {
  fullName: "",
  userName: "",
  email: "",
  password: "",
  gender: "Male",
  dob: "",
  address: "",
  phone: "",
  createdAt: new Date().toISOString(),
  status: "Active",
};

export const CreateUserForm: React.FC<CreateUserFormProps> = ({
  onClose,
  onCreate,
}) => {
  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);

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

    try {
      setLoading(true);
      await createUser(formData);
      toast.success("User created successfully");
      onCreate();
      onClose();
    } catch (error) {
      toast.error("Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData(initialFormState);
  };

  return (
    <Modal isOpen={true} onOpenChange={onClose}>
      <ModalContent className="max-w-[800px]">
        <ModalHeader className="border-b pb-3">Create User</ModalHeader>
        <ModalBody>
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
              <Input
                label="Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
              <Select
                className="w-full"
                label="Gender"
                id="gender"
                name="gender"
                value={formData.gender}
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
                value={formData.dob}
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
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button type="button" variant="flat" onClick={handleReset}>
                Reset
              </Button>
              <Button type="submit" color="primary" isLoading={loading}>
                Create
              </Button>
            </div>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
