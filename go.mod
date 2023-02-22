module github.com/demskie/ipam

go 1.12

replace (
	github.com/demskie/ipam => ./
	github.com/demskie/ipam/server => ./server/
)

require (
	github.com/demskie/ipam/server v0.0.0-20190813214210-10b636a777f9
	github.com/google/go-cmp v0.5.9 // indirect
	golang.org/x/crypto v0.0.0-20210921155107-089bfa567519 // indirect
	golang.org/x/net v0.0.0-20220722155237-a158d28d115b // indirect
	golang.org/x/sync v0.0.0-20220722155255-886fb9371eb4 // indirect
	golang.org/x/sys v0.0.0-20220722155257-8c9f86f7a55f // indirect
)
