"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import {
  listConversations,
  deleteConversation,
  type Conversation,
} from "@/lib/api";

export default function ConversationsPage() {
  const { token, tenantId, isAuthenticated } = useAuth();
  const router = useRouter();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/admin/login");
    }
  }, [isAuthenticated, router]);

  const fetchConversations = useCallback(async () => {
    if (!token || !tenantId) return;
    try {
      const res = await listConversations(tenantId, token);
      setConversations(res.conversations);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [token, tenantId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  async function handleDelete(convoId: string) {
    if (!token || !tenantId) return;
    if (!confirm("Supprimer cette conversation ? (droit a l'oubli RGPD)"))
      return;

    try {
      await deleteConversation(convoId, tenantId, token);
      setConversations((prev) => prev.filter((c) => c.id !== convoId));
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de la suppression"
      );
    }
  }

  if (!isAuthenticated) return null;

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Conversations</h1>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-6">
          {error}
          <button onClick={() => setError("")} className="ml-2 underline">
            Fermer
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">
            Historique ({conversations.length})
          </h2>
          <p className="text-xs text-gray-500">
            Visible uniquement si le logging est active (opt-in RGPD)
          </p>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500">Chargement...</div>
        ) : conversations.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="mb-2">Aucune conversation enregistree.</p>
            <p className="text-xs">
              Le logging des conversations est desactive par defaut (RGPD).
              Activez-le dans les parametres si necessaire.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {conversations.map((convo) => (
              <div key={convo.id} className="hover:bg-gray-50 transition">
                <div
                  className="px-6 py-4 flex items-center justify-between cursor-pointer"
                  onClick={() =>
                    setExpandedId(
                      expandedId === convo.id ? null : convo.id
                    )
                  }
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">
                      {convo.messages?.[0]?.content || "Conversation vide"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(convo.created_at).toLocaleString("fr-FR")} —{" "}
                      {convo.messages?.length || 0} messages
                    </p>
                  </div>

                  <div className="flex items-center gap-3 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(convo.id);
                      }}
                      className="text-red-600 hover:text-red-800 text-xs transition"
                    >
                      Supprimer
                    </button>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        expandedId === convo.id ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>

                {expandedId === convo.id && (
                  <div className="px-6 pb-4 space-y-3">
                    {convo.messages?.map(
                      (msg: { role: string; content: string }, i: number) => (
                        <div
                          key={i}
                          className={`p-3 rounded-lg text-sm ${
                            msg.role === "user"
                              ? "bg-blue-50 text-blue-900"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          <span className="font-medium text-xs uppercase tracking-wide block mb-1">
                            {msg.role === "user" ? "Citoyen" : "MairIA"}
                          </span>
                          {msg.content}
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
