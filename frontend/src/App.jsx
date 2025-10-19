// frontend/src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Events from "./pages/Events";
import Subscriptions from "./pages/Subscriptions";
import DeliveryLogs from "./pages/DeliveryLogs";

/**
 * Main App Component - Root component of the application
 * Sets up routing and global layout structure
 * Contains the navigation bar and main content area
 */
function App() {
  return (
    <Router>
      {/*
        BrowserRouter enables client-side routing
        Allows navigation without page refreshes
      */}
      <div style={styles.app}>
        {/* ==================== NAVIGATION BAR ==================== */}
        <nav style={styles.navbar}>
          {/* Brand/Logo Section */}
          <div style={styles.navBrand}>
            <h1 style={styles.brandText}>AlgoHire Webhook Relay</h1>
          </div>

          {/* Navigation Links */}
          <div style={styles.navLinks}>
            <Link to="/" style={styles.navLink}>
              Dashboard
            </Link>
            <Link to="/events" style={styles.navLink}>
              Events
            </Link>
            <Link to="/subscriptions" style={styles.navLink}>
              Subscriptions
            </Link>
            <Link to="/logs" style={styles.navLink}>
              Delivery Logs
            </Link>
          </div>
        </nav>

        {/* ==================== MAIN CONTENT AREA ==================== */}
        <main style={styles.main}>
          {/*
            Routes define the mapping between URLs and components
            Only one route is rendered at a time based on the current URL
          */}
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/events" element={<Events />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/logs" element={<DeliveryLogs />} />

            {/*
              Optional: Add a 404 catch-all route
              <Route path="*" element={<NotFound />} />
            */}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

/**
 * Inline styles for the App component
 * Using JavaScript objects for styling (alternative to CSS files)
 * Provides scoped styling and dynamic styling capabilities
 */
const styles = {
  // Main app container - takes full viewport height
  app: {
    minHeight: "100vh",
    backgroundColor: "#f5f5f5", // Light gray background
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
  },

  // Navigation bar styling
  navbar: {
    backgroundColor: "#2c3e50", // Dark blue-gray
    color: "white",
    padding: "0 2rem", // Horizontal padding only
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    height: "60px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)", // Subtle shadow for depth
    position: "sticky", // Sticks to top when scrolling
    top: 0,
    zIndex: 1000, // Ensure navbar stays above other content
  },

  // Brand/logo section styling
  navBrand: {
    display: "flex",
    alignItems: "center",
  },

  // Brand text styling
  brandText: {
    margin: 0,
    fontSize: "1.5rem",
    fontWeight: "600",
    letterSpacing: "-0.5px", // Tighter letter spacing for modern look
  },

  // Navigation links container
  navLinks: {
    display: "flex",
    gap: "2rem", // Space between links
  },

  // Individual navigation link styling
  navLink: {
    color: "white",
    textDecoration: "none",
    padding: "0.5rem 1rem",
    borderRadius: "4px",
    transition: "background-color 0.2s ease-in-out", // Smooth hover effect
    fontWeight: "500",

    // Hover effect
    ":hover": {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
  },

  // Main content area styling
  main: {
    padding: "2rem",
    maxWidth: "1200px", // Limit width for better readability on large screens
    margin: "0 auto", // Center the content
    minHeight: "calc(100vh - 60px)", // Full height minus navbar
  },
};

// Export the App component as default
export default App;
