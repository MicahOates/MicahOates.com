/**
 * WebGLDetector
 * Utility to detect WebGL support and capabilities with detailed diagnostics
 */
export class WebGLDetector {
    /**
     * Check if WebGL is supported
     * @param {boolean} detailed - Whether to return detailed information
     * @returns {Object|boolean} - Detailed support information or simple boolean
     */
    static isWebGLSupported(detailed = false) {
        const result = {
            supported: false,
            contextName: null,
            renderer: null,
            vendor: null,
            webgl2: false,
            version: null,
            shadingLanguageVersion: null,
            maxTextureSize: null,
            maxTextureUnits: null,
            extensions: [],
            errorMessage: null,
            warnings: []
        };
        
        try {
            // Create test canvas
            const canvas = document.createElement('canvas');
            
            // Try to get a WebGL 2 context first
            let gl = canvas.getContext('webgl2');
            let webgl2 = true;
            
            // Fall back to WebGL 1 if WebGL 2 is not available
            if (!gl) {
                webgl2 = false;
                gl = canvas.getContext('webgl') || 
                     canvas.getContext('experimental-webgl');
            }
            
            if (!gl) {
                result.errorMessage = 'WebGL not supported. Your browser or device may not support WebGL.';
                return detailed ? result : false;
            }
            
            // WebGL is supported
            result.supported = true;
            result.webgl2 = webgl2;
            result.contextName = webgl2 ? 'WebGL 2' : 'WebGL 1';
            
            // Get renderer information
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                result.renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                result.vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
            } else {
                result.warnings.push('WEBGL_debug_renderer_info extension not available');
            }
            
            // Get version information
            result.version = gl.getParameter(gl.VERSION);
            result.shadingLanguageVersion = gl.getParameter(gl.SHADING_LANGUAGE_VERSION);
            
            // Get capability information
            result.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
            result.maxTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
            
            // Get extensions
            const extensionNames = gl.getSupportedExtensions();
            result.extensions = extensionNames || [];
            
            // Performance warning for old mobile GPUs
            if (result.renderer && /Adreno 3|Mali-4|Mali-T|PowerVR.*5/i.test(result.renderer)) {
                result.warnings.push('Your GPU appears to be older and may struggle with complex 3D scenes');
            }
            
            // Check for mobile device
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            if (isMobile) {
                result.warnings.push('Mobile device detected - performance may be limited');
            }
            
            // Check minimum texture size
            if (result.maxTextureSize < 4096) {
                result.warnings.push('Maximum texture size is limited: ' + result.maxTextureSize);
            }
            
            // Return the detailed result or just the supported flag
            return detailed ? result : result.supported;
            
        } catch (error) {
            result.errorMessage = 'Error while detecting WebGL: ' + error.message;
            return detailed ? result : false;
        }
    }
    
    /**
     * Create an informative error element for when WebGL is not supported
     * @param {Object} result - The detailed WebGL support result
     * @returns {HTMLElement} - An element to display to the user
     */
    static createErrorElement(result) {
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.top = '0';
        container.style.left = '0';
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.alignItems = 'center';
        container.style.justifyContent = 'center';
        container.style.padding = '20px';
        container.style.backgroundColor = '#0a0a14';
        container.style.color = '#ffffff';
        container.style.fontFamily = "'Orbitron', Arial, sans-serif";
        container.style.textAlign = 'center';
        container.style.zIndex = '1000';
        
        const title = document.createElement('h2');
        title.textContent = 'WebGL Not Available';
        title.style.color = '#ff4466';
        title.style.margin = '0 0 20px 0';
        
        const message = document.createElement('p');
        message.textContent = result.errorMessage || 'Your browser does not support WebGL, which is required for this application.';
        message.style.marginBottom = '15px';
        message.style.maxWidth = '600px';
        
        container.appendChild(title);
        container.appendChild(message);
        
        // Add recommendations
        const recommendations = document.createElement('div');
        recommendations.style.marginTop = '20px';
        recommendations.style.padding = '15px';
        recommendations.style.border = '1px solid rgba(255,255,255,0.2)';
        recommendations.style.borderRadius = '5px';
        recommendations.style.backgroundColor = 'rgba(0,0,0,0.3)';
        recommendations.style.maxWidth = '600px';
        
        const recTitle = document.createElement('h3');
        recTitle.textContent = 'Recommendations:';
        recTitle.style.margin = '0 0 10px 0';
        recTitle.style.fontSize = '16px';
        recTitle.style.color = '#44aaff';
        
        const recList = document.createElement('ul');
        recList.style.textAlign = 'left';
        recList.style.paddingLeft = '20px';
        
        const recommendations_text = [
            'Update your browser to the latest version',
            'Try a different browser like Chrome, Firefox, or Edge',
            'Make sure hardware acceleration is enabled in your browser settings',
            'Update your graphics drivers',
            'If you\'re using a VPN, try disabling it as it might interfere with WebGL'
        ];
        
        recommendations_text.forEach(text => {
            const item = document.createElement('li');
            item.textContent = text;
            item.style.margin = '5px 0';
            recList.appendChild(item);
        });
        
        recommendations.appendChild(recTitle);
        recommendations.appendChild(recList);
        container.appendChild(recommendations);
        
        // Add link to WebGL Report
        const linkContainer = document.createElement('div');
        linkContainer.style.marginTop = '20px';
        
        const link = document.createElement('a');
        link.href = 'https://get.webgl.org/';
        link.textContent = 'Test WebGL Support';
        link.target = '_blank';
        link.style.color = '#44aaff';
        link.style.textDecoration = 'none';
        link.style.padding = '8px 15px';
        link.style.border = '1px solid #44aaff';
        link.style.borderRadius = '4px';
        link.style.backgroundColor = 'rgba(68,170,255,0.1)';
        
        linkContainer.appendChild(link);
        container.appendChild(linkContainer);
        
        return container;
    }
    
    /**
     * Show warning notices in the UI for potential WebGL issues
     * @param {Array} warnings - List of warning messages
     * @returns {HTMLElement} - Warning element
     */
    static createWarningElement(warnings) {
        if (!warnings || warnings.length === 0) return null;
        
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.bottom = '10px';
        container.style.left = '10px';
        container.style.maxWidth = '400px';
        container.style.backgroundColor = 'rgba(0,0,0,0.7)';
        container.style.borderLeft = '3px solid #ffaa44';
        container.style.color = '#ffffff';
        container.style.padding = '10px 15px';
        container.style.fontFamily = 'Arial, sans-serif';
        container.style.fontSize = '12px';
        container.style.zIndex = '1000';
        container.style.borderRadius = '0 3px 3px 0';
        container.style.backdropFilter = 'blur(4px)';
        
        const title = document.createElement('div');
        title.textContent = 'Performance Notice';
        title.style.fontWeight = 'bold';
        title.style.marginBottom = '5px';
        title.style.color = '#ffaa44';
        container.appendChild(title);
        
        const list = document.createElement('ul');
        list.style.margin = '5px 0';
        list.style.paddingLeft = '20px';
        
        warnings.forEach(warning => {
            const item = document.createElement('li');
            item.textContent = warning;
            item.style.margin = '3px 0';
            list.appendChild(item);
        });
        
        container.appendChild(list);
        
        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '&times;';
        closeBtn.style.position = 'absolute';
        closeBtn.style.top = '5px';
        closeBtn.style.right = '5px';
        closeBtn.style.background = 'none';
        closeBtn.style.border = 'none';
        closeBtn.style.color = '#ffffff';
        closeBtn.style.fontSize = '16px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.padding = '0 5px';
        
        closeBtn.addEventListener('click', () => {
            container.style.display = 'none';
        });
        
        container.appendChild(closeBtn);
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            container.style.opacity = '0';
            container.style.transition = 'opacity 1s ease';
            
            // Remove from DOM after fade out
            setTimeout(() => {
                if (container.parentNode) {
                    container.parentNode.removeChild(container);
                }
            }, 1000);
        }, 10000);
        
        return container;
    }
} 