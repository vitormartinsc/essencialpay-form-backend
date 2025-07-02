import { UserFormData, User, UserStatus, UserDocument } from '../types';
import { v4 as uuidv4 } from 'uuid';

// In-memory storage (in a real app, this would be a database)
class InMemoryStorage {
  private users: Map<string, User> = new Map();
  private documents: Map<string, UserDocument[]> = new Map();

  saveUser(user: User): User {
    this.users.set(user.id, user);
    return user;
  }

  getUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  deleteUser(id: string): boolean {
    return this.users.delete(id);
  }

  updateUser(id: string, updates: Partial<User>): User | undefined {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  saveDocument(userId: string, document: UserDocument): void {
    const userDocs = this.documents.get(userId) || [];
    userDocs.push(document);
    this.documents.set(userId, userDocs);
  }

  getDocumentsByUserId(userId: string): UserDocument[] {
    return this.documents.get(userId) || [];
  }
}

const storage = new InMemoryStorage();

export class UserService {
  /**
   * Create a new user
   */
  async createUser(formData: UserFormData): Promise<User> {
    // Check if user already exists by CPF
    const existingUser = this.findUserByCpf(formData.cpf);
    if (existingUser) {
      throw new Error('Usuário com este CPF já existe');
    }

    // Check if email already exists
    const existingEmail = this.findUserByEmail(formData.email);
    if (existingEmail) {
      throw new Error('Usuário com este email já existe');
    }

    const user: User = {
      id: uuidv4(),
      formData,
      documents: [],
      status: UserStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return storage.saveUser(user);
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<User | null> {
    const user = storage.getUserById(id);
    if (!user) return null;

    // Get user documents
    const documents = storage.getDocumentsByUserId(id);
    return { ...user, documents };
  }

  /**
   * Update user data
   */
  async updateUser(id: string, updates: Partial<UserFormData>): Promise<User | null> {
    const user = storage.getUserById(id);
    if (!user) return null;

    const updatedFormData = { ...user.formData, ...updates };
    const updatedUser = storage.updateUser(id, { formData: updatedFormData });
    
    if (!updatedUser) return null;

    // Get updated user with documents
    const documents = storage.getDocumentsByUserId(id);
    return { ...updatedUser, documents };
  }

  /**
   * Update user status
   */
  async updateUserStatus(id: string, status: UserStatus): Promise<User | null> {
    const updatedUser = storage.updateUser(id, { status });
    
    if (!updatedUser) return null;

    // Get updated user with documents
    const documents = storage.getDocumentsByUserId(id);
    return { ...updatedUser, documents };
  }

  /**
   * Get all users with pagination and filtering
   */
  async getAllUsers(options: {
    page: number;
    limit: number;
    status?: UserStatus;
  }): Promise<{ users: User[]; total: number }> {
    let users = storage.getAllUsers();

    // Filter by status if provided
    if (options.status) {
      users = users.filter(user => user.status === options.status);
    }

    // Sort by creation date (newest first)
    users.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Pagination
    const total = users.length;
    const start = (options.page - 1) * options.limit;
    const paginatedUsers = users.slice(start, start + options.limit);

    // Add documents to each user
    const usersWithDocuments = paginatedUsers.map(user => ({
      ...user,
      documents: storage.getDocumentsByUserId(user.id),
    }));

    return {
      users: usersWithDocuments,
      total,
    };
  }

  /**
   * Delete user
   */
  async deleteUser(id: string): Promise<boolean> {
    return storage.deleteUser(id);
  }

  /**
   * Add document to user
   */
  async addDocumentToUser(userId: string, document: UserDocument): Promise<void> {
    storage.saveDocument(userId, document);
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<{
    total: number;
    byStatus: Record<UserStatus, number>;
    recent: number;
  }> {
    const users = storage.getAllUsers();
    const total = users.length;

    const byStatus = {
      [UserStatus.PENDING]: 0,
      [UserStatus.APPROVED]: 0,
      [UserStatus.REJECTED]: 0,
      [UserStatus.UNDER_REVIEW]: 0,
    };

    users.forEach(user => {
      byStatus[user.status]++;
    });

    // Count users created in the last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recent = users.filter(user => user.createdAt > sevenDaysAgo).length;

    return {
      total,
      byStatus,
      recent,
    };
  }

  /**
   * Find user by CPF
   */
  private findUserByCpf(cpf: string): User | undefined {
    return storage.getAllUsers().find(user => user.formData.cpf === cpf);
  }

  /**
   * Find user by email
   */
  private findUserByEmail(email: string): User | undefined {
    return storage.getAllUsers().find(user => user.formData.email.toLowerCase() === email.toLowerCase());
  }
}
