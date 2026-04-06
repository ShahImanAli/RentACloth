import { useState } from "react";
import {
  migrateProductsToRental,
  addSampleRentalProducts,
  checkMigrationStatus,
} from "../firebase/migrateProductsToRental";

const DatabaseMigration = () => {
  const [migrationStatus, setMigrationStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Check current migration status
  const checkStatus = async () => {
    setLoading(true);
    try {
      const status = await checkMigrationStatus();
      setMigrationStatus(status);
      setMessage(status.message);
    } catch (error) {
      setMessage(`Error checking status: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Run migration for existing products
  const runMigration = async () => {
    setLoading(true);
    setMessage("Migrating products to rental format...");
    try {
      const result = await migrateProductsToRental();
      setMessage(result.message);
      if (result.success) {
        await checkStatus(); // Refresh status
      }
    } catch (error) {
      setMessage(`Migration failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Add sample rental products
  const addSampleProducts = async () => {
    setLoading(true);
    setMessage("Adding sample rental products...");
    try {
      const result = await addSampleRentalProducts();
      setMessage(result.message);
      if (result.success) {
        await checkStatus(); // Refresh status
      }
    } catch (error) {
      setMessage(`Failed to add sample products: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    checkStatus();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Database Migration Tool
        </h2>
        <p className="text-gray-600">
          Migrate existing products to rental format and manage rental pricing
          data.
        </p>
      </div>

      {/* Status Display */}
      {migrationStatus && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Current Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {migrationStatus.totalProducts}
              </div>
              <div className="text-sm text-gray-600">Total Products</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {migrationStatus.productsWithRentalPricing || 0}
              </div>
              <div className="text-sm text-gray-600">With Rental Pricing</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {migrationStatus.productsNeedingMigration || 0}
              </div>
              <div className="text-sm text-gray-600">Need Migration</div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-4 mb-6">
        {migrationStatus?.needsSampleData && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">
              No Products Found
            </h4>
            <p className="text-blue-700 mb-3">
              Your database appears to be empty. Would you like to add sample
              rental products?
            </p>
            <button
              onClick={addSampleProducts}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Adding Sample Products..."
                : "Add Sample Rental Products"}
            </button>
          </div>
        )}

        {migrationStatus?.needsMigration && (
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <h4 className="font-semibold text-orange-800 mb-2">
              Migration Required
            </h4>
            <p className="text-orange-700 mb-3">
              {migrationStatus.productsNeedingMigration} products need to be
              migrated to include rental pricing fields.
            </p>
            <button
              onClick={runMigration}
              disabled={loading}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Migrating Products..."
                : "Migrate Products to Rental Format"}
            </button>
          </div>
        )}

        {migrationStatus &&
          !migrationStatus.needsMigration &&
          !migrationStatus.needsSampleData && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">
                ✅ Migration Complete
              </h4>
              <p className="text-green-700">
                All products have rental pricing configured. No migration
                needed.
              </p>
            </div>
          )}
      </div>

      {/* Manual Actions */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Manual Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={checkStatus}
            disabled={loading}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Checking..." : "Refresh Status"}
          </button>

          <button
            onClick={runMigration}
            disabled={loading}
            className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Running..." : "Force Migration"}
          </button>

          <button
            onClick={addSampleProducts}
            disabled={loading}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Adding..." : "Add More Samples"}
          </button>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className="mt-6 p-4 bg-gray-100 rounded-lg">
          <h4 className="font-semibold mb-2">Status Message</h4>
          <p className="text-gray-700">{message}</p>
        </div>
      )}

      {/* Migration Details */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold mb-3">What the Migration Does</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <h5 className="font-medium text-gray-800 mb-2">
              Adds Rental Fields:
            </h5>
            <ul className="space-y-1">
              <li>• pricePerHour and pricePerDay</li>
              <li>• totalQuantity and availableQuantity</li>
              <li>• sizes and colors arrays</li>
              <li>• rentalType (hourly/daily)</li>
              <li>• category mapping (Men/Women/Kids)</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-gray-800 mb-2">
              Calculates Pricing:
            </h5>
            <ul className="space-y-1">
              <li>• Daily rate: 15% of original price</li>
              <li>• Hourly rate: 1/20th of daily rate</li>
              <li>• Category-based multipliers</li>
              <li>• Minimum pricing thresholds</li>
              <li>• Preserves original price data</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseMigration;
