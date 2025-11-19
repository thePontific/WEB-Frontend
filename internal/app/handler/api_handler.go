package handler

import (
	"crypto/sha1"
	"encoding/hex"
	"errors"
	"fmt"
	"math"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"

	"LAB1/internal/app/ds"
	"LAB1/internal/app/redis"
	"LAB1/internal/app/repository"
	"LAB1/internal/app/role"
	"LAB1/internal/service"
)

type Handler struct {
	Repository   *repository.Repository
	MinioService *service.MinioService
	Redis        *redis.Client
	JWTSecret    string
}

// GetCurrentUserID получает ID текущего пользователя из контекста
func (h *Handler) GetCurrentUserID(ctx *gin.Context) (uuid.UUID, error) {
	claims, exists := ctx.Get("claims")
	if !exists {
		return uuid.Nil, errors.New("claims not found in context")
	}

	jwtClaims, ok := claims.(*ds.JWTClaims)
	if !ok {
		return uuid.Nil, errors.New("invalid claims type")
	}

	return jwtClaims.UserUUID, nil
}
func NewHandler(r *repository.Repository, ms *service.MinioService, redisClient *redis.Client, jwtSecret string) *Handler {
	return &Handler{
		Repository:   r,
		MinioService: ms,
		Redis:        redisClient,
		JWTSecret:    jwtSecret,
	}
}

// ======================
// Статика и маршруты
// ======================
func (h *Handler) RegisterStatic(router *gin.Engine) {
	router.LoadHTMLGlob("templates/*")
	router.Static("/static", "./resources")
}

func (h *Handler) RegisterRoutes(router *gin.Engine) {
	api := router.Group("/api")

	// открытые маршруты
	api.POST("/users/login", h.LoginUser)
	api.POST("/users/register", h.RegisterUser)
	api.POST("/users/logout", h.LogoutUser)

	// защищённые маршруты (JWT обязателен)
	protected := api.Group("/")
	protected.Use(h.JWTMiddleware())

	// Доступ к информации о себе
	protected.GET("/users/me", h.GetUser)
	protected.PUT("/users/me", h.UpdateUser)

	// Работа со звёздами
	api.GET("/stars", h.GetStars)           // все роли
	api.GET("/stars/:id", h.GetStarDetails) // все роли
	protected.POST("/stars", h.WithAuthCheck(role.Manager, role.Admin), h.CreateStar)
	protected.PUT("/stars/:id", h.WithAuthCheck(role.Manager, role.Admin), h.UpdateStar)
	protected.DELETE("/stars/:id", h.WithAuthCheck(role.Manager, role.Admin), h.DeleteStar)
	protected.POST("/stars/:id/image", h.WithAuthCheck(role.Manager, role.Admin), h.UploadStarImage)

	// StarCart
	protected.GET("/starcart/icon", h.GetStarCartIcon) // все роли могут смотреть свои корзины
	protected.GET("/starcart", h.GetStarCarts)
	protected.GET("/starcart/:cartID", h.GetStarCartDetails) // ✅ ДОБАВЛЕНО: получение деталей заявки
	protected.POST("/starcart/add", h.AddStarToStarCart)     // все роли могут добавлять

	protected.PUT("/starcart/:cartID", h.UpdateStarCartHandler) // ✅ ИСПРАВЛЕНО: изменение заявки
	protected.PUT("/starcart/:cartID/form", h.FormStarCart)     // ✅ ИСПРАВЛЕНО: формирование заявки
	protected.PUT("/starcart/:cartID/finish", h.WithAuthCheck(role.Manager, role.Admin), h.FinishStarCart)
	protected.PUT("/starcart/:cartID/item/:id", h.UpdateStarCartItem)    // ✅ ИСПРАВЛЕНО: изменение элемента
	protected.DELETE("/starcart/:cartID/item/:id", h.DeleteStarCartItem) // ✅ ИСПРАВЛЕНО: удаление элемента
	protected.DELETE("/starcart/:cartID", h.DeleteStarCart)              // ✅ ИСПРАВЛЕНО: удаление заявки
}

// м-к-м пут
// UpdateStarCartItem godoc
// @Summary      Обновить элемент заявки (м-м связь)
// @Description  Изменяет количество, комментарий или скорость для конкретного элемента в заявке
// @Tags         StarCartItem
// @Accept       json
// @Produce      json
// @Param        cartID  path      int  true  "ID заявки"
// @Param        id      path      int  true  "ID элемента в заявке"
// @Param        item    body      ds.StarCartItem  true  "Данные для обновления"
// @Success      200  {object}  map[string]string
// @Failure      400  {object}  map[string]string
// @Failure      404  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /api/starcart/{cartID}/item/{id} [put]
func (h *Handler) UpdateStarCartItem(ctx *gin.Context) {
	cartID, err := strconv.Atoi(ctx.Param("cartID"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid cart ID"})
		return
	}

	itemID, err := strconv.Atoi(ctx.Param("id")) // было: ctx.Param("cartID")
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid item ID"})
		return
	}

	var input ds.StarCartItem
	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Проверяем существование корзины
	cart, err := h.Repository.GetCartByID(cartID)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "starcart not found"})
		return
	}

	// Проверяем существование элемента и принадлежность корзине
	item, err := h.Repository.GetStarCartItemByID(itemID)
	if err != nil || item.CartID != cart.ID {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "item not found in this cart"})
		return
	}

	// Обновляем поля
	if input.Quantity != 0 {
		item.Quantity = input.Quantity
	}
	if input.Comment != "" {
		item.Comment = input.Comment
	}
	if input.Speed != 0 {
		item.Speed = float32(input.Speed)
	}

	if err := h.Repository.UpdateStarCartItem(&item); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "StarCart item updated"})
}

// ======================
// ==== ЗВЁЗДЫ ====
// ======================

// GetStars godoc
// @Summary Получить список звёзд с фильтрацией
// @Tags Stars
// @Accept  json
// @Produce  json
// @Param title query string false "Поиск по названию"
// @Param distance_min query number false "Минимальное расстояние"
// @Param distance_max query number false "Максимальное расстояние"
// @Param star_type query string false "Тип звезды"
// @Param magnitude_min query number false "Минимальная светимость"
// @Param magnitude_max query number false "Максимальная светимость"
// @Param temperature_min query number false "Минимальная температура"
// @Param temperature_max query number false "Максимальная температура"
// @Security BearerAuth
// @Success 200 {array} ds.Star
// @Failure 500 {object} map[string]string
// @Router /api/stars [get]
func (h *Handler) GetStars(ctx *gin.Context) {
	filters := map[string]interface{}{
		"title":           ctx.Query("title"),
		"distance_min":    ctx.Query("distance_min"),
		"distance_max":    ctx.Query("distance_max"),
		"star_type":       ctx.Query("star_type"),
		"magnitude_min":   ctx.Query("magnitude_min"),
		"magnitude_max":   ctx.Query("magnitude_max"),
		"temperature_min": ctx.Query("temperature_min"),
		"temperature_max": ctx.Query("temperature_max"),
	}

	stars, err := h.Repository.GetStarsWithFilters(filters)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, stars)
}

// GetStarDetails godoc
// @Summary Получить подробности о звезде
// @Description Возвращает информацию и ссылку на изображение
// @Tags Stars
// @Produce  json
// @Param id path int true "ID звезды"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /api/stars/{id} [get]
func (h *Handler) GetStarDetails(ctx *gin.Context) {
	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid ID"})
		return
	}
	star, err := h.Repository.GetStar(id)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "star not found"})
		return
	}

	// ДОБАВЬТЕ ОТЛАДКУ
	fmt.Printf("🎯 GetStarDetails debug: star.ImageName='%s'\n", star.ImageName)

	starURL := h.MinioService.GetImageURL(star.ImageName)

	// ДОБАВЬТЕ ОТЛАДКУ
	fmt.Printf("🎯 GetStarDetails debug: starURL='%s'\n", starURL)

	ctx.JSON(http.StatusOK, gin.H{"star": star, "imageURL": starURL})
}

// CreateStar godoc
// @Summary Создать новую звезду
// @Tags Stars
// @Accept  json
// @Produce  json
// @Param star body ds.Star true "Данные звезды"
// @Success 201 {object} ds.Star
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/stars [post]
func (h *Handler) CreateStar(ctx *gin.Context) {
	var input ds.Star
	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	err := h.Repository.CreateStar(&input)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusCreated, input)
}

// UpdateStar godoc
// @Summary Обновить данные звезды
// @Tags Stars
// @Accept  json
// @Produce  json
// @Param id path int true "ID звезды"
// @Param star body ds.Star true "Данные звезды"
// @Success 200 {object} ds.Star
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/stars/{id} [put]
func (h *Handler) UpdateStar(ctx *gin.Context) {
	id, _ := strconv.Atoi(ctx.Param("id"))
	var input ds.Star
	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	input.ID = id
	err := h.Repository.UpdateStar(&input)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, input)
}

// DeleteStar godoc
// @Summary Удалить звезду
// @Tags Stars
// @Produce  json
// @Param id path int true "ID звезды"
// @Success 200 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/stars/{id} [delete]
func (h *Handler) DeleteStar(ctx *gin.Context) {
	id, _ := strconv.Atoi(ctx.Param("id"))
	err := h.Repository.DeleteStar(id)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "star deleted"})
}

// UploadStarImage godoc
// @Summary Загрузить изображение для звезды
// @Tags Stars
// @Accept multipart/form-data
// @Produce json
// @Param id path int true "ID звезды"
// @Param image formData file true "Файл изображения"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/stars/{id}/image [post]
func (h *Handler) UploadStarImage(ctx *gin.Context) {
	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid star ID"})
		return
	}

	file, err := ctx.FormFile("image")
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "image required"})
		return
	}

	fileName, err := h.MinioService.UploadFile(id, file)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed upload: " + err.Error()})
		return
	}

	star, _ := h.Repository.GetStar(id)
	star.ImageName = fileName
	h.Repository.UpdateStar(&star)

	ctx.JSON(http.StatusOK, gin.H{"imageName": fileName})
}

// ======================
// ==== STARCART / ЗАЯВКИ ====
// ======================

// GetStarCarts godoc
// @Summary Получить список заявок (StarCart)
// @Tags StarCart
// @Produce  json
// @Param from query string false "Дата с"
// @Param to query string false "Дата по"
// @Param status query string false "Статус заявки"
// @Security BearerAuth
// @Success 200 {array} map[string]interface{}
// @Failure 500 {object} map[string]string
// @Router /api/starcart [get]
func (h *Handler) GetStarCarts(ctx *gin.Context) {
	// ✅ ПОЛУЧАЕМ ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ ИЗ ТОКЕНА
	currentUserUUID, err := h.GetCurrentUserID(ctx)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	// ✅ ПОЛУЧАЕМ РОЛЬ ПОЛЬЗОВАТЕЛЯ
	user, err := h.Repository.GetUserByUUID(currentUserUUID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "user not found"})
		return
	}

	from := ctx.Query("from")
	to := ctx.Query("to")
	status := ctx.Query("status")

	var carts []ds.StarCart

	// ✅ РАЗДЕЛЯЕМ ЛОГИКУ ПО РОЛЯМ
	if user.Role == role.Admin || user.Role == role.Manager {
		// Менеджер/Админ - видят ВСЕ заявки
		carts, err = h.Repository.GetStarCartsFiltered(from, to, status)
	} else {
		// Обычный пользователь - видит только СВОИ заявки
		carts, err = h.Repository.GetStarCartsByCreatorID(currentUserUUID, from, to, status)
	}

	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var response []gin.H
	for _, c := range carts {
		itemsCount := len(c.Items)
		var totalQty int
		for _, item := range c.Items {
			totalQty += item.Quantity
		}

		var avgAccuracy float64
		if itemsCount > 0 {
			avgAccuracy = float64(totalQty) / float64(itemsCount)
		}

		response = append(response, gin.H{
			"id":               c.ID,
			"creator_id":       c.CreatorID,
			"status":           c.Status,
			"date_create":      c.DateCreate,
			"star_items_count": itemsCount,
			"average_quantity": avgAccuracy,
		})
	}

	ctx.JSON(http.StatusOK, response)
}

// GetStarCartDetails godoc
// @Summary Получить детали заявки
// @Tags StarCart
// @Produce  json
// @Param cartID path int true "ID заявки"
// @Security BearerAuth
// @Success 200 {object} map[string]interface{}
// @Failure 404 {object} map[string]string
// @Router /api/starcart/{cartID} [get]
func (h *Handler) GetStarCartDetails(ctx *gin.Context) {
	cartID, err := strconv.Atoi(ctx.Param("cartID"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid cart ID"})
		return
	}

	cart, err := h.Repository.GetCartByID(cartID)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "starcart not found"})
		return
	}

	// ✅ ПОЛУЧАЕМ ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ ИЗ ТОКЕНА
	currentUserUUID, err := h.GetCurrentUserID(ctx)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	// Проверяем права доступа
	if cart.CreatorID != currentUserUUID {
		user, err := h.Repository.GetUserByUUID(currentUserUUID)
		if err != nil || (user.Role != role.Admin && user.Role != role.Manager) {
			ctx.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
			return
		}
	}

	var items []gin.H
	for _, item := range cart.Items {
		star, _ := h.Repository.GetStar(item.StarID)
		items = append(items, gin.H{
			"star_id":   star.ID,
			"title":     star.Title,
			"quantity":  item.Quantity,
			"speed":     item.Speed,
			"comment":   item.Comment,
			"image_url": h.MinioService.GetImageURL(star.ImageName),
		})
	}

	ctx.JSON(http.StatusOK, gin.H{
		"id":            cart.ID,
		"status":        cart.Status,
		"date_create":   cart.DateCreate,
		"creator_id":    cart.CreatorID,
		"comment":       cart.Comment,
		"date_formed":   cart.DateFormed,
		"date_finished": cart.DateFinished,
		"items_count":   len(items),
		"items":         items,
	})
}

// UpdateStarCartHandler godoc
// @Summary Обновить позиции в заявке
// @Tags StarCart
// @Accept  json
// @Produce  json
// @Param id path int true "ID заявки"
// @Param items body []ds.StarCartItem true "Список позиций"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Router /api/starcart/{id} [put]
func (h *Handler) UpdateStarCartHandler(ctx *gin.Context) {
	id, _ := strconv.Atoi(ctx.Param("id"))
	var input []ds.StarCartItem
	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_, err := h.Repository.GetCartByID(id)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "starcart not found"})
		return
	}

	for _, item := range input {
		h.Repository.UpdateStarCartItem(&item)
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "StarCart updated"})
}

// FormStarCart godoc
// @Summary Сформировать заявку
// @Tags StarCart
// @Produce  json
// @Param cartID path int true "ID заявки"
// @Success 200 {object} ds.StarCart
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /api/starcart/{cartID}/form [put]
func (h *Handler) FormStarCart(ctx *gin.Context) {
	id, _ := strconv.Atoi(ctx.Param("cartID"))
	cart, err := h.Repository.GetCartByID(id)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "starcart not found"})
		return
	}

	if cart.Status != ds.StatusDraft {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "starcart not draft"})
		return
	}

	// Обнуляем комментарии, точность = 1, скорость = 0
	for i := range cart.Items {
		cart.Items[i].Comment = ""
		cart.Items[i].Quantity = 1
		cart.Items[i].Speed = 0
		h.Repository.UpdateStarCartItem(&cart.Items[i])
	}

	now := time.Now()
	cart.Status = ds.StatusCreated
	cart.DateFormed = &now

	if err := h.Repository.UpdateCart(&cart); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, cart)
}

// FinishStarCart godoc
// @Summary Завершить заявку (одобрить/отклонить)
// @Tags StarCart
// @Produce  json
// @Param cartID path int true "ID заявки"
// @Param action query string true "complete или reject"
// @Success 200 {object} ds.StarCart
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /api/starcart/{cartID}/finish [put]
func (h *Handler) FinishStarCart(ctx *gin.Context) {
	id, err := strconv.Atoi(ctx.Param("cartID"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid cart ID"})
		return
	}

	cart, err := h.Repository.GetCartByID(id)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "starcart not found"})
		return
	}

	if cart.Status != ds.StatusCreated {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "starcart not formed"})
		return
	}

	// ✅ ПОЛУЧАЕМ ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ (МОДЕРАТОРА)
	currentUserUUID, err := h.GetCurrentUserID(ctx)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	action := ctx.Query("action")
	now := time.Now()
	switch action {
	case "complete":
		cart.Status = ds.StatusCompleted
		cart.DateFinished = &now
		cart.ModeratorID = &currentUserUUID // ✅ ЗАПОЛНЯЕМ МОДЕРАТОРА
	case "reject":
		cart.Status = ds.StatusRejected
		cart.DateFinished = &now
		cart.ModeratorID = &currentUserUUID // ✅ ЗАПОЛНЯЕМ МОДЕРАТОРА
	default:
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid action"})
		return
	}

	if err := h.Repository.UpdateCart(&cart); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Расчёт скорости и вывод в терминале
	for i := range cart.Items {
		item := &cart.Items[i]
		if item.Star != nil {
			velocity := calculateStarVelocity(*item.Star)
			fmt.Printf("Star ID: %d, Title: %s, Mass: %.2f, Distance: %.2f, Velocity: %.2f m/s\n",
				item.Star.ID, item.Star.Title, item.Star.Mass, item.Star.Distance, velocity)

			item.Speed = float32(velocity)
			// Сохраняем в базе
			if err := h.Repository.UpdateCartItemSpeed(item); err != nil {
				ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
		} else {
			fmt.Printf("StarCartItem ID %d имеет nil Star\n", item.ID)
		}
	}

	// ✅ ПОЛУЧАЕМ ОБНОВЛЕННУЮ ЗАЯВКУ С МОДЕРАТОРОМ
	updatedCart, err := h.Repository.GetCartByID(id)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, updatedCart)
}
func calculateStarVelocity(star ds.Star) float64 {
	const G = 6.67430e-11
	distanceMeters := float64(star.Distance) * 9.461e15
	massKg := float64(star.Mass) * 1.989e30
	return math.Sqrt(G * massKg / distanceMeters)
}

// DeleteStarCart godoc
// @Summary Удалить заявку (логически)
// @Tags StarCart
// @Produce  json
// @Param cartID path int true "ID заявки"
// @Success 200 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /api/starcart/{cartID} [delete]
func (h *Handler) DeleteStarCart(ctx *gin.Context) {
	cartID, err := strconv.Atoi(ctx.Param("cartID"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid cart ID"})
		return
	}

	cart, err := h.Repository.GetCartByID(cartID)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "starcart not found"})
		return
	}

	// ✅ ПОЛУЧАЕМ ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ ИЗ ТОКЕНА
	currentUserUUID, err := h.GetCurrentUserID(ctx)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	if cart.CreatorID != currentUserUUID {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	if err := h.Repository.MarkStarCartAsDeleted(cartID); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "starcart logically deleted"})
}

// GetStarCartIcon godoc
// @Summary Получить иконку корзины (draft-заявка)
// @Tags StarCart
// @Produce  json
// @Success 200 {object} map[string]int
// @Router /api/starcart/icon [get]
func (h *Handler) GetStarCartIcon(ctx *gin.Context) {
	// ✅ ПОЛУЧАЕМ ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ ИЗ ТОКЕНА
	currentUserUUID, err := h.GetCurrentUserID(ctx)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	cart, err := h.Repository.GetDraftCartByCreatorID(currentUserUUID)
	if err != nil {
		ctx.JSON(http.StatusOK, gin.H{"starcartID": 0, "itemsCount": 0})
		return
	}
	count, _ := h.Repository.CountCartItems(cart.ID)
	ctx.JSON(http.StatusOK, gin.H{"starcartID": cart.ID, "itemsCount": count})
}

// AddStarToStarCart godoc
// @Summary Добавить звезду в заявку
// @Tags StarCart
// @Accept multipart/form-data
// @Produce  json
// @Param star_id formData int true "ID звезды"
// @Param quantity formData int true "Количество"
// @Param comment formData string false "Комментарий"
// @Success 200 {object} map[string]string
// @Router /api/starcart/add [post]
func (h *Handler) AddStarToStarCart(ctx *gin.Context) {
	// ✅ ПОЛУЧАЕМ ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ ИЗ ТОКЕНА
	currentUserUUID, err := h.GetCurrentUserID(ctx)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	starID, _ := strconv.Atoi(ctx.PostForm("star_id"))
	qty, _ := strconv.Atoi(ctx.PostForm("quantity"))
	comment := ctx.PostForm("comment")
	if qty < 1 {
		qty = 1
	}
	cart, err := h.Repository.GetDraftCartByCreatorID(currentUserUUID)
	if err != nil {
		cart = ds.StarCart{CreatorID: currentUserUUID, Status: ds.StatusDraft, DateCreate: time.Now()}
		h.Repository.CreateCart(&cart)
	}
	item := ds.StarCartItem{CartID: cart.ID, StarID: starID, Quantity: qty, Comment: comment}
	h.Repository.AddCartItem(&item)
	ctx.JSON(http.StatusOK, gin.H{"message": "Star added to StarCart"})
}

// DeleteStarCartItem godoc
// @Summary Удалить позицию из заявки
// @Tags StarCartItem
// @Produce  json
// @Param id path int true "ID позиции"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Router /api/starcart/item/{id} [delete]
func (h *Handler) DeleteStarCartItem(ctx *gin.Context) {
	cartID, err := strconv.Atoi(ctx.Param("cartID"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid cart ID"})
		return
	}

	itemID, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid item ID"})
		return
	}

	// Проверяем существование корзины
	cart, err := h.Repository.GetCartByID(cartID)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "starcart not found"})
		return
	}

	// Проверяем элемент
	item, err := h.Repository.GetStarCartItemByID(itemID)
	if err != nil || item.CartID != cart.ID {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "item not found in this cart"})
		return
	}

	if err := h.Repository.DeleteStarCartItemByID(itemID); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "item deleted"})
}

// ======================
// ==== ПОЛЬЗОВАТЕЛИ ====
// ======================

type registerReq struct {
	Login    string `json:"login"`
	Password string `json:"password"`
}

type registerResp struct {
	Ok bool `json:"ok"`
}

// RegisterUser godoc
// @Summary Зарегистрировать нового пользователя
// @Tags Users
// @Accept  json
// @Produce  json
// @Param user body registerReq true "Данные пользователя"
// @Success 201 {object} registerResp
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/users/register [post]
func (h *Handler) RegisterUser(ctx *gin.Context) {
	var req registerReq
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Login == "" || req.Password == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "login or password is empty"})
		return
	}

	user := &ds.User{
		UUID:     uuid.New(),
		Login:    req.Login,
		Password: generateHash(req.Password),
		Role:     role.Buyer, // дефолтная роль
	}

	if err := h.Repository.Register(user); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, registerResp{Ok: true})
}

func generateHash(password string) string {
	h := sha1.New()
	h.Write([]byte(password))
	return hex.EncodeToString(h.Sum(nil))
}

// LoginUser godoc
// @Summary Вход пользователя
// @Description Логиним пользователя
// @Tags Users
// @Accept  json
// @Produce  json
// @Param login body LoginRequest true "Данные для входа"
// @Success 200 {object} loginResp
// @Failure 400 {object} map[string]string
// @Router /api/users/login [post]
func (h *Handler) LoginUser(ctx *gin.Context) {
	var req LoginRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.Repository.GetUserByLogin(req.Login)
	if err != nil || user.Password != generateHash(req.Password) {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "invalid credentials"})
		return
	}

	// Добавляем роль пользователя в claims
	claims := &ds.JWTClaims{
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(5 * time.Minute)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "lab1",
		},
		UserUUID: user.UUID,
		Role:     user.Role, // вот это поле
		Scopes:   []string{"read", "write"},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	strToken, err := token.SignedString([]byte(h.JWTSecret))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "cant create token"})
		return
	}

	ctx.JSON(http.StatusOK, loginResp{
		ExpiresIn:   24 * 3600,
		AccessToken: strToken,
		TokenType:   "Bearer",
	})
}

type LoginRequest struct {
	Login    string `json:"login"`
	Password string `json:"password"`
}

type loginResp struct {
	ExpiresIn   int64  `json:"expires_in"`
	AccessToken string `json:"access_token"`
	TokenType   string `json:"token_type"`
}

// LogoutUser godoc
// @Summary Выход пользователя
// @Tags Users
// @Produce  json
// @Success 200 {object} map[string]string
// @Router /api/users/logout [post]
func (h *Handler) LogoutUser(ctx *gin.Context) {
	jwtStr := ctx.GetHeader("Authorization")
	if !strings.HasPrefix(jwtStr, "Bearer ") {
		ctx.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "authorization header missing"})
		return
	}

	jwtStr = jwtStr[len("Bearer "):]

	// Парсим токен, чтобы узнать время жизни
	token, err := jwt.ParseWithClaims(jwtStr, &ds.JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(h.JWTSecret), nil
	})
	if err != nil || !token.Valid {
		ctx.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "invalid token"})
		return
	}

	claims, ok := token.Claims.(*ds.JWTClaims)
	if !ok {
		ctx.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "invalid token claims"})
		return
	}

	// Вычисляем TTL токена
	var ttl time.Duration
	if claims.ExpiresAt != nil {
		ttl = time.Until(claims.ExpiresAt.Time)
		if ttl <= 0 {
			ttl = time.Second // минимальный TTL
		}
	} else {
		ttl = time.Hour // дефолт
	}

	// ✅ ПОЛУЧАЕМ ИНФОРМАЦИЮ О ПОЛЬЗОВАТЕЛЕ
	user, err := h.Repository.GetUserByUUID(claims.UserUUID)
	userInfo := "revoked"
	if err == nil {
		// Форматируем информацию о пользователе для Redis
		userInfo = fmt.Sprintf("user:%s|role:%d|uuid:%s", user.Login, user.Role, user.UUID)
	}

	// Сохраняем в Redis блеклист С ИНФОРМАЦИЕЙ О ПОЛЬЗОВАТЕЛЕ
	if err := h.Redis.WriteJWTToBlacklist(ctx.Request.Context(), jwtStr, ttl, userInfo); err != nil {
		ctx.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "failed to blacklist token"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "logged out"})
}

// GetUser godoc
// @Summary Получить информацию о текущем пользователе
// @Tags Users
// @Produce  json
// @Success 200 {object} map[string]interface{}
// @Router /api/users/me [get]
func (h *Handler) GetUser(ctx *gin.Context) {
	userUUID, err := h.getUserUUIDFromContext(ctx)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	user, err := h.Repository.GetUserByUUID(userUUID)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"uuid":  user.UUID,
		"login": user.Login,
		"role":  user.Role,
	})
}

// UpdateUser godoc
// @Summary Обновить данные пользователя
// @Tags Users
// @Accept  json
// @Produce  json
// @Param user body ds.User true "Новые данные"
// @Success 200 {object} ds.User
// @Failure 400 {object} map[string]string
// @Router /api/users/me [put]
func (h *Handler) UpdateUser(ctx *gin.Context) {
	userUUID, err := h.getUserUUIDFromContext(ctx)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	var input ds.User
	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.Password != "" {
		input.Password = generateHash(input.Password)
	}

	if err := h.Repository.UpdateUserByUUID(userUUID, &input); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, input)
}

func (h *Handler) getUserUUIDFromContext(ctx *gin.Context) (uuid.UUID, error) {
	authHeader := ctx.GetHeader("Authorization")
	if authHeader == "" {
		return uuid.Nil, errors.New("authorization header missing")
	}

	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		return uuid.Nil, errors.New("invalid authorization header format")
	}

	tokenStr := parts[1]
	token, err := jwt.ParseWithClaims(tokenStr, &ds.JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(h.JWTSecret), nil
	})
	if err != nil || !token.Valid {
		return uuid.Nil, errors.New("invalid token")
	}

	claims, ok := token.Claims.(*ds.JWTClaims)
	if !ok {
		return uuid.Nil, errors.New("invalid token claims")
	}

	return claims.UserUUID, nil
}
