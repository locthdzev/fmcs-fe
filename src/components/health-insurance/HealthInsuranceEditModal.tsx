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
  Checkbox,
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
  const [hasInsurance, setHasInsurance] = useState(true);

  React.useEffect(() => {
    if (visible && insurance) {
      const hasInsuranceValue =
        insurance.healthInsuranceNumber != null ||
        (insurance.status !== "NotApplicable" &&
          insurance.status !== "NoInsurance");

      setHasInsurance(hasInsuranceValue);

      form.setFieldsValue({
        hasInsurance: hasInsuranceValue,
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
        hasInsurance: values.hasInsurance,
        healthInsuranceNumber: values.hasInsurance
          ? values.healthInsuranceNumber || ""
          : null,
        fullName: values.hasInsurance ? values.fullName || "" : null,
        dateOfBirth:
          values.hasInsurance && values.dateOfBirth
            ? values.dateOfBirth.format("YYYY-MM-DD")
            : null,
        gender: values.hasInsurance ? values.gender || "" : null,
        address: values.hasInsurance ? values.address || "" : null,
        healthcareProviderName: values.hasInsurance
          ? values.healthcareProviderName || ""
          : null,
        healthcareProviderCode: values.hasInsurance
          ? values.healthcareProviderCode || ""
          : null,
        validFrom:
          values.hasInsurance && values.validFrom
            ? values.validFrom.format("YYYY-MM-DD")
            : null,
        validTo:
          values.hasInsurance && values.validTo
            ? values.validTo.format("YYYY-MM-DD")
            : null,
        issueDate:
          values.hasInsurance && values.issueDate
            ? values.issueDate.format("YYYY-MM-DD")
            : null,
      };

      console.log("Form values:", values);
      console.log("Formatted values for API:", formattedValues);
      console.log("Image file:", imageFile);
      console.log("Image changed:", values.imageChanged);
      console.log("Has insurance:", values.hasInsurance);

      const submitFunc = isAdmin
        ? updateHealthInsuranceByAdmin
        : requestHealthInsuranceUpdate;
      const response = await submitFunc(
        insurance!.id,
        formattedValues,
        values.hasInsurance ? imageFile : undefined
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

  const handleHasInsuranceChange = (e: any) => {
    setHasInsurance(e.target.checked);
  };

  if (!insurance) return null;

  return (
    <Modal
      title={
        <Typography.Title level={4} style={{ margin: 0 }}>
          <Space>
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
          <Col flex="1">
            <Space align="start">
              <Avatar
                size={64}
                icon={<UserOutlined />}
                className="bg-blue-500"
              />
              <div>
                <Typography.Title level={5} style={{ margin: 0 }}>
                  {insurance.user.fullName}
                </Typography.Title>
                <Typography.Text type="secondary">
                  <Space>
                    <MailOutlined />
                    {insurance.user.email}
                  </Space>
                </Typography.Text>
              </div>
            </Space>
          </Col>
          {insurance?.imageUrl && (
            <Col>
              <Image
                src={insurance.imageUrl}
                alt="Insurance Card"
                style={{
                  height: "80px",
                  objectFit: "contain",
                }}
                preview={{
                  mask: (
                    <div
                      style={{
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                      }}
                    >
                      <span style={{ color: "white" }}>Preview</span>
                    </div>
                  ),
                }}
              />
            </Col>
          )}
        </Row>
      </Card>

      <Form form={form} layout="vertical">
        {/* Hidden field to track image changes */}
        <Form.Item name="imageChanged" hidden>
          <Input />
        </Form.Item>

        <Form.Item
          name="hasInsurance"
          valuePropName="checked"
          initialValue={true}
        >
          <Checkbox onChange={handleHasInsuranceChange}>
            <Typography.Text strong>Has Health Insurance</Typography.Text>
          </Checkbox>
        </Form.Item>

        {hasInsurance && (
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
                    {
                      required: hasInsurance,
                      message: "Please input insurance number!",
                    },
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
                  rules={[
                    {
                      required: hasInsurance,
                      message: "Please input full name!",
                    },
                  ]}
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
                    {
                      required: hasInsurance,
                      message: "Please select date of birth!",
                    },
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
                  rules={[
                    {
                      required: hasInsurance,
                      message: "Please select gender!",
                    },
                  ]}
                >
                  <Select placeholder="Select gender">
                    <Select.Option value="Male">Male</Select.Option>
                    <Select.Option value="Female">Female</Select.Option>
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
                    {
                      required: hasInsurance,
                      message: "Please select valid from date!",
                    },
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
                    {
                      required: hasInsurance,
                      message: "Please select valid to date!",
                    },
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
                    {
                      required: hasInsurance,
                      message: "Please select issue date!",
                    },
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
                </Form.Item>
              </Card>
            </Col>
          </Row>
        )}
      </Form>
    </Modal>
  );
}
