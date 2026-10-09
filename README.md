# english-vocabulary
My C1+ English Vocabulary Learning

网站：[English Vocabulary](https://haolei96.github.io/english-vocabulary/)，可在 iPhone Safari 中访问并添加到主屏幕。

每天新增 6 个实用单词和 4 个自然短语，优先日常交流、澳洲生活、旅行与运动；长期维护规则见 [AGENTS.md](AGENTS.md)。所有历史内容与学习功能保存在 `index.html` 中，不需要构建或单独付费的 OpenAI API。

更新前运行：

```sh
node scripts/validate.cjs
```

如果终端没有 Node.js，Codex 可使用 `load_workspace_dependencies` 返回的内置 Node.js。验证会检查 Day 1–33 原始 330 项未改变、每天数量、新增项字段、重复词、日期及完整 JavaScript 语法。

每日任务目标时间为 Asia/Shanghai 08:00。使用 Codex 本地定时任务时，Mac 需保持可运行、应用运行，且 GitHub 认证可用。任务按日期防止重复新增，推送 `main` 后检查 GitHub Pages 是否出现新内容。GitHub 登录或发布验证失败必须明确报告，不能把本地提交视为已发布。

朗读使用设备的浏览器语音，口音可用性取决于系统声音。错题复习目前在本轮页面会话中有效，刷新后不保留。
