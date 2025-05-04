import React, { useState, useEffect, useCallback } from "react";
import { auth, db } from "../../firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  addDoc,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import "./MessagesPage.css";

const MessagesPage = () => {
  const { currentUser } = useAuth();
  const [chats, setChats] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [unsubscribeMessages, setUnsubscribeMessages] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);

  // Fetch current user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!currentUser) {
        setError("User not authenticated.");
        setLoading(false);
        return;
      }
      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          setUserProfile({
            uid: currentUser.uid,
            displayName:
              userDocSnap.data().displayName || currentUser.email || "User",
          });
        } else {
          setError("Current user profile not found.");
        }
      } catch (err) {
        setError(`Error fetching user profile: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    if (currentUser) {
      setLoading(true);
      fetchUserProfile();
    }
  }, [currentUser]);

  // Fetch users (excluding current user)
  useEffect(() => {
    const fetchUsers = async () => {
      if (!currentUser) return;

      try {
        const usersCollection = collection(db, "users");
        const usersSnapshot = await getDocs(usersCollection);
        const fetchedUsers = [];
        usersSnapshot.forEach((doc) => {
          if (doc.id !== currentUser.uid) {
            fetchedUsers.push({
              uid: doc.id,
              displayName: doc.data().displayName || doc.data().email || "User",
            });
          }
        });
        setUsers(fetchedUsers);
      } catch (err) {
        setError(`Error fetching users: ${err.message}`);
      }
    };

    fetchUsers();
  }, [currentUser]);

  const fetchMessages = useCallback(async (chatId) => {
    try {
      const messagesCollection = collection(db, "chats", chatId, "messages");
      const messagesQuery = query(
        messagesCollection,
        orderBy("timestamp", "asc")
      );
      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const fetchedMessages = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            senderId: data.senderId,
            text: data.text,
            timestamp: data.timestamp?.toDate() || new Date(),
          };
        });
        setMessages(fetchedMessages);
      });
      setUnsubscribeMessages(() => unsubscribe);
    } catch (err) {
      setError(`Error fetching messages: ${err.message}`);
    }
  }, []);

  const updateLastReadTimestamp = async (chatId) => {
    if (!currentUser) return;
    try {
      const chatDocRef = doc(db, "chats", chatId);
      await setDoc(
        chatDocRef,
        {
          lastReadTimestamps: {
            [currentUser.uid]: serverTimestamp(),
          },
        },
        { merge: true }
      );
    } catch (err) {
      console.error("Error updating last read timestamp:", err);
    }
  };

  const fetchOrCreateChat = useCallback(
    async (otherUserId) => {
      if (!currentUser) return;
      setChatLoading(true);
      setSelectedUserId(otherUserId);

      if (unsubscribeMessages) {
        unsubscribeMessages();
        setUnsubscribeMessages(null);
      }

      const chatParticipants = [currentUser.uid, otherUserId].sort();
      const chatId = chatParticipants.join("-");

      try {
        const chatDocRef = doc(db, "chats", chatId);
        const chatDocSnap = await getDoc(chatDocRef);

        if (chatDocSnap.exists()) {
          fetchMessages(chatId);
          updateLastReadTimestamp(chatId);
        } else {
          await setDoc(chatDocRef, {
            participants: chatParticipants,
            createdAt: serverTimestamp(),
            lastMessage: null,
          });
          fetchMessages(chatId);
        }
      } catch (err) {
        setError(`Error fetching or creating chat: ${err.message}`);
      } finally {
        setChatLoading(false);
      }
    },
    [currentUser, unsubscribeMessages]
  );

  const handleSendMessage = async () => {
    if (!currentUser || !selectedUserId || !newMessageText.trim()) return;

    const chatParticipants = [currentUser.uid, selectedUserId].sort();
    const chatId = chatParticipants.join("-");

    try {
      const messagesCollection = collection(db, "chats", chatId, "messages");
      const newMessage = {
        senderId: currentUser.uid,
        text: newMessageText,
        timestamp: serverTimestamp(),
      };

      await addDoc(messagesCollection, newMessage);

      const chatDocRef = doc(db, "chats", chatId);
      await setDoc(
        chatDocRef,
        {
          lastMessage: {
            senderId: currentUser.uid,
            text: newMessageText,
            timestamp: serverTimestamp(),
          },
        },
        { merge: true }
      );

      setNewMessageText("");
    } catch (err) {
      setError(`Error sending message: ${err.message}`);
    }
  };

  const fetchChatsWithUnreadCount = async () => {
    if (!currentUser) {
      setError("User not authenticated.");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const chatsCollection = collection(db, "chats");
      const q = query(
        chatsCollection,
        where("participants", "array-contains", currentUser.uid),
        orderBy("lastMessage.timestamp", "desc")
      );

      const unsubscribe = onSnapshot(q, async (snapshot) => {
        const fetchedChats = [];
        for (const doc of snapshot.docs) {
          const data = doc.data();
          const chatId = doc.id;

          const messagesCollection = collection(
            db,
            "chats",
            chatId,
            "messages"
          );
          const unreadQuery = query(
            messagesCollection,
            where(
              "timestamp",
              ">",
              data.lastReadTimestamps?.[currentUser.uid] || 0
            )
          );
          const unreadSnapshot = await getDocs(unreadQuery);

          fetchedChats.push({
            id: chatId,
            participants: data.participants,
            lastMessage: data.lastMessage
              ? {
                  id: "",
                  senderId: data.lastMessage.senderId,
                  text: data.lastMessage.text,
                  timestamp: data.lastMessage.timestamp?.toDate() || new Date(),
                }
              : undefined,
            unreadCount: unreadSnapshot.size,
          });
        }
        setChats(fetchedChats);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      setError(`Error fetching chats: ${err.message}`);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChatsWithUnreadCount();
  }, [currentUser]);

  const getOtherUserDisplayName = (chat) => {
    const otherUserId = chat.participants.find(
      (uid) => uid !== currentUser.uid
    );
    const otherUser = users.find((u) => u.uid === otherUserId);
    return otherUser ? otherUser.displayName : "Unknown User";
  };

  // 🌟 Show loading spinner
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-3">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center mt-5 text-danger">
        <p>Error: {error}</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="text-center mt-5">
        <p>Please log in to view messages.</p>
      </div>
    );
  }

  return (
    <div className="container-fluid vh-100 d-flex overflow-hidden">
      <div className="col-5  p-3 border-end overflow-auto">
        <h4 className="mb-3">💬 Chats</h4>
        {chats.length > 0 ? (
          <ul className="list-group mb-4">
            {chats.map((chat) => (
              <li
                key={chat.id}
                className="list-group-item list-group-item-action d-flex justify-content-between align-items-start"
                onClick={() =>
                  fetchOrCreateChat(
                    chat.participants.find((uid) => uid !== currentUser.uid)
                  )
                }
                style={{ cursor: "pointer" }}>
                <div className="ms-2 me-auto">
                  <div className="fw-bold">{getOtherUserDisplayName(chat)}</div>
                  <small>
                    {chat.lastMessage?.senderId === currentUser.uid
                      ? "You: "
                      : ""}
                    {chat.lastMessage?.text}
                  </small>
                </div>
                {chat.unreadCount > 0 && (
                  <span className="badge bg-danger rounded-pill">
                    {chat.unreadCount}
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>No chats yet.</p>
        )}

        <h5>👥 Users</h5>
        <ul className="list-group">
          {users.map((user) => (
            <li
              key={user.uid}
              className="list-group-item list-group-item-action"
              onClick={() => fetchOrCreateChat(user.uid)}
              style={{ cursor: "pointer" }}>
              {user.displayName}
            </li>
          ))}
        </ul>
      </div>

      <div className="col-7 d-flex flex-column p-3 overflow-hidden">
        {selectedUserId ? (
          <>
            {chatLoading ? (
              <div className="d-flex justify-content-center align-items-center flex-grow-1">
                <div
                  className="spinner-border text-secondary"
                  role="status"></div>
              </div>
            ) : (
              <>
                <div className="flex-grow-1 overflow-auto mb-3 border p-3 rounded bg-white">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`mb-3 p-2 rounded ${
                        message.senderId === currentUser.uid
                          ? "bg-primary text-white align-self-end"
                          : "bg-light text-dark"
                      }`}
                      style={{ maxWidth: "75%" }}>
                      <div className="fw-semibold">
                        {message.senderId === currentUser.uid
                          ? "You"
                          : userProfile?.displayName || "Other User"}
                      </div>
                      <div>{message.text}</div>
                      <small className="d-block text-end">
                        {message.timestamp.toLocaleTimeString()}
                      </small>
                    </div>
                  ))}
                </div>
                <div className="input-group">
                  <textarea
                    className="form-control"
                    rows="1"
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    placeholder="Type a message..."
                  />
                  <button
                    className="btn btn-primary"
                    onClick={handleSendMessage}>
                    Send
                  </button>
                </div>
              </>
            )}
          </>
        ) : (
          <div className="text-center mt-5">
            <p>Select a chat or user to start messaging.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
