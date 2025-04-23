import React from "react";
import { Tag } from "antd";
import {
  ClockCircleOutlined,
  SendOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  StopOutlined,
  QuestionCircleOutlined,
  FileExclamationOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";

/**
 * Returns a styled Tag component based on the health insurance status.
 * @param status Status string value
 * @returns Tag component with appropriate color and icon
 */
export const getStatusTag = (status: string) => {
  switch (status) {
    case "Pending":
      return (
        <Tag icon={<ClockCircleOutlined />} color="processing">
          Pending
        </Tag>
      );
    case "Submitted":
      return (
        <Tag icon={<SendOutlined />} color="blue">
          Submitted
        </Tag>
      );
    case "Completed":
      return (
        <Tag icon={<CheckCircleOutlined />} color="success">
          Completed
        </Tag>
      );
    case "Expired":
      return (
        <Tag icon={<WarningOutlined />} color="error">
          Expired
        </Tag>
      );
    case "DeadlineExpired":
      return (
        <Tag icon={<FileExclamationOutlined />} color="volcano">
          Deadline Expired
        </Tag>
      );
    case "SoftDeleted":
      return (
        <Tag icon={<StopOutlined />} color="default">
          Soft Deleted
        </Tag>
      );
    case "NotApplicable":
      return (
        <Tag icon={<QuestionCircleOutlined />} color="purple">
          NotApplicable
        </Tag>
      );
    case "Rejected":
      return (
        <Tag icon={<CloseCircleOutlined />} color="error">
          Rejected
        </Tag>
      );
    default:
      return <Tag>{status}</Tag>;
  }
};

/**
 * Returns a styled Tag component based on the verification status.
 * @param status Verification status string value
 * @returns Tag component with appropriate color and icon
 */
export const getVerificationTag = (status: string) => {
  switch (status) {
    case "Unverified":
      return (
        <Tag icon={<ClockCircleOutlined />} color="warning">
          Unverified
        </Tag>
      );
    case "Verified":
      return (
        <Tag icon={<CheckCircleOutlined />} color="success">
          Verified
        </Tag>
      );
    case "Rejected":
      return (
        <Tag icon={<CloseCircleOutlined />} color="error">
          Rejected
        </Tag>
      );
    default:
      return <Tag>{status}</Tag>;
  }
};

/**
 * Returns the formatted text for a status.
 * @param status Status string value 
 * @returns Formatted status text
 */
export const formatStatusText = (status: string | undefined): string => {
  if (!status) return 'N/A';
  
  // Convert to title case (first letter uppercase, rest lowercase)
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};
