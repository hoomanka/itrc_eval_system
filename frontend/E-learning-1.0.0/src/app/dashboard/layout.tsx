import React from "react";
import { Metadata } from "next";
import "@/utils/api-test"; // Import API test utility

export const metadata: Metadata = {
  title: "Dashboard - E-learning Platform",
  description: "Manage your courses and progress",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
} 