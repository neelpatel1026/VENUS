import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';

const EditProduct = () => {

  const { id } = useParams();

  const { user } = useContext(AuthContext);

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    originalPrice: ''
  });

  const [image, setImage] = useState(null);

  const [loading, setLoading] = useState(false);

  /* ================= FETCH PRODUCT ================= */

  useEffect(() => {

    const fetchProduct = async () => {

      try {

        const res = await fetch(`/api/products/${id}`);

        const data = await res.json();

        setFormData({
  name: data.name,
  description: data.description,
  price: data.price,
  originalPrice: data.originalPrice || data.price,
  category: data.category,
  stock: data.stock
});

      } catch (error) {

        console.error(error);
      }
    };

    fetchProduct();

  }, [id]);

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

if (Number(formData.stock) < 0) {
  alert("Stock cannot be negative");
  return;
}
if (
  Number(formData.originalPrice) <
  Number(formData.price)
) {
  alert(
    "Original Price must be greater than or equal to Price"
  );
  return;
}

    setLoading(true);

    try {

      const data = new FormData();

      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('price', formData.price);
      data.append('category', formData.category);
      data.append('stock', formData.stock);
      data.append('originalPrice', formData.originalPrice);
      
      if (image) {
        data.append('image', image);
      }

      const res = await fetch(`/api/products/${id}`, {

        method: 'PUT',

        headers: {
          Authorization: `Bearer ${user.token}`
        },

        body: data
      });

      if (res.ok) {

        alert('Product updated successfully!');

        navigate('/admin/products');
      }

    } catch (error) {

      console.error(error);

    } finally {

      setLoading(false);
    }
  };

  /* ================= UI ================= */

  return (

    <div style={containerStyle}>

      <div style={cardStyle}>

        {/* HEADER */}

        <div style={headerStyle}>

          <h2 style={headingStyle}>
            Edit Product
          </h2>

          <p style={subTextStyle}>
            Update your product information and inventory
          </p>

        </div>

        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          style={formStyle}
        >

          {/* PRODUCT NAME */}

          <div style={fieldStyle}>

            <label style={labelStyle}>
              Product Name
            </label>

            <input
              type="text"

              placeholder="Enter product name"

              required

              value={formData.name}

              onChange={(e) =>
                setFormData({
                  ...formData,
                  name: e.target.value
                })
              }

              style={inputStyle}
            />

          </div>

          {/* DESCRIPTION */}

          <div style={fieldStyle}>

            <label style={labelStyle}>
              Description
            </label>

            <textarea
              placeholder="Enter product description"

              required

              rows="5"

              value={formData.description}

              onChange={(e) =>
                setFormData({
                  ...formData,
                  description: e.target.value
                })
              }

              style={textareaStyle}
            />

          </div>

          {/* PRICE */}

          <div style={fieldStyle}>

            <label style={labelStyle}>
              Price
            </label>

            <input
              type="number"

              placeholder="Enter price"

              required

              value={formData.price}

              onChange={(e) =>
                setFormData({
                  ...formData,
                  price: e.target.value
                })
              }

              style={inputStyle}
            />

          </div>

          <div style={fieldStyle}>

  <label style={labelStyle}>
    Original Price
  </label>

  <input
    type="number"
    min="0"
    placeholder="Enter Original Price"
    required
    value={formData.originalPrice}
    onChange={(e) =>
      setFormData({
        ...formData,
        originalPrice: e.target.value
      })
    }
    style={inputStyle}
  />

</div>

          {/* CATEGORY */}

          <div style={fieldStyle}>

            <label style={labelStyle}>
              Category
            </label>

            <input
              type="text"

              placeholder="Enter category"

              required

              value={formData.category}

              onChange={(e) =>
                setFormData({
                  ...formData,
                  category: e.target.value
                })
              }

              style={inputStyle}
            />

          </div>

          {/* STOCK */}

          <div style={fieldStyle}>

            <label style={labelStyle}>
              Stock Quantity
            </label>

            <input
              type="number"

              placeholder="Enter stock quantity"

              required

              value={formData.stock}

              onChange={(e) =>
                setFormData({
                  ...formData,
                  stock: e.target.value
                })
              }

              style={inputStyle}
            />

          </div>

          {/* IMAGE */}

          <div style={uploadBoxStyle}>

            <label style={uploadLabelStyle}>
              Replace Product Image (Optional)
            </label>

            <input
              type="file"

              accept="image/*"

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
              ? 'Updating Product...'
              : 'Update Product'
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
  maxWidth: '700px',
  background: '#FFFFFF',
  padding: '40px',
  borderRadius: '28px',
  border: '1px solid #ECE6DC',
  boxShadow: '0 20px 50px rgba(0,0,0,.06)'
};

const headerStyle = {
  marginBottom: '30px'
};

const headingStyle = {
color:'#C8A96B',
  marginBottom: '10px'
};

const subTextStyle = {
color:'#6B7280',
  lineHeight: '1.6'
};

const formStyle = {
  display: 'flex',

  flexDirection: 'column',

  gap: '20px'
};

const fieldStyle = {
  display: 'flex',

  flexDirection: 'column',

  gap: '10px'
};

const labelStyle = {
  // color: '#d4d4d8',
color:'#374151',
  fontWeight: '500'
};

const inputStyle = {
  padding: '14px 16px',
  background:'#FAF7F2',
border:'1px solid #D6D6D6',
color:'#1F2937',

  // background: '#09090b',

  // border: '1px solid #27272a',

  borderRadius: '10px',

  // color: '#fff',

  fontSize: '15px',

  outline: 'none',

  width: '100%'
};

const textareaStyle = {
  ...inputStyle,

  resize: 'vertical',

  minHeight: '120px'
};

const uploadBoxStyle = {
  padding: '20px',


  borderRadius: '12px',

  border:'2px dashed #C8A96B',
background:'#FAF7F2',
};

const uploadLabelStyle = {
  display: 'block',

  marginBottom: '12px',
color:'#6B7280',
  fontWeight: '500'
};

const fileInputStyle = {
  color:'#1F2937',

  width: '100%'
};

const buttonStyle = {
  marginTop: '10px',

  width: '100%',

  padding: '15px'
};

export default EditProduct;




