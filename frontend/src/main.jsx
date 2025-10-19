// frontend/src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

/**
 * Main entry point for the React application
 * Renders the root component into the DOM element with id 'root'
 * StrictMode is used for highlighting potential problems during development
 */
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/*
      StrictMode helps with:
      - Identifying components with unsafe lifecycles
      - Warning about legacy string ref API usage
      - Detecting unexpected side effects
      - Detecting legacy context API
    */}
    <App />
  </React.StrictMode>
);
