import React from "react";
import {
  Modal,
  Button,
  Alert,
  Typography,
  Statistic,
  Space,
  Card,
  Tabs,
  Descriptions,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  SearchOutlined,
  InfoCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import ErrorTable from "./ErrorTable";
import { UserImportResultDTO } from "./ExportErrorUtils";

const { Text, Title } = Typography;
const { TabPane } = Tabs;

interface UserResultModalProps {
  visible: boolean;
  onCancel: () => void;
  onShowDetailedErrors: () => void;
  importResult: UserImportResultDTO | null;
  skipDuplicates: boolean;
  onReset: () => void;
}

const UserResultModal: React.FC<UserResultModalProps> = ({
  visible,
  onCancel,
  onShowDetailedErrors,
  importResult,
  skipDuplicates,
  onReset,
}) => {
  if (!importResult) return null;

  // Xác định icon và màu cho kết quả
  const getStatusIcon = () => {
    if (importResult.successCount > 0) {
      return <CheckCircleOutlined style={{ fontSize: 48, color: "#52c41a" }} />;
    } else if (importResult.errorCount > 0) {
      return <CloseCircleOutlined style={{ fontSize: 48, color: "#f5222d" }} />;
    }
    return <InfoCircleOutlined style={{ fontSize: 48, color: "#1890ff" }} />;
  };

  // Hiển thị thông báo thành công
  const renderSuccessContent = () => (
    <Alert
      message={`${importResult.successCount} Users Imported Successfully`}
      description={
        <div>
          <p>The following data was imported successfully:</p>
          {importResult.errors?.length > 0 ? (
            <p>
              All rows except for the error rows shown below were successfully
              imported.
            </p>
          ) : (
            <p>All {importResult.totalRows} rows were successfully imported.</p>
          )}
          <p>
            <Text type="success">
              Successfully imported users will now appear in your user list.
            </Text>
          </p>
        </div>
      }
      type="success"
      showIcon
      style={{ marginBottom: "16px" }}
    />
  );

  // Hiển thị thông báo lỗi
  const renderErrorContent = () => (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <Text strong style={{ fontSize: "16px" }}>
          {skipDuplicates
            ? "The following records were skipped or had errors:"
            : "The following errors occurred during import:"}
        </Text>
        <Button
          type="primary"
          icon={<SearchOutlined />}
          onClick={onShowDetailedErrors}
        >
          View Detailed Errors
        </Button>
      </div>

      <ErrorTable
        errors={importResult.errors || []}
        skipDuplicates={skipDuplicates}
      />

      {skipDuplicates && (
        <Alert
          message="About Skipped Records"
          description={
            <div>
              <p>
                When "Skip Duplicates" is enabled, records with duplicate email,
                username, or phone number are skipped.
              </p>
              <p>
                These records are marked as SKIPPED in the table above but are
                not counted as actual errors.
              </p>
              <p>
                To import these records, you need to change the duplicate values
                to be unique.
              </p>
            </div>
          }
          type="info"
          showIcon
          style={{ marginTop: "12px" }}
        />
      )}
    </>
  );

  // Hiển thị thông báo không có dữ liệu
  const renderNoDataContent = () => (
    <Alert
      message="No data was imported"
      description="The file was processed but no data was found or no changes were made. Please check that:
          1. You've added data below the header row (starting from row 6)
          2. All required fields are filled
          3. You're not entering data in the instruction area"
      type="warning"
      showIcon
    />
  );

  // Hiển thị thông báo tất cả dữ liệu đều lỗi
  const renderAllFailedContent = () => (
    <Alert
      message="No users were imported successfully"
      description={
        <div>
          <p>
            <strong>
              All {importResult.totalRows} row(s) have errors or were skipped.
            </strong>
          </p>
          <p>
            No users were imported successfully. Please check the errors below
            and try again.
          </p>
          <p>Common reasons for failure:</p>
          <ul>
            <li>Missing required fields (Full Name, Username, Email, etc.)</li>
            <li>
              Invalid data format (especially for dates or email addresses)
            </li>
            <li>Duplicate data (username, email, or phone already exists)</li>
            <li>Data entered in wrong rows (e.g., in the instruction area)</li>
          </ul>
        </div>
      }
      type="error"
      showIcon
      icon={<WarningOutlined />}
      style={{ marginBottom: "16px" }}
    />
  );

  return (
    <Modal
      title={
        <Title level={4} style={{ margin: 0 }}>
          Import Results
        </Title>
      }
      open={visible}
      onCancel={onCancel}
      width={1200}
      footer={[
        <Button key="reset" onClick={onReset} type="primary" ghost>
          Try Again
        </Button>,
        <Button key="close" onClick={onCancel}>
          Close
        </Button>,
      ]}
    >
      <div style={{ display: "flex", marginBottom: "20px" }}>
        <div style={{ textAlign: "center", padding: "10px", width: "20%" }}>
          {getStatusIcon()}
          <Descriptions
            layout="vertical"
            column={1}
            style={{ marginTop: "20px" }}
          >
            <Descriptions.Item label="Total Processed">
              <Statistic value={importResult.totalRows} />
            </Descriptions.Item>
            <Descriptions.Item label="Successfully Imported">
              <Statistic
                value={importResult.successCount}
                valueStyle={{ color: "#3f8600" }}
                prefix={<CheckCircleOutlined />}
              />
            </Descriptions.Item>
            <Descriptions.Item label="Errors/Skipped">
              <Statistic
                value={importResult.errorCount}
                valueStyle={{ color: "#cf1322" }}
                prefix={<CloseCircleOutlined />}
              />
            </Descriptions.Item>
          </Descriptions>
        </div>

        <div
          style={{
            width: "80%",
            borderLeft: "1px solid #f0f0f0",
            paddingLeft: "20px",
          }}
        >
          {importResult.totalRows === 0 ? (
            // Không có dữ liệu được xử lý
            renderNoDataContent()
          ) : importResult.successCount === 0 && importResult.errorCount > 0 ? (
            // Tất cả các dòng đều lỗi
            <Tabs defaultActiveKey="summary">
              <TabPane tab="Summary" key="summary">
                {renderAllFailedContent()}
              </TabPane>
              <TabPane tab={`Errors (${importResult.errorCount})`} key="errors">
                {renderErrorContent()}
              </TabPane>
            </Tabs>
          ) : (
            // Có ít nhất một dòng thành công
            <Tabs defaultActiveKey="summary">
              <TabPane tab="Summary" key="summary">
                {importResult.successCount > 0 && renderSuccessContent()}
                {importResult.errorCount > 0 && (
                  <Alert
                    message={`${importResult.errorCount} Records with Issues`}
                    description={
                      <div>
                        <p>
                          Some records couldn't be imported due to errors or
                          duplicate data.
                        </p>
                        <p>
                          Click the "Errors" tab to view details, or use the
                          "View Detailed Errors" button for a full-screen view.
                        </p>
                      </div>
                    }
                    type="warning"
                    showIcon
                  />
                )}
              </TabPane>
              {importResult.errorCount > 0 && (
                <TabPane
                  tab={`Errors (${importResult.errorCount})`}
                  key="errors"
                >
                  {renderErrorContent()}
                </TabPane>
              )}
            </Tabs>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default UserResultModal;
