package main

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/gin-contrib/cors" // Добавьте этот импорт
	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"

	_ "LAB1/docs"

	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	"LAB1/internal/app/config"
	"LAB1/internal/app/dsn"
	"LAB1/internal/app/handler"
	"LAB1/internal/app/redis"
	"LAB1/internal/app/repository"
	"LAB1/internal/pkg"
)

func main() {
	ctx := context.Background()
	router := gin.Default()

	// ⭐⭐⭐ ДОБАВЬТЕ CORS МИДЛВАР ЗДЕСЬ ⭐⭐⭐
	router.Use(cors.New(cors.Config{
		// Разрешенные origins (источники)
		AllowOrigins: []string{
			// Локальная разработка
			"http://localhost:3000", // Vite dev server
			"http://127.0.0.1:3000", // альтернативный localhost
			"http://localhost:8080", // Сам бэкенд (если нужно)
			"http://localhost:5500", // Live Server (VS Code)

			// Ваши локальные IP (важно для мобильных устройств и других ПК в сети)
			"http://192.168.31.176:3000",  // ваш текущий IP
			"http://192.168.31.176:8080",  // если обращаетесь напрямую
			"https://192.168.31.176:3000", // HTTPS версия

			// Другие локальные адреса которые вы используете
			"http://172.19.0.1:3000",  // ваша текущая локальная сеть
			"https://172.19.0.1:3000", // HTTPS версия
			"http://172.20.0.1:3000",  // если используется этот IP
			"https://172.20.0.1:3000", // HTTPS версия

			// Production/деплой
			"https://thepontific.github.io", // GitHub Pages

			// Tauri desktop app (если нужно)
			"http://tauri.localhost", // альтернативный для Tauri
		},

		// Разрешенные HTTP методы
		AllowMethods: []string{
			"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH",
		},

		// Разрешенные заголовки (можно добавить специфичные)
		AllowHeaders: []string{
			"Origin",
			"Content-Type",
			"Content-Length",
			"Accept-Encoding",
			"Authorization",
			"X-CSRF-Token",
			"X-Requested-With",
			"Accept",
			"Cache-Control",
			"User-Agent",
		},

		// Разрешить куки/авторизацию
		AllowCredentials: true,

		// Заголовки, доступные для JS
		ExposeHeaders: []string{
			"Content-Length",
			"Authorization",
			"Content-Disposition",
			"X-Total-Count",     // если используете пагинацию
			"X-RateLimit-Limit", // если есть лимиты
			"X-RateLimit-Remaining",
		},

		// Максимальное время кэширования preflight запроса
		MaxAge: 12 * time.Hour,

		// Функция для динамической проверки origins
		AllowOriginFunc: func(origin string) bool {
			// Для разработки можно разрешить все локальные адреса
			// Это безопаснее чем разрешать все (AllowAllOrigins)
			if strings.Contains(origin, "localhost") ||
				strings.Contains(origin, "127.0.0.1") ||
				strings.Contains(origin, "github.io") ||
				strings.Contains(origin, "192.168.") ||
				strings.Contains(origin, "172.") {
				return true
			}

			// Логируем неразрешенные origins для отладки
			logrus.WithField("origin", origin).Warn("CORS: blocked origin")
			return false
		},
	}))

	// Swagger UI
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// ... остальной код без изменений
	conf, err := config.NewConfig()
	if err != nil {
		logrus.Fatalf("error loading config: %v", err)
	}

	postgresString := dsn.FromEnv()
	fmt.Println("Postgres:", postgresString)

	rep, errRep := repository.New(postgresString)
	if errRep != nil {
		logrus.Fatalf("error initializing repository: %v", errRep)
	}

	if err := rep.ResetDeletedStars(); err != nil {
		logrus.Errorf("Ошибка сброса удалённых звёзд: %v", err)
	}

	redisClient, err := redis.New(ctx, conf.Redis)
	if err != nil {
		logrus.Fatalf("Ошибка подключения Redis: %v", err)
	}

	h := handler.NewHandler(rep, nil, redisClient, conf.JWTSecret)
	h.RegisterStatic(router)
	h.RegisterRoutes(router)

	app := pkg.NewApp(ctx, conf, router, rep)
	app.RunApp()
}
