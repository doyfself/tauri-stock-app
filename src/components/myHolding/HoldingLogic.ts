import type { Dayjs } from 'dayjs';
import type { HoldingItem } from '@/types/response';
import {
  addOrderApi,
  deleteOrderApi,
  addHoldingApi,
  updateHoldingApi,
  queryHoldingByCodeApi,
  deleteHoldingApi,
} from '@/apis/api';

export type FieldType = {
  stock: {
    code: string;
    name: string;
  };
  time: Dayjs;
  cost: number;
  quantity: number;
  action: string;
};

interface HoldingLogicProps {
  values: FieldType;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

interface DeleteOrderLogicProps {
  orderId: number;
  orderData: {
    code: string;
    name: string;
    time: string;
    cost: number;
    quantity: number;
    action: string;
  };
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

/**
 * 处理委托添加逻辑，包括持仓的自动管理
 */
export const handleOrderWithHolding = async ({
  values,
  onSuccess,
  onError,
}: HoldingLogicProps): Promise<boolean> => {
  try {
    const { stock, time, cost, quantity, action } = values;
    const isBuy = action === '1';

    // 1. 首先添加委托记录
    const orderParams = {
      code: stock.code,
      name: stock.name,
      time: time.toISOString(),
      quantity,
      cost,
      action,
    };

    const orderResult = await addOrderApi(orderParams);
    if (!orderResult.success) {
      throw new Error(`添加委托记录失败: ${orderResult.message}`);
    }

    // 2. 根据股票代码查询最近持仓
    const holdingResult = await queryHoldingByCodeApi(stock.code);

    if (isBuy) {
      // 买入操作
      await handleBuyAction(stock, time, cost, quantity, holdingResult.data);
    } else {
      // 卖出操作
      await handleSellAction(stock, time, cost, quantity, holdingResult.data);
    }

    onSuccess?.(); // 执行成功回调
    return true;
  } catch (error) {
    console.error('处理委托失败:', error);
    onError?.(error instanceof Error ? error.message : '处理委托失败');
    return false;
  }
};

/**
 * 处理买入操作
 */
const handleBuyAction = async (
  stock: { code: string; name: string },
  time: Dayjs,
  buyPrice: number,
  buyQuantity: number,
  existingHolding?: HoldingItem,
) => {
  // 如果没有持仓或者持仓状态为0（历史记录），则新建持仓
  if (!existingHolding || existingHolding.status === 0) {
    const addParams = {
      code: stock.code,
      name: stock.name,
      hold_time: time.format('YYYY-MM-DD HH:mm:ss'),
      cost: buyPrice,
      quantity: buyQuantity,
      status: 1, // 当前持仓
    };

    const addResult = await addHoldingApi(addParams);
    if (!addResult.success) {
      throw new Error(`新增持仓失败: ${addResult.message}`);
    }

    console.log(
      `新建持仓 ${stock.name}(${stock.code}): 数量 ${buyQuantity}，成本 ${buyPrice}`,
    );
  } else {
    // 已有当前持仓，重新计算平均成本
    const newQuantity = existingHolding.quantity + buyQuantity;
    const newCost = calculateAverageCost(
      existingHolding.cost,
      existingHolding.quantity,
      buyPrice,
      buyQuantity,
    );

    const updateParams = {
      id: existingHolding.id,
      cost: newCost,
      quantity: newQuantity,
      status: 1, // 保持当前持仓状态
    };

    const updateResult = await updateHoldingApi(updateParams);
    if (!updateResult.success) {
      throw new Error(`更新持仓失败: ${updateResult.message}`);
    }

    console.log(
      `买入 ${stock.name}(${stock.code}): 数量 ${buyQuantity}，价格 ${buyPrice}，新平均成本 ${newCost.toFixed(2)}`,
    );
  }
};

/**
 * 处理卖出操作
 */
const handleSellAction = async (
  stock: { code: string; name: string },
  time: Dayjs,
  sellPrice: number,
  sellQuantity: number,
  existingHolding?: HoldingItem,
) => {
  if (!existingHolding || existingHolding.status === 0) {
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
    // 部分卖出，调整剩余持仓成本
    const newCost = Math.max(
      existingHolding.cost - realizedProfit / remainingQuantity,
      0,
    );

    const updateParams = {
      id: existingHolding.id,
      cost: newCost,
      quantity: remainingQuantity,
      status: 1, // 仍然是当前持仓
    };

    const updateResult = await updateHoldingApi(updateParams);
    if (!updateResult.success) {
      throw new Error(`更新持仓失败: ${updateResult.message}`);
    }

    console.log(
      `部分卖出 ${stock.name}(${stock.code}): 数量 ${sellQuantity}，价格 ${sellPrice}，盈利 ${realizedProfit.toFixed(2)}，剩余成本 ${newCost.toFixed(2)}`,
    );
  } else {
    // 全部卖出，将状态改为历史记录
    const updateParams = {
      id: existingHolding.id,
      cost: existingHolding.cost,
      quantity: existingHolding.quantity,
      status: 0, // 改为历史记录
      sell_time: time.format('YYYY-MM-DD HH:mm:ss'),
      sell_price: sellPrice,
      profit: realizedProfit,
    };

    const updateResult = await updateHoldingApi(updateParams);
    if (!updateResult.success) {
      throw new Error(`更新持仓状态失败: ${updateResult.message}`);
    }

    console.log(
      `清仓 ${stock.name}(${stock.code}): 数量 ${sellQuantity}，价格 ${sellPrice}，总盈利 ${realizedProfit.toFixed(2)}`,
    );
  }

  return realizedProfit;
};

/**
 * 计算平均成本
 */
const calculateAverageCost = (
  originalCost: number,
  originalQuantity: number,
  newCost: number,
  newQuantity: number,
): number => {
  const totalValue = originalCost * originalQuantity + newCost * newQuantity;
  const totalQuantity = originalQuantity + newQuantity;
  return Number((totalValue / totalQuantity).toFixed(4));
};

/**
 * 处理删除委托逻辑，智能管理持仓的恢复和调整
 */
export const handleDeleteOrderWithHolding = async ({
  orderId,
  orderData,
  onSuccess,
  onError,
}: DeleteOrderLogicProps): Promise<boolean> => {
  try {
    const { code, name, cost, quantity, action } = orderData;
    const isBuy = action === '1';

    // 1. 首先删除委托记录
    const deleteResult = await deleteOrderApi(orderId);
    if (!deleteResult.success) {
      throw new Error(`删除委托记录失败: ${deleteResult.message}`);
    }

    // 2. 根据股票代码查询最近持仓
    const holdingResult = await queryHoldingByCodeApi(code);

    if (isBuy) {
      // 反向买入操作：调整或删除持仓
      await handleReverseBuyAction(
        code,
        name,
        cost,
        quantity,
        holdingResult.data,
      );
    } else {
      // 反向卖出操作：恢复被卖出的持仓
      await handleReverseSellAction(
        code,
        name,
        cost,
        quantity,
        holdingResult.data,
      );
    }

    onSuccess?.(); // 执行成功回调
    return true;
  } catch (error) {
    console.error('处理删除委托失败:', error);
    onError?.(error instanceof Error ? error.message : '处理删除委托失败');
    return false;
  }
};

/**
 * 反向处理买入操作（删除买入委托时调用）
 */
const handleReverseBuyAction = async (
  code: string,
  name: string,
  buyPrice: number,
  buyQuantity: number,
  existingHolding?: HoldingItem,
) => {
  if (!existingHolding) {
    // 如果没有持仓，说明这个买入委托没有生成持仓，不需要处理
    console.log(`没有找到 ${name}(${code}) 的持仓记录，无需处理`);
    return;
  }

  // 检查当前持仓是否由该委托生成
  const isExactMatch =
    existingHolding.quantity === buyQuantity &&
    Math.abs(existingHolding.cost - buyPrice) < 0.001; // 考虑浮点数精度

  if (isExactMatch) {
    // 如果完全匹配，说明持仓就是由这个委托生成的，删除持仓
    const deleteResult = await deleteHoldingApi(existingHolding.id);
    if (!deleteResult.success) {
      throw new Error(`删除持仓失败: ${deleteResult.message}`);
    }
    console.log(
      `删除由买入委托生成的持仓 ${name}(${code}): 数量 ${buyQuantity}，成本 ${buyPrice}`,
    );
  } else {
    // 如果不完全匹配，说明持仓是由多个委托生成的，需要调整持仓
    await adjustHoldingForReverseBuy(existingHolding, buyPrice, buyQuantity);
  }
};

/**
 * 调整持仓（针对非完全匹配的买入委托删除）
 */
const adjustHoldingForReverseBuy = async (
  holding: HoldingItem,
  buyPrice: number,
  buyQuantity: number,
) => {
  // 计算新的数量和成本
  const newQuantity = holding.quantity - buyQuantity;

  if (newQuantity <= 0) {
    // 如果调整后数量为0或负数，删除持仓
    const deleteResult = await deleteHoldingApi(holding.id);
    if (!deleteResult.success) {
      throw new Error(`删除持仓失败: ${deleteResult.message}`);
    }
    console.log(`调整后持仓数量为0，删除持仓 ${holding.name}(${holding.code})`);
    return;
  }

  // 重新计算成本：从总价值中减去这个委托的价值
  const currentTotalValue = holding.cost * holding.quantity;
  const removedValue = buyPrice * buyQuantity;
  const newCost = (currentTotalValue - removedValue) / newQuantity;

  const updateParams = {
    id: holding.id,
    cost: Number(newCost.toFixed(4)),
    quantity: newQuantity,
    status: 1,
  };

  const updateResult = await updateHoldingApi(updateParams);
  if (!updateResult.success) {
    throw new Error(`调整持仓失败: ${updateResult.message}`);
  }

  console.log(
    `调整持仓 ${holding.name}(${holding.code}): 新数量 ${newQuantity}，新成本 ${newCost.toFixed(4)}`,
  );
};

/**
 * 反向处理卖出操作（删除卖出委托时调用）
 */
const handleReverseSellAction = async (
  code: string,
  name: string,
  sellPrice: number,
  sellQuantity: number,
  existingHolding?: HoldingItem,
) => {
  if (!existingHolding) {
    // 如果没有持仓，说明卖出操作清仓了，需要恢复持仓
    // 注意：这里我们无法知道原始成本，所以用卖出价格作为近似成本
    const addParams = {
      code: code,
      name: name,
      hold_time: new Date().toISOString().split('T')[0],
      cost: sellPrice, // 使用卖出价格作为近似成本
      quantity: sellQuantity,
      status: 1,
    };

    const addResult = await addHoldingApi(addParams);
    if (!addResult.success) {
      throw new Error(`恢复持仓失败: ${addResult.message}`);
    }

    console.log(
      `恢复被清仓的持仓 ${name}(${code}): 数量 ${sellQuantity}，近似成本 ${sellPrice}`,
    );
  } else {
    // 如果是部分卖出，恢复卖出的数量
    const newQuantity = existingHolding.quantity + sellQuantity;

    // 重新计算成本：将卖出的股票按卖出价格"买回"
    const currentTotalValue = existingHolding.cost * existingHolding.quantity;
    const addedValue = sellPrice * sellQuantity;
    const newCost = (currentTotalValue + addedValue) / newQuantity;

    const updateParams = {
      id: existingHolding.id,
      cost: Number(newCost.toFixed(4)),
      quantity: newQuantity,
      status: 1,
    };

    const updateResult = await updateHoldingApi(updateParams);
    if (!updateResult.success) {
      throw new Error(`回滚卖出操作失败: ${updateResult.message}`);
    }

    console.log(
      `回滚卖出操作 ${name}(${code}): 恢复数量 ${sellQuantity}，新数量 ${newQuantity}，新成本 ${newCost.toFixed(4)}`,
    );
  }
};
