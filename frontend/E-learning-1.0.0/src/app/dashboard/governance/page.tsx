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

export default function GovernanceDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
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
                پنل حاکمیت
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
            <h3 className="text-lg font-medium text-gray-900">کل درخواست‌ها</h3>
            <p className="text-3xl font-bold text-blue-600">12</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-lg shadow"
          >
            <h3 className="text-lg font-medium text-gray-900">در انتظار تایید</h3>
            <p className="text-3xl font-bold text-yellow-600">3</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-lg shadow"
          >
            <h3 className="text-lg font-medium text-gray-900">در حال ارزیابی</h3>
            <p className="text-3xl font-bold text-purple-600">5</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-lg shadow"
          >
            <h3 className="text-lg font-medium text-gray-900">تکمیل شده</h3>
            <p className="text-3xl font-bold text-green-600">4</p>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">عملیات حاکمیتی</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Link
                href="/dashboard/governance/applications"
                className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg text-center transition duration-200"
              >
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="font-medium">بررسی درخواست‌ها</h3>
                <p className="text-sm opacity-90">تایید یا رد درخواست‌های جدید</p>
              </Link>
              
              <Link
                href="/dashboard/governance/evaluators"
                className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg text-center transition duration-200"
              >
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="font-medium">تخصیص ارزیاب</h3>
                <p className="text-sm opacity-90">انتساب پروژه‌ها به ارزیابان</p>
              </Link>
              
              <Link
                href="/dashboard/governance/monitoring"
                className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg text-center transition duration-200"
              >
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="font-medium">نظارت بر فرآیند</h3>
                <p className="text-sm opacity-90">پیگیری وضعیت ارزیابی‌ها</p>
              </Link>
              
              <Link
                href="/dashboard/governance/certificates"
                className="bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-lg text-center transition duration-200"
              >
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <h3 className="font-medium">صدور گواهی</h3>
                <p className="text-sm opacity-90">تایید نهایی و صدور گواهی‌ها</p>
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">فعالیت‌های اخیر</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center p-4 bg-blue-50 rounded-lg">
                <div className="w-3 h-3 bg-blue-600 rounded-full ml-3"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    درخواست جدید ارزیابی نرم‌افزار SecureNet دریافت شد
                  </p>
                  <p className="text-xs text-gray-500">2 ساعت پیش</p>
                </div>
              </div>
              <div className="flex items-center p-4 bg-green-50 rounded-lg">
                <div className="w-3 h-3 bg-green-600 rounded-full ml-3"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    ارزیابی محصول CryptoWallet به ارزیاب احمد حسینی تخصیص یافت
                  </p>
                  <p className="text-xs text-gray-500">5 ساعت پیش</p>
                </div>
              </div>
              <div className="flex items-center p-4 bg-yellow-50 rounded-lg">
                <div className="w-3 h-3 bg-yellow-600 rounded-full ml-3"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    گزارش ETR برای محصول FirewallPlus در انتظار بررسی نهایی
                  </p>
                  <p className="text-xs text-gray-500">1 روز پیش</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Applications Overview */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">نمای کلی درخواست‌ها</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    نام محصول
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    شرکت متقاضی
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    وضعیت
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ارزیاب
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    نرم‌افزار مدیریت شبکه SecureNet
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    شرکت فناوری پارس
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      در انتظار تخصیص ارزیاب
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    -
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      href="/dashboard/governance/application/1"
                      className="text-blue-600 hover:text-blue-900 ml-4"
                    >
                      مشاهده
                    </Link>
                    <Link
                      href="/dashboard/governance/assign/1"
                      className="text-green-600 hover:text-green-900"
                    >
                      تخصیص ارزیاب
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 