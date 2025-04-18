import React, { useEffect } from "react";
import {
  Modal,
  Form,
  InputNumber,
  Button,
  message,
  Alert,
  Divider,
  Typography,
  Space,
  Row,
  Col,
  Tag,
  Card,
} from "antd";
import {
  InventoryRecordResponseDTO,
  updateInventoryRecord,
} from "@/api/inventoryrecord";
import {
  InfoCircleOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";

const { Text, Title } = Typography;

interface EditInventoryRecordModalProps {
  visible: boolean;
  record: InventoryRecordResponseDTO;
  onClose: () => void;
  onSuccess: () => void;
}

const EditInventoryRecordModal: React.FC<EditInventoryRecordModalProps> = ({
  visible,
  record,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = React.useState(false);
  const [currentReorderLevel, setCurrentReorderLevel] = React.useState<
    number | null
  >(null);

  // Calculate if the current inventory is below reorder level
  const isBelowReorderLevel = record?.quantityInStock < record?.reorderLevel;

  // Calculate if the current inventory will be below the new reorder level
  const willBeBelowReorderLevel =
    currentReorderLevel !== null &&
    record?.quantityInStock < currentReorderLevel;

  useEffect(() => {
    if (record) {
      form.setFieldsValue({ reorderLevel: record.reorderLevel });
      setCurrentReorderLevel(record.reorderLevel);
    }
  }, [record, form]);

  const handleSubmit = async (values: { reorderLevel: number }) => {
    try {
      setLoading(true);
      const response = await updateInventoryRecord(record.id, {
        reorderLevel: values.reorderLevel,
      });
      if (response.isSuccess) {
        messageApi.success({
          content: "Inventory record updated successfully!",
          duration: 5,
        });
        onSuccess();
        onClose();
      } else {
        messageApi.error({
          content: response.message || "Failed to update inventory record",
          duration: 5,
        });
      }
    } catch (error) {
      console.error("Error updating inventory record:", error);
      messageApi.error({
        content: "Failed to update inventory record",
        duration: 5,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <Title level={4} style={{ margin: 0 }}>
          Edit Reorder Level
        </Title>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={() => form.submit()}
        >
          Update
        </Button>,
      ]}
    >
      {contextHolder}

      <Alert
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        message="About Reorder Level"
        description={
          <Text>
            The reorder level is the minimum quantity threshold that triggers a
            notification to restock this item. When the quantity in stock falls
            below this level, the system will mark this record with "Priority"
            status.
          </Text>
        }
        style={{ marginBottom: 16 }}
      />

      <Divider orientation="left">Inventory Details</Divider>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card
            bordered={false}
            style={{ background: "#f5f5f5", padding: "16px" }}
          >
            <Row gutter={[24, 16]}>
              <Col span={6}>
                <Text strong>Drug:</Text>
                <div>
                  <Text>{record?.drug?.name}</Text>
                  <br />
                  <Text type="secondary">{record?.drug?.drugCode}</Text>
                </div>
              </Col>

              <Col span={6}>
                <Text strong>Batch Code:</Text>
                <div>
                  <Text>{record?.batchCode}</Text>
                </div>
              </Col>

              <Col span={6}>
                <Text strong>Status:</Text>
                <div>
                  <Tag
                    color={
                      record?.status === "Priority"
                        ? "geekblue"
                        : record?.status === "Active"
                        ? "green"
                        : record?.status === "NearExpiry"
                        ? "orange"
                        : record?.status === "Inactive"
                        ? "volcano"
                        : record?.status === "Expired"
                        ? "red"
                        : "default"
                    }
                  >
                    {record?.status === "NearExpiry"
                      ? "Near Expiry"
                      : record?.status}
                  </Tag>
                </div>
              </Col>

              <Col span={6}>
                <Text strong>Quantity in Stock:</Text>
                <div>
                  <Text
                    style={{
                      color: isBelowReorderLevel ? "#ff4d4f" : "inherit",
                      fontWeight: isBelowReorderLevel ? "bold" : "normal",
                    }}
                  >
                    {record?.quantityInStock}
                    {isBelowReorderLevel && (
                      <WarningOutlined style={{ marginLeft: 8 }} />
                    )}
                  </Text>
                  {isBelowReorderLevel && (
                    <div>
                      <Text type="danger">
                        Below current reorder level ({record?.reorderLevel})
                      </Text>
                    </div>
                  )}
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Divider orientation="left">Update Reorder Level</Divider>

      {currentReorderLevel !== null &&
        (currentReorderLevel < record?.quantityInStock ? (
          <Alert
            type="success"
            showIcon
            message="Sufficient Stock"
            description="The current quantity is above the new reorder level."
            style={{ marginBottom: 16 }}
          />
        ) : (
          <Alert
            type="warning"
            showIcon
            icon={<ExclamationCircleOutlined />}
            message="Low Stock Alert"
            description="Current quantity is below the reorder level. Consider restocking this item soon."
            style={{ marginBottom: 16 }}
          />
        ))}

      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <Form.Item
          name="reorderLevel"
          label={<Text strong>Reorder Level</Text>}
          rules={[
            { required: true, message: "Please enter reorder level" },
            {
              type: "number",
              min: 0,
              message: "Reorder level must be at least 0",
            },
          ]}
          tooltip="Set the minimum quantity threshold that should trigger a restock notification"
        >
          <InputNumber
            min={0}
            style={{ width: "100%" }}
            placeholder="Enter new reorder level"
            onChange={(value) => {
              setCurrentReorderLevel(value as number);
            }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditInventoryRecordModal;
