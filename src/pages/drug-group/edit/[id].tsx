import React from "react";
import { GetServerSideProps } from "next";
import { getDrugGroupById, DrugGroupResponse } from "@/api/druggroup";
interface EditDrugGroupPageProps {
  id: string;
  initialData?: DrugGroupResponse | null;
}

export default function EditDrugGroupPage({ id }: EditDrugGroupPageProps) {
  console.log("Rendering EditDrugGroupPage with id:", id);
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const id = context.params?.id as string;

  if (!id) {
    console.log("No ID provided in URL params");
    return {
      notFound: true,
    };
  }

  console.log("Fetching drug group with ID:", id);

  try {
    const drugGroup = await getDrugGroupById(id);

    return {
      props: {
        id,
        initialData: drugGroup || null,
      },
    };
  } catch (error) {
    console.error("Error fetching drug group:", error);
    return {
      props: {
        id,
        initialData: null,
      },
    };
  }
};
