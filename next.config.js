const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias["date-fns$"] = path.resolve(__dirname, "node_modules/date-fns/index.js");
    return config;
  },
};

module.exports = nextConfig;
