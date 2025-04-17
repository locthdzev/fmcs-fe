import React, { useState } from 'react';
import { Button, Select, Tooltip, Dropdown, Checkbox, message } from 'antd';
import {
  FilterOutlined,
  UndoOutlined,
  SettingOutlined,
  PlusOutlined,
  FileExcelOutlined,
  TagOutlined,
} from '@ant-design/icons';
import ToolbarCard from './ToolbarCard';

const { Option } = Select;

// Define column keys type
type ColumnKey = 'code' | 'name' | 'status' | 'createdAt' | 'actions';

const ToolbarCardExample: React.FC = () => {
  // Example state
  const [codeSearch, setCodeSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState<Record<ColumnKey, boolean>>({
    code: true,
    name: true,
    status: true,
    createdAt: true,
    actions: true,
  });

  // Example handlers
  const handleReset = () => {
    setCodeSearch('');
    setStatusFilter('');
    message.success('Filters reset');
  };

  const handleOpenFilterModal = () => {
    message.info('Filter modal would open here');
  };

  const handleColumnVisibilityChange = (key: ColumnKey) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleAllColumns = (checked: boolean) => {
    const newVisibility = { ...columnVisibility };
    (Object.keys(newVisibility) as ColumnKey[]).forEach((key) => {
      newVisibility[key] = checked;
    });
    setColumnVisibility(newVisibility);
  };

  const areAllColumnsVisible = () => {
    return Object.values(columnVisibility).every((value) => value === true);
  };

  const handleDropdownVisibleChange = (visible: boolean) => {
    setDropdownOpen(visible);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Left side content with filters and search controls
  const leftContent = (
    <>
      {/* Code Search */}
      <Select
        showSearch
        placeholder="Search Code"
        value={codeSearch || undefined}
        onChange={(value) => {
          setCodeSearch(value || "");
        }}
        style={{ width: "250px" }}
        allowClear
        options={[
          { value: 'CODE001', label: 'CODE001' },
          { value: 'CODE002', label: 'CODE002' },
          { value: 'CODE003', label: 'CODE003' },
        ]}
      />

      {/* Advanced Filters */}
      <Tooltip title="Advanced Filters">
        <Button
          icon={
            <FilterOutlined
              style={{
                color: statusFilter ? "#1890ff" : undefined,
              }}
            />
          }
          onClick={handleOpenFilterModal}
        >
          Filters
        </Button>
      </Tooltip>

      {/* Status */}
      <div>
        <Select
          placeholder={
            <div style={{ display: "flex", alignItems: "center" }}>
              <TagOutlined style={{ marginRight: 8 }} />
              <span>Status</span>
            </div>
          }
          allowClear
          style={{ width: "120px" }}
          value={statusFilter || undefined}
          onChange={(value) => {
            setStatusFilter(value || "");
          }}
          disabled={loading}
        >
          <Option value="InProgress">In Progress</Option>
          <Option value="Completed">Completed</Option>
          <Option value="Cancelled">Cancelled</Option>
        </Select>
      </div>

      {/* Reset Button */}
      <Tooltip title="Reset All Filters">
        <Button
          icon={<UndoOutlined />}
          onClick={handleReset}
          disabled={!codeSearch && !statusFilter}
        />
      </Tooltip>

      {/* Column Settings */}
      <Dropdown
        menu={{
          items: [
            {
              key: "selectAll",
              label: (
                <div onClick={handleMenuClick}>
                  <Checkbox
                    checked={areAllColumnsVisible()}
                    onChange={(e) => toggleAllColumns(e.target.checked)}
                  >
                    Toggle All
                  </Checkbox>
                </div>
              ),
            },
            {
              key: "divider",
              type: "divider",
            },
            {
              key: "code",
              label: (
                <div onClick={handleMenuClick}>
                  <Checkbox
                    checked={columnVisibility.code}
                    onChange={() => handleColumnVisibilityChange("code")}
                  >
                    Code
                  </Checkbox>
                </div>
              ),
            },
            {
              key: "name",
              label: (
                <div onClick={handleMenuClick}>
                  <Checkbox
                    checked={columnVisibility.name}
                    onChange={() => handleColumnVisibilityChange("name")}
                  >
                    Name
                  </Checkbox>
                </div>
              ),
            },
            {
              key: "status",
              label: (
                <div onClick={handleMenuClick}>
                  <Checkbox
                    checked={columnVisibility.status}
                    onChange={() => handleColumnVisibilityChange("status")}
                  >
                    Status
                  </Checkbox>
                </div>
              ),
            },
          ],
          onClick: (e) => e.domEvent.stopPropagation(),
        }}
        trigger={["hover", "click"]}
        placement="bottomRight"
        arrow
        open={dropdownOpen}
        onOpenChange={handleDropdownVisibleChange}
      >
        <Tooltip title="Column Settings">
          <Button icon={<SettingOutlined />}>Columns</Button>
        </Tooltip>
      </Dropdown>

      {/* Create Button */}
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => message.info('Create modal would open here')}
        disabled={loading}
      >
        Create
      </Button>
    </>
  );

  // Right side content with export button
  const rightContent = (
    <Button
      type="primary"
      icon={<FileExcelOutlined />}
      onClick={() => message.info('Export config would open here')}
      disabled={loading}
    >
      Export to Excel
    </Button>
  );

  return (
    <div style={{ padding: '20px' }}>
      <ToolbarCard
        leftContent={leftContent}
        rightContent={rightContent}
        title="Example Toolbar"
      />
      
      <div className="bg-white p-4 rounded-lg border">
        <p>This is where your table or content would go...</p>
      </div>
    </div>
  );
};

export default ToolbarCardExample; 