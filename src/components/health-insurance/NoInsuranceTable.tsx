import React from "react";
import { Table, Button, Space, Tooltip, Modal, message, Card, Dropdown, Tag, Popconfirm } from "antd";
import {
  DeleteOutlined,
  ExclamationCircleOutlined,
  MoreOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";
import dayjs from "dayjs";

import {
  HealthInsuranceResponseDTO,
  softDeleteHealthInsurances,
} from "@/api/healthinsurance";
import { getStatusTag } from "@/utils/statusTagUtils";

interface NoInsuranceTableProps {
  loading: boolean;
  insurances: HealthInsuranceResponseDTO[];
  selectedRowKeys: React.Key[];
  setSelectedRowKeys: React.Dispatch<React.SetStateAction<React.Key[]>>;
  columnVisibility: {
    owner: boolean;
    createdAt: boolean;
    createdBy: boolean;
    status: boolean;
    updatedAt: boolean;
    updatedBy: boolean;
  };
  refreshData: () => void;
}

const NoInsuranceTable: React.FC<NoInsuranceTableProps> = ({
  loading,
  insurances,
  selectedRowKeys,
  setSelectedRowKeys,
  columnVisibility,
  refreshData,
}) => {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();

  const handleSoftDelete = async (id: string) => {
    try {
      const result = await softDeleteHealthInsurances([id]);
      if (result.isSuccess) {
        messageApi.success("Record deleted successfully");
        refreshData();
      } else {
        messageApi.error(result.message || "Failed to delete record");
      }
    } catch (error) {
      messageApi.error("Failed to delete record");
      console.error("Error deleting record:", error);
    }
  };

  const renderUserInfo = (user: any) => {
    if (!user) return "";
    return (
      <div style={{ display: "flex", flexDirection: "column" }}>
        <a
          onClick={() => router.push(`/user/${user.id}`)}
          style={{ color: "#1890ff" }}
        >
          {user.fullName}
        </a>
        <span style={{ fontSize: "12px", color: "#888" }}>{user.email}</span>
      </div>
    );
  };

  const renderUserInfoSimple = (user: any) => {
    if (!user) return "";
    return (
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span>{user.userName || ""}</span>
        <span style={{ fontSize: "12px", color: "#888" }}>{user.email || ""}</span>
      </div>
    );
  };

  const formatDateTime = (dateStr: string | undefined) => {
    if (!dateStr) return "-";
    return dayjs(dateStr).format("DD/MM/YYYY HH:mm:ss");
  };

  const columns = [
    {
      title: (
        <span
          style={{
            textTransform: "uppercase",
            fontWeight: "bold",
          }}
        >
          OWNER
        </span>
      ),
      dataIndex: ["user"],
      key: "owner",
      fixed: "left" as const,
      width: 200,
      render: (user: any) => renderUserInfo(user),
      hidden: !columnVisibility.owner,
    },
    {
      title: (
        <span
          style={{
            textTransform: "uppercase",
            fontWeight: "bold",
            display: "flex",
            justifyContent: "center",
          }}
        >
          CREATED AT
        </span>
      ),
      dataIndex: "createdAt",
      key: "createdAt",
      width: 160,
      align: "center" as const,
      render: formatDateTime,
      hidden: !columnVisibility.createdAt,
    },
    {
      title: (
        <span
          style={{
            textTransform: "uppercase",
            fontWeight: "bold",
          }}
        >
          CREATED BY
        </span>
      ),
      dataIndex: "createdBy",
      key: "createdBy",
      width: 200,
      render: (user: any) => renderUserInfoSimple(user),
      hidden: !columnVisibility.createdBy,
    },
    {
      title: (
        <span
          style={{
            textTransform: "uppercase",
            fontWeight: "bold",
            display: "flex",
            justifyContent: "center",
          }}
        >
          STATUS
        </span>
      ),
      dataIndex: "status",
      key: "status",
      width: 150,
      align: "center" as const,
      render: (status: string) => getStatusTag(status),
      hidden: !columnVisibility.status,
    },
    {
      title: (
        <span
          style={{
            textTransform: "uppercase",
            fontWeight: "bold",
            display: "flex",
            justifyContent: "center",
          }}
        >
          UPDATED AT
        </span>
      ),
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 160,
      align: "center" as const,
      render: formatDateTime,
      hidden: !columnVisibility.updatedAt,
    },
    {
      title: (
        <span
          style={{
            textTransform: "uppercase",
            fontWeight: "bold",
          }}
        >
          UPDATED BY
        </span>
      ),
      dataIndex: "updatedBy",
      key: "updatedBy",
      width: 200,
      render: (user: any) => renderUserInfoSimple(user),
      hidden: !columnVisibility.updatedBy,
    },
    {
      title: (
        <span
          style={{
            textTransform: "uppercase",
            fontWeight: "bold",
            display: "flex",
            justifyContent: "center",
          }}
        >
          ACTIONS
        </span>
      ),
      key: "actions",
      fixed: "right" as const,
      width: 80,
      align: "center" as const,
      render: (record: HealthInsuranceResponseDTO) => (
        <Dropdown
          menu={{
            items: [
              {
                key: "delete",
                icon: <DeleteOutlined />,
                label: (
                  <Popconfirm
                    title="Delete record"
                    description="Are you sure you want to delete this record?"
                    onConfirm={() => handleSoftDelete(record.id)}
                    okText="Yes"
                    cancelText="No"
                    icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
                  >
                    <span style={{ color: "#ff4d4f" }}>Soft Delete</span>
                  </Popconfirm>
                ),
                danger: true,
              },
            ],
          }}
          placement="bottomRight"
          trigger={["click"]}
        >
          <Button icon={<MoreOutlined />} size="small" />
        </Dropdown>
      ),
    },
  ].filter(column => column.key === "actions" || !column.hidden);

  return (
    <>
      {contextHolder}
      <Card className="shadow-sm" bodyStyle={{ padding: "16px" }}>
        <div style={{ overflowX: "auto" }}>
          <Table
            rowKey="id"
            dataSource={insurances}
            columns={columns}
            rowSelection={{
              selectedRowKeys,
              onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
              columnWidth: 48,
            }}
            loading={loading}
            pagination={false}
            size="middle"
            scroll={{ x: "max-content" }}
            sticky
            bordered
          />
        </div>
      </Card>
    </>
  );
};

export default NoInsuranceTable;
