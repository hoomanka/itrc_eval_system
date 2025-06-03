"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function SignInPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const router = useRouter();

  const addDebugInfo = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const debugMessage = `${timestamp}: ${message}`;
    console.log(`🔍 ${debugMessage}`);
    setDebugInfo(prev => [...prev, debugMessage]);
  };

  const testBackendConnection = async () => {
    addDebugInfo("Testing backend connection...");
    
    const urlsToTest = [
      "http://localhost:8000",
      "http://127.0.0.1:8000",
      "http://localhost:8001",
      "http://127.0.0.1:8001"
    ];
    
    for (const baseUrl of urlsToTest) {
      try {
        addDebugInfo(`Trying ${baseUrl}/health...`);
        const response = await fetch(`${baseUrl}/health`, {
          method: "GET",
          signal: AbortSignal.timeout(5000), // 5 second timeout
        });
        
        if (response.ok) {
          const data = await response.json();
          addDebugInfo(`✅ Backend found at ${baseUrl}: ${JSON.stringify(data)}`);
          return baseUrl; // Return the working URL
        } else {
          addDebugInfo(`❌ ${baseUrl} responded with status: ${response.status}`);
        }
      } catch (err: any) {
        addDebugInfo(`❌ ${baseUrl} failed: ${err.message}`);
      }
    }
    
    addDebugInfo("❌ No backend server found on any tested URL");
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setDebugInfo([]);

    addDebugInfo(`Starting login for: ${formData.email}`);

    try {
      // First, find the working backend URL
      addDebugInfo("Finding backend server...");
      const backendUrl = await testBackendConnection();
      
      if (!backendUrl) {
        setError("سرور backend یافت نشد. لطفا مطمئن شوید که سرور در حال اجرا است.");
        return;
      }

      addDebugInfo(`Using backend at: ${backendUrl}`);
      addDebugInfo("Making login API request...");
      
      // Add timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        addDebugInfo("Login request timed out after 10 seconds");
      }, 10000);

      const response = await fetch(`${backendUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      addDebugInfo(`Received response with status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        addDebugInfo(`Login successful for user: ${data.user.full_name} (${data.user.role})`);
        
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("user", JSON.stringify(data.user));
        
        addDebugInfo(`Redirecting to dashboard for role: ${data.user.role}`);
        
        // Redirect based on user role
        const role = data.user.role;
        if (role === "applicant") {
          router.push("/dashboard/applicant");
        } else if (role === "evaluator") {
          router.push("/dashboard/evaluator");
        } else if (role === "governance") {
          router.push("/dashboard/governance");
        } else if (role === "admin") {
          router.push("/dashboard/admin");
        } else {
          addDebugInfo(`Unknown user role: ${role}, redirecting to generic dashboard`);
          router.push("/dashboard");
        }
      } else {
        const errorData = await response.json();
        addDebugInfo(`Login failed: ${JSON.stringify(errorData)}`);
        setError(errorData.detail || "خطا در ورود به سیستم");
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        addDebugInfo("Request was aborted due to timeout");
        setError("درخواست به دلیل طولانی شدن زمان منقضی شد. لطفا مطمئن شوید که سرور در حال اجرا است.");
      } else {
        addDebugInfo(`Network error: ${err.message}`);
        setError("خطا در اتصال به سرور. لطفا مطمئن شوید که سرور در حال اجرا است.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleTestLogin = (email: string, password: string) => {
    setFormData({ email, password });
    setDebugInfo([]);
    // Auto-submit after a short delay
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) {
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-md w-full space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center">
            <Link href="/" className="inline-block mb-6">
              <div className="mx-auto h-16 w-16 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">ITRC</span>
              </div>
            </Link>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              ورود به سامانه
            </h2>
            <p className="text-gray-600">
              سامانه ارزیابی معیارهای مشترک ITRC
            </p>
          </div>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow-lg"
          onSubmit={handleSubmit}
        >
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="mr-3">
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Debug Information Panel */}
          {debugInfo.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md">
              <h4 className="font-medium mb-2">🔍 اطلاعات تشخیص:</h4>
              <div className="text-xs space-y-1 max-h-32 overflow-y-auto">
                {debugInfo.map((info, index) => (
                  <div key={index}>{info}</div>
                ))}
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                ایمیل
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="example@email.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                رمز عبور
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="رمز عبور خود را وارد کنید"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="mr-2 block text-sm text-gray-900">
                مرا به خاطر بسپار
              </label>
            </div>

            <div className="text-sm">
              <button
                type="button"
                onClick={testBackendConnection}
                className="font-medium text-yellow-600 hover:text-yellow-500"
              >
                تست اتصال سرور
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  در حال ورود... ({debugInfo.length > 0 ? 'مشاهده جزئیات بالا' : 'منتظر پاسخ سرور'})
                </div>
              ) : (
                "ورود"
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              حساب کاربری ندارید؟{" "}
              <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
                ثبت نام کنید
              </Link>
            </p>
          </div>
        </motion.form>

        {/* Test Accounts - Fixed email addresses */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 bg-white p-6 rounded-lg shadow-lg"
        >
          <h3 className="text-lg font-medium text-gray-900 mb-4">حساب‌های آزمایشی</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div>
                <span className="font-medium">متقاضی:</span> applicant@company.com / app123
              </div>
              <button
                onClick={() => handleTestLogin("applicant@company.com", "app123")}
                className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 rounded border"
                disabled={loading}
              >
                ورود
              </button>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div>
                <span className="font-medium">ارزیاب:</span> evaluator@itrc.ir / eval123
              </div>
              <button
                onClick={() => handleTestLogin("evaluator@itrc.ir", "eval123")}
                className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 rounded border"
                disabled={loading}
              >
                ورود
              </button>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div>
                <span className="font-medium">مدیر:</span> admin@itrc.ir / admin123
              </div>
              <button
                onClick={() => handleTestLogin("admin@itrc.ir", "admin123")}
                className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 rounded border"
                disabled={loading}
              >
                ورود
              </button>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-800">
              💡 کلیک روی دکمه "ورود" کنار هر حساب برای ورود خودکار
            </p>
            <p className="text-xs text-blue-800 mt-1">
              🔧 در صورت مشکل، ابتدا روی "تست اتصال سرور" کلیک کنید
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
