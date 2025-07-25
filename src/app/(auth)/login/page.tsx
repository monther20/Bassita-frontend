"use client";

import { Button } from "@/components/buttoon";
import { FaMicrosoft, FaGithub } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks";
import { GuestGuard } from "@/components";

export default function LoginPage() {
  const router = useRouter();
  const { loginWithGoogle, loginWithGithub, loginWithMicrosoft, isLoading } = useAuth();

  return (
    <GuestGuard>
      <div className="flex flex-col gap-6 lg:gap-10 items-center pt-6 lg:pt-10 w-full px-4 lg:px-0 lg:w-[75%] max-w-md">
        <div className="flex flex-col items-start gap-2 justify-center w-full">
          <span className="text-text-primary font-display text-2xl lg:text-4xl">
            Welcome Back!
          </span>
          <span className="text-gray-400 font-display text-xs lg:text-sm">
            Sign in to continue your journey
          </span>
        </div>
        <div className="flex flex-col gap-3 lg:gap-4 w-full">
          <Button
            label="Continue with Google"
            onClick={async () => {
              try {
                await loginWithGoogle();
                const redirectTo =
                  new URLSearchParams(window.location.search).get("redirect") ||
                  "/dashboard";
                router.push(redirectTo);
              } catch (error) {
                console.error("Google login failed:", error);
              }
            }}
            backgroundColor="bg-white"
            textColor="text-text-dark"
            icon={<FcGoogle size={20} className="lg:w-[25px] lg:h-[25px]" />}
            fullWidth={true}
            height="h-[50px]"
          />

          <Button
            label="Continue with GitHub"
            onClick={async () => {
              try {
                await loginWithGithub();
                const redirectTo =
                  new URLSearchParams(window.location.search).get("redirect") ||
                  "/dashboard";
                router.push(redirectTo);
              } catch (error) {
                console.error("GitHub login failed:", error);
              }
            }}
            backgroundColor="bg-spotlight-blue"
            textColor="text-text-primary"
            icon={<FaGithub size={20} className="lg:w-[25px] lg:h-[25px]" />}
            fullWidth={true}
            height="h-[50px]"
          />

          <Button
            label="Continue with Microsoft"
            onClick={async () => {
              try {
                await loginWithMicrosoft();
                const redirectTo =
                  new URLSearchParams(window.location.search).get("redirect") ||
                  "/dashboard";
                router.push(redirectTo);
              } catch (error) {
                console.error("Microsoft login failed:", error);
              }
            }}
            backgroundColor="bg-background-primary"
            textColor="text-text-primary"
            icon={<FaMicrosoft size={20} className="lg:w-[25px] lg:h-[25px]" />}
            fullWidth={true}
            height="h-[50px]"
          />
        </div>
        <div className="flex flex-col gap-3 lg:gap-4 w-full">
          <div className="flex items-center justify-center relative">
            <div className="w-full h-[0.5px] border-t border-gray-500"></div>
            <div className="absolute bg-background-tertiary px-2 text-gray-500 font-display text-sm">
              Or
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 lg:gap-4 w-full">
          <Button
            label="Continue with Email"
            onClick={() => {
              router.push("/login/email");
            }}
            backgroundColor="bg-gradient-to-r from-spotlight-purple to-spotlight-pink"
            textColor="text-text-primary"
            fullWidth={true}
            height="h-[50px]"
          />
        </div>

        {/* Sign Up Link */}
        <div className="text-center">
          <span className="text-gray-400 text-sm">
            Don&apos;t have an account?{" "}
          </span>
          <button
            onClick={() => router.push("/signup/email")}
            className="text-spotlight-purple hover:text-spotlight-pink transition-colors text-sm font-medium"
          >
            Sign up
          </button>
        </div>
      </div>
    </GuestGuard>
  );
}
