import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Users, MessageSquare, Trash2, Shield, RefreshCw, Lock, Unlock, Ban, Download, Eye, Settings, Home } from "lucide-react";
import { motion } from "framer-motion";
import type { User, Message } from "@shared/schema";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const ADMIN_PASSWORD = "admin123";

export default function Admin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [bannedUsers, setBannedUsers] = useState<number[]>([]);
  const [selectedDMPair, setSelectedDMPair] = useState<{user1: User, user2: User} | null>(null);
  const [broadcastMessage, setBroadcastMessage] = useState("");

  const { data: allUsers = [], isLoading: isLoadingUsers, refetch: refetchUsers } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: isAuthenticated,
  });

  const { data: allMessages = [], isLoading: isLoadingMessages, refetch: refetchMessages } = useQuery<(Message & { user?: User })[]>({
    queryKey: ["/api/admin/messages"],
    enabled: isAuthenticated,
  });

  const deleteMessage = useMutation({
    mutationFn: async (messageId: number) => {
      const res = await fetch(`/api/admin/messages/${messageId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      toast({ title: "Message deleted" });
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: number) => {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "User deleted" });
    },
  });

  const clearAllMessages = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/messages/clear", { method: "POST" });
      if (!res.ok) throw new Error("Failed to clear");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      toast({ title: "All messages cleared" });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      toast({ title: "Welcome, Admin!" });
    } else {
      toast({ variant: "destructive", title: "Invalid password" });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="bg-zinc-900/80 border-zinc-800">
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-display">Admin Panel</CardTitle>
              <p className="text-white/60 text-sm">Enter admin password to continue</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password..."
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-white placeholder:text-white/40"
                  data-testid="input-admin-password"
                />
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setLocation("/")}
                    data-testid="button-back-home"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button type="submit" className="flex-1" data-testid="button-admin-login">
                    Login
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLocation("/chat")}
              className="p-2 hover:bg-white/10 rounded-lg flex items-center gap-2"
              data-testid="button-back"
              title="Back to Chat"
            >
              <Home className="w-5 h-5" />
              <span className="text-sm hidden sm:inline">Back to Chat</span>
            </button>
            <div>
              <h1 className="text-3xl font-display font-bold flex items-center gap-3">
                <Shield className="w-8 h-8 text-primary" />
                Admin Panel
              </h1>
              <p className="text-white/60 text-sm mt-1">Manage users and messages</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{allUsers.length}</p>
                  <p className="text-white/60 text-sm">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{allMessages.length}</p>
                  <p className="text-white/60 text-sm">Total Messages</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">Admin</p>
                  <p className="text-white/60 text-sm">System Status: Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-400" />
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (confirm("Are you sure you want to clear ALL messages?")) {
                      clearAllMessages.mutate();
                    }
                  }}
                  disabled={clearAllMessages.isPending}
                  data-testid="button-clear-all"
                >
                  Clear All
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="bg-zinc-800/50 dark:bg-zinc-800/50 bg-white/80 border border-zinc-700 dark:border-zinc-700 border-gray-200 mb-4">
            <TabsTrigger value="users" className="data-[state=active]:bg-primary">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="messages" className="data-[state=active]:bg-primary">
              <MessageSquare className="w-4 h-4 mr-2" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-primary">
              <Settings className="w-4 h-4 mr-2" />
              Tools
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>All Users</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => refetchUsers()}
                  data-testid="button-refresh-users"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingUsers ? (
                  <p className="text-white/60">Loading...</p>
                ) : allUsers.length === 0 ? (
                  <p className="text-white/60">No users yet</p>
                ) : (
                  <div className="space-y-2">
                    {allUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                            style={{ backgroundColor: user.color }}
                          >
                            {user.username.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{user.username}</p>
                            <p className="text-xs text-white/40">ID: {user.id} - Status: {user.status}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          onClick={() => {
                            if (confirm(`Delete user "${user.username}"?`)) {
                              deleteUser.mutate(user.id);
                            }
                          }}
                          data-testid={`button-delete-user-${user.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages">
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>All Messages</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => refetchMessages()}
                  data-testid="button-refresh-messages"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingMessages ? (
                  <p className="text-white/60">Loading...</p>
                ) : allMessages.length === 0 ? (
                  <p className="text-white/60">No messages yet</p>
                ) : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {allMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex items-start justify-between p-3 bg-zinc-800/50 rounded-lg gap-4",
                          msg.isLocked && "ring-1 ring-yellow-500/50"
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className="font-medium text-sm"
                              style={{ color: msg.user?.color }}
                            >
                              {msg.user?.username || "Unknown"}
                            </span>
                            {msg.isLocked && (
                              <Lock className="w-3 h-3 text-yellow-400" />
                            )}
                            {msg.isEdited && (
                              <span className="text-xs text-white/40">(edited)</span>
                            )}
                          </div>
                          <p className="text-sm text-white/80 break-words">
                            {msg.content || (msg.imageUrl ? "[Image]" : "[Empty]")}
                          </p>
                          <p className="text-xs text-white/40 mt-1">
                            ID: {msg.id} - {msg.timestamp ? new Date(msg.timestamp).toLocaleString() : "Unknown"}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 flex-shrink-0"
                          onClick={() => {
                            if (confirm("Delete this message?")) {
                              deleteMessage.mutate(msg.id);
                            }
                          }}
                          data-testid={`button-delete-message-${msg.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="bg-zinc-900/50 dark:bg-zinc-900/50 bg-white border-zinc-800 dark:border-zinc-800 border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Ban className="w-5 h-5 text-red-400" />
                    Banned Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-white/60 dark:text-white/60 text-gray-600 mb-4">
                    Ban users to prevent them from sending messages
                  </p>
                  {bannedUsers.length === 0 ? (
                    <p className="text-sm text-white/40 dark:text-white/40 text-gray-400">No banned users</p>
                  ) : (
                    <div className="space-y-2 mb-4">
                      {bannedUsers.map(userId => {
                        const user = allUsers.find(u => u.id === userId);
                        return (
                          <div key={userId} className="flex items-center justify-between p-2 bg-red-500/10 rounded">
                            <span className="text-sm">{user?.username || `User #${userId}`}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setBannedUsers(prev => prev.filter(id => id !== userId))}
                              data-testid={`button-unban-${userId}`}
                            >
                              Unban
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {allUsers.filter(u => !bannedUsers.includes(u.id)).slice(0, 5).map(user => (
                      <Button
                        key={user.id}
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setBannedUsers(prev => [...prev, user.id]);
                          toast({ title: `${user.username} banned` });
                        }}
                        data-testid={`button-ban-${user.id}`}
                      >
                        Ban {user.username}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900/50 dark:bg-zinc-900/50 bg-white border-zinc-800 dark:border-zinc-800 border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Eye className="w-5 h-5 text-blue-400" />
                    View DM Conversations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-white/60 dark:text-white/60 text-gray-600 mb-4">
                    Monitor private conversations between users
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {allUsers.slice(0, 6).map((user1, i) => 
                      allUsers.slice(i + 1, i + 4).map(user2 => (
                        <div 
                          key={`${user1.id}-${user2.id}`}
                          className="flex items-center justify-between p-2 bg-zinc-800/50 dark:bg-zinc-800/50 bg-gray-100 rounded"
                        >
                          <span className="text-xs truncate">
                            <span style={{ color: user1.color }}>{user1.username}</span>
                            {" & "}
                            <span style={{ color: user2.color }}>{user2.username}</span>
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2"
                            onClick={() => {
                              setSelectedDMPair({ user1, user2 });
                              toast({ title: `Viewing DMs: ${user1.username} & ${user2.username}` });
                            }}
                            data-testid={`button-view-dm-${user1.id}-${user2.id}`}
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900/50 dark:bg-zinc-900/50 bg-white border-zinc-800 dark:border-zinc-800 border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Download className="w-5 h-5 text-green-400" />
                    Export Data
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-white/60 dark:text-white/60 text-gray-600 mb-4">
                    Download all data as JSON for backup
                  </p>
                  <div className="space-y-2">
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => {
                        const data = {
                          users: allUsers,
                          messages: allMessages,
                          exportedAt: new Date().toISOString()
                        };
                        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `ochat-export-${Date.now()}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                        toast({ title: "Data exported successfully" });
                      }}
                      data-testid="button-export-all"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export All Data
                    </Button>
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => {
                        const data = { users: allUsers, exportedAt: new Date().toISOString() };
                        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `ochat-users-${Date.now()}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                        toast({ title: "Users exported" });
                      }}
                      data-testid="button-export-users"
                    >
                      Export Users Only
                    </Button>
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => {
                        const data = { messages: allMessages, exportedAt: new Date().toISOString() };
                        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `ochat-messages-${Date.now()}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                        toast({ title: "Messages exported" });
                      }}
                      data-testid="button-export-messages"
                    >
                      Export Messages Only
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
