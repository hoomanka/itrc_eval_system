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
  product_type_name: string;
  status: string;
  submission_date: string | null;
  evaluation_level?: string;
  applicant_name?: string;
}

export default function ApplicantDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
    
    // Load applications and stats from API
    const loadData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          window.location.href = "/signin";
          return;
        }

        // Load applications
        console.log("🔍 Loading applications from /api/applications/my");
        const applicationsResponse = await fetch("http://localhost:8000/api/applications/my", {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });

        if (applicationsResponse.ok) {
          const data: Application[] = await applicationsResponse.json();
          setApplications(data);
          console.log("✅ Applications loaded:", data.length);
          
          // Calculate stats from applications data
          const total = data.length;
          const pending = data.filter((app: Application) => app.status === 'SUBMITTED' || app.status === 'IN_REVIEW').length;
          const approved = data.filter((app: Application) => app.status === 'COMPLETED').length;
          const rejected = data.filter((app: Application) => app.status === 'REJECTED').length;
          
          setStats({ total, pending, approved, rejected });
        } else {
          console.error("❌ Failed to load applications:", applicationsResponse.status);
          setError(`خطا در بارگیری داده‌ها: ${applicationsResponse.status}`);
          
          // Try alternative endpoint for debugging
          console.log("🔄 Trying alternative endpoint /api/applications/dashboard/list");
          const dashboardResponse = await fetch("http://localhost:8000/api/applications/dashboard/list", {
            headers: {
              "Authorization": `Bearer ${token}`,
            },
          });
          
          if (dashboardResponse.ok) {
            const dashboardData: Application[] = await dashboardResponse.json();
            setApplications(dashboardData);
            console.log("✅ Dashboard data loaded:", dashboardData.length);
            
            const total = dashboardData.length;
            const pending = dashboardData.filter((app: Application) => app.status === 'SUBMITTED' || app.status === 'IN_REVIEW').length;
            const approved = dashboardData.filter((app: Application) => app.status === 'COMPLETED').length;
            const rejected = dashboardData.filter((app: Application) => app.status === 'REJECTED').length;
            
            setStats({ total, pending, approved, rejected });
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
        setError("خطا در اتصال به سرور");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
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
                پنل متقاضی
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
        {/* Error Message */}
        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <strong>خطا:</strong> {error}
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-lg shadow"
          >
            <h3 className="text-lg font-medium text-gray-900">کل درخواست‌ها</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-lg shadow"
          >
            <h3 className="text-lg font-medium text-gray-900">در حال بررسی</h3>
            <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-lg shadow"
          >
            <h3 className="text-lg font-medium text-gray-900">تایید شده</h3>
            <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-lg shadow"
          >
            <h3 className="text-lg font-medium text-gray-900">رد شده</h3>
            <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
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
                href="/dashboard/applicant/new-application"
                className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg text-center transition duration-200"
              >
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="font-medium">درخواست جدید</h3>
                <p className="text-sm opacity-90">ثبت درخواست ارزیابی محصول</p>
              </Link>
              
              <Link
                href="/dashboard/applicant/documents"
                className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg text-center transition duration-200"
              >
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="font-medium">مدیریت اسناد</h3>
                <p className="text-sm opacity-90">آپلود و مشاهده مدارک</p>
              </Link>
              
              <Link
                href="/dashboard/applicant/reports"
                className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg text-center transition duration-200"
              >
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="font-medium">گزارش‌ها</h3>
                <p className="text-sm opacity-90">مشاهده گزارش‌های ارزیابی</p>
              </Link>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">درخواست‌های من</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    نام محصول
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    نوع محصول
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
                      {app.product_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {app.product_type_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {app.submission_date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/dashboard/applicant/application/${app.id}`}
                        className="text-blue-600 hover:text-blue-900 ml-4"
                      >
                        مشاهده
                      </Link>
                      <Link
                        href={`/dashboard/applicant/application/${app.id}/edit`}
                        className="text-green-600 hover:text-green-900"
                      >
                        ویرایش
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 