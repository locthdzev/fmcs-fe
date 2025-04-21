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
  Input,
} from "antd";
import {
  UndoOutlined,
  CheckCircleOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title } = Typography;
const { RangePicker } = DatePicker;

interface FilterModalProps {
  visible: boolean;
  filterState: {
    healthInsuranceNumber: string;
    ownerSearch: string;
    performedBySearch: string;
    updateDateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null];
    ascending: boolean;
    sortBy: string;
  };
  setFilterState: React.Dispatch<
    React.SetStateAction<{
      healthInsuranceNumber: string;
      ownerSearch: string;
      performedBySearch: string;
      updateDateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null];
      ascending: boolean;
      sortBy: string;
    }>
  >;
  uniqueInsuranceNumbers: string[];
  uniqueOwners: { id: string; fullName: string; email: string }[];
  uniquePerformers: { id: string; fullName: string; email: string }[];
  onClose: () => void;
  onApply: () => void;
  onReset: () => void;
}

const InsuranceHistoryFilterModal: React.FC<FilterModalProps> = ({
  visible,
  filterState,
  setFilterState,
  uniqueInsuranceNumbers,
  uniqueOwners,
  uniquePerformers,
  onClose,
  onApply,
  onReset,
}) => {
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
      width={700}
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
              value={filterState.updateDateRange}
              onChange={(dates) =>
                setFilterState((prev) => ({
                  ...prev,
                  updateDateRange: dates as [
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
                "All Time": [
                  dayjs("2020-01-01"),
                  dayjs("2030-12-31"),
                ],
              }}
            />
          </div>

          {/* Sort Direction */}
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

export default InsuranceHistoryFilterModal; 