package com.mcpbuilder.service;

import com.mcpbuilder.model.McpServerConfig;
import freemarker.template.Configuration;
import freemarker.template.Template;
import freemarker.template.TemplateException;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.io.StringWriter;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

@Service
public class McpServerGeneratorService {
    
    private final Configuration freemarkerConfig;
    
    public McpServerGeneratorService() {
        freemarkerConfig = new Configuration(Configuration.VERSION_2_3_32);
        freemarkerConfig.setClassForTemplateLoading(this.getClass(), "/templates");
        freemarkerConfig.setDefaultEncoding("UTF-8");
    }
    
    public String generateServer(McpServerConfig config) throws IOException, TemplateException {
        // Create output directory
        String outputDir = "generated-servers/" + config.getServerName();
        Path serverPath = Paths.get(outputDir);
        Files.createDirectories(serverPath);

        // Delegate to generation into the directory
        generateServerToDirectory(config, serverPath);

        return serverPath.toAbsolutePath().toString();
    }

    // New API: generate into a provided directory
    public void generateServerToDirectory(McpServerConfig config, Path outputDir) throws IOException, TemplateException {
        Files.createDirectories(outputDir);

        // Generate package.json
        generatePackageJson(config, outputDir.toString());

        // Generate main server file
        generateServerFile(config, outputDir.toString());

        // Generate README
        generateReadme(config, outputDir.toString());

        // Generate tsconfig.json
        generateTsConfig(config, outputDir.toString());
    }
    
    private void generateTsConfig(McpServerConfig config, String outputDir) throws IOException, TemplateException {
        Template template = freemarkerConfig.getTemplate("tsconfig.json.ftl");
        Map<String, Object> model = new HashMap<>();
        model.put("config", config);
        
        try (FileWriter writer = new FileWriter(new File(outputDir, "tsconfig.json"))) {
            template.process(model, writer);
        }
    }
    
    private void generatePackageJson(McpServerConfig config, String outputDir) throws IOException, TemplateException {
        Template template = freemarkerConfig.getTemplate("package.json.ftl");
        Map<String, Object> model = new HashMap<>();
        model.put("config", config);
        
        try (FileWriter writer = new FileWriter(new File(outputDir, "package.json"))) {
            template.process(model, writer);
        }
    }
    
    private void generateServerFile(McpServerConfig config, String outputDir) throws IOException, TemplateException {
        Template template = freemarkerConfig.getTemplate("server.ts.ftl");
        Map<String, Object> model = new HashMap<>();
        model.put("config", config);
        
        try (FileWriter writer = new FileWriter(new File(outputDir, "index.ts"))) {
            template.process(model, writer);
        }
    }
    
    private void generateReadme(McpServerConfig config, String outputDir) throws IOException, TemplateException {
        Template template = freemarkerConfig.getTemplate("README.md.ftl");
        Map<String, Object> model = new HashMap<>();
        model.put("config", config);
        
        try (FileWriter writer = new FileWriter(new File(outputDir, "README.md"))) {
            template.process(model, writer);
        }
    }
    
    public String previewServer(McpServerConfig config) throws IOException, TemplateException {
        Template template = freemarkerConfig.getTemplate("server.ts.ftl");
        Map<String, Object> model = new HashMap<>();
        model.put("config", config);
        
        StringWriter writer = new StringWriter();
        template.process(model, writer);
        return writer.toString();
    }
}
