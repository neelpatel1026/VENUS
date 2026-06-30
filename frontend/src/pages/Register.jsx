import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/auth.css';

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
    return alert(
      'Name must be at least 3 characters'
    );
  }

  // EMAIL VALIDATION
  const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return alert('Invalid email');
  }

  // PHONE VALIDATION
  const phoneRegex = /^[0-9]{10}$/;

  if (!phoneRegex.test(phone)) {
    return alert(
      'Phone number must be 10 digits'
    );
  }

  // PASSWORD VALIDATION
  if (password.length < 6) {
    return alert(
      'Password must be at least 6 characters'
    );
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

      alert(
        'Registration Successful!'
      );

      login(data);

      navigate('/');

    } else {

      alert(data.message);
    }

  } catch (error) {

    console.error(error);

    alert('Something went wrong');
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