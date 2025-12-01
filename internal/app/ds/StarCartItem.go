package ds

import "time"

// ds/models.go - добавить в структуру StarCartItem:
type StarCartItem struct {
	ID       int `gorm:"primaryKey"`
	CartID   int `gorm:"not null;uniqueIndex:idx_cart_star"`
	StarID   int `gorm:"not null;uniqueIndex:idx_cart_star"`
	Quantity int `gorm:"default:1"`
	Speed    float32
	Comment  string

	// ДЛЯ ЛАБЫ №8 - результат асинхронного расчета звезды
	StarCalculation *string `gorm:"type:varchar(100)"` // Поле для результата расчета
	CalculatedAt    *time.Time

	StarCart *StarCart `gorm:"-"`
	Star     *Star     `gorm:"foreignKey:StarID"`
}
