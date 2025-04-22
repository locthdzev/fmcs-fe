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
  exportTrucksToExcel,
  TruckResponse,
  TruckExportConfigDTO,
} from "@/api/truck";
import dayjs from "dayjs";
import {
  SortAscendingOutlined,
  SortDescendingOutlined,
  InfoCircleOutlined,
  UndoOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// Define the filter type we'll use
export interface TruckAdvancedFilters {
  createdDateRange?: any[];
  updatedDateRange?: any[];
  ascending?: boolean;
}

// Update interface definition to include exportAllPages property
export interface TruckExportConfigWithUI extends TruckExportConfigDTO {
  exportAllPages: boolean;
}

// Define Props for the Export Config Modal
interface ExportConfigModalProps {
  visible: boolean;
  onClose: () => void;
  config: TruckExportConfigWithUI;
  onChange: (values: Partial<TruckExportConfigWithUI>) => void;
  filters: {
    filterValue: string; // Search by license plate
    statusFilter: string[]; // Status array
    advancedFilters: TruckAdvancedFilters;
    currentPage: number;
    pageSize: number;
  };
  trucks?: TruckResponse[]; // For license plate dropdown
  statusOptions?: { label: string; value: string }[]; // For status dropdown
}

const ExportConfigModal: React.FC<ExportConfigModalProps> = ({
  visible,
  onClose,
  config,
  onChange,
  filters,
  trucks = [],
  statusOptions = [],
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  // Reset form when modal becomes visible
  useEffect(() => {
    if (visible) {
      // Không gọi onChange ở đây để tránh vòng lặp vô hạn
      // Chỉ reset form fields
      handleReset();
    }
  }, [visible]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Validate that either export all pages is selected or at least one filter is applied
      if (!values.exportAllPages) {
        const hasAnyFilter =
          values.filterLicensePlate ||
          values.filterDriverName ||
          (values.filterStatus && values.filterStatus.length > 0) ||
          (values.filterCreatedDateRange &&
            (values.filterCreatedDateRange[0] ||
              values.filterCreatedDateRange[1])) ||
          (values.filterUpdatedDateRange &&
            (values.filterUpdatedDateRange[0] ||
              values.filterUpdatedDateRange[1])) ||
          filters.filterValue || // Check original filters as well
          (filters.statusFilter && filters.statusFilter.length > 0) ||
          (filters.advancedFilters?.createdDateRange &&
            (filters.advancedFilters.createdDateRange[0] ||
              filters.advancedFilters.createdDateRange[1])) ||
          (filters.advancedFilters?.updatedDateRange &&
            (filters.advancedFilters.updatedDateRange[0] ||
              filters.advancedFilters.updatedDateRange[1]));

        if (!hasAnyFilter) {
          messageApi.error({
            content:
              "Please select 'Export all data' or apply at least one filter",
            duration: 10,
          });
          setLoading(false);
          return;
        }
      }

      // Construct the DTO
      const exportConfig: TruckExportConfigDTO = {
        // Include fields selection
        includeLicensePlate: values.includeLicensePlate,
        includeDriverName: values.includeDriverName,
        includeDriverContact: values.includeDriverContact,
        includeDescription: values.includeDescription,
        includeTruckImage: values.includeTruckImage,
        includeCreatedAt: values.includeCreatedAt,
        includeUpdatedAt: values.includeUpdatedAt,
        includeStatus: values.includeStatus,
      };

      // Get filter values either from form values (if not using all pages) or from current filters
      const useFilters = values.exportAllPages
        ? {
            currentPage: filters.currentPage,
            pageSize: filters.pageSize,
            licensePlateSearch: filters.filterValue,
            statusFilter: filters.statusFilter,
            createdDateRange: filters.advancedFilters?.createdDateRange,
            updatedDateRange: filters.advancedFilters?.updatedDateRange,
            ascending: values.filterSortDirection === "asc", // Always take sort from modal
          }
        : {
            currentPage: filters.currentPage,
            pageSize: filters.pageSize,
            licensePlateSearch: values.filterLicensePlate,
            driverNameSearch: values.filterDriverName,
            statusFilter: values.filterStatus,
            createdDateRange: values.filterCreatedDateRange,
            updatedDateRange: values.filterUpdatedDateRange,
            ascending: values.filterSortDirection === "asc",
          };

      // Extract values from useFilters
      const {
        currentPage,
        pageSize,
        licensePlateSearch,
        driverNameSearch,
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
      const response = await exportTrucksToExcel(exportConfig, {
        exportAllPages: values.exportAllPages,
        page: currentPage,
        pageSize: pageSize,
        licensePlateSearch: licensePlateSearch,
        driverNameSearch: driverNameSearch,
        status: statusFilter?.join(","),
        createdStartDate: createdStartDate,
        createdEndDate: createdEndDate,
        updatedStartDate: updatedStartDate,
        updatedEndDate: updatedEndDate,
        ascending: ascending,
      });

      // Handle response
      if (response.isSuccess && response.data) {
        // Đảm bảo response.data là một URL hợp lệ (string)
        const fileUrl =
          typeof response.data === "string"
            ? response.data
            : response.data.fileUrl || response.data.url || "";

        if (!fileUrl) {
          messageApi.error({
            content: "Invalid file URL in response",
            duration: 10,
          });
          setLoading(false);
          return;
        }

        // Mở URL trong tab mới
        window.open(fileUrl, "_blank");
        messageApi.success("Trucks exported to Excel successfully", 10);
        onChange(exportConfig);
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
    onClose();
  };

  const handleReset = () => {
    form.resetFields();
    // Set default values including include fields to true
    const defaultValues = {
      exportAllPages: true,
      filterLicensePlate: null,
      filterDriverName: null,
      filterStatus: [],
      filterCreatedDateRange: null,
      filterUpdatedDateRange: null,
      filterSortDirection: "desc", // Always set to desc (Newest First)
      includeLicensePlate: true,
      includeDriverName: true,
      includeDriverContact: true,
      includeDescription: true,
      includeTruckImage: true,
      includeCreatedAt: true,
      includeUpdatedAt: true,
      includeStatus: true,
    };

    // Update form
    form.setFieldsValue(defaultValues);
  };

  return (
    <Modal
      title={
        <Title level={4} style={{ margin: 0 }}>
          Export Configuration
        </Title>
      }
      open={visible}
      onCancel={handleCancel}
      width={800}
      footer={[
        <Button
          key="reset"
          onClick={handleReset}
          icon={<ReloadOutlined />}
          style={{ display: "right", alignItems: "center", gap: "8px" }}
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
            includeLicensePlate: true,
            includeDriverName: true,
            includeDriverContact: true,
            includeDescription: true,
            includeTruckImage: true,
            includeCreatedAt: true,
            includeUpdatedAt: true,
            includeStatus: true,
          }}
          onValuesChange={(changedValues) => {
            // Auto-select all include fields when "Export all data" is checked
            if (
              "exportAllPages" in changedValues &&
              changedValues.exportAllPages
            ) {
              const allSelectedFields = {
                includeLicensePlate: true,
                includeDriverName: true,
                includeDriverContact: true,
                includeDescription: true,
                includeTruckImage: true,
                includeCreatedAt: true,
                includeUpdatedAt: true,
                includeStatus: true,
              };
              form.setFieldsValue(allSelectedFields);
              onChange({
                ...allSelectedFields,
                exportAllPages: true,
              });
              return;
            }

            // Handle other changes for config fields
            if (
              Object.keys(changedValues).some(
                (key) => key.startsWith("include") || key === "exportAllPages"
              )
            ) {
              // Only call onChange for config fields
              const configChanges = Object.fromEntries(
                Object.entries(changedValues).filter(
                  ([key]) =>
                    key.startsWith("include") || key === "exportAllPages"
                )
              );
              if (Object.keys(configChanges).length > 0) {
                onChange(configChanges);
              }
            }
          }}
          preserve={false}
        >
          <div style={{ marginBottom: "20px" }}>
            <Divider orientation="left">Basic Options</Divider>

            <Form.Item
              name="exportAllPages"
              valuePropName="checked"
              style={{ marginBottom: "16px" }}
            >
              <Checkbox>Export all data (ignore pagination)</Checkbox>
            </Form.Item>

            <div>
              <Text
                style={{
                  fontSize: "14px",
                  marginBottom: "8px",
                  display: "block",
                }}
              >
                Sort direction
              </Text>
              <Form.Item name="filterSortDirection" noStyle>
                <Radio.Group buttonStyle="solid" style={{ width: "100%" }}>
                  <Radio.Button
                    value="asc"
                    style={{ width: "50%", textAlign: "center" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "4px",
                      }}
                    >
                      <SortAscendingOutlined />
                      <span>Oldest First</span>
                    </div>
                  </Radio.Button>
                  <Radio.Button
                    value="desc"
                    style={{ width: "50%", textAlign: "center" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "4px",
                      }}
                    >
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
                <div style={{ marginBottom: "20px" }}>
                  <Divider orientation="left">Data Filters</Divider>

                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Form.Item
                        label="License Plate"
                        name="filterLicensePlate"
                      >
                        <Select
                          placeholder="Select License Plate"
                          style={{ width: "100%" }}
                          allowClear
                          showSearch
                          filterOption={(input, option) =>
                            (
                              option?.label?.toString().toLowerCase() ?? ""
                            ).includes(input.toLowerCase())
                          }
                          options={trucks.map((t) => ({
                            value: t.licensePlate,
                            label: t.licensePlate,
                          }))}
                        />
                      </Form.Item>
                    </Col>

                    <Col span={12}>
                      <Form.Item label="Driver Name" name="filterDriverName">
                        <Select
                          placeholder="Select Driver Name"
                          style={{ width: "100%" }}
                          allowClear
                          showSearch
                          filterOption={(input, option) =>
                            (
                              option?.label?.toString().toLowerCase() ?? ""
                            ).includes(input.toLowerCase())
                          }
                          options={trucks
                            .map((t) => ({
                              value: t.driverName,
                              label: t.driverName,
                            }))
                            .filter((opt) => opt.value)}
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
                      <Form.Item
                        label="Created Date Range"
                        name="filterCreatedDateRange"
                      >
                        <RangePicker
                          style={{ width: "100%" }}
                          placeholder={["From date", "To date"]}
                          format="DD/MM/YYYY"
                        />
                      </Form.Item>
                    </Col>

                    <Col span={12}>
                      <Form.Item
                        label="Updated Date Range"
                        name="filterUpdatedDateRange"
                      >
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
          <div style={{ marginBottom: "20px" }}>
            <Divider orientation="left">Include Fields</Divider>

            <Row gutter={[24, 16]}>
              <Col span={8}>
                <Form.Item
                  name="includeLicensePlate"
                  valuePropName="checked"
                  style={{ marginBottom: "8px" }}
                >
                  <Checkbox>License Plate</Checkbox>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="includeDriverName"
                  valuePropName="checked"
                  style={{ marginBottom: "8px" }}
                >
                  <Checkbox>Driver Name</Checkbox>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="includeDriverContact"
                  valuePropName="checked"
                  style={{ marginBottom: "8px" }}
                >
                  <Checkbox>Driver Contact</Checkbox>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="includeDescription"
                  valuePropName="checked"
                  style={{ marginBottom: "8px" }}
                >
                  <Checkbox>Description</Checkbox>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="includeTruckImage"
                  valuePropName="checked"
                  style={{ marginBottom: "8px" }}
                >
                  <Checkbox>Truck Image</Checkbox>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="includeCreatedAt"
                  valuePropName="checked"
                  style={{ marginBottom: "8px" }}
                >
                  <Checkbox>Created At</Checkbox>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="includeUpdatedAt"
                  valuePropName="checked"
                  style={{ marginBottom: "8px" }}
                >
                  <Checkbox>Updated At</Checkbox>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="includeStatus"
                  valuePropName="checked"
                  style={{ marginBottom: "8px" }}
                >
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
            <InfoCircleOutlined
              style={{ color: "#1890ff", marginTop: "2px" }}
            />
            <Text style={{ fontSize: "14px" }}>
              You must either select "Export all data" or apply at least one
              filter before exporting. This ensures you get the exact data you
              need.
            </Text>
          </div>
        </Form>
      </Spin>
    </Modal>
  );
};

export default ExportConfigModal;
