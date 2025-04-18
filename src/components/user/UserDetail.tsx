import React, { useState, useEffect, useContext } from "react";
import {
  Card,
  Typography,
  Tag,
  Button,
  Space,
  Spin,
  message,
  Row,
  Col,
  Image,
  Divider,
  Form,
  Input,
  Select,
  Upload,
  Popconfirm,
  Avatar,
  DatePicker,
  Radio,
} from "antd";
import dayjs from "dayjs";
import {
  getUserById,
  updateUser,
  updateProfileImage,
  updateUserImage,
  activateUsers,
  deactivateUsers,
  UserResponseDTO,
} from "@/api/user";
import { UserContext } from "@/context/UserContext";
import {
  ArrowLeftOutlined,
  FormOutlined,
  SaveOutlined,
  CloseOutlined,
  CheckCircleOutlined,
  StopOutlined,
  UserOutlined,
  CameraOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";
import type { UploadFile, UploadProps } from "antd/es/upload/interface";
import ImgCrop from "antd-img-crop";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface UserDetailProps {
  id: string;
}

export const UserDetail: React.FC<UserDetailProps> = ({ id }) => {
  const router = useRouter();
  const { edit } = router.query;
  const [form] = Form.useForm();
  const [user, setUser] = useState<UserResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [isEditing, setIsEditing] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [statusChangeLoading, setStatusChangeLoading] = useState(false);
  const userContext = useContext(UserContext);
  const [formState, setFormState] = useState({
    fullName: "",
    userName: "",
    email: "",
    gender: "",
    dob: "",
    address: "",
    phone: "",
  });

  // Custom styles for the fields
  const fieldStyles = `
    .user-detail-select .ant-select-selector {
      padding: 0 !important;
      border: none !important;
      box-shadow: none !important;
      font-size: 0.875rem !important;
    }
    
    .user-detail-select .ant-select-arrow {
      right: 0 !important;
    }
  `;

  useEffect(() => {
    if (id) {
      fetchUserDetails();
    }
  }, [id]);

  useEffect(() => {
    // If the edit query parameter is present, set editing mode to true
    if (edit === "true") {
      setIsEditing(true);
    }
  }, [edit]);

  // Update formState when the user data is loaded
  useEffect(() => {
    if (user) {
      const newState = {
        fullName: user.fullName || "",
        userName: user.userName || "",
        email: user.email || "",
        gender: user.gender || "",
        dob: user.dob || "",
        address: user.address || "",
        phone: user.phone || "",
      };

      setFormState(newState);
      form.setFieldsValue(newState);
    }
  }, [user, form]);

  const fetchUserDetails = async () => {
    setLoading(true);
    try {
      const response = await getUserById(id);
      if (response && typeof response === "object") {
        setUser(response);
        if (response.imageURL) {
          setImageUrl(response.imageURL);
        }
        form.setFieldsValue({
          fullName: response.fullName,
          userName: response.userName,
          email: response.email,
          gender: response.gender,
          dob: response.dob,
          address: response.address,
          phone: response.phone,
        });
      } else {
        console.error("Invalid response structure:", response);
        messageApi.error("Failed to fetch user details: Invalid data format");
        setUser(null);
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      messageApi.error("Failed to fetch user details");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return "-";
    return dayjs(date).format("DD/MM/YYYY");
  };

  const formatDateTime = (date: string | undefined) => {
    if (!date) return "-";
    return dayjs(date).format("DD/MM/YYYY HH:mm:ss");
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case "Active":
        return "success";
      case "Inactive":
        return "error";
      default:
        return "default";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Admin":
        return "red";
      case "Manager":
        return "orange";
      case "Healthcare Staff":
        return "blue";
      case "Canteen Staff":
        return "purple";
      case "User":
        return "green";
      default:
        return "default";
    }
  };

  const handleUpdate = async (values: any) => {
    if (!user) return;

    setSubmitLoading(true);

    try {
      // Cập nhật thông tin cơ bản của người dùng
      await updateUser(user.id, {
        fullName: values.fullName,
        userName: values.userName,
        email: values.email,
        gender: values.gender,
        dob: values.dob,
        address: values.address,
        phone: values.phone,
      });

      // Nếu có ảnh mới, cập nhật ảnh cho người dùng
      if (fileList.length > 0 && fileList[0].originFileObj) {
        try {
          await updateUserImage(user.id, fileList[0].originFileObj);
        } catch (imgError) {
          console.error("Error updating user image:", imgError);
          messageApi.error("Failed to update user image");
          setSubmitLoading(false);
          return; // Dừng quá trình nếu cập nhật ảnh thất bại
        }
      }

      // Thông báo thành công sau khi cập nhật tất cả
      messageApi.success("User updated successfully");

      setIsEditing(false);

      // Remove edit from URL without reloading
      router.replace(`/user/${id}`, undefined, { shallow: true });

      // Refresh the user details
      fetchUserDetails();
    } catch (error) {
      console.error("Error updating user:", error);
      messageApi.error("Failed to update user information");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!user) return;

    setStatusChangeLoading(true);
    try {
      await activateUsers([user.id]);
      messageApi.success("User activated successfully");
      fetchUserDetails();
    } catch (error) {
      console.error("Error activating user:", error);
      messageApi.error("Failed to activate user");
    } finally {
      setStatusChangeLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!user) return;

    setStatusChangeLoading(true);
    try {
      await deactivateUsers([user.id]);
      messageApi.success("User deactivated successfully");
      fetchUserDetails();
    } catch (error) {
      console.error("Error deactivating user:", error);
      messageApi.error("Failed to deactivate user");
    } finally {
      setStatusChangeLoading(false);
    }
  };

  // Kiểm tra xem người dùng có quyền cập nhật ảnh hay không
  const canUpdateProfileImage = (roles: string[] = []) => {
    const allowedRoles = [
      "Admin",
      "Manager",
      "Healthcare Staff",
      "Canteen Staff",
    ];
    return roles.some((role) => allowedRoles.includes(role));
  };

  // Kiểm tra xem người dùng hiện tại có vai trò chính là User không
  const isPrimaryRoleUser = (roles: string[] = []) => {
    if (roles.length === 0) return false;

    // Priority order for roles
    const priority: Record<string, number> = {
      Admin: 1,
      Manager: 2,
      "Healthcare Staff": 3,
      "Canteen Staff": 4,
      User: 5,
    };

    // Sort roles by priority
    const sortedRoles = [...roles].sort((a, b) => {
      return (priority[a] || 999) - (priority[b] || 999);
    });

    // Get primary role
    const primaryRole = sortedRoles[0];
    return primaryRole === "User";
  };

  const uploadProps: UploadProps = {
    beforeUpload: (file) => {
      const isJpgOrPng =
        file.type === "image/jpeg" || file.type === "image/png";
      if (!isJpgOrPng) {
        messageApi.error("You can only upload JPG/PNG file!");
        return Upload.LIST_IGNORE;
      }
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        messageApi.error("Image must be smaller than 2MB!");
        return Upload.LIST_IGNORE;
      }

      // Create a new file
      const newFile = new File([file], file.name, { type: file.type });

      // Create upload file object
      const uploadFile = {
        uid: Date.now().toString(),
        name: newFile.name,
        size: newFile.size,
        type: newFile.type,
        originFileObj: newFile,
      } as UploadFile;

      setFileList([uploadFile]);
      return false;
    },
    maxCount: 1,
    fileList,
    onRemove: () => {
      setFileList([]);
      return true;
    },
    listType: "picture",
    className: "upload-list-inline",
  };

  const handleFormSubmit = () => {
    handleUpdate(formState);
  };

  const renderActionButtons = () => {
    if (!user) return null;

    if (isEditing) {
      return (
        <Space>
          <Button
            icon={<CloseOutlined />}
            onClick={() => {
              setIsEditing(false);
              // Reset form state to original values
              if (user) {
                const resetState = {
                  fullName: user.fullName || "",
                  userName: user.userName || "",
                  email: user.email || "",
                  gender: user.gender || "",
                  dob: user.dob || "",
                  address: user.address || "",
                  phone: user.phone || "",
                };
                setFormState(resetState);
                form.setFieldsValue(resetState);
              }
              setFileList([]);
              // Remove edit from URL without reloading
              router.replace(`/user/${id}`, undefined, { shallow: true });
            }}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={submitLoading}
            onClick={handleFormSubmit}
          >
            Save
          </Button>
        </Space>
      );
    }

    return (
      <Space>
        {user.status === "Active" ? (
          <Popconfirm
            title="Deactivate User"
            description="Are you sure you want to deactivate this user?"
            onConfirm={handleDeactivate}
            okText="Yes"
            cancelText="No"
          >
            <Button
              danger
              icon={<StopOutlined />}
              loading={statusChangeLoading}
            >
              Deactivate
            </Button>
          </Popconfirm>
        ) : (
          <Popconfirm
            title="Activate User"
            description="Are you sure you want to activate this user?"
            onConfirm={handleActivate}
            okText="Yes"
            cancelText="No"
          >
            <Button
              icon={<CheckCircleOutlined />}
              style={{ color: "#52c41a", borderColor: "#52c41a" }}
              loading={statusChangeLoading}
            >
              Activate
            </Button>
          </Popconfirm>
        )}
        <Button
          type="primary"
          icon={<FormOutlined />}
          onClick={() => {
            setIsEditing(true);
            router.replace(`/user/${id}?edit=true`, undefined, {
              shallow: true,
            });
          }}
        >
          Edit
        </Button>
      </Space>
    );
  };

  const handleInputChange = (fieldName: string, value: any) => {
    console.log(`Setting field ${fieldName} to:`, value);
    setFormState((prev) => ({ ...prev, [fieldName]: value }));
    form.setFieldsValue({ [fieldName]: value });
  };

  const renderProfileImage = () => {
    const isUserRole = isPrimaryRoleUser(user?.roles);
    const hasPermission = canUpdateProfileImage(user?.roles);

    if (isEditing && hasPermission && !isUserRole) {
      // Editing mode and has permission (not User role)
      return (
        <div className="relative mb-4">
          {imageUrl && fileList.length === 0 ? (
            <div className="relative">
              <div
                className="rounded-full overflow-hidden"
                style={{ width: 200, height: 200 }}
              >
                <Image
                  src={imageUrl}
                  alt="User"
                  width={200}
                  height={200}
                  style={{
                    objectFit: "cover",
                    borderRadius: "50%",
                  }}
                  preview={true}
                />
              </div>
              <ImgCrop rotationSlider cropShape="round" aspect={1}>
                <Upload {...uploadProps} showUploadList={false}>
                  <Button
                    icon={<CameraOutlined />}
                    shape="circle"
                    className="absolute right-2 bottom-2 shadow-md"
                  />
                </Upload>
              </ImgCrop>
            </div>
          ) : (
            <ImgCrop rotationSlider cropShape="round" aspect={1}>
              <Upload.Dragger {...uploadProps} className="w-full">
                <p className="ant-upload-drag-icon">
                  <UserOutlined />
                </p>
                <p className="ant-upload-text">Click or drag image</p>
                <p className="ant-upload-hint">JPG/PNG (max: 2MB)</p>
              </Upload.Dragger>
            </ImgCrop>
          )}
        </div>
      );
    } else {
      // View mode or User role
      if (isUserRole) {
        // Default avatar for Users
        return (
          <div className="relative" style={{ width: 200, height: 200 }}>
            <Avatar
              icon={<UserOutlined />}
              style={{ backgroundColor: "#87d068" }}
              size={200}
            />
          </div>
        );
      } else if (user?.imageURL) {
        // Show actual image for non-User roles
        return (
          <div className="relative" style={{ width: 200, height: 200 }}>
            <Image
              src={user.imageURL}
              alt={user.fullName}
              width={200}
              height={200}
              style={{
                objectFit: "cover",
                borderRadius: "50%",
                width: "100%",
                height: "100%",
              }}
              preview={{
                mask: <EyeOutlined />,
              }}
            />
          </div>
        );
      } else {
        // Default avatar for non-User roles without an image
        return (
          <div className="relative" style={{ width: 200, height: 200 }}>
            <Avatar
              icon={<UserOutlined />}
              style={{ backgroundColor: "#1890ff" }}
              size={200}
            />
          </div>
        );
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        {contextHolder}
        <Spin size="large" tip="Loading user details..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4">
        {contextHolder}
        <div className="flex items-center gap-2 mb-4">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push("/user")}
            style={{ marginRight: "8px" }}
          >
            Back
          </Button>
          <UserOutlined style={{ fontSize: 24 }} />
          <h3 className="text-xl font-bold">User Not Found</h3>
        </div>
        <Card>
          <Text>The requested user could not be found or loaded.</Text>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4">
      {contextHolder}
      <style>{fieldStyles}</style>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push("/user")}
            style={{ marginRight: "8px" }}
          >
            Back
          </Button>
          <UserOutlined style={{ fontSize: 24 }} />
          <h3 className="text-xl font-bold">User Details</h3>
        </div>
        <div>{renderActionButtons()}</div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={24}>
          <Card
            title={<Title level={5}>User Information</Title>}
            extra={
              <Space>
                {user.roles?.map((role) => (
                  <Tag key={role} color={getRoleColor(role)}>
                    {role}
                  </Tag>
                ))}
                <Tag color={getStatusColor(user.status)}>
                  {user.status ? user.status.toUpperCase() : ""}
                </Tag>
              </Space>
            }
          >
            <Form form={form} layout="vertical">
              <Row gutter={[24, 16]}>
                <Col xs={24} md={6}>
                  <div className="flex flex-col items-center mb-4">
                    {/* User Image */}
                    {renderProfileImage()}
                  </div>
                </Col>

                <Col xs={24} md={18}>
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12}>
                      <div className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm">
                        <span className="text-xs font-medium text-gray-700">
                          Full Name
                        </span>
                        {isEditing ? (
                          <input
                            type="text"
                            name="fullName"
                            value={formState.fullName}
                            onChange={(e) => {
                              handleInputChange("fullName", e.target.value);
                            }}
                            className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
                          />
                        ) : (
                          <div className="mt-1 w-full p-0">
                            {user.fullName || "-"}
                          </div>
                        )}
                      </div>
                    </Col>
                    <Col xs={24} sm={12}>
                      <div className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm">
                        <span className="text-xs font-medium text-gray-700">
                          Username
                        </span>
                        {isEditing ? (
                          <input
                            type="text"
                            name="userName"
                            value={formState.userName}
                            onChange={(e) => {
                              handleInputChange("userName", e.target.value);
                            }}
                            className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
                          />
                        ) : (
                          <div className="mt-1 w-full p-0">
                            {user.userName || "-"}
                          </div>
                        )}
                      </div>
                    </Col>
                    <Col xs={24} sm={12}>
                      <div className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm">
                        <span className="text-xs font-medium text-gray-700">
                          Email
                        </span>
                        {isEditing ? (
                          <input
                            type="email"
                            name="email"
                            value={formState.email}
                            onChange={(e) => {
                              handleInputChange("email", e.target.value);
                            }}
                            className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
                          />
                        ) : (
                          <div className="mt-1 w-full p-0">
                            {user.email || "-"}
                          </div>
                        )}
                      </div>
                    </Col>
                    <Col xs={24} sm={12}>
                      <div className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm">
                        <span className="text-xs font-medium text-gray-700">
                          Phone
                        </span>
                        {isEditing ? (
                          <input
                            type="text"
                            name="phone"
                            value={formState.phone}
                            onChange={(e) => {
                              handleInputChange("phone", e.target.value);
                            }}
                            className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
                          />
                        ) : (
                          <div className="mt-1 w-full p-0">
                            {user.phone || "-"}
                          </div>
                        )}
                      </div>
                    </Col>
                    <Col xs={24} sm={12}>
                      <div className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm">
                        <span className="text-xs font-medium text-gray-700">
                          Gender
                        </span>
                        {isEditing ? (
                          <div className="mt-1">
                            <Radio.Group
                              value={formState.gender}
                              onChange={(e) =>
                                handleInputChange("gender", e.target.value)
                              }
                            >
                              <Radio value="Male">Male</Radio>
                              <Radio value="Female">Female</Radio>
                            </Radio.Group>
                          </div>
                        ) : (
                          <div className="mt-1 w-full p-0">
                            {user.gender || "-"}
                          </div>
                        )}
                      </div>
                    </Col>
                    <Col xs={24} sm={12}>
                      <div className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm">
                        <span className="text-xs font-medium text-gray-700">
                          Date of Birth
                        </span>
                        {isEditing ? (
                          <div className="mt-1">
                            <DatePicker
                              style={{ width: "100%", border: "none" }}
                              value={
                                formState.dob ? dayjs(formState.dob) : null
                              }
                              onChange={(date) =>
                                handleInputChange(
                                  "dob",
                                  date ? date.format("YYYY-MM-DD") : null
                                )
                              }
                            />
                          </div>
                        ) : (
                          <div className="mt-1 w-full p-0">
                            {formatDate(user.dob)}
                          </div>
                        )}
                      </div>
                    </Col>
                    <Col xs={24}>
                      <div className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm">
                        <span className="text-xs font-medium text-gray-700">
                          Address
                        </span>
                        {isEditing ? (
                          <textarea
                            name="address"
                            value={formState.address}
                            onChange={(e) => {
                              handleInputChange("address", e.target.value);
                            }}
                            className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm resize-none"
                            rows={3}
                          />
                        ) : (
                          <div className="mt-1 w-full p-0">
                            {user.address || "No address available."}
                          </div>
                        )}
                      </div>
                    </Col>

                    <Col xs={24}>
                      <Divider style={{ margin: "8px 0" }} />
                    </Col>

                    <Col xs={24} sm={12}>
                      <div className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm">
                        <span className="text-xs font-medium text-gray-700">
                          Created At
                        </span>
                        <div className="mt-1 w-full p-0">
                          {formatDateTime(user.createdAt)}
                        </div>
                      </div>
                    </Col>
                    <Col xs={24} sm={12}>
                      <div className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm">
                        <span className="text-xs font-medium text-gray-700">
                          Updated At
                        </span>
                        <div className="mt-1 w-full p-0">
                          {formatDateTime(user.updatedAt)}
                        </div>
                      </div>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
