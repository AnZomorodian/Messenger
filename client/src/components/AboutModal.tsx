import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Info, Heart, Code, MessageCircle, Users, Image, BarChart3, Timer, Lock, Palette, Shield, Sparkles } from "lucide-react";

export function AboutModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className="p-2 hover:bg-white/10 dark:hover:bg-white/10 hover:bg-gray-100 rounded-lg text-white/60 dark:text-white/60 text-gray-500 hover:text-white dark:hover:text-white hover:text-gray-700 transition-colors"
          title="About OCHAT"
          data-testid="button-about"
        >
          <Info className="w-5 h-5" />
        </button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 dark:bg-zinc-900 bg-white border-zinc-800 dark:border-zinc-800 border-gray-200 max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display flex items-center gap-3 text-foreground">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-primary/30">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            OCHAT
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20">
            <p className="text-white/80 dark:text-white/80 text-gray-700 flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-400 animate-pulse" />
              Built By <span className="font-bold text-primary">Artin Zomorodian</span>
            </p>
            <p className="text-xs text-white/40 mt-1">Version 2.5 - Optimized for Speed & Privacy</p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold text-white/90 dark:text-white/90 text-gray-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              Next-Gen Communication
            </h3>
            <p className="text-white/60 dark:text-white/60 text-gray-600 text-sm leading-relaxed">
              OCHAT is a high-performance messaging platform that puts security and user experience first. 
              Our distributed architecture ensures lightning-fast message delivery, while end-to-end 
              encryption principles keep your data private.
            </p>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-semibold text-white/90 dark:text-white/90 text-gray-800">Features</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: MessageCircle, label: "Real-time Chat", color: "text-blue-400" },
                { icon: Users, label: "@Mentions", color: "text-green-400" },
                { icon: Image, label: "Media Sharing", color: "text-purple-400" },
                { icon: BarChart3, label: "Polls", color: "text-yellow-400" },
                { icon: Timer, label: "Timers", color: "text-orange-400" },
                { icon: Lock, label: "Message Lock", color: "text-red-400" },
                { icon: Palette, label: "Dark/Light Mode", color: "text-cyan-400" },
                { icon: Shield, label: "Admin Panel", color: "text-pink-400" },
              ].map(({ icon: Icon, label, color }) => (
                <div key={label} className="flex items-center gap-2 p-2 rounded-lg bg-white/5 dark:bg-white/5 bg-gray-50">
                  <Icon className={`w-4 h-4 ${color}`} />
                  <span className="text-xs text-white/70 dark:text-white/70 text-gray-600">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-white/90 dark:text-white/90 text-gray-800">Keyboard Shortcuts</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-white/10 dark:bg-white/10 bg-gray-100 rounded text-white/70 dark:text-white/70 text-gray-600">Ctrl+B</kbd>
                <span className="text-white/60 dark:text-white/60 text-gray-500">Bold</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-white/10 dark:bg-white/10 bg-gray-100 rounded text-white/70 dark:text-white/70 text-gray-600">Ctrl+I</kbd>
                <span className="text-white/60 dark:text-white/60 text-gray-500">Italic</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-white/10 dark:bg-white/10 bg-gray-100 rounded text-white/70 dark:text-white/70 text-gray-600">Ctrl+U</kbd>
                <span className="text-white/60 dark:text-white/60 text-gray-500">Underline</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-white/10 dark:bg-white/10 bg-gray-100 rounded text-white/70 dark:text-white/70 text-gray-600">Ctrl+H</kbd>
                <span className="text-white/60 dark:text-white/60 text-gray-500">Hyperlink</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold text-white/90 dark:text-white/90 text-gray-800">Tech Stack</h3>
            <div className="flex flex-wrap gap-2">
              {["React", "TypeScript", "Express", "TanStack Query", "Tailwind CSS", "Framer Motion", "Vite"].map((tech) => (
                <span key={tech} className="px-2 py-1 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-md text-xs text-white/80 dark:text-white/80 text-gray-600 border border-primary/20">
                  {tech}
                </span>
              ))}
            </div>
          </div>
          
          <div className="pt-4 border-t border-white/10 dark:border-white/10 border-gray-200 text-center space-y-1">
            <p className="text-sm font-medium bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
              OCHAT v2.0
            </p>
            <p className="text-xs text-white/40 dark:text-white/40 text-gray-400">
              Simple, Fast, Connected.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
