/**
 * auto-toc.js - 自动生成带锚点的目录
 * 为无 id 的标题自动生成 id，实现页内跳转
 * 适用于多页面复用
 */

(function () {
    'use strict';

    const CONFIG = {
        // 要扫描的标题选择器
        selectors: 'h1',
        // 目录容器 ID
        containerId: 'toc-container',
        // 目录标题
        title: 'Table of Content',
        // 是否清空容器
        clearContainer: true,
    };

    /**
     * 生成 URL 友好的 slug
     * @param {string} text - 原始标题文本
     * @returns {string} - 清理后的 slug
     */
    function generateSlug(text) {
        return text
            .toString()
            .trim()
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')   // 移除特殊字符
            .replace(/[\s_]+/g, '-')    // 空格/下划线 → 连字符
            .replace(/^-+|-+$/g, '');   // 移除首尾连字符
    }

    /**
     * 为标题生成唯一 ID
     * @param {HTMLElement} heading - 标题元素
     * @param {string} baseSlug - 基础 slug
     * @returns {string} - 唯一 ID
     */
    function generateUniqueId(heading, baseSlug) {
        let id = baseSlug;
        let counter = 1;
        // 确保 ID 唯一
        while (document.getElementById(id) && document.getElementById(id) !== heading) {
            id = `${baseSlug}-${counter}`;
            counter++;
        }
        return id;
    }

    /**
     * 创建或获取目录容器
     */
    function getOrCreateContainer() {
        let container = document.getElementById(CONFIG.containerId);
        if (!container) {
            container = document.createElement('div');
            container.id = CONFIG.containerId;
            container.className = 'auto-toc';
            // 插入到 body 开头
            if (document.body.firstChild) {
                document.body.insertBefore(container, document.body.firstChild);
            } else {
                document.body.appendChild(container);
            }
        }
        if (CONFIG.clearContainer) {
            container.innerHTML = '';
        }
        return container;
    }

    /**
     * 注入基础 CSS 样式
     */
    function injectStyles() {
        if (document.getElementById('auto-toc-styles')) return;

        const style = document.createElement('style');
        style.id = 'auto-toc-styles';
        style.textContent = `
            .auto-toc {
                background: #f8f9fa;
                border: 1px solid #e9ecef;
                border-radius: 8px;
                padding: 16px;
                margin: 2rem 0;
                font-size: 0.95em;
            }
            .auto-toc h2.toc-title {
                margin: 0 0 12px 0;
                padding: 0;
                font-size: 1.2em;
                color: #333;
                border-bottom: 2px solid #007bff;
            }
            .auto-toc ul {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            .auto-toc li {
                margin: 4px 0;
            }
            .auto-toc a {
                text-decoration: none;
                color: #0056b3;
                transition: color 0.2s;
            }
            .auto-toc a:hover {
                color: #007bff;
                text-decoration: underline;
            }
            .toc-level-2 { padding-left: 0; font-weight: 500; }
            .toc-level-3 { padding-left: 16px; }
            .toc-level-4 { padding-left: 32px; }

            /* 启用平滑滚动 */
            html {
                scroll-behavior: smooth;
            }

            /* 响应式 */
            @media (max-width: 768px) {
                .auto-toc { margin: 1rem 0; font-size: 0.9em; }
                .toc-level-3 { padding-left: 12px; }
                .toc-level-4 { padding-left: 24px; }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * 主函数：生成目录
     */
    function generateTOC() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', generateTOC);
            return;
        }

        const headings = Array.from(document.querySelectorAll(CONFIG.selectors));
        if (headings.length === 0) return;

        // injectStyles();
        const container = getOrCreateContainer();

        // 添加目录标题
        const titleEl = document.createElement('h2');
        titleEl.className = 'toc-title';
        titleEl.textContent = CONFIG.title;
        container.appendChild(titleEl);

        // 创建列表
        const ul = document.createElement('ul');
        container.appendChild(ul);

        headings.forEach(heading => {
            // 1. 为标题设置或生成 id
            if (!heading.id) {
                const baseSlug = generateSlug(heading.textContent);
                if (baseSlug) {
                    heading.id = generateUniqueId(heading, baseSlug);
                } else {
                    // 如果标题为空，使用默认 id
                    heading.id = generateUniqueId(heading, 'section');
                }
            }

            // 2. 获取层级 (h2=2, h3=3, h4=4)
            const level = parseInt(heading.tagName.charAt(1), 10);

            // 3. 创建目录项
            const li = document.createElement('li');
            li.className = `toc-level-${level}`;

            const link = document.createElement('a');
            link.href = `#${heading.id}`;
            link.textContent = heading.textContent.trim();

            li.appendChild(link);
            ul.appendChild(li);
        });
    }

    // 启动
    generateTOC();

})();