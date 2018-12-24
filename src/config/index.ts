import * as dotenv from 'dotenv'

dotenv.config({ path: '.env' })

export interface DbConfig {
  type: string
  host: string
  port: number
  username: string
  password: string
  database: string
}

export interface IConfig {
  port: number
  debugLogging: boolean
  dbsslconn: boolean
  dbConfig: DbConfig
  apiHost: string
  apiPrefix: string
  apiVersion: string
  jwtSecret: string
  resetPasswordTokenExpiration: number
  emailVerificationTokenExpiration: number
  freeTrialExpiration: number
  membershipExpiration: number
  mailerService: string
  mailerHost: string
  mailerPort: number
  mailerUsername: string
  mailerPassword: string
  paypalConfig: any
  websiteDomain: string
  websiteProtocol: string
  websiteResetPasswordPagePath: string
  websiteVerifyEmailPagePath: string
}

const apiHost = process.env.NODE_ENV === 'production' ? 'https://podverse.fm' : 'http://localhost:3000'

let port = process.env.PORT || '3000'
let dbPort = process.env.DB_PORT || '5432'
let resetPasswordTokenExpiration = process.env.RESET_PASSWORD_TOKEN_EXPIRATION || '86400'
let emailVerificationTokenExpiration = process.env.EMAIL_VERIFICATION_TOKEN_EXPIRATION || '31540000'
let freeTrialExpiration = process.env.FREE_TRIAL_EXPIRATION || '2592000'
let membershipExpiration = process.env.PREMIUM_MEMBERSHIP_EXPIRATION || '31540000'
let mailerPort = process.env.MAILER_PORT || '587'

const paypalConfig = {
  clientId: process.env.PAYPAL_CLIENT_ID,
  clientSecret: process.env.PAYPAL_CLIENT_SECRET,
  mode: process.env.NODE_ENV === 'production' ? 'live' : 'sandbox',
  webhookIdPaymentSaleCompleted: process.env.PAYPAL_WEBHOOK_ID_PAYMENT_SALE_COMPLETED
}

const config: IConfig = {
  port: parseInt(port, 10),
  debugLogging: process.env.NODE_ENV === 'development',
  dbsslconn: process.env.NODE_ENV !== 'development',
  dbConfig: {
    type: 'postgres',
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(dbPort, 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'mysecretpw',
    database: process.env.DB_DATABASE || 'postgres'
  },
  apiHost,
  apiPrefix: process.env.API_PREFIX || '/api',
  apiVersion: process.env.API_VERSION || '/v1',
  jwtSecret: process.env.JWT_SECRET || 'mysecretjwt',
  resetPasswordTokenExpiration: parseInt(resetPasswordTokenExpiration, 10),
  emailVerificationTokenExpiration: parseInt(emailVerificationTokenExpiration, 10),
  freeTrialExpiration: parseInt(freeTrialExpiration, 10),
  membershipExpiration: parseInt(membershipExpiration, 10),
  mailerService: process.env.mailerService || '',
  mailerHost: process.env.mailerHost || '',
  mailerPort: parseInt(mailerPort, 10),
  mailerUsername: process.env.MAILER_USERNAME || '',
  mailerPassword: process.env.MAILER_PASSWORD || '',
  paypalConfig,
  websiteDomain: process.env.WEBSITE_DOMAIN || (process.env.NODE_ENV === 'production' ? 'podverse.fm' : 'localhost:8765'),
  websiteProtocol: process.env.WEBSITE_PROTOCOL || (process.env.NODE_ENV === 'production' ? 'https' : 'http'),
  websiteResetPasswordPagePath: process.env.WEBSITE_RESET_PASSWORD_PAGE_PATH || '/reset-password?token=',
  websiteVerifyEmailPagePath: process.env.WEBSITE_VERIFY_EMAIL_PAGE_PATH || '/verify-email?token='
}

export { config }
