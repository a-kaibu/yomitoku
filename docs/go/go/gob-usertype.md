---
title: "利用者の型を gob の型に変える userType。無効な型なら実行を止める"
description: "encoding/gob の userType。Go の型 rt を gob が扱える形の情報に変える。内部では validUserType で型の有効性を調べ、エラーがあればその場で止める。呼び出し側は、必ず有効な情報を受け取れる。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/encoding/gob/type.go"
lines: [154, 160]
function: "userType"
difficulty: 1
tags: [型システム, 防御的プログラミング, リフレクション]
---

## ひとことで

`userType(rt)` は、利用者が指定した Go の型 `rt` を、gob が使える情報に変換します。この変換は、型が gob で扱えるかの確認を含みます。

扱えない型を渡されたときは、エラーをそのまま返すのではなく、その場でプログラムを止めます。gob の内部では、型の情報が必ず揃っていることを前提にしているからです。

## コード

```go:line-numbers=154
func userType(rt reflect.Type) *userTypeInfo {
	ut, err := validUserType(rt)
	if err != nil {
		error_(err)
	}
	return ut
}
```

## 前提知識

- **`validUserType`**: 型を調べて、gob で扱えるかを確かめる関数です。扱えない型なら、エラーを返します。
- **`userTypeInfo`**: 型の情報をまとめた、内部の記録です。変換後の情報として使われます。
- **`error_`**: gob の内部で、エラーを報告して止めるための関数です。
- **前提の固定**: 内部の処理は、型の情報があることを前提にしています。前提が崩れたら、後の処理は正しく動きません。

## 何をしているか

### 1. 型の有効性を確かめる

```go:line-numbers=155
	ut, err := validUserType(rt)
	if err != nil {
		error_(err)
	}
```

`validUserType` で、型 `rt` が扱えるかを確かめます。扱えないときは、エラーを `error_` に渡して、プログラムを止めます。

### 2. 情報を返す

```go:line-numbers=159
	return ut
```

エラーがなければ、変換された情報 `ut` を返します。呼び出し側は、常に有効な情報だけを受け取ります。

## ここがすごい

- **無効な値を後に持ち越さない**: 変換の時点で確かめるので、無効な型が内部の奥まで届くことがありません。
- **戻り値に例外がない**: 返り値は必ず有効なので、呼び出し側は、エラーの処理を書く必要がありません。
- **誤りを起点で止める**: 型を指定した場所の近くで止まるので、原因を見つけやすくなっています。

## まとめ

- `userType` は、Go の型を gob が使える情報に変換します。
- 型が扱えないときは、`error_` でプログラムを止めます。
- 呼び出し側は、常に有効な情報を受け取れます。
