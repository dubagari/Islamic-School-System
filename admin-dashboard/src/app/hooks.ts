import { useSelector } from "react-redux";

import type { RootState, AppDispatch } from "./store";
import { useDispatch } from "react-redux";

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
export type { AppDispatch };
