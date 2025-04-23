import React from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { Spin } from "antd";

// Use dynamic import with ssr disabled to avoid hydration errors
const BatchNumberDetail = dynamic(
  () => import("@/components/batchnumber/BacthNumberDetail"),
  { ssr: false }
);

export default function BatchNumberDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  // Remove debugging logs that can cause hydration mismatches
  
  // Ensure id is loaded from URL before rendering component
  if (!id) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return <BatchNumberDetail id={id as string} />;
}
