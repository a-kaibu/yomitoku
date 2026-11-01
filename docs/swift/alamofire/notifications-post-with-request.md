---
title: "Request を添えて、通知を 1 行で送る"
description: "Alamofire の postNotification(named:with:) が、Request を入れた通知を作って送る処理。名前と Request を受け取り、通知の形へ包んでから送信する。"
language: swift
project: "Alamofire"
repo: https://github.com/Alamofire/Alamofire
license: MIT
copyright: "Copyright (c) 2014-2018 Alamofire Software Foundation (http://alamofire.org/)"
commit: "6c2892ea5adb5a03fa81c510933dd782c5ddd9cb"
file: Source/Core/Notifications.swift
lines: [71, 74]
function: "postNotification(named:with:)"
difficulty: 1
tags: [API設計, 設計パターン]
format: 2
---
## ひとことで

通信のたびに、「どの通信が、どの名前で何をしたか」を外へ知らせたいことがあります。この関数は、名前と `Request` を受け取り、通知の形にまとめて送ります。呼ぶ側は、通知の作り方を知らなくて済みます。

## コード

```swift:line-numbers=71
    func postNotification(named name: Notification.Name, with request: Request) {
        let notification = Notification(name: name, request: request)
        post(notification)
    }
```

## 前提知識

- **`Notification`**: 名前と、付随する情報（ユーザー情報）を持つ通知の値です。
- **`Notification.Name`**: 通知の名前を表す型です。文字列の代わりに、型安全な名前を使います。
- **`post(_:)`**: 通知センターに、通知を送る操作です。登録された受け取り手に届きます。
- **便利メソッド**: 複雑な作成手順を、呼びやすい 1 つの関数にまとめたものです。

## 何をしているか

### 1. Request を入れた通知を作る

名前と `Request` から、`Notification` の値を作ります。`Request` を通知に入れておけば、受け取る側は、どの通信の通知かが分かります。

```swift:line-numbers=72
        let notification = Notification(name: name, request: request)
```
### 2. 通知センターに送る

作った通知を `post` で送ります。これで、登録済みの受け取り手に、通知が届きます。

```swift:line-numbers=73
        post(notification)
```
## ここがすごい

- **呼ぶ側がシンプル**: 通知の作り方を、この関数の中に閉じ込めています。
- **Request で文脈を渡す**: 名前だけでなく、どの通信かを一緒に送れます。
- **拡張で追加**: 既存の型を変えず、拡張の形で機能を足しています。

## まとめ

- 名前と `Request` を受け取る。
- 通知に `Request` を入れて作る。
- 通知センターに送って、受け取り手へ知らせる。
