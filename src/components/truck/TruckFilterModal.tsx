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
} from "antd";
import {
  UndoOutlined,
  CheckCircleOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import type { RangePickerProps } from 'antd/es/date-picker';

const { RangePicker } = DatePicker;
const { Title } = Typography;

// Define the structure for the filters state
export interface TruckAdvancedFilters {
  createdDateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null];
  updatedDateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null];
  ascending: boolean; // Sort direction for CreatedAt
}

interface TruckFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: TruckAdvancedFilters) => void;
  onReset: () => void;
  initialFilters?: TruckAdvancedFilters;
}

// Define date presets with correct type
const datePresets: RangePickerProps['presets'] = [
    { label: "Today", value: [dayjs().startOf('day'), dayjs().endOf('day')] },
    { label: "Last 7 Days", value: [dayjs().subtract(6, 'day').startOf('day'), dayjs().endOf('day')] },
    { label: "Last 30 Days", value: [dayjs().subtract(29, 'day').startOf('day'), dayjs().endOf('day')] },
    { label: "This Month", value: [dayjs().startOf('month'), dayjs().endOf('month')] },
    { label: "Last Month", value: [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')] },
    { label: "This Year", value: [dayjs().startOf('year'), dayjs().endOf('year')] },
];

const TruckFilterModal: React.FC<TruckFilterModalProps> = ({
  isOpen,
  onClose,
  onApply,
  onReset,
  initialFilters = {
    createdDateRange: [null, null],
    updatedDateRange: [null, null],
    ascending: false, // Default sort: Newest first (descending)
  },
}) => {
  const [localFilters, setLocalFilters] = useState<TruckAdvancedFilters>(initialFilters);
  const [loading, setLoading] = useState(false);

  // Reset localFilters when modal is opened or initialFilters change
  useEffect(() => {
    if (isOpen) {
      setLocalFilters(initialFilters);
    }
  }, [isOpen, initialFilters]);

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
      open={isOpen}
      onCancel={onClose}
      width={600} // Adjusted width
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
      <Spin spinning={loading} tip="Processing filters...">
        <Space direction="vertical" style={{ width: "100%" }}>
          <Divider orientation="left">Date Filters</Divider>
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
                      createdDateRange: dates as [dayjs.Dayjs | null, dayjs.Dayjs | null] || [null, null],
                    }))
                  }
                  presets={datePresets}
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
             {/* Sort Direction */}
             <Col span={24}> {/* Full width for sorting */}
              <div className="filter-item">
                <div className="filter-label" style={filterLabelStyle}>
                  Sort by Created Date
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
                      <span>Oldest First</span>
                    </div>
                  </Radio.Button>
                  <Radio.Button
                    value="desc"
                    style={{ width: "50%", textAlign: "center" }}
                  >
                     <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                      <SortDescendingOutlined />
                      <span>Newest First</span>
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

export default TruckFilterModal;
