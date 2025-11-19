package repository

import (
	"LAB1/internal/app/ds"
	"fmt"
)

// "Удаление" услуги — помечаем is_delete = true
func (r *Repository) DeleteStar(starID int) error {
	err := r.db.Model(&ds.Star{}).Where("id = ?", starID).UpdateColumn("is_delete", true).Error
	if err != nil {
		return fmt.Errorf("ошибка при удалении услуги с id %d: %w", starID, err)
	}
	return nil
}

// Получаем все услуги, только не удалённые
func (r *Repository) GetStars() ([]ds.Star, error) {
	var stars []ds.Star
	err := r.db.Where("is_delete = false").Find(&stars).Error
	if err != nil {
		return nil, err
	}
	return stars, nil
}

// Получение услуги по ID
func (r *Repository) GetStar(id int) (ds.Star, error) {
	var star ds.Star
	err := r.db.Where("id = ? AND is_delete = false", id).First(&star).Error
	if err != nil {
		return ds.Star{}, err
	}
	return star, nil
}

// Поиск услуги по названию, только не удалённые
func (r *Repository) SearchStarByTitle(title string) ([]ds.Star, error) {
	var stars []ds.Star
	err := r.db.Where("title ILIKE ? AND is_delete = false", "%"+title+"%").Find(&stars).Error
	if err != nil {
		return nil, err
	}
	return stars, nil
}

// GetStarsWithFilters получает звезды с фильтрацией
func (r *Repository) GetStarsWithFilters(filters map[string]interface{}) ([]ds.Star, error) {
	query := r.db.Where("is_delete = false")

	if title, ok := filters["title"].(string); ok && title != "" {
		query = query.Where("title ILIKE ?", "%"+title+"%")
	}

	if distanceMin, ok := filters["distance_min"].(string); ok && distanceMin != "" {
		query = query.Where("distance >= ?", distanceMin)
	}

	if distanceMax, ok := filters["distance_max"].(string); ok && distanceMax != "" {
		query = query.Where("distance <= ?", distanceMax)
	}

	if starType, ok := filters["star_type"].(string); ok && starType != "" {
		query = query.Where("star_type = ?", starType)
	}

	if magnitudeMin, ok := filters["magnitude_min"].(string); ok && magnitudeMin != "" {
		query = query.Where("magnitude >= ?", magnitudeMin)
	}

	if magnitudeMax, ok := filters["magnitude_max"].(string); ok && magnitudeMax != "" {
		query = query.Where("magnitude <= ?", magnitudeMax)
	}

	if tempMin, ok := filters["temperature_min"].(string); ok && tempMin != "" {
		query = query.Where("temperature >= ?", tempMin)
	}

	if tempMax, ok := filters["temperature_max"].(string); ok && tempMax != "" {
		query = query.Where("temperature <= ?", tempMax)
	}

	var stars []ds.Star
	err := query.Find(&stars).Error
	return stars, err
}
