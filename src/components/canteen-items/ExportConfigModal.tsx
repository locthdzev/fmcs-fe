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
  InputNumber,
} from "antd";
import {
  exportCanteenItemsToExcel,
  CanteenItemExportConfigDTO,
  CanteenItemResponse
} from "@/api/canteenitems";
import {
  SortAscendingOutlined,
  SortDescendingOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

// UI-specific version of the config with additional properties
export interface CanteenItemExportConfigWithUI extends CanteenItemExportConfigDTO {
  exportAllPages: boolean;
}

interface ExportConfigModalProps {
  visible: boolean;
  onClose: () => void;
  config: CanteenItemExportConfigWithUI;
  onChange: (values: Partial<CanteenItemExportConfigWithUI>) => void;
  filters?: {
    filterValue: string;
    statusFilter: string[];
    advancedFilters: any;
    currentPage: number;
    pageSize: number;
  };
  canteenItems?: CanteenItemResponse[];
  statusOptions?: { label: string; value: string }[];
}

const ExportConfigModal: React.FC<ExportConfigModalProps> = ({
  visible,
  onClose,
  config,
  onChange,
  filters = { filterValue: "", statusFilter: [], advancedFilters: {}, currentPage: 1, pageSize: 10 },
  canteenItems = [],
  statusOptions = [
    { label: "Active", value: "Active" },
    { label: "Inactive", value: "Inactive" }
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

      // Validate that either export all pages is selected or at least one filter is applied
      if (!values.exportAllPages) {
        const hasAnyFilter =
          values.filterItemName ||
          values.filterMinPrice ||
          values.filterMaxPrice ||
          (values.filterAvailability && values.filterAvailability.length > 0) ||
          (values.filterStatus && values.filterStatus.length > 0) ||
          (values.filterCreatedDateRange && (values.filterCreatedDateRange[0] || values.filterCreatedDateRange[1])) ||
          (values.filterUpdatedDateRange && (values.filterUpdatedDateRange[0] || values.filterUpdatedDateRange[1])) ||
          filters.filterValue ||
          (filters.statusFilter && filters.statusFilter.length > 0) ||
          (filters.advancedFilters?.priceRange && (filters.advancedFilters.priceRange[0] || filters.advancedFilters.priceRange[1]));

        if (!hasAnyFilter) {
          messageApi.error({
            content: "Please select 'Export all data' or apply at least one filter",
            duration: 10,
          });
          setLoading(false);
          return;
        }
      }

      // Construct the export config DTO
      const exportConfig: CanteenItemExportConfigDTO = {
        includeId: values.includeId,
        includeItemName: values.includeItemName,
        includeDescription: values.includeDescription,
        includeUnitPrice: values.includeUnitPrice,
        includeAvailable: values.includeAvailable,
        includeImageUrl: values.includeImageUrl,
        includeCreatedAt: values.includeCreatedAt,
        includeUpdatedAt: values.includeUpdatedAt,
        includeStatus: values.includeStatus,
        fileName: "CanteenItems_Export"
      };

      // Call the API to export with filters
      const response = await exportCanteenItemsToExcel(exportConfig);

      // Handle response
      console.log("Export response:", response);
      
      // Kiểm tra nếu response không tồn tại
      if (!response) {
        messageApi.error({
          content: "No response received from server",
          duration: 10,
        });
        setLoading(false);
        return;
      }
      
      // Xác định cấu trúc phản hồi và tìm URL
      let fileUrl = '';
      let isSuccess = false;
      
      // Kiểm tra trường isSuccess
      if (typeof response.isSuccess === 'boolean') {
        isSuccess = response.isSuccess;
      } else if (typeof response.success === 'boolean') {
        isSuccess = response.success;
      } else {
        // Giả định thành công nếu có data
        isSuccess = !!response.data;
      }
      
      // Tìm URL trong data
      if (response.data) {
        if (typeof response.data === 'string') {
          // Nếu data trực tiếp là string, đó có thể là URL
          fileUrl = response.data;
        } else if (response.data.fileUrl && typeof response.data.fileUrl === 'string') {
          // Nếu data có trường fileUrl
          fileUrl = response.data.fileUrl;
        } else if (response.data.url && typeof response.data.url === 'string') {
          // Nếu data có trường url
          fileUrl = response.data.url;
        } else if (response.data.file && typeof response.data.file === 'string') {
          // Nếu data có trường file
          fileUrl = response.data.file;
        } else if (response.fileUrl && typeof response.fileUrl === 'string') {
          // Nếu response có trường fileUrl ở root
          fileUrl = response.fileUrl;
        } else if (typeof response.data === 'object') {
          // Tìm kiếm bất kỳ trường nào có thể chứa URL
          const urlFields = ['path', 'downloadUrl', 'excelUrl', 'excel', 'downloadPath'];
          for (const field of urlFields) {
            if (response.data[field] && typeof response.data[field] === 'string') {
              fileUrl = response.data[field];
              break;
            }
          }
        }
      } else if (response.fileUrl && typeof response.fileUrl === 'string') {
        // Nếu response có trường fileUrl ở root
        fileUrl = response.fileUrl;
      }
      
      // Kiểm tra fileUrl
      if (!fileUrl && isSuccess) {
        console.warn("Could not find file URL in response, but export was successful", response);
        messageApi.success("Export successful, but could not determine file URL", 10);
        
        // Save config settings for next time
        const configValues = {
          exportAllPages: values.exportAllPages,
          includeId: values.includeId,
          includeItemName: values.includeItemName,
          includeDescription: values.includeDescription,
          includeUnitPrice: values.includeUnitPrice,
          includeAvailable: values.includeAvailable,
          includeImageUrl: values.includeImageUrl,
          includeCreatedAt: values.includeCreatedAt,
          includeUpdatedAt: values.includeUpdatedAt,
          includeStatus: values.includeStatus,
        };
        onChange(configValues);
        
        setLoading(false);
        onClose();
        return;
      }
      
      // Kiểm tra nếu export không thành công
      if (!isSuccess) {
        const errorMessage = response.message || "Failed to export Excel file";
        messageApi.error({
          content: errorMessage,
          duration: 10,
        });
        setLoading(false);
        return;
      }
      
      // Tiếp tục xử lý nếu có URL
      if (fileUrl) {
        // Open URL in new tab
        window.open(fileUrl, "_blank");
        messageApi.success("Canteen items exported to Excel successfully", 10);
        
        // Save config settings for next time
        const configValues = {
          exportAllPages: values.exportAllPages,
          includeId: values.includeId,
          includeItemName: values.includeItemName,
          includeDescription: values.includeDescription,
          includeUnitPrice: values.includeUnitPrice,
          includeAvailable: values.includeAvailable,
          includeImageUrl: values.includeImageUrl,
          includeCreatedAt: values.includeCreatedAt,
          includeUpdatedAt: values.includeUpdatedAt,
          includeStatus: values.includeStatus,
        };
        onChange(configValues);
        
        setLoading(false);
        onClose();
      } else {
        messageApi.error({
          content: "Invalid file URL in response",
          duration: 10,
        });
        setLoading(false);
      }
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
      title="Export Configuration"
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
            includeItemName: true,
            includeDescription: true,
            includeUnitPrice: true,
            includeAvailable: true,
            includeImageUrl: true,
            includeCreatedAt: true,
            includeUpdatedAt: true,
            includeStatus: true
          }}
          onValuesChange={(changedValues, allValues) => {
            // Notify parent component of the change
            onChange({
              ...allValues,
              // Ensure we keep other fields that might not be in the form
              ...config,
              ...changedValues
            });
            
            // Handle when "Export all data" is toggled
            if ('exportAllPages' in changedValues) {
              if (changedValues.exportAllPages === true) {
                // When checked, select all fields
                const allSelectedFields = {
                  includeId: true,
                  includeItemName: true,
                  includeDescription: true,
                  includeUnitPrice: true,
                  includeAvailable: true,
                  includeImageUrl: true,
                  includeCreatedAt: true,
                  includeUpdatedAt: true,
                  includeStatus: true,
                };
                form.setFieldsValue(allSelectedFields);
              } else {
                // When unchecked, unselect all fields
                const allUnselectedFields = {
                  includeId: false,
                  includeItemName: false,
                  includeDescription: false,
                  includeUnitPrice: false,
                  includeAvailable: false,
                  includeImageUrl: false,
                  includeCreatedAt: false,
                  includeUpdatedAt: false,
                  includeStatus: false,
                };
                form.setFieldsValue(allUnselectedFields);
              }
              console.log("Export all pages toggled:", changedValues.exportAllPages);
            }
          }}
          preserve={false}
        >
          <div style={{ marginBottom: '20px' }}>
            <Divider orientation="left">Basic Options</Divider>
            
            <Form.Item name="exportAllPages" valuePropName="checked" style={{ marginBottom: '16px' }}>
              <Checkbox onChange={(e) => {
                console.log("Checkbox changed:", e.target.checked);
                // When checked, select all fields
                if (e.target.checked) {
                  const allSelectedFields = {
                    includeId: true,
                    includeItemName: true,
                    includeDescription: true,
                    includeUnitPrice: true,
                    includeAvailable: true,
                    includeImageUrl: true,
                    includeCreatedAt: true,
                    includeUpdatedAt: true,
                    includeStatus: true,
                  };
                  form.setFieldsValue(allSelectedFields);
                } else {
                  // When unchecked, unselect all fields
                  const allUnselectedFields = {
                    includeId: false,
                    includeItemName: false,
                    includeDescription: false,
                    includeUnitPrice: false,
                    includeAvailable: false,
                    includeImageUrl: false,
                    includeCreatedAt: false,
                    includeUpdatedAt: false,
                    includeStatus: false,
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
                      <Form.Item label="Item Name" name="filterItemName">
                        <Select
                          placeholder="Select Item Name"
                          style={{ width: "100%" }}
                          allowClear
                          showSearch
                          filterOption={(input, option) => 
                            (option?.label?.toString().toLowerCase() ?? '').includes(input.toLowerCase())
                          }
                          options={canteenItems.map((item) => ({ value: item.itemName, label: item.itemName }))}
                        />
                      </Form.Item>
                    </Col>

                    <Col span={12}>
                      <Form.Item label="Availability" name="filterAvailability">
                        <Select
                          placeholder="Select Availability"
                          style={{ width: "100%" }}
                          allowClear
                          options={[
                            { value: "true", label: "Available" },
                            { value: "false", label: "Out of Stock" }
                          ]}
                        />
                      </Form.Item>
                    </Col>

                    <Col span={12}>
                      <Form.Item label="Min Price" name="filterMinPrice">
                        <InputNumber
                          style={{ width: "100%" }}
                          placeholder="Enter minimum price"
                          min={0}
                        />
                      </Form.Item>
                    </Col>

                    <Col span={12}>
                      <Form.Item label="Max Price" name="filterMaxPrice">
                        <InputNumber
                          style={{ width: "100%" }}
                          placeholder="Enter maximum price"
                          min={0}
                        />
                      </Form.Item>
                    </Col>

                    <Col span={12}>
                      <Form.Item label="Status" name="filterStatus">
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
                <Form.Item name="includeItemName" valuePropName="checked" style={{ marginBottom: '8px' }}>
                  <Checkbox>Item Name</Checkbox>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="includeDescription" valuePropName="checked" style={{ marginBottom: '8px' }}>
                  <Checkbox>Description</Checkbox>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="includeUnitPrice" valuePropName="checked" style={{ marginBottom: '8px' }}>
                  <Checkbox>Unit Price</Checkbox>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="includeAvailable" valuePropName="checked" style={{ marginBottom: '8px' }}>
                  <Checkbox>Availability</Checkbox>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="includeImageUrl" valuePropName="checked" style={{ marginBottom: '8px' }}>
                  <Checkbox>Image URL</Checkbox>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="includeCreatedAt" valuePropName="checked" style={{ marginBottom: '8px' }}>
                  <Checkbox>Created At</Checkbox>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="includeUpdatedAt" valuePropName="checked" style={{ marginBottom: '8px' }}>
                  <Checkbox>Updated At</Checkbox>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="includeStatus" valuePropName="checked" style={{ marginBottom: '8px' }}>
                  <Checkbox>Status</Checkbox>
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
                      ? "Select which fields you want to include in the Excel file. The export will include all canteen items."
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
