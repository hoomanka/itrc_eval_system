"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface ProductClass {
  id: number;
  name_fa: string;
  name_en: string;
  code: string;
  description_fa: string;
  weight: number;
}

interface STClassSelection {
  id: number;
  product_class: ProductClass;
  product_subclass_id?: number;
  score?: number;
  description?: string;
  justification?: string;
  test_approach?: string;
}

interface SecurityTarget {
  id: number;
  application_id: number;
  class_selections: STClassSelection[];
  created_at: string;
  updated_at: string;
}

interface Application {
  id: number;
  application_number: string;
  product_name: string;
  company_name: string;
  status: string;
  security_target?: SecurityTarget;
}

interface EvaluationHelp {
  help_text_fa: string;
  help_text_en: string;
  evaluation_criteria: any;
}

interface Evaluation {
  application_id: string;
  evaluator_id: string;
  status: string;
  score: number;
  comments: string;
  created_at: string;
  updated_at: string;
}

export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  return [];
}

export default function EvaluationPage({ params }: { params: { id: string } }) {
  const [application, setApplication] = useState<Application | null>(null);
  const [securityTarget, setSecurityTarget] = useState<SecurityTarget | null>(null);
  const [activeHelp, setActiveHelp] = useState<{[key: string]: EvaluationHelp}>({});
  const [evaluationNotes, setEvaluationNotes] = useState<{[key: number]: string}>({});
  const [evaluationScores, setEvaluationScores] = useState<{[key: number]: number}>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showHelp, setShowHelp] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [evaluation, setEvaluation] = useState<Evaluation>({
    application_id: params.id,
    evaluator_id: "",
    status: "pending",
    score: 0,
    comments: "",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  const loadApplication = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("توکن احراز هویت یافت نشد");
        window.location.href = "/signin";
        return;
      }

      console.log("🔍 Loading application:", params.id);
      const response = await fetch(`http://localhost:8000/api/applications/${params.id}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          setError("درخواست مورد نظر یافت نشد");
          return;
        }
        throw new Error(`Failed to load application: ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ Application loaded:", data);
      setApplication(data);

      // Load security target
      const stResponse = await fetch(`http://localhost:8000/api/security-targets/applications/${params.id}/security-target`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!stResponse.ok) {
        if (stResponse.status === 404) {
          setError("اهداف امنیتی برای این درخواست یافت نشد");
          return;
        }
        throw new Error(`Failed to load security target: ${stResponse.status}`);
      }

      const stData = await stResponse.json();
      console.log("✅ Security target loaded:", stData);
      setSecurityTarget(stData);
      
      // Load help for each class
      for (const selection of stData.class_selections) {
        const helpResponse = await fetch(
          `http://localhost:8000/api/security-targets/evaluation-help/${selection.product_class.id}${
            selection.product_subclass_id ? `?subclass_id=${selection.product_subclass_id}` : ''
          }`,
          {
            headers: {
              "Authorization": `Bearer ${token}`,
            },
          }
        );
        
        if (helpResponse.ok) {
          const helpData = await helpResponse.json();
          setActiveHelp(prev => ({
            ...prev,
            [`${selection.product_class.id}_${selection.product_subclass_id || 0}`]: helpData
          }));
        }
      }

      // Load existing evaluation if any
      const evalResponse = await fetch(`http://localhost:8000/api/evaluations/${params.id}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (evalResponse.ok) {
        const evalData = await evalResponse.json();
        console.log("✅ Existing evaluation loaded:", evalData);
        setEvaluation(evalData);
      }
    } catch (error) {
      console.error("❌ Error loading application:", error);
      setError(`خطا در بارگیری درخواست: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplication();
  }, [params.id]);

  const calculateTotalScore = () => {
    if (!securityTarget) return 0;
    
    let totalScore = 0;
    let totalWeight = 0;
    
    securityTarget.class_selections.forEach(selection => {
      const score = selection.score || 0;
      const weight = selection.product_class.weight || 1;
      totalScore += score * weight;
      totalWeight += weight;
    });
    
    return totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) / 100 : 0;
  };

  const handleScoreChange = (selectionId: number, score: number) => {
    if (!securityTarget) return;
    
    setSecurityTarget(prev => {
      if (!prev) return prev;
      
      const updatedSelections = prev.class_selections.map(selection => {
        if (selection.id === selectionId) {
          return { ...selection, score };
        }
        return selection;
      });
      
      return { ...prev, class_selections: updatedSelections };
    });
  };

  const handleNotesChange = (selectionId: number, notes: string) => {
    setEvaluationNotes(prev => ({ ...prev, [selectionId]: notes }));
  };

  const handleCommentsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEvaluation(prev => ({
      ...prev,
      comments: e.target.value
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'bg-green-100 text-green-800';
      case 'fail': return 'bg-red-100 text-red-800';
      case 'needs_revision': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSaveEvaluation = async (selectionId: number, status: string) => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8000/api/security-targets/class-selections/${selectionId}/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          evaluation_status: status,
          evaluation_score: evaluationScores[selectionId],
          evaluator_notes: evaluationNotes[selectionId]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save evaluation');
      }

      // Update local state
      setSecurityTarget(prev => {
        if (!prev) return null;
        return {
          ...prev,
          class_selections: prev.class_selections.map(selection => 
            selection.id === selectionId 
              ? { 
                  ...selection, 
                  evaluation_status: status,
                  evaluation_score: evaluationScores[selectionId],
                  evaluator_notes: evaluationNotes[selectionId]
                }
              : selection
          )
        };
      });
      
      // Show success message
      alert("ارزیابی ذخیره شد");
    } catch (error) {
      console.error("Error saving evaluation:", error);
      alert("خطا در ذخیره ارزیابی");
    } finally {
      setSaving(false);
    }
  };

  const submitEvaluation = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("توکن احراز هویت یافت نشد");
      }

      const userData = localStorage.getItem("user");
      if (!userData) {
        throw new Error("اطلاعات کاربر یافت نشد");
      }
      const user = JSON.parse(userData);

      const evaluationData = {
        application_id: params.id,
        evaluator_id: user.id,
        status: "completed",
        score: calculateTotalScore(),
        comments: evaluation.comments,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log("📤 Submitting evaluation:", evaluationData);

      const response = await fetch("http://localhost:8000/api/evaluations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(evaluationData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to submit evaluation: ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ Evaluation submitted successfully:", data);

      // Update application status
      const updateResponse = await fetch(`http://localhost:8000/api/applications/${params.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "completed" }),
      });

      if (!updateResponse.ok) {
        throw new Error(`Failed to update application status: ${updateResponse.status}`);
      }

      alert("ارزیابی با موفقیت ثبت شد");
      window.location.href = "/dashboard/evaluator";
    } catch (error) {
      console.error("❌ Error submitting evaluation:", error);
      alert(`خطا در ثبت ارزیابی: ${error}`);
    } finally {
      setSaving(false);
    }
  };

  const saveDraft = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("توکن احراز هویت یافت نشد");
      }

      const userData = localStorage.getItem("user");
      if (!userData) {
        throw new Error("اطلاعات کاربر یافت نشد");
      }
      const user = JSON.parse(userData);

      const evaluationData = {
        application_id: params.id,
        evaluator_id: user.id,
        status: "in_progress",
        score: calculateTotalScore(),
        comments: evaluation.comments,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log("📤 Saving evaluation draft:", evaluationData);

      const response = await fetch("http://localhost:8000/api/evaluations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(evaluationData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to save draft: ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ Draft saved successfully:", data);

      // Update application status
      const updateResponse = await fetch(`http://localhost:8000/api/applications/${params.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "in_evaluation" }),
      });

      if (!updateResponse.ok) {
        throw new Error(`Failed to update application status: ${updateResponse.status}`);
      }

      alert("پیش‌نویس با موفقیت ذخیره شد");
    } catch (error) {
      console.error("❌ Error saving draft:", error);
      alert(`خطا در ذخیره پیش‌نویس: ${error}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-lg font-medium text-red-800 mb-2">خطا</h2>
            <p className="text-red-700">{error}</p>
            <div className="mt-4 flex space-x-4">
              <button
                onClick={loadApplication}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                تلاش مجدد
              </button>
              <Link
                href="/dashboard/evaluator"
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                بازگشت به داشبورد
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!application || !securityTarget) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h2 className="text-lg font-medium text-yellow-800 mb-2">اطلاعات ناقص</h2>
            <p className="text-yellow-700">اطلاعات درخواست یا اهداف امنیتی یافت نشد.</p>
            <div className="mt-4">
              <Link
                href="/dashboard/evaluator"
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
              >
                بازگشت به داشبورد
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">ارزیابی درخواست</h1>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">نام شرکت</p>
              <p className="font-medium">{application.company_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">شماره درخواست</p>
              <p className="font-medium">{application.id}</p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {securityTarget.class_selections.map((selection) => (
            <div key={selection.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {selection.product_class.name_fa}
                </h2>
                <button
                  onClick={() => setShowHelp(showHelp === selection.id ? null : selection.id)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  {showHelp === selection.id ? "بستن راهنما" : "نمایش راهنما"}
                </button>
              </div>

              {showHelp === selection.id && activeHelp[`${selection.product_class.id}_${selection.product_subclass_id || 0}`] && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h3 className="text-lg font-medium text-blue-800 mb-2">راهنمای ارزیابی</h3>
                  <div className="prose prose-blue max-w-none">
                    {activeHelp[`${selection.product_class.id}_${selection.product_subclass_id || 0}`].help_text_fa}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    امتیاز
                  </label>
                  <select
                    value={selection.score || 0}
                    onChange={(e) => handleScoreChange(selection.id, Number(e.target.value))}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value={0}>انتخاب کنید</option>
                    <option value={1}>1 - ضعیف</option>
                    <option value={2}>2 - متوسط</option>
                    <option value={3}>3 - خوب</option>
                    <option value={4}>4 - عالی</option>
                    <option value={5}>5 - برجسته</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">توضیحات تکمیلی</h2>
          <textarea
            value={evaluation.comments}
            onChange={handleCommentsChange}
            rows={4}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="توضیحات خود را وارد کنید..."
          />
        </div>

        <div className="mt-8 flex justify-end space-x-4">
          <button
            onClick={saveDraft}
            disabled={saving}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            ذخیره موقت
          </button>
          <button
            onClick={submitEvaluation}
            disabled={saving}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            ارسال گزارش نهایی
          </button>
        </div>
      </div>
    </div>
  );
} 