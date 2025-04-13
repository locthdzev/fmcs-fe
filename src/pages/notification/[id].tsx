import React from "react";
import { UserDetail } from "@/components/user/UserDetail";
import { useRouter } from "next/router";
import { Spin } from "antd";

export default function UserDetailPage() {
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

  return <UserDetail id={id as string} />;
}
