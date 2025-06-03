"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface DocumentItem {
  id: number;
  document_type: string;
  version: number;
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  is_approved: boolean;
  approval_notes?: string;
  uploaded_at: string;
}

export default function DocumentsPage() {
  const params = useParams();
  const applicationId = params?.id;
  const router = useRouter();

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!applicationId) return;
    const fetchDocs = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await fetch(`http://localhost:8000/api/documents/application/${applicationId}`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (response.ok) {
          const data = await response.json();
          setDocuments(data);
        } else {
          setError("خطا در بارگیری اسناد");
        }
      } catch (err) {
        setError("خطا در اتصال به سرور");
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, [applicationId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <p className="text-gray-600">در حال بارگیری اسناد...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            اسناد درخواست {applicationId}
          </h1>
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:underline"
          >
            بازگشت
          </button>
        </div>
        {error && (
          <div className="mb-4 text-red-600 font-medium">{error}</div>
        )}
        {documents.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            هیچ سندی یافت نشد
          </div>
        ) : (
          <ul className="space-y-4">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className="bg-white p-4 rounded-lg shadow flex justify-between items-center"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {doc.original_filename}
                  </p>
                  <p className="text-sm text-gray-500">
                    نوع: {doc.document_type} | نسخه: {doc.version}
                  </p>
                  <p className="text-sm text-gray-500">
                    حجم: {(doc.file_size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <Link
                  href={`http://localhost:8000/api/documents/download/${doc.id}`}
                  target="_blank"
                  className="text-green-600 hover:text-green-800 font-medium"
                >
                  دانلود
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
} 