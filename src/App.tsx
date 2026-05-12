import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import RequireAuth from "@/components/RequireAuth";
import AdminLayout from "@/components/AdminLayout";
import { ActionOverlay } from "@/components/ui";
import Login from "@/pages/Login";
import Overview from "@/pages/Overview";
import Listings from "@/pages/Listings";
import Viewings from "@/pages/Viewings";
import Agents from "@/pages/Agents";
import Vendors from "@/pages/Vendors";
import Users from "@/pages/Users";
import Waitlist from "@/pages/Waitlist";
import AppWaitlist from "@/pages/AppWaitlist";
import Messages from "@/pages/Messages";
import FeaturedAds from "@/pages/FeaturedAds";
import Disputes from "@/pages/Disputes";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ActionOverlay />
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
            <Route path="viewings" element={<Viewings />} />
            <Route path="agents" element={<Agents />} />
            <Route path="vendors" element={<Vendors />} />
            <Route path="users" element={<Users />} />
            <Route path="waitlist" element={<Waitlist />} />
            <Route path="app-waitlist" element={<AppWaitlist />} />
            <Route path="messages" element={<Messages />} />
            <Route path="featured-ads" element={<FeaturedAds />} />
            <Route path="disputes" element={<Disputes />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
