---
title: "連鎖の最初の処理を、保留状態の Promise に包んで始める"
description: "PromiseKit の firstly。最初の処理が投げる例外も含めて、連鎖の先頭を Promise として返す関数。後続の then を読みやすく書ける。"
language: swift
project: "PromiseKit"
repo: https://github.com/mxcl/PromiseKit
license: MIT
copyright: "Copyright 2016-present, Max Howell; mxcl@me.com"
commit: "96cd3bdedf944c1606ad1fa7e32418ce0cd7ff68"
file: Sources/firstly.swift
lines: [26, 34]
function: "firstly(execute:)"
difficulty: 2
tags: [非同期, エラー処理]
format: 2
---
## ひとことで

非同期の処理を `then` でつないでいくと、最初の処理だけ形が違って読みにくくなることがあります。`firstly` は、最初の処理も同じ形で書けるように、結果を `Promise` に包んで連鎖の先頭にします。

## コード

```swift:line-numbers=26
public func firstly<U: Thenable>(execute body: () throws -> U) -> Promise<U.T> {
    do {
        let rp = Promise<U.T>(.pending)
        try body().pipe(to: rp.box.seal)
        return rp
    } catch {
        return Promise(error: error)
    }
}
```

## 前提知識

- **Promise**: まだ結果が決まっていない値を表す箱です。後から成功（値）か失敗（エラー）が決まります。
- **保留（pending）**: Promise がまだ結果を持っていない状態です。
- **`pipe(to:)`**: ある Promise の結果を、別の Promise の結果として流し込むメソッドです。
- **`do`/`catch`**: 処理が投げた例外を受け止めて、ほかの処理に変える仕組みです。

## 何をしているか

### 1. 保留状態の Promise を作る

最初に、結果がまだ決まっていない `rp` を作ります。この `rp` を、連鎖の戻り値にします。

```swift:line-numbers=28
        let rp = Promise<U.T>(.pending)
```
### 2. 最初の処理の結果を、`rp` に流し込む

`body()` は、最初の処理を行う関数です。その結果を `pipe(to:)` で `rp` に渡し、`rp` を返します。成功でも失敗でも、結果は `rp` の状態になります。

```swift:line-numbers=29
        try body().pipe(to: rp.box.seal)
        return rp
```
### 3. 例外が出たら、失敗の Promise を返す

最初の処理が例外を投げたら、そのエラーを持った Promise を作って返します。後続の `then` は、失敗として扱われます。

```swift:line-numbers=31
    } catch {
        return Promise(error: error)
    }
```
## ここがすごい

- **最初の処理も同じ形で読める**: `firstly { ... }.then { ... }` と書けるので、連鎖の先頭だけ特別な書き方になりません。
- **例外を Promise の失敗に変える**: 同期的に投げられたエラーも、非同期の失敗と同じ経路で後続に伝わります。
- **すぐに戻る**: 最初の処理は関数の中で実行されますが、結果は `Promise` として即座に返ります。そのため、連鎖を組み立てるのが簡単です。

## まとめ

- 連鎖の先頭を、保留状態の `Promise` として作る。
- 最初の処理の結果を、その `Promise` に流し込む。
- 例外は失敗として包み、後続の処理に同じ経路で伝える。
