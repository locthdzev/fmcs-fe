import React, { useState } from "react";
import {
  Modal,
  Button,
  Checkbox,
  Input,
  Form,
  Upload,
  message,
  Progress,
  Spin,
  Typography,
  Alert,
  Divider,
  Space,
} from "antd";
import {
  UploadOutlined,
  InboxOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import type { UploadFile, UploadProps } from "antd/es/upload/interface";
import { RcFile } from "antd/es/upload";
import { exportUserTemplate, importUsers } from "@/api/user";
import UserResultModal from "./UserResultModal";
import DetailedErrorModal from "./DetailedErrorModal";
import { UserImportResultDTO } from "./ExportErrorUtils";

const { Dragger } = Upload;
const { Text } = Typography;

interface ImportUserModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

const ImportUserModal: React.FC<ImportUserModalProps> = ({
  visible,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [importResult, setImportResult] = useState<UserImportResultDTO | null>(
    null
  );
  const [error, setError] = useState<string>("");
  const [useDefaultPassword, setUseDefaultPassword] = useState<boolean>(true);
  const [messageApi, contextHolder] = message.useMessage();
  const [resultModalVisible, setResultModalVisible] = useState<boolean>(false);
  const [detailedErrorsVisible, setDetailedErrorsVisible] =
    useState<boolean>(false);

  // Reset modal state when opening
  React.useEffect(() => {
    if (visible) {
      form.resetFields();
      setFileList([]);
      setUploading(false);
      setUploadProgress(0);
      setImportResult(null);
      setError("");
      setUseDefaultPassword(true);
      setResultModalVisible(false);
      setDetailedErrorsVisible(false);
    }
  }, [visible, form]);

  // Handle download template
  const handleDownloadTemplate = async () => {
    try {
      messageApi.loading({
        content: "Downloading template...",
        key: "downloadTemplate",
      });
      const response = await exportUserTemplate();

      if (response.isSuccess) {
        messageApi.success({
          content: "Template downloaded successfully",
          key: "downloadTemplate",
        });
        window.open(response.data, "_blank");
      } else {
        messageApi.error({
          content: response.message || "Failed to download template",
          key: "downloadTemplate",
        });
      }
    } catch (error) {
      console.error("Error downloading template:", error);
      messageApi.error({
        content: "An error occurred while downloading template",
        key: "downloadTemplate",
      });
    }
  };

  // Setup upload properties
  const uploadProps: UploadProps = {
    accept: ".xlsx, .xls",
    multiple: false,
    fileList,
    beforeUpload: (file) => {
      const isExcel =
        file.type ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.type === "application/vnd.ms-excel";
      if (!isExcel) {
        messageApi.error("You can only upload Excel files!");
        return Upload.LIST_IGNORE;
      }

      // Add file to list
      setFileList([file]);
      return false; // Prevent auto upload
    },
    onRemove: () => {
      setFileList([]);
      return true;
    },
    progress: {
      strokeColor: {
        "0%": "#108ee9",
        "100%": "#87d068",
      },
      size: 3,
      format: (percent) => percent && `${parseFloat(percent.toFixed(2))}%`,
    },
  };

  // Simulate progress during upload
  const simulateProgress = () => {
    let progress = 0;
    const timer = setInterval(() => {
      if (progress >= 99) {
        clearInterval(timer);
      } else {
        progress += Math.random() * 3 + 1;
        setUploadProgress(Math.min(Math.round(progress), 99));
      }
    }, 200);
    return timer;
  };

  // Handle form submission
  const handleUpload = async () => {
    try {
      await form.validateFields();

      if (fileList.length === 0) {
        messageApi.error("Please select a file to upload");
        return;
      }

      setUploading(true);
      setError("");
      setImportResult(null);

      // Simulate progress
      const progressTimer = simulateProgress();

      try {
        // Get form values
        const values = form.getFieldsValue();

        // Get file from fileList
        const file = fileList[0] as unknown as RcFile;

        // Import users
        const response = await importUsers(file, {
          skipDuplicates: values.skipDuplicates,
          stopOnError: values.stopOnError,
          useDefaultPassword: values.useDefaultPassword,
          defaultPassword: values.defaultPassword,
        });

        // Clear progress timer
        clearInterval(progressTimer);

        if (response.isSuccess) {
          setImportResult(response.data);
          setUploadProgress(100);
          setTimeout(() => {
            setResultModalVisible(true);
            onSuccess(); // Notify parent component of success
          }, 500);
        } else {
          setError(response.message || "Import failed");
          messageApi.error(response.message || "Import failed");
        }
      } catch (error: any) {
        clearInterval(progressTimer);
        setError(error.toString());
        messageApi.error("An error occurred during import");
      } finally {
        setUploading(false);
      }
    } catch (validationError) {
      messageApi.error("Please check your input");
    }
  };

  // Handle reset form
  const handleReset = () => {
    form.resetFields();
    setFileList([]);
    setError("");
  };

  // Close result modal
  const closeResultModal = () => {
    setResultModalVisible(false);
    onCancel();
  };

  // Back to import form
  const backToImport = () => {
    handleReset();
    setResultModalVisible(false);
  };

  // Toggle detailed errors modal
  const toggleDetailedErrors = () => {
    setDetailedErrorsVisible(!detailedErrorsVisible);
  };

  return (
    <>
      {contextHolder}
      <Modal
        title="Import Users"
        open={visible}
        onCancel={onCancel}
        footer={[
          <Button key="reset" onClick={handleReset} disabled={uploading}>
            Reset
          </Button>,
          <Button
            key="import"
            type="primary"
            onClick={handleUpload}
            loading={uploading}
            disabled={fileList.length === 0}
          >
            Import
          </Button>,
        ]}
        width={900}
        maskClosable={!uploading}
        closable={!uploading}
      >
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ width: '40%' }}>
            {/* Template Download Button */}
            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <Button
                icon={<DownloadOutlined />}
                onClick={handleDownloadTemplate}
                type="primary"
                ghost
              >
                Download Import Template
              </Button>
              <Text
                type="secondary"
                style={{ display: "block", marginTop: "8px" }}
              >
                Download the template first to see the required format
              </Text>
            </div>

            <Divider />

            {/* Import Settings */}
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                skipDuplicates: true,
                stopOnError: false,
                useDefaultPassword: true,
                defaultPassword: "Password@123",
              }}
            >
              <Form.Item
                name="skipDuplicates"
                valuePropName="checked"
                style={{ marginBottom: "8px" }}
              >
                <Checkbox>
                  Skip duplicates (users with existing email/username/phone)
                </Checkbox>
              </Form.Item>

              <Form.Item
                name="stopOnError"
                valuePropName="checked"
                style={{ marginBottom: "8px" }}
              >
                <Checkbox>Stop import on first error</Checkbox>
              </Form.Item>

              <Form.Item
                name="useDefaultPassword"
                valuePropName="checked"
                style={{ marginBottom: "8px" }}
              >
                <Checkbox
                  onChange={(e) => setUseDefaultPassword(e.target.checked)}
                >
                  Use default password for all users
                </Checkbox>
              </Form.Item>

              {useDefaultPassword && (
                <Form.Item
                  name="defaultPassword"
                  label="Default Password"
                  rules={[
                    {
                      required: true,
                      message: "Please enter the default password",
                    },
                  ]}
                  style={{ marginBottom: "16px" }}
                >
                  <Input.Password placeholder="Enter default password" />
                </Form.Item>
              )}

              {/* File Upload */}
              <div
                style={{
                  marginTop: "16px",
                  border: "1px dashed #d9d9d9",
                  borderRadius: "4px",
                  padding: "16px",
                }}
              >
                <Dragger {...uploadProps} style={{ padding: "10px 0" }}>
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                  </p>
                  <p className="ant-upload-text">
                    Click or drag file to this area to upload
                  </p>
                  <p className="ant-upload-hint">
                    Support for a single Excel file (.xlsx, .xls)
                  </p>
                </Dragger>
              </div>

              {error && (
                <Alert
                  message="Error"
                  description={error}
                  type="error"
                  showIcon
                  style={{ marginTop: "16px" }}
                />
              )}

              {uploading && (
                <div style={{ marginTop: "16px" }}>
                  <Progress percent={uploadProgress} status="active" />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      marginTop: "16px",
                    }}
                  >
                    <Spin tip="Processing import..." />
                  </div>
                </div>
              )}
            </Form>
          </div>

          <div style={{ width: '60%' }}>
            {/* Instructions Alert */}
            <Alert
              message="How to use the template"
              description={
                <div>
                  <h4>Step 1: Download and prepare the template</h4>
                  <ul style={{ paddingLeft: "20px", marginBottom: "10px" }}>
                    <li>
                      Open the downloaded Excel file and go to the{" "}
                      <Text strong>Users</Text> sheet
                    </li>
                    <li>
                      <Text type="danger">
                        IMPORTANT: Your data must start from row 6 (right below the
                        orange header row)
                      </Text>
                    </li>
                    <li>
                      Do NOT modify the header row (row 5 with orange background)
                    </li>
                  </ul>

                  <h4>Step 2: Fill in user data correctly</h4>
                  <ul style={{ paddingLeft: "20px", marginBottom: "10px" }}>
                    <li>
                      Make sure to fill all required fields (Full Name, Username,
                      Email, Gender, DOB, Address, Phone)
                    </li>
                    <li>
                      <Text type="warning">
                        Date format should be DD/MM/YYYY (day/month/year)
                      </Text>
                    </li>
                    <li>Each phone number, email and username must be unique</li>
                  </ul>
                  
                  <h4>Step 3: Import your data</h4>
                  <ul style={{ paddingLeft: "20px" }}>
                    <li>Save the Excel file once you've entered all user data</li>
                    <li>Use the upload area to select and import your file</li>
                    <li>
                      If you see "No users were imported" but no errors, check that
                      your data starts at row 6
                    </li>
                  </ul>
                </div>
              }
              type="info"
              showIcon
            />
          </div>
        </div>
      </Modal>

      {/* User Result Modal */}
      <UserResultModal
        visible={resultModalVisible}
        onCancel={closeResultModal}
        onShowDetailedErrors={toggleDetailedErrors}
        importResult={importResult}
        skipDuplicates={form.getFieldValue("skipDuplicates")}
        onReset={backToImport}
      />

      {/* Detailed Error Modal */}
      <DetailedErrorModal
        visible={detailedErrorsVisible}
        onCancel={toggleDetailedErrors}
        importResult={importResult}
        skipDuplicates={form.getFieldValue("skipDuplicates")}
        messageApi={messageApi}
      />
    </>
  );
};

export default ImportUserModal;
