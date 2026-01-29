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
