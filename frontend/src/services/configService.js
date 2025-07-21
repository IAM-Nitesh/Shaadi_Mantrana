/**
 * Frontend Configuration Service
 * Manages API endpoints and data source toggling for frontend
 */

const config = {
  // API Configuration
  API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001',
  API_VERSION: 'v1',
  
  // Data source mode
  USE_STATIC_DEMO: !process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_USE_STATIC_DEMO === 'true',
  
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Feature flags
  FEATURES: {
    ENABLE_OFFLINE_MODE: true,
    ENABLE_PUSH_NOTIFICATIONS: false,
    ENABLE_ANALYTICS: process.env.NODE_ENV === 'production'
  }
};

class FrontendConfigService {
  constructor() {
    this.config = config;
    this.isStaticMode = config.USE_STATIC_DEMO;
    this.apiBaseUrl = config.API_BASE_URL;
  }

  /**
   * Get API endpoint URL
   */
  getAPIEndpoint(path) {
    if (this.isStaticMode) {
      return null; // Use static data instead
    }
    return `${this.apiBaseUrl}/api${path}`;
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return {
      ...this.config,
      dataSource: this.isStaticMode ? 'static' : 'live',
      apiEndpoints: {
        auth: this.getAPIEndpoint('/auth'),
        profiles: this.getAPIEndpoint('/profiles'),
        matches: this.getAPIEndpoint('/matches'),
        chat: this.getAPIEndpoint('/chat')
      }
    };
  }

  /**
   * Check if we're in static demo mode
   */
  isStaticDemoMode() {
    return this.isStaticMode;
  }

  /**
   * Toggle data source mode (for development/testing)
   */
  toggleDataSource() {
    this.isStaticMode = !this.isStaticMode;
    console.log(`📊 Frontend data source: ${this.isStaticMode ? 'static' : 'live'}`);
    return this.isStaticMode ? 'static' : 'live';
  }

  /**
   * Get static demo data
   */
  getStaticData(type) {
    const staticData = {
      profiles: [
        {
          id: 1,
          name: 'Arjun Sharma',
          age: 28,
          location: 'Mumbai, Maharashtra',
          profession: 'Software Engineer',
          image: '/assets/profile-1.svg'
        },
        {
          id: 2,
          name: 'Priya Patel',
          age: 26,
          location: 'Bangalore, Karnataka',
          profession: 'Product Manager',
          image: '/assets/profile-2.svg'
        },
        {
          id: 3,
          name: 'Rohit Kumar',
          age: 30,
          location: 'Delhi, NCR',
          profession: 'Doctor',
          image: '/assets/profile-3.svg'
        }
      ],
      matches: [
        {
          id: 1,
          name: 'Sneha Reddy',
          age: 27,
          compatibility: 92,
          image: '/assets/match-1.svg'
        },
        {
          id: 2,
          name: 'Vikram Singh',
          age: 29,
          compatibility: 88,
          image: '/assets/match-2.svg'
        }
      ],
      conversations: [
        {
          id: 1,
          name: 'Sneha Reddy',
          lastMessage: 'Hey! How are you doing?',
          timestamp: '2 hours ago',
          image: '/assets/match-1.svg'
        }
      ]
    };

    return staticData[type] || [];
  }
}

export default new FrontendConfigService();
