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
  Typography,
  Divider,
  Row,
  Col,
  Card,
} from "antd";
import {
  UndoOutlined,
  CheckCircleOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  TagOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title } = Typography;

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
    ascending: boolean;
  };
  roleOptions: string[];
  users: any[];
}

// Định nghĩa date ranges phổ biến để tái sử dụng
const commonDateRanges = {
  Today: () => [dayjs(), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs],
  "Last 7 Days": () =>
    [dayjs().subtract(6, "days"), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs],
  "Last 30 Days": () =>
    [dayjs().subtract(29, "days"), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs],
  "This Month": () =>
    [dayjs().startOf("month"), dayjs().endOf("month")] as [
      dayjs.Dayjs,
      dayjs.Dayjs
    ],
  "Last Month": () =>
    [
      dayjs().subtract(1, "month").startOf("month"),
      dayjs().subtract(1, "month").endOf("month"),
    ] as [dayjs.Dayjs, dayjs.Dayjs],
  "This Year": () =>
    [dayjs().startOf("year"), dayjs().endOf("year")] as [
      dayjs.Dayjs,
      dayjs.Dayjs
    ],
  "All Time": () =>
    [dayjs("2020-01-01"), dayjs("2030-12-31")] as [dayjs.Dayjs, dayjs.Dayjs],
};

const UserFilterModal: React.FC<UserFilterModalProps> = ({
  visible,
  onCancel,
  onApply,
  onReset,
  filters,
  roleOptions,
  users,
}) => {
  const [localFilters, setLocalFilters] = React.useState(filters);

  // Reset localFilters when modal is opened with new filters
  React.useEffect(() => {
    if (visible) {
      setLocalFilters(filters);
    }
  }, [visible, filters]);

  // Process and apply filters
  const handleApply = () => {
    // Create processed filters object with proper handling of undefined values
    const processedFilters = {
      fullNameSearch: localFilters.fullNameSearch || undefined,
      userNameSearch: localFilters.userNameSearch || undefined,
      emailSearch: localFilters.emailSearch || undefined,
      phoneSearch: localFilters.phoneSearch || undefined,
      roleFilter: localFilters.roleFilter || undefined,
      genderFilter: localFilters.genderFilter || undefined,
      statusFilter: localFilters.statusFilter || undefined,
      dobDateRange: Array.isArray(localFilters.dobDateRange)
        ? localFilters.dobDateRange
        : [null, null],
      createdDateRange: Array.isArray(localFilters.createdDateRange)
        ? localFilters.createdDateRange
        : [null, null],
      updatedDateRange: Array.isArray(localFilters.updatedDateRange)
        ? localFilters.updatedDateRange
        : [null, null],
      sortBy: "CreatedAt", // Mặc định là CreatedAt
      ascending: Boolean(localFilters.ascending),
    };

    onApply(processedFilters);
  };

  // Common styles for filter items
  const filterItemStyle = { marginBottom: "16px" };
  const filterLabelStyle = { marginBottom: "8px", color: "#666666" };

  // Function to update filter state
  const updateFilter = (field: string, value: any) => {
    setLocalFilters((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Modal
      title="Advanced Filters"
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={[
        <Button key="reset" onClick={onReset} icon={<UndoOutlined />}>
          Reset
        </Button>,
        <Button
          key="apply"
          type="primary"
          onClick={handleApply}
          icon={<CheckCircleOutlined />}
        >
          Apply
        </Button>,
      ]}
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        <Divider orientation="left">Filter Options</Divider>
        <Row gutter={16}>
          {/* User Name */}
          <Col span={12}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Username
              </div>
              <Select
                showSearch
                placeholder="Search by username"
                value={localFilters.userNameSearch || undefined}
                onChange={(value) => updateFilter("userNameSearch", value)}
                style={{ width: "100%" }}
                allowClear
                filterOption={(input, option) =>
                  (option?.value?.toString().toLowerCase() || "").includes(
                    input.toLowerCase()
                  )
                }
              >
                {users?.map((user) => (
                  <Option key={user.id} value={user.userName}>
                    {user.userName}
                  </Option>
                ))}
              </Select>
            </div>
          </Col>

          {/* Email */}
          <Col span={12}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Email
              </div>
              <Select
                showSearch
                placeholder="Search by email"
                value={localFilters.emailSearch || undefined}
                onChange={(value) => updateFilter("emailSearch", value)}
                style={{ width: "100%" }}
                allowClear
                filterOption={(input, option) =>
                  (option?.value?.toString().toLowerCase() || "").includes(
                    input.toLowerCase()
                  )
                }
              >
                {users?.map((user) => (
                  <Option key={user.id} value={user.email}>
                    {user.email}
                  </Option>
                ))}
              </Select>
            </div>
          </Col>
        </Row>

        <Row gutter={16}>
          {/* Phone */}
          <Col span={12}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Phone
              </div>
              <Select
                showSearch
                placeholder="Search by phone"
                value={localFilters.phoneSearch || undefined}
                onChange={(value) => updateFilter("phoneSearch", value)}
                style={{ width: "100%" }}
                allowClear
                filterOption={(input, option) =>
                  (option?.value?.toString().toLowerCase() || "").includes(
                    input.toLowerCase()
                  )
                }
              >
                {users?.map((user) => (
                  <Option key={user.id} value={user.phone}>
                    {user.phone}
                  </Option>
                ))}
              </Select>
            </div>
          </Col>

          {/* Gender */}
          <Col span={12}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Gender
              </div>
              <Select
                placeholder="Filter by gender"
                value={localFilters.genderFilter || undefined}
                onChange={(value) => updateFilter("genderFilter", value)}
                style={{ width: "100%" }}
                allowClear
              >
                <Option value="Male">Male</Option>
                <Option value="Female">Female</Option>
                <Option value="Other">Other</Option>
              </Select>
            </div>
          </Col>
        </Row>

        <Divider orientation="left">Date & Sorting</Divider>
        <Row gutter={16}>
          <Col span={24}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Date of Birth Range
              </div>
              <RangePicker
                style={{ width: "100%" }}
                placeholder={["From date", "To date"]}
                format="DD/MM/YYYY"
                allowClear
                value={localFilters.dobDateRange}
                onChange={(dates) => updateFilter("dobDateRange", dates)}
              />
            </div>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Created Date Range
              </div>
              <RangePicker
                style={{ width: "100%" }}
                placeholder={["From date", "To date"]}
                format="DD/MM/YYYY"
                allowClear
                showTime
                value={localFilters.createdDateRange}
                onChange={(dates) => updateFilter("createdDateRange", dates)}
                ranges={{
                  ...commonDateRanges,
                }}
              />
            </div>
          </Col>

          <Col span={12}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Updated Date Range
              </div>
              <RangePicker
                style={{ width: "100%" }}
                placeholder={["From date", "To date"]}
                format="DD/MM/YYYY"
                allowClear
                showTime
                value={localFilters.updatedDateRange}
                onChange={(dates) => updateFilter("updatedDateRange", dates)}
                ranges={{
                  ...commonDateRanges,
                }}
              />
            </div>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Sort Direction (CreatedAt)
              </div>
              <Radio.Group
                value={localFilters.ascending}
                onChange={(e) => updateFilter("ascending", e.target.value)}
                optionType="button"
                buttonStyle="solid"
                style={{ width: "100%" }}
              >
                <Radio.Button
                  value={true}
                  style={{ width: "50%", textAlign: "center" }}
                >
                  <SortAscendingOutlined /> Oldest First
                </Radio.Button>
                <Radio.Button
                  value={false}
                  style={{ width: "50%", textAlign: "center" }}
                >
                  <SortDescendingOutlined /> Newest First
                </Radio.Button>
              </Radio.Group>
            </div>
          </Col>
        </Row>
      </Space>
    </Modal>
  );
};

export default UserFilterModal;
