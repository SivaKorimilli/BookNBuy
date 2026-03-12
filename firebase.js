// lib/firebase.js
// Firebase v10 — Auth with Email OTP & Phone OTP

import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Prevent re-initialization on hot reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

// ─── EMAIL OTP (Magic Link) ───────────────────────────────────────────────────
// Firebase uses a "magic link" sent to email — user clicks it to sign in
export async function sendEmailOTP(email) {
  const actionCodeSettings = {
    url: `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify`,
    handleCodeInApp: true,
  };
  await sendSignInLinkToEmail(auth, email, actionCodeSettings);
  // Store email in localStorage so we can use it when user returns from link
  window.localStorage.setItem("booknbuy_email_for_signin", email);
}

export async function verifyEmailOTP(emailLink) {
  if (!isSignInWithEmailLink(auth, emailLink)) {
    throw new Error("Invalid sign-in link");
  }
  let email = window.localStorage.getItem("booknbuy_email_for_signin");
  if (!email) {
    email = window.prompt("Please provide your email for confirmation");
  }
  const result = await signInWithEmailLink(auth, email, emailLink);
  window.localStorage.removeItem("booknbuy_email_for_signin");
  return result.user;
}

// ─── PHONE OTP ────────────────────────────────────────────────────────────────
// Sets up invisible reCAPTCHA, then sends SMS OTP via Firebase
export function setupRecaptcha(containerId = "recaptcha-container") {
  // Clear any existing instance
  if (window.recaptchaVerifier) {
    window.recaptchaVerifier.clear();
  }
  window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: "invisible",
    callback: () => {}, // reCAPTCHA solved
  });
  return window.recaptchaVerifier;
}

export async function sendPhoneOTP(phoneNumber) {
  // phoneNumber must be in E.164 format: +919876543210
  const appVerifier = window.recaptchaVerifier || setupRecaptcha();
  const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
  window.confirmationResult = confirmationResult; // Store for verification step
  return confirmationResult;
}

export async function verifyPhoneOTP(otp) {
  if (!window.confirmationResult) throw new Error("No OTP session found. Please resend.");
  const result = await window.confirmationResult.confirm(otp);
  return result.user;
}

// ─── SIGN OUT ─────────────────────────────────────────────────────────────────
export async function logOut() {
  await signOut(auth);
}

// ─── AUTH STATE LISTENER ──────────────────────────────────────────────────────
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}
