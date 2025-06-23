import { ConversationMessage, ConversationContext } from '@/types';

export function extractLocationFromText(text: string): string[] {
  // Simple location extraction - in a real app would use NLP
  const locations = [];
  const locationPatterns = [
    /\b([A-Z]{3})\b/g, // IATA codes
    /\b(New York|Los Angeles|London|Paris|Tokyo|Dubai|Singapore|Sydney|Miami|Orlando|Tampa|Boston|Chicago|Denver|Seattle|San Francisco|Las Vegas|Atlanta)\b/gi,
  ];
  
  for (const pattern of locationPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      locations.push(...matches);
    }
  }
  
  return [...new Set(locations)]; // Remove duplicates
}

export function extractDateFromText(text: string): string[] {
  const dates = [];
  const datePatterns = [
    /\b(today|tomorrow|this weekend|next week|next month)\b/gi,
    /\b(\d{1,2}\/\d{1,2}\/?\d{0,4})\b/g, // MM/DD or MM/DD/YYYY
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})\b/gi,
    /\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\b/gi,
  ];
  
  for (const pattern of datePatterns) {
    const matches = text.match(pattern);
    if (matches) {
      dates.push(...matches);
    }
  }
  
  return dates;
}

export function extractBudgetFromText(text: string): number[] {
  const budgets = [];
  const budgetPatterns = [
    /\$(\d{1,4}(?:,\d{3})*)/g, // $500, $1,000
    /(\d{1,4}(?:,\d{3})*)\s*dollars?/gi,
    /under\s*\$?(\d{1,4}(?:,\d{3})*)/gi,
    /less\s*than\s*\$?(\d{1,4}(?:,\d{3})*)/gi,
    /around\s*\$?(\d{1,4}(?:,\d{3})*)/gi,
    /about\s*\$?(\d{1,4}(?:,\d{3})*)/gi,
  ];
  
  for (const pattern of budgetPatterns) {
    const matches = [...text.matchAll(pattern)];
    for (const match of matches) {
      const amount = parseInt(match[1].replace(',', ''));
      if (!isNaN(amount)) {
        budgets.push(amount);
      }
    }
  }
  
  return budgets;
}

export function extractPassengerCount(text: string): { adults?: number; children?: number; infants?: number } {
  const passengers: { adults?: number; children?: number; infants?: number } = {};
  
  // Look for patterns like "2 adults", "1 child", "3 people"
  const adultPatterns = [
    /(\d+)\s*adults?/gi,
    /(\d+)\s*people/gi,
    /(\d+)\s*passengers?/gi,
  ];
  
  const childPatterns = [
    /(\d+)\s*child(?:ren)?/gi,
    /(\d+)\s*kids?/gi,
  ];
  
  const infantPatterns = [
    /(\d+)\s*infants?/gi,
    /(\d+)\s*babies/gi,
  ];
  
  for (const pattern of adultPatterns) {
    const match = text.match(pattern);
    if (match) {
      passengers.adults = parseInt(match[1]);
      break;
    }
  }
  
  for (const pattern of childPatterns) {
    const match = text.match(pattern);
    if (match) {
      passengers.children = parseInt(match[1]);
      break;
    }
  }
  
  for (const pattern of infantPatterns) {
    const match = text.match(pattern);
    if (match) {
      passengers.infants = parseInt(match[1]);
      break;
    }
  }
  
  // Default to 1 adult if no passengers specified
  if (!passengers.adults && !passengers.children && !passengers.infants) {
    passengers.adults = 1;
  }
  
  return passengers;
}

export function extractCabinClass(text: string): string | null {
  const cabinPatterns = [
    { pattern: /\b(economy|coach)\b/gi, class: 'economy' },
    { pattern: /\b(premium\s*economy|premium)\b/gi, class: 'premium_economy' },
    { pattern: /\b(business)\b/gi, class: 'business' },
    { pattern: /\b(first\s*class|first)\b/gi, class: 'first' },
  ];
  
  for (const { pattern, class: cabinClass } of cabinPatterns) {
    if (pattern.test(text)) {
      return cabinClass;
    }
  }
  
  return null;
}

export function detectIntent(text: string): string {
  const intentPatterns = [
    { pattern: /\b(search|find|look|show|flights?)\b/gi, intent: 'search_flights' },
    { pattern: /\b(book|reserve|buy)\b/gi, intent: 'book_flight' },
    { pattern: /\b(cancel|change|modify)\b/gi, intent: 'modify_booking' },
    { pattern: /\b(help|support|assist)\b/gi, intent: 'help' },
    { pattern: /\b(where|go|travel|visit|destination)\b/gi, intent: 'destination_search' },
    { pattern: /\b(when|date|time|schedule)\b/gi, intent: 'date_planning' },
    { pattern: /\b(price|cost|cheap|expensive|budget)\b/gi, intent: 'price_inquiry' },
    { pattern: /\b(prefer|like|want|settings)\b/gi, intent: 'preferences' },
  ];
  
  for (const { pattern, intent } of intentPatterns) {
    if (pattern.test(text)) {
      return intent;
    }
  }
  
  return 'general';
}

export function generateFollowUpSuggestions(context: ConversationContext): string[] {
  const suggestions = [];
  const { currentSearch, conversationFlow } = context;
  
  if (!currentSearch?.origin) {
    suggestions.push("Where are you traveling from?");
  }
  
  if (!currentSearch?.destination) {
    suggestions.push("Where would you like to go?");
  }
  
  if (!currentSearch?.departureDate) {
    suggestions.push("When would you like to travel?");
  }
  
  if (currentSearch?.origin && currentSearch?.destination && !currentSearch?.departureDate) {
    suggestions.push("What dates work for you?");
  }
  
  if (currentSearch?.isComplete) {
    suggestions.push("Would you like to see flight options?");
    suggestions.push("Any preferences for airlines or cabin class?");
  }
  
  // Intent-specific suggestions
  switch (conversationFlow.currentIntent) {
    case 'search_flights':
      if (!suggestions.length) {
        suggestions.push("Would you like to filter by price?");
        suggestions.push("Any preference for nonstop flights?");
      }
      break;
      
    case 'price_inquiry':
      suggestions.push("What's your budget range?");
      suggestions.push("Would you like to see deals?");
      break;
      
    case 'preferences':
      suggestions.push("Tell me about your travel preferences");
      suggestions.push("Any airlines you prefer or avoid?");
      break;
  }
  
  // Fallback suggestions
  if (!suggestions.length) {
    suggestions.push("What else can I help you with?");
    suggestions.push("Would you like to search for flights?");
    suggestions.push("Tell me about your trip");
  }
  
  return suggestions.slice(0, 3); // Limit to 3 suggestions
}

export function isSearchComplete(context: ConversationContext): boolean {
  const { currentSearch } = context;
  
  return !!(
    currentSearch?.origin &&
    currentSearch?.destination &&
    currentSearch?.departureDate &&
    currentSearch?.passengers
  );
}

export function getMissingSearchParameters(context: ConversationContext): string[] {
  const missing = [];
  const { currentSearch } = context;
  
  if (!currentSearch?.origin) missing.push('departure_city');
  if (!currentSearch?.destination) missing.push('destination');
  if (!currentSearch?.departureDate) missing.push('departure_date');
  if (!currentSearch?.passengers) missing.push('passengers');
  
  return missing;
}

export function formatMessageForDisplay(message: ConversationMessage): string {
  let formatted = message.content;
  
  // Add typing indicators for AI messages
  if (message.type === 'ai' && message.metadata?.processing) {
    formatted += ' ⏳';
  }
  
  // Add voice indicator for voice messages
  if (message.metadata?.source === 'voice') {
    formatted = '🎤 ' + formatted;
  }
  
  return formatted;
}

export function getConversationSummary(messages: ConversationMessage[]): string {
  const userMessages = messages.filter(m => m.type === 'user');
  
  if (userMessages.length === 0) {
    return 'New conversation';
  }
  
  // Use the first user message as summary
  const firstMessage = userMessages[0].content;
  
  // Truncate if too long
  if (firstMessage.length > 50) {
    return firstMessage.substring(0, 47) + '...';
  }
  
  return firstMessage;
}