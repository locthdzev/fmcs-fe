import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Checkbox,
  Button,
  Divider,
  Row,
  Col,
  Typography,
  Alert,
  Select,
  DatePicker,
  Radio,
  Space,
  Input,
  Tooltip,
  message,
  Card,
} from "antd";
import { UserExportConfigDTO } from "@/api/user";
import {
  InfoCircleOutlined,
  UndoOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
  FileExcelOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface ExportConfigModalProps {
  visible: boolean;
  onCancel: () => void;
  config: UserExportConfigDTO;
  onChange: (changedValues: any) => void;
  onExport: () => void;
  // Additional filters
  filters?: {
    fullNameSearch?: string;
    userNameSearch?: string;
    emailSearch?: string;
    phoneSearch?: string;
    roleFilter?: string;
    genderFilter?: string;
    statusFilter?: string;
    dobDateRange?: [dayjs.Dayjs | null, dayjs.Dayjs | null];
    createdDateRange?: [dayjs.Dayjs | null, dayjs.Dayjs | null];
    updatedDateRange?: [dayjs.Dayjs | null, dayjs.Dayjs | null];
    sortBy?: string;
    ascending?: boolean;
  };
  roleOptions?: string[];
  userOptions?: string[];
}

const ExportConfigModal: React.FC<ExportConfigModalProps> = ({
  visible,
  onCancel,
  config,
  onChange,
  onExport,
  filters = {},
  roleOptions = [],
  userOptions = [],
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (visible) {
      handleReset();
    }
  }, [visible]);

  const handleValuesChange = (changedValues: any) => {
    onChange(changedValues);
  };

  const handleSubmit = () => {
    form.validateFields().then(async (values) => {
      try {
        setLoading(true);

        // Verify at least one column is selected
        if (!hasAtLeastOneColumn()) {
          messageApi.error("You must select at least one column to export");
          setLoading(false);
          return;
        }

        // If not exporting all pages, verify at least one filter is applied
        if (!values.exportAllPages) {
          const hasAnyFilter =
            values.filterFullName ||
            values.filterUserName ||
            values.filterEmail ||
            values.filterPhone ||
            values.filterRole ||
            values.filterGender ||
            values.filterStatus ||
            (values.filterDobDateRange &&
              (values.filterDobDateRange[0] || values.filterDobDateRange[1])) ||
            (values.filterCreatedDateRange &&
              (values.filterCreatedDateRange[0] || values.filterCreatedDateRange[1])) ||
            (values.filterUpdatedDateRange &&
              (values.filterUpdatedDateRange[0] || values.filterUpdatedDateRange[1])) ||
            filters.fullNameSearch ||
            filters.userNameSearch ||
            filters.emailSearch ||
            filters.phoneSearch ||
            filters.roleFilter ||
            filters.genderFilter ||
            filters.statusFilter ||
            (filters.dobDateRange &&
              (filters.dobDateRange[0] || filters.dobDateRange[1])) ||
            (filters.createdDateRange &&
              (filters.createdDateRange[0] || filters.createdDateRange[1])) ||
            (filters.updatedDateRange &&
              (filters.updatedDateRange[0] || filters.updatedDateRange[1]));

          if (!hasAnyFilter) {
            messageApi.error({
              content: "Please select 'Export all data' or apply at least one filter",
              duration: 5,
            });
            setLoading(false);
            return;
          }
        }

        onExport();
      } catch (error) {
        console.error("Error during export: ", error);
        messageApi.error("An error occurred during export");
      } finally {
        setLoading(false);
      }
    });
  };

  const handleCancel = () => {
    onCancel();
  };

  const handleReset = () => {
    // Reset form with current config values and default filter values
    form.setFieldsValue({
      ...config,
      filterFullName: "",
      filterUserName: "",
      filterEmail: "",
      filterPhone: "",
      filterRole: undefined,
      filterGender: undefined,
      filterStatus: undefined,
      filterDobDateRange: null,
      filterCreatedDateRange: null,
      filterUpdatedDateRange: null,
      filterSortDirection: "desc",
    });
  };

  // Function to check if at least one column is selected
  const hasAtLeastOneColumn = () => {
    return (
      config.includeFullName ||
      config.includeUserName ||
      config.includeEmail ||
      config.includePhone ||
      config.includeGender ||
      config.includeDob ||
      config.includeAddress ||
      config.includeRole ||
      config.includeStatus ||
      config.includeCreatedAt ||
      config.includeUpdatedAt
    );
  };

  // Function to select all columns
  const handleSelectAllColumns = () => {
    form.setFieldsValue({
      includeFullName: true,
      includeUserName: true,
      includeEmail: true,
      includePhone: true,
      includeGender: true,
      includeDob: true,
      includeAddress: true,
      includeRole: true,
      includeStatus: true,
      includeCreatedAt: true,
      includeUpdatedAt: true,
    });
    
    // Update config
    onChange({
      includeFullName: true,
      includeUserName: true,
      includeEmail: true,
      includePhone: true,
      includeGender: true,
      includeDob: true,
      includeAddress: true,
      includeRole: true,
      includeStatus: true,
      includeCreatedAt: true,
      includeUpdatedAt: true,
    });
  };

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center" }}>
          <Space>
            <FileExcelOutlined style={{ fontSize: 24, color: '#52c41a' }} />
            <Title level={4} style={{ margin: 0 }}>
              Export Users to Excel
            </Title>
          </Space>
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      width={800}
      bodyStyle={{ maxHeight: '600px', overflow: 'auto', padding: '16px' }}
      footer={[
        <Button key="reset" onClick={handleReset} icon={<UndoOutlined />}>
          Reset
        </Button>,
        <Button key="cancel" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button
          key="export"
          type="primary"
          onClick={handleSubmit}
          loading={loading}
          disabled={!hasAtLeastOneColumn()}
          icon={<FileExcelOutlined />}
        >
          Export to Excel
        </Button>,
      ]}
    >
      {contextHolder}
      
      {!hasAtLeastOneColumn() && (
        <Alert
          message="You must select at least one column to export."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        initialValues={config}
        onValuesChange={handleValuesChange}
      >
        <Card 
          title={
            <Space>
              <InfoCircleOutlined />
              <span>Export Settings</span>
            </Space>
          } 
          style={{ marginBottom: 16 }}
          size="small"
        >
          <Form.Item
            name="exportAllPages"
            valuePropName="checked"
          >
            <Checkbox>
              <Text strong>Export all users</Text>
              <div>
                <Text type="secondary">
                  When enabled, all users in the system will be exported, ignoring pagination and filters below
                </Text>
              </div>
            </Checkbox>
          </Form.Item>
        </Card>

        <Card
          title={
            <Space>
              <span>Columns to Export</span>
              <Button 
                type="link" 
                size="small" 
                icon={<CheckCircleOutlined />} 
                onClick={handleSelectAllColumns}
              >
                Select All
              </Button>
            </Space>
          }
          style={{ marginBottom: 16 }}
          size="small"
        >
          <Row gutter={[16, 8]}>
            <Col span={8}>
              <Form.Item
                name="includeFullName"
                valuePropName="checked"
              >
                <Checkbox>Full Name</Checkbox>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="includeUserName"
                valuePropName="checked"
              >
                <Checkbox>Username</Checkbox>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="includeEmail"
                valuePropName="checked"
              >
                <Checkbox>Email</Checkbox>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="includePhone"
                valuePropName="checked"
              >
                <Checkbox>Phone</Checkbox>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="includeGender"
                valuePropName="checked"
              >
                <Checkbox>Gender</Checkbox>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="includeDob"
                valuePropName="checked"
              >
                <Checkbox>Date of Birth</Checkbox>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="includeAddress"
                valuePropName="checked"
              >
                <Checkbox>Address</Checkbox>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="includeRole"
                valuePropName="checked"
              >
                <Checkbox>Roles</Checkbox>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="includeStatus"
                valuePropName="checked"
              >
                <Checkbox>Status</Checkbox>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="includeCreatedAt"
                valuePropName="checked"
              >
                <Checkbox>Created At</Checkbox>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="includeUpdatedAt"
                valuePropName="checked"
              >
                <Checkbox>Updated At</Checkbox>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Form.Item noStyle shouldUpdate={(prev, curr) => prev.exportAllPages !== curr.exportAllPages}>
          {({ getFieldValue }) => {
            const exportAllPages = getFieldValue("exportAllPages");
            if (exportAllPages) {
              return null;
            }
            
            return (
              <Card
                title={
                  <Space>
                    <span>Additional Filters</span>
                    <Tooltip title="These filters will be applied in addition to any filters already set in the main view">
                      <InfoCircleOutlined style={{ color: '#1890ff' }} />
                    </Tooltip>
                  </Space>
                }
                size="small"
              >
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Form.Item name="filterFullName" label="Full Name">
                      <Input placeholder="Filter by full name" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="filterUserName" label="Username">
                      <Input placeholder="Filter by username" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="filterEmail" label="Email">
                      <Input placeholder="Filter by email" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="filterPhone" label="Phone">
                      <Input placeholder="Filter by phone" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="filterRole" label="Role">
                      <Select placeholder="Select role" allowClear>
                        {roleOptions.map(role => (
                          <Option key={role} value={role}>{role}</Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="filterGender" label="Gender">
                      <Select placeholder="Select gender" allowClear>
                        <Option value="Male">Male</Option>
                        <Option value="Female">Female</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="filterStatus" label="Status">
                      <Select placeholder="Select status" allowClear>
                        <Option value="Active">Active</Option>
                        <Option value="Inactive">Inactive</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="filterSortDirection" label="Sort Direction">
                      <Radio.Group>
                        <Radio.Button value="asc">
                          <Space>
                            <SortAscendingOutlined />
                            Ascending
                          </Space>
                        </Radio.Button>
                        <Radio.Button value="desc">
                          <Space>
                            <SortDescendingOutlined />
                            Descending
                          </Space>
                        </Radio.Button>
                      </Radio.Group>
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item name="filterDobDateRange" label="Date of Birth Range">
                      <RangePicker 
                        style={{ width: '100%' }} 
                        format="DD/MM/YYYY" 
                        allowEmpty={[true, true]}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item name="filterCreatedDateRange" label="Created Date Range">
                      <RangePicker 
                        style={{ width: '100%' }} 
                        format="DD/MM/YYYY" 
                        allowEmpty={[true, true]}
                        showTime={{ format: 'HH:mm' }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item name="filterUpdatedDateRange" label="Updated Date Range">
                      <RangePicker 
                        style={{ width: '100%' }} 
                        format="DD/MM/YYYY" 
                        allowEmpty={[true, true]}
                        showTime={{ format: 'HH:mm' }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            );
          }}
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ExportConfigModal; 