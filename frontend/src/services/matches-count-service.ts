// Matches Count Service - Global state management for matches count
import { MatchingService } from './matching-service';

class MatchesCountService {
  private count: number = 0;
  private listeners: Set<(count: number) => void> = new Set();

  // Get current count
  getCount(): number {
    return this.count;
  }

  // Set count and notify listeners
  setCount(count: number) {
    this.count = count;
    this.notifyListeners();
  }

  // Fetch count from server
  async fetchCount(): Promise<number> {
    try {
      const matchesData = await MatchingService.getMutualMatches();
      const count = matchesData.matches.length;
      this.setCount(count);
      return count;
    } catch (error) {
      console.error('Error fetching matches count:', error);
      this.setCount(0);
      return 0;
    }
  }

  // Subscribe to count changes
  subscribe(listener: (count: number) => void): () => void {
    this.listeners.add(listener);
    // Immediately call with current count
    listener(this.count);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Notify all listeners
  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.count);
      } catch (error) {
        console.error('Error in matches count listener:', error);
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