import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import RequireAuth from "@/components/RequireAuth";
import AdminLayout from "@/components/AdminLayout";
import Login from "@/pages/Login";
import Overview from "@/pages/Overview";
import Listings from "@/pages/Listings";
import Agents from "@/pages/Agents";
import Vendors from "@/pages/Vendors";
import Users from "@/pages/Users";
import Waitlist from "@/pages/Waitlist";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <AdminLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Overview />} />
            <Route path="listings" element={<Listings />} />
            <Route path="agents" element={<Agents />} />
            <Route path="vendors" element={<Vendors />} />
            <Route path="users" element={<Users />} />
            <Route path="waitlist" element={<Waitlist />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
