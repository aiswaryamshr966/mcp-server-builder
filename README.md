# MCP Server Builder

A Java-based tool to generate Model Context Protocol (MCP) servers from UI configurations.

## Features

- 🎨 **Web-based UI** - Intuitive interface for configuring MCP servers
- 🛠️ **Tool Configuration** - Define custom tools with parameters
- 📦 **Resource Support** - Add resources to your MCP server
- 📝 **Code Generation** - Automatically generates TypeScript MCP servers
- 👀 **Live Preview** - Preview generated code before building
- 🔧 **100% Open Source** - Built with Spring Boot, FreeMarker, and MCP SDK

## Tech Stack

- **Backend**: Spring Boot 3.2.0
- **Frontend**: HTML5, CSS3, JavaScript
- **Templating**: FreeMarker
- **MCP SDK**: @modelcontextprotocol/sdk (TypeScript)
- **Build Tool**: Maven

## Prerequisites

- Java 17 or higher
- Maven 3.6+
- Node.js 18+ (for running generated servers)

## Quick Start

### 1. Build the Application

```bash
cd mcp-server-builder
mvn clean package
```

### 2. Run the Application

```bash
mvn spring-boot:run
```

Or run the JAR directly:

```bash
java -jar target/mcp-server-builder-1.0.0.jar
```

### 3. Open the Web UI

Navigate to: [http://localhost:8080](http://localhost:8080)

## Usage

1. **Configure Your Server**
   - Enter server name and description
   - Add tools with parameters
   - (Optional) Add resources

2. **Preview Your Code**
   - Click "Preview Code" to see the generated TypeScript

3. **Generate Server**
   - Click "Generate Server"
   - Server files will be created in `generated-servers/[your-server-name]/`

4. **Build & Use Generated Server**
   ```bash
   cd generated-servers/[your-server-name]
   npm install
   npm run build
   ```

5. **Configure Claude Desktop**
   Add to your `claude_desktop_config.json`:
   ```json
   {
     "mcpServers": {
       "your-server-name": {
         "command": "node",
         "args": ["/absolute/path/to/generated-servers/your-server-name/build/index.js"]
       }
     }
   }
   ```

## Example: Weather Tool

Here's an example configuration:

**Tool Name**: `get_weather`
**Description**: Get current weather for a location
**Parameters**:
- `location` (string, required): The city name
- `units` (string, optional): Temperature units (celsius/fahrenheit)

**Implementation**:
```javascript
const result = `The weather in ${args.location} is sunny!`;
return result;
```

## API Endpoints

- `POST /api/servers/generate` - Generate a new MCP server
- `POST /api/servers/preview` - Preview generated code
- `GET /api/servers/health` - Health check

## Project Structure

```
mcp-server-builder/
├── src/
│   ├── main/
│   │   ├── java/com/mcpbuilder/
│   │   │   ├── controller/       # REST controllers
│   │   │   ├── model/            # Data models
│   │   │   ├── service/          # Business logic
│   │   │   └── McpServerBuilderApplication.java
│   │   └── resources/
│   │       ├── templates/        # FreeMarker templates
│   │       │   ├── package.json.ftl
│   │       │   ├── server.ts.ftl
│   │       │   └── README.md.ftl
│   │       ├── static/           # Web UI files
│   │       │   ├── index.html
│   │       │   └── app.js
│   │       └── application.properties
├── generated-servers/            # Output directory
├── pom.xml
└── README.md
```

## Development

### Watch Mode
```bash
mvn spring-boot:run
```

### Build for Production
```bash
mvn clean package -DskipTests
```

## Developer Notes

- Lombok has been removed from the codebase to avoid annotation-processor compatibility issues with some JDK/tooling setups. The model classes now include explicit getters and setters.
- Required: Java 17+, Maven 3.6+. The project is built with `mvn clean package` and can be run with `mvn spring-boot:run` or `java -jar target/mcp-server-builder-1.0.0.jar`.
- If you prefer to re-enable Lombok, add the Lombok dependency and configure annotation processing in `pom.xml` or use a matching JDK/toolchain; see the project's issue tracker for details.

## License

MIT

## Contributing

Contributions welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please open an issue on GitHub.

---

Built with ❤️ using Spring Boot and MCP SDK

## Regenerate & Test Generated Servers (helper script)

A convenience script is provided to install, build, and run a smoke test for each generated server under `generated-servers/`.

To run the script (requires Node.js & npm):

```bash
cd mcp-server-builder
node ./scripts/regenerate_and_test_all.mjs
```

This will iterate all subfolders in `generated-servers/`, run `npm install` and `npm run build`, then run each server's `test-client.mjs` smoke test and print a summary.

## Vendor Monaco locally (optional)

If you need Monaco Editor to be served locally (for offline or corporate network demos), a helper script is provided to vendor Monaco into the web static assets.

Requirements: Node.js & npm installed locally.

Run from the repository root:

```bash
node ./scripts/vendor_monaco.mjs
```

This will place Monaco under `src/main/resources/static/vendor/monaco/min/vs` so the UI will try to load it locally before falling back to CDN.

## Download generated server as ZIP

The UI now includes a **Download ZIP** button in the toolbar; it calls the backend endpoint `POST /api/servers/download` which returns a ZIP archive of the generated server. This requires the backend to be running (the endpoint is implemented in `McpServerController`).

```bash
# Example: generate server and download zip via curl (server running locally)
curl -X POST http://localhost:8080/api/servers/download -H 'Content-Type: application/json' -d @config.json --output myserver.zip
```
