---
title: "URL のユーザー名を取り出す Userinfo.Username。nil でも空の文字列を返す"
description: "net/url の Userinfo.Username。URL に含まれるユーザー名を返す。Userinfo が nil のときは、パニックにせず空の文字列を返す。ユーザー情報がない URL を、安全に扱えるようにするための作り。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/net/url/url.go"
lines: [338, 343]
function: "Username"
difficulty: 1
tags: [防御的プログラミング, 文字列処理, API設計]
---

## ひとことで

`u.Username()` は、URL に書かれたユーザー名を返します。例えば `https://alice@example.com` なら `alice` です。

URL によっては、ユーザー情報そのものがありません。その場合、`Userinfo` は `nil` になります。`nil` のポインタのメソッドを呼ぶと、普通はパニックが起きますが、この関数はそれを避けます。

## コード

```go:line-numbers=338
func (u *Userinfo) Username() string {
	if u == nil {
		return ""
	}
	return u.username
}
```

## 前提知識

- **`Userinfo`**: URL の中の、ユーザー名とパスワードをまとめた型です。`https://user:pass@host` の `user:pass` の部分にあたります。
- **`nil` のポインタ**: どこも指していない状態のポインタです。フィールドを読むと、パニックが起きます。
- **`nil` レシーバー**: メソッドのレシーバーが `nil` の状態で呼ばれることです。Go では、この状態のメソッドを書けます。
- **空の文字列**: 文字が一つもない文字列です。ユーザー名がないときの、自然な値です。

## 何をしているか

### 1. nil なら空の文字列を返す

```go:line-numbers=339
	if u == nil {
		return ""
	}
```

`Userinfo` がないときは、ユーザー名もありません。`nil` の中身を読まずに、空の文字列を返します。

### 2. ユーザー名を返す

```go:line-numbers=342
	return u.username
```

`Userinfo` があれば、保存されているユーザー名をそのまま返します。

## ここがすごい

- **nil を読まない**: 値の有無を、フィールドを読む前に確かめるので、パニックが起きません。呼び出し側は、`nil` かどうかを気にせずに使えます。
- **空の値で表す**: ユーザー名がないことを、空の文字列で表します。戻り値の型は、常に文字列のままなので、扱いが単純です。
- **連鎖しても安全**: 結果が `nil` の場合でも、そのままメソッドを呼べます。URL を解析した後の処理を、確実に続けられます。

## まとめ

- `Username` は、URL のユーザー名を返します。
- `Userinfo` が `nil` の場合は、パニックを避けて空の文字列を返します。
- 呼び出し側は、ユーザー情報の有無を気にせず使えます。
