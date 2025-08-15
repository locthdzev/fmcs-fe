import React from "react";
import { useRouter } from "next/router";
import { TruckEditForm } from "@/components/truck/TruckEditForm";
import Head from "next/head";

const TruckEditPage = () => {
  const router = useRouter();
  const { id } = router.query;

  if (!id || typeof id !== "string") {
    return <div>Loading...</div>;
  }

  // Hàm xử lý khi đóng form
  const handleClose = () => {
    router.push(`/delivery-truck/${id}`); // Chuyển hướng về trang chi tiết hoặc danh sách
  };

  // Hàm xử lý khi cập nhật thành công
  const handleUpdate = () => {
    // Có thể thêm logic như refresh hoặc thông báo
    router.push(`/delivery-truck/${id}?refresh=${Date.now()}`); // Chuyển hướng với cache-busting
  };

  return (
    <>
      <Head>
        <title>Edit Truck</title>
      </Head>
      <TruckEditForm
        truckId={id}
        onClose={handleClose}
        onUpdate={handleUpdate}
      />
    </>
  );
};

export default TruckEditPage;
