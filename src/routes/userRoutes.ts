import { Router } from 'express';
import { userController } from '../controllers/userController';
import { validateUserForm } from '../middleware/validation';

const router = Router();

// Rotas básicas
router.post('/', validateUserForm, userController.createUser);
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.put('/:id', validateUserForm, userController.updateUser);
router.delete('/:id', userController.deleteUser);

export default router;
