import express from "express";
import {
    addButton,
    getButtons,
    deleteButton,
    updateButton
} from "./button_controller.js";
import { authenticateToken } from "../../middlewares/authenticateToken.js";


const router = express.Router();

router.get("/get-buttons/:houseId",authenticateToken, getButtons);
router.post("/add-button",authenticateToken, addButton);
router.delete("/delete-button/:id",authenticateToken, deleteButton);
router.put("/update-button/:id",authenticateToken, updateButton);

export default router;