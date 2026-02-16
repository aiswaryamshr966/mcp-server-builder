package com.mcpbuilder.controller;

import com.mcpbuilder.model.McpServerConfig;
import com.mcpbuilder.service.McpServerGeneratorService;
import freemarker.template.TemplateException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.FileSystemUtils;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Stream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@RestController
@RequestMapping("/api/servers")
@CrossOrigin(origins = "*")
public class McpServerController {
    
    @Autowired
    private McpServerGeneratorService generatorService;
    
    @PostMapping("/generate")
    public ResponseEntity<?> generateServer(@RequestBody McpServerConfig config) {
        try {
            String outputPath = generatorService.generateServer(config);
            Map<String, String> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Server generated successfully");
            response.put("path", outputPath);
            return ResponseEntity.ok(response);
        } catch (IOException | TemplateException e) {
            Map<String, String> error = new HashMap<>();
            error.put("status", "error");
            error.put("message", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }
    
    @PostMapping("/preview")
    public ResponseEntity<?> previewServer(@RequestBody McpServerConfig config) {
        try {
            String preview = generatorService.previewServer(config);
            Map<String, String> response = new HashMap<>();
            response.put("status", "success");
            response.put("preview", preview);
            return ResponseEntity.ok(response);
        } catch (IOException | TemplateException e) {
            Map<String, String> error = new HashMap<>();
            error.put("status", "error");
            error.put("message", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    @PostMapping(value = "/download")
    public ResponseEntity<?> downloadServerZip(@RequestBody McpServerConfig config) {
        Path tempDir = null;
        Path zipPath = null;
        try {
            tempDir = Files.createTempDirectory("mcpserver_");
            // generate into temp dir
            generatorService.generateServerToDirectory(config, tempDir);

            // create zip file
            zipPath = Files.createTempFile("mcpserver_zip_", ".zip");
            try (ZipOutputStream zos = new ZipOutputStream(Files.newOutputStream(zipPath))) {
                try (Stream<Path> stream = Files.walk(tempDir)) {
                    Path[] paths = stream.filter(p -> !Files.isDirectory(p)).toArray(Path[]::new);
                    for (Path p : paths) {
                        ZipEntry entry = new ZipEntry(tempDir.relativize(p).toString().replace('\\', '/'));
                        zos.putNextEntry(entry);
                        Files.copy(p, zos);
                        zos.closeEntry();
                    }
                }
            }

            byte[] zipBytes = Files.readAllBytes(zipPath);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", config.getServerName() + ".zip");
            return ResponseEntity.ok().headers(headers).body(zipBytes);
        } catch (IOException | TemplateException e) {
            Map<String, String> error = new HashMap<>();
            error.put("status", "error");
            error.put("message", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        } finally {
            // cleanup temp files
            try {
                if (zipPath != null) Files.deleteIfExists(zipPath);
                if (tempDir != null) FileSystemUtils.deleteRecursively(tempDir);
            } catch (IOException ignored) {}
        }
    }

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "healthy");
        return ResponseEntity.ok(response);
    }
}
