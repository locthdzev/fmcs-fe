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
  InputNumber,
  Checkbox,
} from "antd";
import {
  UndoOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;
const { Title } = Typography;

export interface CanteenItemFilterModalProps {
  visible: boolean;
  onCancel: () => void;
  onApply: (filters: any) => void;
  onReset: () => void;
  filters: {
    itemName: string;
    priceRange: [number | null, number | null];
    availability: string | null;
    status: string | null;
    createdDateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null];
    updatedDateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null];
    ascending: boolean;
    sortBy: string;
  };
  itemNames: string[];
}

const CanteenItemFilterModal: React.FC<CanteenItemFilterModalProps> = ({
  visible,
  onCancel,
  onApply,
  onReset,
  filters,
  itemNames,
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
      itemName: "",
      priceRange: [null, null],
      availability: null,
      status: null,
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
      itemName: localFilters.itemName || "",
      priceRange: localFilters.priceRange || [null, null],
      availability: localFilters.availability,
      status: localFilters.status,
      createdDateRange: Array.isArray(localFilters.createdDateRange)
        ? localFilters.createdDateRange
        : [null, null],
      updatedDateRange: Array.isArray(localFilters.updatedDateRange)
        ? localFilters.updatedDateRange
        : [null, null],
      sortBy: localFilters.sortBy || "CreatedAt",
      ascending: false, // Always use false (newest first) as we've removed the control
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
    
    if (field.includes('Range')) {
      // Xử lý riêng cho các trường range
      setLocalFilters((prev) => ({ 
        ...prev, 
        [field]: value === undefined || value === null ? [null, null] : value 
      }));
    } else if (field === 'ascending') {
      // Xử lý riêng cho trường boolean
      setLocalFilters((prev) => ({ ...prev, [field]: value }));
    } else {
      // Xử lý cho các trường string thông thường
      setLocalFilters((prev) => ({ ...prev, [field]: value }));
    }
  };

  return (
    <Modal
      title="Advanced Filters"
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
          {/* Item Name */}
          <Col span={12}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Item Name
              </div>
              <Select
                showSearch
                allowClear
                placeholder="Select Item Name"
                value={localFilters.itemName || undefined}
                onChange={(value) => updateFilter("itemName", value)}
                style={{ width: "100%" }}
                filterOption={(input, option) =>
                  (option?.label as string)
                    .toLowerCase()
                    .indexOf(input.toLowerCase()) >= 0
                }
                options={itemNames.map((name) => ({
                  value: name,
                  label: name,
                }))}
              />
            </div>
          </Col>

          {/* Price Range */}
          <Col span={12}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Price Range
              </div>
              <Space style={{ width: "100%" }}>
                <InputNumber
                  style={{ width: "100%" }}
                  placeholder="Min Price"
                  value={localFilters.priceRange?.[0] || undefined}
                  onChange={(value) => {
                    const newRange = [...(localFilters.priceRange || [null, null])];
                    newRange[0] = value;
                    updateFilter("priceRange", newRange);
                  }}
                  min={0}
                />
                <span>-</span>
                <InputNumber
                  style={{ width: "100%" }}
                  placeholder="Max Price"
                  value={localFilters.priceRange?.[1] || undefined}
                  onChange={(value) => {
                    const newRange = [...(localFilters.priceRange || [null, null])];
                    newRange[1] = value;
                    updateFilter("priceRange", newRange);
                  }}
                  min={0}
                />
              </Space>
            </div>
          </Col>
        </Row>

        <Row gutter={16}>
          {/* Availability */}
          <Col span={12}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Availability
              </div>
              <Select
                allowClear
                placeholder="Select Availability"
                value={localFilters.availability || undefined}
                onChange={(value) => updateFilter("availability", value)}
                style={{ width: "100%" }}
                options={[
                  { value: "true", label: "Available" },
                  { value: "false", label: "Out of Stock" },
                ]}
              />
            </div>
          </Col>

          {/* Status */}
          <Col span={12}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Status
              </div>
              <Select
                allowClear
                placeholder="Select Status"
                value={localFilters.status || undefined}
                onChange={(value) => updateFilter("status", value)}
                style={{ width: "100%" }}
                options={[
                  { value: "Active", label: "Active" },
                  { value: "Inactive", label: "Inactive" },
                ]}
              />
            </div>
          </Col>
        </Row>

        {/* Date Ranges Section */}
        <Divider orientation="left">Date Ranges</Divider>
        <Row gutter={16}>
          {/* Created Date Range */}
          <Col span={12}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Created Date Range
              </div>
              <RangePicker
                value={localFilters.createdDateRange as [dayjs.Dayjs, dayjs.Dayjs]}
                onChange={(dates) => updateFilter("createdDateRange", dates)}
                style={{ width: "100%" }}
                placeholder={["Start Date", "End Date"]}
                presets={[
                  { label: 'Today', value: [dayjs(), dayjs()] },
                  { label: 'Last 7 Days', value: [dayjs().subtract(6, 'days'), dayjs()] },
                  { label: 'Last 30 Days', value: [dayjs().subtract(29, 'days'), dayjs()] },
                  { label: 'This Month', value: [dayjs().startOf('month'), dayjs().endOf('month')] },
                  { label: 'Last Month', value: [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')] },
                  { label: 'This Year', value: [dayjs().startOf('year'), dayjs().endOf('year')] },
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
                value={localFilters.updatedDateRange as [dayjs.Dayjs, dayjs.Dayjs]}
                onChange={(dates) => updateFilter("updatedDateRange", dates)}
                style={{ width: "100%" }}
                placeholder={["Start Date", "End Date"]}
                presets={[
                  { label: 'Today', value: [dayjs(), dayjs()] },
                  { label: 'Last 7 Days', value: [dayjs().subtract(6, 'days'), dayjs()] },
                  { label: 'Last 30 Days', value: [dayjs().subtract(29, 'days'), dayjs()] },
                  { label: 'This Month', value: [dayjs().startOf('month'), dayjs().endOf('month')] },
                  { label: 'Last Month', value: [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')] },
                  { label: 'This Year', value: [dayjs().startOf('year'), dayjs().endOf('year')] },
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
                  { value: "UnitPrice", label: "Price" },
                  { value: "ItemName", label: "Item Name" },
                ]}
              />
            </div>
          </Col>
        </Row>
      </Space>
    </Modal>
  );
};

export default CanteenItemFilterModal;
