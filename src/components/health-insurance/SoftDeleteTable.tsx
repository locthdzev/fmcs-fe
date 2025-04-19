import React from "react";
import { Table, Button, Space, Tooltip, Modal, message } from "antd";
import {
  UndoOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";
import dayjs from "dayjs";

import {
  HealthInsuranceResponseDTO,
  restoreHealthInsurance,
} from "@/api/healthinsurance";

interface SoftDeleteTableProps {
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

const SoftDeleteTable: React.FC<SoftDeleteTableProps> = ({
  loading,
  insurances,
  selectedRowKeys,
  setSelectedRowKeys,
  columnVisibility,
  refreshData,
}) => {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();

  const handleRestore = (id: string) => {
    Modal.confirm({
      title: "Are you sure you want to restore this health insurance?",
      icon: <ExclamationCircleOutlined />,
      content: "This will make the record active again.",
      onOk: async () => {
        try {
          const result = await restoreHealthInsurance(id);
          if (result.isSuccess) {
            messageApi.success("Health insurance restored successfully");
            refreshData();
          } else {
            messageApi.error(result.message || "Failed to restore health insurance");
          }
        } catch (error) {
          messageApi.error("Failed to restore health insurance");
          console.error("Error restoring health insurance:", error);
        }
      },
    });
  };

  const renderUserInfo = (user: any) => {
    if (!user) return "";
    return `${user.fullName} (${user.email})`;
  };

  const renderUserInfoSimple = (user: any) => {
    if (!user) return "";
    return `${user.userName || ""} (${user.email || ""})`;
  };

  const formatDateTime = (dateStr: string | undefined) => {
    if (!dateStr) return "-";
    return dayjs(dateStr).format("DD/MM/YYYY HH:mm:ss");
  };

  const columns = [
    {
      title: "OWNER",
      dataIndex: ["user"],
      key: "owner",
      render: renderUserInfo,
      hidden: !columnVisibility.owner,
    },
    {
      title: "CREATED AT",
      dataIndex: "createdAt",
      key: "createdAt",
      render: formatDateTime,
      hidden: !columnVisibility.createdAt,
    },
    {
      title: "CREATED BY",
      dataIndex: "createdBy",
      key: "createdBy",
      render: renderUserInfoSimple,
      hidden: !columnVisibility.createdBy,
    },
    {
      title: "STATUS",
      dataIndex: "status",
      key: "status",
      hidden: !columnVisibility.status,
    },
    {
      title: "UPDATED AT",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: formatDateTime,
      hidden: !columnVisibility.updatedAt,
    },
    {
      title: "UPDATED BY",
      dataIndex: "updatedBy",
      key: "updatedBy",
      render: renderUserInfoSimple,
      hidden: !columnVisibility.updatedBy,
    },
    {
      title: "ACTIONS",
      key: "actions",
      render: (record: HealthInsuranceResponseDTO) => (
        <Space size="small">
          <Tooltip title="Restore">
            <Button
              type="text"
              icon={<UndoOutlined />}
              onClick={() => handleRestore(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ].filter(column => !column.hidden);

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => {
      setSelectedRowKeys(keys);
    },
  };

  return (
    <>
      {contextHolder}
      <Table
        rowKey="id"
        dataSource={insurances}
        columns={columns}
        rowSelection={rowSelection}
        loading={loading}
        pagination={false}
        scroll={{ x: "max-content" }}
      />
    </>
  );
};

export default SoftDeleteTable;
