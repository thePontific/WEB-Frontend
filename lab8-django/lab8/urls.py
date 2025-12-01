# lab8/urls.py - ИСПРАВЬТЕ ИМПОРТ:
from django.urls import path
from app.views import calculate_star_velocity_view  # ← ИЗ ПАПКИ app!

urlpatterns = [
    path('', calculate_star_velocity_view, name='calculate-star'),
    path('calculate-velocity/', calculate_star_velocity_view, name='calculate-velocity'),
]