import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, getDocs } from "firebase/firestore";
import "bootstrap/dist/css/bootstrap.min.css";
import "./SearchPage.css";

const SearchPage = () => {
  const [posts, setPosts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const postsCollection = collection(db, "posts");
        const querySnapshot = await getDocs(postsCollection);
        const fetchedPosts = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPosts(fetchedPosts);
        setFilteredPosts(fetchedPosts);
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const handleSearch = () => {
    const filtered = posts.filter((post) =>
      post.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPosts(filtered);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handlePostClick = (post) => {
    setSelectedPost(post);
  };

  const closeModal = () => {
    setSelectedPost(null);
  };

  // 🌟 Loading Spinner
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-3">Loading posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="search-page container py-5">
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="fw-bold">🔍 Search Posts</h2>
        <p className="text-muted">Find posts by their titles</p>
      </div>

      {/* Search Input */}
      <div className="row justify-content-center mb-5">
        <div className="col-md-8">
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Enter post title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button className="btn btn-primary" onClick={handleSearch}>
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Posts */}
      {filteredPosts.length > 0 ? (
        <div className="row g-4">
          {filteredPosts.map((post) => (
            <div className="col-md-6 col-lg-4" key={post.id}>
              <div
                className="card h-100 border-0 shadow-sm"
                role="button"
                onClick={() => handlePostClick(post)}>
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
                    {new Date(post.timestamp?.seconds * 1000).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-muted">
          <p>No posts match your search.</p>
        </div>
      )}

      {/* Post Modal */}
      {selectedPost && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">{selectedPost.title}</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={closeModal}></button>
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
                    <strong>Text:</strong> {selectedPost.text}
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
};

export default SearchPage;
