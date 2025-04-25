import { useEffect, useState, useContext } from "react";
import {
  getUserProfile,
  UserProfile,
  updateUser,
  updateProfileImage,
} from "@/api/user";
import { changePassword } from "@/api/auth";
import router from "next/router";
import Cookies from "js-cookie";
import {
  Button,
  Form,
  Input,
  Modal,
  Upload,
  message,
  Image,
  Spin,
  Divider,
  Typography,
} from "antd";
import { LockIcon } from "@/components/users/Icons";
import {
  UploadOutlined,
  LoadingOutlined,
  CameraOutlined,
  EyeOutlined,
  SecurityScanOutlined,
  LockOutlined,
} from "@ant-design/icons";
import type { UploadProps } from "antd/es/upload";
import { UserContext } from "@/context/UserContext";
import ImgCrop from "antd-img-crop";

// Định nghĩa style cho animation
const spinAnimation = {
  animation: "spin 15s linear infinite",
};

// Định nghĩa keyframes trong style tag
const styleTag = `
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

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
  const userContext = useContext(UserContext);

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
        // Xử lý các trường hợp lỗi cụ thể
        if (result?.message?.toLowerCase().includes("old password")) {
          messageApi.error("The old password is incorrect. Please try again.");
        } else if (result?.message?.toLowerCase().includes("same")) {
          messageApi.error(
            "The new password cannot be the same as the old password."
          );
        } else if (result?.message?.toLowerCase().includes("requirements")) {
          messageApi.error(
            "The new password does not meet security requirements. Password must be at least 8 characters long and contain a mix of letters, numbers, and special characters."
          );
        } else {
          messageApi.error(
            result?.message || "Failed to change password. Please try again."
          );
        }
      }
    } catch (error: any) {
      // Xử lý lỗi từ API response
      const errorMessage = error.response?.data?.message;
      if (errorMessage?.toLowerCase().includes("old password")) {
        messageApi.error("The old password is incorrect. Please try again.");
      } else if (errorMessage?.toLowerCase().includes("same")) {
        messageApi.error(
          "The new password cannot be the same as the old password."
        );
      } else if (errorMessage?.toLowerCase().includes("requirements")) {
        messageApi.error(
          "The new password does not meet security requirements. Password must be at least 8 characters long and contain a mix of letters, numbers, and special characters."
        );
      } else {
        messageApi.error(
          errorMessage || "Failed to change password. Please try again."
        );
      }
    }
  };

  const beforeUpload = (file: File) => {
    const isJpgOrPng =
      file.type === "image/jpeg" ||
      file.type === "image/png" ||
      file.type === "image/gif";
    if (!isJpgOrPng) {
      messageApi.error("You can only upload JPG/PNG/GIF files!");
      return false;
    }

    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      messageApi.error("Image must be smaller than 2MB!");
      return false;
    }

    return isJpgOrPng && isLt2M;
  };

  // Kiểm tra xem người dùng có quyền thay đổi ảnh hay không
  const canChangeProfileImage = (roles: string[]) => {
    const allowedRoles = [
      "Admin",
      "Manager",
      "Healthcare Staff",
      "Canteen Staff",
    ];
    return roles.some((role) => allowedRoles.includes(role));
  };

  const handleUpload = async (options: any) => {
    const { file, onSuccess, onError, onProgress } = options;

    // Kiểm tra quyền thay đổi ảnh
    if (!canChangeProfileImage(userProfile?.roles || [])) {
      messageApi.error(
        "Only Admin, Manager, Healthcare Staff and Canteen Staff can update profile image."
      );
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

      console.log("Update profile image result:", result); // Log toàn bộ kết quả trả về

      // Kiểm tra cấu trúc response từ API
      if (result) {
        let imageURL = null;

        // Kiểm tra các trường hợp có thể chứa URL ảnh
        if (result.data?.ImageURL) {
          imageURL = result.data.ImageURL;
        } else if (result.data?.imageURL) {
          imageURL = result.data.imageURL;
        } else if (result.data?.imageUrl) {
          imageURL = result.data.imageUrl;
        } else if (
          typeof result.data === "string" &&
          result.data.startsWith("http")
        ) {
          imageURL = result.data;
        } else if (result.ImageURL) {
          imageURL = result.ImageURL;
        } else if (result.imageURL) {
          imageURL = result.imageURL;
        } else if (result.imageUrl) {
          imageURL = result.imageUrl;
        }

        if (imageURL) {
          // Thêm timestamp để đảm bảo URL luôn mới và browser không cache ảnh cũ
          const timestampedURL = imageURL.includes("?")
            ? `${imageURL}&t=${new Date().getTime()}`
            : `${imageURL}?t=${new Date().getTime()}`;

          // Cập nhật imageURL trong profile
          setUserProfile((prevProfile) => {
            if (!prevProfile) return null;
            return {
              ...prevProfile,
              imageURL: timestampedURL,
            };
          });

          // Cập nhật imageURL trong UserContext
          if (userContext) {
            // Cập nhật hình ảnh người dùng trong context
            userContext.updateUserImage(timestampedURL);

            // Sử dụng forceUpdate để bắt buộc re-render các component sử dụng context
            userContext.forceUpdate();
          }

          // Hiển thị thông báo thành công sau khi đã cập nhật xong
          messageApi.success("Profile image updated successfully.");

          // Log để kiểm tra giá trị mới của ảnh
          console.log("New profile image set:", timestampedURL);

          onSuccess(result, file);
        } else {
          console.error("No image URL found in response:", result);
          // Nếu không tìm thấy URL trong response, gọi API getUserProfile để lấy URL mới nhất
          try {
            const userProfileData = await getUserProfile();
            if (userProfileData.imageURL) {
              const timestampedURL = userProfileData.imageURL.includes("?")
                ? `${userProfileData.imageURL}&t=${new Date().getTime()}`
                : `${userProfileData.imageURL}?t=${new Date().getTime()}`;

              setUserProfile((prevProfile) => ({
                ...prevProfile!,
                imageURL: timestampedURL,
              }));

              if (userContext) {
                userContext.updateUserImage(timestampedURL);
                userContext.forceUpdate();
              }

              messageApi.success("Profile image updated successfully.");
              onSuccess(result, file);
            } else {
              messageApi.warning(
                "Image updated but URL not returned. Please reload the page."
              );
              onSuccess(result, file);
            }
          } catch (error) {
            console.error("Error fetching updated profile:", error);
            messageApi.warning(
              "Image updated but URL not returned. Please reload the page."
            );
            onSuccess(result, file);
          }
        }
      } else {
        console.error("Failed response structure:", result);
        messageApi.error("Failed to update profile image.");
        onError(result);
      }
    } catch (error: any) {
      console.error("Error during profile image update:", error);
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

  // Kiểm tra quyền thay đổi ảnh
  const canUpdateImage = canChangeProfileImage(userProfile.roles);

  return (
    <>
      <style>{styleTag}</style>
      <div className="flex justify-center p-6">
        {contextHolder}
        <div className="w-full lg:w-8/12 bg-white rounded-3xl shadow-xl p-8">
          <h3 className="text-2xl font-bold mb-4">
            {isEditing ? "Edit Profile" : "User Profile"}
          </h3>

          {/* Profile Image Section - Hiển thị cho các role được phép */}
          {canUpdateImage && (
            <div className="mb-8 flex flex-col items-center">
              <div className="relative">
                {/* Outer glow effect */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 blur-lg opacity-30"></div>

                {/* Decorative ring - với animation inline */}
                <div
                  className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"
                  style={spinAnimation}
                ></div>

                {/* Main container with white border */}
                <div className="relative p-1 rounded-full bg-white shadow-xl">
                  <div
                    className="relative w-32 h-32 rounded-full overflow-hidden cursor-pointer ring-4 ring-white"
                    onClick={() => {
                      if (userProfile.imageURL) {
                        setPreviewVisible(true);
                      }
                    }}
                  >
                    {userProfile.imageURL ? (
                      <img
                        key={userProfile.imageURL}
                        src={userProfile.imageURL}
                        alt="Profile"
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-300 flex items-center justify-center">
                        <span className="text-gray-500">No Image</span>
                      </div>
                    )}
                  </div>

                  {/* Camera icon for upload with image cropping */}
                  <ImgCrop
                    rotationSlider
                    quality={1}
                    modalTitle="Edit Profile Image"
                    modalOk="Upload"
                    modalCancel="Cancel"
                    showGrid
                    cropShape="round"
                    aspect={1}
                  >
                    <Upload
                      name="imageFile"
                      showUploadList={false}
                      customRequest={handleUpload}
                      beforeUpload={beforeUpload}
                      className="absolute -right-2 -bottom-2 z-10"
                    >
                      <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-full cursor-pointer shadow-lg transition-all duration-300 hover:scale-110">
                        {uploadLoading ? (
                          <LoadingOutlined className="text-lg" />
                        ) : (
                          <CameraOutlined className="text-lg" />
                        )}
                      </div>
                    </Upload>
                  </ImgCrop>
                </div>
              </div>

              {/* Image preview modal */}
              {userProfile.imageURL && (
                <Image
                  src={userProfile.imageURL}
                  alt="Preview"
                  style={{ display: "none" }}
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
                <span className="text-xs font-medium text-gray-700">
                  Address
                </span>
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
                    value: new Date(userProfile.dob).toLocaleDateString(
                      "vi-VN"
                    ),
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
          <div className="mt-6 pt-2">
            <Divider orientation="left">
              <div className="flex items-center gap-2">
                <SecurityScanOutlined style={{ fontSize: "24px" }} />
                <Typography.Title level={5} style={{ margin: 0 }}>
                  Account & Security
                </Typography.Title>
              </div>
            </Divider>
            <div className="flex items-center">
              <span className="mr-2">
                <LockOutlined style={{ fontSize: "20px" }} />
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
                          if (
                            !value ||
                            getFieldValue("newPassword") === value
                          ) {
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
    </>
  );
}
