import React, { useState, useEffect } from "react";
import {
  Table,
  Space,
  Tag,
  Button,
  Tooltip,
  Popconfirm,
  Modal,
  Form,
  Input,
  Card,
  Spin,
  Typography,
  Pagination,
  Select,
  Row,
  InputNumber,
  Dropdown,
  Menu,
  Checkbox,
  message,
} from "antd";
import type { ColumnsType, ColumnType } from "antd/es/table";
import {
  HistoryOutlined,
  EditOutlined,
  DeleteOutlined,
  UndoOutlined,
  CloseCircleOutlined,
  DownOutlined,
  ExclamationCircleOutlined,
  FilterOutlined,
  EyeOutlined,
  StopOutlined,
  MoreOutlined,
  FormOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";
import dayjs from "dayjs";
import { TreatmentPlanResponseDTO } from "@/api/treatment-plan";
import PaginationFooter from "../shared/PaginationFooter";
import TableControls, {
  createDeleteBulkAction,
  createRestoreBulkAction,
} from "../shared/TableControls";

const { Text } = Typography;
const { Option } = Select;

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
  handleBulkDelete?: (ids: string[]) => void;
  handleBulkRestore?: (ids: string[]) => void;
  getAllTreatmentPlanIdsByStatus?: (statuses: string[]) => Promise<string[]>;
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
  columnVisibility,
  handleBulkDelete,
  handleBulkRestore,
  getAllTreatmentPlanIdsByStatus,
}) => {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();

  // State to track what type of items are selected (for bulk actions)
  const [selectedItemTypes, setSelectedItemTypes] = useState<{
    hasCompletedOrCancelled: boolean;
    hasSoftDeleted: boolean;
  }>({
    hasCompletedOrCancelled: false,
    hasSoftDeleted: false,
  });

  // For tracking selected option in dropdown
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Add loading state for when fetching all items
  const [isLoadingAllItems, setIsLoadingAllItems] = useState<boolean>(false);

  // Add loading states for action buttons
  const [deletingItems, setDeletingItems] = useState<boolean>(false);
  const [restoringItems, setRestoringItems] = useState<boolean>(false);

  // State to track cancellation reason
  const [cancellationReason, setCancellationReason] = useState<string>("");

  // Add a new state for cancel modal visibility
  const [cancelModalVisible, setCancelModalVisible] = useState<boolean>(false);
  const [currentRecord, setCurrentRecord] =
    useState<TreatmentPlanResponseDTO | null>(null);
  const [form] = Form.useForm();

  // Update selected item types when selectedRowKeys changes
  useEffect(() => {
    if (selectedRowKeys.length === 0) {
      setSelectedItemTypes({
        hasCompletedOrCancelled: false,
        hasSoftDeleted: false,
      });
      return;
    }

    const selectedPlans = treatmentPlans.filter((plan) =>
      selectedRowKeys.includes(plan.id)
    );

    const hasCompletedOrCancelled = selectedPlans.some(
      (plan) => plan.status === "Completed" || plan.status === "Cancelled"
    );

    const hasSoftDeleted = selectedPlans.some(
      (plan) => plan.status === "SoftDeleted"
    );

    setSelectedItemTypes({
      hasCompletedOrCancelled,
      hasSoftDeleted,
    });
  }, [selectedRowKeys, treatmentPlans]);

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

  // Function to check if a treatment plan can be selected based on its status
  const canSelectTreatmentPlan = (record: TreatmentPlanResponseDTO) => {
    // Allow selection of Completed and Cancelled plans (for soft delete)
    // and SoftDeleted plans (for restore)
    return (
      record.status === "Completed" ||
      record.status === "Cancelled" ||
      record.status === "SoftDeleted"
    );
  };

  // Get all treatment plan IDs with specific statuses
  const getItemIdsByStatus = async (
    statuses: string[],
    currentPageOnly: boolean = false
  ) => {
    if (currentPageOnly) {
      // If only current page, filter from current page data
      const filteredPlans = treatmentPlans.filter((plan) =>
        statuses.includes(plan.status || "")
      );
      return filteredPlans.map((plan) => plan.id);
    } else {
      // For all pages, use the API if available
      if (getAllTreatmentPlanIdsByStatus) {
        try {
          setIsLoadingAllItems(true);
          const allIds = await getAllTreatmentPlanIdsByStatus(statuses);
          setIsLoadingAllItems(false);
          return allIds;
        } catch (error) {
          console.error("Error fetching all items by status:", error);
          setIsLoadingAllItems(false);

          // Fallback to current page if API fails
          const filteredPlans = treatmentPlans.filter((plan) =>
            statuses.includes(plan.status || "")
          );
          return filteredPlans.map((plan) => plan.id);
        }
      } else {
        // Fallback if API is not provided
        console.warn(
          "getAllTreatmentPlanIdsByStatus not provided, falling back to current page"
        );
        const filteredPlans = treatmentPlans.filter((plan) =>
          statuses.includes(plan.status || "")
        );
        return filteredPlans.map((plan) => plan.id);
      }
    }
  };

  // Handle select all for specific statuses
  const handleSelectByStatus = async (key: string) => {
    // First check if this option is already selected
    if (selectedOption === key) {
      // If it is, deselect it and clear selections
      setSelectedOption(null);
      setSelectedRowKeys([]);
    } else {
      // Otherwise, select it and apply the selection
      setSelectedOption(key);

      switch (key) {
        case "all-completed-cancelled":
          // Select all Completed & Cancelled treatment plans
          const completedCancelledIds = await getItemIdsByStatus(
            ["Completed", "Cancelled"],
            false
          );
          setSelectedRowKeys(completedCancelledIds);
          break;
        case "all-soft-deleted":
          // Select all SoftDeleted treatment plans
          const softDeletedIds = await getItemIdsByStatus(
            ["SoftDeleted"],
            false
          );
          setSelectedRowKeys(softDeletedIds);
          break;
        case "page-completed-cancelled":
          // Select Completed & Cancelled treatment plans on current page
          const pageCompletedCancelledIds = await getItemIdsByStatus(
            ["Completed", "Cancelled"],
            true
          );
          setSelectedRowKeys(pageCompletedCancelledIds);
          break;
        case "page-soft-deleted":
          // Select SoftDeleted treatment plans on current page
          const pageSoftDeletedIds = await getItemIdsByStatus(
            ["SoftDeleted"],
            true
          );
          setSelectedRowKeys(pageSoftDeletedIds);
          break;
        default:
          break;
      }
    }
  };

  // Function to render the custom select all dropdown
  const renderSelectAll = () => {
    // Count plans by status
    const completedCancelledCount = treatmentPlans.filter(
      (plan) => plan.status === "Completed" || plan.status === "Cancelled"
    ).length;

    const softDeletedCount = treatmentPlans.filter(
      (plan) => plan.status === "SoftDeleted"
    ).length;

    // Count selectable plans
    const selectablePlans = treatmentPlans.filter((plan) =>
      canSelectTreatmentPlan(plan)
    );

    const isSelectAll =
      selectablePlans.length > 0 &&
      selectablePlans.every((plan) => selectedRowKeys.includes(plan.id));

    const isIndeterminate =
      selectedRowKeys.length > 0 &&
      !isSelectAll &&
      selectablePlans.some((plan) => selectedRowKeys.includes(plan.id));

    // Create dropdown menu items
    const items = [];

    // Remove estimated calculation since it's not what we want
    if (completedCancelledCount > 0) {
      items.push({
        key: "page-completed-cancelled",
        label: (
          <div
            className={
              selectedOption === "page-completed-cancelled"
                ? "ant-dropdown-menu-item-active"
                : ""
            }
          >
            Select all Completed & Cancelled on this page
          </div>
        ),
      });

      items.push({
        key: "all-completed-cancelled",
        label: (
          <div
            className={
              selectedOption === "all-completed-cancelled"
                ? "ant-dropdown-menu-item-active"
                : ""
            }
          >
            {isLoadingAllItems &&
            selectedOption === "all-completed-cancelled" ? (
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Spin size="small" />
                <span>Loading all Completed & Cancelled...</span>
              </div>
            ) : (
              <span>Select all Completed & Cancelled (all pages)</span>
            )}
          </div>
        ),
      });
    }

    if (softDeletedCount > 0) {
      items.push({
        key: "page-soft-deleted",
        label: (
          <div
            className={
              selectedOption === "page-soft-deleted"
                ? "ant-dropdown-menu-item-active"
                : ""
            }
          >
            Select all SoftDeleted on this page
          </div>
        ),
      });

      items.push({
        key: "all-soft-deleted",
        label: (
          <div
            className={
              selectedOption === "all-soft-deleted"
                ? "ant-dropdown-menu-item-active"
                : ""
            }
          >
            {isLoadingAllItems && selectedOption === "all-soft-deleted" ? (
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Spin size="small" />
                <span>Select all SoftDeleted (all pages)</span>
              </div>
            ) : (
              <span>Select all SoftDeleted (all pages)</span>
            )}
          </div>
        ),
      });
    }

    // Simplified select all toggle - just clears selection
    const handleSelectAllToggle = () => {
      // If anything is selected, clear the selection
      if (selectedRowKeys.length > 0) {
        setSelectedRowKeys([]);
        setSelectedOption(null);
      }
    };

    return (
      <>
        <Checkbox
          checked={isSelectAll}
          indeterminate={isIndeterminate}
          onChange={handleSelectAllToggle}
          disabled={selectablePlans.length === 0}
        />
        {items.length > 0 && (
          <Dropdown
            menu={{
              items,
              onClick: ({ key }) => handleSelectByStatus(key),
              // Keep dropdown open after selection
              selectable: true,
              selectedKeys: selectedOption ? [selectedOption] : [],
            }}
            placement="bottomLeft"
            trigger={["click"]}
          >
            <Button
              type="text"
              size="small"
              className="select-all-dropdown"
              style={{
                marginLeft: 0,
                padding: "0 4px",
                position: "absolute",
                top: "50%",
                transform: "translateY(-50%)",
                left: "22px",
              }}
            >
              <DownOutlined />
            </Button>
          </Dropdown>
        )}
      </>
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
    return status === "Completed" || status === "Cancelled";
  };

  const canRestoreTreatmentPlan = (status: string | undefined) => {
    return status === "SoftDeleted";
  };

  const renderActionButtons = (record: TreatmentPlanResponseDTO) => {
    return (
      <div style={{ textAlign: "center" }}>
        <Dropdown
          overlay={
            <Menu>
              {canEditTreatmentPlan(record.status) && (
                <Menu.Item
                  key="edit"
                  icon={<FormOutlined />}
                  onClick={() => router.push(`/treatment-plan/${record.id}`)}
                >
                  Edit
                </Menu.Item>
              )}

              {canCancelTreatmentPlan(record.status) && (
                <Menu.Item
                  key="cancel"
                  icon={<CloseCircleOutlined />}
                  danger
                  onClick={() => {
                    // Set the current record and open the modal
                    setCurrentRecord(record);
                    setCancelModalVisible(true);
                    // Reset form
                    form.resetFields();
                  }}
                >
                  Cancel
                </Menu.Item>
              )}

              {canSoftDeleteTreatmentPlan(record.status) && (
                <Menu.Item key="delete" icon={<DeleteOutlined />} danger>
                  <Popconfirm
                    title="Soft Delete Treatment Plan"
                    description="Are you sure you want to soft delete this treatment plan?"
                    onConfirm={() => handleSoftDelete(record.id)}
                    okText="Yes"
                    cancelText="No"
                    placement="topLeft"
                  >
                    <div style={{ width: "100%" }}>Soft Delete</div>
                  </Popconfirm>
                </Menu.Item>
              )}

              {canRestoreTreatmentPlan(record.status) && (
                <Menu.Item key="restore" icon={<UndoOutlined />}>
                  <Popconfirm
                    title="Restore Treatment Plan"
                    description="Are you sure you want to restore this treatment plan?"
                    onConfirm={() => handleRestore(record.id)}
                    okText="Yes"
                    cancelText="No"
                    placement="topLeft"
                  >
                    <div style={{ width: "100%" }}>Restore</div>
                  </Popconfirm>
                </Menu.Item>
              )}
            </Menu>
          }
          placement="bottomCenter"
        >
          <Button icon={<MoreOutlined />} size="small" />
        </Dropdown>
      </div>
    );
  };

  // Define table columns
  const columns: ColumnsType<TreatmentPlanResponseDTO> = [
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          TREATMENT PLAN CODE
        </span>
      ),
      dataIndex: "treatmentPlanCode",
      key: "treatmentPlanCode",
      fixed: "left",
      width: 180,
      render: (text: string, record: TreatmentPlanResponseDTO) => (
        <Button
          type="link"
          onClick={() => router.push(`/treatment-plan/${record.id}`)}
          style={{ padding: 0 }}
        >
          {text}
        </Button>
      ),
    },
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          HEALTH CHECK RESULT
        </span>
      ),
      dataIndex: "healthCheckResult",
      key: "healthCheckResult",
      render: (healthCheckResult: any) => (
        <Tooltip title={renderPatientInfo(healthCheckResult)}>
          <Button
            type="link"
            onClick={() =>
              healthCheckResult?.id &&
              router.push(`/health-check-result/${healthCheckResult.id}`)
            }
            style={{ padding: 0 }}
          >
            {healthCheckResult?.healthCheckResultCode}
          </Button>
        </Tooltip>
      ),
    },
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          DRUG
        </span>
      ),
      dataIndex: "drug",
      key: "drug",
      render: (drug: any) => renderDrugInfo(drug),
    },
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          TREATMENT DESCRIPTION
        </span>
      ),
      dataIndex: "treatmentDescription",
      key: "treatmentDescription",
      ellipsis: true,
    },
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          INSTRUCTIONS
        </span>
      ),
      dataIndex: "instructions",
      key: "instructions",
      ellipsis: true,
    },
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          START DATE
        </span>
      ),
      dataIndex: "startDate",
      key: "startDate",
      render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          END DATE
        </span>
      ),
      dataIndex: "endDate",
      key: "endDate",
      render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          STATUS
        </span>
      ),
      dataIndex: "status",
      key: "status",
      align: "center" as const,
      render: (status: string) => (
        <div style={{ display: "flex", justifyContent: "center" }}>
          {renderStatusTag(status)}
        </div>
      ),
    },
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          CREATED AT
        </span>
      ),
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => dayjs(date).format("DD/MM/YYYY HH:mm:ss"),
    },
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          UPDATED AT
        </span>
      ),
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (date: string) =>
        date ? dayjs(date).format("DD/MM/YYYY HH:mm:ss") : "N/A",
    },
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          CREATED BY
        </span>
      ),
      dataIndex: "createdBy",
      key: "createdBy",
      render: (createdBy: any) => (
        <div>
          {createdBy?.fullName || ""}
          {createdBy?.email && (
            <div>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                {createdBy.email}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          UPDATED BY
        </span>
      ),
      dataIndex: "updatedBy",
      key: "updatedBy",
      render: (updatedBy: any) => (
        <div>
          {updatedBy?.fullName || "N/A"}
          {updatedBy?.email && (
            <div>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                {updatedBy.email}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          ACTIONS
        </span>
      ),
      key: "actions",
      fixed: "right",
      width: 120,
      align: "center" as const,
      render: (record: TreatmentPlanResponseDTO) => renderActionButtons(record),
    },
  ];

  // Filter columns based on visibility settings
  const visibleColumns = columns.filter((column) => {
    // Check visibility for all columns including actions
    return columnVisibility[column.key as keyof typeof columnVisibility];
  });

  if (loading) {
    return (
      <Card className="shadow-sm">
        <div
          style={{ display: "flex", justifyContent: "center", padding: "40px" }}
        >
          <Spin tip="Loading..." />
        </div>
      </Card>
    );
  }

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(selectedRowKeys as string[]);
    },
    fixed: true,
    getCheckboxProps: (record: TreatmentPlanResponseDTO) => ({
      disabled: !canSelectTreatmentPlan(record),
      // Add a title to explain why checkbox is disabled
      title: !canSelectTreatmentPlan(record)
        ? "Only treatment plans with status 'Completed', 'Cancelled', or 'SoftDeleted' can be selected"
        : "",
    }),
    columnTitle: renderSelectAll(),
  };

  return (
    <>
      {contextHolder}

      {/* Using the new TableControls component */}
      <TableControls
        selectedRowKeys={selectedRowKeys}
        pageSize={pageSize}
        onPageSizeChange={(newSize) => handlePageChange(1, newSize)}
        bulkActions={[
          // Only include delete action if handleBulkDelete is provided
          ...(handleBulkDelete
            ? [
                createDeleteBulkAction(
                  selectedRowKeys.length,
                  deletingItems,
                  async () => {
                    setDeletingItems(true);
                    try {
                      await handleBulkDelete(selectedRowKeys);
                    } finally {
                      setDeletingItems(false);
                    }
                  },
                  selectedItemTypes.hasCompletedOrCancelled
                ),
              ]
            : []),
          // Only include restore action if handleBulkRestore is provided
          ...(handleBulkRestore
            ? [
                createRestoreBulkAction(
                  selectedRowKeys.length,
                  restoringItems,
                  async () => {
                    setRestoringItems(true);
                    try {
                      await handleBulkRestore(selectedRowKeys);
                    } finally {
                      setRestoringItems(false);
                    }
                  },
                  selectedItemTypes.hasSoftDeleted
                ),
              ]
            : []),
        ]}
        maxRowsPerPage={100}
        pageSizeOptions={[5, 10, 15, 20, 50, 100]}
      />

      <Card className="shadow-sm" bodyStyle={{ padding: "16px" }}>
        <div style={{ overflowX: "auto" }}>
          <Table
            rowSelection={rowSelection}
            columns={visibleColumns}
            dataSource={treatmentPlans}
            rowKey="id"
            loading={loading}
            pagination={false}
            scroll={{ x: "max-content" }}
            bordered
          />
        </div>

        {/* Using the reusable PaginationFooter component */}
        <PaginationFooter
          current={currentPage}
          pageSize={pageSize}
          total={totalItems}
          onChange={handlePageChange}
          showGoToPage={true}
          showTotal={true}
        />
      </Card>

      {/* Custom Cancel Modal */}
      <Modal
        title="Cancel Treatment Plan"
        open={cancelModalVisible}
        onCancel={() => setCancelModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setCancelModalVisible(false)}>
            No
          </Button>,
          <Button
            key="submit"
            type="primary"
            danger
            onClick={() => {
              form.validateFields().then((values) => {
                if (currentRecord) {
                  // Invoke handleCancel which returns a Promise
                  // Create a Promise wrapper to ensure proper handling
                  const cancelPromise = async () => {
                    try {
                      await handleCancel(currentRecord.id, values.cancelReason);
                      setCancelModalVisible(false);
                      form.resetFields();
                      setCurrentRecord(null);
                    } catch (error: unknown) {
                      console.error("Error cancelling treatment plan:", error);
                    }
                  };

                  // Execute the promise function
                  cancelPromise();
                }
              });
            }}
          >
            Cancel Plan
          </Button>,
        ]}
      >
        <p style={{ marginBottom: "16px" }}>
          Are you sure you want to cancel this treatment plan?
        </p>
        <Form form={form}>
          <Form.Item
            name="cancelReason"
            rules={[
              {
                required: true,
                message: "Please enter a reason for cancellation",
              },
              { min: 5, message: "Reason must be at least 5 characters" },
            ]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Please enter reason for cancellation"
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default TreatmentPlanTable;
