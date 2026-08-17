# Backend

前后端分离架构下的**后端内容目录**。所有动态加载的笔记文档及其专属静态资源均存放于此。

---

## 目录结构

```
backend/
├── README.md              # 本文件
├── assets/                # 后端专属静态资源（图片等）
│   └── images/
│       └── logo.jpg
└── notes/                 # 笔记内容（Markdown）
    ├── index.md           # 笔记列表页
    └── test-note.md       # 单篇笔记
```

---

## Notes 模块

### 工作原理

前端 Notes 页面会动态加载 `backend/notes/index.md`，将其渲染为卡片网格。点击卡片后，前端会通过路由加载对应的单篇笔记文件（如 `test-note.md`）。

### 添加新笔记

1. **新建笔记文件**
   在 `backend/notes/` 下新建 `.md` 文件，文件名即为访问 slug（不含 `.md` 后缀）。

   ```bash
   touch backend/notes/my-new-note.md
   ```

2. **编辑列表页 `index.md`**
   在列表中添加一项：

   ```markdown
   - **[笔记标题](my-new-note)**
     - 简短描述，显示在卡片上。
     - *Tag1, Tag2*
   ```

   > 链接中的 `my-new-note` 对应文件名 `my-new-note.md`，**不要加 `.md` 后缀**。

3. **刷新浏览器**即可看到新卡片。

### 笔记 Markdown 格式

```markdown
# 笔记标题

正文内容，支持：
- **加粗**、*斜体*
- [链接](https://example.com)
- 行间公式 $E=mc^2$ 和块级公式 $$...$$
- 代码块 ```python ... ```
- 图片（见下方资源引用）
```

---

## 静态资源

### 图片引用

后端笔记中的图片应放在 `backend/assets/images/` 目录下，引用路径使用**站点相对路径**：

```markdown
![描述](backend/assets/images/your-image.jpg)
```

> 不要使用 `./` 或 `../` 等相对路径，以避免部署到子目录时路径解析错误。

### 图片说明（Caption）

图片下方可以添加说明文字，需**在图片和说明之间留一个空行**，说明文字用斜体：

```markdown
![描述](backend/assets/images/your-image.jpg)

*这是图片的说明文字，会显示为灰色居中小字*
```

如果不留空行（`breaks: true` 模式下），图片和说明会被包进同一段，样式可能异常。

### 资源分离原则

| 资源类型 | 存放位置 | 说明 |
|---------|---------|------|
| 站点通用图片（头像、论文插图） | `assets/images/` | 前端公共资源 |
| 笔记专属图片 | `backend/assets/images/` | 仅笔记内容使用 |

---

## 文件命名规范

- 笔记文件名使用 **kebab-case**（短横线连接的小写字母）
- 图片文件名使用英文，避免空格和特殊字符
- Markdown 文件使用 UTF-8 编码

---

*后端内容由前端动态加载，无需构建步骤，直接修改 Markdown 文件即可生效。*
