package config

import (
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
	log "github.com/sirupsen/logrus"
	"github.com/spf13/viper"
)

type Config struct {
	ServiceHost string
	ServicePort int
	JWTSecret   string
	Redis       RedisConfig
}

type RedisConfig struct {
	Host        string
	Password    string
	Port        int
	User        string
	DialTimeout time.Duration
	ReadTimeout time.Duration
}

func NewConfig() (*Config, error) {
	_ = godotenv.Load()

	configName := "config"
	if os.Getenv("CONFIG_NAME") != "" {
		configName = os.Getenv("CONFIG_NAME")
	}

	viper.SetConfigName(configName)
	viper.SetConfigType("toml")
	viper.AddConfigPath("config")
	viper.AddConfigPath(".")
	viper.WatchConfig()

	if err := viper.ReadInConfig(); err != nil {
		return nil, err
	}

	cfg := &Config{}
	if err := viper.Unmarshal(cfg); err != nil {
		return nil, err
	}

	// ⭐ SERVICE HOST & PORT
	if os.Getenv("SERVICE_HOST") != "" {
		cfg.ServiceHost = os.Getenv("SERVICE_HOST")
	}
	if cfg.ServiceHost == "" {
		cfg.ServiceHost = "localhost" // дефолт
	}

	if os.Getenv("SERVICE_PORT") != "" {
		port, err := strconv.Atoi(os.Getenv("SERVICE_PORT"))
		if err != nil {
			return nil, err
		}
		cfg.ServicePort = port
	}
	if cfg.ServicePort == 0 {
		cfg.ServicePort = 8080 // дефолт
	}

	// JWT Secret (существующий код)
	if os.Getenv("JWT_SECRET") != "" {
		cfg.JWTSecret = os.Getenv("JWT_SECRET")
	}
	if cfg.JWTSecret == "" {
		cfg.JWTSecret = "test"
	}

	// Redis (существующий код)
	if os.Getenv("REDIS_HOST") != "" {
		cfg.Redis.Host = os.Getenv("REDIS_HOST")
	}
	if os.Getenv("REDIS_PORT") != "" {
		port, err := strconv.Atoi(os.Getenv("REDIS_PORT"))
		if err != nil {
			return nil, err
		}
		cfg.Redis.Port = port
	}
	if os.Getenv("REDIS_USER") != "" {
		cfg.Redis.User = os.Getenv("REDIS_USER")
	}
	if os.Getenv("REDIS_PASSWORD") != "" {
		cfg.Redis.Password = os.Getenv("REDIS_PASSWORD")
	}

	cfg.Redis.DialTimeout = 10 * time.Second
	cfg.Redis.ReadTimeout = 10 * time.Second

	log.Infof("Config parsed - Server will run on: %s:%d", cfg.ServiceHost, cfg.ServicePort)
	return cfg, nil
}
