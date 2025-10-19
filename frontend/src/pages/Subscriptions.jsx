// frontend/src/pages/Subscriptions.jsx
import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Copy,
  Check,
  AlertCircle,
} from "lucide-react";
import api from "../utils/api";

/**
 * Subscriptions Page Component - Manages webhook subscription configurations
 * Allows creating, editing, deleting, and toggling subscriptions
 */
const Subscriptions = () => {
  // ==================== STATE MANAGEMENT ====================
  const [subscriptions, setSubscriptions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingSub, setEditingSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedSecret, setCopiedSecret] = useState(null);

  // Available event types for subscription configuration
  const eventTypes = [
    "job.created",
    "candidate.applied",
    "interview.scheduled",
    "candidate.updated",
    "assessment.completed",
  ];

  // ==================== DATA FETCHING ====================
  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("📋 Fetching subscriptions...");

      const response = await api.get("/subscriptions");

      // Debug: Log the response to see the data structure
      console.log("📦 Subscriptions API Response:", response.data);

      // FIX: Ensure we're setting the subscriptions array correctly
      const subscriptionsData = response.data.subscriptions || [];
      setSubscriptions(subscriptionsData);

      console.log(`✅ Loaded ${subscriptionsData.length} subscriptions`);
    } catch (error) {
      console.error("❌ Failed to fetch subscriptions:", error);
      setError(
        "Failed to load subscriptions. Please check if the backend server is running."
      );
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  // ==================== CRUD OPERATIONS ====================

  /**
   * Create a new subscription
   */
  const handleCreate = async (formData) => {
    try {
      console.log("🔄 Creating new subscription...");

      const response = await api.post("/subscriptions", formData);

      if (response.data.subscription?.secret) {
        alert(
          `✅ Subscription created successfully!\n\nIMPORTANT: Save this secret key - it won't be shown again:\n\n${response.data.subscription.secret}`
        );
      }

      setShowForm(false);
      await fetchSubscriptions();
    } catch (error) {
      console.error("❌ Failed to create subscription:", error);
      alert(
        `Failed to create subscription: ${
          error.response?.data?.error || error.message
        }`
      );
    }
  };

  /**
   * Update an existing subscription
   * FIX: Added proper error handling and debugging
   */
  const handleUpdate = async (id, updates) => {
    try {
      // FIX: Validate ID before making the request
      if (!id || id === "undefined") {
        console.error("❌ Invalid subscription ID:", id);
        alert("Invalid subscription ID. Please try again.");
        return;
      }

      console.log(`🔄 Updating subscription: ${id}`, updates);

      const response = await api.put(`/subscriptions/${id}`, updates);

      console.log("✅ Update successful:", response.data);

      setEditingSub(null);
      await fetchSubscriptions();
    } catch (error) {
      console.error("❌ Failed to update subscription:", error);
      alert(
        `Failed to update subscription: ${
          error.response?.data?.error || error.message
        }`
      );
    }
  };

  /**
   * Delete a subscription after confirmation
   */
  const handleDelete = async (id) => {
    // FIX: Validate ID before deletion
    if (!id || id === "undefined") {
      console.error("❌ Invalid subscription ID for deletion:", id);
      alert("Invalid subscription ID.");
      return;
    }

    const subscription = subscriptions.find((sub) => sub._id === id);
    if (!subscription) return;

    if (
      window.confirm(
        `Are you sure you want to delete the subscription "${subscription.name}"? This action cannot be undone.`
      )
    ) {
      try {
        console.log(`🗑️ Deleting subscription: ${id}`);

        await api.delete(`/subscriptions/${id}`);
        await fetchSubscriptions();
      } catch (error) {
        console.error("❌ Failed to delete subscription:", error);
        alert(
          `Failed to delete subscription: ${
            error.response?.data?.error || error.message
          }`
        );
      }
    }
  };

  /**
   * Toggle subscription active/inactive status
   * FIX: Added ID validation and debugging
   */
  const toggleSubscription = async (subscription) => {
    try {
      // Validate subscription object and extract ID
      const id = subscription?._id || subscription?.id;
      if (!subscription || !id) {
        console.error("❌ Invalid subscription object:", subscription);
        alert(
          "Invalid subscription data. Please refresh the page and try again."
        );
        return;
      }

      console.log(
        `🔄 Toggling subscription ${id} from ${
          subscription.isActive
        } to ${!subscription.isActive}`
      );

      // Toggle isActive
      await handleUpdate(id, { isActive: !subscription.isActive });
    } catch (error) {
      console.error("❌ Failed to toggle subscription:", error);
    }
  };

  /**
   * Copy secret to clipboard
   */
  const copyToClipboard = async (secret, subscriptionId) => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopiedSecret(subscriptionId);

      setTimeout(() => {
        setCopiedSecret(null);
      }, 2000);
    } catch (error) {
      console.error("❌ Failed to copy secret:", error);
      alert("Failed to copy secret to clipboard");
    }
  };

  /**
   * Refresh subscriptions manually
   */
  const handleRefresh = () => {
    fetchSubscriptions();
  };

  // ==================== RENDER LOGIC ====================

  if (loading && subscriptions.length === 0) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading subscriptions...</p>
      </div>
    );
  }

  if (error && subscriptions.length === 0) {
    return (
      <div style={styles.errorContainer}>
        <AlertCircle size={48} color="#e74c3c" />
        <h3>Unable to Load Subscriptions</h3>
        <p>{error}</p>
        <button onClick={handleRefresh} style={styles.retryButton}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* ==================== PAGE HEADER ==================== */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Webhook Subscriptions</h1>
          <p style={styles.subtitle}>
            Manage external system webhook endpoints and event subscriptions
            {subscriptions.length > 0 &&
              ` • ${subscriptions.filter((sub) => sub.isActive).length} of ${
                subscriptions.length
              } active`}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          style={styles.addButton}
          disabled={showForm || editingSub}
        >
          <Plus size={20} />
          Add Subscription
        </button>
      </div>

      {/* ==================== CREATE/EDIT FORMS ==================== */}
      {showForm && (
        <SubscriptionForm
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
          eventTypes={eventTypes}
          mode="create"
        />
      )}

      {editingSub && (
        <SubscriptionForm
          subscription={editingSub}
          onSubmit={(data) => {
            // FIX: Ensure we have a valid ID before updating
            if (!editingSub._id) {
              console.error("❌ Editing subscription has no ID:", editingSub);
              alert("Cannot update subscription: Invalid ID");
              return;
            }
            handleUpdate(editingSub._id, data);
          }}
          onCancel={() => setEditingSub(null)}
          eventTypes={eventTypes}
          mode="edit"
        />
      )}

      {/* ==================== SUBSCRIPTIONS GRID ==================== */}
      <div style={styles.subscriptionsContainer}>
        {subscriptions.length > 0 ? (
          <div style={styles.subscriptionsGrid}>
            {subscriptions.map((subscription, index) => (
              <SubscriptionCard
                key={subscription._id || subscription.id || index} // fallback to index
                subscription={subscription}
                onEdit={setEditingSub}
                onDelete={handleDelete}
                onToggle={toggleSubscription}
                onCopySecret={copyToClipboard}
                isCopied={
                  copiedSecret === (subscription._id || subscription.id)
                }
              />
            ))}
          </div>
        ) : (
          <div style={styles.emptyState}>
            <div style={styles.emptyStateIcon}>🔔</div>
            <h3>No Subscriptions Yet</h3>
            <p>
              Create your first webhook subscription to start receiving events.
            </p>
            <button onClick={() => setShowForm(true)} style={styles.addButton}>
              <Plus size={20} />
              Create First Subscription
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * SubscriptionForm Component - Handles creating and editing subscriptions
 */
const SubscriptionForm = ({
  subscription,
  onSubmit,
  onCancel,
  eventTypes,
  mode,
}) => {
  const [formData, setFormData] = useState({
    name: subscription?.name || "",
    description: subscription?.description || "",
    webhookUrl: subscription?.webhookUrl || "",
    eventTypes: subscription?.eventTypes || [],
    maxRetries: subscription?.maxRetries || 3,
    timeout: subscription?.timeout || 5000,
    isActive:
      subscription?.isActive !== undefined ? subscription.isActive : true,
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.length > 100) {
      newErrors.name = "Name must be less than 100 characters";
    }

    if (!formData.webhookUrl.trim()) {
      newErrors.webhookUrl = "Webhook URL is required";
    } else if (!isValidUrl(formData.webhookUrl)) {
      newErrors.webhookUrl = "Please enter a valid URL";
    }

    if (formData.eventTypes.length === 0) {
      newErrors.eventTypes = "At least one event type must be selected";
    }

    if (formData.maxRetries < 1 || formData.maxRetries > 10) {
      newErrors.maxRetries = "Max retries must be between 1 and 10";
    }

    if (formData.timeout < 1000 || formData.timeout > 30000) {
      newErrors.timeout = "Timeout must be between 1000 and 30000 milliseconds";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleEventType = (eventType) => {
    setFormData((prev) => ({
      ...prev,
      eventTypes: prev.eventTypes.includes(eventType)
        ? prev.eventTypes.filter((et) => et !== eventType)
        : [...prev.eventTypes, eventType],
    }));

    if (errors.eventTypes) {
      setErrors((prev) => ({ ...prev, eventTypes: null }));
    }
  };

  const selectAllEventTypes = () => {
    setFormData((prev) => ({
      ...prev,
      eventTypes: [...eventTypes],
    }));
    setErrors((prev) => ({ ...prev, eventTypes: null }));
  };

  const clearAllEventTypes = () => {
    setFormData((prev) => ({
      ...prev,
      eventTypes: [],
    }));
  };

  return (
    <div style={styles.formOverlay}>
      <div style={styles.formCard}>
        <h2 style={styles.formTitle}>
          {mode === "create" ? "Create New Subscription" : "Edit Subscription"}
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Name Field */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Name *
              {errors.name && (
                <span style={styles.errorText}> - {errors.name}</span>
              )}
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              style={
                errors.name
                  ? { ...styles.input, borderColor: "#e74c3c" }
                  : styles.input
              }
              placeholder="Enter subscription name"
              disabled={submitting}
            />
          </div>

          {/* Description Field */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              style={styles.textarea}
              placeholder="Describe what this subscription is for..."
              rows="3"
              disabled={submitting}
            />
          </div>

          {/* Webhook URL Field */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Webhook URL *
              {errors.webhookUrl && (
                <span style={styles.errorText}> - {errors.webhookUrl}</span>
              )}
            </label>
            <input
              type="url"
              value={formData.webhookUrl}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, webhookUrl: e.target.value }))
              }
              style={
                errors.webhookUrl
                  ? { ...styles.input, borderColor: "#e74c3c" }
                  : styles.input
              }
              placeholder="https://example.com/webhook"
              disabled={submitting}
            />
          </div>

          {/* Event Types Field */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Event Types *
              {errors.eventTypes && (
                <span style={styles.errorText}> - {errors.eventTypes}</span>
              )}
            </label>

            <div style={styles.eventTypesHeader}>
              <span style={styles.selectedCount}>
                {formData.eventTypes.length} of {eventTypes.length} selected
              </span>
              <div style={styles.eventTypesActions}>
                <button
                  type="button"
                  onClick={selectAllEventTypes}
                  style={styles.smallButton}
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={clearAllEventTypes}
                  style={styles.smallButton}
                >
                  Clear All
                </button>
              </div>
            </div>

            <div
              style={
                errors.eventTypes
                  ? { ...styles.eventTypesGrid, borderColor: "#e74c3c" }
                  : styles.eventTypesGrid
              }
            >
              {eventTypes.map((eventType) => (
                <label key={eventType} style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.eventTypes.includes(eventType)}
                    onChange={() => toggleEventType(eventType)}
                    style={styles.checkbox}
                    disabled={submitting}
                  />
                  <span style={styles.checkboxText}>{eventType}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Configuration Fields */}
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Max Retries
                {errors.maxRetries && (
                  <span style={styles.errorText}> - {errors.maxRetries}</span>
                )}
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.maxRetries}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    maxRetries: parseInt(e.target.value) || 1,
                  }))
                }
                style={
                  errors.maxRetries
                    ? { ...styles.input, borderColor: "#e74c3c" }
                    : styles.input
                }
                disabled={submitting}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Timeout (ms)
                {errors.timeout && (
                  <span style={styles.errorText}> - {errors.timeout}</span>
                )}
              </label>
              <input
                type="number"
                min="1000"
                max="30000"
                step="1000"
                value={formData.timeout}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    timeout: parseInt(e.target.value) || 5000,
                  }))
                }
                style={
                  errors.timeout
                    ? { ...styles.input, borderColor: "#e74c3c" }
                    : styles.input
                }
                disabled={submitting}
              />
            </div>
          </div>

          {/* Active Toggle */}
          <div style={styles.formGroup}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    isActive: e.target.checked,
                  }))
                }
                style={styles.checkbox}
                disabled={submitting}
              />
              <span style={styles.checkboxText}>Active Subscription</span>
            </label>
            <div style={styles.helpText}>
              Inactive subscriptions will not receive any events
            </div>
          </div>

          {/* Form Actions */}
          <div style={styles.formActions}>
            <button
              type="button"
              onClick={onCancel}
              style={styles.cancelButton}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={styles.submitButton}
              disabled={submitting}
            >
              {submitting
                ? "Saving..."
                : mode === "create"
                ? "Create Subscription"
                : "Update Subscription"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * SubscriptionCard Component - Displays individual subscription
 * FIX: Added proper keys for event types mapping
 */
const SubscriptionCard = ({
  subscription,
  onEdit,
  onDelete,
  onToggle,
  onCopySecret,
  isCopied,
}) => {
  const [showSecret, setShowSecret] = useState(false);

  // Calculate event type distribution for visual indicator
  const eventTypeColors = {
    "job.created": "#3498db",
    "candidate.applied": "#27ae60",
    "interview.scheduled": "#9b59b6",
    "candidate.updated": "#f39c12",
    "assessment.completed": "#e74c3c",
  };

  return (
    <div style={styles.subscriptionCard}>
      {/* Card Header with Actions */}
      <div style={styles.cardHeader}>
        <div style={styles.cardTitleSection}>
          <h3 style={styles.cardTitle}>{subscription.name}</h3>
          <div
            style={
              subscription.isActive
                ? styles.statusActive
                : styles.statusInactive
            }
          >
            {subscription.isActive ? "Active" : "Inactive"}
          </div>
        </div>

        <div style={styles.cardActions}>
          {/* Toggle Active/Inactive */}
          <button
            onClick={() => onToggle(subscription)}
            style={styles.iconButton}
            title={subscription.isActive ? "Deactivate" : "Activate"}
          >
            {subscription.isActive ? (
              <ToggleRight color="#27ae60" size={20} />
            ) : (
              <ToggleLeft color="#95a5a6" size={20} />
            )}
          </button>

          {/* Edit Button */}
          <button
            onClick={() => onEdit(subscription)}
            style={styles.iconButton}
            title="Edit"
          >
            <Edit2 size={16} color="#3498db" />
          </button>

          {/* Delete Button */}
          <button
            onClick={() => onDelete(subscription._id)}
            style={styles.iconButton}
            title="Delete"
          >
            <Trash2 size={16} color="#e74c3c" />
          </button>
        </div>
      </div>

      {/* Description */}
      {subscription.description && (
        <p style={styles.cardDescription}>{subscription.description}</p>
      )}

      {/* Webhook URL */}
      <div style={styles.cardField}>
        <strong>Webhook URL:</strong>
        <div style={styles.urlContainer}>
          <span style={styles.url}>{subscription.webhookUrl}</span>
        </div>
      </div>

      {/* Event Types */}
      <div style={styles.cardField}>
        <strong>Event Types:</strong>
        <div style={styles.eventTypesContainer}>
          {/* Visual event type indicator */}
          {/* FIX: Added proper key for eventTypeDot mapping */}
          <div style={styles.eventTypesVisual}>
            {Object.keys(eventTypeColors).map((eventType) => (
              <div
                key={`dot-${eventType}`} // FIX: Unique key for each dot
                style={{
                  ...styles.eventTypeDot,
                  backgroundColor: subscription.eventTypes.includes(eventType)
                    ? eventTypeColors[eventType]
                    : "#ecf0f1",
                  border: subscription.eventTypes.includes(eventType)
                    ? "none"
                    : "2px solid #bdc3c7",
                }}
                title={eventType}
              />
            ))}
          </div>

          {/* Event type tags */}
          {/* FIX: Added proper key for event tags mapping */}
          <div style={styles.eventTypes}>
            {subscription.eventTypes.map((type, index) => (
              <span
                key={`${type}-${index}`} // FIX: Unique key using type and index
                style={{
                  ...styles.eventTag,
                  backgroundColor: eventTypeColors[type] || "#95a5a6",
                }}
              >
                {type}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Configuration Details */}
      <div style={styles.configGrid}>
        <div style={styles.configItem}>
          <strong>Max Retries:</strong> {subscription.maxRetries}
        </div>
        <div style={styles.configItem}>
          <strong>Timeout:</strong> {subscription.timeout}ms
        </div>
        <div style={styles.configItem}>
          <strong>Deliveries:</strong> {subscription.deliveryCount || 0}
        </div>
      </div>

      {/* Secret Section (for newly created subscriptions) */}
      {subscription.secret && (
        <div style={styles.secretSection}>
          <div style={styles.secretHeader}>
            <strong>Secret Key:</strong>
            <div style={styles.secretActions}>
              <button
                onClick={() => setShowSecret(!showSecret)}
                style={styles.smallButton}
              >
                {showSecret ? "Hide" : "Show"}
              </button>
              <button
                onClick={() =>
                  onCopySecret(subscription.secret, subscription._id)
                }
                style={styles.smallButton}
                title="Copy to clipboard"
              >
                {isCopied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>
          {showSecret && (
            <div style={styles.secretValue}>{subscription.secret}</div>
          )}
          <div style={styles.secretWarning}>
            ⚠️ Save this secret securely - it won't be shown again
          </div>
        </div>
      )}

      {/* Footer with Timestamps */}
      <div style={styles.cardFooter}>
        <span style={styles.createdDate}>
          Created: {new Date(subscription.createdAt).toLocaleDateString()}
        </span>
        {subscription.updatedAt &&
          subscription.updatedAt !== subscription.createdAt && (
            <span style={styles.updatedDate}>
              Updated: {new Date(subscription.updatedAt).toLocaleDateString()}
            </span>
          )}
      </div>
    </div>
  );
};

// ==================== STYLES ====================
const styles = {
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
  },
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
  retryButton: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#3498db",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "600",
    marginTop: "1.5rem",
  },
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
  addButton: {
    backgroundColor: "#27ae60",
    color: "white",
    border: "none",
    padding: "0.75rem 1.5rem",
    borderRadius: "6px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "1rem",
    fontWeight: "600",
    whiteSpace: "nowrap",
  },
  formOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    padding: "1rem",
  },
  formCard: {
    backgroundColor: "white",
    padding: "2rem",
    borderRadius: "8px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    width: "90%",
    maxWidth: "600px",
    maxHeight: "90vh",
    overflow: "auto",
  },
  formTitle: {
    fontSize: "1.5rem",
    fontWeight: "600",
    margin: "0 0 1.5rem 0",
    color: "#2c3e50",
  },
  formGroup: {
    marginBottom: "1.5rem",
  },
  formRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1rem",
  },
  label: {
    display: "block",
    marginBottom: "0.5rem",
    fontWeight: "600",
    color: "#2c3e50",
    fontSize: "0.95rem",
  },
  input: {
    width: "100%",
    padding: "0.75rem",
    border: "1px solid #ddd",
    borderRadius: "6px",
    fontSize: "1rem",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    padding: "0.75rem",
    border: "1px solid #ddd",
    borderRadius: "6px",
    fontSize: "1rem",
    resize: "vertical",
    minHeight: "80px",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
  eventTypesHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.5rem",
  },
  selectedCount: {
    fontSize: "0.9rem",
    color: "#7f8c8d",
  },
  eventTypesActions: {
    display: "flex",
    gap: "0.5rem",
  },
  eventTypesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "0.75rem",
    padding: "1rem",
    border: "1px solid #ddd",
    borderRadius: "6px",
    backgroundColor: "#f8f9fa",
    maxHeight: "200px",
    overflow: "auto",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    cursor: "pointer",
    fontSize: "0.9rem",
  },
  checkbox: {
    margin: 0,
  },
  checkboxText: {
    userSelect: "none",
  },
  smallButton: {
    padding: "0.25rem 0.5rem",
    backgroundColor: "transparent",
    color: "#3498db",
    border: "1px solid #3498db",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.8rem",
  },
  helpText: {
    fontSize: "0.8rem",
    color: "#7f8c8d",
    marginTop: "0.25rem",
  },
  errorText: {
    color: "#e74c3c",
    fontWeight: "normal",
    fontSize: "0.9rem",
  },
  formActions: {
    display: "flex",
    gap: "1rem",
    justifyContent: "flex-end",
    marginTop: "2rem",
    paddingTop: "1rem",
    borderTop: "1px solid #e1e8ed",
  },
  cancelButton: {
    padding: "0.75rem 1.5rem",
    border: "1px solid #ddd",
    backgroundColor: "white",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "600",
  },
  submitButton: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#3498db",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "600",
  },
  subscriptionsContainer: {
    marginBottom: "2rem",
  },
  subscriptionsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))",
    gap: "1.5rem",
  },
  subscriptionCard: {
    backgroundColor: "white",
    padding: "1.5rem",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    border: "1px solid #e1e8ed",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "1rem",
  },
  cardTitleSection: {
    flex: 1,
  },
  cardTitle: {
    fontSize: "1.25rem",
    fontWeight: "600",
    margin: "0 0 0.5rem 0",
    color: "#2c3e50",
    lineHeight: 1.3,
  },
  statusActive: {
    color: "#27ae60",
    fontWeight: "600",
    fontSize: "0.9rem",
    backgroundColor: "#d5f4e6",
    padding: "0.25rem 0.75rem",
    borderRadius: "12px",
    display: "inline-block",
  },
  statusInactive: {
    color: "#95a5a6",
    fontWeight: "600",
    fontSize: "0.9rem",
    backgroundColor: "#ecf0f1",
    padding: "0.25rem 0.75rem",
    borderRadius: "12px",
    display: "inline-block",
  },
  cardActions: {
    display: "flex",
    gap: "0.25rem",
    flexShrink: 0,
  },
  iconButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "0.5rem",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  cardDescription: {
    color: "#7f8c8d",
    margin: 0,
    lineHeight: 1.5,
    fontSize: "0.95rem",
  },
  cardField: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  urlContainer: {
    display: "flex",
    alignItems: "center",
  },
  url: {
    fontFamily: "monospace",
    fontSize: "0.9rem",
    color: "#3498db",
    wordBreak: "break-all",
    backgroundColor: "#f8f9fa",
    padding: "0.5rem",
    borderRadius: "4px",
    border: "1px solid #e1e8ed",
    flex: 1,
  },
  eventTypesContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  eventTypesVisual: {
    display: "flex",
    gap: "0.25rem",
    height: "8px",
  },
  eventTypeDot: {
    flex: 1,
    borderRadius: "4px",
  },
  eventTypes: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.5rem",
  },
  eventTag: {
    color: "white",
    padding: "0.25rem 0.5rem",
    borderRadius: "12px",
    fontSize: "0.75rem",
    fontWeight: "500",
  },
  configGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
    gap: "0.5rem",
    fontSize: "0.9rem",
    color: "#7f8c8d",
  },
  configItem: {
    padding: "0.5rem",
    backgroundColor: "#f8f9fa",
    borderRadius: "4px",
    textAlign: "center",
    border: "1px solid #e1e8ed",
  },
  secretSection: {
    padding: "1rem",
    backgroundColor: "#fff3cd",
    border: "1px solid #ffeaa7",
    borderRadius: "6px",
  },
  secretHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.5rem",
  },
  secretActions: {
    display: "flex",
    gap: "0.5rem",
  },
  secretValue: {
    fontFamily: "monospace",
    fontSize: "0.8rem",
    backgroundColor: "#fef9e7",
    padding: "0.75rem",
    borderRadius: "4px",
    border: "1px solid #f7dc6f",
    wordBreak: "break-all",
    marginBottom: "0.5rem",
  },
  secretWarning: {
    fontSize: "0.8rem",
    color: "#856404",
    fontWeight: "500",
  },
  cardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "auto",
    paddingTop: "1rem",
    borderTop: "1px solid #e1e8ed",
    fontSize: "0.8rem",
    color: "#95a5a6",
    flexWrap: "wrap",
    gap: "0.5rem",
  },
  createdDate: {
    fontSize: "0.8rem",
  },
  updatedDate: {
    fontSize: "0.8rem",
    fontStyle: "italic",
  },
  emptyState: {
    textAlign: "center",
    padding: "4rem 2rem",
    color: "#95a5a6",
  },
  emptyStateIcon: {
    fontSize: "4rem",
    marginBottom: "1rem",
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

export default Subscriptions;
