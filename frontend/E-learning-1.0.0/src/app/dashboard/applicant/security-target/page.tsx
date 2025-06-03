"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface ProductClass {
  id: number;
  name_en: string;
  name_fa: string;
  code: string;
  description_en: string;
  description_fa: string;
  subclasses: ProductSubclass[];
}

interface ProductSubclass {
  id: number;
  name_en: string;
  name_fa: string;
  code: string;
  description_en: string;
  description_fa: string;
}

interface ClassSelection {
  product_class_id: number;
  product_subclass_id?: number;
  description: string;
  justification: string;
  test_approach: string;
}

export default function SecurityTargetPage() {
  const [classes, setClasses] = useState<ProductClass[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<ClassSelection[]>([]);
  const [activeClass, setActiveClass] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);
  const [productTypeId, setProductTypeId] = useState<number | null>(null);

  useEffect(() => {
    // Get saved form data
    const formData = JSON.parse(localStorage.getItem("applicationFormData") || "{}");
    console.log("🔍 Loaded form data from localStorage:", formData);
    if (formData.product_type) {
      console.log("📝 Found product type:", formData.product_type);
      // Get product type ID from the name
      getProductTypeId(formData.product_type);
    } else {
      console.error("❌ No product type found in form data");
      setLoading(false);
    }
  }, []);

  const getProductTypeId = async (productTypeName: string) => {
    try {
      const token = localStorage.getItem("token");
      console.log("🔑 Using token:", token ? "Found" : "Not found");
      // First get all product types to find the ID
      const response = await fetch("http://localhost:8000/api/users/product-types", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const productTypes = await response.json();
        console.log("📦 Received product types:", productTypes);
        const antivirusType = productTypes.find((pt: any) => pt.name_en === productTypeName);
        if (antivirusType) {
          console.log("✅ Found antivirus type:", antivirusType);
          setProductTypeId(antivirusType.id);
          loadProductClasses(antivirusType.id);
        } else {
          console.error("❌ Product type not found:", productTypeName);
          setLoading(false);
        }
      } else {
        console.error("❌ Failed to fetch product types:", response.status);
        setLoading(false);
      }
    } catch (error) {
      console.error("❌ Error getting product type ID:", error);
      setLoading(false);
    }
  };

  const loadProductClasses = async (typeId: number) => {
    try {
      const token = localStorage.getItem("token");
      console.log("🔑 Loading classes for type ID:", typeId);
      const response = await fetch(`http://localhost:8000/api/security-targets/product-types/${typeId}/classes`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("📦 Received classes:", data);
        setClasses(data);
      } else {
        console.error("❌ Failed to fetch classes:", response.status);
      }
    } catch (error) {
      console.error("❌ Error loading classes:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleClass = (classId: number) => {
    setActiveClass(activeClass === classId ? null : classId);
  };

  const isClassSelected = (classId: number, subclassId?: number) => {
    return selectedClasses.some(
      sel => sel.product_class_id === classId && 
      (!subclassId || sel.product_subclass_id === subclassId)
    );
  };

  const handleClassSelection = (classId: number, subclassId?: number) => {
    const existing = selectedClasses.find(
      sel => sel.product_class_id === classId && sel.product_subclass_id === subclassId
    );

    if (existing) {
      setSelectedClasses(selectedClasses.filter(
        sel => !(sel.product_class_id === classId && sel.product_subclass_id === subclassId)
      ));
    } else {
      setSelectedClasses([...selectedClasses, {
        product_class_id: classId,
        product_subclass_id: subclassId,
        description: "",
        justification: "",
        test_approach: ""
      }]);
    }
  };

  const updateSelection = (index: number, field: string, value: string) => {
    const updated = [...selectedClasses];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedClasses(updated);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const formData = JSON.parse(localStorage.getItem("applicationFormData") || "{}");
      
      // Create FormData for the application (backend expects Form data, not JSON)
      const formDataToSend = new FormData();
      
      // Add all form fields as Form data
      formDataToSend.append('product_name', formData.product_name || '');
      formDataToSend.append('product_type', formData.product_type || 'Antimalware Software');
      formDataToSend.append('description', formData.description || '');
      formDataToSend.append('evaluation_level', formData.evaluation_level || 'EAL1');
      formDataToSend.append('company_name', formData.company_name || '');
      formDataToSend.append('contact_person', formData.contact_person || '');
      formDataToSend.append('contact_email', formData.contact_email || '');
      formDataToSend.append('contact_phone', formData.contact_phone || '');
      
      console.log("📤 Creating application with FormData:", {
        product_name: formData.product_name,
        product_type: formData.product_type,
        description: formData.description,
        evaluation_level: formData.evaluation_level,
        company_name: formData.company_name,
        contact_person: formData.contact_person,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone
      });
      
      // First create the application with FormData (not JSON)
      const appResponse = await fetch("http://localhost:8000/api/applications/", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          // Don't set Content-Type header - let browser set it for FormData
        },
        body: formDataToSend
      });

      if (appResponse.ok) {
        const application = await appResponse.json();
        console.log("✅ Application created successfully:", application);
        
        // Save security target selections
        for (const selection of selectedClasses) {
          const selectionResponse = await fetch(`http://localhost:8000/api/security-targets/applications/${application.id}/security-target/classes`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(selection)
          });

          if (!selectionResponse.ok) {
            const errorData = await selectionResponse.json();
            throw new Error(errorData.detail || "Failed to save class selection");
          }
        }

        // Submit the security target
        const submitResponse = await fetch(`http://localhost:8000/api/security-targets/applications/${application.id}/security-target/submit`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        if (submitResponse.ok) {
          console.log("✅ Security target submitted successfully");
          
          alert("اهداف امنیتی با موفقیت ثبت شد و درخواست شما در صف بررسی قرار گرفت.");
          
          // Clear form data from localStorage
          localStorage.removeItem("applicationFormData");
          
          // Redirect to dashboard
          window.location.href = "/dashboard/applicant";
        } else {
          const errorData = await submitResponse.json();
          console.error("❌ Failed to submit security target:", errorData);
          alert(`خطا در ثبت اهداف امنیتی: ${errorData.detail || 'خطای نامشخص'}`);
        }
      } else {
        const errorData = await appResponse.json();
        console.error("Error creating application:", errorData);
        alert(errorData.detail || "خطا در ثبت درخواست. لطفاً دوباره تلاش کنید.");
      }
    } catch (error) {
      console.error("Error submitting:", error);
      alert(error instanceof Error ? error.message : "خطا در ارسال اطلاعات. لطفاً دوباره تلاش کنید.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full"
        />
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
              <Link href="/dashboard/applicant/new-application" className="text-blue-600 hover:text-blue-700 ml-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                هدف امنیتی (Security Target)
              </h1>
            </div>
            <div className="text-sm text-gray-600">
              نرم‌افزار آنتی‌ویروس
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: step >= s ? 1 : 0.8 }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {s}
                </motion.div>
                {s < 3 && (
                  <div className={`w-24 h-1 mx-2 ${step > s ? 'bg-blue-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-sm">
            <span className={step >= 1 ? 'text-blue-600 font-medium' : 'text-gray-400'}>انتخاب کلاس‌ها</span>
            <span className={step >= 2 ? 'text-blue-600 font-medium' : 'text-gray-400'}>توضیحات پیاده‌سازی</span>
            <span className={step >= 3 ? 'text-blue-600 font-medium' : 'text-gray-400'}>بازبینی و ارسال</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  کلاس‌های امنیتی محصول را انتخاب کنید
                </h2>
                <p className="text-gray-600 mb-8">
                  کلاس‌هایی که محصول شما پیاده‌سازی می‌کند را انتخاب نمایید. می‌توانید یک یا چند کلاس را انتخاب کنید.
                </p>

                <div className="space-y-4">
                  {classes.map((cls) => (
                    <motion.div
                      key={cls.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border border-gray-200 rounded-xl overflow-hidden"
                    >
                      <div
                        onClick={() => toggleClass(cls.id)}
                        className="p-4 bg-gradient-to-r from-gray-50 to-white cursor-pointer hover:from-blue-50 hover:to-white transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 space-x-reverse">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                              activeClass === cls.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                            }`}>
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{cls.name_fa}</h3>
                              <p className="text-sm text-gray-500">{cls.code}</p>
                            </div>
                          </div>
                          <motion.div
                            animate={{ rotate: activeClass === cls.id ? 180 : 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </motion.div>
                        </div>
                      </div>

                      <AnimatePresence>
                        {activeClass === cls.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="border-t border-gray-100"
                          >
                            <div className="p-4 bg-gray-50">
                              <p className="text-gray-600 mb-4">{cls.description_fa}</p>
                              
                              {cls.subclasses.length > 0 && (
                                <div className="space-y-3">
                                  <h4 className="font-medium text-gray-900 mb-3">زیرکلاس‌ها:</h4>
                                  {cls.subclasses.map((sub) => (
                                    <label
                                      key={sub.id}
                                      className="flex items-start space-x-3 space-x-reverse p-3 rounded-lg hover:bg-white cursor-pointer transition-colors"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isClassSelected(cls.id, sub.id)}
                                        onChange={() => handleClassSelection(cls.id, sub.id)}
                                        className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                      />
                                      <div className="flex-1">
                                        <div className="font-medium text-gray-900">{sub.name_fa}</div>
                                        <div className="text-sm text-gray-500 mt-1">{sub.description_fa}</div>
                                      </div>
                                    </label>
                                  ))}
                                </div>
                              )}
                              
                              {cls.subclasses.length === 0 && (
                                <label className="flex items-center space-x-3 space-x-reverse">
                                  <input
                                    type="checkbox"
                                    checked={isClassSelected(cls.id)}
                                    onChange={() => handleClassSelection(cls.id)}
                                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                  />
                                  <span className="font-medium">انتخاب این کلاس</span>
                                </label>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  disabled={selectedClasses.length === 0}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  مرحله بعد
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="space-y-6">
                {selectedClasses.map((selection, index) => {
                  const cls = classes.find(c => c.id === selection.product_class_id);
                  const sub = cls?.subclasses.find(s => s.id === selection.product_subclass_id);
                  
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-2xl shadow-lg p-6"
                    >
                      <div className="flex items-center mb-6">
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center ml-3">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{cls?.name_fa}</h3>
                          {sub && <p className="text-sm text-gray-500">{sub.name_fa}</p>}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            توضیح پیاده‌سازی
                          </label>
                          <textarea
                            rows={4}
                            value={selection.description}
                            onChange={(e) => updateSelection(index, 'description', e.target.value)}
                            placeholder="نحوه پیاده‌سازی این کلاس در محصول شما را توضیح دهید..."
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            دلیل نیاز به این کلاس
                          </label>
                          <textarea
                            rows={3}
                            value={selection.justification}
                            onChange={(e) => updateSelection(index, 'justification', e.target.value)}
                            placeholder="چرا محصول شما به این کلاس نیاز دارد؟"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            روش آزمون پیشنهادی
                          </label>
                          <textarea
                            rows={3}
                            value={selection.test_approach}
                            onChange={(e) => updateSelection(index, 'test_approach', e.target.value)}
                            placeholder="چگونه می‌توان این قابلیت را آزمون کرد؟"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  مرحله قبل
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={selectedClasses.some(s => !s.description)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  بازبینی نهایی
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">بازبینی نهایی</h2>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <svg className="w-6 h-6 text-blue-600 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-blue-800">
                      لطفاً اطلاعات وارد شده را بازبینی کنید. پس از ارسال، هدف امنیتی برای ارزیابی ارسال خواهد شد.
                    </p>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <h3 className="font-semibold text-gray-900">کلاس‌های انتخاب شده:</h3>
                  {selectedClasses.map((selection, index) => {
                    const cls = classes.find(c => c.id === selection.product_class_id);
                    const sub = cls?.subclasses.find(s => s.id === selection.product_subclass_id);
                    
                    return (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="font-medium text-gray-900 mb-2">
                          {cls?.name_fa} {sub && `- ${sub.name_fa}`}
                        </div>
                        <div className="text-sm text-gray-600 space-y-2">
                          <div>
                            <span className="font-medium">پیاده‌سازی:</span> {selection.description}
                          </div>
                          {selection.justification && (
                            <div>
                              <span className="font-medium">دلیل:</span> {selection.justification}
                            </div>
                          )}
                          {selection.test_approach && (
                            <div>
                              <span className="font-medium">روش آزمون:</span> {selection.test_approach}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => setStep(2)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    ویرایش
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center"
                  >
                    {saving ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        در حال ارسال...
                      </>
                    ) : (
                      'ارسال نهایی'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
} 