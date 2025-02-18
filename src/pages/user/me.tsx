import { useEffect, useState } from "react";
import { getUserProfile, UserProfile, updateUser } from "@/api/user";
import { changePassword } from "@/api/auth"; // Import changePassword function
import { toast } from "react-toastify";
import router from "next/router";
import Cookies from "js-cookie";
import { Button, Form, Input } from "antd";
import { LockIcon } from "@/components/users/Icons";

export default function UserProfilePage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [formValues, setFormValues] = useState<Partial<UserProfile>>({});
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);
  const [form] = Form.useForm();

  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = Cookies.get("token");
      if (!token) {
        router.replace("/");
        return;
      }

      try {
        const data = await getUserProfile();
        const formattedData = {
          ...data,
          dob: new Date(data.dob).toISOString().split("T")[0],
        };
        setUserProfile(data);
        setFormValues(formattedData);
      } catch (error: any) {
        toast.error("Failed to fetch user profile.");
        router.replace("/");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!userProfile) return;
    try {
      const result = await updateUser(userProfile.id, formValues);
      toast.success("User information updated successfully.");
      setUserProfile({ ...userProfile, ...formValues });
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to update user information.");
    }
  };

  const handleChangePassword = async (values: any) => {
    try {
      const result = await changePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });

      if (result?.isSuccess) {
        toast.success("Password changed successfully.");
        setIsChangingPassword(false);
        form.resetFields();
      } else {
        toast.error(result?.message || "Failed to change password.");
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to change password."
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl font-semibold">Loading...</div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl font-semibold text-red-500">
          Failed to load user profile.
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center p-6">
      <div className="w-full lg:w-8/12 bg-white rounded-3xl shadow-xl p-8">
        <h3 className="text-2xl font-bold mb-4">
          {isEditing ? "Edit Profile" : "User Profile"}
        </h3>
        {isEditing ? (
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
                    value={formValues[field.name as keyof UserProfile] || ""}
                    onChange={handleInputChange}
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
                    value={String(
                      formValues[field.name as keyof UserProfile] || ""
                    )}
                    onChange={handleInputChange}
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
              <span className="text-xs font-medium text-gray-700">Address</span>
              <input
                type="text"
                id="address"
                name="address"
                value={String(formValues.address || "")}
                onChange={handleInputChange}
                className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
                placeholder="Address"
              />
            </label>
          </div>
        ) : (
          <div className="col-span-7 space-y-4 text-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: "Full Name", value: userProfile.fullName },
                { label: "Username", value: userProfile.userName || "N/A" },
                { label: "Email", value: userProfile.email },
                { label: "Gender", value: userProfile.gender },
                {
                  label: "Date of Birth",
                  value: new Date(userProfile.dob).toLocaleDateString("vi-VN"),
                },
                { label: "Phone", value: userProfile.phone },
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
              <label className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm md:col-span-2">
                <span className="text-xs font-medium text-gray-700">
                  Address
                </span>
                <div className="mt-1 w-full border-none p-0 sm:text-sm">
                  {userProfile.address}
                </div>
              </label>
            </div>
          </div>
        )}
        <div className="mt-6 flex justify-end">
          {isEditing ? (
            <>
              <Button
                className="mr-2"
                onClick={() => {
                  setIsEditing(false);
                }}
              >
                Cancel
              </Button>
              <Button
                className="bg-orange-500 border-orange-500 text-white"
                onClick={handleSave}
              >
                Save
              </Button>
            </>
          ) : (
            <Button
              className="bg-orange-500 border-orange-500 text-white"
              onClick={() => setIsEditing(true)}
            >
              Change information
            </Button>
          )}
        </div>
        <div className="mt-6 border-t border-gray-200 pt-2">
          <h3 className="text-xl font-bold mb-2">Account & Security</h3>
          <div className="flex items-center">
            <span className="mr-2">
              <LockIcon />
            </span>
            <span className="mr-2 font-bold italic">
              Change account password
            </span>
            <div className="ml-auto">
              <Button
                className="bg-orange-500 border-orange-500 text-white"
                onClick={() => {
                  setIsChangingPassword(!isChangingPassword);
                  if (!isChangingPassword) {
                    form.resetFields();
                  }
                }}
              >
                Change password
              </Button>
            </div>
          </div>
          <div className="text-gray-500 mt-2 italic">
            Use strong passwords for security!
          </div>
          {isChangingPassword && (
            <div className="mt-4 p-4 border border-gray-300 rounded-lg shadow-md">
              <Form
                form={form}
                onFinish={handleChangePassword}
                layout="vertical"
              >
                <Form.Item
                  name="oldPassword"
                  label="Old Password"
                  rules={[
                    {
                      required: true,
                      message: "Please input your old password!",
                    },
                  ]}
                >
                  <Input.Password placeholder="Enter your old password" />
                </Form.Item>

                <Form.Item
                  name="newPassword"
                  label="New Password"
                  rules={[
                    {
                      required: true,
                      message: "Please input your new password!",
                    },
                  ]}
                >
                  <Input.Password placeholder="Enter your new password" />
                </Form.Item>

                <Form.Item
                  name="confirmPassword"
                  label="Confirm Password"
                  dependencies={["newPassword"]}
                  rules={[
                    {
                      required: true,
                      message: "Please confirm your password!",
                    },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue("newPassword") === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(
                          new Error("The two passwords do not match!")
                        );
                      },
                    }),
                  ]}
                >
                  <Input.Password placeholder="Confirm your new password" />
                </Form.Item>

                <Form.Item className="flex justify-end mb-0">
                  <Button
                    className="mr-2"
                    onClick={() => {
                      setIsChangingPassword(false);
                      form.resetFields();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    htmlType="submit"
                    className="bg-orange-500 border-orange-500 text-white"
                  >
                    Submit
                  </Button>
                </Form.Item>
              </Form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
