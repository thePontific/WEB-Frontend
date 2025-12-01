# views.py - ПОЛНЫЙ ФАЙЛ С РАСЧЕТОМ СКОРОСТИ
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

import time
import random
import math
import requests
from concurrent import futures

CALLBACK_URL = "http://localhost:8080/api/starcart/update-star-velocity"
SECRET_TOKEN = "secret-star-token-12345678"

executor = futures.ThreadPoolExecutor(max_workers=1)

def calculate_star_velocity(star_data):
    """РЕАЛЬНЫЙ РАСЧЕТ СКОРОСТИ ЗВЕЗДЫ (5-10 секунд)"""
    time.sleep(random.randint(5, 10))  # Имитация долгого расчета
    
    # Данные звезды
    distance_ly = star_data['distance']  # световые годы
    mass_solar = star_data['mass']       # солнечные массы
    
    # Константы
    G = 6.67430e-11  # гравитационная постоянная
    LY_TO_METERS = 9.461e15  # световой год в метрах
    SOLAR_MASS_KG = 1.989e30  # масса Солнца в кг
    
    # Конвертация
    distance_m = distance_ly * LY_TO_METERS
    mass_kg = mass_solar * SOLAR_MASS_KG
    
    # Расчет орбитальной скорости (v = sqrt(G * M / r))
    velocity = math.sqrt(G * mass_kg / distance_m)
    
    # Форматирование результата
    velocity_km_s = velocity / 1000  # м/с → км/с
    
    # Определение типа по скорости
    if velocity_km_s > 1000:
        vel_type = "hyper_velocity_star"
    elif velocity_km_s > 500:
        vel_type = "high_velocity"
    elif velocity_km_s > 100:
        vel_type = "medium_velocity"
    else:
        vel_type = "low_velocity"
    
    return {
        "cart_item_id": star_data['cart_item_id'],
        "star_id": star_data['star_id'],
        "velocity_ms": round(velocity, 2),      # м/с
        "velocity_kms": round(velocity_km_s, 2), # км/с
        "velocity_type": vel_type,
        "calculation_time": time.strftime("%Y-%m-%d %H:%M:%S"),
        "token": SECRET_TOKEN
    }

def velocity_callback(task):
    """Колбэк для отправки результата в Go"""
    try:
        result = task.result()
        print(f"✅ Django: расчет скорости завершен: {result['star_id']} = {result['velocity_kms']} км/с")
    except futures._base.CancelledError:
        return
    
    # Отправляем результат в Go
    try:
        response = requests.post(CALLBACK_URL, json=result, timeout=3)
        print(f"📤 Django: скорость отправлена в Go, статус: {response.status_code}")
    except Exception as e:
        print(f"❌ Django: ошибка отправки: {e}")

@api_view(['POST'])
def calculate_star_velocity_view(request):
    """Endpoint для расчета скорости звезды"""
    if "cart_item_id" in request.data:   
        cart_item_id = request.data["cart_item_id"]
        star_id = request.data.get("star_id", 0)
        
        print(f"🚀 Django: запуск расчета скорости для star_id={star_id}")
        
        # Запускаем расчет в фоне
        task = executor.submit(calculate_star_velocity, request.data)
        task.add_done_callback(velocity_callback)
        
        return Response({
            "status": "velocity_calculation_started",
            "cart_item_id": cart_item_id,
            "star_id": star_id,
            "message": "Расчет скорости звезды запущен"
        }, status=status.HTTP_200_OK)
    
    return Response({
        "error": "cart_item_id required"
    }, status=status.HTTP_400_BAD_REQUEST)

# Старый endpoint (можно оставить или удалить)
@api_view(['POST'])
def calculate_star(request):
    """Старый endpoint (для обратной совместимости)"""
    return calculate_star_velocity_view(request)