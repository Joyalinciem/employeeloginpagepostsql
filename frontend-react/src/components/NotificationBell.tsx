import { useEffect, useRef, useState } from "react";

interface Notification {
  _id: string;
  message: string;
  read: boolean;
  createdAt: string;
  type: string;
}

interface Props {
  token: string;
  apiUrl: string;
}

export default function NotificationBell({ token, apiUrl }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unread = notifications.filter((n) => !n.read).length;

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${apiUrl}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (_) {}
  };

  const markRead = async (id: string) => {
    try {
      await fetch(`${apiUrl}/notifications/${id}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (_) {}
  };

  const markAllRead = async () => {
    try {
      await fetch(`${apiUrl}/notifications/read-all`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (_) {}
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Poll every 30s
  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, 30000);
    return () => clearInterval(id);
  }, [token]);

  // SVG Icons for notifications
  const IconBell = ({ size = 20, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );

  const IconBriefcase = ({ size = 20, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );

  const IconUser = ({ size = 20, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );

  const IconShield = ({ size = 20, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );

  const IconClipboard = ({ size = 20, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    </svg>
  );

  const IconCheck = ({ size = 20, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "manager-assigned":
        return <IconBriefcase size={18} color="#f59e0b" />;
      case "user-assigned-to-you":
        return <IconUser size={18} color="#10b981" />;
      case "cto-assigned":
        return <IconShield size={18} color="#8b5cf6" />;
      case "manager-assigned-to-you":
        return <IconClipboard size={18} color="#3b82f6" />;
      case "task-assigned":
        return <IconCheck size={18} color="#10b981" />;
      default:
        return <IconBell size={18} color="#00c6ff" />;
    }
  };

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      {/* Bell Button */}
      <button
        id="notification-bell-btn"
        onClick={() => { setOpen((p) => !p); if (!open) fetchNotifications(); }}
        style={{
          position: "relative",
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "50%",
          width: 44,
          height: 44,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: unread > 0 ? "#00c6ff" : "#cbd5e1",
          transition: "all 0.2s",
        }}
        title="Notifications"
      >
        <IconBell size={20} />
        {unread > 0 && (
          <span
            style={{
              position: "absolute",
              top: -2,
              right: -2,
              background: "linear-gradient(135deg,#ff512f,#dd2476)",
              color: "#fff",
              borderRadius: "50%",
              width: 18,
              height: 18,
              fontSize: 10,
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(255,81,47,0.6)",
              animation: "pulse 1.5s infinite",
            }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: 52,
            right: 0,
            width: 340,
            maxHeight: 440,
            background: "linear-gradient(145deg,#0d1117,#161b22)",
            border: "1px solid rgba(0,198,255,0.25)",
            borderRadius: 16,
            boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
            zIndex: 9999,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "14px 18px",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontWeight: 700, color: "#f8fafc", fontSize: 14 }}>
              Notifications {unread > 0 && <span style={{ color: "#00c6ff" }}>({unread} new)</span>}
            </span>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  background: "none",
                  border: "none",
                  color: "#00c6ff",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: 32,
                  textAlign: "center",
                  color: "rgba(255,255,255,0.4)",
                  fontSize: 13,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <IconCheck size={28} color="#10b981" />
                <span>You're all caught up!</span>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => !n.read && markRead(n._id)}
                  style={{
                    padding: "12px 18px",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                    cursor: n.read ? "default" : "pointer",
                    background: n.read
                      ? "transparent"
                      : "rgba(0,198,255,0.05)",
                    transition: "background 0.2s",
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                  }}
                >
                  <div style={{ flexShrink: 0, marginTop: 2 }}>
                    {getTypeIcon(n.type)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12,
                        color: n.read ? "#9ca3af" : "#f3f4f6",
                        fontWeight: n.read ? 400 : 600,
                        lineHeight: 1.4,
                      }}
                    >
                      {n.message}
                    </p>
                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: 10,
                        color: "#6b7280",
                      }}
                    >
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {!n.read && (
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "#00c6ff",
                        flexShrink: 0,
                        marginTop: 6,
                        boxShadow: "0 0 6px #00c6ff",
                      }}
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}
