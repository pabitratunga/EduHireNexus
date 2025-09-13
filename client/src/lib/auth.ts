import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithPhoneNumber,
  GoogleAuthProvider,
  RecaptchaVerifier,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  Auth,
  AuthError,
  ConfirmationResult,
  UserCredential,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";
import { User, InsertUser } from "@shared/schema";
import { toast } from "@/hooks/use-toast";

export interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<UserCredential>;
  signUp: (email: string, password: string, displayName: string, role?: "seeker" | "employer") => Promise<UserCredential>;
  signInWithGoogle: () => Promise<UserCredential>;
  signInWithPhone: (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) => Promise<ConfirmationResult>;
  sendVerificationEmail: (user?: FirebaseUser) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  createRecaptchaVerifier: (elementId: string) => RecaptchaVerifier;
}

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

// Helper function to create user profile in Firestore
export async function createUserProfile(user: FirebaseUser, additionalData: Partial<InsertUser> = {}): Promise<User> {
  const userDocRef = doc(db, 'users', user.uid);
  const userSnapshot = await getDoc(userDocRef);
  
  if (!userSnapshot.exists()) {
    const userProfile: InsertUser = {
      displayName: user.displayName || additionalData.displayName || 'Anonymous User',
      email: user.email!,
      role: additionalData.role || 'seeker',
      emailVerified: user.emailVerified,
      ...additionalData,
    };

    await setDoc(userDocRef, {
      ...userProfile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      id: user.uid,
      ...userProfile,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
  
  // Return existing user profile
  const data = userSnapshot.data();
  return {
    id: user.uid,
    ...data,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  } as User;
}

// Helper function to get user profile from Firestore
export async function getUserProfile(uid: string): Promise<User | null> {
  const userDocRef = doc(db, 'users', uid);
  const userSnapshot = await getDoc(userDocRef);
  
  if (!userSnapshot.exists()) {
    return null;
  }
  
  const data = userSnapshot.data();
  return {
    id: uid,
    ...data,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  } as User;
}

// Auth functions
export const signIn = async (email: string, password: string): Promise<UserCredential> => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result;
  } catch (error) {
    const authError = error as AuthError;
    let message = "Failed to sign in";
    
    switch (authError.code) {
      case "auth/user-not-found":
        message = "No account found with this email";
        break;
      case "auth/wrong-password":
        message = "Incorrect password";
        break;
      case "auth/invalid-email":
        message = "Invalid email address";
        break;
      case "auth/too-many-requests":
        message = "Too many failed attempts. Please try again later";
        break;
      default:
        message = authError.message;
    }
    
    toast({
      title: "Sign In Failed",
      description: message,
      variant: "destructive",
    });
    throw error;
  }
};

export const signUp = async (
  email: string, 
  password: string, 
  displayName: string,
  role: "seeker" | "employer" = "seeker"
): Promise<UserCredential> => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update display name
    await updateProfile(result.user, { displayName });
    
    // Create user profile in Firestore
    await createUserProfile(result.user, { displayName, role });
    
    // Send verification email
    await sendEmailVerification(result.user);
    
    toast({
      title: "Account Created",
      description: "Please check your email to verify your account",
      variant: "default",
    });
    
    return result;
  } catch (error) {
    const authError = error as AuthError;
    let message = "Failed to create account";
    
    switch (authError.code) {
      case "auth/email-already-in-use":
        message = "An account with this email already exists";
        break;
      case "auth/invalid-email":
        message = "Invalid email address";
        break;
      case "auth/weak-password":
        message = "Password should be at least 6 characters";
        break;
      default:
        message = authError.message;
    }
    
    toast({
      title: "Sign Up Failed", 
      description: message,
      variant: "destructive",
    });
    throw error;
  }
};

export const signInWithGoogle = async (): Promise<UserCredential> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    
    // Create or update user profile in Firestore
    await createUserProfile(result.user);
    
    return result;
  } catch (error) {
    const authError = error as AuthError;
    let message = "Failed to sign in with Google";
    
    switch (authError.code) {
      case "auth/popup-blocked":
        message = "Popup was blocked by your browser";
        break;
      case "auth/popup-closed-by-user":
        message = "Sign in was cancelled";
        break;
      case "auth/account-exists-with-different-credential":
        message = "An account already exists with the same email but different sign-in method";
        break;
      default:
        message = authError.message;
    }
    
    toast({
      title: "Google Sign In Failed",
      description: message,
      variant: "destructive",
    });
    throw error;
  }
};

export const signInWithPhone = async (
  phoneNumber: string,
  recaptchaVerifier: RecaptchaVerifier
): Promise<ConfirmationResult> => {
  try {
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
    return confirmationResult;
  } catch (error) {
    const authError = error as AuthError;
    let message = "Failed to send verification code";
    
    switch (authError.code) {
      case "auth/invalid-phone-number":
        message = "Invalid phone number";
        break;
      case "auth/too-many-requests":
        message = "Too many requests. Please try again later";
        break;
      default:
        message = authError.message;
    }
    
    toast({
      title: "Phone Verification Failed",
      description: message,
      variant: "destructive",
    });
    throw error;
  }
};

export const sendVerificationEmail = async (user?: FirebaseUser): Promise<void> => {
  try {
    const currentUser = user || auth.currentUser;
    if (!currentUser) {
      throw new Error("No user is currently signed in");
    }
    
    await sendEmailVerification(currentUser);
    
    toast({
      title: "Verification Email Sent",
      description: "Please check your email and click the verification link",
      variant: "default",
    });
  } catch (error) {
    const authError = error as AuthError;
    toast({
      title: "Failed to Send Verification Email",
      description: authError.message,
      variant: "destructive",
    });
    throw error;
  }
};

export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
    
    toast({
      title: "Reset Email Sent",
      description: "Please check your email for password reset instructions",
      variant: "default",
    });
  } catch (error) {
    const authError = error as AuthError;
    let message = "Failed to send reset email";
    
    switch (authError.code) {
      case "auth/user-not-found":
        message = "No account found with this email";
        break;
      case "auth/invalid-email":
        message = "Invalid email address";
        break;
      default:
        message = authError.message;
    }
    
    toast({
      title: "Password Reset Failed",
      description: message,
      variant: "destructive",
    });
    throw error;
  }
};

export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
    toast({
      title: "Signed Out",
      description: "You have been successfully signed out",
      variant: "default",
    });
  } catch (error) {
    const authError = error as AuthError;
    toast({
      title: "Sign Out Failed",
      description: authError.message,
      variant: "destructive",
    });
    throw error;
  }
};

export const createRecaptchaVerifier = (elementId: string): RecaptchaVerifier => {
  return new RecaptchaVerifier(auth, elementId, {
    size: 'normal',
    callback: () => {
      // reCAPTCHA solved
    },
    'expired-callback': () => {
      toast({
        title: "reCAPTCHA Expired",
        description: "Please complete the reCAPTCHA again",
        variant: "destructive",
      });
    }
  });
};

// Auth state change listener
export const onAuthStateChange = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
