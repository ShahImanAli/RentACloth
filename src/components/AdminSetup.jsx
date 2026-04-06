import { useState } from "react";
import { initializeSuperAdmin } from "../firebase/admin";
import { useAuth } from "../context/AuthContext";

function AdminSetup() {
  const { user } = useAuth();
  const [targetUserId, setTargetUserId] = useState("");
  const [targetUserEmail, setTargetUserEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleMakeAdmin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await initializeSuperAdmin(
        targetUserId,
        targetUserEmail
      );
      setResult(response);
    } catch (error) {
      setResult({
        success: false,
        message: "Error: " + error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const makeSelfAdmin = async () => {
    if (!user) {
      alert("Please log in first!");
      return;
    }

    setLoading(true);
    try {
      const response = await initializeSuperAdmin(user.uid, user.email);
      setResult(response);
      if (response.success) {
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (error) {
      setResult({
        success: false,
        message: "Error: " + error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-center">👑 Admin Setup</h2>

      {/* Make Current User Admin */}
      {user && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2">Make Yourself Admin</h3>
          <p className="text-sm text-gray-600 mb-3">
            Current User: {user.email}
          </p>
          <button
            onClick={makeSelfAdmin}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "⏳ Setting up..." : "🚀 Make Me Admin"}
          </button>
        </div>
      )}

      {/* Make Other User Admin */}
      <div className="mb-6">
        <h3 className="font-semibold mb-2">Make Another User Admin</h3>
        <form onSubmit={handleMakeAdmin} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">
              User ID (UID)
            </label>
            <input
              type="text"
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              placeholder="Enter user's Firebase UID"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={targetUserEmail}
              onChange={(e) => setTargetUserEmail(e.target.value)}
              placeholder="Enter user's email"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading || !targetUserId || !targetUserEmail}
            className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "⏳ Creating Admin..." : "✨ Make Admin"}
          </button>
        </form>
      </div>

      {/* Result Display */}
      {result && (
        <div
          className={`p-4 rounded-lg ${
            result.success
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          <p className="font-medium">
            {result.success ? "✅ Success!" : "❌ Error"}
          </p>
          <p className="text-sm">{result.message}</p>
          {result.success && (
            <p className="text-xs mt-1">Page will refresh in a moment...</p>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium mb-2">💡 How to get User ID:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>1. User signs up/logs in</li>
          <li>2. Check browser console for UID</li>
          <li>3. Or check Firebase Auth users</li>
          <li>4. Use that UID in the form above</li>
        </ul>
      </div>
    </div>
  );
}

export default AdminSetup;
