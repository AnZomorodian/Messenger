import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Info, Github, Heart, Code } from "lucide-react";

export function AboutModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
          title="About OCHAT"
          data-testid="button-about"
        >
          <Info className="w-5 h-5" />
        </button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20">
              <Code className="w-5 h-5 text-white" />
            </div>
            About OCHAT
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-white/90">Developer</h3>
            <p className="text-white/70 flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-400" />
              Built with love by <span className="font-semibold text-primary">Artin Zomorodian</span>
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold text-white/90">About This App</h3>
            <p className="text-white/60 text-sm leading-relaxed">
              OCHAT is a real-time messenger application built with modern web technologies. 
              It features instant messaging, text formatting (bold, italic, underline), 
              emoji reactions, image sharing, direct messages, and user status management.
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold text-white/90">Features</h3>
            <ul className="text-white/60 text-sm space-y-1">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Real-time messaging with polling
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Text formatting: <strong>Bold</strong> (Ctrl+B), <em>Italic</em> (Ctrl+I), <u>Underline</u> (Ctrl+U)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Emoji reactions on messages
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Image sharing (up to 2MB)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Direct messages between users
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                User status (Online, Away, Busy, Offline)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Message locking and editing
              </li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold text-white/90">Tech Stack</h3>
            <div className="flex flex-wrap gap-2">
              {["React", "TypeScript", "Express", "TanStack Query", "Tailwind CSS", "Framer Motion"].map((tech) => (
                <span key={tech} className="px-2 py-1 bg-white/10 rounded-md text-xs text-white/70">
                  {tech}
                </span>
              ))}
            </div>
          </div>
          
          <div className="pt-4 border-t border-white/10 text-center">
            <p className="text-xs text-white/40">
              Version 1.0.0 - Made with React + Express
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
