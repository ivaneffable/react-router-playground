import { Link, Outlet } from "react-router";
import styles from "./route.module.css";

export default function BlogLayout() {
  return (
    <div className={styles.section}>
      <nav className={styles.nav}>
        <Link to="/">Home</Link>
        <span className={styles.separator}> · </span>
        <Link to="/blog">Blog</Link>
      </nav>
      <Outlet />
    </div>
  );
}
