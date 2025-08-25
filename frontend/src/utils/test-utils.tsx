// // Testing utilities for the application

// import React from 'react';
// import { render, RenderOptions } from '@testing-library/react';
// import { ThemeProvider } from '../components/ThemeProvider';
// import { PWAProvider } from '../components/PWAProvider';

// // Custom render function with providers
// const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
//   return (
//     <ThemeProvider>
//       <PWAProvider>
//         {children}
//       </PWAProvider>
//     </ThemeProvider>
//   );
// };

// const customRender = (
//   ui: React.ReactElement,
//   options?: Omit<RenderOptions, 'wrapper'>
// ) => render(ui, { wrapper: AllTheProviders, ...options });

// // Mock data generators
// export const mockUser = {
//   _id: 'user123',
//   email: 'test@example.com',
//   name: 'Test User',
//   role: 'user',
//   verified: true,
//   profileCompleteness: 85,
//   lastActive: new Date().toISOString(),
//   profile: {
//     name: 'Test User',
//     age: 25,
//     gender: 'female',
//     profession: 'Software Engineer',
//     education: 'Bachelor\'s Degree',
//     currentResidence: 'Mumbai, Maharashtra',
//     nativePlace: 'Delhi, Delhi',
//     about: 'I am a software engineer who loves coding and traveling.',
//     interests: ['reading', 'traveling', 'cooking'],
//     images: 'https://example.com/image.jpg'
//   }
// };

// export const mockProfile = {
//   _id: 'profile123',
//   profile: {
//     name: 'Jane Doe',
//     age: 28,
//     gender: 'female',
//     profession: 'Doctor',
//     education: 'MBBS',
//     currentResidence: 'Bangalore, Karnataka',
//     nativePlace: 'Chennai, Tamil Nadu',
//     about: 'I am a doctor who loves helping people.',
//     interests: ['medicine', 'yoga', 'reading'],
//     images: 'https://example.com/jane.jpg'
//   },
//   verification: {
//     isVerified: true
//   }
// };

// export const mockMatch = {
//   connectionId: 'connection123',
//   profile: mockProfile,
//   matchDate: new Date().toISOString(),
//   lastActivity: new Date().toISOString()
// };

// export const mockMessage = {
//   _id: 'message123',
//   senderId: 'user123',
//   receiverId: 'user456',
//   content: 'Hello! How are you?',
//   timestamp: new Date().toISOString(),
//   isRead: false
// };

// // Mock API responses
// export const mockApiResponses = {
//   auth: {
//     login: {
//       success: true,
//       user: mockUser,
//       token: 'mock-jwt-token'
//     },
//     register: {
//       success: true,
//       user: mockUser,
//       message: 'User registered successfully'
//     },
//     status: {
//       authenticated: true,
//       user: mockUser
//     }
//   },
//   matching: {
//     discovery: {
//       profiles: [mockProfile, mockProfile],
//       dailyLimitReached: false,
//       dailyLikeCount: 5,
//       remainingLikes: 15
//     },
//     matches: {
//       matches: [mockMatch, mockMatch],
//       totalMatches: 2
//     },
//     like: {
//       success: true,
//       isMutualMatch: true,
//       connection: { _id: 'connection123' },
//       dailyLikeCount: 6,
//       remainingLikes: 14
//     }
//   },
//   chat: {
//     messages: [mockMessage, mockMessage],
//     connection: {
//       _id: 'connection123',
//       participants: ['user123', 'user456']
//     }
//   }
// };

// // Test helpers
// export const waitForElementToBeRemoved = (element: HTMLElement): Promise<void> => {
//   return new Promise((resolve) => {
//     const observer = new MutationObserver(() => {
//       if (!document.contains(element)) {
//         observer.disconnect();
//         resolve();
//       }
//     });
//     observer.observe(document.body, { childList: true, subtree: true });
//   });
// };

// export const mockLocalStorage = () => {
//   const store: Record<string, string> = {};
  
//   return {
//     getItem: jest.fn((key: string) => store[key] || null),
//     setItem: jest.fn((key: string, value: string) => {
//       store[key] = value;
//     }),
//     removeItem: jest.fn((key: string) => {
//       delete store[key];
//     }),
//     clear: jest.fn(() => {
//       Object.keys(store).forEach(key => delete store[key]);
//     }),
//   };
// };

// export const mockSessionStorage = () => {
//   const store: Record<string, string> = {};
  
//   return {
//     getItem: jest.fn((key: string) => store[key] || null),
//     setItem: jest.fn((key: string, value: string) => {
//       store[key] = value;
//     }),
//     removeItem: jest.fn((key: string) => {
//       delete store[key];
//     }),
//     clear: jest.fn(() => {
//       Object.keys(store).forEach(key => delete store[key]);
//     }),
//   };
// };

// // Mock fetch
// export const mockFetch = (response: any, status: number = 200) => {
//   return jest.fn().mockImplementation(() =>
//     Promise.resolve({
//       ok: status < 400,
//       status,
//       json: () => Promise.resolve(response),
//       headers: new Headers(),
//     })
//   );
// };

// // Mock Intersection Observer
// export const mockIntersectionObserver = () => {
//   const mockIntersectionObserver = jest.fn();
//   mockIntersectionObserver.mockReturnValue({
//     observe: () => null,
//     unobserve: () => null,
//     disconnect: () => null,
//   });
//   window.IntersectionObserver = mockIntersectionObserver;
// };

// // Mock Resize Observer
// export const mockResizeObserver = () => {
//   const mockResizeObserver = jest.fn();
//   mockResizeObserver.mockReturnValue({
//     observe: () => null,
//     unobserve: () => null,
//     disconnect: () => null,
//   });
//   window.ResizeObserver = mockResizeObserver;
// };

// // Mock matchMedia
// export const mockMatchMedia = (matches: boolean = false) => {
//   Object.defineProperty(window, 'matchMedia', {
//     writable: true,
//     value: jest.fn().mockImplementation(query => ({
//       matches,
//       media: query,
//       onchange: null,
//       addListener: jest.fn(), // deprecated
//       removeListener: jest.fn(), // deprecated
//       addEventListener: jest.fn(),
//       removeEventListener: jest.fn(),
//       dispatchEvent: jest.fn(),
//     })),
//   });
// };

// // Mock navigator
// export const mockNavigator = () => {
//   Object.defineProperty(window, 'navigator', {
//     value: {
//       userAgent: 'jest',
//       onLine: true,
//       vibrate: jest.fn(),
//       geolocation: {
//         getCurrentPosition: jest.fn(),
//         watchPosition: jest.fn(),
//         clearWatch: jest.fn(),
//       },
//     },
//     writable: true,
//   });
// };

// // Test data factories
// export const createMockUser = (overrides: Partial<typeof mockUser> = {}) => ({
//   ...mockUser,
//   ...overrides,
// });

// export const createMockProfile = (overrides: Partial<typeof mockProfile> = {}) => ({
//   ...mockProfile,
//   ...overrides,
// });

// export const createMockMatch = (overrides: Partial<typeof mockMatch> = {}) => ({
//   ...mockMatch,
//   ...overrides,
// });

// export const createMockMessage = (overrides: Partial<typeof mockMessage> = {}) => ({
//   ...mockMessage,
//   ...overrides,
// });

// // Custom matchers
// export const customMatchers = {
//   toBeInTheDocument: (received: any) => {
//     const pass = received !== null && received !== undefined;
//     return {
//       pass,
//       message: () => `expected ${received} to be in the document`,
//     };
//   },
  
//   toHaveClass: (received: HTMLElement, className: string) => {
//     const pass = received.classList.contains(className);
//     return {
//       pass,
//       message: () => `expected element to have class "${className}"`,
//     };
//   },
  
//   toHaveTextContent: (received: HTMLElement, text: string) => {
//     const pass = received.textContent?.includes(text) || false;
//     return {
//       pass,
//       message: () => `expected element to contain text "${text}"`,
//     };
//   },
// };

// // Test setup utilities
// export const setupTestEnvironment = () => {
//   // Mock localStorage
//   Object.defineProperty(window, 'localStorage', {
//     value: mockLocalStorage(),
//     writable: true,
//   });

//   // Mock sessionStorage
//   Object.defineProperty(window, 'sessionStorage', {
//     value: mockSessionStorage(),
//     writable: true,
//   });

//   // Mock fetch
//   global.fetch = mockFetch({});

//   // Mock Intersection Observer
//   mockIntersectionObserver();

//   // Mock Resize Observer
//   mockResizeObserver();

//   // Mock matchMedia
//   mockMatchMedia();

//   // Mock navigator
//   mockNavigator();
// };

// // Cleanup utilities
// export const cleanupTestEnvironment = () => {
//   jest.clearAllMocks();
//   jest.clearAllTimers();
  
//   // Clean up DOM
//   document.body.innerHTML = '';
  
//   // Reset fetch
//   global.fetch = jest.fn();
// };

// // Export custom render
// export * from '@testing-library/react';
// export { customRender as render }; 