import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { store } from "./store/store.js";
import { Provider } from "react-redux";
import { AuthProvider } from "./context/AuthContext.jsx";
import { AdminProvider } from "./context/AdminContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AuthRoute from "./components/AuthRoute.jsx";
import AdminApp from "./components/AdminApp.jsx";
import "./index.css";
import App from "./App.jsx";
import Home from "./pages/Home.jsx";
import Cart from "./pages/Cart.jsx";
import About from "./pages/About.jsx";
import ProductDetails from "./pages/ProductDetails.jsx";
import ProductList from "./pages/ProductList.jsx";
import Collections from "./pages/Collections.jsx";
import CategoryRedirect from "./pages/CategoryRedirect.jsx";
import Checkout from "./pages/Checkout.jsx";
import Wishlist from "./pages/Wishlist.jsx";
import MyRentals from "./pages/MyRentalsNew.jsx";

import Login from "./pages/Login.jsx";
import SignUp from "./pages/SignUp.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <ProtectedRoute adminOnly={false}>
        <App />
      </ProtectedRoute>
    ),
    children: [
      { path: "/", element: <Home /> },
      { path: "/cart", element: <Cart /> },
      { path: "/checkout", element: <Checkout /> },
      { path: "/wishlist", element: <Wishlist /> },
      { path: "/myRentals", element: <MyRentals /> },
      { path: "/product/:id", element: <ProductDetails /> },
      { path: "/productList", element: <ProductList /> },
      { path: "/collections", element: <Collections /> },
      { path: "/men", element: <CategoryRedirect catOverride="men" /> },
      { path: "/women", element: <CategoryRedirect catOverride="women" /> },
      { path: "/kids", element: <CategoryRedirect catOverride="kids" /> },
      { path: "/about", element: <About /> },
    ],
  },
  {
    path: "/admin",
    element: (
      <ProtectedRoute adminOnly={true}>
        <AdminApp />
      </ProtectedRoute>
    ),
  },
  {
    path: "/login",
    element: (
      <AuthRoute>
        <Login />
      </AuthRoute>
    ),
  },
  {
    path: "/signup",
    element: (
      <AuthRoute>
        <SignUp />
      </AuthRoute>
    ),
  },
]);

createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <AuthProvider>
      <AdminProvider>
        <RouterProvider router={router} />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#1f2937",
              color: "#fff",
              borderRadius: "10px",
              padding: "12px 20px",
            },
          }}
        />
      </AdminProvider>
    </AuthProvider>
  </Provider>
);
