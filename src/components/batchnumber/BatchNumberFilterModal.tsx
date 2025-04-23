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

interface BatchNumberFilterModalProps {
  visible: boolean;
  onCancel: () => void;
  onApply: (filters: any) => void;
  onReset: () => void;
  filters: {
    drugNameFilter: string;
    supplierFilter: string;
    statusFilter: string;
    manufacturingDateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null];
    expiryDateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null];
    ascending: boolean;
  };
  drugOptions: any[];
  supplierOptions: any[];
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

const BatchNumberFilterModal: React.FC<BatchNumberFilterModalProps> = ({
  visible,
  onCancel,
  onApply,
  onReset,
  filters,
  drugOptions,
  supplierOptions,
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
      drugNameFilter: localFilters.drugNameFilter || undefined,
      supplierFilter: localFilters.supplierFilter || undefined,
      statusFilter: localFilters.statusFilter || undefined,
      manufacturingDateRange: Array.isArray(localFilters.manufacturingDateRange)
        ? localFilters.manufacturingDateRange
        : [null, null],
      expiryDateRange: Array.isArray(localFilters.expiryDateRange)
        ? localFilters.expiryDateRange
        : [null, null],
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
          {/* Drug Name Filter */}
          <Col span={12}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Drug Name
              </div>
              <Select
                showSearch
                allowClear
                placeholder="Filter by Drug Name"
                value={localFilters.drugNameFilter || undefined}
                onChange={(value) => updateFilter("drugNameFilter", value)}
                style={{ width: "100%" }}
                filterOption={(input, option) =>
                  (option?.label as string)
                    .toLowerCase()
                    .indexOf(input.toLowerCase()) >= 0
                }
                options={drugOptions.map((drug) => ({
                  value: drug.name,
                  label: `${drug.name} (${drug.drugCode || "No Code"})`,
                }))}
              />
            </div>
          </Col>

          {/* Supplier Filter */}
          <Col span={12}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Supplier
              </div>
              <Select
                showSearch
                allowClear
                placeholder="Filter by Supplier"
                value={localFilters.supplierFilter || undefined}
                onChange={(value) => updateFilter("supplierFilter", value)}
                style={{ width: "100%" }}
                filterOption={(input, option) =>
                  (option?.label as string)
                    .toLowerCase()
                    .indexOf(input.toLowerCase()) >= 0
                }
                options={supplierOptions.map((supplier) => ({
                  value: supplier.supplierName,
                  label: supplier.supplierName,
                }))}
              />
            </div>
          </Col>
        </Row>
        <Divider orientation="left">Date Ranges & Sorting</Divider>

        <Row gutter={16}>
          {/* Manufacturing Date Range */}
          <Col span={12}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Manufacturing Date Range
              </div>
              <RangePicker
                style={{ width: "100%" }}
                placeholder={["From date", "To date"]}
                format="DD/MM/YYYY"
                allowClear
                value={localFilters.manufacturingDateRange}
                onChange={(dates) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    manufacturingDateRange: dates as [
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

          {/* Expiry Date Range */}
          <Col span={12}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Expiry Date Range
              </div>
              <RangePicker
                style={{ width: "100%" }}
                placeholder={["From date", "To date"]}
                format="DD/MM/YYYY"
                allowClear
                value={localFilters.expiryDateRange}
                onChange={(dates) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    expiryDateRange: dates as [
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

export default BatchNumberFilterModal;
