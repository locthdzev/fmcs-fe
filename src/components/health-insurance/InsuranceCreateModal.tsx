import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  Space,
  Typography,
  message,
  Select,
  DatePicker,
  Upload,
  Divider,
  Switch,
  Card,
} from "antd";
import {
  PlusOutlined,
  UploadOutlined,
  UserOutlined,
  MedicineBoxOutlined,
} from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";
import dayjs from "dayjs";

import {
  HealthInsuranceCreateManualDTO,
  createHealthInsuranceManual,
  createInitialHealthInsurances,
} from "@/api/healthinsurance";

import * as UserApi from "@/api/user";

const { Title, Text } = Typography;
const { Option } = Select;

interface InsuranceCreateModalProps {
  visible: boolean;
  isManual: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const InsuranceCreateModal: React.FC<InsuranceCreateModalProps> = ({
  visible,
  isManual,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);
  const [users, setUsers] = useState<any[]>([]);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (visible) {
      fetchUsers();
      form.resetFields();
      setFileList([]);
    }
  }, [visible, isManual]);

  const fetchUsers = async () => {
    try {
      // Sử dụng API mới để lấy chỉ những người dùng active chưa có bảo hiểm
      const result = await UserApi.getActiveUsersWithoutInsurance();
      if (result.isSuccess) {
        setUsers(result.data);
        if (result.data.length === 0) {
          messageApi.info("No users without health insurance found");
        }
      } else {
        messageApi.error(result.message || "Failed to fetch users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      messageApi.error("Failed to fetch users");
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (isManual) {
        // Kiểm tra file ảnh
        const imageFile = fileList[0]?.originFileObj;
        if (!imageFile) {
          messageApi.error("Please upload an insurance card image");
          setLoading(false);
          return;
        }

        // Create manual insurance
        const formData: HealthInsuranceCreateManualDTO = {
          userId: values.userId,
          healthInsuranceNumber: values.healthInsuranceNumber,
          fullName: values.fullName,
          dateOfBirth: values.dateOfBirth?.format("YYYY-MM-DD"),
          gender: values.gender,
          address: values.address || "",
          healthcareProviderName: values.healthcareProviderName,
          healthcareProviderCode: values.healthcareProviderCode || "",
          validFrom: values.validFrom?.format("YYYY-MM-DD"),
          validTo: values.validTo?.format("YYYY-MM-DD"),
          issueDate: values.issueDate?.format("YYYY-MM-DD"),
        };

        console.log("Form data being sent:", formData);
        console.log("Image file being sent:", imageFile);

        const result = await createHealthInsuranceManual(formData, imageFile);

        if (result.isSuccess) {
          messageApi.success("Health insurance created successfully");
          onSuccess();
        } else {
          messageApi.error(
            result.message || "Failed to create health insurance"
          );
        }
      } else {
        // Create initial insurances
        const result = await createInitialHealthInsurances();

        if (result.isSuccess) {
          messageApi.success("Initial health insurances created successfully");
          onSuccess();
        } else {
          messageApi.error(
            result.message || "Failed to create initial health insurances"
          );
        }
      }
    } catch (error) {
      messageApi.error("Failed to create health insurance");
      console.error("Error creating health insurance:", error);
    } finally {
      setLoading(false);
    }
  };

  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  const handleFileChange = ({ fileList }: { fileList: UploadFile[] }) => {
    setFileList(fileList);
  };

  const beforeUpload = (file: UploadFile) => {
    const isImage = file.type ? file.type.startsWith("image/") : false;
    if (!isImage) {
      messageApi.error("You can only upload image files!");
    }
    const isLt2M = (file.size || 0) / 1024 / 1024 < 2;
    if (!isLt2M) {
      messageApi.error("Image must be smaller than 2MB!");
    }
    return isImage && isLt2M;
  };

  return (
    <Modal
      title={
        <Space>
          <PlusOutlined />
          <Title level={4} style={{ margin: 0 }}>
            {isManual
              ? "Create Health Insurance"
              : "Create Initial Health Insurances"}
          </Title>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={null}
      destroyOnClose
    >
      {contextHolder}

      {isManual ? (
        <Form form={form} layout="vertical">
          <Card className="mb-4">
            <Space align="center" className="mb-2">
              <UserOutlined />
              <Text strong>User Information</Text>
            </Space>
            <Divider style={{ margin: "8px 0" }} />

            <Form.Item
              name="userId"
              label="User"
              rules={[{ required: true, message: "Please select a user" }]}
            >
              <Select
                showSearch
                placeholder="Select a user"
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                options={users.map((user) => ({
                  value: user.id,
                  label: `${user.fullName} (${user.email})`,
                }))}
              />
            </Form.Item>
          </Card>

          <Card className="mb-4">
            <Space align="center" className="mb-2">
              <MedicineBoxOutlined />
              <Text strong>Insurance Information</Text>
            </Space>
            <Divider style={{ margin: "8px 0" }} />

            <Form.Item
              name="healthInsuranceNumber"
              label="Health Insurance Number"
              rules={[
                {
                  required: true,
                  message: "Please input health insurance number",
                },
              ]}
            >
              <Input placeholder="Enter health insurance number" />
            </Form.Item>

            <Form.Item
              name="fullName"
              label="Full Name"
              rules={[{ required: true, message: "Please input full name" }]}
            >
              <Input placeholder="Enter full name" />
            </Form.Item>

            <Form.Item
              name="dateOfBirth"
              label="Date of Birth"
              rules={[
                { required: true, message: "Please select date of birth" },
              ]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              name="gender"
              label="Gender"
              rules={[{ required: true, message: "Please select gender" }]}
            >
              <Select placeholder="Select gender">
                <Option value="Male">Male</Option>
                <Option value="Female">Female</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="address"
              label="Address"
              rules={[{ required: true, message: "Please input address" }]}
            >
              <Input.TextArea rows={2} placeholder="Enter address" />
            </Form.Item>

            <Form.Item
              name="healthcareProviderName"
              label="Healthcare Provider Name"
              rules={[
                {
                  required: true,
                  message: "Please input healthcare provider name",
                },
              ]}
            >
              <Input placeholder="Enter healthcare provider name" />
            </Form.Item>

            <Form.Item
              name="healthcareProviderCode"
              label="Healthcare Provider Code"
              rules={[
                {
                  required: true,
                  message: "Please input healthcare provider code",
                },
              ]}
            >
              <Input placeholder="Enter healthcare provider code" />
            </Form.Item>

            <Form.Item
              name="validFrom"
              label="Valid From"
              rules={[
                { required: true, message: "Please select valid from date" },
              ]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              name="validTo"
              label="Valid To"
              rules={[
                { required: true, message: "Please select valid to date" },
              ]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              name="issueDate"
              label="Issue Date"
              rules={[{ required: true, message: "Please select issue date" }]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              name="imageFile"
              label="Insurance Card Image"
              valuePropName="fileList"
              getValueFromEvent={normFile}
            >
              <Upload
                fileList={fileList}
                beforeUpload={beforeUpload}
                onChange={handleFileChange}
                maxCount={1}
                listType="picture"
                accept="image/*"
              >
                <Button icon={<UploadOutlined />}>Upload Image</Button>
              </Upload>
            </Form.Item>
          </Card>
        </Form>
      ) : (
        <div className="mb-4">
          <Text>
            This action will create initial health insurance records for all
            users who don't have one yet. The users will be asked to provide
            their health insurance details later.
          </Text>
        </div>
      )}

      <div className="flex justify-end">
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" onClick={handleSubmit} loading={loading}>
            {isManual ? "Create Health Insurance" : "Create Initial Insurances"}
          </Button>
        </Space>
      </div>
    </Modal>
  );
};

export default InsuranceCreateModal;
