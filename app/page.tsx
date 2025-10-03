"use client";

import { CopilotKit } from "@copilotkit/react-core";
import dynamic from "next/dynamic";

const MainView = dynamic(() => import("../components/MainView"), { ssr: false });

export default function Home() {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit">
      <MainView />
    </CopilotKit>
  );
}
