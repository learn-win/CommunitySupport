import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./components/Auth/LoginPage";
import RegisterPage from "./components/Auth/RegisterPage";
import ForgotPasswordPage from "./components/Auth/ForgotPasswordPage";
import Dashboard from "./components/Dashboard/Dashboard";
import MessagesPage from "./components/Messages/MessagesPage";
import ProfilePage from "./components/Profile/ProfilePage";
import SearchPage from "./components/Search/SearchPage"; // Import SearchPage
import CreatePost from "./components/CreatePost/CreatePost"; // Import CreatePost
const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="create-post" element={<CreatePost />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/search" element={<SearchPage />} /> {/* Add this route */}
        <Route path="/" element={<LoginPage />} />
      </Routes>
    </Router>
  );
};

export default App;
