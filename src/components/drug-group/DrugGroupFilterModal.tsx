import React from "react";
import {
  Modal,
  Button,
  Space,
  Typography,
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

export interface DrugGroupAdvancedFilters {
  createdDateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null];
  updatedDateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null];
  ascending: boolean;
}

interface DrugGroupFilterModalProps {
  visible: boolean;
  onCancel: () => void;
  onApply: (filters: DrugGroupAdvancedFilters) => void;
  onReset: () => void;
  initialFilters: DrugGroupAdvancedFilters;
}

const DrugGroupFilterModal: React.FC<DrugGroupFilterModalProps> = ({
  visible,
  onCancel,
  onApply,
  onReset,
  initialFilters,
}) => {
  const [localFilters, setLocalFilters] = React.useState(initialFilters);

  // Reset localFilters when modal is opened with new filters
  React.useEffect(() => {
    if (visible) {
      setLocalFilters(initialFilters);
    }
  }, [visible, initialFilters]);

  // Process and apply filters
  const handleApply = () => {
    // Create processed filters object
    const processedFilters: DrugGroupAdvancedFilters = {
      createdDateRange: Array.isArray(localFilters.createdDateRange)
        ? localFilters.createdDateRange
        : [null, null],
      updatedDateRange: Array.isArray(localFilters.updatedDateRange)
        ? localFilters.updatedDateRange
        : [null, null],
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
        {/* Date & Sorting Section */}
        <Title level={5}>Date & Sorting</Title>

        <Row gutter={16}>
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
                    label: "All Time",
                    value: [dayjs("2020-01-01"), dayjs("2030-12-31")],
                  },
                ]}
              />
            </div>
          </Col>

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
                    label: "All Time",
                    value: [dayjs("2020-01-01"), dayjs("2030-12-31")],
                  },
                ]}
              />
            </div>
          </Col>
        </Row>

        <Row gutter={16}>
          {/* Sort Direction */}
          <Col span={24}>
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

export default DrugGroupFilterModal;
