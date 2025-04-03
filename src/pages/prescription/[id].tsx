import React from "react";
import { PrescriptionDetail } from "@/components/prescription/prescription-detail";
import { useRouter } from "next/router";

export default function PrescriptionDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  return <PrescriptionDetail id={id as string} />;
} 