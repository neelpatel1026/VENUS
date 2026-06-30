import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { Link } from 'react-router-dom';

const AdminProducts = () => {

  const { user } = useContext(AuthContext);

  const [products, setProducts] = useState([]);

  /* ================= FETCH PRODUCTS ================= */

  useEffect(() => {

    const fetchProducts = async () => {

      try {

        const res = await fetch('/api/products');

        const data = await res.json();

        setProducts(Array.isArray(data) ? data : []);

      } catch (error) {

        console.error(error);
      }
    };

    fetchProducts();

  }, []);

  /* ================= DELETE PRODUCT ================= */

  const handleDelete = async (id) => {

    const confirmDelete = window.confirm(
      'Are you strictly sure you want to delete this product?'
    );

    if (!confirmDelete) return;

    try {

      const res = await fetch(`/api/products/${id}`, {

        method: 'DELETE',

        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });

      if (res.ok) {

        setProducts(
          products.filter(
            product => product._id !== id
          )
        );
      }

    } catch (error) {

      console.error(error);
    }
  };

  /* ================= UI ================= */

  return (

    <div style={containerStyle}>

      {/* HEADER */}

      <div style={headerStyle}>

        <div>

          <h2 style={headingStyle}>
            Manage Products
          </h2>

          <p style={subTextStyle}>
            Manage your store inventory and products
          </p>

        </div>

        <Link
          to="/admin/add-product"
          className="btn"
          style={addButtonStyle}
        >
          + Add Product
        </Link>

      </div>

      {/* MOBILE CARDS */}

      <div style={mobileWrapperStyle}>

        {products.map(product => (

          <div
            key={product._id}
            style={mobileCardStyle}
          >

            <img
              src={product.image}
              alt={product.name}
              style={mobileImageStyle}
            />

            <div style={mobileContentStyle}>

              <h3 style={productNameStyle}>
                {product.name}
              </h3>

              <p style={categoryStyle}>
                {product.category}
              </p>

              <div style={mobilePriceStyle}>
                ₹{product.price.toFixed(2)}
              </div>

              <div style={stockStyle}>
                Stock: {product.stock}
              </div>

              <div style={mobileButtonContainer}>

                <Link
                  to={`/admin/edit-product/${product._id}`}
                  style={editBtn}
                >
                  Edit
                </Link>

                <button
                  onClick={() =>
                    handleDelete(product._id)
                  }
                  style={deleteBtn}
                >
                  Delete
                </button>

              </div>

            </div>

          </div>
        ))}

      </div>

      {/* DESKTOP TABLE */}

      <div style={tableWrapperStyle}>

        <table style={tableStyle}>

          <thead>

            <tr style={rowStyle}>

              <th style={thStyle}>
                PRODUCT
              </th>

              <th style={thStyle}>
                NAME
              </th>

              <th style={thStyle}>
                PRICE
              </th>

              <th style={thStyle}>
                CATEGORY
              </th>

              <th style={thStyle}>
                STOCK
              </th>

              <th style={thStyle}>
                ACTIONS
              </th>

            </tr>

          </thead>

          <tbody>

            {products.map(product => (

              <tr
                key={product._id}
                style={rowStyle}
              >

                <td style={tdStyle}>

                  <img
                    src={product.image}
                    alt={product.name}
                    style={tableImageStyle}
                  />

                </td>

                <td style={tdStyle}>
                  {product.name}
                </td>

                <td style={priceStyle}>
                  ₹{product.price.toFixed(2)}
                </td>

                <td style={tdStyle}>
                  {product.category}
                </td>

                <td style={tdStyle}>
                  {product.stock}
                </td>

                <td style={tdStyle}>

                  <div style={actionWrapperStyle}>

                    <Link
                      to={`/admin/edit-product/${product._id}`}
                      style={editBtn}
                    >
                      Edit
                    </Link>

                    <button
                      onClick={() =>
                        handleDelete(product._id)
                      }
                      style={deleteBtn}
                    >
                      Delete
                    </button>

                  </div>

                </td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
};

/* ================= STYLES ================= */

const containerStyle = {

  background:'#FFFFFF',
color:'#1F2937',
border:'1px solid #ECE6DC',
boxShadow:'0 20px 50px rgba(0,0,0,.06)',
  maxWidth: '1200px',

  margin: '40px auto',

  padding: '30px',

  // background: '#18181b',

  borderRadius: '18px',
};

const headerStyle = {
  display: 'flex',

  justifyContent: 'space-between',

  alignItems: 'center',

  gap: '20px',

  flexWrap: 'wrap',

  marginBottom: '30px'
};

const headingStyle = {
  // color: '#f97316',
  color:'#C8A96B',

  marginBottom: '8px'
};

const subTextStyle = {
  // color: '#a1a1aa'
  color:'#6B7280'
};

const addButtonStyle = {
  whiteSpace: 'nowrap'
};

/* ================= TABLE ================= */

const tableWrapperStyle = {
  overflowX: 'auto'
};

const tableStyle = {
  width: '100%',

  borderCollapse: 'collapse',

  minWidth: '850px'
};

const rowStyle = {
  borderBottom:'1px solid #ECE6DC'
};

const thStyle = {
  padding: '18px 15px',

  textAlign: 'left',

  // color: '#a1a1aa',
  color:'#8B7355',

  fontSize: '0.9rem',

  fontWeight: '600'
};

const tdStyle = {
  padding: '18px 15px',

  verticalAlign: 'middle'
};

const priceStyle = {
  ...tdStyle,

  color: '#f97316',

  fontWeight: '700'
};

const tableImageStyle = {
  width: '70px',

  height: '70px',

  objectFit: 'cover',

  borderRadius: '10px'
};

const actionWrapperStyle = {
  display: 'flex',

  gap: '10px',

  flexWrap: 'wrap'
};

/* ================= BUTTONS ================= */

const editBtn = {
  background:'#C8A96B',
color:'#fff',

  padding: '8px 14px',

  borderRadius: '8px',

  textDecoration: 'none',

  fontWeight: '500',

  border: 'none',

  cursor: 'pointer'
};

const deleteBtn = {
  background: '#ef4444',

  color: '#fff',

  padding: '8px 14px',

  borderRadius: '8px',

  border: 'none',

  cursor: 'pointer',

  fontWeight: '500'
};

/* ================= MOBILE ================= */

const mobileWrapperStyle = {
  display: 'none',

  flexDirection: 'column',

  gap: '20px',

  marginBottom: '20px'
};

const mobileCardStyle = {
  background: '#09090b',

  border: '1px solid rgba(255,255,255,0.05)',

  borderRadius: '16px',

  overflow: 'hidden'
};

const mobileImageStyle = {
  width: '100%',

  height: '220px',

  objectFit: 'cover'
};

const mobileContentStyle = {
  padding: '18px'
};

const productNameStyle = {
  marginBottom: '8px',

  color: '#fff'
};

const categoryStyle = {
  color: '#a1a1aa',

  marginBottom: '12px'
};

const mobilePriceStyle = {
  color: '#f97316',

  fontSize: '1.3rem',

  fontWeight: '700',

  marginBottom: '10px'
};

const stockStyle = {
  color: '#d4d4d8',

  marginBottom: '18px'
};

const mobileButtonContainer = {
  display: 'flex',

  gap: '12px'
};

export default AdminProducts;