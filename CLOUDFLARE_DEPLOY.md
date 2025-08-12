# Cloudflare Workers 部署指南

## 项目简介

这是一个IP查询API的Cloudflare Workers版本，提供以下功能：
- 获取访客IP地理位置信息
- 查询指定IP地址的地理位置信息
- 支持中文字符正确显示
- 全球CDN加速，响应速度快

## 文件说明

- `worker.js` - 主要的Workers脚本
- `wrangler.toml` - Cloudflare Workers配置文件
- `package.json` - 项目依赖管理文件

## 部署步骤

### 1. 安装Wrangler CLI

```bash
npm install -g wrangler
```

### 2. 登录Cloudflare账户

```bash
wrangler login
```

### 3. 安装项目依赖

```bash
npm install
```

### 4. 本地开发测试

```bash
npm run dev
```

访问 `http://localhost:8787` 进行本地测试

### 5. 部署到Cloudflare Workers

#### 部署到生产环境
```bash
npm run deploy:production
```

#### 部署到测试环境
```bash
npm run deploy:staging
```

#### 简单部署
```bash
npm run deploy
```

## API接口

### 获取访客IP信息
```
GET https://your-worker.your-subdomain.workers.dev/
```

返回示例：
```json
{
  "ip": "1.2.3.4",
  "city": "中国北京",
  "isp": "中国电信",
  "database": "Cloudflare数据"
}
```

### 查询指定IP信息
```
GET https://your-worker.your-subdomain.workers.dev/ip?ip=8.8.8.8
```

返回示例：
```json
{
  "ip": "8.8.8.8",
  "city": "美国",
  "isp": "Google DNS",
  "database": "模拟数据"
}
```

## 自定义域名

1. 在Cloudflare控制台中添加你的域名
2. 修改 `wrangler.toml` 文件中的路由配置：

```toml
[[env.production.routes]]
pattern = "ip.api.fis.ink/*"
zone_name = "fis.ink"
```

3. 重新部署：
```bash
npm run deploy:production
```

## 监控和日志

查看实时日志：
```bash
npm run tail
```

## 优势

1. **全球分布** - Cloudflare的全球CDN网络，响应速度快
2. **免费额度** - 每天10万次请求免费
3. **自动扩展** - 无需管理服务器，自动处理流量峰值
4. **高可用性** - 99.9%的可用性保证
5. **真实IP信息** - 利用Cloudflare的地理位置数据

## 注意事项

1. Workers有执行时间限制（CPU时间10ms，总时间30秒）
2. 免费版本有每日请求次数限制
3. 对于大量IP查询，建议使用KV存储进行缓存

## 扩展功能

可以考虑添加：
- KV存储缓存查询结果
- 集成第三方IP数据库API
- 添加访问统计功能
- 支持IPv6地址查询