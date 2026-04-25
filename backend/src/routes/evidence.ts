import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middlewares/auth';
import { EvidenceController } from '../controllers/evidenceController';

const router = Router();
const evidenceController = new EvidenceController();

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

router.post('/:obligationId', authenticate, upload.single('file'), evidenceController.upload);
router.get('/:obligationId', authenticate, evidenceController.listByObligation);
router.get('/:obligationId/:evidenceId/download', authenticate, evidenceController.download);

export default router;