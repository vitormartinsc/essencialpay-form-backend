import { Request, Response, NextFunction } from 'express';
import { UserFormData, User, UserStatus, ApiResponse } from '../types';
import { UserService } from '../services/userService';
import { asyncHandler, createError } from '../middleware/errorHandler';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * Create a new user with form data
   */
  createUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const formData: UserFormData = req.body;

    try {
      const user = await this.userService.createUser(formData);
      
      const response: ApiResponse<User> = {
        success: true,
        data: user,
        message: 'Usuário criado com sucesso',
      };

      res.status(201).json(response);
    } catch (error: any) {
      throw createError(error.message, 400);
    }
  });

  /**
   * Get user by ID
   */
  getUserById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    if (!id) {
      throw createError('ID do usuário é obrigatório', 400);
    }

    const user = await this.userService.getUserById(id);

    if (!user) {
      throw createError('Usuário não encontrado', 404);
    }

    const response: ApiResponse<User> = {
      success: true,
      data: user,
    };

    res.json(response);
  });

  /**
   * Update user form data
   */
  updateUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const formData: Partial<UserFormData> = req.body;

    if (!id) {
      throw createError('ID do usuário é obrigatório', 400);
    }

    const user = await this.userService.updateUser(id, formData);

    if (!user) {
      throw createError('Usuário não encontrado', 404);
    }

    const response: ApiResponse<User> = {
      success: true,
      data: user,
      message: 'Usuário atualizado com sucesso',
    };

    res.json(response);
  });

  /**
   * Update user status
   */
  updateUserStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { status } = req.body;

    if (!id) {
      throw createError('ID do usuário é obrigatório', 400);
    }

    if (!Object.values(UserStatus).includes(status)) {
      throw createError('Status inválido', 400);
    }

    const user = await this.userService.updateUserStatus(id, status);

    if (!user) {
      throw createError('Usuário não encontrado', 404);
    }

    const response: ApiResponse<User> = {
      success: true,
      data: user,
      message: 'Status atualizado com sucesso',
    };

    res.json(response);
  });

  /**
   * Get all users (with pagination)
   */
  getAllUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as UserStatus;

    const result = await this.userService.getAllUsers({ page, limit, status });

    const response: ApiResponse = {
      success: true,
      data: {
        users: result.users,
        pagination: {
          page,
          limit,
          total: result.total,
          pages: Math.ceil(result.total / limit),
        },
      },
    };

    res.json(response);
  });

  /**
   * Delete user
   */
  deleteUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    if (!id) {
      throw createError('ID do usuário é obrigatório', 400);
    }

    const deleted = await this.userService.deleteUser(id);

    if (!deleted) {
      throw createError('Usuário não encontrado', 404);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Usuário deletado com sucesso',
    };

    res.json(response);
  });

  /**
   * Get user statistics
   */
  getUserStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const stats = await this.userService.getUserStats();

    const response: ApiResponse = {
      success: true,
      data: stats,
    };

    res.json(response);
  });
}

// Exportar instância do controller
export const userController = new UserController();
