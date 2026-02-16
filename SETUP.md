# MCP Server Builder - Setup Guide

Welcome to MCP Server Builder! This guide will help you get up and running.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

### 1. Java Development Kit (JDK) 17 or higher

**Check if installed:**
```bash
java -version
```

**Installation:**

- **Ubuntu/Debian:**
  ```bash
  sudo apt-get update
  sudo apt-get install openjdk-17-jdk
  ```

- **macOS:**
  ```bash
  brew install openjdk@17
  ```

- **Windows:**
  Download and install from [Adoptium](https://adoptium.net/)

### 2. Apache Maven 3.6+

**Check if installed:**
```bash
mvn -version
```

**Installation:**

- **Ubuntu/Debian:**
  ```bash
  sudo apt-get update
  sudo apt-get install maven
  ```

- **macOS:**
  ```bash
  brew install maven
  ```

- **Windows:**
  1. Download from [Apache Maven](https://maven.apache.org/download.cgi)
  2. Extract to `C:\Program Files\Apache\maven`
  3. Add `C:\Program Files\Apache\maven\bin` to PATH

### 3. Node.js 18+ (for running generated MCP servers)

**Check if installed:**
```bash
node -version
```

**Installation:**

- **Ubuntu/Debian:**
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
  ```

- **macOS:**
  ```bash
  brew install node
  ```

- **Windows:**
  Download from [nodejs.org](https://nodejs.org/)

## 🚀 Quick Start

### Option 1: Using Run Scripts (Recommended)

**Linux/macOS:**
```bash
cd mcp-server-builder
./run.sh
```

**Windows:**
```batch
cd mcp-server-builder
run.bat
```

The script will:
1. Check prerequisites
2. Build the application (if needed)
3. Start the server on http://localhost:8080

### Option 2: Manual Steps

1. **Build the application:**
   ```bash
   cd mcp-server-builder
   mvn clean package
   ```

2. **Run the application:**
   ```bash
   mvn spring-boot:run
   ```
   
   Or run the JAR directly:
   ```bash
   java -jar target/mcp-server-builder-1.0.0.jar
   ```

3. **Open your browser:**
   Navigate to [http://localhost:8080](http://localhost:8080)

## Developer Notes

- Lombok has been removed from the codebase to avoid annotation-processor compatibility issues with some JDK/tooling setups. Model classes include explicit getters and setters now.
- If you re-enable Lombok, ensure the Lombok version is compatible with your JDK and configure annotation processing in `pom.xml`.

## 🎯 Using the Application

### Step 1: Configure Your MCP Server

1. Enter a **Server Name** (e.g., `my-weather-server`)
2. Add a **Description** of what your server does
3. Set the **Version** (default: 1.0.0)

### Step 2: Add Tools

Tools are the functions your MCP server will provide to Claude.

1. Click **"+ Add Tool"**
2. Configure the tool:
   - **Name**: Function name (e.g., `get_weather`)
   - **Description**: What the tool does
   - **Parameters**: Add input parameters
     - Name, Type (string/number/boolean/object/array)
     - Description
     - Required checkbox
   - **Implementation** (optional): Custom JavaScript code

**Example Tool:**
```
Name: get_weather
Description: Get current weather for a location
Parameters:
  - location (string, required): The city name
  - units (string): Temperature units (celsius/fahrenheit)
```

### Step 3: Add Resources (Optional)

Resources are data that your MCP server can provide.

1. Click **"+ Add Resource"**
2. Configure:
   - **URI**: Resource identifier (e.g., `file:///config.json`)
   - **Name**: Resource name
   - **Description**: What this resource contains
   - **MIME Type**: Content type (e.g., `application/json`)

### Step 4: Generate Your Server

1. Click **"Preview Code"** to see the generated TypeScript
2. Click **"Generate Server"** to create the files

The server will be created in `generated-servers/[your-server-name]/`

### Step 5: Build Your Generated Server

```bash
cd generated-servers/your-server-name
npm install
npm run build
```

### Step 6: Configure Claude Desktop

Add your server to Claude Desktop's configuration:

**File Location:**
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

**Configuration:**
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

**Important:** Use absolute paths!

### Step 7: Restart Claude Desktop

Restart Claude Desktop to load your new MCP server.

## 📁 Project Structure

```
mcp-server-builder/
├── generated-servers/          # Your generated MCP servers
│   └── your-server-name/
│       ├── index.ts           # Main server code
│       ├── package.json       # Dependencies
│       ├── tsconfig.json      # TypeScript config
│       ├── README.md          # Server documentation
│       └── build/             # Compiled JavaScript
├── src/
│   └── main/
│       ├── java/              # Backend source code
│       └── resources/
│           ├── templates/     # Code generation templates
│           └── static/        # Web UI
├── run.sh                     # Linux/macOS startup script
├── run.bat                    # Windows startup script
├── pom.xml                    # Maven configuration
└── README.md                  # Main documentation
```

## 🛠️ Troubleshooting

### Port 8080 Already in Use

If port 8080 is already in use, you can change it:

1. Edit `src/main/resources/application.properties`
2. Change `server.port=8080` to another port (e.g., `server.port=8081`)
3. Rebuild and restart

### Generated Server Won't Start

1. **Check Node.js version:**
   ```bash
   node -version  # Should be 18+
   ```

2. **Reinstall dependencies:**
   ```bash
   cd generated-servers/your-server-name
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

3. **Check for syntax errors:**
   Review the generated code for any issues

### Claude Desktop Doesn't See My Server

1. **Verify configuration file location**
2. **Use absolute paths** (not relative paths like `./`)
3. **Check JSON syntax** (use a JSON validator)
4. **Restart Claude Desktop completely**
5. **Check server builds successfully:**
   ```bash
   node /path/to/your-server/build/index.js
   ```

## 📚 Example Servers

### Example 1: Calculator Server

**Tools:**
- `add`: Add two numbers
  - Parameters: `a` (number), `b` (number)
- `multiply`: Multiply two numbers
  - Parameters: `a` (number), `b` (number)

**Implementation:**
```javascript
const result = args.a + args.b;
return `The sum is ${result}`;
```

### Example 2: Data Server

**Tools:**
- `query_data`: Query a dataset
  - Parameters: `query` (string)

**Resources:**
- URI: `data://products`
- Name: products
- MIME Type: application/json

## 🤝 Support

- **Issues**: Check the troubleshooting section above
- **Questions**: Refer to the main README.md
- **MCP Documentation**: https://modelcontextprotocol.io

## 📝 License

MIT - Feel free to use and modify!

---

🎉 **You're all set!** Start building amazing MCP servers!
