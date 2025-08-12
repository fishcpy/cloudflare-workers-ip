import json
import os
import re

from qqwry import QQwry
import flask
from flask import request, jsonify
from flask_cors import CORS

server = flask.Flask(__name__)
server.config['JSON_AS_ASCII'] = False
server.config['JSONIFY_PRETTYPRINT_REGULAR'] = True
CORS(server)

wry = None
database_loaded = False

def load_ip_database():
    global wry, database_loaded
    try:
        wry = QQwry()
        if os.path.exists('qqwry.dat'):
            wry.load_file('qqwry.dat')
            print("IP数据库加载成功")
            database_loaded = True
        elif os.path.exists('ip.dat'):
            wry.load_file('ip.dat')
            print("IP数据库加载成功")
            database_loaded = True
        else:
            print("未找到IP数据库文件，使用模拟数据")
            wry = None
            database_loaded = False
    except Exception as e:
        print(f"IP数据库加载失败: {e}")
        print("将使用模拟数据提供服务")
        wry = None
        database_loaded = False

def get_mock_ip_info(ip):
    """提供模拟的IP信息，用于演示"""
    mock_data = {
        '8.8.8.8': {'city': '美国', 'isp': 'Google DNS'},
        '1.1.1.1': {'city': '美国', 'isp': 'Cloudflare DNS'},
        '114.114.114.114': {'city': '中国', 'isp': '114DNS'},
        '223.5.5.5': {'city': '中国杭州', 'isp': '阿里云DNS'},
        '119.29.29.29': {'city': '中国深圳', 'isp': '腾讯DNS'},
    }
    
    if ip in mock_data:
        return mock_data[ip]['city'], mock_data[ip]['isp']
    
    # 简单的IP段判断
    if ip.startswith('192.168.') or ip.startswith('10.') or ip.startswith('172.'):
        return '内网地址', '局域网'
    elif ip.startswith('127.'):
        return '本地回环', '本机'
    else:
        return '未知地区', '未知运营商'

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
        if database_loaded and wry:
            try:
                info = wry.lookup(visitor_ip)
                city = info[0] if info[0] else '未知'
                isp = info[1] if info[1] else '未知'
            except Exception as e:
                city, isp = get_mock_ip_info(visitor_ip)
        else:
            city, isp = get_mock_ip_info(visitor_ip)
        
        res = {'ip': visitor_ip, 'city': city, 'isp': isp, 'database': '真实数据库' if database_loaded else '模拟数据'}
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
        
        # 简单的IP格式验证
        ip_pattern = r'^(\d{1,3}\.){3}\d{1,3}$'
        if not re.match(ip_pattern, ip):
            return jsonify({'error': 'IP地址格式不正确'}), 400
        
        if database_loaded and wry:
            try:
                info = wry.lookup(ip)
                city = info[0] if info[0] else '未知'
                isp = info[1] if info[1] else '未知'
            except Exception as e:
                print(f"查询出错，使用模拟数据: {e}")
                city, isp = get_mock_ip_info(ip)
        else:
            city, isp = get_mock_ip_info(ip)
        
        res = {'ip': ip, 'city': city, 'isp': isp, 'database': '真实数据库' if database_loaded else '模拟数据'}
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