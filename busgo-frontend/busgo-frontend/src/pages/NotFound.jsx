import { Link } from "react-router-dom";
import Empty from "../components/Empty.jsx";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20">
      <Empty icon={SearchX} title="This page is not on the route" text="The link may be old or mistyped." action={<Link to="/" className="btn btn-primary">Back to search</Link>} />
    </div>
  );
}
