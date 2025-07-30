// Matches Count Service - Global state management for matches count
import { MatchingService } from './matching-service';

class MatchesCountService {
  private count: number | null = null;
  private listeners: Set<(count: number) => void> = new Set();

  // Get current count
  getCount(): number {
    return this.count || 0;
  }

  // Set count and notify listeners
  setCount(count: number) {
    // Only set count if it's a valid number (not null, undefined, or negative)
    if (count !== null && count !== undefined && count >= 0) {
      this.count = count;
      this.notifyListeners();
    }
  }

  // Increment count (for when a new match is created)
  incrementCount() {
    if (this.count === null) {
      this.count = 1;
    } else {
      this.count += 1;
    }
    this.notifyListeners();
  }

  // Decrement count (for when a match is removed)
  decrementCount() {
    if (this.count !== null && this.count > 0) {
      this.count -= 1;
      this.notifyListeners();
    }
  }

  // Fetch count from server
  async fetchCount(): Promise<number> {
    try {
      const matchesData = await MatchingService.getMutualMatches();
      const count = matchesData.matches.length;
      this.setCount(count);
      return count;
    } catch (error) {
      // console.error('Error fetching matches count:', error);
      // Don't reset to 0 on error, keep the last known count
      return this.count || 0;
    }
  }

  // Subscribe to count changes
  subscribe(listener: (count: number) => void): () => void {
    this.listeners.add(listener);
    // Immediately call with current count
    listener(this.count || 0);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Notify all listeners
  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.count || 0);
      } catch (error) {
        // console.error('Error in matches count listener:', error);
      }
    });
  }

  // Clear all listeners
  clear() {
    this.listeners.clear();
  }
}

// Export singleton instance
export const matchesCountService = new MatchesCountService(); 