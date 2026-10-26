import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Home from "./pages/Home.jsx";
import Results from "./pages/Results.jsx";
import Trip from "./pages/Trip.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Bookings from "./pages/Bookings.jsx";
import NotFound from "./pages/NotFound.jsx";
import OperatorSignup from "./pages/operator/OperatorSignup.jsx";
import Account from "./pages/Account.jsx";
import OperatorShell from "./pages/operator/OperatorShell.jsx";
import OperatorHome from "./pages/operator/OperatorHome.jsx";
import OperatorBuses from "./pages/operator/OperatorBuses.jsx";
import OperatorTrips from "./pages/operator/OperatorTrips.jsx";
import OperatorBookings from "./pages/operator/OperatorBookings.jsx";
import OperatorEarnings from "./pages/operator/OperatorEarnings.jsx";
import OperatorDocuments from "./pages/operator/OperatorDocuments.jsx";
import AdminShell from "./pages/admin/AdminShell.jsx";
import AdminHome from "./pages/admin/AdminHome.jsx";
import AdminOperators from "./pages/admin/AdminOperators.jsx";
import AdminCities from "./pages/admin/AdminCities.jsx";
import AdminUsers from "./pages/admin/AdminUsers.jsx";
import AdminBookings from "./pages/admin/AdminBookings.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Results />} />
        <Route path="/trip/:id" element={<Trip />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/operator/signup" element={<OperatorSignup />} />
        <Route
          path="/bookings"
          element={
            <ProtectedRoute roles={["USER"]}>
              <Bookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <Account />
            </ProtectedRoute>
          }
        />
        <Route
          path="/operator"
          element={
            <ProtectedRoute roles={["OPERATOR"]}>
              <OperatorShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<OperatorHome />} />
          <Route path="buses" element={<OperatorBuses />} />
          <Route path="trips" element={<OperatorTrips />} />
          <Route path="bookings" element={<OperatorBookings />} />
          <Route path="earnings" element={<OperatorEarnings />} />
          <Route path="documents" element={<OperatorDocuments />} />
        </Route>
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <AdminShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminHome />} />
          <Route path="operators" element={<AdminOperators />} />
          <Route path="cities" element={<AdminCities />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="bookings" element={<AdminBookings />} />
        </Route>
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
