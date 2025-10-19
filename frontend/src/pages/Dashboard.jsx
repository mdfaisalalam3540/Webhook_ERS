// frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { Activity, Webhook, CheckCircle, XCircle } from "lucide-react";
import api from "../utils/api";

/**
 * Dashboard Component - Main overview page showing system statistics
 * Displays key metrics and recent activity for quick monitoring
 */
const Dashboard = () => {
  // ==================== STATE MANAGEMENT ====================
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalSubscriptions: 0,
    successfulDeliveries: 0,
    failedDeliveries: 0,
    successRate: 0,
    totalDeliveries: 0,
  });
  const [recentEvents, setRecentEvents] = useState([]);
  const [recentDeliveries, setRecentDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ==================== DATA FETCHING ====================
  /**
   * useEffect hook runs when component mounts (empty dependency array)
   * Fetches dashboard data from API when component loads
   */
  useEffect(() => {
    fetchDashboardData();
  }, []); // Empty dependency array = run only once on mount

  /**
   * Fetches all dashboard data from backend API
   * Uses Promise.all to make multiple API calls in parallel
   */
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors

      console.log("Fetching dashboard data...");

      // Make multiple API calls in parallel for better performance
      const [statsRes, eventsRes, deliveriesRes] = await Promise.all([
        api.get("/dashboard/stats"), // System statistics
        api.get("/events?limit=5"), // Recent events
        api.get("/dashboard/recent-deliveries?limit=5"), // Recent deliveries
      ]);

      // ==================== DATA PROCESSING ====================
      // Update stats with API response or default values
      setStats(
        statsRes.data.stats || {
          totalEvents: 0,
          totalSubscriptions: 0,
          successfulDeliveries: 0,
          failedDeliveries: 0,
          successRate: 0,
          totalDeliveries: 0,
        }
      );

      // Update recent events list
      setRecentEvents(eventsRes.data.events || []);

      // Update recent deliveries list
      setRecentDeliveries(deliveriesRes.data.deliveries || []);

      console.log("Dashboard data loaded successfully");
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false); // Always stop loading regardless of success/failure
    }
  };

  /**
   * Manual refresh function
   * Can be called by user to update dashboard data
   */
  const handleRefresh = () => {
    fetchDashboardData();
  };

  // ==================== RENDER LOGIC ====================

  // Show loading state while data is being fetched
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  // Show error state if data fetching failed
  if (error) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorIcon}>⚠️</div>
        <h3>Unable to Load Dashboard</h3>
        <p>{error}</p>
        <button onClick={handleRefresh} style={styles.retryButton}>
          Try Again
        </button>
      </div>
    );
  }

  // Main dashboard render
  return (
    <div style={styles.container}>
      {/* ==================== PAGE HEADER ==================== */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Dashboard</h1>
          <p style={styles.subtitle}>Webhook System Overview & Analytics</p>
        </div>
        <button onClick={handleRefresh} style={styles.refreshButton}>
          ↻ Refresh
        </button>
      </div>

      {/* ==================== STATISTICS GRID ==================== */}
      <div style={styles.statsGrid}>
        <StatCard
          icon={<Activity size={24} />}
          title="Total Events"
          value={stats.totalEvents.toLocaleString()}
          color="#3498db"
          description="All events processed by the system"
        />
        <StatCard
          icon={<Webhook size={24} />}
          title="Active Subscriptions"
          value={stats.totalSubscriptions.toLocaleString()}
          color="#9b59b6"
          description="Webhook endpoints receiving events"
        />
        <StatCard
          icon={<CheckCircle size={24} />}
          title="Successful Deliveries"
          value={stats.successfulDeliveries.toLocaleString()}
          color="#27ae60"
          description="Webhooks delivered successfully"
        />
        <StatCard
          icon={<XCircle size={24} />}
          title="Failed Deliveries"
          value={stats.failedDeliveries.toLocaleString()}
          color="#e74c3c"
          description="Webhook deliveries that failed"
        />
      </div>

      {/* ==================== SUCCESS RATE CARD ==================== */}
      {stats.totalDeliveries > 0 && (
        <div style={styles.successRateCard}>
          <div style={styles.successRateHeader}>
            <CheckCircle color="#27ae60" size={20} />
            <span>Delivery Success Rate</span>
          </div>
          <div style={styles.successRateValue}>{stats.successRate}%</div>
          <div style={styles.successRateBar}>
            <div
              style={{
                ...styles.successRateFill,
                width: `${stats.successRate}%`,
                backgroundColor:
                  stats.successRate > 90
                    ? "#27ae60"
                    : stats.successRate > 70
                    ? "#f39c12"
                    : "#e74c3c",
              }}
            />
          </div>
          <div style={styles.successRateText}>
            {stats.successfulDeliveries} out of {stats.totalDeliveries}{" "}
            deliveries successful
          </div>
        </div>
      )}

      {/* ==================== RECENT ACTIVITY SECTION ==================== */}
      <div style={styles.activityGrid}>
        {/* Recent Events Panel */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Recent Events</h2>
          <div style={styles.eventsList}>
            {recentEvents.length > 0 ? (
              recentEvents.map((event) => (
                <EventCard key={event._id} event={event} />
              ))
            ) : (
              <div style={styles.emptyState}>
                <p>No recent events</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Deliveries Panel */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Recent Deliveries</h2>
          <div style={styles.deliveriesList}>
            {recentDeliveries.length > 0 ? (
              recentDeliveries.map((delivery) => (
                <DeliveryCard key={delivery._id} delivery={delivery} />
              ))
            ) : (
              <div style={styles.emptyState}>
                <p>No recent deliveries</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * StatCard Component - Reusable component for displaying metric cards
 * Shows an icon, value, title, and optional description
 */
const StatCard = ({ icon, title, value, color, description }) => (
  <div style={{ ...styles.statCard, borderLeft: `4px solid ${color}` }}>
    <div style={{ ...styles.statIcon, color }}>{icon}</div>
    <div style={styles.statContent}>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statTitle}>{title}</div>
      {description && <div style={styles.statDescription}>{description}</div>}
    </div>
  </div>
);

/**
 * EventCard Component - Displays individual event information
 */
const EventCard = ({ event }) => (
  <div style={styles.eventCard}>
    <div style={styles.eventHeader}>
      <span style={styles.eventType}>{event.eventType}</span>
      <span style={styles.eventTime}>
        {new Date(event.createdAt).toLocaleTimeString()}
      </span>
    </div>
    <div style={styles.eventSource}>Source: {event.sourceModule}</div>
    <div style={styles.eventId}>ID: {event.eventId}</div>
  </div>
);

/**
 * DeliveryCard Component - Displays individual delivery status
 */
const DeliveryCard = ({ delivery }) => (
  <div style={styles.deliveryCard}>
    <div style={styles.deliveryHeader}>
      <div
        style={{
          ...styles.statusBadge,
          backgroundColor:
            delivery.status === "success"
              ? "#27ae60"
              : delivery.status === "failed"
              ? "#e74c3c"
              : "#f39c12",
        }}
      >
        {delivery.status}
      </div>
      <span style={styles.deliveryTime}>
        {new Date(delivery.createdAt).toLocaleTimeString()}
      </span>
    </div>
    <div style={styles.deliveryInfo}>
      {delivery.eventId && <div>Event: {delivery.eventId.eventType}</div>}
      {delivery.subscriptionId && (
        <div>Subscription: {delivery.subscriptionId.name}</div>
      )}
      <div>Attempt: {delivery.deliveryAttempt}</div>
    </div>
  </div>
);

/**
 * Comprehensive styles object for the Dashboard component
 * Organized by component and functionality
 */
const styles = {
  // Main container
  container: {
    padding: "0 0.5rem", // Reduced side padding
  },

  // Loading state
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "50vh",
    color: "#666",
  },
  spinner: {
    border: "4px solid #f3f3f3",
    borderTop: "4px solid #3498db",
    borderRadius: "50%",
    width: "50px",
    height: "50px",
    animation: "spin 1s linear infinite",
    marginBottom: "1rem",
  },

  // Error state
  errorContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "50vh",
    textAlign: "center",
    color: "#e74c3c",
  },
  errorIcon: {
    fontSize: "3rem",
    marginBottom: "1rem",
  },
  retryButton: {
    marginTop: "1rem",
    padding: "0.5rem 1rem",
    backgroundColor: "#3498db",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },

  // Header section
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "2rem",
    flexWrap: "wrap",
    gap: "1rem",
  },
  title: {
    fontSize: "2.5rem",
    fontWeight: "700",
    margin: "0 0 0.5rem 0",
    color: "#2c3e50",
    lineHeight: 1.2,
  },
  subtitle: {
    fontSize: "1.2rem",
    color: "#7f8c8d",
    margin: 0,
  },
  refreshButton: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#3498db",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "600",
    transition: "background-color 0.2s",
    whiteSpace: "nowrap",

    ":hover": {
      backgroundColor: "#2980b9",
    },
  },

  // Statistics grid
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "1.5rem",
    marginBottom: "2rem",
  },
  statCard: {
    backgroundColor: "white",
    padding: "1.5rem",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    display: "flex",
    alignItems: "flex-start",
    gap: "1rem",
    transition: "transform 0.2s, box-shadow 0.2s",

    ":hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    },
  },
  statIcon: {
    padding: "0.75rem",
    borderRadius: "8px",
    backgroundColor: "#f8f9fa",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: "2.5rem",
    fontWeight: "700",
    color: "#2c3e50",
    lineHeight: 1,
    marginBottom: "0.25rem",
  },
  statTitle: {
    color: "#2c3e50",
    fontSize: "1.1rem",
    fontWeight: "600",
    marginBottom: "0.25rem",
  },
  statDescription: {
    color: "#7f8c8d",
    fontSize: "0.9rem",
    marginTop: "0.5rem",
  },

  // Success rate card
  successRateCard: {
    backgroundColor: "white",
    padding: "1.5rem",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    marginBottom: "2rem",
    border: "1px solid #e1e8ed",
  },
  successRateHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "1rem",
    fontWeight: "600",
    color: "#2c3e50",
  },
  successRateValue: {
    fontSize: "2rem",
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: "0.5rem",
  },
  successRateBar: {
    height: "8px",
    backgroundColor: "#ecf0f1",
    borderRadius: "4px",
    overflow: "hidden",
    marginBottom: "0.5rem",
  },
  successRateFill: {
    height: "100%",
    transition: "width 0.5s ease-in-out",
  },
  successRateText: {
    color: "#7f8c8d",
    fontSize: "0.9rem",
  },

  // Activity grid
  activityGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
    gap: "1.5rem",
  },
  section: {
    backgroundColor: "white",
    padding: "1.5rem",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    border: "1px solid #e1e8ed",
  },
  sectionTitle: {
    fontSize: "1.25rem",
    fontWeight: "600",
    margin: "0 0 1rem 0",
    color: "#2c3e50",
    paddingBottom: "0.5rem",
    borderBottom: "2px solid #f8f9fa",
  },

  // Events list
  eventsList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  eventCard: {
    padding: "1rem",
    border: "1px solid #e1e8ed",
    borderRadius: "6px",
    backgroundColor: "#f8f9fa",
    transition: "border-color 0.2s",

    ":hover": {
      borderColor: "#3498db",
    },
  },
  eventHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.5rem",
    flexWrap: "wrap",
    gap: "0.5rem",
  },
  eventType: {
    fontWeight: "600",
    color: "#2c3e50",
    fontSize: "0.9rem",
    backgroundColor: "#e1f5fe",
    padding: "0.25rem 0.5rem",
    borderRadius: "4px",
  },
  eventTime: {
    color: "#7f8c8d",
    fontSize: "0.8rem",
  },
  eventSource: {
    color: "#7f8c8d",
    fontSize: "0.85rem",
    marginBottom: "0.25rem",
  },
  eventId: {
    color: "#95a5a6",
    fontSize: "0.8rem",
    fontFamily: "monospace",
  },

  // Deliveries list
  deliveriesList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  deliveryCard: {
    padding: "1rem",
    border: "1px solid #e1e8ed",
    borderRadius: "6px",
    backgroundColor: "#f8f9fa",
    transition: "border-color 0.2s",

    ":hover": {
      borderColor: "#3498db",
    },
  },
  deliveryHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.5rem",
    flexWrap: "wrap",
    gap: "0.5rem",
  },
  statusBadge: {
    color: "white",
    padding: "0.25rem 0.5rem",
    borderRadius: "12px",
    fontSize: "0.75rem",
    fontWeight: "600",
    textTransform: "capitalize",
  },
  deliveryTime: {
    color: "#7f8c8d",
    fontSize: "0.8rem",
  },
  deliveryInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    fontSize: "0.85rem",
    color: "#7f8c8d",
  },

  // Empty state
  emptyState: {
    textAlign: "center",
    padding: "2rem",
    color: "#95a5a6",
    fontStyle: "italic",
  },
};

// Add CSS animation for spinner
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(
  `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`,
  styleSheet.cssRules.length
);

export default Dashboard;
