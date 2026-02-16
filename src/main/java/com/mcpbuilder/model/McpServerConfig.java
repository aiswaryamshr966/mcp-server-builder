package com.mcpbuilder.model;

import java.util.List;
import java.util.ArrayList;

public class McpServerConfig {
    private String serverName;
    private String description;
    private String version = "1.0.0";
    private List<ToolConfig> tools = new ArrayList<>();
    private List<ResourceConfig> resources = new ArrayList<>();
    private ServerType serverType = ServerType.STDIO;

    public enum ServerType {
        STDIO, HTTP
    }

    public String getServerName() {
        return serverName;
    }

    public void setServerName(String serverName) {
        this.serverName = serverName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public List<ToolConfig> getTools() {
        return tools;
    }

    public void setTools(List<ToolConfig> tools) {
        this.tools = tools;
    }

    public List<ResourceConfig> getResources() {
        return resources;
    }

    public void setResources(List<ResourceConfig> resources) {
        this.resources = resources;
    }

    public ServerType getServerType() {
        return serverType;
    }

    public void setServerType(ServerType serverType) {
        this.serverType = serverType;
    }
}
