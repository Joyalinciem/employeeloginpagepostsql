import { useEffect, useState } from "react";
import NotificationBell from "./components/NotificationBell";

// ─── SVG Icons ──────────────────────────────────────────────────────────────
function IconClipboard({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    </svg>
  );
}

function IconClock({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconCheck({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconMail({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <path d="M22 7c0-1.1-.9-2-2-2H4a2 2 0 0 0-2 2v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7z" />
      <polyline points="22 7 12 13 2 7" />
    </svg>
  );
}

function IconAlert({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function IconBell({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function IconUsers({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconHome({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function IconShield({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function IconBriefcase({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

function IconMessageCircle({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <path d="M8 9h8M8 13h5" />
    </svg>
  );
}

function IconSettings({ size = 20, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", ...style }}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function IconPlus({ size = 20, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", ...style }}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconArrowLeft({ size = 16, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", ...style }}>
      <polyline points="15 18 9 12 15 6" />
      <line x1="9" y1="12" x2="21" y2="12" />
    </svg>
  );
}

function IconSave({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

function IconEdit({ size = 16, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", ...style }}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function IconTrash({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

function IconCalendar({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconUser({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconPieChart({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <path d="M11 2.05A9 9 0 1 0 21.95 13H13V2.05z" />
      <path d="M13 13h8.95A8.99 8.99 0 0 0 13 4.05V13z" />
    </svg>
  );
}

function IconBarChart({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <line x1="4" y1="19" x2="4" y2="10" />
      <line x1="10" y1="19" x2="10" y2="4" />
      <line x1="16" y1="19" x2="16" y2="14" />
      <line x1="22" y1="19" x2="22" y2="7" />
    </svg>
  );
}

// ─── SVG Pie Chart ──────────────────────────────────────────────────────────
function PieChart({ pending, completed }: { pending: number; completed: number }) {
  const total = pending + completed;
  if (total === 0) return <div style={{ color: "#aaa", textAlign: "center", padding: 20 }}>No task data</div>;
  const pct = pending / total;
  const angle = pct * 2 * Math.PI;
  const r = 60, cx = 80, cy = 80;
  const x1 = cx + r * Math.sin(0);
  const y1 = cy - r * Math.cos(0);
  const x2 = cx + r * Math.sin(angle);
  const y2 = cy - r * Math.cos(angle);
  const large = angle > Math.PI ? 1 : 0;
  const pendingPath = total === pending
    ? `M${cx},${cy} m-${r},0 a${r},${r} 0 1,0 ${r * 2},0 a${r},${r} 0 1,0 -${r * 2},0`
    : `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z`;
  const completedPath = total === completed
    ? `M${cx},${cy} m-${r},0 a${r},${r} 0 1,0 ${r * 2},0 a${r},${r} 0 1,0 -${r * 2},0`
    : `M${cx},${cy} L${x2},${y2} A${r},${r} 0 ${1 - large},1 ${x1},${y1} Z`;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <svg width={160} height={160} viewBox="0 0 160 160">
        {pending > 0 && <path d={pendingPath} fill="#f59e0b" />}
        {completed > 0 && <path d={completedPath} fill="#10b981" />}
        <circle cx={cx} cy={cy} r={32} fill="#1e2a3a" />
        <text x={cx} y={cy - 6} textAnchor="middle" fill="#fff" fontSize={11}>Tasks</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="#fff" fontSize={10}>{total}</text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#f59e0b" }} />
          <span style={{ fontSize: 13, color: "#ccc" }}>Pending ({pending})</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#10b981" }} />
          <span style={{ fontSize: 13, color: "#ccc" }}>Completed ({completed})</span>
        </div>
      </div>
    </div>
  );
}

// ─── SVG Bar Chart ───────────────────────────────────────────────────────────
function BarChart({ pending, completed }: { pending: number; completed: number }) {
  const max = Math.max(pending, completed, 1);
  const barH = 120;
  return (
    <svg width={160} height={barH + 40} style={{ overflow: "visible" }}>
      {/* Pending bar */}
      <rect
        x={20} y={barH - (pending / max) * barH}
        width={40} height={(pending / max) * barH}
        fill="#f59e0b" rx={4}
      />
      <text x={40} y={barH + 16} textAnchor="middle" fill="#ccc" fontSize={11}>Pending</text>
      <text x={40} y={barH - (pending / max) * barH - 6} textAnchor="middle" fill="#f59e0b" fontSize={12} fontWeight="bold">{pending}</text>
      {/* Completed bar */}
      <rect
        x={90} y={barH - (completed / max) * barH}
        width={40} height={(completed / max) * barH}
        fill="#10b981" rx={4}
      />
      <text x={110} y={barH + 16} textAnchor="middle" fill="#ccc" fontSize={11}>Done</text>
      <text x={110} y={barH - (completed / max) * barH - 6} textAnchor="middle" fill="#10b981" fontSize={12} fontWeight="bold">{completed}</text>
    </svg>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
  return (
    <div style={{
      background: "rgba(17, 24, 39, 0.45)",
      border: `1px solid ${color}33`,
      borderRadius: 16,
      padding: "20px 24px",
      display: "flex",
      alignItems: "center",
      gap: 16,
      flex: 1,
      minWidth: "200px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 48,
        height: 48,
        borderRadius: 12,
        background: `${color}15`,
        color: color,
        flexShrink: 0
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 700, color: "#fff", lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>{label}</div>
      </div>
    </div>
  );
}

function App() {
  const API_URL = `http://${window.location.hostname}:5000/api`;

  // ── AUTH STATES ──────────────────────────────────────────────────────────
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showOtpBlock, setShowOtpBlock] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [isCto, setIsCto] = useState(false);

  type PageType = "tasks" | "admin" | "manager" | "cto" | "settings" | "add-task" | "profile" | "chat";
  const [currentPage, setCurrentPage] = useState<PageType>("tasks");
  const [adminTab, setAdminTab] = useState<"users" | "tasks" | "pending" | "roles" | "chat">("users");
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminTasks, setAdminTasks] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [newUserData, setNewUserData] = useState({ name: "", email: "", password: "", role: "user", designation: "", department: "", profilePicture: "" });
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [roleCreateName, setRoleCreateName] = useState("");
  const [selectedRoleForRoleSettings, setSelectedRoleForRoleSettings] = useState("user");
  const [rolePermissionUpdates, setRolePermissionUpdates] = useState({ canUpdateTasks: false, canDeleteTasks: false, canUpdateUsers: false, canDeleteUsers: false });

  // ── DASHBOARD STATS ──────────────────────────────────────────────────────
  const [stats, setStats] = useState({ totalTasks: 0, pendingTasks: 0, completedTasks: 0, approvedRequests: 0, nonApprovedRequests: 0 });

  // ── PROFILE EDIT ─────────────────────────────────────────────────────────
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileDesignation, setProfileDesignation] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [profilePicturePreview, setProfilePicturePreview] = useState("");
  const [profileDepartment, setProfileDepartment] = useState("");

  // ── CHAT STATES ─────────────────────────────────────────────────────────
  const [chatWs, setChatWs] = useState<WebSocket | null>(null);
  const [chatTargets, setChatTargets] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_chatDepartments, setChatDepartments] = useState<string[]>([]);
  const [chatConfig, setChatConfig] = useState<any>(null);
  const [chatMode, setChatMode] = useState<"private" | "department" | "bot">("private");
  const [selectedChatUser, setSelectedChatUser] = useState<any | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_chatTargetSort, _setChatTargetSort] = useState<"department" | "name">("department");
  const [chatConnected, setChatConnected] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [recipientName, _setRecipientName] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [chatConversations, setChatConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any | null>(null);
  const [loadingChatHistory, setLoadingChatHistory] = useState(false);
  const [groupCreationModalOpen, setGroupCreationModalOpen] = useState(false);
  const [directMessageModalOpen, setDirectMessageModalOpen] = useState(false);
  const [groupCreationName, setGroupCreationName] = useState("");
  const [groupCreationMode, setGroupCreationMode] = useState<"direct" | "group">("direct");
  const [groupCreationDepartment, setGroupCreationDepartment] = useState("");
  const [groupCreationMembers, setGroupCreationMembers] = useState<string[]>([]);
  const [autoAddedMembers, setAutoAddedMembers] = useState<string[]>([]);
  const [selectedDirectUser, setSelectedDirectUser] = useState<any | null>(null);

  // ── PAGINATION ───────────────────────────────────────────────────────────
  const TASKS_PER_PAGE = 6;
  const [userTasksPage, setUserTasksPage] = useState(1);
  const [adminTasksPage, setAdminTasksPage] = useState(1);

  // ── MFA LOGIN STATES ─────────────────────────────────────────────────────
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaMethod, setMfaMethod] = useState<"email" | "totp" | "">("");
  const [mfaEmail, setMfaEmail] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaError, setMfaError] = useState("");

  // ── MFA SETUP STATES ─────────────────────────────────────────────────────
  const [mfaSetupMethod, setMfaSetupMethod] = useState<"email" | "totp" | "">("");
  const [mfaSetupCode, setMfaSetupCode] = useState("");
  const [mfaSetupSecret, setMfaSetupSecret] = useState("");
  const [mfaSetupQrCodeUrl, setMfaSetupQrCodeUrl] = useState("");
  const [mfaSetupMessage, setMfaSetupMessage] = useState("");
  const [mfaSetupStep, setMfaSetupStep] = useState<"none" | "setup" | "verify">("none");

  // ── TOAST & MODAL ────────────────────────────────────────────────────────
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">("info");
  const [publicRoles, setPublicRoles] = useState<any[]>([]);
  const [assignmentLogs, setAssignmentLogs] = useState<any[]>([]);
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsLimit] = useState(10);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalOnConfirm, setModalOnConfirm] = useState<(() => void) | null>(null);
  const [modalOnCancel, setModalOnCancel] = useState<(() => void) | null>(null);

  // ── EDIT TASK STATE ───────────────────────────────────────────────────────
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // ── LOGIN / REGISTER ──────────────────────────────────────────────────────
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({ name: "", email: "", password: "", role: "user", profilePicture: "" });
  const [registerMessage, setRegisterMessage] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [loginMessage, setLoginMessage] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpMessage, setOtpMessage] = useState("");
  const [verifyMessage, setVerifyMessage] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetMessage, setResetMessage] = useState("");

  // ── TASKS ─────────────────────────────────────────────────────────────────
  const [tasks, setTasks] = useState<any[]>([]);
  const [taskData, setTaskData] = useState({ title: "", description: "", dueDate: "", priority: "low", status: "open", thumbnail: "", userId: "" });

  // ─────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────────────────
  const showToast = (msg: string, type: "success" | "error" | "info" = "info") => {
    setToastMessage(msg);
    setToastType(type);
  };

  const fetchAdminChatConfig = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/admin/chat-config`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return;
      const data = await response.json();
      setChatConfig(data.chatConfig || null);
    } catch (err) {
      console.error("Failed to fetch admin chat config", err);
    }
  };

  const updateAdminChatConfig = async (updates: any) => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/admin/chat-config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(updates),
      });
      const data = await response.json();
      if (!response.ok) {
        showToast(data.message || "Failed to update chat settings", "error");
        return;
      }
      setChatConfig(data.chatConfig || null);
      showToast("Chat settings updated", "success");
    } catch (err) {
      console.error("Failed to update admin chat config", err);
      showToast("Failed to update chat settings", "error");
    }
  };

  const ensureChatConnection = async () => {
    if (chatWs && chatWs.readyState === WebSocket.OPEN) return chatWs;
    if (!token) return null;

    const wsUrl = `ws://${window.location.hostname}:5000/chat?token=${token}`;
    const ws = new WebSocket(wsUrl);
    ws.addEventListener("open", () => {
      console.log("Chat connected");
      setChatConnected(true);
      showToast("Connected to chat", "success");
    });
    ws.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Only add message if it matches current selected conversation or no conversation selected
        if (selectedConversation) {
          let shouldAdd = false;
          if (selectedConversation.type === 'private' && data.type === 'private') {
            const isRelevant = (data.from?.id === selectedConversation.userId) || (data.to === selectedConversation.userId);
            shouldAdd = isRelevant;
          } else if (selectedConversation.type === 'group' && data.type === 'group') {
            shouldAdd = data.groupId === selectedConversation.groupId;
          }
          if (shouldAdd) {
            setChatMessages((prev) => [...prev, data]);
          }
        } else {
          setChatMessages((prev) => [...prev, data]);
        }
        
        // Show toast notifications
        if (data.type === "private" && !data.self && data.from?.name) {
          showToast(`New message from ${data.from.name}`, "info");
        }
        if (data.type === "group" && data.from?.name) {
          showToast(`${data.from.name}: ${(data.message || '').substring(0, 30)}...`, "info");
        }
        if (data.type === "department" && data.department) {
          showToast(`New department message in ${data.department}`, "info");
        }
        if (data.type === "bot") {
          showToast(`Bot reply received`, "info");
        }
        // Refresh sidebar conversation list so last-message previews stay current
        fetchChatConversations();
      } catch (err) {
        console.error("Invalid chat event", err);
      }
    });
    ws.addEventListener("close", () => {
      console.log("Chat disconnected");
      setChatWs(null);
      setChatConnected(false);
    });
    ws.addEventListener("error", (err) => {
      console.error("Chat WebSocket error", err);
      showToast("Chat connection error", "error");
    });
    setChatWs(ws);
    return ws;
  };

  const fetchChatTargets = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/chat/targets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return;
      const data = await response.json();
      const targets = Array.isArray(data.targets)
        ? [...data.targets].sort((a, b) => (a.department || "").localeCompare(b.department || "") || (a.name || "").localeCompare(b.name || ""))
        : [];
      setChatTargets(targets);
      setChatConfig(data.chatConfig || null);
      if (!selectedChatUser && targets.length > 0) {
        setSelectedChatUser(targets[0]);
      }
    } catch (err) {
      console.error("Failed to fetch chat targets", err);
    }
  };

  const fetchChatDepartments = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/chat/departments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return;
      const data = await response.json();
      setChatDepartments(data.departments || []);
      setChatConfig(data.chatConfig || null);
      if (!selectedDepartment && data.departments && data.departments.length > 0) {
        setSelectedDepartment(data.departments[0]);
      }
    } catch (err) {
      console.error("Failed to fetch chat departments", err);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim()) {
      showToast("Type a message before sending", "error");
      return;
    }
    
    // If using the WhatsApp-like UI with selected conversation
    if (selectedConversation) {
      const ws = await ensureChatConnection();
      if (!ws) return showToast("Unable to connect to chat server", "error");
      
      const payload: any = { message: chatInput.trim() };
      if (selectedConversation.type === 'private') {
        payload.type = 'private';
        payload.to = selectedConversation.userId;
      } else if (selectedConversation.type === 'group') {
        payload.type = 'group';
        payload.groupId = selectedConversation.groupId;
      }
      
      ws.send(JSON.stringify(payload));
      setChatInput("");
      return;
    }
    
    // Legacy mode selection (for backward compatibility)
    const ws = await ensureChatConnection();
    if (!ws) return showToast("Unable to connect to chat server", "error");

    const payload: any = { type: chatMode, message: chatInput.trim() };
    if (chatMode === "private") {
      // allow sending by typed name (partial match) or selected user
      let target = selectedChatUser;
      if (recipientName && recipientName.trim()) {
        const match = chatTargets.find(u => (u.name || '').toLowerCase().includes(recipientName.trim().toLowerCase()));
        if (match) target = match;
      }
      if (!target) return showToast("Select a user first or enter a recipient name", "error");
      payload.to = target._id || target.id;
    }
    if (chatMode === "department") {
      payload.department = selectedDepartment;
    }
    ws.send(JSON.stringify(payload));
    setChatInput("");
  };

  const fetchChatConversations = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return;
      const data = await response.json();
      setChatConversations(data.conversations || []);
      if (!selectedConversation && data.conversations?.length > 0) {
        setSelectedConversation(data.conversations[0]);
      }
    } catch (err) {
      console.error("Failed to fetch conversations", err);
    }
  };

  const fetchChatHistory = async (conversationType: 'private' | 'group' | 'department', targetId: string) => {
    if (!token) return;
    setLoadingChatHistory(true);
    try {
      let url = `${API_URL}/chat/history?type=${conversationType}&limit=50`;
      if (conversationType === 'private') {
        url += `&withId=${targetId}`;
      } else if (conversationType === 'group') {
        url += `&groupId=${targetId}`;
      } else if (conversationType === 'department') {
        url += `&department=${targetId}`;
      }
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return;
      const data = await response.json();
      setChatMessages(data.history || []);
    } catch (err) {
      console.error("Failed to fetch chat history", err);
    } finally {
      setLoadingChatHistory(false);
    }
  };

  const openConversation = async (conversation: any) => {
    setSelectedConversation(conversation);
    if (conversation.type === 'group') {
      setChatMode('group' as any);
      await fetchChatHistory('group', conversation.groupId);
    } else if (conversation.type === 'private') {
      setChatMode('private');
      await fetchChatHistory('private', conversation.userId);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupCreationName.trim()) {
      showToast("Please enter a group name", "error");
      return;
    }
    
    const finalMemberIds = Array.from(new Set(groupCreationMembers)).filter(
      id => id !== (currentUser?.id || currentUser?._id)
    );

    if (finalMemberIds.length === 0) {
      showToast("Please select at least one member to add to the group", "error");
      return;
    }

    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/chat/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: groupCreationName.trim(),
          memberIds: finalMemberIds,
          description: groupCreationDepartment ? `Department: ${groupCreationDepartment}` : '',
          isDepartmentGroup: !!groupCreationDepartment,
          department: groupCreationDepartment || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        showToast(data.message || 'Failed to create group', 'error');
        return;
      }
      showToast('Group created successfully', 'success');
      setGroupCreationName('');
      setGroupCreationDepartment('');
      setGroupCreationMembers([]);
      setAutoAddedMembers([]);
      setGroupCreationMode('direct');
      setGroupCreationModalOpen(false);
      await fetchChatConversations();
    } catch (err) {
      console.error("Failed to create group", err);
      showToast('Failed to create group', 'error');
    }
  };

  // ── DIRECT MESSAGE HELPERS ───────────────────────────────────────────────
  const getEligibleDirectMessageUsers = () => {
    if (!currentUser) return [];
    
    return chatTargets.filter(u => {
      const uId = u._id || u.id;
      const currentUserId = currentUser.id || currentUser._id;
      if (uId === currentUserId) return false;
      
      const roleA = currentUser.role;
      const roleB = u.role;
      
      // Admin to all users (including managers, cto, cfo, etc.)
      if (roleA === 'admin' || roleB === 'admin') return true;
      
      // Users to users
      if (roleA === 'user' && roleB === 'user') return true;
      
      // Managers to users (symmetric)
      if ((roleA === 'manager' && roleB === 'user') || (roleA === 'user' && roleB === 'manager')) return true;
      
      // CTO to managers and users (symmetric)
      if ((roleA === 'cto' && (roleB === 'manager' || roleB === 'user')) || ((roleA === 'manager' || roleA === 'user') && roleB === 'cto')) return true;
      
      return false;
    });
  };

  // ── DEPARTMENT GROUP HELPERS ─────────────────────────────────────────────
  const toggleMemberSelection = (userId: string) => {
    setGroupCreationMembers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleDepartmentSelect = (dept: string) => {
    const oldDeptUsers = groupCreationDepartment 
      ? chatTargets.filter(u => u.department === groupCreationDepartment && (u._id || u.id) !== currentUser?.id).map(u => u._id || u.id)
      : [];
      
    setGroupCreationDepartment(dept);
    
    const newDeptUsers = dept 
      ? chatTargets.filter(u => u.department === dept && (u._id || u.id) !== currentUser?.id).map(u => u._id || u.id)
      : [];
      
    setGroupCreationMembers(prev => {
      const filtered = prev.filter(id => !oldDeptUsers.includes(id));
      return Array.from(new Set([...filtered, ...newDeptUsers]));
    });
  };

  const sendDirectMessage = async (recipientId: string, message: string) => {
    if (!token || !chatWs || chatWs.readyState !== WebSocket.OPEN) {
      showToast('Not connected to chat', 'error');
      return;
    }
    try {
      const payload = {
        type: 'private',
        to: recipientId,
        message,
      };
      chatWs.send(JSON.stringify(payload));
      setChatInput('');
    } catch (error) {
      console.error('Error sending message:', error);
      showToast('Failed to send message', 'error');
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    const confirm = await confirmDialog("Are you sure you want to delete this group? All message history will be permanently removed.");
    if (!confirm) return;
    
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/chat/groups/${groupId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) {
        showToast(data.message || "Failed to delete group", "error");
        return;
      }
      showToast("Group deleted successfully", "success");
      setSelectedConversation(null);
      await fetchChatConversations();
    } catch (err) {
      console.error("Failed to delete group", err);
      showToast("Failed to delete group", "error");
    }
  };

  const loadChatPage = async () => {
    await Promise.all([
      fetchChatTargets(),
      fetchChatDepartments(),
      fetchAdminChatConfig(),
      fetchChatConversations(),
    ]);
    await ensureChatConnection();
  };

  useEffect(() => {
    if (!toastMessage) return;
    const id = setTimeout(() => setToastMessage(""), 4000);
    return () => clearTimeout(id);
  }, [toastMessage]);

  const confirmDialog = (message: string): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setModalMessage(message);
      setModalVisible(true);
      setModalOnConfirm(() => () => { setModalVisible(false); resolve(true); });
      setModalOnCancel(() => () => { setModalVisible(false); resolve(false); });
    });
  };

  // ─────────────────────────────────────────────────────────────────────────
  // AUTH HANDLERS
  // ─────────────────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });
      const data = await response.json();
      if (response.ok) {
        if (data.requiresMFA) {
          setMfaRequired(true);
          setMfaMethod(data.mfaMethod || "email");
          setMfaEmail(data.mfaEmail || loginData.email);
          setLoginMessage("MFA required");
          setShowOtpBlock(true);
          if (data.mockOtp) {
            showToast(`Mock Email OTP: ${data.mockOtp}`, "info");
          }
          return;
        }
        if (!data.token) {
          showToast(data.message || "Login unsuccessful", "error");
          setLoginMessage("");
          return;
        }
        localStorage.setItem("token", data.token);
        setToken(data.token);
        setLoginMessage("Login Successful");
        showToast("Login Successful ✓", "success");
        fetchProfile(data.token);
      } else {
        showToast(data.message || "Login unsuccessful", "error");
        setLoginMessage("");
      }
    } catch (err) {
      console.error(err);
      showToast("Login unsuccessful", "error");
    }
  };

  const handleRegister = async () => {
    try {
      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerData),
      });
      const data = await response.json();
      if (response.ok) {
        setRegisterMessage(data.message || "Registration successful");
        setRegisterError("");
        setRegisterData({ name: "", email: "", password: "", role: "user", profilePicture: "" });
        if (data.token) {
          localStorage.setItem("token", data.token);
          setToken(data.token);
          fetchProfile(data.token);
        }
      } else {
        setRegisterError(data.message || "Registration failed");
      }
    } catch (err) {
      console.error(err);
      setRegisterError("Registration failed");
    }
  };

  const handleVerifyMfa = async () => {
    try {
      setMfaError("");
      const response = await fetch(`${API_URL}/verify-mfa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: mfaEmail || loginData.email, code: mfaCode }),
      });
      const data = await response.json();
      if (response.ok && data.token) {
        localStorage.setItem("token", data.token);
        setToken(data.token);
        setMfaRequired(false);
        setMfaCode("");
        setLoginMessage("Login Successful");
        fetchProfile(data.token);
      } else {
        setMfaError(data.message || "MFA verification failed");
      }
    } catch (err) {
      console.error(err);
      setMfaError("MFA verification failed");
    }
  };

  // ── FORGOT PASSWORD ───────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    try {
      const response = await fetch(`${API_URL}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await response.json();

      if (response.ok) {
        setOtpMessage(data.message || "OTP sent to your email. Valid for 15 minutes.");
        setShowOtpBlock(true);
        if (data.mockOtp) {
          showToast(`Mock Email OTP: ${data.mockOtp}`, "info");
        }
      } else {
        const errMsg = data.message || "Failed to send OTP.";
        showToast(errMsg, "error");
        setOtpMessage(errMsg);
      }
    } catch (err) {
      console.error("Error sending OTP:", err);
      const msg = "Network error while sending OTP.";
      showToast(msg, "error");
      setOtpMessage(msg);
    }
  };

  const handleVerifyOtp = async () => {
    const response = await fetch(`${API_URL}/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: forgotEmail, otp }),
    });
    const data = await response.json();
    if (data.message === "OTP verified successfully") {
      setVerifyMessage("OTP verified successfully.");
      setOtpVerified(true);
    } else {
      setVerifyMessage(data.message);
      if (data.message.includes("OTP expired")) {
        setShowOtpBlock(false);
        setOtpVerified(false);
        setOtp("");
        setOtpMessage("OTP expired. Please click Send OTP again.");
      }
    }
  };

  const handleResetPassword = async () => {
    const response = await fetch(`${API_URL}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: forgotEmail, newPassword }),
    });
    const data = await response.json();
    if (data.message === "Password reset successful") {
      setResetMessage("Password changed successfully.");
      setTimeout(() => {
        setShowForgotPassword(false);
        setShowOtpBlock(false);
        setOtpVerified(false);
        setForgotEmail("");
        setOtp("");
        setNewPassword("");
        setOtpMessage("");
        setVerifyMessage("");
        setResetMessage("");
      }, 3000);
    } else {
      setResetMessage(data.message);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // PROFILE
  // ─────────────────────────────────────────────────────────────────────────
  const fetchProfile = async (authToken = token) => {
    if (!authToken) return;
    const response = await fetch(`${API_URL}/profile`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (response.ok) {
      const data = await response.json();
      setCurrentUser(data);
      setIsAdmin(data.role === "admin");
      setIsManager(data.role === "manager");
      setIsCto(data.role === "cto");
      setProfileName(data.name || "");
      setProfileEmail(data.email || "");
      setProfileDesignation(data.designation || "");
      setProfileDepartment(data.department || "");
      setProfilePicture(data.profilePicture || "");
      setProfilePicturePreview(data.profilePicture || "");
      if (data.role === "admin") setCurrentPage("admin");
      else if (data.role === "manager") setCurrentPage("manager");
      else if (data.role === "cto") setCurrentPage("cto");
      else setCurrentPage("tasks");
      return data;
    }
    if (response.status === 401) {
      localStorage.removeItem("token");
      setToken("");
      setCurrentUser(null);
      setIsAdmin(false);
      setCurrentPage("tasks");
      setLoginMessage("Session expired. Please log in again.");
    }
    return null;
  };

  const handleSaveProfile = async () => {
    try {
      const response = await fetch(`${API_URL}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: profileName,
          email: profileEmail,
          designation: profileDesignation,
          department: profileDepartment,
          profilePicture: profilePicture,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        showToast("Profile updated successfully ✓", "success");
        fetchProfile();
      } else {
        showToast(data.message || "Failed to update profile", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to update profile", "error");
    }
  };

  const handleProfilePictureChange = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    const MAX = 10 * 1024 * 1024;
    if (file.size > MAX) {
      showToast("File size exceeds 10MB limit. Please choose a smaller file.", "error");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setProfilePicture(result);
      setProfilePicturePreview(result);
    };
    reader.readAsDataURL(file);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // DASHBOARD STATS
  // ─────────────────────────────────────────────────────────────────────────
  const fetchDashboardStats = async (authToken = token) => {
    if (!authToken) return;
    try {
      const response = await fetch(`${API_URL}/dashboard-stats`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard stats", err);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // USERS
  // ─────────────────────────────────────────────────────────────────────────
  const fetchUsers = async (authToken = token) => {
    if (!authToken) return;
    const endpoint = isAdmin ? `${API_URL}/admin/users` : `${API_URL}/users`;
    const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${authToken}` } });
      if (response.ok) {
        const data = await response.json();
      const sorted = Array.isArray(data)
        ? [...data].sort((a, b) => (a.department || "").localeCompare(b.department || "") || (a.name || "").localeCompare(b.name || ""))
        : [];
       setAdminUsers(sorted);
     }
  };

  const fetchAdminTasks = async (authToken = token) => {
    if (!authToken) return;
    const response = await fetch(`${API_URL}/admin/tasks`, { headers: { Authorization: `Bearer ${authToken}` } });
    if (response.ok) {
      const data = await response.json();
      setAdminTasks(data);
    }
  };

  const fetchPendingRequests = async (authToken = token) => {
    if (!authToken) return;
    const response = await fetch(`${API_URL}/admin/pending-requests`, { headers: { Authorization: `Bearer ${authToken}` } });
    if (response.ok) {
      const data = await response.json();
      setPendingRequests(data);
    }
  };

  const fetchRoles = async (authToken = token) => {
    if (!authToken) return;
    const response = await fetch(`${API_URL}/admin/roles`, { headers: { Authorization: `Bearer ${authToken}` } });
    if (response.ok) {
      const data = await response.json();
      setRoles(data);
      const currentRoleName = selectedRoleForRoleSettings || data[0]?.name || "user";
      let role = data.find((r: any) => r.name === currentRoleName);
      if (!role && data.length > 0) role = data[0];
      if (role) {
        setSelectedRoleForRoleSettings(role.name);
        setRolePermissionUpdates({
          canUpdateTasks: role.canUpdateTasks,
          canDeleteTasks: role.canDeleteTasks,
          canUpdateUsers: role.canUpdateUsers,
          canDeleteUsers: role.canDeleteUsers,
        });
      }
    }
  };

  const fetchPublicRoles = async () => {
    try {
      const response = await fetch(`${API_URL}/public/roles`);
      if (response.ok) { const data = await response.json(); setPublicRoles(data); }
    } catch (err) { console.error("Failed to fetch public roles:", err); }
  };

  const fetchAssignmentLogs = async (pageNumber = 1) => {
    try {
      const response = await fetch(`${API_URL}/admin/assignment-logs?page=${pageNumber}&limit=${logsLimit}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setAssignmentLogs(data.logs || []);
        setLogsPage(data.page || pageNumber);
        setLogsTotal(data.total || 0);
      }
    } catch (err) { console.error("Failed to fetch assignment logs", err); }
  };

  const exportAssignmentLogs = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/assignment-logs/export`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { const d = await res.json(); showToast(d.message || "Failed to export logs", "error"); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "assignment-logs.csv";
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch (err) { showToast("Failed to export logs", "error"); }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // EFFECTS
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => { fetchPublicRoles(); }, []);

  useEffect(() => {
    if (token) {
      fetchProfile();
      fetchTasks();
      fetchDashboardStats();
    }
  }, [token]);

  useEffect(() => {
    if (currentPage === "admin") {
      fetchPendingRequests();
      if (adminTab === "users") fetchUsers();
      else if (adminTab === "roles") fetchRoles();
      else if (adminTab === "tasks") { fetchAdminTasks(); fetchUsers(); }
      else if (adminTab === "chat") fetchAdminChatConfig();
    } else if (currentPage === "chat") {
      loadChatPage();
    } else if (currentPage === "manager" || currentPage === "cto" || (currentPage === "add-task" && (isAdmin || isManager || isCto))) {
      fetchUsers();
    } else if (currentPage === "tasks") {
      fetchDashboardStats();
      fetchTasks();
    }
  }, [isAdmin, isManager, isCto, currentPage, adminTab]);

  // ─────────────────────────────────────────────────────────────────────────
  // TASKS
  // ─────────────────────────────────────────────────────────────────────────
  const fetchTasks = async (authToken = token) => {
    try {
      const response = await fetch(`${API_URL}/tasks`, { headers: { Authorization: `Bearer ${authToken}` } });
      if (response.ok) {
        const data = await response.json();
        setTasks(Array.isArray(data) ? data : []);
      } else { setTasks([]); }
    } catch (err) { console.error("Error fetching tasks:", err); setTasks([]); }
  };

  const handleAddTask = async () => {
    if (!taskData.title.trim()) { showToast("Task title is required.", "error"); return; }
    if (!taskData.description.trim()) { showToast("Task description is required.", "error"); return; }
    if (!taskData.dueDate) { showToast("Due date is required.", "error"); return; }
    if (!taskData.priority) { showToast("Priority is required.", "error"); return; }

    const method = editingTaskId ? "PUT" : "POST";
    const baseUrl = isAdmin ? `${API_URL}/admin/tasks` : `${API_URL}/tasks`;
    const url = editingTaskId ? `${baseUrl}/${editingTaskId}` : baseUrl;

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(taskData),
    });
    const data = await response.json();
    if (!response.ok) { showToast(data.message || "Failed to save task", "error"); return; }

    showToast(editingTaskId ? "Task updated successfully ✓" : "Task added successfully ✓", "success");
    setEditingTaskId(null);
    if (isAdmin) {
      fetchAdminTasks();
      fetchTasks();
    } else {
      fetchTasks();
    }
    fetchDashboardStats();
    setTaskData({ title: "", description: "", dueDate: "", priority: "low", status: "open", thumbnail: "", userId: "" });
    // Navigate back to tasks page
    if (currentPage === "add-task") {
      setCurrentPage(isAdmin ? "admin" : "tasks");
    }
  };

  const loadTaskForEdit = (task: any) => {
    setEditingTaskId(task._id);
    setTaskData({
      title: task.title || "",
      description: task.description || "",
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
      priority: task.priority || "low",
      status: (task.status === "Pending" || task.status === "pending") ? "open" : (task.status || "open"),
      thumbnail: task.thumbnail || "",
      userId: task.userId?._id || task.userId || "",
    });
    setCurrentPage("add-task");
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setTaskData({ title: "", description: "", dueDate: "", priority: "low", status: "open", thumbnail: "", userId: "" });
    setCurrentPage(isAdmin ? "admin" : "tasks");
  };

  const handleFileUpload = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    const MAX = 10 * 1024 * 1024;
    if (file.size > MAX) {
      showToast("File size exceeds 10MB limit. Please upload a smaller file.", "error");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setTaskData({ ...taskData, thumbnail: reader.result as string });
    reader.readAsDataURL(file);
  };

  const deleteTask = async (id: string) => {
    const ok = await confirmDialog("Delete this task? This cannot be undone.");
    if (!ok) return;
    const baseUrl = isAdmin ? `${API_URL}/admin/tasks` : `${API_URL}/tasks`;
    const response = await fetch(`${baseUrl}/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) {
      const data = await response.json();
      showToast(data.message || "Failed to delete task", "error");
    } else {
      showToast("Task deleted.", "info");
    }
    if (isAdmin) {
      fetchAdminTasks();
      fetchTasks();
    } else {
      fetchTasks();
    }
    fetchDashboardStats();
  };

  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN USER MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────
  const handleNewUserPhotoUpload = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    const MAX = 10 * 1024 * 1024;
    if (file.size > MAX) {
      showToast("File size exceeds 10MB limit. Please choose a smaller file.", "error");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setNewUserData({ ...newUserData, profilePicture: reader.result as string });
    reader.readAsDataURL(file);
  };

  const createAdminUser = async () => {
    if (!newUserData.name || !newUserData.email || !newUserData.password) {
      showToast("Please fill in name, email and password.", "error"); return;
    }
    const response = await fetch(`${API_URL}/admin/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(newUserData),
    });
    const data = await response.json();
    if (response.ok) {
      showToast("New user created and notified by email.", "success");
      setNewUserData({ name: "", email: "", password: "", role: "user", designation: "", department: "", profilePicture: "" });
      fetchUsers();
    } else { showToast(data.message || "Failed to create user.", "error"); }
  };

  const saveAdminUser = async () => {
    if (!editingUserId || !newUserData.name || !newUserData.email) {
      showToast("Please fill in name and email.", "error"); return;
    }
    const payload: any = {
      name: newUserData.name,
      email: newUserData.email,
      designation: newUserData.designation,
      role: newUserData.role,
      department: newUserData.department,
      profilePicture: newUserData.profilePicture,
    };
    if (newUserData.password) payload.password = newUserData.password;

    const response = await fetch(`${API_URL}/users/${editingUserId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (response.ok) {
      showToast("User updated successfully.", "success");
      setEditingUserId(null);
      setNewUserData({ name: "", email: "", password: "", role: "user", designation: "", department: "", profilePicture: "" });
      fetchUsers();
    } else { showToast(data.message || "Failed to update user.", "error"); }
  };

  const loadUserForEdit = (user: any) => {
    setEditingUserId(user._id);
    setNewUserData({
      name: user.name || "",
      email: user.email || "",
      password: "",
      role: user.role || "user",
      designation: user.designation || "",
      department: user.department || "",
      profilePicture: user.profilePicture || "",
    });
  };

  const deleteUser = async (userId: string) => {
    const ok = await confirmDialog("Delete this user? This action cannot be undone.");
    if (!ok) return;
    const response = await fetch(`${API_URL}/users/${userId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    const data = await response.json();
    if (response.ok) {
      showToast("User deleted successfully.", "success");
      setAdminUsers((prev) => prev.filter((user) => user._id !== userId));
    } else { showToast(data.message || "Failed to delete user.", "error"); }
  };

  const toggleUserPermission = async (userId: string, permissionType: "updateTask" | "deleteTask" | "updateUser" | "deleteUser", currentValue: boolean) => {
    const body: any = {};
    if (permissionType === "updateTask") body.canUpdateTasks = !currentValue;
    else if (permissionType === "deleteTask") body.canDeleteTasks = !currentValue;
    else if (permissionType === "updateUser") body.canUpdateUsers = !currentValue;
    else if (permissionType === "deleteUser") body.canDeleteUsers = !currentValue;
    const response = await fetch(`${API_URL}/admin/users/${userId}/permissions`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    if (response.ok) fetchUsers();
    else { const data = await response.json(); showToast(data.message || "Failed to update permissions", "error"); }
  };

  const assignManagerToUser = async (userId: string, managerId: string | null) => {
    const response = await fetch(`${API_URL}/admin/users/${userId}/assign-manager`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ managerId: managerId || null }),
    });
    const data = await response.json();
    showToast(response.ok ? (data.message || "Manager assignment updated") : (data.message || "Failed to assign manager"), response.ok ? "success" : "error");
    fetchUsers(); fetchAssignmentLogs();
  };

  const assignCtoToManager = async (managerId: string, ctoId: string | null) => {
    const response = await fetch(`${API_URL}/admin/users/${managerId}/assign-cto`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ctoId: ctoId || null }),
    });
    const data = await response.json();
    showToast(response.ok ? (data.message || "CTO assignment updated") : (data.message || "Failed to assign CTO"), response.ok ? "success" : "error");
    fetchUsers(); fetchAssignmentLogs();
  };

  const approvePendingRequest = async (userId: string) => {
    const ok = await confirmDialog("Approve this user request?");
    if (!ok) return;
    const response = await fetch(`${API_URL}/admin/pending-requests/${userId}/approve`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    const data = await response.json();
    if (response.ok) {
      setPendingRequests((prev) => prev.filter((user) => user._id !== userId));
      showToast(data.message || "User approved.", "success");
      fetchUsers();
    } else { showToast(data.message || "Failed to approve user", "error"); }
  };

  const rejectPendingRequest = async (userId: string) => {
    const ok = await confirmDialog("Reject this user request?");
    if (!ok) return;
    const response = await fetch(`${API_URL}/admin/pending-requests/${userId}/reject`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    const data = await response.json();
    if (response.ok) {
      setPendingRequests((prev) => prev.filter((user) => user._id !== userId));
      showToast(data.message || "User request rejected.", "info");
    } else { showToast(data.message || "Failed to reject user", "error"); }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // ROLES
  // ─────────────────────────────────────────────────────────────────────────
  const createRole = async () => {
    if (!roleCreateName.trim()) { showToast("Please enter a role name.", "error"); return; }
    const response = await fetch(`${API_URL}/admin/roles`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: roleCreateName.trim(), canUpdateTasks: true, canDeleteTasks: false }),
    });
    const data = await response.json();
    if (response.ok) {
      setRoles((prev) => [...prev, data]);
      setRoleCreateName("");
      showToast("Role created successfully.", "success");
    } else { showToast(data.message || "Failed to create role.", "error"); }
  };

  const updateRolePermissions = async () => {
    if (!selectedRoleForRoleSettings) { showToast("Select a role first.", "error"); return; }
    const role = roles.find((r) => r.name === selectedRoleForRoleSettings);
    if (!role) { showToast("Role not found.", "error"); return; }
    const response = await fetch(`${API_URL}/admin/roles/${encodeURIComponent(role.name)}/permissions`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(rolePermissionUpdates),
    });
    const data = await response.json();
    if (response.ok) {
      setRoles((prev) => prev.map((r) => (r.name === role.name ? data.role : r)));
      showToast("Role permissions updated.", "success");
      fetchUsers();
    } else { showToast(data.message || "Failed to update role permissions.", "error"); }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // MFA
  // ─────────────────────────────────────────────────────────────────────────
  const handleMfaSetup = async (method: "email" | "totp") => {
    setMfaSetupMessage("");
    const response = await fetch(`${API_URL}/mfa/setup`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ method }),
    });
    const data = await response.json();
    if (response.ok) {
      setMfaSetupMethod(method);
      if (method === "totp") { setMfaSetupQrCodeUrl(data.qrCodeUrl); setMfaSetupSecret(data.secret); }
      setMfaSetupStep("verify");
      setMfaSetupMessage(data.message || "MFA setup initialized. Please verify.");
      if (data.mockOtp) {
        showToast(`Mock Email OTP: ${data.mockOtp}`, "info");
      }
    } else { setMfaSetupMessage(data.message || "Failed to initialize MFA setup"); }
  };

  const handleVerifyMfaSetup = async () => {
    setMfaSetupMessage("");
    const response = await fetch(`${API_URL}/mfa/verify-setup`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ method: mfaSetupMethod, code: mfaSetupCode }),
    });
    const data = await response.json();
    if (response.ok && data.message.includes("enabled successfully")) {
      showToast("MFA enabled successfully ✓", "success");
      fetchProfile();
      resetMfaSetup();
    } else { setMfaSetupMessage(data.message || "Verification failed"); }
  };

  const handleDisableMfa = async () => {
    const ok = await confirmDialog("Are you sure you want to disable Multi-Factor Authentication?");
    if (!ok) return;
    const response = await fetch(`${API_URL}/mfa/disable`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    const data = await response.json();
    if (response.ok) {
      showToast("MFA disabled successfully.", "info");
      fetchProfile();
    } else { showToast(data.message || "Failed to disable MFA", "error"); }
  };

  const resetMfaSetup = () => {
    setMfaSetupMethod(""); setMfaSetupCode(""); setMfaSetupSecret("");
    setMfaSetupQrCodeUrl(""); setMfaSetupMessage(""); setMfaSetupStep("none");
  };

  // ─────────────────────────────────────────────────────────────────────────
  // LOGOUT
  // ─────────────────────────────────────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    window.location.reload();
  };

  // ─────────────────────────────────────────────────────────────────────────
  // TOAST COMPONENT (inline)
  // ─────────────────────────────────────────────────────────────────────────
  const toastColors: Record<string, string> = {
    success: "rgba(16, 185, 129, 0.92)",
    error: "rgba(239, 68, 68, 0.92)",
    info: "rgba(15, 23, 42, 0.92)",
  };

  const Toast = () => toastMessage ? (
    <div style={{
      position: "fixed", top: 24, right: 24, zIndex: 99999,
      background: toastColors[toastType],
      backdropFilter: "blur(8px)",
      border: "1px solid rgba(255,255,255,0.15)",
      boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
      color: "#fff", padding: "14px 20px",
      borderRadius: 14, display: "flex", alignItems: "center", gap: 12,
      minWidth: 280, maxWidth: 400,
      animation: "slideIn 0.3s ease",
    }}>
      <span style={{ fontSize: 18, display: "inline-flex", alignItems: "center" }}>{toastType === "success" ? <IconCheck size={18} color="#10b981" /> : toastType === "error" ? <IconTrash size={18} color="#ef4444" /> : <IconBell size={18} color="#60a5fa" />}</span>
      <span style={{ fontWeight: 500, fontSize: 14, flex: 1 }}>{toastMessage}</span>
      <button onClick={() => setToastMessage("")} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: 18, padding: 0 }}>✕</button>
    </div>
  ) : null;

  const Modal = () => modalVisible ? (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
      <div style={{ background: "#0b1220", padding: 28, borderRadius: 16, width: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.6)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ marginBottom: 20, fontSize: 16 }}>{modalMessage}</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={() => { if (modalOnCancel) modalOnCancel(); else setModalVisible(false); }} style={{ padding: "10px 20px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", cursor: "pointer" }}>Cancel</button>
          <button onClick={() => { if (modalOnConfirm) modalOnConfirm(); else setModalVisible(false); }} style={{ padding: "10px 20px", borderRadius: 8, background: "linear-gradient(to right,#00c6ff,#0072ff)", border: "none", color: "#fff", fontWeight: "bold", cursor: "pointer" }}>Confirm</button>
        </div>
      </div>
    </div>
  ) : null;

  const GroupCreationModal = () => groupCreationModalOpen ? (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
      <div style={{ background: "#0b1220", padding: 28, borderRadius: 16, width: 440, boxShadow: "0 20px 60px rgba(0,0,0,0.6)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
        <h3 style={{ marginBottom: 16, fontSize: 18, fontWeight: 600 }}>Create New Group</h3>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1, overflowY: "auto", paddingRight: 4 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, color: "#aaa", marginBottom: 6 }}>Group Name</label>
            <input
              type="text"
              placeholder="Enter group name"
              value={groupCreationName}
              onChange={(e) => setGroupCreationName(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", background: "#1a2332", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: 14, boxSizing: "border-box" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, color: "#aaa", marginBottom: 6 }}>Link to Department (Optional)</label>
            <select
              value={groupCreationDepartment}
              onChange={(e) => handleDepartmentSelect(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", background: "#1a2332", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: 14, boxSizing: "border-box" }}
            >
              <option value="">None (Custom Group)</option>
              {_chatDepartments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            {groupCreationDepartment && (
              <p style={{ margin: "6px 0 0 0", fontSize: 11, color: "#38ef7d" }}>
                ✓ Members of {groupCreationDepartment} will be added automatically.
              </p>
            )}
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, color: "#aaa", marginBottom: 8 }}>
              Select Group Members ({groupCreationMembers.length} selected)
            </label>
            <div style={{ background: "#121a26", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, maxHeight: 180, overflowY: "auto", padding: 8 }}>
              {chatTargets.filter(u => (u._id || u.id) !== currentUser?.id).map((u) => {
                const uId = u._id || u.id;
                const isSelected = groupCreationMembers.includes(uId);
                return (
                  <div
                    key={uId}
                    onClick={() => toggleMemberSelection(uId)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px",
                      borderRadius: 6,
                      cursor: "pointer",
                      marginBottom: 4,
                      background: isSelected ? "rgba(0, 198, 255, 0.08)" : "transparent",
                      border: isSelected ? "1px solid rgba(0, 198, 255, 0.2)" : "1px solid transparent",
                      transition: "all 0.2s"
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}} // toggling handled by parent div click
                      style={{ cursor: "pointer" }}
                    />
                    <div style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(59,130,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: "bold", color: "#00c6ff" }}>
                      {(u.name || "?")[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.name}</div>
                      <div style={{ fontSize: 10, color: "#888", display: "flex", gap: 4 }}>
                        <span style={{ textTransform: "capitalize" }}>{u.role}</span>
                        {u.department && <span>· {u.department}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
          <button onClick={() => { setGroupCreationName(""); setGroupCreationDepartment(""); setGroupCreationMembers([]); setGroupCreationModalOpen(false); }} style={{ padding: "10px 20px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", cursor: "pointer" }}>Cancel</button>
          <button onClick={handleCreateGroup} style={{ padding: "10px 20px", borderRadius: 8, background: "linear-gradient(to right,#00c6ff,#0072ff)", border: "none", color: "#fff", fontWeight: "bold", cursor: "pointer" }}>Create</button>
        </div>
      </div>
    </div>
  ) : null;

  const DirectMessageModal = () => directMessageModalOpen ? (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
      <div style={{ background: "#0b1220", padding: 28, borderRadius: 16, width: 440, maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.6)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)" }}>
        <h3 style={{ marginBottom: 16, fontSize: 18, fontWeight: 600 }}>Start Private Chat</h3>
        <div style={{ flex: 1, overflowY: "auto", marginBottom: 20, paddingRight: 4 }}>
          {getEligibleDirectMessageUsers().length === 0 ? (
            <div style={{ padding: 20, color: "#888", textAlign: "center" }}>No eligible chat partners found.</div>
          ) : (
            getEligibleDirectMessageUsers().map((u) => (
              <div
                key={u._id || u.id}
                onClick={async () => {
                  try {
                    const response = await fetch(`${API_URL}/chat/conversation/${u._id || u.id}`, {
                      headers: { Authorization: `Bearer ${token}` }
                    });
                    if (response.ok) {
                      const conv = await response.json();
                      openConversation(conv);
                      setDirectMessageModalOpen(false);
                      // Add to local list of conversations if not already there
                      setChatConversations(prev => {
                        if (prev.some(c => c.conversationId === conv.conversationId)) return prev;
                        return [conv, ...prev];
                      });
                    } else {
                      const errData = await response.json();
                      showToast(errData.message || "Failed to start conversation", "error");
                    }
                  } catch (err) {
                    console.error(err);
                    showToast("Failed to start conversation", "error");
                  }
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 12px",
                  borderRadius: 10,
                  cursor: "pointer",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  transition: "background 0.2s"
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = "rgba(0,198,255,0.1)")}
                onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(59,130,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", color: "#00c6ff" }}>
                  {u.profilePicture ? (
                    <img src={u.profilePicture} alt={u.name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                  ) : (
                    (u.name || "?")[0].toUpperCase()
                  )}
                </div>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</div>
                  <div style={{ fontSize: 11, color: "#888" }}>
                    {u.role.toUpperCase()} {u.designation ? `· ${u.designation}` : ""} {u.department ? `· ${u.department}` : ""}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={() => setDirectMessageModalOpen(false)} style={{ padding: "10px 20px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", cursor: "pointer" }}>Cancel</button>
        </div>
      </div>
    </div>
  ) : null;

  // ─────────────────────────────────────────────────────────────────────────
  // LOGIN / REGISTER PAGE
  // ─────────────────────────────────────────────────────────────────────────
  if (!token) {
    return (
      <div className="auth-container">
        <Toast /><Modal /><GroupCreationModal /><DirectMessageModal />
        <div className="auth-card">
          {mfaRequired ? (
            <div>
              <h1 style={styles.heading}>MFA Verification</h1>
              <p style={{ textAlign: "center", marginBottom: 20, color: "#ccc" }}>
                {mfaMethod === "email" ? `We've sent a 6-digit code to ${mfaEmail}.` : "Enter the code from your Authenticator app."}
              </p>
              <input type="text" placeholder="6-digit code" value={mfaCode} onChange={(e) => setMfaCode(e.target.value)} style={styles.input} />
              <button style={{ ...styles.button, background: "linear-gradient(to right, #00c6ff, #0072ff)" }} onClick={handleVerifyMfa}>Verify & Login</button>
              {mfaError && <div style={{ marginTop: 15, padding: 12, borderRadius: 10, textAlign: "center", fontWeight: "bold", background: "rgba(255,0,0,0.15)", color: "#ff6b6b" }}>{mfaError}</div>}
              <button style={{ marginTop: 20, background: "none", border: "none", color: "#00c6ff", cursor: "pointer", width: "100%", textAlign: "center", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={() => { setMfaRequired(false); setMfaMethod(""); setMfaCode(""); setMfaError(""); setLoginMessage(""); }}><IconArrowLeft size={16} /> Back to Login</button>
            </div>
          ) : (
            <>
              <h1 style={styles.heading}>{isLogin ? "Employee Login" : "Employee Register"}</h1>
              {!showForgotPassword && (
                <>
                  {!isLogin && (
                    <>
                      <input type="text" placeholder="Name" value={registerData.name} onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })} style={styles.input} />
                      <select value={registerData.role} onChange={(e) => setRegisterData({ ...registerData, role: e.target.value })} style={styles.input}>
                        <option value="">Select Role</option>
                        {publicRoles.map((r: any) => <option key={r._id} value={r.name}>{r.displayName || r.name}</option>)}
                      </select>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <label style={{ color: "#ccc", fontSize: 13 }}>Profile Picture</label>
                        <input type="file" accept="image/*" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const MAX = 10 * 1024 * 1024;
                          if (file.size > MAX) {
                            showToast("File size exceeds 10MB limit. Please choose a smaller file.", "error");
                            e.target.value = "";
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => setRegisterData({ ...registerData, profilePicture: reader.result as string });
                          reader.readAsDataURL(file);
                        }} style={{ ...styles.input, padding: "10px 12px", height: "auto" }} />
                        {registerData.profilePicture && <img src={registerData.profilePicture} alt="preview" style={{ width: 80, height: 80, borderRadius: 12, objectFit: "cover", border: "1px solid rgba(255,255,255,0.12)" }} />}
                      </div>
                    </>
                  )}
                  <input type="email" placeholder="Email" value={isLogin ? loginData.email : registerData.email} onChange={(e) => isLogin ? setLoginData({ ...loginData, email: e.target.value }) : setRegisterData({ ...registerData, email: e.target.value })} style={styles.input} />
                  <input type="password" placeholder="Password" value={isLogin ? loginData.password : registerData.password} onChange={(e) => isLogin ? setLoginData({ ...loginData, password: e.target.value }) : setRegisterData({ ...registerData, password: e.target.value })} style={styles.input} />
                  <button style={styles.button} onClick={isLogin ? handleLogin : handleRegister}>{isLogin ? "Login" : "Register"}</button>
                  {registerMessage && !isLogin && <div style={{ marginTop: 15, padding: 12, borderRadius: 10, textAlign: "center", fontWeight: "bold", background: "rgba(56,239,125,0.15)", color: "#38ef7d" }}>{registerMessage}</div>}
                  {registerError && !isLogin && <div style={{ marginTop: 15, padding: 12, borderRadius: 10, textAlign: "center", fontWeight: "bold", background: "rgba(255,0,0,0.15)", color: "#ff6b6b" }}>{registerError}</div>}
                  {loginMessage && <div style={{ marginTop: 15, padding: 12, borderRadius: 10, textAlign: "center", fontWeight: "bold", background: loginMessage === "Login Successful" ? "rgba(56,239,125,0.15)" : "rgba(255,0,0,0.15)", color: loginMessage === "Login Successful" ? "#38ef7d" : "#ff6b6b" }}>{loginMessage}</div>}
                  {isLogin && (
                    <div style={{ marginTop: 15, textAlign: "center" }}>
                      <span style={{ color: "#ccc" }}>Forgot your password?</span><br />
                      <button style={{ marginTop: 8, background: "linear-gradient(to right,#ff512f,#dd2476)", color: "white", border: "none", padding: "10px 20px", borderRadius: 20, cursor: "pointer", fontWeight: "bold" }} onClick={() => setShowForgotPassword(true)}>Reset Password</button>
                    </div>
                  )}
                  <button style={styles.switchButton} onClick={() => setIsLogin(!isLogin)}>{isLogin ? "New user? Register" : "Already have account? Login"}</button>
                </>
              )}
              {showForgotPassword && (
                <div style={{ marginTop: 20, padding: 25, borderRadius: 15, background: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)" }}>
                  <h2 style={{ textAlign: "center", marginBottom: 20 }}>Password Recovery</h2>
                  <input type="email" placeholder="Enter Registered Email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} style={styles.input} />
                  <button style={{ ...styles.button, background: "linear-gradient(to right,#36d1dc,#5b86e5)" }} onClick={handleSendOtp}>Send OTP</button>
                  {showOtpBlock && (
                    <div style={{ marginTop: 20, padding: 20, borderRadius: 12, background: "rgba(255,255,255,0.08)" }}>
                      <h3>Verify OTP</h3>
                      <input type="text" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} style={styles.input} />
                      <button style={{ ...styles.button, background: "linear-gradient(to right,#ff9966,#ff5e62)" }} onClick={handleVerifyOtp}>Verify OTP</button>
                      {verifyMessage && <div style={{ marginTop: 12, background: "rgba(17,153,142,0.15)", padding: 10, borderRadius: 10, color: "#38ef7d", textAlign: "center", fontWeight: "bold" }}>{verifyMessage}</div>}
                      {otpMessage && <div style={{ marginTop: 15, background: "rgba(56,239,125,0.15)", padding: 12, borderRadius: 10, textAlign: "center", color: "#38ef7d", fontWeight: "bold" }}>{otpMessage}</div>}
                    </div>
                  )}
                  {otpVerified && (
                    <div style={{ marginTop: 20, padding: 20, borderRadius: 12, background: "rgba(255,255,255,0.08)" }}>
                      <h3>Create New Password</h3>
                      <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={styles.input} />
                      <button style={{ ...styles.button, background: "linear-gradient(to right,#ff9966,#ff5e62)" }} onClick={handleResetPassword}>Change Password</button>
                      {resetMessage && <div style={{ marginTop: 12, background: "rgba(255,153,102,0.15)", padding: 10, borderRadius: 10, color: "#ffcc70", textAlign: "center", fontWeight: "bold" }}>{resetMessage}</div>}
                    </div>
                  )}
                  <button style={{ marginTop: 20, background: "none", border: "none", color: "#00c6ff", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }} onClick={() => { setShowForgotPassword(false); setShowOtpBlock(false); setOtpVerified(false); }}><IconArrowLeft size={16} /> Back to Login</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PROFILE AVATAR (small circular)
  // ─────────────────────────────────────────────────────────────────────────
  const Avatar = ({ size = 36 }: { size?: number }) => (
    <div
      onClick={() => setCurrentPage("profile")}
      style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", border: "2px solid #00c6ff", cursor: "pointer", flexShrink: 0, background: "#1e3a5f", display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      {profilePicturePreview
        ? <img src={profilePicturePreview} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : <span style={{ fontSize: size * 0.4, color: "#00c6ff", fontWeight: 700 }}>{(currentUser?.name || "?")[0].toUpperCase()}</span>}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // PAGINATED TASK HELPERS
  // ─────────────────────────────────────────────────────────────────────────
  const totalUserPages = Math.max(1, Math.ceil(tasks.length / TASKS_PER_PAGE));
  const pagedTasks = tasks.slice((userTasksPage - 1) * TASKS_PER_PAGE, userTasksPage * TASKS_PER_PAGE);
  const totalAdminPages = Math.max(1, Math.ceil(adminTasks.length / TASKS_PER_PAGE));
  const pagedAdminTasks = adminTasks.slice((adminTasksPage - 1) * TASKS_PER_PAGE, adminTasksPage * TASKS_PER_PAGE);

  const PaginationBar = ({ page, total, onPrev, onNext }: { page: number; total: number; onPrev: () => void; onNext: () => void }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 20, justifyContent: "center", flexWrap: "wrap" }}>
      <button onClick={onPrev} disabled={page <= 1} style={{ ...styles.paginationBtn, opacity: page <= 1 ? 0.4 : 1, display: "inline-flex", alignItems: "center", gap: 8 }}><IconArrowLeft size={16} /> Prev</button>
      <span style={{ color: "#aaa", fontSize: 14 }}>Page {page} / {total}</span>
      <button onClick={onNext} disabled={page >= total} style={{ ...styles.paginationBtn, opacity: page >= total ? 0.4 : 1, display: "inline-flex", alignItems: "center", gap: 8 }}>Next <IconArrowLeft size={16} style={{ transform: "rotate(180deg)" }} /></button>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // ADD TASK PAGE
  // ─────────────────────────────────────────────────────────────────────────
  const AddTaskPage = () => (
    <div style={{ maxWidth: 700, width: "100%", margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <button onClick={handleCancelEdit} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", padding: "8px 16px", borderRadius: 10, cursor: "pointer", fontSize: 14, display: "inline-flex", alignItems: "center", gap: 8 }}><IconArrowLeft size={16} /> Back</button>
        <h2 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>{editingTaskId ? <><IconEdit size={20} style={{ marginRight: 8 }} /> Edit Task</> : <><IconPlus size={20} style={{ marginRight: 8 }} /> Add New Task</>}</h2>
      </div>
      <div style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(12px)", padding: 32, borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ display: "grid", gap: 16 }}>
          <div>
            <label style={styles.label}>Task Title <span style={{ color: "#f87171" }}>*</span></label>
            <input type="text" placeholder="Enter task title" value={taskData.title} onChange={(e) => setTaskData({ ...taskData, title: e.target.value })} style={styles.input} required />
          </div>
          <div>
            <label style={styles.label}>Description <span style={{ color: "#f87171" }}>*</span></label>
            <textarea placeholder="Enter task description" value={taskData.description} onChange={(e) => setTaskData({ ...taskData, description: e.target.value })} style={{ ...styles.input, minHeight: 100, resize: "vertical" }} required />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}>
            <div>
              <label style={styles.label}>Due Date <span style={{ color: "#f87171" }}>*</span></label>
              <input type="date" value={taskData.dueDate} onChange={(e) => setTaskData({ ...taskData, dueDate: e.target.value })} style={styles.input} required />
            </div>
            <div>
              <label style={styles.label}>Priority <span style={{ color: "#f87171" }}>*</span></label>
              <select value={taskData.priority} onChange={(e) => setTaskData({ ...taskData, priority: e.target.value })} style={styles.input}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div>
            <label style={styles.label}>Status</label>
            <select value={taskData.status} onChange={(e) => setTaskData({ ...taskData, status: e.target.value })} style={styles.input}>
              <option value="open">Open</option>
              <option value="in progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          {isAdmin && (
            <div>
              <label style={styles.label}>Assign To (User)</label>
              <select value={taskData.userId} onChange={(e) => setTaskData({ ...taskData, userId: e.target.value })} style={styles.input}>
                <option value="">-- Assign to myself --</option>
                {adminUsers.map((u) => <option key={u._id} value={u._id}>{u.name} ({u.email} - {u.role})</option>)}
              </select>
            </div>
          )}
          <div>
            <label style={styles.label}>Attachment (max 10MB)</label>
            <input type="file" onChange={handleFileUpload} style={{ ...styles.input, padding: "10px 12px", cursor: "pointer" }} />
            {taskData.thumbnail && (
              <div style={{ marginTop: 12 }}>
                <img src={taskData.thumbnail} alt="preview" style={{ maxHeight: 140, borderRadius: 10, objectFit: "cover" }} />
                <button onClick={() => setTaskData({ ...taskData, thumbnail: "" })} style={{ display: "block", marginTop: 6, background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: 13 }}>Remove</button>
              </div>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
          <button style={{ ...styles.button, flex: 1, minWidth: 160, marginTop: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10 }} onClick={handleAddTask}>{editingTaskId ? <><IconSave size={18} /> Update Task</> : <><IconPlus size={18} /> Add Task</>}</button>
          <button style={{ ...styles.button, flex: 1, minWidth: 160, marginTop: 0, background: "#374151" }} onClick={handleCancelEdit}>Cancel</button>
        </div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // PROFILE PAGE
  // ─────────────────────────────────────────────────────────────────────────
  const ProfilePage = () => (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={() => setCurrentPage(isAdmin ? "admin" : isManager ? "manager" : isCto ? "cto" : "tasks")} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", padding: "8px 16px", borderRadius: 10, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}><IconArrowLeft size={16} /> Back</button>
        <h2 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>👤 Edit Profile</h2>
      </div>
      <div style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(12px)", padding: 32, borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)" }}>
        {/* Profile Picture */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28 }}>
          <div style={{ width: 100, height: 100, borderRadius: "50%", overflow: "hidden", border: "3px solid #00c6ff", marginBottom: 16, background: "#1e3a5f", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {profilePicturePreview
              ? <img src={profilePicturePreview} alt="profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ fontSize: 36, color: "#00c6ff", fontWeight: 700 }}>{(currentUser?.name || "?")[0].toUpperCase()}</span>}
          </div>
          <label style={{ cursor: "pointer", background: "rgba(0,198,255,0.15)", border: "1px solid #00c6ff", color: "#00c6ff", padding: "8px 20px", borderRadius: 20, fontSize: 14 }}>
            📷 Change Profile Picture
            <input type="file" accept="image/*" onChange={handleProfilePictureChange} style={{ display: "none" }} />
          </label>
          <p style={{ fontSize: 12, color: "#888", marginTop: 8 }}>Max 10MB. JPG, PNG, GIF, WebP supported.</p>
        </div>
        {/* Fields */}
        <div style={{ display: "grid", gap: 16 }}>
          <div>
            <label style={styles.label}>Full Name</label>
            <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} style={styles.input} placeholder="Full Name" />
          </div>
          <div>
            <label style={styles.label}>Email</label>
            <input type="email" value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} style={styles.input} placeholder="Email" />
          </div>
          <div>
            <label style={styles.label}>Designation</label>
            <input type="text" value={profileDesignation} onChange={(e) => setProfileDesignation(e.target.value)} style={styles.input} placeholder="e.g. Senior Developer" />
          </div>
          <div>
            <label style={styles.label}>Department</label>
            <input type="text" value={profileDepartment} onChange={(e) => setProfileDepartment(e.target.value)} style={styles.input} placeholder="e.g. Engineering" />
          </div>
          <div>
            <label style={styles.label}>Role</label>
            <input type="text" value={currentUser?.role || ""} disabled style={{ ...styles.input, opacity: 0.5, cursor: "not-allowed" }} />
          </div>
        </div>
        <button style={{ ...styles.button, marginTop: 24, display: "inline-flex", alignItems: "center", gap: 10 }} onClick={handleSaveProfile}><IconSave size={18} /> Save Profile</button>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // SETTINGS PAGE (MFA)
  // ─────────────────────────────────────────────────────────────────────────
  const SettingsPage = () => (
    <div style={{ maxWidth: 700, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <button onClick={() => setCurrentPage(isAdmin ? "admin" : isManager ? "manager" : isCto ? "cto" : "tasks")} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", padding: "8px 16px", borderRadius: 10, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}><IconArrowLeft size={16} /> Back</button>
        <h2 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}><IconSettings size={24} style={{ marginRight: 10 }} /> Settings</h2>
      </div>
      <div style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(12px)", padding: 32, borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)", marginBottom: 24 }}>
        <h3 style={{ color: "#00c6ff", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}><IconShield size={18} /> Multi-Factor Authentication</h3>
        {currentUser && currentUser.mfaEnabled ? (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, padding: 16, background: "rgba(16,185,129,0.1)", borderRadius: 12, border: "1px solid rgba(16,185,129,0.3)" }}>
              <IconCheck size={24} color="#34d399" />
              <div>
                <p style={{ color: "#34d399", fontSize: 16, fontWeight: "bold", margin: 0 }}>MFA is ENABLED</p>
                <p style={{ color: "#ccc", fontSize: 13, margin: "4px 0 0" }}>via {currentUser.mfaMethod === "email" ? "Email OTP" : "Authenticator App (TOTP)"}</p>
              </div>
            </div>
            <p style={{ color: "#aaa", fontSize: 14, marginBottom: 16 }}>Your account is protected by multi-factor authentication. You will be prompted for a code at each login.</p>
            <button style={{ ...styles.button, background: "linear-gradient(to right,#ef4444,#dc2626)", width: "auto", padding: "12px 24px", marginTop: 0, display: "inline-flex", alignItems: "center", gap: 8 }} onClick={handleDisableMfa}><IconShield size={16} /> Disable MFA</button>
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, padding: 16, background: "rgba(239,68,68,0.1)", borderRadius: 12, border: "1px solid rgba(239,68,68,0.3)" }}>
              <IconAlert size={24} color="#f87171" />
              <div>
                <p style={{ color: "#f87171", fontSize: 15, fontWeight: "bold", margin: 0 }}>MFA is DISABLED</p>
                <p style={{ color: "#ccc", fontSize: 13, margin: "4px 0 0" }}>Enable MFA to secure your account with an additional verification step.</p>
              </div>
            </div>
            {mfaSetupStep === "none" ? (
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button style={{ ...styles.button, width: "auto", margin: 0, padding: "12px 24px", display: "inline-flex", alignItems: "center", gap: 8 }} onClick={() => handleMfaSetup("email")}><IconMail size={16} /> Set up Email MFA</button>
                <button style={{ ...styles.button, width: "auto", margin: 0, padding: "12px 24px", background: "linear-gradient(to right,#ff9966,#ff5e62)", display: "inline-flex", alignItems: "center", gap: 8 }} onClick={() => handleMfaSetup("totp")}><IconShield size={16} /> Set up Authenticator App</button>
              </div>
            ) : (
              <div style={{ background: "rgba(255,255,255,0.05)", padding: 20, borderRadius: 12 }}>
                <h3 style={{ marginBottom: 10 }}>Verify MFA Setup ({mfaSetupMethod === "email" ? "Email" : "Authenticator App"})</h3>
                {mfaSetupMethod === "email" ? (
                  <p style={{ color: "#ccc", margin: "10px 0" }}>We've sent a 6-digit code to your email. Enter it below.</p>
                ) : (
                  <div style={{ margin: "15px 0" }}>
                    <p style={{ color: "#ccc", marginBottom: 15 }}>Scan the QR code with your Authenticator app or enter the secret key manually.</p>
                    {mfaSetupQrCodeUrl && <img src={mfaSetupQrCodeUrl} alt="MFA QR Code" style={{ width: 200, height: 200, margin: "15px auto", display: "block", border: "4px solid white", borderRadius: 8 }} />}
                    <p style={{ fontFamily: "monospace", fontSize: 14, background: "rgba(0,0,0,0.3)", padding: 10, borderRadius: 6, wordBreak: "break-all", textAlign: "center" }}>Secret Key: {mfaSetupSecret}</p>
                  </div>
                )}
                <input type="text" placeholder="6-digit verification code" value={mfaSetupCode} onChange={(e) => setMfaSetupCode(e.target.value)} style={styles.input} />
                <div style={{ display: "flex", gap: 10, marginTop: 15 }}>
                  <button style={{ ...styles.button, margin: 0, background: "linear-gradient(to right,#00c6ff,#0072ff)" }} onClick={handleVerifyMfaSetup}>Verify & Enable</button>
                  <button style={{ ...styles.button, margin: 0, background: "#374151", width: "auto" }} onClick={resetMfaSetup}>Cancel</button>
                </div>
                {mfaSetupMessage && <div style={{ marginTop: 12, color: mfaSetupMessage.includes("successfully") ? "#38ef7d" : "#ff5e62", fontWeight: "bold" }}>{mfaSetupMessage}</div>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // EMPLOYEE DASHBOARD (tasks view with stats + charts)
  // ─────────────────────────────────────────────────────────────────────────
  const EmployeeDashboardContent = () => (
    <>
      {/* Stats Row */}
      <div className="stats-row" style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 28 }}>
        <StatCard label="Total Tasks" value={stats.totalTasks} color="#00c6ff" icon={<IconClipboard size={22} color="#00c6ff" />} />
        <StatCard label="Pending" value={stats.pendingTasks} color="#f59e0b" icon={<IconClock size={22} color="#f59e0b" />} />
        <StatCard label="Completed" value={stats.completedTasks} color="#10b981" icon={<IconCheck size={22} color="#10b981" />} />
        <StatCard label="Approved Users" value={stats.approvedRequests} color="#8b5cf6" icon={<IconUsers size={22} color="#8b5cf6" />} />
        <StatCard label="Pending Requests" value={stats.nonApprovedRequests} color="#ef4444" icon={<IconAlert size={22} color="#ef4444" />} />
      </div>

      {/* Charts Row */}
      {(stats.pendingTasks > 0 || stats.completedTasks > 0) && (
        <div className="charts-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>
          <div style={{ background: "rgba(17, 24, 39, 0.45)", backdropFilter: "blur(12px)", padding: 24, borderRadius: 20, border: "1px solid rgba(255, 255, 255, 0.08)" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 16, color: "#cbd5e1", display: "flex", alignItems: "center", gap: 8 }}><IconPieChart size={18} color="#00c6ff" /> Task Distribution</h3>
            <PieChart pending={stats.pendingTasks} completed={stats.completedTasks} />
          </div>
          <div style={{ background: "rgba(17, 24, 39, 0.45)", backdropFilter: "blur(12px)", padding: 24, borderRadius: 20, border: "1px solid rgba(255, 255, 255, 0.08)" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 16, color: "#cbd5e1", display: "flex", alignItems: "center", gap: 8 }}><IconBarChart size={18} color="#00c6ff" /> Task Progress</h3>
            <BarChart pending={stats.pendingTasks} completed={stats.completedTasks} />
          </div>
        </div>
      )}

      {/* Add Task Button */}
      {currentUser && (currentUser.role === "admin" || currentUser.canUpdateTasks !== false) && (
        <div style={{ marginBottom: 20 }}>
          <button
            style={{ ...styles.button, width: "auto", padding: "12px 28px", marginTop: 0, display: "inline-flex", alignItems: "center", gap: 8 }}
            onClick={() => { setEditingTaskId(null); setTaskData({ title: "", description: "", dueDate: "", priority: "low", status: "open", thumbnail: "", userId: "" }); setCurrentPage("add-task"); }}
          >
            <IconPlus size={18} /> Add New Task
          </button>
        </div>
      )}

      {/* Task List */}
      <h2 style={{ ...styles.recentTitle, marginTop: 8 }}>Your Recent Tasks</h2>
      {tasks.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "#9ca3af", background: "rgba(17, 24, 39, 0.25)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "inline-block", padding: 12, borderRadius: "50%", background: "rgba(255,255,255,0.05)", marginBottom: 12 }}>
            <IconClipboard size={32} color="#9ca3af" />
          </div>
          <p>No tasks yet. Click "Add New Task" to create one!</p>
        </div>
      ) : (
        <>
          <div className="task-grid">
            {pagedTasks.map((task) => (
              <TaskCard key={task._id} task={task} onEdit={() => loadTaskForEdit(task)} onDelete={() => deleteTask(task._id)} />
            ))}
          </div>
          {tasks.length > TASKS_PER_PAGE && <PaginationBar page={userTasksPage} total={totalUserPages} onPrev={() => setUserTasksPage((p) => Math.max(1, p - 1))} onNext={() => setUserTasksPage((p) => Math.min(totalUserPages, p + 1))} />}
        </>
      )}
    </>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // TASK CARD (reusable)
  // ─────────────────────────────────────────────────────────────────────────
  const TaskCard = ({ task, onEdit, onDelete, showUser = false }: { task: any; onEdit?: () => void; onDelete?: () => void; showUser?: boolean }) => {
    const priorityColors: Record<string, string> = { high: "#ef4444", medium: "#f59e0b", low: "#10b981" };
    const statusColors: Record<string, string> = { completed: "#10b981", "in progress": "#f59e0b", open: "#6366f1" };
    return (
      <div style={styles.taskCard}>
        {task.thumbnail && <img src={task.thumbnail} alt="thumbnail" style={styles.thumbnail} />}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <h3 style={{ margin: 0, fontSize: 16, flex: 1 }}>{task.title}</h3>
          <span style={{ background: priorityColors[task.priority] || "#6366f1", color: "#fff", fontSize: 11, padding: "2px 8px", borderRadius: 20, marginLeft: 8, textTransform: "capitalize", whiteSpace: "nowrap" }}>{task.priority}</span>
        </div>
        {showUser && (
          <p style={{ fontSize: 12, color: "#00c6ff", margin: "0 0 6px", display: "flex", alignItems: "center", gap: 4 }}>
            <IconUser size={13} />
            <span>{task.userId?.name || task.userId?.email || "Unknown"}</span>
          </p>
        )}
        <p style={{ color: "#ccc", fontSize: 13, margin: "0 0 8px", lineHeight: 1.5 }}>{task.description}</p>
        <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#aaa", marginBottom: 10, alignItems: "center" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <IconCalendar size={13} />
            <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "—"}</span>
          </span>
          <span style={{ color: statusColors[task.status] || "#ccc", textTransform: "capitalize", display: "flex", alignItems: "center", gap: 4 }}>
            <span>●</span>
            <span>{task.status}</span>
          </span>
        </div>
        {(onEdit || onDelete) && (
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            {onEdit && currentUser && (currentUser.role === "admin" || currentUser.canUpdateTasks !== false) && (
              <button style={{ flex: 1, padding: "8px", background: "linear-gradient(to right,#00c6ff,#0072ff)", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }} onClick={onEdit}>
                <IconEdit size={13} />
                <span>Edit</span>
              </button>
            )}
            {onDelete && currentUser && (currentUser.role === "admin" || currentUser.canDeleteTasks !== false) && (
              <button style={{ flex: 1, padding: "8px", background: "linear-gradient(to right,#ef4444,#dc2626)", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }} onClick={onDelete}>
                <IconTrash size={13} />
                <span>Delete</span>
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // FULL DASHBOARD RENDER
  // ─────────────────────────────────────────────────────────────────────────
  const pageTitles: Record<string, string> = {
    tasks: "Employee Dashboard",
    admin: "Admin Panel",
    manager: "Manager Panel",
    cto: "CTO Panel",
    chat: "Team Chat",
    settings: "Settings",
    "add-task": editingTaskId ? "Edit Task" : "Add New Task",
    profile: "Edit Profile",
  };

  return (
    <div className="app-dashboard">
      <Toast /><Modal /><GroupCreationModal /><DirectMessageModal />

      {/* HEADER */}
      <div className="app-header">
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <Avatar size={42} />
          <div style={{ textAlign: "left" }}>
            <h1 style={{ fontSize: "28px", fontWeight: 700, margin: 0 }} className="text-gradient">{pageTitles[currentPage] || "Dashboard"}</h1>
            {currentUser && (
              <p style={{ color: "#9ca3af", marginTop: 4, fontSize: 13, margin: "4px 0 0" }}>
                {currentUser.name} · {currentUser.role.toUpperCase()}
                {currentUser.designation ? ` · ${currentUser.designation}` : ""}
              </p>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {/* Nav buttons */}
          {currentPage !== "add-task" && currentPage !== "profile" && currentPage !== "settings" && (
            <>
              <button style={currentPage === "tasks" ? styles.activeTab : styles.adminTab} onClick={() => setCurrentPage("tasks")}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}><IconHome size={15} /> Dashboard</span>
              </button>
              {isAdmin && (
                <button style={currentPage === "admin" ? styles.activeTab : styles.adminTab} onClick={() => setCurrentPage("admin")}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}><IconShield size={15} /> Admin</span>
                </button>
              )}
              {isManager && (
                <button style={currentPage === "manager" ? styles.activeTab : styles.adminTab} onClick={() => setCurrentPage("manager")}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}><IconBriefcase size={15} /> Manager</span>
                </button>
              )}
              {isCto && (
                <button style={currentPage === "cto" ? styles.activeTab : styles.adminTab} onClick={() => setCurrentPage("cto")}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}><IconBriefcase size={15} /> CTO</span>
                </button>
              )}
              <button style={currentPage === "chat" ? styles.activeTab : styles.adminTab} onClick={() => setCurrentPage("chat")}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}><IconMessageCircle size={15} /> Chat</span>
              </button>
            </>
          )}
          <button style={currentPage === "settings" ? styles.activeTab : styles.adminTab} onClick={() => setCurrentPage("settings")}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><IconSettings size={15} /> Settings</span>
          </button>
          <NotificationBell token={token} apiUrl={API_URL} />
          <button style={styles.logoutButton} onClick={logout}>Logout</button>
        </div>
      </div>

      <div style={{ marginTop: 28 }}>
        {/* ── Profile Page ── */}
        {currentPage === "profile" && <ProfilePage />}

        {/* ── Settings Page ── */}
        {currentPage === "settings" && <SettingsPage />}

        {/* ── Chat Page (WhatsApp Style) ── */}
        {currentPage === "chat" && (
          <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 0, height: "calc(100vh - 140px)", background: "#0a0e27", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
            {/* Sidebar */}
            <div style={{ display: "flex", flexDirection: "column", background: "#0f1620", borderRight: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
              <div style={{ padding: 16, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  <input placeholder="Search chats..." style={{ ...styles.input, flex: 1, padding: "8px 12px", fontSize: 13, height: "auto" }} />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    style={{ flex: 1, padding: "9px 10px", background: "linear-gradient(to right,#667eea,#764ba2)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 12 }}
                    onClick={() => setDirectMessageModalOpen(true)}
                  >+ Direct Message</button>
                  <button
                    style={{ flex: 1, padding: "9px 10px", background: "linear-gradient(to right,#00c6ff,#0072ff)", color: "#000", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 12 }}
                    onClick={() => { setGroupCreationName(""); setGroupCreationDepartment(""); setGroupCreationMembers([]); setGroupCreationModalOpen(true); }}
                  >+ New Group</button>
                </div>
              </div>
              <div style={{ flex: 1, overflow: "auto" }}>
                {!chatConversations || chatConversations.length === 0 ? (
                  <div style={{ padding: 16, color: "#888", textAlign: "center" }}>No conversations yet</div>
                ) : (
                  chatConversations.map((conv: any) => (
                    <div key={conv.conversationId} onClick={() => openConversation(conv)} style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer", background: selectedConversation?.conversationId === conv.conversationId ? "rgba(0,198,255,0.1)" : "transparent", transition: "background 0.2s" }} onMouseOver={(e) => (e.currentTarget.style.background = selectedConversation?.conversationId === conv.conversationId ? "rgba(0,198,255,0.1)" : "rgba(255,255,255,0.03)")} onMouseOut={(e) => (e.currentTarget.style.background = selectedConversation?.conversationId === conv.conversationId ? "rgba(0,198,255,0.1)" : "transparent")}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 40, height: 40, borderRadius: "50%", background: conv.type === "group" ? "rgba(0,198,255,0.2)" : "rgba(59,130,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <span style={{ fontSize: 18 }}>{conv.type === "group" ? "👥" : "💬"}</span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 14, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{conv.name}</div>
                          <div style={{ fontSize: 12, color: "#888", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{conv.lastMessage || "No messages"}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Main Chat Area */}
            <div style={{ display: "flex", flexDirection: "column", background: "#0a0e27" }}>
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "#0f1620", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <h3 style={{ margin: 0, color: "#fff", fontSize: 16, fontWeight: 600 }}>{selectedConversation.name}</h3>
                      <p style={{ margin: "4px 0 0 0", color: "#888", fontSize: 12 }}>
                        {selectedConversation.type === "group" ? `${selectedConversation.memberCount} members` : `@${selectedConversation.role}`}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                      {isAdmin && selectedConversation.type === "group" && (
                        <button
                          onClick={() => handleDeleteGroup(selectedConversation.groupId)}
                          style={{
                            background: "rgba(239, 68, 68, 0.15)",
                            border: "1px solid rgba(239, 68, 68, 0.4)",
                            color: "#f87171",
                            padding: "6px 12px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            transition: "all 0.2s"
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = "rgba(239, 68, 68, 0.25)";
                            e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.6)";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = "rgba(239, 68, 68, 0.15)";
                            e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.4)";
                          }}
                        >
                          <IconTrash size={14} />
                          <span>Delete Group</span>
                        </button>
                      )}
                      <div style={{ color: chatConnected ? "#34d399" : "#f59e0b", fontSize: 12, fontWeight: 600 }}>
                        {chatConnected ? "● Connected" : "● Disconnected"}
                      </div>
                    </div>
                  </div>

                  {/* Messages Area */}
                  <div style={{ flex: 1, overflow: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
                    {loadingChatHistory ? (
                      <div style={{ color: "#888", textAlign: "center", padding: 20 }}>Loading messages...</div>
                    ) : chatMessages.length === 0 ? (
                      <div style={{ color: "#888", textAlign: "center", padding: 40 }}>No messages yet. Start the conversation!</div>
                    ) : (
                      chatMessages.map((message: any, index: number) => {
                        const isOwnMessage = message.self || message.from?.id === currentUser?.id;
                        const senderName = isOwnMessage ? "You" : message.from?.name || "Unknown";
                        return (
                          <div key={index} style={{ display: "flex", flexDirection: isOwnMessage ? "row-reverse" : "row", gap: 10, alignItems: "flex-end" }}>
                            <div style={{ maxWidth: "60%", background: isOwnMessage ? "rgba(0,198,255,0.2)" : "rgba(255,255,255,0.08)", padding: "10px 14px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)" }}>
                              {selectedConversation.type === "group" && !isOwnMessage && (
                                <div style={{ fontSize: 11, color: "#00c6ff", marginBottom: 4, fontWeight: 600 }}>{senderName}</div>
                              )}
                              <div style={{ color: "#fff", fontSize: 14 }}>{message.message}</div>
                              <div style={{ fontSize: 11, color: "#888", marginTop: 4, textAlign: "right" }}>
                                {message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div style={{ height: 0 }} />
                  </div>

                  {/* Message Input */}
                  <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.08)", background: "#0f1620", display: "flex", gap: 10 }}>
                    <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyPress={(e) => e.key === "Enter" && sendChatMessage()} placeholder="Type a message..." style={{ ...styles.input, flex: 1, padding: "10px 14px", fontSize: 14, height: "auto" }} />
                    <button style={{ ...styles.button, width: "auto", padding: "10px 20px", fontSize: 13, fontWeight: 600 }} onClick={sendChatMessage}>Send</button>
                  </div>
                </>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#888" }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
                  <p style={{ fontSize: 16, fontWeight: 600, margin: "0 0 8px 0", color: "#ccc" }}>Select a conversation</p>
                  <p style={{ fontSize: 13, margin: 0, color: "#666" }}>Choose a chat from the list or create a new group</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Add Task Page ── */}
        {currentPage === "add-task" && <AddTaskPage />}

        {/* ── Employee Dashboard ── */}
        {currentPage === "tasks" && <EmployeeDashboardContent />}

        {/* ── Admin Panel ── */}
        {currentPage === "admin" && isAdmin && (
          <div style={styles.adminPanel}>
            <div style={styles.adminTabs}>
                <button style={adminTab === "users" ? styles.activeTab : styles.adminTab} onClick={() => setAdminTab("users")}><IconUsers size={16} /> Users</button>
                <button style={adminTab === "pending" ? styles.activeTab : styles.adminTab} onClick={() => setAdminTab("pending")}><IconClock size={16} /> Pending ({pendingRequests.length})</button>
                <button style={adminTab === "roles" ? styles.activeTab : styles.adminTab} onClick={() => setAdminTab("roles")}><IconShield size={16} /> Role Permissions</button>
                <button style={adminTab === "chat" ? styles.activeTab : styles.adminTab} onClick={() => setAdminTab("chat")}><IconMessageCircle size={16} /> Chat Settings</button>
                <button style={adminTab === "tasks" ? styles.activeTab : styles.adminTab} onClick={() => setAdminTab("tasks")}><IconClipboard size={16} /> All Tasks</button>
            </div>
            {adminTab === "users" && (
              <div style={styles.adminSection}>
                <div style={{ marginBottom: 28, padding: 24, borderRadius: 12, background: "linear-gradient(135deg, rgba(30, 58, 95, 0.4) 0%, rgba(0, 198, 255, 0.05) 100%)", border: "1px solid rgba(0, 198, 255, 0.2)", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                    <div>
                      <h3 style={{ margin: "0 0 4px 0", color: "#ffffff", fontSize: 18, fontWeight: 600 }}>{editingUserId ? "✏️ Edit User" : "➕ Create New User"}</h3>
                      <p style={{ margin: 0, color: "#888", fontSize: 13 }}>{editingUserId ? "Update user information" : "Add a new team member"}</p>
                    </div>
                  </div>
                  <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
                    <input placeholder="Full Name" value={newUserData.name} onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })} style={{ ...styles.input, fontSize: 14 }} />
                    <input placeholder="Email Address" value={newUserData.email} onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })} style={{ ...styles.input, fontSize: 14 }} />
                    <input type="password" placeholder="Password" value={newUserData.password} onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })} style={{ ...styles.input, fontSize: 14 }} />
                            <input placeholder="Job Title / Designation" value={newUserData.designation} onChange={(e) => setNewUserData({ ...newUserData, designation: e.target.value })} style={{ ...styles.input, fontSize: 14 }} />
                            <input placeholder="Department" value={newUserData.department} onChange={(e) => setNewUserData({ ...newUserData, department: e.target.value })} style={{ ...styles.input, fontSize: 14 }} />
                    <select value={newUserData.role} onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })} style={{ ...styles.input, fontSize: 14 }}>
                      <option value="">-- Select Role --</option>
                      {(roles.length > 0 ? roles : [{ name: "user" }, { name: "manager" }, { name: "cto" }, { name: "admin" }]).map((role: any) => <option key={role.name} value={role.name}>{role.name.charAt(0).toUpperCase() + role.name.slice(1)}</option>)}
                    </select>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, gridColumn: "span 1" }}>
                      <label style={{ color: "#888", fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>📷 Profile Picture</label>
                      <input type="file" accept="image/*" onChange={handleNewUserPhotoUpload} style={{ ...styles.input, padding: "8px 12px", height: "auto", fontSize: 13 }} />
                    </div>
                  </div>
                  {newUserData.profilePicture && (
                    <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(0, 198, 255, 0.1)" }}>
                      <p style={{ margin: "0 0 8px 0", color: "#888", fontSize: 12, fontWeight: 500 }}>Preview</p>
                      <img src={newUserData.profilePicture} alt="preview" style={{ width: 70, height: 70, borderRadius: 8, objectFit: "cover", border: "2px solid rgba(0, 198, 255, 0.3)" }} />
                    </div>
                  )}
                  <div style={{ marginTop: 18, display: "flex", gap: 10 }}>
                    <button style={{ padding: "9px 20px", borderRadius: 6, background: "linear-gradient(135deg, #00c6ff 0%, #0099cc 100%)", color: "#000", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 8px rgba(0, 198, 255, 0.3)", transition: "all 0.3s" }} onMouseOver={(e) => (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 198, 255, 0.5)")} onMouseOut={(e) => (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 198, 255, 0.3)")} onClick={editingUserId ? saveAdminUser : createAdminUser}>{editingUserId ? "💾 Save" : "✓ Create"}</button>
                    {editingUserId && (
                      <button style={{ padding: "9px 20px", borderRadius: 6, background: "rgba(255, 255, 255, 0.1)", color: "#ccc", border: "1px solid rgba(255, 255, 255, 0.2)", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.3s" }} onMouseOver={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)"; }} onMouseOut={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)"; }} onClick={() => { setEditingUserId(null); setNewUserData({ name: "", email: "", password: "", role: "user", designation: "", department: "", profilePicture: "" }); }}>✕ Cancel</button>
                    )}
                  </div>
                </div>
                <div style={styles.adminGrid}>
                  {adminUsers.length === 0 ? <div>No users found.</div> : adminUsers.map((user) => (
                    <div key={user._id || user.email} style={styles.adminCard}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#1e3a5f", border: "2px solid #00c6ff", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {user.profilePicture ? <img src={user.profilePicture} alt="pfp" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ color: "#00c6ff", fontWeight: 700 }}>{(user.name || "?")[0]}</span>}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 600 }}>{user.name}</p>
                          <p style={{ margin: 0, fontSize: 12, color: "#aaa" }}>{user.email}</p>
                        </div>
                      </div>
                      <p style={{ margin: "4px 0", fontSize: 13 }}><strong>Role:</strong> {user.role}</p>
                      {user.designation && <p style={{ margin: "4px 0", fontSize: 13 }}><strong>Designation:</strong> {user.designation}</p>}
                      {user.role === "user" && (
                        <div style={{ marginTop: 12, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 8 }}>
                          <p style={{ fontSize: 13, fontWeight: "bold", marginBottom: 6, color: "#00c6ff" }}>Permissions</p>
                          <label style={{ display: "flex", alignItems: "center", gap: 8, margin: "6px 0", cursor: "pointer", fontSize: 13 }}>
                            <input type="checkbox" checked={!!user.canUpdateTasks} onChange={() => toggleUserPermission(user._id, "updateTask", !!user.canUpdateTasks)} style={{ cursor: "pointer" }} /> Can Update Tasks
                          </label>
                          <label style={{ display: "flex", alignItems: "center", gap: 8, margin: "6px 0", cursor: "pointer", fontSize: 13 }}>
                            <input type="checkbox" checked={!!user.canDeleteTasks} onChange={() => toggleUserPermission(user._id, "deleteTask", !!user.canDeleteTasks)} style={{ cursor: "pointer" }} /> Can Delete Tasks
                          </label>
                          <div style={{ marginTop: 10 }}>
                            <label style={{ fontSize: 13, fontWeight: "bold", color: "#ccc" }}>Assign Manager</label>
                            <select style={{ width: "100%", padding: "8px", marginTop: 6, borderRadius: 6, background: "#1e2a3a", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }} value={user.managerId ? user.managerId.toString() : ""} onChange={(e) => { const v = e.target.value || null; const manager = adminUsers.find(u => u._id === v); const msg = v ? `Assign ${manager?.name || manager?.email || "this manager"} to ${user.name}?` : `Unassign manager from ${user.name}?`; confirmDialog(msg).then(ok => { if (ok) assignManagerToUser(user._id, v); }); }}>
                              <option value="">-- Unassigned --</option>
                              {adminUsers.filter(u => u.role === "manager").map(m => <option key={m._id} value={m._id}>{m.name} ({m.email})</option>)}
                            </select>
                          </div>
                        </div>
                      )}
                      {user.role === "manager" && (
                        <div style={{ marginTop: 12, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 8 }}>
                          <label style={{ fontSize: 13, fontWeight: "bold", color: "#ccc" }}>Assign CTO</label>
                          <select style={{ width: "100%", padding: "8px", marginTop: 6, borderRadius: 6, background: "#1e2a3a", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }} value={user.ctoId ? user.ctoId.toString() : ""} onChange={(e) => { const v = e.target.value || null; const cto = adminUsers.find(u => u._id === v); const msg = v ? `Assign ${cto?.name || cto?.email || "this CTO"} to ${user.name}?` : `Unassign CTO from ${user.name}?`; confirmDialog(msg).then(ok => { if (ok) assignCtoToManager(user._id, v); }); }}>
                            <option value="">-- Unassigned --</option>
                            {adminUsers.filter(u => u.role === "cto").map(c => <option key={c._id} value={c._id}>{c.name} ({c.email})</option>)}
                          </select>
                        </div>
                      )}
                      <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                        <button style={{ ...styles.button, background: "#4f46e5", padding: "8px 12px", width: "auto", marginTop: 0, display: "inline-flex", alignItems: "center", gap: 8 }} onClick={() => loadUserForEdit(user)}><IconEdit size={16} /> Edit</button>
                        <button style={{ ...styles.button, background: "#ef4444", padding: "8px 12px", width: "auto", marginTop: 0, display: "inline-flex", alignItems: "center", gap: 8 }} onClick={() => deleteUser(user._id)}><IconTrash size={16} /> Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Assignment Logs */}
                <div style={{ marginTop: 24 }}>
                  <h3 style={{ marginBottom: 8 }}>Recent Assignment Logs</h3>
                  {assignmentLogs.length === 0 ? <div style={{ color: "#999" }}>No recent assignment activity.</div> : (
                    <div>
                      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                        <button onClick={() => fetchAssignmentLogs(logsPage - 1)} disabled={logsPage <= 1} style={styles.paginationBtn}>Prev</button>
                        <button onClick={() => fetchAssignmentLogs(logsPage + 1)} disabled={logsPage * logsLimit >= logsTotal} style={styles.paginationBtn}>Next</button>
                        <div style={{ color: "#aaa", alignSelf: "center" }}>Page {logsPage} / {Math.max(1, Math.ceil(logsTotal / logsLimit))}</div>
                        <div style={{ flex: 1 }} />
                        <button onClick={exportAssignmentLogs} style={styles.paginationBtn}>Export CSV</button>
                      </div>
                      <div style={{ maxHeight: 220, overflow: "auto", background: "#0f1720", padding: 10, borderRadius: 8 }}>
                        {assignmentLogs.map((log: any) => (
                          <div key={log._id} style={{ padding: 8, borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                            <div style={{ fontSize: 13 }}>[{new Date(log.createdAt).toLocaleString()}] <strong>{log.action}</strong></div>
                            <div style={{ fontSize: 13, color: "#ccc" }}>By: {log.actorId?.name || log.actorId?.email} to Target: {log.targetId?.name || log.targetId?.email}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Pending Tab */}
            {adminTab === "chat" && (
              <div style={styles.adminSection}>
                <h2>Chat Settings</h2>
                <div style={{ display: "grid", gap: 16, marginBottom: 24, background: "rgba(255,255,255,0.04)", padding: 24, borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)" }}>
                  <p style={{ color: "#ccc", margin: 0 }}>Control which roles can message each other and whether department chat and bot chat are enabled.</p>
                  <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 15, cursor: "pointer" }}>
                    <input type="checkbox" checked={chatConfig?.usersCanChatWithManagers} onChange={(e) => setChatConfig((prev: any) => ({ ...prev, usersCanChatWithManagers: e.target.checked }))} />
                    <span>Allow users to chat with managers</span>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 15, cursor: "pointer" }}>
                    <input type="checkbox" checked={chatConfig?.usersCanChatWithCtos} onChange={(e) => setChatConfig((prev: any) => ({ ...prev, usersCanChatWithCtos: e.target.checked }))} />
                    <span>Allow users to chat with CTOs</span>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 15, cursor: "pointer" }}>
                    <input type="checkbox" checked={chatConfig?.usersCanChatWithCfos} onChange={(e) => setChatConfig((prev: any) => ({ ...prev, usersCanChatWithCfos: e.target.checked }))} />
                    <span>Allow users to chat with CFOs</span>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 15, cursor: "pointer" }}>
                    <input type="checkbox" checked={chatConfig?.managersCanChatWithCtos} onChange={(e) => setChatConfig((prev: any) => ({ ...prev, managersCanChatWithCtos: e.target.checked }))} />
                    <span>Allow managers to chat with CTOs</span>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 15, cursor: "pointer" }}>
                    <input type="checkbox" checked={chatConfig?.departmentChatEnabled} onChange={(e) => setChatConfig((prev: any) => ({ ...prev, departmentChatEnabled: e.target.checked }))} />
                    <span>Enable department chat and department bot</span>
                  </label>
                </div>
                <button style={{ ...styles.button, width: "auto", padding: "12px 24px" }} onClick={() => updateAdminChatConfig({ usersCanChatWithManagers: chatConfig?.usersCanChatWithManagers, usersCanChatWithCtos: chatConfig?.usersCanChatWithCtos, usersCanChatWithCfos: chatConfig?.usersCanChatWithCfos, managersCanChatWithCtos: chatConfig?.managersCanChatWithCtos, departmentChatEnabled: chatConfig?.departmentChatEnabled })}>Save Chat Settings</button>
              </div>
            )}

            {adminTab === "pending" && (
              <div style={styles.adminSection}>
                <h2>Pending Requests</h2>
                <div style={styles.adminGrid}>
                  {pendingRequests.length === 0 ? <div>No pending requests found.</div> : pendingRequests.map((request) => (
                    <div key={request._id || request.email} style={styles.adminCard}>
                      <p><strong>Name:</strong> {request.name}</p>
                      <p><strong>Email:</strong> {request.email}</p>
                      <p><strong>Role:</strong> {request.role}</p>
                      <p><strong>Requested At:</strong> {new Date(request.createdAt).toLocaleString()}</p>
                      <div style={{ display: "flex", gap: 10, marginTop: 15 }}>
                        <button style={{ flex: 1, padding: 10, background: "linear-gradient(to right,#00c6ff,#0072ff)", color: "white", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: "bold", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={() => approvePendingRequest(request._id)}><IconCheck size={16} /> Approve</button>
                        <button style={{ flex: 1, padding: 10, background: "#ef4444", color: "white", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: "bold", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={() => rejectPendingRequest(request._id)}><IconTrash size={16} /> Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Roles Tab */}
            {adminTab === "roles" && (
              <div style={styles.adminSection}>
                <h2>Role Permissions</h2>
                <div style={{ display: "grid", gap: 16, marginBottom: 20 }}>
                  <p style={{ color: "#ccc", margin: "0 0 8px 0" }}>Select a Role to Manage Permissions:</p>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
                    {(roles.length > 0 ? roles : ["user", "manager", "cto", "admin"].map(n => ({ name: n }))).map((role: any) => (
                      <button key={role.name} onClick={() => { setSelectedRoleForRoleSettings(role.name); const r = roles.find(x => x.name === role.name); if (r) setRolePermissionUpdates({ canUpdateTasks: r.canUpdateTasks, canDeleteTasks: r.canDeleteTasks, canUpdateUsers: r.canUpdateUsers, canDeleteUsers: r.canDeleteUsers }); }} style={{ padding: "10px 20px", borderRadius: 24, border: selectedRoleForRoleSettings === role.name ? "2px solid #00c6ff" : "1px solid rgba(255,255,255,0.2)", background: selectedRoleForRoleSettings === role.name ? "rgba(0,198,255,0.2)" : "rgba(255,255,255,0.05)", color: "#fff", cursor: "pointer", fontWeight: "bold", transition: "all 0.2s" }}>{role.name.toUpperCase()}</button>
                    ))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 20, background: "rgba(255,255,255,0.05)", padding: 20, borderRadius: 16 }}>
                    {[["canUpdateTasks", "Can Update Tasks", "#00c6ff"], ["canDeleteTasks", "Can Delete Tasks", "#ef4444"], ["canUpdateUsers", "Can Update Users", "#ccc"], ["canDeleteUsers", "Can Delete Users", "#ccc"]].map(([key, label, color]) => (
                      <label key={key} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 15 }}>
                        <input type="checkbox" checked={(rolePermissionUpdates as any)[key]} onChange={(e) => setRolePermissionUpdates((prev) => ({ ...prev, [key]: e.target.checked }))} style={{ width: 18, height: 18, cursor: "pointer" }} />
                        <span style={{ color }}>{label}</span>
                      </label>
                    ))}
                  </div>
                  <button style={{ ...styles.button, width: "auto", alignSelf: "start", padding: "12px 24px" }} onClick={updateRolePermissions}>Save Role Permissions</button>
                </div>
                <div style={{ padding: 20, borderRadius: 16, background: "rgba(255,255,255,0.06)" }}>
                  <h3>Create New Role</h3>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                    <input value={roleCreateName} onChange={(e) => setRoleCreateName(e.target.value)} placeholder="Role name" style={{ ...styles.input, flex: 1, marginTop: 0 }} />
                    <button style={{ ...styles.button, width: "auto", marginTop: 0 }} onClick={createRole}>Create Role</button>
                  </div>
                </div>
              </div>
            )}

            {/* Admin Tasks Tab */}
            {adminTab === "tasks" && (
              <div style={styles.adminSection}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h2 style={{ margin: 0 }}>All Tasks</h2>
                  <button style={{ ...styles.button, width: "auto", padding: "10px 20px", marginTop: 0, display: "inline-flex", alignItems: "center", gap: 8 }} onClick={() => { setEditingTaskId(null); setTaskData({ title: "", description: "", dueDate: "", priority: "low", status: "open", thumbnail: "", userId: "" }); setCurrentPage("add-task"); }}><IconPlus size={16} /> Add Task</button>
                </div>
                {adminTasks.length === 0 ? <div>No tasks available.</div> : (
                  <>
                    <div style={styles.taskGrid}>
                      {pagedAdminTasks.map((task) => (
                        <TaskCard key={task._id} task={task} showUser onEdit={() => loadTaskForEdit(task)} onDelete={() => deleteTask(task._id)} />
                      ))}
                    </div>
                    {adminTasks.length > TASKS_PER_PAGE && <PaginationBar page={adminTasksPage} total={totalAdminPages} onPrev={() => setAdminTasksPage((p) => Math.max(1, p - 1))} onNext={() => setAdminTasksPage((p) => Math.min(totalAdminPages, p + 1))} />}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Manager Panel ── */}
        {currentPage === "manager" && isManager && (
          <div style={styles.adminSection}>
            <h2>Manager Panel - Managed Users</h2>
            <p style={{ color: "#aaa", marginBottom: 20 }}>Users reporting to you. You can manage their task permissions.</p>
            <div style={styles.adminGrid}>
              {adminUsers.filter(u => u.managerId?._id === currentUser?._id || u.managerId === currentUser?._id).length === 0
                ? <div style={{ color: "#aaa" }}>No managed users found.</div>
                : adminUsers.filter(u => u.managerId?._id === currentUser?._id || u.managerId === currentUser?._id).map((user) => (
                  <div key={user._id || user.email} style={styles.adminCard}>
                    <p><strong>Name:</strong> {user.name}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Designation:</strong> {user.designation || "Employee"}</p>
                    <div style={{ marginTop: 12, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 8 }}>
                      <p style={{ fontSize: 13, fontWeight: "bold", marginBottom: 6, color: "#00c6ff" }}>User Permissions</p>
                      <label style={{ display: "flex", alignItems: "center", gap: 8, margin: "6px 0", cursor: "pointer", fontSize: 13 }}><input type="checkbox" checked={!!user.canUpdateTasks} onChange={() => toggleUserPermission(user._id, "updateTask", !!user.canUpdateTasks)} style={{ cursor: "pointer" }} /> Can Update Tasks</label>
                      <label style={{ display: "flex", alignItems: "center", gap: 8, margin: "6px 0", cursor: "pointer", fontSize: 13 }}><input type="checkbox" checked={!!user.canDeleteTasks} onChange={() => toggleUserPermission(user._id, "deleteTask", !!user.canDeleteTasks)} style={{ cursor: "pointer" }} /> Can Delete Tasks</label>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ── CTO Panel ── */}
        {currentPage === "cto" && isCto && (
          <div style={styles.adminSection}>
            <h2>CTO Panel - Organization Overview</h2>
            <h3 style={{ marginTop: 20, marginBottom: 12, color: "#00c6ff" }}>Managed Managers</h3>
            <div style={styles.adminGrid}>
              {adminUsers.filter(u => u.role === "manager" && (u.ctoId?._id === currentUser?._id || u.ctoId === currentUser?._id)).length === 0
                ? <div style={{ color: "#aaa" }}>No assigned managers found.</div>
                : adminUsers.filter(u => u.role === "manager" && (u.ctoId?._id === currentUser?._id || u.ctoId === currentUser?._id)).map((user) => (
                  <div key={user._id || user.email} style={styles.adminCard}>
                    <p><strong>Name:</strong> {user.name}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Designation:</strong> {user.designation || "Manager"}</p>
                  </div>
                ))}
            </div>
            <h3 style={{ marginTop: 30, marginBottom: 12, color: "#00c6ff" }}>All Organization Users</h3>
            <div style={styles.adminGrid}>
              {adminUsers.filter(u => u.role !== "admin").length === 0
                ? <div style={{ color: "#aaa" }}>No users found.</div>
                : adminUsers.filter(u => u.role !== "admin").map((user) => (
                  <div key={user._id || user.email} style={styles.adminCard}>
                    <p><strong>Name:</strong> {user.name}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Role:</strong> {user.role.toUpperCase()}</p>
                    <p><strong>Designation:</strong> {user.designation || "N/A"}</p>
                    <div style={{ marginTop: 12, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 8 }}>
                      <p style={{ fontSize: 13, fontWeight: "bold", marginBottom: 6, color: "#00c6ff" }}>Permissions</p>
                      <label style={{ display: "flex", alignItems: "center", gap: 8, margin: "6px 0", cursor: "pointer", fontSize: 13 }}><input type="checkbox" checked={!!user.canUpdateTasks} onChange={() => toggleUserPermission(user._id, "updateTask", !!user.canUpdateTasks)} style={{ cursor: "pointer" }} /> Can Update Tasks</label>
                      <label style={{ display: "flex", alignItems: "center", gap: 8, margin: "6px 0", cursor: "pointer", fontSize: 13 }}><input type="checkbox" checked={!!user.canDeleteTasks} onChange={() => toggleUserPermission(user._id, "deleteTask", !!user.canDeleteTasks)} style={{ cursor: "pointer" }} /> Can Delete Tasks</label>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: any = {
  authContainer: {
    display: "flex", justifyContent: "center", alignItems: "center",
    minHeight: "100vh", background: "linear-gradient(135deg,#0f0c29,#302b63,#24243e)",
  },
  authCard: {
    background: "rgba(255,255,255,0.08)", backdropFilter: "blur(12px)",
    padding: "40px", borderRadius: "20px", width: "420px", color: "white",
    border: "1px solid rgba(255,255,255,0.12)",
  },
  heading: { textAlign: "center", marginBottom: "20px", fontSize: 28, fontWeight: 700 },
  dashboard: {
    minHeight: "100vh", padding: "24px 32px",
    background: "linear-gradient(135deg,#0f0c29,#302b63,#24243e)", color: "white",
  },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    paddingBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  dashboardTitle: { fontSize: "28px", fontWeight: 700 },
  logoutButton: {
    background: "linear-gradient(to right,#ef4444,#dc2626)", color: "white",
    border: "none", padding: "10px 20px", borderRadius: "10px", cursor: "pointer", fontWeight: 600,
  },
  adminPanel: { marginTop: "20px" },
  adminTabs: { display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" },
  adminTab: {
    padding: "10px 18px", background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.1)", color: "white", borderRadius: "10px", cursor: "pointer", fontSize: 13,
  },
  activeTab: {
    padding: "10px 18px", background: "linear-gradient(to right,#00c6ff,#0072ff)",
    border: "none", color: "white", borderRadius: "10px", cursor: "pointer", fontWeight: 700, fontSize: 13,
  },
  adminSection: {
    background: "rgba(255,255,255,0.06)", backdropFilter: "blur(12px)",
    padding: "28px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.08)",
  },
  adminGrid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: "16px", marginTop: 16,
  },
  adminCard: {
    background: "rgba(255,255,255,0.05)", padding: "18px", borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.07)",
  },
  label: { display: "block", fontSize: 13, fontWeight: 600, color: "#aaa", marginBottom: 4 },
  input: {
    width: "100%", padding: "12px 14px", marginTop: "8px",
    borderRadius: "10px", border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.08)", color: "#fff", fontSize: 14,
    outline: "none", boxSizing: "border-box",
  },
  button: {
    width: "100%", padding: "13px", marginTop: "14px",
    background: "linear-gradient(to right,#00c6ff,#0072ff)",
    color: "white", border: "none", borderRadius: "10px", cursor: "pointer",
    fontSize: "15px", fontWeight: 600, transition: "opacity 0.2s",
  },
  switchButton: { marginTop: "15px", background: "none", border: "none", color: "#00c6ff", cursor: "pointer", display: "block", width: "100%", textAlign: "center", fontSize: 14 },
  recentTitle: { marginTop: "12px", marginBottom: "16px", fontSize: 22, fontWeight: 700 },
  taskGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: "20px" },
  taskCard: {
    background: "rgba(255,255,255,0.07)", backdropFilter: "blur(10px)",
    padding: "20px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.08)",
    transition: "transform 0.2s",
  },
  thumbnail: { width: "100%", height: "160px", objectFit: "cover", borderRadius: "10px", marginBottom: "12px" },
  paginationBtn: {
    padding: "7px 14px", borderRadius: 8, background: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.15)", color: "#fff", cursor: "pointer", fontSize: 13,
  },
  deleteButton: {
    width: "100%", padding: "10px", marginTop: "15px", background: "red",
    color: "white", border: "none", borderRadius: "10px", cursor: "pointer",
  },
};

export default App;