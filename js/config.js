/**
 * Site Configuration
 * 修改此文件即可自定义站点基本信息
 */
const SITE_CONFIG = {
  // 站点元信息
  title: "About-Rui Dong",
  description: "Discover new things",
  favicon: "assets/images/logo.jpg",

  // 个人信息（显示在顶部 masthead）
  profile: {
    name: "Rui Dong",
    description: "让我对这世界好奇", // 显示在名字下方
    email: "your.email@example.com",
    avatar: "assets/images/logo.jpg",
  },

  // 社交链接（导航栏右侧图标）
  socials: [
    { icon: "email", url: "mailto:your.email@example.com", label: "Email" },
    { icon: "github", url: "https://github.com/KamonRiderDR", label: "GitHub" },
    { icon: "xiaohongshu", url: "https://www.xiaohongshu.com/user/profile/612b9bb2000000000100552b", label: "小红书" },
  ],

  // 导航配置
  navigation: [
    { id: "about", label: "About", dataFile: "data/about.md" },
    { id: "papers", label: "Publications", dataFile: "data/papers.md" },
    { id: "notes", label: "Notes", dataFile: "backend/notes/index.md" },
    // { id: "news", label: "News", dataFile: "data/news.md" },
  ],

  // 默认显示的首页内容（about）
  defaultSection: "about",

  // 页脚信息
  footer: {
    copyright: `© ${new Date().getFullYear()} Rui Dong`,
  },
};

// 导出供其他模块使用
if (typeof module !== "undefined" && module.exports) {
  module.exports = SITE_CONFIG;
}
