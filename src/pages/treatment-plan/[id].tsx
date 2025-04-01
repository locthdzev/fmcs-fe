import React from "react";
import { TreatmentPlanDetail } from "@/components/treatment-plan/treatment-plan-detail";
import { useRouter } from "next/router";

export default function TreatmentPlanDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  return <TreatmentPlanDetail id={id as string} />;
} 