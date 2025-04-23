import React from "react";
import { Button, Select, Typography, Tooltip, Popconfirm } from "antd";
import { UndoOutlined, DeleteOutlined, CheckCircleOutlined, StopOutlined } from "@ant-design/icons";

const { Text } = Typography;
const { Option } = Select;

export interface BulkAction {
  key: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  buttonText: string;
  buttonType?: "primary" | "default" | "dashed" | "link" | "text";
  isDanger?: boolean;
  tooltip: string;
  isVisible: boolean;
  isLoading?: boolean;
  style?: React.CSSProperties;
  onConfirm: () => Promise<void>;
}

interface TableControlsProps {
  /**
   * Array of selected row keys
   */
  selectedRowKeys: React.Key[];

  /**
   * Current page size
   */
  pageSize: number;

  /**
   * Handle page size change - (newPageSize: number) => void
   */
  onPageSizeChange: (pageSize: number) => void;

  /**
   * Array of available bulk actions
   */
  bulkActions?: BulkAction[];

  /**
   * Additional class name
   */
  className?: string;

  /**
   * Maximum rows per page option (default: 100)
   */
  maxRowsPerPage?: number;

  /**
   * Array of rows per page options (default: [5, 10, 15, 20, 50, 100])
   */
  pageSizeOptions?: number[];

  /**
   * Use "Items per page" instead of "Rows per page" (for lists instead of tables)
   */
  useItemsLabel?: boolean;
  
  /**
   * Function that renders column settings UI
   */
  columnSettings?: () => React.ReactNode;
}

/**
 * A reusable component for table controls that shows selected items count and bulk actions on the left
 * and rows per page selection on the right
 */
const TableControls: React.FC<TableControlsProps> = ({
  selectedRowKeys,
  pageSize,
  onPageSizeChange,
  bulkActions = [],
  className = "",
  maxRowsPerPage = 100,
  pageSizeOptions = [5, 10, 15, 20, 50, 100],
  useItemsLabel = false,
  columnSettings,
}) => {
  // Filter page size options to respect the maximum
  const filteredPageSizeOptions = pageSizeOptions.filter(
    (size) => size <= maxRowsPerPage
  );

  return (
    <div
      className={`flex justify-between items-center mb-4 ${className}`}
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: "16px",
        alignItems: "center",
      }}
    >
      {/* Selected items count and bulk actions - left side */}
      <div
        className="flex items-center gap-3"
        style={{ display: "flex", alignItems: "center", gap: "12px" }}
      >
        {selectedRowKeys.length > 0 && (
          <>
            <Text type="secondary">
              {selectedRowKeys.length} Items selected
            </Text>

            {/* Render bulk actions */}
            {bulkActions
              .filter((action) => action.isVisible)
              .map((action) => (
                <Tooltip key={action.key} title={action.tooltip}>
                  <Popconfirm
                    title={
                      <div style={{ padding: "0 10px" }}>{action.title}</div>
                    }
                    description={
                      <p style={{ padding: "10px 40px 10px 18px" }}>
                        {action.description}
                      </p>
                    }
                    onConfirm={action.onConfirm}
                    okButtonProps={{ loading: action.isLoading }}
                    okText={action.buttonText}
                    cancelText="Cancel"
                    placement="rightBottom"
                  >
                    <Button
                      type={action.buttonType}
                      danger={action.isDanger}
                      icon={action.icon}
                      style={action.style}
                    >
                      {action.buttonText}
                    </Button>
                  </Popconfirm>
                </Tooltip>
              ))}
          </>
        )}
      </div>

      {/* Rows per page and column settings - right side */}
      <div
        className="flex gap-2 items-center"
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "center",
        }}
      >
        <Text type="secondary">{useItemsLabel ? "Items per page:" : "Rows per page:"}</Text>
        {columnSettings && columnSettings()}
        
        <Select
          value={pageSize}
          onChange={(value) => onPageSizeChange(value)}
          style={{ width: "80px" }}
        >
          {filteredPageSizeOptions.map((size) => (
            <Option key={size} value={size}>
              {size}
            </Option>
          ))}
        </Select>
      </div>
    </div>
  );
};

// Also provide common bulk actions for convenience
export const createDeleteBulkAction = (
  selectedCount: number,
  isLoading: boolean,
  onDelete: () => Promise<void>,
  isVisible: boolean = true
): BulkAction => ({
  key: "delete",
  title: "Delete selected items",
  description: `Are you sure you want to delete ${selectedCount} selected item(s)?`,
  icon: <DeleteOutlined />,
  buttonText: "Delete",
  isDanger: true,
  tooltip: "Delete selected items",
  isVisible,
  isLoading,
  onConfirm: onDelete,
});

export const createRestoreBulkAction = (
  selectedCount: number,
  isLoading: boolean,
  onRestore: () => Promise<void>,
  isVisible: boolean = true
): BulkAction => ({
  key: "restore",
  title: "Restore selected items",
  description: `Are you sure you want to restore ${selectedCount} selected item(s)?`,
  icon: <UndoOutlined />,
  buttonText: "Restore",
  tooltip: "Restore selected items",
  isVisible,
  isLoading,
  onConfirm: onRestore,
});

export const createActivateBulkAction = (
  selectedCount: number,
  isLoading: boolean,
  onActivate: () => Promise<void>,
  isVisible: boolean = true
): BulkAction => ({
  key: "activate",
  title: "Activate selected items",
  description: `Are you sure you want to activate ${selectedCount} selected item(s)?`,
  icon: <CheckCircleOutlined />,
  buttonText: "Activate",
  buttonType: "default",
  tooltip: "Activate selected items",
  style: { color: "#52c41a", borderColor: "#52c41a" },
  isVisible,
  isLoading,
  onConfirm: onActivate,
});

export const createDeactivateBulkAction = (
  selectedCount: number,
  isLoading: boolean,
  onDeactivate: () => Promise<void>,
  isVisible: boolean = true
): BulkAction => ({
  key: "deactivate",
  title: "Deactivate selected items",
  description: `Are you sure you want to deactivate ${selectedCount} selected item(s)?`,
  icon: <StopOutlined />,
  buttonText: "Deactivate",
  buttonType: "default",
  isDanger: true,
  tooltip: "Deactivate selected items",
  isVisible,
  isLoading,
  onConfirm: onDeactivate,
});

export default TableControls;
