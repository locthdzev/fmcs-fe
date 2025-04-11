import React, { useState } from "react";
import { Table, Input, Button, Space, Typography } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

const { Text } = Typography;

// Interface cho dữ liệu lỗi
export interface UserImportErrorDTO {
  rowNumber: number;
  errorMessage: string;
  data: string;
}

interface ErrorTableProps {
  errors: UserImportErrorDTO[];
  skipDuplicates: boolean;
  fullHeight?: boolean;
}

const ErrorTable: React.FC<ErrorTableProps> = ({
  errors,
  skipDuplicates,
  fullHeight = false,
}) => {
  const [searchText, setSearchText] = useState<string>("");

  // Lọc dữ liệu dựa trên text tìm kiếm
  const filteredErrors = searchText
    ? errors.filter(
        (error) =>
          error.data.toLowerCase().includes(searchText.toLowerCase()) ||
          error.errorMessage.toLowerCase().includes(searchText.toLowerCase())
      )
    : errors;

  const columns: ColumnsType<UserImportErrorDTO> = [
    {
      title: "Row",
      dataIndex: "rowNumber",
      key: "rowNumber",
      width: 80,
      sorter: (a, b) => a.rowNumber - b.rowNumber,
    },
    {
      title: "Error Type",
      key: "errorType",
      width: 120,
      render: (_, record) =>
        record.errorMessage.includes("already exists") ? (
          <Text type="warning">Skipped</Text>
        ) : (
          <Text type="danger">Error</Text>
        ),
      filters: [
        { text: "Errors", value: "error" },
        { text: "Skipped", value: "skipped" },
      ],
      onFilter: (value, record) =>
        value === "skipped"
          ? record.errorMessage.includes("already exists")
          : !record.errorMessage.includes("already exists"),
    },
    {
      title: "Error Message",
      dataIndex: "errorMessage",
      key: "errorMessage",
      render: (text) => <Text type="danger">{text}</Text>,
    },
    {
      title: "User Data",
      key: "userData",
      render: (_, record) => {
        const parts = record.data.split(", ");
        return (
          <>
            <div>
              <Text strong>{parts[0] || ""}</Text> {/* Full Name */}
            </div>
            <div>
              <Text type="secondary">{parts[2] || ""}</Text> {/* Email */}
            </div>
          </>
        );
      },
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: "16px" }}>
        <Input
          placeholder="Search by name, email or error message"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          prefix={<SearchOutlined />}
          allowClear
          style={{ width: 300 }}
        />
        <Button
          type="text"
          onClick={() => setSearchText("")}
          style={{ marginLeft: "8px" }}
          disabled={!searchText}
        >
          Clear
        </Button>
        <Text type="secondary" style={{ marginLeft: "16px" }}>
          {filteredErrors.length} records found
        </Text>
      </div>

      <Table
        columns={columns}
        dataSource={filteredErrors}
        rowKey={(record) => `${record.rowNumber}-${record.errorMessage}`}
        pagination={{ pageSize: 5 }}
        size="middle"
        style={{ height: fullHeight ? "600px" : "400px", overflow: "auto" }}
      />
    </div>
  );
};

export default ErrorTable; 