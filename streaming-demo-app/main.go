package main

import (
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log"
	"net/http"
)

func crash(err error) {
	if err != nil {
		log.Panic(err)
	}
}

func main() {
	graphqlUrl := flag.String("graphql", "http://localtest.me:3000/graphql", "GraphQL URL")
	pipelineId := flag.String("pipeline", "", "Pipeline ID")
	apiToken := flag.String("apiToken", "", "API Token")
	flag.Parse()

	fmt.Println("Running webserver on port 3001")
	http.HandleFunc("/index.js", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "dist/index.js")
	})

	http.HandleFunc("/get_session", func(w http.ResponseWriter, r *http.Request) {
		query := struct {
			Query string `json:"query"`
		}{
			Query: fmt.Sprintf(`
          mutation {
            createHlServingSession(pipelineId: %#v) {
              sessionCredentials {
                sessionId
                sessionKey
                websocketUrl
                transport
                host
                port
                username
                password
                topicRequest
                topicResponse
              }
              errors
            }
          }
        `, *pipelineId),
		}

		var buffer bytes.Buffer
		encoder := json.NewEncoder(&buffer)
		err := encoder.Encode(&query)
		crash(err)

		request, err := http.NewRequest("POST", *graphqlUrl, &buffer)
		crash(err)
		request.Header.Set("Authorization", "token "+*apiToken)
		request.Header.Set("Content-Type", "application/json")
		response, err := http.DefaultClient.Do(request)
		crash(err)

		defer response.Body.Close()
		io.Copy(w, response.Body)
	})

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "index.html")
	})
	crash(http.ListenAndServe(":3001", nil))
}
