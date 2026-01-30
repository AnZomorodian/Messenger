import { usePoll, useVotePoll } from "@/hooks/use-chat";
import { cn } from "@/lib/utils";
import { BarChart3, Check, Users, Clock } from "lucide-react";

interface PollDisplayProps {
  messageId: number;
  currentUserId: number;
}

export function PollDisplay({ messageId, currentUserId }: PollDisplayProps) {
  const { data: poll } = usePoll(messageId);
  const votePoll = useVotePoll();

  if (!poll) return null;

  const votes = JSON.parse(poll.votes || "{}") as Record<string, number>;
  const totalVotes = Object.keys(votes).length;
  const userVote = votes[currentUserId?.toString()];

  const voteCounts = poll.options.reduce((acc: Record<number, number>, _: string, idx: number) => {
    acc[idx] = Object.values(votes).filter(v => v === idx).length;
    return acc;
  }, {} as Record<number, number>);

  const maxVotes = Math.max(...(Object.values(voteCounts) as number[]), 1);

  const handleVote = (optionIndex: number) => {
    if (userVote !== undefined) return;
    votePoll.mutate({ pollId: poll.id, optionIndex, userId: currentUserId });
  };

  return (
    <div className="mt-3 p-4 rounded-xl bg-gradient-to-br from-white/5 to-white/10 dark:from-white/5 dark:to-white/10 from-gray-50 to-gray-100 border border-white/10 dark:border-white/10 border-gray-200 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/20">
            <BarChart3 className="w-4 h-4 text-primary" />
          </div>
          <span className="font-semibold text-sm text-foreground">{poll.question}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-white/40 dark:text-white/40 text-gray-500">
          <Users className="w-3 h-3" />
          <span>{totalVotes}</span>
        </div>
      </div>
      
      <div className="space-y-2">
        {poll.options.map((option: string, idx: number) => {
          const count = voteCounts[idx] || 0;
          const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          const isSelected = userVote === idx;
          const isWinning = count === maxVotes && totalVotes > 0;

          return (
            <button
              key={idx}
              onClick={() => handleVote(idx)}
              disabled={userVote !== undefined}
              className={cn(
                "w-full p-3 rounded-lg text-left relative overflow-hidden transition-all group",
                userVote !== undefined ? "cursor-default" : "hover:scale-[1.02] active:scale-[0.98]",
                isSelected && "ring-2 ring-primary shadow-lg shadow-primary/20",
                isWinning && userVote !== undefined && "ring-1 ring-green-500/50"
              )}
              data-testid={`button-poll-option-${idx}`}
            >
              <div 
                className={cn(
                  "absolute inset-0 transition-all duration-500",
                  userVote !== undefined 
                    ? isWinning 
                      ? "bg-gradient-to-r from-green-500/30 to-green-500/20" 
                      : "bg-primary/20"
                    : "bg-white/5 dark:bg-white/5 bg-gray-100 group-hover:bg-white/10 dark:group-hover:bg-white/10 group-hover:bg-gray-200"
                )}
                style={{ width: userVote !== undefined ? `${percentage}%` : '100%' }}
              />
              <div className="relative flex items-center justify-between">
                <span className="text-sm flex items-center gap-2 text-foreground">
                  {isSelected && (
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                  {!isSelected && userVote === undefined && (
                    <span className="w-5 h-5 rounded-full border-2 border-white/20 dark:border-white/20 border-gray-300 group-hover:border-primary/50" />
                  )}
                  {option}
                </span>
                {userVote !== undefined && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/40 dark:text-white/40 text-gray-500">{count} vote{count !== 1 ? 's' : ''}</span>
                    <span className={cn(
                      "text-sm font-bold min-w-[3rem] text-right",
                      isWinning ? "text-green-400" : "text-white/60 dark:text-white/60 text-gray-600"
                    )}>
                      {percentage}%
                    </span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
      
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10 dark:border-white/10 border-gray-200">
        <p className="text-xs text-white/40 dark:text-white/40 text-gray-500 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {totalVotes} total vote{totalVotes !== 1 ? 's' : ''}
        </p>
        {userVote === undefined && (
          <span className="text-xs text-primary font-medium animate-pulse">
            Click to vote
          </span>
        )}
        {userVote !== undefined && (
          <span className="text-xs text-green-400 flex items-center gap-1">
            <Check className="w-3 h-3" />
            Voted
          </span>
        )}
      </div>
    </div>
  );
}
