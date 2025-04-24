import React from "react";
import {
  Modal,
  Button,
  Form,
  Row,
  Col,
  Typography,
  Checkbox,
  Radio,
  Select,
  DatePicker,
  Space,
  Divider,
} from "antd";
import {
  SortAscendingOutlined,
  SortDescendingOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { HealthCheckResultHistoryExportConfigDTO } from "@/api/healthcheckresult";
import moment from "moment";

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title } = Typography;

interface ExportModalProps {
  visible: boolean;
  exportLoading: boolean;
  exportConfig: HealthCheckResultHistoryExportConfigDTO & {
    filterHealthCheckResultCode?: string;
    filterPerformedBy?: string;
    filterAction?: string;
    filterActionDateRange?: [moment.Moment | null, moment.Moment | null] | null;
    filterPreviousStatus?: string;
    filterNewStatus?: string;
    sortOption?: string;
    sortDirection?: string;
  };
  form: any; // Form instance
  uniqueHealthCheckCodes: string[];
  uniquePerformers: { id: string; fullName: string; email: string }[];
  healthCheckResultCode?: string;
  performedBySearch?: string;
  action?: string;
  actionDateRange: [moment.Moment | null, moment.Moment | null] | null;
  previousStatus?: string;
  newStatus?: string;
  sortBy: string;
  ascending: boolean;
  onClose: () => void;
  onExport: () => void;
  handleExportConfigChange: (changedValues: any) => void;
}

const HealthCheckResultHistoryExportModal: React.FC<ExportModalProps> = ({
  visible,
  exportLoading,
  exportConfig,
  form,
  uniqueHealthCheckCodes,
  uniquePerformers,
  healthCheckResultCode,
  performedBySearch,
  action,
  actionDateRange,
  previousStatus,
  newStatus,
  sortBy,
  ascending,
  onClose,
  onExport,
  handleExportConfigChange,
}) => {
  return (
    <Modal
      title={
        <Title level={4} style={{ margin: 0 }}>
          Export Configuration
        </Title>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={exportLoading}
          onClick={onExport}
        >
          Export
        </Button>,
      ]}
      destroyOnClose={true}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          ...exportConfig,
          filterHealthCheckResultCode: healthCheckResultCode || null,
          filterPerformedBy: performedBySearch || null,
          filterAction: action || null,
          filterActionDateRange: actionDateRange,
          filterPreviousStatus: previousStatus || null,
          filterNewStatus: newStatus || null,
          filterSortDirection: ascending ? "asc" : "desc",
          sortOption: sortBy || "ActionDate",
          exportAllPages: true,
        }}
        onValuesChange={(changedValues, allValues) => {
          handleExportConfigChange(changedValues);
        }}
        preserve={false}
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          {/* Basic Options */}
          <Divider orientation="left">Basic Options</Divider>
          <Row gutter={[16, 8]}>
            <Col span={24}>
              <Form.Item
                name="exportAllPages"
                valuePropName="checked"
                style={{ marginBottom: "12px" }}
              >
                <Checkbox>Export all data (ignore pagination)</Checkbox>
              </Form.Item>
            </Col>
            <Col span={24}>
              <div style={{ marginBottom: "16px" }}>
                <div
                  className="filter-label"
                  style={{
                    marginBottom: "8px",
                    color: "#666666",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <SortAscendingOutlined />
                  <span>Sort direction</span>
                </div>
                <Form.Item name="filterSortDirection" noStyle>
                  <Radio.Group
                    optionType="button"
                    buttonStyle="solid"
                    style={{ width: "100%" }}
                  >
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
            </Col>
          </Row>

          {/* Data Filters */}
          <Form.Item dependencies={["exportAllPages"]} noStyle>
            {({ getFieldValue }) => {
              const exportAll = getFieldValue("exportAllPages");
              return !exportAll ? (
                <>
                  <Divider orientation="left">Data Filters</Divider>
                  <Row gutter={[16, 8]}>
                    <Col span={12}>
                      <Form.Item
                        label="Health Check Result Code"
                        name="filterHealthCheckResultCode"
                      >
                        <Select
                          placeholder="Select Health Check Result Code"
                          style={{ width: "100%" }}
                          allowClear
                          showSearch
                          filterOption={(input, option) =>
                            (option?.children as unknown as string)
                              ?.toLowerCase()
                              .indexOf(input.toLowerCase()) >= 0
                          }
                        >
                          {uniqueHealthCheckCodes.map((code) => (
                            <Option key={code} value={code}>
                              {code}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="Action Type"
                        name="filterAction"
                      >
                        <Select
                          placeholder="Select Action Type"
                          style={{ width: "100%" }}
                          allowClear
                        >
                          <Option value="Created">Created</Option>
                          <Option value="Updated">Updated</Option>
                          <Option value="Approved">Approved</Option>
                          <Option value="Cancelled">Cancelled</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Performed By" name="filterPerformedBy">
                        <Select
                          placeholder="Select or search performer"
                          style={{ width: "100%" }}
                          allowClear
                          showSearch
                          filterOption={(input, option) =>
                            (
                              option?.label?.toString().toLowerCase() || ""
                            ).includes(input.toLowerCase())
                          }
                          optionLabelProp="label"
                          options={uniquePerformers.map((performer) => ({
                            value: performer.id,
                            label: `${performer.fullName} (${performer.email})`,
                            email: performer.email,
                          }))}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Action Date Range" name="filterActionDateRange">
                        <RangePicker
                          style={{ width: "100%" }}
                          format="DD/MM/YYYY"
                          placeholder={["From date", "To date"]}
                          allowClear
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="Previous Status"
                        name="filterPreviousStatus"
                      >
                        <Select
                          placeholder="Select Previous Status"
                          style={{ width: "100%" }}
                          allowClear
                        >
                          <Option value="WaitingForApproval">Waiting For Approval</Option>
                          <Option value="Approved">Approved</Option>
                          <Option value="Completed">Completed</Option>
                          <Option value="CancelledCompletely">Cancelled Completely</Option>
                          <Option value="CancelledForAdjustment">Cancelled For Adjustment</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="New Status"
                        name="filterNewStatus"
                      >
                        <Select
                          placeholder="Select New Status"
                          style={{ width: "100%" }}
                          allowClear
                        >
                          <Option value="WaitingForApproval">Waiting For Approval</Option>
                          <Option value="Approved">Approved</Option>
                          <Option value="Completed">Completed</Option>
                          <Option value="CancelledCompletely">Cancelled Completely</Option>
                          <Option value="CancelledForAdjustment">Cancelled For Adjustment</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                </>
              ) : null;
            }}
          </Form.Item>

          {/* Column Configuration */}
          <Divider orientation="left">Column Configuration</Divider>
          <Row gutter={[16, 8]}>
            <Col span={24}>
              <Form.Item name="groupByHealthCheckResultCode" valuePropName="checked">
                <Checkbox>Group records by Health Check Result Code</Checkbox>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="includeAction" valuePropName="checked">
                <Checkbox>Action</Checkbox>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="includeActionDate" valuePropName="checked">
                <Checkbox>Action Date</Checkbox>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="includePerformedBy" valuePropName="checked">
                <Checkbox>Performed By</Checkbox>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="includePreviousStatus" valuePropName="checked">
                <Checkbox>Previous Status</Checkbox>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="includeNewStatus" valuePropName="checked">
                <Checkbox>New Status</Checkbox>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="includeRejectionReason" valuePropName="checked">
                <Checkbox>Rejection Reason</Checkbox>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="includeChangeDetails" valuePropName="checked">
                <Checkbox>Change Details</Checkbox>
              </Form.Item>
            </Col>
          </Row>
        </Space>
      </Form>
    </Modal>
  );
};

export default HealthCheckResultHistoryExportModal; 