import React, { useState, useEffect } from "react";
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
  Spin,
  Select,
  InputNumber,
  Tooltip,
  message,
} from "antd";
import {
  UndoOutlined,
  CheckCircleOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import type { RangePickerProps } from 'antd/es/date-picker';
import { getDrugOrders, DrugOrderResponse } from "@/api/drugorder";

const { RangePicker } = DatePicker;
const { Title } = Typography;
const { Option } = Select;

// Define the structure for the filters state
export interface DrugOrderAdvancedFilters {
  orderDateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null];
  createdDateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null];
  updatedDateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null];
  minTotalPrice?: number;
  maxTotalPrice?: number;
  status?: string;
  supplierId?: string;
  sortBy: string;
  ascending: boolean;
}

interface DrugOrderFilterModalProps {
  visible: boolean;
  onCancel: () => void;
  onApply: (filters: DrugOrderAdvancedFilters) => void;
  onReset: () => void;
  initialFilters: DrugOrderAdvancedFilters;
  supplierOptions: { id: string; supplierName: string }[];
}

// Status options for filter
const statusOptions = [
  { label: "All", value: "" },
  { label: "Pending", value: "Pending" },
  { label: "Approved", value: "Approved" },
  { label: "Rejected", value: "Rejected" },
  { label: "Completed", value: "Completed" },
];

// Sort by options
const sortByOptions = [
  { label: "Created Date", value: "CreatedAt" },
  { label: "Order Date", value: "OrderDate" },
  { label: "Total Price", value: "TotalPrice" },
  { label: "Total Quantity", value: "TotalQuantity" },
];

// Define date presets with correct type
const datePresets: RangePickerProps['presets'] = [
  { label: "Today", value: [dayjs().startOf('day'), dayjs().endOf('day')] },
  { label: "Last 7 Days", value: [dayjs().subtract(6, 'day').startOf('day'), dayjs().endOf('day')] },
  { label: "Last 30 Days", value: [dayjs().subtract(29, 'day').startOf('day'), dayjs().endOf('day')] },
  { label: "This Month", value: [dayjs().startOf('month'), dayjs().endOf('month')] },
  { label: "Last Month", value: [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')] },
  { label: "This Year", value: [dayjs().startOf('year'), dayjs().endOf('year')] },
];

// Fallback price options in case we can't fetch from API
const DEFAULT_MIN_PRICE_OPTIONS = [
  { value: 100000, label: "100,000 VND" },
  { value: 500000, label: "500,000 VND" },
  { value: 1000000, label: "1,000,000 VND" },
  { value: 2000000, label: "2,000,000 VND" },
  { value: 5000000, label: "5,000,000 VND" },
];

const DEFAULT_MAX_PRICE_OPTIONS = [
  { value: 5000000, label: "5,000,000 VND" },
  { value: 10000000, label: "10,000,000 VND" },
  { value: 20000000, label: "20,000,000 VND" },
  { value: 50000000, label: "50,000,000 VND" },
  { value: 100000000, label: "100,000,000 VND" },
];

const DrugOrderFilterModal: React.FC<DrugOrderFilterModalProps> = ({
  visible,
  onCancel,
  onApply,
  onReset,
  initialFilters,
  supplierOptions,
}) => {
  const [localFilters, setLocalFilters] = useState<DrugOrderAdvancedFilters>(initialFilters);
  const [loading, setLoading] = useState(false);
  const [fetchingPriceRanges, setFetchingPriceRanges] = useState(false);
  const [priceStats, setPriceStats] = useState({ min: 0, avg: 500000, max: 1000000 });
  const [minPriceOptions, setMinPriceOptions] = useState(DEFAULT_MIN_PRICE_OPTIONS);
  const [maxPriceOptions, setMaxPriceOptions] = useState(DEFAULT_MAX_PRICE_OPTIONS);
  const [messageApi, contextHolder] = message.useMessage();
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null); // Timestamp of last fetch

  // Reset localFilters when modal is opened or initialFilters change
  useEffect(() => {
    if (visible) {
      setLocalFilters(initialFilters);
      // If we haven't fetched price ranges yet or it's been more than 1 hour, fetch them
      if (!lastFetchTime || Date.now() - lastFetchTime > 60 * 60 * 1000) {
        fetchPriceStats();
      }
    }
  }, [visible, initialFilters]);

  // Fetch price statistics from the API
  const fetchPriceStats = async () => {
    setFetchingPriceRanges(true);
    try {
      // Get a large sample of orders to calculate price statistics
      const response = await getDrugOrders({
        page: 1,
        pageSize: 1000, // Large enough to get a good sample
        sortBy: "TotalPrice",
        ascending: true, // Get from lowest to highest
      });

      if (response.isSuccess && response.data.length > 0) {
        // Extract prices and calculate min, max, avg
        const prices = response.data.map((order: DrugOrderResponse) => order.totalPrice);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const total = prices.reduce((sum, price) => sum + price, 0);
        const avg = total / prices.length;

        setPriceStats({ min, avg, max });
        
        // Generate price options based on the statistics
        generatePriceOptions(min, avg, max);
        setLastFetchTime(Date.now());
      }
    } catch (error) {
      console.error("Error fetching price statistics:", error);
      messageApi.error("Could not fetch price statistics. Using default values.");
    } finally {
      setFetchingPriceRanges(false);
    }
  };

  // Generate price options based on min, average, and max prices
  const generatePriceOptions = (min: number, avg: number, max: number) => {
    // For Min Price Options (from min to avg)
    const minOptions = [];
    const minStep = Math.max((avg - min) / 4, 100000); // Create 5 steps, ensure at least 100,000 step
    
    for (let i = 0; i <= 4; i++) {
      const value = Math.round((min + minStep * i) / 10000) * 10000; // Round to nearest 10,000
      minOptions.push({
        value,
        label: formatPrice(value)
      });
    }
    
    // For Max Price Options (from avg to max)
    const maxOptions = [];
    const maxStep = Math.max((max - avg) / 4, 100000); // Create 5 steps
    
    for (let i = 0; i <= 4; i++) {
      const value = Math.round((avg + maxStep * i) / 10000) * 10000; // Round to nearest 10,000
      maxOptions.push({
        value,
        label: formatPrice(value)
      });
    }
    
    setMinPriceOptions(minOptions);
    setMaxPriceOptions(maxOptions);
  };

  // Format price to VND
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + ' VND';
  };

  const handleApply = () => {
    // Show loading indicator when applying filters
    setLoading(true);
    
    // Simulate a delay to show the loading state (remove this in production)
    setTimeout(() => {
      // Pass the local state directly
      onApply(localFilters);
      setLoading(false);
    }, 500);
  };

  const handleReset = () => {
    setLoading(true);
    setTimeout(() => {
      onReset(); // Call the parent's reset logic
      setLoading(false);
    }, 300);
  };

  // Common styles
  const filterItemStyle = { marginBottom: "16px" };
  const filterLabelStyle = { marginBottom: "8px", color: "#666666" };

  return (
    <Modal
      title="Advanced Filters"
      open={visible}
      onCancel={onCancel}
      width={800} // Increased width for more filters
      footer={[
        <Button key="reset" onClick={handleReset} icon={<UndoOutlined />} disabled={loading}>
          Reset 
        </Button>,
        <Button
          key="apply"
          type="primary"
          onClick={handleApply}
          icon={<CheckCircleOutlined />}
          loading={loading}
        >
          Apply Filters
        </Button>,
      ]}
    >
      {contextHolder}
      <Spin spinning={loading} tip="Processing filters...">
        <Space direction="vertical" style={{ width: "100%" }}>
          <Divider orientation="left">General Filters</Divider>
          <Row gutter={16}>
            {/* Status Filter */}
            <Col span={12}>
              <div className="filter-item" style={filterItemStyle}>
                <div className="filter-label" style={filterLabelStyle}>
                  Status
                </div>
                <Select
                  style={{ width: "100%" }}
                  placeholder="Select Status"
                  value={localFilters.status}
                  onChange={(value) =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      status: value,
                    }))
                  }
                  allowClear
                >
                  {statusOptions.map((option) => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </div>
            </Col>

            {/* Supplier Filter */}
            <Col span={12}>
              <div className="filter-item" style={filterItemStyle}>
                <div className="filter-label" style={filterLabelStyle}>
                  Supplier
                </div>
                <Select
                  style={{ width: "100%" }}
                  placeholder="Select Supplier"
                  value={localFilters.supplierId}
                  onChange={(value) =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      supplierId: value,
                    }))
                  }
                  allowClear
                  showSearch
                  optionFilterProp="children"
                >
                  {supplierOptions.map((supplier) => (
                    <Option key={supplier.id} value={supplier.id}>
                      {supplier.supplierName}
                    </Option>
                  ))}
                </Select>
              </div>
            </Col>
          </Row>

          <Row gutter={16}>
            {/* Price Range with Refresh Button */}
            <Col span={24}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div className="filter-label" style={{ color: "#666666", fontWeight: 'bold' }}>
                  Price Range
                </div>
                <Tooltip title="Refresh price suggestions based on current orders">
                  <Button 
                    type="text" 
                    icon={<ReloadOutlined />} 
                    onClick={fetchPriceStats}
                    loading={fetchingPriceRanges}
                    size="small"
                  >
                    Refresh
                  </Button>
                </Tooltip>
              </div>
            </Col>
            
            {/* Min Price Range */}
            <Col span={12}>
              <div className="filter-item" style={filterItemStyle}>
                <div className="filter-label" style={filterLabelStyle}>
                  Min Total Price (VND)
                </div>
                <Select
                  style={{ width: "100%" }}
                  placeholder="Select Min Price"
                  value={localFilters.minTotalPrice}
                  onChange={(value) =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      minTotalPrice: value,
                    }))
                  }
                  allowClear
                  loading={fetchingPriceRanges}
                  dropdownRender={(menu) => (
                    <>
                      <div style={{ padding: '8px', color: '#1890ff' }}>
                        Suggestions from min to average price
                      </div>
                      {menu}
                    </>
                  )}
                >
                  {minPriceOptions.map((option) => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </div>
            </Col>

            {/* Max Price Range */}
            <Col span={12}>
              <div className="filter-item" style={filterItemStyle}>
                <div className="filter-label" style={filterLabelStyle}>
                  Max Total Price (VND)
                </div>
                <Select
                  style={{ width: "100%" }}
                  placeholder="Select Max Price"
                  value={localFilters.maxTotalPrice}
                  onChange={(value) =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      maxTotalPrice: value,
                    }))
                  }
                  allowClear
                  loading={fetchingPriceRanges}
                  dropdownRender={(menu) => (
                    <>
                      <div style={{ padding: '8px', color: '#1890ff' }}>
                        Suggestions from average to max price
                      </div>
                      {menu}
                    </>
                  )}
                >
                  {maxPriceOptions.map((option) => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </div>
            </Col>
            
            {/* Price Stats Display */}
            {!fetchingPriceRanges && (
              <Col span={24}>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '-8px', marginBottom: '8px' }}>
                  Price statistics: Min: {formatPrice(priceStats.min)} | Avg: {formatPrice(priceStats.avg)} | Max: {formatPrice(priceStats.max)}
                </div>
              </Col>
            )}
          </Row>

          <Divider orientation="left">Date Filters</Divider>
          <Row gutter={16}>
            {/* Order Date Range */}
            <Col span={8}>
              <div className="filter-item" style={filterItemStyle}>
                <div className="filter-label" style={filterLabelStyle}>
                  Order Date Range
                </div>
                <RangePicker
                  style={{ width: "100%" }}
                  placeholder={["From date", "To date"]}
                  format="DD/MM/YYYY"
                  allowClear
                  value={localFilters.orderDateRange}
                  onChange={(dates) =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      orderDateRange: dates as [dayjs.Dayjs | null, dayjs.Dayjs | null] || [null, null],
                    }))
                  }
                  presets={datePresets}
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
                  style={{ width: "100%" }}
                  placeholder={["From date", "To date"]}
                  format="DD/MM/YYYY"
                  allowClear
                  value={localFilters.createdDateRange}
                  onChange={(dates) =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      createdDateRange: dates as [dayjs.Dayjs | null, dayjs.Dayjs | null] || [null, null],
                    }))
                  }
                  presets={datePresets}
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
                  style={{ width: "100%" }}
                  placeholder={["From date", "To date"]}
                  format="DD/MM/YYYY"
                  allowClear
                  value={localFilters.updatedDateRange}
                  onChange={(dates) =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      updatedDateRange: dates as [dayjs.Dayjs | null, dayjs.Dayjs | null] || [null, null],
                    }))
                  }
                  presets={datePresets}
                />
              </div>
            </Col>
          </Row>

          <Divider orientation="left">Sorting</Divider>
          <Row gutter={16}>
            {/* Sort By Field */}
            <Col span={12}>
              <div className="filter-item" style={filterItemStyle}>
                <div className="filter-label" style={filterLabelStyle}>
                  Sort By
                </div>
                <Select
                  style={{ width: "100%" }}
                  value={localFilters.sortBy}
                  onChange={(value) =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      sortBy: value,
                    }))
                  }
                >
                  {sortByOptions.map((option) => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
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
                    setLocalFilters(prev => ({...prev, ascending: e.target.value === "asc"}))
                  }
                  optionType="button"
                  buttonStyle="solid"
                  style={{ width: "100%" }}
                >
                  <Radio.Button
                    value="asc"
                    style={{ width: "50%", textAlign: "center" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                      <SortAscendingOutlined />
                      <span>Ascending</span>
                    </div>
                  </Radio.Button>
                  <Radio.Button
                    value="desc"
                    style={{ width: "50%", textAlign: "center" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                      <SortDescendingOutlined />
                      <span>Descending</span>
                    </div>
                  </Radio.Button>
                </Radio.Group>
              </div>
            </Col>
          </Row>
        </Space>
      </Spin>
    </Modal>
  );
};

export default DrugOrderFilterModal;
