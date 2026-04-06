import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function CategoryRedirect({ catOverride }) {
  const navigate = useNavigate();
  const params = useParams();
  const cat = catOverride || params.cat; // expects men|women|kids

  useEffect(() => {
    const valid = ["men", "women", "kids"];
    const target = valid.includes(cat?.toLowerCase())
      ? cat.toLowerCase()
      : "all";
    navigate(`/collections?collection=${target}`, { replace: true });
  }, [cat, navigate]);

  return null;
}
