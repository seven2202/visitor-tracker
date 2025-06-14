(function() {
  'use strict';

  // 配置
  const config = {
    apiUrl: window.VISIT_TRACKER_API || 'http://localhost/api/track',
    apiKey: window.VISIT_TRACKER_KEY || '',
    debug: window.VISIT_TRACKER_DEBUG || false
  };

  // 工具函数
  const utils = {
    // 生成唯一ID
    generateId: function() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    },

    // 获取或创建访客ID
    getVisitorId: function() {
      let visitorId = localStorage.getItem('vt_visitor_id');
      if (!visitorId) {
        visitorId = this.generateId();
        localStorage.setItem('vt_visitor_id', visitorId);
      }
      return visitorId;
    },

    // 获取或创建会话ID
    getSessionId: function() {
      let sessionId = sessionStorage.getItem('vt_session_id');
      if (!sessionId) {
        sessionId = this.generateId();
        sessionStorage.setItem('vt_session_id', sessionId);
      }
      return sessionId;
    },

    // 获取URL参数
    getUrlParams: function() {
      const params = new URLSearchParams(window.location.search);
      return {
        utmSource: params.get('utm_source'),
        utmMedium: params.get('utm_medium'),
        utmCampaign: params.get('utm_campaign'),
        utmTerm: params.get('utm_term'),
        utmContent: params.get('utm_content')
      };
    },

    // 获取屏幕分辨率
    getScreenResolution: function() {
      return screen.width + 'x' + screen.height;
    },

    // 获取时区
    getTimezone: function() {
      try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
      } catch (e) {
        return '';
      }
    },

    // 发送数据
    sendData: function(data) {
      if (config.debug) {
        console.log('Visit Tracker:', data);
      }

      // 使用 sendBeacon 或 fetch
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(data)], {
          type: 'application/json'
        });
        navigator.sendBeacon(config.apiUrl, blob);
      } else {
        fetch(config.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data),
          keepalive: true
        }).catch(function(error) {
          if (config.debug) {
            console.error('Visit Tracker Error:', error);
          }
        });
      }
    }
  };

  // 主要跟踪器对象
  const VisitTracker = {
    // 初始化
    init: function(apiKey, options) {
      if (!apiKey) {
        console.error('Visit Tracker: API key is required');
        return;
      }

      config.apiKey = apiKey;
      if (options) {
        if (options.apiUrl) config.apiUrl = options.apiUrl;
        if (options.debug) config.debug = options.debug;
      }

      this.startTime = Date.now();
      this.visitId = null;

      // 立即发送页面访问事件
      this.trackPageView();

      // 监听页面卸载事件
      this.bindEvents();
    },

    // 跟踪页面访问
    trackPageView: function() {
      const urlParams = utils.getUrlParams();
      
      const data = {
        apiKey: config.apiKey,
        url: window.location.href,
        title: document.title,
        referrer: document.referrer,
        visitorId: utils.getVisitorId(),
        sessionId: utils.getSessionId(),
        userAgent: navigator.userAgent,
        language: navigator.language || navigator.userLanguage,
        timezone: utils.getTimezone(),
        screenResolution: utils.getScreenResolution(),
        duration: 0,
        utmSource: urlParams.utmSource,
        utmMedium: urlParams.utmMedium,
        utmCampaign: urlParams.utmCampaign,
        utmTerm: urlParams.utmTerm,
        utmContent: urlParams.utmContent
      };

      utils.sendData(data);
    },

    // 更新停留时间
    updateDuration: function() {
      if (!this.visitId || !this.startTime) return;

      const duration = Math.round((Date.now() - this.startTime) / 1000);
      
      const data = {
        visitId: this.visitId,
        duration: duration
      };

      // 发送到更新接口
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(data)], {
          type: 'application/json'
        });
        navigator.sendBeacon(config.apiUrl + '/duration/' + this.visitId, blob);
      }
    },

    // 绑定事件
    bindEvents: function() {
      const self = this;

      // 页面卸载时更新停留时间
      window.addEventListener('beforeunload', function() {
        self.updateDuration();
      });

      // 页面隐藏时更新停留时间
      document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'hidden') {
          self.updateDuration();
        }
      });

      // 定期更新停留时间（每30秒）
      setInterval(function() {
        self.updateDuration();
      }, 30000);
    },

    // 自定义事件跟踪
    track: function(eventName, properties) {
      const data = {
        apiKey: config.apiKey,
        event: eventName,
        properties: properties || {},
        url: window.location.href,
        visitorId: utils.getVisitorId(),
        sessionId: utils.getSessionId(),
        timestamp: Date.now()
      };

      utils.sendData(data);
    }
  };

  // 自动初始化（如果设置了全局变量）
  if (window.VISIT_TRACKER_KEY) {
    VisitTracker.init(window.VISIT_TRACKER_KEY, {
      apiUrl: window.VISIT_TRACKER_API,
      debug: window.VISIT_TRACKER_DEBUG
    });
  }

  // 暴露到全局
  window.VisitTracker = VisitTracker;

})();
