import express from "express";
import {
    addHouse,
    getHouses,
    deleteHouse,
    updateHouse
} from "./house_controller.js";
import { authenticateToken } from "../../middlewares/authenticateToken.js";


const router = express.Router();

router.get("/get-houses",authenticateToken, getHouses);
router.post("/add-house",authenticateToken, addHouse);
router.delete("/delete-house/:id",authenticateToken, deleteHouse);
router.put("/update-house/:id",authenticateToken, updateHouse);

export default router;