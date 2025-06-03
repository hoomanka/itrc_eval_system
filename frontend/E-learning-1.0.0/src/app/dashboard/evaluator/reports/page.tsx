"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

interface TechnicalReport {
  id: number;
  report_number: string;
  title: string;
  status: "draft" | "generated" | "supervisor_review" | "approved" | "needs_revision" | "rejected";
  evaluation_id: number;
  generated_at: string;
  submitted_for_review_at?: string;
  reviewed_at?: string;
  approved_at?: string;
  supervisor_comments?: string;
  file_size?: number;
  evaluation: {
    id: number;
    overall_score: number;
    application: {
      application_number: string;
      product_name: string;
      product_version: string;
      company_name: string;
    };
  };
}

interface Evaluation {
  id: number;
  status: string;
  overall_score: number;
  report_ready_for_generation: boolean;
  application: {
    id: number;
    application_number: string;
    product_name: string;
    product_version: string;
    company_name: string;
  };
}

export default function TechnicalReportsPage() {
  const [reports, setReports] = useState<TechnicalReport[]>([]);
  const [availableEvaluations, setAvailableEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generatingReport, setGeneratingReport] = useState<number | null>(null);
  const [submittingReport, setSubmittingReport] = useState<number | null>(null);
  
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);
  const [reportTitle, setReportTitle] = useState("");

  useEffect(() => {
    fetchReports();
    fetchAvailableEvaluations();
  }, []);

  // Automatically generate reports for completed evaluations that are ready
  useEffect(() => {
    const handleAutoGeneration = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const evaluationsResponse = await fetch("http://localhost:8000/api/evaluations/my", {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });
        
        if (evaluationsResponse.ok) {
          const evaluations = await evaluationsResponse.json();
          const readyEvaluations = evaluations.filter(
            (e: Evaluation) => e.report_ready_for_generation && !reports.some(r => r.evaluation_id === e.id)
          );

          for (const evaluation of readyEvaluations) {
            await fetch(`http://localhost:8000/api/reports/generate/${evaluation.id}`, {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${token}`,
              },
            });
          }
          
          if (readyEvaluations.length > 0) {
            fetchReports();
          }
        }
      } catch (error) {
        console.error("Auto-generation error:", error);
      }
    };

    handleAutoGeneration();
  }, [reports]);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/api/reports/my-reports", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReports(data);
      } else {
        setError("خطا در بارگیری گزارش‌ها");
      }
    } catch (err) {
      setError("خطا در اتصال به سرور");
    }
  };

  const fetchAvailableEvaluations = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/api/evaluations/my", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        const filteredEvaluations = data.filter((evaluation: Evaluation) => 
          evaluation.status === "completed" && evaluation.report_ready_for_generation
        );
        setAvailableEvaluations(filteredEvaluations);
      } else {
        console.error("Error fetching evaluations");
      }
    } catch (err) {
      console.error("Error in fetchAvailableEvaluations:", err);
    }
  };

  const generateReport = async (evaluationId: number, title?: string) => {
    setGeneratingReport(evaluationId);
    try {
      const token = localStorage.getItem("token");
      const url = `http://localhost:8000/api/reports/generate/${evaluationId}${title ? `?title=${encodeURIComponent(title)}` : ''}`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const newReport = await response.json();
        setReports(prev => [...prev, newReport]);
        setAvailableEvaluations(prev => prev.filter(evaluation => evaluation.id !== evaluationId));
        setShowGenerateModal(false);
        setSelectedEvaluation(null);
        setReportTitle("");
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "خطا در تولید گزارش");
      }
    } catch (err) {
      setError("خطا در اتصال به سرور");
    } finally {
      setGeneratingReport(null);
    }
  };

  const submitForReview = async (reportId: number) => {
    setSubmittingReport(reportId);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8000/api/reports/submit-for-review/${reportId}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        // Update report status in the list
        setReports(prev => prev.map(report => 
          report.id === reportId 
            ? { ...report, status: "supervisor_review" as const, submitted_for_review_at: new Date().toISOString() }
            : report
        ));
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "خطا در ارسال گزارش برای بررسی");
      }
    } catch (err) {
      setError("خطا در اتصال به سرور");
    } finally {
      setSubmittingReport(null);
    }
  };

  const downloadReport = async (reportId: number, reportNumber: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8000/api/reports/download/${reportId}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${reportNumber}.docx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setError("خطا در دانلود گزارش");
      }
    } catch (err) {
      setError("خطا در اتصال به سرور");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: "bg-gray-100 text-gray-800", text: "پیش‌نویس" },
      generated: { color: "bg-blue-100 text-blue-800", text: "تولید شده" },
      supervisor_review: { color: "bg-yellow-100 text-yellow-800", text: "در حال بررسی" },
      approved: { color: "bg-green-100 text-green-800", text: "تأیید شده" },
      needs_revision: { color: "bg-orange-100 text-orange-800", text: "نیاز به بازنگری" },
      rejected: { color: "bg-red-100 text-red-800", text: "رد شده" }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "نامشخص";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "نامشخص";
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">در حال بارگیری...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">گزارش‌های فنی</h1>
              <p className="mt-2 text-gray-600">مدیریت و تولید گزارش‌های فنی ارزیابی</p>
            </div>
            {availableEvaluations.length > 0 && (
              <button
                onClick={() => setShowGenerateModal(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                تولید گزارش جدید
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">کل گزارش‌ها</h3>
            <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">در انتظار بررسی</h3>
            <p className="text-2xl font-bold text-yellow-600">
              {reports.filter(r => r.status === "supervisor_review").length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">تأیید شده</h3>
            <p className="text-2xl font-bold text-green-600">
              {reports.filter(r => r.status === "approved").length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">آماده تولید</h3>
            <p className="text-2xl font-bold text-blue-600">{availableEvaluations.length}</p>
          </div>
        </div>

        {/* Reports Table */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">گزارش‌های من</h2>
          </div>
          
          {reports.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">هیچ گزارشی یافت نشد</h3>
              <p className="mt-1 text-sm text-gray-500">
                {availableEvaluations.length > 0 
                  ? "ارزیابی‌های تکمیل شده برای تولید گزارش آماده هستند"
                  : "ابتدا ارزیابی‌های خود را تکمیل کنید"
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      شماره گزارش
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      محصول
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      امتیاز کلی
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      وضعیت
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      تاریخ تولید
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      اندازه فایل
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      عملیات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reports.map((report) => (
                    <motion.tr
                      key={report.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {report.report_number}
                        </div>
                        <div className="text-sm text-gray-500">
                          {report.evaluation.application.application_number}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {report.evaluation.application.product_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          نسخه {report.evaluation.application.product_version} - {report.evaluation.application.company_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {report.evaluation.overall_score}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(report.status)}
                        {report.supervisor_comments && (
                          <div className="mt-1 text-xs text-gray-500">
                            نظرات ناظر موجود
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(report.generated_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatFileSize(report.file_size)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => downloadReport(report.id, report.report_number)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                            title="دانلود گزارش"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </button>
                          
                          {report.status === "generated" && (
                            <button
                              onClick={() => submitForReview(report.id)}
                              disabled={submittingReport === report.id}
                              className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 disabled:opacity-50"
                              title="ارسال برای بررسی ناظر"
                            >
                              {submittingReport === report.id ? (
                                <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Generate Report Modal */}
        {showGenerateModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg max-w-md w-full p-6"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-4">تولید گزارش فنی جدید</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  انتخاب ارزیابی
                </label>
                <select
                  value={selectedEvaluation?.id || ""}
                  onChange={(e) => {
                    const evaluation = availableEvaluations.find(evalItem => evalItem.id === parseInt(e.target.value));
                    setSelectedEvaluation(evaluation || null);
                  }}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">انتخاب کنید...</option>
                  {availableEvaluations.map((evaluation) => (
                    <option key={evaluation.id} value={evaluation.id}>
                      {evaluation.application.product_name} - امتیاز: {evaluation.overall_score}%
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  عنوان گزارش (اختیاری)
                </label>
                <input
                  type="text"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="عنوان دلخواه برای گزارش"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowGenerateModal(false);
                    setSelectedEvaluation(null);
                    setReportTitle("");
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  انصراف
                </button>
                <button
                  onClick={() => selectedEvaluation && generateReport(selectedEvaluation.id, reportTitle)}
                  disabled={!selectedEvaluation || generatingReport === selectedEvaluation?.id}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {generatingReport === selectedEvaluation?.id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      در حال تولید...
                    </>
                  ) : (
                    "تولید گزارش"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
} 