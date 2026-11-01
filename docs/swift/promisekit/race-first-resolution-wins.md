---
title: "複数の Promise のうち、先に終わった結果を採用する"
description: "複数の非同期処理を同時に待ち、最初に結果が出たものを採用する関数。結果を受け取る Promise は一度しか確定しないので、後から来た結果は無視される。"
language: swift
project: "PromiseKit"
repo: https://github.com/mxcl/PromiseKit
license: MIT
copyright: "Copyright 2016-present, Max Howell; mxcl@me.com"
commit: "96cd3bdedf944c1606ad1fa7e32418ce0cd7ff68"
file: Sources/race.swift
lines: [4, 10]
function: "race (private _race(_:))"
difficulty: 1
tags: [並行処理, 非同期, イディオム]
format: 2
---
## ひとことで

`race` は、複数の非同期処理を **同時に** 始めて、**最初に結果が出たもの** を採用します。たとえば、2 つのサーバーに同じ問い合わせをして、先に返ってきた方を使う、といった使い方ができます。
戻り値は、勝った処理の結果を受け取る `Promise` です。

## コード

```swift:line-numbers=4
private func _race<U: Thenable>(_ thenables: [U]) -> Promise<U.T> {
    let rp = Promise<U.T>(.pending)
    for thenable in thenables {
        thenable.pipe(to: rp.box.seal)
    }
    return rp
}
```

## 前提知識

- **`Promise`**: まだ結果が決まっていない値を表します。結果が出たら「確定（sealed）」して、以後は変わりません。
- **`pending`**: まだ結果が決まっていない状態で作った `Promise` です。あとから結果を流し込めます。
- **`pipe(to:)`**: ある `Promise` の結果を、別の受け口へ渡す関数です。
- **`Thenable`**: `then` で結果を受け取れる、`Promise` などの型をまとめる名前です。

## 何をしているか

### 1. 受け口になる Promise を作る

まだ結果がない `Promise` を作ります。これが、最後に呼び出し元へ返す `rp` です。

```swift:line-numbers=5
    let rp = Promise<U.T>(.pending)
```
### 2. 全部の処理の結果を、同じ受け口へ流す

各 `thenable` の結果を、`rp` の `seal` へ流し込みます。どの処理が先に終わっても、同じ受け口へ届きます。

```swift:line-numbers=6
    for thenable in thenables {
        thenable.pipe(to: rp.box.seal)
    }
```
### 3. 受け口を返す

`rp` を返します。呼び出し元は、`then` で最初の結果を待てます。

```swift:line-numbers=9
    return rp
```
## ここがすごい

- **最初の結果だけが効く**: `seal` は、すでに確定しているときは何もしません。ソースの `seal` でも、すでに確定していれば `return` しています。そのため、2 番目以降の結果は捨てられます。
- **待つ側のコードが 1 つで済む**: 呼び出し元は、`race` が返す 1 つの `Promise` に `then` をつけるだけです。どの処理が勝ったかを、複数の場所で調べなくて済みます。
- **受け口を外から作る**: `pending` で先に受け口を作り、後から流し込むという形です。結果を決める処理と、待つ処理を分けられます。

## まとめ

- 複数の非同期処理の中で、最初に結果が出たものを採用できる。
- 受け口の `Promise` は一度しか確定しないので、後の結果は無視される。
- 受け口を先に作り、結果を後から流し込むと、待つ側がシンプルになる。
