const defaultConfig = {
    company_name: "Nexzen Property Solutions INC.",
    tagline: "Professional Property Management in Florida",
    hero_title: "Your Trusted Property Management Partner",
    hero_subtitle: "Licensed in Florida • In-house technicians • 24/7 emergency response",
    services_title: "Our Premium Services",
    contact_title: "Get in Touch",
    footer_text: "© 2024 Nexzen Property Solutions INC. All rights reserved.",
    background_color: "#f9fafb",
    surface_color: "#ffffff",
    text_color: "#111827",
    primary_action_color: "#0ea5e9",
    secondary_action_color: "#14b8a6",
    font_family: "Inter",
    font_size: 16
};

let currentRecordCount = 0;
let allRecords = [];
let baseCustomerCount = 2215;
let currentCustomerCount = baseCustomerCount;

const dataHandler = {
    onDataChanged(data) {
        allRecords = data;
        currentRecordCount = data.length;

        const contacts = data.filter(r => r.type === 'contact');
        const customerRecords = data.filter(r => r.type === 'customer_count');

        // Update customer counter - every visit counts
        const newCount = baseCustomerCount + customerRecords.length;
        if (newCount > currentCustomerCount) {
            currentCustomerCount = newCount;
            animateCounter();
        } else {
            currentCustomerCount = newCount;
            updateCounterDisplay();
        }

        renderSubmissions(contacts);
    }
};

// Initialize customer counter tracker
async function initCustomerCounter() {
    if (!window.dataSdk) return;

    const result = await window.dataSdk.init(dataHandler);
    if (!result.isOk) {
        console.error("Failed to initialize Data SDK");
        return;
    }

    // Every visit counts as a new customer - no localStorage check
    // Create new customer record for every page visit
    const visitorRecord = {
        type: 'customer_count',
        id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
        visitedAt: new Date().toISOString()
    };

    await window.dataSdk.create(visitorRecord);
}

function animateCounter() {
    const counterElement = document.getElementById('customer-counter');
    if (!counterElement) return;

    const start = Math.max(baseCustomerCount, currentCustomerCount - 1);
    const end = currentCustomerCount;
    const duration = 1500;
    const startTime = performance.now();

    // Add pulsing animation effect
    counterElement.style.transform = 'scale(1.15)';
    counterElement.style.transition = 'transform 0.3s ease';
    counterElement.style.color = '#14B8A6';

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(start + (end - start) * easeProgress);
        counterElement.textContent = current.toLocaleString() + '+';

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            counterElement.textContent = end.toLocaleString() + '+';
            // Reset scale after animation
            setTimeout(() => {
                counterElement.style.transform = 'scale(1)';
                counterElement.style.color = '';
            }, 300);
        }
    }

    requestAnimationFrame(update);
}

function updateCounterDisplay() {
    const counterElement = document.getElementById('customer-counter');
    counterElement.textContent = currentCustomerCount.toLocaleString() + '+';
}

initCustomerCounter();

function renderSubmissions(submissions) {
    const container = document.getElementById('submissions-list');
    const emptyState = document.getElementById('submissions-empty');

    if (submissions.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';
    const sorted = [...submissions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    container.innerHTML = sorted.map(sub => `
      <div class="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover-lift">
        <div class="flex justify-between items-start mb-4">
          <div>
            <div class="font-bold text-xl text-gray-900">${sub.name}</div>
            <div class="text-sm text-gray-500">${new Date(sub.createdAt).toLocaleString()}</div>
          </div>
          <button onclick="deleteRecord('${sub.__backendId}')" class="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition font-semibold">Delete</button>
        </div>
        <div class="grid md:grid-cols-2 gap-4 text-sm">
          <div><span class="font-semibold text-gray-700">Email:</span> <span class="text-gray-600">${sub.email}</span></div>
          <div><span class="font-semibold text-gray-700">Phone:</span> <span class="text-gray-600">${sub.phone}</span></div>
          <div class="md:col-span-2"><span class="font-semibold text-gray-700">Service:</span> <span class="text-gray-600">${sub.service}</span></div>
          <div class="md:col-span-2"><span class="font-semibold text-gray-700">Message:</span> <span class="text-gray-600">${sub.message}</span></div>
        </div>
      </div>
    `).join('');
}

async function deleteRecord(backendId) {
    const record = allRecords.find(r => r.__backendId === backendId);
    if (!record) return;

    const btn = event.target;
    const originalText = btn.textContent;
    btn.textContent = 'Deleting...';
    btn.disabled = true;

    const result = await window.dataSdk.delete(record);

    if (!result.isOk) {
        btn.textContent = originalText;
        btn.disabled = false;
        showStatus('form-status', 'Failed to delete record', 'error');
    }
}

document.getElementById('contact-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    if (currentRecordCount >= 999) {
        showStatus('form-status', 'Maximum limit reached. Please contact administrator.', 'error');
        return;
    }

    const submitBtn = document.getElementById('submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;

    const formData = {
        type: 'contact',
        id: Date.now().toString(),
        name: document.getElementById('form-name').value,
        email: document.getElementById('form-email').value,
        phone: document.getElementById('form-phone').value,
        service: document.getElementById('form-service').value,
        message: document.getElementById('form-message').value,
        createdAt: new Date().toISOString()
    };

    const result = await window.dataSdk.create(formData);

    submitBtn.disabled = false;
    submitBtn.textContent = originalText;

    if (result.isOk) {
        showStatus('form-status', 'Message sent! We\'ll respond within 24 hours.', 'success');
        document.getElementById('contact-form').reset();
    } else {
        showStatus('form-status', 'Failed to send message. Please try again.', 'error');
    }
});

function showStatus(elementId, message, type) {
    const statusEl = document.getElementById(elementId);
    statusEl.textContent = message;
    statusEl.className = `text-center font-semibold ${type === 'success' ? 'text-green-600' : 'text-red-600'}`;
    setTimeout(() => {
        statusEl.textContent = '';
    }, 5000);
}

document.getElementById('check-zip-btn').addEventListener('click', function (e) {
    e.preventDefault();
    const zip = document.getElementById('zip-input').value.trim();
    const resultEl = document.getElementById('zip-result');

    if (zip.length !== 5 || isNaN(zip)) {
        resultEl.innerHTML = '<div class="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg"><strong>Invalid ZIP code.</strong> Please enter a valid 5-digit ZIP code.</div>';
        return;
    }

    const zipNum = parseInt(zip);
    // Florida ZIP codes: 32000-34999 and 33000-33999
    const inRange = (zipNum >= 32000 && zipNum <= 34999);

    if (inRange) {
        resultEl.innerHTML = '<div class="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-lg"><strong>✓ Great news!</strong> We serve your area. Contact us to get started today.</div>';
    } else {
        resultEl.innerHTML = '<div class="p-4 bg-gray-50 border-l-4 border-gray-400 text-gray-700 rounded-lg">This ZIP code may be outside our current service area. Contact us to confirm availability.</div>';
    }
});

document.getElementById('mobile-menu-btn').addEventListener('click', function () {
    document.getElementById('mobile-menu').classList.toggle('hidden');
});

document.getElementById('login-nav-btn').addEventListener('click', function () {
    openLoginModal();
});

document.getElementById('login-mobile-btn').addEventListener('click', function () {
    document.getElementById('mobile-menu').classList.add('hidden');
    openLoginModal();
});

function openLoginModal() {
    document.getElementById('login-modal').classList.remove('hidden');
    showLoginForm();
}

function closeLoginModal() {
    document.getElementById('login-modal').classList.add('hidden');
}

function showLoginForm() {
    document.getElementById('login-form-container').classList.remove('hidden');
    document.getElementById('signup-form-container').classList.add('hidden');
}

function showSignupForm() {
    document.getElementById('login-form-container').classList.add('hidden');
    document.getElementById('signup-form-container').classList.remove('hidden');
}

document.getElementById('login-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const btn = document.getElementById('login-submit-btn');
    const originalText = btn.textContent;

    btn.textContent = 'Logging in...';
    btn.disabled = true;

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Find user in database
    const user = allRecords.find(r => r.type === 'user' && r.email === email && r.password === password);

    btn.disabled = false;
    btn.textContent = originalText;

    if (user) {
        showStatus('login-status', 'Login successful! Welcome back, ' + user.firstName + '!', 'success');
        setTimeout(() => {
            closeLoginModal();
            document.getElementById('login-form').reset();
        }, 1500);
    } else {
        showStatus('login-status', 'Invalid email or password. Please try again.', 'error');
    }
});

document.getElementById('signup-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    if (currentRecordCount >= 999) {
        showStatus('signup-status', 'Maximum accounts reached. Please contact us.', 'error');
        return;
    }

    const email = document.getElementById('signup-email').value;

    // Check if email already exists
    const existingUser = allRecords.find(r => r.type === 'user' && r.email === email);
    if (existingUser) {
        showStatus('signup-status', 'This email is already registered. Please login instead.', 'error');
        return;
    }

    const btn = document.getElementById('signup-submit-btn');
    const originalText = btn.textContent;

    btn.textContent = 'Creating account...';
    btn.disabled = true;

    const userData = {
        type: 'user',
        id: Date.now().toString(),
        firstName: document.getElementById('signup-firstname').value,
        lastName: document.getElementById('signup-lastname').value,
        email: email,
        phone: document.getElementById('signup-phone').value,
        propertyAddress: document.getElementById('signup-address').value,
        password: document.getElementById('signup-password').value,
        createdAt: new Date().toISOString()
    };

    const result = await window.dataSdk.create(userData);

    btn.disabled = false;
    btn.textContent = originalText;

    if (result.isOk) {
        showStatus('signup-status', 'Account created successfully! You can now login.', 'success');
        document.getElementById('signup-form').reset();
        setTimeout(() => {
            showLoginForm();
        }, 2000);
    } else {
        showStatus('signup-status', 'Failed to create account. Please try again.', 'error');
    }
});

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-8 right-8 bg-gray-900 text-white px-6 py-4 rounded-xl shadow-2xl z-50 max-w-sm';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

async function onConfigChange(config) {
    const customFont = config.font_family || defaultConfig.font_family;
    const baseFontStack = 'Inter, system-ui, -apple-system, sans-serif';
    const baseSize = config.font_size || defaultConfig.font_size;

    document.body.style.fontFamily = `${customFont}, ${baseFontStack}`;

    document.querySelectorAll('h1').forEach(el => el.style.fontSize = `${baseSize * 3}px`);
    document.querySelectorAll('h2').forEach(el => el.style.fontSize = `${baseSize * 2.5}px`);
    document.querySelectorAll('h3').forEach(el => el.style.fontSize = `${baseSize * 1.5}px`);

    const bgColor = config.background_color || defaultConfig.background_color;
    const surfaceColor = config.surface_color || defaultConfig.surface_color;
    const textColor = config.text_color || defaultConfig.text_color;

    document.body.style.backgroundColor = bgColor;
    document.querySelectorAll('.bg-white').forEach(el => el.style.backgroundColor = surfaceColor);
    document.querySelectorAll('.text-gray-900').forEach(el => el.style.color = textColor);

    document.getElementById('nav-company-name').textContent = config.company_name || defaultConfig.company_name;
    document.getElementById('nav-tagline').textContent = config.tagline || defaultConfig.tagline;
    document.getElementById('hero-title').textContent = config.hero_title || defaultConfig.hero_title;
    document.getElementById('hero-subtitle').textContent = config.hero_subtitle || defaultConfig.hero_subtitle;
    document.getElementById('services-title').textContent = config.services_title || defaultConfig.services_title;
    document.getElementById('contact-title').textContent = config.contact_title || defaultConfig.contact_title;
    document.getElementById('footer-text').textContent = config.footer_text || defaultConfig.footer_text;
}

if (window.elementSdk) {
    window.elementSdk.init({
        defaultConfig,
        onConfigChange,
        mapToCapabilities: (config) => ({
            recolorables: [
                {
                    get: () => config.background_color || defaultConfig.background_color,
                    set: (value) => {
                        window.elementSdk.config.background_color = value;
                        window.elementSdk.setConfig({ background_color: value });
                    }
                },
                {
                    get: () => config.surface_color || defaultConfig.surface_color,
                    set: (value) => {
                        window.elementSdk.config.surface_color = value;
                        window.elementSdk.setConfig({ surface_color: value });
                    }
                },
                {
                    get: () => config.text_color || defaultConfig.text_color,
                    set: (value) => {
                        window.elementSdk.config.text_color = value;
                        window.elementSdk.setConfig({ text_color: value });
                    }
                },
                {
                    get: () => config.primary_action_color || defaultConfig.primary_action_color,
                    set: (value) => {
                        window.elementSdk.config.primary_action_color = value;
                        window.elementSdk.setConfig({ primary_action_color: value });
                    }
                },
                {
                    get: () => config.secondary_action_color || defaultConfig.secondary_action_color,
                    set: (value) => {
                        window.elementSdk.config.secondary_action_color = value;
                        window.elementSdk.setConfig({ secondary_action_color: value });
                    }
                }
            ],
            borderables: [],
            fontEditable: {
                get: () => config.font_family || defaultConfig.font_family,
                set: (value) => {
                    window.elementSdk.config.font_family = value;
                    window.elementSdk.setConfig({ font_family: value });
                }
            },
            fontSizeable: {
                get: () => config.font_size || defaultConfig.font_size,
                set: (value) => {
                    window.elementSdk.config.font_size = value;
                    window.elementSdk.setConfig({ font_size: value });
                }
            }
        }),
        mapToEditPanelValues: (config) => new Map([
            ["company_name", config.company_name || defaultConfig.company_name],
            ["tagline", config.tagline || defaultConfig.tagline],
            ["hero_title", config.hero_title || defaultConfig.hero_title],
            ["hero_subtitle", config.hero_subtitle || defaultConfig.hero_subtitle],
            ["services_title", config.services_title || defaultConfig.services_title],
            ["contact_title", config.contact_title || defaultConfig.contact_title],
            ["footer_text", config.footer_text || defaultConfig.footer_text]
        ])
    });
}