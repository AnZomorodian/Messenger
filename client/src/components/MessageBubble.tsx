import { motion } from "framer-motion";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Message, User, Reaction } from "@shared/schema";
import { Edit2, Reply, CornerDownRight, SmilePlus, Download, Lock, Unlock, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "👏", "🎉"];

function formatText(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(__(.+?)__)/g;
  let match;
  let keyIndex = 0;
  
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    
    if (match[1]) {
      parts.push(<strong key={keyIndex++}>{match[2]}</strong>);
    } else if (match[3]) {
      parts.push(<em key={keyIndex++}>{match[4]}</em>);
    } else if (match[5]) {
      parts.push(<u key={keyIndex++}>{match[6]}</u>);
    }
    
    lastIndex = match.index + match[0].length;
  }
  
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  return parts.length > 0 ? parts : [text];
}

interface MessageBubbleProps {
  message: Message & { user?: User, replyTo?: Message & { user?: User }, reactions?: Reaction[], lockedByUser?: User };
  isCurrentUser: boolean;
  currentUserId?: number;
  onReply?: (message: Message & { user?: User }) => void;
  onEdit?: (message: Message & { user?: User }) => void;
  onReact?: (messageId: number, emoji: string) => void;
  onRemoveReact?: (messageId: number, emoji: string) => void;
  onLock?: (messageId: number) => void;
  onUnlock?: (messageId: number) => void;
  onDelete?: (messageId: number) => void;
}

export function MessageBubble({ message, isCurrentUser, currentUserId, onReply, onEdit, onReact, onRemoveReact, onLock, onUnlock, onDelete }: MessageBubbleProps) {
  const groupedReactions = (message.reactions || []).reduce((acc, r) => {
    if (!acc[r.emoji]) acc[r.emoji] = [];
    acc[r.emoji].push(r.userId);
    return acc;
  }, {} as Record<string, number[]>);

  const handleReaction = (emoji: string) => {
    if (!currentUserId) return;
    const userReacted = groupedReactions[emoji]?.includes(currentUserId);
    if (userReacted) {
      onRemoveReact?.(message.id, emoji);
    } else {
      onReact?.(message.id, emoji);
    }
  };

  const handleDownload = async () => {
    if (!message.imageUrl) return;
    try {
      const response = await fetch(message.imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `image-${message.id}.${message.imageUrl.split(".").pop()}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Download failed:", e);
    }
  };

  const canLock = !isCurrentUser && !message.isLocked;
  const canUnlock = message.isLocked && message.lockedByUserId === currentUserId;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn(
        "flex w-full mb-4",
        isCurrentUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[85%] md:max-w-[70%] flex flex-col group",
          isCurrentUser ? "items-end" : "items-start"
        )}
      >
        {!isCurrentUser && (
          <span 
            className="text-xs font-semibold mb-1 ml-1" 
            style={{ color: message.user?.color || "#fff" }}
          >
            {message.user?.username || "Unknown"}
          </span>
        )}
        
        {message.replyTo && (
          <div className={cn(
            "flex items-center gap-2 mb-1 px-3 py-1.5 rounded-t-xl bg-white/5 border-x border-t border-white/5 text-xs opacity-60 max-w-full overflow-hidden",
            isCurrentUser ? "mr-4" : "ml-4"
          )}>
            <CornerDownRight className="w-3 h-3 flex-shrink-0" />
            <span className="font-bold truncate" style={{ color: message.replyTo.user?.color }}>
              {message.replyTo.user?.username}:
            </span>
            <span className="truncate italic">{message.replyTo.content}</span>
          </div>
        )}

        <div className={cn(
          "relative flex items-center gap-2 max-w-full",
          isCurrentUser ? "flex-row-reverse" : "flex-row"
        )}>
          <div className={cn(
            "opacity-0 group-hover:opacity-100 transition-opacity flex gap-1",
            isCurrentUser ? "flex-row-reverse" : "flex-row"
          )}>
            <Popover>
              <PopoverTrigger asChild>
                <button className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white" data-testid="button-react">
                  <SmilePlus className="w-3.5 h-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2 bg-zinc-900 border-zinc-800">
                <div className="flex gap-1">
                  {QUICK_REACTIONS.map((emoji, idx) => (
                    <button
                      key={`quick-${idx}`}
                      onClick={() => handleReaction(emoji)}
                      className={cn(
                        "p-1.5 hover:bg-white/10 rounded-lg text-lg transition-transform active:scale-90",
                        groupedReactions[emoji]?.includes(currentUserId || 0) && "bg-primary/20"
                      )}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <button 
              onClick={() => onReply?.(message)}
              className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white"
              data-testid="button-reply"
            >
              <Reply className="w-3.5 h-3.5" />
            </button>
            {isCurrentUser && !message.isLocked && (
              <button 
                onClick={() => onEdit?.(message)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white"
                data-testid="button-edit"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
            {canLock && (
              <button 
                onClick={() => onLock?.(message.id)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-yellow-400"
                title="Lock this message (prevent editing)"
                data-testid="button-lock"
              >
                <Lock className="w-3.5 h-3.5" />
              </button>
            )}
            {canUnlock && (
              <button 
                onClick={() => onUnlock?.(message.id)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-yellow-400 hover:text-white"
                title="Unlock this message"
                data-testid="button-unlock"
              >
                <Unlock className="w-3.5 h-3.5" />
              </button>
            )}
            {isCurrentUser && !message.isLocked && (
              <button 
                onClick={() => onDelete?.(message.id)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-red-400"
                title="Delete message"
                data-testid="button-delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div
            className={cn(
              "px-4 py-2.5 rounded-2xl shadow-sm text-sm md:text-base break-words relative min-w-[60px]",
              isCurrentUser 
                ? "bg-primary text-primary-foreground rounded-tr-sm" 
                : "bg-secondary/80 backdrop-blur-md text-secondary-foreground rounded-tl-sm border border-white/5",
              message.isLocked && "ring-2 ring-yellow-500/50"
            )}
          >
            {message.isLocked && (
              <div className="absolute -top-2 -right-2 bg-yellow-500 rounded-full p-1" title={`Locked by ${message.lockedByUser?.username}`}>
                <Lock className="w-2.5 h-2.5 text-black" />
              </div>
            )}
            {message.imageUrl && (
              <div className="relative group/img mb-2">
                <img 
                  src={message.imageUrl} 
                  alt="Shared image" 
                  className="max-w-full rounded-lg max-h-64 object-contain"
                />
                <button
                  onClick={handleDownload}
                  className="absolute bottom-2 right-2 p-2 bg-black/70 hover:bg-black/90 rounded-lg opacity-0 group-hover/img:opacity-100 transition-opacity"
                  title="Download image"
                  data-testid="button-download-image"
                >
                  <Download className="w-4 h-4 text-white" />
                </button>
              </div>
            )}
            {message.content && <p>{formatText(message.content)}</p>}
            
            <div className={cn(
              "text-[10px] opacity-50 mt-1 w-full flex justify-between items-center gap-2",
              isCurrentUser ? "text-primary-foreground" : "text-muted-foreground"
            )}>
              {message.isEdited && <span>(edited)</span>}
              <div className="flex-1 text-right">
                {message.timestamp ? format(new Date(message.timestamp), "HH:mm") : "Sending..."}
              </div>
            </div>
          </div>
        </div>

        {Object.keys(groupedReactions).length > 0 && (
          <div className={cn(
            "flex flex-wrap gap-1 mt-1",
            isCurrentUser ? "mr-4 justify-end" : "ml-4"
          )}>
            {Object.entries(groupedReactions).map(([emoji, userIds]) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className={cn(
                  "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-white/10 hover:bg-white/20 transition-colors",
                  userIds.includes(currentUserId || 0) && "bg-primary/30 hover:bg-primary/40"
                )}
              >
                <span>{emoji}</span>
                <span className="text-white/60">{userIds.length}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
