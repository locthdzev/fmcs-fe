import React, { useEffect, useState } from "react";
import {
  Card,
  Form,
  Input,
  DatePicker,
  Select,
  Button,
  Upload,
  message,
  Descriptions,
  Image,
  Spin,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getCurrentUserHealthInsurance,
  updateHealthInsurance,
  requestHealthInsuranceUpdate,
} from "@/api/healthinsurance";
import { formatDate } from "@/utils/dateUtils";

const { Option } = Select;

export function UserHealthInsurance() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [insurance, setInsurance] = useState<any>(null);
  const [imageFile, setImageFile] = useState<File | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchInsurance();
  }, []);

  const fetchInsurance = async () => {
    try {
      const response = await getCurrentUserHealthInsurance();
      if (response.isSuccess) {
        setInsurance(response.data);
        if (response.data.hasInsurance) {
          form.setFieldsValue({
            hasInsurance: response.data.hasInsurance,
            healthInsuranceNumber: response.data.healthInsuranceNumber,
            fullName: response.data.fullName,
            dateOfBirth: response.data.dateOfBirth ? dayjs(response.data.dateOfBirth) : null,
            gender: response.data.gender,
            address: response.data.address,
            healthcareProviderName: response.data.healthcareProviderName,
            healthcareProviderCode: response.data.healthcareProviderCode,
            validFrom: response.data.validFrom ? dayjs(response.data.validFrom) : null,
            validTo: response.data.validTo ? dayjs(response.data.validTo) : null,
            issueDate: response.data.issueDate ? dayjs(response.data.issueDate) : null,
          });
        }
      }
    } catch (error) {
      message.error("Failed to fetch insurance information");
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values: any) => {
    setSubmitting(true);
    try {
      const data = {
        ...values,
        dateOfBirth: values.dateOfBirth?.format("YYYY-MM-DD"),
        validFrom: values.validFrom?.format("YYYY-MM-DD"),
        validTo: values.validTo?.format("YYYY-MM-DD"),
        issueDate: values.issueDate?.format("YYYY-MM-DD"),
      };

      let response;
      if (insurance.verificationStatus === "Verified") {
        response = await requestHealthInsuranceUpdate(insurance.id, data, imageFile);
        if (response.isSuccess) {
          message.success("Update request submitted successfully");
        }
      } else {
        response = await updateHealthInsurance(insurance.id, data, imageFile);
        if (response.isSuccess) {
          message.success("Insurance updated successfully");
          await fetchInsurance();
        }
      }
    } catch (error) {
      message.error("Failed to update insurance");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Spin size="large" />;
  }

  if (!insurance) {
    return <div>No insurance information found.</div>;
  }

  return (
    <Card title="My Health Insurance">
      {insurance && (
        <Descriptions title="Current Information" bordered column={2} style={{ marginBottom: 24 }}>
          <Descriptions.Item label="Status">{insurance.status}</Descriptions.Item>
          <Descriptions.Item label="Verification Status">
            {insurance.verificationStatus}
          </Descriptions.Item>
          {insurance.hasInsurance && (
            <>
              <Descriptions.Item label="Insurance Number">
                {insurance.healthInsuranceNumber}
              </Descriptions.Item>
              <Descriptions.Item label="Full Name">{insurance.fullName}</Descriptions.Item>
              <Descriptions.Item label="Date of Birth">
                {formatDate(insurance.dateOfBirth)}
              </Descriptions.Item>
              <Descriptions.Item label="Gender">{insurance.gender}</Descriptions.Item>
              <Descriptions.Item label="Address">{insurance.address}</Descriptions.Item>
              <Descriptions.Item label="Healthcare Provider">
                {insurance.healthcareProviderName} ({insurance.healthcareProviderCode})
              </Descriptions.Item>
              <Descriptions.Item label="Valid From">
                {formatDate(insurance.validFrom)}
              </Descriptions.Item>
              <Descriptions.Item label="Valid To">{formatDate(insurance.validTo)}</Descriptions.Item>
              <Descriptions.Item label="Issue Date">
                {formatDate(insurance.issueDate)}
              </Descriptions.Item>
            </>
          )}
        </Descriptions>
      )}

      {insurance.imageUrl && (
        <div style={{ marginBottom: 24 }}>
          <h4>Current Insurance Image</h4>
          <Image src={insurance.imageUrl} alt="Insurance" style={{ maxWidth: "100%" }} />
        </div>
      )}

      <Card
        title={
          insurance.verificationStatus === "Verified"
            ? "Submit Update Request"
            : "Update Insurance Information"
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ hasInsurance: insurance.hasInsurance }}
        >
          <Form.Item
            name="hasInsurance"
            label="Do you have health insurance?"
            rules={[{ required: true, message: "Please select an option" }]}
          >
            <Select>
              <Option value={true}>Yes</Option>
              <Option value={false}>No</Option>
            </Select>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.hasInsurance !== currentValues.hasInsurance
            }
          >
            {({ getFieldValue }) =>
              getFieldValue("hasInsurance") ? (
                <>
                  <Form.Item
                    name="healthInsuranceNumber"
                    label="Insurance Number"
                    rules={[
                      { required: true, message: "Please enter your insurance number" },
                    ]}
                  >
                    <Input />
                  </Form.Item>

                  <Form.Item
                    name="fullName"
                    label="Full Name"
                    rules={[{ required: true, message: "Please enter your full name" }]}
                  >
                    <Input />
                  </Form.Item>

                  <Form.Item
                    name="dateOfBirth"
                    label="Date of Birth"
                    rules={[{ required: true, message: "Please select your date of birth" }]}
                  >
                    <DatePicker style={{ width: "100%" }} />
                  </Form.Item>

                  <Form.Item
                    name="gender"
                    label="Gender"
                    rules={[{ required: true, message: "Please select your gender" }]}
                  >
                    <Select>
                      <Option value="Male">Male</Option>
                      <Option value="Female">Female</Option>
                      <Option value="Other">Other</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="address"
                    label="Address"
                    rules={[{ required: true, message: "Please enter your address" }]}
                  >
                    <Input />
                  </Form.Item>

                  <Form.Item
                    name="healthcareProviderName"
                    label="Healthcare Provider Name"
                    rules={[
                      { required: true, message: "Please enter healthcare provider name" },
                    ]}
                  >
                    <Input />
                  </Form.Item>

                  <Form.Item
                    name="healthcareProviderCode"
                    label="Healthcare Provider Code"
                    rules={[
                      { required: true, message: "Please enter healthcare provider code" },
                    ]}
                  >
                    <Input />
                  </Form.Item>

                  <Form.Item
                    name="validFrom"
                    label="Valid From"
                    rules={[{ required: true, message: "Please select valid from date" }]}
                  >
                    <DatePicker style={{ width: "100%" }} />
                  </Form.Item>

                  <Form.Item
                    name="validTo"
                    label="Valid To"
                    rules={[{ required: true, message: "Please select valid to date" }]}
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
                    label="Insurance Image"
                    rules={[
                      {
                        required: !insurance.imageUrl,
                        message: "Please upload your insurance image",
                      },
                    ]}
                  >
                    <Upload
                      beforeUpload={(file) => {
                        setImageFile(file);
                        return false;
                      }}
                      maxCount={1}
                    >
                      <Button icon={<UploadOutlined />}>Click to Upload</Button>
                    </Upload>
                  </Form.Item>
                </>
              ) : null
            }
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting}>
              {insurance.verificationStatus === "Verified"
                ? "Submit Update Request"
                : "Update Insurance"}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </Card>
  );
} 