import React from "react";
import { Modal, Button, Alert, Typography, Statistic, Space, Card } from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import ErrorTable from "./ErrorTable";
import { UserImportResultDTO } from "./ExportErrorUtils";

const { Text } = Typography;

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
    return <SearchOutlined style={{ fontSize: 48, color: "#1890ff" }} />;
  };

  return (
    <Modal
      title="Import Results"
      open={visible}
      onCancel={onCancel}
      width={700}
      footer={[
        <Button key="close" onClick={onCancel}>
          Close
        </Button>,
      ]}
    >
      <div style={{ marginBottom: "24px" }}>
        <Card bordered={false}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            {getStatusIcon()}
            <div style={{ marginTop: 16, marginBottom: 24 }}>
              <Space size="large">
                <Statistic
                  title="Processed"
                  value={importResult.totalRows}
                  valueStyle={{ fontSize: "18px" }}
                />
                <Statistic
                  title="Imported"
                  value={importResult.successCount}
                  valueStyle={{ color: "#3f8600", fontSize: "18px" }}
                  prefix={<CheckCircleOutlined />}
                />
                <Statistic
                  title="Errors"
                  value={importResult.errorCount}
                  valueStyle={{ color: "#cf1322", fontSize: "18px" }}
                  prefix={<CloseCircleOutlined />}
                />
              </Space>
            </div>
          </div>

          <div>
            {importResult.successCount === 0 &&
              importResult.errorCount === 0 && (
                <Alert
                  message="No data was imported"
                  description="The file was processed but no data was found or no changes were made. Please check that:
                    1. You've added data below the header row (starting from row 6)
                    2. All required fields are filled
                    3. You're not entering data in the instruction area"
                  type="warning"
                  showIcon
                />
              )}

            {importResult.successCount > 0 && (
              <Alert
                message={`${importResult.successCount} Users Imported Successfully`}
                description={
                  <div>
                    <p>The following data was imported successfully:</p>
                    {importResult.errors.length > 0 ? (
                      <p>
                        All rows except for the error rows shown below were
                        successfully imported.
                      </p>
                    ) : (
                      <p>
                        All {importResult.totalRows} rows were successfully
                        imported.
                      </p>
                    )}
                    <p>
                      <Text type="success">
                        Successfully imported users will now appear in your user
                        list.
                      </Text>
                    </p>
                  </div>
                }
                type="success"
                showIcon
                style={{ marginBottom: "16px" }}
              />
            )}

            {importResult.errorCount > 0 && (
              <div>
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
                  errors={importResult.errors}
                  skipDuplicates={skipDuplicates}
                />

                {skipDuplicates && (
                  <Alert
                    message="About Skipped Records"
                    description={
                      <div>
                        <p>
                          When "Skip Duplicates" is enabled, records with
                          duplicate email, username, or phone number are
                          skipped.
                        </p>
                        <p>
                          These records are marked as SKIPPED in the table above
                          but are not counted as actual errors.
                        </p>
                        <p>
                          To import these records, you need to change the
                          duplicate values to be unique.
                        </p>
                      </div>
                    }
                    type="info"
                    showIcon
                    style={{ marginTop: "12px" }}
                  />
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </Modal>
  );
};

export default UserResultModal;
