import React, { useState } from "react";
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
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!formData.userName.trim()) newErrors.userName = "Username is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.password.trim()) newErrors.password = "Password is required";
    if (!formData.dob) newErrors.dob = "Date of birth is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone is required";
    if (!formData.address.trim()) newErrors.address = "Address is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fill in all required fields");
      return;
    }
    setLoading(true);
    try {
      await createUser(formData);
      toast.success("User created successfully.");
      onCreate();
      onClose();
    } catch (error) {
      console.error("Failed to create user", error);
      toast.error("Failed to create user.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full lg:w-8/12 bg-white rounded-3xl shadow-xl p-8">
        <h3 className="text-3xl font-bold mb-6">Create User</h3>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                label: "Full Name",
                name: "fullName",
                placeholder: "Enter full name",
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
                placeholder: "example@fpt.edu.vn",
                type: "email",
              },
              {
                label: "Password",
                name: "password",
                placeholder: "Password",
                type: "password",
              },
              {
                label: "Gender",
                name: "gender",
                type: "select",
                options: ["Male", "Female"],
              },
              {
                label: "Date of Birth",
                name: "dob",
                placeholder: "YYYY-MM-DD",
                type: "date",
              },
              {
                label: "Phone",
                name: "phone",
                placeholder: "Phone",
                type: "text",
              },
              {
                label: "Address",
                name: "address",
                placeholder: "Address",
                type: "text",
              },
            ].map((field, index) => (
              <label
                key={index}
                htmlFor={field.name}
                className="block rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
              >
                <span className="text-xs font-medium text-gray-700">
                  {field.label}
                </span>
                {field.type === "select" ? (
                  <select
                    id={field.name}
                    name={field.name}
                    value={formData[field.name as keyof typeof formData] || ""}
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
                  <div>
                    <input
                      type={field.type}
                      id={field.name}
                      name={field.name}
                      value={formData[field.name as keyof typeof formData] || ""}
                      onChange={handleChange}
                      className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
                      placeholder={field.placeholder}
                    />
                    {errors[field.name] && (
                      <p className="text-red-500 text-xs mt-1">{errors[field.name]}</p>
                    )}
                  </div>
                )}
              </label>
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              className="bg-gradient-to-tr from-blue-600 to-blue-300 text-white shadow-lg rounded-full px-4 py-2 mr-2"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create"}
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
      </div>
    </div>
  );
};
