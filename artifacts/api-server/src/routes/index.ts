import { Router, type IRouter } from "express";
import healthRouter from "./health";
import publicRouter from "./public";
import leadsRouter from "./leads";
import adminRouter from "./admin";
import storageRouter from "./storage";
import unlockRouter from "./unlock";

const router: IRouter = Router();

router.use(healthRouter);
router.use(publicRouter);
router.use(leadsRouter);
router.use(unlockRouter);
router.use(adminRouter);
router.use(storageRouter);

export default router;
