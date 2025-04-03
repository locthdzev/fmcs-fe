import React from "react";
import { Modal, Button, Form, Row, Col, Typography, Checkbox, Radio, Select, DatePicker } from "antd";
import { SortAscendingOutlined, SortDescendingOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { TreatmentPlanHistoryExportConfigDTO } from "@/api/treatment-plan";
import dayjs from "dayjs";

const { Option } = Select;
const { RangePicker } = DatePicker;

interface ExportModalProps {
  visible: boolean;
  exportLoading: boolean;
  exportConfig: TreatmentPlanHistoryExportConfigDTO;
  form: any; // Form instance
  uniqueTreatmentPlanCodes: string[];
  uniqueHealthCheckCodes: string[];
  uniquePerformers: { id: string; fullName: string; email: string }[];
  treatmentPlanCode: string;
  healthCheckResultCode: string;
  performedBySearch: string;
  actionDateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null];
  ascending: boolean;
  onClose: () => void;
  onExport: () => void;
  handleExportConfigChange: (changedValues: any) => void;
}

const TreatmentPlanHistoryExportModal: React.FC<ExportModalProps> = ({
  visible,
  exportLoading,
  exportConfig,
  form,
  uniqueTreatmentPlanCodes,
  uniqueHealthCheckCodes,
  uniquePerformers,
  treatmentPlanCode,
  healthCheckResultCode,
  performedBySearch,
  actionDateRange,
  ascending,
  onClose,
  onExport,
  handleExportConfigChange,
}) => {
  return (
    <Modal
      title="Export Configuration"
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
          filterTreatmentPlanCode: treatmentPlanCode || null,
          filterHealthCheckResultCode: healthCheckResultCode || null,
          filterPerformedBy: performedBySearch || null,
          filterSortDirection: ascending ? "asc" : "desc",
          filterActionDateRange: actionDateRange,
          exportAllPages: true,
        }}
        onValuesChange={(changedValues, allValues) => {
          handleExportConfigChange(changedValues);
        }}
        preserve={false}
      >
        <Row gutter={[16, 8]}>
          <Col span={24}>
            <Typography.Title level={5}>Basic Options</Typography.Title>
          </Col>
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
          
          {/* Use Form.Item dependencies to properly update visibility */}
          <Form.Item dependencies={["exportAllPages"]} noStyle>
            {({ getFieldValue }) => {
              const exportAll = getFieldValue("exportAllPages");
              return !exportAll ? (
                <>
                  <Col span={24}>
                    <Typography.Title level={5}>Data Filters</Typography.Title>
                  </Col>

                  <Col span={12}>
                    <Form.Item
                      label="Treatment Plan Code"
                      name="filterTreatmentPlanCode"
                    >
                      <Select
                        placeholder="Select Treatment Plan Code"
                        style={{ width: "100%" }}
                        allowClear
                        showSearch
                        filterOption={(input, option) =>
                          (option?.children as unknown as string)
                            ?.toLowerCase()
                            .indexOf(input.toLowerCase()) >= 0
                        }
                      >
                        {uniqueTreatmentPlanCodes.map((code) => (
                          <Option key={code} value={code}>
                            {code}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col span={12}>
                    <Form.Item
                      label="Health Check Code"
                      name="filterHealthCheckResultCode"
                    >
                      <Select
                        placeholder="Select Health Check Code"
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
                    <Form.Item label="Performed By" name="filterPerformedBy">
                      <Select
                        placeholder="Select or search staff member"
                        style={{ width: "100%" }}
                        allowClear
                        showSearch
                        filterOption={(input, option) =>
                          (option?.label?.toString().toLowerCase() || "").includes(
                            input.toLowerCase()
                          )
                        }
                        optionLabelProp="label"
                        options={uniquePerformers.map((performer) => ({
                          value: performer.fullName,
                          label: `${performer.fullName} (${performer.email})`,
                          email: performer.email,
                        }))}
                      />
                    </Form.Item>
                  </Col>

                  <Col span={12}>
                    <Form.Item
                      label="Action Date Range"
                      name="filterActionDateRange"
                    >
                      <RangePicker
                        style={{ width: "100%" }}
                        placeholder={["From date", "To date"]}
                        format="DD/MM/YYYY"
                        allowClear
                        ranges={{
                          "Last 7 Days": [dayjs().subtract(6, "days"), dayjs()],
                          "Last 30 Days": [
                            dayjs().subtract(29, "days"),
                            dayjs(),
                          ],
                          "This Month": [
                            dayjs().startOf("month"),
                            dayjs().endOf("month"),
                          ],
                        }}
                      />
                    </Form.Item>
                  </Col>
                </>
              ) : null;
            }}
          </Form.Item>
          
          <Col span={24}>
            <Typography.Title level={5}>Include Fields</Typography.Title>
          </Col>
          <Col span={8}>
            <Form.Item name="includeTreatmentPlanCode" valuePropName="checked">
              <Checkbox>Treatment Plan Code</Checkbox>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="includeHealthCheckCode" valuePropName="checked">
              <Checkbox>Health Check Code</Checkbox>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="includePatient" valuePropName="checked">
              <Checkbox>Patient Information</Checkbox>
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
            <Form.Item name="includeChangeDetails" valuePropName="checked">
              <Checkbox>Change Details</Checkbox>
            </Form.Item>
          </Col>
          <Col span={24} style={{ marginTop: "8px" }}>
            <div
              style={{
                background: "#e6f7ff",
                border: "1px solid #91d5ff",
                padding: "12px",
                borderRadius: "4px",
              }}
            >
              <Typography.Text style={{ fontSize: "13px" }}>
                <InfoCircleOutlined style={{ marginRight: "8px" }} />
                You must either select "Export all data" or apply at least one
                filter before exporting. This ensures you get the exact data you
                need.
              </Typography.Text>
            </div>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default TreatmentPlanHistoryExportModal; 