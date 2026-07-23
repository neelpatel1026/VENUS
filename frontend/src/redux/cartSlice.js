import { createSlice } from "@reduxjs/toolkit";

/* ================= GET USER CART KEY ================= */

const getUserCartKey = () => {
  try {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));

    // Guest cart
    if (!userInfo || !userInfo.email) {
      return "guestCart";
    }

    // Separate cart for every user
    return `cart_${userInfo.email}`;
  } catch (error) {
    console.error("Cart key error:", error);

    return "guestCart";
  }
};

/* ================= LOAD CART ================= */

const loadCartFromStorage = () => {
  try {
    const cart = localStorage.getItem(getUserCartKey());

    return cart ? JSON.parse(cart) : [];
  } catch (error) {
    console.error("Load cart error:", error);

    return [];
  }
};

/* ================= SAVE CART ================= */

const saveCartToStorage = (cartItems) => {
  try {
    localStorage.setItem(getUserCartKey(), JSON.stringify(cartItems));
  } catch (error) {
    console.error("Save cart error:", error);
  }
};

/* ================= INITIAL STATE ================= */

const initialState = {
  cartItems: loadCartFromStorage(),
};

/* ================= CART SLICE ================= */

const cartSlice = createSlice({
  name: "cart",

  initialState,

  reducers: {
    /* ================= ADD TO CART ================= */

    addToCart: (state, action) => {
      const item = {
        ...action.payload,

        qty: Number(action.payload.qty) || 1,
      };

      // Prevent invalid quantity
      if (item.qty <= 0) {
        return;
      }

      const existItem = state.cartItems.find(
        (x) => x.productId === item.productId,
      );

      // Existing item
      if (existItem) {
        state.cartItems = state.cartItems.map((x) => {
          if (x.productId === existItem.productId) {
            // Prevent exceeding stock
            // const updatedQty = item.qty;

            // return {
            //   ...x,
            //   ...item,
            //   qty: updatedQty > item.stock ? item.stock : updatedQty,
            // };

            const updatedQty = x.qty + item.qty;

            return {
              ...x,
              ...item,
              qty: updatedQty > item.stock ? item.stock : updatedQty,
            };
          }

          return x;
        });
      } else {
        // Prevent adding out-of-stock item
        if (item.stock === 0) {
          return;
        }

        state.cartItems.push(item);
      }

      saveCartToStorage(state.cartItems);
    },

    /* ================= REMOVE FROM CART ================= */

    removeFromCart: (state, action) => {
      state.cartItems = state.cartItems.filter(
        (x) => x.productId !== action.payload,
      );

      saveCartToStorage(state.cartItems);
    },

    /* ================= CLEAR CART ================= */

    clearCart: (state) => {
      state.cartItems = [];

      localStorage.removeItem(getUserCartKey());
    },

    /* ================= LOAD USER CART ================= */

    loadCart: (state) => {
      state.cartItems = loadCartFromStorage();
    },

    /* ================= INCREASE QTY ================= */

    increaseQty: (state, action) => {
      const item = state.cartItems.find((x) => x.productId === action.payload);

      if (item) {
        // Prevent exceeding stock
        if (item.qty < item.stock) {
          item.qty += 1;

          saveCartToStorage(state.cartItems);
        }
      }
    },

    /* ================= DECREASE QTY ================= */

    decreaseQty: (state, action) => {
      const item = state.cartItems.find((x) => x.productId === action.payload);

      if (item && item.qty > 1) {
        item.qty -= 1;

        saveCartToStorage(state.cartItems);
      }
    },

    setCartQty: (state, action) => {
      const { productId, qty } = action.payload;
      const item = state.cartItems.find((x) => x.productId === productId);
      if (item) {
        const targetQty = Number(qty);
        if (targetQty > 0 && targetQty <= item.stock) {
          item.qty = targetQty;
          saveCartToStorage(state.cartItems);
        }
      }
    },
  },
});

/* ================= EXPORT ACTIONS ================= */

export const {
  addToCart,

  removeFromCart,

  clearCart,

  loadCart,

  increaseQty,

  decreaseQty,

  setCartQty,
} = cartSlice.actions;

/* ================= EXPORT REDUCER ================= */

export default cartSlice.reducer;
