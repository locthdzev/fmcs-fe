import React from "react";
import {
  Modal,
  Button,
  Space,
  Typography,
  Select,
  DatePicker,
  Radio,
  Divider,
  Row,
  Col,
} from "antd";
import {
  UndoOutlined,
  CheckCircleOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;
const { Title } = Typography;
const { Option } = Select;

interface PeriodicHealthCheckupFilterModalProps {
  visible: boolean;
  onCancel: () => void;
  onApply: (filters: any) => void;
  onReset: () => void;
  filters: {
    studentSearch: string;
    staffSearch: string;
    dateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null;
    ascending: boolean;
  };
  studentOptions: { id: string; name: string }[];
  staffOptions: { id: string; name: string }[];
}

const PeriodicHealthCheckupFilterModal: React.FC<PeriodicHealthCheckupFilterModalProps> = ({
  visible,
  onCancel,
  onApply,
  onReset,
  filters,
  studentOptions,
  staffOptions,
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
      studentSearch: localFilters.studentSearch || undefined,
      staffSearch: localFilters.staffSearch || undefined,
      dateRange: Array.isArray(localFilters.dateRange) ? localFilters.dateRange : null,
      sortBy: "CreatedAt",
      ascending: Boolean(localFilters.ascending),
    };

    onApply(processedFilters);
  };

  // Common styles for filter items
  const filterItemStyle = { marginBottom: "16px" };
  const filterLabelStyle = { marginBottom: "8px", color: "#666666" };

  // Function to update filter state
  const updateFilter = (field: string, value: any) => {
    setLocalFilters((prev) => ({ ...prev, [field]: value || "" }));
  };

  return (
    <Modal
      title={
        <Title level={4} style={{ margin: 0 }}>
          Advanced Filters
        </Title>
      }
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
        <Divider orientation="left">Search Criteria</Divider>
        <Row gutter={16}>
          {/* Student Name */}
          <Col span={12}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Student Name
              </div>
              <Select
                showSearch
                allowClear
                placeholder="Search by student name"
                value={localFilters.studentSearch || undefined}
                onChange={(value) => updateFilter("studentSearch", value)}
                style={{ width: "100%" }}
                filterOption={(input, option) =>
                  (option?.children as unknown as string)
                    .toLowerCase()
                    .indexOf(input.toLowerCase()) >= 0
                }
                optionFilterProp="children"
              >
                {studentOptions.map((student) => (
                  <Option key={student.id} value={student.name}>
                    {student.name}
                  </Option>
                ))}
              </Select>
            </div>
          </Col>

          {/* Staff Name */}
          <Col span={12}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Staff Name
              </div>
              <Select
                showSearch
                allowClear
                placeholder="Search by staff name"
                value={localFilters.staffSearch || undefined}
                onChange={(value) => updateFilter("staffSearch", value)}
                style={{ width: "100%" }}
                filterOption={(input, option) =>
                  (option?.children as unknown as string)
                    .toLowerCase()
                    .indexOf(input.toLowerCase()) >= 0
                }
                optionFilterProp="children"
              >
                {staffOptions.map((staff) => (
                  <Option key={staff.id} value={staff.name}>
                    {staff.name}
                  </Option>
                ))}
              </Select>
            </div>
          </Col>
        </Row>

        <Divider orientation="left">Date & Sorting</Divider>

        <Row gutter={16}>
          {/* Date Range */}
          <Col span={12}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Date Range
              </div>
              <RangePicker
                style={{ width: "100%" }}
                placeholder={["Start date", "End date"]}
                format="DD/MM/YYYY"
                allowClear
                value={localFilters.dateRange}
                onChange={(dates) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    dateRange: dates as [dayjs.Dayjs | null, dayjs.Dayjs | null],
                  }))
                }
                presets={[
                  { label: "Today", value: [dayjs(), dayjs()] },
                  {
                    label: "Last 7 Days",
                    value: [dayjs().subtract(6, "day"), dayjs()],
                  },
                  {
                    label: "Last 30 Days",
                    value: [dayjs().subtract(29, "day"), dayjs()],
                  },
                  {
                    label: "This Month",
                    value: [dayjs().startOf("month"), dayjs().endOf("month")],
                  },
                  {
                    label: "Last Month",
                    value: [
                      dayjs().subtract(1, "month").startOf("month"),
                      dayjs().subtract(1, "month").endOf("month"),
                    ],
                  },
                  {
                    label: "This Year",
                    value: [dayjs().startOf("year"), dayjs().endOf("year")],
                  },
                  {
                    label: "All Time",
                    value: [dayjs("2020-01-01"), dayjs("2030-12-31")],
                  },
                ]}
              />
            </div>
          </Col>

          {/* Sort Direction */}
          <Col span={12}>
            <div className="filter-item">
              <div className="filter-label" style={filterLabelStyle}>
                Sort Direction (CreatedAt)
              </div>
              <Radio.Group
                value={localFilters.ascending ? "asc" : "desc"}
                onChange={(e) =>
                  updateFilter("ascending", e.target.value === "asc")
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
          </Col>
        </Row>
      </Space>
    </Modal>
  );
};

export default PeriodicHealthCheckupFilterModal; 