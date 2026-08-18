import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useContext(AuthContext);

  // LOADING STATE
  if (loading) {
    return null;
  }

  // NOT LOGGED IN
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ADMIN ONLY CHECK
  if (adminOnly && user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  // AUTHORIZED
  return children;
};

export default ProtectedRoute;