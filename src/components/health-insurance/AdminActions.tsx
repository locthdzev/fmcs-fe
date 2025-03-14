import React from "react";
import { Button } from "antd";
import {
  createInitialHealthInsurances,
  sendHealthInsuranceUpdateRequest,
} from "@/api/healthinsurance";
import { toast } from "react-toastify";

export function AdminActions() {
  const handleCreateInitial = async () => {
    try {
      const response = await createInitialHealthInsurances();
      if (response.isSuccess) {
        toast.success("Initial insurances created!");
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error("Unable to create initial insurances.");
    }
  };

  const handleSendUpdateRequest = async () => {
    try {
      const response = await sendHealthInsuranceUpdateRequest();
      if (response.isSuccess) {
        toast.success("Update requests sent!");
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error("Unable to send update requests.");
    }
  };

  return (
    <div>
      <Button
        type="primary"
        onClick={handleCreateInitial}
        style={{ marginRight: 16 }}
      >
        Create Initial Insurances
      </Button>
      <Button type="primary" onClick={handleSendUpdateRequest}>
        Send Update Requests
      </Button>
    </div>
  );
}
