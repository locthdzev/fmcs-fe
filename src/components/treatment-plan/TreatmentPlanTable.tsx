import React from "react";
import { Table, Space, Tag, Button, Tooltip, Popconfirm, Modal, Form, Input, Card, Spin, Typography, Pagination } from "antd";
import { 
  HistoryOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  UndoOutlined, 
  CloseCircleOutlined 
} from "@ant-design/icons";
import { useRouter } from "next/router";
import dayjs from "dayjs";
import { TreatmentPlanResponseDTO } from "@/api/treatment-plan";

const { Text } = Typography;

interface TreatmentPlanTableProps {
  loading: boolean;
  treatmentPlans: TreatmentPlanResponseDTO[];
  totalItems: number;
  currentPage: number;
  pageSize: number;
  handlePageChange: (page: number, pageSize?: number) => void;
  selectedRowKeys: string[];
  setSelectedRowKeys: (keys: string[]) => void;
  handleSoftDelete: (id: string) => void;
  handleRestore: (id: string) => void;
  handleCancel: (id: string, reason: string) => void;
  columnVisibility: Record<string, boolean>;
}

const TreatmentPlanTable: React.FC<TreatmentPlanTableProps> = ({
  loading,
  treatmentPlans,
  totalItems,
  currentPage,
  pageSize,
  handlePageChange,
  selectedRowKeys,
  setSelectedRowKeys,
  handleSoftDelete,
  handleRestore,
  handleCancel,
  columnVisibility
}) => {
  const router = useRouter();

  // Helper functions
  const renderStatusTag = (status: string | undefined) => {
    const statusColors = {
      InProgress: "processing",
      Completed: "success",
      Cancelled: "error",
      SoftDeleted: "warning",
    };

    return (
      <Tag
        color={statusColors[status as keyof typeof statusColors] || "default"}
      >
        {status}
      </Tag>
    );
  };

  const renderUserInfo = (user: any) => {
    if (!user) return "";
    return `${user.fullName} (${user.email})`;
  };

  const renderPatientInfo = (healthCheckResult: any) => {
    if (!healthCheckResult?.user) return "";
    return `${healthCheckResult.user.fullName} (${healthCheckResult.user.email})`;
  };

  const renderDrugInfo = (drug: any) => {
    if (!drug) return "";
    return `${drug.name} (${drug.drugCode})`;
  };

  const canEditTreatmentPlan = (status: string | undefined) => {
    return status === "InProgress";
  };

  const canCancelTreatmentPlan = (status: string | undefined) => {
    return status === "InProgress";
  };

  const canSoftDeleteTreatmentPlan = (status: string | undefined) => {
    return status === "InProgress" || status === "Completed";
  };

  const canRestoreTreatmentPlan = (status: string | undefined) => {
    return status === "SoftDeleted";
  };

  const renderActionButtons = (record: TreatmentPlanResponseDTO) => {
    return (
      <Space>
        <Tooltip title="View Details">
          <Button
            type="text"
            icon={<HistoryOutlined />}
            onClick={() => router.push(`/treatment-plan/${record.id}`)}
          />
        </Tooltip>

        {canEditTreatmentPlan(record.status) && (
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => router.push(`/treatment-plan/${record.id}`)}
            />
          </Tooltip>
        )}

        {canCancelTreatmentPlan(record.status) && (
          <Tooltip title="Cancel">
            <Popconfirm
              title="Cancel Treatment Plan"
              description="Are you sure you want to cancel this treatment plan?"
              onConfirm={() => {
                Modal.confirm({
                  title: "Enter Cancellation Reason",
                  content: (
                    <Form>
                      <Form.Item
                        name="reason"
                        rules={[
                          { required: true, message: "Please enter a reason" },
                        ]}
                      >
                        <Input.TextArea rows={4} />
                      </Form.Item>
                    </Form>
                  ),
                  onOk: async (close) => {
                    const reason = (
                      document.querySelector(
                        ".ant-modal-content textarea"
                      ) as HTMLTextAreaElement
                    ).value;
                    await handleCancel(record.id, reason);
                    close();
                  },
                });
              }}
            >
              <Button type="text" danger icon={<CloseCircleOutlined />} />
            </Popconfirm>
          </Tooltip>
        )}

        {canSoftDeleteTreatmentPlan(record.status) && (
          <Tooltip title="Soft Delete">
            <Popconfirm
              title="Soft Delete Treatment Plan"
              description="Are you sure you want to soft delete this treatment plan?"
              onConfirm={() => handleSoftDelete(record.id)}
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        )}

        {canRestoreTreatmentPlan(record.status) && (
          <Tooltip title="Restore">
            <Popconfirm
              title="Restore Treatment Plan"
              description="Are you sure you want to restore this treatment plan?"
              onConfirm={() => handleRestore(record.id)}
            >
              <Button type="text" icon={<UndoOutlined />} />
            </Popconfirm>
          </Tooltip>
        )}
      </Space>
    );
  };

  // Define table columns
  const columns = [
    {
      title: "Treatment Plan Code",
      dataIndex: "treatmentPlanCode",
      key: "treatmentPlanCode",
      render: (text: string, record: TreatmentPlanResponseDTO) => (
        <a onClick={() => router.push(`/treatment-plan/${record.id}`)}>
          {text}
        </a>
      ),
    },
    {
      title: "Health Check Result",
      dataIndex: "healthCheckResult",
      key: "healthCheckResult",
      render: (healthCheckResult: any) => (
        <Tooltip title={renderPatientInfo(healthCheckResult)}>
          <a
            onClick={() =>
              healthCheckResult?.id &&
              router.push(`/health-check-result/${healthCheckResult.id}`)
            }
          >
            {healthCheckResult?.healthCheckResultCode}
          </a>
        </Tooltip>
      ),
    },
    {
      title: "Drug",
      dataIndex: "drug",
      key: "drug",
      render: (drug: any) => renderDrugInfo(drug),
    },
    {
      title: "Treatment Description",
      dataIndex: "treatmentDescription",
      key: "treatmentDescription",
      ellipsis: true,
    },
    {
      title: "Instructions",
      dataIndex: "instructions",
      key: "instructions",
      ellipsis: true,
    },
    {
      title: "Start Date",
      dataIndex: "startDate",
      key: "startDate",
      render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "End Date",
      dataIndex: "endDate",
      key: "endDate",
      render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => renderStatusTag(status),
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => dayjs(date).format("DD/MM/YYYY HH:mm:ss"),
    },
    {
      title: "Updated At",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (date: string) => dayjs(date).format("DD/MM/YYYY HH:mm:ss"),
    },
    {
      title: "Created By",
      dataIndex: "createdBy",
      key: "createdBy",
      render: (createdBy: any) => (
        <Tooltip title={renderUserInfo(createdBy)}>
          {createdBy?.fullName || ""}
        </Tooltip>
      ),
    },
    {
      title: "Updated By",
      dataIndex: "updatedBy",
      key: "updatedBy",
      render: (updatedBy: any) => (
        <Tooltip title={renderUserInfo(updatedBy)}>
          {updatedBy?.fullName || ""}
        </Tooltip>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (record: TreatmentPlanResponseDTO) => renderActionButtons(record),
    },
  ];

  // Filter columns based on visibility settings
  const visibleColumns = columns.filter((column) => {
    // Always show the Actions column
    if (column.key === "actions") return true;
    // Check visibility for other columns
    return columnVisibility[column.key as keyof typeof columnVisibility];
  });

  if (loading) {
    return (
      <Card className="shadow-sm">
        <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
          <Spin tip="Loading..." />
        </div>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <Table
        rowSelection={{
          type: "checkbox",
          selectedRowKeys,
          onChange: (selectedRowKeys) => {
            setSelectedRowKeys(selectedRowKeys as string[]);
          },
        }}
        columns={visibleColumns}
        dataSource={treatmentPlans}
        rowKey="id"
        loading={false}
        pagination={false}
      />
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={totalItems}
          onChange={handlePageChange}
          showSizeChanger
          pageSizeOptions={['5', '10', '15', '20']}
          showTotal={(total) => `Total ${total} items`}
        />
      </div>
    </Card>
  );
};

export default TreatmentPlanTable; 