const CONFIG = {
    HASH: "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4",
    SALT: "vault_nexus_v5_secure",
    ITERATIONS: 350000,
    MAX_FILE_SIZE: 5242880,
    MAX_TOTAL_STORAGE: 52428800,
    SESSION_TIMEOUT: 1800000,
    AUTO_SAVE_INTERVAL: 30000,
    MAX_FAILED_ATTEMPTS: 5,
    LOCKOUT_DURATION: 86400000,
    STORAGE_KEYS: {
        NOTES: "vn5_notes",
        PASSWORDS: "vn5_passwords",
        FILES: "vn5_files",
        VAULT_CREATED: "vn5_created",
        LAST_ACCESS: "vn5_last_access",
        FAILED_ATTEMPTS: "vn5_failed_attempts",
        LOCKOUT_UNTIL: "vn5_lockout_until"
    }
};

class VaultNexus {
    constructor() {
        this.encryptionKey = null;
        this.sessionTimer = null;
        this.sessionStart = null;
        this.autoSaveTimer = null;
        this.currentView = "notes";
        this.passwords = [];
        this.files = [];
        
        this.initUI();
        this.checkLockout();
        this.attachEventListeners();
        this.initAnimations();
    }

    initUI() {
        this.ui = {
            lockScreen: document.getElementById("lock-screen"),
            vaultScreen: document.getElementById("vault-screen"),
            passwordInput: document.getElementById("password"),
            unlockBtn: document.getElementById("unlock"),
            statusText: document.getElementById("status"),
            lockoutStatus: document.getElementById("lockout-status"),
            vaultInput: document.getElementById("vault-input"),
            saveBtn: document.getElementById("save-btn"),
            logoutBtn: document.getElementById("logout"),
            container: document.querySelector(".vault-container"),
            strengthFill: document.querySelector(".strength-fill"),
            charCount: document.getElementById("char-count"),
            wordCount: document.getElementById("word-count"),
            timer: document.getElementById("timer"),
            sidebarBtns: document.querySelectorAll(".sidebar-btn"),
            viewContents: document.querySelectorAll(".view-content"),
            pwdService: document.getElementById("pwd-service"),
            pwdUsername: document.getElementById("pwd-username"),
            pwdPassword: document.getElementById("pwd-password"),
            pwdStrengthFill: document.getElementById("pwd-strength-fill"),
            pwdStrengthText: document.getElementById("pwd-strength-text"),
            addPwdBtn: document.getElementById("add-pwd-btn"),
            generatePwdBtn: document.getElementById("generate-pwd-btn"),
            togglePwdVisibility: document.getElementById("toggle-pwd-visibility"),
            passwordList: document.getElementById("password-list"),
            fileInput: document.getElementById("file-input"),
            fileDropZone: document.getElementById("file-drop-zone"),
            fileList: document.getElementById("file-list"),
            storageUsed: document.getElementById("storage-used"),
            totalPasswords: document.getElementById("total-passwords"),
            totalFiles: document.getElementById("total-files"),
            totalNotes: document.getElementById("total-notes"),
            vaultAge: document.getElementById("vault-age"),
            exportBtn: document.getElementById("export-btn"),
            notificationContainer: document.getElementById("notification-container"),
            modal: document.getElementById("modal"),
            modalTitle: document.getElementById("modal-title"),
            modalMessage: document.getElementById("modal-message"),
            modalInputContainer: document.getElementById("modal-input-container"),
            modalConfirm: document.getElementById("modal-confirm"),
            modalCancel: document.getElementById("modal-cancel"),
            lockCanvas: document.getElementById("lock-canvas")
        };
    }

    checkLockout() {
        const lockoutUntil = localStorage.getItem(CONFIG.STORAGE_KEYS.LOCKOUT_UNTIL);
        if (lockoutUntil) {
            const remaining = parseInt(lockoutUntil) - Date.now();
            if (remaining > 0) {
                this.showLockout(remaining);
                this.ui.unlockBtn.disabled = true;
                this.ui.passwordInput.disabled = true;
                return true;
            } else {
                localStorage.removeItem(CONFIG.STORAGE_KEYS.LOCKOUT_UNTIL);
                localStorage.removeItem(CONFIG.STORAGE_KEYS.FAILED_ATTEMPTS);
            }
        }
        return false;
    }

    showLockout(remaining) {
        const hours = Math.floor(remaining / 3600000);
        const minutes = Math.floor((remaining % 3600000) / 60000);
        this.ui.lockoutStatus.textContent = `LOCKED OUT - ${hours}h ${minutes}m remaining`;
        this.ui.lockoutStatus.classList.remove("hidden");
        this.ui.statusText.textContent = "TOO MANY FAILED ATTEMPTS";
        
        setTimeout(() => {
            if (this.checkLockout() === false) {
                location.reload();
            } else {
                this.showLockout(remaining - 60000);
            }
        }, 60000);
    }

    attachEventListeners() {
        this.ui.unlockBtn.addEventListener("click", () => this.authenticate());
        this.ui.passwordInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") this.authenticate();
        });
        this.ui.passwordInput.addEventListener("input", () => this.updateStrengthBar());
        
        this.ui.saveBtn.addEventListener("click", () => this.saveAllData());
        this.ui.logoutBtn.addEventListener("click", () => this.logout());
        this.ui.exportBtn.addEventListener("click", () => this.exportData());
        
        this.ui.vaultInput.addEventListener("input", () => this.updateCharCount());
        
        this.ui.sidebarBtns.forEach(btn => {
            btn.addEventListener("click", () => this.switchView(btn.dataset.view));
        });
        
        this.ui.addPwdBtn.addEventListener("click", () => this.addPassword());
        this.ui.generatePwdBtn.addEventListener("click", () => this.generatePassword());
        this.ui.togglePwdVisibility.addEventListener("click", () => this.togglePasswordVisibility());
        this.ui.pwdPassword.addEventListener("input", () => this.checkPasswordStrength());
        
        this.ui.fileDropZone.addEventListener("click", () => this.ui.fileInput.click());
        this.ui.fileInput.addEventListener("change", (e) => this.handleFileUpload(e));
        this.setupFileDragDrop();
        
        this.ui.modalCancel.addEventListener("click", () => this.hideModal());
    }

    initAnimations() {
        this.createParticles();
        this.animateLockCanvas();
    }

    createParticles() {
        const particleField = document.querySelector(".particle-field");
        for (let i = 0; i < 15; i++) {
            const particle = document.createElement("div");
            particle.style.position = "absolute";
            particle.style.width = "2px";
            particle.style.height = "2px";
            particle.style.background = i % 2 === 0 ? "#00ffcc" : "#0088ff";
            particle.style.borderRadius = "50%";
            particle.style.left = Math.random() * 100 + "%";
            particle.style.top = Math.random() * 100 + "%";
            particle.style.opacity = "0.4";
            particle.style.animation = `float ${15 + Math.random() * 10}s linear infinite`;
            particle.style.animationDelay = Math.random() * 5 + "s";
            particleField.appendChild(particle);
        }
    }

    animateLockCanvas() {
        if (!this.ui.lockCanvas) return;
        
        const canvas = this.ui.lockCanvas;
        const ctx = canvas.getContext("2d");
        const dpr = window.devicePixelRatio || 1;
        
        canvas.width = canvas.offsetWidth * dpr;
        canvas.height = canvas.offsetHeight * dpr;
        ctx.scale(dpr, dpr);
        
        const particles = [];
        for (let i = 0; i < 25; i++) {
            particles.push({
                x: Math.random() * canvas.offsetWidth,
                y: Math.random() * canvas.offsetHeight,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                r: Math.random() * 2 + 1
            });
        }
        
        const animate = () => {
            ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
            
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                
                if (p.x < 0 || p.x > canvas.offsetWidth) p.vx *= -1;
                if (p.y < 0 || p.y > canvas.offsetHeight) p.vy *= -1;
                
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(0, 255, 204, 0.3)";
                ctx.fill();
                
                particles.forEach(p2 => {
                    const dx = p.x - p2.x;
                    const dy = p.y - p2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist < 100) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.strokeStyle = `rgba(0, 255, 204, ${0.1 * (1 - dist / 100)})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                });
            });
            
            if (this.ui.lockScreen.classList.contains("active")) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }

    updateStrengthBar() {
        const length = this.ui.passwordInput.value.length;
        const strength = Math.min((length / 8) * 100, 100);
        this.ui.strengthFill.style.width = strength + "%";
    }

    async authenticate() {
        if (this.checkLockout()) return;
        
        const pin = this.ui.passwordInput.value;
        
        if (!pin) {
            this.showStatus("ENTER PIN");
            return;
        }

        this.ui.unlockBtn.classList.add("loading");
        this.showStatus("AUTHENTICATING...");

        setTimeout(async () => {
            try {
                const hash = await this.sha256(pin);

                if (hash === CONFIG.HASH) {
                    localStorage.removeItem(CONFIG.STORAGE_KEYS.FAILED_ATTEMPTS);
                    this.encryptionKey = await this.deriveKey(pin);
                    await this.unlockVault();
                } else {
                    this.handleFailedAttempt();
                }
            } catch (error) {
                console.error("Authentication error:", error);
                this.showStatus("AUTHENTICATION ERROR");
            } finally {
                this.ui.unlockBtn.classList.remove("loading");
            }
        }, 800);
    }

    handleFailedAttempt() {
        const attempts = parseInt(localStorage.getItem(CONFIG.STORAGE_KEYS.FAILED_ATTEMPTS) || "0") + 1;
        localStorage.setItem(CONFIG.STORAGE_KEYS.FAILED_ATTEMPTS, attempts.toString());
        
        const remaining = CONFIG.MAX_FAILED_ATTEMPTS - attempts;
        
        if (attempts >= CONFIG.MAX_FAILED_ATTEMPTS) {
            const lockoutUntil = Date.now() + CONFIG.LOCKOUT_DURATION;
            localStorage.setItem(CONFIG.STORAGE_KEYS.LOCKOUT_UNTIL, lockoutUntil.toString());
            this.showLockout(CONFIG.LOCKOUT_DURATION);
            this.ui.unlockBtn.disabled = true;
            this.ui.passwordInput.disabled = true;
        } else {
            this.showStatus(`ACCESS DENIED - ${remaining} ATTEMPTS REMAINING`);
            this.ui.container.classList.add("shake");
            setTimeout(() => this.ui.container.classList.remove("shake"), 400);
        }
    }

    async unlockVault() {
        this.ui.lockScreen.classList.remove("active");
        this.ui.vaultScreen.classList.add("active");
        this.sessionStart = Date.now();
        this.startSessionTimer();
        await this.loadAllData();
        this.updateAnalytics();
        this.showNotification("Vault unlocked successfully", "success");
        
        if (!localStorage.getItem(CONFIG.STORAGE_KEYS.VAULT_CREATED)) {
            localStorage.setItem(CONFIG.STORAGE_KEYS.VAULT_CREATED, Date.now().toString());
        }
        localStorage.setItem(CONFIG.STORAGE_KEYS.LAST_ACCESS, Date.now().toString());
    }

    startSessionTimer() {
        this.updateTimerDisplay();
        this.sessionTimer = setInterval(() => {
            const elapsed = Date.now() - this.sessionStart;
            if (elapsed >= CONFIG.SESSION_TIMEOUT) {
                this.showNotification("Session timeout - Auto logout", "warning");
                setTimeout(() => this.logout(true), 2000);
            } else {
                this.updateTimerDisplay();
            }
        }, 1000);
        
        this.autoSaveTimer = setInterval(() => {
            this.saveAllData(true);
        }, CONFIG.AUTO_SAVE_INTERVAL);
    }

    updateTimerDisplay() {
        const elapsed = Math.floor((Date.now() - this.sessionStart) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        this.ui.timer.textContent = 
            `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    switchView(view) {
        this.currentView = view;
        this.ui.sidebarBtns.forEach(btn => {
            btn.classList.toggle("active", btn.dataset.view === view);
        });
        this.ui.viewContents.forEach(content => {
            content.classList.toggle("active", content.id === `${view}-view`);
        });
    }

    updateCharCount() {
        const text = this.ui.vaultInput.value;
        const charCount = text.length;
        const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
        
        this.ui.charCount.textContent = charCount + " / 50000";
        this.ui.wordCount.textContent = wordCount + " words";
        
        if (charCount > 45000) {
            this.ui.charCount.style.color = "var(--danger)";
        } else {
            this.ui.charCount.style.color = "var(--text-muted)";
        }
    }

    async saveAllData(isAutoSave = false) {
        if (!this.encryptionKey) return;

        if (!isAutoSave) {
            this.ui.saveBtn.classList.add("loading");
        }

        try {
            await this.saveNotes();
            await this.savePasswords();
            await this.saveFiles();
            
            if (!isAutoSave) {
                this.showNotification("All data encrypted and saved", "success");
            }
        } catch (error) {
            console.error("Save error:", error);
            this.showNotification("Save error - Please try again", "error");
        } finally {
            if (!isAutoSave) {
                this.ui.saveBtn.classList.remove("loading");
            }
        }
    }

    async loadAllData() {
        try {
            await this.loadNotes();
            await this.loadPasswords();
            await this.loadFiles();
        } catch (error) {
            console.error("Load error:", error);
            this.showNotification("Error loading vault data", "error");
        }
    }

    async saveNotes() {
        const notes = this.ui.vaultInput.value;
        if (notes) {
            const encrypted = await this.encryptData(notes);
            localStorage.setItem(CONFIG.STORAGE_KEYS.NOTES, JSON.stringify(encrypted));
        } else {
            localStorage.removeItem(CONFIG.STORAGE_KEYS.NOTES);
        }
    }

    async loadNotes() {
        const stored = localStorage.getItem(CONFIG.STORAGE_KEYS.NOTES);
        if (stored) {
            try {
                const encrypted = JSON.parse(stored);
                this.ui.vaultInput.value = await this.decryptData(encrypted);
                this.updateCharCount();
            } catch (error) {
                console.error("Note decryption error:", error);
                this.showNotification("Note decryption failed", "error");
            }
        }
    }

    generatePassword() {
        const length = 18;
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
        let password = "";
        const array = new Uint32Array(length);
        crypto.getRandomValues(array);
        for (let i = 0; i < length; i++) {
            password += charset[array[i] % charset.length];
        }
        this.ui.pwdPassword.value = password;
        this.checkPasswordStrength();
        this.showNotification("Secure password generated", "success");
    }

    togglePasswordVisibility() {
        const input = this.ui.pwdPassword;
        const svg = this.ui.togglePwdVisibility.querySelector("svg");
        
        if (input.type === "password") {
            input.type = "text";
            svg.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';
        } else {
            input.type = "password";
            svg.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
        }
    }

    checkPasswordStrength() {
        const password = this.ui.pwdPassword.value;
        let strength = 0;
        
        if (password.length >= 8) strength += 25;
        if (password.length >= 12) strength += 25;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 20;
        if (/[0-9]/.test(password)) strength += 15;
        if (/[^a-zA-Z0-9]/.test(password)) strength += 15;
        
        this.ui.pwdStrengthFill.style.width = strength + "%";
        
        if (strength < 40) {
            this.ui.pwdStrengthFill.style.background = "var(--danger)";
            this.ui.pwdStrengthText.textContent = "Weak password";
        } else if (strength < 70) {
            this.ui.pwdStrengthFill.style.background = "var(--warning)";
            this.ui.pwdStrengthText.textContent = "Medium strength";
        } else {
            this.ui.pwdStrengthFill.style.background = "var(--success)";
            this.ui.pwdStrengthText.textContent = "Strong password";
        }
    }

    async addPassword() {
        const service = this.ui.pwdService.value.trim();
        const username = this.ui.pwdUsername.value.trim();
        const password = this.ui.pwdPassword.value;

        if (!service || !username || !password) {
            this.showNotification("Fill all password fields", "error");
            return;
        }

        const pwd = {
            id: Date.now(),
            service,
            username,
            password,
            created: Date.now()
        };

        this.passwords.push(pwd);
        this.ui.pwdService.value = "";
        this.ui.pwdUsername.value = "";
        this.ui.pwdPassword.value = "";
        this.ui.pwdStrengthFill.style.width = "0%";
        this.ui.pwdStrengthText.textContent = "Enter password";
        
        this.renderPasswords();
        await this.savePasswords();
        this.updateAnalytics();
        this.showNotification("Password added successfully", "success");
    }

    async savePasswords() {
        if (this.passwords.length > 0) {
            const encrypted = await this.encryptData(JSON.stringify(this.passwords));
            localStorage.setItem(CONFIG.STORAGE_KEYS.PASSWORDS, JSON.stringify(encrypted));
        } else {
            localStorage.removeItem(CONFIG.STORAGE_KEYS.PASSWORDS);
        }
    }

    async loadPasswords() {
        const stored = localStorage.getItem(CONFIG.STORAGE_KEYS.PASSWORDS);
        if (stored) {
            try {
                const encrypted = JSON.parse(stored);
                const decrypted = await this.decryptData(encrypted);
                this.passwords = JSON.parse(decrypted);
            } catch (error) {
                console.error("Password decryption error:", error);
                this.passwords = [];
                this.showNotification("Failed to decrypt passwords", "error");
            }
        }
        this.renderPasswords();
    }

    renderPasswords() {
        this.ui.passwordList.innerHTML = "";
        
        if (this.passwords.length === 0) {
            this.ui.passwordList.innerHTML = 
                '<div style="padding: 30px; text-align: center; color: var(--text-muted);">No passwords stored</div>';
            return;
        }

        this.passwords.forEach(pwd => {
            const item = document.createElement("div");
            item.className = "password-item";
            item.innerHTML = `
                <div class="pwd-info">
                    <div class="pwd-service">${this.escapeHtml(pwd.service)}</div>
                    <div class="pwd-username">${this.escapeHtml(pwd.username)}</div>
                </div>
                <div class="pwd-actions">
                    <button class="icon-btn" data-id="${pwd.id}" data-action="copy">
                        <svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                    </button>
                    <button class="icon-btn" data-id="${pwd.id}" data-action="delete">
                        <svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            `;
            
            item.querySelector('[data-action="copy"]').addEventListener("click", () => {
                this.copyPassword(pwd.password);
            });
            
            item.querySelector('[data-action="delete"]').addEventListener("click", () => {
                this.deletePassword(pwd.id);
            });
            
            this.ui.passwordList.appendChild(item);
        });
    }

    copyPassword(password) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(password).then(() => {
                this.showNotification("Password copied to clipboard", "success");
            }).catch(() => {
                this.fallbackCopy(password);
            });
        } else {
            this.fallbackCopy(password);
        }
    }

    fallbackCopy(text) {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand("copy");
            this.showNotification("Password copied to clipboard", "success");
        } catch (error) {
            this.showNotification("Copy failed", "error");
        }
        document.body.removeChild(textarea);
    }

    async deletePassword(id) {
        this.passwords = this.passwords.filter(p => p.id !== id);
        this.renderPasswords();
        await this.savePasswords();
        this.updateAnalytics();
        this.showNotification("Password deleted", "success");
    }

    setupFileDragDrop() {
        const zone = this.ui.fileDropZone;
        
        ["dragenter", "dragover", "dragleave", "drop"].forEach(event => {
            zone.addEventListener(event, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });
        
        ["dragenter", "dragover"].forEach(event => {
            zone.addEventListener(event, () => {
                zone.style.borderColor = "var(--quantum-primary)";
                zone.style.background = "rgba(0, 255, 204, 0.1)";
            });
        });
        
        ["dragleave", "drop"].forEach(event => {
            zone.addEventListener(event, () => {
                zone.style.borderColor = "var(--border)";
                zone.style.background = "var(--bg-surface)";
            });
        });
        
        zone.addEventListener("drop", (e) => {
            const files = e.dataTransfer.files;
            this.handleFiles(files);
        });
    }

    async handleFileUpload(event) {
        const files = event.target.files;
        await this.handleFiles(files);
        event.target.value = "";
    }

    async handleFiles(files) {
        const currentSize = this.files.reduce((sum, f) => sum + f.size, 0);
        
        for (const file of files) {
            if (file.size > CONFIG.MAX_FILE_SIZE) {
                this.showNotification(`${file.name} too large (max 5MB)`, "error");
                continue;
            }
            
            if (currentSize + file.size > CONFIG.MAX_TOTAL_STORAGE) {
                this.showNotification("Storage limit reached (50MB)", "error");
                break;
            }

            try {
                const fileData = await this.readFileAsBase64(file);
                const fileObj = {
                    id: Date.now() + Math.random(),
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    data: fileData,
                    uploaded: Date.now()
                };

                this.files.push(fileObj);
                await this.saveFiles();
                this.renderFiles();
                this.updateStorageInfo();
                this.updateAnalytics();
                this.showNotification(`${file.name} encrypted`, "success");
            } catch (error) {
                console.error("File upload error:", error);
                this.showNotification(`Error uploading ${file.name}`, "error");
            }
        }
    }

    readFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(",")[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    async saveFiles() {
        if (this.files.length > 0) {
            const encrypted = await this.encryptData(JSON.stringify(this.files));
            localStorage.setItem(CONFIG.STORAGE_KEYS.FILES, JSON.stringify(encrypted));
        } else {
            localStorage.removeItem(CONFIG.STORAGE_KEYS.FILES);
        }
    }

    async loadFiles() {
        const stored = localStorage.getItem(CONFIG.STORAGE_KEYS.FILES);
        if (stored) {
            try {
                const encrypted = JSON.parse(stored);
                const decrypted = await this.decryptData(encrypted);
                this.files = JSON.parse(decrypted);
                this.updateStorageInfo();
            } catch (error) {
                console.error("File decryption error:", error);
                this.files = [];
                this.showNotification("Failed to decrypt files", "error");
            }
        }
        this.renderFiles();
        this.updateStorageInfo();
    }
    
    renderFiles() {
        this.ui.fileList.innerHTML = "";
        
        if (this.files.length === 0) {
            this.ui.fileList.innerHTML = 
                '<div style="padding: 30px; text-align: center; color: var(--text-muted);">No files stored</div>';
            return;
        }

        this.files.forEach(file => {
            const item = document.createElement("div");
            item.className = "file-item";
            item.innerHTML = `
                <div class="file-info-display">
                    <div class="file-name">${this.escapeHtml(file.name)}</div>
                    <div class="file-size">${this.formatFileSize(file.size)}</div>
                </div>
                <div class="file-actions">
                    <button class="icon-btn" data-id="${file.id}" data-action="download">
                        <svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                    </button>
                    <button class="icon-btn" data-id="${file.id}" data-action="delete">
                        <svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            `;
            
            item.querySelector('[data-action="download"]').addEventListener("click", () => {
                this.downloadFile(file);
            });
            
            item.querySelector('[data-action="delete"]').addEventListener("click", () => {
                this.deleteFile(file.id);
            });
            
            this.ui.fileList.appendChild(item);
        });
    }

    downloadFile(file) {
        try {
            const link = document.createElement("a");
            link.href = `data:${file.type || 'application/octet-stream'};base64,${file.data}`;
            link.download = file.name;
            link.click();
            this.showNotification("File downloaded", "success");
        } catch (error) {
            console.error("Download error:", error);
            this.showNotification("Download failed", "error");
        }
    }

    async deleteFile(id) {
        this.files = this.files.filter(f => f.id !== id);
        this.renderFiles();
        await this.saveFiles();
        this.updateStorageInfo();
        this.updateAnalytics();
        this.showNotification("File deleted", "success");
    }

    updateStorageInfo() {
        const totalSize = this.files.reduce((sum, file) => sum + file.size, 0);
        this.ui.storageUsed.textContent = this.formatFileSize(totalSize);
    }

    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
        return (bytes / 1048576).toFixed(1) + " MB";
    }

    updateAnalytics() {
        this.ui.totalPasswords.textContent = this.passwords.length;
        this.ui.totalFiles.textContent = this.files.length;
        
        const noteLength = this.ui.vaultInput.value.trim().length;
        this.ui.totalNotes.textContent = noteLength > 0 ? "1" : "0";
        
        const created = localStorage.getItem(CONFIG.STORAGE_KEYS.VAULT_CREATED);
        if (created) {
            const days = Math.floor((Date.now() - parseInt(created)) / (1000 * 60 * 60 * 24));
            this.ui.vaultAge.textContent = days + "d";
        }
    }

    exportData() {
        const exportObj = {
            version: "5.0",
            notes: localStorage.getItem(CONFIG.STORAGE_KEYS.NOTES),
            passwords: localStorage.getItem(CONFIG.STORAGE_KEYS.PASSWORDS),
            files: localStorage.getItem(CONFIG.STORAGE_KEYS.FILES),
            timestamp: new Date().toISOString(),
            created: localStorage.getItem(CONFIG.STORAGE_KEYS.VAULT_CREATED)
        };

        const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `vault-backup-${Date.now()}.vault`;
        link.click();
        URL.revokeObjectURL(url);
        
        this.showNotification("Backup exported successfully", "success");
    }

    logout(skipConfirm = false) {
        if (skipConfirm) {
            this.performLogout();
        } else {
            this.showModal(
                "TERMINATE SESSION",
                "Logout now? All data will be saved.",
                () => this.performLogout()
            );
        }
    }

    async performLogout() {
        await this.saveAllData();
        if (this.sessionTimer) clearInterval(this.sessionTimer);
        if (this.autoSaveTimer) clearInterval(this.autoSaveTimer);
        this.encryptionKey = null;
        location.reload();
    }

    showModal(title, message, onConfirm) {
        this.ui.modalTitle.textContent = title;
        this.ui.modalMessage.textContent = message;
        this.ui.modal.classList.add("active");
        
        this.ui.modalConfirm.onclick = () => {
            this.hideModal();
            if (onConfirm) onConfirm();
        };
    }

    hideModal() {
        this.ui.modal.classList.remove("active");
        this.ui.modalInputContainer.innerHTML = "";
    }

    showStatus(message) {
        this.ui.statusText.textContent = message;
    }

    showNotification(message, type = "success") {
        const notification = document.createElement("div");
        notification.className = `notification ${type}`;
        notification.textContent = message;
        this.ui.notificationContainer.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = "slideInRight 0.3s ease reverse";
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    async deriveKey(pin) {
        const enc = new TextEncoder();
        const baseKey = await crypto.subtle.importKey(
            "raw",
            enc.encode(pin),
            "PBKDF2",
            false,
            ["deriveKey"]
        );
        
        return crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: enc.encode(CONFIG.SALT),
                iterations: CONFIG.ITERATIONS,
                hash: "SHA-256"
            },
            baseKey,
            { name: "AES-GCM", length: 256 },
            false,
            ["encrypt", "decrypt"]
        );
    }

    async encryptData(text) {
        const enc = new TextEncoder();
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encrypted = await crypto.subtle.encrypt(
            { name: "AES-GCM", iv },
            this.encryptionKey,
            enc.encode(text)
        );
        
        return {
            iv: Array.from(iv),
            data: Array.from(new Uint8Array(encrypted))
        };
    }

    async decryptData(obj) {
        const dec = new TextDecoder();
        const decrypted = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: new Uint8Array(obj.iv) },
            this.encryptionKey,
            new Uint8Array(obj.data)
        );
        
        return dec.decode(decrypted);
    }

    async sha256(str) {
        const buf = await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(str)
        );
        
        return Array.from(new Uint8Array(buf))
            .map(b => b.toString(16).padStart(2, "0"))
            .join("");
    }
    
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
}

const style = document.createElement("style");
style.textContent = `
@keyframes float {
  0% { transform: translate(0, 0) rotate(0deg); opacity: 0; }
  10% { opacity: 0.6; }
  90% { opacity: 0.6; }
  100% { transform: translate(100vw, -100vh) rotate(360deg); opacity: 0; }
}
`;
document.head.appendChild(style);

document.addEventListener("DOMContentLoaded", () => {
    new VaultNexus();
});