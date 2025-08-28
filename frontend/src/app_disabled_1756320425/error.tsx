"use client";
import React from "react";

export default function GlobalError({ error }: { error?: Error }) {
  return (
    <html>
      <body>
        <main style={{ padding: 32, fontFamily: "sans-serif" }}>
          <h1>Something went wrong</h1>
          <pre style={{ whiteSpace: "pre-wrap" }}>{String(error ?? "Unknown error")}</pre>
        </main>
      </body>
    </html>
  );
}