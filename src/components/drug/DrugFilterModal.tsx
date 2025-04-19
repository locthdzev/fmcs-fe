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

export interface DrugFilterModalProps {
  visible: boolean;
  onCancel: () => void;
  onApply: (filters: any) => void;
  onReset: () => void;
  filters: {
    drugCode: string;
    drugName: string;
    drugGroupId: string;
    manufacturer: string;
    priceRange: [number | null, number | null];
    dateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null];
    createdDateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null];
    updatedDateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null];
    ascending: boolean;
    sortBy: string;
  };
  drugGroups: any[];
  drugCodes: string[];
  drugNames: string[];
  manufacturers: string[];
}

const DrugFilterModal: React.FC<DrugFilterModalProps> = ({
  visible,
  onCancel,
  onApply,
  onReset,
  filters,
  drugGroups,
  drugCodes,
  drugNames,
  manufacturers,
}) => {
  const [localFilters, setLocalFilters] = React.useState(filters);

  // Reset localFilters when modal is opened with new filters
  React.useEffect(() => {
    if (visible) {
      setLocalFilters(filters);
    }
  }, [visible, filters]);

  // Thêm hàm handleReset để xử lý khi bấm nút Reset
  const handleReset = () => {
    console.log("Reset clicked in modal, resetting all filters");

    // Reset localFilters về giá trị mặc định trước
    setLocalFilters({
      drugCode: "",
      drugName: "",
      drugGroupId: "",
      manufacturer: "",
      priceRange: [null, null],
      dateRange: [null, null],
      createdDateRange: [null, null],
      updatedDateRange: [null, null],
      sortBy: "CreatedAt",
      ascending: false,
    });

    // Gọi onReset callback từ component cha để xóa tất cả filter và tải lại dữ liệu
    onReset();
  };

  // Process and apply filters
  const handleApply = () => {
    // Log giá trị của filter trước khi xử lý để debug
    console.log("Local filters before processing:", localFilters);

    // Create processed filters object with proper handling of undefined values
    const processedFilters = {
      drugCode: localFilters.drugCode || "",
      drugName: localFilters.drugName || "",
      drugGroupId: localFilters.drugGroupId || "",
      manufacturer: localFilters.manufacturer || "",
      priceRange: localFilters.priceRange || [null, null],
      dateRange: Array.isArray(localFilters.dateRange)
        ? localFilters.dateRange
        : [null, null],
      createdDateRange: Array.isArray(localFilters.createdDateRange)
        ? localFilters.createdDateRange
        : [null, null],
      updatedDateRange: Array.isArray(localFilters.updatedDateRange)
        ? localFilters.updatedDateRange
        : [null, null],
      sortBy: localFilters.sortBy || "CreatedAt",
      ascending: Boolean(localFilters.ascending),
    };

    // Log processed filters trước khi gửi đi
    console.log("Processed filters:", processedFilters);

    // Gọi callback onApply với filters đã được xử lý
    onApply(processedFilters);
  };

  // Common styles for filter items
  const filterItemStyle = { marginBottom: "16px" };
  const filterLabelStyle = { marginBottom: "8px", color: "#666666" };

  // Function to update filter state
  const updateFilter = (field: string, value: any) => {
    console.log(`Updating filter ${field} with value:`, value);

    if (field.includes("Range")) {
      // Xử lý riêng cho các trường range
      setLocalFilters((prev) => ({
        ...prev,
        [field]: value === undefined || value === null ? [null, null] : value,
      }));
    } else if (field === "ascending") {
      // Xử lý riêng cho trường boolean
      setLocalFilters((prev) => ({ ...prev, [field]: value }));
    } else {
      // Xử lý cho các trường string thông thường
      setLocalFilters((prev) => ({ ...prev, [field]: value || "" }));
    }
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
        <Button key="reset" onClick={handleReset} icon={<UndoOutlined />}>
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
        <Divider orientation="left">Search Criteria</Divider>
        <Row gutter={16}>
          {/* Drug Group */}
          <Col span={12}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Drug Group
              </div>
              <Select
                showSearch
                allowClear
                placeholder="Select Drug Group"
                value={localFilters.drugGroupId || undefined}
                onChange={(value) => updateFilter("drugGroupId", value)}
                style={{ width: "100%" }}
                filterOption={(input, option) =>
                  (option?.label as string)
                    .toLowerCase()
                    .indexOf(input.toLowerCase()) >= 0
                }
                options={drugGroups.map((group) => ({
                  value: group.id,
                  label: group.groupName,
                }))}
              />
            </div>
          </Col>

          {/* Manufacturer */}
          <Col span={12}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Manufacturer
              </div>
              <Select
                showSearch
                allowClear
                placeholder="Select Manufacturer"
                value={localFilters.manufacturer || undefined}
                onChange={(value) => updateFilter("manufacturer", value)}
                style={{ width: "100%" }}
                filterOption={(input, option) =>
                  (option?.label as string)
                    .toLowerCase()
                    .indexOf(input.toLowerCase()) >= 0
                }
                options={manufacturers.map((mfr) => ({
                  value: mfr,
                  label: mfr,
                }))}
              />
            </div>
          </Col>
        </Row>

        {/* Date Ranges Section */}
        <Divider orientation="left">Date Ranges</Divider>
        <Row gutter={16}>
          {/* Date Range */}
          <Col span={8}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Date Range
              </div>
              <RangePicker
                value={localFilters.dateRange as [dayjs.Dayjs, dayjs.Dayjs]}
                onChange={(dates) => updateFilter("dateRange", dates)}
                style={{ width: "100%" }}
                placeholder={["Start Date", "End Date"]}
                presets={[
                  { label: "Today", value: [dayjs(), dayjs()] },
                  {
                    label: "Last 7 Days",
                    value: [dayjs().subtract(6, "days"), dayjs()],
                  },
                  {
                    label: "Last 30 Days",
                    value: [dayjs().subtract(29, "days"), dayjs()],
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

          {/* Created Date Range */}
          <Col span={8}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Created Date Range
              </div>
              <RangePicker
                value={
                  localFilters.createdDateRange as [dayjs.Dayjs, dayjs.Dayjs]
                }
                onChange={(dates) => updateFilter("createdDateRange", dates)}
                style={{ width: "100%" }}
                placeholder={["Start Date", "End Date"]}
                presets={[
                  { label: "Today", value: [dayjs(), dayjs()] },
                  {
                    label: "Last 7 Days",
                    value: [dayjs().subtract(6, "days"), dayjs()],
                  },
                  {
                    label: "Last 30 Days",
                    value: [dayjs().subtract(29, "days"), dayjs()],
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
          <Col span={8}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Updated Date Range
              </div>
              <RangePicker
                value={
                  localFilters.updatedDateRange as [dayjs.Dayjs, dayjs.Dayjs]
                }
                onChange={(dates) => updateFilter("updatedDateRange", dates)}
                style={{ width: "100%" }}
                placeholder={["Start Date", "End Date"]}
                presets={[
                  { label: "Today", value: [dayjs(), dayjs()] },
                  {
                    label: "Last 7 Days",
                    value: [dayjs().subtract(6, "days"), dayjs()],
                  },
                  {
                    label: "Last 30 Days",
                    value: [dayjs().subtract(29, "days"), dayjs()],
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

        {/* Sort Settings */}
        <Divider orientation="left">Sort Settings</Divider>
        <Row gutter={16}>
          <Col span={12}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Sort By
              </div>
              <Select
                placeholder="Select Sort Field"
                value={localFilters.sortBy || "CreatedAt"}
                onChange={(value) => updateFilter("sortBy", value)}
                style={{ width: "100%" }}
                options={[
                  { value: "CreatedAt", label: "Created Date" },
                  { value: "UpdatedAt", label: "Updated Date" },
                  { value: "Price", label: "Price" },
                  { value: "Name", label: "Name" },
                  { value: "DrugCode", label: "Drug Code" },
                ]}
              />
            </div>
          </Col>
          <Col span={12}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Sort Direction
              </div>
              <Radio.Group
                onChange={(e) => updateFilter("ascending", e.target.value)}
                value={localFilters.ascending}
              >
                <Radio value={false} style={{ marginRight: "20px" }}>
                  <Space>
                    <SortDescendingOutlined />
                    Descending (newest first)
                  </Space>
                </Radio>
                <Radio value={true}>
                  <Space>
                    <SortAscendingOutlined />
                    Ascending (oldest first)
                  </Space>
                </Radio>
              </Radio.Group>
            </div>
          </Col>
        </Row>
      </Space>
    </Modal>
  );
};

export default DrugFilterModal;
