# eagle-quick-rename（Eagle 快速编号插件）

为 Eagle 当前选中的条目名称追加连续编号，例如：

```text
海报  → 海报001
封面  → 封面002
插画  → 插画003
```

插件不会修改文件扩展名。编号顺序与 `eagle.item.getSelected()` 返回的当前选择顺序一致。

## 功能

- 批量读取 Eagle 当前选中的条目
- 默认从 `001` 开始编号
- 可输入统一名称；输入后忽略所有原名称，生成如 `项目 001`、`项目 002`
- 可调整起始编号、编号位数和分隔符
- 执行前展示完整名称预览
- 提供“重命名”和“重命名并关闭”两种执行方式
- 支持 Eagle 深色主题
- 单个条目保存失败时继续处理其余条目，并显示失败数量

“统一名称”留空时，插件保留每个条目的原名称；输入内容后，插件忽略原名称，并固定用一个空格连接统一名称与编号。

## 在 Eagle 中使用

1. 在 Eagle 工具栏打开「插件」→「开发者选项」→「导入本地项目」。
2. 选择本项目根目录（即包含 `manifest.json` 的目录）。
3. 在 Eagle 中选中需要编号的条目。
4. 从插件面板打开「eagle-quick-rename」。
5. 确认预览后点击「重命名」，或点击「重命名并关闭」在成功后自动退出窗口。

开发调试时，可在插件窗口中按 `F12` 打开 DevTools。正式分发时，请在 Eagle 插件面板中右键此插件并选择「打包插件」，由 Eagle 导出 `.eagleplugin` 文件。

如需快速启动，可在 Eagle 的插件列表中点击「eagle-quick-rename」右侧的三个点，选择「设置快捷键」或将插件置顶。插件窗口内可按 `Command/Ctrl + Enter` 执行重命名。

## 文件说明

```text
.
├── README.md       # 使用及开发说明
├── manifest.json   # Eagle 插件清单
├── index.html      # 窗口入口
├── styles.css      # 界面样式与主题
├── logo.png        # 插件图标
├── assets
│   └── logo.svg    # 可编辑的图标源文件
├── js
│   ├── plugin.js   # Eagle API 与界面交互
│   └── rename.js   # 编号及重命名计划逻辑
└── tests
    ├── project.test.js
    └── rename.test.js
```

## 实现说明

插件通过 `eagle.item.getSelected()` 获取选中条目，仅修改 Item 的 `name` 属性，并逐一调用 `item.save()` 保存。它不会直接改写 Eagle 资源库文件或 `metadata.json`。

## 本地验证

项目没有第三方依赖，安装 Node.js 后可直接运行：

```bash
npm test
```

该命令验证编号格式、统一名称、分隔符、参数边界、重命名计划、版本一致性和双按钮界面结构。
