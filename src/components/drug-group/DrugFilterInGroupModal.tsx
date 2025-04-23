import React, { useEffect, useState } from "react";
import {
  Modal,
  Button,
  Space,
  Typography,
  Select,
  Divider,
  Row,
  Col,
  Input,
} from "antd";
import { UndoOutlined, CheckCircleOutlined } from "@ant-design/icons";

const { Title } = Typography;
const { Option } = Select;

export interface DrugFilterInGroupModalProps {
  visible: boolean;
  onCancel: () => void;
  onApply: (filters: any) => void;
  onReset: () => void;
  filters: {
    name?: string;
    manufacturer?: string;
    status?: string;
  };
  manufacturers: string[];
  statuses: string[];
  drugNames: string[];
}

const DrugFilterInGroupModal: React.FC<DrugFilterInGroupModalProps> = ({
  visible,
  onCancel,
  onApply,
  onReset,
  filters,
  manufacturers,
  statuses,
  drugNames,
}) => {
  const [localFilters, setLocalFilters] = useState(filters);

  // Reset localFilters when modal is opened with new filters
  useEffect(() => {
    if (visible) {
      setLocalFilters(filters);
    }
  }, [visible, filters]);

  // Handle reset filters
  const handleReset = () => {
    console.log("Reset clicked in modal, resetting all filters");
    setLocalFilters({
      name: undefined,
      manufacturer: undefined,
      status: filters.status, // Keep the status from main filters
    } as any);
    onReset();
  };

  // Handle apply filters
  const handleApply = () => {
    console.log("Applying filters:", localFilters);
    onApply({
      ...localFilters,
      status: filters.status, // Preserve the status from main filters
    });
  };

  // Common styles for filter items
  const filterItemStyle = { marginBottom: "16px" };
  const filterLabelStyle = { marginBottom: "8px", color: "#666666" };

  // Update a filter value
  const updateFilter = (field: string, value: any) => {
    console.log(`Updating filter ${field} with value:`, value);
    setLocalFilters((prev) => ({ ...prev, [field]: value || "" }));
  };

  return (
    <Modal
      title={
        <Title level={4} style={{ margin: 0 }}>
          Advanced Filter
        </Title>
      }
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
        {/* Search Criteria Section */}
        <Divider orientation="left">Filter Options</Divider>
        <Row gutter={16}>
          {/* Drug Name */}
          <Col span={24}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Drug Name
              </div>
              <Select
                showSearch
                allowClear
                placeholder="Select Drug Name"
                value={localFilters.name || undefined}
                onChange={(value) => updateFilter("name", value)}
                style={{ width: "100%" }}
                filterOption={(input, option) =>
                  (option?.value as string)
                    .toLowerCase()
                    .indexOf(input.toLowerCase()) >= 0
                }
              >
                {drugNames.map((name) => (
                  <Option key={name} value={name}>
                    {name}
                  </Option>
                ))}
              </Select>
            </div>
          </Col>

          {/* Manufacturer */}
          <Col span={24}>
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
                  (option?.value as string)
                    .toLowerCase()
                    .indexOf(input.toLowerCase()) >= 0
                }
              >
                {manufacturers.map((manufacturer) => (
                  <Option key={manufacturer} value={manufacturer}>
                    {manufacturer}
                  </Option>
                ))}
              </Select>
            </div>
          </Col>
        </Row>
      </Space>
    </Modal>
  );
};

export default DrugFilterInGroupModal;
