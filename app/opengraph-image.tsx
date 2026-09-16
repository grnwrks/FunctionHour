import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Function Hour — Find Your Function";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "linear-gradient(135deg, #050505 0%, #28103f 58%, #6d2514 100%)",
          color: "white",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", fontSize: 86, fontWeight: 900, letterSpacing: "-4px" }}>
          FUNCTION<span style={{ color: "#a855f7" }}>HOUR</span>
        </div>
        <div style={{ color: "#f4d9ff", display: "flex", fontSize: 34, marginTop: 28 }}>
          Find your function.
        </div>
      </div>
    ),
    size,
  );
}
