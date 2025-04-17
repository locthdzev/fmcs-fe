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
  Divider,
} from "antd";
import dayjs from "dayjs";
import { getDrugSupplierById, DrugSupplierResponse } from "@/api/drugsupplier";
import {
  ArrowLeftOutlined,
  ShopOutlined,
  FormOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";

const { Title, Text } = Typography;

interface DrugSupplierDetailProps {
  id: string;
}

export const DrugSupplierDetail: React.FC<DrugSupplierDetailProps> = ({
  id,
}) => {
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
      if (response && typeof response === "object") {
        setSupplier(response);
      } else {
        console.error("Invalid response structure:", response);
        messageApi.error(
          "Failed to fetch supplier details: Invalid data format"
        );
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
    return (
      <Button
        type="primary"
        icon={<FormOutlined />}
        onClick={() => router.push(`/drug-supplier/edit/${id}`)}
      >
        Edit Supplier
      </Button>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        {contextHolder}
        <Spin size="large" tip="Loading supplier details..." />
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
          <h3 className="text-xl font-bold">Drug Supplier Details</h3>
        </div>
        <div>{renderActionButtons()}</div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card
            title={<Title level={5}>Supplier Information</Title>}
            extra={
              <Tag color={getStatusColor(supplier.status)}>
                {supplier.status ? supplier.status.toUpperCase() : ""}
              </Tag>
            }
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <div className="border rounded-md p-3">
                  <Text strong className="block text-sm text-gray-500">
                    Supplier Name
                  </Text>
                  <Text className="block">{supplier.supplierName || "-"}</Text>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div className="border rounded-md p-3">
                  <Text strong className="block text-sm text-gray-500">
                    Contact Number
                  </Text>
                  <Text className="block">{supplier.contactNumber || "-"}</Text>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div className="border rounded-md p-3">
                  <Text strong className="block text-sm text-gray-500">
                    Email
                  </Text>
                  <Text className="block">{supplier.email || "-"}</Text>
                </div>
              </Col>
              <Col xs={24}>
                <div className="border rounded-md p-3">
                  <Text strong className="block text-sm text-gray-500">
                    Address
                  </Text>
                  <Text className="block">{supplier.address || "-"}</Text>
                </div>
              </Col>

              <Col xs={24}>
                <Divider style={{ margin: "8px 0" }} />
              </Col>

              <Col xs={24} sm={12}>
                <div className="border rounded-md p-3">
                  <Text strong className="block text-sm text-gray-500">
                    Created At
                  </Text>
                  <Text className="block">
                    {formatDate(supplier.createdAt)}
                  </Text>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div className="border rounded-md p-3">
                  <Text strong className="block text-sm text-gray-500">
                    Updated At
                  </Text>
                  <Text className="block">
                    {formatDate(supplier.updatedAt)}
                  </Text>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DrugSupplierDetail;
