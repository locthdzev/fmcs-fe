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
  Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Checkbox
} from "@heroui/react";
import { EditCanteenItemForm } from "./EditCanteenItemForm";
import { CreateCanteenItemForm } from "./CreateCanteenItemForm";
import { PlusIcon, SearchIcon, ChevronDownIcon, CanteenItemIcon } from "./Icons";

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
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [isAllSelected, setIsAllSelected] = useState(false);

  const [showActivate, setShowActivate] = useState(false);
  const [showDeactivate, setShowDeactivate] = useState(false);
  const statusColorMap: Record<"Active" | "Inactive", string> = {
    Active: "bg-green-100 text-green-700",
    Inactive: "bg-gray-100 text-gray-700",
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
  useEffect(() => {
    fetchCanteenItems();
    let selected: CanteenItemResponse[] = [];

    if (selectedKeys.size === canteenItems.length) {
      selected = filteredItems;
    } else {
      selected = canteenItems.filter((item) => selectedKeys.has(item.id));
    }

    const hasActive = selected.some((item) => item.status === "Active");
    const hasInactive = selected.some((item) => item.status === "Inactive");
    setIsAllSelected(selectedKeys.size > 0 && selectedKeys.size === filteredItems.length);

    setShowActivate(hasInactive);
    setShowDeactivate(hasActive);
  }, [selectedKeys, canteenItems, filteredItems]);

  const handleActivate = async () => {
    const ids = Array.from(selectedKeys).filter((id) =>
      canteenItems.find((item) => item.id === id && item.status === "Inactive")
    );

    if (ids.length === 0) return;

    try {
      await activateCanteenItems(ids);
      toast.success("Items activated successfully");
      fetchCanteenItems();
      setSelectedKeys(new Set());
    } catch (error) {
      toast.error("Failed to activate items");
    }
  };

  const handleDeactivate = async () => {
    const ids = Array.from(selectedKeys).filter((id) =>
      canteenItems.find((item) => item.id === id && item.status === "Active")
    );

    if (ids.length === 0) return;

    try {
      await deactivateCanteenItems(ids);
      toast.success("Items deactivated successfully");
      fetchCanteenItems();
      setSelectedKeys(new Set());
    } catch (error) {
      toast.error("Failed to deactivate items");
    }
  };

  const fetchCanteenItems = async () => {
    try {
      const response = await getAllCanteenItems();
      setCanteenItems(response || []);
      setIsReady(true);
    } catch (error) {
      toast.error("Failed to fetch canteen items");
    }
  };

  const handleUpdateSuccess = async (updatedItem: CanteenItemResponse) => {
    setCanteenItems((prevItems) => {
      const updatedItems = prevItems.map((item) =>
        item.id === updatedItem.id ? { ...updatedItem } : item
      );
      return [...updatedItems]; // Đảm bảo tạo một object mới để trigger re-render
    });
    await fetchCanteenItems(); // Gọi lại API để lấy dữ liệu mới
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
      <div className="flex justify-between items-center mb-6 px-4">
        <Input
          placeholder="Search by item name..."
          startContent={<SearchIcon />}
          value={filterValue}
          onChange={(e) => setFilterValue(e.target.value)}
          className="w-full sm:max-w-[44%]"
        />
        <div className="flex items-center gap-4 px-4">
          {selectedKeys.size > 0 && (
            <Button
              color="primary"
              variant="flat"
              onClick={() => {
                if (isAllSelected) {
                  setSelectedKeys(new Set()); // Bỏ chọn tất cả
                } else {
                  setSelectedKeys(new Set(filteredItems.map((item) => item.id))); // Chọn tất cả
                }
              }}
            >
              {isAllSelected ? "Deselect All" : "Select All"}
            </Button>
          )}
          {showActivate && (
            <Button color="success" onClick={handleActivate}>
              Activate Selected
            </Button>
          )}
          {showDeactivate && (
            <Button color="danger" onClick={handleDeactivate}>
              Deactivate Selected
            </Button>
          )}

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
            Create
          </Button>
        </div>
      </div>
      <div className="flex justify-between items-center px-4 mb-4">
        <span className="text-gray-500">Total {canteenItems.length} canteen items</span>
        <span className="text-gray-500">
          {selectedKeys.size === canteenItems.length
            ? "All items selected"
            : `${selectedKeys.size} of ${filteredItems.length} selected`}
        </span>
      </div>

      {/* Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 px-6">
        {displayedItems.map((item) => (
          <Card key={item.id} className="relative shadow-lg rounded-xl overflow-hidden transition-transform transform hover:scale-105 duration-300">
            {/* Góc trên bên phải - Trạng thái Status */}
            <div className={`absolute top-2 right-2 px-3 py-1 text-xs font-semibold rounded-lg ${statusColorMap[item.status as "Active" | "Inactive"] || "bg-gray-200 text-gray-700"}`}>
              {item.status ?? "Unknown"}
            </div>
            <div className="top-2 left-2 px-3 py-1">
              <Checkbox
                isSelected={selectedKeys.has(item.id)}
                onChange={() => {
                  const newSelection = new Set(selectedKeys);
                  if (newSelection.has(item.id)) {
                    newSelection.delete(item.id);
                  } else {
                    newSelection.add(item.id);
                  }
                  setSelectedKeys(newSelection);
                }}
              />
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
