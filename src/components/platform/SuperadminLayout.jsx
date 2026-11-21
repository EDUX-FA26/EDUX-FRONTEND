import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import SettingsToggle from "../common/SettingsToggle";
import {
  getUnreadNotifications,
  getNotifications,
  markAsRead,
  markAllAsRead,
} from "../../services/notification.service";
import { FiChevronDown, FiLogOut, FiMenu, FiSearch } from "react-icons/fi";
import {
  LayoutDashboard,
  Users,
  Layers3,
  RotateCcw,
  Bell,
  ShieldCheck,
} from "lucide-react";

const NAV_ITEMS = [
  { id: "dashboard", icon: LayoutDashboard, path: "/superadmin/dashboard", label: "Tổng quan & Doanh thu", labelEn: "Overview & Revenue" },
  { id: "managers", icon: Users, path: "/superadmin/managers", label: "Quản lý Manager", labelEn: "Manager Accounts" },
  { id: "plans", icon: Layers3, path: "/superadmin/plans", label: "Gói dịch vụ SaaS", labelEn: "SaaS Plans" },
  { id: "refunds", icon: RotateCcw, path: "/superadmin/refunds", label: "Quản lý Hoàn tiền", labelEn: "Refund Management" },
  { id: "notifications", icon: Bell, path: "/superadmin/notifications", label: "Phát sóng Thông báo", labelEn: "Broadcast" },
  { id: "logs", icon: ShieldCheck, path: "/superadmin/logs", label: "Nhật ký hệ thống", labelEn: "System Logs" },
];

export default function SuperadminLayout({ children }) {
  const { user, logout } = useAuth();
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [headerSearch, setHeaderSearch] = useState("");

  // Notification Bell States
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef(null);

  const loadNotifications = async (unreadOnly = false) => {
    try {
      const result = unreadOnly
        ? await getUnreadNotifications({ page: 1, limit: 8 })
        : await getNotifications({ page: 1, limit: 8 });
      const items = result.data || [];
      if (unreadOnly) setUnreadCount(result.unread_count ?? items.length);
      else setNotifications(items);
    } catch (_) {
      /* non-blocking */
    }
  };

  useEffect(() => {
    loadNotifications(true);
    const timer = window.setInterval(() => loadNotifications(true), 30000);
    return () => window.clearInterval(timer);
  }, [user?.id]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifications]);

  const toggleNotifications = async () => {
    const next = !showNotifications;
    setShowNotifications(next);
    if (next) await loadNotifications(false);
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id).catch(() => {});
      setNotifications((items) =>
        items.map((item) => (item.id === notification.id ? { ...item, is_read: true } : item))
      );
      setUnreadCount((count) => Math.max(0, count - 1));
    }
    setShowNotifications(false);
    navigate("/superadmin/notifications");
  };

  const handleLogout = async () => {
    setShowUserMenu(false);
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch {
      navigate("/login", { replace: true });
    }
  };

  const isNavActive = (path) => {
    if (path === "/superadmin/dashboard") {
      return location.pathname === "/superadmin/dashboard" || location.pathname === "/superadmin/revenue";
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const isSuperadminDashboard =
    location.pathname === "/superadmin/dashboard" ||
    location.pathname.startsWith("/superadmin/dashboard") ||
    location.pathname === "/superadmin/revenue" ||
    location.pathname.startsWith("/superadmin/revenue");

  const isSuperadminManagers =
    location.pathname === "/superadmin/managers" ||
    location.pathname.startsWith("/superadmin/managers");

  const isSuperadminPlans =
    location.pathname === "/superadmin/plans" ||
    location.pathname.startsWith("/superadmin/plans");

  const isSuperadminRefunds =
    location.pathname === "/superadmin/refunds" ||
    location.pathname.startsWith("/superadmin/refunds");

  const isSuperadminNotifications =
    location.pathname === "/superadmin/notifications" ||
    location.pathname.startsWith("/superadmin/notifications");

  const isSuperadminLogs =
    location.pathname === "/superadmin/logs" ||
    location.pathname.startsWith("/superadmin/logs");

  const initials = user?.full_name
    ? user.full_name.split(" ").slice(-1)[0][0].toUpperCase()
    : (user?.username?.[0] || user?.email?.[0] || "S").toUpperCase();

  return (
    <div className={`dashboard-layout${sidebarCollapsed ? " dashboard-layout--collapsed" : ""}`}>
      {/* Mobile sidebar backdrop */}
      {mobileSidebarOpen && (
        <button
          className="dashboard-sidebar-backdrop"
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <nav
        id="dashboard-sidebar"
        className={`dashboard-sidebar${sidebarCollapsed ? " dashboard-sidebar--collapsed" : ""}${
          mobileSidebarOpen ? " dashboard-sidebar--mobile-open" : ""
        }`}
        aria-label="Superadmin navigation"
      >
        <div className="dashboard-sidebar__section-label">
          {lang === "vi" ? "QUẢN TRỊ NỀN TẢNG" : "PLATFORM SUPERADMIN"}
        </div>

        <div className="dashboard-sidebar__items">
          {NAV_ITEMS.map((item) => {
            const isActive = isNavActive(item.path);
            const Icon = item.icon;
            const itemLabel = t?.superadmin?.nav?.[item.id] || (lang === "en" ? item.labelEn : item.label);

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  navigate(item.path);
                  setMobileSidebarOpen(false);
                }}
                className={`dashboard-sidebar__item${isActive ? " dashboard-sidebar__item--active" : ""}`}
                title={sidebarCollapsed ? itemLabel : undefined}
                aria-label={itemLabel}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon aria-hidden="true" size={19} />
                <span className="dashboard-sidebar__item-label">{itemLabel}</span>
              </button>
            );
          })}
        </div>

        <div className="dashboard-sidebar__footer" title="EDUX SuperAdmin Root Workspace">
          EDUX SuperAdmin
        </div>
      </nav>

      {/* Main layout */}
      <div className="dashboard-layout__main">
        {/* Header */}
        <header className="dashboard-header">
          <div className="dashboard-header__inner">
            {/* Menu toggle */}
            <button
              className="dashboard-header__menu"
              type="button"
              onClick={() => {
                if (window.matchMedia("(max-width: 768px)").matches) {
                  setMobileSidebarOpen((prev) => !prev);
                } else {
                  setSidebarCollapsed((collapsed) => !collapsed);
                }
              }}
              aria-label="Toggle navigation"
            >
              <FiMenu aria-hidden="true" />
            </button>

            <div className="dashboard-header__content">
              <div
                className="dashboard-header__row"
                style={{
                  maxWidth: "1440px",
                  margin: "0 auto",
                  padding: "0 24px",
                  height: "64px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              >
                {/* Logo + Role badge */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                  <button
                    onClick={() => navigate("/superadmin/dashboard")}
                    aria-label="EDUX Home"
                    className="dashboard-header__brand"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: 0,
                    }}
                  >
                    <div
                      style={{
                        background: "var(--color-primary)",
                        color: "white",
                        fontWeight: 800,
                        fontSize: "1.125rem",
                        fontFamily: "var(--font-mono)",
                        padding: "4px 14px",
                        borderRadius: "8px",
                        letterSpacing: "2px",
                      }}
                    >
                      EDUX
                    </div>
                  </button>

                  {/* System role badge */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "4px 12px",
                      borderRadius: "9999px",
                      background: "#f6ece6",
                      border: "1px solid rgba(224,192,178,0.4)",
                      color: "var(--color-primary-dark)",
                      fontSize: "0.6875rem",
                      fontWeight: 700,
                    }}
                  >
                    <span
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: "var(--color-primary)",
                        display: "inline-block",
                        animation: "pulse-ring 1.5s ease-in-out infinite",
                      }}
                    />
                    Quản trị Tối cao (SuperAdmin)
                  </div>
                </div>

                {/* Global Search */}
                <form
                  className="dashboard-header-search"
                  role="search"
                  onSubmit={(e) => e.preventDefault()}
                >
                  <FiSearch className="dashboard-header-search__icon" aria-hidden="true" />
                  <input
                    id="superadmin-global-search"
                    className="dashboard-header-search__input"
                    type="search"
                    value={headerSearch}
                    onChange={(e) => setHeaderSearch(e.target.value)}
                    placeholder="Nhập để lọc doanh thu, quản lý, nhật ký..."
                    maxLength={100}
                  />
                  <button className="dashboard-header-search__submit" type="submit" aria-label="Tìm kiếm">
                    <FiSearch aria-hidden="true" />
                  </button>
                </form>

                {/* Settings + Notifications + User Menu */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                  <SettingsToggle />

                  {/* Notification Bell Button */}
                  <div ref={notifRef} style={{ position: "relative" }}>
                    <button
                      type="button"
                      onClick={toggleNotifications}
                      aria-label="Thông báo"
                      aria-expanded={showNotifications}
                      style={{
                        position: "relative",
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        border: "1px solid var(--color-border)",
                        background: "var(--color-primary-card)",
                        color: "var(--color-ink)",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "background 0.15s",
                      }}
                    >
                      <Bell size={19} />
                      {unreadCount > 0 && (
                        <span
                          style={{
                            position: "absolute",
                            right: 4,
                            top: 3,
                            minWidth: 16,
                            height: 16,
                            borderRadius: 99,
                            padding: "0 3px",
                            background: "#ef4444",
                            color: "#fff",
                            fontSize: 10,
                            fontWeight: 800,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </button>

                    {showNotifications && (
                      <div
                        className="animate-fade-in"
                        style={{
                          position: "absolute",
                          right: 0,
                          top: "calc(100% + 8px)",
                          width: 340,
                          maxWidth: "calc(100vw - 32px)",
                          background: "var(--color-surface)",
                          border: "1px solid var(--color-border)",
                          borderRadius: 14,
                          boxShadow: "var(--shadow-lg, 0 10px 25px rgba(0,0,0,0.15))",
                          zIndex: 120,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            padding: "12px 14px",
                            borderBottom: "1px solid var(--color-border)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <strong style={{ fontSize: 13, color: "var(--color-ink)" }}>
                            {lang === "en" ? "Notifications" : "Thông báo"}
                          </strong>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <button
                              type="button"
                              onClick={async () => {
                                await markAllAsRead().catch(() => {});
                                setNotifications((items) => items.map((item) => ({ ...item, is_read: true })));
                                setUnreadCount(0);
                              }}
                              style={{
                                border: 0,
                                background: "none",
                                color: "var(--color-primary)",
                                cursor: "pointer",
                                fontSize: 11,
                                fontWeight: 700,
                              }}
                            >
                              {lang === "en" ? "Mark read" : "Đánh dấu đã đọc"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowNotifications(false);
                                navigate("/superadmin/notifications");
                              }}
                              style={{
                                border: 0,
                                background: "none",
                                color: "#8c7166",
                                cursor: "pointer",
                                fontSize: 11,
                              }}
                            >
                              {lang === "en" ? "View all" : "Xem tất cả"}
                            </button>
                          </div>
                        </div>

                        <div style={{ maxHeight: 360, overflowY: "auto" }}>
                          {notifications.length === 0 ? (
                            <p style={{ padding: 22, textAlign: "center", color: "var(--color-ink-muted)", margin: 0, fontSize: 12 }}>
                              {lang === "en" ? "No new notifications" : "Chưa có thông báo"}
                            </p>
                          ) : (
                            notifications.map((notification) => (
                              <button
                                key={notification.id}
                                type="button"
                                onClick={() => handleNotificationClick(notification)}
                                style={{
                                  display: "block",
                                  width: "100%",
                                  textAlign: "left",
                                  padding: "12px 14px",
                                  border: 0,
                                  borderBottom: "1px solid var(--color-border)",
                                  background: notification.is_read ? "transparent" : "var(--color-primary-bg)",
                                  cursor: "pointer",
                                  transition: "background 0.15s",
                                }}
                              >
                                <strong style={{ display: "block", fontSize: 13, color: "var(--color-ink)" }}>
                                  {notification.title}
                                </strong>
                                <span style={{ display: "block", marginTop: 3, color: "var(--color-ink-muted)", fontSize: 12, lineHeight: 1.4 }}>
                                  {notification.message}
                                </span>
                                <small style={{ color: "var(--color-ink-soft)", fontSize: 10, marginTop: 4, display: "block" }}>
                                  {new Date(notification.created_at).toLocaleString("vi-VN")}
                                </small>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Divider */}
                  <div style={{ width: "1px", height: "28px", background: "var(--color-border)", margin: "0 4px" }} />

                  {/* User Profile Menu */}
                  <div style={{ position: "relative" }}>
                    <button
                      id="superadmin-user-menu-button"
                      type="button"
                      onClick={() => setShowUserMenu((prev) => !prev)}
                      aria-expanded={showUserMenu}
                      aria-haspopup="menu"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "6px 10px 6px 6px",
                        background: "var(--color-primary-card)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "12px",
                        cursor: "pointer",
                        transition: "background 0.15s",
                      }}
                    >
                      <div
                        style={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "8px",
                          background: "var(--color-primary)",
                          color: "white",
                          fontWeight: 700,
                          fontSize: "0.875rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {initials}
                      </div>

                      <div style={{ textAlign: "left", minWidth: 0, maxWidth: "120px" }}>
                        <p
                          style={{
                            fontSize: "0.8125rem",
                            fontWeight: 700,
                            color: "var(--color-ink)",
                            margin: 0,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {user?.full_name || user?.username || "SuperAdmin"}
                        </p>
                        <p
                          style={{
                            fontSize: "0.6875rem",
                            color: "var(--color-ink-soft)",
                            margin: 0,
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          Quản trị Tối cao
                        </p>
                      </div>

                      <FiChevronDown aria-hidden="true" className="dashboard-user-chevron" />
                    </button>

                    {/* Dropdown Menu */}
                    {showUserMenu && (
                      <div
                        role="menu"
                        className="animate-fade-in"
                        style={{
                          position: "absolute",
                          right: 0,
                          top: "calc(100% + 8px)",
                          width: "240px",
                          background: "var(--color-surface)",
                          borderRadius: "14px",
                          boxShadow: "var(--shadow-lg)",
                          border: "1px solid var(--color-border)",
                          zIndex: 100,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            padding: "12px 16px",
                            borderBottom: "1px solid var(--color-border)",
                            background: "var(--color-primary-bg)",
                          }}
                        >
                          <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-ink)", margin: 0 }}>
                            {user?.full_name || user?.username || "SuperAdmin"}
                          </p>
                          <p
                            style={{
                              fontSize: "0.6875rem",
                              color: "var(--color-primary-dark)",
                              margin: "2px 0 0",
                              fontFamily: "var(--font-mono)",
                            }}
                          >
                            SuperAdmin Root
                          </p>
                          <p style={{ fontSize: "0.6875rem", color: "var(--color-ink-muted)", margin: "2px 0 0" }}>
                            {user?.email}
                          </p>
                        </div>

                        {/* Settings in dropdown */}
                        <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--color-border)" }}>
                          <p
                            style={{
                              fontSize: "0.6875rem",
                              fontWeight: 700,
                              color: "var(--color-ink-soft)",
                              textTransform: "uppercase",
                              letterSpacing: "0.08em",
                              marginBottom: "8px",
                            }}
                          >
                            {lang === "vi" ? "Cài đặt giao diện" : "Display Settings"}
                          </p>
                          <SettingsToggle compact />
                        </div>

                        {/* Logout button */}
                        <div style={{ padding: "6px" }}>
                          <button
                            type="button"
                            onClick={handleLogout}
                            role="menuitem"
                            style={{
                              width: "100%",
                              padding: "10px 12px",
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              borderRadius: "8px",
                              textAlign: "left",
                              fontSize: "0.8125rem",
                              fontWeight: 600,
                              color: "#dc2626",
                              fontFamily: "var(--font-sans)",
                              transition: "background 0.15s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "rgba(220,38,38,0.08)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "none";
                            }}
                          >
                            <FiLogOut aria-hidden="true" />
                            Đăng xuất
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main
          className="flex-1 min-w-0 w-full overflow-x-hidden"
          style={
            isSuperadminManagers || isSuperadminPlans || isSuperadminRefunds || isSuperadminNotifications || isSuperadminLogs
              ? {
                  flex: 1,
                  width: "100%",
                  maxWidth: "100%",
                  margin: 0,
                  padding: 0,
                  display: "flex",
                  flexDirection: "column",
                  height: "calc(100vh - var(--dashboard-header-height, 64px))",
                  minHeight: 0,
                  minWidth: 0,
                  overflow: "hidden",
                  boxSizing: "border-box",
                }
              : {
                  flex: 1,
                  maxWidth: "1440px",
                  width: "100%",
                  margin: "0 auto",
                  padding: "24px 24px 80px",
                }
          }
        >
          {children}
        </main>

        {/* Standard Footer */}
        {!isSuperadminDashboard && !isSuperadminManagers && !isSuperadminPlans && !isSuperadminRefunds && !isSuperadminNotifications && !isSuperadminLogs && (
          <footer
            style={{
              background: "var(--color-surface)",
              borderTop: "1px solid var(--color-border)",
              padding: "16px 24px",
              transition: "background 0.3s",
            }}
          >
            <div
              style={{
                maxWidth: "1440px",
                margin: "0 auto",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                fontSize: "0.8125rem",
                color: "var(--color-ink-muted)",
              }}
            >
              <div>
                <strong>EDUX Platform</strong> &mdash; Hệ thống Quản trị & Vận hành Giáo dục Trực tuyến
              </div>
              <div>
                Phiên bản 2.6 &bull; SuperAdmin Master Console
              </div>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}
