module github.com/demskie/ipam

go 1.12

replace (
	github.com/demskie/ipam => ./
	github.com/demskie/ipam/server => ./server/
)

require github.com/demskie/ipam/server v0.0.0-00010101000000-000000000000
