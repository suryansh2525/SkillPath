type HeroProps = {
  accentColor?: string
  headline?: string
  subheadline?: string
  ctaText?: string
}

export default function Hero({
  accentColor = "#5b4bff",
  headline = "Learn skills that actually pay off",
  subheadline = "Practical, project-based courses built by people who've done the work — not just talked about it.",
  ctaText = "Browse Courses",
}: HeroProps) {
  const scrollToCourses = () => {
    document
      .getElementById("courses")
      ?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section
      style={{
        padding: "96px 24px",
        textAlign: "center",
        maxWidth: 640,
        margin: "0 auto",
        fontFamily: "sans-serif",
      }}
    >
      <h1 style={{ fontSize: 42, lineHeight: 1.15, margin: 0 }}>
        {headline}
      </h1>
      <p
        style={{
          fontSize: 18,
          color: "#555",
          marginTop: 16,
          marginBottom: 32,
        }}
      >
        {subheadline}
      </p>
      <button
        onClick={scrollToCourses}
        style={{
          background: accentColor,
          color: "#fff",
          border: "none",
          padding: "14px 32px",
          borderRadius: 8,
          fontSize: 16,
          cursor: "pointer",
        }}
      >
        {ctaText}
      </button>
    </section>
  )
}
