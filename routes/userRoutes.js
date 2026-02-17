const express = require("express");
const userController = require("../controllers/userController");
const userValidation = require("../validations/userValidation");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// Statistics route (must come before parameterized routes)
router.get(
  "/stats/overview",
  protect,
  authorize("admin"),
  userController.getUserStats,
);

// Role-based route (must come before parameterized routes)
router.get("/role/:role", protect, userController.getUsersByRole);

// Main user routes
router.get("/", protect, authorize("admin"), userController.getAllUsers);
router.post(
  "/",
  protect,
  authorize("admin"),
  userValidation.createUser,
  userController.createUser,
);

// Individual user routes
router.get("/:id", protect, userController.getUserById);
router.put(
  "/:id",
  protect,
  authorize("admin"),
  userValidation.updateUser,
  userController.updateUser,
);
router.delete("/:id", protect, authorize("admin"), userController.deleteUser);
router.put(
  "/:id/activate",
  protect,
  authorize("admin"),
  userController.activateUser,
);

module.exports = router;
