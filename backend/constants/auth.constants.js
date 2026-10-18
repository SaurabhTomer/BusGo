// ---------- Settings ----------
 export const OTP_EXPIRY = 300; // OTP valid for 5 minutes
 export const RESEND_COOLDOWN = 60; // can resend otp after 60 seconds
export const MAX_ATTEMPTS = 5; // can try wrong OTP till count of 5
export const VERIFIED_EXPIRY = 600; // has to complete the signup process after verify the OTP  under 10 mintues



// ---------- Redis keys ----------
export const otpKey = (phone) => `otp:${phone}`;               //OTP store 
export const cooldownKey = (phone) => `otp-cooldown:${phone}`; // To stop resend OTP
export const attemptsKey = (phone) => `otp-attempts:${phone}`; // Count attempt that are done to enter OTP
export const verifiedKey = (phone) => `phone-verified:${phone}`; // check Phone Verified or not


export const LOGIN_MAX_ATTEMPTS = 5; // galat password max 5 baar
export const LOGIN_LOCK_TIME = 900; // uske baad 15 minute ruko (seconds me)
export const loginAttemptsKey = (email) => `login-attempts:${email}`; // galat login ginne ke liye

export const REFRESH_EXPIRY = 7 * 24 * 60 * 60; // refresh token 7 din (seconds me)
export const refreshKey = (token) => `refresh:${token}`; // redis me refresh token ki key