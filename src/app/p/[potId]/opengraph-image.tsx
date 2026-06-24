import { ImageResponse } from "next/og";
import { formatUnits } from "viem";
import { fetchPot } from "@/lib/chain";

export const alt = "Pot detail share card";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const NOT_FOUND_BG = "#101010";

// Strip anything that isn't safe to feed into Satori's font rasteriser — the
// previous version interpolated the raw URL potId, so /p/<long-unicode>/og
// would trip on glyphs missing from the loaded font and throw a 500 to the OG
// crawler. Clamp to ascii-decimal of reasonable length.
function safePotIdLabel(raw: string): string {
  const stripped = raw.replace(/[^0-9]/g, "").slice(0, 20);
  return stripped || "—";
}

async function renderFallback(potId: string) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 12,
          background: NOT_FOUND_BG,
          color: "#F3F3F3",
          fontSize: 56,
          fontFamily: "Inter, system-ui",
        }}
      >
        <div style={{ fontSize: 24, color: "#949494" }}>Pot.{safePotIdLabel(potId)}</div>
        <div>Not yet on chain</div>
      </div>
    ),
    size,
  );
}

export default async function Image({
  params,
}: {
  params: Promise<{ potId: string }>;
}) {
  const { potId } = await params;
  // Wrap the entire response in try/catch so OG crawlers get a fallback PNG
  // instead of a 500 if Satori/fetchPot/font-load throws.
  try {
    const pot = await fetchPot(potId);

    if (!pot) {
      return await renderFallback(potId);
    }

  const target = Number(formatUnits(pot.target, 18));
  const raised = Number(formatUnits(pot.raised, 18));
  const pct = target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 100;
  const isFunded = target > 0 && raised >= target;
  const accent = isFunded ? "#E7C59A" : "#00AC5C";
  const statusLabel = pot.status === "Active" ? (isFunded ? "TARGET REACHED" : "ACTIVE") : pot.status.toUpperCase();

  const potLabel = safePotIdLabel(pot.id);
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
            POT.{potLabel}
          </div>
        </div>

        <div
          style={{
            fontSize: 92,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: -0.5,
            display: "flex",
          }}
        >
          Pot.{potLabel}
        </div>
        <div
          style={{
            fontSize: 24,
            color: "#949494",
            marginTop: 14,
            display: "flex",
          }}
        >
          {statusLabel} · refunds {pot.refundIfMissed ? "enabled" : "disabled"}
        </div>

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
              <span style={{ fontWeight: 700, color: accent }}>${raised.toFixed(0)}</span>
              {target > 0 && (
                <span style={{ color: "#949494" }}>/ ${target.toFixed(0)}</span>
              )}
            </div>
            <span style={{ color: "#949494" }}>
              {pot.deadline === 0n
                ? "OPEN-ENDED"
                : `closes ${new Date(Number(pot.deadline) * 1000).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}`}
            </span>
          </div>
        </div>
      </div>
    ),
    size,
  );
  } catch {
    return await renderFallback(potId);
  }
}
