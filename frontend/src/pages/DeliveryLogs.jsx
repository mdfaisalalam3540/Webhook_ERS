// frontend/src/pages/DeliveryLogs.jsx
import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  RotateCw,
  Search,
  Filter,
  AlertCircle,
} from "lucide-react";
import api from "../utils/api";

/**
 * Delivery Logs Page Component - Displays webhook delivery attempts with filtering and retry capabilities
 * Shows detailed delivery status, response codes, and error messages for debugging
 */
const DeliveryLogs = () => {
  // ==================== STATE MANAGEMENT ====================
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: "",
    searchTerm: "",
  });
  const [retryingLogs, setRetryingLogs] = useState(new Set()); // Track logs being retried

  // ==================== DATA FETCHING ====================
  /**
   * useEffect hook runs when component mounts
   * Fetches delivery logs from API
   */
  useEffect(() => {
    fetchDeliveryLogs();
  }, []);

  /**
   * Fetches delivery logs from backend API
   * Handles both success and error states
   */
  const fetchDeliveryLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("📦 Fetching delivery logs...");

      // Call the backend API for delivery logs
      const response = await api.get(`/dashboard/recent-deliveries?limit=50`);

      // Backend returns "deliveries" array in the response
      setLogs(response.data.deliveries || []);

      console.log(
        `✅ Loaded ${response.data.deliveries?.length || 0} delivery logs`
      );
    } catch (error) {
      console.error("❌ Failed to fetch delivery logs:", error);
      setError(
        "Failed to load delivery logs. Please check if the backend server is running."
      );
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Retry a failed webhook delivery
   * @param {string} logId - The ID of the delivery log to retry
   */
  const retryDelivery = async (logId) => {
    try {
      // Add to retrying set to show loading state
      setRetryingLogs((prev) => new Set(prev).add(logId));

      console.log(`🔄 Retrying delivery: ${logId}`);

      // Call the retry endpoint (note: this endpoint needs to be implemented in backend)
      await api.post(`/dashboard/retry/${logId}`);

      // Refresh the list to show updated status
      await fetchDeliveryLogs();

      console.log(`✅ Delivery retry initiated: ${logId}`);
    } catch (error) {
      console.error("❌ Failed to retry delivery:", error);
      alert(
        `Failed to retry delivery: ${
          error.response?.data?.error || error.message
        }`
      );
    } finally {
      // Remove from retrying set
      setRetryingLogs((prev) => {
        const newSet = new Set(prev);
        newSet.delete(logId);
        return newSet;
      });
    }
  };

  /**
   * Refresh delivery logs manually
   */
  const handleRefresh = () => {
    fetchDeliveryLogs();
  };

  /**
   * Clear all active filters
   */
  const clearFilters = () => {
    setFilters({ status: "", searchTerm: "" });
  };

  // ==================== UTILITY FUNCTIONS ====================

  /**
   * Get appropriate icon for each delivery status
   * @param {string} status - Delivery status
   * @returns {JSX.Element} React component with icon
   */
  const getStatusIcon = (status) => {
    switch (status) {
      case "success":
        return <CheckCircle color="#27ae60" size={20} />;
      case "failed":
        return <XCircle color="#e74c3c" size={20} />;
      case "retrying":
        return <RotateCw color="#f39c12" size={20} />;
      default:
        return <Clock color="#95a5a6" size={20} />;
    }
  };

  /**
   * Get color associated with each delivery status
   * @param {string} status - Delivery status
   * @returns {string} CSS color value
   */
  const getStatusColor = (status) => {
    switch (status) {
      case "success":
        return "#27ae60"; // Green
      case "failed":
        return "#e74c3c"; // Red
      case "retrying":
        return "#f39c12"; // Orange
      default:
        return "#95a5a6"; // Gray
    }
  };

  /**
   * Get user-friendly status text
   * @param {string} status - Delivery status
   * @returns {string} Formatted status text
   */
  const getStatusText = (status) => {
    const statusMap = {
      success: "Delivered Successfully",
      failed: "Delivery Failed",
      retrying: "Retrying Delivery",
      pending: "Pending Delivery",
    };
    return statusMap[status] || status;
  };

  /**
   * Available status options for filter dropdown
   */
  const statusOptions = [
    { value: "", label: "All Statuses" },
    { value: "success", label: "Success" },
    { value: "failed", label: "Failed" },
    { value: "retrying", label: "Retrying" },
    { value: "pending", label: "Pending" },
  ];

  // ==================== DATA FILTERING ====================

  /**
   * Filter logs based on current filter criteria
   */
  const filteredLogs = logs.filter((log) => {
    // Status filter
    if (filters.status && log.status !== filters.status) {
      return false;
    }

    // Search filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      const matchesSearch =
        log.eventId?.eventId?.toLowerCase().includes(searchLower) ||
        log.subscriptionId?.name?.toLowerCase().includes(searchLower) ||
        log.subscriptionId?.webhookUrl?.toLowerCase().includes(searchLower) ||
        log.error?.toLowerCase().includes(searchLower) ||
        log.responseBody?.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;
    }

    return true;
  });

  // ==================== RENDER LOGIC ====================

  // Show loading state
  if (loading && logs.length === 0) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading delivery logs...</p>
      </div>
    );
  }

  // Show error state
  if (error && logs.length === 0) {
    return (
      <div style={styles.errorContainer}>
        <AlertCircle size={48} color="#e74c3c" />
        <h3>Unable to Load Delivery Logs</h3>
        <p>{error}</p>
        <div style={styles.errorActions}>
          <button onClick={handleRefresh} style={styles.retryButton}>
            Try Again
          </button>
          <button
            onClick={() =>
              window.open("http://localhost:3000/health", "_blank")
            }
            style={styles.checkBackendButton}
          >
            Check Backend Status
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* ==================== PAGE HEADER ==================== */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Delivery Logs</h1>
          <p style={styles.subtitle}>
            Monitor webhook delivery attempts, status, and response details
            {logs.length > 0 &&
              ` • ${filteredLogs.length} of ${logs.length} logs shown`}
          </p>
        </div>
        <button onClick={handleRefresh} style={styles.refreshButton}>
          ↻ Refresh
        </button>
      </div>

      {/* ==================== STATS OVERVIEW ==================== */}
      {logs.length > 0 && (
        <div style={styles.statsOverview}>
          <div style={styles.statItem}>
            <div style={styles.statNumber}>{logs.length}</div>
            <div style={styles.statLabel}>Total Deliveries</div>
          </div>
          <div style={styles.statItem}>
            <div style={{ ...styles.statNumber, color: "#27ae60" }}>
              {logs.filter((log) => log.status === "success").length}
            </div>
            <div style={styles.statLabel}>Successful</div>
          </div>
          <div style={styles.statItem}>
            <div style={{ ...styles.statNumber, color: "#e74c3c" }}>
              {logs.filter((log) => log.status === "failed").length}
            </div>
            <div style={styles.statLabel}>Failed</div>
          </div>
          <div style={styles.statItem}>
            <div style={{ ...styles.statNumber, color: "#f39c12" }}>
              {logs.filter((log) => log.status === "retrying").length}
            </div>
            <div style={styles.statLabel}>Retrying</div>
          </div>
        </div>
      )}

      {/* ==================== FILTERS SECTION ==================== */}
      <div style={styles.filtersCard}>
        <div style={styles.filtersHeader}>
          <Filter size={20} />
          <span>Filter Delivery Logs</span>
        </div>

        <div style={styles.filtersGrid}>
          {/* Status Filter */}
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Delivery Status</label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              style={styles.select}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Search Filter */}
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Search Logs</label>
            <div style={styles.searchContainer}>
              <Search size={16} style={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search events, subscriptions, errors..."
                value={filters.searchTerm}
                onChange={(e) =>
                  setFilters({ ...filters, searchTerm: e.target.value })
                }
                style={styles.searchInput}
              />
            </div>
          </div>

          {/* Active Filters Indicator */}
          {(filters.status || filters.searchTerm) && (
            <div style={styles.activeFilters}>
              <span style={styles.activeFiltersText}>Active Filters:</span>
              {filters.status && (
                <span style={styles.filterTag}>
                  Status:{" "}
                  {statusOptions.find((s) => s.value === filters.status)?.label}
                </span>
              )}
              {filters.searchTerm && (
                <span style={styles.filterTag}>
                  Search: "{filters.searchTerm}"
                </span>
              )}
              <button onClick={clearFilters} style={styles.clearFiltersButton}>
                Clear All
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ==================== DELIVERY LOGS LIST ==================== */}
      <div style={styles.logsContainer}>
        {filteredLogs.length > 0 ? (
          filteredLogs.map((log) => (
            <DeliveryLogCard
              key={log._id}
              log={log}
              getStatusIcon={getStatusIcon}
              getStatusColor={getStatusColor}
              getStatusText={getStatusText}
              onRetry={retryDelivery}
              isRetrying={retryingLogs.has(log._id)}
            />
          ))
        ) : (
          <div style={styles.emptyState}>
            <div style={styles.emptyStateIcon}>📋</div>
            <h3>No Delivery Logs Found</h3>
            <p>
              {logs.length === 0
                ? "No webhook deliveries have been attempted yet."
                : "No delivery logs match your current filters."}
            </p>
            {logs.length === 0 ? (
              <p style={styles.emptyStateSubtext}>
                Delivery logs will appear here when webhook delivery attempts
                are made.
              </p>
            ) : (
              <button onClick={clearFilters} style={styles.clearFiltersButton}>
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * DeliveryLogCard Component - Displays individual delivery log with expandable details
 */
const DeliveryLogCard = ({
  log,
  getStatusIcon,
  getStatusColor,
  getStatusText,
  onRetry,
  isRetrying,
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={styles.logCard}>
      {/* Log Header - Always visible */}
      <div style={styles.logHeader}>
        <div style={styles.logStatusSection}>
          {getStatusIcon(log.status)}
          <div>
            <div
              style={{
                ...styles.statusText,
                color: getStatusColor(log.status),
              }}
            >
              {getStatusText(log.status)}
            </div>
            <div style={styles.logMeta}>
              <span>Attempt #{log.deliveryAttempt}</span>
              <span>•</span>
              <span>{new Date(log.createdAt).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div style={styles.logActions}>
          <button
            onClick={() => setExpanded(!expanded)}
            style={styles.expandButton}
          >
            {expanded ? "▲ Details" : "▼ Details"}
          </button>
        </div>
      </div>

      {/* Basic Info - Always visible */}
      <div style={styles.logBasicInfo}>
        <div style={styles.logField}>
          <strong>Event:</strong>
          {log.eventId ? (
            <span style={styles.eventInfo}>
              {log.eventId.eventType}
              <span style={styles.eventId}>({log.eventId.eventId})</span>
            </span>
          ) : (
            <span style={styles.missingData}>Event not found</span>
          )}
        </div>

        <div style={styles.logField}>
          <strong>Subscription:</strong>
          {log.subscriptionId ? (
            <span style={styles.subscriptionInfo}>
              {log.subscriptionId.name}
              <span style={styles.webhookUrl}>
                ({log.subscriptionId.webhookUrl})
              </span>
            </span>
          ) : (
            <span style={styles.missingData}>Subscription not found</span>
          )}
        </div>

        {log.responseStatus && (
          <div style={styles.logField}>
            <strong>Response:</strong>
            <span
              style={{
                ...styles.responseStatus,
                color:
                  log.responseStatus < 400
                    ? "#27ae60"
                    : log.responseStatus < 500
                    ? "#f39c12"
                    : "#e74c3c",
              }}
            >
              HTTP {log.responseStatus}
            </span>
          </div>
        )}
      </div>

      {/* Expandable Details Section */}
      {expanded && (
        <div style={styles.logDetails}>
          {/* Error Details */}
          {log.error && (
            <div style={styles.detailSection}>
              <h4 style={styles.detailTitle}>
                <AlertCircle size={16} />
                Error Details
              </h4>
              <div style={styles.errorText}>{log.error}</div>
            </div>
          )}

          {/* Response Body */}
          {log.responseBody && (
            <div style={styles.detailSection}>
              <h4 style={styles.detailTitle}>Response Body</h4>
              <pre style={styles.responseBody}>{log.responseBody}</pre>
            </div>
          )}

          {/* Additional Metadata */}
          <div style={styles.metadataGrid}>
            <div style={styles.metadataItem}>
              <strong>Delivery ID:</strong> {log._id}
            </div>
            <div style={styles.metadataItem}>
              <strong>Created:</strong>{" "}
              {new Date(log.createdAt).toLocaleString()}
            </div>
            <div style={styles.metadataItem}>
              <strong>Updated:</strong>{" "}
              {new Date(log.updatedAt).toLocaleString()}
            </div>
            {log.deliveredAt && (
              <div style={styles.metadataItem}>
                <strong>Delivered At:</strong>{" "}
                {new Date(log.deliveredAt).toLocaleString()}
              </div>
            )}
            {log.nextRetryAt && (
              <div style={styles.metadataItem}>
                <strong>Next Retry:</strong>{" "}
                {new Date(log.nextRetryAt).toLocaleString()}
              </div>
            )}
            <div style={styles.metadataItem}>
              <strong>HMAC Verified:</strong>
              <span
                style={{
                  color: log.hmacVerified ? "#27ae60" : "#e74c3c",
                  fontWeight: "600",
                  marginLeft: "0.5rem",
                }}
              >
                {log.hmacVerified ? "Yes" : "No"}
              </span>
            </div>
          </div>

          {/* Retry Action for Failed Deliveries */}
          {log.status === "failed" && (
            <div style={styles.retrySection}>
              <button
                onClick={() => onRetry(log._id)}
                disabled={isRetrying}
                style={
                  isRetrying ? styles.retryButtonDisabled : styles.retryButton
                }
              >
                {isRetrying ? (
                  <>
                    <RotateCw size={16} className="spinning" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RotateCw size={16} />
                    Retry Delivery
                  </>
                )}
              </button>
              <div style={styles.retryInfo}>
                This will attempt to deliver the webhook again with attempt #
                {log.deliveryAttempt + 1}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Comprehensive styles for Delivery Logs page
 */
const styles = {
  // Main container
  container: {
    maxWidth: "1000px",
    margin: "0 auto",
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
    padding: "2rem",
  },
  errorActions: {
    display: "flex",
    gap: "1rem",
    marginTop: "1.5rem",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  retryButton: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#3498db",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "600",
  },
  checkBackendButton: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "transparent",
    color: "#3498db",
    border: "1px solid #3498db",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "600",
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
  },
  subtitle: {
    fontSize: "1.1rem",
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
    whiteSpace: "nowrap",
  },

  // Stats overview
  statsOverview: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "1rem",
    marginBottom: "2rem",
  },
  statItem: {
    backgroundColor: "white",
    padding: "1.5rem 1rem",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    textAlign: "center",
    border: "1px solid #e1e8ed",
  },
  statNumber: {
    fontSize: "2rem",
    fontWeight: "700",
    color: "#2c3e50",
    lineHeight: 1,
    marginBottom: "0.5rem",
  },
  statLabel: {
    color: "#7f8c8d",
    fontSize: "0.9rem",
    fontWeight: "600",
  },

  // Filters section
  filtersCard: {
    backgroundColor: "white",
    padding: "1.5rem",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    marginBottom: "2rem",
    border: "1px solid #e1e8ed",
  },
  filtersHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "1rem",
    fontWeight: "600",
    color: "#2c3e50",
    fontSize: "1.1rem",
  },
  filtersGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "1.5rem",
    alignItems: "end",
  },
  filterGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  filterLabel: {
    fontWeight: "600",
    color: "#2c3e50",
    fontSize: "0.9rem",
  },
  select: {
    padding: "0.75rem",
    border: "1px solid #ddd",
    borderRadius: "6px",
    fontSize: "1rem",
    backgroundColor: "white",
  },
  searchContainer: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  searchIcon: {
    position: "absolute",
    left: "12px",
    color: "#7f8c8d",
  },
  searchInput: {
    padding: "0.75rem 0.75rem 0.75rem 2.5rem",
    border: "1px solid #ddd",
    borderRadius: "6px",
    fontSize: "1rem",
    width: "100%",
  },

  // Active filters
  activeFilters: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    flexWrap: "wrap",
    padding: "1rem",
    backgroundColor: "#f8f9fa",
    borderRadius: "6px",
    border: "1px solid #e1e8ed",
    gridColumn: "1 / -1",
  },
  activeFiltersText: {
    fontWeight: "600",
    color: "#2c3e50",
    fontSize: "0.9rem",
  },
  filterTag: {
    backgroundColor: "#e1f5fe",
    color: "#0277bd",
    padding: "0.25rem 0.75rem",
    borderRadius: "12px",
    fontSize: "0.85rem",
    fontWeight: "500",
  },
  clearFiltersButton: {
    padding: "0.5rem 1rem",
    backgroundColor: "transparent",
    color: "#e74c3c",
    border: "1px solid #e74c3c",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.9rem",
    marginLeft: "auto",
  },

  // Logs container
  logsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },

  // Log card
  logCard: {
    backgroundColor: "white",
    padding: "1.5rem",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    border: "1px solid #e1e8ed",
    transition: "box-shadow 0.2s",
  },
  logHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "1rem",
    flexWrap: "wrap",
    gap: "1rem",
  },
  logStatusSection: {
    display: "flex",
    alignItems: "flex-start",
    gap: "1rem",
    flex: 1,
  },
  statusText: {
    fontWeight: "600",
    fontSize: "1.1rem",
    marginBottom: "0.25rem",
  },
  logMeta: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    color: "#7f8c8d",
    fontSize: "0.9rem",
    flexWrap: "wrap",
  },
  logActions: {
    display: "flex",
    gap: "0.5rem",
    flexShrink: 0,
  },
  expandButton: {
    padding: "0.5rem 1rem",
    backgroundColor: "transparent",
    color: "#3498db",
    border: "1px solid #3498db",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.9rem",
    whiteSpace: "nowrap",
  },

  // Basic info
  logBasicInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    marginBottom: "1rem",
  },
  logField: {
    display: "flex",
    alignItems: "flex-start",
    gap: "0.5rem",
    fontSize: "0.9rem",
    lineHeight: 1.4,
    flexWrap: "wrap",
  },
  eventInfo: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  eventId: {
    fontFamily: "monospace",
    fontSize: "0.8rem",
    color: "#7f8c8d",
    backgroundColor: "#f8f9fa",
    padding: "0.1rem 0.3rem",
    borderRadius: "3px",
    border: "1px solid #e1e8ed",
  },
  subscriptionInfo: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    flexWrap: "wrap",
  },
  webhookUrl: {
    fontFamily: "monospace",
    fontSize: "0.8rem",
    color: "#7f8c8d",
  },
  missingData: {
    color: "#e74c3c",
    fontStyle: "italic",
  },
  responseStatus: {
    fontWeight: "600",
    fontFamily: "monospace",
  },

  // Log details (expanded)
  logDetails: {
    borderTop: "1px solid #e1e8ed",
    paddingTop: "1rem",
  },
  detailSection: {
    marginBottom: "1.5rem",
  },
  detailTitle: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontWeight: "600",
    color: "#2c3e50",
    margin: "0 0 0.75rem 0",
    fontSize: "1rem",
  },
  errorText: {
    backgroundColor: "#fdeded",
    color: "#e74c3c",
    padding: "1rem",
    borderRadius: "6px",
    border: "1px solid #f5c6c6",
    fontSize: "0.9rem",
    fontFamily: "monospace",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  responseBody: {
    fontSize: "0.8rem",
    backgroundColor: "#f8f9fa",
    padding: "1rem",
    borderRadius: "6px",
    overflow: "auto",
    margin: 0,
    border: "1px solid #e1e8ed",
    maxHeight: "300px",
    fontFamily: "Monaco, Consolas, monospace",
    lineHeight: 1.4,
    whiteSpace: "pre-wrap",
  },

  // Metadata grid
  metadataGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "0.5rem",
    fontSize: "0.85rem",
    color: "#7f8c8d",
    marginBottom: "1.5rem",
  },
  metadataItem: {
    padding: "0.75rem",
    backgroundColor: "#f8f9fa",
    borderRadius: "6px",
    border: "1px solid #e1e8ed",
  },

  // Retry section
  retrySection: {
    padding: "1rem",
    backgroundColor: "#fff3cd",
    border: "1px solid #ffeaa7",
    borderRadius: "6px",
    textAlign: "center",
  },
  retryButton: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.75rem 1.5rem",
    backgroundColor: "#f39c12",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "600",
    margin: "0 auto 0.75rem",
  },
  retryButtonDisabled: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.75rem 1.5rem",
    backgroundColor: "#bdc3c7",
    color: "#7f8c8d",
    border: "none",
    borderRadius: "6px",
    cursor: "not-allowed",
    fontSize: "1rem",
    fontWeight: "600",
    margin: "0 auto 0.75rem",
  },
  retryInfo: {
    fontSize: "0.85rem",
    color: "#856404",
  },

  // Empty state
  emptyState: {
    textAlign: "center",
    padding: "3rem 2rem",
    color: "#95a5a6",
  },
  emptyStateIcon: {
    fontSize: "4rem",
    marginBottom: "1rem",
  },
  emptyStateSubtext: {
    fontSize: "0.9rem",
    marginTop: "0.5rem",
    color: "#bdc3c7",
  },
};

// Add CSS animations
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

styleSheet.insertRule(
  `
  .spinning {
    animation: spin 1s linear infinite;
  }
`,
  styleSheet.cssRules.length
);

export default DeliveryLogs;
