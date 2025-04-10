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
import { getDrugById, DrugResponse } from "@/api/drug";
import {
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";
import { DrugIcon } from "./Icons";

const { Title, Text } = Typography;

interface DrugDetailProps {
  id: string;
}

export const DrugDetail: React.FC<DrugDetailProps> = ({ id }) => {
  const router = useRouter();
  const [drug, setDrug] = useState<DrugResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [messageApi, contextHolder] = message.useMessage();
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchDrugDetails();
    }
  }, [id]);

  const fetchDrugDetails = async () => {
    setLoading(true);
    try {
      const response = await getDrugById(id);
      if (response && typeof response === 'object') {
         setDrug(response);
      } else {
         console.error("Invalid response structure:", response);
         messageApi.error("Failed to fetch drug details: Invalid data format");
         setDrug(null);
      }
    } catch (error) {
      console.error("Error fetching drug details:", error);
      messageApi.error("Failed to fetch drug details");
      setDrug(null);
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
    if (!drug) return null;
    return (
      <Button 
        type="primary"
        onClick={() => router.push(`/drug/edit/${id}`)}
      >
        Edit Drug
      </Button>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        {contextHolder}
        <Spin size="large" tip="Loading drug details..." />
      </div>
    );
  }

  if (!drug) {
    return (
      <div className="p-4">
        {contextHolder}
        <div className="flex items-center gap-2 mb-4">
            <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => router.push("/drug")}
                style={{ marginRight: "8px" }}
            >
                Back
            </Button>
            <DrugIcon />
            <h3 className="text-xl font-bold">Drug Not Found</h3>
        </div>
        <Card>
           <Text>The requested drug could not be found or loaded.</Text>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4">
      {contextHolder}
      <Modal 
        open={!!previewImage} 
        footer={null} 
        onCancel={() => setPreviewImage(null)}
        width={800}
        centered
      >
        <img 
          alt="Drug Preview" 
          style={{ width: '100%' }} 
          src={previewImage || ''} 
        />
      </Modal>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push("/drug")}
            style={{ marginRight: "8px" }}
          >
            Back
          </Button>
          <DrugIcon />
          <h3 className="text-xl font-bold">Drug Details</h3>
        </div>
        <div>{renderActionButtons()}</div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={16}>
          <Card
            title={<Title level={5}>Drug Information</Title>}
            extra={
              <Tag color={getStatusColor(drug.status)}>
                {drug.status ? drug.status.toUpperCase() : ""}
              </Tag>
            }
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <div className="border rounded-md p-3">
                  <Text strong className="block text-sm text-gray-500">Drug Code</Text>
                  <Text className="block">{drug.drugCode || "-"}</Text>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div className="border rounded-md p-3">
                  <Text strong className="block text-sm text-gray-500">Name</Text>
                  <Text className="block">{drug.name || "-"}</Text>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div className="border rounded-md p-3">
                  <Text strong className="block text-sm text-gray-500">Unit</Text>
                  <Text className="block">{drug.unit || "-"}</Text>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div className="border rounded-md p-3">
                  <Text strong className="block text-sm text-gray-500">Price</Text>
                  <Text className="block">{formatPrice(drug.price)}</Text>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div className="border rounded-md p-3">
                  <Text strong className="block text-sm text-gray-500">Drug Group</Text>
                  <Text className="block">{drug.drugGroup?.groupName || "-"}</Text>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div className="border rounded-md p-3">
                  <Text strong className="block text-sm text-gray-500">Manufacturer</Text>
                  <Text className="block">{drug.manufacturer || "-"}</Text>
                </div>
              </Col>
              <Col xs={24}>
                <div className="border rounded-md p-3">
                  <Text strong className="block text-sm text-gray-500">Description</Text>
                  <Text className="block">{drug.description || "No description available."}</Text>
                </div>
              </Col>
              
              <Col xs={24}>
                <Divider style={{ margin: "8px 0" }} />
              </Col>
              
              <Col xs={24} sm={12}>
                <div className="border rounded-md p-3">
                  <Text strong className="block text-sm text-gray-500">Created At</Text>
                  <Text className="block">{formatDate(drug.createdAt)}</Text>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div className="border rounded-md p-3">
                  <Text strong className="block text-sm text-gray-500">Updated At</Text>
                  <Text className="block">{formatDate(drug.updatedAt)}</Text>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title={<Title level={5}>Drug Image</Title>}>
            {drug.imageUrl ? (
              <div 
                style={{ cursor: 'pointer' }} 
                onClick={() => setPreviewImage(drug.imageUrl || null)}
                className="flex justify-center"
              >
                <img
                  src={drug.imageUrl}
                  alt={drug.name}
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '300px', 
                    objectFit: 'contain',
                    transition: 'transform 0.3s ease',
                  }}
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

export default DrugDetail; 