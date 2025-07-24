export function getFriendlyFirebaseErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/user-not-found": "No user found with this email.",
    "auth/wrong-password": "Incorrect password.",
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/weak-password": "Password should be at least 6 characters.",
    "auth/missing-password": "Please enter your password.",
    "auth/too-many-requests": "Too many attempts. Try again later.",
  }

  return messages[code] || "Something went wrong. Please try again."
}
