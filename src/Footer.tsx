export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer
      style={{
        padding: "32px 24px",
        borderTop: "1px solid #eee",
        marginTop: 48,
        fontFamily: "sans-serif",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 16,
      }}
    >
      <nav style={{ display: "flex", gap: 24 }}>
        <a href="#" style={{ color: "#555", textDecoration: "none" }}>
          About
        </a>
        <a href="#" style={{ color: "#555", textDecoration: "none" }}>
          Contact
        </a>
        <a href="#" style={{ color: "#555", textDecoration: "none" }}>
          Privacy
        </a>
      </nav>
      <span style={{ color: "#999", fontSize: 13 }}>
        © {year} Skillpath. All rights reserved.
      </span>
    </footer>
  )
}
