import React from "react";
import { Timeline, Empty, Typography, Spin, Card, Avatar, Divider, Tag } from "antd";
import { HistoryDTO } from "@/api/healthinsurance";
import { 
  UserOutlined, 
  HistoryOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  FormOutlined,
  DeleteOutlined,
  UndoOutlined,
  PlusOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Text, Title } = Typography;

interface InsuranceHistoryTimelineProps {
  histories: HistoryDTO[];
  loading: boolean;
}

const InsuranceHistoryTimeline: React.FC<InsuranceHistoryTimelineProps> = ({ 
  histories,
  loading 
}) => {
  const getActionColor = (action: string | undefined): string => {
    if (!action) return "blue";

    if (action.includes("Verified")) return "green";
    if (action.includes("Rejected")) return "red";
    
    if (action.includes("Status")) {
      if (action.includes("Expired")) return "orange";
      if (action.includes("Active")) return "green";
      if (action.includes("AboutToExpire")) return "orange";
      if (action.includes("SoftDeleted")) return "gray";
      return "blue";
    }
    
    return "blue";
  };

  const getActionIcon = (action: string | undefined) => {
    if (!action) return <HistoryOutlined />;

    if (action.includes("Verified")) return <CheckCircleOutlined />;
    if (action.includes("Rejected")) return <CloseCircleOutlined />;
    if (action.includes("Created")) return <PlusOutlined />;
    if (action.includes("Updated")) return <FormOutlined />;
    if (action.includes("SoftDeleted")) return <DeleteOutlined />;
    if (action.includes("Restored")) return <UndoOutlined />;
    
    return <HistoryOutlined />;
  };
  
  const parseChangesFromJSON = (changeDetails: string | undefined): React.ReactNode => {
    if (!changeDetails) return null;
    
    try {
      // Try to parse as JSON
      if (changeDetails.startsWith('{') && changeDetails.endsWith('}')) {
        const changes = JSON.parse(changeDetails);
        
        // Lọc ra những thay đổi thực sự (khi oldValue khác newValue)
        const changesArray = Object.entries(changes)
          .filter(([field, value]: [string, any]) => {
            let oldValue = value.Item1 !== undefined ? value.Item1 : 'N/A';
            let newValue = value.Item2 !== undefined ? value.Item2 : 'N/A';
            return oldValue !== newValue;
          });
        
        if (changesArray.length === 0) {
          return <Text>No changes detected</Text>;
        }
        
        return (
          <ul className="mt-1 pl-4">
            {changesArray.map(([field, value]: [string, any]) => {
              // Handle different types of value formats
              let oldValue = 'N/A';
              let newValue = 'N/A';
              
              if (value.Item1 !== undefined && value.Item2 !== undefined) {
                oldValue = value.Item1;
                newValue = value.Item2;
              } else if (typeof value === 'string') {
                newValue = value;
              }
              
              return (
                <li key={field} className="mb-1">
                  <Text strong>{field}:</Text>{" "}
                  {field === 'ImageUrl' ? (
                    <>
                      <Tag color="default">Changed</Tag>
                    </>
                  ) : (
                    <>
                      <Text delete type="secondary">
                        {oldValue}
                      </Text>{" "}
                      →{" "}
                      <Text>{newValue}</Text>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        );
      }
    } catch (error) {
      // If not valid JSON, return as plain text
      console.error("Error parsing change details:", error);
    }
    
    // Return as plain text if not JSON or parsing failed
    return <Text>{changeDetails}</Text>;
  };

  const formatDateTime = (dateStr: string | undefined) => {
    if (!dateStr) return "-";
    return dayjs(dateStr).format("DD/MM/YYYY HH:mm:ss");
  };

  const getStatusTag = (status: string | undefined) => {
    if (!status) return <Tag>Unknown</Tag>;
    
    switch (status) {
      case "Active":
        return <Tag color="success">Active</Tag>;
      case "Initial":
        return <Tag color="processing">Initial</Tag>;
      case "Pending":
        return <Tag color="warning">Pending</Tag>;
      case "Expired":
        return <Tag color="error">Expired</Tag>;
      case "AboutToExpire":
        return <Tag color="orange">About To Expire</Tag>;
      case "SoftDeleted":
        return <Tag color="default">Soft Deleted</Tag>;
      case "ExpiredUpdate":
        return <Tag color="magenta">Expired Update</Tag>;
      case "NoInsurance":
        return <Tag color="purple">No Insurance</Tag>;
      case "Completed":
        return <Tag color="success">Completed</Tag>;
      case "Submitted":
        return <Tag color="processing">Submitted</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const getVerificationTag = (status: string | undefined) => {
    if (!status) return <Tag>Not Verified</Tag>;
    
    switch (status) {
      case "Verified":
        return <Tag color="success">Verified</Tag>;
      case "Rejected":
        return <Tag color="error">Rejected</Tag>;
      case "Pending":
        return <Tag color="warning">Pending</Tag>;
      case "Unverified":
        return <Tag color="default">Unverified</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spin size="large" />
      </div>
    );
  }

  if (!histories || histories.length === 0) {
    return (
      <div className="text-center py-8">
        <HistoryOutlined style={{ fontSize: 48, color: '#ccc' }} />
        <Title level={4} className="mt-4">No history found</Title>
        <Text type="secondary">There are no history records for this insurance.</Text>
      </div>
    );
  }

  return (
    <Card title={<span style={{ fontWeight: "bold" }}>History Timeline</span>}>
      <Timeline
        mode="left"
        items={histories.map((history) => ({
          color: getActionColor(history.newStatus || history.newVerificationStatus),
          dot: getActionIcon(history.newStatus || history.newVerificationStatus),
          children: (
            <Card
              size="small"
              className="mb-2 hover:shadow-md transition-shadow"
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div className="flex items-center">
                    <Avatar size="small" icon={<UserOutlined />} className="mr-2" />
                    <Text strong>
                      {history.updatedBy ? `${history.updatedBy.userName || ""} (${history.updatedBy.email || ""})` : "-"}
                    </Text>
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#8c8c8c",
                    }}
                  >
                    {formatDateTime(history.updatedAt)}
                  </div>
                </div>
                
                <Divider style={{ margin: "8px 0" }} />
                
                {history.previousStatus !== history.newStatus && (
                  <p>
                    <Text strong>Status changed:</Text>{" "}
                    {getStatusTag(history.previousStatus)} → {getStatusTag(history.newStatus)}
                  </p>
                )}
                
                {history.previousVerificationStatus !== history.newVerificationStatus && (
                  <p>
                    <Text strong>Verification status changed:</Text>{" "}
                    {getVerificationTag(history.previousVerificationStatus)} → {getVerificationTag(history.newVerificationStatus)}
                  </p>
                )}
                
                {history.changeDetails && (
                  <div>
                    <Text strong>Changes:</Text>
                    {parseChangesFromJSON(history.changeDetails)}
                  </div>
                )}
              </div>
            </Card>
          ),
        }))}
      />
    </Card>
  );
};

export default InsuranceHistoryTimeline; 