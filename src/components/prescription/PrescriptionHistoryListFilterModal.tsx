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
  Tooltip,
} from "antd";
import {
  UndoOutlined,
  CheckCircleOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
  TagOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title } = Typography;
const { RangePicker } = DatePicker;

interface FilterModalProps {
  visible: boolean;
  filterState: {
    healthCheckResultCode: string;
    performedBySearch: string;
    actionDateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null];
    actionType: string;
    statusChange: string;
    ascending: boolean;
  };
  setFilterState: React.Dispatch<
    React.SetStateAction<{
      healthCheckResultCode: string;
      performedBySearch: string;
      actionDateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null];
      actionType: string;
      statusChange: string;
      ascending: boolean;
    }>
  >;
  uniqueHealthCheckCodes: string[];
  uniquePerformers: { id: string; fullName: string; email: string }[];
  onClose: () => void;
  onApply: () => void;
  onReset: () => void;
}

const ACTION_TYPES = [
  { value: "Created", label: "Created" },
  { value: "Updated", label: "Updated" },
  { value: "Cancelled", label: "Cancelled" },
  { value: "Auto-Used", label: "Auto-Used" },
  { value: "SoftDeleted", label: "Soft Deleted" },
  { value: "Restored", label: "Restored" },
];

const STATUS_CHANGES = [
  { value: "Dispensed", label: "Dispensed (Initial prescription)" },
  { value: "Updated", label: "Updated (Modified prescription)" },
  { value: "Used", label: "Used (Completed prescription)" },
  { value: "UpdatedAndUsed", label: "UpdatedAndUsed (Modified and completed)" },
  { value: "Inactive", label: "Inactive (Deactivated)" },
  { value: "Cancelled", label: "Cancelled (Stopped)" },
  { value: "SoftDeleted", label: "SoftDeleted (Removed)" },
  { value: "null", label: "No Previous Status (Initial state)" },
];

const PrescriptionHistoryListFilterModal: React.FC<FilterModalProps> = ({
  visible,
  filterState,
  setFilterState,
  uniqueHealthCheckCodes,
  uniquePerformers,
  onClose,
  onApply,
  onReset,
}) => {
  console.log("Filter state in modal:", filterState);
  
  return (
    <Modal
      title={
        <Title level={4} style={{ margin: 0 }}>
          Advanced Filters
        </Title>
      }
      open={visible}
      onOk={onApply}
      onCancel={onClose}
      width={600}
      footer={[
        <Button key="reset" onClick={onReset} icon={<UndoOutlined />}>
          Reset
        </Button>,
        <Button
          key="apply"
          type="primary"
          onClick={onApply}
          icon={<CheckCircleOutlined />}
        >
          Apply
        </Button>,
      ]}
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        {/* Search Criteria */}
        <Divider orientation="left">Filter Option</Divider>
        <div>
          <div className="filter-item" style={{ marginBottom: "16px" }}>
            <div
              className="filter-label"
              style={{ marginBottom: "8px", color: "#666666" }}
            >
              Health check code
            </div>
            <Select
              showSearch
              placeholder="Select Health Check Code"
              value={filterState.healthCheckResultCode || undefined}
              onChange={(value) =>
                setFilterState((prev) => ({
                  ...prev,
                  healthCheckResultCode: value || "",
                }))
              }
              style={{ width: "100%" }}
              allowClear
              filterOption={(input, option) =>
                (option?.label?.toString().toLowerCase() || "").includes(
                  input.toLowerCase()
                )
              }
              options={uniqueHealthCheckCodes.map((code) => ({
                value: code,
                label: code,
              }))}
            />
          </div>

          <div className="filter-item" style={{ marginBottom: "16px" }}>
            <div
              className="filter-label"
              style={{ marginBottom: "8px", color: "#666666" }}
            >
              Performed by
            </div>
            <Select
              showSearch
              placeholder="Select Performed By"
              value={filterState.performedBySearch || undefined}
              onChange={(value) =>
                setFilterState((prev) => ({
                  ...prev,
                  performedBySearch: value || "",
                }))
              }
              style={{ width: "100%" }}
              allowClear
              filterOption={(input, option) =>
                (option?.label?.toString().toLowerCase() || "").includes(
                  input.toLowerCase()
                )
              }
              optionLabelProp="label"
              options={uniquePerformers.map((performer) => ({
                value: performer.fullName,
                label: `${performer.fullName} (${performer.email})`,
                email: performer.email,
              }))}
            />
          </div>

          <div className="filter-item" style={{ marginBottom: "16px" }}>
            <div
              className="filter-label"
              style={{ marginBottom: "8px", color: "#666666" }}
            >
              Action type
            </div>
            <Select
              placeholder="Select Action Type"
              value={filterState.actionType || undefined}
              onChange={(value) =>
                setFilterState((prev) => ({
                  ...prev,
                  actionType: value || "",
                }))
              }
              style={{ width: "100%" }}
              allowClear
              options={ACTION_TYPES}
            />
          </div>

          <div className="filter-item">
            <div
              className="filter-label"
              style={{ marginBottom: "8px", color: "#666666" }}
            >
              Status change
              <Tooltip title="Filter prescription history records by status. The filter will search in both Previous Status and New Status fields. For newly created records, use 'No Previous Status'.">
                <InfoCircleOutlined style={{ marginLeft: "5px", color: "#1890ff" }} />
              </Tooltip>
            </div>
            <Select
              placeholder="Select Status Change"
              value={filterState.statusChange || undefined}
              onChange={(value) => {
                console.log("Status Change value selected:", value);
                console.log("Status Change type:", typeof value, "isNull:", value === null, "isUndefined:", value === undefined);
                
                let statusChangeValue = value;
                if (value === null || value === undefined) {
                  statusChangeValue = "";
                }
                
                setFilterState((prev) => {
                  const newState = {
                    ...prev,
                    statusChange: statusChangeValue,
                  };
                  console.log("New filter state after status change:", newState);
                  return newState;
                });
              }}
              style={{ width: "100%" }}
              allowClear
              options={STATUS_CHANGES}
            />
            <div style={{ marginTop: "8px", fontSize: "12px", color: "#999" }}>
              <b>Note:</b> 
              <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
                <li><b>Created</b> actions typically have <b>Dispensed</b> as the new status</li>
                <li><b>Auto-Used</b> actions typically have <b>Used</b> as the new status</li>
                <li><b>Updated</b> actions typically have <b>Updated</b> or <b>UpdatedAndUsed</b> as the new status</li>
                <li><b>Cancelled</b> actions typically have <b>Cancelled</b> as the new status</li>
                <li>Most records have <b>null</b> as the <b>previousStatus</b> if it's the initial state</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Date & Sorting */}
        <Divider orientation="left">Date & Sorting</Divider>
        <div>
          <div className="filter-item" style={{ marginBottom: "16px" }}>
            <div
              className="filter-label"
              style={{ marginBottom: "8px", color: "#666666" }}
            >
              Action date range
            </div>
            <RangePicker
              style={{ width: "100%" }}
              placeholder={["From date", "To date"]}
              value={filterState.actionDateRange}
              onChange={(dates) =>
                setFilterState((prev) => ({
                  ...prev,
                  actionDateRange: dates as [
                    dayjs.Dayjs | null,
                    dayjs.Dayjs | null
                  ],
                }))
              }
              format="DD/MM/YYYY"
              allowClear
              ranges={{
                "Last 7 Days": [dayjs().subtract(6, "days"), dayjs()],
                "Last 30 Days": [dayjs().subtract(29, "days"), dayjs()],
                "This Month": [
                  dayjs().startOf("month"),
                  dayjs().endOf("month"),
                ],
                "All Time (includes 2025)": [
                  dayjs("2020-01-01"),
                  dayjs("2030-12-31"),
                ],
              }}
            />
          </div>

          <div className="filter-item">
            <div
              className="filter-label"
              style={{
                marginBottom: "8px",
                color: "#666666",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <SortAscendingOutlined />
              <span>Sort direction</span>
            </div>
            <Radio.Group
              value={filterState.ascending ? "asc" : "desc"}
              onChange={(e) =>
                setFilterState((prev) => ({
                  ...prev,
                  ascending: e.target.value === "asc",
                }))
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
        </div>
      </Space>
    </Modal>
  );
};

export default PrescriptionHistoryListFilterModal;
