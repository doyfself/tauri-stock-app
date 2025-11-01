import type { Moment } from 'moment';
import type { HoldingItem } from '@/types/response';
import type {
  AddOrderParams,
  AddHoldingParams,
  UpdateHoldingParams,
} from '@/apis/api';
import {
  addOrderApi,
  addHoldingApi,
  updateHoldingApi,
  deleteHoldingApi,
} from '@/apis/api';
export type FieldType = {
  stock: {
    code: string;
    name: string;
  };
  time: Moment;
  cost: number;
  quantity: number;
  action: string;
};
interface HoldingLogicProps {
  values: FieldType;
  holdingList: HoldingItem[];
  onSuccess?: () => void; // 成功后的回调，比如刷新持仓列表
}

/**
 * 处理委托添加逻辑，包括持仓的自动管理
 */
export const handleOrderWithHolding = async ({
  values,
  holdingList,
  onSuccess,
}: HoldingLogicProps): Promise<boolean> => {
  try {
    const { stock, time, cost, quantity, action } = values;
    const isBuy = action === '1';
    // 1. 首先添加委托记录
    const orderParams: AddOrderParams = {
      code: stock.code,
      name: stock.name,
      time: time.toISOString(),
      quantity,
      cost,
      action,
    };

    const orderResult = await addOrderApi(orderParams);
    if (!orderResult.success) {
      return false;
    }

    // 2. 查找是否已有持仓
    const existingHolding = holdingList.find(
      (item) => item.code === stock.code,
    );

    if (isBuy) {
      // 买入操作
      await handleBuyAction(stock, cost, quantity, existingHolding);
    } else {
      // 卖出操作
      await handleSellAction(stock, cost, quantity, existingHolding);
    }

    onSuccess?.(); // 执行成功回调
    return true;
  } catch (error) {
    console.error('处理委托失败:', error);
    return false;
  }
};

/**
 * 处理买入操作（移动平均成本法）
 */
const handleBuyAction = async (
  stock: { code: string; name: string },
  buyPrice: number,
  buyQuantity: number,
  existingHolding?: HoldingItem,
) => {
  if (existingHolding) {
    // 已有持仓，重新计算平均成本
    const newQuantity = existingHolding.quantity + buyQuantity;
    const newCost = calculateAverageCost(
      existingHolding.cost,
      existingHolding.quantity,
      buyPrice,
      buyQuantity,
    );

    const updateParams: UpdateHoldingParams = {
      id: existingHolding.id,
      cost: newCost,
      quantity: newQuantity,
    };

    const updateResult = await updateHoldingApi(updateParams);
    if (!updateResult.success) {
      throw new Error(`更新持仓失败: ${updateResult.message}`);
    }

    console.log(
      `买入 ${stock.name}(${stock.code}): 数量 ${buyQuantity}，价格 ${buyPrice}，新平均成本 ${newCost.toFixed(2)}`,
    );
  } else {
    // 没有持仓，新增持仓
    const addParams: AddHoldingParams = {
      code: stock.code,
      name: stock.name,
      cost: buyPrice,
      quantity: buyQuantity,
    };

    const addResult = await addHoldingApi(addParams);
    if (!addResult.success) {
      throw new Error(`新增持仓失败: ${addResult.message}`);
    }

    console.log(
      `新建持仓 ${stock.name}(${stock.code}): 数量 ${buyQuantity}，成本 ${buyPrice}`,
    );
  }
};

/**
 * 处理卖出操作（成本调整法）
 */
const handleSellAction = async (
  stock: { code: string; name: string },
  sellPrice: number,
  sellQuantity: number,
  existingHolding?: HoldingItem,
) => {
  if (!existingHolding) {
    throw new Error(`无法卖出未持有的股票: ${stock.name}(${stock.code})`);
  }

  if (existingHolding.quantity < sellQuantity) {
    throw new Error(
      `卖出数量超过持仓数量: 持仓 ${existingHolding.quantity}，卖出 ${sellQuantity}`,
    );
  }

  const remainingQuantity = existingHolding.quantity - sellQuantity;
  const realizedProfit = (sellPrice - existingHolding.cost) * sellQuantity;

  if (remainingQuantity > 0) {
    // 调整剩余持仓成本：将部分盈利计入成本调整
    const newCost = Math.max(
      existingHolding.cost - realizedProfit / remainingQuantity,
      0,
    );

    const updateParams: UpdateHoldingParams = {
      id: existingHolding.id,
      cost: newCost,
      quantity: remainingQuantity,
    };

    const updateResult = await updateHoldingApi(updateParams);
    if (!updateResult.success) {
      throw new Error(`更新持仓失败: ${updateResult.message}`);
    }

    console.log(
      `卖出 ${stock.name}(${stock.code}): 数量 ${sellQuantity}，价格 ${sellPrice}，盈利 ${realizedProfit.toFixed(2)}，剩余成本 ${newCost.toFixed(2)}`,
    );
  } else {
    // 全部卖出，删除持仓
    const deleteResult = await deleteHoldingApi(existingHolding.id);
    if (!deleteResult.success) {
      throw new Error(`删除持仓失败: ${deleteResult.message}`);
    }

    console.log(
      `清仓 ${stock.name}(${stock.code}): 数量 ${sellQuantity}，价格 ${sellPrice}，总盈利 ${realizedProfit.toFixed(2)}`,
    );
  }

  return realizedProfit;
};

/**
 * 计算平均成本
 * 公式: (原成本 * 原数量 + 新成本 * 新数量) / (原数量 + 新数量)
 */
const calculateAverageCost = (
  originalCost: number,
  originalQuantity: number,
  newCost: number,
  newQuantity: number,
): number => {
  const totalValue = originalCost * originalQuantity + newCost * newQuantity;
  const totalQuantity = originalQuantity + newQuantity;
  return Number((totalValue / totalQuantity).toFixed(4)); // 保留4位小数
};
