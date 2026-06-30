// import React from 'react';
// import { useSelector, useDispatch } from 'react-redux';
// import { Link, useNavigate } from 'react-router-dom';
// import { removeFromCart, addToCart } from '../redux/cartSlice';
// import '../styles/cart.css';

// const Cart = () => {
//   const cartItems = useSelector((state) => state.cart.cartItems);
//   const dispatch = useDispatch();
//   const navigate = useNavigate();

//   const handleRemove = (id) => {
//     dispatch(removeFromCart(id));
//   };

//   const handleUpdateQty = (item, qty) => {
//     if (qty > 0) {
//       // dispatch(addToCart({ ...item, qty }));
//       dispatch(addToCart({
//   ...item,
//   qty: Number(qty)
// }));
//     }
//   };

//   const totalPrice = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);

//   return (
//     <div className="cart-container">
//       <h2>Shopping Cart</h2>
//       {cartItems.length === 0 ? (
//         <p>Your cart is empty. <Link to="/shop">Go Shopping</Link></p>
//       ) : (
//         <div className="cart-layout">
//           <div className="cart-items">
//             {cartItems.map((item) => (
//               <div key={item.productId} className="cart-item">
//                 <img src={item.imageUrl} alt={item.name} className="cart-item-image" />
//                 <div className="cart-item-details">
//                   <h4>{item.name}</h4>
//                   <p>₹{item.price}</p>
//                   <div className="qty-controls">
//                     <button onClick={() => handleUpdateQty(item, item.qty - 1)}>-</button>
//                     <span>{item.qty}</span>
//                     <button onClick={() => handleUpdateQty(item, item.qty + 1)}>+</button>
//                   </div>
//                   <button onClick={() => handleRemove(item.productId)} className="btn-remove">Remove</button>
//                 </div>
//               </div>
//             ))}
//           </div>
//           <div className="cart-summary">
//             <h3>Total: ₹{totalPrice.toFixed(2)}</h3>
//             <button onClick={() => navigate('/checkout')} className="btn btn-checkout">Proceed to Checkout</button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Cart;

import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';

import {
  removeFromCart,
  addToCart,
} from '../redux/cartSlice';

import '../styles/cart.css';

const Cart = () => {

  const cartItems = useSelector(
    (state) => state.cart.cartItems
  );

  const dispatch = useDispatch();

  const navigate = useNavigate();


  // Remove Item
  const handleRemove = (id) => {
    dispatch(removeFromCart(id));
  };


  // Update Quantity
  const handleUpdateQty = (item, qty) => {

    // Prevent invalid quantity
    if (qty <= 0) return;

    // Prevent exceeding stock
    if (qty > item.stock) {
      alert(`Only ${item.stock} items available`);
      return;
    }

    // Prevent adding out of stock items
    if (item.stock === 0) {
      return;
    }

    dispatch(
      addToCart({
        ...item,
        qty: Number(qty),
      })
    );
  };


  // Total Price
  const totalPrice = cartItems.reduce(
    (acc, item) => acc + item.price * item.qty,
    0
  );


  return (
    <div className="cart-container">

      <h2>Shopping Cart</h2>

      {cartItems.length === 0 ? (

        <p>
          Your cart is empty.{' '}
          <Link to="/shop">Go Shopping</Link>
        </p>

      ) : (

        <div className="cart-layout">

          {/* Cart Items */}
          <div className="cart-items">

            {cartItems.map((item) => (

              <div
                key={item.productId}
                className="cart-item"
              >

                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="cart-item-image"
                />

                <div className="cart-item-details">

                  <h4>{item.name}</h4>

                  <p>₹{item.price}</p>

                  {/* Stock Status */}
                  {item.stock === 0 ? (
                    <p
                      style={{
                        color: 'red',
                        fontWeight: 'bold',
                      }}
                    >
                      Out Of Stock
                    </p>
                  ) : (
                    <p
                      style={{
                        color: 'lime',
                        fontWeight: 'bold',
                      }}
                    >
                      In Stock ({item.stock})
                    </p>
                  )}

                  {/* Quantity Controls */}
                  <div className="qty-controls">

                    {/* Minus */}
                    <button
                      onClick={() =>
                        handleUpdateQty(
                          item,
                          item.qty - 1
                        )
                      }
                    >
                      -
                    </button>

                    <span>{item.qty}</span>

                    {/* Plus */}
                    <button
                      disabled={
                        item.qty >= item.stock ||
                        item.stock === 0
                      }
                      onClick={() =>
                        handleUpdateQty(
                          item,
                          item.qty + 1
                        )
                      }
                      style={{
                        opacity:
                          item.qty >= item.stock ||
                          item.stock === 0
                            ? 0.5
                            : 1,
                        cursor:
                          item.qty >= item.stock ||
                          item.stock === 0
                            ? 'not-allowed'
                            : 'pointer',
                      }}
                    >
                      +
                    </button>

                  </div>

                  {/* Remove */}
                  <button
                    onClick={() =>
                      handleRemove(item.productId)
                    }
                    className="btn-remove"
                  >
                    Remove
                  </button>

                </div>

              </div>

            ))}

          </div>


          {/* Cart Summary */}
          <div className="cart-summary">

            <h3>
              Total: ₹{totalPrice.toFixed(2)}
            </h3>

            <button
              disabled={
                cartItems.some(
                  (item) => item.stock === 0
                )
              }
              onClick={() => navigate('/checkout')}
              className="btn btn-checkout"
              style={{
                opacity: cartItems.some(
                  (item) => item.stock === 0
                )
                  ? 0.5
                  : 1,

                cursor: cartItems.some(
                  (item) => item.stock === 0
                )
                  ? 'not-allowed'
                  : 'pointer',
              }}
            >
              Proceed to Checkout
            </button>

            {cartItems.some(
              (item) => item.stock === 0
            ) && (
              <p
                style={{
                  color: 'red',
                  marginTop: '10px',
                }}
              >
                Remove out-of-stock items to continue.
              </p>
            )}

          </div>

        </div>

      )}
    </div>
  );
};

export default Cart;