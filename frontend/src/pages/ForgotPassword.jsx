// import React, { useState } from 'react';
// import axios from 'axios';

// const ForgotPassword = () => {

//   const [email, setEmail] = useState('');
//   const [otp, setOtp] = useState('');
//   const [newPassword, setNewPassword] = useState('');

//   const sendOtp = async () => {

//     await axios.post(
//       'http://localhost:5000/api/auth/forgot-password',
//       { email }
//     );

//     alert('OTP Sent');
//   };

//   const resetPassword = async () => {

//     await axios.post(
//       'http://localhost:5000/api/auth/reset-password',
//       {
//         email,
//         otp,
//         newPassword,
//       }
//     );

//     alert('Password Reset Successful');
//   };

//   return (
//     <div>

//       <input
//         type="email"
//         placeholder="Enter Email"
//         onChange={(e) => setEmail(e.target.value)}
//       />

//       <button onClick={sendOtp}>
//         Send OTP
//       </button>
//       <input
//         type="text"
//         placeholder="Enter OTP"
//         onChange={(e) => setOtp(e.target.value)}
//       />

//       <input
//         type="password"
//         placeholder="New Password"
//         onChange={(e) => setNewPassword(e.target.value)}
//       />

//       <button onClick={resetPassword}>
//         Reset Password
//       </button>

//     </div>
//   );
// };

// export default ForgotPassword;

//second version with better UI and error handling

// import React, { useState } from 'react';
// import axios from 'axios';
// import '../styles/auth.css';
// import { useNavigate } from 'react-router-dom';


// const ForgotPassword = () => {

//   const [email, setEmail] = useState('');
//   const [otp, setOtp] = useState('');
//   const [newPassword, setNewPassword] = useState('');
//   const navigate = useNavigate();
//   const [otpSent, setOtpSent] = useState(false);
//   const [loading, setLoading] = useState(false);
//   // Send OTP
//   const sendOtp = async () => {
    

//     try {

//       await axios.post(
//         'http://localhost:5000/api/auth/forgot-password',
//         { email }
//       );

//     //   alert('OTP Sent Successfully');
//     alert('OTP Sent Successfully');

// setOtpSent(true);
      
//     } catch (error) {

//       console.log(error);

//       alert('Failed To Send OTP');
//     }
//   };

//   // Reset Password
//   const resetPassword = async () => {

//     try {

//       await axios.post(
//         'http://localhost:5000/api/auth/reset-password',
//         {
//           email,
//           otp,
//           newPassword,
//         }
//       );

//     //   alert('Password Reset Successful');
//     alert('Password Reset Successful');

// setEmail('');
// setOtp('');
// setNewPassword('');

// navigate('/login');

//     } catch (error) {

//       console.log(error);

//       alert('Reset Failed');
//     }
//   };

//   return (

//     <div className="auth-container">

//       <div className="auth-form">

//         <h2>Forgot Password</h2>

//         <input
//           type="email"
//           placeholder="Enter Email"
//           value={email}
//           onChange={(e) =>
//             setEmail(e.target.value)
//           }
//           required
//         />

//         <button
//           className="btn"
//           onClick={sendOtp}
//         >
//           Send OTP
//         </button>

//         {/* <input
//           type="text"
//           placeholder="Enter OTP"
//           value={otp}
//           onChange={(e) =>
//             setOtp(e.target.value)
//           }
//           required
//         />

//         <input
//           type="password"
//           placeholder="New Password"
//           value={newPassword}
//           onChange={(e) =>
//             setNewPassword(e.target.value)
//           }
//           required
//         />

//         <button
//           className="btn"
//           onClick={resetPassword}
//         >
//           Reset Password
//         </button> */}

//         {
//   otpSent && (
//     <>
//       <input
//         type="text"
//         placeholder="Enter OTP"
//         value={otp}
//         onChange={(e) =>
//           setOtp(e.target.value)
//         }
//         required
//       />

//       <input
//         type="password"
//         placeholder="New Password"
//         value={newPassword}
//         onChange={(e) =>
//           setNewPassword(e.target.value)
//         }
//         required
//       />

//       <button
//         className="btn"
//         onClick={resetPassword}
//       >
//         Reset Password
//       </button>
//     </>
//   )
// }
//       </div>

//     </div>
//   );
// };

// export default ForgotPassword;



//3rd version with better UI and error handling and success message
import React, { useState } from 'react';
import axios from 'axios';
import '../styles/auth.css';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const ForgotPassword = () => {

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [otpSent, setOtpSent] = useState(false);

  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // SEND OTP
  const sendOtp = async () => {

    try {

      setLoading(true);

      await axios.post(
        'http://localhost:5000/api/auth/forgot-password',
        { email }
      );

      toast.success('OTP Sent Successfully');
      setOtpSent(true);
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || 'Failed To Send OTP');

    } finally {

      setLoading(false);
    }
  };

  // RESET PASSWORD
  const resetPassword = async () => {

    try {

      setLoading(true);

      await axios.post(
        'http://localhost:5000/api/auth/reset-password',
        {
          email,
          otp,
          newPassword,
        }
      );

      toast.success('Password Reset Successful');
      // CLEAR STATES
      setEmail('');
      setOtp('');
      setNewPassword('');
      setOtpSent(false);

      // REDIRECT
      navigate('/login');
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || 'Reset Failed');

    } finally {

      setLoading(false);
    }
  };

  return (

    <div className="auth-container">

      <div className="auth-form">

        <h2>Forgot Password</h2>

        {/* EMAIL INPUT */}
        <input
          type="email"
          placeholder="Enter Email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          required
        />

        {/* SEND OTP BUTTON */}
        {
          !otpSent && (

            <button
              className="btn"
              onClick={sendOtp}
              disabled={loading}
            >
              {
                loading
                  ? 'Sending...'
                  : 'Send OTP'
              }
            </button>
          )
        }

        {/* OTP SUCCESS MESSAGE */}
        {
          otpSent && (

            <p className="success-text">
              OTP sent successfully to your email
            </p>
          )
        }

        {/* OTP + NEW PASSWORD */}
        {
          otpSent && (
            <>

              <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value)
                }
                required
              />

              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) =>
                  setNewPassword(e.target.value)
                }
                required
              />

              <button
                className="btn"
                onClick={resetPassword}
                disabled={loading}
              >
                {
                  loading
                    ? 'Resetting...'
                    : 'Reset Password'
                }
              </button>

            </>
          )
        }

      </div>

    </div>
  );
};

export default ForgotPassword;