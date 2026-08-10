# 测试笔记：公式、图片与链接

这是一篇测试文档，用于验证 Notes 详情页的完整渲染效果。

## 数学公式

行内公式示例：质能方程 $E = mc^2$ 是爱因斯坦提出的。

块级公式——高斯积分：

$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$

矩阵表示：

$$
\mathbf{A} = \begin{bmatrix} a_{11} & a_{12} \\ a_{21} & a_{22} \end{bmatrix}
$$

多行对齐公式：

$$
\begin{aligned}
\nabla \cdot \mathbf{E} &= \frac{\rho}{\varepsilon_0} \\
\nabla \times \mathbf{B} &= \mu_0 \mathbf{J} + \mu_0 \varepsilon_0 \frac{\partial \mathbf{E}}{\partial t}
\end{aligned}
$$

## 图片测试

使用站点相对路径引用图片：

![Logo](backend/assets/images/logo.jpg)

## 链接测试

- **外部链接**：[我的 GitHub](https://github.com/KamonRiderDR)
- **相对链接（返回 Notes）**：点击导航栏的 Notes 或使用下方的返回按钮

## 列表与嵌套

有序列表：

1. 第一步：收集数据
2. 第二步：训练模型
3. 第三步：评估性能
   - 准确率
   - F1 分数
   - AUC-ROC

无序列表：

- 图神经网络
  - GCN
  - GAT
  - GraphSAGE
- 大语言模型
  - GPT 系列
  - LLaMA 系列

## 引用块

> "The advance of technology is based on making it fit in so that you don't really even notice it, so it's part of everyday life."
>
> — Bill Gates

## 代码块

Python 示例：

```python
def softmax(x):
    import numpy as np
    exp_x = np.exp(x - np.max(x))
    return exp_x / exp_x.sum()
```

JavaScript 示例：

```javascript
const greet = (name) => {
  return `Hello, ${name}!`;
};
console.log(greet("World"));
```

## 表格

| 模型 | 参数量 | 年份 |
|------|--------|------|
| ResNet-50 | 25M | 2015 |
| ViT-Base | 86M | 2020 |
| LLaMA-7B | 7B | 2023 |

## 分割线

---

*文档结束。如果所有元素都正确渲染，说明 Notes 详情页功能正常。*

