import { Router, type IRouter } from "express";
import healthRouter from "./health";
import stylesRouter from "./styles";
import quizRouter from "./quiz";
import profilesRouter from "./profiles";
import blendsRouter from "./blends";

const router: IRouter = Router();

router.use(healthRouter);
router.use(stylesRouter);
router.use(quizRouter);
router.use(profilesRouter);
router.use(blendsRouter);

export default router;
