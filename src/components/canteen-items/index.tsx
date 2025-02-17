import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  getAllCanteenItems,
  CanteenItemResponse,
  activateCanteenItems,
  deactivateCanteenItems,
} from "@/api/canteenitems";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Image,
  Button,
  Input,
  Pagination,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Dropdown, DropdownTrigger, DropdownMenu, DropdownItem
} from "@heroui/react";
import { EditCanteenItemForm } from "./EditCanteenItemForm";
import { CreateCanteenItemForm } from "./CreateCanteenItemForm";
import { PlusIcon, SearchIcon, ChevronDownIcon, CanteenItemIcon } from "./Icons";

const statusColorMap: Record<"Active" | "Inactive", string> = {
  Active: "bg-green-100 text-green-700",
  Inactive: "bg-gray-100 text-gray-700",
};

export function CanteenItems() {
  const [canteenItems, setCanteenItems] = useState<CanteenItemResponse[]>([]);
  const [filterValue, setFilterValue] = useState("");
  const [statusFilter, setStatusFilter] = useState(new Set(["Active"]));

  const statusOptions = [
    { uid: "Active", name: "Active" },
    { uid: "Inactive", name: "Inactive" },
  ];
  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(8);
  const [selectedCanteenItem, setSelectedCanteenItem] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [imgErrorMap, setImgErrorMap] = useState<{ [key: string]: boolean }>({});
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDeactivate, setItemToDeactivate] = useState<string | null>(null);
  const [isConfirmActivateModalOpen, setIsConfirmActivateModalOpen] = useState(false);
  const [itemToActivate, setItemToActivate] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    fetchCanteenItems();
  }, []);

  const fetchCanteenItems = async () => {
    try {
      const response = await getAllCanteenItems();
      setCanteenItems(response || []);
      setIsReady(true);
    } catch (error) {
      toast.error("Failed to fetch canteen items");
    }
  };

  const handleUpdateSuccess = (updatedItem: CanteenItemResponse) => {
    setCanteenItems((prevItems) =>
      prevItems.map((item) =>
        item.id === updatedItem.id ? { ...item, ...updatedItem } : item
      )
    );
    setIsEditModalOpen(false);
  };

  const handleActivateConfirm = async () => {
    if (!itemToActivate) return;

    try {
      await activateCanteenItems([itemToActivate]);
      toast.success("Item activated successfully");
      setCanteenItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemToActivate ? { ...item, status: "Active" } : item
        )
      );
      setIsConfirmActivateModalOpen(false);
      setItemToActivate(null);
    } catch (error) {
      toast.error("Failed to activate item");
    }
  };

  const handleDeactivateConfirm = async () => {
    if (!itemToDeactivate) return;

    try {
      await deactivateCanteenItems([itemToDeactivate]);
      toast.success("Item deactivated successfully");
      setCanteenItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemToDeactivate ? { ...item, status: "Inactive" } : item
        )
      );
      setIsConfirmModalOpen(false);
      setItemToDeactivate(null);
    } catch (error) {
      toast.error("Failed to deactivate item");
    }
  };

  const filteredItems = (canteenItems || []).filter((item) => {
    const statusKeys = Array.from(statusFilter);

    // Nếu item.status là undefined, gán giá trị mặc định là ""
    const itemStatus = item.status ?? "";

    return (
      item.itemName.toLowerCase().includes(filterValue.toLowerCase()) &&
      (statusKeys.includes("All") || statusKeys.includes(itemStatus))
    );
  });


  const pages = Math.ceil(filteredItems.length / rowsPerPage);
  const displayedItems = filteredItems.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  return (
    <>
          <div className="flex items-center gap-2 mb-4 ml-4">
            <CanteenItemIcon />
            <h3 className="text-2xl font-bold">Canteen Items Management</h3>
          </div>
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <Input
          placeholder="Search by item name..."
          startContent={<SearchIcon />}
          value={filterValue}
          onChange={(e) => setFilterValue(e.target.value)}
        />
        <div className="flex items-center gap-4">
          {/* Dropdown filter */}
          <Dropdown>
            <DropdownTrigger className="hidden sm:flex">
              <Button
                  endContent={<ChevronDownIcon className="text-small" />}
                  variant="flat"
                
              >
                Status
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              disallowEmptySelection
              aria-label="Table Columns"
              closeOnSelect={false}
              selectedKeys={statusFilter}
              selectionMode="multiple"
              onSelectionChange={(keys) => {
                const selectedKeys = new Set(
                  (keys as unknown as Set<string>).values()
                );
                setStatusFilter(selectedKeys);
              }}
            >
              {statusOptions.map((status) => (
                <DropdownItem key={status.uid} className="capitalize">
                  {capitalize(status.name)}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>

          {/* Nút Add New Item */}
          <Button color="primary" endContent={<PlusIcon />} onPress={() => setIsCreateModalOpen(true)}>
            Add New Item
          </Button>
        </div>

      </div>

      {/* Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {displayedItems.map((item) => (
          <Card key={item.id} className="relative shadow-lg rounded-xl overflow-hidden transition-transform transform hover:scale-105 duration-300">
            {/* Góc trên bên phải - Trạng thái Status */}
            <div className={`absolute top-2 right-2 px-3 py-1 text-xs font-semibold rounded-lg ${statusColorMap[item.status as "Active" | "Inactive"] || "bg-gray-200 text-gray-700"}`}>
              {item.status ?? "Unknown"}
            </div>

            <CardHeader className="flex flex-col items-center gap-3 p-4">
              <Image
                src={imgErrorMap[item.id] ? "/images/placeholder.jpg" : item.imageUrl || "/images/placeholder.jpg"}
                alt={item.itemName}
                width={150}
                height={150}
                className="rounded-lg object-cover shadow-md"
                onError={() => setImgErrorMap((prev) => ({ ...prev, [item.id]: true }))}
              />
              <h3 className="text-lg font-bold text-gray-900 text-center">{item.itemName}</h3>
            </CardHeader>

            <CardBody className="p-4">
              <p className="text-sm text-gray-500 mb-2">{item.description || "No description available."}</p>
              <p className="font-semibold text-gray-900 text-lg">${item.unitPrice}</p>
              <p className="text-sm text-gray-400">Created: {item.createdAt}</p>

              {/* Available - Đưa xuống gần mô tả */}
              <div className={`mt-2 px-3 py-1 text-xs font-semibold rounded-lg w-fit ${item.available ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {item.available ? "Available" : "Out of Stock"}
              </div>
            </CardBody>

            <CardFooter className="flex justify-between p-4 bg-gray-50 border-t border-gray-200">
              <Button
                color={item.status === "Active" ? "danger" : "success"}
                size="sm"
                onPress={() => {
                  if (item.status === "Active") {
                    setItemToDeactivate(item.id);
                    setIsConfirmModalOpen(true);
                  } else {
                    setItemToActivate(item.id);
                    setIsConfirmActivateModalOpen(true);
                  }
                }}
              >
                {item.status === "Active" ? "Deactivate" : "Activate"}
              </Button>

              <Button
                color="primary"
                size="sm"
                onPress={() => {
                  setSelectedCanteenItem(item.id);
                  setIsEditModalOpen(true);
                }}
              >
                Edit
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-6">
        {isReady && (
          <Pagination
            key={page}
            showControls
            page={page}
            total={pages}
            onChange={(newPage) => setPage(newPage)}
            color="primary"
          />
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && selectedCanteenItem && (
        <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
          <ModalContent>
            <ModalHeader>Edit Item</ModalHeader>
            <ModalBody>
              <EditCanteenItemForm
                canteenItemId={selectedCanteenItem}
                onClose={() => setIsEditModalOpen(false)}
                onUpdate={handleUpdateSuccess}
              />
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)}>
          <ModalContent>
            <ModalHeader>Create New Item</ModalHeader>
            <ModalBody>
              <CreateCanteenItemForm onClose={() => setIsCreateModalOpen(false)} onCreate={fetchCanteenItems} />
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      {/* Confirm Deactivate Modal */}
      {isConfirmModalOpen && (
        <Modal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)}>
          <ModalContent>
            <ModalHeader>Confirm Deactivation</ModalHeader>
            <ModalBody>
              <p>Are you sure you want to deactivate this item?</p>
              <div className="flex justify-end mt-4">
                <Button variant="flat" onPress={() => setIsConfirmModalOpen(false)}>Cancel</Button>
                <Button color="danger" onPress={handleDeactivateConfirm}>Yes</Button>
              </div>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      {/* Confirm Activate Modal */}
      {isConfirmActivateModalOpen && (
        <Modal isOpen={isConfirmActivateModalOpen} onClose={() => setIsConfirmActivateModalOpen(false)}>
          <ModalContent>
            <ModalHeader>Confirm Activation</ModalHeader>
            <ModalBody>
              <p>Are you sure you want to activate this item?</p>
              <div className="flex justify-end mt-4">
                <Button variant="flat" onPress={() => setIsConfirmActivateModalOpen(false)}>Cancel</Button>
                <Button color="success" onPress={handleActivateConfirm}>Yes</Button>
              </div>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

    </>
  );
}
