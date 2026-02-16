// State management
let toolCount = 0;
let resourceCount = 0;
let parameterCounts = {};
let isGenerating = false;

// Monaco editors map: id -> editor instance
const editors = {};
let monacoLoaded = false;

// API base URL
const API_BASE = 'http://localhost:8080/api/servers';

// Examples
const EXAMPLES = {
    weather: {
        serverName: 'weather-server',
        description: 'A simple MCP server that provides weather information',
        version: '1.0.0',
        tools: [
            {
                name: 'get_weather',
                description: 'Get current weather information for a specific location',
                parameters: [
                    { name: 'location', type: 'string', description: 'The city or location to get weather for', required: true },
                    { name: 'units', type: 'string', description: "Temperature units - 'celsius' or 'fahrenheit'", required: false }
                ],
                implementation: `// Simple example implementation\nconst temp = Math.floor(Math.random() * 30) + 10;\nconst unit = args.units || 'celsius';\nconst result = ` + "`The weather in ${args.location} is ${temp}°${unit === 'celsius' ? 'C' : 'F'} and sunny!`" + `;\nreturn result;`
            },
            {
                name: 'get_forecast',
                description: 'Get weather forecast for the next few days',
                parameters: [
                    { name: 'location', type: 'string', description: 'The city or location to get forecast for', required: true },
                    { name: 'days', type: 'number', description: 'Number of days to forecast (1-7)', required: false }
                ],
                implementation: `const numDays = args.days || 3;\nconst forecast = [];\nfor (let i = 0; i < numDays; i++) { const temp = Math.floor(Math.random() * 30) + 10; forecast.push(\`Day ${i + 1}: ${temp}°C\`); }\nconst result = \`Forecast for ${args.location}:\\n${forecast.join('\\n')}\`;\nreturn result;`
            }
        ],
        resources: [
            {
                uri: 'weather://stations',
                name: 'weather-stations',
                description: 'List of available weather monitoring stations',
                mimeType: 'application/json',
                implementation: `const content = JSON.stringify({ stations: [ { id: 1, name: 'Downtown Station', location: 'City Center' } ] }, null, 2);\nreturn content;`
            }
        ]
    },
    hello: {
        serverName: 'hello-server',
        description: 'My first hello MCP server',
        version: '1.0.0',
        tools: [
            { name: 'say_hello', description: 'Say hello to someone', parameters: [ { name: 'name', type: 'string', description: "Person's name", required: true } ], implementation: `const result = ` + "`Hello, ${args.name}!`" + `;\nreturn result;` }
        ],
        resources: [
            { uri: 'hello://info', name: 'hello-info', description: 'Basic hello server info', mimeType: 'application/json', implementation: `return JSON.stringify({ info: 'Hello server v1' }, null, 2);` }
        ]
    }
};

// Pending actions queue to avoid TDZ issues when toolbar handlers run before EXAMPLES is initialized
window._mcp_pendingActions = window._mcp_pendingActions || [];
function enqueueAction(action) {
    window._mcp_pendingActions.push(action);
    // attempt to process immediately
    processPendingActions();
}
function processPendingActions() {
    // if no pending, nothing to do
    if (!window._mcp_pendingActions || window._mcp_pendingActions.length === 0) return;
    // If EXAMPLES not ready, only process actions that don't depend on it
    let examplesReady = true;
    try {
        examplesReady = (typeof EXAMPLES !== 'undefined');
    } catch (e) { examplesReady = false; }

    // Process a copy to avoid mutation issues
    const pending = window._mcp_pendingActions.splice(0, window._mcp_pendingActions.length);
    for (const act of pending) {
        try {
            switch (act.type) {
                case 'load':
                    if (examplesReady) {
                        loadExample(act.name);
                        appendDebugLog('Processed queued load: ' + act.name);
                    } else {
                        // re-enqueue for later
                        window._mcp_pendingActions.push(act);
                    }
                    break;
                case 'export':
                    exportConfig(); appendDebugLog('Processed queued export');
                    break;
                case 'download':
                    downloadZip(); appendDebugLog('Processed queued download');
                    break;
                case 'presentation':
                    togglePresentation(); appendDebugLog('Processed queued presentation');
                    break;
                case 'theme':
                    toggleTheme(); appendDebugLog('Processed queued theme');
                    break;
                case 'help':
                    openHelp(); appendDebugLog('Processed queued help');
                    break;
                default:
                    // unknown
                    break;
            }
        } catch (e) {
            // if action failed because EXAMPLES still not ready, re-enqueue.
            if (act.type === 'load') {
                window._mcp_pendingActions.push(act);
            } else {
                console.error('Failed to process action', act, e);
            }
        }
    }
}

// Setup toolbar listeners separately so they can be bound even if DOMContentLoaded timing varies
function setupToolbar() {
    const toggleBtn = document.getElementById('toggleThemeBtn');
    const exportBtn = document.getElementById('exportBtn');
    const helpBtn = document.getElementById('helpBtn');
    const loadBtn = document.getElementById('loadExampleBtn');
    const exampleSelect = document.getElementById('exampleSelect');
    const downloadZipBtn = document.getElementById('downloadZipBtn');
    const presentationBtn = document.getElementById('presentationBtn');
    const closeHelpBtn = document.getElementById('closeHelpBtn');

    if (toggleBtn) toggleBtn.addEventListener('click', toggleTheme);
    if (exportBtn) exportBtn.addEventListener('click', exportConfig);
    if (helpBtn) helpBtn.addEventListener('click', () => { openHelp(); });
    if (loadBtn && exampleSelect) loadBtn.addEventListener('click', () => { const v = exampleSelect.value; if (v) enqueueAction({ type: 'load', name: v }); });
    if (downloadZipBtn) downloadZipBtn.addEventListener('click', downloadZip);
    if (presentationBtn) presentationBtn.addEventListener('click', togglePresentation);
    if (closeHelpBtn) closeHelpBtn.addEventListener('click', closeHelp);

    // Add delegation as a robust fallback (single handler) to avoid missing bindings
    const toolbar = document.querySelector('.toolbar');
    if (toolbar && !toolbar._delegationAdded) {
        toolbar.addEventListener('click', (ev) => {
            const btn = ev.target.closest && ev.target.closest('.tool-btn');
            if (!btn) return;
            const id = btn.id;
            switch (id) {
                case 'loadExampleBtn': {
                    const sel = document.getElementById('exampleSelect');
                    const v = sel && sel.value; if (v) enqueueAction({ type: 'load', name: v });
                    break;
                }
                case 'exportBtn': exportConfig(); break;
                case 'downloadZipBtn': downloadZip(); break;
                case 'presentationBtn': togglePresentation(); break;
                case 'toggleThemeBtn': toggleTheme(); break;
                case 'helpBtn': openHelp(); break;
            }
            appendDebugLog(`Toolbar action: ${id}`);
        });
        toolbar._delegationAdded = true;
    }
}

// call setup immediately (in case DOM is ready and listener didn't fire)
setupToolbar();

window.addEventListener('DOMContentLoaded', () => {
    // Initialize UI state
    addTool();

    // Theme restore
    const saved = localStorage.getItem('mcp_theme');
    if (saved === 'dark') document.documentElement.classList.add('theme-dark');

    // also ensure toolbar bound after DOMContentLoaded
    setupToolbar();
});

// Presentation mode
function togglePresentation() {
    const shell = document.getElementById('appShell');
    if (!shell) return;
    const isOn = shell.classList.toggle('presentation');
    const btn = document.getElementById('presentationBtn');
    if (btn) btn.textContent = isOn ? 'Exit Presentation' : 'Presentation';
}

// Help modal controls
function openHelp() { document.getElementById('helpModal').style.display = 'flex'; }
function closeHelp() { document.getElementById('helpModal').style.display = 'none'; }

// Download ZIP action
async function downloadZip() {
    const cfg = collectFormData();
    try {
        const resp = await fetch(`${API_BASE}/download`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cfg)
        });
        if (!resp.ok) {
            const err = await resp.json().catch(() => ({}));
            showMessage(`❌ Error creating ZIP: ${err.message || resp.statusText}`, 'error');
            return;
        }
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${cfg.serverName || 'mcp-server'}.zip`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        showMessage('✅ ZIP downloaded', 'success');
    } catch (e) {
        showMessage(`❌ Error: ${e.message}`, 'error');
    }
}

// Show message
function showMessage(message, type = 'success', sticky = false) {
    const container = document.getElementById('message-container');
    const messageClass = type === 'success' ? 'msg-success' : 'msg-error';
    container.innerHTML = `<div class="msg ${messageClass}">${message}</div>`;
    if (!sticky) setTimeout(() => { container.innerHTML = ''; }, 5000);
}

// Theme toggle
function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('theme-dark');
    localStorage.setItem('mcp_theme', isDark ? 'dark' : 'light');
    // update Monaco theme if loaded
    if (monacoLoaded && window.monaco) {
        try {
            window.monaco.editor.setTheme(isDark ? 'vs-dark' : 'vs');
        } catch (e) {
            console.warn('Failed to set Monaco theme', e);
        }
    }
}

// Export Config
function exportConfig() {
    const cfg = collectFormData();
    const blob = new Blob([JSON.stringify(cfg, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cfg.serverName || 'mcp-server'}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showMessage('✅ Configuration downloaded', 'success');
}

// Monaco helper: create editor in containerId with initialValue
function ensureMonacoLoaded(callback) {
    if (monacoLoaded) { callback(); return; }
    if (window.require) {
        window.require(['vs/editor/editor.main'], function () {
            monacoLoaded = true; callback();
        });
    } else {
        // fallback: wait a bit
        setTimeout(() => ensureMonacoLoaded(callback), 200);
    }
}

function createEditor(containerId, initialValue = '') {
    ensureMonacoLoaded(() => {
        try {
            const container = document.getElementById(containerId);
            if (!container) return;
            // create editor
            const ed = monaco.editor.create(container, {
                value: initialValue,
                language: 'javascript',
                theme: document.documentElement.classList.contains('theme-dark') ? 'vs-dark' : 'vs',
                automaticLayout: true,
                minimap: { enabled: false }
            });
            editors[containerId] = ed;
        } catch (e) {
            console.warn('Monaco create failed', e);
        }
    });
}

function disposeEditor(containerId) {
    const ed = editors[containerId];
    if (ed) { ed.dispose(); delete editors[containerId]; }
}

// Add Tool (uses editor container for implementation)
function addTool() {
    toolCount++;
    const toolId = `tool-${toolCount}`;
    parameterCounts[toolId] = 0;
    
    const toolHtml = `
        <div class="tool-item" id="${toolId}">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3>Tool ${toolCount}</h3>
                <button type="button" class="btn btn-ghost" onclick="removeTool('${toolId}')">Remove</button>
            </div>
            
            <div class="form-group">
                <label>Tool Name *</label>
                <input type="text" name="${toolId}-name" required placeholder="get_weather">
            </div>
            
            <div class="form-group">
                <label>Description *</label>
                <textarea name="${toolId}-description" required placeholder="Get current weather for a location"></textarea>
            </div>
            
            <div class="form-group">
                <label>Implementation (optional)</label>
                <div class="impl-editor" id="${toolId}-implementation"></div>
            </div>
            
            <div>
                <strong>Parameters:</strong>
                <div id="${toolId}-parameters"></div>
                <div style="margin-top:8px"><button type="button" class="add-btn" onclick="addParameter('${toolId}')">+ Add Parameter</button></div>
            </div>
        </div>
    `;
    
    document.getElementById('toolsContainer').insertAdjacentHTML('beforeend', toolHtml);
    // create Monaco editor after DOM insertion
    createEditor(`${toolId}-implementation`, `// JavaScript implementation\n// use args object for parameters\n`);
}

// Remove Tool
function removeTool(toolId) {
    disposeEditor(`${toolId}-implementation`);
    const el = document.getElementById(toolId);
    if (el) el.remove();
    delete parameterCounts[toolId];
}

// Add Parameter
function addParameter(toolId) {
    parameterCounts[toolId]++;
    const paramId = `${toolId}-param-${parameterCounts[toolId]}`;
    
    const paramHtml = `
        <div class="parameter-item" id="${paramId}">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <strong>Parameter ${parameterCounts[toolId]}</strong>
                <button type="button" class="btn btn-remove" onclick="removeParameter('${paramId}')">Remove</button>
            </div>
            
            <div class="grid-2">
                <div class="form-group">
                    <label>Name *</label>
                    <input type="text" name="${paramId}-name" required placeholder="location">
                </div>
                
                <div class="form-group">
                    <label>Type *</label>
                    <select name="${paramId}-type" required>
                        <option value="string">String</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                        <option value="object">Object</option>
                        <option value="array">Array</option>
                    </select>
                </div>
            </div>
            
            <div class="form-group">
                <label>Description *</label>
                <input type="text" name="${paramId}-description" required placeholder="The location to get weather for">
            </div>
            
            <div class="checkbox-group">
                <input type="checkbox" name="${paramId}-required" id="${paramId}-required">
                <label for="${paramId}-required" style="margin: 0;">Required</label>
            </div>
        </div>
    `;
    
    document.getElementById(`${toolId}-parameters`).insertAdjacentHTML('beforeend', paramHtml);
}

// Remove Parameter
function removeParameter(paramId) {
    const el = document.getElementById(paramId);
    if (el) el.remove();
}

// Add Resource (uses editor container for implementation)
function addResource() {
    resourceCount++;
    const resourceId = `resource-${resourceCount}`;
    
    const resourceHtml = `
        <div class="resource-item" id="${resourceId}">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3>Resource ${resourceCount}</h3>
                <button type="button" class="btn btn-ghost" onclick="removeResource('${resourceId}')">Remove</button>
            </div>
            
            <div class="grid-2">
                <div class="form-group">
                    <label>URI *</label>
                    <input type="text" name="${resourceId}-uri" required placeholder="file:///data/config.json">
                </div>
                
                <div class="form-group">
                    <label>Name *</label>
                    <input type="text" name="${resourceId}-name" required placeholder="config">
                </div>
            </div>
            
            <div class="form-group">
                <label>Description *</label>
                <textarea name="${resourceId}-description" required placeholder="Configuration file"></textarea>
            </div>
            
            <div class="form-group">
                <label>MIME Type *</label>
                <input type="text" name="${resourceId}-mimeType" required placeholder="application/json" value="text/plain">
            </div>
            
            <div class="form-group">
                <label>Implementation (optional)</label>
                <div class="impl-editor" id="${resourceId}-implementation"></div>
            </div>
        </div>
    `;
    
    document.getElementById('resourcesContainer').insertAdjacentHTML('beforeend', resourceHtml);
    createEditor(`${resourceId}-implementation`, `// Resource implementation\n`);
}

// Remove Resource
function removeResource(resourceId) {
    disposeEditor(`${resourceId}-implementation`);
    const el = document.getElementById(resourceId);
    if (el) el.remove();
}

// Collect form data
function collectFormData() {
    const formData = new FormData(document.getElementById('serverForm'));
    
    const config = {
        serverName: formData.get('serverName'),
        description: formData.get('description'),
        version: formData.get('version') || '1.0.0',
        serverType: 'STDIO',
        tools: [],
        resources: []
    };
    
    // Collect tools
    for (let i = 1; i <= toolCount; i++) {
        const toolId = `tool-${i}`;
        const toolElement = document.getElementById(toolId);
        if (!toolElement) continue;
        
        const implEditorId = `${toolId}-implementation`;
        const implementation = editors[implEditorId] ? editors[implEditorId].getValue() : (formData.get(`${toolId}-implementation`) || '');

        const tool = {
            name: formData.get(`${toolId}-name`),
            description: formData.get(`${toolId}-description`),
            implementation: implementation || '',
            parameters: []
        };
        
        // Collect parameters for this tool
        if (parameterCounts[toolId]) {
            for (let j = 1; j <= parameterCounts[toolId]; j++) {
                const paramId = `${toolId}-param-${j}`;
                const paramElement = document.getElementById(paramId);
                if (!paramElement) continue;
                
                const param = {
                    name: formData.get(`${paramId}-name`),
                    type: formData.get(`${paramId}-type`),
                    description: formData.get(`${paramId}-description`),
                    required: formData.get(`${paramId}-required`) === 'on'
                };
                
                tool.parameters.push(param);
            }
        }
        
        config.tools.push(tool);
    }
    
    // Collect resources
    for (let i = 1; i <= resourceCount; i++) {
        const resourceId = `resource-${i}`;
        const resourceElement = document.getElementById(resourceId);
        if (!resourceElement) continue;
        
        const implEditorId = `${resourceId}-implementation`;
        const implementation = editors[implEditorId] ? editors[implEditorId].getValue() : (formData.get(`${resourceId}-implementation`) || '');

        const resource = {
            uri: formData.get(`${resourceId}-uri`),
            name: formData.get(`${resourceId}-name`),
            description: formData.get(`${resourceId}-description`),
            mimeType: formData.get(`${resourceId}-mimeType`),
            implementation: implementation || ''
        };
        
        config.resources.push(resource);
    }
    
    return config;
}

// Generate Server
async function generateServer() {
    if (isGenerating) return;
    isGenerating = true;
    setGenerateDisabled(true);

    const config = collectFormData();
    showMessage('Generating server...', 'success', true);

    try {
        const response = await fetch(`${API_BASE}/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(config)
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            showMessage(`✅ Server generated successfully at: ${result.path}`, 'success');
        } else {
            showMessage(`❌ Error: ${result.message}`, 'error');
        }
    } catch (error) {
        showMessage(`❌ Error: ${error.message}`, 'error');
    } finally {
        isGenerating = false;
        setGenerateDisabled(false);
    }
}

function setGenerateDisabled(disabled) {
    const btn = document.querySelector('.btn-primary');
    if (btn) {
        btn.disabled = disabled;
        btn.style.opacity = disabled ? '0.6' : '1';
        btn.style.cursor = disabled ? 'not-allowed' : 'pointer';
    }
}

// Preview Server
async function previewServer() {
    const config = collectFormData();
    
    try {
        const response = await fetch(`${API_BASE}/preview`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(config)
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            document.getElementById('previewCode').textContent = result.preview;
            document.getElementById('previewCode').scrollIntoView({ behavior: 'smooth' });
        } else {
            showMessage(`❌ Error: ${result.message}`, 'error');
        }
    } catch (error) {
        showMessage(`❌ Error: ${error.message}`, 'error');
    }
}

// Load example into form
function clearForm() {
    // dispose editors
    Object.keys(editors).forEach(id => disposeEditor(id));
    document.getElementById('toolsContainer').innerHTML = '';
    document.getElementById('resourcesContainer').innerHTML = '';
    toolCount = 0; resourceCount = 0; parameterCounts = {};
}

function loadExample(name) {
    // Guard: EXAMPLES may not be ready if script execution order differs in some environments.
    try {
        // Probe EXAMPLES safely; accessing a lexical binding in TDZ throws, so catch and retry.
        if (typeof EXAMPLES === 'undefined') {
            appendDebugLog('EXAMPLES not ready; retrying loadExample for: ' + name);
            setTimeout(() => loadExample(name), 80);
            return;
        }
    } catch (probeErr) {
        // If EXAMPLES is in temporal dead zone, schedule retry quietly
        appendDebugLog('EXAMPLES probe error; retrying loadExample for: ' + name);
        setTimeout(() => loadExample(name), 80);
        return;
    }

    const ex = EXAMPLES[name];
    if (!ex) return;
    clearForm();
    document.getElementById('serverName').value = ex.serverName || '';
    document.getElementById('description').value = ex.description || '';
    document.getElementById('version').value = ex.version || '1.0.0';

    (ex.tools || []).forEach(t => {
        addTool();
        const id = `tool-${toolCount}`;
        // set fields
        document.querySelector(`[name='${id}-name']`).value = t.name || '';
        document.querySelector(`[name='${id}-description']`).value = t.description || '';
        // parameters
        (t.parameters || []).forEach(p => { addParameter(id); const pid = `${id}-param-${parameterCounts[id]}`; document.querySelector(`[name='${pid}-name']`).value = p.name || ''; document.querySelector(`[name='${pid}-type']`).value = p.type || 'string'; document.querySelector(`[name='${pid}-description']`).value = p.description || ''; if (p.required) document.querySelector(`#${pid}-required`).checked = true; });
        // implementation
        const implId = `${id}-implementation`;
        if (t.implementation) {
            ensureMonacoLoaded(() => { if (editors[implId]) editors[implId].setValue(t.implementation); else createEditor(implId, t.implementation); });
        }
    });

    (ex.resources || []).forEach(r => {
        addResource();
        const id = `resource-${resourceCount}`;
        document.querySelector(`[name='${id}-uri']`).value = r.uri || '';
        document.querySelector(`[name='${id}-name']`).value = r.name || '';
        document.querySelector(`[name='${id}-description']`).value = r.description || '';
        document.querySelector(`[name='${id}-mimeType']`).value = r.mimeType || '';
        const implId = `${id}-implementation`;
        if (r.implementation) {
            ensureMonacoLoaded(() => { if (editors[implId]) editors[implId].setValue(r.implementation); else createEditor(implId, r.implementation); });
        }
    });
    showMessage('Example loaded into the form', 'success');
}

// Debug banner helpers
function showDebugBanner() { const b = document.getElementById('debugBanner'); if (b) b.style.display = 'block'; }
function hideDebugBanner() { const b = document.getElementById('debugBanner'); if (b) b.style.display = 'none'; }
function clearDebugLog() { const l = document.getElementById('debugLog'); if (l) l.innerHTML = ''; }
function appendDebugLog(msg) {
    const l = document.getElementById('debugLog');
    if (!l) return;
    const time = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.textContent = `[${time}] ${msg}`;
    l.insertBefore(entry, l.firstChild);
    // keep only recent 30
    while (l.childElementCount > 30) l.removeChild(l.lastChild);
}

// wire debug banner buttons
(function wireDebug() {
    function attach() {
        const hide = document.getElementById('hideDebugBtn');
        const clear = document.getElementById('clearDebugBtn');
        if (hide) hide.addEventListener('click', hideDebugBanner);
        if (clear) clear.addEventListener('click', clearDebugLog);
    }

    // Try attaching immediately (works if elements are already parsed)
    try { attach(); } catch (e) { /* ignore */ }

    // Also attach on DOMContentLoaded in case script ran before DOM was ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', attach);
    } else {
        // if already ready, attach again to be safe
        attach();
    }
})();

// After EXAMPLES is declared, attempt to process any pending actions
processPendingActions();

// update wrappers & delegation to use enqueueAction for load to avoid direct EXAMPLES access
function loadExampleFromSelect() {
    try {
        const sel = document.getElementById('exampleSelect');
        const v = sel && sel.value;
        if (v) { console.info('Enqueue load example:', v); appendDebugLog('Enqueue load example: ' + v); enqueueAction({ type: 'load', name: v }); }
        else { console.info('No example selected'); appendDebugLog('Load example: none selected'); }
        showDebugBanner();
    } catch (e) { console.error(e); appendDebugLog('Load example error: ' + e.message); showDebugBanner(); }
}

// modify delegation: replace direct loadExample call with enqueueAction
// locate the delegation switch and replace the load case: already handled above in setupToolbar

// other wrappers keep calling enqueueAction where appropriate
function triggerExportConfig() { try { console.info('Export config triggered'); appendDebugLog('Export config'); enqueueAction({ type: 'export' }); showDebugBanner(); } catch (e) { console.error(e); appendDebugLog('Export error: ' + e.message); showDebugBanner(); } }
function triggerDownloadZip() { try { console.info('Download ZIP triggered'); appendDebugLog('Download ZIP'); enqueueAction({ type: 'download' }); showDebugBanner(); } catch (e) { console.error(e); appendDebugLog('Download ZIP error: ' + e.message); showDebugBanner(); } }
function triggerPresentation() { try { console.info('Toggle presentation'); appendDebugLog('Toggle presentation'); enqueueAction({ type: 'presentation' }); showDebugBanner(); } catch (e) { console.error(e); appendDebugLog('Presentation error: ' + e.message); showDebugBanner(); } }
function triggerToggleTheme() { try { console.info('Toggle theme'); appendDebugLog('Toggle theme'); enqueueAction({ type: 'theme' }); showDebugBanner(); } catch (e) { console.error(e); appendDebugLog('Toggle theme error: ' + e.message); showDebugBanner(); } }
function triggerOpenHelp() { try { console.info('Open help'); appendDebugLog('Open help'); enqueueAction({ type: 'help' }); showDebugBanner(); } catch (e) { console.error(e); appendDebugLog('Open help error: ' + e.message); showDebugBanner(); } }
