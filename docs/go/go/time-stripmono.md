---
title: "単調時計の値を捨てて、秒を ext に移す stripMono"
description: "time パッケージの Time.stripMono。単調時計の値を持つ時刻から、その値を取り除く。秒を ext に戻し、wall にはナノ秒だけを残す。"
language: go
project: "Go"
repo: https://github.com/golang/go
license: "BSD-3-Clause"
copyright: "Copyright 2009 The Go Authors. All rights reserved."
commit: "52f1233d8c6a9e9eaf191a6bdbff16d9151eb5b8"
format: 2
file: "src/time/time.go"
lines: [226, 231]
function: "stripMono"
difficulty: 2
tags: [日時, ビット演算]
---

## ひとことで

`t.stripMono()` は、時刻 `t` から単調時計の値を取り除きます。取り除いた後は、ふつうの壁時計の時刻として扱えるようになります。

## コード

```go:line-numbers=226
func (t *Time) stripMono() {
	if t.wall&hasMonotonic != 0 {
		t.ext = t.sec()
		t.wall &= nsecMask
	}
}
```

## 前提知識

- **単調時計**: 時刻の差を正しく測るために持つ値です。`t` が持っているときは、`ext` にその値が入ります。
- **wall と ext**: `wall` にはナノ秒と印が、`ext` には秒が入ります。単調時計を持つときは、`ext` の役割が変わります。
- **マスク**: `&` とマスクの値を使うと、必要なビットだけを残せます。

## 何をしているか

### 1. 単調時計を持つかを確かめる

```go:line-numbers=227
	if t.wall&hasMonotonic != 0 {
```

印のビットが立っているときだけ、取り除く処理をします。持っていなければ、何もしません。

### 2. 秒を ext に戻す

```go:line-numbers=228
		t.ext = t.sec()
```

`sec` で壁時計の秒を求め、`ext` に入れ直します。単調時計の値は、この時点で `ext` から消えます。

### 3. wall にナノ秒だけを残す

```go:line-numbers=229
		t.wall &= nsecMask
```

`nsecMask` との `&` で、`wall` からナノ秒以外のビットを消します。印も秒の部分も消えるので、`wall` にはナノ秒だけが残ります。

## ここがすごい

- **同じ値を二つの場所で表す**: 単調時計を持つときは、秒を `wall` に隠しておき、外すときに `ext` へ戻します。
- **印を消すだけで状態が変わる**: 印を消せば、`Time` は単調時計を持たない状態に戻ります。

## まとめ

- `stripMono` は単調時計の値を取り除きます。
- 秒は `sec` で求めて `ext` に戻します。
- `wall` にはナノ秒だけを残します。
