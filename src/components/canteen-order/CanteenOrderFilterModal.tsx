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

export interface CanteenOrderFilterModalProps {
  visible: boolean;
  onCancel: () => void;
  onApply: (filters: any) => void;
  onReset: () => void;
  filters: {
    licensePlate: string;
    driverName: string;
    status: string[];
    orderDateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null];
    createdDateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null];
    updatedDateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null];
    ascending: boolean;
    sortBy: string;
  };
  licensePlates: string[];
  driverNames: string[];
  statuses: { label: string; value: string }[];
}

const CanteenOrderFilterModal: React.FC<CanteenOrderFilterModalProps> = ({
  visible,
  onCancel,
  onApply,
  onReset,
  filters,
  licensePlates,
  driverNames,
  statuses,
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
      licensePlate: "",
      driverName: "",
      status: [],
      orderDateRange: [null, null],
      createdDateRange: [null, null],
      updatedDateRange: [null, null],
      sortBy: "OrderDate",
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
      licensePlate: localFilters.licensePlate || "",
      driverName: localFilters.driverName || "",
      status: Array.isArray(localFilters.status) ? localFilters.status : [],
      orderDateRange: Array.isArray(localFilters.orderDateRange)
        ? localFilters.orderDateRange
        : [null, null],
      createdDateRange: Array.isArray(localFilters.createdDateRange)
        ? localFilters.createdDateRange
        : [null, null],
      updatedDateRange: Array.isArray(localFilters.updatedDateRange)
        ? localFilters.updatedDateRange
        : [null, null],
      sortBy: localFilters.sortBy || "OrderDate",
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
          {/* License Plate */}
          <Col span={12}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                License Plate
              </div>
              <Select
                showSearch
                allowClear
                placeholder="Select License Plate"
                value={localFilters.licensePlate || undefined}
                onChange={(value) => updateFilter("licensePlate", value)}
                style={{ width: "100%" }}
                filterOption={(input, option) =>
                  (option?.label as string)
                    .toLowerCase()
                    .indexOf(input.toLowerCase()) >= 0
                }
                options={licensePlates.map((plate) => ({
                  value: plate,
                  label: plate,
                }))}
              />
            </div>
          </Col>

          {/* Driver Name */}
          <Col span={12}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Driver Name
              </div>
              <Select
                showSearch
                allowClear
                placeholder="Select Driver Name"
                value={localFilters.driverName || undefined}
                onChange={(value) => updateFilter("driverName", value)}
                style={{ width: "100%" }}
                filterOption={(input, option) =>
                  (option?.label as string)
                    .toLowerCase()
                    .indexOf(input.toLowerCase()) >= 0
                }
                options={driverNames.map((name) => ({
                  value: name,
                  label: name,
                }))}
              />
            </div>
          </Col>
        </Row>

        <Row gutter={16}>
          {/* Status */}
          <Col span={12}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Status
              </div>
              <Select
                mode="multiple"
                showSearch
                allowClear
                placeholder="Select Status"
                value={localFilters.status || []}
                onChange={(value) => updateFilter("status", value)}
                style={{ width: "100%" }}
                filterOption={(input, option) =>
                  (option?.label as string)
                    .toLowerCase()
                    .indexOf(input.toLowerCase()) >= 0
                }
                options={statuses}
              />
            </div>
          </Col>

          <Col span={12}>{/* Empty space for balance */}</Col>
        </Row>

        {/* Date Ranges Section */}
        <Divider orientation="left">Date Ranges</Divider>
        <Row gutter={16}>
          {/* Order Date Range */}
          <Col span={8}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Order Date Range
              </div>
              <RangePicker
                value={
                  localFilters.orderDateRange as [dayjs.Dayjs, dayjs.Dayjs]
                }
                onChange={(dates) => updateFilter("orderDateRange", dates)}
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
                value={localFilters.sortBy || "OrderDate"}
                onChange={(value) => updateFilter("sortBy", value)}
                style={{ width: "100%" }}
                options={[
                  { value: "OrderDate", label: "Order Date" },
                  { value: "CreatedAt", label: "Created Date" },
                  { value: "UpdatedAt", label: "Updated Date" },
                  { value: "LicensePlate", label: "License Plate" },
                  { value: "DriverName", label: "Driver Name" },
                  { value: "Status", label: "Status" },
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

export default CanteenOrderFilterModal;
