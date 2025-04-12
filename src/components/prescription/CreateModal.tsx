import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  Button,
  Divider,
  Typography,
  InputNumber,
  Space,
  Spin,
} from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";
import moment from "moment";
import {
  createPrescription,
  PrescriptionsCreateRequestDTO,
  PrescriptionDetailsCreateRequestDTO,
} from "@/api/prescription";
import { DrugResponse } from "@/api/drug";
import { 
  getAllHealthCheckResults,
  getHealthCheckResultById,
  HealthCheckResultsResponseDTO 
} from "@/api/healthcheckresult";

const { Option } = Select;
const { TextArea } = Input;
const { Title } = Typography;

interface CreateModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userOptions: { id: string; fullName: string; email: string }[];
  drugOptions: DrugResponse[];
}

interface HealthCheckResultOption {
  id: string;
  healthCheckResultCode: string;
  checkupDate?: string;
  status?: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
  };
}

// Define status constants to match backend values
const HEALTH_CHECK_STATUSES = {
  FOLLOW_UP_REQUIRED: "FollowUpRequired",
  NO_FOLLOW_UP_REQUIRED: "NoFollowUpRequired"
};

const CreateModal: React.FC<CreateModalProps> = ({
  visible,
  onClose,
  onSuccess,
  userOptions,
  drugOptions,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [loadingHealthCheckResults, setLoadingHealthCheckResults] = useState(false);
  const [selectedHealthCheckResultId, setSelectedHealthCheckResultId] = useState<string | null>(null);
  const [healthCheckResultOptions, setHealthCheckResultOptions] = useState<HealthCheckResultOption[]>([]);

  // Reset form when modal is closed
  useEffect(() => {
    if (!visible) {
      form.resetFields();
      setSelectedHealthCheckResultId(null);
    }
  }, [visible, form]);

  // Fetch health check results when modal opens
  useEffect(() => {
    if (visible) {
      fetchHealthCheckResults();
    }
  }, [visible]);

  const fetchHealthCheckResults = async () => {
    setLoadingHealthCheckResults(true);
    try {
      console.log("Fetching all health check results");
      // Call the API without filtering by status to get all results
      const response = await getAllHealthCheckResults(
        1, // page
        500, // pageSize - using a large number to get all results
        undefined, // codeSearch
        undefined, // userSearch
        undefined, // staffSearch
        "CheckupDate", // sortBy
        false, // ascending
        undefined, // status - don't filter by status in API call
        undefined, // checkupStartDate
        undefined, // checkupEndDate
        undefined, // followUpRequired
        undefined, // followUpStartDate
        undefined  // followUpEndDate
      );

      console.log("Health check API full response:", response);

      if (response.success) {
        // Check if data is an array directly or is contained in items property
        const allResults = Array.isArray(response.data) 
          ? response.data 
          : (response.data?.items || []);
          
        console.log("All results:", allResults);
        console.log("All statuses in response:", 
          [...new Set(allResults.map((r: HealthCheckResultsResponseDTO) => r.status))]);
        
        // Filter results with the required statuses using exact backend status values
        const filteredResults = allResults.filter((result: HealthCheckResultsResponseDTO) => 
          result.status === HEALTH_CHECK_STATUSES.FOLLOW_UP_REQUIRED || 
          result.status === HEALTH_CHECK_STATUSES.NO_FOLLOW_UP_REQUIRED
        );
        
        console.log("Filtered results (client-side):", filteredResults);
        console.log("Filtered statuses found:", 
          [...new Set(filteredResults.map((r: HealthCheckResultsResponseDTO) => r.status))]);
        
        if (filteredResults.length === 0) {
          toast.info(`No health check results found with required statuses (${HEALTH_CHECK_STATUSES.FOLLOW_UP_REQUIRED} or ${HEALTH_CHECK_STATUSES.NO_FOLLOW_UP_REQUIRED})`);
        }
        
        // Map the API response to our health check result options format
        const options: HealthCheckResultOption[] = filteredResults.map((result: HealthCheckResultsResponseDTO) => ({
          id: result.id,
          healthCheckResultCode: result.healthCheckResultCode,
          checkupDate: result.checkupDate,
          status: result.status,
          user: result.user
        }));
        
        setHealthCheckResultOptions(options);
      } else {
        console.error("API returned error:", response);
        toast.error(response.message || "Failed to fetch health check results");
        setHealthCheckResultOptions([]);
      }
    } catch (error) {
      console.error("Error fetching health check results:", error);
      toast.error("Failed to fetch health check results");
      setHealthCheckResultOptions([]);
    } finally {
      setLoadingHealthCheckResults(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Transform the form data to match the API structure
      const requestData: PrescriptionsCreateRequestDTO = {
        healthCheckResultId: values.healthCheckResultId,
        prescriptionDate: values.prescriptionDate.format("YYYY-MM-DD"),
        prescriptionDetails: values.prescriptionDetails.map(
          (detail: any): PrescriptionDetailsCreateRequestDTO => ({
            drugId: detail.drugId,
            dosage: detail.dosage,
            quantity: detail.quantity,
            instructions: detail.instructions,
          })
        ),
      };

      console.log("Sending prescription create request:", requestData);
      const response = await createPrescription(requestData);
      console.log("Create prescription response:", response);

      if (response.success || response.isSuccess) {
        toast.success("Prescription created successfully");
        form.resetFields();
        onClose();
        onSuccess();
      } else {
        toast.error(response.message || "Failed to create prescription");
      }
    } catch (error) {
      console.error("Form validation error:", error);
      toast.error("Please check the form for errors");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return '';
    return moment(date).format('DD/MM/YYYY');
  };

  const formatUserInfo = (user?: {id: string; fullName: string; email: string}) => {
    if (!user) return '';
    return `${user.fullName} (${user.email})`;
  };

  return (
    <Modal
      title="Create New Prescription"
      open={visible}
      onCancel={handleCancel}
      width={800}
      footer={[
        <Button key="back" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
        >
          Create
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          prescriptionDate: moment(),
          prescriptionDetails: [{}],
        }}
      >
        <Title level={5}>Basic Information</Title>

        <Form.Item
          name="healthCheckResultId"
          label="Health Check Result"
          rules={[{ required: true, message: "Please select a health check result" }]}
        >
          <Select
            showSearch
            placeholder="Select a health check result"
            optionFilterProp="children"
            onChange={(value) => setSelectedHealthCheckResultId(value)}
            loading={loadingHealthCheckResults}
            filterOption={(input, option) =>
              (option?.label as string)
                .toLowerCase()
                .indexOf(input.toLowerCase()) >= 0
            }
            options={healthCheckResultOptions.map((hcr) => ({
              value: hcr.id,
              label: `${hcr.healthCheckResultCode} (${formatDate(hcr.checkupDate)}) - ${formatUserInfo(hcr.user)} - ${hcr.status}`,
            }))}
            notFoundContent={
              loadingHealthCheckResults ? (
                <Spin size="small" />
              ) : (
                "No health check results with status 'FollowUpRequired' or 'NoFollowUpRequired' found"
              )
            }
          />
        </Form.Item>

        <Form.Item
          name="prescriptionDate"
          label="Prescription Date"
          rules={[{ required: true, message: "Please select a date" }]}
        >
          <DatePicker
            format="DD/MM/YYYY"
            style={{ width: "100%" }}
            placeholder="Select date"
          />
        </Form.Item>

        <Divider />

        <Title level={5}>Prescription Details</Title>

        <Form.List name="prescriptionDetails">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <div key={key} className="mb-4 border p-4 rounded">
                  <div className="flex justify-between mb-2">
                    <Typography.Text strong>Medication #{key + 1}</Typography.Text>
                    {fields.length > 1 && (
                      <Button
                        type="text"
                        danger
                        icon={<MinusCircleOutlined />}
                        onClick={() => remove(name)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>

                  <Form.Item
                    {...restField}
                    name={[name, "drugId"]}
                    label="Medicine"
                    rules={[{ required: true, message: "Please select a medicine" }]}
                  >
                    <Select
                      showSearch
                      placeholder="Select medicine"
                      optionFilterProp="children"
                      filterOption={(input, option) =>
                        (option?.label as string)
                          .toLowerCase()
                          .indexOf(input.toLowerCase()) >= 0
                      }
                      options={drugOptions.map((drug) => ({
                        value: drug.id,
                        label: `${drug.name} (${drug.drugCode})`,
                      }))}
                    />
                  </Form.Item>

                  <Form.Item
                    {...restField}
                    name={[name, "dosage"]}
                    label="Dosage"
                    rules={[{ required: true, message: "Please enter dosage" }]}
                  >
                    <Input placeholder="e.g. 1 tablet twice daily" />
                  </Form.Item>

                  <Form.Item
                    {...restField}
                    name={[name, "quantity"]}
                    label="Quantity"
                    rules={[{ required: true, message: "Please enter quantity" }]}
                  >
                    <InputNumber min={1} placeholder="Quantity" style={{ width: "100%" }} />
                  </Form.Item>

                  <Form.Item
                    {...restField}
                    name={[name, "instructions"]}
                    label="Instructions"
                    rules={[{ required: true, message: "Please enter instructions" }]}
                  >
                    <TextArea rows={2} placeholder="Instructions for taking this medicine" />
                  </Form.Item>
                </div>
              ))}

              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add()}
                  block
                  icon={<PlusOutlined />}
                >
                  Add Medication
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Form>
    </Modal>
  );
};

export default CreateModal;