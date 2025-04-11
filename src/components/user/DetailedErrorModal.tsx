import React, { useState } from "react";
import { Modal, Button, Typography, Card, Tabs, Badge, Statistic, Divider, Row, Col, Tooltip, Space, Alert } from "antd";
import { DownloadOutlined, FilterOutlined, FileExcelOutlined, InfoCircleOutlined, WarningOutlined } from "@ant-design/icons";
import ErrorTable from "./ErrorTable";
import { UserImportResultDTO, exportErrorList } from "./ExportErrorUtils";

const { Text, Title } = Typography;
const { TabPane } = Tabs;

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
  const [activeTab, setActiveTab] = useState("all");

  // Hàm gọi chức năng xuất danh sách lỗi
  const handleExportErrorList = () => {
    exportErrorList(importResult, messageApi);
  };

  if (!importResult || !importResult.errors) return null;

  // Tạo các mảng lỗi đã phân loại
  const duplicateErrors = importResult.errors.filter(e => 
    e.errorMessage.includes("already exists")
  );
  
  const validationErrors = importResult.errors.filter(e => 
    !e.errorMessage.includes("already exists")
  );
  
  // Xác định xem tất cả dòng có lỗi không
  const allRowsFailed = importResult.successCount === 0 && importResult.errorCount > 0;

  // Render thông tin thống kê
  const renderStatistics = () => {
    return (
      <Row gutter={16} style={{ marginBottom: '20px' }}>
        <Col span={8}>
          <Card bordered={false}>
            <Statistic 
              title="Total Errors" 
              value={importResult.errors.length} 
              valueStyle={{ color: '#1890ff' }}
              prefix={<InfoCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false}>
            <Statistic 
              title="Validation Errors" 
              value={validationErrors.length} 
              valueStyle={{ color: '#f5222d' }}
              prefix={<Badge status="error" />}
            />
            <Text type="secondary">Invalid data or missing required fields</Text>
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false}>
            <Statistic 
              title="Duplicate Records" 
              value={duplicateErrors.length} 
              valueStyle={{ color: '#faad14' }}
              prefix={<Badge status="warning" />}
            />
            <Text type="secondary">Email, username or phone already exists</Text>
          </Card>
        </Col>
      </Row>
    );
  };

  return (
    <Modal
      title={
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Title level={4} style={{ margin: 0 }}>
            {allRowsFailed 
              ? "Error Analysis - No Users Imported" 
              : "Detailed Error Analysis"}
          </Title>
          <Space>
            <Button
              type="primary"
              icon={<FileExcelOutlined />}
              onClick={handleExportErrorList}
            >
              Export Error Report
            </Button>
          </Space>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      width="90%"
      style={{ top: 20 }}
      footer={[
        <Button key="close" onClick={onCancel}>
          Close
        </Button>
      ]}
    >
      {allRowsFailed && (
        <Alert
          message="Import Failed - All Records Have Errors"
          description={
            <div>
              <p>All {importResult.totalRows} record(s) have errors or were skipped.</p>
              <p>No users were imported successfully. Review the detailed error information below to fix your data.</p>
            </div>
          }
          type="error"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: "16px" }}
        />
      )}
      
      <div style={{ marginBottom: "20px" }}>
        <Text>
          This detailed view helps you analyze all errors and skipped records. 
          Use the tabs below to filter different types of issues.
          After fixing these issues, you can try importing the file again.
        </Text>
      </div>

      {renderStatistics()}

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        type="card"
        style={{ marginBottom: '20px' }}
      >
        <TabPane 
          tab={
            <span>
              <Badge status="processing" />
              All Issues ({importResult.errors.length})
            </span>
          } 
          key="all"
        >
          <ErrorTable
            errors={importResult.errors}
            skipDuplicates={skipDuplicates}
            fullHeight={true}
          />
        </TabPane>
        
        {validationErrors.length > 0 && (
          <TabPane 
            tab={
              <span>
                <Badge status="error" />
                Validation Errors ({validationErrors.length})
              </span>
            } 
            key="validation"
          >
            <ErrorTable
              errors={validationErrors}
              skipDuplicates={skipDuplicates}
              fullHeight={true}
            />
          </TabPane>
        )}
        
        {duplicateErrors.length > 0 && (
          <TabPane 
            tab={
              <span>
                <Badge status="warning" />
                Duplicates ({duplicateErrors.length})
              </span>
            } 
            key="duplicates"
          >
            <ErrorTable
              errors={duplicateErrors}
              skipDuplicates={skipDuplicates}
              fullHeight={true}
            />
          </TabPane>
        )}
      </Tabs>

      <Divider />
      
      <Card 
        title="Troubleshooting Tips" 
        size="small" 
        style={{ backgroundColor: '#f5f5f5' }}
      >
        <Row gutter={24}>
          <Col span={12}>
            <Title level={5}>For Validation Errors:</Title>
            <ul>
              <li>Ensure all required fields are filled correctly</li>
              <li>Check date formats (should be DD/MM/YYYY)</li>
              <li>Verify that emails are in valid format</li>
              <li>Make sure gender values are either "Male" or "Female"</li>
            </ul>
          </Col>
          <Col span={12}>
            <Title level={5}>For Duplicate Records:</Title>
            <ul>
              <li>Change usernames, emails or phone numbers to be unique</li>
              <li>Use "Skip Duplicates" option to ignore existing users</li>
              <li>Check if users already exist in the system before import</li>
            </ul>
          </Col>
        </Row>
      </Card>
    </Modal>
  );
};

export default DetailedErrorModal; 