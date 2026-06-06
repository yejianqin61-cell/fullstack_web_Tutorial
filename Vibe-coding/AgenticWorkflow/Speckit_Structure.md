



docs/

00-Constitution/
01-Requirements/
02-Clarify/
03-Architecture/
04-Modules/
05-Tasks/
06-Analysis/
07-Implementation/
08-Test/
09-Deploy/



# Ascii Structure

```
SPEC-DRIVEN DEVELOPMENT WORKFLOW
================================

Idea
 │
 ▼
Constitution
 │
 │  Define project principles
 │  Define technical constraints
 │  Define coding standards
 │
 ▼
Specify
 │
 │  Define WHAT to build
 │  Define WHY it is needed
 │  Define business requirements
 │
 ▼
Clarify
 │
 │  Eliminate ambiguity
 │  Answer open questions
 │  Complete requirement details
 │
 ▼
Plan
 │
 │  Define HOW to build it
 │  Architecture Design
 │  Database Design
 │  API Design
 │  Technical Decisions
 │
 ▼
Tasks
 │
 │  Break large modules
 │  Create executable tasks
 │  Define task dependencies
 │
 ▼
Analyze
 │
 │  Impact Analysis
 │  Risk Analysis
 │  Dependency Analysis
 │  Performance Analysis
 │
 ▼
Implement
 │
 │  Coding
 │  Refactoring
 │  Documentation
 │
 ▼
Test
 │
 │  Unit Test
 │  Integration Test
 │  Acceptance Test
 │
 ▼
Deploy
 │
 │  CI/CD
 │  Production Release
 │  Monitoring
 │
 ▼
Complete
```



# 00-Constitution

对应：

```
项目宪法
项目原则
技术规范
开发规范
```

例如：

```
Mobile First

TypeScript Only

API First

RBAC Permission

PostgreSQL Only

All Database Changes Require Migration

All Features Require Tests
```

------

Agent职责：

```
所有Agent启动前必须读取
```

------

未来：

```
PM Agent
Backend Agent
Frontend Agent
QA Agent
```

都必须遵守。

------

# 01-Requirements

对应你现在的：

```
PRD
```

------

例如：

```
消息系统

用户可以收到点赞通知

用户可以收到评论通知

用户可以收到私信
```

------

注意：

这里不能出现：

```
Redis

Postgres

WebSocket
```

因为那是技术方案。

------

这里只回答：

```
What
Why
```

------

# 02-Clarify

这个其实特别有价值。

很多人没有这个文档。

------

例如：

```
Q:
消息保存多久？

A:
永久保存
```

------

```
Q:
支持关闭通知吗？

A:
支持
```

------

```
Q:
实时推送还是轮询？

A:
实时推送
```

------

这个文档的意义：

```
记录所有需求讨论结果
```

------

否则半年后：

```
为什么这样设计？
```

没人知道。

------

# 03-Architecture

对应你的：

```
SSR
System Design
```

------

内容：

```
技术选型

数据库设计

接口设计

架构图

数据流图
```

------

这里开始讨论：

```
Node

Redis

Postgres

React Native
```

------

回答：

```
How
```

------

# 04-Modules

对应：

```
Module Design
```

------

例如：

```
Auth Module

Message Module

Admin Module

Marketplace Module
```

------

每个模块：

```
职责

接口

依赖

边界
```

------

这一层特别重要。

因为未来：

```
一个模块
=
一个Agent工作单元
```

------

# 05-Tasks

这是 Spec-Kit 的核心创新之一。

------

例如：

Message Module

拆成：

```
Task001 Create Message Table

Task002 Create Notification Table

Task003 Create Notification Service

Task004 Create Read API

Task005 Add Tests
```

------

注意：

这里已经不是：

```
模块
```

而是：

```
可执行任务
```

------

这层未来直接给 Agent。

例如：

```
Backend Agent

执行Task003
```

------

# 06-Analysis

这是你现在最缺的。

------

内容：

```
影响分析

风险分析

依赖分析

性能分析
```

------

例如：

新增消息系统。

------

影响：

```
User Module

Treehole Module

Marketplace Module

Admin Module
```

------

风险：

```
消息量爆炸

实时推送压力

未读计数性能问题
```

------

这个文档其实是：

```
架构师的思考过程
```

------

# 07-Implementation

这里开始真正开发。

------

内容：

```
开发记录

代码规范

接口实现说明

Migration记录
```

------

Agent输出：

```
开发日报

开发公报

代码提交记录
```

------

你最近迷上的：

```
HTML开发公报
```

其实就属于这里。

------

# 08-Test

对应：

```
Test Design
```

------

内容：

```
测试用例

边界测试

压力测试

验收标准
```

------

Agent：

```
QA Agent
```

主要工作区域。

------

# 09-Deploy

对应：

```
Deploy Design
```

------

内容：

```
Docker

CI/CD

服务器配置

数据库迁移
```

------

Agent：

```
DevOps Agent
```

负责。





# Mapping on Dorm project

```
docs/
│
├── 00-Constitution/
│   │
│   ├── Project-Principles.md
│   ├── Technical-Rules.md
│   ├── Coding-Standards.md
│   └── Security-Policy.md
│
├── 01-Requirements/
│   │
│   ├── PRD.md
│   ├── User-Stories.md
│   └── Business-Requirements.md
│
├── 02-Clarify/
│   │
│   ├── Requirement-QA.md
│   ├── Design-Decisions.md
│   └── Open-Questions.md
│
├── 03-Architecture/
│   │
│   ├── System-Design.md
│   ├── Database-Design.md
│   ├── API-Design.md
│   └── Architecture-Diagram.md
│
├── 04-Modules/
│   │
│   ├── Auth-Module.md
│   ├── Message-Module.md
│   ├── Marketplace-Module.md
│   └── Admin-Module.md
│
├── 05-Tasks/
│   │
│   ├── Task-001.md
│   ├── Task-002.md
│   ├── Task-003.md
│   └── Sprint-Board.md
│
├── 06-Analysis/
│   │
│   ├── Impact-Analysis.md
│   ├── Risk-Analysis.md
│   ├── Dependency-Analysis.md
│   └── Performance-Analysis.md
│
├── 07-Implementation/
│   │
│   ├── Development-Log.md
│   ├── Change-Log.md
│   └── Agent-Reports.md
│
├── 08-Test/
│   │
│   ├── Test-Plan.md
│   ├── Test-Cases.md
│   ├── Test-Reports.md
│   └── Acceptance-Criteria.md
│
└── 09-Deploy/
    │
    ├── Deployment-Guide.md
    ├── CI-CD.md
    ├── Infrastructure.md
    └── Operations.md
```





# Mapping on Multi-agent structure

```
PM Agent
│
├── Constitution
├── Requirements
└── Clarify

        │
        ▼

Architect Agent
│
├── Architecture
├── Modules
└── Analysis

        │
        ▼

Task Agent
│
└── Tasks

        │
        ▼

Developer Agents
│
├── Frontend Agent
├── Backend Agent
├── Mobile Agent
└── Database Agent

        │
        ▼

QA Agent
│
└── Test

        │
        ▼

DevOps Agent
│
└── Deploy
```

