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
} from "antd";
import {
  UndoOutlined,
  CheckCircleOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface InventoryHistoryFilterModalProps {
  visible: boolean;
  initialValues: {
    userSearch: string;
    batchCodeSearch: string;
    drugNameSearch: string;
    changeDateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null];
    ascending: boolean;
  };
  onCancel: () => void;
  onApply: (values: any) => void;
  uniqueBatchCodes: string[];
  uniqueDrugNames: string[];
  uniqueUsers: { id: string; name: string; email: string }[];
}

const InventoryHistoryFilterModal: React.FC<
  InventoryHistoryFilterModalProps
> = ({
  visible,
  initialValues,
  onCancel,
  onApply,
  uniqueBatchCodes,
  uniqueDrugNames,
  uniqueUsers,
}) => {
  // Create a local state to track changes while modal is open
  const [filterState, setFilterState] = React.useState({
    userSearch: initialValues.userSearch || "",
    batchCodeSearch: initialValues.batchCodeSearch || "",
    drugNameSearch: initialValues.drugNameSearch || "",
    changeDateRange: initialValues.changeDateRange || [null, null],
    ascending: initialValues.ascending,
  });

  // Update local state when initialValues change
  React.useEffect(() => {
    if (visible) {
      setFilterState({
        userSearch: initialValues.userSearch || "",
        batchCodeSearch: initialValues.batchCodeSearch || "",
        drugNameSearch: initialValues.drugNameSearch || "",
        changeDateRange: initialValues.changeDateRange || [null, null],
        ascending: initialValues.ascending,
      });
    }
  }, [visible, initialValues]);

  // Handle apply filters
  const handleApply = () => {
    onApply(filterState);
  };

  // Handle reset filters
  const handleReset = () => {
    setFilterState({
      userSearch: "",
      batchCodeSearch: "",
      drugNameSearch: "",
      changeDateRange: [null, null],
      ascending: false,
    });
  };

  return (
    <Modal
      title="Advanced Filters"
      open={visible}
      onCancel={onCancel}
      width={600}
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
        {/* Search Criteria */}
        <Divider orientation="left">Search Criteria</Divider>
        <div>
          <div className="filter-item" style={{ marginBottom: "16px" }}>
            <div
              className="filter-label"
              style={{ marginBottom: "8px", color: "#666666" }}
            >
              Drug Name/Code
            </div>
            <Select
              showSearch
              placeholder="Select Drug"
              value={filterState.drugNameSearch || undefined}
              onChange={(value) =>
                setFilterState((prev) => ({
                  ...prev,
                  drugNameSearch: value || "",
                }))
              }
              style={{ width: "100%" }}
              allowClear
              filterOption={(input, option) =>
                (option?.label?.toString().toLowerCase() || "").includes(
                  input.toLowerCase()
                )
              }
              options={uniqueDrugNames.map((name) => ({
                value: name,
                label: name,
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
              placeholder="Select User"
              value={filterState.userSearch || undefined}
              onChange={(value) =>
                setFilterState((prev) => ({
                  ...prev,
                  userSearch: value || "",
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
              options={uniqueUsers.map((user) => ({
                value: user.name,
                label: `${user.name} ${user.email ? `(${user.email})` : ""}`,
                email: user.email,
              }))}
            />
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
              Change date range
            </div>
            <RangePicker
              style={{ width: "100%" }}
              placeholder={["From date", "To date"]}
              value={filterState.changeDateRange}
              onChange={(dates) =>
                setFilterState((prev) => ({
                  ...prev,
                  changeDateRange: dates as [
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

export default InventoryHistoryFilterModal;
