"use client";

import { useEffect, useState } from "react";
import ChatWidget from "@/components/chat-widget";

interface TenantConfig {
  name: string;
  primary_color: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function WidgetClient({ tenantId }: { tenantId: string }) {
  const [config, setConfig] = useState<TenantConfig | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/v1/tenants/${tenantId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => setConfig({ name: data.name, primary_color: data.primary_color || "#0055A4" }))
      .catch(() => setError(true));
  }, [tenantId]);

  // Notify parent iframe of loaded state
  useEffect(() => {
    if (config) {
      window.parent?.postMessage({ type: "mairia:ready" }, "*");
    }
  }, [config]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500 text-sm p-4 text-center">
        Widget indisponible. Verifiez la configuration.
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen">
      <ChatWidget
        tenantId={tenantId}
        primaryColor={config.primary_color}
        apiUrl={API_URL}
        mairieName={config.name}
      />
    </div>
  );
}
