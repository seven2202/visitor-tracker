// React Visit Tracker 集成示例

import React, { useEffect, useState } from 'react';

// Visit Tracker Hook
const useVisitTracker = (apiKey, options = {}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!apiKey) {
      setError('API Key is required');
      return;
    }

    // 加载统计脚本
    const loadTracker = () => {
      return new Promise((resolve, reject) => {
        // 检查是否已经加载
        if (window.VisitTracker) {
          resolve(window.VisitTracker);
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://visitor.fllai.cn/sdk/tracker.js';
        script.async = true;
        
        script.onload = () => {
          if (window.VisitTracker) {
            resolve(window.VisitTracker);
          } else {
            reject(new Error('VisitTracker not found'));
          }
        };
        
        script.onerror = () => {
          reject(new Error('Failed to load VisitTracker script'));
        };
        
        document.head.appendChild(script);
      });
    };

    loadTracker()
      .then((tracker) => {
        // 初始化统计
        tracker.init(apiKey, {
          trackPageViews: true,
          trackClicks: true,
          debug: process.env.NODE_ENV === 'development',
          ...options
        });
        setIsLoaded(true);
      })
      .catch((err) => {
        setError(err.message);
        console.error('Visit Tracker initialization failed:', err);
      });
  }, [apiKey]);

  // 手动追踪页面浏览
  const trackPageView = (path, title) => {
    if (window.VisitTracker && isLoaded) {
      window.VisitTracker.track('pageview', {
        path: path || window.location.pathname,
        title: title || document.title
      });
    }
  };

  // 追踪自定义事件
  const trackEvent = (eventName, data = {}) => {
    if (window.VisitTracker && isLoaded) {
      window.VisitTracker.track('event', {
        name: eventName,
        data: data
      });
    }
  };

  return {
    isLoaded,
    error,
    trackPageView,
    trackEvent
  };
};

// 页面组件示例
const HomePage = () => {
  const { isLoaded, error, trackEvent } = useVisitTracker('your-api-key-here');

  const handleButtonClick = (buttonName) => {
    trackEvent('button_click', {
      button: buttonName,
      page: 'home'
    });
  };

  const handleDownload = (fileName) => {
    trackEvent('download', {
      file: fileName,
      page: 'home'
    });
  };

  return (
    <div>
      <h1>我的网站首页</h1>
      
      {error && (
        <div style={{ color: 'red', padding: '10px', background: '#ffe6e6' }}>
          统计初始化失败: {error}
        </div>
      )}
      
      {isLoaded && (
        <div style={{ color: 'green', padding: '10px', background: '#e6ffe6' }}>
          ✅ 访问统计已启用
        </div>
      )}

      <button onClick={() => handleButtonClick('cta_button')}>
        立即注册
      </button>
      
      <button onClick={() => handleDownload('product_brochure.pdf')}>
        下载产品手册
      </button>
    </div>
  );
};

// React Router 集成示例
import { useLocation } from 'react-router-dom';

const App = () => {
  const location = useLocation();
  const { trackPageView } = useVisitTracker('your-api-key-here');

  // 监听路由变化，自动追踪页面浏览
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location, trackPageView]);

  return (
    <div>
      {/* 您的应用内容 */}
    </div>
  );
};

// Vue.js 集成示例
const VueIntegration = `
// Vue 3 Composition API 示例
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';

export function useVisitTracker(apiKey, options = {}) {
  const isLoaded = ref(false);
  const error = ref(null);

  const loadTracker = async () => {
    try {
      if (window.VisitTracker) {
        return window.VisitTracker;
      }

      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://visitor.fllai.cn/sdk/tracker.js';
        script.async = true;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });

      if (window.VisitTracker) {
        window.VisitTracker.init(apiKey, {
          trackPageViews: true,
          trackClicks: true,
          ...options
        });
        isLoaded.value = true;
        return window.VisitTracker;
      }
    } catch (err) {
      error.value = err.message;
      console.error('Visit Tracker initialization failed:', err);
    }
  };

  const trackEvent = (eventName, data = {}) => {
    if (window.VisitTracker && isLoaded.value) {
      window.VisitTracker.track('event', {
        name: eventName,
        data: data
      });
    }
  };

  onMounted(() => {
    loadTracker();
  });

  return {
    isLoaded,
    error,
    trackEvent
  };
}

// 在组件中使用
export default {
  setup() {
    const route = useRoute();
    const { isLoaded, trackEvent } = useVisitTracker('your-api-key-here');

    // 监听路由变化
    watch(() => route.path, (newPath) => {
      if (window.VisitTracker && isLoaded.value) {
        window.VisitTracker.track('pageview', {
          path: newPath,
          title: document.title
        });
      }
    });

    const handleClick = (buttonName) => {
      trackEvent('button_click', { button: buttonName });
    };

    return {
      isLoaded,
      handleClick
    };
  }
};
`;

export default HomePage;
export { useVisitTracker, VueIntegration };
