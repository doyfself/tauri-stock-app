/**
 * 基于 Fetch API 的请求工具封装
 * 支持拦截器、超时控制、错误处理、JSON 自动转换
 */

// 请求方法类型
type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// 请求配置接口
interface RequestConfig extends RequestInit {
  // 基础 URL
  baseURL?: string;
  // 请求路径
  url: string;
  // 请求方法
  method?: Method;
  // 请求参数（GET 会转为 query 参数，POST 会作为 body）
  data?: Record<string, unknown>;
  // 超时时间（毫秒）
  timeout?: number;
  // 是否需要携带 credentials
  withCredentials?: boolean;
}

// 响应数据接口
interface ResponseData<T> {
  success: boolean;
  data?: T;
  message?: string;
  code?: number;
}

// 创建请求实例
const createRequest = (defaultConfig: Omit<RequestConfig, 'url'> = {}) => {
  // 请求拦截器
  let requestInterceptor: ((config: RequestConfig) => RequestConfig | Promise<RequestConfig>) | null = null;
  
  // 响应拦截器
  let responseInterceptor: ((response: Response) => Response | Promise<Response>) | null = null;
  
  // 错误拦截器
  let errorInterceptor: ((error: Error) => Error | Promise<Error>) | null = null;

  /**
   * 发送请求的核心函数
   */
  const request = async <T>(config: RequestConfig): Promise<ResponseData<T>> => {
    // 合并默认配置和请求配置
    let mergedConfig: RequestConfig = {
      method: 'GET',
      timeout: 10000, // 默认超时 10 秒
      withCredentials: false,
      ...defaultConfig,
      ...config,
    };
    if (requestInterceptor) {
      mergedConfig = await requestInterceptor(mergedConfig);
    }

    const {
      baseURL,
      url,
      method,
      data,
      timeout,
      withCredentials,
      headers,
      ...restConfig
    } = mergedConfig;

    // 构建完整 URL
    const fullURL = baseURL ? `${baseURL.replace(/\/$/, '')}/${url.replace(/^\//, '')}` : url;

    // 处理 GET 请求的 query 参数
    let requestURL = fullURL;
    if (method === 'GET' && data) {
      const params = new URLSearchParams();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
      const queryString = params.toString();
      if (queryString) {
        requestURL += `${fullURL.includes('?') ? '&' : '?'}${queryString}`;
      }
    }

    // 处理请求头
    const requestHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      ...headers,
    };

    // 构建 fetch 参数
    const fetchOptions: RequestInit = {
      method,
      headers: requestHeaders,
      credentials: withCredentials ? 'include' : 'same-origin',
      ...restConfig,
    };

    // 处理 POST 等方法的 body
    if (method !== 'GET' && data) {
      fetchOptions.body = JSON.stringify(data);
    }

    try {
      // 超时控制
      const controller = new AbortController();
      fetchOptions.signal = controller.signal;
      
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, timeout);

      // 发送请求
      let response = await fetch(requestURL, fetchOptions);
      
      // 清除超时定时器
      clearTimeout(timeoutId);

      // 执行响应拦截器
      if (responseInterceptor) {
        response = await responseInterceptor(response);
      }

      // 解析响应数据
      let responseData: ResponseData<T>;
      try {
        responseData = await response.json();
      } catch (e) {
        console.log(e);
        // 非 JSON 响应（如 204 No Content）
        responseData = {
          success: response.ok,
          data: null as unknown as T,
          message: response.statusText,
          code: response.status,
        };
      }

      // 处理 HTTP 错误状态
      if (!response.ok) {
        throw new Error(
          responseData.message || `Request failed with status ${response.status}`
        );
      }

      return responseData;
    } catch (error) {
      // 处理取消请求错误
      if (error instanceof Error && error.name === 'AbortError') {
        error.message = `Request timed out after ${timeout}ms`;
      }

      // 执行错误拦截器
      if (errorInterceptor) {
        await errorInterceptor(error as Error);
      }

      // 统一错误格式
      throw {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        data: null,
      };
    }
  };

  // 快捷方法：GET
  const get = <T>(url: string, config?: Omit<RequestConfig, 'url' | 'method' | 'data'>) => {
    return request<T>({ ...config, url, method: 'GET' });
  };

  // 快捷方法：POST
  const post = <T>(
    url: string,
    data?: Record<string, unknown>,
    config?: Omit<RequestConfig, 'url' | 'method' | 'data'>
  ) => {
    return request<T>({ ...config, url, method: 'POST', data });
  };

  // 快捷方法：PUT
  const put = <T>(
    url: string,
    data?: Record<string, unknown>,
    config?: Omit<RequestConfig, 'url' | 'method' | 'data'>
  ) => {
    return request<T>({ ...config, url, method: 'PUT', data });
  };

  // 快捷方法：DELETE
  const del = <T>(url: string, config?: Omit<RequestConfig, 'url' | 'method' | 'data'>) => {
    return request<T>({ ...config, url, method: 'DELETE' });
  };

  // 设置请求拦截器
  const setRequestInterceptor = (interceptor: typeof requestInterceptor) => {
    requestInterceptor = interceptor;
  };

  // 设置响应拦截器
  const setResponseInterceptor = (interceptor: typeof responseInterceptor) => {
    responseInterceptor = interceptor;
  };

  // 设置错误拦截器
  const setErrorInterceptor = (interceptor: typeof errorInterceptor) => {
    errorInterceptor = interceptor;
  };

  return {
    request,
    get,
    post,
    put,
    delete: del,
    setRequestInterceptor,
    setResponseInterceptor,
    setErrorInterceptor,
  };
};

// 创建默认请求实例
const request = createRequest({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000', // 从环境变量获取基础 URL
});

// 示例：添加请求拦截器（如添加 Token）
request.setRequestInterceptor((config) => {
  return config;
});

// 示例：添加响应拦截器
request.setResponseInterceptor((response) => {
  // 可以在这里统一处理响应状态
  return response;
});

// 示例：添加错误拦截器（如处理 401 未授权）
request.setErrorInterceptor((error) => {
  if (error.message.includes('401')) {
    // 跳转到登录页
    window.location.href = '/login';
  }
  return error;
});

export default request;
