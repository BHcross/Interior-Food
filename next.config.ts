import type { NextConfig } from "next";

// Cabeçalhos de segurança (CSP com nonce por requisição, X-Frame-Options,
// etc.) são aplicados no proxy.ts — precisam de um nonce novo a cada
// requisição, o que só é possível no proxy/middleware, não aqui.
const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
