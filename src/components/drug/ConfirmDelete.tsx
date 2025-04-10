import React from "react";
import {
  Modal,
  Button,
  Tag,
  Image,
  Card,
  Row,
  Col,
  Descriptions,
  Typography
} from "antd";
import { DrugResponse } from "@/api/drug";

interface ConfirmDeleteDrugModalProps {
  drug: DrugResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: () => void;
}

const { Text, Title } = Typography;

const statusColorMap: Record<string, string> = {
  Active: "success",
  Inactive: "error",
};

export const ConfirmDeleteDrugModal: React.FC<ConfirmDeleteDrugModalProps> = ({
  drug,
  isOpen,
  onClose,
  onConfirmDelete,
}) => {
  if (!drug) return null;

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      width={800}
      title={<Text type="danger">Confirm Delete</Text>}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="delete" danger type="primary" onClick={onConfirmDelete}>
          Delete
        </Button>
      ]}
    >
      <div style={{ padding: "16px 0" }}>
        <p style={{ marginBottom: "16px" }}>
          Are you sure you want to delete the following drug?
        </p>
        <Row gutter={24}>
          {/* Hình ảnh thuốc */}
          <Col span={10}>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <Image
                src={drug.imageUrl}
                alt={drug.name}
                className="w-64 h-64 object-contain bg-white p-2 transition-transform duration-300 hover:scale-105"
              />
            </div>
          </Col>

          {/* Thông tin thuốc */}
          <Col span={14}>
            <Descriptions column={1}>
              <Descriptions.Item label="Drug Code">{drug.drugCode}</Descriptions.Item>
              <Descriptions.Item label="Name">{drug.name}</Descriptions.Item>
              <Descriptions.Item label="Drug Group">{drug.drugGroup?.groupName || "-"}</Descriptions.Item>
              <Descriptions.Item label="Unit">{drug.unit}</Descriptions.Item>
              <Descriptions.Item label="Price">{drug.price}</Descriptions.Item>
              <Descriptions.Item label="Manufacturer">{drug.manufacturer || "-"}</Descriptions.Item>
              <Descriptions.Item label="Created At">{drug.createdAt ? new Date(drug.createdAt).toLocaleDateString("vi-VN") : "-"}</Descriptions.Item>
              <Descriptions.Item label="Updated At">{drug.updatedAt ? new Date(drug.updatedAt).toLocaleDateString("vi-VN") : "-"}</Descriptions.Item>
              <Descriptions.Item label="Description">{drug.description || "No description available."}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={statusColorMap[drug.status] || "default"}>{drug.status}</Tag>
              </Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>
      </div>
    </Modal>
  );
};