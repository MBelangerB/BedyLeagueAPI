import dotenv from 'dotenv';
dotenv.config();

export default {
  nodeEnv: (process.env.NODE_ENV ?? 'development'),
  port: (process.env.PORT ?? 3000),
  culture: (process.env.culture ?? 'fr'),
  config: {
    updateDelay: (process.env.updateDelay ?? 12),
  },
  jwt: {
    secret: (process.env.JWT_SECRET ?? ''),
    exp: (process.env.COOKIE_EXP ?? ''), // exp at the same time as the cookie
  },
  cors: {
    allowlist: ['http://bedyapi.com', 'https://bedyapi.com', 'http://localhost:4200', 'http://localhost:8080',
      'http://web.bedyapi.com', 'https://web.bedyapi.com'],
  },
  riot: {
    leagueToken: (process.env.riotLolToken ?? process.env.riotDevToken),
    tftToken: (process.env.riotTftToken ?? process.env.riotDevToken),
    valoToken: (process.env.riotValoToken ?? process.env.riotDevToken),
  },
  recaptcha: {
    v3Token: (process.env.RECAPTCHA_V3),
  },
  email: {
    host: process.env.email_host,
    port: process.env.email_port,
    secure: (process.env.email_secure ?? false),
    emailTo: process.env.email_emailTo,
    emailFrom: (process.env.email_emailFrom ?? 'noreply@bedyapi.com'),
  },
} as const;
