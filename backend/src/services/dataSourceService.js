const config = require('../config');

/**
 * Data Source Toggle Service
 * Manages switching between static/demo data and live API data
 */
class DataSourceService {
  constructor() {
    this.isStaticMode = config.FEATURES.USE_STATIC_DEMO;
    this.apiBaseUrl = config.API.BASE_URL;
  }

  /**
   * Get current data source mode
   */
  getMode() {
    return this.isStaticMode ? 'static' : 'live';
  }

  /**
   * Toggle between static and live data modes
   */
  toggleMode() {
    this.isStaticMode = !this.isStaticMode;
    console.log(`📊 Data source switched to: ${this.getMode()} mode`);
    return this.getMode();
  }

  /**
   * Force set data source mode
   */
  setMode(mode) {
    this.isStaticMode = mode === 'static';
    console.log(`📊 Data source set to: ${this.getMode()} mode`);
    return this.getMode();
  }

  /**
   * Get demo/static data for profiles
   */
  getStaticProfiles() {
    return [
      {
        id: 1,
        name: 'Arjun Sharma',
        age: 28,
        location: 'Mumbai, Maharashtra',
        profession: 'Software Engineer',
        education: 'B.Tech Computer Science',
        interests: ['Technology', 'Travel', 'Music'],
        images: ['/assets/profile-1.svg'],
        verified: true
      },
      {
        id: 2,
        name: 'Priya Patel',
        age: 26,
        location: 'Bangalore, Karnataka',
        profession: 'Product Manager',
        education: 'MBA from IIM',
        interests: ['Reading', 'Yoga', 'Cooking'],
        images: ['/assets/profile-2.svg'],
        verified: true
      },
      {
        id: 3,
        name: 'Rohit Kumar',
        age: 30,
        location: 'Delhi, NCR',
        profession: 'Doctor',
        education: 'MBBS, MD',
        interests: ['Sports', 'Medicine', 'Photography'],
        images: ['/assets/profile-3.svg'],
        verified: true
      }
    ];
  }

  /**
   * Get demo/static data for matches
   */
  getStaticMatches() {
    return [
      {
        id: 1,
        name: 'Sneha Reddy',
        age: 27,
        location: 'Hyderabad, Telangana',
        compatibility: 92,
        lastSeen: '2 hours ago',
        image: '/assets/match-1.svg'
      },
      {
        id: 2,
        name: 'Vikram Singh',
        age: 29,
        location: 'Pune, Maharashtra',
        compatibility: 88,
        lastSeen: '1 day ago',
        image: '/assets/match-2.svg'
      }
    ];
  }

  /**
   * Generic data fetcher - routes to static or live data
   */
  async getData(endpoint, fallbackStaticData = []) {
    if (this.isStaticMode) {
      console.log(`📊 Returning static data for: ${endpoint}`);
      return {
        success: true,
        data: fallbackStaticData,
        source: 'static',
        timestamp: new Date().toISOString()
      };
    }

    try {
      // In live mode, make actual API calls
      const response = await fetch(`${this.apiBaseUrl}${endpoint}`);
      const data = await response.json();
      
      console.log(`📊 Fetched live data for: ${endpoint}`);
      return {
        success: true,
        data: data,
        source: 'live',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.warn(`⚠️ Live API failed for ${endpoint}, falling back to static data`);
      return {
        success: true,
        data: fallbackStaticData,
        source: 'static_fallback',
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * Check if live API is available
   */
  async checkLiveAPIHealth() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/health`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

module.exports = new DataSourceService();
