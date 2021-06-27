package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
)

func main() {
	http.Handle("/", http.FileServer(http.Dir("static")))

	uri := fmt.Sprintf(":%s", getPort("8080"))
	log.Printf("Start server on http://%s\n", uri)
	if err := http.ListenAndServe(uri, nil); err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}

func getPort(fallback string) string {
	port, ok := os.LookupEnv("PORT")
	if !ok {
		return fallback
	}
	return port
}
