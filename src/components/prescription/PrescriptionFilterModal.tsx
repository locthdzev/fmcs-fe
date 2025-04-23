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
import moment from "moment";

const { RangePicker } = DatePicker;
const { Title } = Typography;

interface PrescriptionFilterModalProps {
  visible: boolean;
  onCancel: () => void;
  onApply: (filters: any) => void;
  onReset: () => void;
  filters: {
    healthCheckResultCodeSearch: string;
    userSearch: string;
    staffSearch: string;
    drugSearch: string;
    updatedBySearch: string;
    prescriptionDateRange: [moment.Moment | null, moment.Moment | null];
    createdDateRange: [moment.Moment | null, moment.Moment | null];
    updatedDateRange: [moment.Moment | null, moment.Moment | null];
    sortBy: string;
    ascending: boolean;
  };
  prescriptionCodes: string[];
  healthCheckCodes: string[];
  userOptions: any[];
  staffOptions: any[];
  drugOptions: any[];
  updatedByOptions: any[];
}

// Define common date ranges for reuse
const commonDateRanges = {
  Today: () => [dayjs(), dayjs()],
  "Last 7 Days": () => [dayjs().subtract(6, "days"), dayjs()],
  "Last 30 Days": () => [dayjs().subtract(29, "days"), dayjs()],
  "This Month": () => [dayjs().startOf("month"), dayjs().endOf("month")],
  "Last Month": () => [
    dayjs().subtract(1, "month").startOf("month"),
    dayjs().subtract(1, "month").endOf("month"),
  ],
  "This Year": () => [dayjs().startOf("year"), dayjs().endOf("year")],
  "All Time": () => [dayjs("2020-01-01"), dayjs("2030-12-31")],
};

// Sửa hàm chuyển đổi từ moment sang dayjs
const momentToDayjs = (momentDate: moment.Moment | null): dayjs.Dayjs | null => {
  if (!momentDate) return null;
  return dayjs(momentDate.format('YYYY-MM-DD'));
};

// Sửa hàm chuyển đổi từ dayjs sang moment
const dayjsToMoment = (dayjsDate: dayjs.Dayjs | null): moment.Moment | null => {
  if (!dayjsDate) return null;
  return moment(dayjsDate.format('YYYY-MM-DD'));
};

const PrescriptionFilterModal: React.FC<PrescriptionFilterModalProps> = ({
  visible,
  onCancel,
  onApply,
  onReset,
  filters,
  prescriptionCodes,
  healthCheckCodes,
  userOptions,
  staffOptions,
  drugOptions,
  updatedByOptions,
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
    // Log trạng thái filter hiện tại
    console.log("Applying filters from modal:", localFilters);

    // Create processed filters object with proper handling of undefined values
    const processedFilters = {
      healthCheckResultCodeSearch: localFilters.healthCheckResultCodeSearch || "",
      userSearch: localFilters.userSearch || "",
      staffSearch: localFilters.staffSearch || "",
      drugSearch: localFilters.drugSearch || "",
      updatedBySearch: localFilters.updatedBySearch || "",
      prescriptionDateRange: Array.isArray(localFilters.prescriptionDateRange)
        ? localFilters.prescriptionDateRange
        : [null, null],
      createdDateRange: Array.isArray(localFilters.createdDateRange)
        ? localFilters.createdDateRange
        : [null, null],
      updatedDateRange: Array.isArray(localFilters.updatedDateRange)
        ? localFilters.updatedDateRange
        : [null, null],
      sortBy: localFilters.sortBy || "PrescriptionDate",
      ascending: Boolean(localFilters.ascending),
    };

    console.log("Sending processed filters to parent:", processedFilters);
    
    // Gọi hàm callback từ component cha
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
        <Divider orientation="left">Filter Option</Divider>
        <Row gutter={16}>
          {/* Health Check Result Code */}
          <Col span={12}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Health Check Result
              </div>
              <Select
                showSearch
                allowClear
                placeholder="Select Health Check Result"
                value={localFilters.healthCheckResultCodeSearch || undefined}
                onChange={(value) =>
                  updateFilter("healthCheckResultCodeSearch", value)
                }
                style={{ width: "100%" }}
                filterOption={(input, option) =>
                  ((option?.label as string) || "")
                    .toLowerCase()
                    .indexOf(input.toLowerCase()) >= 0
                }
                options={healthCheckCodes.map((code) => ({
                  value: code,
                  label: code,
                }))}
              />
            </div>
          </Col>

          {/* User */}
          <Col span={12}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Medicine User
              </div>
              <Select
                showSearch
                allowClear
                placeholder="Select User"
                value={localFilters.userSearch || undefined}
                onChange={(value) => updateFilter("userSearch", value)}
                style={{ width: "100%" }}
                filterOption={(input, option) =>
                  ((option?.label as string) || "")
                    .toLowerCase()
                    .indexOf(input.toLowerCase()) >= 0
                }
                options={userOptions.map((user) => ({
                  value: user.id,
                  label: `${user.fullName} (${user.email})`,
                }))}
              />
            </div>
          </Col>
        </Row>

        <Row gutter={16}>
          {/* Staff */}
          <Col span={12}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Healthcare Staff
              </div>
              <Select
                showSearch
                allowClear
                placeholder="Select Staff"
                value={localFilters.staffSearch || undefined}
                onChange={(value) => updateFilter("staffSearch", value)}
                style={{ width: "100%" }}
                filterOption={(input, option) =>
                  ((option?.label as string) || "")
                    .toLowerCase()
                    .indexOf(input.toLowerCase()) >= 0
                }
                options={staffOptions.map((staff) => ({
                  value: staff.id,
                  label: `${staff.fullName} (${staff.email})`,
                }))}
              />
            </div>
          </Col>

          {/* Drug */}
          <Col span={12}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Drug
              </div>
              <Select
                showSearch
                allowClear
                placeholder="Select drug"
                value={localFilters.drugSearch || undefined}
                onChange={(value) => updateFilter("drugSearch", value)}
                style={{ width: "100%" }}
                filterOption={(input, option) =>
                  ((option?.label as string) || "")
                    .toLowerCase()
                    .indexOf(input.toLowerCase()) >= 0
                }
                options={drugOptions.map((drug) => ({
                  value: drug.id,
                  label: `${drug.name} (${drug.drugCode})`,
                }))}
              />
            </div>
          </Col>
        </Row>

        <Row gutter={16}>
          {/* Updated By */}
          <Col span={12}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Updated By
              </div>
              <Select
                showSearch
                allowClear
                placeholder="Select Updated By"
                value={localFilters.updatedBySearch || undefined}
                onChange={(value) => updateFilter("updatedBySearch", value)}
                style={{ width: "100%" }}
                filterOption={(input, option) =>
                  ((option?.label as string) || "")
                    .toLowerCase()
                    .indexOf(input.toLowerCase()) >= 0
                }
                options={updatedByOptions.map((user) => ({
                  value: user.id,
                  label: `${user.fullName} (${user.email})`,
                }))}
              />
            </div>
          </Col>

          {/* Sort Field */}
          <Col span={12}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Sort By
              </div>
              <Select
                placeholder="Sort Field"
                value={localFilters.sortBy || "PrescriptionDate"}
                onChange={(value) => updateFilter("sortBy", value)}
                style={{ width: "100%" }}
                options={[
                  { value: "PrescriptionDate", label: "Prescription Date" },
                  { value: "CreatedAt", label: "Created At" },
                  { value: "UpdatedAt", label: "Updated At" },
                ]}
              />
            </div>
          </Col>
        </Row>

        <Divider orientation="left">Date Ranges</Divider>

        <Row gutter={16}>
          {/* Prescription Date Range */}
          <Col span={12}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Prescription Date Range
              </div>
              <RangePicker
                style={{ width: "100%" }}
                placeholder={["From date", "To date"]}
                format="DD/MM/YYYY"
                allowClear
                value={[
                  momentToDayjs(localFilters.prescriptionDateRange[0]),
                  momentToDayjs(localFilters.prescriptionDateRange[1])
                ]}
                onChange={(dates) => {
                  const momentDates: [moment.Moment | null, moment.Moment | null] = [
                    dates?.[0] ? dayjsToMoment(dates[0]) : null,
                    dates?.[1] ? dayjsToMoment(dates[1]) : null
                  ];
                  updateFilter("prescriptionDateRange", momentDates);
                }}
                presets={[
                  { label: "Today", value: [dayjs().startOf('day'), dayjs().endOf('day')] },
                  {
                    label: "Last 7 Days",
                    value: [dayjs().subtract(6, "day").startOf('day'), dayjs().endOf('day')],
                  },
                  {
                    label: "Last 30 Days",
                    value: [dayjs().subtract(29, "day").startOf('day'), dayjs().endOf('day')],
                  },
                  {
                    label: "This Month",
                    value: [dayjs().startOf("month"), dayjs().endOf("month")],
                  },
                  {
                    label: "Last Month",
                    value: [
                      dayjs().subtract(1, "month").startOf("month"), 
                      dayjs().subtract(1, "month").endOf("month")
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

          {/* Created Date Range */}
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
                value={[
                  momentToDayjs(localFilters.createdDateRange[0]),
                  momentToDayjs(localFilters.createdDateRange[1])
                ]}
                onChange={(dates) => {
                  const momentDates: [moment.Moment | null, moment.Moment | null] = [
                    dates?.[0] ? dayjsToMoment(dates[0]) : null,
                    dates?.[1] ? dayjsToMoment(dates[1]) : null
                  ];
                  updateFilter("createdDateRange", momentDates);
                }}
                presets={[
                  { label: "Today", value: [dayjs().startOf('day'), dayjs().endOf('day')] },
                  {
                    label: "Last 7 Days",
                    value: [dayjs().subtract(6, "day").startOf('day'), dayjs().endOf('day')],
                  },
                  {
                    label: "Last 30 Days",
                    value: [dayjs().subtract(29, "day").startOf('day'), dayjs().endOf('day')],
                  },
                  {
                    label: "This Month",
                    value: [dayjs().startOf("month"), dayjs().endOf("month")],
                  },
                  {
                    label: "Last Month",
                    value: [
                      dayjs().subtract(1, "month").startOf("month"), 
                      dayjs().subtract(1, "month").endOf("month")
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
        </Row>

        <Row gutter={16}>
          {/* Updated Date Range */}
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
                value={[
                  momentToDayjs(localFilters.updatedDateRange[0]),
                  momentToDayjs(localFilters.updatedDateRange[1])
                ]}
                onChange={(dates) => {
                  const momentDates: [moment.Moment | null, moment.Moment | null] = [
                    dates?.[0] ? dayjsToMoment(dates[0]) : null,
                    dates?.[1] ? dayjsToMoment(dates[1]) : null
                  ];
                  updateFilter("updatedDateRange", momentDates);
                }}
                presets={[
                  { label: "Today", value: [dayjs().startOf('day'), dayjs().endOf('day')] },
                  {
                    label: "Last 7 Days",
                    value: [dayjs().subtract(6, "day").startOf('day'), dayjs().endOf('day')],
                  },
                  {
                    label: "Last 30 Days",
                    value: [dayjs().subtract(29, "day").startOf('day'), dayjs().endOf('day')],
                  },
                  {
                    label: "This Month",
                    value: [dayjs().startOf("month"), dayjs().endOf("month")],
                  },
                  {
                    label: "Last Month",
                    value: [
                      dayjs().subtract(1, "month").startOf("month"), 
                      dayjs().subtract(1, "month").endOf("month")
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
                Sort Direction
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

export default PrescriptionFilterModal; 