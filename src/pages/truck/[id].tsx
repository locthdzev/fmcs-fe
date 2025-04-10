import React from "react";
import { TruckDetail } from "@/components/truck/TruckDetails";
import { useRouter } from "next/router";
import Head from "next/head";

const TruckDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;

  if (!id || typeof id !== "string") {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Head>
        <title>Truck Details</title>
      </Head>
      <TruckDetail id={id} />
    </>
  );
};

export default TruckDetailPage; 