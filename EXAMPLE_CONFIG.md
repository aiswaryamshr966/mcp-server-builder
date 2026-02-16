# Example MCP Server Configuration

This file shows an example configuration you can use to test the MCP Server Builder.

> Developer note: Lombok was removed from the codebase and model classes now have explicit getters/setters. This does not affect UI config format; it is an internal implementation detail.

## Weather Server Example

Copy and paste these values into the web UI:

### Basic Configuration
- **Server Name**: `weather-server`
- **Description**: `A simple MCP server that provides weather information`
- **Version**: `1.0.0`

### Tool 1: Get Weather
- **Name**: `get_weather`
- **Description**: `Get current weather information for a specific location`
- **Parameters**:
  - Parameter 1:
    - Name: `location`
    - Type: `string`
    - Description: `The city or location to get weather for`
    - Required: ✅ (checked)
  - Parameter 2:
    - Name: `units`
    - Type: `string`
    - Description: `Temperature units - 'celsius' or 'fahrenheit'`
    - Required: ❌ (unchecked)

**Implementation** (optional):
```javascript
// Simple example implementation
const temp = Math.floor(Math.random() * 30) + 10;
const unit = args.units || 'celsius';
const result = `The weather in ${args.location} is ${temp}°${unit === 'celsius' ? 'C' : 'F'} and sunny!`;
return result;
```

### Tool 2: Get Forecast
- **Name**: `get_forecast`
- **Description**: `Get weather forecast for the next few days`
- **Parameters**:
  - Parameter 1:
    - Name: `location`
    - Type: `string`
    - Description: `The city or location to get forecast for`
    - Required: ✅ (checked)
  - Parameter 2:
    - Name: `days`
    - Type: `number`
    - Description: `Number of days to forecast (1-7)`
    - Required: ❌ (unchecked)

**Implementation** (optional):
```javascript
const numDays = args.days || 3;
const forecast = [];
for (let i = 0; i < numDays; i++) {
  const temp = Math.floor(Math.random() * 30) + 10;
  forecast.push(`Day ${i + 1}: ${temp}°C`);
}
const result = `Forecast for ${args.location}:
${forecast.join('
')}`;
return result;
```

### Resource 1: Weather Stations
- **URI**: `weather://stations`
- **Name**: `weather-stations`
- **Description**: `List of available weather monitoring stations`
- **MIME Type**: `application/json`

**Implementation** (optional):
```javascript
const content = JSON.stringify({
  stations: [
    { id: 1, name: 'Downtown Station', location: 'City Center' },
    { id: 2, name: 'Airport Station', location: 'International Airport' },
    { id: 3, name: 'Harbor Station', location: 'Port Area' }
  ]
}, null, 2);
return content;
```

## Testing Your Server

After generating and building your server:

1. Test it manually:
   ```bash
   cd generated-servers/weather-server
   npm install
   npm run build
   node build/index.js
   ```

2. Configure in Claude Desktop (see SETUP.md)

3. In Claude, try asking:
   - "What's the weather in Paris?"
   - "Show me the 5-day forecast for Tokyo"
   - "What weather stations are available?"

Enjoy building with MCP! 🎉
