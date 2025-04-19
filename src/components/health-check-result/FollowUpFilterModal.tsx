import React from "react";
import {
  Modal,
  Button,
  Space,
  Typography,
  Select,
  DatePicker,
  Divider,
  Row,
  Col,
} from "antd";
import { UndoOutlined, CheckCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;
const { Option } = Select;

interface FollowUpFilterModalProps {
  visible: boolean;
  onCancel: () => void;
  onApply: (filters: any) => void;
  onReset: () => void;
  filters: {
    followUpStatus: string | undefined;
    checkupDateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null];
    followUpDateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null];
    sortBy: string;
    ascending: boolean;
  };
}

const FollowUpFilterModal: React.FC<FollowUpFilterModalProps> = ({
  visible,
  onCancel,
  onApply,
  onReset,
  filters,
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
    // Always set ascending to false (descending order)
    const updatedFilters = {
      ...localFilters,
      ascending: false,
    };
    onApply(updatedFilters);
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
        <Divider orientation="left">Date Ranges</Divider>
        <Row gutter={16}>
          {/* Checkup Date Range */}
          <Col span={12}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Checkup Date Range
              </div>
              <RangePicker
                style={{ width: "100%" }}
                placeholder={["From checkup date", "To checkup date"]}
                format="DD/MM/YYYY"
                allowClear
                value={localFilters.checkupDateRange}
                onChange={(dates) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    checkupDateRange: dates as [
                      dayjs.Dayjs | null,
                      dayjs.Dayjs | null
                    ],
                  }))
                }
                ranges={{
                  Today: [dayjs(), dayjs()],
                  "Last 7 Days": [dayjs().subtract(6, "day"), dayjs()],
                  "Last 30 Days": [dayjs().subtract(29, "day"), dayjs()],
                  "This Month": [
                    dayjs().startOf("month"),
                    dayjs().endOf("month"),
                  ],
                  "Last Month": [
                    dayjs().subtract(1, "month").startOf("month"),
                    dayjs().subtract(1, "month").endOf("month"),
                  ],
                }}
              />
            </div>
          </Col>

          {/* Follow-up Date Range */}
          <Col span={12}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Follow-up Date Range
              </div>
              <RangePicker
                style={{ width: "100%" }}
                placeholder={["From follow-up date", "To follow-up date"]}
                format="DD/MM/YYYY"
                allowClear
                value={localFilters.followUpDateRange}
                onChange={(dates) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    followUpDateRange: dates as [
                      dayjs.Dayjs | null,
                      dayjs.Dayjs | null
                    ],
                  }))
                }
                ranges={{
                  Today: [dayjs(), dayjs()],
                  "Last 7 Days": [dayjs().subtract(6, "day"), dayjs()],
                  "Last 30 Days": [dayjs().subtract(29, "day"), dayjs()],
                  "This Month": [
                    dayjs().startOf("month"),
                    dayjs().endOf("month"),
                  ],
                  "Last Month": [
                    dayjs().subtract(1, "month").startOf("month"),
                    dayjs().subtract(1, "month").endOf("month"),
                  ],
                }}
              />
            </div>
          </Col>
        </Row>

        <Divider orientation="left">Sorting</Divider>
        <Row gutter={16}>
          {/* Sort By */}
          <Col span={24}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Sort By
              </div>
              <Select
                placeholder="Sort by"
                value={localFilters.sortBy}
                onChange={(value) => updateFilter("sortBy", value)}
                style={{ width: "100%" }}
              >
                <Option value="CheckupDate">Checkup Date</Option>
                <Option value="FollowUpDate">Follow-up Date</Option>
                <Option value="CreatedAt">Created Date</Option>
              </Select>
            </div>
          </Col>
        </Row>
      </Space>
    </Modal>
  );
};

export default FollowUpFilterModal;
