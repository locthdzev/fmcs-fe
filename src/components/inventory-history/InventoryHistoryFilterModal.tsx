import React, { useEffect } from "react";
import { Modal, Form, Input, Select, Button, DatePicker, Space, Switch, Row, Col } from "antd";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;
const { Option } = Select;

interface InventoryHistoryFilterModalProps {
  visible: boolean;
  initialValues: {
    userSearch: string;
    batchCodeSearch: string;
    drugNameSearch: string;
    changeDateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null];
    ascending: boolean;
  };
  onCancel: () => void;
  onApply: (values: any) => void;
  uniqueBatchCodes: string[];
  uniqueDrugNames: string[];
  uniqueUsers: { id: string; name: string; email: string }[];
}

const InventoryHistoryFilterModal: React.FC<InventoryHistoryFilterModalProps> = ({
  visible,
  initialValues,
  onCancel,
  onApply,
  uniqueBatchCodes,
  uniqueDrugNames,
  uniqueUsers,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible) {
      form.setFieldsValue(initialValues);
    }
  }, [visible, initialValues, form]);

  const handleApply = () => {
    form.validateFields().then((values) => {
      onApply(values);
    });
  };

  return (
    <Modal
      title="Advanced Filters"
      open={visible}
      onCancel={onCancel}
      width={600}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button key="clear" onClick={() => form.resetFields()}>
          Clear Filters
        </Button>,
        <Button key="apply" type="primary" onClick={handleApply}>
          Apply Filters
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="batchCodeSearch"
              label="Batch Code"
            >
              <Select
                allowClear
                showSearch
                placeholder="Select batch code"
                optionFilterProp="children"
              >
                {uniqueBatchCodes.map((code) => (
                  <Option key={code} value={code}>
                    {code}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="drugNameSearch"
              label="Drug Name/Code"
            >
              <Select
                allowClear
                showSearch
                placeholder="Select drug"
                optionFilterProp="children"
              >
                {uniqueDrugNames.map((name) => (
                  <Option key={name} value={name}>
                    {name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="userSearch"
              label="Performed By"
            >
              <Select
                allowClear
                showSearch
                placeholder="Select user"
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.children?.toString().toLowerCase().indexOf(input.toLowerCase()) ?? -1) >= 0
                }
              >
                {uniqueUsers.map((user) => (
                  <Option key={user.id} value={user.name}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{user.name}</div>
                      {user.email && (
                        <div style={{ fontSize: '12px', color: '#888' }}>
                          {user.email}
                        </div>
                      )}
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="ascending"
              label="Sort Order"
              valuePropName="checked"
            >
              <Switch
                checkedChildren="Oldest First"
                unCheckedChildren="Newest First"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="changeDateRange"
          label="Date Range"
        >
          <RangePicker
            style={{ width: "100%" }}
            format="DD/MM/YYYY"
            allowClear
            ranges={{
              "Last 7 Days": [dayjs().subtract(6, "days"), dayjs()],
              "Last 30 Days": [dayjs().subtract(29, "days"), dayjs()],
              "This Month": [
                dayjs().startOf("month"),
                dayjs().endOf("month"),
              ],
              "All Time": [
                dayjs("2020-01-01"),
                dayjs("2030-12-31"),
              ],
            }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default InventoryHistoryFilterModal; 