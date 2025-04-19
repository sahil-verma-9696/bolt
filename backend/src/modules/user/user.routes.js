import { Router } from "express";
import { ROUTES } from "./constants.js";
import { isProtected } from "../auth/auth.middleware.js";
import upload from "../../multer/config.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

import { getMe } from "./controllers/getMe.js";
import { deleteMe } from "./controllers/deleteMe.js";
import { updateMe } from "./controllers/updateMe.js";
import { getProfile } from "./controllers/getProfile.js";
import { getSettings } from "./controllers/getSetting.js";
import { updateSettings } from "./controllers/updateSetting.js";
import { getRelationshipsByStatus } from "./controllers/getRelationshipByStatus.js";
import { getAllUsers } from "./controllers/getAllUsers.js";
import { sendFriendRequest } from "./controllers/sendFriendRequest.js";
import { acceptFriendRequest } from "./controllers/acceptFriendRequest.js";
import { rejectFriendRequest } from "./controllers/rejectFriendRequest.js";
import { removeFriend } from "./user_relation/removeFriend.js";

export const router = Router();

const routes = [
  {
    method: "get",
    path: ROUTES.USER.ALL,
    middleware: [isProtected],
    handler: getAllUsers,
  },
  {
    method: "get",
    path: ROUTES.USER.ME,
    middleware: [isProtected],
    handler: getMe,
  },
  {
    method: "patch",
    path: ROUTES.USER.ME,
    middleware: [isProtected, upload.single("avatar")],
    handler: updateMe,
  },
  {
    method: "delete",
    path: ROUTES.USER.ME,
    middleware: [isProtected],
    handler: deleteMe,
  },

  {
    method: "get",
    path: ROUTES.USER.PROFILE,
    middleware: [],
    handler: getProfile,
  },

  {
    method: "get",
    path: ROUTES.USER.SETTING,
    middleware: [isProtected],
    handler: getSettings,
  },
  {
    method: "post",
    path: ROUTES.USER.SETTING,
    middleware: [isProtected],
    handler: updateSettings,
  },

  {
    method: "get",
    path: ROUTES.USER.RELATIONSHIP,
    middleware: [isProtected],
    handler: getRelationshipsByStatus,
  },

  {
    method: "get",
    path: "/friend-request/:id",
    middleware: [isProtected],
    handler: sendFriendRequest,
  },
  {
    method: "get",
    path: "/accept-request/:id",
    middleware: [isProtected],
    handler: acceptFriendRequest,
  },
  {
    method: "get",
    path: "/reject-request/:id",
    middleware: [isProtected],
    handler: rejectFriendRequest,
  },
  {
    method: "get",
    path: "/remove-friend/:id",
    middleware: [isProtected],
    handler: removeFriend,
  },
];

// Register routes
routes.forEach(({ method, path, middleware, handler }) => {
  router[method](path, ...middleware, asyncHandler(handler));
});
