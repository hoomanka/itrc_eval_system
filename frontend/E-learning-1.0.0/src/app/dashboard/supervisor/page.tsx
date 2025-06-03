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
  generator: {
    id: number;
    full_name: string;
    email: string;
  };
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

interface DashboardStats {
  total_supervised_evaluators: number;
  total_reports_to_review: number;
  reports_pending_review: number;
  reports_reviewed_today: number;
  total_approved_reports: number;
}

export default function SupervisorDashboard() {
  const [pendingReports, setPendingReports] = useState<TechnicalReport[]>([]);
  const [allReports, setAllReports] = useState<TechnicalReport[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total_supervised_evaluators: 0,
    total_reports_to_review: 0,
    reports_pending_review: 0,
    reports_reviewed_today: 0,
    total_approved_reports: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewingReport, setReviewingReport] = useState<number | null>(null);
  
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<TechnicalReport | null>(null);
  const [reviewStatus, setReviewStatus] = useState<"approved" | "needs_revision" | "rejected">("approved");
  const [supervisorComments, setSupervisorComments] = useState("");

  useEffect(() => {
    fetchPendingReports();
    fetchAllReports();
    fetchStats();
  }, []);

  const fetchPendingReports = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/api/reports/pending-review", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPendingReports(data);
      } else {
        setError("خطا در بارگیری گزارش‌های در انتظار بررسی");
      }
    } catch (err) {
      setError("خطا در اتصال به سرور");
    }
  };

  const fetchAllReports = async () => {
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
        setAllReports(data);
      }
    } catch (err) {
      console.error("Error fetching all reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    // Calculate stats from the data we have
    const pendingCount = pendingReports.filter(r => r.status === "supervisor_review").length;
    const approvedCount = allReports.filter(r => r.status === "approved").length;
    const todayReviewed = allReports.filter(r => {
      if (!r.reviewed_at) return false;
      const reviewDate = new Date(r.reviewed_at);
      const today = new Date();
      return reviewDate.toDateString() === today.toDateString();
    }).length;

    setStats({
      total_supervised_evaluators: 1, // This would come from API
      total_reports_to_review: pendingReports.length,
      reports_pending_review: pendingCount,
      reports_reviewed_today: todayReviewed,
      total_approved_reports: approvedCount
    });
  };

  const reviewReport = async (reportId: number, status: string, comments: string) => {
    setReviewingReport(reportId);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8000/api/reports/review/${reportId}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: status,
          supervisor_comments: comments
        }),
      });

      if (response.ok) {
        // Update reports in both lists
        setPendingReports(prev => prev.filter(report => report.id !== reportId));
        setAllReports(prev => prev.map(report => 
          report.id === reportId 
            ? { 
                ...report, 
                status: status as any, 
                supervisor_comments: comments,
                reviewed_at: new Date().toISOString()
              }
            : report
        ));
        
        setShowReviewModal(false);
        setSelectedReport(null);
        setSupervisorComments("");
        
        // Refresh stats
        fetchStats();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "خطا در بررسی گزارش");
      }
    } catch (err) {
      setError("خطا در اتصال به سرور");
    } finally {
      setReviewingReport(null);
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

  const openReviewModal = (report: TechnicalReport) => {
    setSelectedReport(report);
    setReviewStatus("approved");
    setSupervisorComments("");
    setShowReviewModal(true);
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
          <h1 className="text-3xl font-bold text-gray-900">داشبورد ناظر</h1>
          <p className="mt-2 text-gray-600">بررسی و تأیید گزارش‌های فنی ارزیابان</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="mr-4">
                <h3 className="text-sm font-medium text-gray-500">ارزیابان تحت نظارت</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.total_supervised_evaluators}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="mr-4">
                <h3 className="text-sm font-medium text-gray-500">در انتظار بررسی</h3>
                <p className="text-2xl font-bold text-yellow-600">{stats.reports_pending_review}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="mr-4">
                <h3 className="text-sm font-medium text-gray-500">تأیید شده</h3>
                <p className="text-2xl font-bold text-green-600">{stats.total_approved_reports}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="mr-4">
                <h3 className="text-sm font-medium text-gray-500">بررسی شده امروز</h3>
                <p className="text-2xl font-bold text-purple-600">{stats.reports_reviewed_today}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="mr-4">
                <h3 className="text-sm font-medium text-gray-500">کل گزارش‌ها</h3>
                <p className="text-2xl font-bold text-indigo-600">{stats.total_reports_to_review}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Reports Section */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200 bg-yellow-50">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">گزارش‌های در انتظار بررسی</h2>
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                {pendingReports.length} گزارش
              </span>
            </div>
          </div>
          
          {pendingReports.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">هیچ گزارشی در انتظار بررسی نیست</h3>
              <p className="mt-1 text-sm text-gray-500">تمام گزارش‌های ارسال شده بررسی شده‌اند</p>
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
                      ارزیاب
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      امتیاز کلی
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      تاریخ ارسال
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      عملیات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingReports.map((report) => (
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
                          {report.generator.full_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {report.generator.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {report.evaluation.overall_score}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(report.submitted_for_review_at)}
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
                          
                          <button
                            onClick={() => openReviewModal(report)}
                            className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                          >
                            بررسی گزارش
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* All Reports Section */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">تمام گزارش‌های بررسی شده</h2>
          </div>
          
          {allReports.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">هیچ گزارشی یافت نشد</h3>
              <p className="mt-1 text-sm text-gray-500">هنوز گزارشی برای بررسی ارسال نشده است</p>
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
                      ارزیاب
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      وضعیت
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      تاریخ بررسی
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      عملیات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allReports.slice(0, 10).map((report) => (
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
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {report.evaluation.application.product_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {report.generator.full_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(report.status)}
                        {report.supervisor_comments && (
                          <div className="mt-1 text-xs text-gray-500">
                            نظرات: {report.supervisor_comments.substring(0, 50)}...
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(report.reviewed_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => downloadReport(report.id, report.report_number)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="دانلود گزارش"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Review Modal */}
        {showReviewModal && selectedReport && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg max-w-lg w-full p-6"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-4">بررسی گزارش فنی</h3>
              
              <div className="mb-4">
                <div className="text-sm text-gray-600 mb-2">
                  گزارش: {selectedReport.report_number}
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  محصول: {selectedReport.evaluation.application.product_name}
                </div>
                <div className="text-sm text-gray-600 mb-4">
                  ارزیاب: {selectedReport.generator.full_name}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نتیجه بررسی
                </label>
                <select
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value as any)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="approved">تأیید</option>
                  <option value="needs_revision">نیاز به بازنگری</option>
                  <option value="rejected">رد</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نظرات و توضیحات
                </label>
                <textarea
                  value={supervisorComments}
                  onChange={(e) => setSupervisorComments(e.target.value)}
                  rows={4}
                  placeholder="نظرات، پیشنهادات و توضیحات خود را وارد کنید..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowReviewModal(false);
                    setSelectedReport(null);
                    setSupervisorComments("");
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  انصراف
                </button>
                <button
                  onClick={() => reviewReport(selectedReport.id, reviewStatus, supervisorComments)}
                  disabled={reviewingReport === selectedReport.id}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {reviewingReport === selectedReport.id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      در حال بررسی...
                    </>
                  ) : (
                    "ثبت نتیجه بررسی"
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