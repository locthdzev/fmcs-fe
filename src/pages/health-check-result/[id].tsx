import React from "react";
import { HealthCheckResultDetail } from "@/components/health-check-result/health-check-result-detail";
import { useRouter } from "next/router";

export default function HealthCheckResultDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  return <HealthCheckResultDetail id={id as string} />;
} 