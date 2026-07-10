import {
  createContext,
  useState,
  useEffect
} from 'react';

import axios from 'axios';

import { useDispatch } from 'react-redux';

import { clearCart } from '../redux/cartSlice.js';

/* ================= CREATE CONTEXT ================= */

export const AuthContext = createContext();

/* ================= PROVIDER ================= */

export const AuthProvider = ({ children }) => {

  /* ================= REDUX ================= */

  const dispatch = useDispatch();

  /* ================= STATES ================= */

  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);

  /* ================= LOGOUT ================= */

  const logout = () => {

    try {

      // CLEAR USER STATE

      setUser(null);

      // CLEAR STORAGE

      localStorage.removeItem('userInfo');

      localStorage.removeItem('token');

      // CLEAR REDUX CART

      dispatch(clearCart());

    } catch (error) {

      console.error(
        'Logout error:',
        error
      );
    }
  };

  /* ================= LOGIN ================= */

  const login = (userData) => {

    try {

      // SAVE USER STATE

      setUser(userData);

      // SAVE USER INFO

      localStorage.setItem(
        'userInfo',
        JSON.stringify(userData)
      );

    } catch (error) {

      console.error(
        'Login storage error:',
        error
      );
    }
  };

  /* ================= CHECK AUTH ================= */

  useEffect(() => {

    const checkAuth = async () => {

      try {

        // GET STORED USER

        const storedUser =
          localStorage.getItem('userInfo');

        // NO USER FOUND

        if (!storedUser) {

          setLoading(false);

          return;
        }

        // PARSE USER

        const parsedUser =
          JSON.parse(storedUser);

        // GET TOKEN

        const token = parsedUser.token;

        // INVALID TOKEN

        if (!token) {

          logout();

          setLoading(false);

          return;
        }

        // VERIFY USER FROM BACKEND

        const { data } = await axios.get(
          'http://localhost:5000/api/auth/me',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // VALID USER

        setUser({
          ...data.user,
          token,
        });

      } catch (error) {
        console.log('Auth check failed:', error);
        // Only auto-logout on explicit auth invalidation (401 or 403 status)
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          logout();
        }

      } finally {

        setLoading(false);
      }
    };

    checkAuth();

  }, []);

  /* ================= CONTEXT VALUE ================= */

  const value = {

    user,

    setUser,

    login,

    logout,

    loading,

    isAuthenticated: !!user,
  };

  /* ================= PROVIDER ================= */

  return (

    <AuthContext.Provider value={value}>

      {children}

    </AuthContext.Provider>
  );
};


