module github.com/demskie/ipam

go 1.12

replace (
	github.com/demskie/ipam => ./
	github.com/demskie/ipam/server => ./server/
)

require (
	github.com/demskie/ipam/server v0.0.0-20190813214210-10b636a777f9
	github.com/google/go-cmp v0.5.9 // indirect
	golang.org/x/crypto v0.1.0 // indirect
)
