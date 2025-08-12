// Cloudflare Workers IP查询API
// 支持获取访客IP信息和查询指定IP地址信息

// 模拟IP数据库
const mockData = {
  '8.8.8.8': { city: '美国–加利福尼亚州–山景城', isp: 'Google LLC' },
  '114.114.114.114': { city: '中国–江苏–南京', isp: '南京信风网络科技有限公司' },
  '1.1.1.1': { city: '美国–加利福尼亚州–旧金山', isp: 'Cloudflare Inc' },
  '223.5.5.5': { city: '中国–浙江–杭州', isp: '阿里云计算有限公司' },
  '180.76.76.76': { city: '中国–北京–北京', isp: '百度在线网络技术(北京)有限公司' },
  '123.112.18.121': { city: '中国–北京–北京–海淀区', isp: '联通' },
  '2001:4860:4860::8888': { city: '美国–加利福尼亚州–山景城(IPv6)', isp: 'Google LLC' },
  '2606:4700:4700::1111': { city: '美国–加利福尼亚州–旧金山(IPv6)', isp: 'Cloudflare Inc' }
};

// 获取模拟IP信息
function getMockIpInfo(ip) {
  if (mockData[ip]) {
    return { city: mockData[ip].city, isp: mockData[ip].isp };
  }
  
  // IPv6地址处理
  if (ip.includes(':')) {
    if (ip === '::1') {
      return { city: '本地回环(IPv6)', isp: '本机' };
    } else if (ip.startsWith('fe80:')) {
      return { city: '链路本地(IPv6)', isp: '本地链路' };
    } else if (ip.startsWith('fc00:') || ip.startsWith('fd00:')) {
      return { city: '私有网络(IPv6)', isp: '局域网设备' };
    } else if (ip.startsWith('ff00:')) {
      return { city: '组播地址(IPv6)', isp: '多播网络' };
    } else if (ip.startsWith('2001:db8:')) {
      return { city: '文档地址(IPv6)', isp: '测试网络' };
    } else {
      return { city: '未知地区(IPv6)', isp: '未知运营商' };
    }
  }
  
  // IPv4地址处理
  if (ip.startsWith('192.168.')) {
    return { city: '私有网络(C类)', isp: '局域网设备' };
  } else if (ip.startsWith('10.')) {
    return { city: '私有网络(A类)', isp: '企业内网' };
  } else if (ip.startsWith('172.')) {
    // 检查是否在172.16.0.0-172.31.255.255范围内
    const parts = ip.split('.');
    if (parts.length >= 2 && parseInt(parts[1]) >= 16 && parseInt(parts[1]) <= 31) {
      return { city: '私有网络(B类)', isp: '企业内网' };
    } else {
      return { city: '未知地区', isp: '未知运营商' };
    }
  } else if (ip.startsWith('127.')) {
    return { city: '本地回环', isp: '本机' };
  } else if (ip.startsWith('169.254.')) {
    return { city: 'APIPA地址', isp: '自动配置' };
  } else if (ip.startsWith('224.') || ip.startsWith('225.') || ip.startsWith('226.') || 
             ip.startsWith('227.') || ip.startsWith('228.') || ip.startsWith('229.') || 
             ip.startsWith('230.') || ip.startsWith('231.') || ip.startsWith('232.') || 
             ip.startsWith('233.') || ip.startsWith('234.') || ip.startsWith('235.') || 
             ip.startsWith('236.') || ip.startsWith('237.') || ip.startsWith('238.') || 
             ip.startsWith('239.')) {
    return { city: '组播地址', isp: '多播网络' };
  } else {
    return { city: '未知地区', isp: '未知运营商' };
  }
}

// 验证IP地址格式（支持IPv4和IPv6）
function isValidIP(ip) {
  // IPv4验证
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Pattern.test(ip)) {
    const parts = ip.split('.');
    return parts.every(part => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    });
  }
  
  // IPv6验证（简化版）
  if (ip.includes(':')) {
    // 基本的IPv6格式检查
    const ipv6Pattern = /^([0-9a-fA-F]{0,4}:){1,7}[0-9a-fA-F]{0,4}$/;
    const compressedPattern = /^([0-9a-fA-F]{0,4}:)*::([0-9a-fA-F]{0,4}:)*[0-9a-fA-F]{0,4}$/;
    
    return ipv6Pattern.test(ip) || compressedPattern.test(ip) || ip === '::1';
  }
  
  return false;
}

// 获取访客真实IP
function getClientIP(request) {
  // Cloudflare Workers中获取真实IP的方法
  const cfConnectingIP = request.headers.get('CF-Connecting-IP');
  const xForwardedFor = request.headers.get('X-Forwarded-For');
  const xRealIP = request.headers.get('X-Real-IP');
  
  if (cfConnectingIP) return cfConnectingIP;
  if (xForwardedFor) return xForwardedFor.split(',')[0].trim();
  if (xRealIP) return xRealIP;
  
  return '127.0.0.1'; // 默认值
}

// 获取IP地理信息（使用Cloudflare的cf对象）
function getIPInfoFromCloudflare(request, ip) {
  const cf = request.cf;
  
  if (cf && cf.country) {
    // 将国家代码转换为中文
    const countryMap = {
      'US': '美国',
      'CN': '中国',
      'JP': '日本',
      'KR': '韩国',
      'GB': '英国',
      'DE': '德国',
      'FR': '法国',
      'CA': '加拿大',
      'AU': '澳大利亚',
      'SG': '新加坡',
      'HK': '香港',
      'TW': '台湾',
      'RU': '俄罗斯',
      'IN': '印度',
      'BR': '巴西'
    };
    
    const country = countryMap[cf.country] || cf.country;
    const city = cf.city || '未知城市';
    const region = cf.region || '';
    
    let location = country;
    if (city !== '未知城市') {
      location = region ? `${country}${region}${city}` : `${country}${city}`;
    }
    
    return {
      city: location,
      isp: cf.asOrganization || '未知运营商'
    };
  }
  
  // 如果没有Cloudflare信息，使用模拟数据
  return getMockIpInfo(ip);
}

// 处理根路径请求
async function handleIndex(request) {
  try {
    const visitorIP = getClientIP(request);
    const ipInfo = getIPInfoFromCloudflare(request, visitorIP);
    
    const response = {
      ip: visitorIP,
      city: ipInfo.city,
      isp: ipInfo.isp,
      database: 'Cloudflare数据'
    };
    
    return new Response(JSON.stringify(response, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// 处理IP查询请求
async function handleIPQuery(request) {
  try {
    const url = new URL(request.url);
    const ip = url.searchParams.get('ip');
    
    if (!ip) {
      return new Response(JSON.stringify({ error: '请提供IP参数' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    if (!isValidIP(ip)) {
      return new Response(JSON.stringify({ error: 'IP地址格式不正确' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // 尝试使用第三方IP查询API获取真实数据
    let ipInfo;
    let database = 'QQwry';
    
    try {
      // 调用ip-api.com获取IP信息
      const apiResponse = await fetch(`http://ip-api.com/json/${ip}?lang=zh-CN`);
      if (apiResponse.ok) {
        const data = await apiResponse.json();
        if (data.status === 'success') {
          // 格式化为与本地版本一致的格式
          let location = '';
          if (data.country) location += data.country;
          if (data.regionName && data.regionName !== data.country) location += `–${data.regionName}`;
          if (data.city && data.city !== data.regionName) location += `–${data.city}`;
          if (data.district) location += `–${data.district}`;
          
          ipInfo = {
            city: location || '未知地区',
            isp: data.isp || '未知运营商'
          };
          database = 'ip-api.com';
        } else {
          throw new Error('API查询失败');
        }
      } else {
        throw new Error('API请求失败');
      }
    } catch (error) {
      // 如果API查询失败，使用模拟数据
      ipInfo = getMockIpInfo(ip);
      database = '模拟数据';
    }
    
    const response = {
      ip: ip,
      city: ipInfo.city,
      isp: ipInfo.isp,
      database: database
    };
    
    return new Response(JSON.stringify(response, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// 处理OPTIONS请求（CORS预检）
function handleOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

// 主要的请求处理函数
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // 处理CORS预检请求
    if (request.method === 'OPTIONS') {
      return handleOptions();
    }
    
    // 路由处理
    if (url.pathname === '/') {
      return handleIndex(request);
    } else if (url.pathname === '/ip') {
      return handleIPQuery(request);
    } else {
      return new Response(JSON.stringify({ error: '路径不存在' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
};