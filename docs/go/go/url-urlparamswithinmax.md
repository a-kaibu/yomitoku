---
title: "URL のクエリの数を上限と比べる urlParamsWithinMax。設定の変化を記録する"
description: "net/url の urlParamsWithinMax。クエリパラメータの数が、既定の上限と環境変数で指定された上限のどちらで判定しても同じかを調べる。食い違いが出たら、その回数を記録する。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/net/url/url.go"
lines: [973, 987]
function: "urlParamsWithinMax"
difficulty: 3
tags: [防御的プログラミング, 文字列処理, 可読性]
---

## ひとことで

`urlParamsWithinMax(params)` は、URL のクエリのパラメータ数が、許される上限の範囲に収まっているかを返します。上限は、既定の値か、環境変数で指定された値のどちらかです。

この関数は、判定の結果そのものを返すだけでなく、既定の判定と指定された判定が食い違ったときに、その回数を記録します。新しい設定を入れたとき、その影響を確かめられるようにするためです。

## コード

```go:line-numbers=973
func urlParamsWithinMax(params int) bool {
	withinDefaultMax := params <= defaultMaxParams
	if urlmaxqueryparams.Value() == "" {
		return withinDefaultMax
	}
	customMax, err := strconv.Atoi(urlmaxqueryparams.Value())
	if err != nil {
		return withinDefaultMax
	}
	withinCustomMax := customMax == 0 || params < customMax
	if withinDefaultMax != withinCustomMax {
		urlmaxqueryparams.IncNonDefault()
	}
	return withinCustomMax
}
```

## 前提知識

- **クエリパラメータ**: URL の `?` の後ろに並ぶ、`key=value` の組です。数が多すぎると、サーバーの負担になるので、上限が設けられます。
- **既定の上限**: 何も指定しないときに使う、標準の上限です。
- **環境変数**: プログラムの外から、設定値を渡す仕組みです。ここでは、上限の値を変えるために使われます。
- **`IncNonDefault`**: 既定の設定と違う結果が出たことを、数えて記録する仕組みです。

## 何をしているか

### 1. 既定の上限で判定する

```go:line-numbers=974
	withinDefaultMax := params <= defaultMaxParams
	if urlmaxqueryparams.Value() == "" {
		return withinDefaultMax
	}
```

まず既定の上限と比べて、結果を作ります。環境変数が空なら、この結果をそのまま返します。

### 2. 指定された上限で判定する

```go:line-numbers=978
	customMax, err := strconv.Atoi(urlmaxqueryparams.Value())
	if err != nil {
		return withinDefaultMax
	}
	withinCustomMax := customMax == 0 || params < customMax
```

環境変数の値を整数に変換します。変換に失敗したら、既定の判定を使います。変換できたら、上限が 0 のときは無制限として扱い、そうでなければ上限より小さいかを比べます。

### 3. 食い違いを記録して返す

```go:line-numbers=983
	if withinDefaultMax != withinCustomMax {
		urlmaxqueryparams.IncNonDefault()
	}
	return withinCustomMax
```

2 つの判定が違えば、設定の変化による影響があったことを記録します。最後に、指定された上限による判定を返します。

## ここがすごい

- **変更の影響を見える化**: 結果が変わった回数を記録するので、新しい上限を入れたときに、どれだけ動きが変わったかを確認できます。
- **失敗に強い**: 環境変数が数字でなくても、既定の判定に戻るので、プログラムが止まることはありません。
- **0 の意味を決める**: 上限 0 を無制限として扱う約束を、1 行の式で表しています。小さな決まりごとも、読んで分かるように書かれています。

## まとめ

- `urlParamsWithinMax` は、クエリのパラメータ数が上限に収まるかを返します。
- 環境変数が使えないときは、既定の上限で判定します。
- 2 つの判定が食い違ったときは、その回数を記録して、影響を確かめられるようにします。
