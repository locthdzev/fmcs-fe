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
    ascending: boolean;
  };
  treatmentPlanCodes: string[];
  healthCheckCodes: string[];
  userOptions: any[];
  drugOptions: any[];
  updatedByOptions: any[];
}

// Định nghĩa date ranges phổ biến để tái sử dụng
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
  "All Time (includes 2025)": () => [dayjs("2020-01-01"), dayjs("2030-12-31")],
};

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
      healthCheckResultCodeSearch:
        localFilters.healthCheckResultCode || undefined,
      drugSearch: localFilters.drugSearch || undefined,
      updatedBySearch: localFilters.updatedBySearch || undefined,
      dateRange: Array.isArray(localFilters.dateRange)
        ? localFilters.dateRange
        : [null, null],
      createdDateRange: Array.isArray(localFilters.createdDateRange)
        ? localFilters.createdDateRange
        : [null, null],
      updatedDateRange: Array.isArray(localFilters.updatedDateRange)
        ? localFilters.updatedDateRange
        : [null, null],
      sortBy: "CreatedAt",
      ascending: Boolean(localFilters.ascending),
      userSearch: undefined,
    };

    // Special handling for "All Time" date range
    const isAllTimeRange =
      localFilters.dateRange &&
      localFilters.dateRange[0]?.format("YYYY-MM-DD") ===
        dayjs("2020-01-01").format("YYYY-MM-DD") &&
      localFilters.dateRange[1]?.format("YYYY-MM-DD") ===
        dayjs("2030-12-31").format("YYYY-MM-DD");

    if (isAllTimeRange) {
      console.log(
        "All time date range selected - ensuring 2025 data is included"
      );
    }

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
        {/* Search Criteria Section */}
        <Title level={5}>Search Criteria</Title>
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
                value={localFilters.healthCheckResultCode || undefined}
                onChange={(value) =>
                  updateFilter("healthCheckResultCode", value)
                }
                style={{ width: "100%" }}
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
                  (option?.label as string)
                    .toLowerCase()
                    .indexOf(input.toLowerCase()) >= 0
                }
                options={drugOptions.map((drug) => ({
                  value: drug.name,
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
                  (option?.label as string)
                    .toLowerCase()
                    .indexOf(input.toLowerCase()) >= 0
                }
                options={updatedByOptions.map((user) => ({
                  value: user.fullName,
                  label: `${user.fullName} (${user.email})`,
                }))}
              />
            </div>
          </Col>
        </Row>

        <Divider style={{ margin: "8px 0 16px 0" }} />

        {/* Date & Sorting Section */}
        <Title level={5}>Date & Sorting</Title>

        <Row gutter={16}>
          {/* Treatment Date Range */}
          <Col span={12}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Treatment Date Range
              </div>
              <RangePicker
                style={{ width: "100%" }}
                placeholder={["From date", "To date"]}
                format="DD/MM/YYYY"
                allowClear
                value={localFilters.dateRange}
                onChange={(dates) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    dateRange: dates as [
                      dayjs.Dayjs | null,
                      dayjs.Dayjs | null
                    ],
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
                    label: "All Time (includes 2025)",
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
                value={localFilters.createdDateRange}
                onChange={(dates) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    createdDateRange: dates as [
                      dayjs.Dayjs | null,
                      dayjs.Dayjs | null
                    ],
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
                    label: "All Time (includes 2025)",
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
                value={localFilters.updatedDateRange}
                onChange={(dates) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    updatedDateRange: dates as [
                      dayjs.Dayjs | null,
                      dayjs.Dayjs | null
                    ],
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
                    label: "All Time (includes 2025)",
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

export default TreatmentPlanFilterModal;
