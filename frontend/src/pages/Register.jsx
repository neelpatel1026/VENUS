import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/auth.css';
import toast from 'react-hot-toast';

const Register = () => {

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const { login } = useContext(AuthContext);

  const navigate = useNavigate();



  const handleSubmit = async (e) => {

  e.preventDefault();

  // NAME VALIDATION
  if (name.trim().length < 3) {
    toast.error('Name must be at least 3 characters');
    return;
  }

  // EMAIL VALIDATION
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    toast.error('Invalid email format');
    return;
  }

  // PHONE VALIDATION
  const phoneRegex = /^[0-9]{10}$/;

  if (!phoneRegex.test(phone)) {
    toast.error('Phone number must be exactly 10 digits');
    return;
  }

  // PASSWORD VALIDATION
  if (password.length < 6) {
    toast.error('Password must be at least 6 characters');
    return;
  }

  try {

    const res = await fetch(
      'http://localhost:5000/api/auth/register',
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          name: name.trim(),
          email: email.toLowerCase().trim(),
          phone,
          password,
        }),
      }
    );

    const data = await res.json();

    if (res.ok) {
      toast.success('Registration Successful! Welcome to VENUS CARE.');
      login(data);
      navigate('/');
    } else {
      toast.error(data.message || 'Registration failed');
    }
  } catch (error) {
    console.error(error);
    toast.error('Something went wrong. Please try again.');
  }
};

  return (

    <div className="auth-container">

      <form
        onSubmit={handleSubmit}
        className="auth-form"
      >

        <h2>Register</h2>

        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
          required
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          required
        />

      

        <input
  type="tel"
  placeholder="Phone Number"
  value={phone}
  onChange={(e) => {

    // ONLY NUMBERS
    const value = e.target.value.replace(/\D/g, '');

    // MAX 10 DIGITS
    if (value.length <= 10) {
      setPhone(value);
    }
  }}
  pattern="[0-9]{10}"
  maxLength="10"
  required
/>

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          required
        />

        <button
          type="submit"
          className="btn"
        >
          Register
        </button>

        <p>
          Already have an account?{' '}
          <Link to="/login">
            Login
          </Link>
        </p>

      </form>

    </div>
  );
};

export default Register;