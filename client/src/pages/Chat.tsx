import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { MessageBubble } from "@/components/MessageBubble";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useUsers, useMessages, useSendMessage, useUpdateMessage, useHeartbeat, useAddReaction, useRemoveReaction, useUploadImage, useUpdateStatus, useLockMessage, useUnlockMessage, useDeleteMessage, useDMRequests, useSendDMRequest, useRespondDMRequest, useDMPartners, useDirectMessages, useSendDirectMessage, useLogout, usePinDMMessage, useUnpinDMMessage, useMarkDMAsRead, usePinnedDMMessages, useCreatePoll, useVotePoll, usePoll, useUploadFile, useUpdateDM, useDeleteDM, useLockDM, useUnlockDM } from "@/hooks/use-chat";
import { Send, LogOut, Users, Loader2, Sparkles, X, CornerDownRight, Edit2, Smile, ImagePlus, Circle, Clock, MinusCircle, RefreshCw, MessageCircle, Check, XCircle, ArrowLeft, Shield, Pin, PinOff, FileUp, BarChart3, CheckCheck, Lock, Unlock, Trash2, Timer, Bell, Play, Pause, Settings, UserCircle, Palette } from "lucide-react";
import { AboutModal } from "@/components/AboutModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import type { User, Message, UserStatus } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { userStatuses } from "@shared/schema";

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
  const [showPollModal, setShowPollModal] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const generalFileInputRef = useRef<HTMLInputElement>(null);
  const [showWitnessModal, setShowWitnessModal] = useState(false);
  const [selectedWitness, setSelectedWitness] = useState<User | null>(null);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState(5);
  const [activeTimer, setActiveTimer] = useState<{ endTime: number; label: string } | null>(null);
  const [timerRemaining, setTimerRemaining] = useState<number>(0);
  const [lastCheckedMentions, setLastCheckedMentions] = useState<number[]>([]);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editColor, setEditColor] = useState("");

  // Initialize edit fields when user is loaded
  useEffect(() => {
    if (user) {
      setEditName(user.username);
      setEditBio(user.bio || "");
      setEditColor(user.color || "#7c3aed");
    }
  }, [user]);

  const handleUpdateProfile = () => {
    if (!user) return;
    fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: editName, bio: editBio, color: editColor })
    })
    .then(async res => {
      const isJson = res.headers.get('content-type')?.includes('application/json');
      const data = isJson ? await res.json() : null;
      
      if (!res.ok) {
        throw new Error(data?.message || `Error ${res.status}: ${res.statusText}`);
      }
      return data;
    })
    .then(updated => {
      if (updated) {
        setUser(updated);
        localStorage.setItem("chat_user", JSON.stringify(updated));
        setShowSettingsModal(false);
        toast({ title: "Profile Updated" });
        refetchUsers();
        // Update edit fields with new values
        setEditName(updated.username);
        setEditBio(updated.bio || "");
        setEditColor(updated.color || "#7c3aed");
      }
    })
    .catch(err => {
      console.error("Profile update error:", err);
      toast({ 
        variant: "destructive",
        title: "Update Failed", 
        description: err.message || "An unexpected error occurred"
      });
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
      e.preventDefault();
      wrapSelectedText('**');
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'i' || e.key === 'I')) {
      e.preventDefault();
      wrapSelectedText('*');
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U')) {
      e.preventDefault();
      wrapSelectedText('__');
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'h' || e.key === 'H')) {
      e.preventDefault();
      const url = prompt("Enter the URL:");
      if (url) {
        wrapSelectedTextWithUrl(url);
      }
    }
  };

  const wrapSelectedTextWithUrl = (url: string) => {
    const input = inputRef.current;
    if (!input) return;
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const text = content;
    const selectedText = text.substring(start, end) || "link";
    const wrapped = `[${selectedText}](${url})`;
    const newText = text.substring(0, start) + wrapped + text.substring(end);
    setContent(newText);
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
  const logoutMutation = useLogout();
  const pinDMMessage = usePinDMMessage();
  const unpinDMMessage = useUnpinDMMessage();
  const markDMAsRead = useMarkDMAsRead();
  const { data: pinnedDMMessages = [] } = usePinnedDMMessages(user?.id, dmChatUser?.id);
  const createPoll = useCreatePoll();
  const votePoll = useVotePoll();
  const uploadFile = useUploadFile();
  const updateDM = useUpdateDM();
  const deleteDM = useDeleteDM();
  const lockDM = useLockDM();
  const unlockDM = useUnlockDM();
  const [editingDM, setEditingDM] = useState<{id: number; content: string} | null>(null);
  useHeartbeat(user?.id);

  // Handle tab close / logout - free username
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (user?.id) {
        navigator.sendBeacon('/api/logout', JSON.stringify({ userId: user.id }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user?.id]);

  // Mark DMs as read when viewing
  useEffect(() => {
    if (user?.id && dmChatUser?.id) {
      markDMAsRead.mutate({ fromUserId: dmChatUser.id, toUserId: user.id });
    }
  }, [dmChatUser?.id, user?.id, directMessages.length]);

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

    if (dmEditingMessage) {
      fetch(`/api/dm/messages/${dmEditingMessage.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: dmContent })
      }).then(() => {
        setDmContent("");
        setDmEditingMessage(null);
        queryClient.invalidateQueries({ queryKey: ["/api/dm/messages", user.id, dmChatUser?.id] });
      });
    } else {
      sendDirectMessage.mutate({ fromUserId: user.id, toUserId: dmChatUser.id, content: dmContent }, {
        onSuccess: () => setDmContent("")
      });
    }
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

  // Mention notifications
  useEffect(() => {
    if (!user || !messages.length) return;
    const mentionRegex = new RegExp(`@${user.username}\\b`, 'i');
    const newMentions = messages.filter(
      (msg) => msg.userId !== user.id && mentionRegex.test(msg.content || '') && !lastCheckedMentions.includes(msg.id)
    );
    if (newMentions.length > 0) {
      newMentions.forEach((msg) => {
        const sender = users.find((u) => u.id === msg.userId);
        toast({
          title: "You were mentioned!",
          description: `${sender?.username || 'Someone'} mentioned you in a message`,
        });
      });
      setLastCheckedMentions((prev) => [...prev, ...newMentions.map((m) => m.id)]);
    }
  }, [messages, user, users, lastCheckedMentions, toast]);

  // Timer countdown effect
  useEffect(() => {
    if (!activeTimer) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, activeTimer.endTime - Date.now());
      setTimerRemaining(remaining);
      if (remaining === 0) {
        toast({ title: "Timer finished!", description: activeTimer.label || "Your timer is complete!" });
        setActiveTimer(null);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTimer, toast]);

  const isOffline = user?.status === "offline";

  const renderContent = (content: string) => {
    // Mentions
    const parts = content.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith("@")) {
        return <span key={i} className="text-primary font-bold px-1 bg-primary/10 rounded">{part}</span>;
      }
      // Hyperlinks [text](url)
      const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/g);
      if (linkMatch) {
         const innerParts = part.split(/(\[.*?\]\(.*?\))/g);
         return innerParts.map((inner, j) => {
           const match = inner.match(/\[(.*?)\]\((.*?)\)/);
           if (match) {
             return <a key={j} href={match[2]} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline hover:text-blue-300 mx-1">{match[1]}</a>;
           }
           return inner;
         });
      }
      return part;
    });
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !selectedImage) return;
    if (!user) return;
    
    const selfMentionRegex = new RegExp(`@${user.username}\\b`, 'i');
    const mentionMatches = content.match(/@\w+/g);
    const mentionsOthers = mentionMatches?.some(m => m.toLowerCase() !== `@${user.username}`.toLowerCase());

    if (selfMentionRegex.test(content) && !mentionsOthers) {
      toast({
        variant: "destructive",
        title: "Can't mention yourself",
        description: "You cannot mention yourself in messages.",
      });
      return;
    }
    
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
    if (user?.id) {
      logoutMutation.mutate(user.id);
    }
    localStorage.removeItem("chat_user");
    setLocation("/");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please select a file under 5MB.",
      });
      return;
    }
    
    setSelectedFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (generalFileInputRef.current) generalFileInputRef.current.value = "";
  };

  const handleCreatePoll = async () => {
    if (!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2) {
      toast({
        variant: "destructive",
        title: "Invalid poll",
        description: "Please add a question and at least 2 options.",
      });
      return;
    }
    if (!user) return;

    const messageResult = await sendMessage.mutateAsync({
      content: `[POLL] ${pollQuestion}`,
      userId: user.id,
      replyToId: null,
      imageUrl: null,
    });

    await createPoll.mutateAsync({
      messageId: messageResult.id,
      question: pollQuestion,
      options: pollOptions.filter(o => o.trim()),
    });

    setPollQuestion("");
    setPollOptions(["", ""]);
    setShowPollModal(false);
    toast({ title: "Poll created!" });
  };

  const handlePinDM = (messageId: number, isPinned: boolean) => {
    if (isPinned) {
      unpinDMMessage.mutate(messageId);
    } else {
      pinDMMessage.mutate(messageId);
    }
  };

  const handleEdit = (msg: Message & { user?: User }) => {
    setEditingMessage(msg);
    setReplyTo(null);
    setContent(msg.content);
  };

  const [dmEditingMessage, setDmEditingMessage] = useState<any>(null);

  const handleEditDM = (msg: any) => {
    setDmEditingMessage(msg);
    setDmContent(msg.content);
  };

  const handleLockDM = (messageId: number) => {
    if (!user) return;
    fetch(`/api/dm/messages/${messageId}/lock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id })
    }).then(() => queryClient.invalidateQueries({ queryKey: ["/api/dm/messages", user.id, dmChatUser?.id] }));
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

      {/* Settings Modal */}
      <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
        <DialogContent className="bg-zinc-900 dark:bg-zinc-900 bg-white border-zinc-800 dark:border-zinc-800 border-gray-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCircle className="w-5 h-5 text-primary" />
              Profile Settings
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium opacity-60">Display Name</label>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-muted border border-border rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium opacity-60">Bio</label>
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                className="w-full bg-muted border border-border rounded-lg p-2 text-sm h-20 focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium opacity-60 flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Profile Color
              </label>
              <div className="flex gap-2 flex-wrap">
                {["#7c3aed", "#ef4444", "#10b981", "#3b82f6", "#f59e0b", "#ec4899", "#14b8a6", "#f43f5e", "#8b5cf6", "#06b6d4"].map(c => (
                  <button
                    key={c}
                    onClick={() => setEditColor(c)}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-transform hover:scale-110",
                      editColor === c ? "border-white" : "border-transparent"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <input
                  type="color"
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                  className="w-8 h-8 rounded-full bg-transparent border-0 p-0 overflow-hidden cursor-pointer"
                />
              </div>
            </div>
            
            <div className="pt-4 border-t border-white/10 space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-wider opacity-40">Preferences</h4>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Notifications</p>
                  <p className="text-xs text-muted-foreground">Alerts for mentions</p>
                </div>
                <Button variant="outline" size="sm" className="h-8">Enable</Button>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Privacy Mode</p>
                  <p className="text-xs text-muted-foreground">Hide online status</p>
                </div>
                <Button variant="outline" size="sm" className="h-8">Configure</Button>
              </div>
            </div>
            <Button className="w-full" onClick={handleUpdateProfile}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sidebar - Users List */}
      <aside className={cn(
        "fixed md:relative z-50 w-72 h-full glass-panel border-r border-white/10 flex flex-col transition-transform duration-300 ease-out md:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          <div className="flex flex-col">
            <h1 className="font-display font-bold text-lg tracking-tight leading-none">OCHAT</h1>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2">
          <ThemeToggle className="w-8 h-8" />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettingsModal(true)}
            className="w-8 h-8 rounded-lg hover-elevate"
            data-testid="button-settings"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </Button>
          <AboutModal />
          <Link href="/admin">
            <button
              className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
              title="Admin Panel"
              data-testid="button-admin"
            >
              <Shield className="w-4 h-4" />
            </button>
          </Link>
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
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate text-sm">
                        {u.username}
                        {u.id === user.id && <span className="ml-2 text-xs text-white/40">(You)</span>}
                      </p>
                      <button 
                        onClick={() => {
                          setContent(prev => prev + `@${u.username} `);
                          inputRef.current?.focus();
                        }}
                        className="text-[10px] text-primary hover:underline"
                      >
                        Mention
                      </button>
                    </div>
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
            <input
              type="file"
              ref={generalFileInputRef}
              onChange={handleFileSelect}
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

            {selectedFile && (
              <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-white/5">
                <FileUp className="w-4 h-4 text-primary" />
                <span className="text-sm truncate flex-1">{selectedFile.name}</span>
                <span className="text-xs text-white/40">{(selectedFile.size / 1024 / 1024).toFixed(2)}MB</span>
                <button
                  type="button"
                  onClick={clearFile}
                  className="p-1 hover:bg-white/10 rounded text-white/40 hover:text-white"
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
                title="Upload image"
              >
                {uploadImage.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ImagePlus className="w-5 h-5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => generalFileInputRef.current?.click()}
                disabled={!!editingMessage || uploadFile.isPending || isOffline}
                className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-50 transition-all"
                title="Upload file (5MB max, 3hr expiry)"
                data-testid="button-upload-file"
              >
                {uploadFile.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <FileUp className="w-5 h-5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowPollModal(true)}
                disabled={!!editingMessage || isOffline}
                className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-50 transition-all"
                title="Create poll"
                data-testid="button-create-poll"
              >
                <BarChart3 className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => setShowTimerModal(true)}
                className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all relative"
                title="Set timer"
                data-testid="button-set-timer"
              >
                <Timer className="w-5 h-5" />
                {activeTimer && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse" />
                )}
              </button>
              
              <div className="relative flex-1 flex items-center">
                      <input
                        ref={inputRef}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isOffline ? "You're offline..." : editingMessage ? "Edit message..." : "Type ...!"}
                        className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-primary/50 text-white placeholder:text-white/30 rounded-2xl px-6 py-4 pr-14 outline-none transition-all shadow-inner disabled:opacity-50"
                        disabled={sendMessage.isPending || updateMessage.isPending || isOffline}
                        data-testid="input-message"
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
              className="w-full max-w-lg h-[600px] glass-panel rounded-2xl flex flex-col overflow-hidden"
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
                <span className="font-medium flex-1">{dmChatUser.username}</span>
              </div>

              {/* Pinned Messages */}
              {pinnedDMMessages.length > 0 && (
                <div className="px-4 py-2 bg-yellow-500/10 border-b border-yellow-500/20">
                  <div className="flex items-center gap-2 text-xs text-yellow-400 mb-1">
                    <Pin className="w-3 h-3" />
                    <span>Pinned Messages</span>
                  </div>
                  {pinnedDMMessages.slice(0, 2).map((dm: any) => (
                    <p key={dm.id} className="text-xs text-white/60 truncate">{dm.content}</p>
                  ))}
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {directMessages.length === 0 ? (
                  <p className="text-center text-white/40 dark:text-white/40 text-sm py-8">No messages yet. Say hello!</p>
                ) : (
                  directMessages.map((dm: any) => (
                    <div
                      key={dm.id}
                      className={cn(
                        "group max-w-[80%] relative",
                        dm.fromUserId === user.id ? "ml-auto" : ""
                      )}
                    >
                      <div
                        className={cn(
                          "p-3 rounded-2xl text-sm relative",
                          dm.fromUserId === user.id
                            ? "bg-primary text-white"
                            : "bg-white/10 dark:bg-white/10 bg-gray-200",
                          dm.isPinned && "ring-1 ring-yellow-500/50",
                          dm.isLocked && "ring-2 ring-yellow-500/50"
                        )}
                      >
                        {dm.isLocked && (
                          <div className="absolute -top-2 -right-2 bg-yellow-500 rounded-full p-1" title="Locked">
                            <Lock className="w-2.5 h-2.5 text-black" />
                          </div>
                        )}
                        {dm.isPinned && (
                          <Pin className="w-3 h-3 text-yellow-400 inline mr-1" />
                        )}
                        {dm.isEdited && <span className="text-xs opacity-50">(edited) </span>}
                        {dm.content}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        {dm.fromUserId === user.id && (
                          <span className="text-xs text-white/30 dark:text-white/30 text-gray-500 flex items-center gap-1">
                            {dm.isRead ? (
                              <>
                                <CheckCheck className="w-3 h-3 text-blue-400" />
                                <span className="text-blue-400">Seen</span>
                              </>
                            ) : (
                              <Check className="w-3 h-3" />
                            )}
                          </span>
                        )}
                        <button
                          onClick={() => handlePinDM(dm.id, dm.isPinned)}
                          className="invisible group-hover:visible p-1 hover:bg-white/10 rounded text-white/40 dark:text-white/40 text-gray-500 hover:text-yellow-400"
                          title={dm.isPinned ? "Unpin" : "Pin"}
                          data-testid={`button-pin-dm-${dm.id}`}
                        >
                          {dm.isPinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                        </button>
                        {dm.fromUserId === user.id && !dm.isLocked && (
                          <>
                            <button
                              onClick={() => {
                                setEditingDM({ id: dm.id, content: dm.content });
                                setDmContent(dm.content);
                              }}
                              className="invisible group-hover:visible p-1 hover:bg-white/10 rounded text-white/40 dark:text-white/40 text-gray-500 hover:text-white dark:hover:text-white hover:text-gray-700"
                              title="Edit"
                              data-testid={`button-edit-dm-${dm.id}`}
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm("Delete this message?")) {
                                  deleteDM.mutate(dm.id);
                                }
                              }}
                              className="invisible group-hover:visible p-1 hover:bg-white/10 rounded text-white/40 dark:text-white/40 text-gray-500 hover:text-red-400"
                              title="Delete"
                              data-testid={`button-delete-dm-${dm.id}`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </>
                        )}
                        {dm.fromUserId !== user.id && !dm.isLocked && (
                          <button
                            onClick={() => lockDM.mutate({ id: dm.id, userId: user.id })}
                            className="invisible group-hover:visible p-1 hover:bg-white/10 rounded text-white/40 dark:text-white/40 text-gray-500 hover:text-yellow-400"
                            title="Lock (prevent editing/deletion)"
                            data-testid={`button-lock-dm-${dm.id}`}
                          >
                            <Lock className="w-3 h-3" />
                          </button>
                        )}
                        {dm.isLocked && dm.lockedByUserId === user.id && (
                          <button
                            onClick={() => unlockDM.mutate(dm.id)}
                            className="invisible group-hover:visible p-1 hover:bg-white/10 rounded text-yellow-400 hover:text-white dark:hover:text-white hover:text-gray-700"
                            title="Unlock"
                            data-testid={`button-unlock-dm-${dm.id}`}
                          >
                            <Unlock className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {editingDM && (
                <div className="px-4 py-2 bg-white/5 dark:bg-white/5 bg-gray-100 border-t border-white/10 dark:border-white/10 border-gray-200 flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-primary" />
                  <span className="text-xs text-white/60 dark:text-white/60 text-gray-600">Editing message</span>
                  <button
                    onClick={() => {
                      setEditingDM(null);
                      setDmContent("");
                    }}
                    className="ml-auto p-1 hover:bg-white/10 dark:hover:bg-white/10 hover:bg-gray-200 rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              <form onSubmit={(e) => {
                e.preventDefault();
                if (!dmContent.trim()) return;
                if (editingDM) {
                  updateDM.mutate({ id: editingDM.id, content: dmContent.trim() }, {
                    onSuccess: () => {
                      setEditingDM(null);
                      setDmContent("");
                    }
                  });
                } else {
                  handleSendDM(e);
                }
              }} className="p-4 border-t border-white/10 dark:border-white/10 border-gray-200 flex gap-3">
                <input
                  type="text"
                  value={dmContent}
                  onChange={(e) => setDmContent(e.target.value)}
                  placeholder={editingDM ? "Edit message..." : "Type a message..."}
                  className="flex-1 bg-white/5 dark:bg-white/5 bg-gray-100 border border-white/10 dark:border-white/10 border-gray-200 rounded-xl px-4 py-2 outline-none focus:border-primary/50 text-foreground"
                  data-testid="input-dm-message"
                />
                <button
                  type="submit"
                  disabled={!dmContent.trim() || updateDM.isPending}
                  className="p-3 rounded-xl bg-primary text-white disabled:opacity-50"
                  data-testid="button-send-dm"
                >
                  {updateDM.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Poll Creation Modal */}
      <AnimatePresence>
        {showPollModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPollModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md glass-panel rounded-2xl p-6 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20 text-primary">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold">Create Poll</h3>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  placeholder="Ask a question..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary/50"
                  data-testid="input-poll-question"
                />

                <div className="space-y-2">
                  <p className="text-sm text-white/60">Options</p>
                  {pollOptions.map((option, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...pollOptions];
                          newOptions[idx] = e.target.value;
                          setPollOptions(newOptions);
                        }}
                        placeholder={`Option ${idx + 1}`}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-primary/50"
                        data-testid={`input-poll-option-${idx}`}
                      />
                      {pollOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                          className="p-2 hover:bg-white/10 rounded-lg text-red-400"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {pollOptions.length < 6 && (
                    <button
                      type="button"
                      onClick={() => setPollOptions([...pollOptions, ""])}
                      className="text-sm text-primary hover:underline"
                    >
                      + Add option
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowPollModal(false)}
                  className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePoll}
                  disabled={createPoll.isPending}
                  className="flex-1 py-3 rounded-xl bg-primary text-white disabled:opacity-50"
                  data-testid="button-submit-poll"
                >
                  {createPoll.isPending ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Create Poll"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timer Modal */}
      <AnimatePresence>
        {showTimerModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={() => setShowTimerModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-900 dark:bg-zinc-900 bg-white rounded-2xl p-6 w-full max-w-sm mx-4 space-y-4 border border-white/10 dark:border-white/10 border-gray-200"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20 text-primary">
                  <Timer className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Set Timer</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-white/60 dark:text-white/60 text-gray-600 mb-2 block">Minutes</label>
                  <div className="flex items-center gap-3">
                    {[1, 5, 10, 15, 30].map((mins) => (
                      <button
                        key={mins}
                        onClick={() => setTimerMinutes(mins)}
                        className={cn(
                          "px-3 py-2 rounded-lg text-sm transition-colors",
                          timerMinutes === mins
                            ? "bg-primary text-white"
                            : "bg-white/10 dark:bg-white/10 bg-gray-100 hover:bg-white/20 dark:hover:bg-white/20 hover:bg-gray-200"
                        )}
                        data-testid={`button-timer-${mins}`}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                </div>
                
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={timerMinutes}
                  onChange={(e) => setTimerMinutes(Math.max(1, Math.min(120, parseInt(e.target.value) || 1)))}
                  className="w-full bg-white/5 dark:bg-white/5 bg-gray-100 border border-white/10 dark:border-white/10 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-primary/50 text-foreground"
                  placeholder="Custom minutes..."
                  data-testid="input-timer-custom"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowTimerModal(false)}
                  className="flex-1 py-3 rounded-xl bg-white/5 dark:bg-white/5 bg-gray-100 hover:bg-white/10 dark:hover:bg-white/10 hover:bg-gray-200 transition-colors text-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setActiveTimer({
                      endTime: Date.now() + timerMinutes * 60 * 1000,
                      label: `${timerMinutes} minute timer`
                    });
                    setShowTimerModal(false);
                    toast({ title: "Timer started!", description: `${timerMinutes} minute timer is running` });
                  }}
                  className="flex-1 py-3 rounded-xl bg-primary text-white"
                  data-testid="button-start-timer"
                >
                  <Play className="w-4 h-4 inline mr-2" />
                  Start Timer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Timer Display */}
      <AnimatePresence>
        {activeTimer && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 right-6 bg-zinc-900 dark:bg-zinc-900 bg-white rounded-2xl p-4 border border-white/10 dark:border-white/10 border-gray-200 shadow-xl z-40"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20 text-primary animate-pulse">
                <Timer className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-white/60 dark:text-white/60 text-gray-600">{activeTimer.label}</p>
                <p className="text-2xl font-bold text-foreground font-mono">
                  {Math.floor(timerRemaining / 60000)}:{String(Math.floor((timerRemaining % 60000) / 1000)).padStart(2, '0')}
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveTimer(null);
                  toast({ title: "Timer cancelled" });
                }}
                className="p-2 hover:bg-white/10 dark:hover:bg-white/10 hover:bg-gray-100 rounded-lg text-red-400"
                title="Cancel timer"
                data-testid="button-cancel-timer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
