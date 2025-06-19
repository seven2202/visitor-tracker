<?php
/**
 * WordPress Visit Tracker 集成示例
 * 
 * 将此代码添加到您的主题的 functions.php 文件中
 * 或创建为独立插件
 */

// 防止直接访问
if (!defined('ABSPATH')) {
    exit;
}

class VisitTrackerWP {
    
    private $api_key;
    private $tracker_url;
    
    public function __construct() {
        $this->api_key = get_option('visit_tracker_api_key', '');
        $this->tracker_url = 'https://visitor.fllai.cn';
        
        // 添加 WordPress 钩子
        add_action('wp_head', array($this, 'add_tracking_script'));
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
    }
    
    /**
     * 在页面头部添加统计代码
     */
    public function add_tracking_script() {
        if (empty($this->api_key)) {
            return;
        }
        
        // 检查是否需要排除当前页面
        if ($this->should_exclude_page()) {
            return;
        }
        
        ?>
        <script>
        (function() {
            var API_KEY = '<?php echo esc_js($this->api_key); ?>';
            var TRACKER_URL = '<?php echo esc_js($this->tracker_url); ?>';
            
            // 加载统计脚本
            var script = document.createElement('script');
            script.src = TRACKER_URL + '/sdk/tracker.js';
            script.onload = function() {
                if (window.VisitTracker) {
                    VisitTracker.init(API_KEY, {
                        trackPageViews: true,
                        trackClicks: true,
                        trackScrolling: true,
                        debug: <?php echo WP_DEBUG ? 'true' : 'false'; ?>,
                        // WordPress 特定配置
                        customData: {
                            post_id: <?php echo get_the_ID() ?: 'null'; ?>,
                            post_type: '<?php echo esc_js(get_post_type()); ?>',
                            is_home: <?php echo is_home() ? 'true' : 'false'; ?>,
                            is_single: <?php echo is_single() ? 'true' : 'false'; ?>,
                            is_page: <?php echo is_page() ? 'true' : 'false'; ?>,
                            category: '<?php echo esc_js(get_the_category_list(', ')); ?>'
                        }
                    });
                }
            };
            script.onerror = function() {
                console.warn('Visit Tracker: 无法加载统计脚本');
            };
            document.head.appendChild(script);
        })();
        </script>
        <?php
    }
    
    /**
     * 检查是否应该排除当前页面
     */
    private function should_exclude_page() {
        // 排除管理员页面
        if (is_admin()) {
            return true;
        }
        
        // 排除登录页面
        if (in_array($GLOBALS['pagenow'], array('wp-login.php', 'wp-register.php'))) {
            return true;
        }
        
        // 排除管理员用户的访问（可选）
        if (current_user_can('manage_options') && get_option('visit_tracker_exclude_admin', false)) {
            return true;
        }
        
        return false;
    }
    
    /**
     * 添加管理菜单
     */
    public function add_admin_menu() {
        add_options_page(
            'Visit Tracker 设置',
            'Visit Tracker',
            'manage_options',
            'visit-tracker',
            array($this, 'admin_page')
        );
    }
    
    /**
     * 注册设置
     */
    public function register_settings() {
        register_setting('visit_tracker_settings', 'visit_tracker_api_key');
        register_setting('visit_tracker_settings', 'visit_tracker_exclude_admin');
    }
    
    /**
     * 管理页面
     */
    public function admin_page() {
        ?>
        <div class="wrap">
            <h1>Visit Tracker 设置</h1>
            
            <form method="post" action="options.php">
                <?php settings_fields('visit_tracker_settings'); ?>
                <?php do_settings_sections('visit_tracker_settings'); ?>
                
                <table class="form-table">
                    <tr>
                        <th scope="row">API Key</th>
                        <td>
                            <input type="text" 
                                   name="visit_tracker_api_key" 
                                   value="<?php echo esc_attr($this->api_key); ?>" 
                                   class="regular-text" 
                                   placeholder="sk-xxxxxxxxxxxxxxxx" />
                            <p class="description">
                                请在 <a href="https://visitor.fllai.cn" target="_blank">Visit Tracker 管理后台</a> 获取您的 API Key
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">排除管理员</th>
                        <td>
                            <label>
                                <input type="checkbox" 
                                       name="visit_tracker_exclude_admin" 
                                       value="1" 
                                       <?php checked(get_option('visit_tracker_exclude_admin'), 1); ?> />
                                不统计管理员的访问
                            </label>
                        </td>
                    </tr>
                </table>
                
                <?php submit_button(); ?>
            </form>
            
            <hr>
            
            <h2>使用说明</h2>
            <ol>
                <li>访问 <a href="https://visitor.fllai.cn" target="_blank">Visit Tracker 管理后台</a></li>
                <li>登录并添加您的网站</li>
                <li>复制 API Key 并粘贴到上面的输入框中</li>
                <li>保存设置，统计代码将自动添加到所有页面</li>
            </ol>
            
            <h2>统计数据</h2>
            <p>配置完成后，您可以在 <a href="https://visitor.fllai.cn" target="_blank">Visit Tracker 管理后台</a> 查看详细的访问统计数据。</p>
        </div>
        <?php
    }
}

// 初始化插件
new VisitTrackerWP();

/**
 * 手动追踪事件的辅助函数
 */
function visit_tracker_event($event_name, $data = array()) {
    ?>
    <script>
    if (window.VisitTracker) {
        VisitTracker.track('event', {
            name: '<?php echo esc_js($event_name); ?>',
            data: <?php echo json_encode($data); ?>
        });
    }
    </script>
    <?php
}

/**
 * 使用示例：
 * 
 * // 在模板文件中追踪下载事件
 * visit_tracker_event('download', array(
 *     'file' => 'document.pdf',
 *     'post_id' => get_the_ID()
 * ));
 * 
 * // 追踪表单提交
 * visit_tracker_event('form_submit', array(
 *     'form' => 'contact',
 *     'page' => get_the_title()
 * ));
 */
?>
