import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Checkbox,
  Button,
  Typography,
  message,
  Row,
  Col,
  Radio,
  Spin,
  Space,
  Tooltip,
  Divider,
  Select,
  DatePicker,
} from "antd";
import {
  exportCanteenOrdersToExcel,
  CanteenOrderExportConfig
} from "@/api/canteenorder";
import {
  SortAscendingOutlined,
  SortDescendingOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

// UI-specific version of the config with additional properties
export interface CanteenOrderExportConfigWithUI extends CanteenOrderExportConfig {
  exportAllPages: boolean;
}

interface ExportConfigModalProps {
  visible: boolean;
  onClose: () => void;
  onExport: (config: CanteenOrderExportConfig) => void;
  exportConfig: CanteenOrderExportConfig;
  onChange: (config: Partial<CanteenOrderExportConfig>) => void;
  filters?: {
    filterValue: string;
    statusFilter: string[];
    advancedFilters: any;
    currentPage: number;
    pageSize: number;
  };
  statusOptions?: { label: string; value: string }[];
}

const ExportConfigModal: React.FC<ExportConfigModalProps> = ({
  visible,
  onClose,
  onExport,
  exportConfig,
  onChange,
  filters = { filterValue: "", statusFilter: [], advancedFilters: {}, currentPage: 1, pageSize: 10 },
  statusOptions = [
    { label: "Pending", value: "Pending" },
    { label: "Approved", value: "Approved" },
    { label: "Rejected", value: "Rejected" },
    { label: "Completed", value: "Completed" }
  ],
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (visible) {
      form.resetFields();
    }
  }, [visible, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Construct the export config DTO
      const exportConfig: CanteenOrderExportConfig = {
        includeId: values.includeId,
        includeTruckInfo: values.includeTruckInfo,
        includeOrderDate: values.includeOrderDate,
        includeCreatedInfo: values.includeCreatedInfo,
        includeUpdatedInfo: values.includeUpdatedInfo,
        includeStatus: values.includeStatus,
        includeOrderDetails: values.includeOrderDetails
      };

      // Call the API to export
      await onExport(exportConfig);
      
      // Save config settings for next time - but don't include exportAllPages in the API request
      const { exportAllPages, ...configForApi } = values;
      onChange(configForApi);
    } catch (error) {
      console.error("Export error:", error);
      messageApi.error({
        content: "An unexpected error occurred",
        duration: 10,
      });
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const handleReset = () => {
    form.resetFields();
  };

  return (
    <Modal
      title={
        <Space>
          <FileExcelOutlined type = "primary" />
          <Title level={5} style={{ margin: 0 }}>
            Export Canteen Orders to Excel
          </Title>
        </Space>
      }
      open={visible}
      onCancel={handleCancel}
      width={800}
      footer={[
        <Button 
          key="reset" 
          onClick={handleReset} 
          icon={<ReloadOutlined />}
          style={{ display: 'right', alignItems: 'center', gap: '8px' }}
        >
          Reset
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
          icon={<FileExcelOutlined />}
        >
          Export
        </Button>,
      ]}
      destroyOnClose={true}
    >
      {contextHolder}
      <Spin spinning={loading} tip="Generating Excel file..."> 
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            exportAllPages: true,
            filterSortDirection: "desc",
            includeId: true,
            includeTruckInfo: true,
            includeOrderDate: true,
            includeCreatedInfo: true,
            includeUpdatedInfo: true,
            includeStatus: true,
            includeOrderDetails: true
          }}
          onValuesChange={(changedValues, allValues) => {
            // Notify parent component of the change
            // Only pass the supported properties to onChange
            const { exportAllPages, filterSortDirection, ...validFields } = changedValues;
            if (Object.keys(validFields).length > 0) {
              onChange(validFields);
            }
            
            // Handle when "Export all data" is toggled
            if ('exportAllPages' in changedValues) {
              if (changedValues.exportAllPages === true) {
                // When checked, select all fields
                const allSelectedFields = {
                  includeId: true,
                  includeTruckInfo: true,
                  includeOrderDate: true,
                  includeCreatedInfo: true,
                  includeUpdatedInfo: true,
                  includeStatus: true,
                  includeOrderDetails: true,
                };
                form.setFieldsValue(allSelectedFields);
              } else {
                // When unchecked, unselect all fields
                const allUnselectedFields = {
                  includeId: false,
                  includeTruckInfo: false,
                  includeOrderDate: false,
                  includeCreatedInfo: false,
                  includeUpdatedInfo: false,
                  includeStatus: false,
                  includeOrderDetails: false,
                };
                form.setFieldsValue(allUnselectedFields);
              }
            }
          }}
          preserve={false}
        >
          <div style={{ marginBottom: '20px' }}>
            <Divider orientation="left">Basic Options</Divider>
            
            <Form.Item name="exportAllPages" valuePropName="checked" style={{ marginBottom: '16px' }}>
              <Checkbox onChange={(e) => {
                // When checked, select all fields
                if (e.target.checked) {
                  const allSelectedFields = {
                    includeId: true,
                    includeTruckInfo: true,
                    includeOrderDate: true,
                    includeCreatedInfo: true,
                    includeUpdatedInfo: true,
                    includeStatus: true,
                    includeOrderDetails: true,
                  };
                  form.setFieldsValue(allSelectedFields);
                } else {
                  // When unchecked, unselect all fields
                  const allUnselectedFields = {
                    includeId: false,
                    includeTruckInfo: false,
                    includeOrderDate: false,
                    includeCreatedInfo: false,
                    includeUpdatedInfo: false,
                    includeStatus: false,
                    includeOrderDetails: false,
                  };
                  form.setFieldsValue(allUnselectedFields);
                }
              }}>Export all data (ignore pagination)</Checkbox>
            </Form.Item>
            
            <div>
              <Typography.Text style={{ fontSize: '14px', marginBottom: '8px', display: 'block' }}>
                Sort direction
              </Typography.Text>
              <Form.Item name="filterSortDirection" noStyle>
                <Radio.Group buttonStyle="solid" style={{ width: '100%' }}>
                  <Radio.Button value="asc" style={{ width: '50%', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <SortAscendingOutlined />
                      <span>Oldest First</span>
                    </div>
                  </Radio.Button>
                  <Radio.Button value="desc" style={{ width: '50%', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <SortDescendingOutlined />
                      <span>Newest First</span>
                    </div>
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>
            </div>
          </div>

          {/* Data Filters Section */}
          <Form.Item dependencies={["exportAllPages"]} noStyle>
            {({ getFieldValue }) => {
              const exportAll = getFieldValue("exportAllPages");
              return !exportAll ? (
                <div style={{ marginBottom: '20px' }}>
                  <Divider orientation="left">Data Filters</Divider>
                  
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Form.Item label="Order Status" name="filterStatus">
                        <Select
                          mode="multiple"
                          placeholder="Select Status"
                          style={{ width: "100%" }}
                          allowClear
                          options={statusOptions}
                        />
                      </Form.Item>
                    </Col>

                    <Col span={12}>
                      <Form.Item label="Order Date Range" name="filterOrderDateRange">
                        <RangePicker
                          style={{ width: "100%" }}
                          placeholder={["From date", "To date"]}
                          format="DD/MM/YYYY"
                        />
                      </Form.Item>
                    </Col>

                    <Col span={12}>
                      <Form.Item label="Created Date Range" name="filterCreatedDateRange">
                        <RangePicker
                          style={{ width: "100%" }}
                          placeholder={["From date", "To date"]}
                          format="DD/MM/YYYY"
                        />
                      </Form.Item>
                    </Col>
                    
                    <Col span={12}>
                      <Form.Item label="Updated Date Range" name="filterUpdatedDateRange">
                        <RangePicker
                          style={{ width: "100%" }}
                          placeholder={["From date", "To date"]}
                          format="DD/MM/YYYY"
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              ) : null;
            }}
          </Form.Item>

          {/* Include Fields Section */}
          <div style={{ marginBottom: '20px' }}>
            <Divider orientation="left">Include Fields</Divider>
            
            <Row gutter={[24, 16]}>
              <Col span={8}>
                <Form.Item name="includeId" valuePropName="checked" style={{ marginBottom: '8px' }}>
                  <Checkbox>ID</Checkbox>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="includeTruckInfo" valuePropName="checked" style={{ marginBottom: '8px' }}>
                  <Checkbox>Truck Information</Checkbox>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="includeOrderDate" valuePropName="checked" style={{ marginBottom: '8px' }}>
                  <Checkbox>Order Date</Checkbox>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="includeCreatedInfo" valuePropName="checked" style={{ marginBottom: '8px' }}>
                  <Checkbox>Created Info</Checkbox>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="includeUpdatedInfo" valuePropName="checked" style={{ marginBottom: '8px' }}>
                  <Checkbox>Updated Info</Checkbox>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="includeStatus" valuePropName="checked" style={{ marginBottom: '8px' }}>
                  <Checkbox>Status</Checkbox>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="includeOrderDetails" valuePropName="checked" style={{ marginBottom: '8px' }}>
                  <Checkbox>Order Details</Checkbox>
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* Info Box */}
          <div
            style={{
              background: "#f0f5ff",
              border: "1px solid #d6e4ff",
              padding: "12px",
              borderRadius: "4px",
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
            }}
          >
            <InfoCircleOutlined style={{ color: '#1890ff', marginTop: '2px' }} />
            <Form.Item dependencies={["exportAllPages"]} noStyle>
              {({ getFieldValue }) => {
                const exportAll = getFieldValue("exportAllPages");
                return (
                  <Typography.Text style={{ fontSize: "14px" }}>
                    {exportAll 
                      ? "Select which fields you want to include in the Excel file. The export will include all canteen orders."
                      : "Please select 'Export all data' or apply at least one filter before exporting. This ensures you get the exact data you need."}
                  </Typography.Text>
                );
              }}
            </Form.Item>
          </div>
        </Form>
      </Spin>
    </Modal>
  );
};

export default ExportConfigModal; 