import React from "react";
import {
  Button,
  Card,
  Divider,
  Space,
  Typography,
  Form,
  Input,
  DatePicker,
  Select,
  Upload,
  Row,
  Col,
  Radio,
  Steps,
  Result,
  Image,
} from "antd";
import {
  SaveOutlined,
  UserOutlined,
  UploadOutlined,
  FileImageOutlined,
  MedicineBoxOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import type { UploadFile, RcFile } from "antd/es/upload/interface";
import dayjs from "dayjs";
import PageContainer from "@/components/shared/PageContainer";
import { HealthInsuranceResponseDTO } from "@/api/healthinsurance";
import { UserResponseDTO } from "@/api/user";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface InsuranceEditFormProps {
  form: any;
  insurance: HealthInsuranceResponseDTO;
  users: UserResponseDTO[];
  fileList: UploadFile[];
  setFileList: React.Dispatch<React.SetStateAction<UploadFile[]>>;
  currentStep: number;
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
  hasInsurance: boolean;
  setHasInsurance: React.Dispatch<React.SetStateAction<boolean>>;
  onCancel: () => void;
  onSubmit: (values: any) => Promise<void>;
  saving: boolean;
}

const InsuranceEditForm: React.FC<InsuranceEditFormProps> = ({
  form,
  insurance,
  users,
  fileList,
  setFileList,
  currentStep,
  setCurrentStep,
  hasInsurance,
  setHasInsurance,
  onCancel,
  onSubmit,
  saving,
}) => {
  const handleNextStep = () => {
    if (currentStep === 0) {
      // From step 1 (Has Insurance) to step 2 (Info Entry)
      form.validateFields(["hasInsurance"]).then(() => {
        setHasInsurance(form.getFieldValue("hasInsurance"));
        setCurrentStep(currentStep + 1);
      });
    } else if (currentStep === 1) {
      // From step 2 (Info Entry) to step 3 (Review)
      if (hasInsurance) {
        form
          .validateFields([
            "userId",
            "healthInsuranceNumber",
            "fullName",
            "dateOfBirth",
            "gender",
            "healthcareProviderName",
            "validFrom",
            "validTo",
            "issueDate",
          ])
          .then(() => {
            setCurrentStep(currentStep + 1);
          });
      } else {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  const handleFileChange = (info: any) => {
    // Always update fileList with the latest file
    const newFileList = [...info.fileList];

    // Limit to only one file
    const limitedFileList = newFileList.slice(-1);

    // Set the status of the file
    limitedFileList.forEach((file) => {
      if (file.status === "error") {
        file.status = "done";
      }
    });

    setFileList(limitedFileList);

    // Ensure originFileObj is properly set when a new file is uploaded
    if (
      info.file.status === "done" ||
      info.file.status === "error" ||
      info.file.originFileObj
    ) {
      console.log("New file uploaded:", info.file.originFileObj);
      
      // Set a key in the form to track that the image was changed
      form.setFieldsValue({ imageChanged: true });
    }
  };

  const beforeUpload = (file: RcFile) => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      alert("You can only upload image files!");
    }

    const isLessThan2MB = file.size / 1024 / 1024 < 2;
    if (!isLessThan2MB) {
      alert("Image must be smaller than 2MB!");
    }

    // Return false to prevent automatic upload
    return false;
  };

  const renderStepActions = () => {
    return (
      <div className="flex justify-between mt-4">
        {currentStep > 0 && (
          <Button icon={<ArrowLeftOutlined />} onClick={handlePrevStep}>
            Back
          </Button>
        )}

        <div className="flex ml-auto">
          <Button onClick={onCancel} className="mr-2">
            Cancel
          </Button>

          {currentStep < 2 ? (
            <Button type="primary" onClick={handleNextStep}>
              Next
            </Button>
          ) : (
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={saving}
              onClick={() => form.submit()}
            >
              Save Changes
            </Button>
          )}
        </div>
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Card title="Insurance Status">
            <Form.Item
              name="hasInsurance"
              label="Does this user have health insurance?"
              rules={[
                {
                  required: true,
                  message: "Please select whether the user has insurance",
                },
              ]}
            >
              <Radio.Group onChange={(e) => setHasInsurance(e.target.value)}>
                <Radio value={true}>Yes, user has health insurance</Radio>
                <Radio value={false}>
                  No, user does not have health insurance
                </Radio>
              </Radio.Group>
            </Form.Item>
            <div className="mt-4">
              <Text type="secondary">
                {hasInsurance
                  ? "Select 'Yes' if the user has a valid health insurance card. You will need to enter the insurance details in the next step."
                  : "Select 'No' if the user does not have health insurance. This will clear any existing insurance information."}
              </Text>
            </div>

            {renderStepActions()}
          </Card>
        );
      case 1:
        return hasInsurance ? (
          <>
            <Row gutter={[24, 0]}>
              <Col span={24} md={16}>
                <Card title="User Information" className="mb-4">
                  <Form.Item
                    name="userId"
                    label="User"
                    rules={[
                      { required: true, message: "Please select a user" },
                    ]}
                  >
                    <Select
                      placeholder="Select a user"
                      showSearch
                      optionFilterProp="children"
                      filterOption={(input, option) =>
                        (option?.label?.toString() || "")
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                      options={users.map((user) => ({
                        value: user.id,
                        label: `${user.fullName} (${user.email})`,
                      }))}
                      disabled={true} // Can't change user in edit mode
                    />
                  </Form.Item>
                </Card>

                <Card title="Insurance Information">
                  <Row gutter={16}>
                    <Col span={24} md={12}>
                      <Form.Item
                        name="healthInsuranceNumber"
                        label="Health Insurance Number"
                        rules={[
                          {
                            required: true,
                            message: "Please enter health insurance number",
                          },
                        ]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={24} md={12}>
                      <Form.Item
                        name="fullName"
                        label="Full Name"
                        rules={[
                          { required: true, message: "Please enter full name" },
                        ]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={24} md={12}>
                      <Form.Item
                        name="dateOfBirth"
                        label="Date of Birth"
                        rules={[
                          {
                            required: true,
                            message: "Please select date of birth",
                          },
                        ]}
                      >
                        <DatePicker style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                    <Col span={24} md={12}>
                      <Form.Item
                        name="gender"
                        label="Gender"
                        rules={[
                          { required: true, message: "Please select gender" },
                        ]}
                      >
                        <Select placeholder="Select gender">
                          <Option value="Male">Male</Option>
                          <Option value="Female">Female</Option>
                          <Option value="Other">Other</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item name="address" label="Address">
                    <TextArea rows={3} />
                  </Form.Item>

                  <Row gutter={16}>
                    <Col span={24} md={12}>
                      <Form.Item
                        name="healthcareProviderName"
                        label="Healthcare Provider Name"
                        rules={[
                          {
                            required: true,
                            message: "Please enter healthcare provider name",
                          },
                        ]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={24} md={12}>
                      <Form.Item
                        name="healthcareProviderCode"
                        label="Healthcare Provider Code"
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={24} md={8}>
                      <Form.Item
                        name="validFrom"
                        label="Valid From"
                        rules={[
                          {
                            required: true,
                            message: "Please select valid from date",
                          },
                        ]}
                      >
                        <DatePicker style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                    <Col span={24} md={8}>
                      <Form.Item
                        name="validTo"
                        label="Valid To"
                        rules={[
                          {
                            required: true,
                            message: "Please select valid to date",
                          },
                        ]}
                      >
                        <DatePicker style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                    <Col span={24} md={8}>
                      <Form.Item
                        name="issueDate"
                        label="Issue Date"
                        rules={[
                          {
                            required: true,
                            message: "Please select issue date",
                          },
                        ]}
                      >
                        <DatePicker style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Divider />
                  {renderStepActions()}
                </Card>
              </Col>

              <Col span={24} md={8}>
                <Card title="Insurance Card Image">
                  <Form.Item
                    name="imageFile"
                    valuePropName="fileList"
                    getValueFromEvent={normFile}
                    label="Upload Insurance Card Image"
                    extra="Support for JPG, PNG or JPEG. Max size: 2MB"
                  >
                    <Upload
                      name="imageFile"
                      listType="picture-card"
                      fileList={fileList}
                      beforeUpload={beforeUpload}
                      onChange={handleFileChange}
                      maxCount={1}
                      showUploadList={{
                        showPreviewIcon: true,
                        showRemoveIcon: true,
                      }}
                    >
                      <Button
                        icon={<UploadOutlined />}
                        style={{ width: "100%", height: "100%" }}
                      >
                        Click to Upload
                      </Button>
                    </Upload>
                  </Form.Item>

                  {fileList.length > 0 && fileList[0].url && (
                    <div className="mt-4">
                      <Text strong>Current Image:</Text>
                      <div className="mt-2">
                        <Image
                          src={fileList[0].url}
                          alt="Current Insurance Card"
                          style={{ maxWidth: "100%" }}
                        />
                      </div>
                    </div>
                  )}
                </Card>
              </Col>
            </Row>
          </>
        ) : (
          <Card title="No Insurance Confirmation">
            <Result
              status="warning"
              title="Confirm No Insurance"
              subTitle="By proceeding, you confirm that this user does not have health insurance. All insurance information will be removed."
            />

            {renderStepActions()}
          </Card>
        );
      case 2:
        return (
          <Card title="Review & Confirm">
            {hasInsurance ? (
              <>
                <Row gutter={[24, 24]}>
                  <Col span={24} md={16}>
                    <Card title="Review Insurance Information" type="inner">
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "16px",
                        }}
                      >
                        <div>
                          <strong>User:</strong>
                          <br />
                          {
                            users.find(
                              (u) => u.id === form.getFieldValue("userId")
                            )?.fullName
                          }{" "}
                          (
                          {
                            users.find(
                              (u) => u.id === form.getFieldValue("userId")
                            )?.email
                          }
                          )
                        </div>
                        <div>
                          <strong>Insurance Number:</strong>
                          <br />
                          {form.getFieldValue("healthInsuranceNumber")}
                        </div>
                        <div>
                          <strong>Full Name:</strong>
                          <br />
                          {form.getFieldValue("fullName")}
                        </div>
                        <div>
                          <strong>Date of Birth:</strong>
                          <br />
                          {form
                            .getFieldValue("dateOfBirth")
                            ?.format("DD/MM/YYYY") || "-"}
                        </div>
                        <div>
                          <strong>Gender:</strong>
                          <br />
                          {form.getFieldValue("gender")}
                        </div>
                        <div>
                          <strong>Address:</strong>
                          <br />
                          {form.getFieldValue("address") || "-"}
                        </div>
                        <div>
                          <strong>Healthcare Provider:</strong>
                          <br />
                          {form.getFieldValue("healthcareProviderName")}{" "}
                          {form.getFieldValue("healthcareProviderCode")
                            ? `(${form.getFieldValue(
                                "healthcareProviderCode"
                              )})`
                            : ""}
                        </div>
                        <div>
                          <strong>Valid From:</strong>
                          <br />
                          {form
                            .getFieldValue("validFrom")
                            ?.format("DD/MM/YYYY") || "-"}
                        </div>
                        <div>
                          <strong>Valid To:</strong>
                          <br />
                          {form
                            .getFieldValue("validTo")
                            ?.format("DD/MM/YYYY") || "-"}
                        </div>
                        <div>
                          <strong>Issue Date:</strong>
                          <br />
                          {form
                            .getFieldValue("issueDate")
                            ?.format("DD/MM/YYYY") || "-"}
                        </div>
                      </div>
                    </Card>
                  </Col>
                  <Col span={24} md={8}>
                    <Card title="Insurance Card Preview" type="inner">
                      {fileList.length > 0 && fileList[0].url ? (
                        <Image
                          src={fileList[0].url}
                          alt="Insurance Card Preview"
                          style={{ maxWidth: "100%" }}
                        />
                      ) : fileList.length > 0 && fileList[0].originFileObj ? (
                        <Image
                          src={URL.createObjectURL(
                            fileList[0].originFileObj as Blob
                          )}
                          alt="Insurance Card Preview"
                          style={{ maxWidth: "100%" }}
                        />
                      ) : (
                        <div className="text-center py-8">
                          <FileImageOutlined
                            style={{ fontSize: 48, color: "#ccc" }}
                          />
                          <div className="mt-2">No image uploaded</div>
                        </div>
                      )}
                    </Card>
                  </Col>
                </Row>
                <Divider />
                <div className="flex items-center justify-between">
                  <Text type="secondary">
                    Please review the information above before submitting. Once
                    submitted, this user's health insurance information will be
                    updated.
                  </Text>
                </div>
              </>
            ) : (
              <Result
                status="warning"
                title="Confirm No Insurance"
                subTitle="You are about to remove all health insurance information for this user. This action cannot be undone."
              />
            )}

            {renderStepActions()}
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <PageContainer
      title="Edit Health Insurance"
      onBack={onCancel}
      rightContent={null}
    >
      <Card className="mb-4">
        <Steps
          current={currentStep}
          items={[
            { title: "Insurance Status", description: "Has insurance?" },
            {
              title: "Information",
              description: hasInsurance ? "Enter details" : "Confirm",
            },
            { title: "Review", description: "Confirm changes" },
          ]}
        />
      </Card>

      <Form form={form} layout="vertical" onFinish={onSubmit}>
        {/* Hidden field to track if image was changed */}
        <Form.Item name="imageChanged" hidden>
          <Input />
        </Form.Item>
        
        {renderStepContent()}
      </Form>
    </PageContainer>
  );
};

export default InsuranceEditForm;
