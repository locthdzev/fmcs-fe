import React, { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Chip,
} from "@heroui/react";
import { DrugResponse } from "@/api/drug";
import { Image } from "antd";

interface DrugDetailsModalProps {
  drug: DrugResponse | null;
  isOpen: boolean;
  onClose: () => void;
}

const statusColorMap: Record<string, any> = {
  Active: "success",
  Inactive: "danger",
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return `${date.toLocaleDateString("vi-VN")} ${date.getHours()}:${String(
    date.getMinutes()
  ).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`;
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    currencyDisplay: "code",
  }).format(price);
};

const DrugDetailsModal: React.FC<DrugDetailsModalProps> = ({
  drug,
  isOpen,
  onClose,
}) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  if (!drug) return null;

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={() => {
        // Chỉ đóng modal nếu ảnh không đang preview
        if (!isPreviewOpen) onClose();
      }}
      className="max-w-4xl"
      isDismissable={!isPreviewOpen} // Ngăn dismiss nếu ảnh đang mở
    >
      <ModalContent className="rounded-lg shadow-lg border border-gray-200 bg-white">
        <ModalHeader className="flex justify-between items-center">
          <span>Drug Details</span>
          <div className="flex items-center">
            <Chip
              className="capitalize px-2 py-1 text-sm font-medium mr-4"
              color={
                drug.status && statusColorMap[drug.status]
                  ? statusColorMap[drug.status]
                  : "default"
              }
              size="sm"
              variant="flat"
            >
              {drug.status}
            </Chip>
          </div>
        </ModalHeader>
        <ModalBody className="p-6">
          <div className="grid grid-cols-12 gap-6 items-start">
            <div className="col-span-5 flex justify-center items-center">
              <Image.PreviewGroup
                preview={{
                  maskClosable: true,
                  onVisibleChange: (visible) => setIsPreviewOpen(visible), // Cập nhật trạng thái preview
                }}
              >
                <Image
                  src={drug.imageUrl}
                  alt={drug.name}
                  width={256}
                  height={256}
                  className="object-contain bg-white p-2"
                />
              </Image.PreviewGroup>
            </div>

            <div className="col-span-7 space-y-4 text-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: "Drug Code", value: drug.drugCode },
                  { label: "Name", value: drug.name },
                  {
                    label: "Drug Group",
                    value: drug.drugGroup?.groupName || "-",
                  },
                  { label: "Unit", value: drug.unit },
                  { label: "Price", value: formatPrice(drug.price) },
                  { label: "Manufacturer", value: drug.manufacturer || "-" },
                  {
                    label: "Created At",
                    value: drug.createdAt ? formatDate(drug.createdAt) : "-",
                  },
                  {
                    label: "Updated At",
                    value: drug.updatedAt ? formatDate(drug.updatedAt) : "-",
                  },
                ].map((field, index) => (
                  <label
                    key={index}
                    className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm"
                  >
                    <span className="text-xs font-medium text-gray-700">
                      {field.label}
                    </span>
                    <div className="mt-1 w-full border-none p-0 sm:text-sm">
                      {field.value}
                    </div>
                  </label>
                ))}
              </div>

              <label className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm">
                <span className="text-xs font-medium text-gray-700">
                  Description
                </span>
                <div className="mt-1 w-full border-none p-0 sm:text-sm text-gray-600 italic">
                  {drug.description || "No description available."}
                </div>
              </label>
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button radius="sm" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DrugDetailsModal;
