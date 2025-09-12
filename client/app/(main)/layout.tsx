import Navbar from "@/components/navbar/Navbar";
import React from "react";

type Props = { children: React.ReactNode };

const Layout = (props: Props) => {
  return (
    <main className="overflow-hidden h-screen w-full">
      <Navbar />
      <main className="">
      {props.children}
      </main>
    </main>
  );
};

export default Layout;
