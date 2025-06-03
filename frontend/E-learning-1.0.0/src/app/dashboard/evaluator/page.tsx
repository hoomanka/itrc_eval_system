"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
}

interface Application {
  id: number;
  application_number: string;
  product_name: string;
  product_type: string;
  company_name: string;
  applicant_name?: string;
  status: string;
  submission_date: string | null;
  evaluation_level: string;
  created_at: string;
  updated_at: string;
}

export default function EvaluatorDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inEvaluation: 0,
    completed: 0
  });

  // Function to translate status to Persian
  const getStatusDisplay = (status: string) => {
    const statusMap: { [key: string]: { text: string; color: string } } = {
      'draft': { text: 'پیش‌نویس', color: 'bg-gray-100 text-gray-800' },
      'submitted': { text: 'ارسال شده', color: 'bg-yellow-100 text-yellow-800' },
      'in_review': { text: 'در حال بررسی', color: 'bg-blue-100 text-blue-800' },
      'in_evaluation': { text: 'در حال ارزیابی', color: 'bg-purple-100 text-purple-800' },
      'completed': { text: 'تکمیل شده', color: 'bg-green-100 text-green-800' },
      'rejected': { text: 'رد شده', color: 'bg-red-100 text-red-800' }
    };
    return statusMap[status] || { text: status, color: 'bg-gray-100 text-gray-800' };
  };

  // Function to format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const loadApplications = async () => {
    setLoading(true);
    setError(""); // Clear previous errors
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("توکن احراز هویت یافت نشد");
        window.location.href = "/signin";
        return;
      }
  
      console.log("🔍 Loading applications for evaluator dashboard...");
      const response = await fetch("http://localhost:8000/api/applications/dashboard/list", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Cache-Control": "no-cache",
        },
      });
      
      console.log("📡 Response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API Error:", errorText);
        throw new Error(`Failed to load applications: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log("📊 Raw API Response Data (Evaluator):", data);
      console.log("📊 Number of applications received:", data.length);
  
      const transformedData = data.map((app: any, index: number) => {
        try {
          console.log(`🔍 Processing application ${index + 1}:`, app);
          return {
            id: app.id,
            application_number: app.application_number || `APP-${app.id}`,
            product_name: app.product_name || 'نامشخص',
            product_type: app.product_type_name || app.product_type || '-',
            company_name: app.applicant_name || app.company_name || '-',
            status: app.status,
            submission_date: app.submission_date || app.created_at,
            evaluation_level: app.evaluation_level || 'تعیین نشده',
            applicant_name: app.applicant_name || app.company_name || 'نامشخص',
            created_at: app.created_at,
            updated_at: app.updated_at
          };
        } catch (error) {
          console.error("Error transforming application (Evaluator):", app, error);
          return null;
        }
      }).filter(Boolean) as Application[];
  
      console.log("✅ All transformed applications:", transformedData);
      
      // Filter applications for evaluator view AFTER transformation
      const filteredData = transformedData.filter((app: Application) => 
        app.status === 'submitted' || app.status === 'in_evaluation'
      );
      console.log("🎯 Filtered applications for evaluator (submitted/in_evaluation):", filteredData);
      console.log("🎯 Number of filtered applications:", filteredData.length);
      
      setApplications(filteredData);
      setLastRefresh(new Date());
      
      // Update stats for evaluator
      const total = filteredData.length;
      const pending = filteredData.filter((app: Application) => 
        app.status === 'submitted' 
      ).length;
      const inEvaluation = filteredData.filter((app: Application) => 
        app.status === 'in_evaluation'
      ).length;
      const completed = filteredData.filter((app: Application) =>
        app.status === 'completed' 
      ).length; 
      
      setStats({ total, pending, inEvaluation, completed });
      console.log("📈 Stats updated:", { total, pending, inEvaluation, completed });
    } catch (error: any) {
      console.error("❌ Failed to load applications (Evaluator):", error);
      setError(`خطا در بارگذاری درخواست‌ها: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Add a function to refresh applications
  const refreshApplications = () => {
    console.log("🔄 Manual refresh triggered");
    loadApplications();
  };

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
    
    // Load applications and stats from API
    loadApplications();
    
    // Set up polling to refresh applications every 30 seconds
    const interval = setInterval(() => {
      console.log("⏰ Auto-refresh triggered");
      refreshApplications();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  if (loading && !applications.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !applications.length) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-lg font-medium text-red-800 mb-2">خطا</h2>
            <p className="text-red-700">{error}</p>
            <button
              onClick={loadApplications}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              تلاش مجدد
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                پنل ارزیاب
              </h1>
            </div>
            <div className="flex items-center space-x-4 space-x-reverse">
              <span className="text-gray-700">خوش آمدید، {user?.full_name}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                خروج
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-lg shadow"
          >
            <h3 className="text-lg font-medium text-gray-900">کل ارزیابی‌ها</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-lg shadow"
          >
            <h3 className="text-lg font-medium text-gray-900">در انتظار ارزیابی</h3>
            <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-lg shadow"
          >
            <h3 className="text-lg font-medium text-gray-900">در حال ارزیابی</h3>
            <p className="text-3xl font-bold text-purple-600">{stats.inEvaluation}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-lg shadow"
          >
            <h3 className="text-lg font-medium text-gray-900">تکمیل شده</h3>
            <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">عملیات سریع</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href="/dashboard/evaluator/evaluations"
                className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg text-center transition duration-200"
              >
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h3 className="font-medium">انجام ارزیابی</h3>
                <p className="text-sm opacity-90">شروع فرآیند ارزیابی محصولات</p>
              </Link>
              
              <Link
                href="/dashboard/evaluator/reports"
                className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg text-center transition duration-200"
              >
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="font-medium">تولید گزارش</h3>
                <p className="text-sm opacity-90">ایجاد ETR، TRP و VTR</p>
              </Link>
              
              <Link
                href="/dashboard/evaluator/knowledge-base"
                className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg text-center transition duration-200"
              >
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="font-medium">دانش‌نامه</h3>
                <p className="text-sm opacity-90">مطالعه استانداردها و راهنماها</p>
              </Link>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">محصولات در انتظار ارزیابی</h2>
            <div className="flex items-center space-x-2 space-x-reverse">
              {lastRefresh && (
                <span className="text-sm text-gray-500">
                  آخرین بروزرسانی: {new Intl.DateTimeFormat('fa-IR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  }).format(lastRefresh)}
                </span>
              )}
              <button
                onClick={refreshApplications}
                disabled={loading}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md flex items-center"
              >
                {loading ? (
                  <svg className="animate-spin h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                بروزرسانی
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    شماره درخواست
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    نام محصول
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    شرکت
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    نوع محصول
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    متقاضی
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    وضعیت
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    تاریخ ثبت
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {app.application_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {app.product_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {app.company_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {app.product_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {app.applicant_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusDisplay(app.status).color}`}>
                        {getStatusDisplay(app.status).text}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(app.submission_date || app.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/dashboard/evaluator/evaluation/${app.id}`}
                        className="text-blue-600 hover:text-blue-900 ml-4"
                      >
                        شروع ارزیابی
                      </Link>
                      <Link
                        href={`/dashboard/evaluator/documents/${app.id}`}
                        className="text-green-600 hover:text-green-900 mr-4"
                      >
                        مشاهده اسناد
                      </Link>
                    </td>
                  </tr>
                ))}
                {applications.length === 0 && !loading && (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                      هیچ درخواستی برای ارزیابی یافت نشد
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Debug Information */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 bg-gray-100 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Debug Info:</h3>
            <pre className="text-xs text-gray-600 overflow-auto">
              {JSON.stringify({
                totalApplications: applications.length,
                stats,
                lastRefresh: lastRefresh?.toISOString(),
                user: user?.email,
                apiEndpoint: '/api/applications/dashboard/list'
              }, null, 2)}
            </pre>
          </div>
        )}

        {/* Evaluation Process Guide */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">مراحل فرآیند ارزیابی</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2 text-xl font-bold">
                  1
                </div>
                <h3 className="font-medium text-gray-900 mb-1">بررسی اسناد</h3>
                <p className="text-sm text-gray-600">بررسی ST، ALC، AGD و سایر مدارک</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2 text-xl font-bold">
                  2
                </div>
                <h3 className="font-medium text-gray-900 mb-1">تست عملکردی</h3>
                <p className="text-sm text-gray-600">انجام تست‌های امنیتی و عملکردی</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-2 text-xl font-bold">
                  3
                </div>
                <h3 className="font-medium text-gray-900 mb-1">تحلیل آسیب‌پذیری</h3>
                <p className="text-sm text-gray-600">شناسایی و تحلیل نقاط ضعف</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-2 text-xl font-bold">
                  4
                </div>
                <h3 className="font-medium text-gray-900 mb-1">گزارش نهایی</h3>
                <p className="text-sm text-gray-600">تهیه و ارسال گزارش ETR</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 