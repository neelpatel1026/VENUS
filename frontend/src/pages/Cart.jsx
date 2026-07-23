import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { FaShoppingBag, FaStar, FaChevronRight } from 'react-icons/fa';

import {
  removeFromCart,
  addToCart,
  setCartQty,
} from '../redux/cartSlice';

import '../styles/cart.css';
import toast from 'react-hot-toast';
import { getThumbnailUrl } from '../utils/imageHelper';

// Premium responsive quantity stepper component
const QuantityStepper = ({ item, onUpdate }) => {
  const [localQty, setLocalQty] = React.useState(item.qty);
  const [isUpdating, setIsUpdating] = React.useState(false);

  React.useEffect(() => {
    setLocalQty(item.qty);
  }, [item.qty]);

  const changeQty = (amount) => {
    if (isUpdating) return;
    const targetQty = localQty + amount;
    if (targetQty <= 0) return;
    if (targetQty > item.stock) {
      toast.error(`Only ${item.stock} items available`);
      return;
    }

    // Optimistic UI update
    setLocalQty(targetQty);
    setIsUpdating(true);

    // Simulate 350ms network dispatch delay
    setTimeout(() => {
      onUpdate(item, targetQty);
      setIsUpdating(false);
    }, 350);
  };

  return (
    <div className={`qty-stepper-lux-premium ${isUpdating ? 'stepper-loading' : ''}`}>
      <button
        type="button"
        className="qty-stepper-btn"
        aria-label="Decrease quantity"
        disabled={localQty <= 1 || isUpdating}
        onClick={() => changeQty(-1)}
      >
        −
      </button>
      <div className="qty-stepper-value-container">
        {isUpdating ? (
          <div className="qty-stepper-spinner" />
        ) : (
          <span className="qty-stepper-value">{localQty}</span>
        )}
      </div>
      <button
        type="button"
        className="qty-stepper-btn"
        aria-label="Increase quantity"
        disabled={localQty >= item.stock || isUpdating}
        onClick={() => changeQty(1)}
      >
        +
      </button>
    </div>
  );
};

const Cart = () => {
  const cartItems = useSelector((state) => state.cart.cartItems);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Remove Item
  const handleRemove = (id) => {
    dispatch(removeFromCart(id));
    toast.success("Item removed from cart");
  };

  // Update Quantity
  const handleUpdateQty = (item, qty) => {
    if (qty <= 0) return;
    if (qty > item.stock) {
      toast.error(`Only ${item.stock} items available`);
      return;
    }
    dispatch(
      setCartQty({
        productId: item.productId,
        qty: Number(qty),
      })
    );
  };

  // Calculations
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);
  const totalOriginal = cartItems.reduce((acc, item) => acc + (item.originalPrice || item.price) * item.qty, 0);
  const savings = totalOriginal > subtotal ? totalOriginal - subtotal : 0;
  const shipping = subtotal > 500 ? 0 : 50; // free shipping over 500
  const gst = subtotal * 0.18; // GST included (18% display)
  const grandTotal = subtotal + shipping;

  return (
    <div className="cart-container route-fade-in font-outfit">
      <div className="cart-header-title">
        <h2 className="font-serif">Shopping Bag</h2>
        <span className="cart-count-badge">{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}</span>
      </div>

      {cartItems.length === 0 ? (
        <div className="empty-cart-view">
          <div className="empty-cart-icon-wrapper">
            <FaShoppingBag className="empty-cart-icon" />
          </div>
          <h3 className="font-serif">Your Shopping Bag is Empty</h3>
          <p>Discover luxurious, botanically-infused skincare tailored for your natural glow.</p>
          <Link to="/shop" className="btn-continue-shopping font-serif">
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          
          {/* Cart Items */}
          <div className="cart-items">
            {cartItems.map((item) => {
              const discount = item.originalPrice > item.price
                ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
                : 0;

              return (
                <div key={item.productId} className="cart-item-luxury">
                  {/* Product Image */}
                  <div className="cart-item-img-container">
                    <img
                      src={getThumbnailUrl(item.imageUrl || item.image || item.productImage || "/cosmetic_1.avif")}
                      alt={item.name}
                      className="cart-item-img-lux"
                      loading="lazy"
                      onError={(e) => { e.target.src = "/cosmetic_1.avif"; }}
                    />
                  </div>

                  {/* Product Info details */}
                  <div className="cart-item-details-lux">
                    {item.category && (
                      <span className="cart-item-category-label">
                        {item.category.toUpperCase()}
                      </span>
                    )}
                    <h3 className="cart-item-name-lux">
                      <Link to={`/product/${item.productId}`}>{item.name}</Link>
                    </h3>

                    {/* Ratings */}
                    <div className="cart-item-ratings">
                      <FaStar className="cart-star" />
                      <span>{item.rating || 4.8}</span>
                    </div>

                    {/* Pricing */}
                    <div className="cart-item-pricing">
                      <span className="cart-sale-price">₹{item.price}</span>
                      {discount > 0 && (
                        <>
                          <span className="cart-old-price">₹{item.originalPrice}</span>
                          <span className="cart-discount-badge">-{discount}% Off</span>
                        </>
                      )}
                    </div>

                    {/* Availability */}
                    <div className="cart-item-availability">
                      {item.stock === 0 ? (
                        <span className="stock-badge out-of-stock">Out Of Stock</span>
                      ) : (
                        <span className="stock-badge in-stock">In Stock ({item.stock})</span>
                      )}
                    </div>

                    {/* Quantity and Actions container */}
                    <div className="cart-item-actions-row">
                      {/* Quantity Stepper */}
                      <QuantityStepper item={item} onUpdate={handleUpdateQty} />

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemove(item.productId)}
                        className="btn-remove-lux"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary Card */}
          <div className="cart-summary-luxury">
            <h3 className="font-serif summary-title">Order Summary</h3>
            
            <div className="summary-rows">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {savings > 0 && (
                <div className="summary-row discount-row">
                  <span>Bag Savings</span>
                  <span>- ₹{savings.toFixed(2)}</span>
                </div>
              )}
              <div className="summary-row">
                <span>Shipping</span>
                <span>{shipping === 0 ? <span className="free-shipping-text">FREE</span> : `₹${shipping.toFixed(2)}`}</span>
              </div>
              <div className="summary-row tax-row">
                <span>GST (18% Included)</span>
                <span>₹{gst.toFixed(2)}</span>
              </div>
              
              <div className="summary-divider" />
              
              <div className="summary-row grand-total-row">
                <span>Grand Total</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              disabled={cartItems.some((item) => item.stock === 0)}
              onClick={() => navigate('/checkout')}
              className="btn-checkout-luxury font-serif"
            >
              Proceed to Checkout <FaChevronRight className="chevron-right-icon" />
            </button>

            {cartItems.some((item) => item.stock === 0) && (
              <p className="stock-alert-msg">
                Please remove out-of-stock items to proceed.
              </p>
            )}
          </div>

        </div>
      )}
    </div>
  );
};

export default Cart;