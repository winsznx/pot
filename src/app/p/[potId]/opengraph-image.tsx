import { ImageResponse } from "next/og";
import { findPot } from "@/lib/mock-pots";
import { formatUsd, progress, timeLeft } from "@/lib/format";

export const alt = "Pot detail share card";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ potId: string }> }) {
  const { potId } = await params;
  const pot = findPot(potId);
  if (!pot) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#101010",
            color: "#F3F3F3",
            fontSize: 64,
            fontFamily: "Inter, system-ui",
          }}
        >
          Pot not found
        </div>
      ),
      size,
    );
  }

  const pct = pot.target > 0 ? progress(pot.raised, pot.target) : 100;
  const isFunded = pot.target > 0 && pot.raised >= pot.target;
  const accent = isFunded ? "#E7C59A" : "#00AC5C";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#101010",
          color: "#F3F3F3",
          padding: 64,
          fontFamily: "Inter, system-ui",
        }}
      >
        {/* top row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 32,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: 999,
                background: "#E7C59A",
              }}
            />
            <span style={{ fontSize: 28, fontWeight: 700 }}>Pot</span>
            <span style={{ fontSize: 22, color: "#949494", marginLeft: 6 }}>
              /onchain.fundraisers
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 18px",
              borderRadius: 999,
              border: "1px solid #333333",
              fontSize: 20,
              color: "#949494",
            }}
          >
            POT.{pot.id}
          </div>
        </div>

        {/* title */}
        <div
          style={{
            fontSize: pot.title.length > 60 ? 56 : 72,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: -0.5,
            display: "flex",
          }}
        >
          {pot.title}
        </div>

        {/* progress + raised */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: "auto", gap: 18 }}>
          <div
            style={{
              width: "100%",
              height: 12,
              borderRadius: 999,
              background: "#333333",
              overflow: "hidden",
              display: "flex",
            }}
          >
            <div style={{ width: `${pct}%`, height: "100%", background: accent }} />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 28,
              color: "#F3F3F3",
            }}
          >
            <div style={{ display: "flex", gap: 14 }}>
              <span style={{ fontWeight: 700, color: accent }}>{formatUsd(pot.raised)}</span>
              {pot.target > 0 && <span style={{ color: "#949494" }}>/ {formatUsd(pot.target)}</span>}
              <span style={{ color: "#949494" }}>· {pot.contributors} contributors</span>
            </div>
            <span style={{ color: "#949494" }}>
              {pot.deadline === 0 ? "OPEN-ENDED" : timeLeft(pot.deadline)}
            </span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
