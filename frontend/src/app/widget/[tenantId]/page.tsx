import { Metadata } from "next";
import WidgetClient from "./widget-client";

interface Props {
  params: { tenantId: string };
}

export const metadata: Metadata = {
  title: "MairIA Chat",
};

export default function WidgetPage({ params }: Props) {
  return <WidgetClient tenantId={params.tenantId} />;
}
