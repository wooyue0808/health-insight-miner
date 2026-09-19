# 医药电商客服对话健康需求挖掘器

基于大语言模型的医药电商客服对话分析工具：上传客服对话 CSV，自动提取药品、症状、反馈类型、情感极性等结构化信息，并生成可视化数据看板。

## 功能特性

- **数据导入**：支持 CSV 文件上传或文本粘贴
- **LLM 结构化提取**：自动识别药品名称、药品品类、症状/需求、反馈类型、情感极性、原文摘录
- **一对多提取**：一条对话可产出 0~N 条结构化记录（组内序号区分）
- **结果表格**：按情感极性/药品品类筛选，点击行展开原文对话
- **数据看板**：负面反馈 Top10 柱状图、反馈类型分布环形图
- **工程韧性**：每批 ≤10 条、失败自动重试 1 次、单条失败不影响整体、LLM 输出 JSON 容错解析

## 在线演示

https://health-insight-miner.2937328680.workers.dev

> 注：Cloudflare 免费域名（workers.dev）在国内访问偶有波动，如长时间打不开，可按下方方式本地运行。

## 技术栈

- Next.js 16（App Router）+ TypeScript + Tailwind CSS
- DeepSeek Chat API（OpenAI 兼容协议）
- Recharts 数据可视化
- Cloudflare Workers 部署（@opennextjs/cloudflare）

## 项目结构

```
app/
  page.tsx                  # 主页面（上传/分批调用/结果展示）
  api/extract/route.ts      # 提取接口（POST，单批≤10条）
  components/
    ResultsTable.tsx        # 结果表格组件
    Charts.tsx              # 看板图表组件
lib/
  prompt.ts                 # 提取提示词模板
  llm.ts                    # LLM 调用、重试与 JSON 容错解析
  parseCsv.ts               # 浏览器端 CSV 解析
  analyze.ts                # 前端分批串行调用逻辑
```

## 本地运行

要求：Node.js 20+

```bash
# 1. 克隆仓库
git clone https://github.com/wooyue0808/health-insight-miner.git
cd health-insight-miner

# 2. 安装依赖
npm install

# 3. 配置环境变量：新建 .env.local，填入 DeepSeek API Key
#    LLM_API_KEY=你的Key
#    LLM_BASE_URL=https://api.deepseek.com
#    LLM_MODEL=deepseek-chat

# 4. 启动开发服务器
npm run dev
# 打开 http://localhost:3000
```

## 输入数据格式

CSV 文件需包含两列（表头为中文列名）：

| 对话ID | 对话内容 |
|---|---|
| D001 | 用户：我昨天买了布洛芬…… |
| D002 | 用户：这个维生素C泡腾片…… |

## 输出字段说明

| 字段 | 说明 |
|---|---|
| 对话ID | 原始对话编号 |
| 组内序号 | 同一对话内多条记录的序号 |
| 药品名称 | 识别到的药品/保健品，未提及填"未提及" |
| 药品品类 | 解热镇痛药/感冒用药/胃肠道用药/维生素保健品等 |
| 症状/需求 | 用户描述的身体状况或诉求 |
| 反馈类型 | 药效副作用/商品信息/物流/价格/用药指导等 |
| 反馈极性 | 正面/负面/中性/咨询 |
| 原文摘录 | 支撑判断的原文片段 |

## 设计说明

- **前端分批驱动**：每批 10 条串行调用 API，规避 Serverless 函数执行时长限制
- **无状态接口**：API 不存储数据，每次请求独立，便于横向扩展
- **提示词工程**：提取规则与枚举值集中在 `lib/prompt.ts`，准确率迭代只改这一个文件

## 使用边界

- 本工具仅做信息抽取与归类，**不提供任何用药建议或医学判断**
- 上传的对话内容会发送至 LLM 服务处理，请勿包含真实姓名、手机号、病历号等敏感信息
