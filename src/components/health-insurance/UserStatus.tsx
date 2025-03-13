import React, { useState } from "react";
import { Input, Button, Descriptions } from "antd";
import { getUserInsuranceStatus } from "@/api/healthinsurance";
import { toast } from "react-toastify";

export function UserStatus() {
  const [userId, setUserId] = useState("");
  const [status, setStatus] = useState<any>(null);

  const fetchStatus = async () => {
    try {
      const data = await getUserInsuranceStatus(userId);
      setStatus(data);
    } catch (error) {
      toast.error("Unable to load user status.");
    }
  };

  return (
    <div>
      <Input
        placeholder="Enter User ID"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        style={{ width: 200, marginRight: 16 }}
      />
      <Button type="primary" onClick={fetchStatus}>
        Check Status
      </Button>
      {status && (
        <Descriptions
          title="User Insurance Status"
          bordered
          style={{ marginTop: 16 }}
        >
          <Descriptions.Item label="Has Insurance">
            {status.hasInsurance ? "Yes" : "No"}
          </Descriptions.Item>
          <Descriptions.Item label="Status">{status.status}</Descriptions.Item>
          <Descriptions.Item label="Valid To">
            {status.validTo}
          </Descriptions.Item>
        </Descriptions>
      )}
    </div>
  );
}
