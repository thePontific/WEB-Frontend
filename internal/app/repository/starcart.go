package repository

import (
	"LAB1/internal/app/ds"
	"time"

	"github.com/google/uuid"
)

// ====== Получить заявку по ID ======
func (r *Repository) GetCartByID(cartID int) (ds.StarCart, error) {
	var cart ds.StarCart
	// Подгружаем Items и их звёзды
	if err := r.db.Preload("Items.Star").First(&cart, cartID).Error; err != nil {
		return ds.StarCart{}, err
	}
	return cart, nil
}

// ====== Посчитать количество элементов заявки ======

func (r *Repository) CountCartItems(cartID int) (int, error) {
	var count int64
	err := r.db.Model(&ds.StarCartItem{}).Where("cart_id = ?", cartID).Count(&count).Error
	return int(count), err
}

// ====== Создать новую заявку ======
func (r *Repository) CreateCart(cart *ds.StarCart) error {
	return r.db.Create(cart).Error
}

// ====== Добавить элемент в заявку ======
func (r *Repository) AddCartItem(item *ds.StarCartItem) error {
	return r.db.Create(item).Error
}

func (r *Repository) RawDeleteCartByID(cartID int) error {
	return r.db.Exec(
		"UPDATE star_carts SET status = ?, date_finished = ? WHERE id = ?",
		ds.StatusDeleted, time.Now(), cartID,
	).Error
}
func (r *Repository) MarkStarCartAsDeleted(id int) error {
	query := `UPDATE starcarts SET status = ? WHERE id = ?`
	result := r.db.Exec(query, "удалён", id)
	return result.Error
}
func (r *Repository) GetStarCartItemByID(id int) (ds.StarCartItem, error) {
	var item ds.StarCartItem
	if err := r.db.First(&item, id).Error; err != nil {
		return ds.StarCartItem{}, err
	}
	return item, nil
}
func (r *Repository) UpdateCartItemSpeed(item *ds.StarCartItem) error {
	// Обновляем только поле speed
	return r.db.Model(&ds.StarCartItem{}).Where("id = ?", item.ID).Update("speed", item.Speed).Error
}

// Аналогично для других методов, работающих с creator_id
func (r *Repository) GetCartsByCreatorID(creatorID uuid.UUID) ([]ds.StarCart, error) {
	var carts []ds.StarCart
	err := r.db.Where("creator_id = ?", creatorID).Find(&carts).Error
	return carts, err
}

// GetStarCartsByCreatorID возвращает заявки конкретного создателя
func (r *Repository) GetStarCartsByCreatorID(creatorID uuid.UUID, from, to, status string) ([]ds.StarCart, error) {
	query := r.db.Where("creator_id = ?", creatorID)

	// Добавляем фильтры как в GetStarCartsFiltered
	if from != "" {
		query = query.Where("date_create >= ?", from)
	}
	if to != "" {
		query = query.Where("date_create <= ?", to)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}

	var carts []ds.StarCart
	err := query.Find(&carts).Error
	if err != nil {
		return nil, err
	}

	// Загружаем items для каждой корзины
	for i := range carts {
		r.db.Where("cart_id = ?", carts[i].ID).Find(&carts[i].Items)
	}

	return carts, nil
}

// ====== МЕТОДЫ ДЛЯ ЛАБЫ №8 ======

// UpdateStarCartItemCalculation обновляет результат расчета звезды
func (r *Repository) UpdateStarCartItemCalculation(itemID int, result string, calculatedAt *time.Time) error {
	// Используем GORM вместо raw query с Exec
	return r.db.Model(&ds.StarCartItem{}).
		Where("id = ?", itemID).
		Updates(map[string]interface{}{
			"star_calculation": result,
			"calculated_at":    calculatedAt,
		}).Error
}

// GetStarCartWithProgress получает заявку с прогрессом расчета звезд
func (r *Repository) GetStarCartWithProgress(cartID int) (ds.StarCart, error) {
	var cart ds.StarCart

	// Получаем заявку
	if err := r.db.First(&cart, cartID).Error; err != nil {
		return ds.StarCart{}, err
	}

	// Получаем элементы заявки
	var items []ds.StarCartItem
	if err := r.db.Where("cart_id = ?", cartID).Find(&items).Error; err != nil {
		return ds.StarCart{}, err
	}

	// Загружаем информацию о звездах для каждого элемента
	for i := range items {
		var star ds.Star
		if err := r.db.First(&star, items[i].StarID).Error; err == nil {
			items[i].Star = &star
		}
	}

	cart.Items = items
	return cart, nil
}

// CountCalculatedStars считает количество рассчитанных звезд в заявке
func (r *Repository) CountCalculatedStars(cartID int) (int, error) {
	var count int64
	err := r.db.Model(&ds.StarCartItem{}).
		Where("cart_id = ? AND star_calculation IS NOT NULL", cartID).
		Count(&count).Error
	return int(count), err
}

// GetStarCartItemByIDWithStar получает элемент заявки с информацией о звезде
func (r *Repository) GetStarCartItemByIDWithStar(itemID int) (ds.StarCartItem, error) {
	var item ds.StarCartItem
	if err := r.db.First(&item, itemID).Error; err != nil {
		return ds.StarCartItem{}, err
	}

	// Загружаем звезду
	var star ds.Star
	if err := r.db.First(&star, item.StarID).Error; err == nil {
		item.Star = &star
	}

	return item, nil
}

// GetStarCartItemsByCartID получает все элементы заявки
func (r *Repository) GetStarCartItemsByCartID(cartID int) ([]ds.StarCartItem, error) {
	var items []ds.StarCartItem
	err := r.db.Where("cart_id = ?", cartID).Find(&items).Error
	return items, err
}

// repository.go - ДОБАВИТЬ метод:
func (r *Repository) UpdateStarCartItemSpeedByID(itemID int, speed float32) error {
	return r.db.Model(&ds.StarCartItem{}).
		Where("id = ?", itemID).
		Update("speed", speed).Error
}
