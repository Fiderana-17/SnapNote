class AuthManager {
constructor() {
    this.currentUser = null;
    this.users = this.loadUsers();
    this.initializeAuth();
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
}