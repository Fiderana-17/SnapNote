class AuthManager {
constructor() {
    this.currentUser = null;
    this.users = this.loadUsers();
    this.initializeAuth();
}


}