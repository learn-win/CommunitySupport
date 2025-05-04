import React, { useState, useEffect } from "react";
import {
  auth,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  db,
} from "../../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./ProfilePage.css"; // Import custom CSS here

const ProfilePage = () => {
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        setUserEmail(user.email || "");
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setUserName(userDocSnap.data().name || "User");
          } else {
            setError("User data not found in Firestore.");
          }
        } catch (err) {
          setError("Error fetching user data: " + err.message);
        }
        setLoading(false);
      } else {
        navigate("/login");
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleChangePassword = async () => {
    setError(null);
    setSuccessMessage("");
    if (!currentPassword || !newPassword) {
      setError("Please fill in both the current and new password fields.");
      return;
    }

    try {
      const user = auth.currentUser;
      if (user && user.email) {
        const credential = EmailAuthProvider.credential(
          user.email,
          currentPassword
        );
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);

        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, { password: newPassword });

        setSuccessMessage("Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
      } else {
        setError("No user is currently logged in.");
      }
    } catch (error) {
      setError(error.message || "Error updating password.");
      console.error("Error updating password:", error);
    }
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-3">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-gradient">
      <div className="card shadow-lg p-4 profile-card">
        <div className="card-body">
          <h2 className="card-title text-center mb-4">Profile</h2>

          <div className="mb-3">
            <label htmlFor="name" className="form-label">
              Name
            </label>
            <input
              type="text"
              id="name"
              value={userName}
              className="form-control input-custom"
              readOnly
            />
          </div>

          <div className="mb-4">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={userEmail}
              className="form-control input-custom"
              readOnly
            />
          </div>

          {/* <h4 className="mb-3">Change Password</h4> */}

          <div className="mb-3">
            <label htmlFor="currentPassword" className="form-label">
              Current Password
            </label>
            <input
              type="password"
              id="currentPassword"
              className="form-control input-custom"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
          </div>

          <div className="mb-3">
            <label htmlFor="newPassword" className="form-label">
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              className="form-control input-custom"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
            />
          </div>

          <button
            className="btn btn-primary w-100 btn-custom"
            onClick={handleChangePassword}>
            Update Password
          </button>

          {successMessage && (
            <div className="alert alert-success mt-3" role="alert">
              {successMessage}
            </div>
          )}
          {error && (
            <div className="alert alert-danger mt-3" role="alert">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
