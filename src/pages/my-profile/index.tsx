import { useEffect, useState } from "react";
import { getUserProfile, UserProfile, updateUser, updateProfileImage } from "@/api/user";
import { changePassword } from "@/api/auth";
import router from "next/router";
import Cookies from "js-cookie";
import { Button, Form, Input, Modal, Upload, message, Image, Spin } from "antd";
import { LockIcon } from "@/components/users/Icons";
import { UploadOutlined, LoadingOutlined, CameraOutlined, EyeOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd/es/upload";

export default function UserProfilePage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [formValues, setFormValues] = useState<Partial<UserProfile>>({});
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);
  const [uploadLoading, setUploadLoading] = useState<boolean>(false);
  const [previewVisible, setPreviewVisible] = useState<boolean>(false);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

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
        messageApi.error("Failed to fetch user profile.");
        router.replace("/");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [messageApi]);

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
      messageApi.success("User information updated successfully.");
      setUserProfile({ ...userProfile, ...formValues });
      setIsEditing(false);
    } catch (error) {
      messageApi.error("Failed to update user information.");
    }
  };

  const handleChangePassword = async (values: any) => {
    try {
      const result = await changePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });

      if (result?.isSuccess) {
        messageApi.success("Password changed successfully.");
        setIsChangingPassword(false);
        form.resetFields();
      } else {
        messageApi.error(result?.message || "Failed to change password.");
      }
    } catch (error: any) {
      messageApi.error(
        error.response?.data?.message || "Failed to change password."
      );
    }
  };

  const beforeUpload = (file: File) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/gif';
    if (!isJpgOrPng) {
      messageApi.error('You can only upload JPG/PNG/GIF files!');
      return false;
    }
    
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      messageApi.error('Image must be smaller than 2MB!');
      return false;
    }
    
    return isJpgOrPng && isLt2M;
  };

  const handleUpload = async (options: any) => {
    const { file, onSuccess, onError, onProgress } = options;
    
    // Kiểm tra điều kiện Healthcare Staff
    if (!userProfile?.roles.includes("Healthcare Staff")) {
      messageApi.error("Only Healthcare Staff can update profile image.");
      onError("Permission denied");
      return;
    }
    
    setUploadLoading(true);
    
    try {
      // Trả về progress giả lập cho UX tốt hơn
      let percent = 0;
      const interval = setInterval(() => {
        percent = Math.min(99, percent + 5);
        onProgress({ percent });
      }, 100);
      
      const result = await updateProfileImage(file);
      
      clearInterval(interval);
      
      if (result.isSuccess) {
        messageApi.success("Profile image updated successfully.");
        
        // Tạo URL tạm thời cho ảnh mới để hiển thị ngay lập tức
        const newImageURL = result.data.ImageURL;
        
        // Cập nhật imageURL trong profile
        setUserProfile((prevProfile) => {
          if (!prevProfile) return null;
          return {
            ...prevProfile,
            imageURL: newImageURL
          };
        });
        
        onSuccess(result, file);
      } else {
        messageApi.error(result.message || "Failed to update profile image.");
        onError(result);
      }
    } catch (error: any) {
      messageApi.error(
        error.response?.data?.message || "Failed to update profile image."
      );
      onError(error);
    } finally {
      setUploadLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" tip="Loading..." />
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

  // Kiểm tra xem người dùng có phải là Healthcare Staff hay không
  const isHealthcareStaff = userProfile.roles.includes("Healthcare Staff");

  return (
    <div className="flex justify-center p-6">
      {contextHolder}
      <div className="w-full lg:w-8/12 bg-white rounded-3xl shadow-xl p-8">
        <h3 className="text-2xl font-bold mb-4">
          {isEditing ? "Edit Profile" : "User Profile"}
        </h3>
        
        {/* Profile Image Section - Chỉ hiển thị cho Healthcare Staff */}
        {isHealthcareStaff && (
          <div className="mb-8 flex flex-col items-center">
            <div className="relative">
              <div 
                className="relative w-32 h-32 rounded-full overflow-hidden cursor-pointer"
                onClick={() => {
                  if (userProfile.imageURL) {
                    setPreviewVisible(true);
                  }
                }}
              >
                {userProfile.imageURL ? (
                  <img
                    src={userProfile.imageURL}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                    <span className="text-gray-500">No Image</span>
                  </div>
                )}
              </div>

              {/* Camera icon for upload */}
              <Upload
                name="imageFile"
                showUploadList={false}
                customRequest={handleUpload}
                beforeUpload={beforeUpload}
                className="absolute -right-2 -bottom-2"
              >
                <div className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full cursor-pointer shadow-md transition-colors duration-300">
                  {uploadLoading 
                    ? <LoadingOutlined className="text-lg" /> 
                    : <CameraOutlined className="text-lg" />
                  }
                </div>
              </Upload>
            </div>

            {/* Image preview modal */}
            {userProfile.imageURL && (
              <Image
                src={userProfile.imageURL}
                style={{ display: 'none' }}
                preview={{
                  visible: previewVisible,
                  onVisibleChange: (vis) => setPreviewVisible(vis),
                  src: userProfile.imageURL,
                }}
              />
            )}
          </div>
        )}
        
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
