// Environment variable loader for browser apps
// - Tries multiple paths for the env file to avoid dotfile restrictions
// - Trims/cleans values
// - Falls back to query param (?api_key=...), localStorage('openai_api_key'), or window.OPENAI_API_KEY

let envVars = {};

async function loadEnv() {
    try {
        const candidatePaths = ['.env', '/.env', 'env', '/env', 'config.env'];
        let envText = '';
        let loadedFrom = '';

        for (const path of candidatePaths) {
            try {
                const resp = await fetch(path, { cache: 'no-store' });
                if (resp && resp.ok) {
                    envText = await resp.text();
                    loadedFrom = path;
                    break;
                }
            } catch (_) {
                // ignore and try next path
            }
        }

        if (envText) {
            const lines = envText.split('\n');
            lines.forEach(line => {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('#')) return;
                const [key, ...valueParts] = trimmed.split('=');
                if (!key || valueParts.length === 0) return;
                const value = valueParts
                    .join('=')
                    .trim()
                    .replace(/^['"]|['"]$/g, '')
                    .replace(/\r$/, '');
                envVars[key.trim()] = value;
            });
            console.log(`Environment variables loaded from ${loadedFrom}`);
        } else {
            console.warn('Could not fetch .env; will try fallback sources');
        }

        // Fallback 1: query parameter
        try {
            const url = new URL(window.location.href);
            const qpKey = url.searchParams.get('api_key');
            if (qpKey && (!envVars['OPENAI_API_KEY'] || envVars['OPENAI_API_KEY'].length < 20)) {
                envVars['OPENAI_API_KEY'] = qpKey.trim();
                console.log('OPENAI_API_KEY loaded from query parameter');
            }
        } catch (_) {}

        // Fallback 2: localStorage
        if (!envVars['OPENAI_API_KEY'] || envVars['OPENAI_API_KEY'].length < 20) {
            try {
                const lsKey = localStorage.getItem('openai_api_key');
                if (lsKey) {
                    envVars['OPENAI_API_KEY'] = lsKey.trim();
                    console.log('OPENAI_API_KEY loaded from localStorage');
                }
            } catch (_) {}
        }

        // Fallback 3: global window variable
        if ((!envVars['OPENAI_API_KEY'] || envVars['OPENAI_API_KEY'].length < 20) && typeof window.OPENAI_API_KEY === 'string') {
            envVars['OPENAI_API_KEY'] = window.OPENAI_API_KEY.trim();
            console.log('OPENAI_API_KEY loaded from window.OPENAI_API_KEY');
        }

        // Validate and warn if needed
        if (envVars['OPENAI_API_KEY'] && envVars['OPENAI_API_KEY'].startsWith('sk-')) {
            console.log('API key available for use');
        } else {
            console.warn('OPENAI_API_KEY not found or invalid');
            showApiWarning();
        }

        return envVars;
    } catch (error) {
        console.error('Error loading environment variables:', error);
        showApiWarning();
        return {};
    }
}

function showApiWarning() {
    const warningDiv = document.createElement('div');
    warningDiv.className = 'api-warning';
    warningDiv.innerHTML = `
        <div class="api-warning-content">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>مفتاح API غير موجود</h3>
            <p>يرجى التأكد من وجود مفتاح OpenAI API في ملف .env</p>
            <p>يمكنك إنشاء مفتاح جديد من <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener">لوحة OpenAI</a></p>
            <button id="close-warning" class="btn btn-primary">إغلاق</button>
        </div>
    `;

    // basic styles inline to avoid CSS dependency
    warningDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        direction: rtl;
    `;

    const contentDiv = warningDiv.querySelector('.api-warning-content');
    if (contentDiv) {
        contentDiv.style.cssText = `
            background-color: white;
            color: #333;
            padding: 30px;
            border-radius: 10px;
            max-width: 520px;
            text-align: center;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        `;
        const icon = contentDiv.querySelector('i');
        if (icon) {
            icon.style.cssText = `
                font-size: 48px;
                color: #f39c12;
                margin-bottom: 15px;
            `;
        }
        const heading = contentDiv.querySelector('h3');
        if (heading) {
            heading.style.cssText = `
                margin: 0 0 15px;
                color: #e74c3c;
            `;
        }
        const paragraphs = contentDiv.querySelectorAll('p');
        paragraphs.forEach(p => {
            p.style.cssText = `
                margin: 10px 0;
                line-height: 1.5;
            `;
        });
        const link = contentDiv.querySelector('a');
        if (link) {
            link.style.cssText = `
                color: #3498db;
                text-decoration: none;
            `;
        }
        const button = contentDiv.querySelector('button');
        if (button) {
            button.style.cssText = `
                background-color: #3498db;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                margin-top: 15px;
                font-weight: bold;
            `;
            button.addEventListener('click', () => {
                document.body.removeChild(warningDiv);
            });
        }
    }

    document.body.appendChild(warningDiv);
}

function getEnvVar(key) {
    return envVars[key] || '';
}

window.loadEnv = loadEnv;
window.getEnvVar = getEnvVar;

document.addEventListener('DOMContentLoaded', async function () {
    try {
        await loadEnv();
        if (Object.keys(envVars).length === 0) {
            console.warn('No environment variables loaded');
            showApiWarning();
        } else if (!envVars['OPENAI_API_KEY']) {
            console.warn('OPENAI_API_KEY not found in environment variables');
            showApiWarning();
        } else {
            console.log('Environment variables loaded successfully, including OPENAI_API_KEY');
        }
    } catch (error) {
        console.error('Error loading environment variables:', error);
        showApiWarning();
    }
});

