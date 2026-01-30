import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type InsertUser, type InsertMessage } from "@shared/routes";
import { z } from "zod";

// Helper to handle API responses and throwing errors
async function fetcher(url: string, options?: RequestInit) {
  const res = await fetch(url, { ...options, credentials: "include" });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "An error occurred");
  }
  return res.json();
}

// === USERS ===

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (credentials: InsertUser) => {
      // Validate input before sending (extra safety)
      const validated = api.users.login.input.parse(credentials);
      
      const res = await fetch(api.users.login.path, {
        method: api.users.login.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });

      if (!res.ok) {
        throw new Error("Failed to login");
      }
      
      return api.users.login.responses[200].parse(await res.json());
    },
    onSuccess: (user) => {
      // Optimistically update user list if we were to refetch immediately
      queryClient.invalidateQueries({ queryKey: [api.users.list.path] });
    },
  });
}

export function useUsers() {
  return useQuery({
    queryKey: [api.users.list.path],
    queryFn: async () => {
      const data = await fetcher(api.users.list.path);
      return api.users.list.responses[200].parse(data);
    },
    refetchInterval: 5000, // Poll every 5s for new users
  });
}

// === MESSAGES ===

export function useMessages() {
  return useQuery({
    queryKey: [api.messages.list.path],
    queryFn: async () => {
      const data = await fetcher(api.messages.list.path);
      // The API returns messages with joined user data
      return api.messages.list.responses[200].parse(data);
    },
    refetchInterval: 1000, // Poll every 1s for near-realtime chat
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (message: InsertMessage) => {
      const validated = api.messages.create.input.parse(message);
      
      const res = await fetch(api.messages.create.path, {
        method: api.messages.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });

      if (!res.ok) {
        throw new Error("Failed to send message");
      }
      
      return api.messages.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      // Invalidate messages to fetch the new one immediately
      queryClient.invalidateQueries({ queryKey: [api.messages.list.path] });
    },
  });
}

export function useUpdateMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, content }: { id: number; content: string }) => {
      const path = api.messages.update.path.replace(":id", id.toString());
      const res = await fetch(path, {
        method: api.messages.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) {
        throw new Error("Failed to update message");
      }
      
      return api.messages.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.messages.list.path] });
    },
  });
}

export function useHeartbeat(userId: number | undefined) {
  return useQuery({
    queryKey: ["heartbeat", userId],
    queryFn: async () => {
      if (!userId) return null;
      await fetch("/api/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      return { success: true };
    },
    enabled: !!userId,
    refetchInterval: 10000,
  });
}

export function useAddReaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ messageId, userId, emoji }: { messageId: number; userId: number; emoji: string }) => {
      const res = await fetch("/api/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, userId, emoji }),
      });
      if (!res.ok) throw new Error("Failed to add reaction");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.messages.list.path] });
    },
  });
}

export function useRemoveReaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ messageId, userId, emoji }: { messageId: number; userId: number; emoji: string }) => {
      const res = await fetch("/api/reactions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, userId, emoji }),
      });
      if (!res.ok) throw new Error("Failed to remove reaction");
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.messages.list.path] });
    },
  });
}

export function useUploadImage() {
  return useMutation({
    mutationFn: async (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const res = await fetch("/api/upload", {
              method: "POST",
              headers: { "Content-Type": "text/plain" },
              body: reader.result as string,
            });
            if (!res.ok) {
              const err = await res.json();
              throw new Error(err.message || "Upload failed");
            }
            const data = await res.json();
            resolve(data.url);
          } catch (e) {
            reject(e);
          }
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });
    },
  });
}

export function useUpdateStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, status }: { userId: number; status: string }) => {
      const res = await fetch(`/api/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.users.list.path] });
    },
  });
}

export function useLockMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ messageId, userId }: { messageId: number; userId: number }) => {
      const res = await fetch(`/api/messages/${messageId}/lock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error("Failed to lock message");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.messages.list.path] });
    },
  });
}

export function useUnlockMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (messageId: number) => {
      const res = await fetch(`/api/messages/${messageId}/unlock`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to unlock message");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.messages.list.path] });
    },
  });
}

export function useDeleteMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (messageId: number) => {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete message");
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.messages.list.path] });
    },
  });
}

// === DIRECT MESSAGES ===

export function useDMRequests(userId: number | undefined) {
  return useQuery({
    queryKey: ["/api/dm/requests", userId],
    queryFn: async () => {
      if (!userId) return [];
      return fetcher(`/api/dm/requests/${userId}`);
    },
    enabled: !!userId,
    refetchInterval: 3000,
  });
}

export function useSendDMRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ fromUserId, toUserId }: { fromUserId: number; toUserId: number }) => {
      return fetcher("/api/dm/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromUserId, toUserId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dm/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dm/partners"] });
    },
  });
}

export function useRespondDMRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, status }: { requestId: number; status: "accepted" | "rejected" }) => {
      return fetcher(`/api/dm/request/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dm/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dm/partners"] });
    },
  });
}

export function useDMPartners(userId: number | undefined) {
  return useQuery({
    queryKey: ["/api/dm/partners", userId],
    queryFn: async () => {
      if (!userId) return [];
      return fetcher(`/api/dm/partners/${userId}`);
    },
    enabled: !!userId,
    refetchInterval: 5000,
  });
}

export function useDirectMessages(userId1: number | undefined, userId2: number | undefined) {
  return useQuery({
    queryKey: ["/api/dm/messages", userId1, userId2],
    queryFn: async () => {
      if (!userId1 || !userId2) return [];
      return fetcher(`/api/dm/messages/${userId1}/${userId2}`);
    },
    enabled: !!userId1 && !!userId2,
    refetchInterval: 1000,
  });
}

export function useSendDirectMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ fromUserId, toUserId, content }: { fromUserId: number; toUserId: number; content: string }) => {
      return fetcher("/api/dm/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromUserId, toUserId, content }),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/dm/messages", variables.fromUserId, variables.toUserId] });
    },
  });
}

export function usePinDMMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (messageId: number) => {
      return fetcher(`/api/dm/messages/${messageId}/pin`, { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dm/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dm/pinned"] });
    },
  });
}

export function useUnpinDMMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (messageId: number) => {
      return fetcher(`/api/dm/messages/${messageId}/unpin`, { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dm/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dm/pinned"] });
    },
  });
}

export function usePinnedDMMessages(userId1: number | undefined, userId2: number | undefined) {
  return useQuery({
    queryKey: ["/api/dm/pinned", userId1, userId2],
    queryFn: async () => {
      if (!userId1 || !userId2) return [];
      return fetcher(`/api/dm/pinned/${userId1}/${userId2}`);
    },
    enabled: !!userId1 && !!userId2,
    refetchInterval: 5000,
  });
}

export function useMarkDMAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ fromUserId, toUserId }: { fromUserId: number; toUserId: number }) => {
      return fetcher("/api/dm/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromUserId, toUserId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dm/messages"] });
    },
  });
}

export function useUnreadCount(userId: number | undefined, fromUserId: number | undefined) {
  return useQuery({
    queryKey: ["/api/dm/unread", userId, fromUserId],
    queryFn: async () => {
      if (!userId || !fromUserId) return { count: 0 };
      return fetcher(`/api/dm/unread/${userId}/${fromUserId}`);
    },
    enabled: !!userId && !!fromUserId,
    refetchInterval: 3000,
  });
}

// === POLLS ===

export function useCreatePoll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ messageId, question, options }: { messageId: number; question: string; options: string[] }) => {
      return fetcher("/api/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, question, options }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.messages.list.path] });
    },
  });
}

export function usePoll(messageId: number | undefined) {
  return useQuery({
    queryKey: ["/api/polls", messageId],
    queryFn: async () => {
      if (!messageId) return null;
      try {
        return await fetcher(`/api/polls/${messageId}`);
      } catch {
        return null;
      }
    },
    enabled: !!messageId,
    refetchInterval: 2000,
  });
}

export function useVotePoll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ pollId, optionIndex, userId }: { pollId: number; optionIndex: number; userId: number }) => {
      return fetcher(`/api/polls/${pollId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionIndex, userId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/polls"] });
    },
  });
}

// === FILE UPLOAD ===

export function useUploadFile() {
  return useMutation({
    mutationFn: async (file: File): Promise<{ url: string; expiresAt: string }> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const res = await fetch("/api/upload/file", {
              method: "POST",
              headers: { 
                "Content-Type": "text/plain",
                "X-Original-Name": file.name
              },
              body: reader.result as string,
            });
            if (!res.ok) {
              const err = await res.json();
              throw new Error(err.message || "Upload failed");
            }
            const data = await res.json();
            resolve(data);
          } catch (e) {
            reject(e);
          }
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });
    },
  });
}

// === LOGOUT ===

export function useLogout() {
  return useMutation({
    mutationFn: async (userId: number) => {
      return fetcher("/api/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
    },
  });
}
