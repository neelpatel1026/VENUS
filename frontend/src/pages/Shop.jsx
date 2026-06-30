import React, { useEffect, useState } from 'react';
import ProductCard from '../components/ProductCard';
import '../styles/product.css';

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        console.log("Products:", data);
        console.log("Count:", data.length);
        setProducts(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="shop-container">
      {/* <h2>All Products</h2> */}
      <div className="product-section-header">

   <span className="section-tag">
      COLLECTION
   </span>

   <h2>All Products</h2>

   <p>
      Discover premium skincare, perfume and beauty essentials
   </p>

</div>
      {/* <input 
        type="text" 
        placeholder="Search products..." 
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="search-bar"
      /> */}
      <div className="search-wrapper">

  {/* <input
    type="text"
    placeholder="Search skincare, perfume, beauty..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="search-bar"
  /> */}

</div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
        <div className="products-info">

  <span>
    Showing {filteredProducts.length} Products
  </span>

</div>
        <div className="product-grid">
          {filteredProducts.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
        </>
      )}
    </div>
    
  );
};

export default Shop;