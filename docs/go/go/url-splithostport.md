---
title: "host:port を、末尾のコロンと括弧で分ける url.splitHostPort"
description: "URL の host:port の文字列を、ホストとポートに分ける関数。最後のコロンの後がポートとして正しい場合だけ分け、IPv6 の [] 括弧は外して返す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/net/url/url.go"
lines: [1219, 1232]
function: "splitHostPort"
difficulty: 2
tags: [ネットワーク, パース, 文字列処理]
---

## ひとことで

`splitHostPort("example.com:8080")` は、ホスト `"example.com"` とポート `"8080"` を返します。`IPv6` の `"[::1]:80"` なら、ホスト `"::1"`（括弧を外したもの）とポート `"80"` を返します。ポートがなければ、ポートは空文字列です。

コロンは IPv6 のアドレスにも含まれるので、単純に「最初のコロン」で分けると失敗します。この関数は、その点を考えて分けています。

## コード

```go:line-numbers=1219
func splitHostPort(hostPort string) (host, port string) {
	host = hostPort

	colon := strings.LastIndexByte(host, ':')
	if colon != -1 && validOptionalPort(host[colon:]) {
		host, port = host[:colon], host[colon+1:]
	}

	if strings.HasPrefix(host, "[") && strings.HasSuffix(host, "]") {
		host = host[1 : len(host)-1]
	}

	return
}
```

## 前提知識

- **ホストとポート**: `host:port` の形で、サーバの場所と、接続する番号を表します。ポート番号は 1〜65535 の数です。
- **IPv6 のアドレス**: `::1` のように、コロンを複数含む形です。URL では、`[::1]` のように角括弧で囲んで、ポートとの区切りを明確にします。
- **`strings.LastIndexByte`**: 文字列の最後のコロンの位置を返します。
- **`validOptionalPort`**: コロンの後ろが、正しいポートの書き方かを確かめる関数です。

## 何をしているか

### 1. 最後のコロンで分けられるか確かめる

```go:line-numbers=1222
	colon := strings.LastIndexByte(host, ':')
	if colon != -1 && validOptionalPort(host[colon:]) {
		host, port = host[:colon], host[colon+1:]
	}
```

最後のコロンの位置を探します。そして、そこから後ろが正しいポートの形（`:` で始まり数字が続く、など）なら、その位置で分けます。IPv6 の `::1` は、最後のコロンの後ろが `1` だけで、ポートとしては `:1` にならないので、ポートとは見なされません。

### 2. IPv6 の角括弧を外す

```go:line-numbers=1227
	if strings.HasPrefix(host, "[") && strings.HasSuffix(host, "]") {
		host = host[1 : len(host)-1]
	}
```

ホストが `[` で始まり `]` で終わるなら、括弧を外して中身だけを返します。`[::1]` は `::1` になります。

### 3. 名前付き戻り値で返す

```go:line-numbers=1231
	return
```

関数の戻り値は `host` と `port` に名前が付いているので、最後は `return` だけで、途中で書き換えた値を返せます。

## ここがすごい

- **コロンの役割を見分ける**: IPv6 のコロンと、ポートの区切りのコロンを、「後ろが正しいポートか」で見分けています。単純な分割より安全です。
- **角括弧は見た目だけの記号**: 括弧は URL の書き方のためのもので、実際の接続先には含めません。ここで外すことで、後の処理が扱いやすくなります。
- **ポートがなくても壊れない**: コロンがなければ、ホスト全体がそのまま返り、ポートは空です。特別なエラーは出しません。

## まとめ

- `splitHostPort` は、`host:port` をホストとポートに分けます。
- 最後のコロンの後ろが正しいポートの形なら、そこで分けます。
- IPv6 の `[]` は外して、アドレスだけを返します。
- ポートがない場合は、ホスト全体をそのまま返し、ポートは空です。
