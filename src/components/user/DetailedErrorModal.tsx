import React from "react";
import { Modal, Button, Typography } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import ErrorTable from "./ErrorTable";
import { UserImportResultDTO, exportErrorList } from "./ExportErrorUtils";

const { Text } = Typography;

interface DetailedErrorModalProps {
  visible: boolean;
  onCancel: () => void;
  importResult: UserImportResultDTO | null;
  skipDuplicates: boolean;
  messageApi: any;
}

const DetailedErrorModal: React.FC<DetailedErrorModalProps> = ({
  visible,
  onCancel,
  importResult,
  skipDuplicates,
  messageApi,
}) => {
  // Hàm gọi chức năng xuất danh sách lỗi
  const handleExportErrorList = () => {
    exportErrorList(importResult, messageApi);
  };

  return (
    <Modal
      title={
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>Detailed Error List</span>
          <div>
            <Text style={{ marginRight: "20px" }}>
              Total Errors: {importResult?.errors?.length || 0}
            </Text>
            {importResult?.errors &&
              importResult.errors.filter((e) =>
                e.errorMessage.includes("already exists")
              ).length > 0 && (
                <Text type="warning" style={{ marginRight: "20px" }}>
                  Skipped:{" "}
                  {importResult?.errors?.filter((e) =>
                    e.errorMessage.includes("already exists")
                  ).length || 0}
                </Text>
              )}
            {importResult?.errors &&
              importResult.errors.filter(
                (e) => !e.errorMessage.includes("already exists")
              ).length > 0 && (
                <Text type="danger">
                  Errors:{" "}
                  {importResult?.errors?.filter(
                    (e) => !e.errorMessage.includes("already exists")
                  ).length || 0}
                </Text>
              )}
          </div>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      width="80%"
      style={{ top: 20 }}
      footer={[
        <Button key="close" onClick={onCancel}>
          Close
        </Button>,
        <Button
          key="download"
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleExportErrorList}
        >
          Export Error List
        </Button>,
      ]}
    >
      {importResult && (
        <>
          <div style={{ marginBottom: "16px" }}>
            <Text>
              This view shows all errors and skipped records in detail. Use the
              search and pagination features to navigate through the records.
              Click the "Export Error List" button to download a detailed Excel
              report of all errors.
            </Text>
          </div>

          <ErrorTable
            errors={importResult.errors}
            skipDuplicates={skipDuplicates}
            fullHeight={true}
          />
        </>
      )}
    </Modal>
  );
};

export default DetailedErrorModal; 