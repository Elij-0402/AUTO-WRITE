# Requirements: InkForge

**Defined:** 2026-04-13
**Core Value:** AI 真正理解你构建的故事世界——自动注入世界观上下文，主动检查跨角色、地点、规则、时间线的矛盾

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication & Sync

- [ ] **AUTH-01**: 用户可以使用邮箱/密码注册账号
- [ ] **AUTH-02**: 用户可以登录并保持会话
- [ ] **AUTH-03**: 用户可以登出
- [ ] **SYNC-01**: 项目数据（章节、世界观、设定）自动同步到云端
- [ ] **SYNC-02**: 用户在不同设备上可以访问同一项目数据

### Project & Chapter

- [ ] **PROJ-01**: 用户可以创建小说项目（一本小说一个项目）
- [ ] **PROJ-02**: 用户可以查看、管理项目列表
- [ ] **PROJ-03**: 用户可以创建、编辑、删除章节
- [ ] **PROJ-04**: 用户可以拖拽排序章节
- [ ] **PROJ-05**: 用户可以查看章节字数、总字数、今日写作字数

### Editor

- [ ] **EDIT-01**: 富文本编辑器支持基础格式（粗体、斜体、标题等）
- [ ] **EDIT-02**: 编辑器自动保存内容
- [ ] **EDIT-03**: 编辑器支持深色/浅色主题切换
- [ ] **EDIT-04**: 编辑器正确处理中文IME输入法

### World Bible

- [ ] **WRLD-01**: 用户可以创建角色条目（姓名、外貌、性格、背景、关系）
- [ ] **WRLD-02**: 用户可以创建地点条目
- [ ] **WRLD-03**: 用户可以创建规则/设定条目
- [ ] **WRLD-04**: 用户可以创建时间线条目
- [ ] **WRLD-05**: 条目之间可以手动建立关联关系
- [ ] **WRLD-06**: AI可以建议条目间关联关系
- [ ] **WRLD-07**: AI可以从草文中主动建议新世界观条目
- [ ] **WRLD-08**: 用户可以搜索和分类浏览世界观条目

### Outline & Plot

- [ ] **OTLN-01**: 用户可以创建和管理章节/情节大纲
- [ ] **OTLN-02**: 用户可以从大纲自动生成整章内容（基于大纲 + 世界观上下文）

### AI Interaction

- [ ] **AI-01**: 用户可以配置AI模型（输入API Key和Base URL）
- [ ] **AI-02**: 用户可以在AI聊天面板中进行对话式交互
- [ ] **AI-03**: AI在聊天面板中生成草稿，用户手动采纳到编辑器
- [ ] **AI-04**: AI自动注入相关世界观上下文（角色、地点、规则、时间线）到生成请求
- [ ] **AI-05**: 用户可以在编辑器中选中文字，在AI聊天面板中针对该片段讨论
- [ ] **AI-06**: AI主动检查生成内容与已建立世界观的矛盾，并提示用户

### Workspace

- [ ] **WORK-01**: 多面板布局——世界观百科、大纲、编辑器、AI聊天同时可见
- [ ] **WORK-02**: 面板可拖拽调整大小
- [ ] **WORK-03**: 面板布局跨会话保持

### Export

- [ ] **EXPT-01**: 用户可以导出为Markdown格式
- [ ] **EXPT-02**: 用户可以导出为DOCX格式
- [ ] **EXPT-03**: 用户可以导出为EPUB格式

### Localization

- [ ] **L10N-01**: 所有UI标签、按钮、菜单使用简体中文
- [ ] **L10N-02**: AI提示词针对中文网文场景优化

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Collaboration

- **COLL-01**: 多人协作写作
- **COLL-02**: 角色关系图谱可视化

### Advanced Editor

- **EDIT-05**: 聚焦模式（隐藏其他面板，只显示编辑器）
- **EDIT-06**: 版本历史和回滚

### Platform

- **PLAT-01**: 桌面端应用（Tauri封装）
- **PLAT-02**: 移动端响应式适配

### Web Novel Workflow

- **WEBN-01**: 每日写作目标追踪
- **WEBN-02**: 写作连续天数/打卡

### Advanced AI

- **AI-07**: AI风格定制/模仿作者风格
- **AI-08**: 直接发布到网文平台

## Out of Scope

| Feature | Reason |
|---------|--------|
| 内联AI自动补全 | 与"草稿→手动采纳"理念冲突，削弱作者控制权 |
| 多人实时协作写作 | v1为单作者工具，CRDT复杂度过高 |
| 图片生成（角色立绘等） | 偏离核心写作价值，计算成本高，版权风险 |
| 内置模型 | 与BYOK模式根本冲突，推理成本不可控 |
| 系列小说共享世界观 | v1一间小说一个项目，架构变更过大 |
| 卷层级结构 | v1采用扁平章节结构 |
| 插件系统 | 过早优化，v1先做好核心功能 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | — | Pending |
| AUTH-02 | — | Pending |
| AUTH-03 | — | Pending |
| SYNC-01 | — | Pending |
| SYNC-02 | — | Pending |
| PROJ-01 | — | Pending |
| PROJ-02 | — | Pending |
| PROJ-03 | — | Pending |
| PROJ-04 | — | Pending |
| PROJ-05 | — | Pending |
| EDIT-01 | — | Pending |
| EDIT-02 | — | Pending |
| EDIT-03 | — | Pending |
| EDIT-04 | — | Pending |
| WRLD-01 | — | Pending |
| WRLD-02 | — | Pending |
| WRLD-03 | — | Pending |
| WRLD-04 | — | Pending |
| WRLD-05 | — | Pending |
| WRLD-06 | — | Pending |
| WRLD-07 | — | Pending |
| WRLD-08 | — | Pending |
| OTLN-01 | — | Pending |
| OTLN-02 | — | Pending |
| AI-01 | — | Pending |
| AI-02 | — | Pending |
| AI-03 | — | Pending |
| AI-04 | — | Pending |
| AI-05 | — | Pending |
| AI-06 | — | Pending |
| WORK-01 | — | Pending |
| WORK-02 | — | Pending |
| WORK-03 | — | Pending |
| EXPT-01 | — | Pending |
| EXPT-02 | — | Pending |
| EXPT-03 | — | Pending |
| L10N-01 | — | Pending |
| L10N-02 | — | Pending |

**Coverage:**
- v1 requirements: 37 total
- Mapped to phases: 0
- Unmapped: 37 ⚠️

---
*Requirements defined: 2026-04-13*
*Last updated: 2026-04-13 after initial definition*