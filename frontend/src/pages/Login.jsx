import React, {
  useState,
  useContext
} from 'react';

import {
  useNavigate,
  Link
} from 'react-router-dom';

import { AuthContext }
from '../context/AuthContext';

import '../styles/auth.css';

import { GoogleLogin }
from '@react-oauth/google';

import axios from 'axios';

import toast
from 'react-hot-toast';

const Login = () => {

  /* ================= STATES ================= */

  const [emailOrPhone, setEmailOrPhone] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const { login } =
    useContext(AuthContext);

  const navigate = useNavigate();

  /* ================= NORMAL LOGIN ================= */

  const handleSubmit = async (e) => {

    e.preventDefault();

    setLoading(true);

    try {

      const res = await fetch(
        'http://localhost:5000/api/auth/login',
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            emailOrPhone,
            password,
          }),
        }
      );

      const data = await res.json();

      if (res.ok) {

        login(data);

        toast.success(
          'Login Successful'
        );

        navigate('/');

      } else {

        toast.error(
          data.message || 'Login Failed'
        );
      }

    } catch (error) {

      console.error(error);

      toast.error(
        'Server Error'
      );

    } finally {

      setLoading(false);
    }
  };

  /* ================= GOOGLE LOGIN ================= */

  const handleGoogleSuccess = async (
    credentialResponse
  ) => {

    try {

      setLoading(true);

      const res = await axios.post(
        'http://localhost:5000/api/auth/google-login',
        {
          credential:
            credentialResponse.credential,
        }
      );

      login(res.data);

      toast.success(
        'Google Login Successful'
      );

      navigate('/');

    } catch (error) {

      console.error(error);

      toast.error(
        error?.response?.data?.message ||
        'Google Login Failed'
      );

    } finally {

      setLoading(false);
    }
  };

  /* ================= UI ================= */

  return (

    <div className="auth-container">

      <form
        onSubmit={handleSubmit}
        className="auth-form"
      >

        <h2>Login</h2>

        {/* EMAIL / PHONE */}

        <input
          type="text"
          placeholder="Email or Phone Number"
          value={emailOrPhone}
          onChange={(e) =>
            setEmailOrPhone(e.target.value)
          }
          required
        />

        {/* PASSWORD */}

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          required
        />

        {/* LOGIN BUTTON */}

        <button
          type="submit"
          className="btn"
          disabled={loading}
        >
          {
            loading
              ? 'Loading...'
              : 'Login'
          }
        </button>

        {/* GOOGLE LOGIN */}

        <div
          style={{
            marginTop: '20px',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => {

              toast.error(
                'Google Login Failed'
              );
            }}
          />
        </div>

        {/* FORGOT PASSWORD */}

        <p style={{ marginTop: '15px' }}>

          <Link to="/forgot-password">

            Forgot Password?

          </Link>

        </p>

        {/* REGISTER */}

        <p style={{ marginTop: '15px' }}>

          Don't have an account?{' '}

          <Link to="/register">

            Register

          </Link>

        </p>

      </form>

    </div>
  );
};

export default Login;