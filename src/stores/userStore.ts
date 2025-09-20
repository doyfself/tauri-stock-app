import { create } from 'zustand';

// 定义状态存储接口
interface SelectionStore {
  // 用于触发刷新的标识
  refreshFlag: number;
  // 触发自选列表刷新的方法
  triggerSelectionRefresh: () => void;
}

// 创建Zustand存储
export const useSelectionStore = create<SelectionStore>((set) => ({
  // 初始标识为0
  refreshFlag: 0,
  // 每次调用时更新标识（+1），触发订阅更新
  triggerSelectionRefresh: () =>
    set((state) => ({
      refreshFlag: state.refreshFlag + 1,
    })),
}));

export const useSelectionLineStore = create<SelectionStore>((set) => ({
  // 初始标识为0
  refreshFlag: 0,
  // 每次调用时更新标识（+1），触发订阅更新
  triggerSelectionRefresh: () =>
    set((state) => ({
      refreshFlag: state.refreshFlag + 1,
    })),
}));
