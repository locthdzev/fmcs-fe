import React, { useState } from "react";
import {
  Table,
  Button,
  Space,
  Tooltip,
  Modal,
  message,
  Card,
  Dropdown,
  Popconfirm,
} from "antd";
import {
  EditOutlined,
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
  getHealthInsuranceById,
} from "@/api/healthinsurance";
import HealthInsuranceEditModal from "./HealthInsuranceEditModal";
import { getStatusTag } from "@/utils/statusTagUtils";

interface InitialTableProps {
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

const InitialTable: React.FC<InitialTableProps> = ({
  loading,
  insurances,
  selectedRowKeys,
  setSelectedRowKeys,
  columnVisibility,
  refreshData,
}) => {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedInsurance, setSelectedInsurance] =
    useState<HealthInsuranceResponseDTO | null>(null);

  const handleEditInsurance = async (id: string) => {
    try {
      const response = await getHealthInsuranceById(id);
      if (response.isSuccess && response.data) {
        setSelectedInsurance(response.data);
        setEditModalVisible(true);
      } else {
        messageApi.error("Failed to fetch insurance details");
      }
    } catch (error) {
      messageApi.error("Failed to fetch insurance details");
      console.error("Error fetching insurance details:", error);
    }
  };

  const handleEditSuccess = () => {
    refreshData();
    messageApi.success("Health insurance updated successfully");
  };

  const handleSoftDelete = async (id: string) => {
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
        <span style={{ fontSize: "12px", color: "#888" }}>
          {user.email || ""}
        </span>
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
                  key: "edit",
                  icon: <EditOutlined />,
                  label: "Edit",
                  onClick: () => handleEditInsurance(record.id),
                },
                {
                  key: "delete",
                  icon: <DeleteOutlined />,
                  label: (
                    <Popconfirm
                      title="Are you sure you want to delete this record?"
                      onConfirm={() => handleSoftDelete(record.id)}
                      okText="Yes"
                      cancelText="No"
                      icon={<QuestionCircleOutlined style={{ color: "red" }} />}
                    >
                      <span>Soft Delete</span>
                    </Popconfirm>
                  ),
                  danger: true,
                },
              ],
            }}
          >
            <Button icon={<MoreOutlined />} size="small" />
          </Dropdown>
        </div>
      ),
    },
  ].filter((column) => column.key === "actions" || !column.hidden);

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
            scroll={{ x: "max-content" }}
            size="middle"
            sticky
            bordered
          />
        </div>

        {editModalVisible && selectedInsurance && (
          <HealthInsuranceEditModal
            visible={editModalVisible}
            insurance={selectedInsurance}
            onClose={() => setEditModalVisible(false)}
            onSuccess={handleEditSuccess}
            isAdmin={true}
          />
        )}
      </Card>
    </>
  );
};

export default InitialTable;
