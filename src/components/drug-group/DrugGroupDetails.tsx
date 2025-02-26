import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  Card,
  CardHeader,
  CardBody,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  ChipProps,
  Input,
  Button,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  DropdownItem,
  Selection,
  SortDescriptor,
} from "@heroui/react";
import { getDrugGroupById, DrugGroupResponse } from "@/api/druggroup";
import { getDrugsByDrugGroupId, DrugResponse, getDrugById } from "@/api/drug";
import DrugDetailsModal from "../drug/DrugDetails";
import { SearchIcon, ChevronDownIcon } from "./Icons";

const statusColorMap: Record<string, ChipProps["color"]> = {
  Active: "success",
  Inactive: "danger",
};

const columns = [
  { name: "CODE", uid: "drugCode", sortable: true },
  { name: "NAME", uid: "name", sortable: true },
  { name: "UNIT", uid: "unit" },
  { name: "PRICE", uid: "price", sortable: true },
  { name: "MANUFACTURER", uid: "manufacturer" },
  { name: "STATUS", uid: "status" },
];

const statusOptions = [
  { name: "Active", uid: "Active" },
  { name: "Inactive", uid: "Inactive" },
];

export function DrugGroupDetails() {
  const router = useRouter();
  const { id } = router.query;
  const [drugGroup, setDrugGroup] = useState<DrugGroupResponse | null>(null);
  const [drugs, setDrugs] = useState<DrugResponse[]>([]);
  const [selectedDrug, setSelectedDrug] = useState<DrugResponse | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [filterValue, setFilterValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<Selection>("all");
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "drugCode",
    direction: "ascending",
  });

  useEffect(() => {
    const fetchData = async () => {
      if (id && typeof id === "string") {
        try {
          const groupData = await getDrugGroupById(id);
          setDrugGroup(groupData);

          const drugsData = await getDrugsByDrugGroupId(id);
          setDrugs(drugsData ?? []);
        } catch (error) {
          console.error("Error fetching data:", error);
          setDrugs([]);
        }
      }
    };

    fetchData();
  }, [id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString("vi-VN")} ${date.getHours()}:${String(
      date.getMinutes()
    ).padStart(2, "0")}`;
  };

  const handleOpenDetails = async (id: string) => {
    try {
      const drug = await getDrugById(id);
      setSelectedDrug(drug);
      setIsDetailsModalOpen(true);
    } catch (error) {
      console.error("Failed to load drug details");
    }
  };

  const filteredItems = React.useMemo(() => {
    let filteredDrugs = [...drugs];

    if (filterValue) {
      filteredDrugs = filteredDrugs.filter((drug) =>
        drug.name.toLowerCase().includes(filterValue.toLowerCase())
      );
    }
    if (
      statusFilter !== "all" &&
      Array.from(statusFilter).length !== statusOptions.length
    ) {
      filteredDrugs = filteredDrugs.filter(
        (drug) =>
          drug.status !== undefined &&
          Array.from(statusFilter).includes(drug.status)
      );
    }

    return filteredDrugs;
  }, [drugs, filterValue, statusFilter]);

  const sortedItems = React.useMemo(() => {
    return [...filteredItems].sort((a: DrugResponse, b: DrugResponse) => {
      const first = a[sortDescriptor.column as keyof DrugResponse];
      const second = b[sortDescriptor.column as keyof DrugResponse];

      let cmp = 0;
      if (typeof first === "string" && typeof second === "string") {
        cmp = first.localeCompare(second);
      }

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, filteredItems]);

  const onSearchChange = React.useCallback((value?: string) => {
    if (value) {
      setFilterValue(value);
    } else {
      setFilterValue("");
    }
  }, []);

  const onClear = React.useCallback(() => {
    setFilterValue("");
  }, []);

  return (
    <div ref={{ current: null }} className="space-y-6 p-6">
      <button
        onClick={() => router.back()}
        className="p-0.5 text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-100 w-6 h-6 flex items-center justify-center mb-0"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>
      <Card>
        <CardHeader className="flex justify-between items-center">
          <h4 className="text-xl font-bold">Drug Group Details</h4>
          <Chip
            className="capitalize"
            color={statusColorMap[drugGroup?.status || "Inactive"]}
            size="sm"
            variant="flat"
          >
            {drugGroup?.status}
          </Chip>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-4 gap-4">
            {/* Group Name */}
            <div className="p-4 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-2">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Group Name</p>
                  <p className="font-semibold text-base text-gray-800">
                    {drugGroup?.groupName}
                  </p>
                </div>
              </div>
            </div>
            {/* Description */}
            <div className="p-4 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-2">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Description</p>
                  <p className="font-semibold text-base text-gray-800 italic">
                    {drugGroup?.description || "No description available"}
                  </p>
                </div>
              </div>
            </div>
            {/* Created At */}
            <div className="p-4 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-2">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Created At</p>
                  <p className="font-semibold text-base text-gray-800">
                    {drugGroup?.createdAt
                      ? formatDate(drugGroup.createdAt)
                      : "-"}
                  </p>
                </div>
              </div>
            </div>
            {/* Updated At */}
            <div className="p-4 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-2">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Updated At</p>
                  <p
                    className={`font-semibold text-base ${
                      !drugGroup?.updatedAt
                        ? "italic text-gray-400"
                        : "text-gray-800"
                    }`}
                  >
                    {drugGroup?.updatedAt
                      ? formatDate(drugGroup.updatedAt)
                      : "Not updated yet"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
      <Card>
        <CardHeader>
          <h4 className="text-xl font-bold">Drugs in Group</h4>
        </CardHeader>
        <CardBody>
          <div className="flex justify-between items-center mb-4">
            <Input
              isClearable
              className="w-full sm:max-w-[44%]"
              placeholder="Search by drug name..."
              startContent={<SearchIcon />}
              value={filterValue}
              onClear={() => onClear()}
              onValueChange={onSearchChange}
            />
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
                onSelectionChange={setStatusFilter}
              >
                {statusOptions.map((status) => (
                  <DropdownItem key={status.uid} className="capitalize">
                    {status.name}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </div>
          <Table
            aria-label="Drugs table"
            sortDescriptor={sortDescriptor}
            onSortChange={setSortDescriptor}
          >
            <TableHeader>
              {columns.map((column) => (
                <TableColumn key={column.uid} allowsSorting={column.sortable}>
                  {column.name}
                </TableColumn>
              ))}
            </TableHeader>
            <TableBody emptyContent={"No drug in drug group"}>
              {sortedItems.map((drug) => (
                <TableRow key={drug.id}>
                  <TableCell>{drug.drugCode}</TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start">
                      <div className="flex items-center">
                        <img
                          src={drug.imageUrl}
                          alt={drug.name}
                          className="w-8 h-8 mr-2 rounded cursor-pointer"
                          onClick={() => handleOpenDetails(drug.id)}
                        />
                        <p
                          className="text-bold text-small capitalize text-primary cursor-pointer hover:underline"
                          onClick={() => handleOpenDetails(drug.id)}
                        >
                          {drug.name}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{drug.unit}</TableCell>
                  <TableCell>{drug.price.toLocaleString()} VND</TableCell>
                  <TableCell>{drug.manufacturer || "-"}</TableCell>
                  <TableCell>
                    <Chip
                      className="capitalize"
                      color={statusColorMap[drug.status || "Inactive"]}
                      size="sm"
                      variant="flat"
                    >
                      {drug.status}
                    </Chip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      <DrugDetailsModal
        drug={selectedDrug}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
      />
    </div>
  );
}
