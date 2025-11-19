import { useEffect, useRef, useState } from "react";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { TypingIndicator } from "@/components/TypingIndicator";
import { ConversationSidebar } from "@/components/ConversationSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useConversations } from "@/hooks/useConversations";
import { useMessages } from "@/hooks/useMessages";
import { useToast } from "@/hooks/use-toast";
import { Heart, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    conversations,
    loading: conversationsLoading,
    createConversation,
    deleteConversation,
    updateConversationTitle,
  } = useConversations(user?.id);

  const { messages, saveMessage, addMessageLocally, updateLastMessage, setMessages } =
    useMessages(currentConversationId);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const generateTitle = async (firstMessage: string) => {
    const words = firstMessage.split(" ").slice(0, 6).join(" ");
    return words.length > 40 ? words.substring(0, 40) + "..." : words;
  };

  const handleNewConversation = async () => {
    if (!user) return;

    const title = "New Conversation";
    const conversation = await createConversation(title);
    if (conversation) {
      setCurrentConversationId(conversation.id);
      setMessages([]);
    }
  };

  const handleSelectConversation = (id: string) => {
    setCurrentConversationId(id);
  };

  const handleDeleteConversation = async (id: string) => {
    await deleteConversation(id);
    if (currentConversationId === id) {
      setCurrentConversationId(null);
    }
  };

  const streamChat = async (userMessage: string, conversationId: string) => {
    setIsStreaming(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mental-health-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [...messages, { role: "user", content: userMessage }],
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to get response");
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;

        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              updateLastMessage(assistantContent);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Save assistant message
      if (assistantContent) {
        await saveMessage({ role: "assistant", content: assistantContent });
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Connection Error",
        description: error instanceof Error ? error.message : "Unable to connect. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleSend = async (content: string) => {
    if (!user) return;

    let conversationId = currentConversationId;

    // Create new conversation if none exists
    if (!conversationId) {
      const title = await generateTitle(content);
      const conversation = await createConversation(title);
      if (!conversation) return;
      conversationId = conversation.id;
      setCurrentConversationId(conversation.id);
    }

    // Add user message locally
    addMessageLocally({ role: "user", content });

    // Save user message to database
    await saveMessage({ role: "user", content });

    // Update conversation title if it's the first message
    if (messages.length === 0) {
      const title = await generateTitle(content);
      updateConversationTitle(conversationId, title);
    }

    // Stream AI response
    await streamChat(content, conversationId);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-chat-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen bg-chat-background">
      <ConversationSidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        onSignOut={signOut}
      />

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-card border-b border-border shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3 md:ml-0 ml-16">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">MindfulChat</h1>
              <p className="text-xs text-muted-foreground">Your Mental Health Companion</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Heart className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold text-foreground mb-2">
                  {currentConversationId ? "Continue Your Journey" : "Welcome to MindfulChat"}
                </h2>
                <p className="text-muted-foreground max-w-md">
                  A safe space to share your thoughts and feelings. I'm here to listen and support you.
                </p>
                <p className="text-sm text-muted-foreground mt-4">
                  Share what's on your mind to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <ChatMessage key={message.id || index} role={message.role} content={message.content} />
                ))}
                {isStreaming && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input */}
        <div className="bg-card border-t border-border shadow-lg">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <ChatInput onSend={handleSend} disabled={isStreaming} />
            <p className="text-xs text-muted-foreground text-center mt-3">
              This is a support tool, not a replacement for professional mental health care.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
