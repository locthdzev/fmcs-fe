import React from "react";
import { Modal, Button, Space, Typography, Select, DatePicker, Radio } from "antd";
import { UndoOutlined, CheckCircleOutlined, SortAscendingOutlined, SortDescendingOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Title } = Typography;
const { RangePicker } = DatePicker;

interface FilterModalProps {
  visible: boolean;
  filterState: {
    healthCheckResultCode: string;
    performedBySearch: string;
    actionDateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null];
    ascending: boolean;
  };
  setFilterState: React.Dispatch<React.SetStateAction<{
    healthCheckResultCode: string;
    performedBySearch: string;
    actionDateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null];
    ascending: boolean;
  }>>;
  uniqueHealthCheckCodes: string[];
  uniquePerformers: { id: string; fullName: string; email: string }[];
  onClose: () => void;
  onApply: () => void;
  onReset: () => void;
}

const TreatmentPlanHistoryFilterModal: React.FC<FilterModalProps> = ({
  visible,
  filterState,
  setFilterState,
  uniqueHealthCheckCodes,
  uniquePerformers,
  onClose,
  onApply,
  onReset,
}) => {
  return (
    <Modal
      title="Advanced Filters"
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
        <div>
          <Title level={5}>Search Criteria</Title>
          <div style={{ marginBottom: "16px" }}>
            <div className="filter-item" style={{ marginBottom: "16px" }}>
              <div
                className="filter-label"
                style={{ marginBottom: "8px", color: "#666666" }}
              >
                Health check code
              </div>
              <Select
                showSearch
                placeholder="Select or search Health Check Code"
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

            <div className="filter-item">
              <div
                className="filter-label"
                style={{ marginBottom: "8px", color: "#666666" }}
              >
                Performed by
              </div>
              <Select
                showSearch
                placeholder="Select or search staff member"
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
          </div>
        </div>

        <div>
          <Title level={5}>Date & Sorting</Title>
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
        </div>
      </Space>
    </Modal>
  );
};

export default TreatmentPlanHistoryFilterModal; 