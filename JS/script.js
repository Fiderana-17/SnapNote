class AuthManager {
constructor() {
    this.currentUser = null;
    this.users = this.loadUsers();
    this.initializeAuth();
}

initializeAuth() {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        this.currentUser = JSON.parse(savedUser);
        this.showMainApp();
    } else {
        this.showLoginScreen();
    }

    this.initializeAuthEventListeners();
}

initializeAuthEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
    document.getElementById('registerForm').addEventListener('submit', (e) => this.handleRegister(e));
    
    // Switch between login and register
    document.getElementById('showRegister').addEventListener('click', () => this.showRegisterForm());
    document.getElementById('showLogin').addEventListener('click', () => this.showLoginForm());
    
    // Password toggle
    document.getElementById('toggleLoginPassword').addEventListener('click', () => this.togglePassword('loginPassword'));
    document.getElementById('toggleRegisterPassword').addEventListener('click', () => this.togglePassword('registerPassword'));
    
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
}

loadUsers() {
    const saved = localStorage.getItem('users');
    return saved ? JSON.parse(saved) : [];
}

saveUsers() {
    localStorage.setItem('users', JSON.stringify(this.users));
}

showLoginScreen() {
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('mainApp').classList.add('hidden');
}

showMainApp() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    document.getElementById('currentUser').textContent = this.currentUser.username;
    
    // Initialize the notes app ou recharger les notes si l'app existe déjà
    if (!window.notesApp) {
        window.notesApp = new NotesApp();
    } else {
        // Recharger les notes pour le nouvel utilisateur
        window.notesApp.notes = window.notesApp.loadNotes();
        window.notesApp.renderNotes();
    }
}

showLoginForm() {
    document.getElementById('loginCard').classList.remove('hidden');
    document.getElementById('registerCard').classList.add('hidden');
    this.clearErrors();
}

showRegisterForm() {
    document.getElementById('loginCard').classList.add('hidden');
    document.getElementById('registerCard').classList.remove('hidden');
    this.clearErrors();
}

togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
    input.setAttribute('type', type);
}

clearErrors() {
    document.getElementById('loginError').classList.add('hidden');
    document.getElementById('registerError').classList.add('hidden');
    document.getElementById('registerSuccess').classList.add('hidden');
}

showError(elementId, message) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.classList.remove('hidden');
}

showSuccess(elementId, message) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.classList.remove('hidden');
}

handleLogin(e) {
    e.preventDefault();
    this.clearErrors();

    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!username || !password) {
        this.showError('loginError', 'Veuillez remplir tous les champs');
        return;
    }

    const user = this.users.find(u => u.username === username && u.password === password);
    
    if (user) {
        this.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.showMainApp();
    } else {
        this.showError('loginError', 'Nom d\'utilisateur ou mot de passe incorrect');
    }
}

handleRegister(e) {
    e.preventDefault();
    this.clearErrors();

    const username = document.getElementById('registerUsername').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validation
    if (!username || !password || !confirmPassword) {
        this.showError('registerError', 'Veuillez remplir tous les champs obligatoires');
        return;
    }

    if (username.length < 3) {
        this.showError('registerError', 'Le nom d\'utilisateur doit contenir au moins 3 caractères');
        return;
    }

    if (password.length < 6) {
        this.showError('registerError', 'Le mot de passe doit contenir au moins 6 caractères');
        return;
    }

    if (password !== confirmPassword) {
        this.showError('registerError', 'Les mots de passe ne correspondent pas');
        return;
    }

    // Check if username already exists
    if (this.users.find(u => u.username === username)) {
        this.showError('registerError', 'Ce nom d\'utilisateur est déjà pris');
        return;
    }

    // Create new user
    const newUser = {
        id: Date.now().toString(),
        username,
        email,
        password,
        createdAt: new Date().toISOString()
    };

    this.users.push(newUser);
    this.saveUsers();

    this.showSuccess('registerSuccess', 'Compte créé avec succès ! Vous pouvez maintenant vous connecter.');
    
    // Clear form and switch to login after 2 seconds
    setTimeout(() => {
        document.getElementById('registerForm').reset();
        this.showLoginForm();
    }, 2000);
}

logout() {
    this.currentUser = null;
    localStorage.removeItem('currentUser');
    this.showLoginScreen();
    
    // Clear forms
    document.getElementById('loginForm').reset();
    document.getElementById('registerForm').reset();
    this.clearErrors();
}
}

class NotesApp {
constructor() {
    this.notes = this.loadNotes();
    this.currentNoteId = null;
    this.selectedNotes = new Set();
    this.initializeEventListeners();
    this.initializeTheme();
    this.renderNotes();
}

loadNotes() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return [];
    
    const saved = localStorage.getItem(`notes_${currentUser.id}`);
    return saved ? JSON.parse(saved) : [];
}

saveNotes() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        localStorage.setItem(`notes_${currentUser.id}`, JSON.stringify(this.notes));
        console.log(`Notes sauvegardées pour l'utilisateur ${currentUser.username}:`, this.notes.length);
    }
}

        initializeEventListeners() {
            // Theme toggle
            document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
            
            // Add note button
            document.getElementById('addNoteBtn').addEventListener('click', () => this.openNoteModal());
            
            // Modal controls
            document.getElementById('closeModal').addEventListener('click', () => this.closeNoteModal());
            document.getElementById('cancelBtn').addEventListener('click', () => this.closeNoteModal());
            document.getElementById('noteForm').addEventListener('submit', (e) => this.handleNoteSubmit(e));
            
            // Search and sort
            document.getElementById('searchInput').addEventListener('input', (e) => this.handleSearch(e.target.value));
            document.getElementById('sortSelect').addEventListener('change', (e) => this.handleSort(e.target.value));
            
            // Compare modal
            document.getElementById('compareBtn').addEventListener('click', () => this.openCompareModal());
            document.getElementById('closeCompareModal').addEventListener('click', () => this.closeCompareModal());
            
            // Delete modal
            document.getElementById('cancelDelete').addEventListener('click', () => this.closeDeleteModal());
            document.getElementById('confirmDelete').addEventListener('click', () => this.confirmDelete());
            
            // Close modals on outside click
            document.getElementById('noteModal').addEventListener('click', (e) => {
                if (e.target.id === 'noteModal') this.closeNoteModal();
            });
            document.getElementById('compareModal').addEventListener('click', (e) => {
                if (e.target.id === 'compareModal') this.closeCompareModal();
            });
            document.getElementById('deleteModal').addEventListener('click', (e) => {
                if (e.target.id === 'deleteModal') this.closeDeleteModal();
            });
        }

        initializeTheme() {
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark');
            }
        }

        toggleTheme() {
            document.documentElement.classList.toggle('dark');
            const isDark = document.documentElement.classList.contains('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        }

        

        generateId() {
            return Date.now().toString(36) + Math.random().toString(36).substr(2);
        }

        openNoteModal(noteId = null) {
            this.currentNoteId = noteId;
            const modal = document.getElementById('noteModal');
            const title = document.getElementById('modalTitle');
            const form = document.getElementById('noteForm');
            
            if (noteId) {
                const note = this.notes.find(n => n.id === noteId);
                title.textContent = 'Modifier la note';
                document.getElementById('noteTitle').value = note.title;
                document.getElementById('noteContent').value = note.content;
                document.getElementById('noteTags').value = note.tags.join(' ');
            } else {
                title.textContent = 'Nouvelle note';
                form.reset();
            }
            
            modal.classList.remove('hidden');
            document.getElementById('noteTitle').focus();
        }

        closeNoteModal() {
            document.getElementById('noteModal').classList.add('hidden');
            this.currentNoteId = null;
        }

        handleNoteSubmit(e) {
            e.preventDefault();
            
            const title = document.getElementById('noteTitle').value.trim();
            const content = document.getElementById('noteContent').value.trim();
            const tagsInput = document.getElementById('noteTags').value.trim();
            const tags = tagsInput ? tagsInput.split(/\s+/).filter(tag => tag.startsWith('#')) : [];
            
            if (this.currentNoteId) {
                // Edit existing note
                const noteIndex = this.notes.findIndex(n => n.id === this.currentNoteId);
                this.notes[noteIndex] = {
                    ...this.notes[noteIndex],
                    title,
                    content,
                    tags,
                    updatedAt: new Date().toISOString()
                };
            } else {
                // Create new note
                const newNote = {
                    id: this.generateId(),
                    title,
                    content,
                    tags,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                this.notes.unshift(newNote);
            }
            
            this.saveNotes();
            this.renderNotes();
            this.closeNoteModal();
        }

        deleteNote(noteId) {
            this.noteToDelete = noteId;
            document.getElementById('deleteModal').classList.remove('hidden');
        }

        confirmDelete() {
            if (this.noteToDelete) {
                this.notes = this.notes.filter(n => n.id !== this.noteToDelete);
                this.selectedNotes.delete(this.noteToDelete);
                this.saveNotes();
                this.renderNotes();
                this.closeDeleteModal();
            }
        }

        closeDeleteModal() {
            document.getElementById('deleteModal').classList.add('hidden');
            this.noteToDelete = null;
        }

        handleSearch(query) {
            this.searchQuery = query.toLowerCase();
            this.renderNotes();
        }

        handleSort(sortType) {
            this.sortType = sortType;
            this.renderNotes();
        }

        toggleNoteSelection(noteId) {
            if (this.selectedNotes.has(noteId)) {
                this.selectedNotes.delete(noteId);
            } else {
                this.selectedNotes.add(noteId);
            }
            
            const compareBtn = document.getElementById('compareBtn');
            if (this.selectedNotes.size === 2) {
                compareBtn.classList.remove('hidden');
            } else {
                compareBtn.classList.add('hidden');
            }
            
            this.renderNotes();
        }

        openCompareModal() {
            if (this.selectedNotes.size !== 2) return;
            
            const selectedNotesArray = Array.from(this.selectedNotes);
            const note1 = this.notes.find(n => n.id === selectedNotesArray[0]);
            const note2 = this.notes.find(n => n.id === selectedNotesArray[1]);
            
            const compareContent = document.getElementById('compareContent');
            compareContent.innerHTML = `
                <div class="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <h3 class="font-semibold text-lg mb-2 text-gray-900 dark:text-white">${this.escapeHtml(note1.title)}</h3>
                    <div class="text-sm text-gray-500 dark:text-gray-400 mb-3">
                        Créée le ${this.formatDate(note1.createdAt)}
                    </div>
                    <div class="prose dark:prose-invert max-w-none mb-3 markdown-content">
                        ${this.renderMarkdown(note1.content)}
                    </div>
                    <div class="flex flex-wrap gap-1">
                        ${note1.tags.map(tag => `<span class="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">${this.escapeHtml(tag)}</span>`).join('')}
                    </div>
                </div>
                <div class="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <h3 class="font-semibold text-lg mb-2 text-gray-900 dark:text-white">${this.escapeHtml(note2.title)}</h3>
                    <div class="text-sm text-gray-500 dark:text-gray-400 mb-3">
                        Créée le ${this.formatDate(note2.createdAt)}
                    </div>
                    <div class="prose dark:prose-invert max-w-none mb-3 markdown-content">
                        ${this.renderMarkdown(note2.content)}
                    </div>
                    <div class="flex flex-wrap gap-1">
                        ${note2.tags.map(tag => `<span class="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">${this.escapeHtml(tag)}</span>`).join('')}
                    </div>
                </div>
            `;
            
            document.getElementById('compareModal').classList.remove('hidden');
        }

        closeCompareModal() {
            document.getElementById('compareModal').classList.add('hidden');
        }

        renderMarkdown(text) {
            return this.escapeHtml(text)
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/`(.*?)`/g, '<code>$1</code>')
                .replace(/\n/g, '<br>');
        }

        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        formatDate(dateString) {
            return new Date(dateString).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        getFilteredAndSortedNotes() {
            let filteredNotes = this.notes;
            
            // Apply search filter
            if (this.searchQuery) {
                filteredNotes = filteredNotes.filter(note => 
                    note.title.toLowerCase().includes(this.searchQuery) ||
                    note.content.toLowerCase().includes(this.searchQuery) ||
                    note.tags.some(tag => tag.toLowerCase().includes(this.searchQuery))
                );
            }
            
            // Apply sorting
            const sortType = this.sortType || 'date-desc';
            filteredNotes.sort((a, b) => {
                switch (sortType) {
                    case 'date-asc':
                        return new Date(a.createdAt) - new Date(b.createdAt);
                    case 'date-desc':
                        return new Date(b.createdAt) - new Date(a.createdAt);
                    case 'title-asc':
                        return a.title.localeCompare(b.title);
                    case 'title-desc':
                        return b.title.localeCompare(a.title);
                    default:
                        return new Date(b.createdAt) - new Date(a.createdAt);
                }
            });
            
            return filteredNotes;
        }

        renderNotes() {
            const container = document.getElementById('notesContainer');
            const emptyState = document.getElementById('emptyState');
            const noteCount = document.getElementById('noteCount');
            
            const filteredNotes = this.getFilteredAndSortedNotes();
            
            // Update note count
            noteCount.textContent = `${filteredNotes.length} note${filteredNotes.length !== 1 ? 's' : ''}`;
            
            if (filteredNotes.length === 0) {
                container.innerHTML = '';
                emptyState.classList.remove('hidden');
                return;
            }
            
            emptyState.classList.add('hidden');
            
            container.innerHTML = filteredNotes.map((note, index) => `
<div class="note-card bounce-in" style="animation-delay: ${index * 0.1}s">
    <div class="flex justify-between items-start mb-4">
        <h3 class="font-bold text-xl text-gray-900 dark:text-white line-clamp-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">${this.escapeHtml(note.title)}</h3>
        <div class="flex items-center space-x-3 ml-3">
            <input type="checkbox" ${this.selectedNotes.has(note.id) ? 'checked' : ''} 
                   onchange="window.notesApp.toggleNoteSelection('${note.id}')"
                   class="w-5 h-5 text-purple-600 bg-transparent border-2 border-purple-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:border-purple-400 transition-all duration-200">
            <div class="relative">
                <button onclick="this.nextElementSibling.classList.toggle('hidden')" class="p-2 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path>
                    </svg>
                </button>
                <div class="dropdown-menu hidden absolute right-0 mt-2 w-48 rounded-xl z-20">
                    <button onclick="window.notesApp.openNoteModal('${note.id}')" class="flex items-center w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors duration-200 rounded-t-xl">
                        <svg class="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                        Modifier
                    </button>
                    <button onclick="window.notesApp.deleteNote('${note.id}')" class="flex items-center w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200 rounded-b-xl">
                        <svg class="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                        Supprimer
                    </button>
                </div>
            </div>
        </div>
    </div>
    
    <div class="text-gray-700 dark:text-gray-300 mb-6 line-clamp-4 markdown-content leading-relaxed">
        ${this.renderMarkdown(note.content)}
    </div>
    
    <div class="flex flex-wrap gap-2 mb-6">
        ${note.tags.map((tag, tagIndex) => `<span class="tag px-3 py-1 text-white text-sm rounded-full font-medium" style="animation-delay: ${(index * 0.1) + (tagIndex * 0.05)}s">${this.escapeHtml(tag)}</span>`).join('')}
    </div>
    
    <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div class="flex items-center space-x-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>Créée le ${this.formatDate(note.createdAt)}</span>
        </div>
        ${note.updatedAt !== note.createdAt ? `
            <div class="flex items-center space-x-2 text-purple-600 dark:text-purple-400">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                <span>Modifiée le ${this.formatDate(note.updatedAt)}</span>
            </div>
        ` : ''}
    </div>
</div>
`).join('');
            
            // Close any open dropdowns when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('button')) {
                    document.querySelectorAll('.absolute.right-0').forEach(dropdown => {
                        dropdown.classList.add('hidden');
                    });
                }
            });
        }
    }

    // Initialize the auth manager
const authManager = new AuthManager();

// Global functions for inline event handlers
window.openNoteModal = () => {
if (window.notesApp) {
    window.notesApp.openNoteModal();
}
};
