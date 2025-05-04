import React, { useState } from "react";
import { auth, db } from "../../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import "bootstrap/dist/css/bootstrap.min.css";
import "./CreatePost.css";

const CreatePost = () => {
  const [title, setTitle] = useState("");
  const [image, setImage] = useState(null);
  const [text, setText] = useState("");
  const [referenceLink, setReferenceLink] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size <= 1024 * 1024) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
      setError("");
    } else {
      setError("Image size should be less than or equal to 1 MB.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !text || !referenceLink || !image) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        setError("User not authenticated.");
        setLoading(false);
        return;
      }

      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      let userName = "Anonymous";
      if (userDocSnap.exists()) {
        userName = userDocSnap.data().name || "Anonymous";
      }

      const postRef = doc(db, "posts", Date.now().toString());
      await setDoc(postRef, {
        title,
        text,
        referenceLink,
        image,
        email: user.email,
        name: userName,
        timestamp: new Date(),
      });

      // Reset form
      setTitle("");
      setText("");
      setReferenceLink("");
      setImage(null);
      setError("");
      alert("✅ Post created successfully!");
    } catch (error) {
      console.error("Error creating post:", error);
      setError("❌ Error creating post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-post-container container py-5">
      <h1 className="create-post-title text-center mb-4">
        📝 Create a New Post
      </h1>
      <form
        onSubmit={handleSubmit}
        className="create-post-form mx-auto"
        style={{ maxWidth: "600px" }}>
        <div className="mb-3">
          <label className="form-label">Title:</label>
          <input
            type="text"
            className="form-control"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Image (Max 1MB):</label>
          <input
            type="file"
            accept="image/*"
            className="form-control"
            onChange={handleImageChange}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Text:</label>
          <textarea
            className="form-control"
            rows="4"
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Reference Link:</label>
          <input
            type="url"
            className="form-control"
            value={referenceLink}
            onChange={(e) => setReferenceLink(e.target.value)}
            required
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="btn btn-primary w-100"
          disabled={loading}>
          {loading ? (
            <>
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"></span>
              Submitting...
            </>
          ) : (
            "Submit Post"
          )}
        </button>
      </form>
    </div>
  );
};

export default CreatePost;
