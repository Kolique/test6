"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import {
  listDocuments,
  uploadDocument,
  deleteDocument,
  indexUrl,
  type Document,
} from "@/lib/api";

function formatBytes(bytes: number | null): string {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    indexed: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    processing: "bg-blue-100 text-blue-800",
    error: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
        styles[status] || "bg-gray-100 text-gray-800"
      }`}
    >
      {status}
    </span>
  );
}

export default function DocumentsPage() {
  const { token, tenantId, isAuthenticated } = useAuth();
  const router = useRouter();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [indexingUrl, setIndexingUrl] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/admin/login");
    }
  }, [isAuthenticated, router]);

  const fetchDocuments = useCallback(async () => {
    if (!token || !tenantId) return;
    try {
      const res = await listDocuments(tenantId, token);
      setDocuments(res.documents);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [token, tenantId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !token || !tenantId) return;

    setUploading(true);
    setError("");

    try {
      await uploadDocument(tenantId, file, token);
      await fetchDocuments();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'upload");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDelete(docId: string) {
    if (!token || !tenantId) return;
    if (!confirm("Supprimer ce document et tous ses chunks ?")) return;

    try {
      await deleteDocument(docId, tenantId, token);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de la suppression"
      );
    }
  }

  async function handleIndexUrl(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !tenantId || !urlInput.trim()) return;

    setIndexingUrl(true);
    setError("");

    try {
      await indexUrl(tenantId, urlInput.trim(), token);
      setUrlInput("");
      await fetchDocuments();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de l'indexation"
      );
    } finally {
      setIndexingUrl(false);
    }
  }

  if (!isAuthenticated) return null;

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Documents</h1>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-6">
          {error}
          <button onClick={() => setError("")} className="ml-2 underline">
            Fermer
          </button>
        </div>
      )}

      {/* Upload section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Ajouter un document
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* File upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fichier PDF ou Word
            </label>
            <label
              className={`flex items-center justify-center gap-2 w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition ${
                uploading ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              <svg
                className="w-6 h-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <span className="text-sm text-gray-600">
                {uploading
                  ? "Upload en cours..."
                  : "Cliquez pour selectionner un fichier"}
              </span>
              <input
                type="file"
                accept=".pdf,.docx"
                onChange={handleUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>

          {/* URL indexing */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Indexer une page web
            </label>
            <form onSubmit={handleIndexUrl} className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://mairie-exemple.fr/page"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm text-gray-900"
              />
              <button
                type="submit"
                disabled={indexingUrl || !urlInput.trim()}
                className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {indexingUrl ? "..." : "Indexer"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Documents table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            Documents indexes ({documents.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500">Chargement...</div>
        ) : documents.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            Aucun document. Uploadez votre premier document ci-dessus.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3">Nom</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Taille</th>
                <th className="px-6 py-3">Chunks</th>
                <th className="px-6 py-3">Statut</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {doc.filename}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 uppercase">
                    {doc.file_type}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatBytes(doc.file_size_bytes)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {doc.chunk_count}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={doc.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(doc.created_at).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="text-red-600 hover:text-red-800 text-sm transition"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
