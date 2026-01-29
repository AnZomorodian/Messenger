import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useUsers, useMessages, useSendMessage, useUpdateMessage } from "@/hooks/use-chat";
import { MessageBubble } from "@/components/MessageBubble";
import { useToast } from "@/hooks/use-toast";
import { Send, LogOut, Users, Loader2, Sparkles, X, CornerDownRight, Edit2, Smile } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { User, Message } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const EMOJIS = ["😀", "😂", "🥰", "😎", "🤔", "🔥", "👍", "❤️", "✨", "🎉", "🚀", "👋"];

export default function Chat() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [content, setContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<(Message & { user?: User }) | null>(null);
  const [editingMessage, setEditingMessage] = useState<(Message & { user?: User }) | null>(null);

  // Load user session
  useEffect(() => {
    const stored = localStorage.getItem("chat_user");
    if (!stored) {
      setLocation("/");
      return;
    }
    try {
      setUser(JSON.parse(stored));
    } catch (e) {
      setLocation("/");
    }
  }, [setLocation]);

  // Hooks
  const { data: users = [] } = useUsers();
  const { data: messages = [], isLoading: isLoadingMessages } = useMessages();
  const sendMessage = useSendMessage();
  const updateMessage = useUpdateMessage();

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user) return;

    if (editingMessage) {
      updateMessage.mutate(
        { id: editingMessage.id, content },
        {
          onSuccess: () => {
            setContent("");
            setEditingMessage(null);
          },
          onError: () => {
            toast({
              variant: "destructive",
              title: "Failed to update",
              description: "Please try again.",
            });
          },
        }
      );
    } else {
      sendMessage.mutate(
        { 
          content, 
          userId: user.id,
          replyToId: replyTo?.id || null 
        },
        {
          onSuccess: () => {
            setContent("");
            setReplyTo(null);
          },
          onError: () => {
            toast({
              variant: "destructive",
              title: "Failed to send",
              description: "Please try again.",
            });
          },
        }
      );
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("chat_user");
    setLocation("/");
  };

  const handleEdit = (msg: Message & { user?: User }) => {
    setEditingMessage(msg);
    setReplyTo(null);
    setContent(msg.content);
  };

  const handleReply = (msg: Message & { user?: User }) => {
    setReplyTo(msg);
    setEditingMessage(null);
  };

  const cancelAction = () => {
    setReplyTo(null);
    setEditingMessage(null);
    setContent("");
  };

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Users List */}
      <aside className={cn(
        "fixed md:relative z-50 w-72 h-full glass-panel border-r border-white/10 flex flex-col transition-transform duration-300 ease-out md:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-display font-bold text-xl tracking-tight">PrismChat</h2>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                {users.length} Online
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 px-2">Active Users</h3>
          {users.map((u) => (
            <div 
              key={u.id} 
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl transition-all",
                u.id === user.id ? "bg-white/10 border border-white/5" : "hover:bg-white/5"
              )}
            >
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm"
                style={{ backgroundColor: u.color }}
              >
                {u.username.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-sm">
                  {u.username}
                  {u.id === user.id && <span className="ml-2 text-xs text-white/40">(You)</span>}
                </p>
                <p className="text-xs text-white/40 truncate">Online</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-transparent relative">
        {/* Mobile Header */}
        <header className="md:hidden h-16 glass-panel border-b border-white/10 flex items-center px-4 justify-between z-30">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 hover:bg-white/10 rounded-lg"
            >
              <Users className="w-5 h-5" />
            </button>
            <h1 className="font-display font-bold text-lg">PrismChat</h1>
          </div>
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm"
            style={{ backgroundColor: user.color }}
          >
            {user.username.substring(0, 2).toUpperCase()}
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scrollbar-thin relative">
          {isLoadingMessages ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50"
                >
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-white/40" />
                  </div>
                  <p className="text-lg font-medium">No messages yet</p>
                  <p className="text-sm max-w-xs">Be the first to say hello and start the conversation!</p>
                </motion.div>
              ) : (
                messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isCurrentUser={msg.userId === user.id}
                    onReply={handleReply}
                    onEdit={handleEdit}
                  />
                ))
              )}
              <div ref={messagesEndRef} />
            </AnimatePresence>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 glass-panel border-t border-white/10">
          <div className="max-w-4xl mx-auto space-y-2">
            <AnimatePresence>
              {(replyTo || editingMessage) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 text-sm"
                >
                  <div className="flex items-center gap-3 truncate">
                    <div className="p-2 rounded-lg bg-primary/20 text-primary">
                      {editingMessage ? <Edit2 className="w-4 h-4" /> : <CornerDownRight className="w-4 h-4" />}
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-xs uppercase tracking-wider opacity-50">
                        {editingMessage ? "Editing message" : `Replying to ${replyTo?.user?.username}`}
                      </p>
                      <p className="truncate italic opacity-80">
                        {editingMessage?.content || replyTo?.content}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={cancelAction}
                    className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <form 
              onSubmit={handleSend}
              className="relative flex items-center gap-3"
            >
              <div className="relative flex-1 flex items-center">
                <input
                  type="text"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={editingMessage ? "Edit message..." : "Type a message..."}
                  className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-primary/50 text-white placeholder:text-white/30 rounded-2xl px-6 py-4 pr-14 outline-none transition-all shadow-inner"
                  disabled={sendMessage.isPending || updateMessage.isPending}
                />
                <div className="absolute right-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="p-2 hover:bg-white/10 rounded-xl text-white/40 hover:text-white transition-colors"
                      >
                        <Smile className="w-5 h-5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-2 bg-zinc-900 border-zinc-800 backdrop-blur-xl">
                      <div className="grid grid-cols-6 gap-1">
                        {EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setContent(prev => prev + emoji)}
                            className="p-2 hover:bg-white/10 rounded-lg text-xl transition-transform active:scale-90"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <button
                type="submit"
                disabled={!content.trim() || sendMessage.isPending || updateMessage.isPending}
                className="p-4 rounded-2xl bg-primary text-white shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:transform-none transition-all duration-200"
              >
                {sendMessage.isPending || updateMessage.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
