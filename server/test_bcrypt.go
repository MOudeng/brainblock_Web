package main

import (
	"fmt"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	hash := "$2a$10$T8brVS3nO0CpKSzS/UOmOOhHE6ubRJ23oZoqsbofL8DrZ8vCIJr7C"
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte("admin123"))
	if err != nil {
		fmt.Println("Does NOT match admin123:", err)
	} else {
		fmt.Println("Matches admin123")
	}
}
