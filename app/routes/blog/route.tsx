import { Link, Outlet } from "react-router";

export default function BlogLayout() {
  return (
    <div className="blog-section">
      <nav className="blog-nav">
        <Link to="/">Home</Link>
        <span className="separator"> · </span>
        <Link to="/blog">Blog</Link>
      </nav>
      <Outlet />
    </div>
  );
}
