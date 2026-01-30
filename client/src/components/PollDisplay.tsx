import { usePoll, useVotePoll } from "@/hooks/use-chat";
import { cn } from "@/lib/utils";
import { BarChart3, Check } from "lucide-react";

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

  const handleVote = (optionIndex: number) => {
    if (userVote !== undefined) return;
    votePoll.mutate({ pollId: poll.id, optionIndex, userId: currentUserId });
  };

  return (
    <div className="mt-3 p-3 rounded-xl bg-white/5 border border-white/10">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-4 h-4 text-primary" />
        <span className="font-medium text-sm">{poll.question}</span>
      </div>
      
      <div className="space-y-2">
        {poll.options.map((option: string, idx: number) => {
          const count = voteCounts[idx] || 0;
          const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          const isSelected = userVote === idx;

          return (
            <button
              key={idx}
              onClick={() => handleVote(idx)}
              disabled={userVote !== undefined}
              className={cn(
                "w-full p-3 rounded-lg text-left relative overflow-hidden transition-all",
                userVote !== undefined ? "cursor-default" : "hover:bg-white/10",
                isSelected && "ring-2 ring-primary"
              )}
              data-testid={`button-poll-option-${idx}`}
            >
              {userVote !== undefined && (
                <div 
                  className="absolute inset-0 bg-primary/20 transition-all"
                  style={{ width: `${percentage}%` }}
                />
              )}
              <div className="relative flex items-center justify-between">
                <span className="text-sm flex items-center gap-2">
                  {isSelected && <Check className="w-4 h-4 text-primary" />}
                  {option}
                </span>
                {userVote !== undefined && (
                  <span className="text-xs text-white/60">{percentage}%</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      
      <p className="text-xs text-white/40 mt-2">
        {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
        {userVote === undefined && ' - Click to vote'}
      </p>
    </div>
  );
}
