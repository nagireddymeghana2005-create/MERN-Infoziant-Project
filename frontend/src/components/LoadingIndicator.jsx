import React from 'react';

const LoadingIndicator = ({ label }) => (
  <span className="loading-indicator" role="status">
    <span className="loading-indicator-spinner" aria-hidden="true" />
    <span>{label}</span>
  </span>
);

export default LoadingIndicator;
