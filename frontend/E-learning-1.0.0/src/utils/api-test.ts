// API Test Utility
// This file provides functions to test the backend API endpoints

export const testAPIEndpoints = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    console.error("❌ No authentication token found");
    return;
  }

  console.log("🔍 Testing API endpoints...");

  // Test applicant's applications endpoint
  try {
    console.log("\n📋 Testing /api/applications (Applicant view):");
    const applicantResponse = await fetch("http://localhost:8000/api/applications", {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });
    console.log("Status:", applicantResponse.status);
    if (applicantResponse.ok) {
      const data = await applicantResponse.json();
      console.log("Number of applications:", data.length);
      console.log("Sample data:", data.slice(0, 2));
    } else {
      console.error("Error:", await applicantResponse.text());
    }
  } catch (error) {
    console.error("Failed to test applicant endpoint:", error);
  }

  // Test evaluator's dashboard endpoint
  try {
    console.log("\n📋 Testing /api/applications/dashboard/list (Evaluator view):");
    const evaluatorResponse = await fetch("http://localhost:8000/api/applications/dashboard/list", {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });
    console.log("Status:", evaluatorResponse.status);
    if (evaluatorResponse.ok) {
      const data = await evaluatorResponse.json();
      console.log("Number of applications:", data.length);
      console.log("Applications by status:");
      const statusCounts = data.reduce((acc: any, app: any) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
      }, {});
      console.log(statusCounts);
      console.log("Sample data:", data.slice(0, 2));
    } else {
      console.error("Error:", await evaluatorResponse.text());
    }
  } catch (error) {
    console.error("Failed to test evaluator endpoint:", error);
  }

  // Test creating a new application
  try {
    console.log("\n📋 Testing POST /api/applications (Create new):");
    const testData = {
      product_name: "Test Product " + Date.now(),
      product_type: "Firewall",
      description: "Test description",
      evaluation_level: "EAL2",
      company_name: "Test Company",
      contact_person: "Test Person",
      contact_email: "test@example.com",
      contact_phone: "1234567890",
      status: "submitted"
    };
    
    const formData = new FormData();
    Object.entries(testData).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const createResponse = await fetch("http://localhost:8000/api/applications/", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
      body: formData,
    });
    console.log("Status:", createResponse.status);
    if (createResponse.ok) {
      const newApp = await createResponse.json();
      console.log("Created application:", newApp);
      return newApp.id;
    } else {
      console.error("Error:", await createResponse.text());
    }
  } catch (error) {
    console.error("Failed to test create endpoint:", error);
  }
};

// Make it available globally for testing in browser console
if (typeof window !== 'undefined') {
  (window as any).testAPIEndpoints = testAPIEndpoints;
} 