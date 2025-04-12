import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  Button,
  Upload,
  message,
  Steps,
  Divider,
  Typography,
  Alert,
  Space,
} from "antd";
import {
  UploadOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  FileImageOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  updateHealthInsurance,
  requestHealthInsuranceUpdate,
} from "@/api/healthinsurance";

const { Option } = Select;
const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

interface UpdateRequestModalProps {
  visible: boolean;
  insurance: any;
  onClose: () => void;
  onSuccess: () => void;
}

const UpdateRequestModal: React.FC<UpdateRequestModalProps> = ({
  visible,
  insurance,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [imageFile, setImageFile] = useState<File | undefined>(undefined);
  const [imagePreview, setImagePreview] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible && insurance) {
      form.setFieldsValue({
        hasInsurance: insurance.hasInsurance || true,
        healthInsuranceNumber: insurance.healthInsuranceNumber || "",
        fullName: insurance.fullName || "",
        dateOfBirth: insurance.dateOfBirth ? dayjs(insurance.dateOfBirth) : null,
        gender: insurance.gender || "Male",
        address: insurance.address || "",
        healthcareProviderName: insurance.healthcareProviderName || "",
        healthcareProviderCode: insurance.healthcareProviderCode || "",
        validFrom: insurance.validFrom ? dayjs(insurance.validFrom) : null,
        validTo: insurance.validTo ? dayjs(insurance.validTo) : null,
        issueDate: insurance.issueDate ? dayjs(insurance.issueDate) : null,
      });
      setCurrentStep(0);
      setImageFile(undefined);
      setImagePreview(undefined);
    }
  }, [visible, insurance, form]);

  const handleNext = async () => {
    try {
      if (currentStep === 0) {
        await form.validateFields(['hasInsurance']);
        if (!form.getFieldValue('hasInsurance')) {
          // If user doesn't have insurance, skip to confirmation
          setCurrentStep(2);
        } else {
          setCurrentStep(currentStep + 1);
        }
      } else {
        await form.validateFields();
        setCurrentStep(currentStep + 1);
      }
    } catch (error) {
      // Validation failed
    }
  };

  const handlePrev = () => {
    if (currentStep === 2 && !form.getFieldValue('hasInsurance')) {
      setCurrentStep(0);
    } else {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      await form.validateFields();
      setSubmitting(true);

      // Xác định có bảo hiểm dựa trên thông tin form, không phụ thuộc vào currentStep
      const hasInsurance = form.getFieldValue('hasInsurance') !== false;
      
      const values = form.getFieldsValue();
      console.log("Form values:", values);
      
      // Create data object, ensuring we have all required fields
      const data = {
        hasInsurance: hasInsurance,
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

      console.log("Sending data:", data);
      console.log("Image file:", imageFile);
      
      // Log FormData details to debug
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          const pascalCaseKey = key.charAt(0).toUpperCase() + key.slice(1);
          formData.append(pascalCaseKey, value.toString());
          console.log(`FormData entry: ${pascalCaseKey} = ${value.toString()}`);
        }
      });
      if (imageFile) formData.append("imageFile", imageFile);

      // Điều chỉnh fileImage nếu không có bảo hiểm
      const fileToSend = hasInsurance ? imageFile : undefined;

      let response;
      if (insurance.verificationStatus === "Verified") {
        // Using the FormData object directly would provide more control,
        // but we'll keep using the API functions for consistency
        response = await requestHealthInsuranceUpdate(insurance.id, data, fileToSend);
        console.log("Request response:", response);
        if (response.isSuccess) {
          message.success("Update request submitted successfully");
          onSuccess();
          onClose();
        } else {
          message.error(response.message || "Failed to submit update request");
        }
      } else {
        response = await updateHealthInsurance(insurance.id, data, fileToSend);
        console.log("Update response:", response);
        if (response.isSuccess) {
          message.success("Insurance updated successfully");
          onSuccess();
          onClose();
        } else {
          message.error(response.message || "Failed to update insurance");
        }
      }
    } catch (error) {
      console.error("Submit error:", error);
      message.error("Please check your form inputs");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadChange = (info: any) => {
    if (info.file) {
      setImageFile(info.file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(info.file);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div>
            <Title level={5}>Do you have health insurance?</Title>
            <Paragraph>
              Please indicate whether you currently have health insurance coverage.
            </Paragraph>
            <Form.Item
              name="hasInsurance"
              rules={[{ required: true, message: "Please select an option" }]}
            >
              <Select size="large">
                <Option value={true}>Yes, I have health insurance</Option>
                <Option value={false}>No, I don't have health insurance</Option>
              </Select>
            </Form.Item>
          </div>
        );
      case 1:
        return (
          <div>
            <Title level={5}>Insurance Information</Title>
            <Paragraph>
              Please provide your health insurance details accurately.
            </Paragraph>
            
            <Form.Item
              name="healthInsuranceNumber"
              label="Insurance Number"
              rules={[{ required: true, message: "Please enter your insurance number" }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="fullName"
              label="Full Name (as on insurance card)"
              rules={[{ required: true, message: "Please enter your full name" }]}
            >
              <Input />
            </Form.Item>

            <div style={{ display: 'flex', gap: '16px' }}>
              <Form.Item
                name="dateOfBirth"
                label="Date of Birth"
                rules={[{ required: true, message: "Please select your date of birth" }]}
                style={{ flex: 1 }}
              >
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>

              <Form.Item
                name="gender"
                label="Gender"
                rules={[{ required: true, message: "Please select your gender" }]}
                style={{ flex: 1 }}
              >
                <Select>
                  <Option value="Male">Male</Option>
                  <Option value="Female">Female</Option>
                  <Option value="Other">Other</Option>
                </Select>
              </Form.Item>
            </div>

            <Form.Item
              name="address"
              label="Address"
              rules={[{ required: true, message: "Please enter your address" }]}
            >
              <Input.TextArea rows={2} />
            </Form.Item>

            <div style={{ display: 'flex', gap: '16px' }}>
              <Form.Item
                name="healthcareProviderName"
                label="Healthcare Provider Name"
                rules={[{ required: true, message: "Please enter healthcare provider name" }]}
                style={{ flex: 1 }}
              >
                <Input />
              </Form.Item>

              <Form.Item
                name="healthcareProviderCode"
                label="Provider Code"
                rules={[{ required: true, message: "Please enter provider code" }]}
                style={{ flex: 1 }}
              >
                <Input />
              </Form.Item>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <Form.Item
                name="validFrom"
                label="Valid From"
                rules={[{ required: true, message: "Please select valid from date" }]}
                style={{ flex: 1 }}
              >
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>

              <Form.Item
                name="validTo"
                label="Valid To"
                rules={[{ required: true, message: "Please select valid to date" }]}
                style={{ flex: 1 }}
              >
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </div>

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
              rules={[
                {
                  required: !insurance.imageUrl && !imagePreview,
                  message: "Please upload your insurance card image",
                },
              ]}
              extra="Upload a clear photo or scan of your insurance card"
            >
              <Upload
                beforeUpload={() => false}
                onChange={handleUploadChange}
                maxCount={1}
                showUploadList={false}
              >
                <Button icon={<UploadOutlined />}>Select Image</Button>
              </Upload>
            </Form.Item>

            {(imagePreview || insurance.imageUrl) && (
              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <Text strong>
                  <FileImageOutlined /> Insurance Card Preview
                </Text>
                <div style={{ marginTop: 8 }}>
                  <img
                    src={imagePreview || insurance.imageUrl}
                    alt="Insurance Card"
                    style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }}
                  />
                </div>
              </div>
            )}
          </div>
        );
      case 2:
        return (
          <div>
            <Title level={5}>Confirm Submission</Title>
            
            {!form.getFieldValue('hasInsurance') ? (
              <Alert
                message="No Insurance Declaration"
                description="You have indicated that you do not have health insurance. This information will be recorded in the system."
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
            ) : (
              <>
                <Alert
                  message={insurance.verificationStatus === "Verified" 
                    ? "Submit Update Request" 
                    : "Update Insurance Information"}
                  description={insurance.verificationStatus === "Verified"
                    ? "Your request will be reviewed by an administrator before changes are applied."
                    : "Your insurance information will be updated immediately."}
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                
                <Paragraph>
                  Please review your insurance information before submitting:
                </Paragraph>
                
                <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8 }}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text strong>Insurance Number:</Text> {form.getFieldValue('healthInsuranceNumber')}
                    </div>
                    <div>
                      <Text strong>Full Name:</Text> {form.getFieldValue('fullName')}
                    </div>
                    <div>
                      <Text strong>Date of Birth:</Text> {form.getFieldValue('dateOfBirth')?.format('DD/MM/YYYY')}
                    </div>
                    <div>
                      <Text strong>Gender:</Text> {form.getFieldValue('gender')}
                    </div>
                    <div>
                      <Text strong>Address:</Text> {form.getFieldValue('address')}
                    </div>
                    <div>
                      <Text strong>Healthcare Provider:</Text> {form.getFieldValue('healthcareProviderName')} ({form.getFieldValue('healthcareProviderCode')})
                    </div>
                    <div>
                      <Text strong>Valid Period:</Text> {form.getFieldValue('validFrom')?.format('DD/MM/YYYY')} to {form.getFieldValue('validTo')?.format('DD/MM/YYYY')}
                    </div>
                    <div>
                      <Text strong>Issue Date:</Text> {form.getFieldValue('issueDate')?.format('DD/MM/YYYY')}
                    </div>
                  </Space>
                </div>
              </>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      title={
        insurance?.verificationStatus === "Verified"
          ? "Request Insurance Update"
          : "Update Insurance Information"
      }
      open={visible}
      onCancel={onClose}
      width={700}
      footer={null}
    >
      <Steps current={currentStep} style={{ marginBottom: 24 }}>
        <Step title="Status" icon={<InfoCircleOutlined />} />
        {form?.getFieldValue('hasInsurance') !== false && (
          <Step title="Details" icon={<FileImageOutlined />} />
        )}
        <Step title="Confirm" icon={<CheckCircleOutlined />} />
      </Steps>

      <Form form={form} layout="vertical" initialValues={{ hasInsurance: true }}>
        {renderStepContent()}

        <Divider />

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {currentStep > 0 && (
            <Button onClick={handlePrev}>
              Previous
            </Button>
          )}
          <div style={{ marginLeft: 'auto' }}>
            <Button onClick={onClose} style={{ marginRight: 8 }}>
              Cancel
            </Button>
            {currentStep < 2 ? (
              <Button type="primary" onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button type="primary" onClick={handleSubmit} loading={submitting}>
                {insurance?.verificationStatus === "Verified"
                  ? "Submit Request"
                  : "Update Insurance"}
              </Button>
            )}
          </div>
        </div>
      </Form>
    </Modal>
  );
};

export default UpdateRequestModal; 