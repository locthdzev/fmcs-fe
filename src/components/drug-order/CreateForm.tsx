import React, { useState, useEffect } from "react";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalFooter,
} from "@heroui/react";
import { Select, message } from "antd";
import { createDrugOrder } from "@/api/drugorder";
import { getDrugs, DrugResponse } from "@/api/drug";
import { getDrugSuppliers, DrugSupplierResponse } from "@/api/drugsupplier";
import { BinIcon } from "./Icons";
import { ConfirmModal } from "./Confirm";

interface CreateDrugOrderFormProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: () => void;
}

interface DrugOrderDetail {
  drugId: string;
  quantity: number;
  price: number;
  searchDrug?: string;
}

const initialFormState = {
  supplierId: "",
  drugOrderDetails: [] as DrugOrderDetail[],
  totalQuantity: 0,
  totalPrice: 0,
};

export const CreateDrugOrderForm: React.FC<CreateDrugOrderFormProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [messageApi, contextHolder] = message.useMessage();
  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [drugs, setDrugs] = useState<DrugResponse[]>([]);
  const [suppliers, setSuppliers] = useState<DrugSupplierResponse[]>([]);
  const selectedDrugIds = new Set(
    formData.drugOrderDetails.map((detail) => detail.drugId)
  );
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);

  useEffect(() => {
    const fetchDrugs = async () => {
      try {
        const drugsData = await getDrugs();
        setDrugs(drugsData);
      } catch (error) {
        messageApi.error("Failed to fetch drugs");
      }
    };
    fetchDrugs();
  }, [messageApi]);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const data = await getDrugSuppliers();
        setSuppliers(data);
      } catch (error) {
        messageApi.error("Failed to load suppliers");
      }
    };
    fetchSuppliers();
  }, [messageApi]);

  useEffect(() => {
    calculateTotals();
  }, [formData.drugOrderDetails]);

  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormState);
    }
  }, [isOpen]);

  const calculateTotals = () => {
    const totalQuantity = formData.drugOrderDetails.reduce(
      (sum, detail) => sum + Number(detail.quantity),
      0
    );
    const totalPrice = formData.drugOrderDetails.reduce(
      (sum, detail) => sum + Number(detail.quantity) * Number(detail.price),
      0
    );
    setFormData((prev) => ({
      ...prev,
      totalQuantity,
      totalPrice,
    }));
  };

  const handleInputChange = (value: string) => {
    console.log("Selected supplierId:", value);
    setFormData((prev) => ({
      ...prev,
      supplierId: value,
    }));
  };

  const handleDrugDetailChange = (
    index: number,
    field: string,
    value: string | number
  ) => {
    setFormData((prev) => {
      const newDetails = [...prev.drugOrderDetails];
      if (field === "drugId") {
        const selectedDrug = drugs.find((drug) => drug.id === value);
        newDetails[index] = {
          ...newDetails[index],
          [field]: value as string,
          price: selectedDrug?.price || 0,
        };
      } else {
        newDetails[index] = {
          ...newDetails[index],
          [field]: typeof value === "string" ? value : String(value),
        };
      }
      return {
        ...prev,
        drugOrderDetails: newDetails,
      };
    });
  };

  const handleDrugSearch = (index: number, value: string) => {
    setFormData((prev) => {
      const newDetails = [...prev.drugOrderDetails];
      newDetails[index] = {
        ...newDetails[index],
        searchDrug: value,
      };
      return {
        ...prev,
        drugOrderDetails: newDetails,
      };
    });
  };

  const addDrugDetail = () => {
    setFormData((prev) => ({
      ...prev,
      drugOrderDetails: [
        ...prev.drugOrderDetails,
        { drugId: "", quantity: 0, price: 0, searchDrug: "" },
      ],
    }));
  };

  const removeDrugDetail = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      drugOrderDetails: prev.drugOrderDetails.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplierId || formData.drugOrderDetails.length === 0) {
      messageApi.error("Please fill in all required fields");
      return;
    }

    for (const detail of formData.drugOrderDetails) {
      if (!detail.drugId) {
        messageApi.error("Please select a drug for each order detail");
        return;
      }
      if (!detail.quantity || detail.quantity <= 0) {
        messageApi.error("Quantity must be greater than 0");
        return;
      }
    }

    setIsConfirmationModalOpen(true);
  };

  const handleConfirmCreate = async () => {
    try {
      setLoading(true);
      const response = await createDrugOrder({
        supplierId: formData.supplierId,
        drugOrderDetails: formData.drugOrderDetails.map(
          ({ drugId, quantity }) => ({
            drugId,
            quantity: Number(quantity),
          })
        ),
      });

      if (response.isSuccess) {
        messageApi.success(response.message || "Drug order created successfully");
        handleReset();
        onCreate();
        onClose();
      } else {
        messageApi.error(response.message || "Failed to create drug order");
      }
    } catch (error) {
      messageApi.error("Failed to create drug order");
    } finally {
      setLoading(false);
      setIsConfirmationModalOpen(false);
    }
  };

  const handleReset = () => {
    setFormData(initialFormState);
  };

  const getFilteredDrugs = (searchTerm: string = "") => {
    return drugs
      .filter((drug) => {
        const term = searchTerm.toLowerCase();
        return (
          drug.drugCode.toLowerCase().includes(term) ||
          drug.name.toLowerCase().includes(term)
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  const supplierOptions = suppliers
    .filter((supplier) => supplier.status === "Active")
    .map((supplier) => ({
      value: supplier.id,
      label: supplier.supplierName,
    }));

  return (
    <>
      {contextHolder}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent className="max-w-[1000px] min-h-[700px] max-h-[90vh]">
          <ModalHeader className="border-b pb-3">
            Add New Drug Order
          </ModalHeader>
          <ModalBody className="max-h-[80vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">
                    Supplier Information
                  </h3>
                  <Select
                    showSearch
                    style={{ width: "100%" }}
                    placeholder="Search to Select Supplier"
                    optionFilterProp="label"
                    value={formData.supplierId || undefined}
                    onChange={handleInputChange}
                    filterSort={(optionA, optionB) =>
                      (optionA?.label ?? "")
                        .toLowerCase()
                        .localeCompare((optionB?.label ?? "").toLowerCase())
                    }
                    options={supplierOptions}
                    dropdownStyle={{ zIndex: 9999 }}
                    getPopupContainer={(trigger) => trigger.parentElement!}
                  />
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">
                    Add Drugs To Order
                  </h3>
                  {formData.drugOrderDetails.map((detail, index) => (
                    <div
                      key={index}
                      className="mb-6 p-4 border border-gray-200 rounded-lg bg-white"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_40px] gap-4 items-end">
                        <div className="col-span-1 lg:col-span-1">
                          <Select
                            showSearch
                            style={{ width: "100%", height: "56px" }}
                            placeholder="Search to Select Drug"
                            optionFilterProp="children"
                            value={detail.drugId || undefined}
                            onChange={(value) =>
                              handleDrugDetailChange(index, "drugId", value)
                            }
                            onSearch={(value) => handleDrugSearch(index, value)}
                            filterOption={false}
                            options={getFilteredDrugs(detail.searchDrug).map(
                              (drug) => ({
                                value: drug.id,
                                label: (
                                  <div className="flex items-center gap-4">
                                    <img
                                      src={drug.imageUrl || "/placeholder.png"}
                                      alt={drug.name}
                                      className="w-12 h-12 object-cover rounded-md"
                                    />
                                    <div className="flex flex-col flex-1">
                                      <span>{`${drug.drugCode} - ${drug.name}`}</span>
                                    </div>
                                    <div className="text-right">
                                      <span>{`${drug.price} VND`}</span>
                                    </div>
                                  </div>
                                ),
                                disabled: selectedDrugIds.has(drug.id),
                              })
                            )}
                            getPopupContainer={(trigger) =>
                              trigger.parentElement!
                            }
                          />
                        </div>
                        <Input
                          label="Quantity"
                          type="number"
                          value={detail.quantity.toString()}
                          onChange={(e) =>
                            handleDrugDetailChange(
                              index,
                              "quantity",
                              parseInt(e.target.value, 10)
                            )
                          }
                          min="1"
                          required
                          className="w-full"
                        />
                        <Input
                          label="Total Price"
                          type="text"
                          value={
                            (detail.quantity * detail.price).toLocaleString() +
                            " VND"
                          }
                          disabled
                          className="w-full"
                        />
                        <Button
                          type="button"
                          variant="flat"
                          color="danger"
                          onClick={() => removeDrugDetail(index)}
                          isIconOnly
                          className="h-10 w-10"
                        >
                          <BinIcon />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="flat"
                    onClick={addDrugDetail}
                    className="w-full mt-4"
                  >
                    + Add New Drug
                  </Button>
                </div>
              </div>
            </form>
          </ModalBody>
          <ModalFooter className="border-t pt-4">
            <div className="flex items-center justify-between w-full gap-4">
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center">
                  <span className="text-gray-500 text-sm">Total Quantity</span>
                  <span className="text-xl font-bold text-primary">
                    {formData.totalQuantity}
                  </span>
                </div>

                <div className="h-8 w-px bg-gray-300"></div>

                <div className="flex flex-col items-center">
                  <span className="text-gray-500 text-sm">Total Price</span>
                  <span className="text-xl font-bold text-green-600">
                    {formData.totalPrice.toLocaleString()} VND
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="flat"
                  onClick={handleReset}
                  className="px-6"
                >
                  Reset Form
                </Button>
                <Button
                  type="submit"
                  color="primary"
                  isLoading={loading}
                  className="px-6"
                  onClick={handleSubmit}
                >
                  Create Order
                </Button>
              </div>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <ConfirmModal
        isOpen={isConfirmationModalOpen}
        onClose={() => setIsConfirmationModalOpen(false)}
        onConfirm={handleConfirmCreate}
        title="Create Drug Order"
        message="Are you sure you want to create this drug order?"
        confirmText="Create Order"
        cancelText="Cancel"
      />
    </>
  );
};
