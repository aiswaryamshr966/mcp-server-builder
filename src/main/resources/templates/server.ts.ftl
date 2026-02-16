#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Server configuration
const SERVER_NAME = "${config.serverName}";
const SERVER_VERSION = "${config.version}";

// Create server instance
const server = new Server(
  {
    name: SERVER_NAME,
    version: SERVER_VERSION,
  },
  {
    capabilities: {
      tools: {},
<#if config.resources?? && config.resources?size gt 0>
      resources: {},
</#if>
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
<#assign toolCounter = 0>
<#list config.tools as tool>
  <#assign toolCounter = toolCounter + 1>
      {
        name: ${tool.name?json_string},
        description: ${tool.description?json_string},
        inputSchema: {
          type: "object",
          properties: {
<#list tool.parameters as param>
            ${param.name?json_string}: {
              type: ${param.type?json_string},
              description: ${param.description?json_string}<#if param.defaultValue??>,
              default: ${param.defaultValue?json_string}</#if>
            }<#if param?has_next>,</#if>
</#list>
          },
          required: [ <#assign sep = ""> <#list tool.parameters as param> <#if param.required>${sep}${"\""}${param.name}${"\""}<#assign sep = ", "></#if> </#list> ]
        }
      }<#if tool?has_next>,</#if>
</#list>
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
<#assign toolCounter = 0>
<#list config.tools as tool>
  <#assign toolCounter = toolCounter + 1>
    <#-- create a safe identifier for the handler -->
    <#assign rawId = (tool.name?cap_first?replace("[^A-Za-z0-9]","_"))>
    <#if rawId?matches('^[0-9].*')>
      <#assign baseSafe = '_' + rawId>
    <#else>
      <#assign baseSafe = rawId>
    </#if>
    <#assign safeToolId = baseSafe + '_' + toolCounter>
    case ${tool.name?json_string}:
      return await handle${safeToolId}(args);
</#list>
    default:
      throw new Error(`Unknown tool: ${r"${name}"}`);
  }
});

<#assign toolCounter = 0>
<#list config.tools as tool>
  <#assign toolCounter = toolCounter + 1>
  <#assign rawId = (tool.name?cap_first?replace("[^A-Za-z0-9]","_"))>
  <#if rawId?matches('^[0-9].*')>
    <#assign baseSafe = '_' + rawId>
  <#else>
    <#assign baseSafe = rawId>
  </#if>
  <#assign safeToolId = baseSafe + '_' + toolCounter>
// Implementation for ${tool.name}
async function handle${safeToolId}(args: any) {
  try {
    // TODO: Implement your logic here
    <#if tool.implementation??>
    ${tool.implementation}
    <#else>
    // Example implementation
    const result = `Executed ${tool.name} with args: ${r"${JSON.stringify(args)}"}`;
    </#if>
    
    return {
      content: [
        {
          type: "text",
          text: result
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error in ${tool.name}: ${r"${error}"}`
        }
      ],
      isError: true
    };
  }
}

</#list>
<#if config.resources?? && config.resources?size gt 0>
// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
<#assign resourceCounter = 0>
<#list config.resources as resource>
  <#assign resourceCounter = resourceCounter + 1>
      {
        uri: ${resource.uri?json_string},
        name: ${resource.name?json_string},
        description: ${resource.description?json_string},
        mimeType: ${resource.mimeType?json_string}
      }<#if resource?has_next>,</#if>
</#list>
    ],
  };
});

// Handle resource reads
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  switch (uri) {
<#assign resourceCounter = 0>
<#list config.resources as resource>
  <#assign resourceCounter = resourceCounter + 1>
    <#-- safe resource function id -->
    <#assign rawResId = (resource.name?cap_first?replace("[^A-Za-z0-9]","_"))>
    <#if rawResId?matches('^[0-9].*')>
      <#assign baseSafeRes = '_' + rawResId>
    <#else>
      <#assign baseSafeRes = rawResId>
    </#if>
    <#assign safeResId = baseSafeRes + '_' + resourceCounter>
    case ${resource.uri?json_string}:
      return await read${safeResId}Resource();
</#list>
    default:
      throw new Error(`Unknown resource: ${r"${uri}"}`);
  }
});

<#assign resourceCounter = 0>
<#list config.resources as resource>
  <#assign resourceCounter = resourceCounter + 1>
  <#assign rawResId = (resource.name?cap_first?replace("[^A-Za-z0-9]","_"))>
  <#if rawResId?matches('^[0-9].*')>
    <#assign baseSafeRes = '_' + rawResId>
  <#else>
    <#assign baseSafeRes = rawResId>
  </#if>
  <#assign safeResId = baseSafeRes + '_' + resourceCounter>
// Implementation for ${resource.name} resource
async function read${safeResId}Resource() {
  try {
    <#if resource.implementation??>
    ${resource.implementation}
    <#else>
    // TODO: Implement resource reading logic
    const content = ${("Resource content for " + resource.name)?json_string};
    </#if>
    
    return {
      contents: [
        {
          uri: ${resource.uri?json_string},
          mimeType: ${resource.mimeType?json_string},
          text: content
        }
      ]
    };
  } catch (error) {
    throw new Error(`Failed to read ${resource.name}: ${r"${error}"}`);
  }
}

</#list>
</#if>
// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("${config.serverName} MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
