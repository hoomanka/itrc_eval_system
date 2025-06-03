"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

interface ProductType {
  id: number;
  name_en: string;
  name_fa: string;
  description_en: string;
  description_fa: string;
}

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

  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [loadingProductTypes, setLoadingProductTypes] = useState(true);

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

  // Load product types from backend
  useEffect(() => {
    const loadProductTypes = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("❌ No token found");
          return;
        }

        console.log("🔍 Loading product types from backend...");
        const response = await fetch("http://localhost:8000/api/users/product-types", {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log("✅ Product types loaded:", data);
          setProductTypes(data);
        } else {
          console.error("❌ Failed to load product types:", response.status);
          // Fallback to default antimalware type
          setProductTypes([{
            id: 1,
            name_en: "Antimalware Software",
            name_fa: "نرم‌افزار ضد بدافزار",
            description_en: "Antimalware software products",
            description_fa: "محصولات نرم‌افزاری ضد بدافزار"
          }]);
        }
      } catch (error) {
        console.error("❌ Error loading product types:", error);
        // Fallback to default antimalware type
        setProductTypes([{
          id: 1,
          name_en: "Antimalware Software", 
          name_fa: "نرم‌افزار ضد بدافزار",
          description_en: "Antimalware software products",
          description_fa: "محصولات نرم‌افزاری ضد بدافزار"
        }]);
      } finally {
        setLoadingProductTypes(false);
      }
    };

    loadProductTypes();
  }, []);

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
    
    // Check if antimalware product is selected (updated name)
    if (formData.product_type === "Antimalware Software") {
      console.log("🔍 Antimalware product selected, saving form data:", formData);
      // Save form data to localStorage
      localStorage.setItem("applicationFormData", JSON.stringify(formData));
      console.log("✅ Form data saved to localStorage");
      // Redirect to security target form
      window.location.href = "/dashboard/applicant/security-target";
      return;
    }

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
      
      // Explicitly set status to 'submitted' for new applications
      formDataToSend.append('status', 'submitted');

      // Add documents
      Object.keys(documents).forEach(docType => {
        if (documents[docType]) {
          formDataToSend.append(`document_${docType}`, documents[docType] as File);
        }
      });

      console.log("📤 Submitting new application...");
      console.log("📋 Form data being sent:", {
        ...formData,
        status: 'submitted',
        documents: Object.keys(documents).filter(key => documents[key] !== null)
      });

      const response = await fetch("http://localhost:8000/api/applications/", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      console.log("📡 Response status:", response.status);

      if (response.ok) {
        const result = await response.json();
        console.log("✅ Application submitted successfully:", result);
        alert("درخواست شما با موفقیت ثبت شد و در صف بررسی قرار گرفت.");
        
        // Clear any cached form data
        localStorage.removeItem("applicationFormData");
        
        window.location.href = "/dashboard/applicant";
      } else {
        const errorData = await response.json();
        console.error("❌ Error response:", errorData);
        setError(errorData.detail || "خطا در ثبت درخواست");
        alert(errorData.detail || "خطا در ثبت درخواست");
      }
    } catch (err) {
      console.error("❌ Error submitting application:", err);
      setError("خطا در اتصال به سرور");
      alert("خطا در اتصال به سرور");
    } finally {
      setLoading(false);
    }
  };

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
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <svg className="w-6 h-6 text-blue-600 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-2m-14 0h2m-2 0h-2m16 0v-3.5c0-.621-.504-1.125-1.125-1.125h-3.75c-.621 0-1.125.504-1.125 1.125V21" />
              </svg>
              اطلاعات محصول
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نام محصول *
                </label>
                <input
                  type="text"
                  name="product_name"
                  required
                  value={formData.product_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="نام محصول را وارد کنید"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نوع محصول *
                </label>
                {loadingProductTypes ? (
                  <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                    در حال بارگیری...
                  </div>
                ) : (
                  <select
                    name="product_type"
                    required
                    value={formData.product_type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  >
                    <option value="">انتخاب کنید</option>
                    {productTypes.map((type) => (
                      <option key={type.id} value={type.name_en}>
                        {type.name_fa} ({type.name_en})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  سطح ارزیابی هدف *
                </label>
                <select
                  name="evaluation_level"
                  required
                  value={formData.evaluation_level}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  {evaluationLevels.map((level) => (
                    <option key={level.value} value={level.value}>{level.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نام شرکت *
                </label>
                <input
                  type="text"
                  name="company_name"
                  required
                  value={formData.company_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="توضیح مختصری از محصول و قابلیت‌های امنیتی آن"
              />
            </div>

            {/* Special notice for antimalware products */}
            {formData.product_type === "Antimalware Software" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.3 }}
                className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"
              >
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-blue-600 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-blue-800 font-medium">
                    محصول ضد بدافزار انتخاب شده است
                  </p>
                </div>
                <p className="text-blue-700 text-sm mt-2">
                  پس از ثبت اطلاعات، به صفحه انتخاب کلاس‌های امنیتی هدایت خواهید شد.
                </p>
              </motion.div>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نام و نام خانوادگی مسئول *
                </label>
                <input
                  type="text"
                  name="contact_person"
                  required
                  value={formData.contact_person}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="نام کامل مسئول پروژه"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ایمیل *
                </label>
                <input
                  type="email"
                  name="contact_email"
                  required
                  value={formData.contact_email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="example@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  شماره تماس *
                </label>
                <input
                  type="tel"
                  name="contact_phone"
                  required
                  value={formData.contact_phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="021-12345678"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end space-x-4 space-x-reverse">
            <Link
              href="/dashboard/applicant"
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:text-gray-900 hover:border-gray-400 transition-colors"
            >
              انصراف
            </Link>
            <button
              type="submit"
              disabled={loading || loadingProductTypes}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center"
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
                formData.product_type === "Antimalware Software" ? "ادامه و انتخاب کلاس‌ها" : "ثبت درخواست"
              )}
            </button>
          </div>
        </motion.form>
      </div>
    </div>
  );
} 