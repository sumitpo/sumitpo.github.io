// js/auto-index.js

/**
 * 构建分类定义列表 (dl/dt/dd)
 * 严格模仿 okmij.org/ftp/ 的 "Shortcuts" 区域格式。
 * @param {Object} postMap - 来自 buildPostMap() 的数据，键为类别，值为文章数组
 * @returns {HTMLElement} 完整构建的 <dl class="category-list"> 元素
 */
function buildCategoryList(postMap) {
  const dl = document.createElement('dl');
  dl.className = 'category-list';

  // 按类别字母顺序排序
  const sortedCategories = Object.keys(postMap).sort();

  // 为每个类别创建 dt 和 dd
  sortedCategories.forEach(category => {
    // 创建 dt (Definition Term) - 类别名称
    const dt = document.createElement('dt');
    const strong = document.createElement('strong');
    strong.textContent = category;
    dt.appendChild(strong);
    dt.className = "postDt";

    // 创建 dd (Definition Description) - 所有文章链接，用 "; " 分隔
    const dd = document.createElement('dd');
    dd.className = "postDd";

    const articles = postMap[category];

    // 构建链接列表
    articles.forEach((article, index) => {
      const link = document.createElement('a');
      link.href = `${SITE_CONFIG.postsDir}${article.filename}`;
      link.textContent = article.slug; // 显示文件名 (slug)

      // 将链接添加到 dd
      dd.appendChild(link);

      // 如果不是最后一个，添加分号和空格
      if (index < articles.length - 1) {
        const separator = document.createTextNode('; ');
        dd.appendChild(separator);
      }
    });

    // 将 dt 和 dd 添加到 dl
    dl.appendChild(dt);
    dl.appendChild(dd);
  });

  return dl; // 返回构建好的定义列表
}

/**
 * 新增：独立函数 - 构建页面头部（header）
 * @param {Object} config - 站点配置对象，包含 title, subtitle, description
 * @returns {HTMLElement} 完整构建的 <header> 元素
 */
function buildHeader(config) {
  const header = document.createElement('header');

  // 创建 h1
  const h1 = document.createElement('h1');
  h1.textContent = config.title;

  // 创建副标题 p
  const subtitle = document.createElement('p');
  subtitle.textContent = config.subtitle;

  // 创建描述 p
  const description = document.createElement('p');
  description.textContent = config.description;

  // 组装 header
  header.appendChild(h1);
  header.appendChild(subtitle);
  header.appendChild(description);

  return header; // 返回构建好的元素
}

/**
 * 新增：独立函数 - 构建页面页脚（footer）
 * @param {Object} config - 站点配置对象，包含 title, githubUrl, copyrightYear
 * @returns {HTMLElement} 完整构建的 <footer> 元素
 */
function buildFooter(config) {
  const footer = document.createElement('footer');

  // 创建版权文本
  const copyrightText = document.createTextNode(`© ${config.copyrightYear} ${config.title}. All content is available under the `);
  footer.appendChild(copyrightText);

  // 创建 CC BY-SA 4.0 链接
  const ccLink = document.createElement('a');
  ccLink.href = 'https://creativecommons.org/licenses/by-sa/4.0/';
  ccLink.textContent = 'CC BY-SA 4.0';
  footer.appendChild(ccLink);

  // 创建句点和空格
  const periodText = document.createTextNode('. ');
  footer.appendChild(periodText);

  // 创建 GitHub 链接
  const sourceLink = document.createElement('a');
  sourceLink.href = config.githubUrl;
  sourceLink.textContent = 'Source on GitHub';
  footer.appendChild(sourceLink);

  return footer; // 返回构建好的元素
}

/**
 * 核心函数：从 posts/ 目录读取所有 .html 文件，解析 <h1> 和第一个段落，
 * 并返回一个按类别分组的、用于构建表格的数据结构。
 * @returns {Object} 一个对象，键是类别名，值是该类别下所有文章的数组。
 */
async function buildPostMap() {
  const htmlFiles = SITE_CONFIG.postFiles;

  if (htmlFiles.length === 0) {
    console.warn("No articles found in the posts/ directory.");
    return {};
  }

  console.log(`Found ${htmlFiles.length} article(s):`, htmlFiles);

  // Step 2: 异步获取每篇文章的 <h1> 和首个非空段落
  const articles = await Promise.all(
    htmlFiles.map(async (filename) => {
      const res = await fetch(SITE_CONFIG.postsDir + filename);
      if (!res.ok) {
        console.warn(`Failed to fetch ${filename}: ${res.status}`);
        return null;
      }
      const text = await res.text();
      const tempDoc = new DOMParser().parseFromString(text, 'text/html');

      const metaCategory = tempDoc.querySelector('meta[name="category"]');
      let category = '';
      if (metaCategory && metaCategory.content.trim().length > 0) {
        category = metaCategory.content.trim();
      } else {
        category = 'others'; // 自动设置默认类别
        console.log(`[Auto-inject] No <meta name="category"> found in ${filename}, setting category to '${category}'.`);
      }

      // 提取描述 (第一个非空段落)
      let content = '';
      const paragraphs = Array.from(tempDoc.querySelectorAll('p'));
      for (const p of paragraphs) {
        const text = p.textContent.trim();
        if (text.length > 0) {
          content = text;
          break;
        }
      }

      // 如果没有找到段落，就用文件名作为占位符
      if (!content) {
        content = filename.replace(/\.html$/, '');
      }

      const slug = filename.replace(/\.html$/, '');

      return { filename, category, slug, content };
    })
  );

  const validArticles = articles.filter(article => article !== null);

  // Step 3: 按类别分组
  const categories = {};
  validArticles.forEach(article => {
    if (!categories[article.category]) {
      categories[article.category] = [];
    }
    categories[article.category].push(article);
  });

  return categories;
}

/**
 * 核心函数：接收 postMap 数据，生成一个完整的 HTML <table> 元素。
 * 表格格式严格模仿 okmij.org/ftp/ 的 "Shortcuts" 区域。
 * 每行：第一列是类别名（加粗），第二列是分号分隔的链接列表。
 * @param {Object} postMap - 来自 buildPostMap() 的数据
 * @returns {HTMLElement} 一个完整的 <table> 元素
 */
function createKnowledgeTable(postMap) {
  // 创建表格并设置属性
  const table = document.createElement('table');
  table.className = 'knowledge-table';
  table.setAttribute('rules', 'cols');     // 仅显示列分隔线
  table.setAttribute('cellpadding', '10'); // 单元格内边距 10px
  const row = document.createElement('tr');

  const shortCutCell = document.createElement('td');
  shortCutCell.className = "shortcuts";
  shortCutCell.textContent = "shortcuts to do";

  const postsCell = document.createElement('td')
  postsCell.className = "posts"
  postsCell.appendChild(buildCategoryList(postMap))

  const languageCell = document.createElement('td');
  languageCell.classList = "language";
  languageCell.textContent = "language to do";

  row.appendChild(shortCutCell);
  row.appendChild(postsCell);
  row.appendChild(languageCell);
  table.appendChild(row);
  return table;
}

/**
 * 主函数：当页面加载完成时执行。
 * 调用 buildPostMap() 获取数据，然后用 createKnowledgeTable() 生成表格，
 * 最后将表格插入到 index.html 的 <main> 中。
 */
async function buildAutoIndex() {
  const mainContainer = document.querySelector('main');
  if (!mainContainer) {
    console.error("Main container not found in index.html");
    return;
  }

  mainContainer.innerHTML = '<p>Loading knowledge base...</p>';

  try {
    const postMap = await buildPostMap();
    const knowledgeTable = createKnowledgeTable(postMap);
    mainContainer.innerHTML = '';

    const header = buildHeader(SITE_CONFIG)
    mainContainer.appendChild(header);
    mainContainer.appendChild(knowledgeTable);

    const footer = buildFooter(SITE_CONFIG)
    mainContainer.appendChild(footer);

    console.log("Knowledge base index built successfully!");
  } catch (error) {
    console.error("Error building auto-index:", error);
    mainContainer.innerHTML = `<p style="color: red;">Error loading knowledge base: ${error.message}</p>`;
  }
}

document.addEventListener('DOMContentLoaded', buildAutoIndex);
