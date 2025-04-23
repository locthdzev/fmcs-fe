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
  Table,
  Tooltip,
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
  assignRoleToUser,
  unassignRoleFromUser,
  getAllRoles,
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
  SafetyOutlined,
  ReloadOutlined,
  PlusOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";
import type { UploadFile, UploadProps } from "antd/es/upload/interface";
import ImgCrop from "antd-img-crop";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface UserDetailProps {
  id: string;
}

// Thêm interface cho role
interface Role {
  id: string;
  roleName: string;
  description?: string;
  status?: string;
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
  
  // Role management states
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [roleLoading, setRoleLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [roleActionLoading, setRoleActionLoading] = useState(false);

  // State để theo dõi quyền hạn của người dùng hiện tại
  const [hasEditPermission, setHasEditPermission] = useState<boolean>(false);
  const [hasRoleManagePermission, setHasRoleManagePermission] = useState<boolean>(false);
  const [isAuthorizedUser, setIsAuthorizedUser] = useState<boolean>(false);
  const [isRegularUser, setIsRegularUser] = useState<boolean>(false);

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
    
    .role-table .ant-table-thead > tr > th {
      background-color: #f0f5ff;
      font-weight: 600;
    }
    
    .role-table .ant-tag {
      font-weight: 500;
    }
  `;

  useEffect(() => {
    if (id) {
      fetchUserDetails();
      fetchAllRoles();
    }
  }, [id]);

  useEffect(() => {
    // If the edit query parameter is present, set editing mode to true
    if (edit === "true") {
      // Chỉ cho phép chỉnh sửa nếu có quyền
      if (hasEditPermission) {
        setIsEditing(true);
      } else {
        // Nếu không có quyền, chuyển hướng về URL bình thường
        router.replace(`/user/${id}`, undefined, { shallow: true });
        
        // Chỉ hiển thị thông báo lỗi cho Admin và Manager
        if (isAuthorizedUser) {
          messageApi.error("You don't have permission to edit this user");
        }
      }
    }
  }, [edit, hasEditPermission, id, router, messageApi, isAuthorizedUser]);

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

  // Thêm log để kiểm tra dữ liệu vai trò
  useEffect(() => {
    console.log("All roles:", allRoles);
  }, [allRoles]);

  // Thêm useEffect để kiểm tra quyền của người dùng hiện tại
  useEffect(() => {
    // Khi userContext đã được load, thiết lập isRegularUser ngay lập tức
    if (userContext?.user) {
      const currentUserRoles = userContext.user.role || [];
      // Kiểm tra xem người dùng hiện tại có phải là User không - còn phụ thuộc vào cấu trúc mảng vai trò 
      // Ví dụ ["User"] hoặc ["User", "OtherRole"] - thay đổi điều kiện kiểm tra
      const isCurrentUserJustUser = currentUserRoles.includes("User");
      setIsRegularUser(isCurrentUserJustUser);
      
      // Chỉ Admin và Manager mới có quyền edit và quản lý roles
      const isCurrentUserAdmin = currentUserRoles.includes("Admin");
      const isCurrentUserManager = currentUserRoles.includes("Manager");
      
      // Đánh dấu người dùng hiện tại có phải là Admin hoặc Manager không
      setIsAuthorizedUser(isCurrentUserAdmin || isCurrentUserManager);
      
      console.log('UserContext roles:', currentUserRoles);
      console.log('Is regular user (has User role):', isCurrentUserJustUser);
    }
  }, [userContext?.user]);

  // Debug thông tin sau mỗi render
  useEffect(() => {
    console.log('Current state - isRegularUser:', isRegularUser);
    console.log('Current state - isAuthorizedUser:', isAuthorizedUser);
  }, [isRegularUser, isAuthorizedUser]);

  // Thêm useEffect để kiểm tra quyền của người dùng hiện tại khi có thông tin user
  useEffect(() => {
    // Khi user và userContext đã được load
    if (user && userContext?.user) {
      const currentUserRoles = userContext.user.role || [];
      const targetUserRoles = user.roles || [];
      
      // Kiểm tra xem người dùng đang xem có phải là Admin hoặc Manager không
      const isTargetUserAdmin = targetUserRoles.includes("Admin");
      const isTargetUserManager = targetUserRoles.includes("Manager");

      const isCurrentUserAdmin = currentUserRoles.includes("Admin");
      const isCurrentUserManager = currentUserRoles.includes("Manager");

      // Admin có toàn quyền
      if (isCurrentUserAdmin) {
        setHasEditPermission(true);
        setHasRoleManagePermission(true);
      } 
      // Manager không được phép edit hoặc thay đổi trạng thái của Admin hoặc Manager khác
      else if (isCurrentUserManager) {
        if (isTargetUserAdmin || isTargetUserManager) {
          setHasEditPermission(false);
          setHasRoleManagePermission(false);
        } else {
          setHasEditPermission(true); 
          setHasRoleManagePermission(true);
        }
      } 
      // Các vai trò khác (Healthcare Staff, Canteen Staff, User) không có quyền
      else {
        setHasEditPermission(false);
        setHasRoleManagePermission(false);
      }
    }
  }, [user, userContext?.user]);

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

  const fetchAllRoles = async () => {
    try {
      setRoleLoading(true);
      const roles = await getAllRoles();
      console.log("Roles fetched from API:", roles);
      setAllRoles(roles);
    } catch (error) {
      console.error("Error fetching roles:", error);
      messageApi.error("Failed to fetch roles");
    } finally {
      setRoleLoading(false);
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
    
    // Kiểm tra quyền trước khi thực hiện cập nhật
    if (!hasEditPermission) {
      // Chỉ hiển thị thông báo lỗi cho Admin và Manager
      if (isAuthorizedUser) {
        messageApi.error("You don't have permission to update this user");
      }
      setIsEditing(false);
      router.replace(`/user/${id}`, undefined, { shallow: true });
      return;
    }

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
    
    // Kiểm tra quyền trước khi kích hoạt
    if (!hasEditPermission) {
      // Chỉ hiển thị thông báo lỗi cho Admin và Manager
      if (isAuthorizedUser) {
        messageApi.error("You don't have permission to activate this user");
      }
      return;
    }

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
    
    // Kiểm tra quyền trước khi vô hiệu hóa
    if (!hasEditPermission) {
      // Chỉ hiển thị thông báo lỗi cho Admin và Manager
      if (isAuthorizedUser) {
        messageApi.error("You don't have permission to deactivate this user");
      }
      return;
    }

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

    // Chỉ hiển thị các nút hành động nếu người dùng là Admin hoặc Manager
    if (!isAuthorizedUser) {
      return null;
    }

    return (
      <Space>
        {hasEditPermission ? (
          <>
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
          </>
        ) : (
          <Text type="secondary" italic>
            <InfoCircleOutlined /> You don't have permission to edit this user
          </Text>
        )}
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

  const handleUpdateRole = async () => {
    if (!user || !selectedRole || !hasRoleManagePermission) return;
    
    try {
      setRoleActionLoading(true);
      // Tìm role id dựa trên roleName đã chọn
      const roleToAssign = allRoles.find(role => role.roleName === selectedRole);
      if (!roleToAssign) {
        messageApi.error("Role not found");
        setRoleActionLoading(false);
        return;
      }
      
      // Kiểm tra quyền: Manager không được gán vai trò Admin hoặc Manager
      const currentUserRoles = userContext?.user?.role || [];
      const isCurrentUserManager = currentUserRoles.includes("Manager");
      
      if (isCurrentUserManager && (roleToAssign.roleName === "Admin" || roleToAssign.roleName === "Manager")) {
        messageApi.error("You don't have permission to assign Admin or Manager roles");
        setRoleActionLoading(false);
        return;
      }
      
      // Lấy vai trò hiện tại nếu có
      const currentRole = user.roles && user.roles.length > 0 ? user.roles[0] : null;
      const currentRoleData = currentRole ? allRoles.find(role => role.roleName === currentRole) : null;
      
      // Kiểm tra thêm một lần nữa, không cho phép Manager chuyển người dùng từ Admin/Manager sang các vai trò khác
      if (isCurrentUserManager && (currentRole === "Admin" || currentRole === "Manager")) {
        messageApi.error("You don't have permission to change roles for Admin or Manager accounts");
        setRoleActionLoading(false);
        return;
      }
      
      // Nếu có vai trò hiện tại, xóa vai trò cũ trước
      if (currentRoleData) {
        await unassignRoleFromUser(user.id, currentRoleData.id);
      }
      
      // Gán vai trò mới
      console.log("Assigning role:", roleToAssign.roleName, "with ID:", roleToAssign.id);
      await assignRoleToUser(user.id, roleToAssign.id);
      messageApi.success(`User role updated to '${roleToAssign.roleName}'`);
      fetchUserDetails(); // Refresh user data to get updated roles
      setSelectedRole(""); // Reset selection
    } catch (error) {
      console.error("Error updating role:", error);
      messageApi.error("Failed to update role");
    } finally {
      setRoleActionLoading(false);
    }
  };
  
  const renderRoleManagement = () => {
    if (!user) return null;
    
    // Lấy tất cả vai trò có thể gán, lọc theo quyền
    const currentUserRoles = userContext?.user?.role || [];
    const isCurrentUserManager = currentUserRoles.includes("Manager");
    
    // Nếu người dùng hiện tại là Manager, không hiển thị Admin và Manager trong danh sách vai trò
    let availableRoles = allRoles;
    if (isCurrentUserManager) {
      availableRoles = allRoles.filter(role => 
        role.roleName !== "Admin" && role.roleName !== "Manager"
      );
    }
    
    // Lọc những vai trò mà người dùng đã có
    availableRoles = availableRoles.filter(
      (role) => !user.roles?.includes(role.roleName)
    );
    
    // Lấy vai trò hiện tại của người dùng
    const currentRole = user.roles && user.roles.length > 0 ? user.roles[0] : null;
    const currentRoleData = currentRole ? allRoles.find(role => role.roleName === currentRole) : null;
    
    // Dữ liệu vai trò hiện tại để hiển thị
    const userRoleData = currentRoleData ? {
      key: currentRoleData.id,
      name: currentRoleData.roleName,
      description: currentRoleData.description || "-",
    } : null;
    
    const columns = [
      {
        title: "Current Role",
        dataIndex: "name",
        key: "name",
        render: (text: string) => (
          <Tag color={getRoleColor(text)}>{text}</Tag>
        ),
      },
      {
        title: "Description",
        dataIndex: "description",
        key: "description",
      }
    ];
    
    return (
      <Card 
        title={
          <div className="flex items-center gap-2">
            <SafetyOutlined style={{ fontSize: 18 }} />
            <Title level={5} style={{ margin: 0 }}>Role Management</Title>
          </div>
        }
        className="mt-4"
        extra={
          <Tooltip title="Refresh roles">
            <Button 
              icon={<ReloadOutlined />} 
              onClick={() => {
                fetchUserDetails();
                fetchAllRoles();
              }}
              size="small"
            />
          </Tooltip>
        }
      >
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            {/* Hiển thị vai trò hiện tại */}
            {userRoleData ? (
              <div className="mb-4">
                <Table
                  columns={columns}
                  dataSource={[userRoleData]}
                  rowKey="key"
                  size="small"
                  loading={roleLoading}
                  pagination={false}
                  bordered
                  className="role-table"
                />
              </div>
            ) : (
              <div className="mb-4 p-4 bg-gray-200 rounded-md text-center">
                <Text type="secondary">User has no role assigned</Text>
              </div>
            )}
            
            {/* Form cập nhật vai trò chỉ hiển thị nếu có quyền */}
            {hasRoleManagePermission && isAuthorizedUser && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
                <div className="flex flex-col gap-2">
                  <Text strong>Update Role</Text>
                  <div className="flex flex-wrap gap-2 items-center mt-2">
                    <Select
                      placeholder="Select new role"
                      style={{ width: 250 }}
                      value={selectedRole}
                      onChange={(value) => setSelectedRole(value)}
                      loading={roleLoading}
                      showSearch
                      optionFilterProp="children"
                    >
                      {availableRoles.map((role) => (
                        <Option 
                          key={role.id} 
                          value={role.roleName}
                          disabled={role.roleName === currentRole}
                        >
                          {role.roleName} {role.roleName === currentRole ? "(Current)" : ""}
                        </Option>
                      ))}
                    </Select>
                    <Button
                      type="primary"
                      onClick={handleUpdateRole}
                      disabled={!selectedRole || selectedRole === currentRole}
                      loading={roleActionLoading}
                    >
                      Update Role
                    </Button>
                  </div>
                  {currentRole && (
                    <Text type="warning" className="mt-2">
                      <InfoCircleOutlined /> Updating the role will replace the current role
                    </Text>
                  )}
                  {isCurrentUserManager && (
                    <Text type="secondary" className="mt-2">
                      <InfoCircleOutlined /> As a Manager, you can only assign Healthcare Staff, Canteen Staff, or User roles
                    </Text>
                  )}
                </div>
              </div>
            )}
          </Col>
        </Row>
      </Card>
    );
  };

  // Hàm render thông tin người dùng với nội dung giới hạn cho User
  const renderUserInformation = () => {
    // Sử dụng biến isRegularUser đã được thiết lập ở cấp component
    if (isRegularUser) {
      return (
        <Form form={form} layout="vertical">
          <Row gutter={[24, 16]}>
            <Col xs={24} md={6}>
              <div className="flex flex-col items-center mb-4">
                {/* Hiển thị ảnh thật khi người dùng được xem không phải User và có ảnh */}
                {!isPrimaryRoleUser(user?.roles) && user?.imageURL ? (
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
                ) : (
                  <Avatar
                    icon={<UserOutlined />}
                    style={{ backgroundColor: "#1890ff" }}
                    size={200}
                  />
                )}
              </div>
            </Col>

            <Col xs={24} md={18}>
              <Row gutter={[16, 16]}>
                {/* Full Name - Hiển thị cho tất cả người dùng */}
                <Col xs={24} sm={12}>
                  <div className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm">
                    <span className="text-xs font-medium text-gray-700">
                      Full Name
                    </span>
                    <div className="mt-1 w-full p-0">
                      {user?.fullName || "-"}
                    </div>
                  </div>
                </Col>
                
                {/* Username - Hiển thị cho tất cả người dùng */}
                <Col xs={24} sm={12}>
                  <div className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm">
                    <span className="text-xs font-medium text-gray-700">
                      Username
                    </span>
                    <div className="mt-1 w-full p-0">
                      {user?.userName || "-"}
                    </div>
                  </div>
                </Col>
                
                {/* Email - Hiển thị cho tất cả người dùng */}
                <Col xs={24} sm={12}>
                  <div className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm">
                    <span className="text-xs font-medium text-gray-700">
                      Email
                    </span>
                    <div className="mt-1 w-full p-0">
                      {user?.email || "-"}
                    </div>
                  </div>
                </Col>
                
                {/* Phone - Hiển thị cho tất cả người dùng */}
                <Col xs={24} sm={12}>
                  <div className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm">
                    <span className="text-xs font-medium text-gray-700">
                      Phone
                    </span>
                    <div className="mt-1 w-full p-0">
                      {user?.phone || "-"}
                    </div>
                  </div>
                </Col>
              </Row>
            </Col>
          </Row>
        </Form>
      );
    }
    
    // Nếu không phải User, hiển thị thông tin đầy đủ
    return (
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
                      {user?.fullName || "-"}
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
                      {user?.userName || "-"}
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
                      {user?.email || "-"}
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
                      {user?.phone || "-"}
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
                      {user?.gender || "-"}
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
                      {formatDate(user?.dob)}
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
                      {user?.address || "No address available."}
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
                    {formatDateTime(user?.createdAt)}
                  </div>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm">
                  <span className="text-xs font-medium text-gray-700">
                    Updated At
                  </span>
                  <div className="mt-1 w-full p-0">
                    {formatDateTime(user?.updatedAt)}
                  </div>
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
      </Form>
    );
  };

  // Thêm useEffect để log khi component re-render với giá trị isRegularUser mới
  useEffect(() => {
    console.log('Rendering card with isRegularUser:', isRegularUser);
  }, [isRegularUser]);

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

  // Nếu user đang trong chế độ edit nhưng không có quyền, chuyển về chế độ xem
  if (isEditing && !hasEditPermission) {
    // Chuyển về chế độ xem
    setIsEditing(false);
    
    // Cập nhật URL
    router.replace(`/user/${id}`, undefined, { shallow: true });
    
    // Hiển thị thông báo chỉ khi là người dùng có quyền truy cập trang quản lý
    if (isAuthorizedUser) {
      messageApi.error("You don't have permission to edit this user");
    }
    
    // Đợi một chút để React cập nhật state trước khi render
    return (
      <div className="flex justify-center items-center h-screen">
        {contextHolder}
        <Spin size="large" tip="Checking permissions..." />
      </div>
    );
  }

  // Chế độ giao diện giới hạn cho người dùng có vai trò User
  if (isRegularUser) {
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
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={24}>
            <Card 
              title={<Title level={5}>User Information</Title>}
              extra={
                <Space>
                  {user?.roles?.map((role) => (
                    <Tag key={role} color={getRoleColor(role)}>
                      {role}
                    </Tag>
                  ))}
                </Space>
              }
            >
              <Form form={form} layout="vertical">
                <Row gutter={[24, 16]}>
                  <Col xs={24} md={6}>
                    <div className="flex flex-col items-center mb-4">
                      {/* Hiển thị ảnh thật khi người dùng được xem không phải User và có ảnh */}
                      {!isPrimaryRoleUser(user?.roles) && user?.imageURL ? (
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
                      ) : (
                        <Avatar
                          icon={<UserOutlined />}
                          style={{ backgroundColor: "#1890ff" }}
                          size={200}
                        />
                      )}
                    </div>
                  </Col>

                  <Col xs={24} md={18}>
                    <Row gutter={[16, 16]}>
                      {/* Full Name - Hiển thị cho tất cả người dùng */}
                      <Col xs={24} sm={12}>
                        <div className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm">
                          <span className="text-xs font-medium text-gray-700">
                            Full Name
                          </span>
                          <div className="mt-1 w-full p-0">
                            {user?.fullName || "-"}
                          </div>
                        </div>
                      </Col>
                      
                      {/* Username - Hiển thị cho tất cả người dùng */}
                      <Col xs={24} sm={12}>
                        <div className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm">
                          <span className="text-xs font-medium text-gray-700">
                            Username
                          </span>
                          <div className="mt-1 w-full p-0">
                            {user?.userName || "-"}
                          </div>
                        </div>
                      </Col>
                      
                      {/* Email - Hiển thị cho tất cả người dùng */}
                      <Col xs={24} sm={12}>
                        <div className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm">
                          <span className="text-xs font-medium text-gray-700">
                            Email
                          </span>
                          <div className="mt-1 w-full p-0">
                            {user?.email || "-"}
                          </div>
                        </div>
                      </Col>
                      
                      {/* Phone - Hiển thị cho tất cả người dùng */}
                      <Col xs={24} sm={12}>
                        <div className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm">
                          <span className="text-xs font-medium text-gray-700">
                            Phone
                          </span>
                          <div className="mt-1 w-full p-0">
                            {user?.phone || "-"}
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
  }

  // Giao diện đầy đủ cho Admin, Manager và các vai trò khác
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
              !isRegularUser ? (
                <Space>
                  {user?.roles?.map((role) => (
                    <Tag key={role} color={getRoleColor(role)}>
                      {role}
                    </Tag>
                  ))}
                  <Tag color={getStatusColor(user?.status)}>
                    {user?.status ? user.status.toUpperCase() : ""}
                  </Tag>
                </Space>
              ) : null
            }
          >
            {renderUserInformation()}
          </Card>
        </Col>
        
        {/* Add Role Management section only if user has permission */}
        {hasRoleManagePermission && isAuthorizedUser && (
          <Col xs={24} md={24}>
            {renderRoleManagement()}
          </Col>
        )}
      </Row>
    </div>
  );
};
