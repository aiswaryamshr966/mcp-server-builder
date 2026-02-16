{
  "name": "${config.serverName}",
  "version": "${config.version}",
  "description": "${config.description}",
  "type": "module",
  "main": "build/index.js",
  "scripts": {
    "build": "tsc",
    "prepare": "npm run build",
    "watch": "tsc --watch"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.4"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
