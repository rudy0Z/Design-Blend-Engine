import { Router, type IRouter } from "express";
import healthRouter from "./health";
import profilesRouter from "./profiles";
import invitesRouter from "./invites";
import ogRouter from "./og";
import catalogRouter from "./catalog";
import captureRouter from "./capture";
import blendSyncRouter from "./blend-sync";

const router: IRouter = Router();

router.use(healthRouter);
router.use(profilesRouter);
router.use(invitesRouter);
router.use(ogRouter);
router.use(catalogRouter);
router.use(captureRouter);
router.use(blendSyncRouter);

export default router;
