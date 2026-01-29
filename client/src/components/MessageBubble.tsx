import { motion } from "framer-motion";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Message, User } from "@shared/schema";
import { Edit2, Reply, CornerDownRight } from "lucide-react";

interface MessageBubbleProps {
  message: Message & { user?: User, replyTo?: Message & { user?: User } };
  isCurrentUser: boolean;
  onReply?: (message: Message & { user?: User }) => void;
  onEdit?: (message: Message & { user?: User }) => void;
}

export function MessageBubble({ message, isCurrentUser, onReply, onEdit }: MessageBubbleProps) {
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
            <button 
              onClick={() => onReply?.(message)}
              className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white"
            >
              <Reply className="w-3.5 h-3.5" />
            </button>
            {isCurrentUser && (
              <button 
                onClick={() => onEdit?.(message)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div
            className={cn(
              "px-4 py-2.5 rounded-2xl shadow-sm text-sm md:text-base break-words relative min-w-[60px]",
              isCurrentUser 
                ? "bg-primary text-primary-foreground rounded-tr-sm" 
                : "bg-secondary/80 backdrop-blur-md text-secondary-foreground rounded-tl-sm border border-white/5"
            )}
          >
            {message.content}
            
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
      </div>
    </motion.div>
  );
}
