// Cloudflare Workers IP查询API
// 支持获取访客IP信息和查询指定IP地址信息

// 模拟IP数据
const mockData = {
  '8.8.8.8': { city: '美国', isp: 'Google DNS' },
  '1.1.1.1': { city: '美国', isp: 'Cloudflare DNS' },
  '114.114.114.114': { city: '中国', isp: '114DNS' },
  '223.5.5.5': { city: '中国杭州', isp: '阿里云DNS' },
  '119.29.29.29': { city: '中国深圳', isp: '腾讯DNS' },
  '180.76.76.76': { city: '中国北京', isp: '百度DNS' },
  '208.67.222.222': { city: '美国', isp: 'OpenDNS' },
  '9.9.9.9': { city: '美国', isp: 'Quad9 DNS' }
};

// 获取模拟IP信息
function getMockIpInfo(ip) {
  if (mockData[ip]) {
    return { city: mockData[ip].city, isp: mockData[ip].isp };
  }
  
  // 简单的IP段判断
  if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
    return { city: '内网地址', isp: '局域网' };
  } else if (ip.startsWith('127.')) {
    return { city: '本地回环', isp: '本机' };
  } else {
    return { city: '未知地区', isp: '未知运营商' };
  }
}

// 验证IP地址格式
function isValidIP(ip) {
  const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipPattern.test(ip)) return false;
  
  const parts = ip.split('.');
  return parts.every(part => {
    const num = parseInt(part, 10);
    return num >= 0 && num <= 255;
  });
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
    
    // 对于查询的IP，我们使用模拟数据
    // 在实际应用中，可以调用第三方IP查询API
    const ipInfo = getMockIpInfo(ip);
    
    const response = {
      ip: ip,
      city: ipInfo.city,
      isp: ipInfo.isp,
      database: '模拟数据'
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