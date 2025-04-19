import React, { memo, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Check, Plus, Timer, X } from "lucide-react";
import {
  userAcceptFriendRequest,
  userFriendRequest,
  userRejectFriendRequest,
} from "../../features/user/userSlice";
import { messages, setReceiver } from "../../features/chat/chatAreaSlice";
import { lastSeenFormate } from "../../utils/lastSeenFormate";
import { me } from "../../features/auth/authSlice";

const UserItem = ({ user }) => {
  const dispatch = useDispatch();
  const receiver = useSelector((state) => state.chat.receiver);
  const onlineUsers = useSelector((state) => state.user.onlineUsers);
  const currUser = useSelector((state) => state.auth.user);

  const isSelected = receiver?.email === user.email;

  useEffect(() => {
    if (localStorage.getItem("receiver")) {
      dispatch(setReceiver(JSON.parse(localStorage.getItem("reciver"))));
    }
  }, [dispatch]);

  const handleSetReceiver = () => {
    if (isSelected) {
      dispatch(setReceiver(null));
    } else {
      localStorage.setItem("receiver", JSON.stringify(user));
      dispatch(setReceiver(user));
      dispatch(messages(user._id));
    }
  };

  const handleFriendRequest = useCallback(async () => {
    await dispatch(userFriendRequest(user._id)).unwrap();
    // dispatch(me());
  }, [dispatch, user._id]);

  const handleAccept = useCallback(async () => {
    await dispatch(userAcceptFriendRequest(user._id)).unwrap();
    // dispatch(me());
  }, [dispatch, user._id]);

  const handleReject = useCallback(async () => {
    await dispatch(userRejectFriendRequest(user._id)).unwrap();
    // dispatch(me());
  }, [dispatch, user._id]);

  return (
    <li
      onClick={handleSetReceiver}
      className={`flex justify-between items-center hover:bg-gray-700 p-2 md:p-3 lg:p-4 rounded-md cursor-pointer select-none transition-all duration-200 ${
        isSelected
          ? "border-l-4 border-l-gray-900 bg-gray-700"
          : "border-l-4 border-l-transparent"
      }`}
    >
      <div className="flex gap-2 sm:gap-3 items-center">
        <div className="relative min-w-[3rem]">
          <img
            src="https://res.cloudinary.com/dfqdx3ieb/image/upload/v1742281653/default_user.png"
            alt="avatar"
            className="w-10 sm:w-12 aspect-square rounded-full border-2 border-white object-cover"
          />
          {onlineUsers.includes(user._id) && (
            <span className="absolute bottom-0 right-0 size-2.5 sm:size-3 bg-green-500 rounded-full border border-white" />
          )}
        </div>
        <div className="flex flex-col text-sm sm:text-base">
          <span className="font-medium truncate max-w-[150px] sm:max-w-[200px] md:max-w-[250px] capitalize">
            {user.name}
          </span>
          <span className="text-xs sm:text-sm opacity-50 truncate max-w-[180px]">
            {onlineUsers.includes(user._id)
              ? user.email
              : lastSeenFormate(user.lastSeen)}
          </span>
        </div>
      </div>

      {/* Friend action buttons */}
      <div className="ml-2 shrink-0 flex gap-1 items-center text-sm sm:text-base">
        {!currUser.friends.includes(user._id) &&
          !currUser.pending.includes(user._id) &&
          !currUser.requests.includes(user._id) && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                handleFriendRequest();
              }}
              className="hover:scale-110 transition-transform"
            >
              <Plus />
            </div>
          )}

        {currUser.pending.includes(user._id) &&
          !currUser.friends.includes(user._id) && (
            <div onClick={(e) => e.stopPropagation()} className="opacity-70">
              <Timer />
            </div>
          )}

        {currUser.requests.includes(user._id) && (
          <div
            className="flex gap-1 items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              onClick={handleAccept}
              className="hover:scale-110 transition-transform"
            >
              <Check color="green" />
            </div>
            <div
              onClick={handleReject}
              className="hover:scale-110 transition-transform"
            >
              <X color="red" />
            </div>
          </div>
        )}
      </div>
    </li>
  );
};

export default memo(UserItem);
