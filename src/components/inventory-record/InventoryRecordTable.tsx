import React, { useState } from "react";
import { Table, Tag, Button, Tooltip, Typography, message, Form, Space, Dropdown, Menu } from "antd";
import type { ColumnsType } from "antd/es/table";
import { EditOutlined, EyeOutlined, MoreOutlined } from "@ant-design/icons";
import { useRouter } from "next/router";
import { InventoryRecordResponseDTO } from "@/api/inventoryrecord";
import PaginationFooter from "../shared/PaginationFooter";
import TableControls from "../shared/TableControls";
import dayjs from "dayjs";

const { Text } = Typography;

interface InventoryRecordTableProps {
  loading: boolean;
  records: InventoryRecordResponseDTO[];
  totalItems: number;
  currentPage: number;
  pageSize: number;
  handlePageChange: (page: number, pageSize?: number) => void;
  selectedRowKeys: string[];
  setSelectedRowKeys: (keys: string[]) => void;
  onEdit: (record: InventoryRecordResponseDTO) => void;
  bordered?: boolean;
  columnVisibility?: Record<string, boolean>;
}

const InventoryRecordTable: React.FC<InventoryRecordTableProps> = ({
  loading,
  records,
  totalItems,
  currentPage,
  pageSize,
  handlePageChange,
  selectedRowKeys,
  setSelectedRowKeys,
  onEdit,
  bordered = false,
  columnVisibility = {
    batchCode: true,
    drug: true,
    quantityInStock: true,
    reorderLevel: true,
    status: true,
    createdAt: true,
    lastUpdated: true,
    actions: true,
  },
}) => {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();

  // Helper functions
  const renderStatusTag = (status: string | undefined) => {
    const statusColors: Record<string, string> = {
      Priority: "geekblue",
      Active: "green",
      NearExpiry: "orange",
      Inactive: "volcano",
      Expired: "red",
    };

    return (
      <Tag color={statusColors[status || ""] || "default"}>
        {status === "NearExpiry" ? "Near Expiry" : status}
      </Tag>
    );
  };

  // Format date as dd/mm/yyyy hh:mm:ss
  const formatDateTime = (dateString: string) => {
    return dayjs(dateString).format("DD/MM/YYYY HH:mm:ss");
  };

  // Render action buttons with dropdown
  const renderActionButtons = (record: InventoryRecordResponseDTO) => {
    return (
      <div style={{ textAlign: "center" }}>
        <Dropdown
          overlay={
            <Menu>
              <Menu.Item
                key="view"
                icon={<EyeOutlined />}
                onClick={() => router.push(`/inventory-record/${record.id}`)}
              >
                View Details
              </Menu.Item>
              <Menu.Item
                key="edit"
                icon={<EditOutlined />}
                onClick={(e) => {
                  e.domEvent.stopPropagation();
                  onEdit(record);
                }}
              >
                Edit Reorder Level
              </Menu.Item>
            </Menu>
          }
          placement="bottomCenter"
          trigger={["click"]}
        >
          <Button 
            icon={<MoreOutlined />} 
            size="small" 
            onClick={(e) => e.stopPropagation()}
          />
        </Dropdown>
      </div>
    );
  };

  // Define table columns
  const columns: ColumnsType<InventoryRecordResponseDTO> = [
    {
      title: "BATCH CODE",
      dataIndex: "batchCode",
      key: "batchCode",
      sorter: (a, b) => a.batchCode.localeCompare(b.batchCode),
      render: (text, record) => (
        <Button
          type="link"
          onClick={() => router.push(`/inventory-record/${record.id}`)}
          style={{ padding: 0 }}
        >
          <Text strong>{text}</Text>
        </Button>
      ),
    },
    {
      title: "DRUG",
      dataIndex: ["drug", "drugCode"],
      key: "drug",
      sorter: (a, b) => a.drug.drugCode.localeCompare(b.drug.drugCode),
      render: (text, record) => (
        <Text>
          {text} - {record.drug.name}
        </Text>
      ),
    },
    {
      title: "QUANTITY IN STOCK",
      dataIndex: "quantityInStock",
      key: "quantityInStock",
      sorter: (a, b) => a.quantityInStock - b.quantityInStock,
    },
    {
      title: "REORDER LEVEL",
      dataIndex: "reorderLevel",
      key: "reorderLevel",
      sorter: (a, b) => a.reorderLevel - b.reorderLevel,
    },
    {
      title: "LAST UPDATED",
      dataIndex: "lastUpdated",
      key: "lastUpdated",
      render: (lastUpdated, record) => {
        return lastUpdated 
          ? formatDateTime(lastUpdated)
          : formatDateTime(record.createdAt);
      },
      sorter: (a, b) => {
        const dateA = a.lastUpdated
          ? new Date(a.lastUpdated)
          : new Date(a.createdAt);
        const dateB = b.lastUpdated
          ? new Date(b.lastUpdated)
          : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      },
    },
    {
      title: "CREATED AT",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (createdAt) => formatDateTime(createdAt),
      sorter: (a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      },
    },
    {
      title: "STATUS",
      dataIndex: "status",
      key: "status",
      align: "center",
      render: (status) => (
        <div style={{ textAlign: "center" }}>
          {renderStatusTag(status)}
        </div>
      ),
      sorter: (a, b) => (a.status || "").localeCompare(b.status || ""),
    },
    {
      title: "ACTIONS",
      key: "actions",
      align: "center",
      render: (_, record) => renderActionButtons(record),
    },
  ];

  // Filter columns based on visibility settings
  const visibleColumns = columns.filter(
    (column) => columnVisibility[column.key as string]
  );

  return (
    <>
      {contextHolder}

      <Table
        dataSource={records}
        columns={visibleColumns}
        rowKey="id"
        loading={loading}
        pagination={false}
        bordered={bordered}
        onRow={(record) => ({
          onClick: (e) => {
            const target = e.target as HTMLElement;
            const actionCell = target.closest('.ant-table-cell-with-append') || 
                               target.closest('.ant-dropdown-menu') ||
                               target.closest('.ant-dropdown');
            if (!actionCell) {
              router.push(`/inventory-record/${record.id}`);
            }
          },
          style: { cursor: 'pointer' }
        })}
      />

      <PaginationFooter
        current={currentPage}
        pageSize={pageSize}
        total={totalItems}
        onChange={handlePageChange}
        showGoToPage={true}
        showTotal={true}
      />
    </>
  );
};

export default InventoryRecordTable;
