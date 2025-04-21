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
  Typography,
  Space,
  Avatar,
  Checkbox,
  message,
  Card,
  Alert,
} from "antd";
import {
  HealthInsuranceResponseDTO,
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
  MailOutlined,
  SendOutlined,
  FormOutlined,
  InboxOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";
import dayjs from "dayjs";

interface MyInsuranceUpdateRequestModalProps {
  visible: boolean;
  insurance: HealthInsuranceResponseDTO | null;
  onClose: () => void;
  onSuccess: (formData: any, imageFile?: File) => void;
}

export default function MyInsuranceUpdateRequestModal({
  visible,
  insurance,
  onClose,
  onSuccess,
}: MyInsuranceUpdateRequestModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | undefined>();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [messageApi, contextHolder] = message.useMessage();
  const [hasInsurance, setHasInsurance] = useState(true);
  const [imageRequired, setImageRequired] = useState(false);

  React.useEffect(() => {
    if (visible && insurance) {
      const hasInsuranceValue =
        insurance.healthInsuranceNumber != null ||
        (insurance.status !== "NotApplicable" &&
          insurance.status !== "NoInsurance");

      setHasInsurance(hasInsuranceValue);
      setImageRequired(false);

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
        imageChanged: false,
      });

      // Reset image file
      setImageFile(undefined);

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
      console.log("Form values:", values);

      // Prepare file to send
      let fileToSend: File | undefined = imageFile;

      // If we have a file in fileList but not in imageFile, use that
      if (!fileToSend && values.hasInsurance && fileList.length > 0) {
        if (fileList[0].originFileObj) {
          fileToSend = fileList[0].originFileObj as File;
          console.log("Using file from fileList:", fileToSend);
        } else if (fileList[0].url && !values.imageChanged) {
          console.log("Using existing image URL:", fileList[0].url);
          // We don't set fileToSend here as we'll use existing image on server
        }
      }

      // Only validate if user doesn't have insurance but wants to add it
      if (
        values.hasInsurance &&
        !insurance?.healthInsuranceNumber &&
        !fileToSend &&
        (!fileList.length || !fileList[0].url)
      ) {
        messageApi.error("Please upload an insurance card image");
        return;
      }

      setLoading(true);

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
        imageChanged: values.imageChanged || (fileToSend ? true : false),
      };

      console.log("Passing data to parent:", { formattedValues, fileToSend });

      // Just pass data to parent component
      onSuccess(formattedValues, fileToSend);
    } catch (error) {
      messageApi.error("Failed to validate form");
      console.error("Error validating form:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadChange = (info: any) => {
    console.log("Upload change triggered", info);
    let newFileList = [...info.fileList];
    newFileList = newFileList.slice(-1);
    setFileList(newFileList);

    if (info.file && info.file.originFileObj) {
      console.log("Setting image file", info.file.originFileObj);
      const file = info.file.originFileObj;
      setImageFile(file);
      form.setFieldsValue({ imageChanged: true });
    }
  };

  const beforeUpload = (file: any) => {
    console.log("Before upload called with file:", file);
    setImageFile(file);
    return false; // Prevent auto upload
  };

  const handleHasInsuranceChange = (e: any) => {
    const checked = e.target.checked;
    setHasInsurance(checked);
    setImageRequired(checked);

    if (!checked) {
      // Clear image if not having insurance
      setImageFile(undefined);
      setFileList([]);
    }
  };

  if (!insurance) return null;

  return (
    <Modal
      title={
        <Typography.Title level={4} style={{ margin: 0 }}>
          <Space>
            {insurance.verificationStatus === "Rejected"
              ? "Update Rejected Insurance"
              : "Request Health Insurance Update"}
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
          icon={<SendOutlined />}
          loading={loading}
          onClick={handleSubmit}
          danger={insurance.verificationStatus === "Rejected"}
        >
          {insurance.verificationStatus === "Rejected"
            ? "Submit Update"
            : "Submit Request"}
        </Button>,
      ]}
      width={1200}
      centered
    >
      {contextHolder}
      <Card className="shadow-sm mb-4">
        <Typography.Paragraph className="bg-blue-50 p-4 mb-4 rounded-lg">
          Your request will be sent to administrators for review. You will be
          notified once it has been processed. You cannot make another request
          while this one is pending.
        </Typography.Paragraph>

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

      {hasInsurance && !insurance?.imageUrl && (
        <Alert
          message="Insurance Card Image Required"
          description="You must upload a new image of your insurance card to update your information."
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          className="mb-4"
        />
      )}

      <Form form={form} layout="vertical">
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
                  required={imageRequired}
                  rules={[
                    {
                      required: imageRequired,
                      message: "Please upload an insurance card image!",
                    },
                  ]}
                >
                  <Upload.Dragger
                    accept="image/*"
                    fileList={fileList}
                    onChange={handleUploadChange}
                    beforeUpload={beforeUpload}
                    maxCount={1}
                    className="upload-list-inline"
                  >
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">
                      Click or drag to upload insurance card image
                    </p>
                    <p className="ant-upload-hint">
                      {imageRequired
                        ? "This field is required when you have insurance"
                        : ""}
                    </p>
                  </Upload.Dragger>
                </Form.Item>
              </Card>
            </Col>
          </Row>
        )}
      </Form>
    </Modal>
  );
}
