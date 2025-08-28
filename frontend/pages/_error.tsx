import React from "react";
import type { NextPageContext } from "next";

type ErrorProps = { statusCode?: number };

function ErrorPage({ statusCode }: ErrorProps) {
  return (
    <main style={{padding: "2rem", textAlign: "center"}}>
      <h1>{statusCode ? `${statusCode} - An error occurred` : "An error occurred"}</h1>
      <p>Sorry, something went wrong.</p>
    </main>
  );
}

ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res?.statusCode ?? err?.statusCode ?? 500;
  return { statusCode };
};

export default ErrorPage;



