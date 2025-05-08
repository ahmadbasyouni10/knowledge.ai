import { Avatar } from "./Avatar";
import { cn } from "../lib/utils";

type Message = {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
};

type InterviewChatProps = {
  messages: Message[];
  className?: string;
};

export function InterviewChat({ messages, className }: InterviewChatProps) {
  return (
    <div className={cn("flex flex-col space-y-4 p-4 h-full overflow-y-auto", className)}>
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn(
            "flex items-start gap-3 p-4 rounded-lg max-w-[85%]",
            message.role === "assistant"
              ? "self-start bg-gray-100"
              : "self-end bg-indigo-600 text-white"
          )}
        >
          {message.role === "assistant" && (
            <Avatar
              src="/interviewer-avatar.png"
              alt="AI Interviewer"
              size="sm"
              className="mt-1"
            />
          )}
          <div className="flex flex-col">
            <div className="text-sm">{message.content}</div>
            <div className="text-xs text-gray-500 mt-1">
              {message.timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
          {message.role === "user" && (
            <Avatar
              src="/user-avatar.png"
              alt="User"
              size="sm"
              className="mt-1"
            />
          )}
        </div>
      ))}
    </div>
  );
} 