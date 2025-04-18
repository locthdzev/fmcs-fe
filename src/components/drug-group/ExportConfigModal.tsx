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
  exportDrugGroupsToExcel,
  DrugGroupResponse,
  DrugGroupExportConfig,
} from "@/api/druggroup";
import dayjs from "dayjs";
import {
  SortAscendingOutlined,
  SortDescendingOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { DrugGroupAdvancedFilters } from "./DrugGroupFilterModal";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// UI-specific version of the config with additional properties
export interface DrugGroupExportConfigWithUI extends DrugGroupExportConfig {
  exportAllPages: boolean;
}

interface ExportConfigModalProps {
  visible: boolean;
  onClose: () => void;
  config: DrugGroupExportConfigWithUI;
  onChange: (values: Partial<DrugGroupExportConfigWithUI>) => void;
  filters: {
    filterValue: string;
    statusFilter: string[];
    advancedFilters: DrugGroupAdvancedFilters;
    currentPage: number;
    pageSize: number;
  };
  drugGroups?: DrugGroupResponse[];
  statusOptions?: { label: string; value: string }[];
}

const ExportConfigModal: React.FC<ExportConfigModalProps> = ({
  visible,
  onClose,
  config,
  onChange,
  filters,
  drugGroups = [],
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
          values.filterGroupName ||
          (values.filterStatus && values.filterStatus.length > 0) ||
          (values.filterCreatedDateRange &&
            (values.filterCreatedDateRange[0] ||
              values.filterCreatedDateRange[1])) ||
          (values.filterUpdatedDateRange &&
            (values.filterUpdatedDateRange[0] ||
              values.filterUpdatedDateRange[1])) ||
          filters.filterValue ||
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

      // Construct the export config
      const exportConfig: DrugGroupExportConfig = {
        exportAllPages: values.exportAllPages,
        includeGroupName: values.includeGroupName,
        includeDescription: values.includeDescription,
        includeCreatedAt: values.includeCreatedAt,
        includeUpdatedAt: values.includeUpdatedAt,
        includeStatus: values.includeStatus,
      };

      // Get filter values either from form values (if not using all pages) or from current filters
      const useFilters = values.exportAllPages
        ? {
            currentPage: filters.currentPage,
            pageSize: filters.pageSize,
            groupNameSearch: filters.filterValue,
            descriptionSearch: undefined,
            sortBy: "GroupName",
            status: filters.statusFilter?.join(","),
            ascending: values.filterSortDirection === "asc",
            createdStartDate:
              filters.advancedFilters?.createdDateRange?.[0]?.toDate(),
            createdEndDate:
              filters.advancedFilters?.createdDateRange?.[1]?.toDate(),
            updatedStartDate:
              filters.advancedFilters?.updatedDateRange?.[0]?.toDate(),
            updatedEndDate:
              filters.advancedFilters?.updatedDateRange?.[1]?.toDate(),
          }
        : {
            currentPage: filters.currentPage,
            pageSize: filters.pageSize,
            groupNameSearch: values.filterGroupName,
            descriptionSearch: undefined,
            sortBy: "GroupName",
            status: values.filterStatus?.join(","),
            ascending: values.filterSortDirection === "asc",
            createdStartDate: values.filterCreatedDateRange?.[0]?.toDate(),
            createdEndDate: values.filterCreatedDateRange?.[1]?.toDate(),
            updatedStartDate: values.filterUpdatedDateRange?.[0]?.toDate(),
            updatedEndDate: values.filterUpdatedDateRange?.[1]?.toDate(),
          };

      // Call API to export
      const response = await exportDrugGroupsToExcel(exportConfig, useFilters);

      // Handle response
      console.log("Export API response:", response);

      if (response && response.isSuccess) {
        let fileUrl = "";

        // Extract file URL from response
        if (typeof response.data === "string") {
          fileUrl = response.data;
        } else if (response.data && response.data.fileUrl) {
          fileUrl = response.data.fileUrl;
        } else if (response.fileUrl) {
          fileUrl = response.fileUrl;
        }

        if (fileUrl) {
          // Open URL in new tab
          window.open(fileUrl, "_blank");
          messageApi.success("Drug groups exported to Excel successfully", 10);

          // Save config settings for next time
          onChange({
            exportAllPages: values.exportAllPages,
            includeGroupName: values.includeGroupName,
            includeDescription: values.includeDescription,
            includeCreatedAt: values.includeCreatedAt,
            includeUpdatedAt: values.includeUpdatedAt,
            includeStatus: values.includeStatus,
          });

          setLoading(false);
          onClose();
        } else {
          messageApi.error({
            content: "Invalid file URL in response",
            duration: 10,
          });
          setLoading(false);
        }
      } else {
        messageApi.error({
          content: response?.message || "Failed to export Excel file",
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
            includeGroupName: true,
            includeDescription: true,
            includeCreatedAt: true,
            includeUpdatedAt: true,
            includeStatus: true,
          }}
          onValuesChange={(changedValues) => {
            if (
              "exportAllPages" in changedValues &&
              changedValues.exportAllPages
            ) {
              const allSelectedFields = {
                includeGroupName: true,
                includeDescription: true,
                includeCreatedAt: true,
                includeUpdatedAt: true,
                includeStatus: true,
              };
              form.setFieldsValue(allSelectedFields);
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
                      <Form.Item label="Group Name" name="filterGroupName">
                        <Select
                          placeholder="Select Group Name"
                          style={{ width: "100%" }}
                          allowClear
                          showSearch
                          filterOption={(input, option) =>
                            (
                              option?.label?.toString().toLowerCase() ?? ""
                            ).includes(input.toLowerCase())
                          }
                          options={drugGroups.map((group) => ({
                            value: group.groupName,
                            label: group.groupName,
                          }))}
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
                  name="includeGroupName"
                  valuePropName="checked"
                  style={{ marginBottom: "8px" }}
                >
                  <Checkbox>Group Name</Checkbox>
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
