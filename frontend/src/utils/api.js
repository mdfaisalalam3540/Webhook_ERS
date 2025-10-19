// frontend/src/utils/api.js
import axios from "axios";

/**
 * API Client Configuration
 * Centralized Axios instance for all API calls to the backend
 * Includes base configuration, request/response interceptors, and error handling
 */

// Create Axios instance with default configuration
const api = axios.create({
  // Base URL for all API requests - can be configured via environment variable
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api",

  // Request timeout (10 seconds)
  timeout: 10000,

  // Default headers for all requests
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ==================== REQUEST INTERCEPTOR ====================
/**
 * Intercept requests before they are sent
 * Useful for adding authentication tokens, logging, etc.
 */
api.interceptors.request.use(
  (config) => {
    // Log request details in development
    if (import.meta.env.DEV) {
      console.log(
        `🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`,
        {
          data: config.data,
          params: config.params,
        }
      );
    }

    // You can add authentication headers here if needed
    // const token = localStorage.getItem('authToken');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }

    return config;
  },
  (error) => {
    // Handle request errors
    console.error("❌ API Request Error:", error);
    return Promise.reject(error);
  }
);

// ==================== RESPONSE INTERCEPTOR ====================
/**
 * Intercept responses before they are handled by the calling code
 * Handles common response patterns and errors
 */
api.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (import.meta.env.DEV) {
      console.log(
        `✅ API Response: ${response.status} ${response.config.url}`,
        {
          data: response.data,
        }
      );
    }

    // Return the successful response
    return response;
  },
  (error) => {
    // Handle response errors
    console.error("❌ API Response Error:", {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      response: error.response?.data,
    });

    // Enhanced error handling with specific cases
    if (error.response) {
      // Server responded with error status (4xx, 5xx)
      const { status, data } = error.response;

      switch (status) {
        case 400:
          error.message = data.error || "Bad Request - Please check your input";
          break;
        case 401:
          error.message = "Unauthorized - Please check your authentication";
          // You could redirect to login here
          // window.location.href = '/login';
          break;
        case 403:
          error.message =
            "Forbidden - You don't have permission for this action";
          break;
        case 404:
          error.message = data.error || "Resource not found";
          break;
        case 409:
          error.message = data.error || "Conflict - Resource already exists";
          break;
        case 422:
          error.message =
            data.error || "Validation Error - Please check your input";
          break;
        case 429:
          error.message = "Too Many Requests - Please slow down";
          break;
        case 500:
          error.message = "Server Error - Please try again later";
          break;
        case 502:
          error.message = "Bad Gateway - Backend service is unavailable";
          break;
        case 503:
          error.message =
            "Service Unavailable - Backend is undergoing maintenance";
          break;
        default:
          error.message = data.error || `Server Error (${status})`;
      }
    } else if (error.request) {
      // Request was made but no response received
      if (error.code === "ECONNABORTED") {
        error.message =
          "Request timeout - Please check your connection and try again";
      } else {
        error.message = "Network error - Please check your internet connection";
      }
    } else {
      // Something else happened while setting up the request
      error.message = error.message || "Unknown error occurred";
    }

    // Show user-friendly error messages (optional)
    if (import.meta.env.DEV) {
      // In development, show detailed errors
      console.error("💥 API Error Details:", error);
    }

    return Promise.reject(error);
  }
);

// ==================== API HELPER FUNCTIONS ====================

/**
 * Health check - verify backend connectivity
 * @returns {Promise<boolean>} True if backend is reachable
 */
export const checkBackendHealth = async () => {
  try {
    const response = await api.get("/health");
    return response.status === 200;
  } catch (error) {
    console.error("Backend health check failed:", error);
    return false;
  }
};

/**
 * Test webhook endpoint connectivity
 * @param {string} webhookUrl - The URL to test
 * @param {object} testPayload - Sample payload to send
 * @returns {Promise<object>} Test result
 */
export const testWebhookEndpoint = async (
  webhookUrl,
  testPayload = { test: true }
) => {
  try {
    const response = await axios.post(webhookUrl, testPayload, {
      timeout: 5000,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Algohire-Webhook-Test/1.0",
      },
    });

    return {
      success: true,
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      status: error.response?.status,
    };
  }
};

// Export the configured API instance
export default api;
