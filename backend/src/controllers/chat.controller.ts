// Member 6 – Chat
import { Request, Response, NextFunction } from 'express';
import { chatService } from '../services';
import { sendSuccess } from '../utils';

export class ChatController {
  /**
   * GET /api/conversations
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const conversations = await chatService.listConversations(req.user!.id);
      sendSuccess(res, 'Conversations retrieved', conversations);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/conversations   body: { userId } or { email }
   */
  async start(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const conversation = await chatService.startConversation(req.user!.id, req.body);
      sendSuccess(res, 'Conversation ready', conversation);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/conversations/:id/messages
   */
  async messages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await chatService.getMessages(req.user!.id, req.params.id);
      sendSuccess(res, 'Messages retrieved', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/conversations/:id/messages   body: { body }
   */
  async send(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const message = await chatService.sendMessage(req.user!.id, req.params.id, req.body?.body);
      sendSuccess(res, 'Message sent', message, 201);
    } catch (error) {
      next(error);
    }
  }
}

export const chatController = new ChatController();
