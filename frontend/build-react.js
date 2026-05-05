/**
 * Frontend: Build Script — Bundle React components for Electron.
 *
 * Simple bundler that doesn't require Webpack/Vite.
 * Strips require() calls — React/ReactDOM loaded as UMD globals.
 *
 * Wing: smartdoc_frontend
 * Topic: build_tools
 * Last Updated: 2026-05-05
 */

const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');

function bundleReact() {
    console.log('Building React components...');

    const componentsDir = path.join(__dirname, 'src/components');
    const servicesDir = path.join(__dirname, 'src/services');
    const outputDir = path.join(__dirname, 'public');
    const outputPath = path.join(outputDir, 'app.js');

    // Read React UMD source (production minified)
    const reactSrc = fs.readFileSync(
        path.join(__dirname, 'node_modules/react/umd/react.production.min.js'), 'utf-8');

    // Read ReactDOM UMD source (production minified)
    const reactDomSrc = fs.readFileSync(
        path.join(__dirname, 'node_modules/react-dom/umd/react-dom.production.min.js'), 'utf-8');

    // Read and clean component source
    const componentsContent = readComponents(componentsDir);

    // Read and clean service source
    const servicesContent = readServices(servicesDir);

    const bundleContent = `
// ===== React UMD (inlined) =====
${reactSrc}

// ===== ReactDOM UMD (inlined) =====
${reactDomSrc}

// ===== Services =====
${servicesContent}

// ===== Components =====
${componentsContent}

// ===== Initialize app =====
var root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    React.createElement(React.StrictMode, null,
        React.createElement(window.AppComponent, null)
    )
);
console.log('SmartDoc AI loaded successfully!');
`;

    fs.writeFileSync(outputPath, bundleContent.trimStart());
    console.log('React bundle created: app.js (' + (bundleContent.length / 1024).toFixed(0) + 'KB)');
}

function cleanSource(code) {
    // Remove CommonJS require lines for react/react-dom
    code = code.replace(/const\s+React\s*=\s*require\(['"]react['"]\);\s*/g, '');
    code = code.replace(/const\s+ReactDOM\s*=\s*require\(['"]react-dom['"]\);\s*/g, '');
    code = code.replace(/const\s+ReactDOM\s*=\s*require\(['"]react-dom\/client['"]\);\s*/g, '');

    // Replace require('../services/api').default with apiService
    code = code.replace(/const\s+\w+\s*=\s*require\(['"]\.\.\/services\/api['"]\)(?:\.default)?;\s*/g, '');
    // Rename ApiService. to apiService. (instance calls in component code)
    code = code.replace(/ApiService\./g, 'apiService.');

    // Replace require('./ComponentName').default with window reference
    code = code.replace(/const\s+(\w+)\s*=\s*require\(['"]\.\/(\w+)['"]\)(?:\.default)?;\s*/g,
        (match, varName, compName) => {
            return `const ${varName} = window.${compName}Component;\n`;
        });

    // Remove module.exports lines
    code = code.replace(/module\.exports\s*=.*;\s*/g, '');

    return code;
}

function readComponents(dir) {
    let content = '';

    // Ensure App.js comes LAST (it references other components)
    const files = fs.readdirSync(dir).sort((a, b) => {
        if (a === 'App.js') return 1;
        if (b === 'App.js') return -1;
        return a.localeCompare(b);
    });
    files.forEach(file => {
        if (file.endsWith('.js')) {
            const filePath = path.join(dir, file);
            let fileContent = fs.readFileSync(filePath, 'utf-8');

            // Transpile JSX to React.createElement
            const result = babel.transformSync(fileContent, {
                presets: ['@babel/preset-react'],
                compact: false,
                retainLines: true,
            });
            fileContent = result.code;

            // Extract class name
            const match = fileContent.match(/class (\w+)/);
            const className = match ? match[1] : file.replace('.js', '');

            // Clean the source
            fileContent = cleanSource(fileContent);

            content += `
// ${file}
(function() {
${fileContent}

window.${className}Component = ${className};
})();
`;
        }
    });

    return content;
}

function readServices(dir) {
    let content = '';

    const files = fs.readdirSync(dir);
    files.forEach(file => {
        if (file.endsWith('.js')) {
            const filePath = path.join(dir, file);
            let fileContent = fs.readFileSync(filePath, 'utf-8');

            // Clean require/module.exports from service files
            fileContent = cleanSource(fileContent);

            // Add global instance after class definition
            fileContent += '\nconst apiService = new ApiService();';

            content += `
// ${file}
${fileContent}
`;
        }
    });

    return content;
}

bundleReact();

// Also build Tailwind CSS
const { execSync } = require('child_process');
try {
    execSync('npx tailwindcss -i ./src/styles.css -o ./public/tailwind.css', {
        cwd: __dirname,
        stdio: 'inherit',
    });
} catch (e) {
    console.error('Tailwind build failed (non-fatal):', e.message);
}
