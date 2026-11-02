---
title: "URL のクエリを & で割って、件数の上限と ; の拒否を入れる parseQuery"
description: "URL のクエリ文字列 a=1&b=2 を解析する url.parseQuery。& の数から件数の上限を先に確かめ、; を使った古い区切りを拒否し、エラーがあっても最後まで読み続ける。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/net/url/url.go"
lines: [989, 1021]
function: "parseQuery"
difficulty: 3
tags: [ネットワーク, セキュリティ, パース, 防御的プログラミング]
---

## ひとことで

`url.ParseQuery` は、`name=go&lang=ja` のような URL のクエリを、`map[string][]string` に変換します。その内部で働く `parseQuery` は、単に分けるだけでなく、**件数の上限、区切り文字の拒否、エラーの扱い** の 3 つを行っています。

例えば `a=1;b=2` は、古い区切り `;` を使っているため、エラーとして扱われます。

## コード

```go:line-numbers=989
func parseQuery(m Values, query string) (err error) {
	if !urlParamsWithinMax(strings.Count(query, "&") + 1) {
		return errors.New("number of URL query parameters exceeded limit")
	}
	for query != "" {
		var key string
		key, query, _ = strings.Cut(query, "&")
		if strings.Contains(key, ";") {
			err = fmt.Errorf("invalid semicolon separator in query")
			continue
		}
		if key == "" {
			continue
		}
		key, value, _ := strings.Cut(key, "=")
		key, err1 := QueryUnescape(key)
		if err1 != nil {
			if err == nil {
				err = err1
			}
			continue
		}
		value, err1 = QueryUnescape(value)
		if err1 != nil {
			if err == nil {
				err = err1
			}
			continue
		}
		m[key] = append(m[key], value)
	}
	return err
}
```

## 前提知識

- **クエリ文字列**: URL の `?` の後ろにある、`key=value` の並びです。`&` で区切られます。
- **map と複数の値**: `Values` は `map[string][]string` で、同じキーに複数の値を入れられます。`m[key] = append(m[key], value)` が、その 1 件を追加する書き方です。
- **`strings.Cut`**: 区切り文字の最初の位置で、文字列を前と後ろに分ける関数です。区切りが見つかったかも返します。
- **パーセントエンコード**: URL で空白や記号を `%20` のように書く方法です。`QueryUnescape` が、これをもとに戻します。
- **DoS（サービス拒否攻撃）**: 大量のデータを送って、サーバを使い切らせる攻撃です。件数の上限は、その対策の 1 つです。

## 何をしているか

### 1. 件数の上限を先に確かめる

```go:line-numbers=990
	if !urlParamsWithinMax(strings.Count(query, "&") + 1) {
		return errors.New("number of URL query parameters exceeded limit")
	}
```

`&` の数に 1 を足したものが、パラメータの件数です。解析を始める前に、その件数が上限を超えていないかを確かめます。大量の `&` を送られても、メモリを使い切る前に止まります。

### 2. & で切り分け、; は拒否する

```go:line-numbers=995
		key, query, _ = strings.Cut(query, "&")
		if strings.Contains(key, ";") {
			err = fmt.Errorf("invalid semicolon separator in query")
			continue
		}
```

`Cut` で、先頭の `key=value` を取り出します。古い仕様では `;` も区切りに使えましたが、ここでは拒否します。エラーを記録して `continue` し、残りのパラメータは読み続けます。

### 3. エラーがあっても読み続ける

```go:line-numbers=1003
		key, value, _ := strings.Cut(key, "=")
		key, err1 := QueryUnescape(key)
		if err1 != nil {
			if err == nil {
				err = err1
			}
			continue
		}
```

`=` で値を分け、キーと値をそれぞれ `QueryUnescape` で元に戻します。失敗したら、最初のエラーだけを `err` に残し、そのパラメータは捨てて続けます。全部を捨てずに、読めたものだけを使えます。

### 4. 1 件ずつ追加する

```go:line-numbers=1018
		m[key] = append(m[key], value)
```

ようやく、キーに値を追加します。同じキーが複数回出てくれば、スライスに値が並びます。

## ここがすごい

- **大量入力を、読む前に止める**: 件数を数えるだけで判定できるので、解析のコストを払う前に拒否できます。
- **曖昧な仕様を拒否する**: `;` を区切りとして扱うと、解釈が 2 通りになって危険です。明確に拒否することで、誤解を防ぎます。
- **部分的に成功する**: 1 件のエラーで全体を捨てず、読めるものを残しつつ、最初のエラーを返します。ユーザーの入力を、できるだけ生かす設計です。

## まとめ

- `parseQuery` は、`&` で区切られたクエリを、`map[string][]string` に変換します。
- 件数の上限を、解析の前に確かめて、大量入力を防ぎます。
- `;` は仕様の曖昧さを避けるために拒否します。
- エラーがあっても最初のエラーを残し、読める部分は最後まで処理します。
