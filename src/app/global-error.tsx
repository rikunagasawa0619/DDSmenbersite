"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="ja">
      <body
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          fontFamily: "sans-serif",
          background: "#f7f5ef",
          color: "#0f172a",
          padding: "1rem",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: "480px" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 700 }}>
            システムエラーが発生しました
          </h1>
          <p style={{ marginTop: "1rem", color: "#64748b" }}>
            ページの表示中に問題が発生しました。しばらくしてからもう一度お試しください。
          </p>
          {error.digest ? (
            <p style={{ marginTop: "1rem", color: "#94a3b8", fontSize: "12px" }}>
              参照ID: {error.digest}
            </p>
          ) : null}
          <button
            onClick={reset}
            style={{
              marginTop: "2rem",
              padding: "0.75rem 1.5rem",
              background: "#1238c6",
              color: "white",
              border: "none",
              borderRadius: "9999px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            もう一度試す
          </button>
        </div>
      </body>
    </html>
  );
}
