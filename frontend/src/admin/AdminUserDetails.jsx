import { useParams } from "react-router-dom";

const AdminUserDetails = () => {

  const { id } = useParams();

  return (
    <div
      style={{
        maxWidth:"1200px",
        margin:"40px auto",
        padding:"30px",
        background:"#fff",
        borderRadius:"20px"
      }}
    >
      <h1>User Details</h1>

      <p>User ID:</p>

      <h3>{id}</h3>
    </div>
  );
};

export default AdminUserDetails;