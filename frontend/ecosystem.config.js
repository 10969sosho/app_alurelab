module.exports = {
  apps: [
    {
      name: 'alurelab-frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3040',
      cwd: '/home/alurelab/app.alurelab.com/frontend',
      env: {
        NODE_ENV: 'production',
        PORT: 3040,
        AUTH_TRUST_HOST: 'true',
        AUTH_SECRET: 'alurelab-super-secret-key-prod-2026-production',
        NEXTAUTH_SECRET: 'alurelab-super-secret-key-prod-2026-production',
        NEXTAUTH_URL: 'https://app.alurelab.com',
        API_URL: 'https://app.alurelab.com/api/v1',
        NEXT_PUBLIC_API_URL: 'https://app.alurelab.com/api/v1',
        NEXT_PUBLIC_API_BASE_URL: 'https://app.alurelab.com/api/v1',
      },
    },
  ],
};
