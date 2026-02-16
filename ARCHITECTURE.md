# MCP Server Builder - Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         User's Browser                          │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │              Web UI (HTML/CSS/JavaScript)                 │ │
│  │  - Server Configuration Form                              │ │
│  │  - Tool/Resource Builders                                 │ │
│  │  - Code Preview                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                              │                                  │
│                              │ HTTP REST API                    │
│                              ▼                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    Spring Boot Application                      │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                    REST Controller                        │ │
│  │  - /api/servers/generate                                  │ │
│  │  - /api/servers/preview                                   │ │
│  │  - /api/servers/health                                    │ │
│  └───────────────┬───────────────────────────────────────────┘ │
│                  │                                             │
│  ┌───────────────▼───────────────────────────────────────────┐ │
│  │              Generator Service                            │ │
│  │  - Processes configuration                                │ │
│  │  - Loads FreeMarker templates                             │ │
│  │  - Generates server files                                 │ │
│  └───────────────┬───────────────────────────────────────────┘ │
│                  │                                             │
│  ┌───────────────▼───────────────────────────────────────────┐ │
│  │            FreeMarker Templates                           │ │
│  │  - server.ts.ftl    (TypeScript server code)             │ │
│  │  - package.json.ftl (npm configuration)                   │ │
│  │  - tsconfig.json.ftl (TypeScript config)                  │ │
│  │  - README.md.ftl    (Documentation)                       │ │
│  └───────────────┬───────────────────────────────────────────┘ │
│                  │                                             │
└──────────────────┼─────────────────────────────────────────────┘
                   │
                   ▼ Generates files to disk
┌─────────────────────────────────────────────────────────────────┐
│                   File System Output                            │
│                                                                 │
│  generated-servers/                                             │
│  └── [server-name]/                                            │
│      ├── index.ts          ← TypeScript MCP server             │
│      ├── package.json      ← npm dependencies                  │
│      ├── tsconfig.json     ← TypeScript configuration          │
│      ├── README.md         ← Usage documentation               │
│      └── build/            ← Compiled JavaScript (after build) │
│          └── index.js                                          │
└─────────────────────────────────────────────────────────────────┘
                   │
                   │ npm install && npm run build
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Claude Desktop Integration                     │
│                                                                 │
│  claude_desktop_config.json:                                    │
│  {                                                              │
│    "mcpServers": {                                              │
│      "server-name": {                                           │
│        "command": "node",                                       │
│        "args": ["/path/to/build/index.js"]                     │
│      }                                                          │
│    }                                                            │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Web UI (Frontend)
**Technology**: Vanilla JavaScript, HTML5, CSS3
**Files**: 
- `src/main/resources/static/index.html`
- `src/main/resources/static/app.js`

**Responsibilities**:
- Collect user configuration for MCP server
- Dynamic form building for tools and parameters
- Send configuration to backend API
- Display code previews
- Show success/error messages

### 2. REST API (Controller Layer)
**Technology**: Spring Boot REST Controllers
**File**: `src/main/java/com/mcpbuilder/controller/McpServerController.java`

**Endpoints**:
- `POST /api/servers/generate` - Generate complete MCP server
- `POST /api/servers/preview` - Preview generated code
- `GET /api/servers/health` - Health check

### 3. Business Logic (Service Layer)
**Technology**: Spring Service with FreeMarker
**File**: `src/main/java/com/mcpbuilder/service/McpServerGeneratorService.java`

**Responsibilities**:
- Process configuration objects
- Load and process FreeMarker templates
- Generate multiple output files
- Handle file system operations

### 4. Data Models
**Technology**: Java POJOs with Lombok
**Files**:
- `McpServerConfig.java` - Main configuration
- `ToolConfig.java` - Tool definition
- `ParameterConfig.java` - Parameter definition
- `ResourceConfig.java` - Resource definition

### 5. Templates (Code Generation)
**Technology**: FreeMarker Template Engine
**Files**:
- `server.ts.ftl` - Generates TypeScript MCP server using official SDK
- `package.json.ftl` - npm package configuration
- `tsconfig.json.ftl` - TypeScript compiler settings
- `README.md.ftl` - Server documentation

**Template Variables**:
- `${config.serverName}` - Server name
- `${config.description}` - Server description
- `${config.tools}` - List of tools
- `${config.resources}` - List of resources

## Data Flow

### Generation Flow:

1. **User Input**
   ```
   User fills form → JavaScript collects data → JSON object created
   ```

2. **API Request**
   ```
   POST /api/servers/generate
   {
     "serverName": "weather-server",
     "description": "Weather information server",
     "tools": [...],
     "resources": [...]
   }
   ```

3. **Processing**
   ```
   Controller receives JSON
   → Converts to Java objects
   → Passes to Generator Service
   → Service loads templates
   → Templates processed with data
   → Files written to disk
   ```

4. **Output**
   ```
   generated-servers/weather-server/
   ├── index.ts
   ├── package.json
   ├── tsconfig.json
   └── README.md
   ```

5. **User Builds**
   ```
   cd generated-servers/weather-server
   npm install  → Downloads @modelcontextprotocol/sdk
   npm run build → Compiles TypeScript to JavaScript
   ```

6. **Integration**
   ```
   User adds to claude_desktop_config.json
   → Claude Desktop loads server on startup
   → Server communicates via stdio
   → Claude can now use the tools!
   ```

## Technology Stack

### Backend
- **Framework**: Spring Boot 3.2.0
- **Language**: Java 17
- **Build Tool**: Maven 3.6+
- **Template Engine**: FreeMarker 2.3.32
- **Data Binding**: Jackson (JSON)

### Frontend
- **UI**: Vanilla JavaScript (no frameworks needed)
- **Styling**: Custom CSS3 with gradients
- **API Communication**: Fetch API

### Generated Servers
- **Language**: TypeScript
- **Runtime**: Node.js 18+
- **MCP SDK**: @modelcontextprotocol/sdk ^1.0.4
- **Protocol**: JSON-RPC over stdio
- **Build Tool**: TypeScript Compiler (tsc)

## Key Design Patterns

### 1. Template Method Pattern
FreeMarker templates define the structure while configuration provides the data.

### 2. Builder Pattern
Forms dynamically build complex configurations step-by-step.

### 3. Factory Pattern
Generator service creates server instances based on configuration.

### 4. MVC Pattern
- **Model**: Java POJOs (McpServerConfig, etc.)
- **View**: HTML UI + FreeMarker templates
- **Controller**: REST controllers + JavaScript handlers

## Extension Points

### Adding New Template Types
1. Create new `.ftl` file in `src/main/resources/templates/`
2. Add generation method in `McpServerGeneratorService`
3. Call from `generateServer()` method

### Adding New Tool Types
1. Extend `ToolConfig` with new fields
2. Update `server.ts.ftl` template
3. Update UI form in `index.html`

### Supporting Other Languages
1. Create new template set (e.g., `server.py.ftl` for Python)
2. Add language selection in UI
3. Implement language-specific generator method

## Security Considerations

- **Input Validation**: Server names and paths are sanitized
- **File Permissions**: Generated files use default system permissions
- **Network**: API uses CORS for web security
- **Code Injection**: Templates escape user input appropriately

## Performance

- **Generation Time**: < 1 second per server
- **Memory Usage**: ~200MB for Spring Boot app
- **Concurrent Requests**: Handled by Spring's thread pool
- **File I/O**: Asynchronous where possible

## Future Enhancements

- [ ] Support for HTTP/SSE MCP servers (in addition to stdio)
- [ ] Visual tool builder with drag-and-drop
- [ ] Template marketplace for common server types
- [ ] Built-in testing framework for generated servers
- [ ] Database persistence for configurations
- [ ] Server version management
- [ ] Multi-language support (Python, Java MCP servers)

---

This architecture provides a solid foundation for generating production-ready MCP servers while maintaining flexibility for future extensions.
