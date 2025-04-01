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
  Space,
  Spin,
} from "antd";
import { toast } from "react-toastify";
import moment from "moment";
import {
  createTreatmentPlan,
  TreatmentPlanCreateRequestDTO,
} from "@/api/treatment-plan";
import { DrugResponse } from "@/api/drug";
import {
  getAllHealthCheckResults,
  getHealthCheckResultById,
  HealthCheckResultsResponseDTO,
} from "@/api/healthcheckresult";
import { getDrugsByHealthCheckResultId } from "@/api/prescription";

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
  NO_FOLLOW_UP_REQUIRED: "NoFollowUpRequired",
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
  const [loadingHealthCheckResults, setLoadingHealthCheckResults] =
    useState(false);
  const [loadingPrescriptionDrugs, setLoadingPrescriptionDrugs] =
    useState(false);
  const [selectedHealthCheckResultId, setSelectedHealthCheckResultId] =
    useState<string | null>(null);
  const [healthCheckResultOptions, setHealthCheckResultOptions] = useState<
    HealthCheckResultOption[]
  >([]);
  const [prescriptionDrugs, setPrescriptionDrugs] = useState<DrugResponse[]>(
    []
  );

  // Reset form when modal is closed
  useEffect(() => {
    if (!visible) {
      form.resetFields();
      setSelectedHealthCheckResultId(null);
      setPrescriptionDrugs([]);
    }
  }, [visible, form]);

  // Fetch health check results when modal opens
  useEffect(() => {
    if (visible) {
      fetchHealthCheckResults();
    }
  }, [visible]);

  // Fetch prescription drugs when health check result is selected
  useEffect(() => {
    if (selectedHealthCheckResultId) {
      fetchPrescriptionDrugs(selectedHealthCheckResultId);
      // Clear the selected drug when health check result changes
      form.setFieldValue("drugId", undefined);
    } else {
      setPrescriptionDrugs([]);
    }
  }, [selectedHealthCheckResultId, form]);

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
        undefined // followUpEndDate
      );

      console.log("Health check API full response:", response);

      if (response.success) {
        // Check if data is an array directly or is contained in items property
        const allResults = Array.isArray(response.data)
          ? response.data
          : response.data?.items || [];

        console.log("All results:", allResults);
        console.log("All statuses in response:", [
          ...new Set(
            allResults.map((r: HealthCheckResultsResponseDTO) => r.status)
          ),
        ]);

        // Filter results with the required statuses using exact backend status values
        const filteredResults = allResults.filter(
          (result: HealthCheckResultsResponseDTO) =>
            result.status === HEALTH_CHECK_STATUSES.FOLLOW_UP_REQUIRED ||
            result.status === HEALTH_CHECK_STATUSES.NO_FOLLOW_UP_REQUIRED
        );

        console.log("Filtered results (client-side):", filteredResults);
        console.log("Filtered statuses found:", [
          ...new Set(
            filteredResults.map((r: HealthCheckResultsResponseDTO) => r.status)
          ),
        ]);

        if (filteredResults.length === 0) {
          toast.info(
            `No health check results found with required statuses (${HEALTH_CHECK_STATUSES.FOLLOW_UP_REQUIRED} or ${HEALTH_CHECK_STATUSES.NO_FOLLOW_UP_REQUIRED})`
          );
        }

        // Map the API response to our health check result options format
        const options: HealthCheckResultOption[] = filteredResults.map(
          (result: HealthCheckResultsResponseDTO) => ({
            id: result.id,
            healthCheckResultCode: result.healthCheckResultCode,
            checkupDate: result.checkupDate,
            status: result.status,
            user: result.user,
          })
        );

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

  const fetchPrescriptionDrugs = async (healthCheckResultId: string) => {
    setLoadingPrescriptionDrugs(true);
    try {
      const response = await getDrugsByHealthCheckResultId(healthCheckResultId);

      if (response.success || response.isSuccess) {
        // Process the drugs data
        setPrescriptionDrugs(response.data || []);

        if (!response.data || response.data.length === 0) {
          toast.info(
            "No drugs found in prescriptions for this Health Check Result"
          );
        }
      } else {
        console.error("API returned error:", response);
        toast.error(response.message || "Failed to fetch prescription drugs");
        setPrescriptionDrugs([]);
      }
    } catch (error) {
      console.error("Error fetching prescription drugs:", error);
      toast.error("Failed to fetch prescription drugs");
      setPrescriptionDrugs([]);
    } finally {
      setLoadingPrescriptionDrugs(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Transform the form data to match the API structure
      const requestData: TreatmentPlanCreateRequestDTO = {
        healthCheckResultId: values.healthCheckResultId,
        drugId: values.drugId,
        treatmentDescription: values.treatmentDescription,
        instructions: values.instructions,
        startDate: values.startDate.format("YYYY-MM-DD"),
        endDate: values.endDate.format("YYYY-MM-DD"),
      };

      console.log("Sending treatment plan create request:", requestData);
      const response = await createTreatmentPlan(requestData);
      console.log("Create treatment plan response:", response);

      if (response.success || response.isSuccess) {
        toast.success("Treatment plan created successfully");
        form.resetFields();
        onClose();
        onSuccess();
      } else {
        toast.error(response.message || "Failed to create treatment plan");
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
    if (!date) return "";
    return moment(date).format("DD/MM/YYYY");
  };

  const formatUserInfo = (user?: {
    id: string;
    fullName: string;
    email: string;
  }) => {
    if (!user) return "";
    return `${user.fullName} (${user.email})`;
  };

  return (
    <Modal
      title="Create New Treatment Plan"
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
          startDate: moment(),
          endDate: moment().add(7, "days"),
        }}
      >
        <Title level={5}>Basic Information</Title>

        <Form.Item
          name="healthCheckResultId"
          label="Health Check Result"
          rules={[
            { required: true, message: "Please select a health check result" },
          ]}
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
              label: `${hcr.healthCheckResultCode} (${formatDate(
                hcr.checkupDate
              )}) - ${formatUserInfo(hcr.user)} - ${hcr.status}`,
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
          name="drugId"
          label="Medicine"
          rules={[{ required: true, message: "Please select a medicine" }]}
        >
          <Select
            showSearch
            placeholder="Select medicine"
            optionFilterProp="children"
            loading={loadingPrescriptionDrugs}
            disabled={!selectedHealthCheckResultId || loadingPrescriptionDrugs}
            filterOption={(input, option) =>
              (option?.label as string)
                .toLowerCase()
                .indexOf(input.toLowerCase()) >= 0
            }
            options={prescriptionDrugs.map((drug) => ({
              value: drug.id,
              label: `${drug.name} (${drug.drugCode})`,
            }))}
            notFoundContent={
              loadingPrescriptionDrugs ? (
                <Spin size="small" />
              ) : selectedHealthCheckResultId ? (
                "No drugs found in prescriptions for this Health Check Result"
              ) : (
                "Please select a Health Check Result first"
              )
            }
          />
        </Form.Item>

        <Form.Item
          name="treatmentDescription"
          label="Treatment Description"
          rules={[
            { required: true, message: "Please enter treatment description" },
          ]}
        >
          <TextArea rows={4} placeholder="Enter treatment description" />
        </Form.Item>

        <Form.Item
          name="instructions"
          label="Instructions"
          rules={[{ required: true, message: "Please enter instructions" }]}
        >
          <TextArea
            rows={4}
            placeholder="Enter instructions for the treatment"
          />
        </Form.Item>

        <Form.Item
          name="startDate"
          label="Start Date"
          rules={[{ required: true, message: "Please select start date" }]}
        >
          <DatePicker
            format="DD/MM/YYYY"
            style={{ width: "100%" }}
            placeholder="Select start date"
          />
        </Form.Item>

        <Form.Item
          name="endDate"
          label="End Date"
          rules={[{ required: true, message: "Please select end date" }]}
        >
          <DatePicker
            format="DD/MM/YYYY"
            style={{ width: "100%" }}
            placeholder="Select end date"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateModal;
