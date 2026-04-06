import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../firebase/config";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);

      const usersList = [];
      querySnapshot.forEach((doc) => {
        usersList.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      setUsers(usersList);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to safely format dates
  const formatDate = (dateField) => {
    if (!dateField) return "N/A";

    try {
      // If it's a Firestore Timestamp
      if (dateField && typeof dateField.toDate === "function") {
        return new Date(dateField.toDate()).toLocaleDateString();
      }
      // If it's already a Date object
      if (dateField instanceof Date) {
        return dateField.toLocaleDateString();
      }
      // If it's a string or number that can be converted to Date
      if (dateField) {
        const date = new Date(dateField);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString();
        }
      }
      return "N/A";
    } catch (error) {
      console.error("Error formatting date:", error);
      return "N/A";
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">
          User Management
        </h1>
        <p className="text-sm sm:text-base lg:text-lg text-gray-600">
          View and manage registered users
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 sm:py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-gray-900 border-t-transparent mx-auto"></div>
            <p className="mt-4 text-gray-600 font-medium text-sm sm:text-base">
              Loading users...
            </p>
          </div>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-gray-200 p-6 sm:p-12 text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <svg
              className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
              />
            </svg>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
            No Users Yet
          </h3>
          <p className="text-gray-600 text-sm sm:text-base">
            Users will appear here once they register on the platform
          </p>
        </div>
      ) : (
        <div className="bg-white shadow-lg rounded-2xl sm:rounded-3xl overflow-hidden border border-gray-200">
          {/* Mobile View */}
          <div className="block md:hidden">
            <div className="space-y-3 p-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {user.photoURL ? (
                        <img
                          className="h-10 w-10 rounded-full border-2 border-gray-200"
                          src={user.photoURL}
                          alt=""
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-600 flex items-center justify-center">
                          <span className="text-xs font-bold text-white">
                            {(user.displayName || user.email || "U")
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.displayName || "Anonymous User"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user.email}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {user.provider || "Email"}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(user.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-600">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Registration Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Provider
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          {user.photoURL ? (
                            <img
                              className="h-12 w-12 rounded-full border-2 border-gray-200"
                              src={user.photoURL}
                              alt=""
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-gray-600 flex items-center justify-center">
                              <span className="text-sm font-bold text-white">
                                {(
                                  user.firstName ||
                                  user.displayName ||
                                  user.email
                                )
                                  ?.charAt(0)
                                  ?.toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.displayName ||
                              `${user.firstName} ${user.lastName}` ||
                              "Unknown"}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {user.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${
                          user.provider === "google"
                            ? "bg-gray-200 text-gray-700"
                            : "bg-gray-600 text-white"
                        }`}
                      >
                        {user.provider || "email"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-gray-100 px-6 py-4">
            <div className="text-sm text-gray-700 font-medium">
              Total Users:{" "}
              <strong className="text-gray-900">{users.length}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
