"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, CheckCircle2 } from "lucide-react";

export default function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const textError = await res.text();
        console.error("Non-JSON response:", textError);
        throw new Error("Server configuration error. (Did you add your Environment Variables in Vercel and redeploy?)");
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.details ? `${data.error}: ${data.details}` : data.error || "Failed to join waitlist");
      }

      setStatus("success");
    } catch (error: any) {
      console.error(error);
      setStatus("error");
      setErrorMessage(error.message);
    }
  };

  if (status === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="border border-zinc-200 bg-white p-8 max-w-md w-full flex flex-col items-center gap-4 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <CheckCircle2 className="w-12 h-12 text-zinc-900 stroke-[1.2]" />
        </motion.div>
        <h3 className="text-2xl text-zinc-900" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          You are on the list.
        </h3>
        <p className="text-zinc-500 text-sm leading-relaxed">
          Keep an eye on your inbox for your exclusive invite. <br /> Welcome to the club.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="max-w-md w-full">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="relative">
          <input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={status === "loading"}
            className="w-full bg-transparent border-b border-zinc-300 focus:border-zinc-900 text-zinc-900 px-0 py-4 outline-none transition-colors duration-300 placeholder:text-zinc-400 text-base sm:text-lg rounded-none"
            style={{ fontFamily: "'Inter', sans-serif" }}
            required
          />
          <motion.div
            className="absolute bottom-0 left-0 h-[2px] bg-zinc-900"
            initial={{ width: "0%" }}
            animate={{ width: isFocused ? "100%" : "0%" }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
        <motion.button
          type="submit"
          disabled={status === "loading"}
          whileHover={{ y: -1 }}
          whileTap={{ y: 0 }}
          className="group relative bg-zinc-900 hover:bg-zinc-800 text-white font-medium px-8 py-4 sm:py-5 transition-colors flex items-center justify-between gap-4 disabled:opacity-70 disabled:cursor-not-allowed mt-2 overflow-hidden"
        >
          <span className="relative z-10 tracking-[0.15em] uppercase text-[11px] sm:text-xs font-semibold">
            {status === "loading" ? "Joining..." : "Request Access"}
          </span>
          <div className="relative z-10">
            {status === "loading" ? (
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform duration-300" />
            )}
          </div>
        </motion.button>
      </form>
      {status === "error" && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-500 text-sm mt-4 font-medium"
        >
          {errorMessage}
        </motion.p>
      )}
    </div>
  );
}
