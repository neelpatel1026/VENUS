import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AddProduct = () => {

  const { user } = useContext(AuthContext);

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
  name: '',
  description: '',
  price: '',
  originalPrice: '',
  category: '',
  stock: ''
});

  const [image, setImage] = useState(null);

  const [loading, setLoading] = useState(false);

  /* ================= ADMIN CHECK ================= */

  if (!user || user.role !== 'admin') {
    navigate('/');
    return null;
  }

  /* ================= SUBMIT ================= */

  const handleSubmit = async (e) => {

    e.preventDefault();

    if (Number(formData.price) < 0) {
  alert("Price cannot be negative");
  return;
}

if (Number(formData.originalPrice) < 0) {
  alert("Original Price cannot be negative");
  return;
}

if (
  Number(formData.originalPrice) <
  Number(formData.price)
) {
  alert(
    "Original Price must be greater than Price"
  );
  return;
}

    if (!image) {
      return alert('Please select an image');
    }

    setLoading(true);

    const data = new FormData();

    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('price', formData.price);
    data.append('category', formData.category);
    data.append('stock', formData.stock);
    data.append('originalPrice', formData.originalPrice);

    data.append('image', image);

    try {

      const res = await fetch('/api/products', {
        method: 'POST',

        headers: {
          Authorization: `Bearer ${user.token}`
        },

        body: data
      });

      const responseData = await res.json();

      if (res.ok) {

        alert('Product created successfully with Cloudinary Image URL!');

        navigate('/shop');

      } else {

        alert(responseData.message || 'Error creating product');
      }

    } catch (error) {

      console.error(error);

    } finally {

      setLoading(false);
    }
  };

  return (

    <div style={containerStyle}>

      <div style={cardStyle}>

        <p
  style={{
    textAlign:'center',
    color:'#6B7280',
    marginBottom:'30px'
  }}
>
  Create and publish premium products for your store
</p>

        <h2 style={headingStyle}>
          Add New Product
        </h2>

        <form
          onSubmit={handleSubmit}
          style={formStyle}
        >

          {/* PRODUCT NAME */}

          <input
            type="text"
            placeholder="Product Name"
            required
            onChange={(e) =>
              setFormData({
                ...formData,
                name: e.target.value
              })
            }
            style={inputStyle}
          />

          {/* DESCRIPTION */}

          <textarea
            placeholder="Description"
            required
            rows="5"
            onChange={(e) =>
              setFormData({
                ...formData,
                description: e.target.value
              })
            }
            style={textareaStyle}
          />

          {/* PRICE */}

          <input
            type="number"
            placeholder="Price"
            required
            onChange={(e) =>
              setFormData({
                ...formData,
                price: e.target.value
              })
            }
            style={inputStyle}
          />

          <input
  type="number"
  min="0"
  placeholder="Original Price"
  required
  onChange={(e) =>
    setFormData({
      ...formData,
      originalPrice: e.target.value
    })
  }
  style={inputStyle}
/>

          {/* CATEGORY */}

          <input
            type="text"
            placeholder="Category"
            required
            onChange={(e) =>
              setFormData({
                ...formData,
                category: e.target.value
              })
            }
            style={inputStyle}
          />

          {/* STOCK */}

          <input
            type="number"
            placeholder="Stock Quantity"
            required
            onChange={(e) =>
              setFormData({
                ...formData,
                stock: e.target.value
              })
            }
            style={inputStyle}
          />

          {/* IMAGE UPLOAD */}

          <div style={uploadBoxStyle}>

            <label style={uploadLabelStyle}>
              Upload Product Image
            </label>

            <input
              type="file"
              accept="image/*"
              required
              onChange={(e) =>
                setImage(e.target.files[0])
              }
              style={fileInputStyle}
            />

          </div>



          {/* BUTTON */}

          <button
            type="submit"
            disabled={loading}
            className="btn"
            style={buttonStyle}
          >

            {loading
              ? 'Uploading & Creating...'
              : 'Publish Product'
            }

          </button>

        </form>

      </div>

    </div>
  );
};

/* ================= STYLES ================= */

const containerStyle = {
  width: '100%',

  padding: '20px',

  display: 'flex',

  justifyContent: 'center',

  alignItems: 'center'
};

const cardStyle = {
  width: '100%',

  maxWidth: '750px',

  background: '#FFFFFF',

  padding: '50px',

  borderRadius: '28px',

  border: '1px solid #ECE6DC',

  boxShadow:
    '0 20px 50px rgba(0,0,0,.06)'
};

const headingStyle = {
  color: '#1F2937',

  marginBottom: '35px',

  fontSize: '2.5rem',

  textAlign: 'center'
};

const formStyle = {
  display: 'flex',

  flexDirection: 'column',

  gap: '18px'
};

const inputStyle = {
  padding: '16px 18px',

  background: '#FFFFFF',

  border: '1px solid #D6D6D6',

  borderRadius: '14px',

  color: '#1F2937',

  fontSize: '15px',

  outline: 'none',

  width: '100%'
};

const textareaStyle = {
  ...inputStyle,

  resize: 'none'
};

const uploadBoxStyle = {
  padding: '22px',

  border: '2px dashed #C8A96B',

  borderRadius: '18px',

  background: '#FAF7F2'
};

const uploadLabelStyle = {
  display: 'block',

  marginBottom: '12px',

  color: '#6B7280',

  fontWeight: '600'
};

const fileInputStyle = {
  color: '#1F2937',

  width: '100%'
};

const buttonStyle = {
  marginTop: '10px',

  width: '100%',

  padding: '15px'
};

export default AddProduct;


