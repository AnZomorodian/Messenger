import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useUsers, useMessages, useSendMessage, useUpdateMessage, useHeartbeat, useAddReaction, useRemoveReaction, useUploadImage, useUpdateStatus, useLockMessage, useUnlockMessage, useDeleteMessage, useDMRequests, useSendDMRequest, useRespondDMRequest, useDMPartners, useDirectMessages, useSendDirectMessage } from "@/hooks/use-chat";
import { MessageBubble } from "@/components/MessageBubble";
import { useToast } from "@/hooks/use-toast";
import { Send, LogOut, Users, Loader2, Sparkles, X, CornerDownRight, Edit2, Smile, ImagePlus, Circle, Clock, MinusCircle, RefreshCw, MessageCircle, Check, XCircle, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { User, Message } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { userStatuses, type UserStatus } from "@shared/schema";

const STATUS_CONFIG: Record<UserStatus, { label: string; color: string; icon: typeof Circle }> = {
  online: { label: "Online", color: "bg-green-500", icon: Circle },
  away: { label: "Away", color: "bg-yellow-500", icon: Clock },
  busy: { label: "Busy", color: "bg-red-500", icon: MinusCircle },
  offline: { label: "Offline", color: "bg-gray-500", icon: Circle },
};

const EMOJIS = [
  // Smileys
  "😀", "😁", "😂", "🤣", "😊", "😇", "🥰", "😍", "🤩", "😘", "😋", "🤪",
  "😎", "🤓", "🧐", "🤔", "🤭", "🤫", "😏", "😌", "😴", "🤤", "😜", "😝",
  "🙃", "😉", "🥳", "🤑", "🤗", "🤡", "🥸", "😺", "😸", "😹", "😻", "😼",
  // Emotions
  "🥺", "😢", "😭", "😤", "😠", "🤯", "😱", "🥶", "🥵", "😈", "👻", "💀",
  "😵", "🤮", "🤢", "🤧", "😷", "🤒", "🤕", "😬", "🫣", "🫡", "🫠", "🙄",
  // Hand gestures
  "👍", "👎", "👋", "🤝", "👏", "🙌", "🤲", "💪", "✌️", "🤞", "🤟", "🤙",
  "🫶", "🤌", "🫰", "🖐️", "✋", "👊", "🤛", "🤜", "🫵", "☝️", "👆", "👇",
  // Hearts & Love
  "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💕", "💗", "💓", "💘",
  "💝", "💖", "❤️‍🔥", "💔", "🩷", "🩵", "🩶", "💋", "😽", "🫀", "💞", "💌",
  // Activities
  "🔥", "✨", "⭐", "🌟", "💫", "🎉", "🎊", "🎁", "🎈", "🎯", "🏆", "🥇",
  "🎪", "🎭", "🎨", "🎲", "🎳", "🎸", "🎹", "🎺", "🎻", "🪘", "🥁", "🎤",
  // Objects
  "🚀", "💎", "💰", "🎮", "🎧", "📱", "💻", "🎬", "🎵", "🎶", "☕", "🍕",
  "🍔", "🍟", "🌭", "🍿", "🧁", "🍩", "🍪", "🍫", "🍬", "🍭", "🧋", "🥤",
  // Nature
  "🌈", "🌸", "🌺", "🌻", "🌙", "⚡", "❄️", "🍀", "🌴", "🦋", "🐱", "🐶",
  "🦊", "🐼", "🐨", "🦁", "🐯", "🐸", "🐵", "🐔", "🦄", "🐲", "🦖", "🦕",
  // More fun
  "💯", "🆒", "🆕", "🆓", "🔝", "🔜", "💤", "💢", "💥", "💦", "💨", "🕳️",
  "🌀", "🎀", "🎗️", "🏅", "🥈", "🥉", "⚽", "🏀", "🏈", "⚾", "🎾", "🏐"
];

export default function Chat() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [content, setContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<(Message & { user?: User }) | null>(null);
  const [editingMessage, setEditingMessage] = useState<(Message & { user?: User }) | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dmChatUser, setDmChatUser] = useState<User | null>(null);
  const [dmContent, setDmContent] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
      e.preventDefault();
      wrapSelectedText('**');
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'i' || e.key === 'I')) {
      e.preventDefault();
      wrapSelectedText('*');
    }
  };

  const wrapSelectedText = (wrapper: string) => {
    const input = inputRef.current;
    if (!input) return;
    
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const text = content;
    
    if (start !== end) {
      const selectedText = text.substring(start, end);
      const newText = text.substring(0, start) + wrapper + selectedText + wrapper + text.substring(end);
      setContent(newText);
      setTimeout(() => {
        input.setSelectionRange(start + wrapper.length, end + wrapper.length);
        input.focus();
      }, 0);
    } else {
      const newText = text.substring(0, start) + wrapper + wrapper + text.substring(end);
      setContent(newText);
      setTimeout(() => {
        input.setSelectionRange(start + wrapper.length, start + wrapper.length);
        input.focus();
      }, 0);
    }
  };

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
  const { data: users = [], refetch: refetchUsers, isRefetching: isRefetchingUsers } = useUsers();
  const { data: messages = [], isLoading: isLoadingMessages } = useMessages();
  const sendMessage = useSendMessage();
  const updateMessage = useUpdateMessage();
  const addReaction = useAddReaction();
  const removeReaction = useRemoveReaction();
  const uploadImage = useUploadImage();
  const updateStatus = useUpdateStatus();
  const lockMessage = useLockMessage();
  const unlockMessage = useUnlockMessage();
  const deleteMessage = useDeleteMessage();
  const { data: dmRequests = [] } = useDMRequests(user?.id);
  const sendDMRequest = useSendDMRequest();
  const respondDMRequest = useRespondDMRequest();
  const { data: dmPartners = [] } = useDMPartners(user?.id);
  const { data: directMessages = [] } = useDirectMessages(user?.id, dmChatUser?.id);
  const sendDirectMessage = useSendDirectMessage();
  useHeartbeat(user?.id);

  const pendingRequests = dmRequests.filter((r: any) => r.status === "pending" && r.toUserId === user?.id);

  const handleSendDMRequest = (toUser: User) => {
    if (!user) return;
    sendDMRequest.mutate({ fromUserId: user.id, toUserId: toUser.id }, {
      onSuccess: () => {
        toast({ title: "DM Request Sent", description: `Request sent to ${toUser.username}` });
      }
    });
  };

  const handleAcceptDM = (requestId: number) => {
    respondDMRequest.mutate({ requestId, status: "accepted" }, {
      onSuccess: () => {
        toast({ title: "Accepted", description: "You can now chat privately!" });
      }
    });
  };

  const handleRejectDM = (requestId: number) => {
    respondDMRequest.mutate({ requestId, status: "rejected" });
  };

  const handleSendDM = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !dmChatUser || !dmContent.trim()) return;
    sendDirectMessage.mutate({ fromUserId: user.id, toUserId: dmChatUser.id, content: dmContent }, {
      onSuccess: () => setDmContent("")
    });
  };

  const handleStatusChange = (status: UserStatus) => {
    if (!user) return;
    updateStatus.mutate({ userId: user.id, status });
    const updatedUser = { ...user, status };
    setUser(updatedUser);
    localStorage.setItem("chat_user", JSON.stringify(updatedUser));
  };

  const handleLock = (messageId: number) => {
    if (!user) return;
    lockMessage.mutate({ messageId, userId: user.id });
  };

  const handleUnlock = (messageId: number) => {
    unlockMessage.mutate(messageId);
  };

  const handleDelete = (messageId: number) => {
    deleteMessage.mutate(messageId, {
      onSuccess: () => {
        toast({
          title: "Deleted",
          description: "Message has been deleted.",
        });
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Cannot delete",
          description: error.message || "This message cannot be deleted.",
        });
      },
    });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please select an image under 2MB.",
      });
      return;
    }
    
    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Invalid file",
        description: "Please select an image file.",
      });
      return;
    }
    
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleReact = (messageId: number, emoji: string, msgUserId: number) => {
    if (!user) return;
    if (msgUserId === user.id) {
      toast({
        variant: "destructive",
        title: "Can't react",
        description: "You cannot react to your own message.",
      });
      return;
    }
    addReaction.mutate({ messageId, userId: user.id, emoji });
  };

  const handleRemoveReact = (messageId: number, emoji: string) => {
    if (!user) return;
    removeReaction.mutate({ messageId, userId: user.id, emoji });
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const isOffline = user?.status === "offline";

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !selectedImage) return;
    if (!user) return;
    
    if (isOffline) {
      toast({
        variant: "destructive",
        title: "You're offline",
        description: "Change your status to send messages.",
      });
      return;
    }

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
      const sendWithImage = async () => {
        let imageUrl: string | null = null;
        
        if (selectedImage) {
          try {
            imageUrl = await uploadImage.mutateAsync(selectedImage);
          } catch (e) {
            toast({
              variant: "destructive",
              title: "Upload failed",
              description: "Could not upload image. Please try again.",
            });
            return;
          }
        }
        
        sendMessage.mutate(
          { 
            content: content || (imageUrl ? "" : ""), 
            userId: user.id,
            replyToId: replyTo?.id || null,
            imageUrl
          },
          {
            onSuccess: () => {
              setContent("");
              setReplyTo(null);
              clearImage();
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
      };
      
      sendWithImage();
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
            <h2 className="font-display font-bold text-xl tracking-tight">OCHAT</h2>
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
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Active Users</h3>
            <button
              onClick={() => refetchUsers()}
              disabled={isRefetchingUsers}
              className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors disabled:opacity-50"
              title="Refresh user list"
              data-testid="button-refresh-users"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isRefetchingUsers && "animate-spin")} />
            </button>
          </div>
          {users.map((u) => {
            const statusInfo = STATUS_CONFIG[(u.status as UserStatus) || "online"];
            const isPartner = dmPartners.some((p: User) => p.id === u.id);
            const hasPendingRequest = dmRequests.some((r: any) => 
              (r.fromUserId === user.id && r.toUserId === u.id) || 
              (r.fromUserId === u.id && r.toUserId === user.id)
            );
            return (
              <div 
                key={u.id} 
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl transition-all",
                  u.id === user.id ? "bg-white/10 border border-white/5" : "hover:bg-white/5"
                )}
              >
                <div className="relative">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm"
                    style={{ backgroundColor: u.color }}
                  >
                    {u.username.substring(0, 2).toUpperCase()}
                  </div>
                  <div className={cn("absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-background", statusInfo.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-sm">
                    {u.username}
                    {u.id === user.id && <span className="ml-2 text-xs text-white/40">(You)</span>}
                  </p>
                  <p className="text-xs text-white/40 truncate">{statusInfo.label}</p>
                </div>
                {u.id !== user.id && (
                  isPartner ? (
                    <button
                      onClick={() => setDmChatUser(u)}
                      className="p-2 hover:bg-white/10 rounded-lg text-primary"
                      title="Open DM"
                      data-testid={`button-dm-chat-${u.id}`}
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  ) : !hasPendingRequest ? (
                    <button
                      onClick={() => handleSendDMRequest(u)}
                      className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white"
                      title="Send DM request"
                      data-testid={`button-dm-request-${u.id}`}
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  ) : (
                    <span className="text-xs text-white/30">Pending</span>
                  )
                )}
              </div>
            );
          })}

          {pendingRequests.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 px-2">DM Requests</h3>
              {pendingRequests.map((r: any) => (
                <div key={r.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/5 mb-2">
                  <span className="flex-1 text-sm truncate" style={{ color: r.fromUser?.color }}>
                    {r.fromUser?.username}
                  </span>
                  <button
                    onClick={() => handleAcceptDM(r.id)}
                    className="p-1.5 hover:bg-green-500/20 rounded text-green-400"
                    title="Accept"
                    data-testid={`button-accept-dm-${r.id}`}
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRejectDM(r.id)}
                    className="p-1.5 hover:bg-red-500/20 rounded text-red-400"
                    title="Reject"
                    data-testid={`button-reject-dm-${r.id}`}
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/10 space-y-3">
          <Popover>
            <PopoverTrigger asChild>
              <button className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-sm">
                <span className="text-white/60">Your Status</span>
                <div className="flex items-center gap-2">
                  <div className={cn("w-2.5 h-2.5 rounded-full", STATUS_CONFIG[(user?.status as UserStatus) || "online"].color)} />
                  <span>{STATUS_CONFIG[(user?.status as UserStatus) || "online"].label}</span>
                </div>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2 bg-zinc-900 border-zinc-800">
              {userStatuses.map((status) => {
                const info = STATUS_CONFIG[status];
                return (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    className={cn(
                      "w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors text-sm",
                      user?.status === status && "bg-white/10"
                    )}
                  >
                    <div className={cn("w-2.5 h-2.5 rounded-full", info.color)} />
                    <span>{info.label}</span>
                  </button>
                );
              })}
            </PopoverContent>
          </Popover>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-sm font-medium"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-transparent relative">
        {/* Offline Banner */}
        {isOffline && (
          <div className="bg-gray-600 text-white text-center py-2 px-4 text-sm font-medium z-40">
            You're offline. Change your status to send messages.
          </div>
        )}
        
        {/* Mobile Header */}
        <header className="md:hidden h-16 glass-panel border-b border-white/10 flex items-center px-4 justify-between z-30">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 hover:bg-white/10 rounded-lg"
            >
              <Users className="w-5 h-5" />
            </button>
            <h1 className="font-display font-bold text-lg">OCHAT</h1>
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
                  <p className="text-lg font-medium">No messages yet 💬</p>
                  <p className="text-sm max-w-xs">Be the first to say hello and start the conversation! 👋🎉</p>
                </motion.div>
              ) : (
                messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isCurrentUser={msg.userId === user.id}
                    currentUserId={user.id}
                    onReply={handleReply}
                    onEdit={handleEdit}
                    onReact={(messageId, emoji) => handleReact(messageId, emoji, msg.userId)}
                    onRemoveReact={handleRemoveReact}
                    onLock={handleLock}
                    onUnlock={handleUnlock}
                    onDelete={handleDelete}
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

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
            />
            
            {imagePreview && (
              <div className="relative mb-3 inline-block">
                <img src={imagePreview} alt="Preview" className="max-h-32 rounded-lg" />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            <form 
              onSubmit={handleSend}
              className="relative flex items-center gap-3"
            >
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={!!editingMessage || uploadImage.isPending || isOffline}
                className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-50 transition-all"
              >
                {uploadImage.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ImagePlus className="w-5 h-5" />
                )}
              </button>
              
              <div className="relative flex-1 flex items-center">
                <input
                  ref={inputRef}
                  type="text"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isOffline ? "You're offline..." : editingMessage ? "Edit message..." : "Type a message... (Ctrl+B: bold, Ctrl+I: italic)"}
                  className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-primary/50 text-white placeholder:text-white/30 rounded-2xl px-6 py-4 pr-14 outline-none transition-all shadow-inner disabled:opacity-50"
                  disabled={sendMessage.isPending || updateMessage.isPending || isOffline}
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
                      <div className="grid grid-cols-8 gap-1 max-h-64 overflow-y-auto scrollbar-thin p-1">
                        {EMOJIS.map((emoji, idx) => (
                          <button
                            key={`emoji-${idx}`}
                            type="button"
                            onClick={() => setContent(prev => prev + emoji)}
                            className="p-2 hover:bg-white/10 rounded-lg text-xl transition-transform active:scale-90 hover:scale-110"
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
                disabled={(!content.trim() && !selectedImage) || sendMessage.isPending || updateMessage.isPending || uploadImage.isPending || isOffline}
                className="p-4 rounded-2xl bg-primary text-white shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:transform-none transition-all duration-200"
              >
                {sendMessage.isPending || updateMessage.isPending || uploadImage.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* DM Chat Modal */}
      <AnimatePresence>
        {dmChatUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setDmChatUser(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg h-[500px] glass-panel rounded-2xl flex flex-col overflow-hidden"
            >
              <div className="p-4 border-b border-white/10 flex items-center gap-3">
                <button
                  onClick={() => setDmChatUser(null)}
                  className="p-2 hover:bg-white/10 rounded-lg"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                  style={{ backgroundColor: dmChatUser.color }}
                >
                  {dmChatUser.username.substring(0, 2).toUpperCase()}
                </div>
                <span className="font-medium">{dmChatUser.username}</span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {directMessages.length === 0 ? (
                  <p className="text-center text-white/40 text-sm py-8">No messages yet. Say hello!</p>
                ) : (
                  directMessages.map((dm: any) => (
                    <div
                      key={dm.id}
                      className={cn(
                        "max-w-[80%] p-3 rounded-2xl text-sm",
                        dm.fromUserId === user.id
                          ? "ml-auto bg-primary text-white"
                          : "bg-white/10"
                      )}
                    >
                      {dm.content}
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleSendDM} className="p-4 border-t border-white/10 flex gap-3">
                <input
                  type="text"
                  value={dmContent}
                  onChange={(e) => setDmContent(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-primary/50"
                  data-testid="input-dm-message"
                />
                <button
                  type="submit"
                  disabled={!dmContent.trim()}
                  className="p-3 rounded-xl bg-primary text-white disabled:opacity-50"
                  data-testid="button-send-dm"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
