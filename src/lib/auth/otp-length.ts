// Length of the emailed sign-in code. It is set in Supabase (Authentication > Providers > Email > "OTP length") and WyberAi's
// project sends 8 digits; the sign-in screen once assumed 6, so typing the real code sent only its first six digits and every email
// sign-in failed (found 16 Nov: the code on the phone was 86273019). If the Supabase setting ever changes, change this one number.
// The submit button accepts anything from MIN to this length, so a shorter code still works if the setting is lowered.
export const EMAIL_CODE_LENGTH = 8
export const EMAIL_CODE_MIN_LENGTH = 6
