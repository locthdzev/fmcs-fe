import React, { useState } from "react";
import {
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Select,
  SelectItem,
  ModalFooter,
  Button,
} from "@heroui/react";

import { createUser } from "@/api/user";
import { toast } from "react-toastify";
import { EyeFilledIcon, EyeSlashFilledIcon } from "./Icons";

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
  const [isVisible, setIsVisible] = useState(false);
  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

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

    // Validate required fields
    const requiredFields = [
      "fullName",
      "userName",
      "email",
      "password",
      "gender",
      "dob",
      "address",
      "phone",
    ];
    const emptyFields = requiredFields.filter(
      (field): field is keyof typeof formData =>
        !(field in formData) || !formData[field as keyof typeof formData]
    );
    if (emptyFields.length > 0) {
      toast.error(
        `Please fill in all required fields: ${emptyFields.join(", ")}`
      );
      return;
    }

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
    setFormData({ ...initialFormState, createdAt: new Date().toISOString() });
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
        <ModalHeader>Create User</ModalHeader>
        <ModalBody>
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
              <Input
                variant="bordered"
                radius="sm"
                isRequired
                label="Password"
                type={isVisible ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                endContent={
                  <button
                    className="focus:outline-none p-2 hover:opacity-70"
                    type="button"
                    onClick={toggleVisibility}
                  >
                    {isVisible ? (
                      <EyeFilledIcon className="text-2xl text-default-400" />
                    ) : (
                      <EyeSlashFilledIcon className="text-2xl text-default-400" />
                    )}
                  </button>
                }
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
                value={formData.dob}
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
              />
            </div>
          </form>
        </ModalBody>
        <ModalFooter>
          <Button radius="sm" onClick={handleReset}>
            Reset
          </Button>
          <Button
            radius="sm"
            color="primary"
            isLoading={loading}
            onClick={handleSubmit}
          >
            Create
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
