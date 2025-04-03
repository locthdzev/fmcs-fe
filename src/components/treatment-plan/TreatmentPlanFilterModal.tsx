import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  Select,
  DatePicker,
  Switch,
  Row,
  Col,
  Typography,
  Divider,
  Radio,
  Space,
} from "antd";
import {
  UndoOutlined,
  CheckCircleOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title, Text } = Typography;

interface TreatmentPlanFilterModalProps {
  visible: boolean;
  onCancel: () => void;
  onApply: (filters: any) => void;
  onReset: () => void;
  filters: {
    healthCheckResultCode: string;
    userSearch: string;
    drugSearch: string;
    updatedBySearch: string;
    dateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null];
    createdDateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null];
    updatedDateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null];
    sortBy: string;
    ascending: boolean;
  };
  treatmentPlanCodes: string[];
  healthCheckCodes: string[];
  userOptions: any[];
  drugOptions: any[];
  updatedByOptions: any[];
}

const TreatmentPlanFilterModal: React.FC<TreatmentPlanFilterModalProps> = ({
  visible,
  onCancel,
  onApply,
  onReset,
  filters,
  treatmentPlanCodes,
  healthCheckCodes,
  userOptions,
  drugOptions,
  updatedByOptions,
}) => {
  const [form] = Form.useForm();
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    if (visible) {
      setLocalFilters(filters);
      form.setFieldsValue({
        healthCheckResultCode: filters.healthCheckResultCode,
        userSearch: filters.userSearch,
        drugSearch: filters.drugSearch,
        updatedBySearch: filters.updatedBySearch,
        dateRange: filters.dateRange[0] || filters.dateRange[1] ? [
          filters.dateRange[0],
          filters.dateRange[1]
        ] : undefined,
        createdDateRange: filters.createdDateRange[0] || filters.createdDateRange[1] ? [
          filters.createdDateRange[0],
          filters.createdDateRange[1]
        ] : undefined,
        updatedDateRange: filters.updatedDateRange[0] || filters.updatedDateRange[1] ? [
          filters.updatedDateRange[0],
          filters.updatedDateRange[1]
        ] : undefined,
        sortBy: filters.sortBy,
        ascending: filters.ascending,
      });
    }
  }, [visible, filters, form]);

  const handleApply = async () => {
    try {
      const values = await form.validateFields();
      onApply(values);
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  const handleReset = () => {
    form.resetFields();
    onReset();
  };

  return (
    <Modal
      title="Advanced Filters"
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={[
        <Button key="reset" onClick={handleReset} icon={<UndoOutlined />}>
          Reset
        </Button>,
        <Button key="apply" type="primary" onClick={handleApply} icon={<CheckCircleOutlined />}>
          Apply
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" initialValues={localFilters}>
        <Title level={5}>Search Criteria</Title>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="healthCheckResultCode"
              label="Health Check Result Code"
            >
              <Select
                showSearch
                allowClear
                placeholder="Select or search Health Check Result Code"
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.label as string)
                    .toLowerCase()
                    .indexOf(input.toLowerCase()) >= 0
                }
                options={healthCheckCodes.map((code) => ({
                  value: code,
                  label: code,
                }))}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="userSearch" label="Patient">
              <Select
                showSearch
                allowClear
                placeholder="Search patient"
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.label as string)
                    .toLowerCase()
                    .indexOf(input.toLowerCase()) >= 0
                }
                options={userOptions.map((user) => ({
                  value: user.id,
                  label: `${user.fullName} (${user.email})`,
                }))}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="drugSearch" label="Drug">
              <Select
                showSearch
                allowClear
                placeholder="Search drug"
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.label as string)
                    .toLowerCase()
                    .indexOf(input.toLowerCase()) >= 0
                }
                options={drugOptions.map((drug) => ({
                  value: drug.id,
                  label: `${drug.name} (${drug.drugCode})`,
                }))}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="updatedBySearch" label="Updated By">
              <Select
                showSearch
                allowClear
                placeholder="Search staff who updated"
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.label as string)
                    .toLowerCase()
                    .indexOf(input.toLowerCase()) >= 0
                }
                options={updatedByOptions.map((user) => ({
                  value: user.id,
                  label: `${user.fullName} (${user.email})`,
                }))}
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider />
        <Title level={5}>Date Ranges</Title>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="dateRange" label="Treatment Date Range">
              <RangePicker style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="createdDateRange" label="Created Date Range">
              <RangePicker style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="updatedDateRange" label="Updated Date Range">
              <RangePicker style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        <Divider />
        <Title level={5}>Sorting</Title>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="sortBy" label="Sort By">
              <Select>
                <Option value="TreatmentPlanCode">Treatment Plan Code</Option>
                <Option value="StartDate">Start Date</Option>
                <Option value="EndDate">End Date</Option>
                <Option value="CreatedAt">Created At</Option>
                <Option value="UpdatedAt">Updated At</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="ascending" label="Sort Direction" valuePropName="checked">
              <div className="filter-item">
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
                <Radio.Group
                  value={localFilters.ascending ? "asc" : "desc"}
                  onChange={(e) =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      ascending: e.target.value === "asc",
                    }))
                  }
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
              </div>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default TreatmentPlanFilterModal; 