import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  Card,
  Typography,
  Tag,
  Input,
  Row,
  Col,
  Empty,
  Spin,
  Select,
  message,
  Button,
  Image,
  Space,
  Tooltip,
} from "antd";
import {
  SearchOutlined,
  FilterOutlined,
  UndoOutlined,
  TagOutlined,
} from "@ant-design/icons";
import { getDrugsByDrugGroupId, DrugResponse } from "@/api/drug";
import Link from "next/link";
import DrugFilterInGroupModal from "./DrugFilterInGroupModal";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

// Fallback image for drugs without images
const FALLBACK_IMAGE = "/images/drug-placeholder.png";

interface DrugListInGroupProps {
  drugGroupId: string;
}

const DrugListInGroup: React.FC<DrugListInGroupProps> = ({ drugGroupId }) => {
  const router = useRouter();
  const [drugs, setDrugs] = useState<DrugResponse[]>([]);
  const [filteredDrugs, setFilteredDrugs] = useState<DrugResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDrugCode, setSelectedDrugCode] = useState<string | null>(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<{
    name?: string;
    manufacturer?: string;
    status?: string;
  }>({});
  const [messageApi, contextHolder] = message.useMessage();

  // Get unique drug codes for dropdown
  const drugCodes = Array.from(
    new Set(drugs.map((drug) => drug.drugCode).filter(Boolean))
  ) as string[];

  // Get unique manufacturers for filter dropdown
  const manufacturers = Array.from(
    new Set(drugs.map((drug) => drug.manufacturer).filter(Boolean))
  ) as string[];

  // Get unique statuses for filter dropdown
  const statuses = Array.from(
    new Set(drugs.map((drug) => drug.status).filter(Boolean))
  ) as string[];

  // Get unique drug names for filter dropdown
  const drugNames = Array.from(
    new Set(drugs.map((drug) => drug.name).filter(Boolean))
  ) as string[];

  // Add debugging for drugGroupId changes
  useEffect(() => {
    console.log("DrugListInGroup received drugGroupId:", drugGroupId);
  }, [drugGroupId]);

  useEffect(() => {
    if (drugGroupId) {
      fetchDrugs();
    } else {
      console.error("No drug group ID provided to DrugListInGroup");
      setError("Missing drug group ID");
      setLoading(false);
    }
  }, [drugGroupId]);

  const fetchDrugs = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching drugs for drug group ID:", drugGroupId);
      if (!drugGroupId) {
        console.error("Missing drug group ID");
        setError("Missing drug group ID");
        messageApi.error("Missing drug group ID");
        setLoading(false);
        return;
      }

      const response = await getDrugsByDrugGroupId(drugGroupId);
      console.log("API Response:", response);

      // The response comes in format { isSuccess: true, code: 200, data: [...drugs] }
      if (response && response.isSuccess) {
        if (Array.isArray(response.data)) {
          console.log("Successfully loaded", response.data.length, "drugs");
          setDrugs(response.data);
          setFilteredDrugs(response.data);

          // Show a friendly message if no drugs are found
          if (response.data.length === 0) {
            messageApi.info("No drugs found for this drug group");
          }
        } else {
          console.error(
            "Expected an array of drugs but got:",
            typeof response.data
          );
          setError("Invalid data format received from server");
          messageApi.error("Failed to load drugs: Invalid data format");
        }
      } else {
        console.error(
          "Unexpected API response structure:",
          JSON.stringify(response)
        );
        setError("Invalid response format received from server");
        messageApi.error("Failed to load drugs: Invalid response format");
      }
    } catch (error: any) {
      console.error("Error fetching drugs:", error);
      setError(error?.message || "Unknown error occurred");
      messageApi.error(
        `Failed to load drugs: ${error?.message || "Unknown error"}`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Apply filters whenever search text or filters change
    applyFilters();
  }, [selectedDrugCode, advancedFilters, drugs]);

  // Apply all filters
  const applyFilters = () => {
    let result = [...drugs];

    // Apply drug code filter
    if (selectedDrugCode) {
      result = result.filter((drug) => drug.drugCode === selectedDrugCode);
    }

    // Apply name filter
    if (advancedFilters.name) {
      const nameLower = advancedFilters.name.toLowerCase();
      result = result.filter((drug) =>
        drug.name?.toLowerCase().includes(nameLower)
      );
    }

    // Apply manufacturer filter
    if (advancedFilters.manufacturer) {
      result = result.filter(
        (drug) => drug.manufacturer === advancedFilters.manufacturer
      );
    }

    // Apply status filter
    if (advancedFilters.status) {
      result = result.filter((drug) => drug.status === advancedFilters.status);
    }

    setFilteredDrugs(result);
  };

  const handleDrugClick = (drugId: string) => {
    router.push(`/drug/${drugId}`);
  };

  const getStatusColor = (status: string | undefined) => {
    if (!status) return "default";

    switch (status.toLowerCase()) {
      case "active":
        return "success";
      case "inactive":
        return "error";
      case "pending":
        return "warning";
      default:
        return "default";
    }
  };

  // Reset function to clear filters and try again
  const handleReset = () => {
    setSelectedDrugCode(null);
    setAdvancedFilters({
      name: undefined,
      manufacturer: undefined,
      status: undefined,
    } as any);

    if (error) {
      fetchDrugs();
    }
  };

  // Handle applying advanced filters
  const handleApplyFilters = (newFilters: any) => {
    setAdvancedFilters(newFilters);
    setFilterModalVisible(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-8">
        <Spin size="large" tip="Loading drugs..." />
        <Text type="secondary" className="mt-4">
          Fetching drugs for this group...
        </Text>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center py-8">
        {contextHolder}
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div className="text-center">
              <Text type="danger">Failed to load drugs</Text>
              <p className="text-gray-500 mt-2">{error}</p>
            </div>
          }
        />
        <Button type="primary" onClick={handleReset} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="drug-list-container">
      {contextHolder}
      {/* Filters */}
      <div className="filters mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Drug Code Select */}
          <Select
            showSearch
            allowClear
            placeholder={
              <div style={{ display: "flex", alignItems: "center" }}>
                <span>Search by drug code...</span>
              </div>
            }
            value={selectedDrugCode}
            onChange={(value) => setSelectedDrugCode(value)}
            style={{ width: "300px" }}
            prefix={<SearchOutlined style={{ color: "blue" }} />}
            filterOption={(input, option) =>
              (option?.value as string)
                .toLowerCase()
                .indexOf(input.toLowerCase()) >= 0
            }
          >
            {drugCodes.map((code) => (
              <Option key={code} value={code}>
                {code}
              </Option>
            ))}
          </Select>

          {/* Advanced Filter Button */}
          <Tooltip title="Advanced Filters">
            <Button
              icon={
                <FilterOutlined
                  style={{
                    color:
                      advancedFilters.name || advancedFilters.manufacturer
                        ? "#1890ff"
                        : undefined,
                  }}
                />
              }
              onClick={() => setFilterModalVisible(true)}
            >
              Filters
            </Button>
          </Tooltip>

          {/* Status Select */}
          <Select
            allowClear
            style={{ width: "120px" }}
            placeholder={
              <div style={{ display: "flex", alignItems: "center" }}>
                <TagOutlined style={{ marginRight: 8 }} />
                <span>Status</span>
              </div>
            }
            value={advancedFilters.status}
            onChange={(value) =>
              setAdvancedFilters((prev) => ({ ...prev, status: value }))
            }
          >
            {statuses.map((status) => (
              <Option key={status} value={status}>
                {status}
              </Option>
            ))}
          </Select>

          {/* Reset Button */}
          <Tooltip title="Reset All Filters">
            <Button
              icon={<UndoOutlined />}
              onClick={handleReset}
              disabled={
                !(
                  selectedDrugCode ||
                  advancedFilters.name ||
                  advancedFilters.manufacturer ||
                  advancedFilters.status
                )
              }
            />
          </Tooltip>
        </div>
      </div>

      {/* List Header */}
      <div className="mb-4 flex justify-between items-center">
        <Title level={5}>Drugs List</Title>
        <Text type="secondary">
          {filteredDrugs.length} {filteredDrugs.length === 1 ? "item" : "items"}{" "}
          found
        </Text>
      </div>

      {/* Drug List */}
      {filteredDrugs.length > 0 ? (
        <Row gutter={[16, 16]}>
          {filteredDrugs.map((drug) => (
            <Col xs={24} sm={12} md={8} lg={6} xl={6} key={drug.id}>
              <Card
                hoverable
                className="h-full"
                cover={
                  <div
                    className="p-4 bg-gray-50 flex justify-center items-center"
                    style={{ height: 200 }}
                  >
                    {drug.imageUrl ? (
                      <div className="flex justify-center items-center w-full">
                        <Image
                          src={drug.imageUrl}
                          alt={drug.name}
                          preview={{ mask: "Click to view" }}
                          height={150}
                          style={{
                            objectFit: "contain",
                          }}
                        />
                      </div>
                    ) : (
                      <div className="flex justify-center items-center h-full w-full bg-gray-100">
                        <Text type="secondary">No image</Text>
                      </div>
                    )}
                  </div>
                }
              >
                <Link href={`/drug/${drug.id}`}>
                  <Title level={5} className="text-blue-600 cursor-pointer">
                    {drug.drugCode}
                  </Title>
                </Link>

                <Text strong className="block mb-1">
                  {drug.name}
                </Text>

                <Tag color={getStatusColor(drug.status)} className="mb-2">
                  {drug.status || "Unknown"}
                </Tag>

                <Paragraph
                  ellipsis={{ rows: 2, expandable: false }}
                  className="text-gray-500 mb-2"
                >
                  {drug.description || "No description available"}
                </Paragraph>

                <Text type="secondary" className="block">
                  Manufacturer: {drug.manufacturer || "Unknown"}
                </Text>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Empty
          description={
            <div>
              <p>No drugs found in this group</p>
              <p className="text-gray-400 text-sm">
                {selectedDrugCode ||
                advancedFilters.name ||
                advancedFilters.manufacturer ||
                advancedFilters.status
                  ? "Try adjusting your search or filter criteria"
                  : "You can add drugs to this group from the drug management page"}
              </p>
            </div>
          }
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}

      {/* Filter Modal */}
      <DrugFilterInGroupModal
        visible={filterModalVisible}
        onCancel={() => setFilterModalVisible(false)}
        onApply={handleApplyFilters}
        onReset={handleReset}
        filters={advancedFilters}
        manufacturers={manufacturers.filter((m): m is string => Boolean(m))}
        statuses={statuses.filter((s): s is string => Boolean(s))}
        drugNames={drugNames.filter((n): n is string => Boolean(n))}
      />
    </div>
  );
};

export default DrugListInGroup;
