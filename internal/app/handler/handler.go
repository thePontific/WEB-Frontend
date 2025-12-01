package handler

import (
	"LAB1/internal/app/ds"
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// handler.go - добавить метод:

// GetStarCartWithCalculationProgress godoc
// @Summary Получить заявку с прогрессом расчета звезд
// @Tags StarCart
// @Produce json
// @Param cartID path int true "ID заявки"
// @Success 200 {object} map[string]interface{}
// @Failure 404 {object} map[string]string
// @Router /api/starcart/{cartID}/progress [get]
func (h *Handler) GetStarCartWithCalculationProgress(ctx *gin.Context) {
	cartID, err := strconv.Atoi(ctx.Param("cartID"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid cart ID"})
		return
	}

	cart, err := h.Repository.GetStarCartWithProgress(cartID)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "starcart not found"})
		return
	}

	// Считаем прогресс
	calculatedCount := 0
	for _, item := range cart.Items {
		if item.StarCalculation != nil {
			calculatedCount++
		}
	}

	totalStars := len(cart.Items)
	progressPercent := 0
	if totalStars > 0 {
		progressPercent = (calculatedCount * 100) / totalStars
	}

	ctx.JSON(http.StatusOK, gin.H{
		"cart_id":          cart.ID,
		"status":           cart.Status,
		"total_stars":      totalStars,
		"calculated_stars": calculatedCount,
		"progress_percent": progressPercent,
		"progress_text":    fmt.Sprintf("%d/%d stars calculated", calculatedCount, totalStars),
		"items":            cart.Items,
	})
}

// UpdateStarCalculationResult godoc
// @Summary Обновить результат расчета звезды (вызывается Django-сервисом)
// @Description Принимает результат асинхронного расчета от Django-сервиса
// @Tags StarCart
// @Accept json
// @Produce json
// @Param request body DjangoCalculationRequest true "Данные расчета звезды"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Router /api/starcart/update-star-result [post]
func (h *Handler) UpdateStarCalculationResult(ctx *gin.Context) {
	var req DjangoCalculationRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid request format"})
		return
	}

	// ✅ ПСЕВДО-АВТОРИЗАЦИЯ (как требует задание - 8+ байт)
	secretToken := "secret-star-token-12345678" // ровно 8+ байт
	if req.Token != secretToken {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "invalid token"})
		return
	}

	// Обновляем поле StarCalculation в БД
	now := time.Now()
	err := h.Repository.UpdateStarCartItemCalculation(req.CartItemID, req.StarResult, &now)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update calculation: " + err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"status":        "star_calculation_updated",
		"cart_item_id":  req.CartItemID,
		"star_result":   req.StarResult,
		"calculated_at": now.Format(time.RFC3339),
	})
}

// В handler.go ДОБАВИТЬ метод:
func (h *Handler) sendStarToDjango(cartItems []ds.StarCartItem) {
	fmt.Println("🚀 Отправка данных звезд в Django для расчета скорости...")

	for _, item := range cartItems {
		// Получаем полные данные о звезде
		star, err := h.Repository.GetStar(item.StarID)
		if err != nil {
			fmt.Printf("❌ Ошибка получения звезды %d: %v\n", item.StarID, err)
			continue
		}

		// Отправляем в Django для расчета
		go h.calculateVelocityInDjango(item.ID, star)
	}
}

// Функция для вызова Django
func (h *Handler) calculateVelocityInDjango(cartItemID int, star ds.Star) {
	djangoURL := "http://localhost:8000/calculate-velocity/"

	// Отправляем данные звезды для расчета
	data := map[string]interface{}{
		"cart_item_id": cartItemID,
		"star_id":      star.ID,
		"title":        star.Title,
		"distance":     star.Distance,
		"mass":         star.Mass,
		"star_type":    star.StarType,
	}

	jsonData, _ := json.Marshal(data)

	resp, err := http.Post(djangoURL, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		fmt.Printf("❌ Ошибка вызова Django для звезды %s: %v\n", star.Title, err)
		return
	}
	defer resp.Body.Close()

	fmt.Printf("✅ Данные звезды '%s' отправлены в Django для расчета скорости\n", star.Title)
}

// UpdateStarVelocity godoc
// @Summary Обновить скорость звезды (вызывается Django)
// @Description Принимает рассчитанную скорость от Django-сервиса
// @Tags StarCart
// @Accept json
// @Produce json
// @Param request body StarVelocityRequest true "Данные скорости"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Router /api/starcart/update-star-velocity [post]
func (h *Handler) UpdateStarVelocity(ctx *gin.Context) {
	var req StarVelocityRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid request format"})
		return
	}

	// Псевдо-авторизация
	secretToken := "secret-star-token-12345678"
	if req.Token != secretToken {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "invalid token"})
		return
	}

	// Сохраняем скорость (обновляем поле speed)
	err := h.Repository.UpdateStarCartItemSpeedByID(req.CartItemID, float32(req.VelocityMs))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update velocity: " + err.Error()})
		return
	}

	// Также сохраняем расчет в star_calculation для истории
	resultText := fmt.Sprintf("Velocity: %.2f m/s (%.2f km/s) - %s",
		req.VelocityMs, req.VelocityKms, req.VelocityType)

	now := time.Now()
	h.Repository.UpdateStarCartItemCalculation(req.CartItemID, resultText, &now)

	fmt.Printf("✅ Скорость обновлена для item %d: %.2f м/с (%s)\n",
		req.CartItemID, req.VelocityMs, req.VelocityType)

	ctx.JSON(http.StatusOK, gin.H{
		"status":        "velocity_updated",
		"cart_item_id":  req.CartItemID,
		"velocity_ms":   req.VelocityMs,
		"velocity_kms":  req.VelocityKms,
		"velocity_type": req.VelocityType,
	})
}
