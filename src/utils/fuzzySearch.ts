import { User } from '../types/auth';

export const getFuzzyMatches = (query: string, users: User[]) => {
  if (!query) return users.slice(0, 8); // Return first 8 if no query

  const lowerQuery = query.toLowerCase();

  return users
    .map((user) => {
      const name = user.username.toLowerCase();
      let score = 0;

      if (name === lowerQuery)
        score = 100; // Perfect match
      else if (name.startsWith(lowerQuery))
        score = 80; // Starts with match
      else if (name.includes(lowerQuery))
        score = 40; // Contains match
      else {
        // Character sequence match (e.g., "jhn" matches "john")
        let queryIdx = 0;
        for (const char of name) {
          if (char === lowerQuery[queryIdx]) queryIdx++;
        }
        if (queryIdx === lowerQuery.length) score = 20;
      }

      return { user, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.user)
    .slice(0, 8); // Limit results for performance
};
