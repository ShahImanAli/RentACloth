import { useState, useEffect } from "react";
import {
  findInvalidBookings,
  fixInvalidBookings,
  deleteInvalidBookings,
  generateDatabaseReport,
  standardizeProductFields,
} from "../../firebase/databaseCleanup";

const DatabaseManagement = () => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [invalidBookings, setInvalidBookings] = useState([]);
  const [fixResults, setFixResults] = useState(null);
  const [selectedBookings, setSelectedBookings] = useState([]);
  const [productStandardization, setProductStandardization] = useState(null);

  // Load initial report
  useEffect(() => {
    handleGenerateReport();
  }, []);

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const result = await generateDatabaseReport();
      if (result.success) {
        setReport(result.report);
      }
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleScanInvalidBookings = async () => {
    setLoading(true);
    try {
      const result = await findInvalidBookings();
      if (result.success) {
        setInvalidBookings(result.invalidBookings);
      }
    } catch (error) {
      console.error("Error scanning bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFixBookings = async (dryRun = true) => {
    setLoading(true);
    try {
      const result = await fixInvalidBookings(dryRun);
      setFixResults(result);

      // Refresh data after fixing
      if (!dryRun && result.success) {
        await handleScanInvalidBookings();
        await handleGenerateReport();
      }
    } catch (error) {
      console.error("Error fixing bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedBookings.length === 0) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedBookings.length} invalid bookings? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    setLoading(true);
    try {
      const result = await deleteInvalidBookings(selectedBookings, true);
      if (result.success) {
        setSelectedBookings([]);
        await handleScanInvalidBookings();
        await handleGenerateReport();
      }
    } catch (error) {
      console.error("Error deleting bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleBookingSelection = (bookingId) => {
    setSelectedBookings((prev) =>
      prev.includes(bookingId)
        ? prev.filter((id) => id !== bookingId)
        : [...prev, bookingId]
    );
  };

  const handleCheckProductFields = async () => {
    setLoading(true);
    try {
      const result = await standardizeProductFields(true); // Dry run
      if (result.success) {
        setProductStandardization(result);
      }
    } catch (error) {
      console.error("Error checking product fields:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStandardizeProducts = async () => {
    setLoading(true);
    try {
      const result = await standardizeProductFields(false); // Actually update
      if (result.success) {
        setProductStandardization(result);
        alert(` Successfully standardized ${result.needsUpdate} products!`);
      }
    } catch (error) {
      console.error("Error standardizing products:", error);
      alert(" Error occurred while standardizing products");
    } finally {
      setLoading(false);
    }
  };

  const selectAllInvalid = () => {
    setSelectedBookings(invalidBookings.map((b) => b.id));
  };

  const clearSelection = () => {
    setSelectedBookings([]);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Database Management
        </h2>
        <p className="text-gray-600">
          Manage and clean up invalid booking data in your Firebase database.
        </p>
      </div>

      {/* Product Field Standardization */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Product Field Standardization
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Ensure all products have consistent rentalType ("both") and rating
              (4.0) values
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCheckProductFields}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Checking..." : "Check Products"}
            </button>
            {productStandardization &&
              productStandardization.needsUpdate > 0 && (
                <button
                  onClick={handleStandardizeProducts}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {loading
                    ? "Updating..."
                    : `Fix ${productStandardization.needsUpdate} Products`}
                </button>
              )}
          </div>
        </div>

        {productStandardization && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {productStandardization.totalProducts}
                </div>
                <div className="text-sm text-blue-800">Total Products</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {productStandardization.needsUpdate}
                </div>
                <div className="text-sm text-orange-800">Need Updates</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {productStandardization.alreadyStandardized}
                </div>
                <div className="text-sm text-green-800">Already Standard</div>
              </div>
            </div>

            {productStandardization.needsUpdate > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-3">
                  Products that need standardization:
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {productStandardization.productsToUpdate.map((product) => (
                    <div
                      key={product.id}
                      className="text-sm bg-white p-2 rounded border"
                    >
                      <div className="font-medium">
                        {product.currentData.title}
                      </div>
                      <div className="text-gray-600 text-xs">
                        Current: rentalType="
                        {product.currentData.rentalType || "undefined"}",
                        rating=
                        {JSON.stringify(
                          product.currentData.rating || "undefined"
                        )}
                      </div>
                      <div className="text-green-600 text-xs">
                        Will set: rentalType="both", rating=
                        {JSON.stringify({ rate: 4.0, count: 0 })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {productStandardization.needsUpdate === 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-green-600 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-green-800 font-medium">
                     All products already have standardized fields!
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Database Health Report */}
      {report && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Database Health Report
            </h3>
            <button
              onClick={handleGenerateReport}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh Report"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {report.summary.total}
              </div>
              <div className="text-sm text-blue-800">Total Bookings</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {report.summary.valid}
              </div>
              <div className="text-sm text-green-800">Valid Bookings</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {report.summary.invalid}
              </div>
              <div className="text-sm text-red-800">Invalid Bookings</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {report.healthScore}%
              </div>
              <div className="text-sm text-purple-800">Health Score</div>
            </div>
          </div>

          {report.recommendations.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-2">
                Recommendations:
              </h4>
              <ul className="list-disc list-inside text-yellow-700 space-y-1">
                {report.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Database Operations
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={handleScanInvalidBookings}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Scan Invalid Bookings
          </button>

          <button
            onClick={() => handleFixBookings(true)}
            disabled={loading}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
          >
            Preview Fixes
          </button>

          <button
            onClick={() => handleFixBookings(false)}
            disabled={loading || !fixResults}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            Apply Fixes
          </button>

          <button
            onClick={handleGenerateReport}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
          >
            Generate Report
          </button>
        </div>
      </div>

      {/* Fix Results */}
      {fixResults && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Fix Results {fixResults.dryRun && "(Preview)"}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-blue-50 p-3 rounded">
              <div className="text-lg font-semibold text-blue-600">
                {fixResults.processed}
              </div>
              <div className="text-sm text-blue-800">Processed</div>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <div className="text-lg font-semibold text-green-600">
                {fixResults.fixed}
              </div>
              <div className="text-sm text-green-800">Fixable</div>
            </div>
            <div className="bg-red-50 p-3 rounded">
              <div className="text-lg font-semibold text-red-600">
                {fixResults.unfixable}
              </div>
              <div className="text-sm text-red-800">Unfixable</div>
            </div>
          </div>

          {fixResults.dryRun && fixResults.fixed > 0 && (
            <div className="bg-green-50 border border-green-200 rounded p-4">
              <p className="text-green-800">
                 {fixResults.fixed} bookings can be automatically fixed. Click
                "Apply Fixes" to proceed.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Invalid Bookings List */}
      {invalidBookings.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Invalid Bookings ({invalidBookings.length})
            </h3>
            <div className="space-x-2">
              <button
                onClick={selectAllInvalid}
                className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Select All
              </button>
              <button
                onClick={clearSelection}
                className="px-3 py-1 text-sm bg-gray-400 text-white rounded hover:bg-gray-500"
              >
                Clear Selection
              </button>
              {selectedBookings.length > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete Selected ({selectedBookings.length})
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Select
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Booking ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issues
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invalidBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedBookings.includes(booking.id)}
                        onChange={() => toggleBookingSelection(booking.id)}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {booking.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {booking.issues.productId || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {booking.issues.userId || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        {booking.issues.invalidStartDateTime && (
                          <span className="inline-block px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                            Invalid Start Date
                          </span>
                        )}
                        {booking.issues.invalidEndDateTime && (
                          <span className="inline-block px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                            Invalid End Date
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {booking.issues.status || "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span>Processing...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseManagement;
