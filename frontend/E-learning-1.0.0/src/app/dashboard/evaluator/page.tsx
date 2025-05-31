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
  applicant_name?: string;
  status: string;
  submission_date: string | null;
  evaluation_level: string;
}

export default function EvaluatorDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
    
    // Load applications available for evaluation from API
    const loadApplications = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("توکن احراز هویت یافت نشد");
          window.location.href = "/signin";
          return;
        }

        console.log("🔍 Loading evaluator applications from /api/applications/available");
        const response = await fetch("http://localhost:8000/api/applications/available", {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });

        console.log("📊 Response status:", response.status);
        
        if (response.ok) {
          const data: Application[] = await response.json();
          setApplications(data);
          console.log("✅ Evaluator applications loaded:", data.length, data);
          setError("");
        } else {
          const errorText = await response.text();
          console.error("❌ Failed to load applications:", response.status, errorText);
          setError(`خطا در بارگیری درخواست‌ها: ${response.status} - ${errorText}`);
          
          // Try alternative endpoint for debugging
          console.log("🔄 Trying alternative endpoint /api/applications/dashboard/list");
          const dashboardResponse = await fetch("http://localhost:8000/api/applications/dashboard/list", {
            headers: {
              "Authorization": `Bearer ${token}`,
            },
          });
          
          if (dashboardResponse.ok) {
            const dashboardData: Application[] = await dashboardResponse.json();
            // Filter for SUBMITTED applications only (what evaluators should see)
            const availableApps = dashboardData.filter(app => app.status === 'SUBMITTED');
            setApplications(availableApps);
            console.log("✅ Dashboard data loaded and filtered:", availableApps.length);
            setError("");
          }
        }
      } catch (error) {
        console.error("Error loading applications:", error);
        setError(`خطا در اتصال به سرور: ${error}`);
      } finally {
        setLoading(false);
      }
    };

    loadApplications();
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
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-lg shadow"
          >
            <h3 className="text-lg font-medium text-gray-900">کل ارزیابی‌ها</h3>
            <p className="text-3xl font-bold text-blue-600">{applications.length}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-lg shadow"
          >
            <h3 className="text-lg font-medium text-gray-900">در انتظار ارزیابی</h3>
            <p className="text-3xl font-bold text-yellow-600">{applications.filter(app => app.status === 'SUBMITTED').length}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-lg shadow"
          >
            <h3 className="text-lg font-medium text-gray-900">تکمیل شده</h3>
            <p className="text-3xl font-bold text-green-600">{applications.filter(app => app.status === 'COMPLETED').length}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-lg shadow"
          >
            <h3 className="text-lg font-medium text-gray-900">امتیاز عملکرد</h3>
            <p className="text-3xl font-bold text-purple-600">95%</p>
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
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">محصولات در انتظار ارزیابی</h2>
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
                    متقاضی
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    سطح ارزیابی
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    وضعیت
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
                {applications.map((application) => (
                  <tr key={application.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {application.application_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {application.product_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {application.applicant_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {application.evaluation_level}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        {application.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {application.submission_date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/dashboard/evaluator/evaluation/${application.id}`}
                        className="text-blue-600 hover:text-blue-900 ml-4"
                      >
                        شروع ارزیابی
                      </Link>
                      <Link
                        href={`/dashboard/evaluator/documents/${application.id}`}
                        className="text-green-600 hover:text-green-900"
                      >
                        مشاهده اسناد
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

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