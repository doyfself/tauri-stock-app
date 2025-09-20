import React, { useState, useRef } from 'react';
import type { StockKlineChartChildProps } from './types';
import klineConfig from './config';
export default function StockKlineChartStick({
  width,
  height,
  data,
  coordinateX,
  maxPrice,
  minPrice,
  mapToSvg,
  hoverCallback,
}: StockKlineChartChildProps & {
  hoverCallback: (index: number, status: boolean) => void; // 当选中柱子索引变化时的回调
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [mouseY, setMouseY] = useState(0); // 记录鼠标Y坐标
  const chartGroupRef = useRef<SVGGElement>(null);

  // 计算可用高度（去除上下padding）
  const availableHeight = height - klineConfig.padding * 2;

  // 将Y坐标转换为价格
  const getPriceFromY = (y: number): number => {
    // 限制Y坐标在有效范围内
    const clampedY = Math.max(
      klineConfig.padding,
      Math.min(y, klineConfig.padding + availableHeight),
    );

    if (maxPrice === minPrice) return maxPrice;
    const ratio = (clampedY - klineConfig.padding) / availableHeight;
    return maxPrice - ratio * (maxPrice - minPrice);
  };

  // 处理鼠标移动
  const handleMouseMove = (e: React.MouseEvent<SVGGElement>) => {
    if (!chartGroupRef.current) return;

    // 获取鼠标在SVG中的坐标
    const svgRect =
      chartGroupRef.current.ownerSVGElement?.getBoundingClientRect();
    if (!svgRect) return;

    const mouseX = e.clientX - svgRect.left;
    const currentMouseY = e.clientY - svgRect.top;

    // 更新鼠标Y坐标
    setMouseY(currentMouseY);

    // 找到最近的柱子中心（X轴吸附）
    const closestIndex = coordinateX.reduce((closest, x, index) => {
      const currentDiff = Math.abs(x - mouseX);
      const closestDiff = Math.abs(coordinateX[closest] - mouseX);
      return currentDiff < closestDiff ? index : closest;
    }, 0);

    // 更新选中的柱子索引
    if (closestIndex !== activeIndex) {
      setActiveIndex(closestIndex);
      hoverCallback(closestIndex, true); // 触发回调
    }
  };
  const handleMouseLeave = () => {
    setIsHovered(false);
    hoverCallback(activeIndex, false); // 鼠标离开时触发回调
  };
  // 计算当前鼠标位置对应的价格
  const currentPrice = getPriceFromY(mouseY);

  // 计算Y轴显示范围（只在最大价格和最小价格之间）
  const yAxisStart = mapToSvg(maxPrice);
  const yAxisEnd = mapToSvg(minPrice);

  // 限制Y轴虚线在有效范围内
  const constrainedMouseY = Math.max(yAxisStart, Math.min(mouseY, yAxisEnd));

  return (
    <>
      <g
        ref={chartGroupRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
      >
        {/* 添加透明背景矩形作为事件触发区域 */}
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill="transparent"
          style={{ pointerEvents: 'all' }}
        />
        {isHovered && data.length && (
          <>
            {/* X轴虚线 - 吸附到最近的柱子，只在鼠标移入时显示 */}
            <line
              x1={0}
              y1={constrainedMouseY}
              x2={width - klineConfig.right}
              y2={constrainedMouseY}
              stroke="gray"
              strokeWidth="1"
              strokeDasharray="4 2"
            />

            {/* Y轴虚线 - 跟随鼠标垂直移动，只在鼠标移入时显示 */}
            <line
              x1={coordinateX[activeIndex]}
              y1={0}
              x2={coordinateX[activeIndex]}
              y2={height}
              stroke="gray"
              strokeWidth="1"
              strokeDasharray="4 2"
            />
            {/* 时间 - 显示在X轴下侧，随鼠标移动 */}
            <g>
              <rect
                x={coordinateX[activeIndex] - 60}
                y={height - 20}
                rx={3}
                ry={3}
                width={120}
                height={20}
                fill="#ddd"
                stroke="#ddd"
                strokeWidth="1"
              />
              <text
                x={coordinateX[activeIndex]}
                y={height - 10}
                fontSize="12"
                fill="black"
                textAnchor="middle" // 水平居中
                dominantBaseline="middle" // 垂直居中
              >
                {data[activeIndex] ? data[activeIndex].date : ''}
              </text>
            </g>

            {/* 价格标签 - 显示在Y轴右侧，随鼠标移动 */}
            <g>
              {/* 价格标签背景 */}
              <rect
                x={width - klineConfig.right - 5}
                y={constrainedMouseY - 10}
                rx={3}
                ry={3}
                width={60}
                height={20}
                fill="white"
                stroke="gray"
                strokeWidth="1"
              />
              {/* 价格文本 */}
              <text
                x={width - klineConfig.right}
                y={constrainedMouseY + 4}
                fontSize="12"
                fill="black"
              >
                {currentPrice.toFixed(2)}
              </text>
            </g>

            {/* 坐标轴交点指示器 */}
            <circle
              cx={coordinateX[activeIndex]}
              cy={constrainedMouseY}
              r="4"
              fill="purple"
            />
          </>
        )}
      </g>
    </>
  );
}
