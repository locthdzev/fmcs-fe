import React from "react";
import { TreatmentPlanDetail } from "@/components/treatment-plan/treatment-plan-detail";
import { useRouter } from "next/router";
import { Spin } from "antd";

export default function TreatmentPlanDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  // Đảm bảo id đã được nạp từ URL trước khi render component
  if (!id) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return <TreatmentPlanDetail id={id as string} />;
} 