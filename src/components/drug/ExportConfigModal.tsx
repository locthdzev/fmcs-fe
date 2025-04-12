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
  InputNumber,
  Divider,
} from "antd";
import {
  exportDrugsToExcel,
  DrugExportConfigDTO,
  DrugResponse,
  DrugFilterParams
} from "@/api/drug";
import { getDrugGroups } from "@/api/druggroup";
import dayjs from "dayjs";
import {
  SortAscendingOutlined,
  SortDescendingOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// UI-specific version of the config with additional properties
export interface DrugExportConfigWithUI extends DrugExportConfigDTO {
  exportAllPages: boolean;
}

interface ExportConfigModalProps {
  visible: boolean;
  onClose: () => void;
  config: DrugExportConfigWithUI;
  onChange: (values: Partial<DrugExportConfigWithUI>) => void;
  filters: {
    filterValue: string;
    statusFilter: string[];
    advancedFilters: any;
    currentPage: number;
    pageSize: number;
  };
  drugs?: DrugResponse[];
  statusOptions?: { label: string; value: string }[];
}

const ExportConfigModal: React.FC<ExportConfigModalProps> = ({
  visible,
  onClose,
  config,
  onChange,
  filters,
  drugs = [],
  statusOptions = [],
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [drugGroups, setDrugGroups] = useState<any[]>([]);

  // Fetch drug groups when modal becomes visible
  useEffect(() => {
    if (visible) {
      form.resetFields();
      fetchDrugGroups();
    }
  }, [visible, form]);

  const fetchDrugGroups = async () => {
    try {
      const data = await getDrugGroups();
      // Ensure data is an array before setting state
      setDrugGroups(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load drug groups:", error);
      // In case of error, set an empty array to prevent map errors
      setDrugGroups([]);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Validate that either export all pages is selected or at least one filter is applied
      if (!values.exportAllPages) {
        const hasAnyFilter =
          values.filterDrugCode ||
          values.filterName ||
          values.filterManufacturer ||
          values.filterDescription ||
          (values.filterDrugGroup && values.filterDrugGroup.length > 0) ||
          values.filterMinPrice ||
          values.filterMaxPrice ||
          (values.filterStatus && values.filterStatus.length > 0) ||
          (values.filterCreatedDateRange && (values.filterCreatedDateRange[0] || values.filterCreatedDateRange[1])) ||
          (values.filterUpdatedDateRange && (values.filterUpdatedDateRange[0] || values.filterUpdatedDateRange[1])) ||
          filters.filterValue ||
          (filters.statusFilter && filters.statusFilter.length > 0) ||
          (filters.advancedFilters?.priceRange && (filters.advancedFilters.priceRange[0] || filters.advancedFilters.priceRange[1])) ||
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

      // Construct the export config DTO
      const exportConfig: DrugExportConfigDTO = {
        includeDrugCode: values.includeDrugCode,
        includeName: values.includeName,
        includeUnit: values.includeUnit,
        includePrice: values.includePrice,
        includeDescription: values.includeDescription,
        includeManufacturer: values.includeManufacturer,
        includeDrugGroup: values.includeDrugGroup,
        includeCreatedAt: values.includeCreatedAt,
        includeUpdatedAt: values.includeUpdatedAt,
        includeStatus: values.includeStatus,
        fileName: "Drugs_Export"
      };

      // Get filter values either from form values (if not using all pages) or from current filters
      const useFilters = {
        page: 1, // Always start from page 1
        pageSize: 100000, // Use a much larger value to ensure all records are fetched
        // When exporting all data, set all filters to undefined
        drugCodeSearch: values.exportAllPages ? undefined : values.filterDrugCode,
        nameSearch: values.exportAllPages ? undefined : values.filterName,
        manufacturerSearch: values.exportAllPages ? undefined : values.filterManufacturer,
        descriptionSearch: values.exportAllPages ? undefined : values.filterDescription,
        drugGroupId: values.exportAllPages ? undefined : values.filterDrugGroup,
        minPrice: values.exportAllPages ? undefined : values.filterMinPrice,
        maxPrice: values.exportAllPages ? undefined : values.filterMaxPrice,
        // Always use CreatedAt as sortBy for consistency
        sortBy: "CreatedAt",
        // Use the sort direction from the form
        ascending: values.filterSortDirection === "asc",
        // Don't apply status filter when exporting all data
        status: values.exportAllPages ? undefined : 
               (values.filterStatus?.length > 0 ? values.filterStatus?.join(",") : undefined),
        // Don't apply date filters when exporting all data
        createdStartDate: values.exportAllPages ? undefined : 
                       (values.filterCreatedDateRange?.[0]?.format("YYYY-MM-DD") || undefined),
        createdEndDate: values.exportAllPages ? undefined : 
                     (values.filterCreatedDateRange?.[1]?.format("YYYY-MM-DD") || undefined),
        updatedStartDate: values.exportAllPages ? undefined : 
                       (values.filterUpdatedDateRange?.[0]?.format("YYYY-MM-DD") || undefined),
        updatedEndDate: values.exportAllPages ? undefined : 
                     (values.filterUpdatedDateRange?.[1]?.format("YYYY-MM-DD") || undefined),
      };

      // Call the API to export
      const response = await exportDrugsToExcel(
        exportConfig,
        values.exportAllPages,
        useFilters.page,
        useFilters.pageSize,
        useFilters.drugCodeSearch,
        useFilters.nameSearch,
        useFilters.manufacturerSearch,
        useFilters.descriptionSearch,
        useFilters.drugGroupId,
        useFilters.minPrice,
        useFilters.maxPrice,
        useFilters.sortBy,
        useFilters.ascending,
        useFilters.status,
        useFilters.createdStartDate,
        useFilters.createdEndDate,
        useFilters.updatedStartDate,
        useFilters.updatedEndDate
      );

      // Handle response - cần kiểm tra nhiều cấu trúc phản hồi có thể có
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
          includeDrugCode: values.includeDrugCode,
          includeName: values.includeName,
          includeUnit: values.includeUnit,
          includePrice: values.includePrice,
          includeDescription: values.includeDescription,
          includeManufacturer: values.includeManufacturer,
          includeDrugGroup: values.includeDrugGroup,
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
        messageApi.success("Drugs exported to Excel successfully", 10);
        
        // Save config settings for next time
        const configValues = {
          exportAllPages: values.exportAllPages,
          includeDrugCode: values.includeDrugCode,
          includeName: values.includeName,
          includeUnit: values.includeUnit,
          includePrice: values.includePrice,
          includeDescription: values.includeDescription,
          includeManufacturer: values.includeManufacturer,
          includeDrugGroup: values.includeDrugGroup,
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
            includeDrugCode: true,
            includeName: true,
            includeUnit: true,
            includePrice: true,
            includeDescription: true,
            includeManufacturer: true,
            includeDrugGroup: true,
            includeCreatedAt: true,
            includeUpdatedAt: true,
            includeStatus: true
          }}
          onValuesChange={(changedValues) => {
            if ('exportAllPages' in changedValues) {
              if (changedValues.exportAllPages) {
                // Set all selected when exportAllPages is true
                const allSelectedFields = {
                  includeDrugCode: true,
                  includeName: true,
                  includeUnit: true,
                  includePrice: true,
                  includeDescription: true,
                  includeManufacturer: true,
                  includeDrugGroup: true,
                  includeCreatedAt: true,
                  includeUpdatedAt: true,
                  includeStatus: true,
                };
                form.setFieldsValue(allSelectedFields);
              } else {
                // Clear all when exportAllPages is false
                const clearFieldsValues = {
                  includeDrugCode: false,
                  includeName: false,
                  includeUnit: false,
                  includePrice: false,
                  includeDescription: false,
                  includeManufacturer: false,
                  includeDrugGroup: false,
                  includeCreatedAt: false,
                  includeUpdatedAt: false,
                  includeStatus: false,
                };
                form.setFieldsValue(clearFieldsValues);
              }
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
                      <Form.Item label="Drug Code" name="filterDrugCode">
                        <Select
                          placeholder="Select Drug Code"
                          style={{ width: "100%" }}
                          allowClear
                          showSearch
                          filterOption={(input, option) => 
                            (option?.label?.toString().toLowerCase() ?? '').includes(input.toLowerCase())
                          }
                          options={drugs.map((d) => ({ value: d.drugCode, label: d.drugCode }))}
                        />
                      </Form.Item>
                    </Col>

                    <Col span={12}>
                      <Form.Item label="Drug Name" name="filterName">
                        <Select
                          placeholder="Select Drug Name"
                          style={{ width: "100%" }}
                          allowClear
                          showSearch
                          filterOption={(input, option) => 
                            (option?.label?.toString().toLowerCase() ?? '').includes(input.toLowerCase())
                          }
                          options={drugs.map((d) => ({ value: d.name, label: d.name }))}
                        />
                      </Form.Item>
                    </Col>

                    <Col span={12}>
                      <Form.Item label="Manufacturer" name="filterManufacturer">
                        <Select
                          placeholder="Select Manufacturer"
                          style={{ width: "100%" }}
                          allowClear
                          showSearch
                          filterOption={(input, option) => 
                            (option?.label?.toString().toLowerCase() ?? '').includes(input.toLowerCase())
                          }
                          options={Array.from(new Set(drugs.map(d => d.manufacturer).filter(Boolean)))
                            .map(manufacturer => ({ value: manufacturer, label: manufacturer }))}
                        />
                      </Form.Item>
                    </Col>

                    <Col span={12}>
                      <Form.Item label="Description" name="filterDescription">
                        <Select
                          placeholder="Select Description"
                          style={{ width: "100%" }}
                          allowClear
                          showSearch
                          filterOption={(input, option) => 
                            (option?.label?.toString().toLowerCase() ?? '').includes(input.toLowerCase())
                          }
                          options={Array.from(new Set(drugs.map(d => d.description).filter(Boolean)))
                            .map(description => ({ value: description, label: description }))}
                        />
                      </Form.Item>
                    </Col>

                    <Col span={12}>
                      <Form.Item label="Drug Group" name="filterDrugGroup">
                        <Select
                          placeholder="Select Drug Group"
                          style={{ width: "100%" }}
                          allowClear
                          showSearch
                          filterOption={(input, option) => 
                            (option?.label?.toString().toLowerCase() ?? '').includes(input.toLowerCase())
                          }
                          options={(Array.isArray(drugGroups) ? drugGroups : []).map((g) => ({ value: g?.id || '', label: g?.groupName || 'Unknown' }))}
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
                <Form.Item name="includeDrugCode" valuePropName="checked" style={{ marginBottom: '8px' }}>
                  <Checkbox>Drug Code</Checkbox>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="includeName" valuePropName="checked" style={{ marginBottom: '8px' }}>
                  <Checkbox>Name</Checkbox>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="includeUnit" valuePropName="checked" style={{ marginBottom: '8px' }}>
                  <Checkbox>Unit</Checkbox>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="includePrice" valuePropName="checked" style={{ marginBottom: '8px' }}>
                  <Checkbox>Price</Checkbox>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="includeDescription" valuePropName="checked" style={{ marginBottom: '8px' }}>
                  <Checkbox>Description</Checkbox>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="includeManufacturer" valuePropName="checked" style={{ marginBottom: '8px' }}>
                  <Checkbox>Manufacturer</Checkbox>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="includeDrugGroup" valuePropName="checked" style={{ marginBottom: '8px' }}>
                  <Checkbox>Drug Group</Checkbox>
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
