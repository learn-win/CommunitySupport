import React, { useState, useEffect } from "react";
import { auth, db } from "../../firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";

import ProfilePage from "../Profile/ProfilePage";
import MessagesPage from "../Messages/MessagesPage";
import SearchPage from "../Search/SearchPage";
import CreatePost from "../CreatePost/CreatePost";

import "bootstrap/dist/css/bootstrap.min.css";
import "./Dashboard.css";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [activePage, setActivePage] = useState("home");
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) return window.location.replace("/login");

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserName(data.name || user.email);
        setUserRole(data.role || "");
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "posts"));
        const fetchedPosts = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPosts(fetchedPosts);
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const renderMain = () => {
    switch (activePage) {
      case "profile":
        return <ProfilePage />;
      case "messages":
        return <MessagesPage />;
      case "search":
        return <SearchPage />;
      case "create":
        return <CreatePost />;
      default:
        return (
          <div className="dash-home container py-4">
            <h2 className="text-center mb-4">Welcome Back, {userName}!</h2>
            <h4 className="text-center mb-5">Recent Posts & Updates</h4>

            {loading ? (
              <div className="text-center my-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : posts.length > 0 ? (
              <div className="row g-4">
                {posts.map((post) => (
                  <div className="col-md-6 col-lg-4" key={post.id}>
                    <div
                      className="card h-100 border-0 shadow-sm"
                      role="button"
                      onClick={() => setSelectedPost(post)}>
                      {post.image && (
                        <img
                          src={post.image}
                          alt={post.title}
                          className="card-img-top"
                          style={{ height: "200px", objectFit: "cover" }}
                        />
                      )}
                      <div className="card-body">
                        <h5 className="card-title">{post.title}</h5>
                        <p className="card-text text-muted small">
                          {new Date(
                            post.timestamp?.seconds * 1000
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center">No posts yet.</p>
            )}

            {/* Modal */}
            {selectedPost && (
              <div
                className="modal show d-block"
                tabIndex="-1"
                style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
                onClick={() => setSelectedPost(null)}>
                <div
                  className="modal-dialog modal-lg modal-dialog-centered"
                  onClick={(e) => e.stopPropagation()}>
                  <div className="modal-content">
                    <div className="modal-header bg-primary text-white">
                      <h5 className="modal-title">{selectedPost.title}</h5>
                      <button
                        type="button"
                        className="btn-close btn-close-white"
                        onClick={() => setSelectedPost(null)}></button>
                    </div>
                    <div className="modal-body">
                      {selectedPost.image && (
                        <img
                          src={selectedPost.image}
                          alt={selectedPost.title}
                          className="img-fluid mb-3 rounded"
                        />
                      )}
                      <ul className="list-group list-group-flush mb-3">
                        <li className="list-group-item">
                          <strong>Name:</strong> {selectedPost.name}
                        </li>
                        <li className="list-group-item">
                          <strong>Email:</strong> {selectedPost.email}
                        </li>
                        <li className="list-group-item">
                          <strong>Description:</strong> {selectedPost.text}
                        </li>
                        {selectedPost.referenceLink && (
                          <li className="list-group-item">
                            <strong>Reference:</strong>{" "}
                            <a
                              href={selectedPost.referenceLink}
                              target="_blank"
                              rel="noopener noreferrer">
                              {selectedPost.referenceLink}
                            </a>
                          </li>
                        )}
                      </ul>
                      <p className="text-muted small">
                        Posted on:{" "}
                        {new Date(
                          selectedPost.timestamp?.seconds * 1000
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    const navigate = useNavigate();
    navigate("/login");
  };

  return (
    <div className="dashboard d-flex">
      <nav className="sidebar p-3">
        <div className="sidebar-brand mb-4 fw-bold fs-4">Community Support</div>
        <button
          className={`nav-btn ${activePage === "home" ? "active" : ""}`}
          onClick={() => setActivePage("home")}>
          Home
        </button>
        <button
          className={`nav-btn ${activePage === "profile" ? "active" : ""}`}
          onClick={() => setActivePage("profile")}>
          Profile
        </button>
        <button
          className={`nav-btn ${activePage === "messages" ? "active" : ""}`}
          onClick={() => setActivePage("messages")}>
          Messages
        </button>
        <button
          className={`nav-btn ${activePage === "search" ? "active" : ""}`}
          onClick={() => setActivePage("search")}>
          Search
        </button>
        {userRole === "creator" && (
          <button
            className={`nav-btn ${activePage === "create" ? "active" : ""}`}
            onClick={() => setActivePage("create")}>
            Create Post
          </button>
        )}
        <button className="nav-btn logout mt-auto" onClick={handleLogout}>
          Logout
        </button>
      </nav>

      <main className="main-content flex-grow-1 p-4">{renderMain()}</main>
    </div>
  );
};

export default Dashboard;
