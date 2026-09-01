import { Router, type IRouter } from "express";
import healthRouter from "./health";
import stylesRouter from "./styles";
import quizRouter from "./quiz";
import profilesRouter from "./profiles";
import blendsRouter from "./blends";
import ogRouter from "./og";
import catalogRouter from "./catalog";
import captureRouter from "./capture";
import blendSyncRouter from "./blend-sync";

const router: IRouter = Router();

router.use(healthRouter);
router.use(stylesRouter);
router.use(quizRouter);
router.use(profilesRouter);
router.use(blendsRouter);
router.use(ogRouter);
router.use(catalogRouter);
router.use(captureRouter);
router.use(blendSyncRouter);

export default router;
