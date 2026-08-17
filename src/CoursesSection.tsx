import { useState, useEffect } from "react"
import type { CSSProperties } from "react"

// ---- Types matching the API response shape ----
type Course = {
  courseName: string
  courseCode: string
  description: string
  mainCategory: string
  shortCourse: string
  courseType: string
  pricePaise: number
  priceUsdCents: number
  mangoId: string
  refundable: boolean
}

type FetchState = "loading" | "error" | "empty" | "success"

const BASE_URL = "https://syncsphere-hiv6.onrender.com"

// ---- Props: these two become Framer's property controls ----
type CoursesSectionProps = {
  accentColor?: string
  heading?: string
}

export default function CoursesSection({
  accentColor = "#5b4bff",
  heading = "Our Courses",
}: CoursesSectionProps) {
  const [courses, setCourses] = useState<Course[]>([])
  const [countryCode, setCountryCode] = useState<string | null>(null)
  const [status, setStatus] = useState<FetchState>("loading")
  const [searchTerm, setSearchTerm] = useState("")
  const [sortOrder, setSortOrder] = useState<"none" | "asc" | "desc">("none")
  const [countryFailed, setCountryFailed] = useState(false)

  const loadData = () => {
    setStatus("loading")

    // Fire both requests independently — one failing should not
    // silently break the other. We use allSettled, not all(),
    // specifically so a country-code failure doesn't kill the
    // course grid (and vice versa).
    Promise.allSettled([
      fetch(`${BASE_URL}/assignment/course-data`, { method: "GET" }),
      fetch(`${BASE_URL}/assignment/country-code`, { method: "GET" }),
    ]).then(async ([courseResult, countryResult]) => {
      // --- Handle courses ---
      let courseData: Course[] = []
      let courseFailed = false

      if (courseResult.status === "fulfilled" && courseResult.value.ok) {
        try {
          courseData = await courseResult.value.json()
        } catch {
          courseFailed = true
        }
      } else {
        courseFailed = true
      }

      // --- Handle country code ---
      // Default to "US" if this call fails. Rationale: showing SOME
      // price (even in a possibly-wrong currency) is a better failure
      // mode than showing no price at all, and US/cents is the more
      // "universal" fallback for a fake international-facing product.
      // This is a judgment call — documented here on purpose since
      // there's no single right answer per the brief.
      let country = "US"
      let countryCallFailed = false
      if (countryResult.status === "fulfilled" && countryResult.value.ok) {
        try {
          const data = await countryResult.value.json()
          country = data.country_code ?? "US"
        } catch {
          countryCallFailed = true
        }
      } else {
        countryCallFailed = true
      }

      setCountryCode(country)
      setCountryFailed(countryCallFailed)

      // --- Decide final state ---
      if (courseFailed) {
        setStatus("error")
        return
      }

      if (!Array.isArray(courseData) || courseData.length === 0) {
        setStatus("empty")
        return
      }

      setCourses(courseData)
      setStatus("success")
    })
  }

  useEffect(() => {
    loadData()
  }, [])

  // ---- Currency formatting ----
  // pricePaise and priceUsdCents are both in the SMALLEST unit
  // (paise, cents) — divide by 100 to get the real rupee/dollar amount.
  const formatPrice = (course: Course) => {
    if (countryCode === "IN") {
      const rupees = course.pricePaise / 100
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(rupees)
    }
    const dollars = course.priceUsdCents / 100
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(dollars)
  }

  // Search + sort are applied client-side, on top of whatever the API
  // returned — this doesn't need another network call, so it stays
  // instant and doesn't add another point of failure to the flaky API.
  const visibleCourses = courses
    .filter((c) =>
      c.courseName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOrder === "none") return 0
      // Sort using the currency actually being displayed, not a fixed
      // field — otherwise "low to high" could look wrong to a US
      // viewer if we always sorted by pricePaise underneath.
      const priceOf = (c: Course) =>
        countryCode === "IN" ? c.pricePaise : c.priceUsdCents
      return sortOrder === "asc"
        ? priceOf(a) - priceOf(b)
        : priceOf(b) - priceOf(a)
    })

  return (
    <section id="courses" style={{ padding: "48px 24px", fontFamily: "sans-serif" }}>
      {/* Scoped keyframes for the skeleton shimmer. Injected inline
          since this component has no separate CSS file — keeps the
          component fully self-contained, which matters when dropping
          it into Framer's single-file code component editor. */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <h2 style={{ marginBottom: 8 }}>{heading}</h2>

      {/* Screen-reader announcement of state changes. Visually hidden,
          purely for accessibility — not required by the brief but a
          near-zero-cost addition. */}
      <div
        role="status"
        aria-live="polite"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
        }}
      >
        {status === "loading" && "Loading courses"}
        {status === "error" && "Failed to load courses"}
        {status === "empty" && "No courses available"}
        {status === "success" && `${visibleCourses.length} courses loaded`}
      </div>

      {status === "success" && countryFailed && (
        <p style={{ color: "#a15c00", fontSize: 13, marginBottom: 16 }}>
          We couldn't detect your region, so prices are shown in USD by
          default.
        </p>
      )}

      {status === "success" && (
        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 24,
            flexWrap: "wrap",
          }}
        >
          <input
            type="text"
            placeholder="Search courses…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: "1 1 220px",
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #ddd",
              fontSize: 14,
            }}
          />
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #ddd",
              fontSize: 14,
            }}
          >
            <option value="none">Sort: Default</option>
            <option value="asc">Price: Low to High</option>
            <option value="desc">Price: High to Low</option>
          </select>
        </div>
      )}

      {status === "loading" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: 20,
          }}
        >
          {/* Skeleton loaders instead of a spinner — shows the shape of
              the grid that's about to appear, feels faster than a
              blank spinner even though load time is identical. */}
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{
                border: "1px solid #eee",
                borderRadius: 12,
                padding: 20,
                height: 160,
              }}
            >
              <div style={skeletonBar(70, 18)} />
              <div style={{ ...skeletonBar(100, 12), marginTop: 12 }} />
              <div style={{ ...skeletonBar(60, 12), marginTop: 6 }} />
              <div style={{ ...skeletonBar(40, 20), marginTop: 20 }} />
            </div>
          ))}
        </div>
      )}

      {status === "error" && (
        <div
          style={{
            padding: 40,
            textAlign: "center",
            color: "#666",
            border: "1px solid #eee",
            borderRadius: 8,
          }}
        >
          <p>Couldn't load courses right now.</p>
          <button
            onClick={loadData}
            style={{
              marginTop: 12,
              padding: "8px 16px",
              background: accentColor,
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      )}

      {status === "empty" && (
        <div style={{ padding: 40, textAlign: "center", color: "#666" }}>
          No courses available right now. Check back soon.
        </div>
      )}

      {status === "success" && visibleCourses.length === 0 && (
        <div style={{ padding: 40, textAlign: "center", color: "#666" }}>
          No courses match "{searchTerm}".
        </div>
      )}

      {status === "success" && visibleCourses.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: 20,
          }}
        >
          {visibleCourses.map((course) => (
            <div
              key={course.mangoId}
              style={{
                border: "1px solid #eee",
                borderRadius: 12,
                padding: 20,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <h3 style={{ margin: 0, fontSize: 18 }}>{course.courseName}</h3>

              <p
                style={{
                  margin: 0,
                  color: "#555",
                  fontSize: 14,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {course.description}
              </p>

              {/* Extra field: mainCategory — a learner deciding between
                  courses cares what subject/category it falls under
                  before they even look at price. */}
              <span style={{ fontSize: 12, color: "#888" }}>
                {course.mainCategory}
              </span>

              <div
                style={{
                  marginTop: "auto",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <strong style={{ color: accentColor, fontSize: 16 }}>
                  {formatPrice(course)}
                </strong>
                {course.refundable && (
                  <span
                    style={{
                      fontSize: 11,
                      background: "#e8f8ee",
                      color: "#1a7f4b",
                      padding: "2px 8px",
                      borderRadius: 999,
                    }}
                  >
                    Refundable
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

// ---- Skeleton bar helper ----
// Small utility so each skeleton "line" doesn't need its full style
// object repeated inline four times.
function skeletonBar(widthPercent: number, height: number) {
  return {
    width: `${widthPercent}%`,
    height,
    borderRadius: 4,
    background:
      "linear-gradient(90deg, #eee 25%, #f5f5f5 50%, #eee 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.4s infinite",
  } as CSSProperties
}

// ---- Framer property controls ----
// Only picked up by Framer itself (harmless import elsewhere, but
// remove this block if testing in plain Vite/StackBlitz and it errors
// on the missing "framer" package — see note below).
//
// import { addPropertyControls, ControlType } from "framer"
//
// addPropertyControls(CoursesSection, {
//   heading: {
//     type: ControlType.String,
//     defaultValue: "Our Courses",
//     title: "Heading",
//   },
//   accentColor: {
//     type: ControlType.Color,
//     defaultValue: "#5b4bff",
//     title: "Accent Color",
//   },
// })
