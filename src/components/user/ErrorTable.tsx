import React, { useState } from "react";
import { Table, Input, Button, Space, Typography, Tag, Tooltip, Badge } from "antd";
import { SearchOutlined, InfoCircleOutlined } from "@ant-design/icons";
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

  // Phân loại loại lỗi và trả về loại Tag phù hợp
  const getErrorTypeTag = (errorMessage: string) => {
    const isDuplicate = errorMessage.includes("already exists");
    if (isDuplicate) {
      return <Tag color="orange">Duplicate</Tag>;
    } else if (errorMessage.includes("required")) {
      return <Tag color="red">Missing Field</Tag>;
    } else if (errorMessage.includes("format") || errorMessage.includes("invalid")) {
      return <Tag color="magenta">Format Error</Tag>;
    } else {
      return <Tag color="volcano">Validation Error</Tag>;
    }
  };

  // Phân tích dữ liệu người dùng
  const parseUserData = (data: string) => {
    const parts = data.split(", ");
    return {
      fullName: parts[0] || "",
      username: parts[1] || "",
      email: parts[2] || "",
      other: parts.slice(3).join(", ") || ""
    };
  };

  const columns: ColumnsType<UserImportErrorDTO> = [
    {
      title: "Row",
      dataIndex: "rowNumber",
      key: "rowNumber",
      width: 70,
      sorter: (a, b) => a.rowNumber - b.rowNumber,
      render: (value) => (
        <Badge 
          count={value} 
          style={{ 
            backgroundColor: '#1890ff',
            fontSize: '12px',
            fontWeight: 'bold'
          }} 
        />
      ),
    },
    {
      title: "Error Type",
      key: "errorType",
      width: 120,
      render: (_, record) => getErrorTypeTag(record.errorMessage),
      filters: [
        { text: "Missing Fields", value: "required" },
        { text: "Format Errors", value: "format" },
        { text: "Duplicates", value: "exists" },
        { text: "Other Errors", value: "other" },
      ],
      onFilter: (value, record) => {
        if (value === "required") return record.errorMessage.includes("required");
        if (value === "format") return record.errorMessage.includes("format") || record.errorMessage.includes("invalid");
        if (value === "exists") return record.errorMessage.includes("already exists");
        return !record.errorMessage.includes("required") && 
               !record.errorMessage.includes("format") && 
               !record.errorMessage.includes("invalid") && 
               !record.errorMessage.includes("already exists");
      },
    },
    {
      title: "Error Message",
      dataIndex: "errorMessage",
      key: "errorMessage",
      ellipsis: {
        showTitle: false,
      },
      render: (text) => (
        <Tooltip placement="topLeft" title={text}>
          <Text type="danger" style={{ fontSize: '13px' }}>{text}</Text>
        </Tooltip>
      ),
    },
    {
      title: "User Data",
      key: "userData",
      render: (_, record) => {
        const userData = parseUserData(record.data);
        return (
          <Space direction="vertical" size={0} style={{ width: '100%' }}>
            <Text strong>{userData.fullName}</Text>
            {userData.username && (
              <Text type="secondary" style={{ fontSize: '13px' }}>
                Username: {userData.username}
              </Text>
            )}
            {userData.email && (
              <Text type="secondary" style={{ fontSize: '13px' }}>
                Email: {userData.email}
              </Text>
            )}
            {userData.other && (
              <Tooltip title={userData.other}>
                <Text type="secondary" style={{ fontSize: '12px' }} ellipsis>
                  <InfoCircleOutlined style={{ marginRight: 4 }} />
                  Additional data available
                </Text>
              </Tooltip>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between" }}>
        <Space>
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
            disabled={!searchText}
          >
            Clear
          </Button>
        </Space>
        
        <Text type="secondary">
          {filteredErrors.length} of {errors.length} records
        </Text>
      </div>

      <Table
        columns={columns}
        dataSource={filteredErrors}
        rowKey={(record) => `${record.rowNumber}-${record.errorMessage}`}
        pagination={{ 
          pageSize: fullHeight ? 20 : 5,
          showSizeChanger: true,
          pageSizeOptions: ['5', '10', '20', '50'],
          showTotal: (total) => `Total ${total} items`
        }}
        size="middle"
        style={{ 
          height: fullHeight ? "600px" : "400px", 
          overflow: "auto" 
        }}
        scroll={{ y: fullHeight ? 550 : 350 }}
        rowClassName={(record) => 
          record.errorMessage.includes("already exists") 
            ? "row-duplicate" 
            : "row-error"
        }
      />

      <style jsx global>{`
        .row-duplicate {
          background-color: #fffbe6;
        }
        .row-duplicate:hover > td {
          background-color: #fff7cc !important;
        }
        .row-error:hover > td {
          background-color: #fff1f0 !important;
        }
      `}</style>
    </div>
  );
};

export default ErrorTable; 