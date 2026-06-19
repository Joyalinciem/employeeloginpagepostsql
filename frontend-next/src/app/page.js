"use client";

import { useState, useEffect, useRef } from "react";

// ─── SVG Icons ──────────────────────────────────────────────────────────────
function IconBell({ size = 16, color = "currentColor" }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function IconCheck({ size = 16, color = "currentColor" }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconAlert({ size = 16, color = "currentColor" }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function IconShield({ size = 20, color = "currentColor" }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function IconKey({ size = 20, color = "currentColor" }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.778-7.778zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  );
}

function IconBarChart({ size = 20, color = "currentColor" }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function IconTrash({ size = 14, color = "currentColor" }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function IconPlus({ size = 16, color = "currentColor" }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconClock({ size = 16, color = "currentColor" }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export default function Home() {
  // Toast notifications state
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  const addToast = (message, type = "info") => {
    const id = toastIdRef.current++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Kanban Tasks list state (customized for Marketing Campaigns)
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: "Draft Q3 Social Copy",
      desc: "Write Facebook/Instagram ad copies focusing on benefits.",
      status: "open",
      priority: "medium",
      actor: "COPYWRITER"
    },
    {
      id: 2,
      title: "Design Summer Banner Assets",
      desc: "Create 3 visual layout banner designs for the summer sale campaign.",
      status: "in progress",
      priority: "high",
      actor: "DESIGNER"
    },
    {
      id: 3,
      title: "Dispatch Promo Newsletter",
      desc: "Schedule and broadcast promo email campaign to subscriber list.",
      status: "completed",
      priority: "low",
      actor: "MANAGER"
    }
  ]);

  // Kanban Form State
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("medium");

  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask = {
      id: Date.now(),
      title: newTaskTitle,
      desc: "User created campaign simulation task with custom access logs.",
      status: "open",
      priority: newTaskPriority,
      actor: selectedRole.toUpperCase()
    };

    setTasks((prev) => [...prev, newTask]);
    setNewTaskTitle("");
    addToast(`Campaign Task "${newTask.title}" added to To Do list by ${newTask.actor}!`, "success");
  };

  const handleMoveTask = (taskId, direction) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === taskId) {
          let nextStatus = task.status;
          if (task.status === "open" && direction === "next") nextStatus = "in progress";
          else if (task.status === "in progress" && direction === "next") nextStatus = "completed";
          else if (task.status === "in progress" && direction === "prev") nextStatus = "open";
          else if (task.status === "completed" && direction === "prev") nextStatus = "in progress";

          if (nextStatus !== task.status) {
            addToast(`Shifted "${task.title}" to ${nextStatus.toUpperCase()}!`, "info");
          }
          return { ...task, status: nextStatus };
        }
        return task;
      })
    );
  };

  const handleDeleteTask = (taskId, taskTitle) => {
    // Check RBAC permissions for DELETE action
    if (rbacPermissions[selectedRole].delete === "DENIED") {
      addToast(`Access Denied: Role ${selectedRole.toUpperCase()} cannot remove campaign tasks!`, "error");
      return;
    }
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
    addToast(`Campaign Task "${taskTitle}" deleted by ${selectedRole.toUpperCase()}!`, "success");
  };

  // RBAC Simulator State (Marketing Roles)
  const [selectedRole, setSelectedRole] = useState("cmo");

  const rbacPermissions = {
    cmo: {
      create: "ALLOWED",
      update: "ALLOWED",
      delete: "ALLOWED",
      publish: "ALLOWED",
      logs: "ALLOWED",
    },
    manager: {
      create: "ALLOWED",
      update: "ALLOWED",
      delete: "ALLOWED",
      publish: "DENIED",
      logs: "ALLOWED",
    },
    designer: {
      create: "ALLOWED",
      update: "ALLOWED",
      delete: "DENIED",
      publish: "DENIED",
      logs: "DENIED",
    },
    copywriter: {
      create: "ALLOWED",
      update: "DENIED",
      delete: "DENIED",
      publish: "DENIED",
      logs: "DENIED",
    },
  };

  // Listen to role switch and trigger toast alerts
  const handleRoleChange = (role) => {
    setSelectedRole(role);
    addToast(`Active Marketing role switched to: ${role.toUpperCase()}`, "info");
  };

  // Campaign Sandbox State
  const [campaignName, setCampaignName] = useState("Summer Launch 2026");
  const [mfaSent, setMfaSent] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [terminalLogs, setTerminalLogs] = useState([
    { type: "info", text: "MarketFlow Secure Deployment Console Ready." },
    { type: "info", text: "Enter a campaign name to test the secure launch flow." },
  ]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState(null);

  const addLog = (type, text) => {
    setTerminalLogs((prev) => [...prev, { type, text }]);
  };

  const handleSendCode = (e) => {
    e.preventDefault();
    if (!campaignName) {
      addLog("error", "Error: Campaign name is required.");
      return;
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
    setMfaSent(true);
    setVerifySuccess(null);
    setInputCode("");

    addLog("accent", `[SYSTEM] Preparing secure launch environment for "${campaignName}"...`);
    setTimeout(() => {
      addLog("info", `[ASSETS] Checking campaign banner design assets... OK`);
    }, 300);
    setTimeout(() => {
      addLog("info", `[SEO] Checking social media copy metadata density... OK`);
    }, 600);
    setTimeout(() => {
      addLog("success", `[MFA] CMO security authorization token dispatched.`);
      addLog("success", `→ CMO VERIFICATION CODE TO LAUNCH IS: ${code}`);
      addToast(`Secure launch authorization code generated for CMO.`, "success");
    }, 1000);
  };

  const handleVerifyCode = (e) => {
    e.preventDefault();
    if (inputCode.length !== 6) {
      addLog("error", "Error: OTP code must be exactly 6 digits.");
      return;
    }
    setIsVerifying(true);
    addLog("accent", `[SECURITY] Validating CMO release token ${inputCode}...`);

    setTimeout(() => {
      if (inputCode === generatedCode) {
        setVerifySuccess(true);
        addLog("success", `[SECURITY] Token matches signature checksum.`);
        addLog("success", `[DEPLOY] Dispatching campaign "${campaignName}" live to marketing APIs...`);
        addLog("success", `[SYSTEM] Campaign pushed successfully! Session archived.`);
        addToast(`Campaign "${campaignName}" is now live!`, "success");
      } else {
        setVerifySuccess(false);
        addLog("error", `[SECURITY] Release rejected. Incorrect authorization token.`);
        addToast(`Launch code verification failed! Check terminal logs.`, "error");
      }
      setIsVerifying(false);
    }, 1200);
  };

  return (
    <>
      {/* Background Ambient Aura */}
      <div
        className="glow-ambient"
        style={{
          top: "10%",
          left: "10%",
          width: "450px",
          height: "450px",
          backgroundColor: "#ff2a85"
        }}
      />
      <div
        className="glow-ambient"
        style={{
          top: "50%",
          right: "5%",
          width: "550px",
          height: "550px",
          backgroundColor: "#00f5ff"
        }}
      />

      {/* Floating Toast Notification Hub */}
      <div className="notification-toast-container">
        {toasts.map((toast) => {
          const renderToastIcon = () => {
            switch (toast.type) {
              case "success": return <IconCheck size={18} color="#10b981" />;
              case "error": return <IconAlert size={18} color="#ef4444" />;
              default: return <IconBell size={18} color="#00f5ff" />;
            }
          };
          return (
            <div key={toast.id} className="notification-toast">
              <span className="toast-icon" style={{ display: "inline-flex", flexShrink: 0 }}>
                {renderToastIcon()}
              </span>
              <div>{toast.message}</div>
            </div>
          );
        })}
      </div>

      {/* Navigation Header */}
      <header className="navbar">
        <div className="container navbar-inner">
          <a href="#" className="logo">
            <div className="logo-dot" />
            MarketFlow
          </a>
          <nav>
            <ul className="nav-links">
              <li><a href="#features" className="nav-link">Campaign Tech</a></li>
              <li><a href="#rbac" className="nav-link">Marketing Roles</a></li>
              <li><a href="#workspace" className="nav-link">Creative Board</a></li>
              <li><a href="#sandbox" className="nav-link">Release Sandbox</a></li>
            </ul>
          </nav>
          <div className="nav-actions">
            <a href="#workspace" className="btn btn-secondary">Workspace Demo</a>
            <a href="#sandbox" className="btn btn-primary">Launch Campaign</a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="container hero-layout">
          <div className="hero-content">
            <div className="hero-badge">
              <div className="hero-badge-dot" />
              Marketing Campaign Organizer Active
            </div>
            <h1 className="hero-title">
              <span className="gradient-text">Marketing Flow.</span> <br />
              Campaigns, Collaborated.
            </h1>
            <p className="hero-subtitle">
              MarketFlow organizes content copywriting, banner graphic design, and social media releases, fortified by CMO-level authorization checks.
            </p>
            <div className="hero-buttons">
              <a href="#workspace" className="btn btn-primary">Open Campaign Board</a>
              <a href="#sandbox" className="btn btn-secondary">Try Launch Simulator</a>
            </div>
          </div>

          <div className="hero-mockup-wrapper">
            <div className="hero-mockup">
              <div className="mockup-header">
                <div className="mockup-dots">
                  <div className="mockup-dot" />
                  <div className="mockup-dot" />
                  <div className="mockup-dot" />
                </div>
                <div className="mockup-title">campaign_schedule.py</div>
                <span className="badge-status badge-completed">Sync Active</span>
              </div>
              <div className="mockup-body">
                <div className="mockup-row">
                  <div className="mockup-task-info">
                    <span className="mockup-task-title">Draft Q3 Social Copy</span>
                    <span className="mockup-task-desc">Assigned to Content Writer</span>
                  </div>
                  <span className="badge-status badge-open">open</span>
                </div>
                <div className="mockup-row">
                  <div className="mockup-task-info">
                    <span className="mockup-task-title">Design Summer Banner Assets</span>
                    <span className="mockup-task-desc">Assigned to Graphic Designer</span>
                  </div>
                  <span className="badge-status badge-progress">in progress</span>
                </div>
                <div className="mockup-row">
                  <div className="mockup-task-info">
                    <span className="mockup-task-title">Schedule Newsletter Dispatch</span>
                    <span className="mockup-task-desc">Assigned to Campaign Manager</span>
                  </div>
                  <span className="badge-status badge-completed">completed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Kanban Board Section */}
      <section id="workspace" className="section kanban-section" style={{ borderTop: "1px solid var(--border-color)" }}>
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Animated Workspace</span>
            <h2 className="section-title">Creative Campaign Board</h2>
            <p className="section-desc">
              Organize marketing tasks in real time. Move copy drafts, creative assets, and newsletter dispatches between columns. Test deleting tasks using your current simulation role (<strong>{selectedRole.toUpperCase()}</strong>).
            </p>
          </div>

          {/* Kanban Board Layout */}
          <div className="kanban-board">
            {/* Column 1: To Do */}
            <div className="kanban-col">
              <div className="kanban-col-header">
                <span className="kanban-col-title">
                  <span style={{ color: "var(--secondary)" }}>●</span> To Do
                </span>
                <span className="kanban-col-count">
                  {tasks.filter((t) => t.status === "open").length}
                </span>
              </div>
              <div className="kanban-card-list">
                {tasks
                  .filter((t) => t.status === "open")
                  .map((task) => (
                    <div key={task.id} className="kanban-card">
                      <div className="kanban-card-header">
                        <span className={`kanban-card-tag priority-${task.priority}`}>
                          {task.priority}
                        </span>
                        <button
                          onClick={() => handleDeleteTask(task.id, task.title)}
                          className="kanban-card-btn"
                          style={{ border: "none", color: "var(--danger)", padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                          title="Delete task (requires CMO/Manager permissions)"
                        >
                          <IconTrash size={12} color="var(--danger)" />
                        </button>
                      </div>
                      <div className="kanban-card-title">{task.title}</div>
                      <div className="kanban-card-desc">{task.desc}</div>
                      <div className="kanban-card-footer">
                        <span>By: {task.actor}</span>
                        <div className="kanban-card-actions">
                          <button
                            onClick={() => handleMoveTask(task.id, "next")}
                            className="kanban-card-btn"
                          >
                            Assign →
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Column 2: In Progress */}
            <div className="kanban-col">
              <div className="kanban-col-header">
                <span className="kanban-col-title">
                  <span style={{ color: "var(--warning)" }}>●</span> In Progress
                </span>
                <span className="kanban-col-count">
                  {tasks.filter((t) => t.status === "in progress").length}
                </span>
              </div>
              <div className="kanban-card-list">
                {tasks
                  .filter((t) => t.status === "in progress")
                  .map((task) => (
                    <div key={task.id} className="kanban-card">
                      <div className="kanban-card-header">
                        <span className={`kanban-card-tag priority-${task.priority}`}>
                          {task.priority}
                        </span>
                        <button
                          onClick={() => handleDeleteTask(task.id, task.title)}
                          className="kanban-card-btn"
                          style={{ border: "none", color: "var(--danger)", padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          <IconTrash size={12} color="var(--danger)" />
                        </button>
                      </div>
                      <div className="kanban-card-title">{task.title}</div>
                      <div className="kanban-card-desc">{task.desc}</div>
                      <div className="kanban-card-footer">
                        <span>By: {task.actor}</span>
                        <div className="kanban-card-actions">
                          <button
                            onClick={() => handleMoveTask(task.id, "prev")}
                            className="kanban-card-btn"
                          >
                            ← Back
                          </button>
                          <button
                            onClick={() => handleMoveTask(task.id, "next")}
                            className="kanban-card-btn"
                          >
                            Approve →
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Column 3: Completed */}
            <div className="kanban-col">
              <div className="kanban-col-header">
                <span className="kanban-col-title">
                  <span style={{ color: "var(--success)" }}>●</span> Completed
                </span>
                <span className="kanban-col-count">
                  {tasks.filter((t) => t.status === "completed").length}
                </span>
              </div>
              <div className="kanban-card-list">
                {tasks
                  .filter((t) => t.status === "completed")
                  .map((task) => (
                    <div key={task.id} className="kanban-card">
                      <div className="kanban-card-header">
                        <span className={`kanban-card-tag priority-${task.priority}`}>
                          {task.priority}
                        </span>
                        <button
                          onClick={() => handleDeleteTask(task.id, task.title)}
                          className="kanban-card-btn"
                          style={{ border: "none", color: "var(--danger)", padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          <IconTrash size={12} color="var(--danger)" />
                        </button>
                      </div>
                      <div className="kanban-card-title">{task.title}</div>
                      <div className="kanban-card-desc">{task.desc}</div>
                      <div className="kanban-card-footer">
                        <span>By: {task.actor}</span>
                        <div className="kanban-card-actions">
                          <button
                            onClick={() => handleMoveTask(task.id, "prev")}
                            className="kanban-card-btn"
                          >
                            ← Edit
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Task Creator Controls */}
          <form onSubmit={handleCreateTask} className="kanban-creator">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Create campaign task title and press Enter..."
              className="kanban-creator-input"
              required
            />
            <select
              value={newTaskPriority}
              onChange={(e) => setNewTaskPriority(e.target.value)}
              className="kanban-creator-select"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
            <button type="submit" className="btn btn-primary" style={{ padding: "10px 20px" }}>
              Add Task
            </button>
          </form>
        </div>
      </section>

      {/* Features Grid & RBAC Section */}
      <section id="features" className="section" style={{ background: "#03050a" }}>
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Campaign Protection</span>
            <h2 className="section-title">Granular Marketing Control</h2>
            <p className="section-desc">
              Organize visual assets, copy drafts, and dispatch channels in complete safety. Prevent unauthorized campaign releases.
            </p>
          </div>

          <div className="features-grid">
            {/* Card 1: RBAC */}
            <div className="feature-card" id="rbac">
              <div className="feature-icon-wrapper"><IconShield size={24} /></div>
              <h3 className="feature-title">Marketing Role Matrix</h3>
              <p className="feature-desc">
                Fine-grained controls. Toggle roles below to preview live permission limits between writers, creative designers, and CMO managers.
              </p>

              <div className="rbac-simulator">
                <div className="rbac-selector">
                  {Object.keys(rbacPermissions).map((role) => (
                    <button
                      key={role}
                      onClick={() => handleRoleChange(role)}
                      className={`rbac-role-btn ${selectedRole === role ? "active" : ""}`}
                      id={`rbac-btn-${role}`}
                    >
                      {role.toUpperCase()}
                    </button>
                  ))}
                </div>
                <div className="rbac-perms-list">
                  <div className="rbac-perm-row">
                    <span className="rbac-perm-name">Create Tasks</span>
                    <span className={`rbac-perm-val ${rbacPermissions[selectedRole].create === "ALLOWED" ? "perm-allowed" : "perm-denied"}`}>
                      {rbacPermissions[selectedRole].create}
                    </span>
                  </div>
                  <div className="rbac-perm-row">
                    <span className="rbac-perm-name">Update Tasks</span>
                    <span className={`rbac-perm-val ${rbacPermissions[selectedRole].update === "ALLOWED" ? "perm-allowed" : "perm-denied"}`}>
                      {rbacPermissions[selectedRole].update}
                    </span>
                  </div>
                  <div className="rbac-perm-row">
                    <span className="rbac-perm-name">Delete Tasks</span>
                    <span className={`rbac-perm-val ${rbacPermissions[selectedRole].delete === "ALLOWED" ? "perm-allowed" : "perm-denied"}`}>
                      {rbacPermissions[selectedRole].delete}
                    </span>
                  </div>
                  <div className="rbac-perm-row">
                    <span className="rbac-perm-name">Publish Campaigns</span>
                    <span className={`rbac-perm-val ${rbacPermissions[selectedRole].publish === "ALLOWED" ? "perm-allowed" : "perm-denied"}`}>
                      {rbacPermissions[selectedRole].publish}
                    </span>
                  </div>
                  <div className="rbac-perm-row">
                    <span className="rbac-perm-name">View ROI Logs</span>
                    <span className={`rbac-perm-val ${rbacPermissions[selectedRole].logs === "ALLOWED" ? "perm-allowed" : "perm-denied"}`}>
                      {rbacPermissions[selectedRole].logs}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: MFA */}
            <div className="feature-card">
              <div className="feature-icon-wrapper"><IconKey size={24} /></div>
              <h3 className="feature-title">CMO Campaign Lock</h3>
              <p className="feature-desc">
                Critical releases require active two-factor authorization code validation to deploy content templates live, blocking hijack attempts.
              </p>
              <div style={{ marginTop: "24px", background: "rgba(255,255,255,0.02)", padding: "16px", borderRadius: "12px", border: "1px dashed var(--border-color)", textAlign: "center" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "8px" }}>Scan code to sync CMO token</span>
                <div style={{ width: "80px", height: "80px", margin: "0 auto", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "6px" }}>
                  <div style={{ width: "68px", height: "68px", background: "repeating-concentric-gradient(black, black 3px, white 3px, white 6px)" }} />
                </div>
              </div>
            </div>

            {/* Card 3: Archiving */}
            <div className="feature-card">
              <div className="feature-icon-wrapper"><IconBarChart size={24} /></div>
              <h3 className="feature-title">Compliance Logging</h3>
              <p className="feature-desc">
                Log timeline history tracking of user updates and publication launches. Export auditing tables as CSV reports for quarterly compliance.
              </p>
              <div style={{ marginTop: "24px", background: "rgba(3, 5, 10, 0.6)", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.05)", padding: "12px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--text-dark)", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "6px", marginBottom: "6px", fontFamily: "monospace" }}>
                  <span>AUDIT</span>
                  <span>ACTOR</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px", fontFamily: "monospace" }}>
                  <span>publish-campaign</span>
                  <span>cmo@market.co</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-muted)", fontFamily: "monospace" }}>
                  <span>approve-banner</span>
                  <span>director@m.co</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Sandbox (Simulated login & MFA flow) */}
      <section id="sandbox" className="section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Interactive Sandbox</span>
            <h2 className="section-title">Simulate Secure Release Approval</h2>
            <p className="section-desc">
              Initiate a secure campaign release pipeline below. Copy the generated authorization code from the security terminal logs and verify publication.
            </p>
          </div>

          <div className="sandbox-card">
            <div className="sandbox-layout">
              {/* Simulator Form controls */}
              <div className="sandbox-controls">
                {!mfaSent ? (
                  <form onSubmit={handleSendCode} className="sandbox-form">
                    <div className="form-group">
                      <label className="form-label" htmlFor="campaign-input">Simulated Campaign Name</label>
                      <input
                        id="campaign-input"
                        type="text"
                        value={campaignName}
                        onChange={(e) => setCampaignName(e.target.value)}
                        className="form-input"
                        placeholder="Summer Sale 2026"
                        required
                      />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: "100%" }} id="send-code-btn">
                      Verify & Request Launch Code
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyCode} className="sandbox-form">
                    <div className="form-group">
                      <label className="form-label" htmlFor="otp-input">Enter CMO Auth Token</label>
                      <input
                        id="otp-input"
                        type="text"
                        value={inputCode}
                        onChange={(e) => setInputCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        className="form-input"
                        placeholder="######"
                        maxLength={6}
                        style={{ letterSpacing: "8px", textAlign: "center", fontSize: "20px" }}
                        required
                        autoFocus
                      />
                    </div>
                    <div style={{ display: "flex", gap: "12px" }}>
                      <button
                        type="button"
                        onClick={() => {
                          setMfaSent(false);
                          addLog("info", "Console reset. Ready to launch another campaign.");
                        }}
                        className="btn btn-secondary"
                        style={{ flex: 1 }}
                        id="reset-sandbox-btn"
                      >
                        Reset
                      </button>
                      <button
                        type="submit"
                        disabled={isVerifying}
                        className="btn btn-primary"
                        style={{ flex: 2 }}
                        id="verify-code-btn"
                      >
                        {isVerifying ? "Publishing..." : "Confirm Release"}
                      </button>
                    </div>
                  </form>
                )}
                {verifySuccess === true && (
                  <div style={{ marginTop: "20px", color: "var(--success)", fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <IconCheck size={16} />
                    <span>Campaign Dispatched Live successfully!</span>
                  </div>
                )}
                {verifySuccess === false && (
                  <div style={{ marginTop: "20px", color: "var(--danger)", fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <IconAlert size={16} />
                    <span>Release Denied. Invalid Authorization token.</span>
                  </div>
                )}
              </div>

              {/* Simulated Terminal Screen */}
              <div className="sandbox-terminal">
                <div className="terminal-header">
                  <div className="terminal-dots">
                    <div className="terminal-dot" />
                    <div className="terminal-dot" />
                    <div className="terminal-dot" />
                  </div>
                  <div className="terminal-title">campaign_release_pipeline</div>
                  <span style={{ fontSize: "9px", color: "var(--success)", background: "rgba(16,185,129,0.1)", padding: "2px 6px", borderRadius: "3px" }}>ONLINE</span>
                </div>
                <div className="terminal-body" id="terminal-body">
                  {terminalLogs.map((log, index) => (
                    <div key={index} className={`terminal-line ${log.type}`}>
                      {log.text}
                    </div>
                  ))}
                  <div className="terminal-line info">
                    cmo-console ~ <span className="cursor-blink" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modern CTA Section */}
      <section className="cta-section" style={{ borderTop: "1px solid var(--border-color)" }}>
        <div className="container">
          <div className="cta-box">
            <h2 className="cta-title">Deploy Marketing Workflows with Confidence</h2>
            <p className="cta-desc">
              Take complete control of your creative timelines. Coordinate designers, content writers, and analytics teams with complete visual security.
            </p>
            <a href="#sandbox" className="btn btn-primary" style={{ padding: "14px 32px", fontSize: "15px" }}>Get Started Securely</a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <a href="#" className="logo">
                <div className="logo-dot" />
                MarketFlow
              </a>
              <p className="footer-brand-desc">
                Organize copywriting, graphic assets, and social campaigns in complete structure and safety.
              </p>
            </div>

            <div className="footer-nav">
              <span className="footer-nav-title">App</span>
              <ul className="footer-nav-links">
                <li><a href="#features" className="footer-nav-link">Campaign Tech</a></li>
                <li><a href="#rbac" className="footer-nav-link">Role Permissions</a></li>
                <li><a href="#workspace" className="footer-nav-link">Creative Board</a></li>
                <li><a href="#sandbox" className="footer-nav-link">Release Console</a></li>
              </ul>
            </div>

            <div className="footer-nav">
              <span className="footer-nav-title">Integrations</span>
              <ul className="footer-nav-links">
                <li><a href="#" className="footer-nav-link">Instagram Ads</a></li>
                <li><a href="#" className="footer-nav-link">Google Ads</a></li>
                <li><a href="#" className="footer-nav-link">Mailchimp Sync</a></li>
                <li><a href="#" className="footer-nav-link">Slack Alerts</a></li>
              </ul>
            </div>

            <div className="footer-nav">
              <span className="footer-nav-title">Company</span>
              <ul className="footer-nav-links">
                <li><a href="#" className="footer-nav-link">About MarketFlow</a></li>
                <li><a href="#" className="footer-nav-link">Creative blog</a></li>
                <li><a href="#" className="footer-nav-link">Contact Sales</a></li>
                <li><a href="#" className="footer-nav-link">Privacy Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} MarketFlow Inc. All rights reserved.</span>
            <div className="footer-socials">
              <a href="#" className="footer-social-link">Twitter</a>
              <a href="#" className="footer-social-link">GitHub</a>
              <a href="#" className="footer-social-link">LinkedIn</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
