import { invoke } from '@tauri-apps/api/core';

// 启动Python服务器
export const startPythonServer = async () => {
  return invoke('start_python_server');
};

// 停止Python服务器
export const stopPythonServer = async () => {
  return invoke('stop_python_server');
};

// 检查服务器是否运行
export const checkPythonServerStatus = async () => {
  return invoke('is_python_server_running');
};

// 应用启动时自动启动服务器
export const initializePythonServer = async () => {
  try {
    const isRunning = await checkPythonServerStatus();
    if (!isRunning) {
      console.log('启动Python服务器...');
      await startPythonServer();
      console.log('Python服务器启动成功');
    }
  } catch (error) {
    console.error('Python服务器启动失败:', error);
  }
};
