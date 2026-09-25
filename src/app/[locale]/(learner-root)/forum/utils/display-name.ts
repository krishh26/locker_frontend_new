import type { ForumMessageSender } from "@/store/api/forum/types";
import type { ForumChat } from "@/store/api/forum/types";
import type { AuthUser } from "@/store/api/auth/types";

/** Turn "dare.akosile@…" into "Dare Akosile" when no real name is available. */
function formatNameFromEmail(email: string): string {
  const local = email.split("@")[0] || "";
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function looksLikeEmail(value: string): boolean {
  return value.includes("@");
}

/** Prefer first/last name, then non-email user_name, then a friendly email-derived name. */
export function getForumSenderDisplayName(
  sender: ForumMessageSender | undefined | null,
): string {
  if (!sender) return "User";

  const fullName = [sender.first_name, sender.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (fullName) return fullName;

  const userName = String(sender.user_name || "").trim();
  if (userName && !looksLikeEmail(userName)) return userName;

  const email = String(sender.email || userName || "").trim();
  if (email && looksLikeEmail(email)) {
    return formatNameFromEmail(email) || email;
  }

  return userName || "User";
}

/** Display name for the logged-in user (sent messages). */
export function getCurrentUserDisplayName(
  user: AuthUser | null | undefined,
  fallbackSender?: ForumMessageSender | null,
): string {
  const fullName = [user?.firstName, user?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (fullName) return fullName;

  const userName =
    typeof user?.user_name === "string" ? user.user_name.trim() : "";
  if (userName && !looksLikeEmail(userName)) return userName;

  if (fallbackSender) return getForumSenderDisplayName(fallbackSender);

  const email = String(user?.email || userName || "").trim();
  if (email && looksLikeEmail(email)) {
    return formatNameFromEmail(email) || email;
  }

  return "You";
}

/** Latest sender first + last name for a course row in the forum chat list. */
export function getForumChatListSenderName(chat: ForumChat): string {
  const nestedSender = chat.latest_forum_sender || chat.sender;
  if (nestedSender) {
    return getForumSenderDisplayName(nestedSender);
  }

  const flatFullName = [
    chat.latest_forum_sender_first_name || chat.first_name,
    chat.latest_forum_sender_last_name || chat.last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (flatFullName) return flatFullName;

  const flatUserName = String(chat.latest_forum_sender_user_name || "").trim();
  if (flatUserName && !looksLikeEmail(flatUserName)) return flatUserName;
  if (flatUserName && looksLikeEmail(flatUserName)) {
    return formatNameFromEmail(flatUserName) || flatUserName;
  }

  return "";
}
