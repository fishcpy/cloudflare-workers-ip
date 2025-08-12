# 同步更新说明

## 更新内容

### 本地Python版本 (qqwry_ip.py)
- ✅ 使用 `qqwry.dat` 数据库文件
- ✅ 支持IPv4和IPv6地址查询
- ✅ 完整的IP地址验证
- ✅ 数据库类型：QQwry

### Cloudflare Worker版本 (worker.js)
- ✅ 已同步IPv6支持
- ✅ 更新IP验证函数支持IPv4和IPv6
- ✅ 添加IPv6示例数据
- ✅ 增强IPv6地址类型识别

## 主要改进

1. **IPv6支持同步**
   - 添加IPv6示例数据到模拟数据库
   - 更新IP验证函数支持IPv6格式
   - 添加IPv6地址类型识别（本地回环、链路本地、私有网络等）

2. **数据库状态**
   - 本地版本：使用 `qqwry.dat` 数据库，查询准确
   - Cloudflare版本：使用Cloudflare数据 + 模拟数据

3. **功能对比**
   - 本地版本：真实数据库查询，更准确
   - Cloudflare版本：Cloudflare地理数据 + 模拟数据，适合CDN部署

## 部署建议

1. **本地开发**：使用Python版本，数据更准确
2. **生产环境**：部署Cloudflare Worker版本，全球CDN加速
3. **数据同步**：定期更新qqwry.dat数据库文件

## 测试用例

### IPv4测试
- `123.112.18.121` → 中国–北京–北京–海淀区, 联通
- `8.8.8.8` → 美国, Google DNS

### IPv6测试
- `2001:4860:4860::8888` → 美国, Google IPv6 DNS
- `fe80::1` → 链路本地(IPv6), 本地链路

## 注意事项

- 两个版本现在都支持IPv6
- 本地版本使用真实数据库，Cloudflare版本使用模拟数据
- 建议根据使用场景选择合适的版本