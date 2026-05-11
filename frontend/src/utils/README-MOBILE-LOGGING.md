# Shaadi Mantrana Mobile Logging

## Overview

This package provides comprehensive logging for the Shaadi Mantrana mobile application, capturing user interactions, errors, and performance metrics. Logs are sent to Grafana Loki for centralized monitoring and analysis.

## Features

- **Automatic Context Collection**: User info, device details, session data
- **Offline Support**: Batching and retry mechanisms
- **Performance Optimization**: Low overhead, batched network requests
- **Multiple Log Levels**: debug, info, warn, error
- **React Integration**: Hooks and components for easy usage

## Getting Started

### Prerequisites

1. Ensure environment variables are set in `.env.local`:
   ```
   LOKI_CLIENT_API_KEY=your-api-key
   LOKI_URL=http://your-loki-instance/loki/api/v1/push
   ```

2. Ensure the MobileLoggerProvider is added to your app layout:
   ```tsx
   <MobileLoggerProvider>
     {/* Your app components */}
   </MobileLoggerProvider>
   ```

### Basic Usage

The mobile logging system provides several ways to log events:

#### 1. Using the MobileLogger Directly

```typescript
import mobileLogger from '../utils/mobile-logger';

// Log different levels
mobileLogger.debug('Debug message', { context: 'testing' });
mobileLogger.info('Info message', { userId: '123' });
mobileLogger.warn('Warning message', { threshold: 90 });
mobileLogger.error('Error occurred', { error: new Error('Test error') });

// Log specific event types
mobileLogger.logUserInteraction('button_click', { buttonId: 'submit' });
mobileLogger.logScreenView('/profile');
mobileLogger.logAppEvent('startup', { version: '1.0.0' });
```

#### 2. Using the useMobileLogging Hook

```tsx
import { useMobileLogging } from '../hooks/useMobileLogging';

function MyComponent() {
  const { logInteraction, logError } = useMobileLogging('MyComponent');
  
  const handleButtonClick = () => {
    logInteraction('button_click', { buttonId: 'submit' });
    // Your code here
  };
  
  const handleFormSubmit = async (data) => {
    try {
      // Your code here
    } catch (error) {
      logError('Form submission failed', error, { formData: data });
    }
  };
  
  return (
    <div>
      <button onClick={handleButtonClick}>Submit</button>
    </div>
  );
}
```

## Testing

### Manual Testing

1. Navigate to `/test-logs` in the app to access the testing interface.
2. Click "Run Tests" to generate sample logs.
3. Toggle "Simulate Offline" to test offline resilience.
4. Check Grafana Loki for the logs using this query:
   ```
   {app="shaadi-mantrana-mobile"}
   ```

### Using the CLI Monitor Tool

For local development, you can use the built-in monitor tool:

```bash
cd /Users/niteshkumar/Downloads/Shaadi_Mantrana
node scripts/mobile-logs-monitor.js
```

This will start a local mock Loki server that displays received logs in the terminal.

## Implementation Details

### Key Components

- **mobile-logger.ts**: Core logging utility with batching and retry
- **MobileLoggerProvider.tsx**: React provider for app-wide logging
- **useMobileLogging.ts**: React hook for component-level logging
- **api/logs/route.ts**: API endpoint for receiving logs

### Log Structure

Logs sent to Loki have this structure:

```json
{
  "streams": [
    {
      "stream": {
        "app": "shaadi-mantrana-mobile",
        "level": "info",
        "client_type": "mobile",
        "platform": "ios",
        "user_id": "user-uuid"
      },
      "values": [
        [
          "timestamp_ns",
          "{\"message\":\"User clicked button\",\"action\":\"click\",\"buttonId\":\"submit\",\"device\":{...}}"
        ]
      ]
    }
  ]
}
```

## Best Practices

1. **Be Selective**: Don't log everything; focus on important events
2. **Provide Context**: Always include relevant context with logs
3. **Use Appropriate Levels**: Use debug for development, info for normal operations, warn for potential issues, error for failures
4. **Protect Privacy**: Never log sensitive user data or credentials
5. **Be Consistent**: Use standardized event names and formats

## Querying Logs in Grafana Loki

### Common Queries

- All mobile logs:
  ```
  {app="shaadi-mantrana-mobile"}
  ```

- Errors only:
  ```
  {app="shaadi-mantrana-mobile", level="error"}
  ```

- Logs for a specific user:
  ```
  {app="shaadi-mantrana-mobile", user_id="user-uuid"}
  ```

- Logs for a specific device type:
  ```
  {app="shaadi-mantrana-mobile", platform="ios"}
  ```

- Search for specific events:
  ```
  {app="shaadi-mantrana-mobile"} |= "button_click"
  ```

## Troubleshooting

### Common Issues

1. **Logs not appearing in Loki**:
   - Check that LOKI_URL and LOKI_CLIENT_API_KEY are set correctly
   - Verify network connectivity
   - Check browser console for API errors

2. **High volume of logs**:
   - Review logging levels (consider reducing debug logs)
   - Increase batching size
   - Add more filtering on the client side

## Contributing

When extending the mobile logging system:

1. Follow the existing patterns for consistency
2. Add appropriate JSDoc comments
3. Test with the /test-logs page
4. Verify logs in Grafana Loki