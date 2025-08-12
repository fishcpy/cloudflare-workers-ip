import json
import os
import re
import ipaddress

from qqwry import QQwry
import flask
from flask import request, jsonify
from flask_cors import CORS

# 尝试导入CZDB模块
try:
    from czdb.db_searcher import DbSearcher
    CZDB_AVAILABLE = True
except ImportError:
    CZDB_AVAILABLE = False
    print("CZDB模块不可用，将使用QQwry数据库")

server = flask.Flask(__name__)
server.config['JSON_AS_ASCII'] = False
server.config['JSONIFY_PRETTYPRINT_REGULAR'] = True
CORS(server)

wry = None
czdb_searcher = None
database_loaded = False
database_type = None

def load_ip_database():
    global wry, czdb_searcher, database_loaded, database_type
    
    # 优先尝试加载CZDB数据库
    if CZDB_AVAILABLE:
        czdb_files = [f for f in os.listdir('.') if f.endswith('.czdb')]
        if czdb_files:
            try:
                # 这里需要密钥，如果没有密钥文件，使用默认值
                key = ""
                key_file = "czdb.key"
                if os.path.exists(key_file):
                    with open(key_file, 'r') as f:
                        key = f.read().strip()
                
                czdb_searcher = DbSearcher(czdb_files[0], "MEMORY", key)
                print(f"CZDB数据库加载成功: {czdb_files[0]}")
                database_loaded = True
                database_type = "CZDB"
                return
            except Exception as e:
                print(f"CZDB数据库加载失败: {e}")
                czdb_searcher = None
    
    # 回退到QQwry数据库
    try:
        wry = QQwry()
        if os.path.exists('qqwry.dat'):
            wry.load_file('qqwry.dat')
            print("QQwry数据库加载成功")
            database_loaded = True
            database_type = "QQwry"
        elif os.path.exists('ip.dat'):
            wry.load_file('ip.dat')
            print("QQwry数据库加载成功")
            database_loaded = True
            database_type = "QQwry"
        else:
            print("未找到IP数据库文件，使用模拟数据")
            wry = None
            database_loaded = False
            database_type = "Mock"
    except Exception as e:
        print(f"QQwry数据库加载失败: {e}")
        print("将使用模拟数据提供服务")
        wry = None
        database_loaded = False
        database_type = "Mock"

def query_ip_info(ip):
    """查询IP信息，支持多种数据库"""
    if database_type == "CZDB" and czdb_searcher:
        try:
            result = czdb_searcher.search(ip)
            if result:
                # CZDB返回的是字符串，需要解析
                parts = result.split('\t') if '\t' in result else result.split(' ')
                if len(parts) >= 2:
                    return parts[0], parts[1]
                else:
                    return result, "未知运营商"
            else:
                return get_mock_ip_info(ip)
        except Exception as e:
            print(f"CZDB查询失败: {e}")
            return get_mock_ip_info(ip)
    elif database_type == "QQwry" and wry:
        try:
            info = wry.lookup(ip)
            city = info[0] if info[0] else '未知'
            isp = info[1] if info[1] else '未知'
            return city, isp
        except Exception as e:
            print(f"QQwry查询失败: {e}")
            return get_mock_ip_info(ip)
    else:
        return get_mock_ip_info(ip)

def get_mock_ip_info(ip):
    """提供模拟的IP信息，用于演示"""
    mock_data = {
        '8.8.8.8': {'city': '美国', 'isp': 'Google DNS'},
        '1.1.1.1': {'city': '美国', 'isp': 'Cloudflare DNS'},
        '114.114.114.114': {'city': '中国', 'isp': '114DNS'},
        '223.5.5.5': {'city': '中国杭州', 'isp': '阿里云DNS'},
        '119.29.29.29': {'city': '中国深圳', 'isp': '腾讯DNS'},
        # IPv6示例
        '2001:4860:4860::8888': {'city': '美国', 'isp': 'Google IPv6 DNS'},
        '2606:4700:4700::1111': {'city': '美国', 'isp': 'Cloudflare IPv6 DNS'},
        '2400:3200::1': {'city': '中国', 'isp': '阿里云IPv6 DNS'},
        '240c::6666': {'city': '中国', 'isp': '下一代互联网IPv6 DNS'},
    }
    
    if ip in mock_data:
        return mock_data[ip]['city'], mock_data[ip]['isp']
    
    try:
        ip_obj = ipaddress.ip_address(ip)
        
        if ip_obj.version == 6:
            # IPv6地址处理
            if ip_obj.is_loopback:
                return '本地回环(IPv6)', '本机'
            elif ip_obj.is_private:
                return '私有网络(IPv6)', '局域网设备'
            elif ip_obj.is_link_local:
                return '链路本地(IPv6)', '本地链路'
            elif ip_obj.is_multicast:
                return '组播地址(IPv6)', '多播网络'
            elif str(ip_obj).startswith('2001:db8:'):
                return '文档地址(IPv6)', '测试网络'
            else:
                return '未知地区(IPv6)', '未知运营商'
        else:
            # IPv4地址处理
            if ip.startswith('192.168.'):
                return '私有网络(C类)', '局域网设备'
            elif ip.startswith('10.'):
                return '私有网络(A类)', '企业内网'
            elif ip.startswith('172.'):
                # 检查是否在172.16.0.0-172.31.255.255范围内
                parts = ip.split('.')
                if len(parts) >= 2 and 16 <= int(parts[1]) <= 31:
                    return '私有网络(B类)', '企业内网'
                else:
                    return '未知地区', '未知运营商'
            elif ip.startswith('127.'):
                return '本地回环', '本机'
            elif ip.startswith('169.254.'):
                return 'APIPA地址', '自动配置'
            elif ip.startswith('224.') or ip.startswith('225.') or ip.startswith('226.') or ip.startswith('227.') or ip.startswith('228.') or ip.startswith('229.') or ip.startswith('230.') or ip.startswith('231.') or ip.startswith('232.') or ip.startswith('233.') or ip.startswith('234.') or ip.startswith('235.') or ip.startswith('236.') or ip.startswith('237.') or ip.startswith('238.') or ip.startswith('239.'):
                return '组播地址', '多播网络'
            else:
                return '未知地区', '未知运营商'
    except ValueError:
        return '无效IP地址', '格式错误'

load_ip_database()

@server.route("/", methods=['GET'])
def index():
    try:
        # 获取访客真实IP
        if request.headers.get('X-Forwarded-For'):
            visitor_ip = request.headers.get('X-Forwarded-For').split(',')[0].strip()
        elif request.headers.get('X-Real-IP'):
            visitor_ip = request.headers.get('X-Real-IP')
        else:
            visitor_ip = request.remote_addr
        
        # 查询访客IP信息
        city, isp = query_ip_info(visitor_ip)
        
        res = {'ip': visitor_ip, 'city': city, 'isp': isp, 'database': database_type or '模拟数据'}
        print(res)
        
        # 使用json.dumps确保中文正确编码
        json_str = json.dumps(res, ensure_ascii=False, indent=2)
        response = flask.Response(json_str, mimetype='application/json; charset=utf-8')
        return response
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@server.route("/ip", methods=['GET'])
def location():
    try:
        ip = request.args.get("ip")
        
        if not ip:
            return jsonify({'error': '请提供IP参数'}), 400
        
        # IP格式验证（支持IPv4和IPv6）
        try:
            ipaddress.ip_address(ip)
        except ValueError:
            return jsonify({'error': 'IP地址格式不正确'}), 400
        
        city, isp = query_ip_info(ip)
        
        res = {'ip': ip, 'city': city, 'isp': isp, 'database': database_type or '模拟数据'}
        print(res)
        
        # 使用json.dumps确保中文正确编码
        json_str = json.dumps(res, ensure_ascii=False, indent=2)
        response = flask.Response(json_str, mimetype='application/json; charset=utf-8')
        return response
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("启动IP查询API服务...")
    print("访问地址: http://localhost:8889")
    print("API接口: http://localhost:8889/ip?ip=要查询的IP")
    server.run(host='0.0.0.0', port=8889, debug=True)