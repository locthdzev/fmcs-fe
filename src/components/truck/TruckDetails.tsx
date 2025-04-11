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
import { getTruckById, TruckResponse } from "@/api/truck";
import {
  ArrowLeftOutlined,
  EditOutlined
} from "@ant-design/icons";
import { useRouter } from "next/router";
import { TrucksIcon } from "./Icons";

const { Title, Text } = Typography;

interface TruckDetailsProps {
  id: string;
}

export const TruckDetail: React.FC<TruckDetailsProps> = ({ id }) => {
  const router = useRouter();
  const [truck, setTruck] = useState<TruckResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [messageApi, contextHolder] = message.useMessage();
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchTruckDetails();
    }
  }, [id]);

  const fetchTruckDetails = async () => {
    setLoading(true);
    try {
      const response = await getTruckById(id);
      if (response && typeof response === 'object') {
         setTruck(response);
      } else {
         console.error("Invalid response structure:", response);
         messageApi.error("Failed to fetch truck details: Invalid data format");
         setTruck(null);
      }
    } catch (error) {
      console.error("Error fetching truck details:", error);
      messageApi.error("Failed to fetch truck details");
      setTruck(null);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return "-";
    return dayjs(date).format("DD/MM/YYYY HH:mm:ss");
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
    if (!truck) return null;
    return (
      <Button 
        type="primary"
        onClick={() => router.push(`/truck/edit/${id}`)}
        icon={<EditOutlined />}
      >
        Edit Truck
      </Button>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        {contextHolder}
        <Spin size="large" tip="Loading truck details..." />
      </div>
    );
  }

  if (!truck) {
    return (
      <div className="p-4">
        {contextHolder}
        <div className="flex items-center gap-2 mb-4">
            <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => router.push("/truck")}
                style={{ marginRight: "8px" }}
            >
                Back
            </Button>
            <TrucksIcon />
            <h3 className="text-xl font-bold">Truck Not Found</h3>
        </div>
        <Card>
           <Text>The requested truck could not be found or loaded.</Text>
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
          alt="Truck Preview" 
          style={{ width: '100%' }} 
          src={previewImage || ''} 
        />
      </Modal>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push("/truck")}
            style={{ marginRight: "8px" }}
          >
            Back
          </Button>
          <TrucksIcon />
          <h3 className="text-xl font-bold">Truck Details</h3>
        </div>
        <div>{renderActionButtons()}</div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={16}>
          <Card
            title={<Title level={5}>Truck Information</Title>}
            extra={
              <Tag color={getStatusColor(truck.status)}>
                {truck.status ? truck.status.toUpperCase() : ""}
              </Tag>
            }
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <div className="border rounded-md p-3">
                  <Text strong className="block text-sm text-gray-500">License Plate</Text>
                  <Text className="block">{truck.licensePlate || "-"}</Text>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div className="border rounded-md p-3">
                  <Text strong className="block text-sm text-gray-500">Driver Name</Text>
                  <Text className="block">{truck.driverName || "-"}</Text>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div className="border rounded-md p-3">
                  <Text strong className="block text-sm text-gray-500">Driver Contact</Text>
                  <Text className="block">{truck.driverContact || "-"}</Text>
                </div>
              </Col>
              <Col xs={24}>
                <div className="border rounded-md p-3">
                  <Text strong className="block text-sm text-gray-500">Description</Text>
                  <Text className="block">{truck.description || "No description available."}</Text>
                </div>
              </Col>
              
              <Col xs={24}>
                <Divider style={{ margin: "8px 0" }} />
              </Col>
              
              <Col xs={24} sm={12}>
                <div className="border rounded-md p-3">
                  <Text strong className="block text-sm text-gray-500">Created At</Text>
                  <Text className="block">{formatDate(truck.createdAt)}</Text>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div className="border rounded-md p-3">
                  <Text strong className="block text-sm text-gray-500">Updated At</Text>
                  <Text className="block">{formatDate(truck.updatedAt)}</Text>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title={<Title level={5}>Truck Image</Title>}>
            {truck.truckImage ? (
              <div 
                className="flex justify-center"
              >
                <Image
                  src={truck.truckImage}
                  alt={truck.licensePlate}
                  style={{ 
                    maxHeight: '300px', 
                    objectFit: 'contain',
                  }}
                  preview={{
                    src: truck.truckImage,
                  }}
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

// Backward compatibility modal wrapper for the existing Truck component
// No longer needed as we've migrated to a standalone page
// Keeping this commented code for reference
/*
interface TruckDetailsModalProps {
  truck: TruckResponse | null;
  isOpen: boolean;
  onClose: () => void;
}

const TruckDetailsModal: React.FC<TruckDetailsModalProps> = ({
  truck,
  isOpen,
  onClose,
}) => {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  if (!truck || !isOpen) return null;
  
  return (
    <>
      <Modal
        title="Truck Details"
        open={isOpen}
        onCancel={onClose}
        footer={[
          <Button key="close" onClick={onClose}>
            Close
          </Button>
        ]}
        width={800}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={16}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} lg={8}>
                <Text strong>License Plate:</Text>
                <Text className="ml-2 block">{truck.licensePlate}</Text>
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <Text strong>Driver Name:</Text>
                <Text className="ml-2 block">{truck.driverName || "-"}</Text>
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <Text strong>Driver Contact:</Text>
                <Text className="ml-2 block">{truck.driverContact || "-"}</Text>
              </Col>
              <Col xs={24}>
                <Text strong>Description:</Text>
                <Text className="ml-2 block">{truck.description || "No description available."}</Text>
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <Text strong>Status:</Text>
                <div className="ml-2 block">
                  <Tag color={truck.status === "Active" ? "success" : "error"}>
                    {truck.status}
                  </Tag>
                </div>
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <Text strong>Created At:</Text>
                <Text className="ml-2 block">
                  {truck.createdAt ? dayjs(truck.createdAt).format("DD/MM/YYYY HH:mm:ss") : "-"}
                </Text>
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <Text strong>Updated At:</Text>
                <Text className="ml-2 block">
                  {truck.updatedAt ? dayjs(truck.updatedAt).format("DD/MM/YYYY HH:mm:ss") : "-"}
                </Text>
              </Col>
            </Row>
          </Col>
          <Col xs={24} md={8}>
            {truck.truckImage ? (
              <div 
                style={{ cursor: 'pointer' }} 
                onClick={() => setPreviewImage(truck.truckImage)}
                className="flex justify-center"
              >
                <img
                  src={truck.truckImage}
                  alt={truck.licensePlate}
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '200px', 
                    objectFit: 'contain',
                  }}
                  className="hover:scale-105"
                />
              </div>
            ) : (
              <div className="text-center py-8">
                <Text type="secondary">No image available</Text>
              </div>
            )}
          </Col>
        </Row>
      </Modal>
      
      <Modal 
        open={!!previewImage} 
        footer={null} 
        onCancel={() => setPreviewImage(null)}
        width={800}
        centered
      >
        <img 
          alt="Truck Preview" 
          style={{ width: '100%' }} 
          src={previewImage || ''} 
        />
      </Modal>
    </>
  );
};
*/

// This is a temporary export to maintain compatibility
// while we transition to the page-based approach
const TruckDetailsModal = () => null;

export default TruckDetailsModal;

