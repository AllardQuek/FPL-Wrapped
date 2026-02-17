export const SERVICE_DOWN_MESSAGE = "❌ One of our services is down so please try again later 🥲";

/**
 * Checks if an error message indicates a downstream service failure (e.g. Anthropic/Claude)
 */
export function isServiceDownError(error: string): boolean {
  const errorLower = error.toLowerCase();
  return (
    errorLower.includes('agentexecutionerror') || 
    errorLower.includes('inference entity') || 
    errorLower.includes('anthropic') || 
    errorLower.includes('claude') || 
    errorLower.includes('service error')
  );
}

/**
 * Universal error converter - converts any unknown error type to string
 */
export function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error == null) return 'Unknown error';
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

/**
 * Convert technical errors into user-friendly messages
 */
export function getUserFriendlyError(error: string): string {
  const errorLower = error.toLowerCase();

  // Specific conversation not found - user might have stopped/refreshed
  if (errorLower.includes('conversationnotfound') || (errorLower.includes('conversation') && errorLower.includes('not found'))) {
    return "The current conversation session has expired or was interrupted. I've started a fresh session for you—please try sending your message again.";
  }

  // API endpoint not found - likely Elastic Agent not configured
  if (errorLower.includes('no handler found') || (errorLower.includes('404') && !errorLower.includes('conversation'))) {
    return "Chat feature is currently unavailable. The AI assistant might not be configured correctly in Elastic Cloud, or the Kibana URL is incorrect.";
  }

  // Authentication issues
  if (errorLower.includes('401') || errorLower.includes('403') || errorLower.includes('unauthorized') || errorLower.includes('apikey')) {
    return "Authentication error. Please check your ELASTICSEARCH_API_KEY and permissions.";
  }

  // Connection issues
  if (errorLower.includes('failed to fetch') || errorLower.includes('network') || errorLower.includes('connection') || errorLower.includes('econnrefused')) {
    return "Connection error. Could not reach the Elastic Agent. Please check your internet and ELASTICSEARCH_URL.";
  }

  // Specific agent errors
  if (errorLower.includes('agent_id')) {
    return "Configuration error: The ELASTIC_AGENT_ID is invalid or missing.";
  }

  // Timeout
  if (errorLower.includes('timeout')) {
    return "Request timed out. The query might be too complex. Try simplifying your question.";
  }

  // Terminated or interrupted
  if (errorLower.includes('terminated') || errorLower.includes('interrupted')) {
    return "The operation was interrupted. This usually happens if the search took too long or was cancelled.";
  }

  // Service/Provider specific downstream errors
  if (isServiceDownError(error)) {
    // Strip the ❌ for the UI fallback which usually adds its own prefix or has different styling
    return SERVICE_DOWN_MESSAGE.replace('❌ ', '');
  }

  // Generic fallback
  return "Something went wrong. Please try again or rephrase your question.";
}

/**
 * Convert tool IDs to user-friendly names with icons
 */
export function getToolDisplayName(toolId: string): string {
  const toolMap: Record<string, string> = {
    'platform.core.search': '🔍 Searching documents',
    'platform.core.elasticsearch': '📊 Querying data',
    'platform.core.aggregate': '📈 Aggregating data',
    'platform.core.sql': '💾 Running SQL query',
  };

  return toolMap[toolId] || `🔧 ${toolId.split('.').pop() || toolId}`;
}

/**
 * Replace <visualization tool-result-id="ID"/> with an image placeholder src 'viz://ID'
 */
export function transformVisualizations(content: string) {
  if (!content) return '';
  const regex = /<visualization[^>]*tool-result-id="([^"]+)"[^>]*\/>/g;
  return content.replace(regex, (_m, id) => `\n\n![](viz://${id})\n\n`);
}

export interface ToolCall {
  tool_id: string;
  tool_call_id: string;
  params?: Record<string, unknown>;
  results?: unknown[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  reasoning?: string[];
  toolCalls?: ToolCall[];
}
