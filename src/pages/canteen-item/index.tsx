import React from 'react';
import { NextPage } from 'next';
import { CanteenItems } from '@/components/canteen-items';
import { DashboardLayout } from '@/dashboard/Layout';
import Head from 'next/head';

const CanteenItemsPage: NextPage = () => {
  return (
    <>
      <CanteenItems />
    </>
  );
};

export default CanteenItemsPage;
