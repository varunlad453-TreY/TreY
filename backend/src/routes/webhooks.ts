import { Router } from 'express';
import { WebhookController } from '../controllers/webhookController';
import { authenticate } from '../middlewares/auth';

const router = Router();
const webhookController = new WebhookController();

// Protected route to create the link initially
router.post('/link', authenticate, webhookController.createLink);

// Use router to group the webhook endpoints
router.post('/jira', webhookController.handleJiraWebhook);
router.post('/slack', webhookController.handleSlackWebhook);

export default router;