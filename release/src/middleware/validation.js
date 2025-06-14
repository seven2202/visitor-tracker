const Joi = require('joi');

// 访问统计数据验证
const trackingSchema = Joi.object({
  apiKey: Joi.string().required(),
  url: Joi.string().uri().required(),
  title: Joi.string().max(500).optional(),
  referrer: Joi.string().uri().allow('').optional(),
  visitorId: Joi.string().required(),
  sessionId: Joi.string().required(),
  userAgent: Joi.string().optional(),
  language: Joi.string().max(10).optional(),
  timezone: Joi.string().max(50).optional(),
  screenResolution: Joi.string().max(50).optional(),
  duration: Joi.number().min(0).optional(),
  utmSource: Joi.string().max(255).optional(),
  utmMedium: Joi.string().max(255).optional(),
  utmCampaign: Joi.string().max(255).optional(),
  utmTerm: Joi.string().max(255).optional(),
  utmContent: Joi.string().max(255).optional()
});

// 网站创建验证
const websiteSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  domain: Joi.string().domain().required()
});

// 用户注册验证
const userRegistrationSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

// 用户登录验证
const userLoginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required()
});

// 验证中间件工厂函数
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }
    next();
  };
};

// 具体的验证中间件
const validateTrackingData = validate(trackingSchema);
const validateWebsite = validate(websiteSchema);
const validateUserRegistration = validate(userRegistrationSchema);
const validateUserLogin = validate(userLoginSchema);

module.exports = {
  validateTrackingData,
  validateWebsite,
  validateUserRegistration,
  validateUserLogin
};
