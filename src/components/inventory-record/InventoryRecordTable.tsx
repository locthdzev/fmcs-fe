import React, { useState } from "react";
import {
  Table,
  Tag,
  Button,
  Tooltip,
  Typography,
  message,
  Form,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { EditOutlined } from "@ant-design/icons";
import { useRouter } from "next/router";
import { InventoryRecordResponseDTO } from "@/api/inventoryrecord";
import PaginationFooter from "../shared/PaginationFooter";
import TableControls from "../shared/TableControls";

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

  // Define table columns
  const columns: ColumnsType<InventoryRecordResponseDTO> = [
    {
      title: "DRUG CODE",
      dataIndex: ["drug", "drugCode"],
      key: "drugCode",
      sorter: (a, b) => a.drug.drugCode.localeCompare(b.drug.drugCode),
      render: (text, record) => (
        <Button
          type="link"
          onClick={() => router.push(`/drug?id=${record.drug.id}`)}
          style={{ padding: 0 }}
        >
          {text}
        </Button>
      ),
    },
    {
      title: "DRUG NAME",
      dataIndex: ["drug", "name"],
      key: "drugName",
      sorter: (a, b) => a.drug.name.localeCompare(b.drug.name),
    },
    {
      title: "BATCH CODE",
      dataIndex: "batchCode",
      key: "batchCode",
      sorter: (a, b) => a.batchCode.localeCompare(b.batchCode),
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
        const date = lastUpdated
          ? new Date(lastUpdated)
          : new Date(record.createdAt);
        return date.toLocaleString();
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
      render: (createdAt) => new Date(createdAt).toLocaleString(),
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
      render: (status) => renderStatusTag(status),
      sorter: (a, b) => (a.status || "").localeCompare(b.status || ""),
    },
    {
      title: "ACTIONS",
      key: "actions",
      align: "center",
      render: (_, record) => (
        <Tooltip title="Edit Reorder Level">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(record);
            }}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      
      <TableControls
        selectedRowKeys={selectedRowKeys}
        pageSize={pageSize}
        onPageSizeChange={(newSize) => handlePageChange(1, newSize)}
        bulkActions={[]}
        maxRowsPerPage={100}
        pageSizeOptions={[5, 10, 15, 20, 50, 100]}
      />

      <Table
        dataSource={records}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={false}
        onRow={(record) => ({
          onClick: () => router.push(`/inventoryrecord/detail?id=${record.id}`),
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