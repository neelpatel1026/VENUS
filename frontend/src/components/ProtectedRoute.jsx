import React, { useContext } from 'react';

import { Navigate } from 'react-router-dom';

import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {

  const { user, loading } =
    useContext(AuthContext);

  // LOADING STATE

  if (loading) {

    return null;
  }

  // NOT LOGGED IN

  if (!user) {

    return <Navigate to="/login" replace />;
  }

  // USER LOGGED IN

  return children;
};

export default ProtectedRoute;