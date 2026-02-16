# Quick Start Cheat Sheet

## 🚀 5-Minute Setup

### Prerequisites Check
```bash
java -version    # Need 17+
mvn -version     # Need 3.6+
node -version    # Need 18+
```

### Start the Builder
```bash
cd mcp-server-builder
./run.sh              # Linux/macOS
# OR
run.bat               # Windows
```

Open: http://localhost:8080

> Developer notes: Lombok has been removed from the codebase to avoid annotation-processor compatibility issues; model classes include explicit getters/setters. Build with Java 17+ and Maven 3.6+.

## 📝 Create Your First Server

### 1. Basic Info
- **Server Name**: `hello-server`
- **Description**: `My first MCP server`

### 2. Add a Tool
Click "+ Add Tool"
- **Name**: `say_hello`
- **Description**: `Say hello to someone`
- **Add Parameter**:
  - Name: `name`
  - Type: `string`
  - Description: `Person's name`
  - ✓ Required

### 3. Generate
Click "Generate Server"

## 🔧 Build Your Server

```bash
cd generated-servers/hello-server
npm install
npm run build
```

## 🔌 Connect to Claude

### Find Config File
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

### Add Server
```json
{
  "mcpServers": {
    "hello-server": {
      "command": "node",
      "args": ["/FULL/PATH/TO/generated-servers/hello-server/build/index.js"]
    }
  }
}
```

⚠️ **Use ABSOLUTE path!** Replace `/FULL/PATH/TO/` with your actual path.

### Restart Claude Desktop

## 🎯 Test It

Ask Claude:
> "Can you say hello to Alice using the hello-server?"

## 🐛 Troubleshooting

### Server not showing in Claude?
1. Check config file path is correct
2. Verify absolute path is used
3. Make sure server built successfully: `node /path/to/build/index.js`
4. Restart Claude Desktop completely

### Port 8080 in use?
Edit `src/main/resources/application.properties`:
```
server.port=8081
```

### Build fails?
```bash
# Clean and rebuild
mvn clean package
```

## 📚 Common Tool Examples

### Simple Calculator
```
Name: add
Parameters: a (number), b (number)
Implementation:
const result = args.a + args.b;
return `Result: ${result}`;
```

### Text Transformer
```
Name: uppercase
Parameters: text (string)
Implementation:
const result = args.text.toUpperCase();
return result;
```

### Data Query
```
Name: get_user
Parameters: user_id (string)
Implementation:
const users = {
  '1': 'Alice',
  '2': 'Bob'
};
const result = users[args.user_id] || 'Not found';
return result;
```

## 🎓 Next Steps

1. Read `SETUP.md` for detailed instructions
2. Check `EXAMPLE_CONFIG.md` for a weather server example
3. Review `ARCHITECTURE.md` to understand how it works
4. Explore MCP docs: https://modelcontextprotocol.io

## 💡 Pro Tips

- Start simple - one tool is enough!
- Test locally before adding to Claude
- Use descriptive names and descriptions
- Keep implementations simple initially
- Check generated code with "Preview"

## 🆘 Need Help?

- Stuck? Read the full `SETUP.md` guide
- Example server: See `EXAMPLE_CONFIG.md`
- Understanding internals: Check `ARCHITECTURE.md`

Happy building! 🎉
