import React, { useState, useEffect } from "react";
import {
  Typography,
  Card,
  Descriptions,
  Button,
  Tag,
  Spin,
  message,
  Divider,
  Space,
  Row,
  Col,
  Statistic,
  Alert,
  Result,
  Timeline,
  Empty,
} from "antd";
import {
  DatabaseOutlined,
  EditOutlined,
  ArrowLeftOutlined,
  ReloadOutlined,
  WarningOutlined,
  HistoryOutlined,
  PlusOutlined,
  FormOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";
import dayjs from "dayjs";

import PageContainer from "../shared/PageContainer";
import EditInventoryRecordModal from "./EditInventoryRecordModal";
import {
  InventoryRecordResponseDTO,
  getInventoryRecordById,
} from "@/api/inventoryrecord";
import {
  InventoryHistoryResponseDTO,
  getInventoryHistoriesByInventoryRecordId,
} from "@/api/inventoryhistory";

const { Title, Text } = Typography;

interface InventoryRecordDetailsProps {
  id: string;
}

const InventoryRecordDetails: React.FC<InventoryRecordDetailsProps> = ({
  id,
}) => {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState<boolean>(true);
  const [historyLoading, setHistoryLoading] = useState<boolean>(true);
  const [record, setRecord] = useState<InventoryRecordResponseDTO | null>(null);
  const [histories, setHistories] = useState<InventoryHistoryResponseDTO[]>([]);
  const [isEditModalVisible, setIsEditModalVisible] = useState<boolean>(false);

  // Calculate if quantity is below reorder level
  const isBelowReorderLevel = record
    ? record.quantityInStock < record.reorderLevel
    : false;

  useEffect(() => {
    if (id) {
      fetchInventoryRecord();
      fetchInventoryHistories();
    }
  }, [id]);

  const fetchInventoryRecord = async () => {
    try {
      setLoading(true);
      console.log(`Fetching inventory record with ID: ${id}`);

      const response = await getInventoryRecordById(id);
      console.log("API Response:", response);

      if (response.isSuccess && response.data) {
        console.log("Setting record:", response.data);
        setRecord(response.data);
      } else {
        console.error(
          "API returned error:",
          response.message || "Unknown error"
        );
        messageApi.error({
          content:
            response.message || "Failed to fetch inventory record details",
          duration: 5,
        });
      }
    } catch (error) {
      console.error("Error fetching inventory record:", error);
      messageApi.error({
        content: "An error occurred while fetching inventory record details",
        duration: 5,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryHistories = async () => {
    try {
      setHistoryLoading(true);
      const data = await getInventoryHistoriesByInventoryRecordId(id);
      if (data) {
        // Sort histories by changeDate (newest first)
        const sortedHistories = data.sort(
          (a: InventoryHistoryResponseDTO, b: InventoryHistoryResponseDTO) =>
            new Date(b.changeDate).getTime() - new Date(a.changeDate).getTime()
        );
        setHistories(sortedHistories);
      }
    } catch (error) {
      console.error("Error fetching inventory histories:", error);
      messageApi.error({
        content: "Failed to load inventory history",
        duration: 5,
      });
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleBack = () => {
    router.push("/inventory-record");
  };

  const handleEdit = () => {
    setIsEditModalVisible(true);
  };

  const getStatusTag = (status: string | undefined) => {
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

  // Format date/time for display
  const formatDateTime = (dateTime: string) => {
    return dayjs(dateTime).format("DD/MM/YYYY HH:mm:ss");
  };

  // Get color for timeline based on change type
  const getChangeTypeColor = (changeType: string) => {
    const colors: Record<string, string> = {
      Received: "green",
      Added: "blue",
      Adjusted: "orange",
      Returned: "cyan",
      Removed: "red",
    };
    return colors[changeType] || "gray";
  };

  // Get icon for timeline based on change type
  const getChangeTypeIcon = (changeType: string) => {
    const icons: Record<string, React.ReactNode> = {
      Received: <PlusOutlined />,
      Added: <PlusOutlined />,
      Adjusted: <FormOutlined />,
      Returned: <CheckCircleOutlined />,
      Removed: <CloseCircleOutlined />,
    };
    return icons[changeType] || <HistoryOutlined />;
  };

  if (loading) {
    return (
      <PageContainer
        title="Inventory Record Details"
        icon={<DatabaseOutlined style={{ fontSize: "24px" }} />}
        onBack={handleBack}
      >
        {contextHolder}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "100px 0",
          }}
        >
          <Spin size="large" tip="Loading inventory record details..." />
        </div>
      </PageContainer>
    );
  }

  if (!record) {
    return (
      <PageContainer
        title="Inventory Record Not Found"
        icon={<DatabaseOutlined style={{ fontSize: "24px" }} />}
        onBack={handleBack}
      >
        {contextHolder}
        <Card>
          <Result
            status="404"
            title="Inventory Record Not Found"
            subTitle="The requested inventory record does not exist or has been removed."
            extra={
              <Button type="primary" onClick={handleBack}>
                Back to Inventory List
              </Button>
            }
          />
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Inventory Record Details"
      icon={<DatabaseOutlined style={{ fontSize: "24px" }} />}
      onBack={handleBack}
      rightContent={
        <Space>
          <Button type="primary" icon={<EditOutlined />} onClick={handleEdit}>
            Edit Reorder Level
          </Button>
        </Space>
      }
    >
      {contextHolder}

      <Card className="shadow-sm" style={{ marginBottom: "16px" }}>
        <Row gutter={[24, 16]}>
          <Col xs={24} sm={24} md={16}>
            <Descriptions
              title={
                <Space>
                  <Text style={{ fontSize: "16px", fontWeight: "bold" }}>
                    Basic Information
                  </Text>
                </Space>
              }
              bordered
              column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
            >
              <Descriptions.Item label="Batch Code">
                <Text strong>{record.batchCode}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Drug">
                <Text>{record.drug.name}</Text>
                <br />
                <Text type="secondary">{record.drug.drugCode}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                {record.status ? getStatusTag(record.status) : "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Created At">
                {record.createdAt
                  ? dayjs(record.createdAt).format("DD/MM/YYYY HH:mm:ss")
                  : "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Last Updated">
                {record.lastUpdated
                  ? dayjs(record.lastUpdated).format("DD/MM/YYYY HH:mm:ss")
                  : "N/A"}
              </Descriptions.Item>
            </Descriptions>
          </Col>
          <Col xs={24} sm={24} md={8}>
            <Card
              title="Inventory Status"
              bordered={false}
              style={{ height: "100%" }}
            >
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic
                    title="In Stock"
                    value={record.quantityInStock}
                    valueStyle={{
                      color: isBelowReorderLevel ? "#ff4d4f" : "#3f8600",
                    }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Reorder Level"
                    value={record.reorderLevel}
                  />
                </Col>
              </Row>
              {isBelowReorderLevel && (
                <div style={{ marginTop: "16px" }}>
                  <Alert
                    type="warning"
                    showIcon
                    icon={<WarningOutlined />}
                    message="Low Stock Alert"
                    description="Current quantity is below the reorder level. Consider restocking this item soon."
                  />
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </Card>

      {/* History Timeline Card */}
      <Card
        title={<span style={{ fontWeight: "bold" }}>History Timeline</span>}
        style={{ marginBottom: "16px" }}
        loading={historyLoading}
      >
        {histories.length === 0 && !historyLoading ? (
          <Empty description="No history records found for this inventory record" />
        ) : (
          <Timeline
            mode="left"
            items={histories.map((history) => ({
              color: getChangeTypeColor(history.changeType),
              dot: getChangeTypeIcon(history.changeType),
              children: (
                <Card
                  size="small"
                  className="mb-2 hover:shadow-md transition-shadow"
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ fontWeight: 500 }}>
                        {history.changeType}
                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                          color: "#8c8c8c",
                        }}
                      >
                        {formatDateTime(history.changeDate)}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr",
                        gap: "4px",
                      }}
                    >
                      <div style={{ display: "flex" }}>
                        <div
                          style={{
                            width: "180px",
                            color: "#8c8c8c",
                          }}
                        >
                          Performed by:
                        </div>
                        <div>{history.userName}</div>
                      </div>

                      {history.previousQuantity !== history.newQuantity && (
                        <div style={{ display: "flex" }}>
                          <div
                            style={{
                              width: "180px",
                              color: "#8c8c8c",
                            }}
                          >
                            Quantity:
                          </div>
                          <div>
                            <Tag color="default">
                              {history.previousQuantity}
                            </Tag>
                            <Text type="secondary"> → </Text>
                            <Tag color="blue">{history.newQuantity}</Tag>
                          </div>
                        </div>
                      )}

                      {history.remarks && (
                        <div style={{ display: "flex" }}>
                          <div
                            style={{
                              width: "180px",
                              color: "#8c8c8c",
                            }}
                          >
                            Remarks:
                          </div>
                          <div>{history.remarks}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ),
            }))}
          />
        )}
      </Card>

      {/* Edit Modal */}
      {record && (
        <EditInventoryRecordModal
          visible={isEditModalVisible}
          record={record}
          onClose={() => setIsEditModalVisible(false)}
          onSuccess={fetchInventoryRecord}
        />
      )}
    </PageContainer>
  );
};

export default InventoryRecordDetails;
