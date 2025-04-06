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
} from "antd";
import dayjs from "dayjs";
import {
  getDrugSupplierById,
  DrugSupplierResponse,
} from "@/api/drugsupplier";
import {
  ArrowLeftOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";

const { Title, Text } = Typography;

interface DrugSupplierDetailProps {
  id: string;
}

export const DrugSupplierDetail: React.FC<DrugSupplierDetailProps> = ({ id }) => {
  const router = useRouter();
  const [supplier, setSupplier] = useState<DrugSupplierResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (id) {
      fetchSupplierDetails();
    }
  }, [id]);

  const fetchSupplierDetails = async () => {
    setLoading(true);
    try {
      const response = await getDrugSupplierById(id);
      if (response && typeof response === 'object') {
         setSupplier(response);
      } else {
         console.error("Invalid response structure:", response);
         messageApi.error("Failed to fetch supplier details: Invalid data format");
         setSupplier(null);
      }
    } catch (error) {
      console.error("Error fetching supplier details:", error);
      messageApi.error("Failed to fetch supplier details");
      setSupplier(null);
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
    if (!supplier) return null;
    return null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        {contextHolder}
        <Spin size="large" />
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="p-4">
        {contextHolder}
        <div className="flex items-center gap-2 mb-4">
            <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => router.push("/drug-supplier")}
                 style={{ marginRight: "8px" }}
            >
                Back
            </Button>
             <ShopOutlined style={{ fontSize: "24px" }} />
             <h3 className="text-xl font-bold">Supplier Not Found</h3>
        </div>
        <Card>
           <Text>The requested drug supplier could not be found or loaded.</Text>
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
            onClick={() => router.push("/drug-supplier")}
            style={{ marginRight: "8px" }}
          >
            Back
          </Button>
          <ShopOutlined style={{ fontSize: "24px" }} />
          <h3 className="text-xl font-bold">Supplier Details</h3>
        </div>
        <div>{renderActionButtons()}</div>
      </div>

      <Row gutter={[16, 16]}>
         <Col xs={24} md={24}>
           <Card
            title={<span style={{ fontWeight: "bold" }}>Supplier Information</span>}
            extra={
                <Tag color={getStatusColor(supplier.status)}>
                    {supplier.status}
                </Tag>
            }
          >
            <Row gutter={[16, 24]}>
               <Col xs={24} sm={12} lg={8}>
                  <Text strong>Supplier Name:</Text>
                  <Text className="ml-2 block">{supplier.supplierName}</Text>
               </Col>
               <Col xs={24} sm={12} lg={8}>
                  <Text strong>Contact Number:</Text>
                  <Text className="ml-2 block">{supplier.contactNumber || "-"}</Text>
               </Col>
               <Col xs={24} sm={12} lg={8}>
                  <Text strong>Email:</Text>
                  <Text className="ml-2 block">{supplier.email || "-"}</Text>
               </Col>
               <Col xs={24} sm={12} lg={16}>
                  <Text strong>Address:</Text>
                  <Text className="ml-2 block">{supplier.address || "-"}</Text>
               </Col>
               <Col xs={24} sm={12} lg={8}>
                  <Text strong>Status:</Text>
                  <div className="ml-2 block">
                     <Tag color={getStatusColor(supplier.status)}>
                       {supplier.status}
                     </Tag>
                  </div>
               </Col>
               <Col xs={24} sm={12} lg={8}>
                  <Text strong>Created At:</Text>
                  <Text className="ml-2 block">{formatDate(supplier.createdAt)}</Text>
               </Col>
                <Col xs={24} sm={12} lg={8}>
                  <Text strong>Updated At:</Text>
                  <Text className="ml-2 block">{formatDate(supplier.updatedAt)}</Text>
               </Col>
            </Row>
          </Card>
         </Col>
      </Row>
    </div>
  );
};
