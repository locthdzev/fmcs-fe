import React from "react";
import { NotificationDetail } from "@/components/notification/NotificationDetail";
import { useRouter } from "next/router";
import { Spin } from "antd";

export default function NotificationDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  // Ensure the id is loaded from URL before rendering component
  if (!id) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return <NotificationDetail id={id as string} />;
}
