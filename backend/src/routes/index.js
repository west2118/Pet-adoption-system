import { Router } from 'express';
import { authRoutes } from './authRoutes.js';
import { petRoutes } from './petRoutes.js';
import { shelterRoutes } from './shelterRoutes.js';
import { listingRoutes } from './listingRoutes.js';
import { applicationRoutes } from './applicationRoutes.js';
import { shelterApplicationRoutes } from './shelterApplicationRoutes.js';
import { inquiryRoutes } from './inquiryRoutes.js';
import { shelterInquiryRoutes } from './shelterInquiryRoutes.js';
import { favoriteRoutes } from './favoriteRoutes.js';
import { adminRoutes } from './adminRoutes.js';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) =>
  res.json({ success: true, data: { status: 'ok' } }),
);

apiRouter.use('/auth', authRoutes);
apiRouter.use('/pets', petRoutes);
apiRouter.use('/shelters', shelterRoutes);
apiRouter.use('/shelter/listings', listingRoutes);
apiRouter.use('/applications', applicationRoutes);
apiRouter.use('/shelter/applications', shelterApplicationRoutes);
apiRouter.use('/inquiries', inquiryRoutes);
apiRouter.use('/shelter/inquiries', shelterInquiryRoutes);
apiRouter.use('/favorites', favoriteRoutes);
apiRouter.use('/admin', adminRoutes);
