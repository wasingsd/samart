import { useState } from "react";
import { useAuth as useAuthContext } from "@/contexts/AuthProvider";
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle as firebaseSignInWithGoogle,
  getLineLoginUrl,
  signOut as firebaseSignOut,
} from "@/lib/firebase/auth";

export function useAuth() {
  const { user, loading: authLoading } = useAuthContext();
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const signIn = async (email: string, pass: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await signInWithEmail(email, pass);
      setLoading(false);
      return res;
    } catch (err: any) {
      setError(err);
      setLoading(false);
      throw err;
    }
  };

  const signUp = async (email: string, pass: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await signUpWithEmail(email, pass);
      setLoading(false);
      return res;
    } catch (err: any) {
      setError(err);
      setLoading(false);
      throw err;
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await firebaseSignInWithGoogle();
      setLoading(false);
      return res;
    } catch (err: any) {
      setError(err);
      setLoading(false);
      throw err;
    }
  };

  const signInWithLine = () => {
    // LINE uses redirect flow, not popup
    const url = getLineLoginUrl();
    window.location.href = url;
  };

  const signOut = async () => {
    setLoading(true);
    setError(null);
    try {
      await firebaseSignOut();
      setLoading(false);
    } catch (err: any) {
      setError(err);
      setLoading(false);
      throw err;
    }
  };

  return {
    user,
    loading: loading || authLoading,
    error,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithLine,
    signOut,
  };
}
