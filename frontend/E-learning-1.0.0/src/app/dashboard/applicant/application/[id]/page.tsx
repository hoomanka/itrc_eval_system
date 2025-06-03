"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

interface Application {
  id: number;
  application_number: string;
  product_name: string;
  product_type: string;
  description: string;
  evaluation_level: string;
  company_name: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  status: string;
  submission_date: string | null;
  created_at: string;
  updated_at: string;
}

export default function ApplicationDetailPage() {
  const params = useParams();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  useEffect(() => {
    const loadApplication = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("توکن احراز هویت یافت نشد");
          setLoading(false);
          return;
        }

        console.log("🔍 Loading application details for ID:", params.id);
        console.log("🔐 Token available:", token ? "Yes" : "No");
        
        const url = `http://localhost:8000/api/applications/${params.id}`;
        console.log("📡 Making request to:", url);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        console.log("📡 Response status:", response.status);
        console.log("📡 Response headers:", Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ API Error Response:", errorText);
          console.error("❌ Response status:", response.status);
          console.error("❌ Response statusText:", response.statusText);
          
          if (response.status === 0 || !response.status) {
            setError(`خطا در اتصال به سرور - لطفاً مطمئن شوید که سرور روی localhost:8000 در حال اجرا است`);
          } else if (response.status === 401) {
            setError(`خطا در احراز هویت - لطفاً دوباره وارد شوید`);
          } else if (response.status === 404) {
            setError(`درخواست با شناسه ${params.id} یافت نشد`);
          } else {
            setError(`خطا در API: ${response.status} - ${response.statusText} - ${errorText}`);
          }
          return;
        }

        const data = await response.json();
        console.log("✅ Application data loaded successfully:", data);
        setApplication(data);
        
      } catch (error: any) {
        console.error("❌ Network/Parse Error:", error);
        console.error("❌ Error name:", error.name);
        console.error("❌ Error message:", error.message);
        console.error("❌ Error stack:", error.stack);
        
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
          setError(`خطا در اتصال شبکه - آیا سرور روی localhost:8000 در حال اجرا است؟ 
            خطای شبکه: ${error.message}
            نام خطا: ${error.name}`);
        } else {
          setError(`خطا در بارگذاری: ${error.message} (${error.name})`);
        }
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      loadApplication();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 p-8">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-red-500"
          >
            <h2 className="text-lg font-medium text-red-800 mb-2">خطا در بارگذاری</h2>
            <p className="text-red-700">{error || "درخواست یافت نشد"}</p>
            <Link
              href="/dashboard/applicant"
              className="mt-4 inline-flex px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              بازگشت به داشبورد
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50" dir="rtl">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/dashboard/applicant" className="text-blue-600 hover:text-blue-700 ml-4 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                جزئیات درخواست
              </h1>
            </div>
            <div className="text-sm text-gray-600">
              شماره درخواست: {application.application_number}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Status Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">وضعیت درخواست</h2>
              <span className={`inline-flex px-4 py-2 text-sm font-semibold rounded-full ${getStatusDisplay(application.status).color}`}>
                {getStatusDisplay(application.status).text}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">شماره درخواست</p>
                <p className="font-bold text-lg text-gray-900">{application.application_number}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">تاریخ ثبت</p>
                <p className="font-medium text-gray-900">{formatDate(application.created_at)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">آخرین بروزرسانی</p>
                <p className="font-medium text-gray-900">{formatDate(application.updated_at)}</p>
              </div>
            </div>
          </div>

          {/* Product Information */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <svg className="w-6 h-6 text-blue-600 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-2m-14 0h2m-2 0h-2m16 0v-3.5c0-.621-.504-1.125-1.125-1.125h-3.75c-.621 0-1.125.504-1.125 1.125V21" />
              </svg>
              اطلاعات محصول
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">نام محصول</label>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 rounded-lg border border-blue-200">
                  <p className="text-gray-900 font-medium">{application.product_name}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">نوع محصول</label>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 rounded-lg border border-green-200">
                  <p className="text-gray-900 font-medium">{application.product_type}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">سطح ارزیابی</label>
                <div className="bg-gradient-to-r from-purple-50 to-violet-50 px-4 py-3 rounded-lg border border-purple-200">
                  <p className="text-gray-900 font-medium">{application.evaluation_level}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">نام شرکت</label>
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-3 rounded-lg border border-orange-200">
                  <p className="text-gray-900 font-medium">{application.company_name}</p>
                </div>
              </div>
            </div>
            {application.description && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">توضیحات محصول</label>
                <div className="bg-gray-50 px-4 py-3 rounded-lg border border-gray-200">
                  <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">{application.description}</p>
                </div>
              </div>
            )}
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <svg className="w-6 h-6 text-green-600 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              اطلاعات تماس
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">نام مسئول</label>
                <div className="bg-gray-50 px-4 py-3 rounded-lg border border-gray-200">
                  <p className="text-gray-900 font-medium">{application.contact_person}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ایمیل</label>
                <div className="bg-gray-50 px-4 py-3 rounded-lg border border-gray-200">
                  <p className="text-gray-900 font-medium">{application.contact_email}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">تلفن</label>
                <div className="bg-gray-50 px-4 py-3 rounded-lg border border-gray-200">
                  <p className="text-gray-900 font-medium">{application.contact_phone}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <Link
              href="/dashboard/applicant"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              بازگشت به داشبورد
            </Link>
            {application.status === 'draft' && (
              <Link
                href={`/dashboard/applicant/application/${application.id}/edit`}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center"
              >
                ویرایش درخواست
              </Link>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
} 