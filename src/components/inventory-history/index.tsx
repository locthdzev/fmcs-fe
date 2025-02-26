import React, { useState, useEffect } from "react";
import { Button, Table, Select, Input, DatePicker, Pagination } from "antd";

import { Card, CardHeader, CardBody } from "@heroui/react";
import {
  getAllInventoryHistories,
  getInventoryHistoriesByInventoryRecordId,
  getInventoryHistoriesByDateRange,
  getInventoryHistoriesByChangeType,
  getInventoryHistoriesByUserId,
  InventoryHistoryResponseDTO,
  setupInventoryHistoryRealTime,
} from "@/api/inventoryhistory";
import { exportToExcel } from "@/api/export";
import { toast } from "react-toastify";

const { Column } = Table;
const { RangePicker } = DatePicker;
const { Option } = Select;

export function InventoryHistory() {
  const [histories, setHistories] = useState<InventoryHistoryResponseDTO[]>([]);
  const [filteredHistories, setFilteredHistories] = useState<
    InventoryHistoryResponseDTO[]
  >([]);
  const [inventoryRecordIdFilter, setInventoryRecordIdFilter] =
    useState<string>("");
  const [dateRangeFilter, setDateRangeFilter] = useState<
    [string, string] | null
  >(null);
  const [changeTypeFilter, setChangeTypeFilter] = useState<string>("");
  const [userIdFilter, setUserIdFilter] = useState<string>("");
  const [searchText, setSearchText] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);

  const fetchHistories = async () => {
    try {
      let result;
      if (inventoryRecordIdFilter) {
        result = await getInventoryHistoriesByInventoryRecordId(inventoryRecordIdFilter);
        setHistories(result);
        setFilteredHistories(result);
      } else if (dateRangeFilter) {
        result = await getInventoryHistoriesByDateRange(dateRangeFilter[0], dateRangeFilter[1]);
        setHistories(result);
        setFilteredHistories(result);
      } else if (changeTypeFilter) {
        result = await getInventoryHistoriesByChangeType(changeTypeFilter);
        setHistories(result);
        setFilteredHistories(result);
      } else if (userIdFilter) {
        result = await getInventoryHistoriesByUserId(userIdFilter);
        setHistories(result);
        setFilteredHistories(result);
      } else {
        result = await getAllInventoryHistories(currentPage, pageSize, searchText);
        setHistories(result.data);
        setFilteredHistories(result.data);
        setTotal(result.totalRecords);
      }
    } catch (error) {
      toast.error("Failed to load inventory history list.");
    }
  };

  useEffect(() => {
    fetchHistories();

    const connection = setupInventoryHistoryRealTime(
        (newHistory: InventoryHistoryResponseDTO) => {
          fetchHistories();
        }
      );

    return () => {
      connection.stop();
    };
  }, [
    currentPage,
    inventoryRecordIdFilter,
    dateRangeFilter,
    changeTypeFilter,
    userIdFilter,
    searchText,
  ]);

  const handleSearch = (value: string) => {
    setSearchText(value);
    fetchHistories();
  };

  const handleExportExcel = () => {
    exportToExcel(
      "/inventoryhistory-management/inventoryhistories/export",
      "inventory_history.xlsx"
    );
    toast.success("Downloading Excel file...");
  };

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="flex justify-between items-center">
          <h3 className="text-2xl font-bold">Inventory History</h3>
          <Button type="primary" onClick={handleExportExcel}>
            Export Excel
          </Button>
        </CardHeader>
        <CardBody>
          <div style={{ marginBottom: 16 }}>
            <Input.Search
              placeholder="Search by BatchCode or Drug Name"
              onSearch={handleSearch}
              style={{ width: 300, marginRight: 16 }}
            />
            <Select
              placeholder="Filter by Inventory Record ID"
              onChange={(value) => setInventoryRecordIdFilter(value)}
              style={{ width: 200, marginRight: 16 }}
              allowClear
            >
              {/* Add Inventory Record ID list from API if needed */}
            </Select>
            <RangePicker
              onChange={(dates) =>
                setDateRangeFilter(
                  dates
                    ? [
                        dates[0]?.format("YYYY-MM-DD") ?? "",
                        dates[1]?.format("YYYY-MM-DD") ?? "",
                      ]
                    : null
                )
              }
              style={{ marginRight: 16 }}
            />
            <Select
              placeholder="Filter by change type"
              onChange={(value) => setChangeTypeFilter(value)}
              style={{ width: 200, marginRight: 16 }}
              allowClear
            >
              <Option value="RECEIVED">Received</Option>
              <Option value="ADJUSTED">Adjusted</Option>
            </Select>
            <Select
              placeholder="Filter by User ID"
              onChange={(value) => setUserIdFilter(value)}
              style={{ width: 200 }}
              allowClear
            >
              {/* Add User ID list from API if needed */}
            </Select>
          </div>

          <Table
            dataSource={filteredHistories}
            rowKey="id"
            pagination={false}
            scroll={{ x: true }}
          >
            <Column
              title="CHANGE DATE"
              dataIndex="changeDate"
              key="changeDate"
              render={(date) => new Date(date).toLocaleString("en-US")}
              defaultSortOrder="descend"
              sorter={(a, b) =>
                new Date(a.changeDate).getTime() -
                new Date(b.changeDate).getTime()
              }
            />
            <Column
              title="CHANGE TYPE"
              dataIndex="changeType"
              key="changeType"
              sorter={(a, b) => a.changeType.localeCompare(b.changeType)}
            />
            <Column
              title="PREVIOUS QUANTITY"
              dataIndex="previousQuantity"
              key="previousQuantity"
              sorter={(a, b) => a.previousQuantity - b.previousQuantity}
            />
            <Column
              title="NEW QUANTITY"
              dataIndex="newQuantity"
              key="newQuantity"
              sorter={(a, b) => a.newQuantity - b.newQuantity}
            />
            <Column
              title="PREVIOUS PRICE"
              dataIndex="previousPrice"
              key="previousPrice"
              sorter={(a, b) => a.previousPrice - b.previousPrice}
            />
            <Column
              title="NEW PRICE"
              dataIndex="newPrice"
              key="newPrice"
              sorter={(a, b) => a.newPrice - b.newPrice}
            />
            <Column title="REMARKS" dataIndex="remarks" key="remarks" />
            <Column
              title="USER"
              dataIndex="userName"
              key="userName"
              sorter={(a, b) => a.userName.localeCompare(b.userName)}
            />
            <Column
              title="BATCH CODE"
              dataIndex="batchCode"
              key="batchCode"
              sorter={(a, b) => a.batchCode.localeCompare(b.batchCode)}
            />
            <Column
              title="DRUG NAME"
              dataIndex={["drug", "name"]}
              key="drugName"
              sorter={(a, b) => a.drug.name.localeCompare(b.drug.name)}
            />
          </Table>

          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={total}
            onChange={(page) => setCurrentPage(page)}
            style={{ marginTop: 16, textAlign: "right" }}
          />
        </CardBody>
      </Card>
    </div>
  );
}