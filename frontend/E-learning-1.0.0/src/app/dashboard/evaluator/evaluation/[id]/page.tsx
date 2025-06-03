"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// Simple icon components to replace heroicons
const DocumentTextIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const CheckCircleIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XCircleIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const QuestionMarkCircleIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const BookOpenIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const ArrowLeftIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const ExclamationTriangleIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

interface ProductSubclass {
  id: number;
  name_en: string;
  name_fa: string;
  code: string;
  description_fa: string;
}

interface ProductClass {
  id: number;
  name_fa: string;
  name_en: string;
  code: string;
  description_fa: string;
  subclasses?: ProductSubclass[];
}

interface STClassSelection {
  id: number;
  product_class: ProductClass;
  product_subclass?: ProductSubclass;
  description: string;
  justification: string;
  test_approach: string;
  evaluator_notes?: string;
  evaluation_status: string;
  evaluation_score?: number;
}

interface SecurityTarget {
  id: number;
  application_id: number;
  class_selections: STClassSelection[];
  product_description: string;
  toe_description: string;
}

interface Application {
  id: number;
  application_number: string;
  product_name: string;
  product_type: string;
  company_name: string;
  contact_person: string;
  contact_email: string;
  status: string;
  description: string;
  evaluation_level: string;
}

interface EvaluationHelp {
  id: number;
  help_text_fa: string;
  help_text_en: string;
  evaluation_criteria: any;
  examples: any;
}

interface DebugInfo {
  timestamp: string;
  applicationLoaded: boolean;
  securityTargetLoaded: boolean;
  classSelectionsCount: number;
  evaluationHelpsCount: number;
  apiErrors: string[];
  dataValidation: string[];
}

export default function EvaluationPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.id as string;

  const [application, setApplication] = useState<Application | null>(null);
  const [securityTarget, setSecurityTarget] = useState<SecurityTarget | null>(null);
  const [evaluationHelps, setEvaluationHelps] = useState<{[key: string]: EvaluationHelp}>({});
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showGuide, setShowGuide] = useState<number | null>(null);
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    timestamp: new Date().toISOString(),
    applicationLoaded: false,
    securityTargetLoaded: false,
    classSelectionsCount: 0,
    evaluationHelpsCount: 0,
    apiErrors: [],
    dataValidation: []
  });
  const [showDebug, setShowDebug] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Enhanced debugging function
  const logDebug = (message: string, data?: any) => {
    console.log(`🔍 [Evaluation Debug] ${message}`, data || '');
    setDebugInfo(prev => ({
      ...prev,
      dataValidation: [...prev.dataValidation, `${new Date().toLocaleTimeString()}: ${message}`]
    }));
  };

  const logError = (message: string, error?: any) => {
    console.error(`❌ [Evaluation Error] ${message}`, error || '');
    setDebugInfo(prev => ({
      ...prev,
      apiErrors: [...prev.apiErrors, `${new Date().toLocaleTimeString()}: ${message}`]
    }));
  };

  // Load data
  useEffect(() => {
    // Load user from localStorage if available
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
    loadApplicationData();
  }, [applicationId]);

  const loadApplicationData = async () => {
    setLoading(true);
    setError("");
    logDebug("Starting to load application data", { applicationId });
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        logError("No authentication token found");
        router.push("/signin");
        return;
      }

      logDebug("Token found, proceeding with API calls");

      // Reset debug info
      setDebugInfo(prev => ({
        ...prev,
        timestamp: new Date().toISOString(),
        applicationLoaded: false,
        securityTargetLoaded: false,
        classSelectionsCount: 0,
        evaluationHelpsCount: 0,
        apiErrors: [],
        dataValidation: []
      }));

      // Load application
      logDebug("🔍 Loading application data", { applicationId });
      const appResponse = await fetch(`http://localhost:8000/api/applications/${applicationId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (!appResponse.ok) {
        const errorText = await appResponse.text();
        logError(`Failed to load application: ${appResponse.status}`, errorText);
        throw new Error(`Failed to load application: ${appResponse.status} - ${errorText}`);
      }
      
      const appData = await appResponse.json();
      logDebug("✅ Application loaded successfully", appData);
      setApplication(appData);
      setDebugInfo(prev => ({ ...prev, applicationLoaded: true }));

      // Load security target
      logDebug("🎯 Loading security target data");
      const stResponse = await fetch(`http://localhost:8000/api/security-targets/applications/${applicationId}/security-target`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!stResponse.ok) {
        const errorText = await stResponse.text();
        logError(`Failed to load security target: ${stResponse.status}`, errorText);
        throw new Error(`Failed to load security target: ${stResponse.status} - ${errorText}`);
      }

      const stData = await stResponse.json();
      logDebug("✅ Security target API response received", stData);
      
      // Comprehensive validation of security target data
      if (!stData) {
        logError("Security target data is null/undefined");
        throw new Error("Security target data is null");
      }

      if (!stData.class_selections) {
        logError("Security target has no class_selections property", stData);
        throw new Error("Security target has no class selections");
      }

      if (!Array.isArray(stData.class_selections)) {
        logError("class_selections is not an array", { type: typeof stData.class_selections, value: stData.class_selections });
        throw new Error("Class selections data is corrupted");
      }

      logDebug(`📂 Found ${stData.class_selections.length} class selections`);

      // Validate each class selection
      const validatedSelections = [];
      for (let i = 0; i < stData.class_selections.length; i++) {
        const selection = stData.class_selections[i];
        logDebug(`🔍 Validating selection ${i + 1}`, selection);

        if (!selection) {
          logError(`Selection ${i + 1} is null/undefined`);
          continue;
        }

        if (!selection.product_class) {
          logError(`Selection ${i + 1} missing product_class`, selection);
          continue;
        }

        if (!selection.product_class.id) {
          logError(`Selection ${i + 1} product_class missing id`, selection.product_class);
          continue;
        }

        if (!selection.product_class.name_fa) {
          logError(`Selection ${i + 1} product_class missing name_fa`, selection.product_class);
        }

        if (selection.product_subclass && !selection.product_subclass.id) {
          logError(`Selection ${i + 1} product_subclass missing id`, selection.product_subclass);
        }

        logDebug(`✅ Selection ${i + 1} validation passed`, {
          selectionId: selection.id,
          className: selection.product_class.name_fa,
          subclassName: selection.product_subclass?.name_fa || 'None'
        });

        validatedSelections.push(selection);
      }

      logDebug(`📊 Validated ${validatedSelections.length} out of ${stData.class_selections.length} selections`);
      stData.class_selections = validatedSelections;
      setSecurityTarget(stData);
      setDebugInfo(prev => ({ 
        ...prev, 
        securityTargetLoaded: true,
        classSelectionsCount: validatedSelections.length
      }));

      // Load evaluation helps for each class
      logDebug("📚 Loading evaluation help data");
      const helps: {[key: string]: EvaluationHelp} = {};
      let helpCount = 0;

      for (const selection of validatedSelections) {
        const helpKey = `${selection.product_class.id}_${selection.product_subclass?.id || 0}`;
        try {
          const helpUrl = `http://localhost:8000/api/security-targets/evaluation-help/${selection.product_class.id}` +
                         (selection.product_subclass?.id ? `?subclass_id=${selection.product_subclass.id}` : '');
          
          logDebug(`📖 Loading help for class: ${selection.product_class.name_fa}`, { helpUrl });
          const helpResponse = await fetch(helpUrl, {
            headers: { "Authorization": `Bearer ${token}` }
          });
        
        if (helpResponse.ok) {
          const helpData = await helpResponse.json();
            helps[helpKey] = helpData;
            helpCount++;
            logDebug(`✅ Help loaded for: ${selection.product_class.name_fa}`, helpData);
          } else {
            logError(`Help not found for: ${selection.product_class.name_fa} (${helpResponse.status})`);
          }
        } catch (err) {
          logError(`Exception loading help for class ${selection.product_class.id}:`, err);
        }
      }
      
      setEvaluationHelps(helps);
      setDebugInfo(prev => ({ ...prev, evaluationHelpsCount: helpCount }));
      logDebug(`📚 Loaded ${helpCount} evaluation help entries`);

    } catch (err: any) {
      logError("Critical error loading application data:", err);
      setError(err.message || "Unknown error occurred");
    } finally {
      setLoading(false);
      logDebug("Data loading completed");
    }
  };

  const updateEvaluation = async (selectionId: number, updates: Partial<STClassSelection>) => {
    setSaving(true);
    logDebug("Updating evaluation", { selectionId, updates });

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8000/api/security-targets/class-selections/${selectionId}/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorText = await response.text();
        logError("Failed to save evaluation", errorText);
        throw new Error(`Failed to save evaluation: ${response.status} - ${errorText}`);
      }

      const responseData = await response.json();
      logDebug("✅ Evaluation updated successfully", responseData);

      // Update local state
      setSecurityTarget(prev => {
        if (!prev) return null;
        return {
          ...prev,
          class_selections: prev.class_selections.map(selection => 
            selection.id === selectionId ? { ...selection, ...updates } : selection
          )
        };
      });
      
    } catch (err: any) {
      logError("Error updating evaluation:", err);
      alert(`خطا در ذخیره: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'bg-green-500';
      case 'fail': return 'bg-red-500';
      case 'needs_revision': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircleIcon className="w-5 h-5" />;
      case 'fail': return <XCircleIcon className="w-5 h-5" />;
      case 'needs_revision': return <QuestionMarkCircleIcon className="w-5 h-5" />;
      default: return <DocumentTextIcon className="w-5 h-5" />;
    }
  };

  const submitEvaluation = async () => {
    setSaving(true);
    logDebug("Submitting final evaluation");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("توکن احراز هویت یافت نشد");
      }

      if (!securityTarget) {
        throw new Error("اطلاعات اهداف امنیتی یافت نشد");
      }

      const evaluationData = {
        application_id: parseInt(applicationId),
        evaluator_id: user?.id,
        findings: `ارزیابی ${securityTarget.class_selections.length} کلاس امنیتی انجام شد.`,
        recommendations: "پیشنهادات بر اساس یافته‌های ارزیابی"
      };

      logDebug("📤 Submitting evaluation data", evaluationData);

      const response = await fetch("http://localhost:8000/api/evaluations/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(evaluationData),
      });

      if (!response.ok) {
        let errorText;
        try {
        const errorData = await response.json();
          errorText = errorData.detail || JSON.stringify(errorData);
        } catch {
          errorText = await response.text();
        }
        throw new Error(errorText || `Failed to submit evaluation: ${response.status}`);
      }

      const data = await response.json();
      logDebug("✅ Evaluation submitted successfully", data);

      alert("ارزیابی با موفقیت ثبت شد");
      router.push("/dashboard/evaluator");
    } catch (error: any) {
      logError("Error submitting evaluation:", error);
      alert(`خطا در ثبت ارزیابی: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const saveDraft = async () => {
    setSaving(true);
    logDebug("Saving draft evaluation");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("توکن احراز هویت یافت نشد");
      }

      if (!securityTarget) {
        throw new Error("اطلاعات اهداف امنیتی یافت نشد");
      }

      // Save each class selection evaluation
      for (const selection of securityTarget.class_selections) {
        if (selection.evaluator_notes || selection.evaluation_score || selection.evaluation_status !== 'pending') {
          await updateEvaluation(selection.id, {
            evaluation_status: selection.evaluation_status,
            evaluation_score: selection.evaluation_score,
            evaluator_notes: selection.evaluator_notes
          });
        }
      }

      alert("پیش‌نویس با موفقیت ذخیره شد");
    } catch (error: any) {
      logError("Error saving draft:", error);
      alert(`خطا در ذخیره پیش‌نویس: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                {[1,2,3].map(i => (
                  <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
              <div className="h-64 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
          <div className="mt-8 text-center text-gray-600">
            <p>در حال بارگیری اطلاعات ارزیابی...</p>
            <p className="text-sm mt-2">Application ID: {applicationId}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !application || !securityTarget) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            <div className="text-center">
              <XCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">خطا در بارگیری اطلاعات</h2>
              <p className="text-gray-600 mb-4">{error || "اطلاعات درخواست یافت نشد"}</p>
              
              {/* Debug information */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold mb-2">اطلاعات تشخیص خطا:</h3>
                <div className="text-sm space-y-1">
                  <p>Application ID: {applicationId}</p>
                  <p>Application Loaded: {debugInfo.applicationLoaded ? '✅' : '❌'}</p>
                  <p>Security Target Loaded: {debugInfo.securityTargetLoaded ? '✅' : '❌'}</p>
                  <p>Class Selections Count: {debugInfo.classSelectionsCount}</p>
                  <p>Evaluation Helps Count: {debugInfo.evaluationHelpsCount}</p>
                </div>
                
                {debugInfo.apiErrors.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-red-700">API Errors:</h4>
                    <ul className="text-sm text-red-600 list-disc list-inside">
                      {debugInfo.apiErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex justify-center space-x-4">
              <button
                  onClick={loadApplicationData}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                تلاش مجدد
              </button>
              <Link
                href="/dashboard/evaluator"
                  className="inline-flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                  <ArrowLeftIcon className="w-5 h-5 mr-2" />
                بازگشت به داشبورد
              </Link>
            </div>
          </div>
          </motion.div>
        </div>
      </div>
    );
  }

    return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">ارزیابی درخواست</h1>
              <p className="text-gray-600">شماره درخواست: {application.application_number}</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowDebug(!showDebug)}
                className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-sm hover:bg-yellow-200 transition-colors"
              >
                🔍 Debug Info
              </button>
              <Link
                href="/dashboard/evaluator"
                className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                بازگشت
              </Link>
            </div>
          </div>

          {/* Debug Panel */}
          <AnimatePresence>
            {showDebug && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 bg-yellow-50 rounded-lg p-4 border border-yellow-200"
              >
                <h3 className="font-semibold text-yellow-900 mb-2">🔍 Debug Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium">Status:</h4>
                    <ul className="space-y-1">
                      <li>Application: {debugInfo.applicationLoaded ? '✅' : '❌'}</li>
                      <li>Security Target: {debugInfo.securityTargetLoaded ? '✅' : '❌'}</li>
                      <li>Class Selections: {debugInfo.classSelectionsCount}</li>
                      <li>Evaluation Helps: {debugInfo.evaluationHelpsCount}</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium">Data Validation:</h4>
                    <div className="max-h-32 overflow-y-auto">
                      {debugInfo.dataValidation.slice(-5).map((log, index) => (
                        <div key={index} className="text-xs text-gray-600">{log}</div>
                      ))}
          </div>
        </div>
      </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
              <h3 className="text-lg font-semibold">نام محصول</h3>
              <p className="text-blue-100">{application.product_name}</p>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white">
              <h3 className="text-lg font-semibold">شرکت</h3>
              <p className="text-purple-100">{application.company_name}</p>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white">
              <h3 className="text-lg font-semibold">سطح ارزیابی</h3>
              <p className="text-green-100">{application.evaluation_level}</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Security Target Info */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-xl p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <DocumentTextIcon className="w-6 h-6 mr-3 text-blue-600" />
                توضیحات محصول
                </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">توضیحات کلی:</h3>
                  <p className="text-gray-600 bg-gray-50 rounded-lg p-3">{securityTarget.product_description || application.description}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">هدف ارزیابی (TOE):</h3>
                  <p className="text-gray-600 bg-gray-50 rounded-lg p-3">{securityTarget.toe_description || "توضیحی ارائه نشده"}</p>
                </div>
              </div>
            </motion.div>

            {/* Class Selections */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-xl p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <CheckCircleIcon className="w-6 h-6 mr-3 text-green-600" />
                کلاس‌های امنیتی انتخاب شده ({securityTarget.class_selections?.length || 0})
              </h2>

              {!securityTarget.class_selections || securityTarget.class_selections.length === 0 ? (
                <div className="text-center py-8">
                  <ExclamationTriangleIcon className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">هیچ کلاس امنیتی یافت نشد</h3>
                  <p className="text-gray-600 mb-4">متقاضی هنوز کلاس‌های امنیتی را انتخاب نکرده است.</p>
                  <button
                    onClick={loadApplicationData}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    بارگیری مجدد
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {securityTarget.class_selections.map((selection, index) => {
                    // Safety check for selection data
                    if (!selection?.product_class?.id) {
                      console.warn("⚠️ Skipping invalid selection:", selection);
                      return null;
                    }

                    const helpKey = `${selection.product_class.id}_${selection.product_subclass?.id || 0}`;
                    const help = evaluationHelps[helpKey];
                    
                    return (
                      <motion.div
                        key={selection.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${getStatusColor(selection.evaluation_status)}`}></div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {selection.product_class.name_fa}
                              {selection.product_subclass && (
                                <span className="text-sm text-gray-600 mr-2">
                                  ({selection.product_subclass.name_fa})
                                </span>
                              )}
                            </h3>
                          </div>
                          <div className="flex items-center space-x-2">
                            {help && (
                              <button
                                onClick={() => setShowGuide(showGuide === selection.id ? null : selection.id)}
                                className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                              >
                                <BookOpenIcon className="w-4 h-4 mr-1" />
                                راهنما
                              </button>
                            )}
                            <span className={`flex items-center px-3 py-1 rounded-lg text-white text-sm ${getStatusColor(selection.evaluation_status)}`}>
                              {getStatusIcon(selection.evaluation_status)}
                              <span className="mr-2">
                                {selection.evaluation_status === 'pass' ? 'قبول' :
                                 selection.evaluation_status === 'fail' ? 'رد' :
                                 selection.evaluation_status === 'needs_revision' ? 'نیاز به بازبینی' : 'در انتظار'}
                              </span>
                            </span>
                          </div>
                        </div>

                        {/* Guide Panel */}
                        <AnimatePresence>
                          {showGuide === selection.id && help && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mb-4 bg-blue-50 rounded-lg p-4 border border-blue-200"
                            >
                              <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                                <BookOpenIcon className="w-5 h-5 mr-2" />
                                راهنمای ارزیابی
                              </h4>
                              <div className="text-blue-800 space-y-2">
                                <p>{help.help_text_fa}</p>
                                {help.evaluation_criteria && (
                                  <div className="mt-3">
                                    <p className="font-medium">معیارهای ارزیابی:</p>
                                    <div className="text-sm mt-1">
                                      {typeof help.evaluation_criteria === 'object' ? 
                                        JSON.stringify(help.evaluation_criteria, null, 2) : 
                                        help.evaluation_criteria}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Implementation Details */}
                        <div className="space-y-3 mb-4">
                          <div>
                            <h4 className="font-medium text-gray-700 mb-1">نحوه پیاده‌سازی:</h4>
                            <p className="text-gray-600 bg-gray-50 rounded-lg p-3 text-sm">{selection.description}</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-700 mb-1">توجیه:</h4>
                            <p className="text-gray-600 bg-gray-50 rounded-lg p-3 text-sm">{selection.justification}</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-700 mb-1">رویکرد تست:</h4>
                            <p className="text-gray-600 bg-gray-50 rounded-lg p-3 text-sm">{selection.test_approach}</p>
            </div>
        </div>

                        {/* Evaluation Controls */}
                        <div className="border-t pt-4 space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">یادداشت‌های ارزیابی:</label>
          <textarea
                              value={selection.evaluator_notes || ""}
                              onChange={(e) => {
                                const updatedSelections = securityTarget.class_selections.map(s => 
                                  s.id === selection.id ? { ...s, evaluator_notes: e.target.value } : s
                                );
                                setSecurityTarget({ ...securityTarget, class_selections: updatedSelections });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              rows={3}
                              placeholder="یادداشت‌های خود را اینجا بنویسید..."
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <label className="text-sm font-medium text-gray-700">امتیاز (0-100):</label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={selection.evaluation_score || 0}
                                onChange={(e) => {
                                  const score = parseInt(e.target.value) || 0;
                                  const updatedSelections = securityTarget.class_selections.map(s => 
                                    s.id === selection.id ? { ...s, evaluation_score: score } : s
                                  );
                                  setSecurityTarget({ ...securityTarget, class_selections: updatedSelections });
                                }}
                                className="w-20 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

                            <div className="flex items-center space-x-2">
                              {['pass', 'needs_revision', 'fail'].map((status) => (
                                <button
                                  key={status}
                                  onClick={() => updateEvaluation(selection.id, { 
                                    evaluation_status: status,
                                    evaluation_score: selection.evaluation_score,
                                    evaluator_notes: selection.evaluator_notes 
                                  })}
                                  disabled={saving}
                                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    selection.evaluation_status === status
                                      ? `${getStatusColor(status)} text-white`
                                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                  }`}
                                >
                                  {status === 'pass' ? 'قبول' :
                                   status === 'fail' ? 'رد' : 'بازبینی'}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progress Summary */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-xl p-6"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4">پیشرفت ارزیابی</h3>
              <div className="space-y-3">
                {['pass', 'needs_revision', 'fail', 'pending'].map((status) => {
                  const count = securityTarget.class_selections?.filter(s => s.evaluation_status === status).length || 0;
                  const total = securityTarget.class_selections?.length || 0;
                  const percentage = total > 0 ? (count / total) * 100 : 0;
                  
                  return (
                    <div key={status} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        {status === 'pass' ? 'قبول شده' :
                         status === 'fail' ? 'رد شده' :
                         status === 'needs_revision' ? 'نیاز به بازبینی' : 'در انتظار'}
                      </span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getStatusColor(status)}`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-xl p-6"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4">عملیات</h3>
              <div className="space-y-3">
          <button
            onClick={saveDraft}
            disabled={saving}
                  className="w-full flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
                  <DocumentTextIcon className="w-5 h-5 mr-2" />
                  {saving ? 'در حال ذخیره...' : 'ذخیره پیش‌نویس'}
          </button>
                
          <button
            onClick={submitEvaluation}
            disabled={saving}
                  className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
                  <CheckCircleIcon className="w-5 h-5 mr-2" />
                  {saving ? 'در حال ارسال...' : 'تکمیل ارزیابی'}
          </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
} 