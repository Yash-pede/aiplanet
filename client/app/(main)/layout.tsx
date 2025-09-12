import Navbar from "@/components/navbar/Navbar";
import { WorkflowStoreProvider } from "@/providers/workflow-store-provider";
import React from "react";

type Props = { children: React.ReactNode };

const Layout = (props: Props) => {
  return (
    <main className="overflow-hidden h-screen w-full">
      <Navbar />
      <main className="">
        <WorkflowStoreProvider>{props.children}</WorkflowStoreProvider>
      </main>
    </main>
  );
};

export default Layout;
