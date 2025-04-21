import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Radio,
  Select,
  Spin,
  Button,
  Switch,
  Input,
  message,
  Space,
  Typography,
} from "antd";
import {
  ExportConfig,
  exportHistoryToExcel,
} from "./export-excel-insurance-history";
import { DownloadOutlined, FileExcelOutlined } from "@ant-design/icons";
import { getGroupedInsuranceHistories } from "@/api/healthinsurance";

const { Option } = Select;
const { Title } = Typography;

interface InsuranceHistoryExportConfigProps {
  visible: boolean;
  onCancel: () => void;
  currentGroups?: {
    insuranceId: string;
    code: string;
    ownerName: string;
    ownerEmail: string;
    histories: any[];
  }[];
}

const InsuranceHistoryExportConfig: React.FC<
  InsuranceHistoryExportConfigProps
> = ({ visible, onCancel, currentGroups }) => {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exportType, setExportType] = useState<"all" | "specific">("all");
  const [insuranceNumbers, setInsuranceNumbers] = useState<
    { insuranceNumber: string; ownerName: string; ownerEmail: string }[]
  >([]);

  // Lấy danh sách các số bảo hiểm cho dropdown
  useEffect(() => {
    const fetchInsuranceNumbers = async () => {
      try {
        setLoading(true);
        const response = await getGroupedInsuranceHistories(
          1, // page
          1000, // pageSize - lấy số lượng lớn để đảm bảo có đủ dữ liệu
          undefined, // startUpdateDate
          undefined, // endUpdateDate
          undefined, // performedBySearch
          undefined, // previousStatus
          undefined, // newStatus
          "UpdatedAt", // sortBy
          false, // ascending
          undefined // healthInsuranceNumber
        );

        if (response.success) {
          const items = response.data.items || [];

          // Extract unique insurance numbers
          const uniqueInsuranceList = items.map((item: any) => ({
            insuranceNumber: item.insurance.healthInsuranceNumber || "N/A",
            ownerName:
              item.insurance.user?.fullName || item.insurance.fullName || "N/A",
            ownerEmail: item.insurance.user?.email || "",
          }));

          setInsuranceNumbers(uniqueInsuranceList);
        }
      } catch (error) {
        console.error("Error fetching insurance numbers:", error);
        messageApi.error("Failed to load insurance numbers");
      } finally {
        setLoading(false);
      }
    };

    if (visible) {
      fetchInsuranceNumbers();
    }
  }, [visible, messageApi]);

  // Handle form submission
  const handleExport = async () => {
    try {
      const values = await form.validateFields();
      setExporting(true);

      const config: ExportConfig = {
        exportAllData: exportType === "all",
        sortBy: values.sortBy || "UpdatedAt",
        ascending: values.sortOrder === "ascending",
        insuranceNumber: values.insuranceNumber,
        ownerEmail: values.ownerEmail,
        // Không sử dụng currentGroups để luôn lấy dữ liệu mới từ API
        // currentGroups,
      };

      console.log("Exporting with config:", config);

      const result = await exportHistoryToExcel(config);

      if (result.success) {
        messageApi.success(`Successfully exported to ${result.fileName}`);
        onCancel();
      } else {
        // Hiển thị thông báo lỗi chi tiết hơn
        let errorMsg = result.message || "Failed to export data";

        if (errorMsg.includes("No data available")) {
          if (config.exportAllData) {
            errorMsg =
              "No history data available in the system. Please check if records exist.";
          } else {
            errorMsg = `No history data found for the selected insurance. Please try a different insurance number or select "Export All Data".`;
          }
        }

        messageApi.error(errorMsg);
      }
    } catch (error) {
      console.error("Error during export attempt:", error);
      messageApi.error("Failed to export data. An unexpected error occurred.");
    } finally {
      setExporting(false);
    }
  };

  // Reset form when modal is closed
  useEffect(() => {
    if (!visible) {
      form.resetFields();
      setExportType("all");
    }
  }, [visible, form]);

  // Handle export type change
  const handleExportTypeChange = (e: any) => {
    setExportType(e.target.value);
  };

  return (
    <Modal
      title={
        <Title level={4} style={{ margin: 0 }}>
          Export Configuration
        </Title>
      }
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button
          key="export"
          type="primary"
          icon={<DownloadOutlined />}
          loading={exporting}
          onClick={handleExport}
        >
          Export
        </Button>,
      ]}
      destroyOnClose
      width={600}
    >
      {contextHolder}
      <Spin spinning={loading}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            exportType: "all",
            sortBy: "UpdatedAt",
            sortOrder: "descending",
          }}
        >
          <Form.Item name="exportType" label="Export Type">
            <Radio.Group onChange={handleExportTypeChange} value={exportType}>
              <Radio value="all">Export All Data</Radio>
              <Radio value="specific">Export Specific Insurance</Radio>
            </Radio.Group>
          </Form.Item>

          {exportType === "specific" && (
            <Form.Item
              name="insuranceNumber"
              label="Select Insurance"
              rules={[
                { required: true, message: "Please select an insurance" },
              ]}
            >
              <Select
                showSearch
                placeholder="Select an insurance number"
                optionFilterProp="children"
                loading={loading}
                filterOption={(input, option) =>
                  (option?.label?.toString().toLowerCase() || "").includes(
                    input.toLowerCase()
                  )
                }
                options={insuranceNumbers.map((item) => ({
                  value: item.insuranceNumber,
                  label: `${item.insuranceNumber} - ${item.ownerName}`,
                }))}
                onChange={(value, option: any) => {
                  const selected = insuranceNumbers.find(
                    (item) => item.insuranceNumber === value
                  );
                  if (selected) {
                    form.setFieldsValue({ ownerEmail: selected.ownerEmail });
                  }
                }}
              />
            </Form.Item>
          )}

          <Form.Item name="ownerEmail" hidden>
            <Input />
          </Form.Item>

          <div
            style={{
              background: "#f5f5f5",
              padding: "12px",
              borderRadius: "4px",
              marginBottom: "16px",
            }}
          >
            <Form.Item
              name="sortBy"
              label="Sort By"
              style={{ marginBottom: "12px" }}
            >
              <Select>
                <Option value="UpdatedAt">Updated At</Option>
                <Option value="HealthInsuranceNumber">Insurance Number</Option>
                <Option value="UpdatedBy">Performed By</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="sortOrder"
              label="Sort Order"
              style={{ marginBottom: "0" }}
            >
              <Radio.Group>
                <Radio value="ascending">Ascending</Radio>
                <Radio value="descending">Descending</Radio>
              </Radio.Group>
            </Form.Item>
          </div>
        </Form>

        <div
          style={{
            marginTop: "16px",
            fontStyle: "italic",
            fontSize: "13px",
            color: "#888",
          }}
        >
          Note: The exported Excel file will contain all history entries for the
          selected insurance or all insurances if "Export All Data" is selected.
          The data will be formatted with borders and alternating row colors for
          better readability.
        </div>
      </Spin>
    </Modal>
  );
};

export default InsuranceHistoryExportConfig;
