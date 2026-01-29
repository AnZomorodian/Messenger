import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useLogin } from "@/hooks/use-chat";
import { ColorPicker } from "@/components/ColorPicker";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles } from "lucide-react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [color, setColor] = useState("#007AFF");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const loginMutation = useLogin();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast({
        variant: "destructive",
        title: "Username required",
        description: "Please enter a username to join the chat.",
      });
      return;
    }

    loginMutation.mutate(
      { username, color },
      {
        onSuccess: (user) => {
          // Store user session simply in localStorage for this demo
          localStorage.setItem("chat_user", JSON.stringify(user));
          toast({
            title: "Welcome!",
            description: `Joined as ${user.username}`,
          });
          setLocation("/chat");
        },
        onError: (error) => {
          toast({
            variant: "destructive",
            title: "Error joining",
            description: error.message,
          });
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-10 left-10 w-64 h-64 bg-purple-500/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-500/20 rounded-full blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-panel w-full max-w-md p-8 rounded-3xl relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-purple-600 mb-4 shadow-lg shadow-primary/25">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2 font-display bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
            PrismChat
          </h1>
          <p className="text-muted-foreground">Join the conversation in color</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium ml-1">Choose your alias</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username..."
              className="w-full px-4 py-3 rounded-xl glass-input outline-none transition-all duration-200"
              autoFocus
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium ml-1">Pick your vibe</label>
            <ColorPicker
              selectedColor={color}
              onSelect={setColor}
              className="bg-black/20 p-4 rounded-2xl border border-white/5"
            />
          </div>

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-primary to-purple-600 hover:to-purple-500 text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
          >
            {loginMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Joining...
              </>
            ) : (
              "Enter Chat Room"
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
