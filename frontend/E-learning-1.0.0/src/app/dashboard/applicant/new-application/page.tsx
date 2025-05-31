"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function NewApplicationPage() {
  const [formData, setFormData] = useState({
    product_name: "",
    product_type: "",
    description: "",
    evaluation_level: "EAL1",
    target_assurance_level: "",
    company_name: "",
    contact_person: "",
    contact_email: "",
    contact_phone: "",
  });

  const [documents, setDocuments] = useState<{[key: string]: File | null}>({
    st: null,         // Security Target
    alc_cmc: null,    // Configuration Management Capabilities
    alc_cms: null,    // Configuration Management Scope
    alc_del: null,    // Delivery
    alc_dvs: null,    // Development Security
    alc_lcd: null,    // Life Cycle Definition
    alc_tat: null,    // Tools and Techniques
    agd_ope: null,    // Operational User Guidance
    agd_pre: null,    // Preparative Procedures
    ade_fin: null,    // Functional Interface
    ade_tds: null,    // TOE Design
    ava_van: null,    // Vulnerability Analysis
  });

  const documentTypes = [
    { key: "st", name: "Security Target (ST)", required: false },
    { key: "alc_cmc", name: "Configuration Management Capabilities (ALC_CMC)", required: false },
    { key: "alc_cms", name: "Configuration Management Scope (ALC_CMS)", required: false },
    { key: "alc_del", name: "Delivery (ALC_DEL)", required: false },
    { key: "alc_dvs", name: "Development Security (ALC_DVS)", required: false },
    { key: "alc_lcd", name: "Life Cycle Definition (ALC_LCD)", required: false },
    { key: "alc_tat", name: "Tools and Techniques (ALC_TAT)", required: false },
    { key: "agd_ope", name: "Operational User Guidance (AGD_OPE)", required: false },
    { key: "agd_pre", name: "Preparative Procedures (AGD_PRE)", required: false },
    { key: "ade_fin", name: "Functional Interface (ADE_FIN)", required: false },
    { key: "ade_tds", name: "TOE Design (ADE_TDS)", required: false },
    { key: "ava_van", name: "Vulnerability Analysis (AVA_VAN)", required: false },
  ];

  const productTypes = [
    "Operating System", "Database Management System", "Network Security Gateway",
    "Intrusion Detection System", "Firewall", "Antivirus Software",
    "Smart Card", "Biometric System", "PKI System", "VPN Gateway",
    "Web Application Firewall", "Email Security Gateway", "Mobile Device Management",
    "Cloud Security Platform", "Endpoint Protection", "Network Access Control",
    "Security Information and Event Management", "Data Loss Prevention",
    "Identity and Access Management", "Cryptographic Module",
    // ... و 50 نوع دیگر
  ];

  const evaluationLevels = [
    { value: "EAL1", name: "EAL1 - Functionally Tested" },
    { value: "EAL2", name: "EAL2 - Structurally Tested" },
    { value: "EAL3", name: "EAL3 - Methodically Tested and Checked" },
    { value: "EAL4", name: "EAL4 - Methodically Designed, Tested and Reviewed" },
    { value: "EAL5", name: "EAL5 - Semiformally Designed and Tested" },
    { value: "EAL6", name: "EAL6 - Semiformally Verified Design and Tested" },
    { value: "EAL7", name: "EAL7 - Formally Verified Design and Tested" },
  ];

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (documentType: string, file: File | null) => {
    setDocuments({
      ...documents,
      [documentType]: file,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    // Note: All fields are now optional - no validation required

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("لطفاً دوباره وارد شوید");
        window.location.href = "/signin";
        return;
      }

      // Create FormData for file uploads
      const formDataToSend = new FormData();
      
      // Add basic form data
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key as keyof typeof formData]);
      });

      // Add documents
      Object.keys(documents).forEach(docType => {
        if (documents[docType]) {
          formDataToSend.append(`document_${docType}`, documents[docType] as File);
        }
      });

      const response = await fetch("http://localhost:8000/api/applications/", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      if (response.ok) {
        const result = await response.json();
        alert("درخواست شما با موفقیت ثبت شد و در صف بررسی قرار گرفت.");
        window.location.href = "/dashboard/applicant";
      } else {
        const errorData = await response.json();
        alert(errorData.detail || "خطا در ثبت درخواست");
      }
    } catch (err) {
      console.error("Error submitting application:", err);
      alert("خطا در اتصال به سرور");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/dashboard/applicant" className="text-blue-600 hover:text-blue-700 ml-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                درخواست ارزیابی جدید
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          onSubmit={handleSubmit}
          className="space-y-8"
        >
          {/* Product Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">اطلاعات محصول</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نام محصول
                </label>
                <input
                  type="text"
                  name="product_name"
                  value={formData.product_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="نام محصول را وارد کنید"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نوع محصول
                </label>
                <select
                  name="product_type"
                  value={formData.product_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">انتخاب کنید</option>
                  {productTypes.map((type, index) => (
                    <option key={index} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  سطح ارزیابی هدف
                </label>
                <select
                  name="evaluation_level"
                  value={formData.evaluation_level}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {evaluationLevels.map((level) => (
                    <option key={level.value} value={level.value}>{level.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نام شرکت
                </label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="نام شرکت یا سازمان"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                توضیحات محصول
              </label>
              <textarea
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="توضیح مختصری از محصول و قابلیت‌های امنیتی آن"
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">اطلاعات تماس</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نام و نام خانوادگی مسئول
                </label>
                <input
                  type="text"
                  name="contact_person"
                  value={formData.contact_person}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ایمیل
                </label>
                <input
                  type="email"
                  name="contact_email"
                  value={formData.contact_email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  شماره تماس
                </label>
                <input
                  type="tel"
                  name="contact_phone"
                  value={formData.contact_phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Document Upload */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">آپلود اسناد</h2>
            <p className="text-gray-600 mb-6">
              آپلود اسناد Common Criteria اختیاری است. شما می‌توانید ابتدا درخواست خود را ثبت کنید و سپس اسناد را ارسال کنید.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {documentTypes.map((docType) => (
                <div key={docType.key} className="border border-gray-200 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {docType.name}
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => handleFileChange(docType.key, e.target.files?.[0] || null)}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {documents[docType.key] && (
                    <p className="text-green-600 text-sm mt-1">
                      ✓ {documents[docType.key]?.name}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">راهنمای آپلود اسناد:</h3>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>• فرمت مجاز فایل‌ها: PDF, DOC, DOCX</li>
                <li>• حداکثر حجم هر فایل: 10 مگابایت</li>
                <li>• اسناد باید مطابق با استانداردهای Common Criteria تهیه شده باشند</li>
                <li>• در صورت نیاز به راهنمایی، با تیم پشتیبانی تماس بگیرید</li>
              </ul>
            </div>
          </div>

          {/* Evaluation Process Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">فرآیند ارزیابی</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2 text-xl font-bold">
                  1
                </div>
                <h3 className="font-medium text-gray-900 mb-1">ثبت درخواست</h3>
                <p className="text-sm text-gray-600">ارسال فرم و اسناد لازم</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2 text-xl font-bold">
                  2
                </div>
                <h3 className="font-medium text-gray-900 mb-1">بررسی اولیه</h3>
                <p className="text-sm text-gray-600">تایید مدارک توسط تیم حاکمیت</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-2 text-xl font-bold">
                  3
                </div>
                <h3 className="font-medium text-gray-900 mb-1">ارزیابی فنی</h3>
                <p className="text-sm text-gray-600">انجام تست‌ها توسط ارزیاب</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-2 text-xl font-bold">
                  4
                </div>
                <h3 className="font-medium text-gray-900 mb-1">صدور گواهی</h3>
                <p className="text-sm text-gray-600">تهیه گزارش و گواهی نهایی</p>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end space-x-4 space-x-reverse">
            <Link
              href="/dashboard/applicant"
              className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:text-gray-900 hover:border-gray-400 transition duration-200"
            >
              انصراف
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-md font-medium transition duration-200 flex items-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  در حال ثبت...
                </>
              ) : (
                "ثبت درخواست"
              )}
            </button>
          </div>
        </motion.form>
      </div>
    </div>
  );
} 