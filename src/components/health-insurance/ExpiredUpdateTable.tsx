import React from "react";
import { Table, Button, Space, Tooltip, Modal, message, Card, Dropdown } from "antd";
import {
  DeleteOutlined,
  SendOutlined,
  ExclamationCircleOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";
import dayjs from "dayjs";

import {
  HealthInsuranceResponseDTO,
  softDeleteHealthInsurances,
  resendUpdateRequest,
} from "@/api/healthinsurance";

interface ExpiredUpdateTableProps {
  loading: boolean;
  insurances: HealthInsuranceResponseDTO[];
  selectedRowKeys: React.Key[];
  setSelectedRowKeys: React.Dispatch<React.SetStateAction<React.Key[]>>;
  columnVisibility: {
    owner: boolean;
    createdAt: boolean;
    createdBy: boolean;
    status: boolean;
    deadline: boolean;
  };
  refreshData: () => void;
}

const ExpiredUpdateTable: React.FC<ExpiredUpdateTableProps> = ({
  loading,
  insurances,
  selectedRowKeys,
  setSelectedRowKeys,
  columnVisibility,
  refreshData,
}) => {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();

  const handleSoftDelete = (id: string) => {
    Modal.confirm({
      title: "Are you sure you want to soft delete this health insurance?",
      icon: <ExclamationCircleOutlined />,
      content: "This action can be reversed later.",
      onOk: async () => {
        try {
          const result = await softDeleteHealthInsurances([id]);
          if (result.isSuccess) {
            messageApi.success("Health insurance deleted successfully");
            refreshData();
          } else {
            messageApi.error(result.message || "Failed to delete health insurance");
          }
        } catch (error) {
          messageApi.error("Failed to delete health insurance");
          console.error("Error deleting health insurance:", error);
        }
      },
    });
  };

  const handleResendUpdateRequest = (id: string) => {
    Modal.confirm({
      title: "Resend Update Request",
      icon: <ExclamationCircleOutlined />,
      content: "Are you sure you want to resend the update request for this insurance?",
      onOk: async () => {
        try {
          const result = await resendUpdateRequest(id);
          if (result.isSuccess) {
            messageApi.success("Update request sent successfully");
            refreshData();
          } else {
            messageApi.error(result.message || "Failed to send update request");
          }
        } catch (error) {
          messageApi.error("Failed to send update request");
          console.error("Error sending update request:", error);
        }
      },
    });
  };

  const renderUserInfo = (user: any) => {
    if (!user) return "";
    return (
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span>{user.fullName}</span>
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
          DEADLINE
        </span>
      ),
      dataIndex: "deadline",
      key: "deadline",
      width: 160,
      align: "center" as const,
      render: formatDateTime,
      hidden: !columnVisibility.deadline,
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
        <div style={{ textAlign: "center" }}>
          <Dropdown
            menu={{
              items: [
                {
                  key: "resend",
                  icon: <SendOutlined />,
                  label: "Resend Update Request",
                  onClick: () => handleResendUpdateRequest(record.id),
                },
                {
                  key: "delete",
                  icon: <DeleteOutlined />,
                  label: "Soft Delete",
                  danger: true,
                  onClick: () => handleSoftDelete(record.id),
                },
              ],
            }}
            placement="bottomRight"
            trigger={["click"]}
          >
            <Button icon={<MoreOutlined />} size="small" />
          </Dropdown>
        </div>
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

export default ExpiredUpdateTable;
