import React from "react";
import { GetServerSideProps } from "next";
import { getDrugGroupById, DrugGroupResponse } from "@/api/druggroup";
import { DrugGroupDetails } from "@/components/drug-group/DrugGroupDetails";

interface DrugGroupDetailPageProps {
  id: string;
  initialData: DrugGroupResponse | null;
}

export default function DrugGroupDetailPage({ id, initialData }: DrugGroupDetailPageProps) {
  console.log("Rendering DrugGroupDetailPage with ID:", id, "Initial data:", initialData);
  return <DrugGroupDetails id={id} initialData={initialData} />;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params || {};
  console.log("Drug Group ID on server side:", id);

  if (!id || Array.isArray(id)) {
    console.log("Invalid drug group ID:", id);
    return {
      notFound: true,
    };
  }

  try {
    console.log("Prefetching drug group data for ID:", id);
    const data = await getDrugGroupById(id);
    console.log("Prefetched data:", data);
    
    return {
      props: {
        id,
        initialData: data || null,
      },
    };
  } catch (error) {
    console.error("Error prefetching drug group data:", error);
    return {
      props: {
        id,
        initialData: null,
      },
    };
  }
} 