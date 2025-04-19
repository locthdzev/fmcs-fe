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

  return (
    <>
      <Head>
        <title>Edit Truck</title>
      </Head>
      <TruckEditForm truckId={id} />
    </>
  );
};

export default TruckEditPage; 