# 🐸 荷塘大冒险 (Frog Pond Adventure) · H5 轻量营销与独立展示版

> 纯原生 HTML5 Canvas 2D + Web Audio API 实现的轻量级、零依赖休闲小游戏。专为移动端触屏与 PC 交互适配，支持极速秒开与微信生态分享。

![Version](https://img.shields.io/badge/version-v2.0--showcase-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Size](https://img.shields.io/badge/bundle%20size-%3C50KB-orange)
![Tech](https://img.shields.io/badge/stack-Canvas2D%20%7C%20WebAudio-blueviolet)

---

## 🌟 项目亮点

- **⚡ 零外部依赖 & 极速秒开**：整个游戏单文件封装，包体小于 50KB，无外部图像、音频或重型渲染引擎库依赖，加载秒开。
- **🎨 纯代码矢量程序化绘图**：放弃跨平台兼容性差的系统 Emoji，改用纯 Canvas 2D 绘制矢量萌系青蛙（带跳跃挤压变形与动态投影）、水波纹、下沉荷叶与巡逻鳄鱼。
- **🔊 Web Audio 原生合成音效**：纯数学代码实时合成起跳、水花、金币拾取、炸弹爆炸与结算音效，支持一键静音。
- **🛣️ 前向通路可达性算法**：动态保证行与行之间必定存在安全跳跃路径，彻底杜绝孤岛死局。
- **📱 全端多模态控制**：
  - **移动端**：自适应竖屏，提供虚拟十字方向键 + 蓄力按键 + 炸弹按键，且支持屏幕任意位置滑动手势跳跃（Swipe）。
  - **PC 端**：WASD / 方向键跳跃，空格蓄力，J / B / F 投掷炸弹。
- **🏆 营销展示与社交裂变**：内置独立作品展位，结算页面智能评定段位称号，支持“一键复制格式化战报”到朋友圈与社群。

---

## 🎮 玩法与操作说明

| 动作 | 移动端触屏 | PC 键盘 | 机制说明 |
| :--- | :--- | :--- | :--- |
| **常规跳跃** | 点击虚拟十字 D-Pad 或滑动屏幕 | `W / A / S / D` 或 `↑ / ↓ / ← / →` | 向相邻格子跳跃 1 格 |
| **蓄力跳跃** | 点击右下角「⚡ 蓄力」按钮 | `空格键 (Space)` 或 `Shift` | 切换为超远跨水双格跳跃 |
| **施放炸弹** | 点击右下角「💣 炸弹」按钮 | `J` / `B` / `F` | 净化前方 3×3 水域并炸退鳄鱼 |
| **捡拾道具** | 跳上带有莲花/炸弹的荷叶 | 同左 | 拾取粉色莲花：+50 分 & +5 秒；拾取炸弹：补给技能次数 |
| **避让危险** | 避免踏空、下沉荷叶与鳄鱼 | 同左 | 浅色荷叶踩中 1.6 秒后沉没；巡逻鳄鱼靠近前有警示水波 |

---

## 🚀 部署上线指引 (GitHub Pages 一键开启)

本项目采用标准的静态网页结构，只需托管 `index.html` 即可在线体验：

1. **新建或推送到仓库**：
   ```bash
   git init
   git add .
   git commit -m "feat: release v2.0 lightweight showcase edition"
   git branch -M main
   git remote add origin <你的 GitHub 仓库地址>
   git push -u origin main
   ```
2. **开启 GitHub Pages**：
   - 进入 GitHub 仓库页面，点击 **Settings** -> **Pages**。
   - 在 **Build and deployment** 下方的 **Source** 选择 `Deploy from a branch`。
   - **Branch** 选择 `main` 分支根目录 `/ (root)`，点击 **Save**。
   - 稍等 1~2 分钟，即可获得全局访问链接（如 `https://<username>.github.io/<repo>/`）。

---

## 📄 开源许可

本项目基于 [MIT License](LICENSE) 开源。
