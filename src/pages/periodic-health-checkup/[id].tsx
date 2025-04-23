import React from "react";
import CheckupDetailStudent from "@/components/periodic-health-checkup/CheckupDetailStudent";
import { useRouter } from "next/router";
import { Spin } from "antd";

export default function PeriodicHealthCheckupDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  // Ensure id is loaded from URL before rendering component
  if (!id) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return <CheckupDetailStudent id={id as string} />;
} 