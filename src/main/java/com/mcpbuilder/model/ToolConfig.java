package com.mcpbuilder.model;

import java.util.List;
import java.util.ArrayList;

public class ToolConfig {
    private String name;
    private String description;
    private List<ParameterConfig> parameters = new ArrayList<>();
    private String implementation; // Code snippet or template reference

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<ParameterConfig> getParameters() {
        return parameters;
    }

    public void setParameters(List<ParameterConfig> parameters) {
        this.parameters = parameters;
    }

    public String getImplementation() {
        return implementation;
    }

    public void setImplementation(String implementation) {
        this.implementation = implementation;
    }
}
