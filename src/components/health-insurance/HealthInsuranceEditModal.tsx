/**
 * HealthInsuranceEditModal - A modal component for editing health insurance information
 * 
 * Example usage:
 * ```jsx
 * const [modalVisible, setModalVisible] = useState(false);
 * const [selectedInsurance, setSelectedInsurance] = useState(null);
 * 
 * // When you want to open the modal with a specific insurance:
 * const handleEdit = async (insuranceId) => {
 *   const response = await getHealthInsuranceById(insuranceId);
 *   if (response.isSuccess) {
 *     setSelectedInsurance(response.data);
 *     setModalVisible(true);
 *   }
 * };
 * 
 * // In your JSX:
 * {selectedInsurance && (
 *   <HealthInsuranceEditModal
 *     visible={modalVisible}
 *     insurance={selectedInsurance}
 *     onClose={() => setModalVisible(false)}
 *     onSuccess={() => {
 *       refreshYourData();
 *       setModalVisible(false);
 *     }}
 *     isAdmin={true} // Set to false for user update requests
 *   />
 * )}
 * ```
 */
import React, { useState } from "react";
import {
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  Button,
  Row,
  Col,
  Upload,
  Image,
  Descriptions,
  Divider,
  Card,
  Typography,
  Space,
  Avatar,
} from "antd";
import {
  HealthInsuranceResponseDTO,
  updateHealthInsuranceByAdmin,
  requestHealthInsuranceUpdate,
} from "@/api/healthinsurance";
import {
  UploadOutlined,
  UserOutlined,
  IdcardOutlined,
  CalendarOutlined,
  HomeOutlined,
  MedicineBoxOutlined,
  NumberOutlined,
  FileImageOutlined,
  UserSwitchOutlined,
  FormOutlined,
  MailOutlined,
} from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";
import dayjs from "dayjs";
import { message } from "antd";

interface EditModalProps {
  visible: boolean;
  insurance: HealthInsuranceResponseDTO | null;
  onClose: () => void;
  onSuccess: () => void;
  isAdmin?: boolean;
}

export default function HealthInsuranceEditModal({
  visible,
  insurance,
  onClose,
  onSuccess,
  isAdmin = true,
}: EditModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File>();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [messageApi, contextHolder] = message.useMessage();

  React.useEffect(() => {
    if (visible && insurance) {
      form.setFieldsValue({
        healthInsuranceNumber: insurance.healthInsuranceNumber,
        fullName: insurance.fullName,
        dateOfBirth: insurance.dateOfBirth
          ? dayjs(insurance.dateOfBirth)
          : null,
        gender: insurance.gender,
        address: insurance.address,
        healthcareProviderName: insurance.healthcareProviderName,
        healthcareProviderCode: insurance.healthcareProviderCode,
        validFrom: insurance.validFrom ? dayjs(insurance.validFrom) : null,
        validTo: insurance.validTo ? dayjs(insurance.validTo) : null,
        issueDate: insurance.issueDate ? dayjs(insurance.issueDate) : null,
        imageChanged: false, // Track if image has been changed
      });

      if (insurance.imageUrl) {
        setFileList([
          {
            uid: "-1",
            name: "Current Image",
            status: "done",
            url: insurance.imageUrl,
          },
        ]);
      } else {
        setFileList([]);
      }
    }
  }, [visible, insurance, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Ensure all fields are included and properly formatted
      const formattedValues = {
        hasInsurance: true,
        healthInsuranceNumber: values.healthInsuranceNumber || "",
        fullName: values.fullName || "",
        dateOfBirth: values.dateOfBirth?.format("YYYY-MM-DD") || null,
        gender: values.gender || "",
        address: values.address || "",
        healthcareProviderName: values.healthcareProviderName || "",
        healthcareProviderCode: values.healthcareProviderCode || "",
        validFrom: values.validFrom?.format("YYYY-MM-DD") || null,
        validTo: values.validTo?.format("YYYY-MM-DD") || null,
        issueDate: values.issueDate?.format("YYYY-MM-DD") || null,
      };

      console.log("Form values:", values);
      console.log("Formatted values for API:", formattedValues);
      console.log("Image file:", imageFile);
      console.log("Image changed:", values.imageChanged);

      const submitFunc = isAdmin
        ? updateHealthInsuranceByAdmin
        : requestHealthInsuranceUpdate;
      const response = await submitFunc(
        insurance!.id,
        formattedValues,
        imageFile
      );

      if (response.isSuccess) {
        messageApi.success(
          isAdmin
            ? "Insurance updated successfully!"
            : "Update request sent successfully!"
        );
        onSuccess();
        onClose();
      } else {
        messageApi.error(response.message);
      }
    } catch (error) {
      messageApi.error("Failed to update insurance");
      console.error("Error updating insurance:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadChange = (info: any) => {
    let newFileList = [...info.fileList];
    newFileList = newFileList.slice(-1);
    setFileList(newFileList);

    if (info.file.originFileObj) {
      setImageFile(info.file.originFileObj);
      form.setFieldsValue({ imageChanged: true });
      console.log("Image changed, new file:", info.file.originFileObj);
    }
  };

  if (!insurance) return null;

  return (
    <Modal
      title={
        <Typography.Title level={4} style={{ margin: 0 }}>
          <Space>
            <FormOutlined />
            {isAdmin ? "Edit Health Insurance" : "Request Insurance Update"}
          </Space>
        </Typography.Title>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
        >
          {isAdmin ? "Save Changes" : "Submit Request"}
        </Button>,
      ]}
      width={1200}
      centered
    >
      {contextHolder}
      <Card className="shadow-sm mb-4">
        <Row align="middle" gutter={16}>
          <Col>
            <Avatar size={64} icon={<UserOutlined />} className="bg-blue-500" />
          </Col>
          <Col flex="1">
            <Typography.Title level={5} style={{ margin: 0 }}>
              {insurance.user.fullName}
            </Typography.Title>
            <Typography.Text type="secondary">
              <Space>
                <MailOutlined />
                {insurance.user.email}
              </Space>
            </Typography.Text>
          </Col>
        </Row>
      </Card>

      <Form form={form} layout="vertical">
        {/* Hidden field to track image changes */}
        <Form.Item name="imageChanged" hidden>
          <Input />
        </Form.Item>
        
        <Row gutter={24}>
          <Col span={8}>
            <Card
              title={
                <Space>
                  <UserOutlined /> Personal Information
                </Space>
              }
              className="shadow-sm"
            >
              <Form.Item
                name="healthInsuranceNumber"
                label={
                  <Space>
                    <IdcardOutlined />
                    Insurance Number
                  </Space>
                }
                rules={[
                  { required: true, message: "Please input insurance number!" },
                ]}
              >
                <Input placeholder="Enter insurance number" />
              </Form.Item>

              <Form.Item
                name="fullName"
                label={
                  <Space>
                    <UserOutlined />
                    Full Name
                  </Space>
                }
                rules={[{ required: true, message: "Please input full name!" }]}
              >
                <Input placeholder="Enter full name" />
              </Form.Item>

              <Form.Item
                name="dateOfBirth"
                label={
                  <Space>
                    <CalendarOutlined />
                    Date of Birth
                  </Space>
                }
                rules={[
                  { required: true, message: "Please select date of birth!" },
                ]}
              >
                <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
              </Form.Item>

              <Form.Item
                name="gender"
                label={
                  <Space>
                    <UserSwitchOutlined />
                    Gender
                  </Space>
                }
                rules={[{ required: true, message: "Please select gender!" }]}
              >
                <Select placeholder="Select gender">
                  <Select.Option value="Male">Male</Select.Option>
                  <Select.Option value="Female">Female</Select.Option>
                  <Select.Option value="Other">Other</Select.Option>
                </Select>
              </Form.Item>
            </Card>
          </Col>

          <Col span={8}>
            <Card
              title={
                <Space>
                  <HomeOutlined /> Contact Information
                </Space>
              }
              className="shadow-sm"
            >
              <Form.Item
                name="address"
                label={
                  <Space>
                    <HomeOutlined />
                    Address
                  </Space>
                }
              >
                <Input.TextArea
                  rows={4}
                  placeholder="Enter address"
                  style={{ resize: "none" }}
                />
              </Form.Item>

              <Form.Item
                name="healthcareProviderName"
                label={
                  <Space>
                    <MedicineBoxOutlined />
                    Healthcare Provider Name
                  </Space>
                }
              >
                <Input placeholder="Enter healthcare provider name" />
              </Form.Item>

              <Form.Item
                name="healthcareProviderCode"
                label={
                  <Space>
                    <NumberOutlined />
                    Healthcare Provider Code
                  </Space>
                }
              >
                <Input placeholder="Enter healthcare provider code" />
              </Form.Item>
            </Card>
          </Col>

          <Col span={8}>
            <Card
              title={
                <Space>
                  <CalendarOutlined /> Insurance Details
                </Space>
              }
              className="shadow-sm"
            >
              <Form.Item
                name="validFrom"
                label={
                  <Space>
                    <CalendarOutlined />
                    Valid From
                  </Space>
                }
                rules={[
                  { required: true, message: "Please select valid from date!" },
                ]}
              >
                <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
              </Form.Item>

              <Form.Item
                name="validTo"
                label={
                  <Space>
                    <CalendarOutlined />
                    Valid To
                  </Space>
                }
                rules={[
                  { required: true, message: "Please select valid to date!" },
                ]}
              >
                <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
              </Form.Item>

              <Form.Item
                name="issueDate"
                label={
                  <Space>
                    <CalendarOutlined />
                    Issue Date
                  </Space>
                }
                rules={[
                  { required: true, message: "Please select issue date!" },
                ]}
              >
                <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
              </Form.Item>

              <Form.Item
                label={
                  <Space>
                    <FileImageOutlined />
                    Insurance Image
                  </Space>
                }
              >
                <Upload
                  accept="image/*"
                  fileList={fileList}
                  onChange={handleUploadChange}
                  beforeUpload={() => false}
                  maxCount={1}
                  className="upload-list-inline"
                >
                  <Button icon={<UploadOutlined />} block>
                    Click to Upload New Image
                  </Button>
                </Upload>
                {insurance?.imageUrl && !fileList.length && (
                  <Card className="mt-4">
                    <Typography.Text type="secondary">
                      Current Image:
                    </Typography.Text>
                    <div className="mt-2">
                      <Image
                        src={insurance.imageUrl}
                        alt="Current Insurance"
                        style={{
                          maxWidth: "100%",
                          maxHeight: "200px",
                          objectFit: "contain",
                        }}
                      />
                    </div>
                  </Card>
                )}
              </Form.Item>
            </Card>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
} 