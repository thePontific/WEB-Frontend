# lab8-django/lab8/settings.py
SECRET_KEY = 'django-insecure-key-for-lab8'
DEBUG = True
ALLOWED_HOSTS = ['*']

# ТОЛЬКО НЕОБХОДИМЫЕ APPS
INSTALLED_APPS = [
    'django.contrib.contenttypes',  # ← ДОБАВЬТЕ ЭТО!
    'django.contrib.auth',
    'rest_framework',
    'app',
]

MIDDLEWARE = [
    'django.middleware.common.CommonMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',  # ← Добавьте
    'django.contrib.auth.middleware.AuthenticationMiddleware',  # ← Добавьте
]

ROOT_URLCONF = 'lab8.urls'
WSGI_APPLICATION = 'lab8.wsgi.application'

# Без БД вообще (для простоты)
DATABASES = {}

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True