# english-vocabulary
My C1+ English Vocabulary Learning

网站：[English Vocabulary](https://haolei96.github.io/english-vocabulary/)，可在 iPhone Safari 中访问并添加到主屏幕。

每天新增 6 个实用单词和 4 个自然短语，优先日常交流、澳洲生活、旅行与运动；长期维护规则见 [AGENTS.md](AGENTS.md)。所有历史内容与学习功能保存在 `index.html` 中，不需要构建或单独付费的 OpenAI API。

更新前运行：

```sh
node scripts/validate.cjs
```

例句、中文提示、阅读批次与每日日期限制的回归检查：`node scripts/validate.test.cjs`。

如果终端没有 Node.js，Codex 可使用 `load_workspace_dependencies` 返回的内置 Node.js。验证会检查原始历史与小贴士基线、每项三个双语例句、纯中文题面，以及每天数量、新增项字段、重复词、日期及完整 JavaScript 语法。2026-10-20 授权清理的 34 处英文括注及小灯泡追加记录在 `scripts/prompt-migrations.json`，还原这些明确变更后仍须匹配原历史哈希。

历史词条已补齐 💡 用法小贴士；点击「显示答案」后，可查看常用搭配、语气和易混点。

每个单词或短语都有三个英文例句及中文翻译，点击「显示答案」后展示，每句旁边都有独立的朗读按钮。原例句仍用于挖空练习，新增两句提供不同语境。中文题面中的英文括注已移除；有用的搭配、易混词和发音提示放在小灯泡中。

Day 39–44 是从《歪唇男人》中英对照文本精选的 60 项阅读补充，每组 6 个单词、4 个短语。答案使用现代例句，展开「原文第 X 页」可查看书中的英文及此前译文。阅读批次使用实际导入日期，多个批次可同日加入；普通每日任务仍最多新增一组，并按最新 Day 编号继续。

疑难发音及语域核对参考剑桥词典：[incredulity](https://dictionary.cambridge.org/dictionary/english/incredulity)、[ostensibly](https://dictionary.cambridge.org/pronunciation/english/ostensibly)、[frantically](https://dictionary.cambridge.org/pronunciation/english/frantically)、[take the cake](https://dictionary.cambridge.org/dictionary/english/take-the-cake)。

每日任务目标时间为 Asia/Shanghai 08:00。使用 Codex 本地定时任务时，Mac 需保持可运行、应用运行，且 GitHub 认证可用。任务按日期防止重复新增，推送 `main` 后检查 GitHub Pages 是否出现新内容。GitHub 登录或发布验证失败必须明确报告，不能把本地提交视为已发布。

朗读使用设备的浏览器语音，口音可用性取决于系统声音。错题复习目前在本轮页面会话中有效，刷新后不保留。
