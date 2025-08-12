# IP地址查询API

提供IP地址查询接口，支持Python Flask和Cloudflare Workers两种部署方式。

## 功能说明

- 提供IP地址查询接口
- 返回IP地址对应的城市和运营商信息
- 支持IP地址库更新
- 支持中文字符正确显示
- 提供Cloudflare Workers全球加速版本

## 安装依赖

```bash
pip install -r requirements.txt
```

## 使用方法

### 1. 更新IP地址库

```bash
python qqwry_update.py
```

### 2. 启动API服务

#### Windows环境
```bash
python qqwry_ip.py
```

#### Linux环境
```bash
# 给启动脚本执行权限
chmod +x start.sh

# 启动服务
./start.sh
```

服务将在端口8889上启动。

## API接口

### 1. 获取访客IP信息

**请求方式：** GET

**请求地址：** `http://localhost:8889/`

**返回示例：**
```json
{
    "ip": "127.0.0.1",
    "city": "本地回环",
    "isp": "本机",
    "database": "模拟数据"
}
```

### 2. 查询指定IP地址信息

**请求方式：** GET

**请求地址：** `http://localhost:8889/ip`

**请求参数：**
- ip: 要查询的IP地址

**请求示例：**
```
http://localhost:8889/ip?ip=8.8.8.8
```

**返回示例：**
```json
{
    "ip": "8.8.8.8",
    "city": "美国",
    "isp": "Google DNS",
    "database": "模拟数据"
}
```

## 部署方式

### 方式一：Python Flask（本地部署）

适合本地开发和小规模部署。

### 方式二：Cloudflare Workers（全球加速）

适合生产环境，提供全球CDN加速，详见 [Cloudflare Workers部署指南](CLOUDFLARE_DEPLOY.md)

## 文件说明

### Python版本
- `qqwry_update.py`: IP地址库更新工具
- `qqwry_ip.py`: IP查询API接口
- `requirements.txt`: 项目依赖
- `start.sh`: Linux启动脚本
- `qqwry.dat`: IP地址数据库文件

### Cloudflare Workers版本
- `worker.js`: Cloudflare Workers脚本
- `wrangler.toml`: Workers配置文件
- `package.json`: 项目依赖管理
- `CLOUDFLARE_DEPLOY.md`: 部署指南