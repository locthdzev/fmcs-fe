import React, { useState, useEffect } from "react";
import {
  Card,
  Typography,
  Tag,
  Button,
  Space,
  Spin,
  message,
  Row,
  Col,
  Modal,
  Image,
  Divider
} from "antd";
import dayjs from "dayjs";
import { CanteenItemResponse } from "@/api/canteenitems";
import api from "@/api/customize-axios";
import {
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";
import { CanteenItemIcon } from "./Icons";

const { Title, Text } = Typography;

interface CanteenItemDetailProps {
  id: string;
}

export const CanteenItemDetail: React.FC<CanteenItemDetailProps> = ({ id }) => {
  const router = useRouter();
  const [canteenItem, setCanteenItem] = useState<CanteenItemResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [messageApi, contextHolder] = message.useMessage();
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchCanteenItemDetails();
    }
  }, [id]);

  const fetchCanteenItemDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/canteen-items-management/canteen-items/${id}`);
      if (response && response.data && response.data.data) {
         setCanteenItem(response.data.data);
      } else {
         console.error("Invalid response structure:", response);
         messageApi.error("Failed to fetch canteen item details: Invalid data format");
         setCanteenItem(null);
      }
    } catch (error) {
      console.error("Error fetching canteen item details:", error);
      messageApi.error("Failed to fetch canteen item details");
      setCanteenItem(null);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return "-";
    return dayjs(date).format("DD/MM/YYYY HH:mm:ss");
  };

  const formatPrice = (price: string | number | undefined) => {
    if (!price) return "-";
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      currencyDisplay: "code",
    }).format(numPrice);
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case "Active":
        return "success";
      case "Inactive":
        return "error";
      default:
        return "default";
    }
  };

  const renderActionButtons = () => {
    if (!canteenItem) return null;
    return (
      <Button 
        type="primary"
        onClick={() => router.push(`/canteen-item/edit/${id}`)}
      >
        Edit Item
      </Button>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        {contextHolder}
        <Spin size="large" tip="Loading canteen item details..." />
      </div>
    );
  }

  if (!canteenItem) {
    return (
      <div className="p-4">
        {contextHolder}
        <div className="flex items-center gap-2 mb-4">
            <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => router.push("/canteen-item")}
                style={{ marginRight: "8px" }}
            >
                Back
            </Button>
            <CanteenItemIcon />
            <h3 className="text-xl font-bold">Canteen Item Not Found</h3>
        </div>
        <Card>
           <Text>The requested canteen item could not be found or loaded.</Text>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4">
      {contextHolder}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push("/canteen-item")}
            style={{ marginRight: "8px" }}
          >
            Back
          </Button>
          <CanteenItemIcon />
          <h3 className="text-xl font-bold">Canteen Item Details</h3>
        </div>
        <div>{renderActionButtons()}</div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={16}>
          <Card
            title={<Title level={5}>Item Information</Title>}
            extra={
              <Space>
                <Tag color={getStatusColor(canteenItem.status)}>
                  {canteenItem.status ? canteenItem.status.toUpperCase() : ""}
                </Tag>
                <Tag color={canteenItem.available ? "success" : "error"}>
                  {canteenItem.available ? "AVAILABLE" : "OUT OF STOCK"}
                </Tag>
              </Space>
            }
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <div className="border rounded-md p-3">
                  <Text strong className="block text-sm text-gray-500">Item Name</Text>
                  <Text className="block">{canteenItem.itemName || "-"}</Text>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div className="border rounded-md p-3">
                  <Text strong className="block text-sm text-gray-500">Price</Text>
                  <Text className="block">{formatPrice(canteenItem.unitPrice)}</Text>
                </div>
              </Col>
              <Col xs={24}>
                <div className="border rounded-md p-3">
                  <Text strong className="block text-sm text-gray-500">Description</Text>
                  <Text className="block">{canteenItem.description || "No description available."}</Text>
                </div>
              </Col>
              
              <Col xs={24}>
                <Divider style={{ margin: "8px 0" }} />
              </Col>
              
              <Col xs={24} sm={12}>
                <div className="border rounded-md p-3">
                  <Text strong className="block text-sm text-gray-500">Created At</Text>
                  <Text className="block">{formatDate(canteenItem.createdAt)}</Text>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div className="border rounded-md p-3">
                  <Text strong className="block text-sm text-gray-500">Updated At</Text>
                  <Text className="block">{formatDate(canteenItem.updatedAt)}</Text>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title={<Title level={5}>Item Image</Title>}>
            {canteenItem.imageUrl ? (
              <div 
                style={{ cursor: 'pointer' }} 
                className="flex justify-center"
              >
                <Image
                  src={canteenItem.imageUrl}
                  alt={canteenItem.itemName}
                  style={{ 
                    maxHeight: '300px',
                    objectFit: 'contain',
                  }}
                  preview={{
                    mask: <div className="flex items-center justify-center">Xem</div>,
                    maskClassName: "bg-black bg-opacity-50 hover:bg-opacity-70",
                    rootClassName: "custom-image-preview",
                  }}
                  width="auto"
                  className="hover:scale-105"
                />
              </div>
            ) : (
              <div className="text-center py-8">
                <Text type="secondary">No image available</Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CanteenItemDetail;
