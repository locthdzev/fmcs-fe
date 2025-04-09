import React from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Radio,
  Button,
  Space,
  Divider,
  Row,
  Col,
} from "antd";
import type { DatePickerProps, RangePickerProps } from "antd/es/date-picker";
import dayjs from "dayjs";

const { Option } = Select;
const { RangePicker } = DatePicker;

interface UserFilterModalProps {
  visible: boolean;
  onCancel: () => void;
  onApply: (filters: any) => void;
  onReset: () => void;
  filters: {
    fullNameSearch: string;
    userNameSearch: string;
    emailSearch: string;
    phoneSearch: string;
    roleFilter: string;
    genderFilter: string;
    statusFilter: string;
    dobDateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null];
    createdDateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null];
    updatedDateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null];
    sortBy: string;
    ascending: boolean;
  };
  roleOptions: string[];
}

const UserFilterModal: React.FC<UserFilterModalProps> = ({
  visible,
  onCancel,
  onApply,
  onReset,
  filters,
  roleOptions,
}) => {
  const [form] = Form.useForm();

  // When modal becomes visible, set form values from filters
  React.useEffect(() => {
    if (visible) {
      form.setFieldsValue({
        ...filters,
      });
    }
  }, [visible, filters, form]);

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
      width={800}
      footer={[
        <Button key="reset" onClick={onReset}>
          Reset All
        </Button>,
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button key="apply" type="primary" onClick={handleApply}>
          Apply Filters
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        <Divider orientation="left">Search Criteria</Divider>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="fullNameSearch" label="Full Name">
              <Input placeholder="Search by full name" allowClear />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="userNameSearch" label="Username">
              <Input placeholder="Search by username" allowClear />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="emailSearch" label="Email">
              <Input placeholder="Search by email" allowClear />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="phoneSearch" label="Phone">
              <Input placeholder="Search by phone" allowClear />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">Filter Options</Divider>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="roleFilter" label="Role">
              <Select placeholder="Filter by role" allowClear>
                {roleOptions.map((role) => (
                  <Option key={role} value={role}>
                    {role}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="genderFilter" label="Gender">
              <Select placeholder="Filter by gender" allowClear>
                <Option value="Male">Male</Option>
                <Option value="Female">Female</Option>
                <Option value="Other">Other</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="statusFilter" label="Status">
              <Select placeholder="Filter by status" allowClear>
                <Option value="ACTIVE">Active</Option>
                <Option value="INACTIVE">Inactive</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">Date Ranges</Divider>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="dobDateRange" label="Date of Birth Range">
              <RangePicker style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="createdDateRange" label="Created Date Range">
              <RangePicker style={{ width: "100%" }} showTime />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="updatedDateRange" label="Updated Date Range">
              <RangePicker style={{ width: "100%" }} showTime />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">Sorting</Divider>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="sortBy" label="Sort By">
              <Select placeholder="Sort by field">
                <Option value="FullName">Full Name</Option>
                <Option value="UserName">Username</Option>
                <Option value="Email">Email</Option>
                <Option value="CreatedAt">Created Date</Option>
                <Option value="UpdatedAt">Updated Date</Option>
                <Option value="Status">Status</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="ascending" label="Sort Direction">
              <Radio.Group>
                <Radio value={true}>Ascending</Radio>
                <Radio value={false}>Descending</Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default UserFilterModal; 