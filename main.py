import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

def z_func(x, c, d):
    if x <= c:
        return 1.0
    elif c < x <= d:
        return (d - x) / (d - c)
    else:
        return 0.0

def trap_func(x, a, b, c, d):
    if x < a:
        return 0.0
    elif a <= x < b:
        return (x - a) / (b - a)
    elif b <= x <= c:
        return 1.0
    elif c < x <= d:
        return (d - x) / (d - c)
    else:
        return 0.0

def s_func(x, a, b):
    if x < a:
        return 0.0
    elif a <= x <= b:
        return (x - a) / (b - a)
    else:
        return 1.0

def plot_price():
    # График для цены товара
    prices = np.arange(0, 10001, 100)
    z_values = [z_func(x, 1500, 3000) for x in prices]
    trap_values = [trap_func(x, 2500, 3500, 5500, 6500) for x in prices]
    s_values = [s_func(x, 6000, 8000) for x in prices]
    
    plt.figure(figsize=(12, 6))
    plt.plot(prices, z_values, label='Дешевый (Z-функция)', linewidth=3, color='blue')
    plt.plot(prices, trap_values, label='Средний (Трапеция)', linewidth=3, color='green') 
    plt.plot(prices, s_values, label='Дорогой (S-функция)', linewidth=3, color='red')
    
    plt.xlabel('Цена, руб.', fontsize=12)
    plt.ylabel('Степень принадлежности', fontsize=12)
    plt.title('Функции принадлежности для цены товара', fontsize=14)
    plt.legend(fontsize=10)
    plt.grid(True, alpha=0.3)
    plt.xlim(0, 10000)
    plt.ylim(-0.1, 1.1)
    plt.tight_layout()
    plt.show()

def plot_order_amount():
    # График для суммы заказа
    amounts = np.arange(0, 20001, 100)
    small_values = [z_func(x, 2000, 5000) for x in amounts]
    standard_values = [trap_func(x, 4000, 6000, 10000, 12000) for x in amounts]
    large_values = [s_func(x, 11000, 15000) for x in amounts]
    
    plt.figure(figsize=(12, 6))
    plt.plot(amounts, small_values, label='Маленький (Z-функция)', linewidth=3, color='orange')
    plt.plot(amounts, standard_values, label='Стандартный (Трапеция)', linewidth=3, color='purple') 
    plt.plot(amounts, large_values, label='Крупный (S-функция)', linewidth=3, color='brown')
    
    plt.xlabel('Сумма заказа, руб.', fontsize=12)
    plt.ylabel('Степень принадлежности', fontsize=12)
    plt.title('Функции принадлежности для суммы заказа', fontsize=14)
    plt.legend(fontsize=10)
    plt.grid(True, alpha=0.3)
    plt.xlim(0, 20000)
    plt.ylim(-0.1, 1.1)
    plt.tight_layout()
    plt.show()

def plot_customer_status():
    # График для статуса клиента
    total_spent = np.arange(0, 50001, 100)
    new_values = [z_func(x, 5000, 10000) for x in total_spent]
    regular_values = [trap_func(x, 8000, 12000, 25000, 30000) for x in total_spent]
    vip_values = [s_func(x, 28000, 40000) for x in total_spent]
    
    plt.figure(figsize=(12, 6))
    plt.plot(total_spent, new_values, label='Новый (Z-функция)', linewidth=3, color='cyan')
    plt.plot(total_spent, regular_values, label='Постоянный (Трапеция)', linewidth=3, color='magenta') 
    plt.plot(total_spent, vip_values, label='VIP (S-функция)', linewidth=3, color='gold')
    
    plt.xlabel('Общая сумма покупок, руб.', fontsize=12)
    plt.ylabel('Степень принадлежности', fontsize=12)
    plt.title('Функции принадлежности для статуса клиента', fontsize=14)
    plt.legend(fontsize=10)
    plt.grid(True, alpha=0.3)
    plt.xlim(0, 50000)
    plt.ylim(-0.1, 1.1)
    plt.tight_layout()
    plt.show()

def main():
    print("Строим графики функций принадлежности...")
    
    # 1. График для цены товара
    plot_price()
    
    # 2. График для суммы заказа  
    plot_order_amount()
    
    # 3. График для статуса клиента
    plot_customer_status()
    
    print("Все графики построены!")

if __name__ == "__main__":
    main()

    