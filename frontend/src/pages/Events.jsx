// frontend/src/pages/Events.jsx
import React, { useState, useEffect } from "react";
import { Calendar, User, Briefcase, Clock, Search, Filter } from "lucide-react";
import api from "../utils/api";

/**
 * Events Page Component - Displays all system events with filtering and pagination
 * Shows event details including payload data for debugging and monitoring
 */
const Events = () => {
  // ==================== STATE MANAGEMENT ====================
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    eventType: "",
    searchTerm: "",
  });

  // ==================== DATA FETCHING ====================
  /**
   * useEffect hook runs when component mounts or filters/page change
   * Fetches events from API with current filters and pagination
   */
  useEffect(() => {
    fetchEvents();
  }, [page, filters.eventType]); // Re-fetch when page or eventType filter changes

  /**
   * Fetches events from backend API with current filters and pagination
   * Handles both success and error states appropriately
   */
  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters from current state
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(filters.eventType && { eventType: filters.eventType }),
      });

      console.log(`📋 Fetching events (page ${page})...`);

      const response = await api.get(`/events?${params}`);

      // Update state with API response data
      setEvents(response.data.events || []);
      setTotalPages(response.data.pagination?.totalPages || 1);

      console.log(`✅ Loaded ${response.data.events?.length || 0} events`);
    } catch (error) {
      console.error("Failed to fetch events:", error);
      setError("Failed to load events. Please try again.");
      setEvents([]); // Clear events on error
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle filter changes and reset to first page
   */
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
  };

  /**
   * Refresh events data manually
   */
  const handleRefresh = () => {
    fetchEvents();
  };

  /**
   * Clear all active filters
   */
  const clearFilters = () => {
    setFilters({ eventType: "", searchTerm: "" });
    setPage(1);
  };

  // ==================== EVENT TYPE UTILITIES ====================

  /**
   * Get appropriate icon for each event type
   * @param {string} eventType - The type of event
   * @returns {JSX.Element} React component with icon
   */
  const getEventIcon = (eventType) => {
    switch (eventType) {
      case "job.created":
        return <Briefcase size={16} />;
      case "candidate.applied":
      case "candidate.updated":
        return <User size={16} />;
      case "interview.scheduled":
        return <Calendar size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  /**
   * Get color associated with each event type for consistent styling
   * @param {string} eventType - The type of event
   * @returns {string} CSS color value
   */
  const getEventColor = (eventType) => {
    switch (eventType) {
      case "job.created":
        return "#3498db"; // Blue
      case "candidate.applied":
        return "#27ae60"; // Green
      case "interview.scheduled":
        return "#9b59b6"; // Purple
      case "candidate.updated":
        return "#f39c12"; // Orange
      case "assessment.completed":
        return "#e74c3c"; // Red
      default:
        return "#7f8c8d"; // Gray
    }
  };

  /**
   * Available event types for filter dropdown
   */
  const eventTypes = [
    "job.created",
    "candidate.applied",
    "interview.scheduled",
    "candidate.updated",
    "assessment.completed",
  ];

  // ==================== RENDER LOGIC ====================

  // Show loading state
  if (loading && events.length === 0) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading events...</p>
      </div>
    );
  }

  // Show error state
  if (error && events.length === 0) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorIcon}>⚠️</div>
        <h3>Unable to Load Events</h3>
        <p>{error}</p>
        <button onClick={handleRefresh} style={styles.retryButton}>
          Try Again
        </button>
      </div>
    );
  }

  // Calculate filtered events for display (client-side search)
  const filteredEvents = events.filter((event) => {
    if (!filters.searchTerm) return true;

    const searchLower = filters.searchTerm.toLowerCase();
    return (
      event.eventType.toLowerCase().includes(searchLower) ||
      event.sourceModule.toLowerCase().includes(searchLower) ||
      event.eventId.toLowerCase().includes(searchLower) ||
      JSON.stringify(event.payload).toLowerCase().includes(searchLower)
    );
  });

  return (
    <div style={styles.container}>
      {/* ==================== PAGE HEADER ==================== */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>System Events</h1>
          <p style={styles.subtitle}>
            Monitor and inspect all events processed by the webhook system
            {events.length > 0 &&
              ` • Showing ${filteredEvents.length} of ${events.length} events`}
          </p>
        </div>
        <button onClick={handleRefresh} style={styles.refreshButton}>
          ↻ Refresh
        </button>
      </div>

      {/* ==================== FILTERS SECTION ==================== */}
      <div style={styles.filtersCard}>
        <div style={styles.filtersHeader}>
          <Filter size={20} />
          <span>Filters</span>
        </div>

        <div style={styles.filtersGrid}>
          {/* Event Type Filter */}
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Event Type</label>
            <select
              value={filters.eventType}
              onChange={(e) =>
                handleFilterChange({ ...filters, eventType: e.target.value })
              }
              style={styles.select}
            >
              <option value="">All Event Types</option>
              {eventTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Search Filter */}
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Search</label>
            <div style={styles.searchContainer}>
              <Search size={16} style={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search events, payloads, IDs..."
                value={filters.searchTerm}
                onChange={(e) =>
                  setFilters({ ...filters, searchTerm: e.target.value })
                }
                style={styles.searchInput}
              />
            </div>
          </div>

          {/* Active Filters Indicator */}
          {(filters.eventType || filters.searchTerm) && (
            <div style={styles.activeFilters}>
              <span style={styles.activeFiltersText}>Active Filters:</span>
              {filters.eventType && (
                <span style={styles.filterTag}>Type: {filters.eventType}</span>
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

      {/* ==================== EVENTS LIST ==================== */}
      <div style={styles.eventsContainer}>
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <EventCard
              key={event._id}
              event={event}
              getEventIcon={getEventIcon}
              getEventColor={getEventColor}
            />
          ))
        ) : (
          <div style={styles.emptyState}>
            <div style={styles.emptyStateIcon}>📋</div>
            <h3>No Events Found</h3>
            <p>
              {events.length === 0
                ? "No events have been processed yet."
                : "No events match your current filters."}
            </p>
            {events.length === 0 ? (
              <p style={styles.emptyStateSubtext}>
                Events will appear here when they are received by the system.
              </p>
            ) : (
              <button onClick={clearFilters} style={styles.clearFiltersButton}>
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* ==================== PAGINATION ==================== */}
      {events.length > 0 && (
        <div style={styles.pagination}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={page === 1 ? styles.disabledButton : styles.button}
          >
            ← Previous
          </button>

          <div style={styles.pageInfo}>
            Page {page} of {totalPages}
            {totalPages > 1 && (
              <span style={styles.pageStats}>
                • {(page - 1) * 20 + 1}-{Math.min(page * 20, events.length)} of{" "}
                {events.length}
              </span>
            )}
          </div>

          <button
            onClick={() => setPage((p) => (p < totalPages ? p + 1 : p))}
            disabled={page >= totalPages}
            style={page >= totalPages ? styles.disabledButton : styles.button}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * EventCard Component - Displays individual event with expandable details
 */
const EventCard = ({ event, getEventIcon, getEventColor }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={styles.eventCard}>
      {/* Event Header - Always visible */}
      <div style={styles.eventHeader}>
        <div style={styles.eventTypeSection}>
          <span
            style={{
              ...styles.eventIcon,
              backgroundColor: getEventColor(event.eventType),
            }}
          >
            {getEventIcon(event.eventType)}
          </span>
          <div>
            <div style={styles.eventType}>{event.eventType}</div>
            <div style={styles.eventSource}>Source: {event.sourceModule}</div>
          </div>
        </div>

        <div style={styles.eventMeta}>
          <div style={styles.eventTime}>
            {new Date(event.createdAt).toLocaleString()}
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            style={styles.expandButton}
          >
            {expanded ? "▲ Details" : "▼ Details"}
          </button>
        </div>
      </div>

      {/* Event ID - Always visible */}
      <div style={styles.eventId}>
        <strong>Event ID:</strong> {event.eventId}
      </div>

      {/* Expandable Details Section */}
      {expanded && (
        <div style={styles.eventDetails}>
          {/* Payload Section */}
          <div style={styles.payloadSection}>
            <h4 style={styles.payloadTitle}>Payload Data</h4>
            <pre style={styles.payload}>
              {JSON.stringify(event.payload, null, 2)}
            </pre>
          </div>

          {/* Additional Metadata */}
          <div style={styles.metadataGrid}>
            <div style={styles.metadataItem}>
              <strong>Created:</strong>{" "}
              {new Date(event.createdAt).toLocaleString()}
            </div>
            <div style={styles.metadataItem}>
              <strong>Database ID:</strong> {event._id}
            </div>
            {event.idempotencyKey && (
              <div style={styles.metadataItem}>
                <strong>Idempotency Key:</strong> {event.idempotencyKey}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Comprehensive styles for Events page
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
  },
  errorIcon: {
    fontSize: "3rem",
    marginBottom: "1rem",
  },
  retryButton: {
    marginTop: "1rem",
    padding: "0.75rem 1.5rem",
    backgroundColor: "#3498db",
    color: "white",
    border: "none",
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

    "&:focus": {
      outline: "none",
      borderColor: "#3498db",
      boxShadow: "0 0 0 2px rgba(52, 152, 219, 0.2)",
    },
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

    "&:hover": {
      backgroundColor: "#e74c3c",
      color: "white",
    },
  },

  // Events container
  eventsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    marginBottom: "2rem",
  },

  // Event card
  eventCard: {
    backgroundColor: "white",
    padding: "1.5rem",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    border: "1px solid #e1e8ed",
    transition: "box-shadow 0.2s",

    "&:hover": {
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    },
  },
  eventHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "1rem",
    flexWrap: "wrap",
    gap: "1rem",
  },
  eventTypeSection: {
    display: "flex",
    alignItems: "flex-start",
    gap: "1rem",
    flex: 1,
  },
  eventIcon: {
    padding: "0.5rem",
    borderRadius: "6px",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  eventType: {
    fontWeight: "600",
    color: "#2c3e50",
    fontSize: "1.1rem",
    marginBottom: "0.25rem",
  },
  eventSource: {
    color: "#7f8c8d",
    fontSize: "0.9rem",
  },
  eventMeta: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "0.5rem",
    flexShrink: 0,
  },
  eventTime: {
    color: "#7f8c8d",
    fontSize: "0.9rem",
    whiteSpace: "nowrap",
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

    "&:hover": {
      backgroundColor: "#3498db",
      color: "white",
    },
  },
  eventId: {
    color: "#7f8c8d",
    fontSize: "0.85rem",
    fontFamily: "monospace",
    marginBottom: "1rem",
    padding: "0.5rem",
    backgroundColor: "#f8f9fa",
    borderRadius: "4px",
    border: "1px solid #e1e8ed",
  },

  // Event details (expanded)
  eventDetails: {
    borderTop: "1px solid #e1e8ed",
    paddingTop: "1rem",
  },
  payloadSection: {
    marginBottom: "1rem",
  },
  payloadTitle: {
    fontWeight: "600",
    color: "#2c3e50",
    margin: "0 0 0.5rem 0",
    fontSize: "1rem",
  },
  payload: {
    fontSize: "0.8rem",
    backgroundColor: "#f8f9fa",
    padding: "1rem",
    borderRadius: "6px",
    overflow: "auto",
    margin: 0,
    border: "1px solid #e1e8ed",
    maxHeight: "400px",
    fontFamily: "Monaco, Consolas, monospace",
    lineHeight: 1.4,
  },
  metadataGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "0.5rem",
    fontSize: "0.85rem",
    color: "#7f8c8d",
  },
  metadataItem: {
    padding: "0.5rem",
    backgroundColor: "#f8f9fa",
    borderRadius: "4px",
    border: "1px solid #e1e8ed",
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

  // Pagination
  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "2rem",
    padding: "1.5rem",
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    border: "1px solid #e1e8ed",
  },
  button: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#3498db",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "600",
    minWidth: "120px",

    "&:hover:not(:disabled)": {
      backgroundColor: "#2980b9",
    },
  },
  disabledButton: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#bdc3c7",
    color: "#7f8c8d",
    border: "none",
    borderRadius: "6px",
    cursor: "not-allowed",
    fontSize: "1rem",
    minWidth: "120px",
  },
  pageInfo: {
    color: "#2c3e50",
    fontWeight: "600",
    fontSize: "1rem",
  },
  pageStats: {
    color: "#7f8c8d",
    fontWeight: "normal",
    fontSize: "0.9rem",
    marginLeft: "0.5rem",
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

export default Events;
