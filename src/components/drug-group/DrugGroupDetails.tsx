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
} from "@heroui/react";
import { getDrugGroupById, DrugGroupResponse } from "@/api/druggroup";
import { getDrugsByDrugGroupId, DrugResponse } from "@/api/drug";

const statusColorMap: Record<string, ChipProps["color"]> = {
  Active: "success",
  Inactive: "danger",
};

export function DrugGroupDetails() {
  const router = useRouter();
  const { id } = router.query;
  const [drugGroup, setDrugGroup] = useState<DrugGroupResponse | null>(null);
  const [drugs, setDrugs] = useState<DrugResponse[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (id && typeof id === "string") {
        try {
          const groupData = await getDrugGroupById(id);
          setDrugGroup(groupData);

          const drugsData = await getDrugsByDrugGroupId(id);
          setDrugs(drugsData ?? []); // Nếu drugsData là null, set thành []
        } catch (error) {
          console.error("Error fetching data:", error);
          setDrugs([]); // Đảm bảo không bị lỗi khi API fail
        }
      }
    };

    fetchData();
  }, [id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", { timeZone: "UTC" });
  };

  return (
    <div ref={{ current: null }} className="space-y-6 p-6">
      <button
        onClick={() => router.push("/drug-group/management")}
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
      {/* Drug Group Details Card */}
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
          <div className="grid grid-cols-4 gap-8">
            <div>
              <p className="text-gray-600">Group Name</p>
              <p className="font-semibold">{drugGroup?.groupName}</p>
            </div>
            <div>
              <p className="text-gray-600">Description</p>
              <p className="mt-1 w-full border-none p-0 sm:text-sm text-gray-600 italic">
                {drugGroup?.description || "No description available"}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Created At</p>
              <p className="font-semibold">
                {drugGroup?.createdAt ? formatDate(drugGroup.createdAt) : "-"}
              </p>
            </div>
            <div className="mr-16">
              <p className="text-gray-600">Updated At</p>
              <p className="font-semibold">
                {drugGroup?.updatedAt ? formatDate(drugGroup.updatedAt) : "-"}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
      {/* Drugs List Card */}
      <Card>
        <CardHeader>
          <h4 className="text-xl font-bold">Drugs in Group</h4>
        </CardHeader>
        <CardBody>
          <Table aria-label="Drugs table">
            <TableHeader>
              <TableColumn>CODE</TableColumn>
              <TableColumn>NAME</TableColumn>
              <TableColumn>UNIT</TableColumn>
              <TableColumn>PRICE</TableColumn>
              <TableColumn>MANUFACTURER</TableColumn>
              <TableColumn>STATUS</TableColumn>
            </TableHeader>
            <TableBody emptyContent={"No drug in drug group"}>
              {drugs.map((drug) => (
                <TableRow key={drug.id}>
                  <TableCell>{drug.drugCode}</TableCell>
                  <TableCell>{drug.name}</TableCell>
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
    </div>
  );
}
