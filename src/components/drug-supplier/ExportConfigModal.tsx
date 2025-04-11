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
  Select,
  DatePicker,
  Radio,
  Spin,
  Space,
  Tooltip,
  Divider,
} from "antd";
import {
  // Assume this API function will be created
  exportDrugSuppliersToExcelWithConfig, 
  DrugSupplierResponse, // Use existing response type for options
} from "@/api/drugsupplier"; 
import dayjs from "dayjs";
import {
  SortAscendingOutlined,
  SortDescendingOutlined,
  InfoCircleOutlined,
  UndoOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { DrugSupplierAdvancedFilters } from "./DrugSupplierFilterModal"; // Import filter type

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// 1. Define the DTO for Drug Supplier Export Configuration
export interface DrugSupplierExportConfigDTO {
  exportAllPages: boolean;
  includeSupplierName: boolean;
  includeContactNumber: boolean;
  includeEmail: boolean;
  includeAddress: boolean;
  includeCreatedAt: boolean;
  includeUpdatedAt: boolean;
  includeStatus: boolean;
}

// 2. Define Props, adjusting filters and options
interface ExportConfigModalProps {
  visible: boolean;
  onClose: () => void;
  config: DrugSupplierExportConfigDTO;
  onChange: (values: Partial<DrugSupplierExportConfigDTO>) => void; // Changed to Partial
  filters: { // Adjusted filter structure
    filterValue: string; // Search by name
    statusFilter: string[]; // Status array
    advancedFilters: DrugSupplierAdvancedFilters; // Contains date ranges and sort
    // Pagination info might be needed if not exporting all
    currentPage: number; 
    pageSize: number;
  };
  suppliers?: DrugSupplierResponse[]; // For name dropdown
  statusOptions?: { label: string; value: string }[]; // For status dropdown
}

const ExportConfigModal: React.FC<ExportConfigModalProps> = ({
  visible,
  onClose,
  config,
  onChange,
  filters,
  suppliers = [],
  statusOptions = [],
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  // Reset form when modal becomes visible
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
          values.filterSupplierName ||
          (values.filterStatus && values.filterStatus.length > 0) ||
          (values.filterCreatedDateRange && (values.filterCreatedDateRange[0] || values.filterCreatedDateRange[1])) ||
          (values.filterUpdatedDateRange && (values.filterUpdatedDateRange[0] || values.filterUpdatedDateRange[1])) ||
          filters.filterValue || // Check original filters as well
          (filters.statusFilter && filters.statusFilter.length > 0) ||
          (filters.advancedFilters?.createdDateRange && (filters.advancedFilters.createdDateRange[0] || filters.advancedFilters.createdDateRange[1])) ||
          (filters.advancedFilters?.updatedDateRange && (filters.advancedFilters.updatedDateRange[0] || filters.advancedFilters.updatedDateRange[1]));

        if (!hasAnyFilter) {
          messageApi.error({
            content: "Please select 'Export all data' or apply at least one filter",
            duration: 10,
          });
          setLoading(false);
          return;
        }
      }

      // 3. Construct the DTO
      const exportConfig: DrugSupplierExportConfigDTO = {
        exportAllPages: values.exportAllPages,
        includeSupplierName: values.includeSupplierName,
        includeContactNumber: values.includeContactNumber,
        includeEmail: values.includeEmail,
        includeAddress: values.includeAddress,
        includeCreatedAt: values.includeCreatedAt,
        includeUpdatedAt: values.includeUpdatedAt,
        includeStatus: values.includeStatus,
      };

      // Get filter values either from form values (if not using all pages) or from current filters
      const useFilters = values.exportAllPages
        ? {
            currentPage: filters.currentPage,
            pageSize: filters.pageSize,
            supplierNameSearch: filters.filterValue,
            statusFilter: filters.statusFilter,
            createdDateRange: filters.advancedFilters?.createdDateRange,
            updatedDateRange: filters.advancedFilters?.updatedDateRange,
            ascending: values.filterSortDirection === "asc", // Always take sort from modal
          }
        : {
            currentPage: filters.currentPage,
            pageSize: filters.pageSize,
            supplierNameSearch: values.filterSupplierName,
            statusFilter: values.filterStatus,
            createdDateRange: values.filterCreatedDateRange,
            updatedDateRange: values.filterUpdatedDateRange,
            ascending: values.filterSortDirection === "asc",
          };

      // Extract values from useFilters
      const {
        currentPage,
        pageSize,
        supplierNameSearch,
        statusFilter,
        createdDateRange,
        updatedDateRange,
        ascending,
      } = useFilters;

      // Format dates for API
      const createdStartDate = createdDateRange?.[0]?.format("YYYY-MM-DD");
      const createdEndDate = createdDateRange?.[1]?.format("YYYY-MM-DD");
      const updatedStartDate = updatedDateRange?.[0]?.format("YYYY-MM-DD");
      const updatedEndDate = updatedDateRange?.[1]?.format("YYYY-MM-DD");

      // Call API with all params
      const response = await exportDrugSuppliersToExcelWithConfig(
        exportConfig,
        currentPage,
        pageSize,
        supplierNameSearch,
        statusFilter,
        createdStartDate,
        createdEndDate,
        updatedStartDate,
        updatedEndDate,
        ascending,
        values.exportAllPages
      );

      // Handle response
      if (response.success && response.data) {
        // Ensure response.data is a valid URL (string)
        const fileUrl = typeof response.data === 'string' ? response.data : '';
        
        if (!fileUrl) {
          messageApi.error({
            content: "Invalid file URL in response",
            duration: 10,
          });
          setLoading(false);
          return;
        }
        
        // Open URL in new tab
        window.open(fileUrl, "_blank");
        messageApi.success("Drug suppliers exported to Excel successfully", 10);
        
        // Save config settings for next time
        const configValues = {
          exportAllPages: values.exportAllPages,
          includeSupplierName: values.includeSupplierName,
          includeContactNumber: values.includeContactNumber,
          includeEmail: values.includeEmail,
          includeAddress: values.includeAddress,
          includeCreatedAt: values.includeCreatedAt,
          includeUpdatedAt: values.includeUpdatedAt,
          includeStatus: values.includeStatus,
        };
        onChange(configValues);
        
        setLoading(false); // Reset loading state before closing
        onClose();
      } else {
        messageApi.error({
          content: response.message || "Failed to export Excel file",
          duration: 10,
        });
        setLoading(false); // Only reset loading, don't close modal
      }
    } catch (error) {
      console.error("Export error:", error);
      messageApi.error({
        content: "An unexpected error occurred",
        duration: 10,
      });
      setLoading(false); // Only reset loading, don't close modal
    }
  };

  const handleCancel = () => {
    // Don't reset here, reset happens on open or via reset button
    onClose();
  };

  // Reset form to default values
  const handleReset = () => {
    // Simply reset form to its initialValues
    form.resetFields();
    
    // No need to call onChange here since the form's onValuesChange will handle it
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
            includeSupplierName: true,
            includeContactNumber: true,
            includeEmail: true,
            includeAddress: true,
            includeCreatedAt: true,
            includeUpdatedAt: true,
            includeStatus: true
          }}
          onValuesChange={(changedValues) => {
            // Don't trigger onChange for initial form setup
            // Only handle user interactions
            if ('exportAllPages' in changedValues && changedValues.exportAllPages) {
              // When "Export all data" is checked, update include fields to be all checked
              const allSelectedFields = {
                includeSupplierName: true,
                includeContactNumber: true,
                includeEmail: true,
                includeAddress: true,
                includeCreatedAt: true,
                includeUpdatedAt: true,
                includeStatus: true,
              };
              // This won't trigger another onValuesChange because we're using batch update
              form.setFieldsValue(allSelectedFields);
            }
          }}
          preserve={false}
        >
          <div style={{ marginBottom: '20px' }}>
            <Divider orientation="left">Basic Options</Divider>
            
            <Form.Item name="exportAllPages" valuePropName="checked" style={{ marginBottom: '16px' }}>
              <Checkbox>Export all data (ignore pagination)</Checkbox>
            </Form.Item>
            
            <div>
              <Text style={{ fontSize: '14px', marginBottom: '8px', display: 'block' }}>Sort direction</Text>
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
                      <Form.Item label="Supplier Name" name="filterSupplierName">
                        <Select
                          placeholder="Select Supplier Name"
                          style={{ width: "100%" }}
                          allowClear
                          showSearch
                          filterOption={(input, option) => 
                            (option?.label?.toString().toLowerCase() ?? '').includes(input.toLowerCase())
                          }
                          options={suppliers.map((s) => ({ value: s.supplierName, label: s.supplierName }))}
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
                <Form.Item name="includeSupplierName" valuePropName="checked" style={{ marginBottom: '8px' }}>
                  <Checkbox>Supplier Name</Checkbox>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="includeContactNumber" valuePropName="checked" style={{ marginBottom: '8px' }}>
                  <Checkbox>Contact Number</Checkbox>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="includeEmail" valuePropName="checked" style={{ marginBottom: '8px' }}>
                  <Checkbox>Email</Checkbox>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="includeAddress" valuePropName="checked" style={{ marginBottom: '8px' }}>
                  <Checkbox>Address</Checkbox>
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
            <Text style={{ fontSize: "14px" }}>
              You must either select "Export all data" or apply at least one filter before exporting. This ensures you get the exact data you need.
            </Text>
          </div>
        </Form>
      </Spin>
    </Modal>
  );
};

export default ExportConfigModal;
