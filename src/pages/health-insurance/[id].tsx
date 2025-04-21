import React, { useState, useEffect } from "react";
import { GetServerSideProps } from "next";
import { InsuranceDetail } from "@/components/health-insurance/InsuranceDetail";
import { Spin } from "antd";

interface InsuranceDetailPageProps {
  id: string;
}

const InsuranceDetailPage: React.FC<InsuranceDetailPageProps> = ({ id }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  return <>{loading ? <Spin size="large" /> : <InsuranceDetail id={id} />}</>;
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const id = context.query.id as string;

  return {
    props: {
      id,
    },
  };
};

export default InsuranceDetailPage;
